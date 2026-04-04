# OCC — UI/UX Specification

**OCC (Operational Control Center)** — Internal web app Solid Group untuk tim dealing.

---

## 1. Tech Stack

### Frontend
| Kategori | Teknologi | Versi |
|---|---|---|
| Framework | **React** | 19 |
| Build Tool | **Vite** | 7 |
| Bahasa | **TypeScript** | - |
| Routing | **Wouter** | 3.x |
| State / Data Fetching | **TanStack React Query** | 5.x |
| Styling | **Tailwind CSS** | 4.x |
| Komponen UI | **shadcn/ui** (Radix UI primitives) | - |
| Icons | **Lucide React** | - |
| Charts | **Recharts** | 2.x |
| Animasi | **Framer Motion** | - |
| Form | **React Hook Form** + **Zod** | - |
| Date | **date-fns** | 3.x |
| Toast | **Radix UI Toast** + **Sonner** | - |
| PWA | Service Worker native | - |
| Notifikasi Push | **Web Push API** (VAPID) | - |

### Backend
| Kategori | Teknologi |
|---|---|
| Runtime | **Node.js** |
| Framework | **Express.js** v5 |
| Database | **PostgreSQL** |
| ORM | **Drizzle ORM** |
| Auth | **JWT** (Bearer token) + **bcryptjs** |
| Push Notifications | **web-push** (VAPID keys) |

### Monorepo
- **Package manager**: pnpm workspace
- **Packages**: `artifacts/occ-web` (frontend), `artifacts/api-server` (backend), `lib/db` (schema), `lib/api-client-react` (generated client)

---

## 2. Tipografi

| Jenis | Font |
|---|---|
| UI / Body | **Plus Jakarta Sans** (Google Fonts, sans-serif) |
| Monospace | **JetBrains Mono** (untuk kode, timestamp, ID) |

---

## 3. Warna & Tema

**Tema default: Dark only** (tidak ada toggle light/dark mode).

### Palet Utama (HSL)

| Token | Nilai | Keterangan |
|---|---|---|
| `background` | `222, 47%, 5%` | Latar utama — navy sangat gelap |
| `foreground` | `210, 40%, 98%` | Teks utama — hampir putih |
| `primary` | `217, 91%, 60%` | Biru terang — aksi utama, link aktif |
| `accent` | `160, 84%, 39%` | Emerald/teal — status sukses, highlight |
| `destructive` | `0, 84%, 60%` | Merah — error, delete, eskalasi |
| `muted` | `215, 27%, 12%` | Latar sekunder — card muted, input |
| `border` | `215, 27%, 15%` | Border halus |
| `card` | `222, 47%, 7%` | Latar kartu |
| `sidebar` | `222, 47%, 6%` | Latar sidebar (sedikit lebih gelap dari card) |

### Warna Status

| Status | Warna |
|---|---|
| Sukses / Selesai | Emerald (`text-emerald-500`, `bg-emerald-500/10`) |
| Warning / Berjalan | Amber (`text-amber-500`, `bg-amber-500/10`) |
| Error / Kritis | Destructive red |
| Info / Baru | Primary blue |
| Muted / Dibatalkan | Gray muted |

### Warna Prioritas

| Prioritas | Warna |
|---|---|
| High | Destructive red |
| Medium | Amber |
| Low | Blue |

---

## 4. Layout & Struktur Halaman

### Desktop (≥ md = 768px)

```
┌─────────────────────────────────────────────┐
│  SIDEBAR (kiri, fixed, w-64 = 256px)        │
│  ┌───────────────┐  ┌─────────────────────┐ │
│  │  Logo OCC     │  │  MAIN CONTENT       │ │
│  │  User card    │  │  (flex-1, scroll)   │ │
│  │  Nav items    │  │                     │ │
│  │  ...          │  │                     │ │
│  │  Logout       │  │                     │ │
│  └───────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────┘
```

- Sidebar **fixed** di kiri, tidak ikut scroll
- Konten utama `flex-1`, bisa scroll vertikal
- Padding konten: `p-6` (24px)

### Mobile (< md)

```
┌─────────────────────┐
│  MAIN CONTENT       │
│  (full width)       │
│  Padding bawah pb-20│
│  untuk nav bar      │
│                     │
└─────────────────────┘
│ BOTTOM NAV BAR      │  ← fixed bottom, z-50
│  🏠  📋  📊  ✅  🚨 │
└─────────────────────┘
```

- **Bottom navigation bar** 5 item: Dashboard, Aktivitas, KPI, Tugas, Komplain
- Sidebar desktop **disembunyikan** (`hidden md:flex`)
- Hamburger menu → slide-in sidebar dari kiri (overlay + backdrop)

---

## 5. Sidebar

### Posisi & Dimensi
- **Posisi**: Kiri, fixed height penuh (`h-full`)
- **Lebar**: `w-64` (256px) desktop, `w-72 max-w-[85vw]` mobile (overlay)
- **Background**: `bg-sidebar` (navy lebih gelap dari background)
- **Border**: `border-r border-border` (border kanan tipis)

### Isi Sidebar (urutan dari atas ke bawah)

