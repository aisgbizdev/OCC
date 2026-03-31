import { pool } from "@workspace/db";
import bcryptjs from "bcryptjs";

const JD_KIKI = `Mengawasi dan melakukan pengecekan akhir atas keabsahan serta validitas data nasabah.
Memastikan proses pengiriman User ID dan Password kepada nasabah berjalan tepat, aman, dan sesuai prosedur.
Memastikan format SMS, E-mail, Nomor Account, dan Password Nasabah sesuai dengan data yang diberikan pedagang/marketing.
Mengontrol ketepatan proses input Client Bank agar sesuai dengan data yang terdaftar.
Mengawasi proses prodem bulanan, kuartalan, serta perubahan upline sesuai ketentuan perusahaan.
Melakukan crosscheck data marketing seluruh PT untuk memastikan kelayakan promo/demosi.
Memastikan proses promo, demosi, dan evaluasi marketing sesuai syarat, ketentuan, dan scheme commission yang berlaku.
Mengontrol dan menyetujui perubahan upline berdasarkan permintaan cabang, baik normal case maupun special case.
Mengawasi penyusunan laporan bulanan, kuartalan, semester, dan tahunan secara tepat waktu dan akurat.
Memastikan laporan dapat digunakan oleh BRM, CBO, dan CEO sebagai bahan monitoring dan evaluasi.
Mengontrol pendataan performa kantor cabang dan marketing seluruh PT.
Menjaga kualitas laporan agar informatif, rapi, dan dapat menjadi dasar pengambilan keputusan manajemen.`;

const JD_EKO = `Melakukan pemeriksaan keabsahan dan validitas data nasabah secara teliti dan akurat.
Memastikan proses pengiriman User ID dan Password kepada nasabah sesuai prosedur.
Memastikan format SMS, E-mail, Nomor Account, dan Password Nasabah sesuai data dari pedagang.
Memastikan proses input Client Bank sudah sesuai dengan data pada e-form.
Menyiapkan data dan dokumen untuk keperluan audit internal maupun eksternal.
Menyediakan data pendukung audit Bappebti/BBJ.
Meneliti akun nonaktif yang menjadi temuan audit, termasuk nomor rekening dan sisa equity.
Menyiapkan data untuk kebutuhan pengaduan akun nasabah yang diproses DIRKEP.
Melakukan perhitungan transaksi komoditi statement secara akurat.
Mencocokkan data transaksi komoditi dengan data di Jafets.
Menyusun dan merekap report komoditi statement secara berkala.
Melakukan rekap jumlah peserta reward kuartalan dan tahunan.
Menjaga ketelitian dalam proses administrasi, dokumen, dan pelaporan.`;

const JD_SPV_MALAM = `Mengawasi proses validasi data nasabah sesuai SOP.
Memastikan pencocokan margin dengan data Etrade seluruh PT.
Menyusun dan memeriksa report harian secara akurat dan tepat waktu.
Menyiapkan daily report untuk BRM, CBO, dan CEO setiap hari setelah market close.
Memastikan pengiriman statement berjalan sesuai prosedur.
Mengecek email log statement di BDC.
Memastikan pengiriman email statement melalui Zimbra berjalan baik.
Melakukan backup email statement ke Outlook secara berkala.
Mengawasi kualitas kerja dan akurasi operasional pada shift yang dipimpin.`;

const JD_RUSNA = `Melakukan pemeriksaan keabsahan dan validitas data nasabah secara teliti.
Memastikan proses pengiriman User ID dan Password kepada nasabah berjalan dengan benar.
Memastikan format SMS, E-mail, Nomor Account, dan Password Nasabah sesuai data pedagang.
Memastikan input Client Bank sesuai dengan data pada e-form.
Melakukan update NA (new account) yang telah aktif ke program BAS.
Menangani proses open account house, margin in, dan margin out account house sesuai ketentuan.
Melakukan permintaan Acc Demo untuk kebutuhan operasional.
Melakukan pengecekan registrasi nasabah house pada e-form.
Mengonfirmasi dana masuk untuk new account atau top up account house.
Memverifikasi data agar dapat diinput ke program BAS dengan benar.
Melakukan pengecekan withdrawal account house pada Etrade.
Melakukan input withdrawal house ke program BAS.
Melakukan pengecekan logbook pergantian shift dari pagi ke sore.
Melakukan pengecekan margin pada Etrade.
Menyusun dan menyampaikan laporan harian kepada Supervisor melalui logbook.
Menjaga ketelitian dalam kontrol administrasi dan operasional harian.`;

