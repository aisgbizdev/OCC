import { Router, type IRouter } from "express";
import bcryptjs from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, rolesTable, ptsTable, branchesTable, shiftsTable } from "@workspace/db/schema";
import { eq, and, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

async function enrichUser(user: typeof usersTable.$inferSelect) {
  const roles = await db.select().from(rolesTable).where(eq(rolesTable.id, user.roleId)).limit(1);
  const pt = user.ptId ? (await db.select().from(ptsTable).where(eq(ptsTable.id, user.ptId)).limit(1))[0] : null;
  const branch = user.branchId ? (await db.select().from(branchesTable).where(eq(branchesTable.id, user.branchId)).limit(1))[0] : null;
  const shift = user.shiftId ? (await db.select().from(shiftsTable).where(eq(shiftsTable.id, user.shiftId)).limit(1))[0] : null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    roleId: user.roleId,
    roleName: roles[0]?.name || "",
    ptId: user.ptId,
    ptName: pt?.name || null,
    branchId: user.branchId,
    branchName: branch?.name || null,
    shiftId: user.shiftId,
    shiftName: shift?.name || null,
    positionTitle: user.positionTitle,
    supervisorId: user.supervisorId,
    activeStatus: user.activeStatus,
    dndEnabled: user.dndEnabled,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users", authMiddleware, requireRole("Owner", "Admin System", "Chief Dealing", "SPV Dealing", "Direksi"), async (req, res) => {
  try {
    const conditions: SQL[] = [];
    if (req.query.ptId) conditions.push(eq(usersTable.ptId, Number(req.query.ptId)));
    if (req.query.roleId) conditions.push(eq(usersTable.roleId, Number(req.query.roleId)));
    if (req.query.shiftId) conditions.push(eq(usersTable.shiftId, Number(req.query.shiftId)));
    if (req.query.activeStatus !== undefined) conditions.push(eq(usersTable.activeStatus, req.query.activeStatus === "true"));

    const users = conditions.length > 0
      ? await db.select().from(usersTable).where(and(...conditions))
      : await db.select().from(usersTable);

    const enriched = await Promise.all(users.map(enrichUser));
    res.json(enriched);
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users", authMiddleware, requireRole("Owner", "Admin System", "Chief Dealing"), async (req, res) => {
  try {
    const { name, email, password, phone, roleId, ptId, branchId, shiftId, positionTitle, supervisorId } = req.body;
    if (!name || !email || !password || !roleId) {
      res.status(400).json({ error: "name, email, password, and roleId are required" });
      return;
    }
    const passwordHash = await bcryptjs.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      name, email, passwordHash, phone, roleId, ptId, branchId, shiftId, positionTitle, supervisorId,
    }).returning();
    const enriched = await enrichUser(user);
    res.status(201).json(enriched);
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === "23505") {
      res.status(409).json({ error: "Email already exists" });
      return;
    }
    console.error("Create user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Self-profile update (all authenticated users) ── MUST come before /users/:id ──
router.put("/users/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { name, phone, positionTitle } = req.body;

    const updateData: Partial<typeof usersTable.$inferInsert> = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (phone !== undefined) updateData.phone = String(phone).trim() || null;
    if (positionTitle !== undefined) updateData.positionTitle = String(positionTitle).trim() || null;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "No fields to update" }); return;
    }

    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, userId)).returning();
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(await enrichUser(user));
  } catch (error) {
    console.error("Update own profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Toggle DND for self ──────────────────────────────────────────────────────
router.put("/users/me/dnd", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { dndEnabled } = req.body;
    if (typeof dndEnabled !== "boolean") {
      res.status(400).json({ error: "dndEnabled (boolean) is required" }); return;
    }
    const [user] = await db.update(usersTable).set({ dndEnabled }).where(eq(usersTable.id, userId)).returning();
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ dndEnabled: user.dndEnabled });
  } catch (error) {
    console.error("Toggle DND error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Change own password ──────────────────────────────────────────────────────
router.put("/users/me/password", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "currentPassword dan newPassword wajib diisi" }); return;
    }
    if (String(newPassword).length < 6) {
      res.status(400).json({ error: "Password baru minimal 6 karakter" }); return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const valid = await bcryptjs.compare(String(currentPassword), user.passwordHash);
    if (!valid) { res.status(401).json({ error: "Password lama tidak sesuai" }); return; }

    const passwordHash = await bcryptjs.hash(String(newPassword), 10);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, userId));
    res.json({ message: "Password berhasil diubah" });
  } catch (error) {
    console.error("Change own password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin reset another user's password ─────────────────────────────────────
router.put("/users/:id/password", authMiddleware, requireRole("Owner", "Admin System"), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 6) {
      res.status(400).json({ error: "newPassword wajib diisi, minimal 6 karakter" }); return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id))).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const passwordHash = await bcryptjs.hash(String(newPassword), 10);
    await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, Number(req.params.id)));
    res.json({ message: "Password user berhasil direset" });
  } catch (error) {
    console.error("Admin reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Generic :id routes — MUST come AFTER all /users/me routes ────────────────
router.get("/users/:id", authMiddleware, requireRole("Owner", "Admin System", "Chief Dealing", "SPV Dealing", "Direksi"), async (req, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, Number(req.params.id))).limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(await enrichUser(user));
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/users/:id", authMiddleware, requireRole("Owner", "Admin System", "Chief Dealing"), async (req, res) => {
  try {
    const roleName = req.user!.roleName;
    const isSuperAdmin = roleName === "Superadmin";
    const canEditRolePt = isSuperAdmin || roleName === "Owner" || roleName === "Chief Dealing";
    const canChangeActiveStatus = isSuperAdmin || roleName === "Admin System";

    const updateData: Partial<typeof usersTable.$inferInsert> = {};

    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.shiftId !== undefined) updateData.shiftId = req.body.shiftId;
    if (req.body.positionTitle !== undefined) updateData.positionTitle = req.body.positionTitle;
    if (req.body.supervisorId !== undefined) updateData.supervisorId = req.body.supervisorId;
    if (req.body.branchId !== undefined) updateData.branchId = req.body.branchId;

    if (req.body.roleId !== undefined) {
      if (!canEditRolePt) {
        res.status(403).json({ error: "Insufficient permissions to change role" });
        return;
      }
      updateData.roleId = req.body.roleId;
    }

    if (req.body.ptId !== undefined) {
      if (!canEditRolePt) {
        res.status(403).json({ error: "Insufficient permissions to change PT assignment" });
        return;
      }
      updateData.ptId = req.body.ptId;
    }

    if (req.body.activeStatus !== undefined) {
      if (!canChangeActiveStatus) {
        res.status(403).json({ error: "Insufficient permissions to change active status" });
        return;
      }
      updateData.activeStatus = req.body.activeStatus;
    }

    const [user] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, Number(req.params.id))).returning();
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(await enrichUser(user));
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/:id", authMiddleware, requireRole("Admin System"), async (req, res) => {
  try {
    const [user] = await db.update(usersTable).set({ activeStatus: false }).where(eq(usersTable.id, Number(req.params.id))).returning();
    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ message: "User deactivated" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
