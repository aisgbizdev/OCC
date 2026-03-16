import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

const ALL_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"];

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
