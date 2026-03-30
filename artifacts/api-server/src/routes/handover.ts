import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { handoverLogsTable, usersTable, ptsTable, branchesTable, shiftsTable } from "@workspace/db/schema";
import { eq, and, desc, type SQL } from "drizzle-orm";
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
    const { ptId, branchId, fromShiftId, toShiftId, summary, pendingActivities, pendingTasks, pendingComplaints, notes } = req.body;
    if (!fromShiftId || !toShiftId) {
      res.status(400).json({ error: "fromShiftId and toShiftId are required" }); return;
    }
    const [log] = await db.insert(handoverLogsTable).values({
      ptId: ptId ?? req.user!.ptId,
      branchId: branchId ?? null,
      fromShiftId,
      toShiftId,
      createdBy: req.user!.userId,
      summary: summary ?? null,
      pendingActivities: pendingActivities ?? null,
      pendingTasks: pendingTasks ?? null,
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

export default router;
