import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { ptsTable, branchesTable, shiftsTable } from "./organization";

export const handoverLogsTable = pgTable("handover_logs", {
  id: serial("id").primaryKey(),
  ptId: integer("pt_id").references(() => ptsTable.id),
  branchId: integer("branch_id").references(() => branchesTable.id),
  fromShiftId: integer("from_shift_id").references(() => shiftsTable.id),
  toShiftId: integer("to_shift_id").references(() => shiftsTable.id),
  createdBy: integer("created_by").references(() => usersTable.id),
  summary: text("summary"),
  pendingActivities: text("pending_activities"),
  pendingTasks: text("pending_tasks"),
  pendingComplaints: text("pending_complaints"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const handoverLogsRelations = relations(handoverLogsTable, ({ one }) => ({
  pt: one(ptsTable, { fields: [handoverLogsTable.ptId], references: [ptsTable.id] }),
  branch: one(branchesTable, { fields: [handoverLogsTable.branchId], references: [branchesTable.id] }),
  fromShift: one(shiftsTable, { fields: [handoverLogsTable.fromShiftId], references: [shiftsTable.id], relationName: "fromShift" }),
  toShift: one(shiftsTable, { fields: [handoverLogsTable.toShiftId], references: [shiftsTable.id], relationName: "toShift" }),
  creator: one(usersTable, { fields: [handoverLogsTable.createdBy], references: [usersTable.id] }),
}));

export const insertHandoverLogSchema = createInsertSchema(handoverLogsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertHandoverLog = z.infer<typeof insertHandoverLogSchema>;
export type HandoverLog = typeof handoverLogsTable.$inferSelect;
