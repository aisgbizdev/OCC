import { db, pool } from "@workspace/db";
import {
  rolesTable,
  permissionsTable,
  rolePermissionsTable,
  ptsTable,
  branchesTable,
  shiftsTable,
  activityTypesTable,
  usersTable,
  systemSettingsTable,
} from "@workspace/db/schema";
import bcryptjs from "bcryptjs";

async function seed() {
  console.log("Seeding OCC database...");

  const existingRoles = await db.select().from(rolesTable).limit(1);
  if (existingRoles.length > 0) {
    console.log("Database already seeded. Skipping. (Drop tables first to re-seed.)");
    await pool.end();
    return;
  }

  const roles = await db
    .insert(rolesTable)
    .values([
      { name: "Owner", description: "Full access to entire system" },
      { name: "Direksi", description: "View dashboards and PT performance" },
      { name: "Chief Dealing", description: "Manage team, assign tasks, view KPI" },
      { name: "SPV Dealing", description: "Monitor shift, assign tasks, create complaints" },
      { name: "Dealer", description: "Log activities, update tasks, view personal KPI" },
      { name: "Admin System", description: "Manage system configuration and master data" },
    ])
    .returning();
  console.log(`Created ${roles.length} roles`);

  const permissions = await db
    .insert(permissionsTable)
    .values([
      { code: "dashboard.view", name: "View Dashboard" },
      { code: "activity.create", name: "Create Activity" },
      { code: "activity.edit", name: "Edit Activity" },
      { code: "activity.delete", name: "Delete Activity" },
      { code: "task.create", name: "Create Task" },
      { code: "task.edit", name: "Edit Task" },
      { code: "task.assign", name: "Assign Task" },
      { code: "complaint.create", name: "Create Complaint" },
      { code: "complaint.edit", name: "Edit Complaint" },
      { code: "user.manage", name: "Manage Users" },
      { code: "master.manage", name: "Manage Master Data" },
      { code: "kpi.view_all", name: "View All KPI" },
      { code: "kpi.view_own", name: "View Own KPI" },
      { code: "announcement.create", name: "Create Announcement" },
      { code: "chat.create_group", name: "Create Group Chat" },
      { code: "system.settings", name: "Manage System Settings" },
    ])
    .returning();
  console.log(`Created ${permissions.length} permissions`);

  const ownerRole = roles.find((r) => r.name === "Owner")!;
  const adminRole = roles.find((r) => r.name === "Admin System")!;
  const chiefRole = roles.find((r) => r.name === "Chief Dealing")!;
  const spvRole = roles.find((r) => r.name === "SPV Dealing")!;
  const dealerRole = roles.find((r) => r.name === "Dealer")!;
  const direksiRole = roles.find((r) => r.name === "Direksi")!;

  const allPerms = permissions.map((p) => p.id);
  const ownerPerms = allPerms.map((pid) => ({ roleId: ownerRole.id, permissionId: pid }));
  const adminPerms = allPerms.map((pid) => ({ roleId: adminRole.id, permissionId: pid }));
  const chiefPerms = permissions
    .filter((p) => !["system.settings", "master.manage"].includes(p.code))
    .map((p) => ({ roleId: chiefRole.id, permissionId: p.id }));
  const spvPerms = permissions
    .filter((p) => ["dashboard.view", "activity.create", "activity.edit", "task.create", "task.edit", "task.assign", "complaint.create", "complaint.edit", "kpi.view_all", "announcement.create", "chat.create_group"].includes(p.code))
    .map((p) => ({ roleId: spvRole.id, permissionId: p.id }));
  const dealerPerms = permissions
    .filter((p) => ["dashboard.view", "activity.create", "activity.edit", "kpi.view_own"].includes(p.code))
    .map((p) => ({ roleId: dealerRole.id, permissionId: p.id }));
  const direksiPerms = permissions
    .filter((p) => ["dashboard.view", "kpi.view_all"].includes(p.code))
    .map((p) => ({ roleId: direksiRole.id, permissionId: p.id }));

  await db.insert(rolePermissionsTable).values([...ownerPerms, ...adminPerms, ...chiefPerms, ...spvPerms, ...dealerPerms, ...direksiPerms]);
  console.log("Role permissions assigned");

  const pts = await db
    .insert(ptsTable)
    .values([
      { code: "SGB", name: "PT Solid Gold Berjangka" },
      { code: "RFB", name: "PT Rifan Financindo Berjangka" },
      { code: "KPF", name: "PT Kontak Perkasa Futures" },
      { code: "BPF", name: "PT Bestprofit Futures" },
      { code: "EWF", name: "PT Equityworld Futures" },
    ])
    .returning();
  console.log(`Created ${pts.length} PTs`);

  const branches = await db
    .insert(branchesTable)
    .values([
      { ptId: pts[0].id, name: "Pusat Jakarta", city: "Jakarta" },
      { ptId: pts[1].id, name: "Pusat Jakarta", city: "Jakarta" },
      { ptId: pts[2].id, name: "Pusat Jakarta", city: "Jakarta" },
      { ptId: pts[3].id, name: "Pusat Jakarta", city: "Jakarta" },
      { ptId: pts[4].id, name: "Pusat Jakarta", city: "Jakarta" },
    ])
    .returning();
  console.log(`Created ${branches.length} branches`);

  const shifts = await db
    .insert(shiftsTable)
    .values([
      { name: "Pagi", startTime: "07:00", endTime: "15:00" },
      { name: "Siang", startTime: "15:00", endTime: "23:00" },
      { name: "Malam", startTime: "23:00", endTime: "07:00" },
    ])
    .returning();
  console.log(`Created ${shifts.length} shifts`);

  const activityTypes = await db
    .insert(activityTypesTable)
    .values([
      { name: "Validasi Deposit", category: "Transaksi", weightPoints: "3" },
      { name: "Validasi Withdrawal", category: "Transaksi", weightPoints: "3" },
      { name: "Pembukaan Akun", category: "Akun", weightPoints: "5" },
      { name: "Verifikasi Dokumen", category: "Akun", weightPoints: "2" },
      { name: "Menangani Komplain", category: "Support", weightPoints: "4", noteRequired: true },
      { name: "Investigasi Transaksi", category: "Support", weightPoints: "6", noteRequired: true },
      { name: "Monitoring Sistem", category: "Operasional", weightPoints: "1" },
    ])
    .returning();
  console.log(`Created ${activityTypes.length} activity types`);

  const passwordHash = await bcryptjs.hash("password123", 10);

  await db.insert(usersTable).values([
    { name: "Admin Owner", email: "owner@occ.id", passwordHash, roleId: ownerRole.id, ptId: pts[0].id, branchId: branches[0].id, shiftId: shifts[0].id, positionTitle: "Owner" },
    { name: "Direktur Utama", email: "direksi@occ.id", passwordHash, roleId: direksiRole.id, ptId: pts[0].id, branchId: branches[0].id, shiftId: shifts[0].id, positionTitle: "Direktur Utama" },
    { name: "Budi Chief Dealing", email: "chief@occ.id", passwordHash, roleId: chiefRole.id, ptId: pts[0].id, branchId: branches[0].id, shiftId: shifts[0].id, positionTitle: "Chief Dealing" },
    { name: "Andi SPV Pagi", email: "spv@occ.id", passwordHash, roleId: spvRole.id, ptId: pts[0].id, branchId: branches[0].id, shiftId: shifts[0].id, positionTitle: "SPV Dealing" },
    { name: "Rina Dealer", email: "dealer1@occ.id", passwordHash, roleId: dealerRole.id, ptId: pts[0].id, branchId: branches[0].id, shiftId: shifts[0].id, positionTitle: "Dealer" },
    { name: "Dedi Dealer", email: "dealer2@occ.id", passwordHash, roleId: dealerRole.id, ptId: pts[0].id, branchId: branches[0].id, shiftId: shifts[1].id, positionTitle: "Dealer" },
    { name: "Sinta Dealer", email: "dealer3@occ.id", passwordHash, roleId: dealerRole.id, ptId: pts[1].id, branchId: branches[1].id, shiftId: shifts[0].id, positionTitle: "Dealer" },
    { name: "System Admin", email: "admin@occ.id", passwordHash, roleId: adminRole.id, ptId: pts[0].id, branchId: branches[0].id, shiftId: shifts[0].id, positionTitle: "System Administrator" },
  ]);
  console.log("Created 8 sample users");

  await db.insert(systemSettingsTable).values([
    { settingKey: "daily_target_points", settingValue: "40", description: "Daily KPI target points per dealer" },
    { settingKey: "inactivity_warning_hours", settingValue: "2", description: "Hours without activity before warning" },
    { settingKey: "inactivity_critical_hours", settingValue: "4", description: "Hours without activity before critical alert" },
    { settingKey: "activity_edit_window_minutes", settingValue: "60", description: "Minutes allowed to edit activity after creation" },
    { settingKey: "complaint_sla_warning_hours", settingValue: "24", description: "Hours before complaint SLA warning" },
    { settingKey: "complaint_sla_critical_hours", settingValue: "72", description: "Hours before complaint SLA critical" },
  ]);
  console.log("Created system settings");

  console.log("\nSeed complete!");
  console.log("Demo accounts (all password: password123):");
  console.log("  owner@occ.id     - Owner");
  console.log("  direksi@occ.id   - Direksi");
  console.log("  chief@occ.id     - Chief Dealing");
  console.log("  spv@occ.id       - SPV Dealing");
  console.log("  dealer1@occ.id   - Dealer");
  console.log("  admin@occ.id     - Admin System");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
