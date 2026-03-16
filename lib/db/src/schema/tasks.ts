import { pgTable, serial, varchar, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { ptsTable, branchesTable } from "./organization";

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  ptId: integer("pt_id").references(() => ptsTable.id),
  branchId: integer("branch_id").references(() => branchesTable.id),
  assignedTo: integer("assigned_to").references(() => usersTable.id),
  assignedBy: integer("assigned_by").references(() => usersTable.id),
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  deadline: timestamp("deadline"),
  progressPercent: integer("progress_percent").notNull().default(0),
  status: varchar("status", { length: 30 }).notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("tasks_assigned_to_idx").on(table.assignedTo),
  index("tasks_status_idx").on(table.status),
  index("tasks_deadline_idx").on(table.deadline),
  index("tasks_pt_id_idx").on(table.ptId),
]);

export const taskCommentsTable = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasksTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tasksRelations = relations(tasksTable, ({ one, many }) => ({
  pt: one(ptsTable, { fields: [tasksTable.ptId], references: [ptsTable.id] }),
  branch: one(branchesTable, { fields: [tasksTable.branchId], references: [branchesTable.id] }),
  assignee: one(usersTable, { fields: [tasksTable.assignedTo], references: [usersTable.id], relationName: "assignee" }),
  assigner: one(usersTable, { fields: [tasksTable.assignedBy], references: [usersTable.id], relationName: "assigner" }),
  comments: many(taskCommentsTable),
}));

export const taskCommentsRelations = relations(taskCommentsTable, ({ one }) => ({
  task: one(tasksTable, { fields: [taskCommentsTable.taskId], references: [tasksTable.id] }),
  user: one(usersTable, { fields: [taskCommentsTable.userId], references: [usersTable.id] }),
}));

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;

export const insertTaskCommentSchema = createInsertSchema(taskCommentsTable).omit({ id: true, createdAt: true });
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskComment = typeof taskCommentsTable.$inferSelect;
