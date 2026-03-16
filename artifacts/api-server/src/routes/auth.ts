import { Router, type IRouter } from "express";
import bcryptjs from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, rolesTable, ptsTable, branchesTable, shiftsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authMiddleware, signToken } from "../middlewares/auth";

const router: IRouter = Router();

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (users.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = users[0];
    if (!user.activeStatus) {
      res.status(401).json({ error: "Account is deactivated" });
      return;
    }

    const valid = await bcryptjs.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const roles = await db.select().from(rolesTable).where(eq(rolesTable.id, user.roleId)).limit(1);
    const roleName = roles[0]?.name || "";

    const token = signToken({
      userId: user.id,
      roleId: user.roleId,
      roleName,
      ptId: user.ptId,
    });

    const pt = user.ptId ? (await db.select().from(ptsTable).where(eq(ptsTable.id, user.ptId)).limit(1))[0] : null;
    const branch = user.branchId ? (await db.select().from(branchesTable).where(eq(branchesTable.id, user.branchId)).limit(1))[0] : null;
    const shift = user.shiftId ? (await db.select().from(shiftsTable).where(eq(shiftsTable.id, user.shiftId)).limit(1))[0] : null;

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        roleId: user.roleId,
        roleName,
        ptId: user.ptId,
        ptName: pt?.name || null,
        branchId: user.branchId,
        branchName: branch?.name || null,
        shiftId: user.shiftId,
        shiftName: shift?.name || null,
        positionTitle: user.positionTitle,
        supervisorId: user.supervisorId,
        activeStatus: user.activeStatus,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", authMiddleware, (_req, res) => {
  // Stateless JWT: logout is client-side only (discard the token).
  // No server-side token revocation is implemented.
  res.json({ message: "Logged out successfully" });
});

router.get("/auth/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (users.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const user = users[0];
    const roles = await db.select().from(rolesTable).where(eq(rolesTable.id, user.roleId)).limit(1);
    const pt = user.ptId ? (await db.select().from(ptsTable).where(eq(ptsTable.id, user.ptId)).limit(1))[0] : null;
    const branch = user.branchId ? (await db.select().from(branchesTable).where(eq(branchesTable.id, user.branchId)).limit(1))[0] : null;
    const shift = user.shiftId ? (await db.select().from(shiftsTable).where(eq(shiftsTable.id, user.shiftId)).limit(1))[0] : null;

    res.json({
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
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
