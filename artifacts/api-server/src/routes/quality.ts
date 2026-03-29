import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  qualityErrorTypesTable,
  qualityRecordsTable,
  usersTable,
  ptsTable,
  shiftsTable,
} from "@workspace/db/schema";
import { eq, and, gte, lte, desc, sql, inArray, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

const SPV_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Superadmin"];
const MANAGEMENT    = ["Owner", "Chief Dealing", "Superadmin"];

function computeScore(errorCount: number): "POOR" | "AVERAGE" | "PERFECT" {
  if (errorCount === 0) return "PERFECT";
  if (errorCount <= 3) return "AVERAGE";
  return "POOR";
}

router.get("/quality/error-types", authMiddleware, requireRole(...SPV_AND_ABOVE), async (_req, res) => {
  try {
    const types = await db
      .select()
      .from(qualityErrorTypesTable)
      .where(eq(qualityErrorTypesTable.isActive, true))
      .orderBy(qualityErrorTypesTable.category, qualityErrorTypesTable.name);
    res.json(types);
  } catch (error) {
    console.error("List quality error types error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/quality/records", authMiddleware, requireRole(...SPV_AND_ABOVE), async (req, res) => {
  try {
    const { userId, score, dateFrom, dateTo, ptId: ptIdQ, shiftId: shiftIdQ, limit = "200" } = req.query as Record<string, string>;

    const roleName  = req.user!.roleName;
    const myPtId    = req.user!.ptId;

    const conditions: SQL[] = [];

    // Role-based PT enforcement at the DB query level
    if (roleName === "SPV Dealing" && myPtId) {
      conditions.push(eq(usersTable.ptId, myPtId));
    } else if (ptIdQ) {
      conditions.push(eq(usersTable.ptId, Number(ptIdQ)));
    }

    if (userId) conditions.push(eq(qualityRecordsTable.userId, Number(userId)));
    if (score)  conditions.push(eq(qualityRecordsTable.score, score as "POOR" | "AVERAGE" | "PERFECT"));

    // Date filters on occurredDate
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const effectiveDateFrom = dateFrom || monthStart;
    const effectiveDateTo   = dateTo   || now.toISOString().split("T")[0];
    conditions.push(gte(qualityRecordsTable.occurredDate, effectiveDateFrom));
    conditions.push(lte(qualityRecordsTable.occurredDate, effectiveDateTo));

    // Shift filter: find users in that shift then filter records by userId
    let shiftUserIds: number[] | null = null;
    if (shiftIdQ) {
      const shiftUsers = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.shiftId, Number(shiftIdQ)));
      shiftUserIds = shiftUsers.map(u => u.id);
      if (shiftUserIds.length === 0) {
        return res.json([]);
      }
    }

    if (shiftUserIds && shiftUserIds.length > 0) {
      conditions.push(inArray(qualityRecordsTable.userId, shiftUserIds));
    }

    const records = await db
      .select({
        id: qualityRecordsTable.id,
        userId: qualityRecordsTable.userId,
        errorTypeId: qualityRecordsTable.errorTypeId,
        occurredDate: qualityRecordsTable.occurredDate,
        errorCount: qualityRecordsTable.errorCount,
        score: qualityRecordsTable.score,
        notes: qualityRecordsTable.notes,
        recordedBy: qualityRecordsTable.recordedBy,
        createdAt: qualityRecordsTable.createdAt,
        userName: usersTable.name,
        userPtId: usersTable.ptId,
        userShiftId: usersTable.shiftId,
        ptName: ptsTable.name,
        errorTypeName: qualityErrorTypesTable.name,
        errorTypeCategory: qualityErrorTypesTable.category,
        objectiveGroup: qualityErrorTypesTable.objectiveGroup,
      })
      .from(qualityRecordsTable)
      .leftJoin(usersTable, eq(qualityRecordsTable.userId, usersTable.id))
      .leftJoin(ptsTable, eq(usersTable.ptId, ptsTable.id))
      .leftJoin(qualityErrorTypesTable, eq(qualityRecordsTable.errorTypeId, qualityErrorTypesTable.id))
      .where(and(...conditions))
      .orderBy(desc(qualityRecordsTable.createdAt))
      .limit(Math.min(Number(limit) || 200, 500));

    res.json(records);
  } catch (error) {
    console.error("List quality records error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/quality/records", authMiddleware, requireRole(...SPV_AND_ABOVE), async (req, res) => {
  try {
    const { userId, errorTypeId, occurredDate, errorCount, notes } = req.body;

    if (!userId || !errorTypeId || !occurredDate) {
      res.status(400).json({ error: "userId, errorTypeId, dan occurredDate wajib diisi" });
      return;
    }

    const count = Number(errorCount);
    if (isNaN(count) || count < 0) {
      res.status(400).json({ error: "errorCount harus berupa angka >= 0" });
      return;
    }

    const score = computeScore(count);

    const roleName    = req.user!.roleName;
    const recorderPtId = req.user!.ptId;

    // SPV can only record for users within their own PT — enforced at query level
    const [targetUser] = await db
      .select({ id: usersTable.id, ptId: usersTable.ptId, roleName: sql<string>`r.name` })
      .from(usersTable)
      .leftJoin(sql`roles r`, sql`r.id = ${usersTable.roleId}`)
      .where(eq(usersTable.id, Number(userId)))
      .limit(1);

    if (!targetUser) {
      res.status(404).json({ error: "User tidak ditemukan" });
      return;
    }

    if (roleName === "SPV Dealing" && recorderPtId && targetUser.ptId !== recorderPtId) {
      res.status(403).json({ error: "Anda hanya bisa mencatat kesalahan untuk anggota tim di PT Anda" });
      return;
    }

    const [record] = await db.insert(qualityRecordsTable).values({
      userId: Number(userId),
      errorTypeId: Number(errorTypeId),
      occurredDate,
      errorCount: count,
      score,
      notes: notes ?? null,
      recordedBy: req.user!.userId,
    }).returning();

    res.status(201).json(record);
  } catch (error) {
    console.error("Create quality record error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/quality/records/:id", authMiddleware, requireRole(...MANAGEMENT), async (req, res) => {
  try {
    const [record] = await db
      .select()
      .from(qualityRecordsTable)
      .where(eq(qualityRecordsTable.id, Number(req.params.id)))
      .limit(1);

    if (!record) {
      res.status(404).json({ error: "Record tidak ditemukan" });
      return;
    }

    await db.delete(qualityRecordsTable).where(eq(qualityRecordsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete quality record error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/quality/summary", authMiddleware, requireRole(...SPV_AND_ABOVE), async (req, res) => {
  try {
    const { dateFrom: qFrom, dateTo: qTo, ptId: ptIdQ, shiftId: shiftIdQ } = req.query as Record<string, string>;

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const dateFrom = qFrom || monthStart;
    const dateTo   = qTo   || now.toISOString().split("T")[0];

    const roleName = req.user!.roleName;
    const myPtId   = req.user!.ptId;

    const conditions: SQL[] = [
      gte(qualityRecordsTable.occurredDate, dateFrom),
      lte(qualityRecordsTable.occurredDate, dateTo),
    ];

    // PT-level scoping
    if (roleName === "SPV Dealing" && myPtId) {
      conditions.push(eq(usersTable.ptId, myPtId));
    } else if (ptIdQ) {
      conditions.push(eq(usersTable.ptId, Number(ptIdQ)));
    }

    // Shift filter
    if (shiftIdQ) {
      conditions.push(eq(usersTable.shiftId, Number(shiftIdQ)));
    }

    const rows = await db
      .select({
        userId: qualityRecordsTable.userId,
        userName: usersTable.name,
        userPtId: usersTable.ptId,
        ptName: ptsTable.name,
        shiftId: usersTable.shiftId,
        totalErrors: sql<number>`CAST(SUM(${qualityRecordsTable.errorCount}) AS INTEGER)`,
        recordCount: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(qualityRecordsTable)
      .leftJoin(usersTable, eq(qualityRecordsTable.userId, usersTable.id))
      .leftJoin(ptsTable, eq(usersTable.ptId, ptsTable.id))
      .where(and(...conditions))
      .groupBy(qualityRecordsTable.userId, usersTable.name, usersTable.ptId, ptsTable.name, usersTable.shiftId)
      .orderBy(desc(sql`SUM(${qualityRecordsTable.errorCount})`));

    // Enrich with shift names
    const shiftMap = new Map<number, string>();
    const allShifts = await db.select({ id: shiftsTable.id, name: shiftsTable.name }).from(shiftsTable);
    for (const s of allShifts) shiftMap.set(s.id, s.name);

    const summary = rows.map(r => ({
      ...r,
      shiftName: r.shiftId ? (shiftMap.get(r.shiftId) ?? null) : null,
      score: computeScore(r.totalErrors),
    }));

    res.json({ dateFrom, dateTo, summary });
  } catch (error) {
    console.error("Quality summary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
