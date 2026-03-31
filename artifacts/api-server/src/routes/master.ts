import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ptsTable, branchesTable, shiftsTable, activityTypesTable, rolesTable, roleActivityTypesTable, activityLogsTable } from "@workspace/db/schema";
import { eq, and, inArray, gte, lte, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole, getPtScope } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/roles", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"), async (_req, res) => {
  try {
    const roles = await db.select().from(rolesTable).where(eq(rolesTable.activeStatus, true));
    res.json(roles);
  } catch (error) {
    console.error("List roles error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/pts", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"), async (_req, res) => {
  try {
    const pts = await db.select().from(ptsTable);
    res.json(pts);
  } catch (error) {
    console.error("List PTs error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/pts/:id", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"), async (req, res) => {
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

router.get("/branches", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"), async (req, res) => {
  try {
    const conditions: SQL[] = [];
    const ptScope = getPtScope(req);
    if (ptScope !== null) {
      conditions.push(eq(branchesTable.ptId, ptScope));
    } else if (req.query.ptId) {
      conditions.push(eq(branchesTable.ptId, Number(req.query.ptId)));
    }
    const branches = conditions.length > 0
      ? await db.select().from(branchesTable).where(and(...conditions))
      : await db.select().from(branchesTable);
    res.json(branches);
  } catch (error) {
    console.error("List branches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/branches/:id", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"), async (req, res) => {
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

router.get("/shifts", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"), async (_req, res) => {
  try {
    const shifts = await db.select().from(shiftsTable);
    res.json(shifts);
  } catch (error) {
    console.error("List shifts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/shifts/:id", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"), async (req, res) => {
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

const ALL_ROLES_MASTER = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System", "Superadmin"];

router.get("/activity-types", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"), async (_req, res) => {
  try {
    const types = await db.select().from(activityTypesTable);
    res.json(types);
  } catch (error) {
    console.error("List activity types error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/activity-types/for-role", authMiddleware, requireRole(...ALL_ROLES_MASTER), async (req, res) => {
  try {
    const roleId = req.user!.roleId;
    const mappings = await db.select({ activityTypeId: roleActivityTypesTable.activityTypeId })
      .from(roleActivityTypesTable)
      .where(eq(roleActivityTypesTable.roleId, roleId));

    if (mappings.length === 0) {
      const allTypes = await db.select().from(activityTypesTable).where(eq(activityTypesTable.activeStatus, true));
      res.json(allTypes);
      return;
    }

    const ids = mappings.map(m => m.activityTypeId);
    const types = await db.select().from(activityTypesTable)
      .where(and(eq(activityTypesTable.activeStatus, true), inArray(activityTypesTable.id, ids)));
    res.json(types);
  } catch (error) {
    console.error("List activity types for role error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/activity-types/checklist", authMiddleware, requireRole(...ALL_ROLES_MASTER), async (req, res) => {
  try {
    const userId = req.user!.userId;
    const roleId = req.user!.roleId;

    const dateParam = req.query.date as string | undefined;
    const dayStart = dateParam ? new Date(dateParam) : new Date();
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const mappings = await db.select({ activityTypeId: roleActivityTypesTable.activityTypeId })
      .from(roleActivityTypesTable)
      .where(eq(roleActivityTypesTable.roleId, roleId));

    if (mappings.length === 0) {
      res.json([]);
      return;
    }

    const ids = mappings.map(m => m.activityTypeId);
    const types = await db.select().from(activityTypesTable)
      .where(and(eq(activityTypesTable.activeStatus, true), inArray(activityTypesTable.id, ids)));

    const todayLogs = await db.select({ activityTypeId: activityLogsTable.activityTypeId })
      .from(activityLogsTable)
      .where(and(
        eq(activityLogsTable.userId, userId),
        gte(activityLogsTable.createdAt, dayStart),
        lte(activityLogsTable.createdAt, dayEnd),
      ));

    const loggedTypeIds = new Set(todayLogs.map(l => l.activityTypeId));

    const checklist = types.map(t => ({
      ...t,
      done: loggedTypeIds.has(t.id),
    }));

    res.json(checklist);
  } catch (error) {
    console.error("Checklist error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/activity-types/:id", authMiddleware, requireRole("Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"), async (req, res) => {
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

router.get("/role-activity-types", authMiddleware, requireRole("Owner", "Admin System", "Superadmin"), async (req, res) => {
  try {
    const roleId = req.query.roleId ? Number(req.query.roleId) : undefined;
    const rows = roleId
      ? await db.select().from(roleActivityTypesTable).where(eq(roleActivityTypesTable.roleId, roleId))
      : await db.select().from(roleActivityTypesTable);
    res.json(rows);
  } catch (error) {
    console.error("List role activity types error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/role-activity-types", authMiddleware, requireRole("Owner", "Admin System", "Superadmin"), async (req, res) => {
  try {
    const { roleId, activityTypeIds } = req.body;
    if (!roleId || !Array.isArray(activityTypeIds)) {
      res.status(400).json({ error: "roleId and activityTypeIds[] are required" }); return;
    }
    await db.delete(roleActivityTypesTable).where(eq(roleActivityTypesTable.roleId, roleId));
    if (activityTypeIds.length > 0) {
      await db.insert(roleActivityTypesTable).values(
        activityTypeIds.map((id: number) => ({ roleId, activityTypeId: id }))
      );
    }
    res.json({ message: "Role activity types updated" });
  } catch (error) {
    console.error("Update role activity types error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
