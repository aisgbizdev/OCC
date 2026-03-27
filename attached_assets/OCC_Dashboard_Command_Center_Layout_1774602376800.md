
# OCC Dashboard Command Center Layout
## Operational Control Center – Dealing
Solid Group

---

# 1. DESIGN PRINCIPLES

The OCC dashboard must feel like a **real operational command center**.

Key characteristics:

- Fast to read
- Professional
- Clear hierarchy
- Minimal clutter
- Executive dashboard style
- Mobile friendly
- High visibility for operational risk

The dashboard must answer the question:

**"Is today's operation healthy or not?"**

within a few seconds.

---

# 2. GLOBAL PAGE STRUCTURE

```
┌──────────────────────────────────────────────────────────┐
│ Header: Logo | Page Title | PT Filter | Notifications   │
├───────────────┬──────────────────────────────────────────┤
│ Sidebar Menu  │ Main Dashboard Content                  │
│               │                                          │
│ Dashboard     │ 1. Summary Cards                        │
│ Aktivitas     │ 2. Operational Pulse                    │
│ Tugas         │ 3. KPI / Leaderboard                    │
│ Komplain      │ 4. Team Activity Monitor                │
│ Pengumuman    │ 5. Tasks & Complaints Snapshot          │
│ Pesan         │ 6. Handover & Alerts                    │
│ Chat          │                                          │
│ KPI           │                                          │
│ Profil        │                                          │
│ Master Data   │                                          │
│ Pengaturan    │                                          │
└───────────────┴──────────────────────────────────────────┘
```

---

# 3. HEADER AREA

Header must contain:

Left:
- OCC logo
- Page title
- Breadcrumb

Right:
- PT selector
- Branch selector
- Time period filter
- Search field
- Notification bell
- User profile

Example:

```
OCC / Dashboard
[ All PT ▼ ] [ All Branch ▼ ] [ Today ▼ ]   🔔   👤
```

Purpose:
Allow managers to switch PT or time scope instantly.

---

# 4. SIDEBAR STRUCTURE

Sidebar navigation:

```
Dashboard
Aktivitas
Tugas
Komplain
Pengumuman
Pesan
Chat
KPI & Leaderboard
Handover Shift
Profil Saya
Master Data
Pengaturan
```

Sidebar requirements:

- Icon for each menu
- Active state highlight
- Collapsible mode
- Mobile hamburger menu

Bottom sidebar:

- User mini profile
- Role indicator
- Logout

---

# 5. TOP SUMMARY CARDS

The first row must show key operational metrics.

Example cards:

- Total Activity Today
- Active Dealers
- Active Complaints
- Overdue Tasks

Example layout:

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Activity     │ │ Dealers      │ │ Complaints   │ │ Overdue Task │
│ 185          │ │ 18 / 22      │ │ 6            │ │ 3            │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

Dealer version replaces cards with:

- My Score
- My Rank
- Daily Target
- My Tasks

---

# 6. DAILY OPERATIONAL PULSE

Core health indicator panel.

Example:

```
Operational Pulse

Team Activity     🟢 Normal
Complaints        🟡 3 Cases
Dealer Inactive   🔴 2 Users
Night Shift       🟢 Stable
Handover Missing  🟡 1 Shift
```

Color codes:

Green → Normal  
Yellow → Attention  
Red → Critical  

Each row clickable for details.

---

# 7. LEADERBOARD PANEL

Displays top performers.

Example:

```
Top Dealers Today

1. Andi — 92
2. Budi — 86
3. Rina — 82
4. Dedi — 79
5. Sinta — 76
```

Purpose:

- motivate team
- show performance hierarchy

---

# 8. KPI DISTRIBUTION PANEL

Display team quality distribution.

Example:

```
KPI Distribution

Grade A : 4
Grade B : 7
Grade C : 5
Grade D : 2
```

Can use donut chart.

---

# 9. TEAM ACTIVITY MONITOR

Shows who is working and who is not.

Example table:

