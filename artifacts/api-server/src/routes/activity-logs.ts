import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { activityLogsTable, activityTypesTable, usersTable, ptsTable, branchesTable, shiftsTable, systemSettingsTable, kpiScoresTable } from "@workspace/db/schema";
import { eq, and, gte, lte, desc, sql, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole, getPtScope } from "../middlewares/auth";
import { createAuditLog } from "../helpers/audit";

const router: IRouter = Router();

const ALL_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System", "Superadmin"];

async function enrichLog(log: typeof activityLogsTable.$inferSelect) {
  const [actType] = await db.select().from(activityTypesTable).where(eq(activityTypesTable.id, log.activityTypeId)).limit(1);
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, log.userId)).limit(1);
  const pt = log.ptId ? (await db.select().from(ptsTable).where(eq(ptsTable.id, log.ptId)).limit(1))[0] : null;
  const branch = log.branchId ? (await db.select().from(branchesTable).where(eq(branchesTable.id, log.branchId)).limit(1))[0] : null;
  const shift = log.shiftId ? (await db.select().from(shiftsTable).where(eq(shiftsTable.id, log.shiftId)).limit(1))[0] : null;
  return {
    ...log,
    activityTypeName: actType?.name ?? "",
    activityTypeCategory: actType?.category ?? null,
    userName: user?.name ?? "",
    ptName: pt?.name ?? null,
    branchName: branch?.name ?? null,
    shiftName: shift?.name ?? null,
  };
}

async function calculatePoints(activityTypeId: number, quantity: number): Promise<string> {
  const [actType] = await db.select().from(activityTypesTable).where(eq(activityTypesTable.id, activityTypeId)).limit(1);
  if (!actType) return "0";
  return String(Number(actType.weightPoints) * quantity);
}

async function updateKpiScores(userId: number) {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), quarterMonth, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  async function sumPoints(from: Date): Promise<string> {
    const result = await db
      .select({ total: sql<string>`COALESCE(SUM(${activityLogsTable.points}), 0)` })
      .from(activityLogsTable)
      .where(and(eq(activityLogsTable.userId, userId), gte(activityLogsTable.createdAt, from)));
    return result[0]?.total ?? "0";
  }

  const [daily, weekly, monthly, quarterly, yearly] = await Promise.all([
    sumPoints(dayStart), sumPoints(weekStart), sumPoints(monthStart),
    sumPoints(quarterStart), sumPoints(yearStart),
  ]);

  const existing = await db.select().from(kpiScoresTable).where(eq(kpiScoresTable.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(kpiScoresTable).set({
      currentDailyScore: daily,
      currentWeeklyScore: weekly,
      currentMonthlyScore: monthly,
      currentQuarterlyScore: quarterly,
      currentYearlyScore: yearly,
    }).where(eq(kpiScoresTable.userId, userId));
  } else {
    await db.insert(kpiScoresTable).values({
      userId,
      currentDailyScore: daily,
      currentWeeklyScore: weekly,
      currentMonthlyScore: monthly,
      currentQuarterlyScore: quarterly,
      currentYearlyScore: yearly,
    });
  }
}

