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

export const complaintsRelations = relations(complaintsTable, ({ one }) => ({
  pt: one(ptsTable, { fields: [complaintsTable.ptId], references: [ptsTable.id] }),
  branch: one(branchesTable, { fields: [complaintsTable.branchId], references: [branchesTable.id] }),
  assignedUser: one(usersTable, { fields: [complaintsTable.assignedUserId], references: [usersTable.id], relationName: "assignedComplaints" }),
  creator: one(usersTable, { fields: [complaintsTable.createdBy], references: [usersTable.id], relationName: "createdComplaints" }),
}));

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaintsTable.$inferSelect;
