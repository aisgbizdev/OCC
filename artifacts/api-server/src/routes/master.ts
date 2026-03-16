import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ptsTable, branchesTable, shiftsTable, activityTypesTable } from "@workspace/db/schema";
import { eq, and, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/pts", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"), async (_req, res) => {
  try {
    const pts = await db.select().from(ptsTable);
    res.json(pts);
  } catch (error) {
    console.error("List PTs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/pts/:id", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"), async (req, res) => {
  try {
    const [pt] = await db.select().from(ptsTable).where(eq(ptsTable.id, Number(req.params.id))).limit(1);
    if (!pt) { res.status(404).json({ error: "PT not found" }); return; }
    res.json(pt);
  } catch (error) {
    console.error("Get PT error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pts", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) { res.status(400).json({ error: "code and name are required" }); return; }
    const [pt] = await db.insert(ptsTable).values({ code, name }).returning();
    res.status(201).json(pt);
  } catch (error) {
    console.error("Create PT error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/pts/:id", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const updateData: Partial<typeof ptsTable.$inferInsert> = {};
    if (req.body.code !== undefined) updateData.code = req.body.code;
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.activeStatus !== undefined) updateData.activeStatus = req.body.activeStatus;
    const [pt] = await db.update(ptsTable).set(updateData).where(eq(ptsTable.id, Number(req.params.id))).returning();
    if (!pt) { res.status(404).json({ error: "PT not found" }); return; }
    res.json(pt);
  } catch (error) {
    console.error("Update PT error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/pts/:id", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const [pt] = await db.update(ptsTable).set({ activeStatus: false }).where(eq(ptsTable.id, Number(req.params.id))).returning();
    if (!pt) { res.status(404).json({ error: "PT not found" }); return; }
    res.json({ message: "PT deactivated" });
  } catch (error) {
    console.error("Delete PT error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/branches", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"), async (req, res) => {
  try {
    const conditions: SQL[] = [];
    if (req.query.ptId) conditions.push(eq(branchesTable.ptId, Number(req.query.ptId)));
    const branches = conditions.length > 0
      ? await db.select().from(branchesTable).where(and(...conditions))
      : await db.select().from(branchesTable);
    res.json(branches);
  } catch (error) {
    console.error("List branches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/branches/:id", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"), async (req, res) => {
  try {
    const [branch] = await db.select().from(branchesTable).where(eq(branchesTable.id, Number(req.params.id))).limit(1);
    if (!branch) { res.status(404).json({ error: "Branch not found" }); return; }
    res.json(branch);
  } catch (error) {
    console.error("Get branch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/branches", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const { ptId, name, city } = req.body;
    if (!ptId || !name) { res.status(400).json({ error: "ptId and name are required" }); return; }
    const [branch] = await db.insert(branchesTable).values({ ptId, name, city }).returning();
    res.status(201).json(branch);
  } catch (error) {
    console.error("Create branch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/branches/:id", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const updateData: Partial<typeof branchesTable.$inferInsert> = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.city !== undefined) updateData.city = req.body.city;
    if (req.body.activeStatus !== undefined) updateData.activeStatus = req.body.activeStatus;
    const [branch] = await db.update(branchesTable).set(updateData).where(eq(branchesTable.id, Number(req.params.id))).returning();
    if (!branch) { res.status(404).json({ error: "Branch not found" }); return; }
    res.json(branch);
  } catch (error) {
    console.error("Update branch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/branches/:id", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const [branch] = await db.update(branchesTable).set({ activeStatus: false }).where(eq(branchesTable.id, Number(req.params.id))).returning();
    if (!branch) { res.status(404).json({ error: "Branch not found" }); return; }
    res.json({ message: "Branch deactivated" });
  } catch (error) {
    console.error("Delete branch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/shifts", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"), async (_req, res) => {
  try {
    const shifts = await db.select().from(shiftsTable);
    res.json(shifts);
  } catch (error) {
    console.error("List shifts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/shifts/:id", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"), async (req, res) => {
  try {
    const [shift] = await db.select().from(shiftsTable).where(eq(shiftsTable.id, Number(req.params.id))).limit(1);
    if (!shift) { res.status(404).json({ error: "Shift not found" }); return; }
    res.json(shift);
  } catch (error) {
    console.error("Get shift error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/shifts", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const { name, startTime, endTime } = req.body;
    if (!name || !startTime || !endTime) { res.status(400).json({ error: "name, startTime, endTime are required" }); return; }
    const [shift] = await db.insert(shiftsTable).values({ name, startTime, endTime }).returning();
    res.status(201).json(shift);
  } catch (error) {
    console.error("Create shift error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/shifts/:id", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const updateData: Partial<typeof shiftsTable.$inferInsert> = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.startTime !== undefined) updateData.startTime = req.body.startTime;
    if (req.body.endTime !== undefined) updateData.endTime = req.body.endTime;
    if (req.body.activeStatus !== undefined) updateData.activeStatus = req.body.activeStatus;
    const [shift] = await db.update(shiftsTable).set(updateData).where(eq(shiftsTable.id, Number(req.params.id))).returning();
    if (!shift) { res.status(404).json({ error: "Shift not found" }); return; }
    res.json(shift);
  } catch (error) {
    console.error("Update shift error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/shifts/:id", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const [shift] = await db.update(shiftsTable).set({ activeStatus: false }).where(eq(shiftsTable.id, Number(req.params.id))).returning();
    if (!shift) { res.status(404).json({ error: "Shift not found" }); return; }
    res.json({ message: "Shift deactivated" });
  } catch (error) {
    console.error("Delete shift error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/activity-types", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"), async (_req, res) => {
  try {
    const types = await db.select().from(activityTypesTable);
    res.json(types);
  } catch (error) {
    console.error("List activity types error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/activity-types/:id", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"), async (req, res) => {
  try {
    const [type] = await db.select().from(activityTypesTable).where(eq(activityTypesTable.id, Number(req.params.id))).limit(1);
    if (!type) { res.status(404).json({ error: "Activity type not found" }); return; }
    res.json(type);
  } catch (error) {
    console.error("Get activity type error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/activity-types", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const { name, category, weightPoints, noteRequired, quantityNoteThreshold } = req.body;
    if (!name || !weightPoints) { res.status(400).json({ error: "name and weightPoints are required" }); return; }
    const [type] = await db.insert(activityTypesTable).values({ name, category, weightPoints, noteRequired, quantityNoteThreshold }).returning();
    res.status(201).json(type);
  } catch (error) {
    console.error("Create activity type error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/activity-types/:id", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const updateData: Partial<typeof activityTypesTable.$inferInsert> = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.category !== undefined) updateData.category = req.body.category;
    if (req.body.weightPoints !== undefined) updateData.weightPoints = req.body.weightPoints;
    if (req.body.noteRequired !== undefined) updateData.noteRequired = req.body.noteRequired;
    if (req.body.quantityNoteThreshold !== undefined) updateData.quantityNoteThreshold = req.body.quantityNoteThreshold;
    if (req.body.activeStatus !== undefined) updateData.activeStatus = req.body.activeStatus;
    const [type] = await db.update(activityTypesTable).set(updateData).where(eq(activityTypesTable.id, Number(req.params.id))).returning();
    if (!type) { res.status(404).json({ error: "Activity type not found" }); return; }
    res.json(type);
  } catch (error) {
    console.error("Update activity type error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/activity-types/:id", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const [type] = await db.update(activityTypesTable).set({ activeStatus: false }).where(eq(activityTypesTable.id, Number(req.params.id))).returning();
    if (!type) { res.status(404).json({ error: "Activity type not found" }); return; }
    res.json({ message: "Activity type deactivated" });
  } catch (error) {
    console.error("Delete activity type error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
