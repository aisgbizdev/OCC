import { pgTable, serial, varchar, boolean, timestamp, integer, index, foreignKey, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { rolesTable } from "./roles";
import { ptsTable, branchesTable, shiftsTable } from "./organization";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  avatar: varchar("avatar", { length: 500 }),
  roleId: integer("role_id").notNull().references(() => rolesTable.id),
  ptId: integer("pt_id").references(() => ptsTable.id),
  branchId: integer("branch_id").references(() => branchesTable.id),
  shiftId: integer("shift_id").references(() => shiftsTable.id),
  positionTitle: varchar("position_title", { length: 100 }),
  jobDescription: text("job_description"),
  supervisorId: integer("supervisor_id"),
  activeStatus: boolean("active_status").notNull().default(true),
  dndEnabled: boolean("dnd_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("users_email_idx").on(table.email),
  index("users_role_id_idx").on(table.roleId),
  index("users_pt_id_idx").on(table.ptId),
  index("users_branch_id_idx").on(table.branchId),
  index("users_shift_id_idx").on(table.shiftId),
  index("users_active_status_idx").on(table.activeStatus),
  foreignKey({ columns: [table.supervisorId], foreignColumns: [table.id], name: "users_supervisor_id_fk" }),
]);

export const usersRelations = relations(usersTable, ({ one }) => ({
  role: one(rolesTable, { fields: [usersTable.roleId], references: [rolesTable.id] }),
  pt: one(ptsTable, { fields: [usersTable.ptId], references: [ptsTable.id] }),
  branch: one(branchesTable, { fields: [usersTable.branchId], references: [branchesTable.id] }),
  shift: one(shiftsTable, { fields: [usersTable.shiftId], references: [shiftsTable.id] }),
  supervisor: one(usersTable, { fields: [usersTable.supervisorId], references: [usersTable.id], relationName: "supervisor" }),
}));

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
