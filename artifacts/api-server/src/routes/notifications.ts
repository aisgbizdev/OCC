import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable, systemSettingsTable } from "@workspace/db/schema";
import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";

interface DndConfig { enabled: boolean; startHour: number; endHour: number; }

async function getDndConfig(userId: number): Promise<DndConfig> {
  const key = `dnd_config_user_${userId}`;
  const [row] = await db.select({ v: systemSettingsTable.settingValue })
    .from(systemSettingsTable).where(eq(systemSettingsTable.settingKey, key)).limit(1);
  if (!row?.v) return { enabled: false, startHour: 22, endHour: 7 };
  try { return JSON.parse(row.v) as DndConfig; } catch { return { enabled: false, startHour: 22, endHour: 7 }; }
}

export async function isUserInDnd(userId: number): Promise<boolean> {
  const cfg = await getDndConfig(userId);
  if (!cfg.enabled) return false;
  const hour = new Date().getHours();
  if (cfg.startHour <= cfg.endHour) return hour >= cfg.startHour && hour < cfg.endHour;
  return hour >= cfg.startHour || hour < cfg.endHour;
}

const router: IRouter = Router();

const ALL_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"];

router.get("/notifications", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const conditions: SQL[] = [eq(notificationsTable.userId, req.user!.userId)];
    if (req.query.unreadOnly === "true") {
      conditions.push(eq(notificationsTable.readStatus, false));
    }

    const notifications = await db.select().from(notificationsTable)
      .where(and(...conditions))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(Number(req.query.limit) || 50);

    const unreadCount = await db.select({
      count: sql<number>`COUNT(*)::int`,
    }).from(notificationsTable)
      .where(and(eq(notificationsTable.userId, req.user!.userId), eq(notificationsTable.readStatus, false)));

    res.json({ notifications, unreadCount: unreadCount[0]?.count ?? 0 });
  } catch (error) {
    console.error("List notifications error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/notifications/dnd", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const config = await getDndConfig(req.user!.userId);
    res.json(config);
  } catch (error) {
    console.error("Get DND config error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/notifications/dnd", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const { enabled, startHour, endHour } = req.body;
    if (typeof enabled !== "boolean") { res.status(400).json({ error: "enabled (boolean) is required" }); return; }
    const sh = Number(startHour ?? 22); const eh = Number(endHour ?? 7);
    if (isNaN(sh) || isNaN(eh) || sh < 0 || sh > 23 || eh < 0 || eh > 23) {
      res.status(400).json({ error: "startHour and endHour must be 0–23" }); return;
    }
    const config: DndConfig = { enabled, startHour: sh, endHour: eh };
    const key = `dnd_config_user_${req.user!.userId}`;
    const existing = await db.select({ id: systemSettingsTable.id }).from(systemSettingsTable)
      .where(eq(systemSettingsTable.settingKey, key)).limit(1);
    if (existing.length > 0) {
      await db.update(systemSettingsTable).set({ settingValue: JSON.stringify(config), updatedBy: req.user!.userId })
        .where(eq(systemSettingsTable.settingKey, key));
    } else {
      await db.insert(systemSettingsTable).values({ settingKey: key, settingValue: JSON.stringify(config), updatedBy: req.user!.userId });
    }
    res.json(config);
  } catch (error) {
    console.error("Set DND config error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/notifications/:id/read", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const [notification] = await db.update(notificationsTable)
      .set({ readStatus: true })
      .where(and(eq(notificationsTable.id, Number(req.params.id)), eq(notificationsTable.userId, req.user!.userId)))
      .returning();

    if (!notification) { res.status(404).json({ error: "Notification not found" }); return; }
    res.json(notification);
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/notifications/read-all", authMiddleware, requireRole(...ALL_ROLES), async (_req, res) => {
  try {
    await db.update(notificationsTable)
      .set({ readStatus: true })
      .where(and(eq(notificationsTable.userId, _req.user!.userId), eq(notificationsTable.readStatus, false)));

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
