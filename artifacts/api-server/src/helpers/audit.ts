import { db } from "@workspace/db";
import { auditLogsTable, notificationsTable } from "@workspace/db/schema";

export async function createAuditLog(params: {
  userId: number | null;
  actionType: string;
  module: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}) {
  await db.insert(auditLogsTable).values({
    userId: params.userId,
    actionType: params.actionType,
    module: params.module,
    entityId: params.entityId ?? null,
    oldValue: params.oldValue ?? null,
    newValue: params.newValue ?? null,
    ipAddress: params.ipAddress ?? null,
  });
}

export async function createNotification(params: {
  userId: number;
  type: string;
  title: string;
  content?: string;
}) {
  await db.insert(notificationsTable).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    content: params.content ?? null,
  });
}

export async function notifyMultipleUsers(userIds: number[], params: {
  type: string;
  title: string;
  content?: string;
}) {
  if (userIds.length === 0) return;
  await db.insert(notificationsTable).values(
    userIds.map((userId) => ({
      userId,
      type: params.type,
      title: params.title,
      content: params.content ?? null,
    }))
  );
}
