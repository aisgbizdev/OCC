import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { messagesTable, messageAcknowledgementsTable, usersTable } from "@workspace/db/schema";
import { eq, and, desc, sql, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { createAuditLog, createNotification } from "../helpers/audit";

const router: IRouter = Router();

const ALL_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"];
const SEND_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Admin System"];

router.get("/messages", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const conditions: SQL[] = [];
    if (req.query.senderId) conditions.push(eq(messagesTable.senderId, Number(req.query.senderId)));
    if (req.query.targetType) conditions.push(eq(messagesTable.targetType, req.query.targetType as string));
    if (req.user!.roleName === "Dealer") {
      conditions.push(
        sql`(${messagesTable.targetType} = 'user' AND ${messagesTable.targetId} = ${req.user!.userId}) OR ${messagesTable.targetType} = 'all' OR ${messagesTable.targetType} IS NULL OR ${messagesTable.senderId} = ${req.user!.userId}`
      );
    }

    const messages = await db.select({
      id: messagesTable.id,
      subject: messagesTable.subject,
      content: messagesTable.content,
      senderId: messagesTable.senderId,
      senderName: usersTable.name,
      targetType: messagesTable.targetType,
      targetId: messagesTable.targetId,
      requireAck: messagesTable.requireAck,
      createdAt: messagesTable.createdAt,
    }).from(messagesTable)
      .leftJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(messagesTable.createdAt))
      .limit(Number(req.query.limit) || 50);

    res.json(messages);
  } catch (error) {
    console.error("List messages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/messages/:id", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const [message] = await db.select().from(messagesTable)
      .where(eq(messagesTable.id, Number(req.params.id))).limit(1);
    if (!message) { res.status(404).json({ error: "Message not found" }); return; }

    if (req.user!.roleName === "Dealer") {
      const isTargetedToMe = (message.targetType === "user" && message.targetId === req.user!.userId);
      const isBroadcast = !message.targetType || message.targetType === "all";
      const isSender = message.senderId === req.user!.userId;
      if (!isTargetedToMe && !isBroadcast && !isSender) {
        res.status(403).json({ error: "Access denied" }); return;
      }
    }

    const acks = await db.select({
      userId: messageAcknowledgementsTable.userId,
      userName: usersTable.name,
      acknowledgedAt: messageAcknowledgementsTable.acknowledgedAt,
    }).from(messageAcknowledgementsTable)
      .leftJoin(usersTable, eq(messageAcknowledgementsTable.userId, usersTable.id))
      .where(eq(messageAcknowledgementsTable.messageId, message.id));

    res.json({ ...message, acknowledgements: acks });
  } catch (error) {
    console.error("Get message error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/messages", authMiddleware, requireRole(...SEND_ROLES), async (req, res) => {
  try {
    const { subject, content, targetType, targetId, requireAck } = req.body;
    if (!subject || !content) {
      res.status(400).json({ error: "subject and content are required" }); return;
    }
    const [message] = await db.insert(messagesTable).values({
      subject,
      content,
      senderId: req.user!.userId,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      requireAck: requireAck ?? false,
    }).returning();

    if (targetType === "user" && targetId) {
      await createNotification({
        userId: targetId,
        type: "new_message",
        title: `New message: ${subject}`,
        content,
      });
    }

    await createAuditLog({ userId: req.user!.userId, actionType: "create", module: "message", entityId: String(message.id) });
    res.status(201).json(message);
  } catch (error) {
    console.error("Create message error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/messages/:id/acknowledge", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const [message] = await db.select().from(messagesTable)
      .where(eq(messagesTable.id, Number(req.params.id))).limit(1);
    if (!message) { res.status(404).json({ error: "Message not found" }); return; }

    if (req.user!.roleName === "Dealer") {
      const isTargetedToMe = (message.targetType === "user" && message.targetId === req.user!.userId);
      const isBroadcast = !message.targetType || message.targetType === "all";
      if (!isTargetedToMe && !isBroadcast) {
        res.status(403).json({ error: "Access denied" }); return;
      }
    }

    const existing = await db.select().from(messageAcknowledgementsTable)
      .where(and(
        eq(messageAcknowledgementsTable.messageId, message.id),
        eq(messageAcknowledgementsTable.userId, req.user!.userId),
      )).limit(1);

    if (existing.length > 0) {
      res.json({ message: "Already acknowledged" }); return;
    }

    await db.insert(messageAcknowledgementsTable).values({
      messageId: message.id,
      userId: req.user!.userId,
    });

    await createAuditLog({ userId: req.user!.userId, actionType: "acknowledge", module: "message", entityId: String(message.id) });
    res.json({ message: "Message acknowledged" });
  } catch (error) {
    console.error("Acknowledge message error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
