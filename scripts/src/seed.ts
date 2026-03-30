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
  qualityErrorTypesTable,
} from "@workspace/db/schema";
import bcryptjs from "bcryptjs";

// Seed version marker — update this email whenever the seed data changes
// to force a reseed on any environment that still has the old data.
const SEED_MARKER_EMAIL = "kiki@occ.id.v22-spv-hq";

async function seed() {
  console.log("Seeding OCC database...");

  // ── Guard: check for seed-version marker ─────────────────────────────────
  // Uses raw SQL so drizzle-orm import is not needed here.
  // Wrapped in try/catch for fresh DBs where the table doesn't exist yet.
  let skipMainSeed = false;
  try {
    const { rows: markerRows } = await pool.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [SEED_MARKER_EMAIL]
    );
    if (markerRows.length > 0) {
      console.log(`Database already up-to-date (marker '${SEED_MARKER_EMAIL}' found). Skipping main seed.`);
      skipMainSeed = true;
    }
  } catch {
    console.log("Fresh database detected. Proceeding with seed...");
  }

  // ── Main seed (users, roles, PTs, etc.) ──────────────────────────────────
  if (!skipMainSeed) {
    const existingUsers = await db.select({ id: usersTable.id }).from(usersTable);
    if (existingUsers.length > 0) {
      console.log(`Found ${existingUsers.length} outdated users. Resetting and re-seeding...`);
      await pool.query(`
        TRUNCATE TABLE
          quality_records, quality_error_types,
          system_settings, audit_logs, notifications,
          kpi_snapshots, kpi_scores, handover_logs,
          chat_messages, chat_members, chats,
          message_acknowledgements, messages, announcements,
          task_comments, tasks, complaints, activity_logs,
          push_subscriptions, users, activity_types, shifts,
          branches, pts, role_permissions, permissions, roles
        CASCADE;
      `);
      console.log("Old data cleared. Re-seeding with updated structure...");
    }

    const roles = await db
      .insert(rolesTable)
      .values([
        { name: "Owner",           description: "Full access to entire system" },
        { name: "Direksi",         description: "View dashboards and PT performance" },
        { name: "Chief Dealing",   description: "Manage all PT teams, assign tasks, view KPI all PT" },
        { name: "SPV Dealing",     description: "Monitor shift, assign tasks, create complaints" },
        { name: "Co-SPV Dealing",  description: "Assist all SPVs cross-PT, no PT restriction" },
        { name: "Dealer",          description: "Log activities, update tasks, view personal KPI" },
        { name: "Admin System",    description: "Manage system configuration and master data" },
        { name: "Superadmin",      description: "Full system bypass access" },
      ])
      .returning();
    console.log(`Created ${roles.length} roles`);

    const permissions = await db
      .insert(permissionsTable)
      .values([
        { code: "dashboard.view",        name: "View Dashboard" },
        { code: "activity.create",       name: "Create Activity" },
        { code: "activity.edit",         name: "Edit Activity" },
        { code: "activity.delete",       name: "Delete Activity" },
        { code: "task.create",           name: "Create Task" },
        { code: "task.edit",             name: "Edit Task" },
        { code: "task.assign",           name: "Assign Task" },
        { code: "complaint.create",      name: "Create Complaint" },
        { code: "complaint.edit",        name: "Edit Complaint" },
        { code: "user.manage",           name: "Manage Users" },
        { code: "master.manage",         name: "Manage Master Data" },
        { code: "kpi.view_all",          name: "View All KPI" },
        { code: "kpi.view_own",          name: "View Own KPI" },
        { code: "announcement.create",   name: "Create Announcement" },
        { code: "chat.create_group",     name: "Create Group Chat" },
        { code: "system.settings",       name: "Manage System Settings" },
      ])
      .returning();
    console.log(`Created ${permissions.length} permissions`);

    const ownerRole      = roles.find((r) => r.name === "Owner")!;
    const adminRole      = roles.find((r) => r.name === "Admin System")!;
    const chiefRole      = roles.find((r) => r.name === "Chief Dealing")!;
    const spvRole        = roles.find((r) => r.name === "SPV Dealing")!;
    const coSpvRole      = roles.find((r) => r.name === "Co-SPV Dealing")!;
    const dealerRole     = roles.find((r) => r.name === "Dealer")!;
    const direksiRole    = roles.find((r) => r.name === "Direksi")!;
    const superadminRole = roles.find((r) => r.name === "Superadmin")!;

    const allPerms     = permissions.map((p) => p.id);
    const ownerPerms   = allPerms.map((pid) => ({ roleId: ownerRole.id, permissionId: pid }));
    const adminPerms   = allPerms.map((pid) => ({ roleId: adminRole.id, permissionId: pid }));
    const chiefPerms   = permissions
      .filter((p) => !["system.settings", "master.manage"].includes(p.code))
      .map((p) => ({ roleId: chiefRole.id, permissionId: p.id }));
    const spvPerms     = permissions
      .filter((p) => ["dashboard.view","activity.create","activity.edit","task.create","task.edit","task.assign","complaint.create","complaint.edit","kpi.view_all","announcement.create","chat.create_group"].includes(p.code))
      .map((p) => ({ roleId: spvRole.id, permissionId: p.id }));
    const coSpvPerms   = permissions
      .filter((p) => ["dashboard.view","activity.create","activity.edit","task.create","task.edit","task.assign","complaint.create","complaint.edit","kpi.view_all","announcement.create","chat.create_group"].includes(p.code))
      .map((p) => ({ roleId: coSpvRole.id, permissionId: p.id }));
    const dealerPerms  = permissions
      .filter((p) => ["dashboard.view","activity.create","activity.edit","kpi.view_own"].includes(p.code))
      .map((p) => ({ roleId: dealerRole.id, permissionId: p.id }));
    const direksiPerms = permissions
      .filter((p) => ["dashboard.view","kpi.view_all"].includes(p.code))
      .map((p) => ({ roleId: direksiRole.id, permissionId: p.id }));

    await db.insert(rolePermissionsTable).values([
      ...ownerPerms, ...adminPerms, ...chiefPerms,
      ...spvPerms, ...coSpvPerms, ...dealerPerms, ...direksiPerms,
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
        // SGB — 5 cabang
        { ptId: pts[0].id, name: "BALI",       city: "Bali"       },
        { ptId: pts[0].id, name: "MAKASSAR",   city: "Makassar"   },
        { ptId: pts[0].id, name: "PALEMBANG",  city: "Palembang"  },
        { ptId: pts[0].id, name: "SEMARANG",   city: "Semarang"   },
        { ptId: pts[0].id, name: "TCC",        city: "Jakarta"    },
        // RFB — 14 cabang
        { ptId: pts[1].id, name: "AXA",        city: "Jakarta"    },
        { ptId: pts[1].id, name: "AXA 2",      city: "Jakarta"    },
        { ptId: pts[1].id, name: "AXA 3",      city: "Jakarta"    },
        { ptId: pts[1].id, name: "BALIKPAPAN", city: "Balikpapan" },
        { ptId: pts[1].id, name: "BANDUNG",    city: "Bandung"    },
        { ptId: pts[1].id, name: "DBS",        city: "Jakarta"    },
        { ptId: pts[1].id, name: "JOGYA",      city: "Yogyakarta" },
        { ptId: pts[1].id, name: "MEDAN",      city: "Medan"      },
        { ptId: pts[1].id, name: "PALEMBANG",  city: "Palembang"  },
        { ptId: pts[1].id, name: "PEKANBARU",  city: "Pekanbaru"  },
        { ptId: pts[1].id, name: "SEMARANG",   city: "Semarang"   },
        { ptId: pts[1].id, name: "SOLO",       city: "Solo"       },
        { ptId: pts[1].id, name: "SURABAYA",   city: "Surabaya"   },
        { ptId: pts[1].id, name: "SURABAYA 7", city: "Surabaya"   },
        // KPF — 7 cabang
        { ptId: pts[2].id, name: "BALI",       city: "Bali"       },
        { ptId: pts[2].id, name: "BANDUNG",    city: "Bandung"    },
        { ptId: pts[2].id, name: "JOGYA",      city: "Yogyakarta" },
        { ptId: pts[2].id, name: "MAKASSAR",   city: "Makassar"   },
        { ptId: pts[2].id, name: "MAREIN",     city: "Jakarta"    },
        { ptId: pts[2].id, name: "SEMARANG",   city: "Semarang"   },
        { ptId: pts[2].id, name: "SURABAYA",   city: "Surabaya"   },
        // BPF — 11 cabang
        { ptId: pts[3].id, name: "BANDUNG",    city: "Bandung"    },
        { ptId: pts[3].id, name: "BANJARMASIN",city: "Banjarmasin"},
        { ptId: pts[3].id, name: "ET",         city: "Jakarta"    },
        { ptId: pts[3].id, name: "JAMBI",      city: "Jambi"      },
        { ptId: pts[3].id, name: "LAMPUNG",    city: "Lampung"    },
        { ptId: pts[3].id, name: "MEDAN",      city: "Medan"      },
        { ptId: pts[3].id, name: "MLNG",       city: "Malang"     },
        { ptId: pts[3].id, name: "PEKANBARU",  city: "Pekanbaru"  },
        { ptId: pts[3].id, name: "PONTK",      city: "Pontianak"  },
        { ptId: pts[3].id, name: "SEMARANG",   city: "Semarang"   },
        { ptId: pts[3].id, name: "SURABAYA",   city: "Surabaya"   },
        // EWF — 9 cabang
        { ptId: pts[4].id, name: "CIREBON",              city: "Cirebon"  },
        { ptId: pts[4].id, name: "CYBER",                city: "Jakarta"  },
        { ptId: pts[4].id, name: "MEDAN",                city: "Medan"    },
        { ptId: pts[4].id, name: "MNDO",                 city: "Manado"   },
        { ptId: pts[4].id, name: "SBY2",                 city: "Surabaya" },
        { ptId: pts[4].id, name: "SMG3",                 city: "Semarang" },
        { ptId: pts[4].id, name: "SSC",                  city: "Jakarta"  },
        { ptId: pts[4].id, name: "SURABAYA 6 (EWF) (ALBET)",  city: "Surabaya" },
        { ptId: pts[4].id, name: "SURABAYA 6 (EWF) (M NAIM)", city: "Surabaya" },
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

    // ── Activity Types: 11 jenis sesuai job desk asli Divisi Operational ──
    const activityTypes = await db
      .insert(activityTypesTable)
      .values([
        // Dealer / Staff — aktivitas harian wajib
        { name: "Aktivasi Account",                      category: "Akun",        weightPoints: "4"                },
        { name: "Cek Dana Masuk (Deposit)",               category: "Transaksi",   weightPoints: "3"                },
        { name: "Cek Withdrawal",                         category: "Transaksi",   weightPoints: "3"                },
        { name: "Cek Dana Masuk New Account / Top Up",    category: "Transaksi",   weightPoints: "3"                },
        { name: "Input Client Bank & New Account",        category: "Akun",        weightPoints: "2"                },
        { name: "Pengiriman Statement Nasabah",           category: "Operasional", weightPoints: "2"                },
        { name: "Rekap Kebutuhan Barang Printing",        category: "Operasional", weightPoints: "2"                },
        { name: "Rekap OR / Kebutuhan Operasional Cabang", category: "Operasional", weightPoints: "2"               },
        { name: "Laporan Logbook / Serah Terima",         category: "Operasional", weightPoints: "2", noteRequired: true },
        // Tugas tambahan / occasional
        { name: "Pengumpulan Data Audit",                 category: "Support",     weightPoints: "3", noteRequired: true },
        { name: "Mencari Data Account",                   category: "Support",     weightPoints: "2"                },
        // SPV — semua PT
        { name: "Komoditi Statement & Report",            category: "Transaksi",   weightPoints: "4"                },
        { name: "Report Daily All PT",                    category: "Operasional", weightPoints: "3", noteRequired: true },
        { name: "Prodem Monthly / Quarterly",             category: "Operasional", weightPoints: "4", noteRequired: true },
        // Semua role
        { name: "Menangani Komplain",                     category: "Support",     weightPoints: "4", noteRequired: true },
        { name: "Investigasi Transaksi",                  category: "Support",     weightPoints: "6", noteRequired: true },
        // Error — dicatat oleh SPV untuk anggota
        { name: "Koreksi Entri Data",                     category: "Error",       weightPoints: "0", noteRequired: true },
        { name: "Kesalahan Prosedur SOP",                 category: "Error",       weightPoints: "0", noteRequired: true },
        { name: "Kesalahan Pelaporan",                    category: "Error",       weightPoints: "0", noteRequired: true },
      ])
      .returning();
    console.log(`Created ${activityTypes.length} activity types`);

    const pw = await bcryptjs.hash("password123", 10);

    const sgb = pts[0];
    const rfb = pts[1];
    const kpf = pts[2];
    const bpf = pts[3];
    const ewf = pts[4];

    // Pick first branch for each PT by scoping on ptId — robust against insertion-order changes
    const firstBranchByPtId = new Map(
      [sgb, rfb, kpf, bpf, ewf].map((pt) => [
        pt.id,
        branches.find((b) => b.ptId === pt.id)!,
      ])
    );
    const b0 = firstBranchByPtId.get(sgb.id)!;
    const b1 = firstBranchByPtId.get(rfb.id)!;
    const b2 = firstBranchByPtId.get(kpf.id)!;
    const b3 = firstBranchByPtId.get(bpf.id)!;
    const b4 = firstBranchByPtId.get(ewf.id)!;
    const [pagi, siang, malam] = shifts;

    await db.insert(usersTable).values([
      // ── Korporat / Lintas-PT (tanpa PT spesifik) ──────────────────────
      { name: "Super Admin",           email: "superadmin@occ.id",          passwordHash: pw, roleId: superadminRole.id, ptId: null,   branchId: null,   shiftId: pagi.id,  positionTitle: "Superadmin" },
      { name: "Admin Owner",           email: "owner@occ.id",               passwordHash: pw, roleId: ownerRole.id,      ptId: null,   branchId: null,   shiftId: pagi.id,  positionTitle: "Owner" },
      { name: "Kiki",                  email: "kiki@occ.id.v22-spv-hq",     passwordHash: pw, roleId: chiefRole.id,      ptId: null,   branchId: null,   shiftId: pagi.id,  positionTitle: "Chief Dealing" },
      { name: "Amel",                  email: "amel.sgb@occ.id",            passwordHash: pw, roleId: coSpvRole.id,      ptId: null,   branchId: null,   shiftId: siang.id, positionTitle: "Co-SPV Dealing" },

      // ── SGB — Direktur & Tim Operasional ──────────────────────────────
      { name: "Iriawan Widadi",        email: "du_sgb@occ.id",              passwordHash: pw, roleId: direksiRole.id,    ptId: sgb.id, branchId: b0.id,  shiftId: pagi.id,  positionTitle: "Direktur Utama" },
      { name: "Ahmad Fauzi",           email: "dk_sgb@occ.id",              passwordHash: pw, roleId: direksiRole.id,    ptId: sgb.id, branchId: b0.id,  shiftId: pagi.id,  positionTitle: "Direktur Kepatuhan" },
      { name: "Eko",                   email: "eko.sgb@occ.id",             passwordHash: pw, roleId: spvRole.id,        ptId: null,   branchId: null,   shiftId: pagi.id,  positionTitle: "SPV Dealing" },
      { name: "Fahrul",                email: "fahrul.sgb@occ.id",          passwordHash: pw, roleId: spvRole.id,        ptId: null,   branchId: null,   shiftId: malam.id, positionTitle: "SPV Dealing" },
      { name: "Adid",                  email: "adid.sgb@occ.id",            passwordHash: pw, roleId: spvRole.id,        ptId: null,   branchId: null,   shiftId: malam.id, positionTitle: "SPV Dealing" },
      { name: "Abdul Aziz",            email: "aziz.sgb@occ.id",            passwordHash: pw, roleId: dealerRole.id,     ptId: sgb.id, branchId: b0.id,  shiftId: pagi.id,  positionTitle: "Dealer" },
      { name: "Budi Santoso",          email: "dealer.sgb@occ.id",          passwordHash: pw, roleId: dealerRole.id,     ptId: sgb.id, branchId: b0.id,  shiftId: malam.id, positionTitle: "Dealer" },
      { name: "Siti Nuraini",          email: "admin.sgb@occ.id",           passwordHash: pw, roleId: adminRole.id,      ptId: sgb.id, branchId: b0.id,  shiftId: pagi.id,  positionTitle: "Admin System" },

      // ── RFB ────────────────────────────────────────────────────────────
      { name: "Riyan Kurniawan",       email: "du_rfb@occ.id",              passwordHash: pw, roleId: direksiRole.id,    ptId: rfb.id, branchId: b1.id,  shiftId: pagi.id,  positionTitle: "Direktur Utama" },
      { name: "Mega Helia Purnama Putri", email: "dk_rfb@occ.id",           passwordHash: pw, roleId: direksiRole.id,    ptId: rfb.id, branchId: b1.id,  shiftId: pagi.id,  positionTitle: "Direktur Kepatuhan" },
      { name: "Reza Aditya",           email: "dealer1.rfb@occ.id",         passwordHash: pw, roleId: dealerRole.id,     ptId: rfb.id, branchId: b1.id,  shiftId: pagi.id,  positionTitle: "Dealer" },
      { name: "Maya Indah",            email: "dealer2.rfb@occ.id",         passwordHash: pw, roleId: dealerRole.id,     ptId: rfb.id, branchId: b1.id,  shiftId: siang.id, positionTitle: "Dealer" },
      { name: "Fitri Handayani",       email: "admin.rfb@occ.id",           passwordHash: pw, roleId: adminRole.id,      ptId: rfb.id, branchId: b1.id,  shiftId: pagi.id,  positionTitle: "Admin System" },

      // ── KPF ────────────────────────────────────────────────────────────
      { name: "Lukman Wahyudin",       email: "du_kpf@occ.id",              passwordHash: pw, roleId: direksiRole.id,    ptId: kpf.id, branchId: b2.id,  shiftId: pagi.id,  positionTitle: "Direktur Utama" },
      { name: "Egi Ramadian NP",       email: "dk_kpf@occ.id",              passwordHash: pw, roleId: direksiRole.id,    ptId: kpf.id, branchId: b2.id,  shiftId: pagi.id,  positionTitle: "Direktur Kepatuhan" },
      { name: "Fajar Nugraha",         email: "dealer1.kpf@occ.id",         passwordHash: pw, roleId: dealerRole.id,     ptId: kpf.id, branchId: b2.id,  shiftId: pagi.id,  positionTitle: "Dealer" },
      { name: "Indah Permata",         email: "dealer2.kpf@occ.id",         passwordHash: pw, roleId: dealerRole.id,     ptId: kpf.id, branchId: b2.id,  shiftId: siang.id, positionTitle: "Dealer" },
      { name: "Toni Saputra",          email: "admin.kpf@occ.id",           passwordHash: pw, roleId: adminRole.id,      ptId: kpf.id, branchId: b2.id,  shiftId: pagi.id,  positionTitle: "Admin System" },

      // ── BPF ────────────────────────────────────────────────────────────
      { name: "Nurwanto",              email: "du_bpf@occ.id",              passwordHash: pw, roleId: direksiRole.id,    ptId: bpf.id, branchId: b3.id,  shiftId: pagi.id,  positionTitle: "Direktur Utama" },
      { name: "Akhmad Royani",         email: "dk_bpf@occ.id",              passwordHash: pw, roleId: direksiRole.id,    ptId: bpf.id, branchId: b3.id,  shiftId: pagi.id,  positionTitle: "Direktur Kepatuhan" },
      { name: "Galih Prakoso",         email: "dealer1.bpf@occ.id",         passwordHash: pw, roleId: dealerRole.id,     ptId: bpf.id, branchId: b3.id,  shiftId: pagi.id,  positionTitle: "Dealer" },
      { name: "Putri Amalia",          email: "dealer2.bpf@occ.id",         passwordHash: pw, roleId: dealerRole.id,     ptId: bpf.id, branchId: b3.id,  shiftId: siang.id, positionTitle: "Dealer" },
      { name: "Erwin Setiawan",        email: "admin.bpf@occ.id",           passwordHash: pw, roleId: adminRole.id,      ptId: bpf.id, branchId: b3.id,  shiftId: pagi.id,  positionTitle: "Admin System" },

      // ── EWF ────────────────────────────────────────────────────────────
      { name: "Agus Wijayanto",        email: "du_ewf@occ.id",              passwordHash: pw, roleId: direksiRole.id,    ptId: ewf.id, branchId: b4.id,  shiftId: pagi.id,  positionTitle: "Direktur Utama" },
      { name: "Fadly Khairuzzadhi, M.H.", email: "dk_ewf@occ.id",           passwordHash: pw, roleId: direksiRole.id,    ptId: ewf.id, branchId: b4.id,  shiftId: pagi.id,  positionTitle: "Direktur Kepatuhan" },
      { name: "Bayu Setiabudi",        email: "dealer1.ewf@occ.id",         passwordHash: pw, roleId: dealerRole.id,     ptId: ewf.id, branchId: b4.id,  shiftId: pagi.id,  positionTitle: "Dealer" },
      { name: "Ayu Ratnasari",         email: "dealer2.ewf@occ.id",         passwordHash: pw, roleId: dealerRole.id,     ptId: ewf.id, branchId: b4.id,  shiftId: siang.id, positionTitle: "Dealer" },
      { name: "Widi Hartono",          email: "admin.ewf@occ.id",           passwordHash: pw, roleId: adminRole.id,      ptId: ewf.id, branchId: b4.id,  shiftId: pagi.id,  positionTitle: "Admin System" },
    ]);
    console.log("Created 32 users (4 korporat + 3 SPV HQ + 5 SGB + 5×4 PT lain)");

    await db.insert(systemSettingsTable).values([
      { settingKey: "daily_target_points",          settingValue: "40", description: "Daily KPI target points per dealer" },
      { settingKey: "inactivity_warning_hours",     settingValue: "2",  description: "Hours without activity before warning" },
      { settingKey: "inactivity_critical_hours",    settingValue: "4",  description: "Hours without activity before critical alert" },
      { settingKey: "activity_edit_window_minutes", settingValue: "60", description: "Minutes allowed to edit activity after creation" },
      { settingKey: "complaint_sla_warning_hours",  settingValue: "24", description: "Hours before complaint SLA warning" },
      { settingKey: "complaint_sla_critical_hours", settingValue: "72", description: "Hours before complaint SLA critical" },
    ]);
    console.log("Created system settings");

    console.log("\n✓ Seed complete! 40 demo accounts (password: password123)");
    console.log("─── Korporat/Lintas-PT ────────────────────────────────────");
    console.log("  superadmin@occ.id | owner@occ.id | kiki@occ.id.v22-spv-hq | amel.sgb@occ.id");
    console.log("  eko.sgb@occ.id | fahrul.sgb@occ.id | adid.sgb@occ.id (SPV HQ, cross-PT)");
    console.log("─── SGB ───────────────────────────────────────────────────");
    console.log("  du_sgb@occ.id (Iriawan Widadi) | dk_sgb@occ.id (Ahmad Fauzi)");
    console.log("  eko.sgb / fahrul.sgb / adid.sgb | aziz.sgb / dealer.sgb | admin.sgb");
    console.log("─── RFB ───────────────────────────────────────────────────");
    console.log("  du_rfb@occ.id (Riyan Kurniawan) | dk_rfb@occ.id (Mega Helia Purnama Putri)");
    console.log("─── KPF ───────────────────────────────────────────────────");
    console.log("  du_kpf@occ.id (Lukman Wahyudin) | dk_kpf@occ.id (Egi Ramadian NP)");
    console.log("─── BPF ───────────────────────────────────────────────────");
    console.log("  du_bpf@occ.id (Nurwanto) | dk_bpf@occ.id (Akhmad Royani)");
    console.log("─── EWF ───────────────────────────────────────────────────");
    console.log("  du_ewf@occ.id (Agus Wijayanto) | dk_ewf@occ.id (Fadly Khairuzzadhi, M.H.)");
  } // end if (!skipMainSeed)

  // ── Error Activity Types (idempotent, always runs) ───────────────────────
  // Ensures Error-category activity types exist even in upgraded environments.
  try {
    const ERROR_TYPES = [
      { name: "Koreksi Entri Data",     category: "Error", weight_points: "0", note_required: true },
      { name: "Kesalahan Prosedur SOP", category: "Error", weight_points: "0", note_required: true },
      { name: "Kesalahan Pelaporan",    category: "Error", weight_points: "0", note_required: true },
    ];
    for (const et of ERROR_TYPES) {
      const { rows } = await pool.query(
        `SELECT id FROM activity_types WHERE name = $1 AND category = $2 LIMIT 1`,
        [et.name, et.category]
      );
      if (rows.length === 0) {
        await pool.query(
          `INSERT INTO activity_types (name, category, weight_points, note_required, active_status)
           VALUES ($1, $2, $3, $4, true)`,
          [et.name, et.category, et.weight_points, et.note_required]
        );
        console.log(`Inserted error activity type: ${et.name}`);
      }
    }
    console.log("Error activity types backfill complete.");
  } catch (err) {
    console.error("Failed to backfill error activity types:", err);
  }

  // ── Quality Error Types (idempotent, always runs) ─────────────────────────
  try {
    const existing = await db.select({ id: qualityErrorTypesTable.id }).from(qualityErrorTypesTable).limit(1);
    if (existing.length > 0) {
      console.log("Quality error types already seeded. Skipping.");
    } else {
      await db.insert(qualityErrorTypesTable).values([
        // Dealer
        { name: "Aktivasi Account",               category: "DEALER", objectiveGroup: "Aktivasi Account",         description: "Kesalahan dalam proses aktivasi account nasabah, pengiriman User ID & Password, input client bank & new account, dan update NA di program BAS." },
        { name: "Cek Dana Masuk & Withdrawal",    category: "DEALER", objectiveGroup: "Cek Dana Masuk & WD",      description: "Kesalahan dalam pengecekan dana masuk (deposit / top up), cek withdrawal, pencatatan di buku keuangan, verifikasi OR, dan penyerahan data ke finance." },
        { name: "Laporan Logbook / Serah Terima", category: "DEALER", objectiveGroup: "Laporan Logbook",          description: "Keterlambatan atau kesalahan pencatatan pekerjaan setiap serah terima antar shift, pengecekan surat pernyataan, dan penginputan report XLS." },
        { name: "Pengiriman Statement Nasabah",   category: "DEALER", objectiveGroup: "Pengiriman Statement",     description: "Keterlambatan pengiriman statement ke email nasabah melalui BDC. Seluruh email harus terkirim sebelum shift berakhir." },
        // SPV
        { name: "Report Daily All PT",            category: "SPV",    objectiveGroup: "Report Daily",             description: "Keterlambatan atau kesalahan pada pencocokan margin dengan Etrade All PT dan pembuatan daily report untuk BRM, CBO, dan CEO." },
        { name: "Pengiriman Statemen via ZIMBRA", category: "SPV",    objectiveGroup: "Pengiriman Statemen",      description: "Keterlambatan atau kesalahan dalam pengecekan log statemen di BDC, pengiriman email statemen di ZIMBRA, dan backup ke Outlook." },
        { name: "Prodem / Perubahan Upline",      category: "SPV",    objectiveGroup: "Prodem Process",           description: "Kesalahan dalam crosscheck data marketing All PT untuk promo/demosi bulanan/kuartal, dan proses perubahan upline cabang." },
        { name: "Report Monthly / Quarterly",     category: "SPV",    objectiveGroup: "Report Monthly",           description: "Keterlambatan atau kesalahan pembuatan laporan bulanan, kuartal, semester, dan tahunan untuk BRM, CBO, CEO, termasuk Best of the Best Marketing & Kantor Cabang." },
        { name: "Komoditi Statement & Report",    category: "SPV",    objectiveGroup: "Komoditi Statement",       description: "Kesalahan kalkulasi transaksi komoditi statement dan pencocokan ke Jafets. Termasuk rekap reward kwartal dan tahunan." },
        // Admin / Semua
        { name: "Permintaan Dokumen & Audit",     category: "ALL",    objectiveGroup: "Permintaan Dokumen",       description: "Kesalahan atau keterlambatan dalam menyiapkan data untuk audit Bappebti/BBJ, DIRKEP, crosscheck akun non-aktif (norek, sisa equity)." },
      ]);
      console.log("Quality error types seeded (10 types).");
    }
  } catch (err) {
    console.error("Failed to seed quality error types:", err);
  }

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
