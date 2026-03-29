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

Halaman login menampilkan dropdown filter di bagian atas:

| Pilihan Tab | Menampilkan Siapa |
|---|---|
| **Semua PT — Korporat & Divisi** | Superadmin, Owner, Direksi, Chief Dealing |
| **SGB** | SPV, Dealer, Admin System PT SGB |
| **RFB** | SPV, Dealer, Admin System PT RFB |
| **KPF** | SPV, Dealer, Admin System PT KPF |
| **BPF** | SPV, Dealer, Admin System PT BPF |
| **EWF** | SPV, Dealer, Admin System PT EWF |

> **Catatan:** Chief Dealing (Kiki) adalah jabatan tingkat Divisi, bukan per-PT, sehingga hanya muncul di tab "Semua".

**Langkah 2 — Pilih Nama**

Setelah memilih tab, muncul dropdown kedua berisi daftar nama personil aktif di PT/Divisi tersebut. Pilih nama Anda.

**Langkah 3 — Masukkan Password**

Ketik password Anda di kolom yang tersedia, lalu klik **Masuk**.

### Catatan Login
- Hanya personil dengan status **aktif** yang muncul di daftar
- Jika nama tidak muncul, hubungi Admin System PT Anda atau Owner
- Password default akun baru: `password123` (wajib diganti setelah login pertama)
- Lupa password? Minta Admin System atau Owner untuk reset

---

## 3. Struktur Organisasi & Role

### Hierarki Organisasi

```
Owner
├── Direksi (Direktur Utama, Direktur Kepatuhan)
└── Chief Dealing (Kiki — level Divisi Operasional)
    ├── PT SGB
    │   ├── SPV Dealing Shift Pagi
    │   ├── SPV Dealing Shift Malam (2 orang)
    │   ├── Dealer (3 orang)
    │   └── Admin System
    ├── PT RFB (struktur sama)
    ├── PT KPF (struktur sama)
    ├── PT BPF (struktur sama)
    └── PT EWF (struktur sama)
```

### 7 Role & Deskripsi

| No | Role | Deskripsi Singkat |
|---|---|---|
| 1 | **Superadmin** | Akses penuh ke semua fitur, melewati semua pembatasan role. Untuk kebutuhan teknis/IT. |
| 2 | **Owner** | Akses penuh operasional. Dapat melihat semua PT, semua modul, mengelola user. |
| 3 | **Direksi** | Akses baca (view-only) untuk dashboard dan performa PT. Tidak bisa input data. |
| 4 | **Chief Dealing** | Kelola tim dealing, assign tugas, lihat KPI semua PT, buat pengumuman. |
| 5 | **SPV Dealing** | Monitor shift, assign tugas ke dealer, catat keluhan, catat quality error, handover shift. |
| 6 | **Dealer** | Log aktivitas harian, update status tugas yang di-assign, lihat KPI pribadi. |
| 7 | **Admin System** | Kelola master data (user, PT, shift, tipe aktivitas), pengaturan sistem, reset password. |

### Shift Kerja

| Shift | Keterangan |
|---|---|
| **Pagi** | Shift pertama |
| **Siang** | Shift kedua |
| **Malam** | Shift ketiga |

---

## 4. Tabel Hak Akses

### Keterangan Simbol
- ✅ Bisa akses / input / lakukan
- 🔍 Hanya bisa lihat (read-only)
- ❌ Tidak bisa akses
- ⭐ Hanya milik sendiri / PT sendiri

### Matrix Akses per Modul

