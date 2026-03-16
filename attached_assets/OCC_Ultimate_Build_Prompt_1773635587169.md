
# OCC ULTIMATE BUILD PROMPT (FINAL)
## Operational Control Center – Dealing
Solid Group

---

## System Definition

Build a production-grade internal web application called **OCC — Operational Control Center**.

Department Scope: **Dealing / Operational Team Only**

Important boundaries:

- This is **NOT a trading system**
- This is **NOT connected to BAS, BOM, eTrade, or ProTrader**
- This is **NOT a financial reporting platform**

Main goals:

- record daily operational activities
- track performance using weighted KPI
- enable internal operational communication
- manage tasks and complaints
- provide management visibility through dashboards

The system should feel like a **modern internal command center**.

---

# 1. TECH STACK

Frontend:
- React + TypeScript

Styling:
- Tailwind CSS

UI Components:
- Clean reusable component system (similar to shadcn/ui)

Backend:
- Node.js (Express or equivalent API layer)

Database:
- PostgreSQL

ORM:
- Prisma or Drizzle ORM

Authentication:
- JWT or session-based authentication

Other:
- PWA ready
- Modular architecture
- Mobile friendly

---

# 2. PROJECT STRUCTURE

```
/occ-app
  /frontend
      /components
      /layouts
      /pages
      /hooks
      /services
      /store
      /types
      /styles
  /backend
      /controllers
      /services
      /routes
      /middlewares
      /utils
  /database
      /schema
      /migrations
      /seed
  /config
  /scripts
  /public
```

Frontend handles UI.
Backend handles API.
Database layer isolated.

---

# 3. ROLES

System roles:

- Owner
- Direksi
- Chief Dealing
- SPV Dealing
- Dealer
- Admin System

Role capabilities:

Owner:
- full access

Direksi:
- view dashboards
- view PT performance

Chief Dealing:
- manage team
- assign tasks
- view KPI details

SPV:
- monitor shift
- assign tasks
- create complaints

Dealer:
- log activities
- update tasks
- view personal KPI

Admin:
- manage system configuration
- manage master data

Implement role-based route protection.

---

# 4. ORGANIZATIONAL STRUCTURE

System must support:

- PT
- Branch
- Shift
- User

Default PT seed:

- SGB
- RFB
- KPF
- BPF
- EWF

Branches must be editable.

Default shifts:

- Pagi
- Siang
- Malam

---

# 5. DATABASE TABLES

Create tables:

```
users
roles
permissions
role_permissions

pts
branches
shifts

activity_types
activity_logs

tasks
task_comments

complaints

announcements
messages
message_acknowledgements

chats
chat_members
chat_messages

handover_logs

kpi_scores
kpi_snapshots

notifications

audit_logs

system_settings
```

---

# 6. USERS TABLE

Fields:

- id
- name
- email
- password_hash
- phone
- avatar
- role_id
- pt_id
- branch_id
- shift_id
- position_title
- supervisor_id
- active_status
- created_at
- updated_at

---

# 7. ACTIVITY TYPES

Fields:

- id
- name
- category
- weight_points
- note_required
- quantity_note_threshold
- active_status
- created_at

Examples:

- Validasi Deposit
- Validasi Withdrawal
- Pembukaan Akun
- Verifikasi Dokumen
- Menangani Komplain
- Investigasi Transaksi
- Monitoring Sistem

Weights must be configurable.

---

# 8. ACTIVITY LOGS

Fields:

- id
- user_id
- activity_type_id
- quantity
- note
- pt_id
- branch_id
- shift_id
- points
- created_at

Rules:

Dealer adds logs.
Dealer can edit within limited time.
Dealer cannot delete logs.

---

# 9. KPI ENGINE

KPI based on weighted activity logs.

Formula:

points = activity_weight × quantity

Aggregate periods:

- daily
- weekly
- monthly
- quarterly
- yearly

Store snapshots for reporting.

---

# 10. DASHBOARDS

Three dashboard types:

### Dealer Dashboard

- daily target meter
- ranking
- activity summary
- quick activity buttons
- tasks
- personal insights

### SPV / Chief Dashboard

- team activity
- inactive users
- task overview
- complaint overview
- shift statistics

### Owner Dashboard

- operational pulse
- PT radar
- trend charts
- top performers
- weak performers

---

# 11. DAILY TARGET SYSTEM

Users have daily KPI target.

Example:

Target = 40 points

Show:

- progress bar
- percentage
- over/under target indicator

---

# 12. LEADERBOARD

Display:

- rank
- name
- PT
- score

All users see ranking.
Detailed KPI only visible to management.

---

# 13. TASK MANAGEMENT

Fields:

- id
- title
- description
- assigned_to
- assigned_by
- priority
- deadline
- progress_percent
- status

Statuses:

- New
- In Progress
- Review
- Done
- Overdue

---

# 14. COMPLAINTS

Fields:

- id
- title
- type
- severity
- chronology
- assigned_user
- status
- created_by
- created_at

Statuses:

- Open
- In Progress
- Escalated
- Resolved
- Closed

---

# 15. ANNOUNCEMENTS

Fields:

- id
- title
- content
- target_role
- target_pt
- start_date
- end_date
- priority
- created_by

---

# 16. CHAT SYSTEM

Chat types:

- personal chat
- group chat

Tables:

- chats
- chat_members
- chat_messages

Chat history must be stored permanently.

---

# 17. SHIFT HANDOVER

Fields:

- id
- pt_id
- from_shift
- to_shift
- summary
- pending_tasks
- pending_complaints
- notes
- created_by

---

# 18. NOTIFICATIONS

Fields:

- id
- user_id
- type
- title
- content
- read_status
- created_at

Notification types:

- task assigned
- new message
- announcement
- dealer inactive

---

# 19. INACTIVITY DETECTION

Example rules:

- 2 hours without activity → warning
- 4 hours → critical

Used for operational alerts.

---

# 20. MASTER DATA MANAGEMENT

Admin can manage:

- PT
- Branch
- Shift
- Activity Types
- Users

Actions:

- add
- edit
- delete
- activate/deactivate

---

# 21. SYSTEM SETTINGS

Configurable parameters:

- activity weights
- daily targets
- penalties
- pulse thresholds
- inactivity thresholds

Only admin/owner can edit.

---

# 22. AUDIT LOGS

Track:

- login
- activity edits
- task updates
- complaint updates
- master data changes

---

# 23. UI DESIGN PRINCIPLES

Design style:

- clean
- modern
- executive dashboard
- mobile friendly
- fast interaction

Layout:

- left sidebar
- top header
- card-based dashboard

---

# 24. PWA SUPPORT

Include:

- manifest
- service worker
- install prompt
- push notification readiness

---

# 25. SEED DATA

Provide demo data:

- roles
- PT list
- shifts
- activity types
- sample users
- sample tasks
- sample activities

---

# 26. BUILD ORDER

Recommended development order:

1 Authentication
2 Role system
3 Master data
4 Dashboard
5 Activity logs
6 KPI engine
7 Tasks
8 Complaints
9 Announcements
10 Chat
11 Notifications
12 Handover

Ensure each stage produces a working system.

---

# FINAL EXPECTATION

Deliver a usable **OCC v1 application** capable of:

- activity logging
- performance tracking
- operational monitoring
- internal communication
- KPI leaderboard
- managerial dashboards

Focus strictly on **Dealing operations**.

Avoid expanding scope beyond the OCC system.
