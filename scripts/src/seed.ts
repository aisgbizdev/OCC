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

  const existingUsers = await db.select({ id: usersTable.id }).from(usersTable);
  const userCount = existingUsers.length;
  if (userCount >= 20) {
    console.log(`Database already seeded with ${userCount} users. Skipping.`);
    await pool.end();
    return;
  }
  if (userCount > 0) {
    console.log(`Found only ${userCount} users (old seed). Resetting and re-seeding...`);
    await pool.query(`
      TRUNCATE TABLE
        system_settings, audit_logs, notifications,
        kpi_snapshots, kpi_scores, handover_logs,
        chat_messages, chat_members, chats,
        message_acknowledgements, messages, announcements,
        task_comments, tasks, complaints, activity_logs,
        push_subscriptions, users, activity_types, shifts,
        branches, pts, role_permissions, permissions, roles
      CASCADE;
    `);
    console.log("Old data cleared. Re-seeding with full PT structure...");
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
      { name: "Superadmin", description: "Full system bypass access" },
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

  const ownerRole     = roles.find((r) => r.name === "Owner")!;
  const adminRole     = roles.find((r) => r.name === "Admin System")!;
  const chiefRole     = roles.find((r) => r.name === "Chief Dealing")!;
  const spvRole       = roles.find((r) => r.name === "SPV Dealing")!;
  const dealerRole    = roles.find((r) => r.name === "Dealer")!;
  const direksiRole   = roles.find((r) => r.name === "Direksi")!;
  const superadminRole = roles.find((r) => r.name === "Superadmin")!;

  const allPerms = permissions.map((p) => p.id);
  const ownerPerms   = allPerms.map((pid) => ({ roleId: ownerRole.id, permissionId: pid }));
  const adminPerms   = allPerms.map((pid) => ({ roleId: adminRole.id, permissionId: pid }));
  const chiefPerms   = permissions
    .filter((p) => !["system.settings", "master.manage"].includes(p.code))
    .map((p) => ({ roleId: chiefRole.id, permissionId: p.id }));
  const spvPerms     = permissions
    .filter((p) => ["dashboard.view","activity.create","activity.edit","task.create","task.edit","task.assign","complaint.create","complaint.edit","kpi.view_all","announcement.create","chat.create_group"].includes(p.code))
    .map((p) => ({ roleId: spvRole.id, permissionId: p.id }));
  const dealerPerms  = permissions
    .filter((p) => ["dashboard.view","activity.create","activity.edit","kpi.view_own"].includes(p.code))
    .map((p) => ({ roleId: dealerRole.id, permissionId: p.id }));
  const direksiPerms = permissions
    .filter((p) => ["dashboard.view","kpi.view_all"].includes(p.code))
    .map((p) => ({ roleId: direksiRole.id, permissionId: p.id }));

  await db.insert(rolePermissionsTable).values([
    ...ownerPerms, ...adminPerms, ...chiefPerms,
    ...spvPerms, ...dealerPerms, ...direksiPerms,
  ]);
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
      { name: "Pagi",  startTime: "07:00", endTime: "15:00" },
      { name: "Siang", startTime: "15:00", endTime: "23:00" },
      { name: "Malam", startTime: "23:00", endTime: "07:00" },
    ])
    .returning();
  console.log(`Created ${shifts.length} shifts`);

  const activityTypes = await db
    .insert(activityTypesTable)
    .values([
      { name: "Validasi Deposit",       category: "Transaksi",   weightPoints: "3" },
      { name: "Validasi Withdrawal",     category: "Transaksi",   weightPoints: "3" },
      { name: "Pembukaan Akun",          category: "Akun",        weightPoints: "5" },
      { name: "Verifikasi Dokumen",      category: "Akun",        weightPoints: "2" },
      { name: "Menangani Komplain",      category: "Support",     weightPoints: "4", noteRequired: true },
      { name: "Investigasi Transaksi",   category: "Support",     weightPoints: "6", noteRequired: true },
      { name: "Monitoring Sistem",       category: "Operasional", weightPoints: "1" },
    ])
    .returning();
  console.log(`Created ${activityTypes.length} activity types`);

  const pw = await bcryptjs.hash("password123", 10);

  // Helper to pick indices
  const sgb = pts[0]; const b0 = branches[0];
  const rfb = pts[1]; const b1 = branches[1];
  const kpf = pts[2]; const b2 = branches[2];
  const bpf = pts[3]; const b3 = branches[3];
  const ewf = pts[4]; const b4 = branches[4];
  const [pagi, siang, malam] = shifts;

  await db.insert(usersTable).values([
    // ── Korporat (tanpa PT spesifik) ──────────────────────────────────
    { name: "Super Admin",     email: "superadmin@occ.id",   passwordHash: pw, roleId: superadminRole.id, ptId: sgb.id, branchId: b0.id, shiftId: pagi.id, positionTitle: "Superadmin" },
    { name: "Admin Owner",     email: "owner@occ.id",        passwordHash: pw, roleId: ownerRole.id,      ptId: sgb.id, branchId: b0.id, shiftId: pagi.id, positionTitle: "Owner" },
    { name: "Direktur Utama",  email: "direksi@occ.id",      passwordHash: pw, roleId: direksiRole.id,    ptId: sgb.id, branchId: b0.id, shiftId: pagi.id, positionTitle: "Direktur Utama" },

    // ── SGB ────────────────────────────────────────────────────────────
    { name: "Budi Santoso",    email: "chief.sgb@occ.id",    passwordHash: pw, roleId: chiefRole.id,      ptId: sgb.id, branchId: b0.id, shiftId: pagi.id,  positionTitle: "Chief Dealing" },
    { name: "Andi Pratama",    email: "spv.sgb@occ.id",      passwordHash: pw, roleId: spvRole.id,        ptId: sgb.id, branchId: b0.id, shiftId: pagi.id,  positionTitle: "SPV Dealing" },
    { name: "Rina Kusuma",     email: "dealer1.sgb@occ.id",  passwordHash: pw, roleId: dealerRole.id,     ptId: sgb.id, branchId: b0.id, shiftId: pagi.id,  positionTitle: "Dealer", activeStatus: false },
    { name: "Dedi Hermawan",   email: "dealer2.sgb@occ.id",  passwordHash: pw, roleId: dealerRole.id,     ptId: sgb.id, branchId: b0.id, shiftId: siang.id, positionTitle: "Dealer" },
    { name: "Sinta Dewi",      email: "dealer3.sgb@occ.id",  passwordHash: pw, roleId: dealerRole.id,     ptId: sgb.id, branchId: b0.id, shiftId: malam.id, positionTitle: "Dealer" },
    { name: "Ahmad Fauzi",     email: "admin.sgb@occ.id",    passwordHash: pw, roleId: adminRole.id,      ptId: sgb.id, branchId: b0.id, shiftId: pagi.id,  positionTitle: "Admin System" },

    // ── RFB ────────────────────────────────────────────────────────────
    { name: "Hendra Wijaya",   email: "chief.rfb@occ.id",    passwordHash: pw, roleId: chiefRole.id,      ptId: rfb.id, branchId: b1.id, shiftId: pagi.id,  positionTitle: "Chief Dealing" },
    { name: "Dewi Lestari",    email: "spv.rfb@occ.id",      passwordHash: pw, roleId: spvRole.id,        ptId: rfb.id, branchId: b1.id, shiftId: pagi.id,  positionTitle: "SPV Dealing" },
    { name: "Reza Aditya",     email: "dealer1.rfb@occ.id",  passwordHash: pw, roleId: dealerRole.id,     ptId: rfb.id, branchId: b1.id, shiftId: pagi.id,  positionTitle: "Dealer" },
    { name: "Maya Indah",      email: "dealer2.rfb@occ.id",  passwordHash: pw, roleId: dealerRole.id,     ptId: rfb.id, branchId: b1.id, shiftId: siang.id, positionTitle: "Dealer" },
    { name: "Fitri Handayani", email: "admin.rfb@occ.id",    passwordHash: pw, roleId: adminRole.id,      ptId: rfb.id, branchId: b1.id, shiftId: pagi.id,  positionTitle: "Admin System" },

    // ── KPF ────────────────────────────────────────────────────────────
    { name: "Agus Suryanto",   email: "chief.kpf@occ.id",    passwordHash: pw, roleId: chiefRole.id,      ptId: kpf.id, branchId: b2.id, shiftId: pagi.id,  positionTitle: "Chief Dealing" },
    { name: "Nita Rahayu",     email: "spv.kpf@occ.id",      passwordHash: pw, roleId: spvRole.id,        ptId: kpf.id, branchId: b2.id, shiftId: pagi.id,  positionTitle: "SPV Dealing" },
    { name: "Fajar Nugraha",   email: "dealer1.kpf@occ.id",  passwordHash: pw, roleId: dealerRole.id,     ptId: kpf.id, branchId: b2.id, shiftId: pagi.id,  positionTitle: "Dealer" },
    { name: "Indah Permata",   email: "dealer2.kpf@occ.id",  passwordHash: pw, roleId: dealerRole.id,     ptId: kpf.id, branchId: b2.id, shiftId: siang.id, positionTitle: "Dealer" },
    { name: "Toni Saputra",    email: "admin.kpf@occ.id",    passwordHash: pw, roleId: adminRole.id,      ptId: kpf.id, branchId: b2.id, shiftId: pagi.id,  positionTitle: "Admin System" },

    // ── BPF ────────────────────────────────────────────────────────────
    { name: "Rizki Permana",   email: "chief.bpf@occ.id",    passwordHash: pw, roleId: chiefRole.id,      ptId: bpf.id, branchId: b3.id, shiftId: pagi.id,  positionTitle: "Chief Dealing" },
    { name: "Yuni Sari",       email: "spv.bpf@occ.id",      passwordHash: pw, roleId: spvRole.id,        ptId: bpf.id, branchId: b3.id, shiftId: pagi.id,  positionTitle: "SPV Dealing" },
    { name: "Galih Prakoso",   email: "dealer1.bpf@occ.id",  passwordHash: pw, roleId: dealerRole.id,     ptId: bpf.id, branchId: b3.id, shiftId: pagi.id,  positionTitle: "Dealer" },
    { name: "Putri Amalia",    email: "dealer2.bpf@occ.id",  passwordHash: pw, roleId: dealerRole.id,     ptId: bpf.id, branchId: b3.id, shiftId: siang.id, positionTitle: "Dealer" },
    { name: "Erwin Setiawan",  email: "admin.bpf@occ.id",    passwordHash: pw, roleId: adminRole.id,      ptId: bpf.id, branchId: b3.id, shiftId: pagi.id,  positionTitle: "Admin System" },

    // ── EWF ────────────────────────────────────────────────────────────
    { name: "Denny Kusuma",    email: "chief.ewf@occ.id",    passwordHash: pw, roleId: chiefRole.id,      ptId: ewf.id, branchId: b4.id, shiftId: pagi.id,  positionTitle: "Chief Dealing" },
    { name: "Sari Wulandari",  email: "spv.ewf@occ.id",      passwordHash: pw, roleId: spvRole.id,        ptId: ewf.id, branchId: b4.id, shiftId: pagi.id,  positionTitle: "SPV Dealing" },
    { name: "Bayu Setiabudi",  email: "dealer1.ewf@occ.id",  passwordHash: pw, roleId: dealerRole.id,     ptId: ewf.id, branchId: b4.id, shiftId: pagi.id,  positionTitle: "Dealer" },
    { name: "Ayu Ratnasari",   email: "dealer2.ewf@occ.id",  passwordHash: pw, roleId: dealerRole.id,     ptId: ewf.id, branchId: b4.id, shiftId: siang.id, positionTitle: "Dealer" },
    { name: "Widi Hartono",    email: "admin.ewf@occ.id",    passwordHash: pw, roleId: adminRole.id,      ptId: ewf.id, branchId: b4.id, shiftId: pagi.id,  positionTitle: "Admin System" },
  ]);
  console.log("Created 28 users (3 corporate + 5 per PT × 5 PTs)");

  await db.insert(systemSettingsTable).values([
    { settingKey: "daily_target_points",         settingValue: "40", description: "Daily KPI target points per dealer" },
    { settingKey: "inactivity_warning_hours",    settingValue: "2",  description: "Hours without activity before warning" },
    { settingKey: "inactivity_critical_hours",   settingValue: "4",  description: "Hours without activity before critical alert" },
    { settingKey: "activity_edit_window_minutes", settingValue: "60", description: "Minutes allowed to edit activity after creation" },
    { settingKey: "complaint_sla_warning_hours", settingValue: "24", description: "Hours before complaint SLA warning" },
    { settingKey: "complaint_sla_critical_hours",settingValue: "72", description: "Hours before complaint SLA critical" },
  ]);
  console.log("Created system settings");

  console.log("\nSeed complete! 28 demo accounts (password: password123)");
  console.log("Corporate: superadmin@occ.id | owner@occ.id | direksi@occ.id");
  console.log("Per PT: chief.sgb@occ.id, spv.sgb@occ.id, dealer2.sgb@occ.id, admin.sgb@occ.id");
  console.log("(Replace .sgb with .rfb / .kpf / .bpf / .ewf for other PTs)");

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