| Modul / Fitur | Superadmin | Owner | Direksi | Chief | SPV | Dealer | Admin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Dashboard** | ✅ | ✅ | 🔍 | ✅ | ✅ | ⭐ | ❌ |
| **Log Aktivitas — Lihat** | ✅ | ✅ | ✅ | ✅ | ✅ | ⭐ | ❌ |
| **Log Aktivitas — Input** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Log Aktivitas — Edit** | ✅ | ✅ | ❌ | ❌ | ❌ | ⭐ (batas waktu) | ❌ |
| **KPI & Leaderboard** | ✅ | ✅ | ✅ | ✅ | ✅ | ⭐ | ❌ |
| **Tugas — Lihat** | ✅ | ✅ | ✅ | ✅ | ✅ | ⭐ | ❌ |
| **Tugas — Buat & Assign** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Tugas — Update Status** | ✅ | ✅ | ❌ | ✅ | ✅ | ⭐ | ❌ |
| **Komplain — Lihat** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Komplain — Buat** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Pengumuman — Lihat** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Pengumuman — Buat** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Pesan Resmi** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Chat** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Handover Shift** | ✅ | ✅ | 🔍 | ✅ | ✅ | ❌ | ❌ |
| **Quality — Lihat** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Quality — Catat Error** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **Notifikasi** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Profil Sendiri** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Master Data (Users)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Pengaturan Sistem** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Riwayat Audit** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Reset Password User Lain** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 5. Modul Dashboard

Dashboard ditampilkan berbeda sesuai role pengguna yang login.

### 5.1 Dashboard Dealer

Tampil untuk role: **Dealer**

**Widget yang tersedia:**
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

**Widget yang tersedia:**
| Widget | Penjelasan |
|---|---|
| Aktivitas Tim Hari Ini | Jumlah log aktivitas seluruh tim hari ini |
| Dealer Aktif | Jumlah dealer yang terdaftar di PT |
| Tugas Tertunda | Tugas yang belum selesai |
| Komplain Terbuka | Keluhan yang belum resolved |
| Tabel Aktivitas Tim | Log aktivitas tim hari ini (10 terbaru) |
| Inaktivitas Dealer | Dealer yang belum log aktivitas melewati batas |
| Komplain Terbuka | Daftar komplain aktif |

### 5.3 Dashboard Radar (Owner, Direksi, Superadmin)

Tampil untuk role: **Owner**, **Direksi**, **Superadmin**

**Widget yang tersedia:**
| Widget | Penjelasan |
|---|---|
| **Pulse Operasional** | Indikator status keseluruhan: NORMAL / HATI-HATI / KRITIS |
| Komplain Terbuka | Total semua PT |
| Tugas Tertunda | Total semua PT |
| Dealer Inaktif | Total dealer yang melewati batas inaktivitas |
| Top Skor Harian | Nilai tertinggi dari seluruh dealer |
| PT Radar | Tabel per-PT: jumlah komplain, tugas, top skor, status |
| Alert Panel | Daftar komplain dengan urgensi tinggi (muncul otomatis jika ada) |
| Dealer Inaktif | Daftar dealer inaktif dengan durasi |
| Leaderboard Harian | Top 10 dealer seluruh PT |

**Rumus Pulse Operasional:**
- 🔴 **KRITIS** — Lebih dari 3 komplain tinggi ATAU lebih dari 5 dealer inaktif
- 🟡 **HATI-HATI** — Ada komplain tinggi ATAU lebih dari 5 komplain terbuka ATAU lebih dari 2 dealer inaktif
- 🟢 **NORMAL** — Semua kondisi baik

---

## 6. Modul Log Aktivitas

### Tujuan
Mencatat aktivitas kerja operasional harian dealer. Setiap aktivitas yang dilog akan **otomatis memperbarui skor KPI**.

### Siapa yang Bisa Input
- **Dealer** — input aktivitas diri sendiri
- Role lain (Owner, SPV, dll) hanya bisa melihat

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
- Aktivitas hanya bisa diedit dalam **jendela waktu** tertentu setelah dibuat
- Default: **60 menit** (bisa diubah oleh Admin/Owner di Pengaturan Sistem)
- **Owner dan Admin System** dapat mengedit kapan saja tanpa batas waktu

### Tampilan Daftar Log Aktivitas
Tabel menampilkan kolom: **Waktu | Dealer | Tipe Aktivitas | Qty | Catatan | Poin**

Filter yang tersedia:
- Cari berdasarkan nama dealer atau tipe aktivitas
- Filter berdasarkan tanggal (dari–sampai)

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

Contoh: Jika "Input Order" memiliki bobot 5 poin, dan dealer input 10 order → dapat **50 poin**.

