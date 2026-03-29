import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  qualityErrorTypesTable,
  qualityRecordsTable,
  usersTable,
  ptsTable,
} from "@workspace/db/schema";
import { eq, and, gte, lte, desc, sql, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

const SPV_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Admin System"];
const MANAGEMENT = ["Owner", "Direksi", "Chief Dealing", "Admin System"];

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
    const conditions: SQL[] = [];

    if (req.query.userId) conditions.push(eq(qualityRecordsTable.userId, Number(req.query.userId)));
    if (req.query.errorTypeId) conditions.push(eq(qualityRecordsTable.errorTypeId, Number(req.query.errorTypeId)));
    if (req.query.score) conditions.push(eq(qualityRecordsTable.score, req.query.score as "POOR" | "AVERAGE" | "PERFECT"));
    if (req.query.dateFrom) conditions.push(gte(qualityRecordsTable.occurredDate, req.query.dateFrom as string));
    if (req.query.dateTo) conditions.push(lte(qualityRecordsTable.occurredDate, req.query.dateTo as string));

    const roleName = req.user!.roleName;
    const ptId = req.user!.ptId;

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
        errorTypeName: qualityErrorTypesTable.name,
        errorTypeCategory: qualityErrorTypesTable.category,
        objectiveGroup: qualityErrorTypesTable.objectiveGroup,
      })
      .from(qualityRecordsTable)
      .leftJoin(usersTable, eq(qualityRecordsTable.userId, usersTable.id))
      .leftJoin(qualityErrorTypesTable, eq(qualityRecordsTable.errorTypeId, qualityErrorTypesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(qualityRecordsTable.createdAt))
      .limit(Number(req.query.limit) || 200);

    // SPV can only see records for users in the same PT
    if (roleName === "SPV Dealing" && ptId) {
      const filtered = records.filter(r => r.userPtId === ptId);
      return res.json(filtered);
    }

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
      res.status(400).json({ error: "userId, errorTypeId, and occurredDate are required" });
      return;
    }

    const count = Number(errorCount) || 1;
    if (count < 0) { res.status(400).json({ error: "errorCount must be >= 0" }); return; }

    const score = computeScore(count);

    const roleName = req.user!.roleName;
    const recorderPtId = req.user!.ptId;

    // SPV can only record for users in their PT
    if (roleName === "SPV Dealing" && recorderPtId) {
      const [targetUser] = await db.select({ ptId: usersTable.ptId }).from(usersTable).where(eq(usersTable.id, Number(userId))).limit(1);
      if (!targetUser || targetUser.ptId !== recorderPtId) {
        res.status(403).json({ error: "Anda hanya bisa mencatat kesalahan untuk anggota tim di PT Anda" });
        return;
      }
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
    const [record] = await db.select().from(qualityRecordsTable).where(eq(qualityRecordsTable.id, Number(req.params.id))).limit(1);
    if (!record) { res.status(404).json({ error: "Record not found" }); return; }
    await db.delete(qualityRecordsTable).where(eq(qualityRecordsTable.id, Number(req.params.id)));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete quality record error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/quality/summary", authMiddleware, requireRole(...SPV_AND_ABOVE), async (req, res) => {
  try {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const dateFrom = (req.query.dateFrom as string) || monthStart;
    const dateTo = (req.query.dateTo as string) || now.toISOString().split("T")[0];

    const roleName = req.user!.roleName;
    const ptId = req.user!.ptId;

    const ptFilter: SQL | undefined = roleName === "SPV Dealing" && ptId
      ? eq(usersTable.ptId, ptId)
      : undefined;

    const rows = await db
      .select({
        userId: qualityRecordsTable.userId,
        userName: usersTable.name,
        userPtId: usersTable.ptId,
        ptName: ptsTable.name,
        totalErrors: sql<number>`CAST(SUM(${qualityRecordsTable.errorCount}) AS INTEGER)`,
        recordCount: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      })
      .from(qualityRecordsTable)
      .leftJoin(usersTable, eq(qualityRecordsTable.userId, usersTable.id))
      .leftJoin(ptsTable, eq(usersTable.ptId, ptsTable.id))
      .where(and(
        gte(qualityRecordsTable.occurredDate, dateFrom),
        lte(qualityRecordsTable.occurredDate, dateTo),
        ptFilter,
      ))
      .groupBy(qualityRecordsTable.userId, usersTable.name, usersTable.ptId, ptsTable.name)
      .orderBy(desc(sql`SUM(${qualityRecordsTable.errorCount})`));

    const summary = rows.map(r => ({
      ...r,
      score: computeScore(r.totalErrors),
    }));

    res.json({ dateFrom, dateTo, summary });
  } catch (error) {
    console.error("Quality summary error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
