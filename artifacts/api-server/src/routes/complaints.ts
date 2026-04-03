import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  complaintsTable, usersTable, ptsTable, branchesTable,
  complaintCommentsTable, complaintHistoryTable, rolesTable,
} from "@workspace/db/schema";
import { eq, and, desc, asc, inArray, or, isNull, type SQL } from "drizzle-orm";
import { authMiddleware, requireRole, getPtScope } from "../middlewares/auth";
import { createAuditLog, createNotification, notifyMultipleUsers } from "../helpers/audit";
import { sendPushToRoles, sendPushToUsers } from "../lib/push";

const router: IRouter = Router();

const ALL_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System", "Superadmin"];
const CREATE_ROLES = ["Owner", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Admin System", "Superadmin"];
const UPDATE_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Admin System", "Superadmin"];
const SPV_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Admin System", "Superadmin"];
const SPV_NOTIFY_ROLES = ["SPV Dealing", "Co-SPV Dealing", "Chief Dealing", "Owner", "Direksi", "Superadmin"];

async function enrichComplaint(complaint: typeof complaintsTable.$inferSelect) {
  const assignedUser = complaint.assignedUserId
    ? (await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, complaint.assignedUserId)).limit(1))[0] : null;
  const creator = complaint.createdBy
    ? (await db.select({ name: usersTable.name, roleId: usersTable.roleId }).from(usersTable).where(eq(usersTable.id, complaint.createdBy)).limit(1))[0] : null;
  const pt = complaint.ptId
    ? (await db.select().from(ptsTable).where(eq(ptsTable.id, complaint.ptId)).limit(1))[0] : null;
  const branch = complaint.branchId
    ? (await db.select().from(branchesTable).where(eq(branchesTable.id, complaint.branchId)).limit(1))[0] : null;

  const elapsedMs = Date.now() - complaint.createdAt.getTime();
  const elapsedHours = elapsedMs / 3600000;
  let slaStatus: "normal" | "warning" | "critical" = "normal";
  if (complaint.status !== "closed" && complaint.status !== "resolved") {
    if (elapsedHours > 72) slaStatus = "critical";
    else if (elapsedHours > 24) slaStatus = "warning";
  }

  return {
    ...complaint,
    assignedUserName: assignedUser?.name ?? null,
    creatorName: creator?.name ?? null,
    ptName: pt?.name ?? null,
    branchName: branch?.name ?? null,
    slaStatus,
    elapsedHours: Math.round(elapsedHours * 10) / 10,
  };
}

