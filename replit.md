# OCC — Operational Control Center

## Overview

Internal web application for Solid Group's Dealing department. Monitors operational activities, tracks KPI performance, enables internal communication, and provides management visibility through dashboards.

**Not** a trading system. Not connected to BAS, BOM, eTrade, or ProTrader.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Auth**: JWT (jsonwebtoken + bcryptjs), stored in localStorage as `occ_token`
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, wouter, recharts, framer-motion, date-fns
- **State**: TanStack Query for server state, React Context for auth

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/           # Express API server
│   └── occ-web/              # React + Vite frontend (served at /)
│       └── src/
│           ├── pages/        # login, dashboard, activity-logs, kpi, tasks, complaints,
│           │                 # announcements, messages, chats, handover, notifications, system
│           ├── components/
│           │   ├── layout.tsx           # Sidebar + mobile bottom nav + header
│           │   ├── fab.tsx              # Floating Action Button (speed dial)
│           │   ├── batch-activity-form.tsx  # Batch activity input form
│           │   ├── responsive-modal.tsx # Dialog on desktop, Bottom Sheet on mobile
│           │   └── sla-timer.tsx        # Complaint SLA color timer badge
│           └── lib/
│               ├── auth.tsx             # AuthProvider + useAuth context
│               └── fetch-interceptor.ts # JWT token injection on /api requests
│   └── api-server/src/
│       ├── routes/
│           │   ├── index.ts          # Route aggregator (14 routers)
│           │   ├── health.ts         # Health check
│           │   ├── auth.ts           # Login/logout/me
│           │   ├── users.ts          # User CRUD
│           │   ├── master.ts         # PTs, branches, shifts, activity types
│           │   ├── activity-logs.ts  # Activity CRUD + batch + KPI engine
│           │   ├── kpi.ts            # Scores, leaderboard, snapshots
│           │   ├── tasks.ts          # Task CRUD + comments + notifications
│           │   ├── complaints.ts     # Complaint CRUD + SLA timer
│           │   ├── announcements.ts  # Announcement CRUD
│           │   ├── messages.ts       # Official messages + acknowledgements
│           │   ├── chats.ts          # Chat rooms + messages
│           │   ├── handover.ts       # Shift handover logs
│           │   ├── notifications.ts  # User notifications + read/read-all
│           │   └── system.ts         # System settings, audit logs, inactivity
│           ├── helpers/
│           │   └── audit.ts          # createAuditLog, createNotification helpers
│           └── middlewares/
│               └── auth.ts           # JWT auth, requireRole
├── lib/
│   ├── api-spec/             # OpenAPI spec + Orval codegen config
│   ├── api-client-react/     # Generated React Query hooks
│   ├── api-zod/              # Generated Zod schemas from OpenAPI
│   └── db/                   # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── roles.ts      # roles, permissions, role_permissions
│           ├── organization.ts # pts, branches, shifts
│           ├── users.ts      # users
│           ├── activities.ts # activity_types, activity_logs
│           ├── tasks.ts      # tasks, task_comments
│           ├── complaints.ts # complaints
│           ├── communication.ts # announcements, messages, chats
│           ├── operations.ts # handover_logs
│           ├── kpi.ts        # kpi_scores, kpi_snapshots
│           └── system.ts     # notifications, audit_logs, system_settings
├── scripts/
│   └── src/seed.ts           # Database seed script
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database (24 tables)

roles, permissions, role_permissions, users, pts, branches, shifts, activity_types, activity_logs, tasks, task_comments, complaints, announcements, messages, message_acknowledgements, chats, chat_members, chat_messages, handover_logs, kpi_scores, kpi_snapshots, notifications, audit_logs, system_settings

## Roles (6)

1. Owner — full access
2. Direksi — view dashboards and PT performance
3. Chief Dealing — manage team, assign tasks, view KPI
4. SPV Dealing — monitor shift, assign tasks, create complaints
5. Dealer — log activities, update tasks, view personal KPI
6. Admin System — manage configuration and master data

## Demo Accounts (password: password123)

- owner@occ.id (Owner)
- direksi@occ.id (Direksi)
- chief@occ.id (Chief Dealing)
- spv@occ.id (SPV Dealing)
- dealer1@occ.id, dealer2@occ.id, dealer3@occ.id (Dealer)
- admin@occ.id (Admin System)

## API Endpoints (all implemented & verified)

### Auth
- `POST /api/auth/login` — JWT login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user profile

### Master Data
- `GET/POST /api/users`, `GET/PUT/DELETE /api/users/:id`
- `GET/POST /api/pts`, `GET/PUT/DELETE /api/pts/:id`
- `GET/POST /api/branches`, `GET/PUT/DELETE /api/branches/:id`
- `GET/POST /api/shifts`, `GET/PUT/DELETE /api/shifts/:id`
- `GET/POST /api/activity-types`, `GET/PUT/DELETE /api/activity-types/:id`

### Activity Logs & KPI
- `GET/POST /api/activity-logs` — List/create activity logs
- `POST /api/activity-logs/batch` — Batch create activities
- `PUT /api/activity-logs/:id` — Update (time-limited edit window)
- `GET /api/kpi/scores` — List KPI scores
- `GET /api/kpi/leaderboard` — Leaderboard by period
- `GET /api/kpi/user/:userId` — User KPI detail + today breakdown
- `GET /api/kpi/snapshots` — List KPI snapshots
- `POST /api/kpi/snapshots/generate` — Generate period snapshots

### Tasks
- `GET/POST /api/tasks`, `GET/PUT/DELETE /api/tasks/:id`
- `POST /api/tasks/:id/comments` — Add task comment

### Complaints
- `GET/POST /api/complaints`, `GET/PUT /api/complaints/:id`
- SLA timer: normal/warning (>24h)/critical (>72h)

### Communication
- `GET/POST /api/announcements`, `GET/PUT/DELETE /api/announcements/:id`
- `GET/POST /api/messages`, `GET /api/messages/:id`
- `POST /api/messages/:id/acknowledge`
- `GET/POST /api/chats`, `POST /api/chats/:id/members`
- `GET/POST /api/chats/:id/messages`

### Operations
- `GET/POST /api/handover-logs`, `GET /api/handover-logs/:id`
- `GET /api/notifications`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`
- `GET /api/system-settings`, `PUT /api/system-settings/:key`
- `GET /api/audit-logs` — Owner/Admin only
- `GET /api/inactivity/check` — Dealer inactivity monitoring

## Key Business Logic

- **KPI Engine**: Auto-calculates daily/weekly/monthly/quarterly/yearly scores on activity log create/update
- **Activity Edit Window**: Configurable via `activity_edit_window_minutes` system setting (default 60 min); Owner/Admin bypass
- **Complaint SLA**: normal (<24h), warning (24-72h), critical (>72h)
- **Inactivity Detection**: Configurable warning/critical thresholds for dealer monitoring
- **Audit Logging**: All write operations create audit log entries
- **Notifications**: Auto-created on task assignment, complaint assignment, chat messages, task comments

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — typecheck + build all
- `pnpm run typecheck` — full type check
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client
- `pnpm --filter @workspace/db run push` — push schema to DB
- `pnpm --filter @workspace/scripts run seed` — seed database

## Proxy & Service Routing

Global reverse proxy routes traffic by path. Services bind to `PORT` env var.
- Correct: `localhost:80/api/healthz`
- Wrong: `localhost:8080/api/healthz`