const JD_AMEL = `Melakukan pemeriksaan keabsahan dan validitas data nasabah secara teliti dan sesuai prosedur.
Memastikan proses pengiriman User ID dan Password kepada nasabah berjalan dengan benar.
Memastikan format SMS, E-mail, Nomor Account, dan Password Nasabah sesuai data dari pedagang.
Memastikan proses input Client Bank sesuai dengan data pada e-form.
Menyiapkan data dan dokumen untuk keperluan audit.
Menyediakan data pendukung audit Bappebti/BBJ.
Melakukan crosscheck akun nonaktif yang menjadi temuan audit, termasuk nomor rekening dan sisa equity.
Menyiapkan data untuk kebutuhan pengaduan akun nasabah yang diproses DIRKEP.
Melakukan perhitungan transaksi komoditi statement secara akurat.
Mencocokkan data transaksi komoditi dengan data pada Jafets.
Menyusun dan merekap report komoditi statement secara berkala.
Melakukan rekap jumlah peserta reward kuartalan dan tahunan.
Menjaga ketelitian dalam seluruh proses data, dokumen, dan laporan.`;

const JD_DEALER_PAGI_SIANG = `Melakukan pemeriksaan keabsahan dan validitas data nasabah.
Mengecek recording dan video verifikasi WPB serta aktivasi Kepala Cabang sebelum pengiriman User ID & Password.
Memastikan pengiriman User ID & Password sesuai data pada e-form atau surat pernyataan.
Memastikan format SMS, e-mail, nomor account, dan password nasabah sesuai data dari pedagang.
Memastikan input Client Bank sesuai data pada e-form.
Melakukan update NA (new account) yang telah aktif ke program BAS.
Mengidentifikasi slip setoran margin sesuai bukti setoran pada rekening terpisah.
Mengidentifikasi nama pengirim pada slip setoran margin.
Mencatat margin in ke Buku KU dan melaporkannya ke finance.
Memastikan OR sesuai dengan nominal dan data nasabah saat key in di Etrade.
Memastikan withdrawal nasabah sesuai data Client Bank di BAS.
Menyerahkan list withdrawal ke finance sesuai data di Etrade.
Mencatat seluruh pekerjaan ke logbook saat serah terima shift.
Memastikan surat pernyataan perubahan data nasabah terkirim ke pedagang melalui email.`;

const JD_DEALER_MALAM = `Melakukan seluruh proses validasi data nasabah, input client bank, dan update account.
Mengidentifikasi margin in/out dan memastikan kesesuaian data transaksi.
Mencatat margin ke Buku KU dan menyerahkan data terkait ke finance.
Memastikan pekerjaan operasional tercatat dalam logbook.
Menjaga kelancaran serah terima pekerjaan antar shift.
Melakukan penginputan report XLS agar sesuai dengan data pada program BDC.
Melakukan pengiriman statement ke email nasabah melalui BDC.
Memastikan email statement telah berhasil terkirim ke nasabah.
Menindaklanjuti keterlambatan pengiriman statement bersama shift berikutnya bila diperlukan.`;

