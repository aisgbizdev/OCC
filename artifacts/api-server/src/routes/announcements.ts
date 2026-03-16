import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { announcementsTable, usersTable } from "@workspace/db/schema";
import { eq, and, desc, gte, lte, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { createAuditLog } from "../helpers/audit";

const router: IRouter = Router();

const ALL_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"];
const CREATE_ROLES = ["Owner", "Chief Dealing", "SPV Dealing", "Admin System"];

router.get("/announcements", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const conditions: SQL[] = [];
    if (req.query.priority) conditions.push(eq(announcementsTable.priority, req.query.priority as string));
    if (req.query.activeOnly === "true") {
      const now = new Date();
      conditions.push(lte(announcementsTable.startsAt, now));
    }

    const announcements = await db.select({
      id: announcementsTable.id,
      title: announcementsTable.title,
      content: announcementsTable.content,
      targetScope: announcementsTable.targetScope,
      ptId: announcementsTable.ptId,
      branchId: announcementsTable.branchId,
      shiftId: announcementsTable.shiftId,
      roleId: announcementsTable.roleId,
      createdBy: announcementsTable.createdBy,
      startsAt: announcementsTable.startsAt,
      endsAt: announcementsTable.endsAt,
      priority: announcementsTable.priority,
      createdAt: announcementsTable.createdAt,
      updatedAt: announcementsTable.updatedAt,
      creatorName: usersTable.name,
    }).from(announcementsTable)
      .leftJoin(usersTable, eq(announcementsTable.createdBy, usersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(announcementsTable.createdAt))
      .limit(Number(req.query.limit) || 50);

    res.json(announcements);
  } catch (error) {
    console.error("List announcements error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/announcements/:id", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const [announcement] = await db.select().from(announcementsTable)
      .where(eq(announcementsTable.id, Number(req.params.id))).limit(1);
    if (!announcement) { res.status(404).json({ error: "Announcement not found" }); return; }
    res.json(announcement);
  } catch (error) {
    console.error("Get announcement error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/announcements", authMiddleware, requireRole(...CREATE_ROLES), async (req, res) => {
  try {
    const { title, content, targetScope, ptId, branchId, shiftId, roleId, startsAt, endsAt, priority } = req.body;
    if (!title || !content) {
      res.status(400).json({ error: "title and content are required" }); return;
    }
    const [announcement] = await db.insert(announcementsTable).values({
      title,
      content,
      targetScope: targetScope ?? null,
      ptId: ptId ?? null,
      branchId: branchId ?? null,
      shiftId: shiftId ?? null,
      roleId: roleId ?? null,
      createdBy: req.user!.userId,
      startsAt: startsAt ? new Date(startsAt) : new Date(),
      endsAt: endsAt ? new Date(endsAt) : null,
      priority: priority ?? "normal",
    }).returning();

    await createAuditLog({ userId: req.user!.userId, actionType: "create", module: "announcement", entityId: String(announcement.id) });
    res.status(201).json(announcement);
  } catch (error) {
    console.error("Create announcement error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/announcements/:id", authMiddleware, requireRole(...CREATE_ROLES), async (req, res) => {
  try {
    const updateData: Partial<typeof announcementsTable.$inferInsert> = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.content !== undefined) updateData.content = req.body.content;
    if (req.body.targetScope !== undefined) updateData.targetScope = req.body.targetScope;
    if (req.body.ptId !== undefined) updateData.ptId = req.body.ptId;
    if (req.body.shiftId !== undefined) updateData.shiftId = req.body.shiftId;
    if (req.body.roleId !== undefined) updateData.roleId = req.body.roleId;
    if (req.body.startsAt !== undefined) updateData.startsAt = req.body.startsAt ? new Date(req.body.startsAt) : null;
    if (req.body.endsAt !== undefined) updateData.endsAt = req.body.endsAt ? new Date(req.body.endsAt) : null;
    if (req.body.priority !== undefined) updateData.priority = req.body.priority;

    const [updated] = await db.update(announcementsTable).set(updateData)
      .where(eq(announcementsTable.id, Number(req.params.id))).returning();
    if (!updated) { res.status(404).json({ error: "Announcement not found" }); return; }
    await createAuditLog({ userId: req.user!.userId, actionType: "update", module: "announcement", entityId: String(updated.id) });
    res.json(updated);
  } catch (error) {
    console.error("Update announcement error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/announcements/:id", authMiddleware, requireRole(...CREATE_ROLES), async (req, res) => {
  try {
    const [deleted] = await db.delete(announcementsTable)
      .where(eq(announcementsTable.id, Number(req.params.id))).returning();
    if (!deleted) { res.status(404).json({ error: "Announcement not found" }); return; }
    await createAuditLog({ userId: req.user!.userId, actionType: "delete", module: "announcement", entityId: String(deleted.id) });
    res.json({ message: "Announcement deleted" });
  } catch (error) {
    console.error("Delete announcement error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
