import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  branchesTable,
  ptsTable,
  complaintsTable,
  activityLogsTable,
  activityTypesTable,
  kpiScoresTable,
  usersTable,
} from "@workspace/db/schema";
import { eq, and, gte, inArray, sql, desc } from "drizzle-orm";
import { authMiddleware, requireRole, getPtScope } from "../middlewares/auth";

const router: IRouter = Router();

const CHIEF_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "Admin System", "Superadmin"];

router.get("/branches/analytics", authMiddleware, requireRole(...CHIEF_AND_ABOVE), async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ptScope = getPtScope(req);

    const branches = await db
      .select({
        id: branchesTable.id,
        name: branchesTable.name,
        city: branchesTable.city,
        ptId: branchesTable.ptId,
        activeStatus: branchesTable.activeStatus,
      })
      .from(branchesTable)
      .where(ptScope !== null
        ? and(eq(branchesTable.activeStatus, true), eq(branchesTable.ptId, ptScope))
        : eq(branchesTable.activeStatus, true))
      .orderBy(branchesTable.name);

    if (branches.length === 0) {
      res.json([]);
      return;
    }

    const branchIds = branches.map(b => b.id);
    const ptIds = [...new Set(branches.map(b => b.ptId))];

    const pts = await db
      .select({ id: ptsTable.id, name: ptsTable.name })
      .from(ptsTable)
      .where(inArray(ptsTable.id, ptIds));
    const ptMap = new Map(pts.map(p => [p.id, p.name]));

    const complaintCounts = await db
      .select({
        branchId: complaintsTable.branchId,
        status: complaintsTable.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(complaintsTable)
      .where(inArray(complaintsTable.branchId, branchIds))
      .groupBy(complaintsTable.branchId, complaintsTable.status);

    const errorTypeIds = await db
      .select({ id: activityTypesTable.id })
      .from(activityTypesTable)
      .where(eq(activityTypesTable.category, "Error"));
    const errorTypeIdList = errorTypeIds.map(e => e.id);

    const errorActivityCounts = errorTypeIdList.length > 0
      ? await db
          .select({
            branchId: activityLogsTable.branchId,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(activityLogsTable)
          .where(
            and(
              inArray(activityLogsTable.branchId, branchIds),
              inArray(activityLogsTable.activityTypeId, errorTypeIdList),
              gte(activityLogsTable.createdAt, thirtyDaysAgo),
            )
          )
          .groupBy(activityLogsTable.branchId)
      : [];

    const kpiAvgByBranch = await db
      .select({
        branchId: usersTable.branchId,
        avgKpi: sql<number>`AVG(${kpiScoresTable.currentMonthlyScore})::float`,
      })
      .from(kpiScoresTable)
      .innerJoin(usersTable, eq(kpiScoresTable.userId, usersTable.id))
      .where(inArray(usersTable.branchId, branchIds))
      .groupBy(usersTable.branchId);

    const lastActivityByBranch = await db
      .select({
        branchId: activityLogsTable.branchId,
        lastActivity: sql<string>`MAX(${activityLogsTable.createdAt})`,
      })
      .from(activityLogsTable)
      .where(inArray(activityLogsTable.branchId, branchIds))
      .groupBy(activityLogsTable.branchId);

    const complaintMap = new Map<number, Record<string, number>>();
    for (const row of complaintCounts) {
      if (row.branchId == null) continue;
      if (!complaintMap.has(row.branchId)) complaintMap.set(row.branchId, {});
      complaintMap.get(row.branchId)![row.status] = row.count;
    }

    const errorMap = new Map(errorActivityCounts.map(r => [r.branchId, r.count]));
    const kpiMap = new Map(kpiAvgByBranch.map(r => [r.branchId, r.avgKpi]));
    const lastActivityMap = new Map(lastActivityByBranch.map(r => [r.branchId, r.lastActivity]));

    const COMPLAINT_THRESHOLD = 3;
    const INACTIVITY_THRESHOLD_HOURS = 48;

    const result = branches.map(branch => {
      const statusCounts = complaintMap.get(branch.id) ?? {};
      const activeComplaints = (statusCounts["open"] ?? 0) + (statusCounts["in_progress"] ?? 0);
      const errorCount = errorMap.get(branch.id) ?? 0;
      const avgKpi = kpiMap.get(branch.id) ?? null;
      const lastActivityAt = lastActivityMap.get(branch.id) ?? null;

      const hoursInactive = lastActivityAt
        ? (Date.now() - new Date(lastActivityAt).getTime()) / 3600000
        : Infinity;

      const needsAttention =
        activeComplaints >= COMPLAINT_THRESHOLD || hoursInactive > INACTIVITY_THRESHOLD_HOURS;

      return {
        branchId: branch.id,
        branchName: branch.name,
        city: branch.city ?? null,
        ptId: branch.ptId,
        ptName: ptMap.get(branch.ptId) ?? null,
        activeComplaints,
        complaintsByStatus: statusCounts,
        errorActivityCount30d: errorCount,
        avgKpiScore: avgKpi !== null ? Math.round(avgKpi) : null,
        lastActivityAt,
        hoursInactive: lastActivityAt ? Math.round(hoursInactive * 10) / 10 : null,
        needsAttention,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Branch analytics error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
