import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { tasksTable, taskCommentsTable, usersTable, ptsTable, branchesTable } from "@workspace/db/schema";
import { eq, and, desc, lte, gte, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { createAuditLog, createNotification } from "../helpers/audit";

const router: IRouter = Router();

const ALL_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"];
const MGMT_ROLES = ["Owner", "Chief Dealing", "SPV Dealing", "Admin System"];

async function enrichTask(task: typeof tasksTable.$inferSelect) {
  const assignee = task.assignedTo ? (await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, task.assignedTo)).limit(1))[0] : null;
  const assigner = task.assignedBy ? (await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, task.assignedBy)).limit(1))[0] : null;
  const pt = task.ptId ? (await db.select().from(ptsTable).where(eq(ptsTable.id, task.ptId)).limit(1))[0] : null;
  const branch = task.branchId ? (await db.select().from(branchesTable).where(eq(branchesTable.id, task.branchId)).limit(1))[0] : null;
  const comments = await db.select().from(taskCommentsTable).where(eq(taskCommentsTable.taskId, task.id)).orderBy(desc(taskCommentsTable.createdAt));
  return {
    ...task,
    assigneeName: assignee?.name ?? null,
    assignerName: assigner?.name ?? null,
    ptName: pt?.name ?? null,
    branchName: branch?.name ?? null,
    isOverdue: task.deadline && task.status !== "completed" && task.status !== "cancelled" && new Date(task.deadline) < new Date(),
    comments,
  };
}

router.get("/tasks", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const conditions: SQL[] = [];
    if (req.query.assignedTo) conditions.push(eq(tasksTable.assignedTo, Number(req.query.assignedTo)));
    if (req.query.status) conditions.push(eq(tasksTable.status, req.query.status as string));
    if (req.query.priority) conditions.push(eq(tasksTable.priority, req.query.priority as string));
    if (req.query.ptId) conditions.push(eq(tasksTable.ptId, Number(req.query.ptId)));
    if (req.query.deadlineBefore) conditions.push(lte(tasksTable.deadline, new Date(req.query.deadlineBefore as string)));
    if (req.query.deadlineAfter) conditions.push(gte(tasksTable.deadline, new Date(req.query.deadlineAfter as string)));

    if (req.user!.roleName === "Dealer") {
      conditions.push(eq(tasksTable.assignedTo, req.user!.userId));
    }

    const tasks = await db.select().from(tasksTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tasksTable.createdAt))
      .limit(Number(req.query.limit) || 100);

    const enriched = await Promise.all(tasks.map(enrichTask));
    res.json(enriched);
  } catch (error) {
    console.error("List tasks error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tasks/:id", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, Number(req.params.id))).limit(1);
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }
    if (req.user!.roleName === "Dealer" && task.assignedTo !== req.user!.userId) {
      res.status(403).json({ error: "Access denied" }); return;
    }
    res.json(await enrichTask(task));
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/tasks", authMiddleware, requireRole(...MGMT_ROLES), async (req, res) => {
  try {
    const { title, description, ptId, branchId, assignedTo, priority, deadline } = req.body;
    if (!title) { res.status(400).json({ error: "title is required" }); return; }
    const [task] = await db.insert(tasksTable).values({
      title,
      description: description ?? null,
      ptId: ptId ?? req.user!.ptId,
      branchId: branchId ?? null,
      assignedTo: assignedTo ?? null,
      assignedBy: req.user!.userId,
      priority: priority ?? "medium",
      deadline: deadline ? new Date(deadline) : null,
    }).returning();

    if (assignedTo) {
      await createNotification({
        userId: assignedTo,
        type: "task_assigned",
        title: `New task assigned: ${title}`,
        content: description ?? undefined,
      });
    }

    await createAuditLog({ userId: req.user!.userId, actionType: "create", module: "task", entityId: String(task.id) });
    res.status(201).json(await enrichTask(task));
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/tasks/:id", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const [existing] = await db.select().from(tasksTable).where(eq(tasksTable.id, Number(req.params.id))).limit(1);
    if (!existing) { res.status(404).json({ error: "Task not found" }); return; }

    if (req.user!.roleName === "Dealer" && existing.assignedTo !== req.user!.userId) {
      res.status(403).json({ error: "Cannot update tasks not assigned to you" }); return;
    }

    const updateData: Partial<typeof tasksTable.$inferInsert> = {};
    if (req.user!.roleName === "Dealer") {
      if (req.body.status !== undefined) updateData.status = req.body.status;
      if (req.body.progressPercent !== undefined) updateData.progressPercent = req.body.progressPercent;
    } else {
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.status !== undefined) updateData.status = req.body.status;
      if (req.body.progressPercent !== undefined) updateData.progressPercent = req.body.progressPercent;
      if (req.body.priority !== undefined) updateData.priority = req.body.priority;
      if (req.body.deadline !== undefined) updateData.deadline = req.body.deadline ? new Date(req.body.deadline) : null;
      if (req.body.assignedTo !== undefined) updateData.assignedTo = req.body.assignedTo;
    }

    if (req.body.assignedTo && req.body.assignedTo !== existing.assignedTo) {
      await createNotification({
        userId: req.body.assignedTo,
        type: "task_assigned",
        title: `Task assigned: ${existing.title}`,
      });
    }

    const [updated] = await db.update(tasksTable).set(updateData)
      .where(eq(tasksTable.id, Number(req.params.id))).returning();
    await createAuditLog({ userId: req.user!.userId, actionType: "update", module: "task", entityId: String(updated.id) });
    res.json(await enrichTask(updated));
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tasks/:id/comments", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, Number(req.params.id))).limit(1);
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }
    if (req.user!.roleName === "Dealer" && task.assignedTo !== req.user!.userId) {
      res.status(403).json({ error: "Access denied" }); return;
    }
    const comments = await db.select({
      id: taskCommentsTable.id,
      taskId: taskCommentsTable.taskId,
      userId: taskCommentsTable.userId,
      userName: usersTable.name,
      message: taskCommentsTable.message,
      createdAt: taskCommentsTable.createdAt,
    }).from(taskCommentsTable)
      .leftJoin(usersTable, eq(taskCommentsTable.userId, usersTable.id))
      .where(eq(taskCommentsTable.taskId, task.id))
      .orderBy(desc(taskCommentsTable.createdAt));
    res.json(comments);
  } catch (error) {
    console.error("List task comments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/tasks/:id/comments", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, Number(req.params.id))).limit(1);
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }
    if (req.user!.roleName === "Dealer" && task.assignedTo !== req.user!.userId) {
      res.status(403).json({ error: "Access denied" }); return;
    }
    const { message } = req.body;
    if (!message) { res.status(400).json({ error: "message is required" }); return; }

    const [comment] = await db.insert(taskCommentsTable).values({
      taskId: task.id,
      userId: req.user!.userId,
      message,
    }).returning();

    if (task.assignedTo && task.assignedTo !== req.user!.userId) {
      await createNotification({
        userId: task.assignedTo,
        type: "task_comment",
        title: `New comment on task: ${task.title}`,
        content: message,
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error("Create task comment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/tasks/:id", authMiddleware, requireRole(...MGMT_ROLES), async (req, res) => {
  try {
    const [task] = await db.update(tasksTable).set({ status: "cancelled" })
      .where(eq(tasksTable.id, Number(req.params.id))).returning();
    if (!task) { res.status(404).json({ error: "Task not found" }); return; }
    await createAuditLog({ userId: req.user!.userId, actionType: "cancel", module: "task", entityId: String(task.id) });
    res.json({ message: "Task cancelled" });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
