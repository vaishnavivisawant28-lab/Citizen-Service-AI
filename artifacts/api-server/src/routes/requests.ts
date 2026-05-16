import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, citizens, updateRequests, auditLogs } from "@workspace/db";
import { CreateRequestBody } from "@workspace/api-zod";
import { eq, and } from "drizzle-orm";

const router = Router();

function serializeRequest(r: typeof updateRequests.$inferSelect, citizenName?: string | null) {
  return {
    id: r.id,
    userId: r.userId,
    citizenName: citizenName ?? null,
    fieldName: r.fieldName,
    oldValue: r.oldValue ?? null,
    newValue: r.newValue,
    status: r.status,
    adminNote: r.adminNote ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/requests", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [citizen] = await db.select().from(citizens).where(eq(citizens.clerkUserId, userId));
  if (!citizen) { res.json([]); return; }

  const reqs = await db.select().from(updateRequests).where(eq(updateRequests.userId, citizen.id));
  res.json(reqs.map(r => serializeRequest(r, citizen.fullName)));
});

router.post("/requests", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateRequestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [citizen] = await db.select().from(citizens).where(eq(citizens.clerkUserId, userId));
  if (!citizen) { res.status(404).json({ error: "Profile not found" }); return; }

  const { fieldName, newValue } = parsed.data;
  const oldValue = fieldName === "mobile_number" ? citizen.mobileNumber :
                   fieldName === "email" ? citizen.email :
                   citizen.address;

  const [created] = await db.insert(updateRequests).values({
    userId: citizen.id,
    fieldName,
    oldValue: oldValue ?? null,
    newValue,
    status: "pending",
  }).returning();

  await db.insert(auditLogs).values({
    action: "request_created",
    userId: citizen.id,
    targetField: fieldName,
    oldValue: oldValue ?? null,
    newValue,
    details: `Citizen submitted update request for ${fieldName}`,
  });

  res.status(201).json(serializeRequest(created, citizen.fullName));
});

router.get("/requests/:id", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [citizen] = await db.select().from(citizens).where(eq(citizens.clerkUserId, userId));
  if (!citizen) { res.status(404).json({ error: "Not found" }); return; }

  const [reqRow] = await db.select().from(updateRequests).where(
    and(eq(updateRequests.id, id), eq(updateRequests.userId, citizen.id))
  );
  if (!reqRow) { res.status(404).json({ error: "Not found" }); return; }

  res.json(serializeRequest(reqRow, citizen.fullName));
});

router.post("/requests/:id/cancel", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseInt(req.params.id);
  const [citizen] = await db.select().from(citizens).where(eq(citizens.clerkUserId, userId));
  if (!citizen) { res.status(404).json({ error: "Not found" }); return; }

  const [reqRow] = await db.select().from(updateRequests).where(
    and(eq(updateRequests.id, id), eq(updateRequests.userId, citizen.id))
  );
  if (!reqRow) { res.status(404).json({ error: "Not found" }); return; }
  if (reqRow.status !== "pending") { res.status(400).json({ error: "Only pending requests can be cancelled" }); return; }

  const [updated] = await db.update(updateRequests)
    .set({ status: "cancelled" })
    .where(eq(updateRequests.id, id))
    .returning();

  await db.insert(auditLogs).values({
    action: "request_cancelled",
    userId: citizen.id,
    targetField: reqRow.fieldName,
    details: `Citizen cancelled update request for ${reqRow.fieldName}`,
  });

  res.json(serializeRequest(updated, citizen.fullName));
});

export default router;
