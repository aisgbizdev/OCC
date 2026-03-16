
# OCC FINAL MASTER BLUEPRINT
## Operational Control Center – Dealing
Solid Group

---

## 1. DEFINISI SISTEM

**OCC (Operational Control Center)** adalah aplikasi internal yang digunakan untuk:

- Memantau aktivitas tim dealing  
- Mengukur kinerja individu melalui KPI operasional  
- Mencatat komunikasi operasional secara resmi  
- Memberikan visibilitas real-time kepada manajemen  

OCC **tidak terhubung dengan sistem trading** dan **tidak menggantikan sistem transaksi** seperti BAS, BOM, atau eTrade.

Fungsi OCC adalah **monitoring aktivitas operasional dan kinerja tim dealing**.

---

## 2. TUJUAN SISTEM

Tujuan utama OCC:

1. Transparansi aktivitas operasional  
2. Monitoring kinerja tim secara real-time  
3. Menciptakan audit trail komunikasi kerja  
4. Mempermudah evaluasi harian, mingguan, dan bulanan  
5. Memberikan visibilitas kepada owner dan direksi  

---

## 3. PENGGUNA SISTEM

### Owner
Melihat seluruh kondisi operasional.

### Direksi PT
Memantau performa dealing di PT masing-masing.

### Chief Dealing
Mengelola operasional seluruh tim dealing.

### SPV Dealing
Mengelola shift dan tugas tim.

### Dealer
Mencatat aktivitas kerja harian.

### Admin System
Mengelola konfigurasi sistem.

---

## 4. STRUKTUR ORGANISASI DALAM SISTEM

Struktur organisasi dalam OCC:

- PT
- Cabang
- Shift
- User

PT default:

- SGB  
- RFB  
- KPF  
- BPF  
- EWF  

PT dapat ditambah atau dihapus oleh Admin.

---

## 5. ROLE & PERMISSION

### Owner
Akses penuh terhadap seluruh sistem.

### Direksi
Melihat dashboard operasional dan KPI tim.

### Chief Dealing
Mengelola aktivitas tim, tugas, komplain, dan KPI.

### SPV
Memantau dealer, memberikan tugas, dan mengelola shift.

### Dealer
Mencatat aktivitas dan melihat KPI pribadi.

### Admin System
Mengelola konfigurasi dan master data sistem.

---

## 6. ARSITEKTUR SISTEM

OCC bersifat:

- Mobile First  
- Web Application  
- PWA Compatible  

Mendukung:

- Akses HP
- Akses Desktop
- Push Notification

---

## 7. DASHBOARD SISTEM

### Personal Dashboard (Dealer)

Menampilkan:

- Daily Target Meter
- Ranking KPI
- Aktivitas hari ini
- Tugas aktif
- Quick Activity Button

### Operational Dashboard (SPV / Chief)

Menampilkan:

- Aktivitas tim
- Dealer aktif / tidak aktif
- Komplain aktif
- Status tugas

### Radar Dashboard (Owner)

Menampilkan:

- Status PT
- Status shift
- Dealer inactivity
- Operational Pulse

---

## 8. DAILY OPERATIONAL PULSE

Indikator utama:

- Aktivitas tim
- Komplain
- Shift activity
- Dealer inactivity

Status indikator:

- Hijau = normal
- Kuning = perhatian
- Merah = masalah

---

## 9. ACTIVITY LOG

Dealer mencatat aktivitas pekerjaan.

### Cara Input

Klik **+ Aktivitas** lalu pilih jenis aktivitas.

Contoh aktivitas:

- Validasi Deposit
- Validasi Withdrawal
- Pembukaan Akun
- Verifikasi Dokumen
- Investigasi Transaksi
- Monitoring Sistem

### Field Input

- Aktivitas
- Jumlah
- Catatan (opsional)

### Field Otomatis

- User
- PT
- Cabang
- Shift
- Tanggal
- Jam

---

## 10. MASTER ACTIVITY MANAGEMENT

Admin dapat:

- Menambah aktivitas
- Mengedit aktivitas
- Menghapus aktivitas
- Menentukan bobot poin

---

## 11. KPI SYSTEM

Performa dihitung dari aktivitas yang dicatat.

### KPI Time Frame

- Harian
- Mingguan
- Bulanan
- Quartal
- Tahunan

### Leaderboard

Semua dealer dapat melihat ranking.

Detail KPI hanya dapat dilihat oleh:

- User sendiri
- Manajemen

---

## 12. TASK MANAGEMENT

Digunakan oleh Chief dan SPV.

### Elemen Task

- Judul tugas
- Deskripsi
- Assigned user
- Deadline
- Status
- Progress

Status:

- Baru
- Proses
- Selesai
- Overdue

---

## 13. COMPLAINT MANAGEMENT

Digunakan untuk mencatat masalah operasional.

Contoh:

- Deposit delay
- Margin mismatch
- Error transaksi

---

## 14. CHAT & MESSAGE SYSTEM

Jenis komunikasi:

- Official message
- Personal chat
- Group chat

Semua komunikasi tersimpan sebagai **audit trail**.

---

## 15. SHIFT HANDOVER

Digunakan saat pergantian shift.

Isi laporan:

- Kasus pending
- Komplain belum selesai
- Aktivitas lanjutan

---

## 16. NOTIFICATION SYSTEM

Digunakan untuk:

- Tugas baru
- Pesan baru
- Pengumuman
- Dealer inactive
- Task overdue

---

## 17. MASTER DATA MANAGEMENT

### Master PT

- Add
- Edit
- Delete
- Activate / Deactivate

### Master Cabang

- Add
- Edit
- Delete

### Master Shift

- Add
- Edit
- Delete

### Master Aktivitas

- Add
- Edit
- Delete
- Set weight score

---

## 18. DATA EDIT RULE

### Dealer
- Bisa input aktivitas
- Bisa edit dalam waktu terbatas
- Tidak bisa delete

### SPV
- Bisa edit aktivitas dealer

### Chief
- Bisa edit dan menghapus aktivitas tertentu

### Admin
- Akses penuh

---

## 19. INACTIVITY DETECTION

Contoh aturan:

- 2 jam tanpa aktivitas → warning
- 4 jam tanpa aktivitas → alert

---

## 20. SECURITY & AUDIT

Sistem mencatat:

- Login
- Activity log
- Task
- Chat
- Perubahan data

---

## 21. IMPLEMENTASI SISTEM

### Phase 1
Implementasi dealing pusat.

### Phase 2
Stabilisasi penggunaan.

### Phase 3
Ekspansi ke cabang.

---

## 22. MANFAAT SISTEM

### Untuk Manajemen

- Monitoring operasional real time
- Evaluasi kinerja tim
- Transparansi aktivitas

### Untuk Tim Dealing

- Pekerjaan tercatat
- Kinerja terukur
- Komunikasi resmi

---

**Dokumen ini merupakan blueprint final sistem OCC sebelum implementasi development.**