router.get("/activity-logs", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const conditions: SQL[] = [];
    if (req.query.userId) conditions.push(eq(activityLogsTable.userId, Number(req.query.userId)));
    const ptScope = getPtScope(req);
    if (ptScope !== null) {
      conditions.push(eq(activityLogsTable.ptId, ptScope));
    } else if (req.query.ptId) {
      conditions.push(eq(activityLogsTable.ptId, Number(req.query.ptId)));
    }
    if (req.query.shiftId) conditions.push(eq(activityLogsTable.shiftId, Number(req.query.shiftId)));
    if (req.query.activityTypeId) conditions.push(eq(activityLogsTable.activityTypeId, Number(req.query.activityTypeId)));
    if (req.query.dateFrom) conditions.push(gte(activityLogsTable.createdAt, new Date(req.query.dateFrom as string)));
    if (req.query.dateTo) conditions.push(lte(activityLogsTable.createdAt, new Date(req.query.dateTo as string)));

    if (req.user!.roleName === "Dealer") {
      conditions.push(eq(activityLogsTable.userId, req.user!.userId));
    }

    const logs = await db.select().from(activityLogsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(activityLogsTable.createdAt))
      .limit(Number(req.query.limit) || 100);

    const enriched = await Promise.all(logs.map(enrichLog));
    res.json(enriched);
  } catch (error) {
    console.error("List activity logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

const SPV_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Admin System", "Superadmin"];

async function resolveTargetUser(
  req: { user?: { userId: number; roleName: string; ptId?: number | null } },
  targetUserId: number | undefined,
  activityTypeId: number,
): Promise<{ userId: number; ptId: number | null | undefined } | { error: string; status: number }> {
  const caller = req.user!;

  if (targetUserId && targetUserId !== caller.userId) {
    if (!SPV_AND_ABOVE.includes(caller.roleName)) {
      return { error: "Hanya SPV ke atas yang boleh mencatat aktivitas untuk anggota lain", status: 403 };
    }
    const [actType] = await db.select({ category: activityTypesTable.category }).from(activityTypesTable)
      .where(eq(activityTypesTable.id, activityTypeId)).limit(1);
    if (!actType || actType.category !== "Error") {
      return { error: "targetUserId hanya diperbolehkan untuk tipe aktivitas berkategori Error", status: 400 };
    }
    const [target] = await db.select({ id: usersTable.id, ptId: usersTable.ptId, roleName: usersTable.roleId })
      .from(usersTable).where(eq(usersTable.id, targetUserId)).limit(1);
    if (!target) return { error: "Target user tidak ditemukan", status: 404 };
    if (caller.roleName === "SPV Dealing" && caller.ptId && target.ptId !== caller.ptId) {
      return { error: "SPV hanya bisa mencatat error untuk anggota di PT yang sama", status: 403 };
    }
    return { userId: targetUserId, ptId: target.ptId };
  }
  return { userId: caller.userId, ptId: caller.ptId };
}

router.post("/activity-logs", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const { activityTypeId, quantity, note, targetUserId, confirmDuplicate } = req.body;
    if (!activityTypeId) { res.status(400).json({ error: "activityTypeId is required" }); return; }
    const qty = Number(quantity) || 1;
    if (qty < 1 || !Number.isInteger(qty)) { res.status(400).json({ error: "quantity must be a positive integer" }); return; }

    const resolved = await resolveTargetUser(req, targetUserId ? Number(targetUserId) : undefined, activityTypeId);
    if ("error" in resolved) { res.status(resolved.status).json({ error: resolved.error }); return; }

    const oneMinAgo = new Date(Date.now() - 60000);
    const [rateCheck] = await db.select({ count: sql<number>`COUNT(*)::int` })
      .from(activityLogsTable)
      .where(and(eq(activityLogsTable.userId, resolved.userId), gte(activityLogsTable.createdAt, oneMinAgo)));
    if ((rateCheck?.count ?? 0) >= 20) {
      res.status(429).json({ error: "Terlalu banyak aktivitas dalam 1 menit. Harap tunggu sebentar." }); return;
    }

    if (!confirmDuplicate) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60000);
      const [recentLog] = await db.select({ id: activityLogsTable.id, createdAt: activityLogsTable.createdAt })
        .from(activityLogsTable)
        .where(and(
          eq(activityLogsTable.userId, resolved.userId),
          eq(activityLogsTable.activityTypeId, Number(activityTypeId)),
          gte(activityLogsTable.createdAt, fiveMinAgo)
        ))
        .orderBy(desc(activityLogsTable.createdAt))
        .limit(1);
      if (recentLog) {
        const minutesAgo = Math.round((Date.now() - new Date(recentLog.createdAt).getTime()) / 60000);
        res.status(200).json({
          recentDuplicate: true,
          minutesAgo,
          message: `Kamu baru saja log aktivitas ini ${minutesAgo} menit lalu. Lanjutkan?`,
        });
        return;
      }
    }

    const points = await calculatePoints(activityTypeId, qty);
    const [log] = await db.insert(activityLogsTable).values({
      userId: resolved.userId,
      activityTypeId,
      quantity: qty,
      note: note ?? null,
      ptId: resolved.ptId,
      branchId: req.body.branchId ?? null,
      shiftId: req.body.shiftId ?? null,
      points,
    }).returning();
    await updateKpiScores(resolved.userId);
    await createAuditLog({ userId: req.user!.userId, actionType: "create", module: "activity_log", entityId: String(log.id) });
    res.status(201).json(await enrichLog(log));
  } catch (error) {
    console.error("Create activity log error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/activity-logs/batch", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "items array is required" }); return;
    }
    if (items.length > 20) {
      res.status(400).json({ error: "Maksimal 20 aktivitas per batch" }); return;
    }
    const oneMinAgo = new Date(Date.now() - 60000);
    const [rateCheckBatch] = await db.select({ count: sql<number>`COUNT(*)::int` })
      .from(activityLogsTable)
      .where(and(eq(activityLogsTable.userId, req.user!.userId), gte(activityLogsTable.createdAt, oneMinAgo)));
    if ((rateCheckBatch?.count ?? 0) + items.length > 20) {
      res.status(429).json({ error: "Terlalu banyak aktivitas dalam 1 menit. Harap tunggu sebentar." }); return;
    }
    const { confirmDuplicates } = req.body;

    if (!confirmDuplicates) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60000);
      const duplicateWarnings: Array<{ index: number; activityTypeId: number; minutesAgo: number; message: string }> = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const resolved = await resolveTargetUser(req, item.targetUserId ? Number(item.targetUserId) : undefined, item.activityTypeId);
        if ("error" in resolved) continue;

        const [recentLog] = await db.select({ id: activityLogsTable.id, createdAt: activityLogsTable.createdAt })
          .from(activityLogsTable)
          .where(and(
            eq(activityLogsTable.userId, resolved.userId),
            eq(activityLogsTable.activityTypeId, Number(item.activityTypeId)),
            gte(activityLogsTable.createdAt, fiveMinAgo)
          ))
          .orderBy(desc(activityLogsTable.createdAt))
          .limit(1);

        if (recentLog) {
          const minutesAgo = Math.round((Date.now() - new Date(recentLog.createdAt).getTime()) / 60000);
          duplicateWarnings.push({
            index: i,
            activityTypeId: item.activityTypeId,
            minutesAgo,
            message: `Baris ${i + 1}: Kamu baru saja log aktivitas ini ${minutesAgo} menit lalu. Lanjutkan?`,
          });
        }
      }

      if (duplicateWarnings.length > 0) {
        res.status(200).json({ recentDuplicates: duplicateWarnings });
        return;
      }
    }

    const results: Array<typeof activityLogsTable.$inferSelect> = [];
    const affectedUserIds = new Set<number>();

    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      if (qty < 1 || !Number.isInteger(qty)) {
        res.status(400).json({ error: "All quantities must be positive integers" }); return;
      }
      const resolved = await resolveTargetUser(req, item.targetUserId ? Number(item.targetUserId) : undefined, item.activityTypeId);
      if ("error" in resolved) { res.status(resolved.status).json({ error: resolved.error }); return; }

      const points = await calculatePoints(item.activityTypeId, qty);
      const [log] = await db.insert(activityLogsTable).values({
        userId: resolved.userId,
        activityTypeId: item.activityTypeId,
        quantity: qty,
        note: item.note ?? null,
        ptId: resolved.ptId,
        branchId: item.branchId ?? null,
        shiftId: item.shiftId ?? null,
        points,
      }).returning();
      results.push(log);
      affectedUserIds.add(resolved.userId);
    }

    await Promise.all([...affectedUserIds].map(uid => updateKpiScores(uid)));
    await createAuditLog({ userId: req.user!.userId, actionType: "batch_create", module: "activity_log", entityId: String(results.length) });
    const enriched = await Promise.all(results.map(enrichLog));
    res.status(201).json(enriched);
  } catch (error) {
    console.error("Batch create activity logs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/activity-logs/:id/flag", authMiddleware, requireRole(...SPV_AND_ABOVE), async (req, res) => {
  try {
    const [existing] = await db.select().from(activityLogsTable).where(eq(activityLogsTable.id, Number(req.params.id))).limit(1);
    if (!existing) { res.status(404).json({ error: "Activity log not found" }); return; }

    const newFlagged = !existing.flagged;
    const [updated] = await db.update(activityLogsTable)
      .set({ flagged: newFlagged })
      .where(eq(activityLogsTable.id, Number(req.params.id)))
      .returning();
    await createAuditLog({ userId: req.user!.userId, actionType: newFlagged ? "flag" : "unflag", module: "activity_log", entityId: String(updated.id) });
    res.json(await enrichLog(updated));
  } catch (error) {
    console.error("Flag activity log error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/activity-logs/:id", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const [existing] = await db.select().from(activityLogsTable).where(eq(activityLogsTable.id, Number(req.params.id))).limit(1);
    if (!existing) { res.status(404).json({ error: "Activity log not found" }); return; }

    if (req.user!.roleName === "Dealer" && existing.userId !== req.user!.userId) {
      res.status(403).json({ error: "Cannot edit another user's activity" }); return;
    }

    const editWindowSetting = await db.select().from(systemSettingsTable)
      .where(eq(systemSettingsTable.settingKey, "activity_edit_window_minutes")).limit(1);
    const editWindowMinutes = editWindowSetting.length > 0 ? Number(editWindowSetting[0].settingValue) : 60;
    const elapsed = (Date.now() - existing.createdAt.getTime()) / 60000;
    if (elapsed > editWindowMinutes && !["Owner", "Admin System"].includes(req.user!.roleName)) {
      res.status(403).json({ error: `Edit window of ${editWindowMinutes} minutes has passed` }); return;
    }

    const updateData: Partial<typeof activityLogsTable.$inferInsert> = {};
    if (req.body.quantity !== undefined) {
      const qty = Number(req.body.quantity);
      if (qty < 1 || !Number.isInteger(qty)) { res.status(400).json({ error: "quantity must be a positive integer" }); return; }
      updateData.quantity = qty;
      updateData.points = await calculatePoints(existing.activityTypeId, qty);
    }
    if (req.body.note !== undefined) updateData.note = req.body.note;

    const [updated] = await db.update(activityLogsTable).set(updateData)
      .where(eq(activityLogsTable.id, Number(req.params.id))).returning();
    await updateKpiScores(updated.userId);
    await createAuditLog({ userId: req.user!.userId, actionType: "update", module: "activity_log", entityId: String(updated.id) });
    res.json(await enrichLog(updated));
  } catch (error) {
    console.error("Update activity log error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