router.get("/complaints", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const conditions: SQL[] = [];
    if (req.query.status) conditions.push(eq(complaintsTable.status, req.query.status as string));
    if (req.query.severity) conditions.push(eq(complaintsTable.severity, req.query.severity as string));
    const ptScope = getPtScope(req);
    if (ptScope !== null) {
      conditions.push(eq(complaintsTable.ptId, ptScope));
    } else if (req.query.ptId) {
      conditions.push(eq(complaintsTable.ptId, Number(req.query.ptId)));
    }
    if (req.query.assignedUserId) conditions.push(eq(complaintsTable.assignedUserId, Number(req.query.assignedUserId)));

    const complaints = await db.select().from(complaintsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(complaintsTable.createdAt))
      .limit(Number(req.query.limit) || 100);

    const enriched = await Promise.all(complaints.map(enrichComplaint));

    const ids = complaints.map(c => c.id);
    let commentCounts: Record<number, number> = {};
    if (ids.length > 0) {
      const rows = await db.select({ complaintId: complaintCommentsTable.complaintId, id: complaintCommentsTable.id })
        .from(complaintCommentsTable)
        .where(inArray(complaintCommentsTable.complaintId, ids));
      rows.forEach(r => { commentCounts[r.complaintId] = (commentCounts[r.complaintId] ?? 0) + 1; });
    }

    res.json(enriched.map(c => ({ ...c, commentCount: commentCounts[c.id] ?? 0 })));
  } catch (error) {
    console.error("List complaints error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/complaints/:id", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const cid = Number(req.params.id);
    const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, cid)).limit(1);
    if (!complaint) { res.status(404).json({ error: "Complaint not found" }); return; }

    const [enriched, comments, history] = await Promise.all([
      enrichComplaint(complaint),
      db.select({
        id: complaintCommentsTable.id,
        complaintId: complaintCommentsTable.complaintId,
        userId: complaintCommentsTable.userId,
        content: complaintCommentsTable.content,
        createdAt: complaintCommentsTable.createdAt,
        userName: usersTable.name,
      })
        .from(complaintCommentsTable)
        .leftJoin(usersTable, eq(complaintCommentsTable.userId, usersTable.id))
        .where(eq(complaintCommentsTable.complaintId, cid))
        .orderBy(asc(complaintCommentsTable.createdAt)),
      db.select({
        id: complaintHistoryTable.id,
        complaintId: complaintHistoryTable.complaintId,
        userId: complaintHistoryTable.userId,
        changeType: complaintHistoryTable.changeType,
        oldValue: complaintHistoryTable.oldValue,
        newValue: complaintHistoryTable.newValue,
        note: complaintHistoryTable.note,
        createdAt: complaintHistoryTable.createdAt,
        userName: usersTable.name,
      })
        .from(complaintHistoryTable)
        .leftJoin(usersTable, eq(complaintHistoryTable.userId, usersTable.id))
        .where(eq(complaintHistoryTable.complaintId, cid))
        .orderBy(asc(complaintHistoryTable.createdAt)),
    ]);

    res.json({ ...enriched, comments, history });
  } catch (error) {
    console.error("Get complaint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/complaints/:id/comments", authMiddleware, requireRole(...ALL_ROLES), async (req, res) => {
  try {
    const cid = Number(req.params.id);
    const { content } = req.body;
    if (!content?.trim()) { res.status(400).json({ error: "content is required" }); return; }

    const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, cid)).limit(1);
    if (!complaint) { res.status(404).json({ error: "Complaint not found" }); return; }

    const [comment] = await db.insert(complaintCommentsTable).values({
      complaintId: cid,
      userId: req.user!.userId,
      content: content.trim(),
    }).returning();

    const [commenterRow] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    const commenterName = commenterRow?.name ?? "Seseorang";
    const commenterRole = req.user!.roleName;
    const isSpvOrAbove = SPV_AND_ABOVE.includes(commenterRole);

    const notifySet = new Set<number>();

    if (complaint.createdBy && complaint.createdBy !== req.user!.userId) notifySet.add(complaint.createdBy);
    if (complaint.assignedUserId && complaint.assignedUserId !== req.user!.userId) notifySet.add(complaint.assignedUserId);

    const prevCommenters = await db.select({ userId: complaintCommentsTable.userId })
      .from(complaintCommentsTable)
      .where(eq(complaintCommentsTable.complaintId, cid));
    prevCommenters.forEach(r => { if (r.userId !== req.user!.userId) notifySet.add(r.userId); });

    const notifyIds = Array.from(notifySet);
    if (notifyIds.length > 0) {
      await notifyMultipleUsers(notifyIds, {
        type: "complaint_comment",
        title: `Komentar baru: ${complaint.title}`,
        content: `${commenterName}: ${content.trim().slice(0, 100)}`,
      });
      sendPushToUsers(notifyIds, {
        title: `Komentar Komplain: ${complaint.title}`,
        body: `${commenterName}: ${content.trim().slice(0, 80)}`,
        url: `/complaints`,
        tag: `complaint-comment-${cid}`,
      }).catch(console.error);
    }

    if (!isSpvOrAbove) {
      const ptId = complaint.ptId;
      const spvUsers = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .innerJoin(rolesTable, eq(usersTable.roleId, rolesTable.id))
        .where(
          and(
            inArray(rolesTable.name, SPV_NOTIFY_ROLES),
            ptId !== null
              ? or(eq(usersTable.ptId, ptId), isNull(usersTable.ptId))
              : isNull(usersTable.ptId),
            eq(usersTable.activeStatus, true),
          )
        );
      const spvIds = spvUsers.map(u => u.id).filter(id => id !== req.user!.userId && !notifySet.has(id));
      if (spvIds.length > 0) {
        await notifyMultipleUsers(spvIds, {
          type: "complaint_comment",
          title: `Komplain dikomentari: ${complaint.title}`,
          content: `${commenterName}: ${content.trim().slice(0, 100)}`,
        });
        sendPushToUsers(spvIds, {
          title: `Komplain dikomentari: ${complaint.title}`,
          body: `${commenterName}: ${content.trim().slice(0, 80)}`,
          url: `/complaints`,
          tag: `complaint-comment-${cid}`,
        }).catch(console.error);
      }
    }

    res.status(201).json({
      ...comment,
      userName: commenterName,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/complaints", authMiddleware, requireRole(...CREATE_ROLES), async (req, res) => {
  try {
    const { title, complaintType, ptId, branchId, assignedUserId, severity, chronology, followUp } = req.body;
    if (!title || !complaintType) {
      res.status(400).json({ error: "title and complaintType are required" }); return;
    }
    const [complaint] = await db.insert(complaintsTable).values({
      title,
      complaintType,
      ptId: ptId ?? req.user!.ptId,
      branchId: branchId ?? null,
      assignedUserId: assignedUserId ?? null,
      severity: severity ?? "medium",
      chronology: chronology ?? null,
      followUp: followUp ?? null,
      createdBy: req.user!.userId,
    }).returning();

    await db.insert(complaintHistoryTable).values({
      complaintId: complaint.id,
      userId: req.user!.userId,
      changeType: "created",
      newValue: "open",
      note: `Komplain dibuat dengan status Open, urgensi ${severity ?? "medium"}`,
    });

    if (assignedUserId) {
      await createNotification({
        userId: assignedUserId,
        type: "complaint_assigned",
        title: `Komplain ditugaskan: ${title}`,
        content: chronology ?? undefined,
      });
      sendPushToUsers([assignedUserId], {
        title: `Komplain Ditugaskan ke Anda`,
        body: title,
        url: `/complaints`,
        tag: `complaint-assign-${complaint.id}`,
      }).catch(console.error);
    }

    sendPushToRoles(["SPV Dealing", "Chief Dealing", "Owner"], {
      title: `Komplain Baru${severity === "high" ? " — URGENSI TINGGI" : ""}`,
      body: title,
      url: `/complaints`,
      tag: `complaint-${complaint.id}`,
    }).catch(console.error);

    await createAuditLog({ userId: req.user!.userId, actionType: "create", module: "complaint", entityId: String(complaint.id) });
    res.status(201).json({ ...await enrichComplaint(complaint), comments: [], history: [], commentCount: 0 });
  } catch (error) {
    console.error("Create complaint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/complaints/:id", authMiddleware, requireRole(...UPDATE_ROLES), async (req, res) => {
  try {
    const cid = Number(req.params.id);
    const [existing] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, cid)).limit(1);
    if (!existing) { res.status(404).json({ error: "Complaint not found" }); return; }

    const VALID_STATUSES = ["open", "in_progress", "escalated", "resolved", "closed"];
    const VALID_TRANSITIONS: Record<string, string[]> = {
      open: ["in_progress", "escalated"],
      in_progress: ["escalated", "resolved"],
      escalated: ["in_progress", "resolved"],
      resolved: ["closed", "open"],
      closed: [],
    };

    const updateData: Partial<typeof complaintsTable.$inferInsert> = {};
    const historyEntries: Array<{
      complaintId: number;
      userId: number;
      changeType: string;
      oldValue?: string;
      newValue?: string;
      note?: string;
    }> = [];

    if (req.body.status !== undefined) {
      if (!VALID_STATUSES.includes(req.body.status)) {
        res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }); return;
      }
      const allowed = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(req.body.status)) {
        res.status(400).json({ error: `Cannot transition from '${existing.status}' to '${req.body.status}'. Allowed: ${allowed.join(", ") || "none"}` }); return;
      }
      updateData.status = req.body.status;
      historyEntries.push({ complaintId: cid, userId: req.user!.userId, changeType: "status_changed", oldValue: existing.status, newValue: req.body.status });
    }
    if (req.body.severity !== undefined && req.body.severity !== existing.severity) {
      historyEntries.push({ complaintId: cid, userId: req.user!.userId, changeType: "severity_changed", oldValue: existing.severity, newValue: req.body.severity });
      updateData.severity = req.body.severity;
    }
    if (req.body.followUp !== undefined) {
      historyEntries.push({ complaintId: cid, userId: req.user!.userId, changeType: "followup_updated", note: req.body.followUp?.slice(0, 200) });
      updateData.followUp = req.body.followUp;
    }
    if (req.body.chronology !== undefined) {
      historyEntries.push({ complaintId: cid, userId: req.user!.userId, changeType: "chronology_updated" });
      updateData.chronology = req.body.chronology;
    }
    if (req.body.assignedUserId !== undefined) {
      const oldAssignee = existing.assignedUserId;
      const newAssignee = req.body.assignedUserId;
      if (oldAssignee !== newAssignee) {
        const [newUser] = newAssignee
          ? await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, newAssignee)).limit(1)
          : [null];
        historyEntries.push({ complaintId: cid, userId: req.user!.userId, changeType: "assignee_changed", oldValue: oldAssignee ? String(oldAssignee) : undefined, newValue: newAssignee ? newUser?.name ?? String(newAssignee) : "Unassigned" });
        await createNotification({ userId: newAssignee, type: "complaint_assigned", title: `Komplain ditugaskan: ${existing.title}` });
        sendPushToUsers([newAssignee], { title: "Komplain Ditugaskan ke Anda", body: existing.title, url: `/complaints`, tag: `complaint-assign-${cid}` }).catch(console.error);
      }
      updateData.assignedUserId = newAssignee;
    }
    if (req.body.title !== undefined) {
      updateData.title = req.body.title;
    }

    const [updated] = await db.update(complaintsTable).set(updateData)
      .where(eq(complaintsTable.id, cid)).returning();

    if (historyEntries.length > 0) {
      await db.insert(complaintHistoryTable).values(historyEntries);
    }

    const notifySet = new Set<number>();
    if (existing.createdBy && existing.createdBy !== req.user!.userId) notifySet.add(existing.createdBy);
    if (existing.assignedUserId && existing.assignedUserId !== req.user!.userId) notifySet.add(existing.assignedUserId);

    if (req.body.status !== undefined) {
      const notifyIds = Array.from(notifySet);
      const statusLabel: Record<string, string> = { open: "Open", in_progress: "In Progress", escalated: "Eskalasi", resolved: "Selesai", closed: "Ditutup" };
      if (notifyIds.length > 0) {
        await notifyMultipleUsers(notifyIds, { type: "complaint_status", title: `Status komplain diperbarui: ${existing.title}`, content: `Status berubah dari ${statusLabel[existing.status] ?? existing.status} ke ${statusLabel[req.body.status] ?? req.body.status}` });
        sendPushToUsers(notifyIds, { title: `Status Komplain: ${existing.title}`, body: `${statusLabel[req.body.status] ?? req.body.status}`, url: `/complaints`, tag: `complaint-status-${cid}` }).catch(console.error);
      }

      if (req.body.status === "escalated") {
        sendPushToRoles(["Chief Dealing", "Owner", "Direksi"], { title: "Komplain Di-eskalasi", body: existing.title, url: `/complaints`, tag: `complaint-escalated-${cid}`, type: "escalation" }).catch(console.error);
      }
    }

    await createAuditLog({ userId: req.user!.userId, actionType: "update", module: "complaint", entityId: String(updated.id), newValue: JSON.stringify({ status: updated.status, severity: updated.severity }) });
    res.json({ ...await enrichComplaint(updated), commentCount: 0 });
  } catch (error) {
    console.error("Update complaint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/complaints/:id", authMiddleware, requireRole(...CREATE_ROLES), async (req, res) => {
  try {
    const cid = Number(req.params.id);
    const [existing] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, cid)).limit(1);
    if (!existing) { res.status(404).json({ error: "Complaint not found" }); return; }
    await db.update(complaintsTable).set({ status: "closed" }).where(eq(complaintsTable.id, cid));
    await db.insert(complaintHistoryTable).values({ complaintId: cid, userId: req.user!.userId, changeType: "status_changed", oldValue: existing.status, newValue: "closed" });
    await createAuditLog({ userId: req.user!.userId, actionType: "close", module: "complaint", entityId: String(cid) });
    res.json({ message: "Complaint closed" });
  } catch (error) {
    console.error("Delete complaint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