### Tampilan KPI Page (Leaderboard Global)

- Tab pilihan periode: **Harian | Mingguan | Bulanan | Tahunan**
- Grafik batang: **Top 10 Performer**
- Tabel peringkat: seluruh tim operasional

### Catatan
- Semua role bisa melihat leaderboard (kecuali Admin System)
- KPI Dealer hanya berisi data dari PT yang sama (scoped per PT)
- Snapshot KPI bisa di-generate untuk laporan periode (fitur Owner/Admin)

---

## 8. Modul Tugas (Task)

### Tujuan
Assign, track, dan update tugas operasional antar anggota tim.

### Siapa yang Bisa Membuat Tugas
- **Owner, Chief Dealing, SPV Dealing, Superadmin**

### Siapa yang Bisa Mengupdate Status
- **Dealer** — update status tugas yang di-assign ke dirinya
- **SPV, Chief, Owner, Superadmin** — update status semua tugas

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

Klik ikon status di kartu tugas untuk mengubah status:

| Status | Ikon | Progress |
|---|---|---|
| **New** | ○ Lingkaran kosong | 0% |
| **In Progress** | ⏰ Jam | 50% |
| **Completed** | ✅ Centang hijau | 100% |

### Kartu Tugas
Setiap tugas ditampilkan sebagai kartu dengan info:
- Badge prioritas (merah=tinggi, kuning=sedang, biru=rendah)
- Judul & deskripsi
- Progress bar
- Tenggat & nama assignee

### Fitur Komentar
> *Catatan: Backend mendukung komentar tugas (POST /api/tasks/:id/comments), namun UI komentar belum diimplementasikan di frontend.*

---

## 9. Modul Keluhan (Complaint)

### Tujuan
Mencatat, memonitor, dan mengelola masalah operasional dengan timer SLA.

### Siapa yang Bisa Membuat Keluhan
- **SPV Dealing, Chief Dealing, Owner, Superadmin** (dan Dealer berdasarkan kode)

### Cara Buat Keluhan

1. Klik **"+ Komplain Baru"**
2. Isi form:

| Field | Wajib | Keterangan |
|---|:---:|---|
| **Judul** | ✅ | Deskripsi singkat masalah |
| **Tipe** | ✅ | Internal / Eksternal / Sistem |
| **Urgensi** | ✅ | Rendah / Sedang / Tinggi |
| **Kronologi** | ❌ | Ceritakan apa yang terjadi, kapan, siapa yang terlibat |

3. Klik **"Kirim Komplain"**
4. **Timer SLA otomatis dimulai** sejak keluhan dibuat

### Sistem SLA Timer

| Status SLA | Kondisi | Warna Indikator |
|---|---|---|
| **Normal** | Kurang dari 24 jam | 🟢 Hijau |
| **Warning** | 24–72 jam belum resolved | 🟡 Kuning |
| **Critical** | Lebih dari 72 jam belum resolved | 🔴 Merah (berkedip) |

Timer SLA berhenti ketika status keluhan diubah ke **"Resolved"** atau **"Closed"**.

### Status Keluhan
- **Open** — baru dibuat, belum ditangani
- **In Progress** — sedang ditangani
- **Resolved** — sudah diselesaikan
- **Closed** — ditutup

### Escalation & Notifikasi Otomatis
- Keluhan baru → push notif ke **SPV, Chief Dealing, Owner**
- Escalation (SLA warning/critical) → push notif ke **Chief Dealing, Owner, Direksi**

---

## 10. Modul Pengumuman

### Tujuan
Broadcast informasi resmi dari management ke seluruh atau sebagian tim.

### Siapa yang Bisa Membuat Pengumuman
- **Owner, Chief Dealing, SPV Dealing, Admin System, Superadmin**
- Semua role bisa **melihat** pengumuman

### Cara Buat Pengumuman

1. Klik **"+ Buat Pengumuman"** (tombol hanya muncul jika berhak)
2. Isi form:

| Field | Wajib | Keterangan |
|---|:---:|---|
| **Judul** | ✅ | Judul pengumuman |
| **Isi** | ✅ | Konten pengumuman (mendukung baris baru) |
| **Prioritas** | ✅ | Normal / Tinggi |
| **Scope** | ✅ | Target penerima |

**Pilihan Scope:**
| Nilai | Keterangan |
|---|---|
| **Semua** | Seluruh pengguna OCC |
| **PT Saya** | Hanya pengguna PT yang sama |
| **Shift Ini** | Hanya shift yang sama |
| **Role Saya** | Hanya role yang sama |

3. Klik **"Kirim Pengumuman"**

### Tampilan Pengumuman
- Pengumuman prioritas **Tinggi** memiliki garis merah di sisi kiri kartu
- Menampilkan: judul, isi, waktu, pembuat, dan scope

---

## 11. Modul Pesan Resmi

### Tujuan
Komunikasi langsung yang memerlukan **konfirmasi tanda terima** dari penerima.

### Perbedaan dengan Chat
| | Pesan Resmi | Chat |
|---|---|---|
| Formal | ✅ Ya | ❌ Tidak |
| Perlu konfirmasi tanda terima | Opsional (bisa diminta) | ❌ Tidak |
| Riwayat terstruktur | ✅ Ya | ✅ Ya |

### Cara Membaca & Konfirmasi
1. Buka halaman **Pesan**
2. Pesan yang belum dikonfirmasi memiliki border biru/highlight
3. Jika pesan memerlukan konfirmasi (requireAck), klik **"Konfirmasi Penerimaan"**
4. Status berubah menjadi ✅ **Dikonfirmasi**

### Informasi yang Ditampilkan per Pesan
- Subjek & isi pesan
- Pengirim & waktu
- Status konfirmasi (jika diperlukan)

> *Catatan: Untuk mengirim pesan resmi baru, saat ini dilakukan melalui backend API. UI pengiriman belum tersedia di frontend.*

---

## 12. Modul Chat

### Tujuan
Komunikasi informal real-time antar anggota tim dalam chat room.

### Cara Menggunakan Chat

**Melihat Daftar Room:**
- Buka halaman **Chat**
- Daftar room yang tersedia ditampilkan sebagai kartu
- Setiap kartu menampilkan: nama room, tipe, preview pesan terakhir, jumlah member

**Masuk ke Room:**
- Klik kartu room untuk membuka percakapan
- Pesan lama ditampilkan, chat di-refresh setiap **5 detik** otomatis

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
Dokumentasi serah terima shift yang terstruktur — memastikan informasi penting tidak hilang saat pergantian shift.

### Siapa yang Mengisi
- **SPV Dealing** — mengisi handover di akhir shift
- Chief Dealing, Owner, Superadmin — bisa melihat dan membuat

### Cara Isi Handover Shift

1. Klik **"+ Handover Baru"**
2. Pilih:

| Field | Wajib | Keterangan |
|---|:---:|---|
| **Dari Shift** | ✅ | Shift yang sedang berakhir |
| **Ke Shift** | ✅ | Shift yang akan mengambil alih |

3. Selesaikan **Checklist Handover** (semua harus dicentang sebelum bisa submit):

| Item Checklist | Detail |
|---|---|
| ✅ Review Komplain Tertunda | Konfirmasi sudah review semua komplain terbuka |
| ✅ Review Tugas Belum Selesai | Konfirmasi sudah review tugas yang berjalan |
| ✅ Verifikasi Status Sistem | Pilih kondisi sistem: Normal / Ada masalah kecil / Terganggu / Gangguan kritis |
| ✅ Semua Aktivitas Telah Dilog | Konfirmasi semua aktivitas shift sudah diinput |

4. Isi **Catatan Khusus** (opsional) — info penting untuk shift berikutnya
5. Klik **"Submit Handover"**

### Isi Laporan Handover
Setelah submit, laporan menampilkan:
- Dari shift → ke shift + nama pembuat + waktu
- Ringkasan kondisi sistem
- Daftar **tugas yang sedang berjalan** (auto-pull dari sistem)
- Daftar **komplain terbuka** (auto-pull dari sistem)
- Catatan khusus

