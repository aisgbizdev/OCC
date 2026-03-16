import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { kpiScoresTable, kpiSnapshotsTable, usersTable, activityLogsTable } from "@workspace/db/schema";
import { eq, and, desc, sql, gte, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

const MGMT_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Admin System"];
const ALL_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"];

router.get("/kpi/scores", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const conditions: SQL[] = [];
    if (req.query.userId) conditions.push(eq(kpiScoresTable.userId, Number(req.query.userId)));
    if (req.query.ptId) conditions.push(eq(usersTable.ptId, Number(req.query.ptId)));
    if (req.user!.roleName === "Dealer") {
      conditions.push(eq(kpiScoresTable.userId, req.user!.userId));
    }

    const scores = await db.select({
      userId: kpiScoresTable.userId,
      userName: usersTable.name,
      ptId: usersTable.ptId,
      currentDailyScore: kpiScoresTable.currentDailyScore,
      currentWeeklyScore: kpiScoresTable.currentWeeklyScore,
      currentMonthlyScore: kpiScoresTable.currentMonthlyScore,
      currentQuarterlyScore: kpiScoresTable.currentQuarterlyScore,
      currentYearlyScore: kpiScoresTable.currentYearlyScore,
      currentRank: kpiScoresTable.currentRank,
      updatedAt: kpiScoresTable.updatedAt,
    }).from(kpiScoresTable)
      .innerJoin(usersTable, eq(kpiScoresTable.userId, usersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(kpiScoresTable.currentDailyScore));

    res.json(scores);
  } catch (error) {
    console.error("List KPI scores error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/kpi/leaderboard", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const period = (req.query.period as string) || "daily";
    const orderCol = period === "weekly" ? kpiScoresTable.currentWeeklyScore
      : period === "monthly" ? kpiScoresTable.currentMonthlyScore
      : period === "quarterly" ? kpiScoresTable.currentQuarterlyScore
      : period === "yearly" ? kpiScoresTable.currentYearlyScore
      : kpiScoresTable.currentDailyScore;

    const conditions: SQL[] = [];
    if (req.query.ptId) {
      conditions.push(eq(usersTable.ptId, Number(req.query.ptId)));
    }

    const leaderboard = await db.select({
      userId: kpiScoresTable.userId,
      userName: usersTable.name,
      ptId: usersTable.ptId,
      score: orderCol,
      rank: sql<number>`ROW_NUMBER() OVER (ORDER BY ${orderCol} DESC)`,
    }).from(kpiScoresTable)
      .innerJoin(usersTable, eq(kpiScoresTable.userId, usersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orderCol))
      .limit(Number(req.query.limit) || 50);

    res.json(leaderboard);
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/kpi/snapshots", authMiddleware, requireRole(...MGMT_ROLES), async (req, res) => {
  try {
    const conditions: SQL[] = [];
    if (req.query.userId) conditions.push(eq(kpiSnapshotsTable.userId, Number(req.query.userId)));
    if (req.query.periodType) conditions.push(eq(kpiSnapshotsTable.periodType, req.query.periodType as string));
    if (req.query.periodKey) conditions.push(eq(kpiSnapshotsTable.periodKey, req.query.periodKey as string));

    const snapshots = await db.select().from(kpiSnapshotsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(kpiSnapshotsTable.generatedAt))
      .limit(Number(req.query.limit) || 100);

    res.json(snapshots);
  } catch (error) {
    console.error("List KPI snapshots error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/kpi/user/:userId", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const targetUserId = Number(req.params.userId);
    if (req.user!.roleName === "Dealer" && req.user!.userId !== targetUserId) {
      res.status(403).json({ error: "Cannot view another user's KPI" }); return;
    }

    const [score] = await db.select().from(kpiScoresTable)
      .where(eq(kpiScoresTable.userId, targetUserId)).limit(1);

    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const recentLogs = await db.select({
      activityTypeId: activityLogsTable.activityTypeId,
      totalQuantity: sql<number>`SUM(${activityLogsTable.quantity})`,
      totalPoints: sql<string>`SUM(${activityLogsTable.points})`,
    }).from(activityLogsTable)
      .where(and(eq(activityLogsTable.userId, targetUserId), gte(activityLogsTable.createdAt, dayStart)))
      .groupBy(activityLogsTable.activityTypeId);

    res.json({
      score: score ?? null,
      todayBreakdown: recentLogs,
    });
  } catch (error) {
    console.error("Get user KPI error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/kpi/snapshots/generate", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const { periodType, periodKey } = req.body;
    if (!periodType || !periodKey) {
      res.status(400).json({ error: "periodType and periodKey are required" }); return;
    }

    const existingSnapshots = await db.select({ userId: kpiSnapshotsTable.userId })
      .from(kpiSnapshotsTable)
      .where(and(
        eq(kpiSnapshotsTable.periodType, periodType),
        eq(kpiSnapshotsTable.periodKey, periodKey),
      ));
    if (existingSnapshots.length > 0) {
      res.status(409).json({ error: `Snapshots already exist for ${periodType}:${periodKey}. Delete them first to regenerate.` }); return;
    }

    const scores = await db.select().from(kpiScoresTable);
    const snapshots = scores.map((s) => ({
      userId: s.userId,
      periodType,
      periodKey,
      totalPoints: periodType === "daily" ? s.currentDailyScore
        : periodType === "weekly" ? s.currentWeeklyScore
        : periodType === "monthly" ? s.currentMonthlyScore
        : periodType === "quarterly" ? s.currentQuarterlyScore
        : s.currentYearlyScore,
      activityPoints: periodType === "daily" ? s.currentDailyScore
        : periodType === "weekly" ? s.currentWeeklyScore
        : periodType === "monthly" ? s.currentMonthlyScore
        : periodType === "quarterly" ? s.currentQuarterlyScore
        : s.currentYearlyScore,
      taskPoints: "0",
      complaintPenalty: "0",
      errorPenalty: "0",
      bonusPoints: "0",
    }));

    if (snapshots.length > 0) {
      await db.insert(kpiSnapshotsTable).values(snapshots);
    }

    res.status(201).json({ message: `Generated ${snapshots.length} snapshots for ${periodType}:${periodKey}` });
  } catch (error) {
    console.error("Generate KPI snapshots error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
