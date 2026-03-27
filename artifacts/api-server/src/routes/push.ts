import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { pushSubscriptionsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { authMiddleware, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

const ALL_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Dealer", "Admin System"];

router.get("/push/vapid-key", (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? "" });
});

router.post("/push/subscribe", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys) {
      res.status(400).json({ error: "endpoint and keys required" });
      return;
    }

    const userAgent = req.headers["user-agent"]?.slice(0, 512) ?? null;
    const userId = req.user!.userId;

    await db
      .insert(pushSubscriptionsTable)
      .values({ userId, endpoint, keys, userAgent })
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: { userId, keys, userAgent, updatedAt: new Date() },
      });

    res.json({ message: "Subscribed" });
  } catch (error) {
    console.error("Push subscribe error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/push/unsubscribe", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      res.status(400).json({ error: "endpoint required" });
      return;
    }

    await db
      .delete(pushSubscriptionsTable)
      .where(and(
        eq(pushSubscriptionsTable.endpoint, endpoint),
        eq(pushSubscriptionsTable.userId, req.user!.userId)
      ));

    res.json({ message: "Unsubscribed" });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
