# OCC — Operational Control Center
## Dokumen Panduan Lengkap

**Versi:** 1.0  
**Tanggal:** Maret 2026  
**Untuk:** Tim Dealing, Divisi Operasional, Solid Group  

---

## Daftar Isi

1. [Overview OCC](#1-overview-occ)
2. [Cara Login](#2-cara-login)
3. [Struktur Organisasi & Role](#3-struktur-organisasi--role)
4. [Tabel Hak Akses](#4-tabel-hak-akses)
5. [Modul Dashboard](#5-modul-dashboard)
6. [Modul Log Aktivitas](#6-modul-log-aktivitas)
7. [Modul KPI & Leaderboard](#7-modul-kpi--leaderboard)
8. [Modul Tugas (Task)](#8-modul-tugas-task)
9. [Modul Keluhan (Complaint)](#9-modul-keluhan-complaint)
10. [Modul Pengumuman](#10-modul-pengumuman)
11. [Modul Pesan Resmi](#11-modul-pesan-resmi)
12. [Modul Chat](#12-modul-chat)
13. [Modul Handover Shift](#13-modul-handover-shift)
14. [Modul Quality Control](#14-modul-quality-control)
15. [Modul Notifikasi](#15-modul-notifikasi)
16. [Profil & Manajemen Password](#16-profil--manajemen-password)
17. [Master Data (Admin & Owner)](#17-master-data-admin--owner)
18. [Pengaturan Sistem](#18-pengaturan-sistem)
19. [PWA & Penggunaan Mobile](#19-pwa--penggunaan-mobile)
20. [Daftar Akun Demo](#20-daftar-akun-demo)

---

## 1. Overview OCC

**OCC (Operational Control Center)** adalah aplikasi web internal Solid Group yang digunakan khusus oleh **tim Dealing** di Divisi Operasional.

### Tujuan Utama
- **Command center** aktivitas operasional harian
- **Tracking KPI** dealer secara otomatis
- **Manajemen tugas & keluhan** antar tim
- **Komunikasi internal** antar shift dan PT
- **Serah terima shift** yang terstruktur
- **Quality control** — pencatatan dan tracking kesalahan kerja

### Penting: Batasan Sistem
- OCC **bukan** sistem trading
- OCC **tidak terhubung** ke BAS, BOM, eTrade, atau ProTrader
- OCC hanya mencatat dan memonitor aktivitas — **bukan** untuk eksekusi transaksi

### Cakupan
- 5 PT: **SGB, RFB, KPF, BPF, EWF**
- 3 Shift: **Pagi, Siang, Malam**
- 7 Role pengguna
- Akses via browser (desktop & mobile) + bisa diinstall sebagai PWA

---

## 2. Cara Login

### Alur Login Step-by-Step

**Langkah 1 — Pilih PT / Divisi**

Halaman login menampilkan tab filter yang menentukan siapa yang muncul di dropdown nama:

| Pilihan Tab | Menampilkan Siapa |
|---|---|
| **Semua PT — Korporat & Divisi** | Superadmin, Owner, Direksi, Chief Dealing, **Admin System** |
| **SGB** | SPV Dealing dan Dealer yang terdaftar di PT SGB |
| **RFB** | SPV Dealing dan Dealer yang terdaftar di PT RFB |
| **KPF** | SPV Dealing dan Dealer yang terdaftar di PT KPF |
| **BPF** | SPV Dealing dan Dealer yang terdaftar di PT BPF |
| **EWF** | SPV Dealing dan Dealer yang terdaftar di PT EWF |

> **Penting:** Admin System dikategorikan sebagai "korporat" di sistem, sehingga selalu muncul di tab **"Semua PT"** — bukan di tab PT masing-masing. Jika Anda Admin System dan tidak menemukan nama Anda di tab PT, cari di tab "Semua PT".

**Langkah 2 — Pilih Nama**

Dropdown berisi nama personil aktif sesuai tab yang dipilih. Pilih nama Anda.

**Langkah 3 — Masukkan Password**

Ketik password Anda lalu klik **Masuk**.

### Catatan Login
- Hanya personil dengan status **aktif** yang muncul di daftar
- Jika nama tidak muncul, hubungi Owner atau Superadmin untuk mengaktifkan akun
- Password default akun baru: `password123`
- Lupa password? Minta Owner, Superadmin, atau Admin System untuk reset password

---

## 3. Struktur Organisasi & Role

### Hierarki Organisasi

```
Owner
├── Direksi (Direktur Utama, Direktur Kepatuhan)
└── Chief Dealing (level Divisi Operasional)
    ├── PT SGB
    │   ├── SPV Dealing (Pagi / Malam)
    │   ├── Dealer
    │   └── Admin System
    ├── PT RFB (struktur sama)
    ├── PT KPF (struktur sama)
    ├── PT BPF (struktur sama)
    └── PT EWF (struktur sama)
```

### 7 Role & Deskripsi

| No | Role | Deskripsi Singkat |
|---|---|---|
| 1 | **Superadmin** | Akses teknis penuh, melewati semua pembatasan role. Untuk keperluan IT/developer. |
| 2 | **Owner** | Akses operasional penuh. Bisa lihat semua PT, semua modul, kelola user. |
| 3 | **Direksi** | Akses baca di sebagian besar modul. Dapat melihat dan mencatat quality error. Tidak bisa input aktivitas, keluhan, atau pengumuman. |
| 4 | **Chief Dealing** | Kelola tim dealing, assign tugas, lihat KPI semua PT, buat keluhan/pengumuman, catat quality error, edit data user. |
| 5 | **SPV Dealing** | Monitor shift, assign tugas ke dealer, kelola keluhan, catat quality error, isi handover shift. |
| 6 | **Dealer** | Log aktivitas harian, lihat & update tugas yang di-assign ke diri sendiri, isi handover shift, lihat KPI. |
| 7 | **Admin System** | Kelola master data (user, PT, shift, tipe aktivitas), pengaturan sistem, reset password. |

### Shift Kerja

| Shift | Keterangan |
|---|---|
| **Pagi** | Shift pertama |
| **Siang** | Shift kedua |
| **Malam** | Shift ketiga |

---

## 4. Tabel Hak Akses

Tabel ini mencerminkan implementasi aktual di backend (berdasarkan `requireRole` dan pembatasan per-role di setiap route).

### Keterangan Simbol
- ✅ Bisa mengakses / melakukan aksi
- ⚠️ Akses terbatas (hanya data milik sendiri)
- 🔍 Hanya bisa lihat (read-only)
- ❌ Tidak bisa akses

### Log Aktivitas

| Aksi | Superadmin | Owner | Direksi | Chief | SPV | Dealer | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Lihat semua log | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Input / Log baru | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit log (dalam jendela waktu) | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |

### KPI & Leaderboard

| Aksi | Superadmin | Owner | Direksi | Chief | SPV | Dealer | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Lihat skor & leaderboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lihat daftar snapshot | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Generate snapshot KPI | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Tugas (Task)

| Aksi | Superadmin | Owner | Direksi | Chief | SPV | Dealer | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Lihat daftar tugas | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Lihat detail tugas & komentar | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Buat & assign tugas | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Update status tugas | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Tulis komentar | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Hapus tugas | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |

> ⚠️ **Dealer** hanya bisa melihat, update, dan berkomentar pada tugas yang **di-assign ke diri sendiri**. Tugas orang lain tidak terlihat.

### Keluhan (Complaint)

| Aksi | Superadmin | Owner | Direksi | Chief | SPV | Dealer | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Lihat semua keluhan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buat / update / hapus keluhan | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |

> Dealer dan Direksi tidak bisa membuat atau mengubah keluhan.

### Pengumuman

| Aksi | Superadmin | Owner | Direksi | Chief | SPV | Dealer | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Lihat pengumuman | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buat / edit / hapus | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |

### Pesan Resmi

| Aksi | Superadmin | Owner | Direksi | Chief | SPV | Dealer | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Lihat pesan | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Kirim pesan baru | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Konfirmasi penerimaan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> ⚠️ **Dealer** hanya melihat pesan yang ditujukan langsung ke dirinya, pesan broadcast (all), atau pesan yang dikirim oleh dirinya sendiri. Dealer **tidak bisa mengirim** pesan baru.

### Chat

| Aksi | Superadmin | Owner | Direksi | Chief | SPV | Dealer | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Lihat & kirim pesan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Handover Shift

| Aksi | Superadmin | Owner | Direksi | Chief | SPV | Dealer | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Lihat laporan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buat laporan | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |

> Direksi hanya bisa melihat laporan handover, tidak bisa membuat.

### Quality Control

| Aksi | Superadmin | Owner | Direksi | Chief | SPV | Dealer | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Lihat tipe error & record | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Catat kesalahan | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Hapus record | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |

> Dealer dan Admin System tidak memiliki akses ke modul Quality Control.  
> Direksi dapat melihat dan mencatat kesalahan (tidak hanya view-only di modul ini).

### Notifikasi, Profil, Chat

Semua role memiliki akses penuh ke notifikasi, halaman profil diri sendiri, dan chat.

### Master Data & Pengaturan Sistem

| Aksi | Superadmin | Owner | Direksi | Chief | SPV | Dealer | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Tambah user baru | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Edit data user | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ |
| Edit role & PT user | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Nonaktifkan user | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Reset password user lain | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Kelola PT/Branch/Shift/Tipe Aktivitas | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Edit parameter sistem | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Lihat audit log | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

> **Chief Dealing** bisa **mengedit data user** (nama, kontak) dan **mengubah role/PT** user, tetapi tidak bisa menambah user baru, menonaktifkan, atau reset password.

---

## 5. Modul Dashboard

Dashboard ditampilkan berbeda sesuai role pengguna yang login.

### 5.1 Dashboard Dealer

Tampil untuk role: **Dealer**

| Widget | Penjelasan |
|---|---|
| Skor Harian | Poin KPI hari ini |
| Skor Mingguan | Total poin minggu ini |
| Ranking Saya | Posisi dalam leaderboard PT |
| Tugas Aktif | Jumlah tugas yang sedang berjalan |
| Daftar Tugas Aktif | 5 tugas terbaru dengan progress bar |
| Aktivitas Terkini | 5 aktivitas terakhir yang di-log |
| Leaderboard PT | Peringkat dealer di PT yang sama |

### 5.2 Dashboard Operasional (SPV & Chief Dealing)

Tampil untuk role: **SPV Dealing** dan **Chief Dealing**

| Widget | Penjelasan |
|---|---|
| Aktivitas Tim Hari Ini | Jumlah log aktivitas seluruh tim hari ini |
| Dealer Aktif | Jumlah dealer terdaftar di PT |
| Tugas Tertunda | Tugas yang belum selesai |
| Komplain Terbuka | Keluhan yang belum resolved |
| Tabel Aktivitas Tim | Log aktivitas tim hari ini (10 terbaru) |
| Dealer Inaktif | Dealer yang melewati batas waktu tanpa log aktivitas |

### 5.3 Dashboard Radar (Owner, Direksi, Superadmin)

Tampil untuk role: **Owner**, **Direksi**, **Superadmin**

| Widget | Penjelasan |
|---|---|
| **Pulse Operasional** | Indikator status keseluruhan: NORMAL / HATI-HATI / KRITIS |
| Komplain Terbuka | Total semua PT |
| Tugas Tertunda | Total semua PT |
| Dealer Inaktif | Total dealer yang melewati batas inaktivitas |
| Top Skor Harian | Nilai tertinggi dari seluruh dealer |
| PT Radar | Tabel per-PT: komplain, tugas, top skor, status |
| Alert Panel | Daftar komplain urgensi tinggi (muncul otomatis jika ada) |
| Leaderboard Harian | Top 10 dealer seluruh PT |

**Rumus Pulse Operasional:**
- 🔴 **KRITIS** — Lebih dari 3 komplain urgensi tinggi ATAU lebih dari 5 dealer inaktif
- 🟡 **HATI-HATI** — Ada komplain urgensi tinggi ATAU lebih dari 5 komplain terbuka ATAU lebih dari 2 dealer inaktif
- 🟢 **NORMAL** — Semua kondisi baik

---

## 6. Modul Log Aktivitas

### Tujuan
Mencatat aktivitas kerja operasional harian. Setiap aktivitas yang dilog **otomatis memperbarui skor KPI** dealer yang bersangkutan.

### Siapa yang Bisa Input
- **Dealer, SPV Dealing, Chief Dealing, Owner, Admin System**
- Direksi hanya bisa melihat

### Cara Input Aktivitas (Batch)

1. Klik tombol **"Log Aktivitas"** (desktop: pojok kanan atas, mobile: tombol FAB)
2. Form batch terbuka — bisa input **beberapa aktivitas sekaligus**
3. Untuk setiap baris aktivitas, isi:

| Field | Wajib | Keterangan |
|---|:---:|---|
| **Tipe Aktivitas** | ✅ | Pilih dari dropdown (menampilkan nama + poin per unit) |
| **Qty** | ✅ | Jumlah unit aktivitas (minimal 1) |
| **Catatan** | ❌ | Keterangan tambahan opsional |

4. Klik **"+ Add Row"** untuk menambah aktivitas lain
5. Klik **"Submit Batch"** — semua baris valid tersimpan sekaligus
6. KPI otomatis diperbarui setelah submit

### Aturan Edit Aktivitas
- Log aktivitas hanya bisa diedit dalam **jendela waktu** setelah dibuat
- Default: **60 menit** (dapat diubah oleh Admin/Owner di Pengaturan Sistem)
- **Owner dan Admin System** dapat mengedit kapan saja tanpa batas waktu

### Tampilan Daftar Log Aktivitas
Kolom: **Waktu | Dealer | Tipe Aktivitas | Qty | Catatan | Poin**

Filter: cari nama dealer / tipe aktivitas, filter rentang tanggal.

---

## 7. Modul KPI & Leaderboard

### Cara Kerja KPI Engine

KPI dihitung **otomatis** setiap kali ada aktivitas yang dilog atau diedit.

**5 Periode Skor:**

| Periode | Keterangan |
|---|---|
| **Harian** | Akumulasi poin hari ini |
| **Mingguan** | Akumulasi poin minggu ini (Senin–Minggu) |
| **Bulanan** | Akumulasi poin bulan ini |
| **Kuartalan** | Akumulasi poin kuartal berjalan |
| **Tahunan** | Akumulasi poin tahun ini |

**Rumus Poin:**
```
Poin = Qty × Weight Points (per tipe aktivitas)
```

Contoh: "Input Order" bobot 5 poin, dealer input 10 order → **50 poin**.

### Tampilan KPI Page

- Tab periode: Harian | Mingguan | Bulanan | Tahunan
- Grafik batang: Top 10 Performer
- Tabel peringkat: seluruh tim operasional

Semua role termasuk Admin System bisa melihat leaderboard.

### Snapshot KPI

| Aksi | Yang Bisa |
|---|---|
| Lihat daftar snapshot | Semua kecuali Dealer |
| Generate snapshot baru | Owner, Admin System |

---

## 8. Modul Tugas (Task)

### Tujuan
Assign, track, dan update tugas operasional antar anggota tim.

### Penting: Batasan Akses Dealer

Dealer **hanya bisa melihat tugas yang di-assign ke dirinya sendiri**. Tugas milik orang lain tidak muncul di daftar Dealer. Hal yang sama berlaku untuk detail tugas, komentar, dan update status.

### Cara Buat Tugas

*Berlaku untuk: Owner, Chief Dealing, SPV Dealing, Admin System*

1. Klik **"+ Tugas Baru"**
2. Isi form:

| Field | Wajib | Keterangan |
|---|:---:|---|
| **Judul** | ✅ | Nama singkat tugas |
| **Deskripsi** | ❌ | Penjelasan detail tugas |
| **Prioritas** | ✅ | Rendah / Sedang / Tinggi |
| **Tenggat** | ❌ | Deadline tugas (format tanggal) |
| **Assign Ke** | ❌ | Pilih anggota tim dari dropdown |

3. Klik **"Buat Tugas"**
4. Anggota yang di-assign akan mendapat **notifikasi otomatis**

### Status Tugas

| Status | Progress | Keterangan |
|---|---|---|
| **New** | 0% | Baru dibuat, belum dimulai |
| **In Progress** | 50% | Sedang dikerjakan |
| **Completed** | 100% | Selesai |

Klik ikon status di kartu tugas untuk mengubah status.

### Komentar Tugas

Semua role bisa membaca dan menulis komentar — namun Dealer hanya pada tugas yang di-assign ke dirinya.

---

## 9. Modul Keluhan (Complaint)

### Tujuan
Mencatat, memonitor, dan mengelola masalah operasional dengan timer SLA.

### Siapa yang Bisa Membuat Keluhan
- **Owner, Chief Dealing, SPV Dealing, Admin System, Superadmin**
- Dealer dan Direksi **tidak bisa** membuat keluhan

### Cara Buat Keluhan

1. Klik **"+ Komplain Baru"**
2. Isi form:

| Field | Wajib | Keterangan |
|---|:---:|---|
| **Judul** | ✅ | Deskripsi singkat masalah |
| **Tipe** | ✅ | Internal / Eksternal / Sistem |
| **Urgensi** | ✅ | Rendah / Sedang / Tinggi |
| **Kronologi** | ❌ | Penjelasan kejadian, waktu, dan pihak terlibat |

3. Klik **"Kirim Komplain"**
4. **Timer SLA otomatis dimulai** sejak keluhan dibuat

### Sistem SLA Timer

| Status SLA | Durasi | Indikator |
|---|---|---|
| **Normal** | Kurang dari 24 jam | 🟢 Hijau |
| **Warning** | 24–72 jam belum resolved | 🟡 Kuning |
| **Critical** | Lebih dari 72 jam belum resolved | 🔴 Merah berkedip |

Timer SLA berhenti saat status keluhan diubah ke **"Resolved"** atau **"Closed"**.

> **Catatan:** Ambang batas SLA (24 jam dan 72 jam) saat ini bersifat tetap di dalam sistem.

### Status Keluhan
- **Open** — baru dibuat, belum ditangani
- **In Progress** — sedang ditangani
- **Resolved** — sudah diselesaikan
- **Closed** — ditutup

### Notifikasi Otomatis
- Keluhan baru → push notif ke **SPV, Chief Dealing, Owner**
- Eskalasi SLA warning/critical → push notif ke **Chief Dealing, Owner, Direksi**

---

## 10. Modul Pengumuman

### Tujuan
Broadcast informasi resmi dari management ke seluruh atau sebagian tim.

### Siapa yang Bisa Membuat Pengumuman
- **Owner, Chief Dealing, SPV Dealing, Admin System, Superadmin**
- Dealer dan Direksi hanya bisa **membaca**

### Cara Buat Pengumuman

1. Klik **"+ Buat Pengumuman"** (muncul hanya jika berhak)
2. Isi form:

| Field | Wajib | Keterangan |
|---|:---:|---|
| **Judul** | ✅ | Judul pengumuman |
| **Isi** | ✅ | Konten pengumuman |
| **Prioritas** | ✅ | Normal / Tinggi |
| **Scope** | ✅ | Target penerima |

**Pilihan Scope:**

| Nilai | Target |
|---|---|
| **Semua** | Seluruh pengguna OCC |
| **PT Saya** | Hanya pengguna di PT yang sama |
| **Shift Ini** | Hanya shift yang sama |
| **Role Saya** | Hanya role yang sama |

3. Klik **"Kirim Pengumuman"**

Pengumuman prioritas **Tinggi** memiliki garis merah di sisi kiri kartu.

---

## 11. Modul Pesan Resmi

### Tujuan
Komunikasi langsung yang bisa memerlukan **konfirmasi tanda terima** dari penerima.

### Perbedaan dengan Chat

| | Pesan Resmi | Chat |
|---|---|---|
| Sifat | Formal/resmi | Informal |
| Tanda terima | Bisa diminta (opsional) | Tidak ada |
| Riwayat | Terstruktur | Terstruktur |

### Batasan Dealer di Pesan Resmi

- **Dealer TIDAK BISA mengirim pesan baru**
- Dealer hanya bisa membaca pesan yang:
  - Ditujukan langsung ke dirinya
  - Bersifat broadcast (ke semua)
  - Dikirim oleh dirinya sendiri (jika ada)
- Dealer **BISA** mengkonfirmasi penerimaan pesan

### Cara Membaca & Konfirmasi

1. Buka halaman **Pesan**
2. Pesan yang belum dikonfirmasi memiliki highlight berbeda
3. Jika memerlukan konfirmasi, klik **"Konfirmasi Penerimaan"**
4. Status berubah menjadi ✅ **Dikonfirmasi**

---

## 12. Modul Chat

### Tujuan
Komunikasi informal real-time antar anggota tim dalam chat room.

Semua role bisa membaca dan mengirim pesan di chat room yang tersedia.

### Cara Menggunakan Chat

**Melihat Daftar Room:**
- Buka halaman **Chat**
- Kartu room menampilkan: nama, tipe, preview pesan terakhir, jumlah member

**Masuk ke Room:**
- Klik kartu room
- Pesan di-refresh otomatis setiap **5 detik**

**Mengirim Pesan:**
1. Ketik pesan di kotak input bawah
2. Tekan **Enter** atau klik ikon kirim (→)
3. Pesan Anda muncul di kanan (biru), pesan orang lain di kiri (abu)

**Kembali ke Daftar Room:** Klik tombol ← pojok kiri atas

### Tipe Chat Room
- **Group** — percakapan multi-anggota
- **Direct** — pesan 1-on-1

---

## 13. Modul Handover Shift

### Tujuan
Dokumentasi serah terima shift agar informasi penting tidak hilang saat pergantian shift.

### Siapa yang Bisa Membuat Handover
- **Owner, Chief Dealing, SPV Dealing, Dealer, Admin System**
- Direksi hanya bisa **melihat** laporan handover

> SPV Dealing adalah penanggung jawab utama pengisian handover di akhir shift. Dealer juga bisa mengisi jika diperlukan.

### Cara Isi Handover Shift

1. Klik **"+ Handover Baru"**
2. Isi:

| Field | Wajib | Keterangan |
|---|:---:|---|
| **Dari Shift** | ✅ | Shift yang sedang berakhir |
| **Ke Shift** | ✅ | Shift yang akan mengambil alih |

3. Selesaikan **Checklist Handover** (semua harus dicentang sebelum bisa submit):

| Item Checklist | Penjelasan |
|---|---|
| Review Komplain Tertunda | Sudah review semua komplain terbuka |
| Review Tugas Belum Selesai | Sudah review tugas yang berjalan |
| Verifikasi Status Sistem | Pilih: Normal / Ada masalah kecil / Terganggu / Gangguan kritis |
| Semua Aktivitas Telah Dilog | Semua aktivitas shift sudah diinput |

4. Isi **Catatan Khusus** (opsional)
5. Klik **"Submit Handover"**

### Isi Laporan Handover

Laporan menampilkan:
- Nama pembuat, dari shift → ke shift, waktu submit
- Kondisi sistem (dari checklist)
- Daftar **tugas yang sedang berjalan** (diambil otomatis dari sistem)
- Daftar **komplain terbuka** (diambil otomatis dari sistem)
- Catatan khusus

### Fitur Salin Laporan
Klik ikon 📋 di kartu handover untuk menyalin laporan sebagai teks ke clipboard.

---

## 14. Modul Quality Control

### Tujuan
Mencatat dan memonitor kesalahan kerja operasional tim dealing secara terstruktur.

### Siapa yang Bisa Mengakses
- **Dapat lihat dan catat:** Owner, Direksi, Chief Dealing, SPV Dealing, Superadmin
- **Dapat hapus:** Owner, Chief Dealing, Superadmin
- **Tidak ada akses:** Dealer, Admin System

### Sistem Scoring

| Jumlah Kesalahan | Skor |
|---|---|
| **0** kesalahan | 🟢 **PERFECT** |
| **1–3** kesalahan | 🟡 **AVERAGE** |
| **Lebih dari 3** | 🔴 **POOR** |

### Cara Catat Kesalahan

1. Klik **"+ Catat Kesalahan"**
2. Isi form:

| Field | Wajib | Keterangan |
|---|:---:|---|
| **Anggota Tim** | ✅ | Pilih nama dealer/SPV yang bersangkutan |
| **Jenis Kesalahan** | ✅ | Pilih dari daftar tipe error (dikelompokkan per kategori) |
| **Tanggal** | ✅ | Tanggal terjadinya (maksimal hari ini) |
| **Jumlah Kesalahan** | ✅ | Angka 0–99 (preview skor otomatis tampil) |
| **Catatan** | ❌ | Deskripsi singkat kejadian |

3. Klik **"Simpan"**

### Tab di Halaman Quality

| Tab | Isi |
|---|---|
| **Summary** | Tabel ringkasan per anggota: total kesalahan, jumlah record, skor |
| **Riwayat** | Daftar semua record kesalahan (bisa di-expand untuk detail) |
| **Jenis Kesalahan** | Referensi lengkap semua tipe kesalahan |

### Filter yang Tersedia
- Rentang tanggal, filter PT (management), filter shift, filter anggota, filter skor

---

## 15. Modul Notifikasi

### Tujuan
Informasi real-time tentang kejadian penting yang relevan untuk pengguna.

### Kapan Notifikasi Dikirim

| Trigger | Penerima |
|---|---|
| Tugas baru di-assign | Orang yang di-assign |
| Keluhan baru dibuat | SPV, Chief Dealing, Owner |
| Eskalasi SLA keluhan | Chief Dealing, Owner, Direksi |
| Dealer inaktif melewati batas warning | SPV, Chief Dealing |
| Dealer inaktif melewati batas kritis | Owner, Direksi |
| Pesan masuk ke chat room | Anggota room |

### Tampilan Notifikasi
- Notifikasi belum dibaca: latar biru muda
- Klik **"Tandai Semua Dibaca"** untuk membaca semua sekaligus

### Push Notification (Browser/HP)
1. Saat pertama login, browser meminta izin notifikasi
2. Klik **"Allow"** / **"Izinkan"**
3. Notifikasi penting muncul otomatis di sistem operasi

---

## 16. Profil & Manajemen Password

### Mengakses Halaman Profil
- Klik **nama/avatar** di bawah sidebar (desktop)
- Atau klik **ikon bulat** di pojok kanan atas header

Semua role memiliki akses ke halaman profil sendiri.

### Yang Bisa Diubah Sendiri

**Ubah Data Profil:**

| Field | Keterangan |
|---|---|
| **Nama** | Nama tampil di sistem |
| **Jabatan / Posisi** | Jabatan tambahan (opsional) |
| **Nomor HP** | Kontak (opsional) |

Klik **"Simpan Profil"** untuk menyimpan.

**Ganti Password:**

| Field | Keterangan |
|---|---|
| **Password Lama** | Password yang sedang digunakan |
| **Password Baru** | Password baru yang diinginkan |
| **Konfirmasi Password Baru** | Ketik ulang password baru |

Klik **"Ganti Password"**. Sistem memvalidasi bahwa kedua password baru cocok sebelum menyimpan.

### Informasi Read-Only di Profil

Field berikut hanya bisa diubah melalui halaman Master Data oleh Owner, Chief Dealing, atau Admin System:
- Email
- Role
- PT & Shift
- Status akun

### Reset Password oleh Admin (Admin System / Owner / Superadmin)

1. Buka halaman **Users** (Master Data)
2. Temukan user di tabel
3. Klik tombol **"Reset PW"** di baris user
4. Masukkan password baru + konfirmasi
5. Klik **"Reset Password"**

---

## 17. Master Data (Admin & Owner)

Halaman ini dapat diakses oleh: **Superadmin, Owner, Admin System**  
Chief Dealing dapat **mengedit data user** (termasuk role/PT), tapi tidak bisa menambah user baru, menonaktifkan, atau reset password.

### 17.1 Manajemen User

**Tampilan:** Tabel semua user — Nama | Email | Role | PT | Shift | Status | Aksi

**Aksi per role:**

| Aksi | Superadmin | Owner | Chief | Admin |
|---|:---:|:---:|:---:|:---:|
| Tambah User | ✅ | ✅ | ❌ | ✅ |
| Edit data user | ✅ | ✅ | ✅ | ✅ |
| Edit Role & PT | ✅ | ✅ | ✅ | ❌ |
| Nonaktifkan | ✅ | ❌ | ❌ | ✅ |
| Reset Password | ✅ | ✅ | ❌ | ✅ |

**Form Tambah/Edit User:**

| Field | Keterangan |
|---|---|
| Nama | Nama lengkap |
| Email | Email login (unik per sistem) |
| Role | Pilih dari 7 role |
| PT | Pilih PT (untuk SPV Dealing / Dealer) |
| Shift | Shift kerja |
| Status Aktif | Aktif / nonaktif |
| Password | Untuk user baru: set password awal |

### 17.2 Manajemen PT

Kelola daftar PT (SGB, RFB, KPF, BPF, EWF):
- Tambah, edit nama/kode/deskripsi, nonaktifkan PT

### 17.3 Manajemen Branch

Kelola kantor cabang per PT: tambah, edit, hapus.

### 17.4 Manajemen Shift

Kelola definisi shift: nama (Pagi/Siang/Malam), jam mulai, jam selesai.

### 17.5 Manajemen Tipe Aktivitas

| Field | Keterangan |
|---|---|
| Nama Aktivitas | Nama yang muncul di dropdown log aktivitas |
| Bobot Poin | Poin per unit |
| Kategori | Kelompok aktivitas |
| Deskripsi | Penjelasan aktivitas |
| Status Aktif | Hanya tipe aktif yang muncul di form input |

---

## 18. Pengaturan Sistem

Hanya bisa diakses dan diubah oleh: **Admin System, Owner, Superadmin**

### Parameter yang Bisa Dikonfigurasi

| Parameter | Satuan | Keterangan |
|---|---|---|
| **Target Poin Harian** | poin | Target KPI poin per dealer per hari |
| **Batas Warning Inaktivitas** | jam | Jam tanpa aktivitas sebelum peringatan muncul |
| **Batas Kritis Inaktivitas** | jam | Jam tanpa aktivitas sebelum alert kritis |
| **Jendela Edit Aktivitas** | menit | Berapa menit log aktivitas bisa diedit (default: 60) |

### Cara Edit Parameter

1. Klik ikon ✏️ di baris parameter
2. Ketik nilai baru
3. Klik ✅ untuk simpan, ✕ untuk batal

### Monitor Inaktivitas Dealer

Halaman ini menampilkan:
- Ambang batas warning dan kritis
- Jumlah dealer yang sedang bermasalah
- Daftar dealer inaktif + durasi + waktu aktivitas terakhir

### Riwayat Audit (20 Terakhir)

| Kolom | Keterangan |
|---|---|
| Waktu | Kapan aksi dilakukan |
| Pengguna | Siapa yang melakukan |
| Aksi | CREATE / UPDATE / DELETE |
| Modul | Modul mana yang diubah |
| Detail | ID entitas yang diubah |

---

## 19. PWA & Penggunaan Mobile

### Apa itu PWA?

OCC adalah **Progressive Web App (PWA)** — bisa diinstall di HP tanpa melalui Play Store/App Store.

### Cara Install di HP

**Android (Chrome):**
1. Buka OCC di Chrome
2. Ketuk banner "Tambah ke Layar Utama" (atau dari menu ⋮ → Install app)
3. Klik **Tambahkan**
4. Ikon OCC muncul di layar utama HP

**iOS (Safari):**
1. Buka OCC di Safari
2. Tap ikon Share (kotak dengan panah ke atas)
3. Pilih **"Add to Home Screen"**
4. Beri nama lalu tap **Add**

### Navigasi Mobile

**Bottom Navigation Bar:**

Terdiri dari **5 shortcut** dan **1 tombol "Lainnya"**:

| Tab | Halaman |
|---|---|
| Home | Dashboard |
| Aktivitas | Log Aktivitas |
| KPI | KPI & Leaderboard |
| Tugas | Manajemen Tugas |
| Komplain | Keluhan |
| **Lainnya** | Buka drawer semua menu |

**Tombol "Lainnya"** membuka drawer menu lengkap yang berisi semua halaman termasuk Pengumuman, Chat, Handover, Quality, Notifikasi, Profil, dan lain-lain. Jika ada notifikasi belum dibaca, muncul titik merah di atas tombol ini.

### Offline Mode
Jika koneksi terputus: halaman yang sudah dimuat sebelumnya tetap bisa dilihat. Input data baru memerlukan koneksi internet.

### Push Notification di Mobile
Setelah diinstall sebagai PWA, push notification muncul di notifikasi sistem HP — bahkan saat OCC tidak sedang dibuka.

---

## 20. Daftar Akun Demo

Semua akun menggunakan password: **`password123`**

### Korporat & Divisi (Tab: Semua PT)

| Email | Nama | Role |
|---|---|---|
| superadmin@occ.id | Super Admin | Superadmin |
| owner@occ.id | Owner | Owner |
| dir.utama@occ.id | Direktur Utama | Direksi |
| dir.kepatuhan@occ.id | Direktur Kepatuhan | Direksi |
| kiki@occ.id | Kiki | Chief Dealing |

> Admin System per-PT juga muncul di tab "Semua PT" karena dikategorikan sebagai korporat.

### PT SGB (Tab: SGB)

| Email | Nama | Role | Shift |
|---|---|---|---|
| eko.sgb@occ.id | Eko | SPV Dealing | Pagi |
| fahrul.sgb@occ.id | Fahrul | SPV Dealing | Malam |
| adid.sgb@occ.id | Adid | SPV Dealing | Malam |
| aziz.sgb@occ.id | Abdul Aziz | Dealer | Pagi |
| amel.sgb@occ.id | Amel | Dealer | Siang |
| dealer.sgb@occ.id | Dealer SGB | Dealer | Malam |

### PT RFB (Tab: RFB)

| Email | Role |
|---|---|
| spv1.rfb@occ.id | SPV Dealing |
| spv2.rfb@occ.id | SPV Dealing |
| dealer1.rfb@occ.id | Dealer |
| dealer2.rfb@occ.id | Dealer |

### PT KPF (Tab: KPF)

| Email | Role |
|---|---|
| spv1.kpf@occ.id | SPV Dealing |
| spv2.kpf@occ.id | SPV Dealing |
| dealer1.kpf@occ.id | Dealer |
| dealer2.kpf@occ.id | Dealer |

### PT BPF (Tab: BPF)

| Email | Role |
|---|---|
| spv1.bpf@occ.id | SPV Dealing |
| spv2.bpf@occ.id | SPV Dealing |
| dealer1.bpf@occ.id | Dealer |
| dealer2.bpf@occ.id | Dealer |

### PT EWF (Tab: EWF)

| Email | Role |
|---|---|
| spv1.ewf@occ.id | SPV Dealing |
| spv2.ewf@occ.id | SPV Dealing |
| dealer1.ewf@occ.id | Dealer |
| dealer2.ewf@occ.id | Dealer |

---

*Dokumen ini dibuat dari source code OCC versi Maret 2026.*  
*Untuk pertanyaan teknis, hubungi tim pengembang.*
