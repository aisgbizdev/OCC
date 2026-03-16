
# OCC Project Structure Master
## Operational Control Center – Dealing
Solid Group

---

# 1. TUJUAN DOKUMEN

Dokumen ini menjelaskan **struktur folder project OCC** agar:

- pengembangan aplikasi lebih rapi
- frontend dan backend tidak tercampur
- mudah dikembangkan di masa depan
- Replit Agent atau developer mengikuti arsitektur yang sama

Struktur ini dirancang untuk aplikasi **Web App + PWA (mobile web view)**.

---

# 2. ARSITEKTUR UMUM

Aplikasi OCC dibagi menjadi tiga lapisan utama:

1. Frontend (UI / Dashboard)
2. Backend (API / Logic)
3. Database (Schema / Migration)

Struktur global:

```
/occ-app
│
├── frontend
├── backend
├── database
├── shared
├── docs
├── config
└── scripts
```

---

# 3. FRONTEND STRUCTURE

Folder frontend berisi seluruh tampilan dashboard.

Contoh struktur:

```
/frontend
│
├── public
│   ├── favicon
│   └── manifest.json
│
├── src
│   ├── pages
│   │   ├── dashboard
│   │   ├── aktivitas
│   │   ├── tasks
│   │   ├── complaints
│   │   ├── messages
│   │   ├── chat
│   │   ├── kpi
│   │   ├── profile
│   │   └── settings
│   │
│   ├── components
│   │   ├── cards
│   │   ├── tables
│   │   ├── charts
│   │   ├── modals
│   │   └── layout
│   │
│   ├── layouts
│   │   ├── dashboardLayout
│   │   └── authLayout
│   │
│   ├── services
│   │   ├── apiClient
│   │   └── authService
│   │
│   ├── store
│   │   └── stateManagement
│   │
│   ├── utils
│   │   ├── helpers
│   │   └── formatters
│   │
│   └── styles
│       ├── globals.css
│       └── theme.css
```

Tujuan:

- komponen UI reusable
- halaman mudah dikembangkan
- layout konsisten

---

# 4. BACKEND STRUCTURE

Backend berisi seluruh logic aplikasi dan API.

Contoh struktur:

```
/backend
│
├── src
│   ├── controllers
│   │   ├── activityController
│   │   ├── taskController
│   │   ├── complaintController
│   │   ├── messageController
│   │   └── userController
│   │
│   ├── services
│   │   ├── activityService
│   │   ├── taskService
│   │   ├── complaintService
│   │   └── kpiService
│   │
│   ├── repositories
│   │   ├── activityRepository
│   │   ├── taskRepository
│   │   └── complaintRepository
│   │
│   ├── routes
│   │   ├── activityRoutes
│   │   ├── taskRoutes
│   │   ├── complaintRoutes
│   │   ├── messageRoutes
│   │   └── authRoutes
│   │
│   ├── middlewares
│   │   ├── authMiddleware
│   │   ├── roleMiddleware
│   │   └── errorHandler
│   │
│   ├── config
│   │   └── serverConfig
│   │
│   └── app.js
```

Tujuan:

- memisahkan controller, service, dan database access
- memudahkan maintenance

---

# 5. DATABASE STRUCTURE

Folder database berisi schema dan migration.

```
/database
│
├── schema
│   ├── users.sql
│   ├── roles.sql
│   ├── activities.sql
│   ├── tasks.sql
│   ├── complaints.sql
│   └── kpi.sql
│
├── migrations
│   └── migration_history
│
└── seeds
    ├── initial_roles
    ├── initial_permissions
    └── activity_types
```

Tujuan:

- perubahan database terkontrol
- mudah deploy ulang

---

# 6. SHARED MODULES

Folder shared digunakan untuk logic yang dipakai frontend dan backend.

```
/shared
│
├── constants
│   ├── roles
│   ├── activityTypes
│   └── complaintTypes
│
├── validation
│   └── schemas
│
└── types
```

---

# 7. DOCS FOLDER

Berisi dokumen desain sistem.

```
/docs
│
├── OCC_Final_Master_Blueprint.md
├── OCC_Dashboard_Command_Center_Layout.md
├── OCC_Database_ERD.md
└── OCC_Ultimate_Build_Prompt.md
```

---

# 8. CONFIG FOLDER

Berisi konfigurasi aplikasi.

```
/config
│
├── env.example
├── database.config
├── server.config
└── app.config
```

---

# 9. SCRIPTS

Script utilitas untuk developer.

```
/scripts
│
├── seedDatabase
├── resetDatabase
└── buildProduction
```

---

# 10. ALUR DATA APLIKASI

Flow sederhana:

User Action → Frontend → API Request → Backend Controller → Service → Repository → Database

Response kembali:

Database → Service → Controller → Frontend → Dashboard Update

---

# 11. KEUNTUNGAN STRUKTUR INI

Dengan struktur ini:

- project mudah dipahami developer baru
- modul tidak saling bercampur
- backend scalable
- frontend reusable
- dokumentasi tersimpan rapi

---

# 12. CATATAN UNTUK REPLIT AGENT

Saat membangun OCC:

1. Ikuti struktur folder ini.
2. Jangan mencampur logic backend dengan frontend.
3. Gunakan folder docs sebagai referensi desain sistem.
4. Pastikan API modular sesuai controller.
5. Gunakan schema database sesuai ERD.

---

# 13. KESIMPULAN

Project Structure Master ini memastikan bahwa:

- pembangunan OCC terarah
- struktur project stabil sejak awal
- pengembangan ke depan lebih mudah

Dokumen ini menjadi **fondasi organisasi kode aplikasi OCC**.