| Dealer | PT | Shift | Activity | Score | Status |
|------|----|------|---------|------|-------|
| Andi | SGB | Pagi | 42 | 88 | Active |
| Budi | RFB | Siang | 17 | 42 | Low |
| Rina | KPF | Malam | 6 | 19 | Risk |

Status colors:

Green → Active  
Yellow → Low  
Red → Inactivity risk  

---

# 10. TASK SNAPSHOT

Example:

```
Tasks Overview

New Tasks: 5
Overdue Tasks: 2
Near Deadline: 3
Average Progress: 68%
```

Purpose:
Highlight operational workload.

---

# 11. COMPLAINT SNAPSHOT

Example:

```
Complaint Overview

Open Complaints: 6
Escalated: 1
Resolved Today: 4
Top Complaint: Deposit Delay
```

Purpose:
Monitor operational risk.

---

# 12. SHIFT MONITOR

Example:

| Shift | Activity | Dealers | Complaints | Status |
|------|----------|--------|-----------|-------|
| Pagi | 82 | 6 | 1 | Normal |
| Siang | 64 | 5 | 2 | Attention |
| Malam | 19 | 3 | 3 | Risk |

Purpose:
Monitor 24‑hour operations.

---

# 13. PT RADAR

Owner overview per PT.

Example:

| PT | Activity | Dealers | Complaints | Status |
|----|---------|--------|-----------|-------|
| SGB | 52 | 5 | 1 | 🟢 |
| RFB | 40 | 4 | 0 | 🟢 |
| KPF | 28 | 3 | 2 | 🟡 |
| BPF | 20 | 3 | 2 | 🟡 |
| EWF | 12 | 2 | 3 | 🔴 |

Purpose:
Quick PT comparison.

---

# 14. HANDOVER PANEL

Example:

```
Shift Handover

Morning → Afternoon
Pending Complaints: 1
Pending Tasks: 2
Notes: waiting confirmation
```

Ensures continuity between shifts.

---

# 15. ALERT PANEL

Example alerts:

```
Alerts

Dealer Budi inactive for 3 hours
2 tasks overdue in KPF
High severity complaint in EWF
```

Purpose:
Immediate management attention.

---

# 16. DEALER PERSONAL DASHBOARD

Dealer view must differ from owner view.

Layout:

Top:

- Greeting
- PT
- Shift

Row 1:

- Daily Target Meter
- Score Today
- Rank Today
- My Tasks

Row 2:

Quick Action Buttons:

+ Deposit
+ Withdrawal
+ Account Opening
+ Complaint
+ Verification

Row 3:

Personal Insights:

Strengths:
- High morning activity

Weakness:
- Low night shift activity

---

# 17. VISUAL COLOR RULES

Primary Color:
Navy / Dark Blue

Status Colors:

Green → Good  
Yellow → Warning  
Red → Critical  
Blue → Information  

Background:
White / light gray

---

# 18. MOBILE RESPONSIVE STRUCTURE

Desktop:

- grid layout
- multiple columns

Mobile:

1. summary cards
2. operational pulse
3. quick actions
4. leaderboard
5. alerts

Sidebar becomes hamburger menu.

---

# 19. CORE UI COMPONENTS

Required UI components:

- Summary Card
- Status Badge
- Progress Bar
- Leaderboard Card
- Activity Table
- Alert List
- Pulse Indicator
- Quick Action Button
- Dropdown Filter
- Trend Chart

Consistent UI components maintain clarity.

---

# 20. VISUAL PRIORITY FLOW

When a manager opens the dashboard:

1. Summary Cards
2. Operational Pulse
3. PT Radar
4. Leaderboard
5. Alerts

This ensures rapid situational awareness.

---

# 21. DESIGN MISTAKES TO AVOID

Avoid:

- large tables at top
- chat dominating dashboard
- no color indicators
- too many metrics
- no visual hierarchy

Dashboard must prioritize **operational health visibility**.

---

# 22. FINAL DESIGN GOAL

The OCC dashboard must function as:

- an operational control room
- a team performance monitor
- a risk detection panel

It must allow leadership to understand operational status within seconds.

---

**End of OCC Dashboard Command Center Layout**
