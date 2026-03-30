import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { chatsTable, chatMembersTable, chatMessagesTable, usersTable } from "@workspace/db/schema";
import { eq, and, desc, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";
import { createAuditLog, createNotification } from "../helpers/audit";

const router: IRouter = Router();

const ALL_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"];

router.get("/chats", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const memberRows = await db.select({ chatId: chatMembersTable.chatId })
      .from(chatMembersTable)
      .where(eq(chatMembersTable.userId, req.user!.userId));

    const chatIds = memberRows.map((m) => m.chatId);
    if (chatIds.length === 0) { res.json([]); return; }

    const allChats = [];
    for (const chatId of chatIds) {
      const [chat] = await db.select().from(chatsTable).where(eq(chatsTable.id, chatId)).limit(1);
      if (!chat) continue;
      const members = await db.select({
        userId: chatMembersTable.userId,
        userName: usersTable.name,
        joinedAt: chatMembersTable.joinedAt,
      }).from(chatMembersTable)
        .leftJoin(usersTable, eq(chatMembersTable.userId, usersTable.id))
        .where(eq(chatMembersTable.chatId, chatId));
      allChats.push({ ...chat, members });
    }
    res.json(allChats);
  } catch (error) {
    console.error("List chats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/chats", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const { chatType, name, memberIds } = req.body;
    if (chatType === "group" && !["Owner", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Admin System"].includes(req.user!.roleName)) {
      res.status(403).json({ error: "Only management can create group chats" }); return;
    }

    const [chat] = await db.insert(chatsTable).values({
      chatType: chatType ?? "personal",
      name: name ?? null,
      createdBy: req.user!.userId,
    }).returning();

    await db.insert(chatMembersTable).values({ chatId: chat.id, userId: req.user!.userId });

    if (Array.isArray(memberIds)) {
      for (const userId of memberIds) {
        if (userId !== req.user!.userId) {
          await db.insert(chatMembersTable).values({ chatId: chat.id, userId });
        }
      }
    }

    res.status(201).json(chat);
  } catch (error) {
    console.error("Create chat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/chats/:id/members", authMiddleware, requireRole("Owner", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Admin System"), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) { res.status(400).json({ error: "userId is required" }); return; }

    const existing = await db.select().from(chatMembersTable)
      .where(and(eq(chatMembersTable.chatId, Number(req.params.id)), eq(chatMembersTable.userId, userId))).limit(1);
    if (existing.length > 0) { res.json({ message: "Already a member" }); return; }

    await db.insert(chatMembersTable).values({ chatId: Number(req.params.id), userId });
    await createAuditLog({ userId: req.user!.userId, actionType: "add_member", module: "chat", entityId: String(req.params.id) });
    res.status(201).json({ message: "Member added" });
  } catch (error) {
    console.error("Add chat member error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/chats/:id/messages", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const isMember = await db.select().from(chatMembersTable)
      .where(and(eq(chatMembersTable.chatId, Number(req.params.id)), eq(chatMembersTable.userId, req.user!.userId))).limit(1);
    if (isMember.length === 0) { res.status(403).json({ error: "Not a member of this chat" }); return; }

    const messages = await db.select({
      id: chatMessagesTable.id,
      chatId: chatMessagesTable.chatId,
      senderId: chatMessagesTable.senderId,
      senderName: usersTable.name,
      message: chatMessagesTable.message,
      attachmentUrl: chatMessagesTable.attachmentUrl,
      createdAt: chatMessagesTable.createdAt,
    }).from(chatMessagesTable)
      .leftJoin(usersTable, eq(chatMessagesTable.senderId, usersTable.id))
      .where(eq(chatMessagesTable.chatId, Number(req.params.id)))
      .orderBy(desc(chatMessagesTable.createdAt))
      .limit(Number(req.query.limit) || 100);

    res.json(messages);
  } catch (error) {
    console.error("List chat messages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/chats/:id/messages", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const chatId = Number(req.params.id);
    const isMember = await db.select().from(chatMembersTable)
      .where(and(eq(chatMembersTable.chatId, chatId), eq(chatMembersTable.userId, req.user!.userId))).limit(1);
    if (isMember.length === 0) { res.status(403).json({ error: "Not a member of this chat" }); return; }

    const { message, attachmentUrl } = req.body;
    if (!message) { res.status(400).json({ error: "message is required" }); return; }

    const [chatMsg] = await db.insert(chatMessagesTable).values({
      chatId,
      senderId: req.user!.userId,
      message,
      attachmentUrl: attachmentUrl ?? null,
    }).returning();

    const members = await db.select({ userId: chatMembersTable.userId }).from(chatMembersTable)
      .where(eq(chatMembersTable.chatId, chatId));
    const otherMembers = members.filter((m) => m.userId !== req.user!.userId).map((m) => m.userId);
    if (otherMembers.length > 0) {
      const [sender] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
      for (const uid of otherMembers) {
        await createNotification({
          userId: uid,
          type: "new_chat_message",
          title: `New message from ${sender?.name ?? "Unknown"}`,
          content: message.substring(0, 100),
        });
      }
    }

    await createAuditLog({ userId: req.user!.userId, actionType: "send_message", module: "chat", entityId: String(chatMsg.id) });
    res.status(201).json(chatMsg);
  } catch (error) {
    console.error("Send chat message error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
