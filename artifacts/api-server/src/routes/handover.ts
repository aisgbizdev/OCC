import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { handoverLogsTable, usersTable, ptsTable, branchesTable, shiftsTable, tasksTable } from "@workspace/db/schema";
import { eq, and, desc, inArray, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole, getPtScope } from "../middlewares/auth";
import { createAuditLog } from "../helpers/audit";

const router: IRouter = Router();

const ALL_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"];
const CREATE_ROLES = ["Owner", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"];

async function enrichHandover(log: typeof handoverLogsTable.$inferSelect) {
  const creator = log.createdBy
    ? (await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, log.createdBy)).limit(1))[0] : null;
  const pt = log.ptId
    ? (await db.select().from(ptsTable).where(eq(ptsTable.id, log.ptId)).limit(1))[0] : null;
  const branch = log.branchId
    ? (await db.select().from(branchesTable).where(eq(branchesTable.id, log.branchId)).limit(1))[0] : null;
  const fromShift = log.fromShiftId
    ? (await db.select().from(shiftsTable).where(eq(shiftsTable.id, log.fromShiftId)).limit(1))[0] : null;
  const toShift = log.toShiftId
    ? (await db.select().from(shiftsTable).where(eq(shiftsTable.id, log.toShiftId)).limit(1))[0] : null;

  return {
    ...log,
    creatorName: creator?.name ?? null,
    ptName: pt?.name ?? null,
    branchName: branch?.name ?? null,
    fromShiftName: fromShift?.name ?? null,
    toShiftName: toShift?.name ?? null,
  };
}

router.get("/handover-logs", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const conditions: SQL[] = [];
    const ptScope = getPtScope(req);
    if (ptScope !== null) {
      conditions.push(eq(handoverLogsTable.ptId, ptScope));
    } else if (req.query.ptId) {
      conditions.push(eq(handoverLogsTable.ptId, Number(req.query.ptId)));
    }
    if (req.query.fromShiftId) conditions.push(eq(handoverLogsTable.fromShiftId, Number(req.query.fromShiftId)));
    if (req.query.toShiftId) conditions.push(eq(handoverLogsTable.toShiftId, Number(req.query.toShiftId)));

    const logs = await db.select().from(handoverLogsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(handoverLogsTable.createdAt))
      .limit(Number(req.query.limit) || 50);

    const enriched = await Promise.all(logs.map(enrichHandover));
    res.json(enriched);
  } catch (error) {
    console.error("List handover logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/handover-logs/:id", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const [log] = await db.select().from(handoverLogsTable)
      .where(eq(handoverLogsTable.id, Number(req.params.id))).limit(1);
    if (!log) { res.status(404).json({ error: "Handover log not found" }); return; }
    res.json(await enrichHandover(log));
  } catch (error) {
    console.error("Get handover log error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/handover-logs", authMiddleware, requireRole(...CREATE_ROLES), async (req, res) => {
  try {
    const { fromShiftId, toShiftId, pendingActivities, pendingComplaints, notes } = req.body;
    if (!fromShiftId || !toShiftId) {
      res.status(400).json({ error: "fromShiftId and toShiftId are required" }); return;
    }

    const userRecord = await db.select({ branchId: usersTable.branchId })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.userId))
      .limit(1);

    const userPtId: number | null = req.user!.ptId;
    const userBranchId: number | null = userRecord[0]?.branchId ?? null;

    const taskConditions: SQL[] = [eq(tasksTable.status, "in_progress")];
    if (userPtId !== null) taskConditions.push(eq(tasksTable.ptId, userPtId));
    if (userBranchId !== null) taskConditions.push(eq(tasksTable.branchId, userBranchId));

    const inProgressTasks = await db
      .select({ title: tasksTable.title, assignedTo: tasksTable.assignedTo })
      .from(tasksTable)
      .where(and(...taskConditions));

    const assigneeIds = inProgressTasks.map(t => t.assignedTo).filter((id): id is number => id !== null);
    const assigneeNames: Record<number, string> = {};
    if (assigneeIds.length > 0) {
      const assignees = await db.select({ id: usersTable.id, name: usersTable.name })
        .from(usersTable)
        .where(inArray(usersTable.id, assigneeIds));
      for (const a of assignees) assigneeNames[a.id] = a.name;
    }

    const serverPendingTasks = inProgressTasks.length > 0
      ? inProgressTasks.map(t => `• ${t.title} (${t.assignedTo ? (assigneeNames[t.assignedTo] ?? "-") : "-"})`).join("\n")
      : "None";

    const taskCount = inProgressTasks.length;
    const systemStatusNote = req.body.systemStatusNote ?? "All systems operational";
    const complaintCount = typeof req.body.complaintCount === "number" ? req.body.complaintCount : null;
    const serverSummary = complaintCount !== null
      ? `Checklist selesai. Sistem: ${systemStatusNote}. ${taskCount} tugas berjalan, ${complaintCount} komplain terbuka.`
      : `Checklist selesai. ${taskCount} tugas berjalan.`;

    const [log] = await db.insert(handoverLogsTable).values({
      ptId: userPtId,
      branchId: userBranchId,
      fromShiftId,
      toShiftId,
      createdBy: req.user!.userId,
      summary: serverSummary,
      pendingActivities: pendingActivities ?? null,
      pendingTasks: serverPendingTasks,
      pendingComplaints: pendingComplaints ?? null,
      notes: notes ?? null,
    }).returning();

    await createAuditLog({ userId: req.user!.userId, actionType: "create", module: "handover", entityId: String(log.id) });
    res.status(201).json(await enrichHandover(log));
  } catch (error) {
    console.error("Create handover log error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/handover-logs/:id", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const [existing] = await db.select().from(handoverLogsTable)
      .where(eq(handoverLogsTable.id, Number(req.params.id))).limit(1);
    if (!existing) { res.status(404).json({ error: "Handover log not found" }); return; }

    const isCreator = existing.createdBy === req.user!.userId;
    const isManager = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Admin System", "Superadmin"].includes(req.user!.roleName);
    if (!isCreator && !isManager) {
      res.status(403).json({ error: "Only creator or manager can update handover" }); return;
    }

    const updateData: Partial<typeof handoverLogsTable.$inferInsert> = {};
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    if (isManager && req.body.pendingTasks !== undefined) updateData.pendingTasks = req.body.pendingTasks;

    const [updated] = await db.update(handoverLogsTable).set(updateData)
      .where(eq(handoverLogsTable.id, Number(req.params.id))).returning();
    await createAuditLog({ userId: req.user!.userId, actionType: "update", module: "handover", entityId: String(updated.id) });
    res.json(await enrichHandover(updated));
  } catch (error) {
    console.error("Update handover log error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
