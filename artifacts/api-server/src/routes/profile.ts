import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, citizens, updateRequests } from "@workspace/db";
import { SyncMyProfileBody } from "@workspace/api-zod";
import { eq, desc } from "drizzle-orm";

const router = Router();

function generateAadhaar(): string {
  const num = Math.floor(Math.random() * 900000000000) + 100000000000;
  return num.toString();
}

function serializeCitizen(c: typeof citizens.$inferSelect) {
  return {
    id: c.id,
    clerkUserId: c.clerkUserId,
    fullName: c.fullName,
    aadhaarNumber: c.aadhaarNumber,
    mobileNumber: c.mobileNumber ?? null,
    email: c.email ?? null,
    address: c.address ?? null,
    role: c.role,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

router.get("/profile/me", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [citizen] = await db.select().from(citizens).where(eq(citizens.clerkUserId, userId));
  if (!citizen) {
    res.status(404).json({ error: "Profile not found. Please sync your profile first." });
    return;
  }
  res.json(serializeCitizen(citizen));
});

router.post("/profile/me/sync", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = SyncMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { fullName, email } = parsed.data;
  const [existing] = await db.select().from(citizens).where(eq(citizens.clerkUserId, userId));

  if (existing) {
    const [updated] = await db
      .update(citizens)
      .set({ fullName, email: email ?? existing.email })
      .where(eq(citizens.clerkUserId, userId))
      .returning();
    res.json(serializeCitizen(updated));
    return;
  }

  const aadhaarNumber = generateAadhaar();
  const [created] = await db
    .insert(citizens)
    .values({ clerkUserId: userId, fullName, aadhaarNumber, email: email ?? null })
    .returning();
  res.json(serializeCitizen(created));
});

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [citizen] = await db.select().from(citizens).where(eq(citizens.clerkUserId, userId));
  if (!citizen) {
    res.json({ totalRequests: 0, pendingRequests: 0, approvedRequests: 0, rejectedRequests: 0, recentRequests: [] });
    return;
  }

  const allRequests = await db
    .select()
    .from(updateRequests)
    .where(eq(updateRequests.userId, citizen.id))
    .orderBy(desc(updateRequests.createdAt));

  const pending = allRequests.filter(r => r.status === "pending").length;
  const approved = allRequests.filter(r => r.status === "approved").length;
  const rejected = allRequests.filter(r => r.status === "rejected").length;

  res.json({
    totalRequests: allRequests.length,
    pendingRequests: pending,
    approvedRequests: approved,
    rejectedRequests: rejected,
    recentRequests: allRequests.slice(0, 5).map(r => ({
      id: r.id,
      userId: r.userId,
      citizenName: citizen.fullName,
      fieldName: r.fieldName,
      oldValue: r.oldValue ?? null,
      newValue: r.newValue,
      status: r.status,
      adminNote: r.adminNote ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
});

export default router;
