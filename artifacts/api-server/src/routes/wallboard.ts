import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  usersTable, rolesTable, kpiScoresTable, ptsTable,
  activityLogsTable, complaintsTable, systemSettingsTable,
} from "@workspace/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { optionalAuthMiddleware, getPtScope } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/wallboard", optionalAuthMiddleware, async (req, res) => {
  try {
    const ptFilter = req.query.pt as string | undefined;

    const pts = await db.select().from(ptsTable);
    const ptIdMap: Record<string, number> = {};
    pts.forEach(p => { ptIdMap[p.code ?? p.name] = p.id; ptIdMap[p.name] = p.id; });

    const ptScope = getPtScope(req);
    const targetPtId: number | undefined = ptScope !== null
      ? ptScope
      : (ptFilter ? ptIdMap[ptFilter.toUpperCase()] ?? ptIdMap[ptFilter] : undefined);

    const [dealerRole] = await db.select({ id: rolesTable.id })
      .from(rolesTable).where(eq(rolesTable.name, "Dealer")).limit(1);
    const dealerRoleId = dealerRole?.id;

    const warningSetting = await db.select().from(systemSettingsTable)
      .where(eq(systemSettingsTable.settingKey, "inactivity_warning_hours")).limit(1);
    const criticalSetting = await db.select().from(systemSettingsTable)
      .where(eq(systemSettingsTable.settingKey, "inactivity_critical_hours")).limit(1);
    const warningHours = warningSetting.length > 0 ? Number(warningSetting[0].settingValue) : 2;
    const criticalHours = criticalSetting.length > 0 ? Number(criticalSetting[0].settingValue) : 4;
    const warningThreshold = new Date(Date.now() - warningHours * 3600000);

    const dealerConditions = [eq(usersTable.activeStatus, true), eq(usersTable.roleId, dealerRoleId ?? 0)];
    if (targetPtId) dealerConditions.push(eq(usersTable.ptId, targetPtId));

    const dealers = await db.select({
      userId: usersTable.id,
      userName: usersTable.name,
      ptId: usersTable.ptId,
      lastActivity: sql<string | null>`(SELECT MAX(${activityLogsTable.createdAt}) FROM ${activityLogsTable} WHERE ${activityLogsTable.userId} = ${usersTable.id})`,
    }).from(usersTable)
      .where(and(...dealerConditions));

    const dealerStatus = dealers.map(d => {
      const lastAct = d.lastActivity ? new Date(d.lastActivity) : null;
      const hoursInactive = lastAct ? (Date.now() - lastAct.getTime()) / 3600000 : Infinity;
      const isInactive = !lastAct || new Date(d.lastActivity!) < warningThreshold;
      const ptInfo = pts.find(p => p.id === d.ptId);
      return {
        userId: d.userId,
        userName: d.userName,
        ptId: d.ptId,
        ptName: ptInfo?.name ?? null,
        lastActivity: lastAct?.toISOString() ?? null,
        hoursInactive: isInactive ? Math.round(hoursInactive * 10) / 10 : 0,
        isActive: !isInactive,
        severity: isInactive
          ? (!lastAct || hoursInactive > criticalHours ? "critical" : "warning")
          : "active",
      };
    });

    const leaderboardConditions = [
      eq(usersTable.roleId, dealerRoleId ?? 0),
      eq(usersTable.activeStatus, true),
    ];
    if (targetPtId) leaderboardConditions.push(eq(usersTable.ptId, targetPtId));
    const leaderboard = await db.select({
      userId: kpiScoresTable.userId,
      userName: usersTable.name,
      ptId: usersTable.ptId,
      currentDailyScore: kpiScoresTable.currentDailyScore,
      currentWeeklyScore: kpiScoresTable.currentWeeklyScore,
      currentRank: kpiScoresTable.currentRank,
    }).from(kpiScoresTable)
      .innerJoin(usersTable, eq(kpiScoresTable.userId, usersTable.id))
      .where(and(...leaderboardConditions))
      .orderBy(desc(kpiScoresTable.currentDailyScore))
      .limit(10);

    const leaderboardWithPt = leaderboard.map((row, idx) => {
      const ptInfo = pts.find(p => p.id === row.ptId);
      return {
        ...row,
        ptName: ptInfo?.name ?? null,
        rank: idx + 1,
      };
    });

    const complaintsQuery = db.select({
      status: complaintsTable.status,
      severity: complaintsTable.severity,
    }).from(complaintsTable);
    const complaintsResult = targetPtId
      ? await complaintsQuery.where(eq(complaintsTable.ptId, targetPtId))
      : await complaintsQuery;

    const openComplaints = complaintsResult.filter(c => c.status === "open" || c.status === "in_progress");
    const highSeverity = openComplaints.filter(c => c.severity === "high");
    const inactiveCount = dealerStatus.filter(d => !d.isActive).length;

    let pulseStatus: "normal" | "caution" | "critical" = "normal";
    if (highSeverity.length > 3 || inactiveCount > 5) pulseStatus = "critical";
    else if (highSeverity.length > 0 || openComplaints.length > 5 || inactiveCount > 2) pulseStatus = "caution";

    const ptList = pts.map(p => ({ id: p.id, name: p.name, code: p.code }));

    res.json({
      pulse: {
        status: pulseStatus,
        openComplaints: openComplaints.length,
        highSeverityComplaints: highSeverity.length,
        inactiveCount,
        warningThresholdHours: warningHours,
        criticalThresholdHours: criticalHours,
      },
      leaderboard: leaderboardWithPt,
      dealers: dealerStatus,
      pts: ptList,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Wallboard error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