### Fitur Copy Laporan
Klik ikon 📋 di setiap kartu handover untuk menyalin laporan sebagai teks ke clipboard.

---

## 14. Modul Quality Control

### Tujuan
Mencatat dan memonitor kesalahan kerja operasional tim dealing secara terstruktur. Berbasis KPI Operasional internal Solid Group.

### Siapa yang Bisa Mencatat Error
- **SPV Dealing** — hanya bisa catat error untuk anggota **PT sendiri**
- **Chief Dealing, Owner, Superadmin** — bisa catat error untuk semua PT

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
| **Anggota Tim** | ✅ | Pilih nama dealer/SPV (SPV hanya lihat tim PT sendiri) |
| **Jenis Kesalahan** | ✅ | Pilih dari daftar (dikelompokkan per Objective) |
| **Tanggal** | ✅ | Tanggal terjadinya kesalahan (max: hari ini) |
| **Jumlah Kesalahan** | ✅ | Angka 0–99 (0 = PERFECT, preview skor otomatis tampil) |
| **Catatan** | ❌ | Deskripsi singkat kejadian |

3. Preview skor otomatis muncul saat mengisi jumlah kesalahan
4. Klik **"Simpan"**

### Tab di Halaman Quality

| Tab | Isi |
|---|---|
| **Summary** | Tabel ringkasan per anggota tim: total kesalahan, jumlah record, skor keseluruhan |
| **Riwayat** | Daftar semua record kesalahan (bisa di-expand untuk detail) |
| **Jenis Kesalahan** | Referensi daftar semua tipe kesalahan dari KPI Operasional |

### Filter yang Tersedia (Summary & Riwayat)
- Periode tanggal (dari–sampai)
- Filter PT (untuk management)
- Filter shift
- Filter anggota (di tab Riwayat)
- Filter skor (PERFECT / AVERAGE / POOR)

### Kategori Jenis Kesalahan
Kesalahan dikelompokkan berdasarkan **Objective Group** dari KPI Operasional:

| Kategori | Arti |
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
| Tugas baru di-assign ke seseorang | Orang yang di-assign |
| Keluhan baru dibuat | SPV, Chief Dealing, Owner |
| Escalation SLA keluhan | Chief Dealing, Owner, Direksi |
| Dealer inaktif melewati batas warning | SPV, Chief Dealing |
| Dealer inaktif melewati batas kritis | Owner, Direksi |
| Pesan chat masuk ke room | Anggota room yang relevan |
| Komentar pada tugas | Pemilik tugas |

### Tampilan Notifikasi
- Notifikasi yang **belum dibaca** ditandai dengan latar biru muda
- Klik **"Tandai Semua Dibaca"** untuk membaca semua sekaligus

### Push Notification (Browser/HP)
OCC mendukung **push notification** (notif yang muncul di browser atau HP meskipun aplikasi tidak sedang dibuka):
1. Saat pertama kali login, browser akan meminta izin notifikasi
2. Klik **"Allow"** / **"Izinkan"** untuk mengaktifkan
3. Notifikasi penting akan muncul otomatis

---

## 16. Profil & Manajemen Password

### Mengakses Halaman Profil
- Klik **nama/avatar** di sidebar (desktop) atau di drawer menu (mobile)
- Atau klik **ikon bulat** di pojok kanan atas header

### Yang Bisa Diubah Sendiri (Semua User)

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
| **Password Lama** | Password saat ini |
| **Password Baru** | Password yang ingin digunakan |
| **Konfirmasi Password Baru** | Ketik ulang password baru |

Klik **"Ganti Password"**. Indikator kekuatan password ditampilkan secara live.

### Informasi Read-Only di Profil
- Email (tidak bisa diubah sendiri)
- Role
- PT & Shift
- Status akun

Perubahan email, role, PT, atau shift hanya bisa dilakukan oleh **Owner atau Admin System** melalui halaman Master Data.

### Reset Password oleh Admin (Admin System / Owner / Superadmin)

1. Buka halaman **Users** (Master Data)
2. Temukan user di tabel
3. Klik tombol **"Reset PW"** (warna kuning/amber) di baris user tersebut
4. Masukkan password baru + konfirmasi
5. Klik **"Reset Password"**

