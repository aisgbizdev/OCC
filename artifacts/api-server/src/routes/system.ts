import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { systemSettingsTable, auditLogsTable, usersTable, activityLogsTable, rolesTable } from "@workspace/db/schema";
import { eq, and, desc, lt, type SQL, sql } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { createAuditLog, createNotification } from "../helpers/audit";
import { sendPushToRoles } from "../lib/push";

const router: IRouter = Router();

const ALL_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"];
const ADMIN_ROLES = ["Owner", "Admin System"];

router.get("/system-settings", authMiddleware, requireRole(...ALL_ROLES), async (_req, res) => {
  try {
    const settings = await db.select().from(systemSettingsTable);
    res.json(settings);
  } catch (error) {
    console.error("List system settings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/system-settings/:key", authMiddleware, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { value } = req.body;
    if (value === undefined) { res.status(400).json({ error: "value is required" }); return; }

    const key = req.params.key as string;
    const [updated] = await db.update(systemSettingsTable)
      .set({ settingValue: value, updatedBy: req.user!.userId })
      .where(eq(systemSettingsTable.settingKey, key))
      .returning();

    if (!updated) { res.status(404).json({ error: "Setting not found" }); return; }
    await createAuditLog({
      userId: req.user!.userId,
      actionType: "update",
      module: "system_setting",
      entityId: key,
      newValue: value,
    });
    res.json(updated);
  } catch (error) {
    console.error("Update system setting error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/audit-logs", authMiddleware, requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const conditions: SQL[] = [];
    if (req.query.module) conditions.push(eq(auditLogsTable.module, req.query.module as string));
    if (req.query.actionType) conditions.push(eq(auditLogsTable.actionType, req.query.actionType as string));
    if (req.query.userId) conditions.push(eq(auditLogsTable.userId, Number(req.query.userId)));

    const logs = await db.select({
      id: auditLogsTable.id,
      userId: auditLogsTable.userId,
      userName: usersTable.name,
      actionType: auditLogsTable.actionType,
      module: auditLogsTable.module,
      entityId: auditLogsTable.entityId,
      oldValue: auditLogsTable.oldValue,
      newValue: auditLogsTable.newValue,
      ipAddress: auditLogsTable.ipAddress,
      createdAt: auditLogsTable.createdAt,
    }).from(auditLogsTable)
      .leftJoin(usersTable, eq(auditLogsTable.userId, usersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(Number(req.query.limit) || 100);

    res.json(logs);
  } catch (error) {
    console.error("List audit logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/inactivity/check", authMiddleware, requireRole("Owner", "Chief Dealing", "SPV Dealing", "Admin System"), async (_req, res) => {
  try {
    const warningSetting = await db.select().from(systemSettingsTable)
      .where(eq(systemSettingsTable.settingKey, "inactivity_warning_hours")).limit(1);
    const criticalSetting = await db.select().from(systemSettingsTable)
      .where(eq(systemSettingsTable.settingKey, "inactivity_critical_hours")).limit(1);

    const warningHours = warningSetting.length > 0 ? Number(warningSetting[0].settingValue) : 2;
    const criticalHours = criticalSetting.length > 0 ? Number(criticalSetting[0].settingValue) : 4;

    const warningThreshold = new Date(Date.now() - warningHours * 3600000);
    const criticalThreshold = new Date(Date.now() - criticalHours * 3600000);

    const [dealerRole] = await db.select({ id: rolesTable.id })
      .from(rolesTable).where(eq(rolesTable.name, "Dealer")).limit(1);
    const dealerRoleId = dealerRole?.id;
    if (!dealerRoleId) { res.json({ warningThresholdHours: warningHours, criticalThresholdHours: criticalHours, inactiveCount: 0, markedAt: new Date().toISOString(), dealers: [] }); return; }

    const dealers = await db.select({
      userId: usersTable.id,
      userName: usersTable.name,
      ptId: usersTable.ptId,
      shiftId: usersTable.shiftId,
      lastActivity: sql<Date | null>`(SELECT MAX(${activityLogsTable.createdAt}) FROM ${activityLogsTable} WHERE ${activityLogsTable.userId} = ${usersTable.id})`,
    }).from(usersTable)
      .where(and(eq(usersTable.activeStatus, true), eq(usersTable.roleId, dealerRoleId)));

    const inactive = dealers
      .filter((d) => !d.lastActivity || new Date(d.lastActivity) < warningThreshold)
      .map((d) => {
        const lastAct = d.lastActivity ? new Date(d.lastActivity) : null;
        const hoursInactive = lastAct ? (Date.now() - lastAct.getTime()) / 3600000 : Infinity;
        return {
          userId: d.userId,
          userName: d.userName,
          ptId: d.ptId,
          shiftId: d.shiftId,
          lastActivity: lastAct?.toISOString() ?? null,
          hoursInactive: Math.round(hoursInactive * 10) / 10,
          severity: !lastAct || hoursInactive > criticalHours ? "critical" as const : "warning" as const,
        };
      });

    const cooldownHours = 1;
    const cooldownThreshold = new Date(Date.now() - cooldownHours * 3600000);
    for (const dealer of inactive) {
      const [recentFlag] = await db.select().from(auditLogsTable)
        .where(and(
          eq(auditLogsTable.actionType, "inactivity_flag"),
          eq(auditLogsTable.module, "system"),
          eq(auditLogsTable.entityId, String(dealer.userId)),
        ))
        .orderBy(desc(auditLogsTable.createdAt))
        .limit(1);
      if (recentFlag && new Date(recentFlag.createdAt) > cooldownThreshold) continue;

      await createAuditLog({
        userId: _req.user!.userId,
        actionType: "inactivity_flag",
        module: "system",
        entityId: String(dealer.userId),
      });
      await createNotification({
        userId: dealer.userId,
        type: "warning",
        title: "Inactivity Warning",
        content: `You have been flagged as inactive (${dealer.hoursInactive}h without activity). Please log your activities.`,
      });

      if (dealer.severity === "critical") {
        sendPushToRoles(["Owner", "Direksi"], {
          title: "Dealer Inaktif Kritis",
          body: `${dealer.userName} tidak aktif selama ${dealer.hoursInactive} jam`,
          url: "/system",
          tag: `inactive-critical-${dealer.userId}`,
          type: "critical",
        }).catch(console.error);
        sendPushToRoles(["SPV Dealing", "Chief Dealing"], {
          title: "Dealer Tidak Aktif",
          body: `${dealer.userName} tidak aktif selama ${dealer.hoursInactive} jam`,
          url: "/system",
          tag: `inactive-${dealer.userId}`,
          type: "critical",
        }).catch(console.error);
      } else {
        sendPushToRoles(["SPV Dealing", "Chief Dealing"], {
          title: "Peringatan Inaktivitas Dealer",
          body: `${dealer.userName} tidak aktif selama ${dealer.hoursInactive} jam`,
          url: "/system",
          tag: `inactive-warn-${dealer.userId}`,
        }).catch(console.error);
      }
    }

    res.json({
      warningThresholdHours: warningHours,
      criticalThresholdHours: criticalHours,
      inactiveCount: inactive.length,
      markedAt: new Date().toISOString(),
      dealers: inactive,
    });
  } catch (error) {
    console.error("Inactivity check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
