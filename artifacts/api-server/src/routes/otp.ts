import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, otpCodes } from "@workspace/db";
import { SendOtpBody, VerifyOtpBody } from "@workspace/api-zod";
import { and, eq, gt } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/otp/send", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { type, value } = parsed.data;
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(otpCodes).values({
    type,
    value,
    code,
    used: false,
    expiresAt,
  });

  req.log.info({ type, value: value.slice(0, 3) + "***" }, "OTP generated (demo mode — check logs)");
  req.log.info({ otp: code }, "OTP Code (demo — would be sent via SMS/email in production)");

  res.json({
    success: true,
    message: `OTP sent to ${type === "mobile" ? "mobile number" : "email address"} ending in ...${value.slice(-3)}. (Demo: OTP is ${code})`,
    expiresIn: 600,
  });
});

router.post("/otp/verify", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { type, value, code } = parsed.data;
  const now = new Date();

  const [otpRecord] = await db.select().from(otpCodes).where(
    and(
      eq(otpCodes.type, type),
      eq(otpCodes.value, value),
      eq(otpCodes.code, code),
      eq(otpCodes.used, false),
      gt(otpCodes.expiresAt, now),
    )
  ).limit(1);

  if (!otpRecord) {
    res.status(400).json({ error: "Invalid or expired OTP" });
    return;
  }

  const token = crypto.randomUUID();
  await db.update(otpCodes).set({ used: true, token }).where(eq(otpCodes.id, otpRecord.id));

  res.json({
    valid: true,
    token,
    message: "OTP verified successfully",
  });
});

export default router;
