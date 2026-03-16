import { pgTable, serial, varchar, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { rolesTable } from "./roles";
import { ptsTable, branchesTable, shiftsTable } from "./organization";

export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  targetScope: varchar("target_scope", { length: 30 }),
  ptId: integer("pt_id").references(() => ptsTable.id),
  branchId: integer("branch_id").references(() => branchesTable.id),
  shiftId: integer("shift_id").references(() => shiftsTable.id),
  roleId: integer("role_id").references(() => rolesTable.id),
  createdBy: integer("created_by").references(() => usersTable.id),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  priority: varchar("priority", { length: 20 }).notNull().default("normal"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  subject: varchar("subject", { length: 255 }).notNull(),
  content: text("content").notNull(),
  senderId: integer("sender_id").notNull().references(() => usersTable.id),
  targetType: varchar("target_type", { length: 30 }),
  targetId: integer("target_id"),
  requireAck: boolean("require_ack").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const messageAcknowledgementsTable = pgTable("message_acknowledgements", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messagesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  acknowledgedAt: timestamp("acknowledged_at").notNull().defaultNow(),
});

export const chatsTable = pgTable("chats", {
  id: serial("id").primaryKey(),
  chatType: varchar("chat_type", { length: 20 }).notNull().default("personal"),
  name: varchar("name", { length: 100 }),
  createdBy: integer("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const chatMembersTable = pgTable("chat_members", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chatsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chatsTable.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => usersTable.id),
  message: text("message").notNull(),
  attachmentUrl: varchar("attachment_url", { length: 500 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const announcementsRelations = relations(announcementsTable, ({ one }) => ({
  pt: one(ptsTable, { fields: [announcementsTable.ptId], references: [ptsTable.id] }),
  branch: one(branchesTable, { fields: [announcementsTable.branchId], references: [branchesTable.id] }),
  shift: one(shiftsTable, { fields: [announcementsTable.shiftId], references: [shiftsTable.id] }),
  role: one(rolesTable, { fields: [announcementsTable.roleId], references: [rolesTable.id] }),
  creator: one(usersTable, { fields: [announcementsTable.createdBy], references: [usersTable.id] }),
}));

export const messagesRelations = relations(messagesTable, ({ one, many }) => ({
  sender: one(usersTable, { fields: [messagesTable.senderId], references: [usersTable.id] }),
  acknowledgements: many(messageAcknowledgementsTable),
}));

export const messageAcknowledgementsRelations = relations(messageAcknowledgementsTable, ({ one }) => ({
  message: one(messagesTable, { fields: [messageAcknowledgementsTable.messageId], references: [messagesTable.id] }),
  user: one(usersTable, { fields: [messageAcknowledgementsTable.userId], references: [usersTable.id] }),
}));

export const chatsRelations = relations(chatsTable, ({ one, many }) => ({
  creator: one(usersTable, { fields: [chatsTable.createdBy], references: [usersTable.id] }),
  members: many(chatMembersTable),
  messages: many(chatMessagesTable),
}));

export const chatMembersRelations = relations(chatMembersTable, ({ one }) => ({
  chat: one(chatsTable, { fields: [chatMembersTable.chatId], references: [chatsTable.id] }),
  user: one(usersTable, { fields: [chatMembersTable.userId], references: [usersTable.id] }),
}));

export const chatMessagesRelations = relations(chatMessagesTable, ({ one }) => ({
  chat: one(chatsTable, { fields: [chatMessagesTable.chatId], references: [chatsTable.id] }),
  sender: one(usersTable, { fields: [chatMessagesTable.senderId], references: [usersTable.id] }),
}));

export const insertAnnouncementSchema = createInsertSchema(announcementsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcementsTable.$inferSelect;

export const insertMessageSchema = createInsertSchema(messagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;

export const insertMessageAckSchema = createInsertSchema(messageAcknowledgementsTable).omit({ id: true, acknowledgedAt: true });
export type InsertMessageAck = z.infer<typeof insertMessageAckSchema>;
export type MessageAck = typeof messageAcknowledgementsTable.$inferSelect;

export const insertChatSchema = createInsertSchema(chatsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chatsTable.$inferSelect;

export const insertChatMemberSchema = createInsertSchema(chatMembersTable).omit({ id: true, joinedAt: true });
export type InsertChatMember = z.infer<typeof insertChatMemberSchema>;
export type ChatMember = typeof chatMembersTable.$inferSelect;

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
