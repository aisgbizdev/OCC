import { pgTable, serial, varchar, boolean, timestamp, integer, time, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ptsTable = pgTable("pts", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  activeStatus: boolean("active_status").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const branchesTable = pgTable("branches", {
  id: serial("id").primaryKey(),
  ptId: integer("pt_id").notNull().references(() => ptsTable.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }),
  activeStatus: boolean("active_status").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("branches_pt_id_idx").on(table.ptId),
]);

export const shiftsTable = pgTable("shifts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  activeStatus: boolean("active_status").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ptsRelations = relations(ptsTable, ({ many }) => ({
  branches: many(branchesTable),
}));

export const branchesRelations = relations(branchesTable, ({ one }) => ({
  pt: one(ptsTable, { fields: [branchesTable.ptId], references: [ptsTable.id] }),
}));

export const insertPtSchema = createInsertSchema(ptsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPt = z.infer<typeof insertPtSchema>;
export type Pt = typeof ptsTable.$inferSelect;

export const insertBranchSchema = createInsertSchema(branchesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBranch = z.infer<typeof insertBranchSchema>;
export type Branch = typeof branchesTable.$inferSelect;

export const insertShiftSchema = createInsertSchema(shiftsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shiftsTable.$inferSelect;
