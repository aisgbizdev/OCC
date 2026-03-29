import { pgTable, serial, varchar, boolean, timestamp, integer, numeric, text, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { ptsTable, branchesTable, shiftsTable } from "./organization";

export const activityTypesTable = pgTable("activity_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }),
  weightPoints: numeric("weight_points", { precision: 10, scale: 2 }).notNull().default("1"),
  noteRequired: boolean("note_required").notNull().default(false),
  quantityNoteThreshold: integer("quantity_note_threshold"),
  activeStatus: boolean("active_status").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  activityTypeId: integer("activity_type_id").notNull().references(() => activityTypesTable.id),
  quantity: integer("quantity").notNull().default(1),
  note: text("note"),
  ptId: integer("pt_id").references(() => ptsTable.id),
  branchId: integer("branch_id").references(() => branchesTable.id),
  shiftId: integer("shift_id").references(() => shiftsTable.id),
  points: numeric("points", { precision: 10, scale: 2 }).notNull().default("0"),
  flagged: boolean("flagged").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("activity_logs_user_id_idx").on(table.userId),
  index("activity_logs_activity_type_id_idx").on(table.activityTypeId),
  index("activity_logs_pt_id_idx").on(table.ptId),
  index("activity_logs_shift_id_idx").on(table.shiftId),
  index("activity_logs_created_at_idx").on(table.createdAt),
]);

export const activityTypesRelations = relations(activityTypesTable, ({ many }) => ({
  activityLogs: many(activityLogsTable),
}));

export const activityLogsRelations = relations(activityLogsTable, ({ one }) => ({
  user: one(usersTable, { fields: [activityLogsTable.userId], references: [usersTable.id] }),
  activityType: one(activityTypesTable, { fields: [activityLogsTable.activityTypeId], references: [activityTypesTable.id] }),
  pt: one(ptsTable, { fields: [activityLogsTable.ptId], references: [ptsTable.id] }),
  branch: one(branchesTable, { fields: [activityLogsTable.branchId], references: [branchesTable.id] }),
  shift: one(shiftsTable, { fields: [activityLogsTable.shiftId], references: [shiftsTable.id] }),
}));

export const insertActivityTypeSchema = createInsertSchema(activityTypesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertActivityType = z.infer<typeof insertActivityTypeSchema>;
export type ActivityType = typeof activityTypesTable.$inferSelect;

export const insertActivityLogSchema = createInsertSchema(activityLogsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogsTable.$inferSelect;
