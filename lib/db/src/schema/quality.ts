import { pgTable, serial, varchar, integer, text, date, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const qualityScoreEnum = pgEnum("quality_score", ["POOR", "AVERAGE", "PERFECT"]);

export const qualityErrorTypesTable = pgTable("quality_error_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 20 }).notNull().default("ALL").$type<"DEALER" | "SPV" | "ADMIN" | "ALL">(),
  objectiveGroup: varchar("objective_group", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const qualityRecordsTable = pgTable("quality_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  errorTypeId: integer("error_type_id").notNull().references(() => qualityErrorTypesTable.id),
  occurredDate: date("occurred_date").notNull(),
  errorCount: integer("error_count").notNull().default(1),
  score: qualityScoreEnum("score").notNull(),
  notes: text("notes"),
  recordedBy: integer("recorded_by").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const qualityErrorTypesRelations = relations(qualityErrorTypesTable, ({ many }) => ({
  records: many(qualityRecordsTable),
}));

export const qualityRecordsRelations = relations(qualityRecordsTable, ({ one }) => ({
  user: one(usersTable, { fields: [qualityRecordsTable.userId], references: [usersTable.id], relationName: "qualityUser" }),
  errorType: one(qualityErrorTypesTable, { fields: [qualityRecordsTable.errorTypeId], references: [qualityErrorTypesTable.id] }),
  recorder: one(usersTable, { fields: [qualityRecordsTable.recordedBy], references: [usersTable.id], relationName: "qualityRecorder" }),
}));

export const insertQualityRecordSchema = createInsertSchema(qualityRecordsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQualityRecord = z.infer<typeof insertQualityRecordSchema>;
export type QualityRecord = typeof qualityRecordsTable.$inferSelect;
export type QualityErrorType = typeof qualityErrorTypesTable.$inferSelect;
