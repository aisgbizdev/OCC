# OCC FINAL REFINED (VERSI BERSIH & SIAP IMPLEMENTASI)

## 🎯 POSISI OCC
OCC adalah Command Center Operasional Harian.

Fungsi:
- Mencatat aktivitas kerja (real-time)
- Mengukur performa (KPI hidup)
- Mengontrol operasional
- Menjaga komunikasi & handover

Bukan:
- Sistem ERP
- Sistem audit kompleks
- Sistem laporan berat

---

## 🧱 CORE MODULE

### 1. Activity Log (INTI)
- Batch input
- Quick template
- Edit terbatas waktu
- Auto masuk KPI

---

### 2. KPI Real-Time
- Daily / Weekly / Monthly
- Ranking terbuka
- Detail personal terbatas

---

### 3. Task (Simple)
- Assign
- Status
- Comment

---

### 4. Complaint (Simple + SLA)
- Input komplain
- Timer SLA
- Status

---

### 5. Handover Shift
- Checklist wajib
- Auto tarik task & complaint

---

### 6. Chat & Message
- Chat: bebas
- Message: resmi & tercatat

---

## 🔻 PERUBAHAN PENTING

### Quality Control
Tidak menjadi modul terpisah.
Masuk ke:
- Activity (error type)
- Complaint (jika berat)

---

### KPI Improvement
- Anti spam
- Validasi ringan oleh SPV

---

### Dashboard
Tambahan:
- Operational Pulse (🟢🟡🔴)
- Inactivity Timer
- KPI Trend

---

## ⚙️ ROLE SYSTEM

### Dealer
- Input activity
- Lihat KPI sendiri
- Task sendiri

### SPV
- Monitor tim
- Assign task
- Handle complaint

### Chief
- Kontrol semua PT
- Escalation

### Owner / Direksi
- Monitoring saja

### Admin
- Data & system setting

---

## 📱 UX PRIORITY

- FAB + Log Aktivitas
- Batch input
- Quick template
- Mobile ≤ 3 tap
- Swipe action

---

## 🔥 FITUR TAMBAHAN

- TV Dashboard / Wallboard
- Command Palette (Cmd+K)
- Share Handover
- Grouped Notification
- Do Not Disturb

---

## ❌ DIHAPUS / DITUNDA

- KPI Snapshot
- Audit log UI
- Sistem terlalu teknis
- QC module terpisah

---

## 🎯 PRINCIPLE

OCC harus dipakai setiap hari, bukan dikagumi.

---

## 📌 INSTRUKSI KE DEVELOPER

Refactor OCC agar fokus ke operasional harian.
Kurangi kompleksitas.
Fokus ke:
- Activity logging cepat
- KPI real-time
- Monitoring operasional
- Handover
- Komunikasi

Jangan buat seperti ERP.
Buat seperti command center.
