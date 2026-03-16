import { pgTable, serial, varchar, boolean, timestamp, integer, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rolesTable = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: varchar("description", { length: 255 }),
  activeStatus: boolean("active_status").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
});

export const permissionsTable = pgTable("permissions", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  activeStatus: boolean("active_status").notNull().default(true),
});

export const rolePermissionsTable = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => rolesTable.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id").notNull().references(() => permissionsTable.id, { onDelete: "cascade" }),
}, (table) => [
  uniqueIndex("role_permission_unique").on(table.roleId, table.permissionId),
]);

export const rolesRelations = relations(rolesTable, ({ many }) => ({
  rolePermissions: many(rolePermissionsTable),
}));

export const rolePermissionsRelations = relations(rolePermissionsTable, ({ one }) => ({
  role: one(rolesTable, { fields: [rolePermissionsTable.roleId], references: [rolesTable.id] }),
  permission: one(permissionsTable, { fields: [rolePermissionsTable.permissionId], references: [permissionsTable.id] }),
}));

export const insertRoleSchema = createInsertSchema(rolesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Role = typeof rolesTable.$inferSelect;

export const insertPermissionSchema = createInsertSchema(permissionsTable).omit({ id: true });
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type Permission = typeof permissionsTable.$inferSelect;

export const insertRolePermissionSchema = createInsertSchema(rolePermissionsTable).omit({ id: true });
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissionsTable.$inferSelect;
