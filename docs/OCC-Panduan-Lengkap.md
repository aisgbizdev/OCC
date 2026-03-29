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
17. [Master Data (Admin)](#17-master-data-admin)
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

Halaman login menampilkan tab filter di bagian atas. Setiap tab menentukan siapa saja yang ditampilkan di dropdown nama:

| Pilihan Tab | Menampilkan Siapa |
|---|---|
| **Semua PT — Korporat & Divisi** | Superadmin, Owner, Direksi, Chief Dealing, **Admin System** |
| **SGB** | SPV Dealing dan Dealer yang terdaftar di PT SGB |
| **RFB** | SPV Dealing dan Dealer yang terdaftar di PT RFB |
| **KPF** | SPV Dealing dan Dealer yang terdaftar di PT KPF |
| **BPF** | SPV Dealing dan Dealer yang terdaftar di PT BPF |
| **EWF** | SPV Dealing dan Dealer yang terdaftar di PT EWF |

> **Catatan penting:** Admin System termasuk dalam kategori "korporat" di sistem, sehingga selalu muncul di tab "Semua PT" — bukan di tab per-PT.

**Langkah 2 — Pilih Nama**

Setelah memilih tab, muncul dropdown berisi daftar nama personil aktif sesuai tab yang dipilih. Pilih nama Anda.

**Langkah 3 — Masukkan Password**

Ketik password Anda di kolom yang tersedia, lalu klik **Masuk**.

### Catatan Login
- Hanya personil dengan status **aktif** yang muncul di daftar
- Jika nama tidak muncul, hubungi Owner atau Superadmin untuk mengaktifkan akun
- Password default akun baru: `password123` (wajib diganti setelah login pertama)
- Lupa password? Minta Owner atau Superadmin untuk melakukan reset password

---

## 3. Struktur Organisasi & Role

### Hierarki Organisasi

```
Owner
├── Direksi (Direktur Utama, Direktur Kepatuhan)
└── Chief Dealing (level Divisi Operasional)
    ├── PT SGB
    │   ├── SPV Dealing (Pagi/Malam)
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
| 3 | **Direksi** | Akses baca (view-only) untuk dashboard, laporan, dan monitoring PT. Tidak bisa input atau ubah data. |
| 4 | **Chief Dealing** | Kelola tim dealing, assign tugas, lihat KPI semua PT, buat pengumuman, catat quality error. |
| 5 | **SPV Dealing** | Monitor shift, assign tugas ke dealer, kelola keluhan, catat quality error, isi handover shift. |
| 6 | **Dealer** | Log aktivitas harian, update tugas yang di-assign, isi handover shift, lihat KPI pribadi. |
| 7 | **Admin System** | Kelola master data (user, PT, shift, tipe aktivitas), pengaturan sistem, reset password. |

### Shift Kerja

| Shift | Keterangan |
|---|---|
| **Pagi** | Shift pertama |
| **Siang** | Shift kedua |
| **Malam** | Shift ketiga |

---

## 4. Tabel Hak Akses

Tabel ini mencerminkan implementasi aktual sistem berdasarkan kontrol akses di setiap endpoint.

### Keterangan Simbol
- ✅ Bisa mengakses / melakukan aksi
- 🔍 Hanya bisa lihat (read-only)
- ❌ Tidak bisa akses

### Matrix Akses per Modul

| Modul / Aksi | Superadmin | Owner | Direksi | Chief | SPV | Dealer | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **DASHBOARD** | | | | | | | |
| Lihat Dashboard | ✅ | ✅ | 🔍 | ✅ | ✅ | ✅ | ❌ |
| **LOG AKTIVITAS** | | | | | | | |
| Lihat semua log | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Input / Log baru | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit log (dalam jendela waktu) | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **KPI & LEADERBOARD** | | | | | | | |
| Lihat skor & leaderboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lihat daftar snapshot | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Generate snapshot KPI | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **TUGAS** | | | | | | | |
| Lihat semua tugas | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buat & assign tugas | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Update status tugas | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hapus tugas | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| Buat & lihat komentar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **KELUHAN (COMPLAINT)** | | | | | | | |
| Lihat semua keluhan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buat / update / hapus keluhan | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **PENGUMUMAN** | | | | | | | |
| Lihat pengumuman | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buat / edit / hapus pengumuman | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **PESAN RESMI** | | | | | | | |
| Lihat pesan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kirim pesan (via API) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CHAT** | | | | | | | |
| Lihat & kirim pesan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **HANDOVER SHIFT** | | | | | | | |
| Lihat laporan handover | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buat laporan handover | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **QUALITY CONTROL** | | | | | | | |
| Lihat tipe error & record | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Catat kesalahan (create record) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Hapus record | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **NOTIFIKASI** | | | | | | | |
| Lihat notifikasi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **PROFIL** | | | | | | | |
| Edit profil sendiri | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ganti password sendiri | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **MASTER DATA** | | | | | | | |
| Kelola User (CRUD) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Reset password user lain | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Kelola PT/Branch/Shift/Tipe Aktivitas | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **PENGATURAN SISTEM** | | | | | | | |
| Edit parameter sistem | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Lihat audit log | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

> **Catatan Quality:** Direksi memiliki akses **lihat dan catat** quality error (bukan hanya view-only). Dealer dan Admin System tidak memiliki akses ke modul Quality sama sekali.

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
| Komplain Terbuka | Daftar komplain aktif |

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
Mencatat aktivitas kerja operasional harian. Setiap aktivitas yang dilog akan **otomatis memperbarui skor KPI** dealer yang bersangkutan.

### Siapa yang Bisa Input
- **Dealer, SPV Dealing, Chief Dealing, Owner, Admin System**
- Direksi hanya bisa melihat, tidak bisa input

> Dalam praktik operasional, log aktivitas harian biasanya diisi oleh **Dealer** untuk aktivitas diri sendiri, dan oleh **SPV atau Owner** untuk koreksi atau keperluan tertentu.

### Cara Input Aktivitas (Batch)

1. Klik tombol **"Log Aktivitas"** (desktop: pojok kanan atas, mobile: tombol + di bawah)
2. Form batch terbuka — bisa input **beberapa aktivitas sekaligus**
3. Untuk setiap baris aktivitas, isi:

| Field | Wajib | Keterangan |
|---|:---:|---|
| **Tipe Aktivitas** | ✅ | Pilih dari dropdown (menampilkan nama + poin per unit) |
| **Qty** | ✅ | Jumlah unit aktivitas (minimal 1) |
| **Catatan** | ❌ | Keterangan tambahan opsional |

4. Klik **"+ Add Row"** untuk menambah aktivitas lain dalam satu submit
5. Klik **"Submit Batch"** — semua baris valid akan disimpan sekaligus
6. KPI otomatis diperbarui setelah submit

### Aturan Edit Aktivitas
- Log aktivitas hanya bisa diedit dalam **jendela waktu** setelah dibuat
- Default: **60 menit** (bisa diubah oleh Admin/Owner di Pengaturan Sistem)
- **Owner dan Admin System** dapat mengedit kapan saja tanpa batas waktu

### Tampilan Daftar Log Aktivitas
Tabel kolom: **Waktu | Dealer | Tipe Aktivitas | Qty | Catatan | Poin**

Filter yang tersedia:
- Cari berdasarkan nama dealer atau tipe aktivitas
- Filter berdasarkan rentang tanggal

---

## 7. Modul KPI & Leaderboard

### Cara Kerja KPI Engine

KPI dihitung **otomatis** setiap kali ada aktivitas yang dilog atau diedit. Tidak perlu input manual.

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

Contoh: Jika "Input Order" memiliki bobot 5 poin dan dealer input 10 order → dapat **50 poin**.

### Tampilan KPI Page (Leaderboard Global)

- Tab pilihan periode: **Harian | Mingguan | Bulanan | Tahunan**
- Grafik batang: Top 10 Performer
- Tabel peringkat: seluruh tim operasional

### Akses KPI

Semua role (termasuk Admin System) bisa melihat skor dan leaderboard. Dealer hanya melihat data di PT sendiri (scoped per PT).

**Snapshot KPI:**
- Lihat daftar snapshot: Owner, Direksi, Chief Dealing, SPV Dealing, Admin System
- Generate snapshot baru: Owner dan Admin System

---

## 8. Modul Tugas (Task)

### Tujuan
Assign, track, dan update tugas operasional antar anggota tim.

### Hak Akses Tugas

| Aksi | Role yang Bisa |
|---|---|
| Buat & assign tugas | Owner, Chief Dealing, SPV Dealing, Admin System |
| Lihat semua tugas | Semua role |
| Update status tugas | Semua role |
| Hapus tugas | Owner, Chief Dealing, SPV Dealing, Admin System |

> Dealer bisa **update status** tugas yang di-assign ke dirinya, tetapi tidak bisa membuat atau menghapus tugas.

### Cara Buat Tugas

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

### Status Tugas & Progres

| Status | Progress | Keterangan |
|---|---|---|
| **New** | 0% | Baru dibuat, belum dimulai |
| **In Progress** | 50% | Sedang dikerjakan |
| **Completed** | 100% | Selesai |

Klik ikon status di kartu tugas untuk mengubah status.

### Komentar Tugas

Semua role (termasuk Dealer dan Direksi) bisa membaca dan menulis komentar pada tugas.

---

## 9. Modul Keluhan (Complaint)

### Tujuan
Mencatat, memonitor, dan mengelola masalah operasional dengan timer SLA.

### Hak Akses Keluhan

| Aksi | Role yang Bisa |
|---|---|
| Lihat semua keluhan | Semua role |
| Buat / update / hapus keluhan | Owner, Chief Dealing, SPV Dealing, Admin System |

> **Dealer dan Direksi tidak bisa membuat keluhan.** Dealer dapat melaporkan masalah ke SPV untuk dicatatkan.

### Cara Buat Keluhan

1. Klik **"+ Komplain Baru"**
2. Isi form:

| Field | Wajib | Keterangan |
|---|:---:|---|
| **Judul** | ✅ | Deskripsi singkat masalah |
| **Tipe** | ✅ | Internal / Eksternal / Sistem |
| **Urgensi** | ✅ | Rendah / Sedang / Tinggi |
| **Kronologi** | ❌ | Penjelasan kejadian, waktu, dan pihak yang terlibat |

3. Klik **"Kirim Komplain"**
4. **Timer SLA otomatis dimulai** sejak keluhan dibuat

### Sistem SLA Timer

| Status SLA | Kondisi | Indikator |
|---|---|---|
| **Normal** | Kurang dari 24 jam | 🟢 Hijau |
| **Warning** | 24–72 jam belum resolved | 🟡 Kuning |
| **Critical** | Lebih dari 72 jam belum resolved | 🔴 Merah berkedip |

Timer SLA berhenti saat status keluhan diubah ke **"Resolved"** atau **"Closed"**.

Ambang batas SLA ini dapat dikonfigurasi di Pengaturan Sistem.

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

### Hak Akses Pengumuman

| Aksi | Role yang Bisa |
|---|---|
| Lihat pengumuman | Semua role |
| Buat / edit / hapus pengumuman | Owner, Chief Dealing, SPV Dealing, Admin System |

> Dealer dan Direksi hanya bisa membaca, tidak bisa membuat pengumuman.

### Cara Buat Pengumuman

1. Klik **"+ Buat Pengumuman"** (tombol hanya muncul bagi yang berhak)
2. Isi form:

| Field | Wajib | Keterangan |
|---|:---:|---|
| **Judul** | ✅ | Judul pengumuman |
| **Isi** | ✅ | Konten pengumuman |
| **Prioritas** | ✅ | Normal / Tinggi |
| **Scope** | ✅ | Target penerima (lihat di bawah) |

**Pilihan Scope:**

| Nilai | Target |
|---|---|
| **Semua** | Seluruh pengguna OCC |
| **PT Saya** | Hanya pengguna di PT yang sama |
| **Shift Ini** | Hanya shift yang sama |
| **Role Saya** | Hanya role yang sama |

3. Klik **"Kirim Pengumuman"**

Pengumuman dengan prioritas **Tinggi** ditandai dengan garis merah di sisi kiri kartu.

---

## 11. Modul Pesan Resmi

### Tujuan
Komunikasi langsung yang memerlukan **konfirmasi tanda terima** dari penerima.

### Perbedaan dengan Chat

| | Pesan Resmi | Chat |
|---|---|---|
| Sifat | Formal/resmi | Informal |
| Tanda terima | Bisa diminta (opsional) | Tidak ada |
| Riwayat | Terstruktur | Terstruktur |

### Semua Role Bisa Akses

Seluruh role (Superadmin, Owner, Direksi, Chief, SPV, Dealer, Admin System) bisa membaca dan mengirim pesan resmi.

### Cara Membaca & Konfirmasi

1. Buka halaman **Pesan**
2. Pesan yang belum dikonfirmasi memiliki highlight berbeda
3. Jika pesan memerlukan konfirmasi (`requireAck`), klik **"Konfirmasi Penerimaan"**
4. Status berubah menjadi ✅ **Dikonfirmasi**

---

## 12. Modul Chat

### Tujuan
Komunikasi informal real-time antar anggota tim dalam chat room.

### Semua Role Bisa Akses

Seluruh role bisa membaca dan mengirim pesan di semua chat room yang tersedia.

### Cara Menggunakan Chat

**Melihat Daftar Room:**
- Buka halaman **Chat**
- Daftar room ditampilkan sebagai kartu dengan nama, tipe, preview pesan terakhir, dan jumlah member

**Masuk ke Room:**
- Klik kartu room untuk membuka percakapan
- Pesan di-refresh otomatis setiap **5 detik**

**Mengirim Pesan:**
1. Ketik pesan di kotak input bawah
2. Tekan **Enter** atau klik ikon kirim (→)
3. Pesan Anda muncul di kanan (biru), pesan orang lain di kiri (abu)

**Kembali ke Daftar Room:**
- Klik tombol ← di pojok kiri atas

### Tipe Chat Room
- **Group** — grup percakapan multi-anggota
- **Direct** — pesan langsung 1-on-1

---

## 13. Modul Handover Shift

### Tujuan
Dokumentasi serah terima shift yang terstruktur agar informasi penting tidak hilang saat pergantian shift.

### Hak Akses Handover

| Aksi | Role yang Bisa |
|---|---|
| Lihat laporan handover | Semua role |
| Buat laporan handover | Owner, Chief Dealing, SPV Dealing, **Dealer**, Admin System |

> Direksi hanya bisa melihat laporan, tidak bisa membuat. SPV adalah penanggung jawab utama pengisian handover di akhir shift.

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
| Review Komplain Tertunda | Konfirmasi sudah review semua komplain terbuka |
| Review Tugas Belum Selesai | Konfirmasi sudah review tugas yang berjalan |
| Verifikasi Status Sistem | Pilih kondisi: Normal / Ada masalah kecil / Terganggu / Gangguan kritis |
| Semua Aktivitas Telah Dilog | Konfirmasi semua aktivitas shift sudah diinput |

4. Isi **Catatan Khusus** (opsional) — informasi penting untuk shift berikutnya
5. Klik **"Submit Handover"**

### Isi Laporan Handover
Setelah submit, laporan menampilkan:
- Nama pembuat, dari shift → ke shift, waktu submit
- Ringkasan kondisi sistem (dari checklist)
- Daftar **tugas yang sedang berjalan** (diambil otomatis dari sistem)
- Daftar **komplain terbuka** (diambil otomatis dari sistem)
- Catatan khusus

### Fitur Salin Laporan
Klik ikon 📋 di kartu handover untuk menyalin laporan sebagai teks ke clipboard.

---

## 14. Modul Quality Control

### Tujuan
Mencatat dan memonitor kesalahan kerja operasional tim dealing secara terstruktur.

### Hak Akses Quality Control

| Aksi | Role yang Bisa |
|---|---|
| Lihat tipe error, record, & summary | Owner, **Direksi**, Chief Dealing, SPV Dealing, Superadmin |
| Catat kesalahan (buat record) | Owner, **Direksi**, Chief Dealing, SPV Dealing, Superadmin |
| Hapus record | Owner, Chief Dealing, Superadmin |

> **Dealer dan Admin System tidak memiliki akses** ke modul Quality Control.  
> **Direksi** memiliki akses penuh (lihat dan catat) — berbeda dari modul lain di mana Direksi biasanya hanya view-only.

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
| **Anggota Tim** | ✅ | Pilih nama dealer/SPV (SPV hanya lihat PT sendiri) |
| **Jenis Kesalahan** | ✅ | Pilih dari daftar tipe error (dikelompokkan per kategori) |
| **Tanggal** | ✅ | Tanggal terjadinya kesalahan (maksimal hari ini) |
| **Jumlah Kesalahan** | ✅ | Angka 0–99 (0 = PERFECT) |
| **Catatan** | ❌ | Deskripsi singkat kejadian |

Preview skor otomatis muncul saat mengisi jumlah kesalahan.

3. Klik **"Simpan"**

### Tab di Halaman Quality

| Tab | Isi |
|---|---|
| **Summary** | Tabel ringkasan per anggota tim: total kesalahan, jumlah record, skor keseluruhan |
| **Riwayat** | Daftar semua record kesalahan (bisa di-expand untuk detail) |
| **Jenis Kesalahan** | Referensi lengkap semua tipe kesalahan |

### Filter yang Tersedia

- Rentang tanggal (dari–sampai)
- Filter PT (untuk management)
- Filter shift
- Filter anggota (di tab Riwayat)
- Filter skor (PERFECT / AVERAGE / POOR)

### Kategori Jenis Kesalahan

Tipe kesalahan dikelompokkan berdasarkan pelaku:

| Kategori | Keterangan |
|---|---|
| **DEALER** | Kesalahan yang dilakukan oleh Dealer |
| **SPV** | Kesalahan yang dilakukan oleh SPV |
| **ALL** | Berlaku untuk semua |

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

- Notifikasi yang **belum dibaca** memiliki latar biru muda
- Klik **"Tandai Semua Dibaca"** untuk membaca semua sekaligus

### Push Notification (Browser/HP)

OCC mendukung push notification — notif muncul di browser atau HP meskipun aplikasi tidak sedang dibuka:

1. Saat pertama login, browser meminta izin notifikasi
2. Klik **"Allow"** / **"Izinkan"** untuk mengaktifkan
3. Notifikasi penting muncul otomatis di sistem operasi

---

## 16. Profil & Manajemen Password

### Mengakses Halaman Profil

- Klik **nama/avatar** di bagian bawah sidebar (desktop)
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
| **Password Baru** | Password yang ingin digunakan |
| **Konfirmasi Password Baru** | Ketik ulang password baru |

Klik **"Ganti Password"**. Indikator kekuatan password ditampilkan secara live.

### Informasi Read-Only di Profil

Field berikut hanya bisa diubah oleh **Owner atau Admin System** melalui halaman Master Data:
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

## 17. Master Data (Admin)

Halaman ini hanya bisa diakses oleh: **Admin System, Owner, Superadmin**

### 17.1 Manajemen User

**Tampilan:** Tabel semua user dengan kolom: Nama | Email | Role | PT | Shift | Status | Aksi

**Aksi yang tersedia:**

| Aksi | Keterangan |
|---|---|
| Tambah User | Buat akun baru |
| Edit User | Ubah nama, email, role, PT, shift, status |
| Reset Password | Set password baru untuk user |
| Nonaktifkan | User nonaktif tidak muncul di dropdown login |

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
- Tambah, edit nama/kode/deskripsi PT
- Nonaktifkan PT

### 17.3 Manajemen Branch

Kelola kantor cabang per PT:
- Tambah, edit, hapus branch

### 17.4 Manajemen Shift

Kelola definisi shift:
- Nama shift (Pagi / Siang / Malam)
- Jam mulai dan jam selesai

### 17.5 Manajemen Tipe Aktivitas

Kelola jenis aktivitas yang bisa di-log dealer:

| Field | Keterangan |
|---|---|
| Nama Aktivitas | Nama yang muncul di dropdown log aktivitas |
| Bobot Poin | Poin per unit (misal: 5 poin per order) |
| Kategori | Kelompok aktivitas |
| Deskripsi | Penjelasan aktivitas |
| Status Aktif | Hanya tipe aktif yang muncul di form input |

---

## 18. Pengaturan Sistem

Halaman ini hanya bisa diakses dan diubah oleh: **Admin System, Owner, Superadmin**

### Parameter yang Bisa Dikonfigurasi

| Parameter | Satuan | Keterangan |
|---|---|---|
| **Target Poin Harian** | poin | Target KPI poin per dealer per hari |
| **Batas Warning Inaktivitas** | jam | Jam tanpa aktivitas sebelum muncul peringatan |
| **Batas Kritis Inaktivitas** | jam | Jam tanpa aktivitas sebelum muncul alert kritis |
| **Jendela Edit Aktivitas** | menit | Berapa menit log aktivitas bisa diedit setelah dibuat (default: 60) |
| **SLA Warning Komplain** | jam | Jam sebelum keluhan masuk status warning (default: 24) |
| **SLA Kritis Komplain** | jam | Jam sebelum keluhan masuk status kritis (default: 72) |

### Cara Edit Parameter

1. Klik ikon ✏️ di baris parameter yang ingin diubah
2. Ketik nilai baru
3. Klik ✅ untuk menyimpan atau ✕ untuk batal

### Monitor Inaktivitas Dealer

Bagian kiri halaman menampilkan:
- Ambang batas warning dan kritis (dari pengaturan)
- Jumlah dealer yang sedang bermasalah
- Daftar dealer inaktif + durasi + waktu aktivitas terakhir

### Riwayat Audit (20 Terakhir)

Tabel semua aksi write yang tercatat di sistem:

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

OCC adalah **Progressive Web App (PWA)** — bisa diinstall seperti aplikasi di HP tanpa perlu download dari Play Store/App Store.

### Cara Install di HP

**Android (Chrome):**
1. Buka OCC di browser Chrome HP
2. Muncul banner "Tambah ke Layar Utama" di bagian bawah
3. Klik **Install** / **Tambahkan**
4. Ikon OCC muncul di layar utama HP

**iOS (Safari):**
1. Buka OCC di Safari
2. Tap ikon Share (kotak dengan panah ke atas)
3. Pilih **"Add to Home Screen"**
4. Beri nama lalu tap **Add**

### Navigasi Mobile

**Bottom Tab Bar (5 tab cepat):**
- Dashboard
- Aktivitas
- KPI
- Tugas
- **Lainnya** → membuka drawer menu lengkap

**Drawer Menu:**
- Semua menu tersedia di sini
- Geser dari kiri atau klik ☰

### Offline Mode

OCC menyimpan shell aplikasi di cache browser. Jika koneksi terputus:
- Halaman yang sudah dimuat sebelumnya tetap bisa dilihat
- Input data baru memerlukan koneksi internet

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
| admin.corp@occ.id | Admin Korporat | Admin System |

> **Catatan:** Admin System termasuk kategori korporat dan muncul di tab "Semua PT", bukan di tab PT masing-masing.

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

| Email | Role | Shift |
|---|---|---|
| spv1.rfb@occ.id | SPV Dealing | Pagi |
| spv2.rfb@occ.id | SPV Dealing | Malam |
| dealer1.rfb@occ.id | Dealer | Pagi |
| dealer2.rfb@occ.id | Dealer | Siang |

### PT KPF (Tab: KPF)

| Email | Role | Shift |
|---|---|---|
| spv1.kpf@occ.id | SPV Dealing | Pagi |
| spv2.kpf@occ.id | SPV Dealing | Malam |
| dealer1.kpf@occ.id | Dealer | Pagi |
| dealer2.kpf@occ.id | Dealer | Siang |

### PT BPF (Tab: BPF)

| Email | Role | Shift |
|---|---|---|
| spv1.bpf@occ.id | SPV Dealing | Pagi |
| spv2.bpf@occ.id | SPV Dealing | Malam |
| dealer1.bpf@occ.id | Dealer | Pagi |
| dealer2.bpf@occ.id | Dealer | Siang |

### PT EWF (Tab: EWF)

| Email | Role | Shift |
|---|---|---|
| spv1.ewf@occ.id | SPV Dealing | Pagi |
| spv2.ewf@occ.id | SPV Dealing | Malam |
| dealer1.ewf@occ.id | Dealer | Pagi |
| dealer2.ewf@occ.id | Dealer | Siang |

---

*Dokumen ini dibuat dari source code OCC versi Maret 2026.*  
*Untuk pertanyaan teknis, hubungi tim pengembang.*