---

## 17. Master Data (Admin)

Halaman ini hanya bisa diakses oleh: **Admin System, Owner, Superadmin**

### 17.1 Manajemen User

**Tampilan:** Tabel semua user dengan kolom: Nama | Email | Role | PT | Shift | Status | Aksi

**Fitur yang tersedia:**

| Aksi | Tombol | Keterangan |
|---|---|---|
| Tambah User | **+ Tambah User** | Buat akun baru |
| Edit User | ✏️ Edit | Ubah nama, email, role, PT, shift, status |
| Reset Password | 🔑 Reset PW | Set password baru untuk user |
| Nonaktifkan | Toggle status | User nonaktif tidak muncul di login |

**Form Tambah/Edit User:**

| Field | Keterangan |
|---|---|
| Nama | Nama lengkap |
| Email | Email login (unik, format: xxx@occ.id) |
| Role | Pilih dari 7 role |
| PT | Pilih PT (untuk SPV/Dealer/Admin PT) |
| Shift | Shift kerja |
| Status Aktif | Aktif/nonaktif (toggle) |
| Password | Untuk user baru: set password awal |

### 17.2 Manajemen PT

Kelola daftar PT (SGB, RFB, KPF, BPF, EWF):
- Tambah PT baru
- Edit nama, kode, deskripsi PT
- Nonaktifkan PT

### 17.3 Manajemen Branch

Kelola kantor cabang per PT:
- Tambah/edit/hapus branch

### 17.4 Manajemen Shift

Kelola definisi shift:
- Nama shift (Pagi/Siang/Malam)
- Jam mulai & jam selesai

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

Halaman ini menampilkan dan memungkinkan perubahan parameter operasional.

**Siapa yang bisa mengubah:** Admin System, Owner, Superadmin

### Parameter yang Bisa Dikonfigurasi

| Parameter | Satuan | Default | Keterangan |
|---|---|---|---|
| **Target Poin Harian** | poin | — | Target KPI poin per dealer per hari |
| **Batas Warning Inaktivitas** | jam | — | Jam tanpa aktivitas sebelum peringatan |
| **Batas Kritis Inaktivitas** | jam | — | Jam tanpa aktivitas sebelum alert kritis |
| **Jendela Edit Aktivitas** | menit | 60 | Berapa menit aktivitas bisa diedit setelah dibuat |
| **SLA Warning Komplain** | jam | 24 | Jam sebelum komplain masuk status warning |
| **SLA Kritis Komplain** | jam | 72 | Jam sebelum komplain masuk status kritis |

### Cara Edit Pengaturan
1. Klik ikon ✏️ di baris pengaturan yang ingin diubah
2. Ketik nilai baru di kotak input
3. Klik ✅ untuk menyimpan atau ✕ untuk batal

### Monitor Inaktivitas Dealer

Bagian kiri halaman menampilkan:
- Ambang batas warning dan kritis (dari pengaturan)
- Jumlah dealer yang sedang bermasalah
- Daftar dealer inaktif + durasi inaktif + waktu aktivitas terakhir

### Riwayat Audit (20 Terakhir)

Tabel menampilkan semua aksi write yang dilakukan di sistem:

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

OCC adalah **Progressive Web App (PWA)** — artinya bisa diinstall seperti aplikasi di HP tanpa perlu download dari Play Store/App Store.

### Cara Install di HP

**Android (Chrome):**
1. Buka OCC di browser Chrome HP
2. Muncul banner/prompt "Tambah ke Layar Utama" di bagian bawah
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

**Hamburger Menu (drawer):**
- Semua menu tersedia di sini
- Geser dari kiri atau klik ☰

### Offline Mode
OCC menyimpan shell aplikasi di cache browser. Jika koneksi terputus:
- Halaman yang sudah dimuat sebelumnya tetap bisa dilihat
- Input data baru memerlukan koneksi internet

### Push Notification di Mobile
Setelah install sebagai PWA, push notification akan muncul di notifikasi sistem HP (seperti aplikasi biasa), bahkan saat OCC tidak sedang dibuka.

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