async function main() {
  const pw = await bcryptjs.hash("password123", 10);

  // Get reference IDs
  const { rows: roleRows } = await pool.query(`SELECT id, name FROM roles`);
  const { rows: shiftRows } = await pool.query(`SELECT id, name FROM shifts`);
  const { rows: ptRows } = await pool.query(`SELECT id, name, code FROM pts`);
  const { rows: branchRows } = await pool.query(`SELECT id, pt_id, name FROM branches ORDER BY pt_id, id`);

  const roleMap: Record<string, number> = {};
  for (const r of roleRows) roleMap[r.name] = r.id;
  const shiftMap: Record<string, number> = {};
  for (const s of shiftRows) shiftMap[s.name] = s.id;
  const ptMap: Record<string, number> = {};
  for (const p of ptRows) ptMap[p.code] = p.id;

  const firstBranch: Record<number, number> = {};
  for (const b of branchRows) {
    if (!firstBranch[b.pt_id]) firstBranch[b.pt_id] = b.id;
  }

  const pagi = shiftMap["Pagi"];
  const siang = shiftMap["Siang"];
  const malam = shiftMap["Malam"];
  const coSpvRoleId = roleMap["Co-SPV Dealing"];
  const dealerRoleId = roleMap["Dealer"];

  // ── Step 1: Update existing HQ users ──────────────────────────────────────
  await pool.query(`UPDATE users SET name=$1, job_description=$2, shift_id=$3 WHERE email='kiki@occ.id.v22-spv-hq'`,
    ["Kiki Zainab Prameswari", JD_KIKI, pagi]);
  console.log("✓ Updated Kiki → Kiki Zainab Prameswari");

  await pool.query(`UPDATE users SET name=$1, job_description=$2, shift_id=$3 WHERE email='eko.sgb@occ.id'`,
    ["Eko Hadi", JD_EKO, pagi]);
  console.log("✓ Updated Eko → Eko Hadi");

  await pool.query(`UPDATE users SET name=$1, job_description=$2, shift_id=$3 WHERE email='fahrul.sgb@occ.id'`,
    ["Fahrul Rozi", JD_SPV_MALAM, malam]);
  console.log("✓ Updated Fahrul → Fahrul Rozi");

  await pool.query(`UPDATE users SET name=$1, job_description=$2, shift_id=$3 WHERE email='adid.sgb@occ.id'`,
    ["Mujaddid Sabillah", JD_SPV_MALAM, malam]);
  console.log("✓ Updated Adid → Mujaddid Sabillah");

  await pool.query(`UPDATE users SET name=$1, job_description=$2, shift_id=$3 WHERE email='amel.sgb@occ.id'`,
    ["Amelia Rosita R", JD_AMEL, pagi]);
  console.log("✓ Updated Amel → Amelia Rosita R (shift → Pagi)");

  // ── Step 2: Add Rusnawati as new Co-SPV ───────────────────────────────────
  const { rows: existRusna } = await pool.query(`SELECT id FROM users WHERE email='rusnawati@occ.id'`);
  if (existRusna.length === 0) {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, pt_id, branch_id, shift_id, position_title, job_description, active_status, dnd_enabled)
       VALUES ($1, $2, $3, $4, NULL, NULL, $5, $6, $7, true, false)`,
      ["Rusnawati", "rusnawati@occ.id", pw, coSpvRoleId, pagi, "Co-SPV Dealing", JD_RUSNA]
    );
    console.log("✓ Inserted Rusnawati as Co-SPV Dealing");
  } else {
    console.log("Rusnawati already exists, updating...");
    await pool.query(`UPDATE users SET name=$1, job_description=$2, shift_id=$3, role_id=$4, position_title='Co-SPV Dealing' WHERE email='rusnawati@occ.id'`,
      ["Rusnawati", JD_RUSNA, pagi, coSpvRoleId]);
  }

  // ── Step 3: Delete placeholder dealers ────────────────────────────────────
  const placeholderEmails = [
    "aziz.sgb@occ.id", "dealer.sgb@occ.id",
    "dealer1.rfb@occ.id", "dealer2.rfb@occ.id",
    "dealer1.kpf@occ.id", "dealer2.kpf@occ.id",
    "dealer1.bpf@occ.id", "dealer2.bpf@occ.id",
    "dealer1.ewf@occ.id", "dealer2.ewf@occ.id",
  ];

  const { rows: plUsers } = await pool.query(
    `SELECT id, email FROM users WHERE email = ANY($1)`,
    [placeholderEmails]
  );
  const plIds: number[] = plUsers.map((u: { id: number }) => u.id);
  console.log(`Found ${plIds.length} placeholder dealers`);

  if (plIds.length > 0) {
    await pool.query(`DELETE FROM activity_logs WHERE user_id = ANY($1)`, [plIds]);
    await pool.query(`DELETE FROM kpi_scores WHERE user_id = ANY($1)`, [plIds]);
    await pool.query(`DELETE FROM kpi_snapshots WHERE user_id = ANY($1)`, [plIds]);
    await pool.query(`DELETE FROM push_subscriptions WHERE user_id = ANY($1)`, [plIds]);
    await pool.query(`DELETE FROM notifications WHERE user_id = ANY($1)`, [plIds]);
    await pool.query(`DELETE FROM audit_logs WHERE user_id = ANY($1)`, [plIds]);
    await pool.query(`DELETE FROM users WHERE id = ANY($1)`, [plIds]);
    console.log(`✓ Deleted ${plIds.length} placeholder dealers`);
  }

  // ── Step 4: Insert 20 real dealers ────────────────────────────────────────
  const dealers = [
    { name: "Yehezkiel Vava Ringgo",   email: "yehezkiel.sgb@occ.id",  ptCode: "SGB", shift: pagi,  jd: JD_DEALER_PAGI_SIANG },
    { name: "Dwi Astuti",              email: "dwi.sgb@occ.id",        ptCode: "SGB", shift: siang, jd: JD_DEALER_PAGI_SIANG },
    { name: "Farid Astra Ridha",       email: "farid.sgb@occ.id",      ptCode: "SGB", shift: malam, jd: JD_DEALER_MALAM },
    { name: "Muhammad Haikal Isa",     email: "haikal.sgb@occ.id",     ptCode: "SGB", shift: malam, jd: JD_DEALER_MALAM },
    { name: "An Nisa Rahmalia",        email: "annisa.rfb@occ.id",     ptCode: "RFB", shift: pagi,  jd: JD_DEALER_PAGI_SIANG },
    { name: "Andreas Blasius David",   email: "andreas.rfb@occ.id",    ptCode: "RFB", shift: siang, jd: JD_DEALER_PAGI_SIANG },
    { name: "Muhammad Zahri",          email: "zahri.rfb@occ.id",      ptCode: "RFB", shift: malam, jd: JD_DEALER_MALAM },
    { name: "Giovanny",                email: "giovanny.rfb@occ.id",   ptCode: "RFB", shift: malam, jd: JD_DEALER_MALAM },
    { name: "Tiara Destia Ramadhan",   email: "tiara.kpf@occ.id",      ptCode: "KPF", shift: pagi,  jd: JD_DEALER_PAGI_SIANG },
    { name: "Ellin Jackline",          email: "ellin.kpf@occ.id",      ptCode: "KPF", shift: siang, jd: JD_DEALER_PAGI_SIANG },
    { name: "Bahagia Sihura",          email: "bahagia.kpf@occ.id",    ptCode: "KPF", shift: malam, jd: JD_DEALER_MALAM },
    { name: "Yudhistira Agustin",      email: "yudhistira.kpf@occ.id", ptCode: "KPF", shift: malam, jd: JD_DEALER_MALAM },
    { name: "Linda Evans",             email: "linda.bpf@occ.id",      ptCode: "BPF", shift: pagi,  jd: JD_DEALER_PAGI_SIANG },
    { name: "Bayu Setiawan",           email: "bayu.bpf@occ.id",       ptCode: "BPF", shift: siang, jd: JD_DEALER_PAGI_SIANG },
    { name: "Yulsa",                   email: "yulsa.bpf@occ.id",      ptCode: "BPF", shift: malam, jd: JD_DEALER_MALAM },
    { name: "Sahlan",                  email: "sahlan.bpf@occ.id",     ptCode: "BPF", shift: malam, jd: JD_DEALER_MALAM },
    { name: "Hadi Susanto",            email: "hadi.ewf@occ.id",       ptCode: "EWF", shift: pagi,  jd: JD_DEALER_PAGI_SIANG },
    { name: "Nilam Larassita",         email: "nilam.ewf@occ.id",      ptCode: "EWF", shift: siang, jd: JD_DEALER_PAGI_SIANG },
    { name: "Andhika",                 email: "andhika.ewf@occ.id",    ptCode: "EWF", shift: malam, jd: JD_DEALER_MALAM },
    { name: "Daniel Simorangkir",      email: "daniel.ewf@occ.id",     ptCode: "EWF", shift: malam, jd: JD_DEALER_MALAM },
  ];

  let insertedCount = 0;
  for (const d of dealers) {
    const ptId = ptMap[d.ptCode];
    const branchId = firstBranch[ptId];
    const { rows: existRows } = await pool.query(`SELECT id FROM users WHERE email=$1`, [d.email]);
    if (existRows.length > 0) {
      await pool.query(`UPDATE users SET name=$1, job_description=$2, shift_id=$3, pt_id=$4, branch_id=$5, role_id=$6, position_title='Dealer' WHERE email=$7`,
        [d.name, d.jd, d.shift, ptId, branchId, dealerRoleId, d.email]);
      continue;
    }
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, pt_id, branch_id, shift_id, position_title, job_description, active_status, dnd_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Dealer', $8, true, false)`,
      [d.name, d.email, pw, dealerRoleId, ptId, branchId, d.shift, d.jd]
    );
    insertedCount++;
  }
  console.log(`✓ Inserted/updated 20 real dealers (${insertedCount} new)`);

  // ── Step 5: Bump seed marker ───────────────────────────────────────────────
  await pool.query(
    `UPDATE users SET email='kiki@occ.id.v23-real-team' WHERE email='kiki@occ.id.v22-spv-hq'`
  );
  console.log("✓ Seed marker: v22-spv-hq → v23-real-team");

  // ── Verify ────────────────────────────────────────────────────────────────
  const { rows: allUsers } = await pool.query(
    `SELECT u.name, r.name as role, p.code as pt, s.name as shift
     FROM users u JOIN roles r ON u.role_id = r.id
     LEFT JOIN pts p ON u.pt_id = p.id
     LEFT JOIN shifts s ON u.shift_id = s.id
     ORDER BY r.name, p.code, u.name`
  );
  console.log(`\n✓ Total users: ${allUsers.length}`);
  const hq = allUsers.filter((u: { pt: string }) => !u.pt);
  const dealers2 = allUsers.filter((u: { role: string }) => u.role === "Dealer");
  console.log(`  HQ users: ${hq.length} | Dealers: ${dealers2.length}`);
  console.log("\nHQ:");
  for (const u of hq) console.log(`  ${u.name} | ${u.role} | ${u.shift}`);
  console.log("\nDealers:");
  for (const u of dealers2) console.log(`  ${u.name} | ${u.pt} | ${u.shift}`);

  await pool.end();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
