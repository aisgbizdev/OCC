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
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   └── api-server/           # Express API server (auth, master data, etc.)
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

## API Endpoints (implemented)

- `POST /api/auth/login` — JWT login
- `POST /api/auth/logout` — Logout
- `GET /api/auth/me` — Current user profile
- `GET/POST /api/users` — List/create users
- `GET/PUT /api/users/:id` — Get/update user
- `GET/POST /api/pts` — List/create PTs
- `PUT/DELETE /api/pts/:id` — Update/deactivate PT
- `GET/POST /api/branches` — List/create branches
- `PUT/DELETE /api/branches/:id` — Update/deactivate branch
- `GET/POST /api/shifts` — List/create shifts
- `PUT/DELETE /api/shifts/:id` — Update/deactivate shift
- `GET/POST /api/activity-types` — List/create activity types
- `PUT/DELETE /api/activity-types/:id` — Update/deactivate activity type

## API Endpoints (defined in OpenAPI, not yet implemented)

- Activity logs (CRUD + batch)
- Tasks (CRUD + comments)
- Complaints (CRUD)
- Announcements (CRUD)
- Messages (CRUD + acknowledge)
- Chats (CRUD + messages)
- Handover logs (CRUD)
- KPI scores/snapshots (list)
- Notifications (list + mark read)
- System settings (list + update)

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
