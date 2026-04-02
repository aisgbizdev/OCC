import type {
  ActivityLogWithRelations,
  TaskWithRelations,
  UserWithRelations,
} from "@workspace/api-client-react";

export type RoleName =
  | "Superadmin"
  | "Owner"
  | "Direksi"
  | "Chief Dealing"
  | "SPV Dealing"
  | "Co-SPV Dealing"
  | "Dealer"
  | "Admin System";

type AccessUser = Pick<UserWithRelations, "id" | "roleName" | "ptId"> | null | undefined;

export type ModuleKey =
  | "dashboard"
  | "activityLog"
  | "task"
  | "complaint"
  | "announcement"
  | "message"
  | "chat"
  | "handover"
  | "notification"
  | "user"
  | "systemSetting"
  | "auditLog"
  | "masterData"
  | "branchOverview"
  | "kpi"
  | "kpiSnapshot"
  | "wallboard";

type AccessAction =
  | "view"
  | "create"
  | "createGroup"
  | "edit"
  | "delete"
  | "comment"
  | "updateStatus"
  | "send"
  | "flag"
  | "resetPassword";

type AccessMatrix = Record<ModuleKey, Partial<Record<AccessAction, readonly RoleName[]>>>;

export type PageKey =
  | "dashboard"
  | "activityLogs"
  | "kpi"
  | "tasks"
  | "complaints"
  | "announcements"
  | "messages"
  | "chats"
  | "handover"
  | "notifications"
  | "users"
  | "system"
  | "branches"
  | "profile";

const ALL_ROLES: readonly RoleName[] = [
  "Owner",
  "Direksi",
  "Chief Dealing",
  "SPV Dealing",
  "Co-SPV Dealing",
  "Dealer",
  "Admin System",
];

const MGMT_ROLES: readonly RoleName[] = [
  "Owner",
  "Chief Dealing",
  "SPV Dealing",
  "Co-SPV Dealing",
  "Admin System",
];

const ADMIN_ROLES: readonly RoleName[] = ["Owner", "Admin System"];

const SPV_AND_ABOVE: readonly RoleName[] = [
  "Owner",
  "Direksi",
  "Chief Dealing",
  "SPV Dealing",
  "Co-SPV Dealing",
  "Admin System",
];

const BRANCH_OVERVIEW_ROLES: readonly RoleName[] = [
  "Owner",
  "Direksi",
  "Chief Dealing",
  "SPV Dealing",
  "Co-SPV Dealing",
  "Admin System",
];

const USER_VIEW_ROLES: readonly RoleName[] = [
  "Owner",
  "Admin System",
  "Chief Dealing",
  "SPV Dealing",
  "Co-SPV Dealing",
  "Direksi",
];