### PT SGB (Tab: SGB)

| Email | Nama | Role | Shift |
|---|---|---|---|
| eko.sgb@occ.id | Eko | SPV Dealing | Pagi |
| fahrul.sgb@occ.id | Fahrul | SPV Dealing | Malam |
| adid.sgb@occ.id | Adid | SPV Dealing | Malam |
| aziz.sgb@occ.id | Abdul Aziz | Dealer | Pagi |
| amel.sgb@occ.id | Amel | Dealer | Siang |
| dealer.sgb@occ.id | Dealer SGB | Dealer | Malam |
| admin.sgb@occ.id | Admin SGB | Admin System | — |

### PT RFB (Tab: RFB)

| Email | Role |
|---|---|
| spv1.rfb@occ.id | SPV Dealing |
| spv2.rfb@occ.id | SPV Dealing |
| dealer1.rfb@occ.id | Dealer |
| dealer2.rfb@occ.id | Dealer |
| admin.rfb@occ.id | Admin System |

### PT KPF (Tab: KPF)

| Email | Role |
|---|---|
| spv1.kpf@occ.id | SPV Dealing |
| spv2.kpf@occ.id | SPV Dealing |
| dealer1.kpf@occ.id | Dealer |
| dealer2.kpf@occ.id | Dealer |
| admin.kpf@occ.id | Admin System |

### PT BPF (Tab: BPF)

| Email | Role |
|---|---|
| spv1.bpf@occ.id | SPV Dealing |
| spv2.bpf@occ.id | SPV Dealing |
| dealer1.bpf@occ.id | Dealer |
| dealer2.bpf@occ.id | Dealer |
| admin.bpf@occ.id | Admin System |

### PT EWF (Tab: EWF)

| Email | Role |
|---|---|
| spv1.ewf@occ.id | SPV Dealing |
| spv2.ewf@occ.id | SPV Dealing |
| dealer1.ewf@occ.id | Dealer |
| dealer2.ewf@occ.id | Dealer |
| admin.ewf@occ.id | Admin System |

---

## Lampiran: Hal-hal yang Perlu Dicek / Potensi Gap

Berikut adalah daftar area yang mungkin perlu dikonfirmasi atau dikembangkan lebih lanjut:

### Fitur yang Ada di Backend tapi Belum Ada UI-nya
- [ ] **Kirim Pesan Resmi** — Backend ada (POST /api/messages), UI input belum tersedia
- [ ] **Buat Chat Room baru** — Backend ada, tombol "Buat Room" belum di UI
- [ ] **Komentar Tugas** — Backend ada (POST /api/tasks/:id/comments), UI belum ada
- [ ] **Generate KPI Snapshot** — Backend ada, tombol generate belum di UI dashboard

### Pertanyaan yang Perlu Dikonfirmasi
- [ ] Apakah Dealer boleh membuat keluhan? (kode mengizinkan, perlu konfirmasi kebijakan)
- [ ] Siapa yang bisa menutup (closed) keluhan? SPV atau hanya Owner?
- [ ] Apakah ada fitur laporan/export data ke Excel?
- [ ] Apakah perlu fitur edit keluhan setelah dibuat?
- [ ] Apakah SPV bisa melihat data PT lain?
- [ ] Apakah perlu notifikasi pengumuman baru?
- [ ] Apakah skor quality error terintegrasi ke KPI poin dealer?

### Fitur yang Mungkin Perlu Ditambahkan
- [ ] Export laporan KPI ke PDF/Excel
- [ ] Laporan bulanan otomatis per PT
- [ ] Filter log aktivitas per dealer (bukan hanya per tanggal)
- [ ] Fitur pencarian global
- [ ] Fitur notifikasi: pengumuman baru
- [ ] History perubahan tugas (siapa yang update, kapan)
- [ ] Fitur approval keluhan oleh SPV sebelum diteruskan ke Owner

---

*Dokumen ini dibuat secara otomatis dari source code OCC versi Maret 2026.*  
*Untuk pertanyaan teknis, hubungi tim pengembang.*