```
Logo OCC  (gradient text primary → accent)
──────────────────────────────
User Card  (avatar inisial, nama, jabatan)
──────────────────────────────
NAV ITEMS:
  🏠  Dashboard
  ⚡  Aktivitas
  📊  KPI & Rank
  ✅  Tugas
  🚨  Komplain
  🔄  Handover
  🏢  Branch Overview
  💬  Chat
  📢  Pengumuman
  🔔  Notifikasi  (badge unread count)
──────────────────────────────
ADMIN ONLY:
  👥  Users (Master Data)
  ⚙️  System
──────────────────────────────
  📺  TV Wallboard  (buka tab baru)
──────────────────────────────
  🔴  Logout
```

### Nav Item Style
- Aktif: `bg-primary/10 text-primary` + border `border-primary/20`
- Hover: `bg-muted`
- Inactive: `text-muted-foreground`
- Rounded: `rounded-lg`
- Padding: `px-3 py-2.5`

---

## 6. Komponen UI Utama

### Card
- Background: `bg-card border rounded-2xl p-5 shadow-sm`
- Hover: `hover:shadow-md transition-shadow`
- Border radius: `rounded-2xl` (16px)

### Button
- Primary: `bg-primary text-white`
- Outline: `border border-border`
- Destructive: `bg-destructive text-white`
- Ghost: transparent, hover highlight
- Size default: `h-9 px-4`

### Modal / Dialog
- Komponen: `ResponsiveModal` (wrapper Radix Dialog)
- Desktop: modal center screen
- Mobile: bottom sheet (Vaul drawer)
- Backdrop: `bg-black/50 backdrop-blur-sm`

### Badge / Status Chip
- Rounded: `rounded-full`
- Style: `bg-{color}/10 text-{color} border border-{color}/20`

### Form Elements
- Input: `h-10 px-3 rounded-md bg-background border text-sm`
- Textarea: `min-h-[80px] rounded-md bg-background border resize-none`
- Select: `h-9 px-3 rounded-md bg-background border text-sm`

### Toast Notification
- Library: Radix UI Toast
- Posisi: bottom-right (desktop), bottom (mobile)

---

## 7. Halaman & Fitur

| Route | Halaman | Deskripsi |
|---|---|---|
| `/dashboard` | Dashboard | Ringkasan KPI, aktivitas terbaru, status shift |
| `/activity-logs` | Log Aktivitas | CRUD log kegiatan harian per dealer |
| `/kpi` | KPI & Rank | Grafik performa, ranking, target vs aktual |
| `/tasks` | Manajemen Tugas | Tiket tugas (stepper status, edit, komentar) |
| `/complaints` | Komplain | Thread tiket komplain + timeline + notif |
| `/handover` | Shift Handover | Checklist handover, carry-over komplain |
| `/branches` | Branch Overview | Analytics per cabang (Chief+) |
| `/chats` | Chat | Pesan internal antar user |
| `/announcements` | Pengumuman | Broadcast info dari SPV+ |
| `/notifications` | Notifikasi | Inbox notifikasi sistem + push |
| `/users` | Master Data | CRUD user (Admin+) |
| `/system` | System Settings | Konfigurasi sistem (Admin+) |
| `/wallboard` | TV Wallboard | Tampilan real-time untuk layar TV |

---

## 8. Responsivitas

| Breakpoint | Layout |
|---|---|
| `< 768px` (mobile) | Bottom nav, full width content, no sidebar |
| `≥ 768px` (md, tablet+) | Fixed left sidebar 256px + main content |

- **Mobile-first** pada semua komponen
- Swipe gesture pada task cards (swipe kanan = selesai, swipe kiri = detail)
- Bottom sheet modal menggantikan dialog center di mobile

---

## 9. PWA (Progressive Web App)

- **Service Worker**: `sw.js`, cache key `occ-shell-v4`
- **Cache strategy**: Cache-first untuk assets statis; network-first untuk API
- **Navigasi HTML** tidak di-cache (selalu fresh dari network)
- **Install prompt**: Bisa di-install di homescreen Android/iOS
- **Push Notifications**: Web Push API dengan VAPID keys
  - Notifikasi internal: tersimpan di database (`notifications` table)
  - Push notification: dikirim via `web-push` ke browser

---

## 10. Autentikasi

- **Metode**: JWT Bearer Token
- **Storage**: `localStorage` key `occ_token`
- **Login**: Pilih PT → pilih nama → masukkan password (bukan email/username)
- **Token lifetime**: dikontrol di server (`jsonwebtoken`)
- **Auto-logout**: Redirect ke `/login` jika token expired/invalid
- **Show/hide password**: Ada toggle ikon mata di input password

---

## 11. Role & Akses

| Role | Level |
|---|---|
| Superadmin | Semua PT, akses penuh |
| Owner | Semua PT |
| Direksi | Satu PT, data lebar |
| Chief Dealing | Satu PT |
| SPV Dealing | Satu PT, satu branch |
| Co-SPV Dealing | Satu PT, satu branch |
| Dealer | Hanya data sendiri |
| Admin System | Konfigurasi sistem |

**5 PT**: SGB, RFB, KPF, BPF, EWF  
**3 Shift**: Pagi, Siang, Malam

---

## 12. Konvensi Kode

- **Komponen**: PascalCase, file `.tsx`
- **Hooks**: camelCase, prefix `use`
- **API client**: auto-generated dari OpenAPI spec via `orval`, di `lib/api-client-react`
- **Schema DB**: Drizzle ORM, di `lib/db/src/schema/`
- **Import alias**: `@/` → `artifacts/occ-web/src/`
- **Utility**: `cn()` dari `clsx` + `tailwind-merge` untuk class merging