const ACCESS_MATRIX: AccessMatrix = {
  dashboard: { view: ALL_ROLES },
  activityLog: { view: ALL_ROLES, create: ALL_ROLES, edit: ALL_ROLES, delete: ALL_ROLES, flag: SPV_AND_ABOVE },
  task: {
    view: ALL_ROLES,
    create: MGMT_ROLES,
    edit: ALL_ROLES,
    delete: MGMT_ROLES,
    comment: ALL_ROLES,
    updateStatus: ALL_ROLES,
  },
  complaint: { view: ALL_ROLES, create: MGMT_ROLES, edit: MGMT_ROLES, delete: MGMT_ROLES },
  announcement: { view: ALL_ROLES, create: MGMT_ROLES, edit: MGMT_ROLES, delete: MGMT_ROLES },
  message: { view: ALL_ROLES, send: MGMT_ROLES },
  chat: { view: ALL_ROLES, send: ALL_ROLES, create: ALL_ROLES },
  handover: { view: ALL_ROLES, create: ["Owner", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Dealer", "Admin System"] },
  notification: { view: ALL_ROLES },
  user: {
    view: USER_VIEW_ROLES,
    create: ["Owner", "Admin System", "Chief Dealing"],
    edit: ["Owner", "Admin System", "Chief Dealing"],
    delete: ["Owner", "Admin System"],
    resetPassword: ADMIN_ROLES,
  },
  systemSetting: { view: ALL_ROLES, edit: ADMIN_ROLES },
  auditLog: { view: ADMIN_ROLES },
  masterData: { view: ALL_ROLES, create: ADMIN_ROLES, edit: ADMIN_ROLES, delete: ADMIN_ROLES },
  branchOverview: { view: BRANCH_OVERVIEW_ROLES, create: ADMIN_ROLES, delete: ADMIN_ROLES },
  kpi: { view: ALL_ROLES },
  kpiSnapshot: {
    view: ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Admin System"],
    create: ADMIN_ROLES,
  },
  wallboard: { view: ADMIN_ROLES },
};

const PAGE_MATRIX: Record<PageKey, readonly RoleName[]> = {
  dashboard: ALL_ROLES,
  activityLogs: ALL_ROLES,
  kpi: ALL_ROLES,
  tasks: ALL_ROLES,
  complaints: ALL_ROLES,
  announcements: ALL_ROLES,
  messages: ALL_ROLES,
  chats: ALL_ROLES,
  handover: ALL_ROLES,
  notifications: ALL_ROLES,
  users: USER_VIEW_ROLES,
  system: ADMIN_ROLES,
  branches: BRANCH_OVERVIEW_ROLES,
  profile: ALL_ROLES,
};

const ACTIVITY_EDIT_WINDOW_BYPASS: readonly RoleName[] = ["Owner", "Admin System"];
const ACTIVITY_DELETE_GLOBAL_ANYTIME: readonly RoleName[] = ["Owner"];
const ACTIVITY_DELETE_PT_ANYTIME: readonly RoleName[] = [
  "SPV Dealing",
  "Co-SPV Dealing",
  "Chief Dealing",
];

function getRoleName(user: AccessUser): RoleName | null {
  if (!user?.roleName) return null;
  return user.roleName as RoleName;
}

function hasRole(user: AccessUser, allowedRoles: readonly RoleName[] | undefined): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return false;
  const role = getRoleName(user);
  if (!role) return false;
  if (role === "Superadmin") return true;
  return allowedRoles.includes(role);
}

export function can(moduleKey: ModuleKey, action: AccessAction, user: AccessUser): boolean {
  return hasRole(user, ACCESS_MATRIX[moduleKey]?.[action]);
}

export function canView(moduleKey: ModuleKey, user: AccessUser): boolean {
  return can(moduleKey, "view", user);
}

export function canCreate(moduleKey: ModuleKey, user: AccessUser): boolean {
  return can(moduleKey, "create", user);
}

export function canCreateGroupChat(user: AccessUser): boolean {
  const role = getRoleName(user);
  if (!role) return false;
  if (role === "Superadmin") return true;
  return ["Owner", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Admin System"].includes(role);
}

export function canEdit(moduleKey: ModuleKey, user: AccessUser): boolean {
  return can(moduleKey, "edit", user);
}

export function canDelete(moduleKey: ModuleKey, user: AccessUser): boolean {
  return can(moduleKey, "delete", user);
}

export function canComment(moduleKey: ModuleKey, user: AccessUser): boolean {
  return can(moduleKey, "comment", user);
}

export function canUpdateStatus(moduleKey: ModuleKey, user: AccessUser): boolean {
  return can(moduleKey, "updateStatus", user);
}

export function canSend(moduleKey: ModuleKey, user: AccessUser): boolean {
  return can(moduleKey, "send", user);
}

export function canResetPassword(moduleKey: ModuleKey, user: AccessUser): boolean {
  return can(moduleKey, "resetPassword", user);
}

export function canAccessPage(page: PageKey, user: AccessUser): boolean {
  return hasRole(user, PAGE_MATRIX[page]);
}

export function canUpdateTask(user: AccessUser, task: Pick<TaskWithRelations, "assignedTo">): boolean {
  if (!canUpdateStatus("task", user)) return false;
  const role = getRoleName(user);
  if (role === "Dealer") return task.assignedTo === user?.id;
  return true;
}

export function canCommentTaskForItem(
  user: AccessUser,
  task: Pick<TaskWithRelations, "assignedTo">,
): boolean {
  if (!canComment("task", user)) return false;
  const role = getRoleName(user);
  if (role === "Dealer") return task.assignedTo === user?.id;
  return true;
}

export function canEditActivityLog(
  user: AccessUser,
  log: Pick<ActivityLogWithRelations, "userId" | "createdAt">,
  editWindowMinutes: number,
): boolean {
  if (!canEdit("activityLog", user)) return false;
  const role = getRoleName(user);
  if (!role) return false;
  if (ACTIVITY_EDIT_WINDOW_BYPASS.includes(role)) return true;
  if (role === "Dealer" && log.userId !== user?.id) return false;

  const elapsedMinutes = log.createdAt
    ? (Date.now() - new Date(log.createdAt).getTime()) / 60000
    : Infinity;
  return elapsedMinutes <= editWindowMinutes;
}

export function canDeleteActivityLog(
  user: AccessUser,
  log: Pick<ActivityLogWithRelations, "userId" | "ptId" | "createdAt">,
  editWindowMinutes: number,
): boolean {
  if (!canDelete("activityLog", user)) return false;
  const role = getRoleName(user);
  if (!role) return false;

  if (ACTIVITY_DELETE_GLOBAL_ANYTIME.includes(role)) return true;
  if (ACTIVITY_DELETE_PT_ANYTIME.includes(role)) {
    if (user?.ptId === null || user?.ptId === undefined) return false;
    return log.ptId === user.ptId;
  }

  if (log.userId !== user?.id) return false;
  const elapsedMinutes = log.createdAt
    ? (Date.now() - new Date(log.createdAt).getTime()) / 60000
    : Infinity;
  return elapsedMinutes <= editWindowMinutes;
}
