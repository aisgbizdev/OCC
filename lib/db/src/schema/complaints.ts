import { pgTable, serial, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { ptsTable, branchesTable } from "./organization";

export const complaintsTable = pgTable("complaints", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  complaintType: varchar("complaint_type", { length: 50 }).notNull(),
  ptId: integer("pt_id").references(() => ptsTable.id),
  branchId: integer("branch_id").references(() => branchesTable.id),
  assignedUserId: integer("assigned_user_id").references(() => usersTable.id),
  severity: varchar("severity", { length: 20 }).notNull().default("medium"),
  chronology: text("chronology"),
  followUp: text("follow_up"),
  status: varchar("status", { length: 30 }).notNull().default("open"),
  createdBy: integer("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("complaints_assigned_user_id_idx").on(table.assignedUserId),
  index("complaints_status_idx").on(table.status),
  index("complaints_severity_idx").on(table.severity),
  index("complaints_pt_id_idx").on(table.ptId),
  index("complaints_created_at_idx").on(table.createdAt),
]);

export const complaintsRelations = relations(complaintsTable, ({ one, many }) => ({
  pt: one(ptsTable, { fields: [complaintsTable.ptId], references: [ptsTable.id] }),
  branch: one(branchesTable, { fields: [complaintsTable.branchId], references: [branchesTable.id] }),
  assignedUser: one(usersTable, { fields: [complaintsTable.assignedUserId], references: [usersTable.id], relationName: "assignedComplaints" }),
  creator: one(usersTable, { fields: [complaintsTable.createdBy], references: [usersTable.id], relationName: "createdComplaints" }),
  comments: many(complaintCommentsTable),
  history: many(complaintHistoryTable),
}));

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaintsTable.$inferSelect;

export const complaintCommentsTable = pgTable("complaint_comments", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull().references(() => complaintsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("complaint_comments_complaint_id_idx").on(table.complaintId),
  index("complaint_comments_created_at_idx").on(table.createdAt),
]);

export const complaintCommentsRelations = relations(complaintCommentsTable, ({ one }) => ({
  complaint: one(complaintsTable, { fields: [complaintCommentsTable.complaintId], references: [complaintsTable.id] }),
  user: one(usersTable, { fields: [complaintCommentsTable.userId], references: [usersTable.id] }),
}));

export type ComplaintComment = typeof complaintCommentsTable.$inferSelect;

export const complaintHistoryTable = pgTable("complaint_history", {
  id: serial("id").primaryKey(),
  complaintId: integer("complaint_id").notNull().references(() => complaintsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => usersTable.id),
  changeType: varchar("change_type", { length: 50 }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("complaint_history_complaint_id_idx").on(table.complaintId),
  index("complaint_history_created_at_idx").on(table.createdAt),
]);

export const complaintHistoryRelations = relations(complaintHistoryTable, ({ one }) => ({
  complaint: one(complaintsTable, { fields: [complaintHistoryTable.complaintId], references: [complaintsTable.id] }),
  user: one(usersTable, { fields: [complaintHistoryTable.userId], references: [usersTable.id] }),
}));

export type ComplaintHistory = typeof complaintHistoryTable.$inferSelect;
