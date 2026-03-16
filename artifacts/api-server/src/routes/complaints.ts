import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { complaintsTable, usersTable, ptsTable, branchesTable } from "@workspace/db/schema";
import { eq, and, desc, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { createAuditLog, createNotification } from "../helpers/audit";

const router: IRouter = Router();

const ALL_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"];
const CREATE_ROLES = ["Owner", "Chief Dealing", "SPV Dealing", "Admin System"];

async function enrichComplaint(complaint: typeof complaintsTable.$inferSelect) {
  const assignedUser = complaint.assignedUserId
    ? (await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, complaint.assignedUserId)).limit(1))[0] : null;
  const creator = complaint.createdBy
    ? (await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, complaint.createdBy)).limit(1))[0] : null;
  const pt = complaint.ptId
    ? (await db.select().from(ptsTable).where(eq(ptsTable.id, complaint.ptId)).limit(1))[0] : null;
  const branch = complaint.branchId
    ? (await db.select().from(branchesTable).where(eq(branchesTable.id, complaint.branchId)).limit(1))[0] : null;

  const elapsedMs = Date.now() - complaint.createdAt.getTime();
  const elapsedHours = elapsedMs / 3600000;
  let slaStatus: "normal" | "warning" | "critical" = "normal";
  if (complaint.status !== "closed" && complaint.status !== "resolved") {
    if (elapsedHours > 72) slaStatus = "critical";
    else if (elapsedHours > 24) slaStatus = "warning";
  }

  return {
    ...complaint,
    assignedUserName: assignedUser?.name ?? null,
    creatorName: creator?.name ?? null,
    ptName: pt?.name ?? null,
    branchName: branch?.name ?? null,
    slaStatus,
    elapsedHours: Math.round(elapsedHours * 10) / 10,
  };
}

router.get("/complaints", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const conditions: SQL[] = [];
    if (req.query.status) conditions.push(eq(complaintsTable.status, req.query.status as string));
    if (req.query.severity) conditions.push(eq(complaintsTable.severity, req.query.severity as string));
    if (req.query.ptId) conditions.push(eq(complaintsTable.ptId, Number(req.query.ptId)));
    if (req.query.assignedUserId) conditions.push(eq(complaintsTable.assignedUserId, Number(req.query.assignedUserId)));

    const complaints = await db.select().from(complaintsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(complaintsTable.createdAt))
      .limit(Number(req.query.limit) || 100);

    const enriched = await Promise.all(complaints.map(enrichComplaint));
    res.json(enriched);
  } catch (error) {
    console.error("List complaints error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/complaints/:id", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, Number(req.params.id))).limit(1);
    if (!complaint) { res.status(404).json({ error: "Complaint not found" }); return; }
    res.json(await enrichComplaint(complaint));
  } catch (error) {
    console.error("Get complaint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/complaints", authMiddleware, requireRole(...CREATE_ROLES), async (req, res) => {
  try {
    const { title, complaintType, ptId, branchId, assignedUserId, severity, chronology, followUp } = req.body;
    if (!title || !complaintType) {
      res.status(400).json({ error: "title and complaintType are required" }); return;
    }
    const [complaint] = await db.insert(complaintsTable).values({
      title,
      complaintType,
      ptId: ptId ?? req.user!.ptId,
      branchId: branchId ?? null,
      assignedUserId: assignedUserId ?? null,
      severity: severity ?? "medium",
      chronology: chronology ?? null,
      followUp: followUp ?? null,
      createdBy: req.user!.userId,
    }).returning();

    if (assignedUserId) {
      await createNotification({
        userId: assignedUserId,
        type: "complaint_assigned",
        title: `Complaint assigned: ${title}`,
        content: chronology ?? undefined,
      });
    }

    await createAuditLog({ userId: req.user!.userId, actionType: "create", module: "complaint", entityId: String(complaint.id) });
    res.status(201).json(await enrichComplaint(complaint));
  } catch (error) {
    console.error("Create complaint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/complaints/:id", authMiddleware, requireRole(...CREATE_ROLES), async (req, res) => {
  try {
    const [existing] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, Number(req.params.id))).limit(1);
    if (!existing) { res.status(404).json({ error: "Complaint not found" }); return; }

    const VALID_STATUSES = ["open", "in_progress", "escalated", "resolved", "closed"];
    const VALID_TRANSITIONS: Record<string, string[]> = {
      open: ["in_progress", "escalated"],
      in_progress: ["escalated", "resolved"],
      escalated: ["in_progress", "resolved"],
      resolved: ["closed", "open"],
      closed: [],
    };

    const updateData: Partial<typeof complaintsTable.$inferInsert> = {};
    if (req.body.status !== undefined) {
      if (!VALID_STATUSES.includes(req.body.status)) {
        res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }); return;
      }
      const allowed = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(req.body.status)) {
        res.status(400).json({ error: `Cannot transition from '${existing.status}' to '${req.body.status}'. Allowed: ${allowed.join(", ") || "none"}` }); return;
      }
      updateData.status = req.body.status;
    }
    if (req.body.severity !== undefined) updateData.severity = req.body.severity;
    if (req.body.followUp !== undefined) updateData.followUp = req.body.followUp;
    if (req.body.assignedUserId !== undefined) updateData.assignedUserId = req.body.assignedUserId;
    if (req.body.chronology !== undefined) updateData.chronology = req.body.chronology;

    if (req.body.assignedUserId && req.body.assignedUserId !== existing.assignedUserId) {
      await createNotification({
        userId: req.body.assignedUserId,
        type: "complaint_assigned",
        title: `Complaint assigned: ${existing.title}`,
      });
    }

    const [updated] = await db.update(complaintsTable).set(updateData)
      .where(eq(complaintsTable.id, Number(req.params.id))).returning();
    await createAuditLog({
      userId: req.user!.userId,
      actionType: "update",
      module: "complaint",
      entityId: String(updated.id),
      newValue: JSON.stringify({ status: updated.status, severity: updated.severity }),
    });
    res.json(await enrichComplaint(updated));
  } catch (error) {
    console.error("Update complaint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/complaints/:id", authMiddleware, requireRole(...CREATE_ROLES), async (req, res) => {
  try {
    const [existing] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, Number(req.params.id))).limit(1);
    if (!existing) { res.status(404).json({ error: "Complaint not found" }); return; }
    const [updated] = await db.update(complaintsTable).set({ status: "closed" })
      .where(eq(complaintsTable.id, Number(req.params.id))).returning();
    await createAuditLog({ userId: req.user!.userId, actionType: "close", module: "complaint", entityId: String(updated.id) });
    res.json({ message: "Complaint closed" });
  } catch (error) {
    console.error("Delete complaint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
