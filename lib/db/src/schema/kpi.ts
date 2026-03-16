import { pgTable, serial, varchar, numeric, timestamp, integer, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const kpiScoresTable = pgTable("kpi_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id).unique(),
  currentDailyScore: numeric("current_daily_score", { precision: 10, scale: 2 }).notNull().default("0"),
  currentWeeklyScore: numeric("current_weekly_score", { precision: 10, scale: 2 }).notNull().default("0"),
  currentMonthlyScore: numeric("current_monthly_score", { precision: 10, scale: 2 }).notNull().default("0"),
  currentQuarterlyScore: numeric("current_quarterly_score", { precision: 10, scale: 2 }).notNull().default("0"),
  currentYearlyScore: numeric("current_yearly_score", { precision: 10, scale: 2 }).notNull().default("0"),
  currentRank: integer("current_rank"),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const kpiSnapshotsTable = pgTable("kpi_snapshots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  periodType: varchar("period_type", { length: 20 }).notNull(),
  periodKey: varchar("period_key", { length: 30 }).notNull(),
  totalPoints: numeric("total_points", { precision: 10, scale: 2 }).notNull().default("0"),
  activityPoints: numeric("activity_points", { precision: 10, scale: 2 }).notNull().default("0"),
  taskPoints: numeric("task_points", { precision: 10, scale: 2 }).notNull().default("0"),
  complaintPenalty: numeric("complaint_penalty", { precision: 10, scale: 2 }).notNull().default("0"),
  errorPenalty: numeric("error_penalty", { precision: 10, scale: 2 }).notNull().default("0"),
  bonusPoints: numeric("bonus_points", { precision: 10, scale: 2 }).notNull().default("0"),
  rank: integer("rank"),
  grade: varchar("grade", { length: 5 }),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
}, (table) => [
  index("kpi_snapshots_user_id_idx").on(table.userId),
  index("kpi_snapshots_period_type_idx").on(table.periodType),
  index("kpi_snapshots_period_key_idx").on(table.periodKey),
]);

export const kpiScoresRelations = relations(kpiScoresTable, ({ one }) => ({
  user: one(usersTable, { fields: [kpiScoresTable.userId], references: [usersTable.id] }),
}));

export const kpiSnapshotsRelations = relations(kpiSnapshotsTable, ({ one }) => ({
  user: one(usersTable, { fields: [kpiSnapshotsTable.userId], references: [usersTable.id] }),
}));

export const insertKpiScoreSchema = createInsertSchema(kpiScoresTable).omit({ id: true, updatedAt: true });
export type InsertKpiScore = z.infer<typeof insertKpiScoreSchema>;
export type KpiScore = typeof kpiScoresTable.$inferSelect;

export const insertKpiSnapshotSchema = createInsertSchema(kpiSnapshotsTable).omit({ id: true, generatedAt: true });
export type InsertKpiSnapshot = z.infer<typeof insertKpiSnapshotSchema>;
export type KpiSnapshot = typeof kpiSnapshotsTable.$inferSelect;
