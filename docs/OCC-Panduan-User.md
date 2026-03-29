# OCC — Panduan Singkat Penggunaan
**Untuk:** Tim Dealing — Solid Group  
**Versi:** 1.1 | Maret 2026

---

## 📋 CARA LOGIN

1. Buka aplikasi OCC di browser atau HP
2. Pilih **tab PT Anda** (SGB / RFB / KPF / BPF / EWF)  
   → Khusus Admin & Chief: pilih tab **"Semua PT"**
3. Pilih **nama Anda** dari dropdown
4. Masukkan **password** → klik **Masuk**

> Password default akun baru: `password123`  
> Ganti password secepatnya di menu **Profil**

---

## 🟢 DEALER — Aktivitas Harian

### 1. Log Aktivitas (WAJIB setiap hari)
1. Klik tombol **"Log Aktivitas"** (pojok kanan atas / tombol besar di mobile)
2. Pilih **Tipe Aktivitas** dari dropdown
3. Isi **Qty** (jumlah unit)
4. Tambah baris lain jika perlu → klik **"+ Add Row"**
5. Klik **"Submit Batch"** → poin KPI langsung terupdate

> Bisa edit log dalam **60 menit** setelah submit. Setelah itu tidak bisa diubah.

---

### 2. Lihat KPI Saya
- Buka menu **KPI** → lihat skor harian, mingguan, dan ranking
- Dashboard → lihat grafik tren 7 hari terakhir

---

### 3. Tugas yang Di-Assign ke Saya
- Buka menu **Tugas**
- Lihat daftar tugas milik Anda
- Klik tugas → ubah status: **New → In Progress → Completed**
- Bisa tambah komentar di detail tugas

> Mobile: **geser kartu ke kanan** = tandai selesai | **geser ke kiri** = buka detail

---

### 4. Handover Shift (di akhir shift)
1. Buka menu **Handover** → klik **"+ Handover Baru"**
2. Pilih **Dari Shift** dan **Ke Shift**
3. Centang semua item checklist
4. Isi catatan khusus (jika ada)
5. Klik **"Submit Handover"**

---

### 5. Notifikasi
- Buka menu **Notifikasi** → lihat semua pemberitahuan
- Notifikasi dikelompokkan per tipe (Tugas, Keluhan, dll)
- Aktifkan **Do Not Disturb** jika tidak ingin terganggu notifikasi (misal saat tidur)

---

---

## 🔵 SPV DEALING — Monitor & Koordinasi

### 1. Pantau Tim di Dashboard
- Buka **Dashboard** → lihat aktivitas tim hari ini, dealer inaktif, komplain terbuka

### 2. Assign Tugas
1. Buka menu **Tugas** → klik **"+ Tugas Baru"**
2. Isi judul, prioritas, tenggat
3. Pilih **Assign Ke** → nama dealer
4. Klik **"Buat Tugas"** → dealer langsung dapat notifikasi

### 3. Input / Pantau Keluhan
1. Buka menu **Keluhan** → klik **"+ Komplain Baru"**
2. Isi **Judul**
3. Pilih **PT** dan **Cabang** asal keluhan (opsional)
4. Pilih **Tipe** (Eksternal / Internal) dan **Urgensi**
5. Isi **Kronologi** → klik **"Kirim Komplain"** → timer SLA mulai berjalan
6. Update status keluhan sesuai perkembangan

> Pilih PT → Cabang muncul otomatis sesuai PT yang dipilih

**Status keluhan:** Open → In Progress → Escalated → Resolved → Closed

### 4. Handover Shift
Sama seperti Dealer — SPV **wajib** mengisi handover di akhir setiap shift.

### 5. Catat Kesalahan Tim (Quality)
1. Buka menu **Quality Control**
2. Klik **"+ Catat Kesalahan"**
3. Pilih nama anggota, jenis kesalahan, tanggal, jumlah
4. Klik **"Simpan"**

---

---

## 🟣 CHIEF DEALING / OWNER / DIREKSI — Monitoring

### Dashboard Radar
- Buka **Dashboard** → lihat status keseluruhan semua PT
- Indikator **NORMAL / HATI-HATI / KRITIS** muncul otomatis
- Lihat tabel per-PT: komplain, tugas, skor dealer

### TV Wallboard (untuk layar ruang dealing)
- Buka `/wallboard?pt=SGB` di browser TV (ganti SGB sesuai PT)
- Tidak perlu login — cocok untuk layar publik
- Data refresh otomatis setiap 30 detik

### KPI & Leaderboard
- Buka menu **KPI** → lihat ranking semua dealer per PT
- Filter periode: Harian / Mingguan / Bulanan / Tahunan
- Filter berdasarkan **PT** dan **Cabang** untuk tampilan lebih spesifik

### Filter Cabang di Seluruh Modul
Chief / Owner / Superadmin dapat memfilter data berdasarkan **Cabang** di:
- Activity Log
- KPI Leaderboard
- Daftar Tugas
- Daftar Keluhan
- Handover

> Pilih PT terlebih dahulu → pilihan Cabang muncul otomatis

---

---

## ⚙️ ADMIN SYSTEM — Kelola Data

### Tambah / Edit User
1. Buka menu **Master Data → Users**
2. Klik **"+ Tambah User"** atau klik ikon edit di baris user
3. Isi nama, email, role, PT, shift, status
4. Klik **Simpan**

### Reset Password User
1. Buka **Master Data → Users**
2. Klik **"Reset PW"** di baris user yang dimaksud
3. Masukkan password baru → konfirmasi → klik **Reset**

### Pengaturan Sistem
- Buka menu **Pengaturan** untuk ubah parameter:
  - Target poin harian
  - Batas waktu inaktivitas
  - Jendela edit aktivitas

---

---

## 📱 TIPS MOBILE

| Fitur | Cara |
|---|---|
| **Install di HP** | Chrome: menu ⋮ → "Install app" / Safari: Share → "Add to Home Screen" |
| **Buka semua menu** | Tap **"Lainnya"** di navigation bar bawah |
| **Cari halaman cepat** | Tap ikon 🔍 di header atau tekan **Ctrl+K** (desktop) |
| **Selesaikan tugas** | Geser kartu tugas ke **kanan** |
| **Buka detail tugas** | Geser kartu tugas ke **kiri** |
| **Matikan notif sementara** | Menu Notifikasi → aktifkan **Do Not Disturb** |

---

---

## ❓ MASALAH UMUM

| Masalah | Solusi |
|---|---|
| Nama tidak muncul saat login | Pilih tab PT yang benar; jika Admin pilih "Semua PT" |
| Lupa password | Hubungi Admin System atau Owner untuk reset |
| Tidak bisa edit log aktivitas | Jendela edit 60 menit sudah lewat — hubungi Admin/Owner |
| Tidak menerima notifikasi | Pastikan browser sudah diberi izin notifikasi; cek pengaturan DND |
| App lambat / tidak update | Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac) |

---

*OCC — Solid Group | v1.1 — Maret 2026*  
*Update v1.1: Form Keluhan + PT/Cabang, Filter Cabang di semua modul (Chief/Owner/Superadmin)*
