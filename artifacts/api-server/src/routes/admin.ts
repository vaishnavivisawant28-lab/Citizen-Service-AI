import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, citizens, updateRequests, auditLogs } from "@workspace/db";
import { AdminApproveRequestBody, AdminRejectRequestBody, AdminListRequestsQueryParams, AdminListCitizensQueryParams, ListAuditLogsQueryParams } from "@workspace/api-zod";
import { eq, ilike, or, desc, count, sql } from "drizzle-orm";

const router = Router();

async function requireAdmin(req: any, res: any): Promise<{ adminId: string; citizen: typeof citizens.$inferSelect } | null> {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return null; }

  const [citizen] = await db.select().from(citizens).where(eq(citizens.clerkUserId, userId));
  if (!citizen || citizen.role !== "admin") {
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return null;
  }
  return { adminId: userId, citizen };
}

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

router.get("/admin/requests", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const params = AdminListRequestsQueryParams.safeParse(req.query);
  const status = params.success ? params.data.status : undefined;
  const search = params.success ? params.data.search : undefined;
  const page = (params.success ? params.data.page : undefined) ?? 1;
  const limit = (params.success ? params.data.limit : undefined) ?? 20;
  const offset = (page - 1) * limit;

  const allRequests = await db.select({
    request: updateRequests,
    citizenName: citizens.fullName,
  }).from(updateRequests)
    .leftJoin(citizens, eq(updateRequests.userId, citizens.id));

  let filtered = allRequests;
  if (status) {
    filtered = filtered.filter(r => r.request.status === status);
  }
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(r =>
      r.citizenName?.toLowerCase().includes(s) ||
      r.request.fieldName.toLowerCase().includes(s) ||
      r.request.newValue.toLowerCase().includes(s)
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  res.json({
    requests: paginated.map(r => serializeRequest(r.request, r.citizenName)),
    total,
    page,
    limit,
  });
});

router.post("/admin/requests/:id/approve", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const id = parseInt(req.params.id);
  const parsed = AdminApproveRequestBody.safeParse(req.body);
  const adminNote = parsed.success ? parsed.data.adminNote : null;

  const [reqRow] = await db.select().from(updateRequests).where(eq(updateRequests.id, id));
  if (!reqRow) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db.update(updateRequests)
    .set({ status: "approved", adminNote: adminNote ?? null })
    .where(eq(updateRequests.id, id))
    .returning();

  // Apply the change to the citizen's profile
  const fieldMap: Record<string, string> = {
    mobile_number: "mobileNumber",
    email: "email",
    address: "address",
  };
  const dbField = fieldMap[reqRow.fieldName];
  if (dbField) {
    await db.update(citizens).set({ [dbField]: reqRow.newValue }).where(eq(citizens.id, reqRow.userId));
  }

  await db.insert(auditLogs).values({
    action: "request_approved",
    userId: reqRow.userId,
    adminId: admin.adminId,
    targetField: reqRow.fieldName,
    oldValue: reqRow.oldValue ?? null,
    newValue: reqRow.newValue,
    details: adminNote ?? "Request approved by admin",
  });

  const [citizen] = await db.select().from(citizens).where(eq(citizens.id, reqRow.userId));
  res.json(serializeRequest(updated, citizen?.fullName));
});

router.post("/admin/requests/:id/reject", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const id = parseInt(req.params.id);
  const parsed = AdminRejectRequestBody.safeParse(req.body);
  const adminNote = parsed.success ? parsed.data.adminNote : null;

  const [reqRow] = await db.select().from(updateRequests).where(eq(updateRequests.id, id));
  if (!reqRow) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db.update(updateRequests)
    .set({ status: "rejected", adminNote: adminNote ?? null })
    .where(eq(updateRequests.id, id))
    .returning();

  await db.insert(auditLogs).values({
    action: "request_rejected",
    userId: reqRow.userId,
    adminId: admin.adminId,
    targetField: reqRow.fieldName,
    details: adminNote ?? "Request rejected by admin",
  });

  const [citizen] = await db.select().from(citizens).where(eq(citizens.id, reqRow.userId));
  res.json(serializeRequest(updated, citizen?.fullName));
});

router.get("/admin/citizens", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const params = AdminListCitizensQueryParams.safeParse(req.query);
  const search = params.success ? params.data.search : undefined;
  const page = (params.success ? params.data.page : undefined) ?? 1;
  const limit = (params.success ? params.data.limit : undefined) ?? 20;
  const offset = (page - 1) * limit;

  const allCitizens = await db.select().from(citizens);
  let filtered = allCitizens;
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.fullName.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.aadhaarNumber.includes(s)
    );
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  res.json({
    citizens: paginated.map(c => ({
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
    })),
    total,
    page,
    limit,
  });
});

router.get("/admin/stats", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const allCitizens = await db.select().from(citizens);
  const allRequests = await db.select({
    request: updateRequests,
    citizenName: citizens.fullName,
  }).from(updateRequests).leftJoin(citizens, eq(updateRequests.userId, citizens.id));

  const pending = allRequests.filter(r => r.request.status === "pending").length;
  const approved = allRequests.filter(r => r.request.status === "approved").length;
  const rejected = allRequests.filter(r => r.request.status === "rejected").length;
  const recent = allRequests.slice(-10).reverse();

  res.json({
    totalCitizens: allCitizens.length,
    pendingRequests: pending,
    approvedRequests: approved,
    rejectedRequests: rejected,
    totalRequests: allRequests.length,
    recentActivity: recent.map(r => ({
      id: r.request.id,
      userId: r.request.userId,
      citizenName: r.citizenName ?? null,
      fieldName: r.request.fieldName,
      oldValue: r.request.oldValue ?? null,
      newValue: r.request.newValue,
      status: r.request.status,
      adminNote: r.request.adminNote ?? null,
      createdAt: r.request.createdAt.toISOString(),
      updatedAt: r.request.updatedAt.toISOString(),
    })),
  });
});

router.get("/audit-logs", async (req, res): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const params = ListAuditLogsQueryParams.safeParse(req.query);
  const page = (params.success ? params.data.page : undefined) ?? 1;
  const limit = (params.success ? params.data.limit : undefined) ?? 20;
  const offset = (page - 1) * limit;

  const allLogs = await db.select().from(auditLogs);
  const total = allLogs.length;
  const paginated = allLogs.slice(offset, offset + limit);

  res.json({
    logs: paginated.map(l => ({
      id: l.id,
      action: l.action,
      userId: l.userId ?? null,
      adminId: l.adminId ?? null,
      targetField: l.targetField ?? null,
      oldValue: l.oldValue ?? null,
      newValue: l.newValue ?? null,
      details: l.details ?? null,
      createdAt: l.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
  });
});

export default router;
