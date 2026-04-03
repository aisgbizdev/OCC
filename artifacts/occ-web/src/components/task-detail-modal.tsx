import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Circle, Clock, CheckCircle2, XCircle, Edit3, Save, X,
  MessageSquare, Send, User, Building2, MapPin, ChevronRight,
  RotateCcw, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { TaskWithRelations, UserWithRelations } from "@workspace/api-client-react";

type TaskEnriched = TaskWithRelations & {
  ptName?: string | null;
  branchName?: string | null;
};

type TaskComment = {
  id: number;
  taskId: number;
  userId: number;
  userName: string | null;
  message: string;
  createdAt: string;
};

const STATUS_STEPS = [
  { key: "new", label: "Baru", icon: Circle, color: "text-muted-foreground" },
  { key: "in_progress", label: "Berjalan", icon: Clock, color: "text-amber-500" },
  { key: "completed", label: "Selesai", icon: CheckCircle2, color: "text-emerald-500" },
];

const PRIORITY_LABELS: Record<string, string> = { low: "Rendah", medium: "Sedang", high: "Tinggi" };
const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

const MANAGER_ROLES = ["Owner", "Direksi", "Chief Dealing", "Admin System", "Superadmin", "SPV Dealing", "Co-SPV Dealing"];

interface TaskDetailModalProps {
  task: TaskEnriched;
  allUsers?: UserWithRelations[];
  onClose: () => void;
  onUpdated: () => void;
}

export function TaskDetailModal({ task, allUsers, onClose, onUpdated }: TaskDetailModalProps) {
  const { user } = useAuth();
  const token = localStorage.getItem("occ_token");
  const { toast } = useToast();
  const qc = useQueryClient();

  const isManager = MANAGER_ROLES.includes(user?.roleName ?? "");
  const isAssignee = task.assignedTo === user?.id;
  const canEdit = isManager || isAssignee;
  const canFullEdit = isManager;

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    assignedTo: task.assignedTo ? String(task.assignedTo) : "",
    deadline: task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd") : "",
    progressPercent: task.progressPercent ?? 0,
  });

  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === task.status);
  const isCancelled = task.status === "cancelled";

  useEffect(() => {
    fetchComments();
  }, [task.id]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function fetchComments() {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setComments(await res.json());
    } catch {
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    const progress = newStatus === "completed" ? 100 : newStatus === "in_progress" ? 50 : 0;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, progressPercent: progress }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Status diperbarui" });
      qc.invalidateQueries({ queryKey: ["/api/tasks"] });
      onUpdated();
    } catch {
      toast({ title: "Gagal mengubah status", variant: "destructive" });
    }
  }

  async function handleProgressChange(value: number) {
    setEditForm(f => ({ ...f, progressPercent: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (canFullEdit) {
        body.title = editForm.title;
        body.description = editForm.description || null;
        body.priority = editForm.priority;
        body.assignedTo = editForm.assignedTo ? Number(editForm.assignedTo) : null;
        body.deadline = editForm.deadline || null;
      }
      body.progressPercent = editForm.progressPercent;

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Tugas disimpan" });
      qc.invalidateQueries({ queryKey: ["/api/tasks"] });
      setEditMode(false);
      onUpdated();
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendComment() {
    if (!commentText.trim()) return;
    setSendingComment(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: commentText.trim() }),
      });
      if (!res.ok) throw new Error();
      setCommentText("");
      await fetchComments();
    } catch {
      toast({ title: "Gagal mengirim komentar", variant: "destructive" });
    } finally {
      setSendingComment(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto pr-1">
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2">
        {isCancelled ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-muted text-muted-foreground border-border">
            <XCircle className="w-3.5 h-3.5" /> Dibatalkan
          </span>
        ) : null}
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border", PRIORITY_COLORS[task.priority])}>
          {PRIORITY_LABELS[task.priority] ?? task.priority}
        </span>
        {(task as TaskEnriched).ptName && (
          <span className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/5 border border-primary/15 px-2 py-1 rounded-full">
            <Building2 className="w-3 h-3" />{(task as TaskEnriched).ptName}
          </span>
        )}
        {(task as TaskEnriched).branchName && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            <MapPin className="w-3 h-3" />{(task as TaskEnriched).branchName}
          </span>
        )}
        {canEdit && !isCancelled && (
          <button
            onClick={() => setEditMode(e => !e)}
            className={cn(
              "ml-auto flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors",
              editMode
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Edit3 className="w-3 h-3" />
            {editMode ? "Mode Edit" : "Edit"}
          </button>
        )}
      </div>

      {/* Status stepper */}
      {!isCancelled && (
        <div className="bg-muted/30 rounded-xl p-4 border">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-border mx-8" />
            {STATUS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = step.key === task.status;
              const isPast = idx < currentStepIndex;
              return (
                <div key={step.key} className="flex flex-col items-center gap-1.5 z-10">
                  <button
                    onClick={() => canEdit && !isActive && handleStatusChange(step.key)}
                    disabled={!canEdit || isActive}
                    title={canEdit && !isActive ? `Ubah ke "${step.label}"` : step.label}
                    className={cn(
                      "w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all",
                      isActive
                        ? "bg-primary border-primary text-primary-foreground scale-110 shadow-md"
                        : isPast
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 cursor-pointer hover:scale-105"
                        : "bg-background border-border text-muted-foreground",
                      canEdit && !isActive ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                  <span className={cn(
                    "text-xs font-medium",
                    isActive ? "text-primary" : isPast ? "text-emerald-500" : "text-muted-foreground"
                  )}>{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* Progress bar (editable in edit mode) */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Progress</span>
              <span className="font-medium">{editMode ? editForm.progressPercent : task.progressPercent}%</span>
            </div>
            {editMode ? (
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={editForm.progressPercent}
                onChange={e => handleProgressChange(Number(e.target.value))}
                className="w-full accent-primary"
              />
            ) : (
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-500", task.progressPercent === 100 ? "bg-emerald-500" : "bg-primary")}
                  style={{ width: `${task.progressPercent}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit form / info section */}
      {editMode && canEdit ? (
        <div className="space-y-3 bg-muted/20 rounded-xl p-4 border">
          {canFullEdit && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Judul</label>
                <Input
                  value={editForm.title}
                  onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="text-base font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Deskripsi</label>
                <textarea
                  className="w-full min-h-[70px] px-3 py-2 rounded-md bg-background border text-sm resize-none"
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Deskripsi tugas..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Prioritas</label>
                  <select
                    className="w-full h-9 px-3 rounded-md bg-background border text-sm"
                    value={editForm.priority}
                    onChange={e => setEditForm(f => ({ ...f, priority: e.target.value }))}
                  >
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tenggat</label>
                  <Input
                    type="date"
                    value={editForm.deadline}
                    onChange={e => setEditForm(f => ({ ...f, deadline: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assign Ke</label>
                <select
                  className="w-full h-9 px-3 rounded-md bg-background border text-sm"
                  value={editForm.assignedTo}
                  onChange={e => setEditForm(f => ({ ...f, assignedTo: e.target.value }))}
                >
                  <option value="">— Tidak di-assign —</option>
                  {allUsers?.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.roleName})</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="flex gap-2 justify-end pt-2 border-t">
            {canEdit && !isCancelled && isManager && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleStatusChange("cancelled")}
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" /> Batalkan Tugas
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>Batal</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-bold leading-snug">{task.title}</h2>
          {task.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border-t pt-3">
            <div className="text-muted-foreground">Ditugaskan ke</div>
            <div className="font-medium text-right">{task.assigneeName ?? "—"}</div>
            <div className="text-muted-foreground">Tenggat</div>
            <div className="font-medium text-right">{task.deadline ? format(new Date(task.deadline), "dd MMM yyyy") : "Tanpa tenggat"}</div>
            {task.createdAt && (
              <>
                <div className="text-muted-foreground">Dibuat</div>
                <div className="font-medium text-right">{format(new Date(task.createdAt), "dd MMM yyyy HH:mm")}</div>
              </>
            )}
          </div>

          {/* Quick status actions (non-edit mode) */}
          {canEdit && !isCancelled && task.status !== "completed" && (
            <div className="flex gap-2 pt-1 border-t">
              {task.status === "new" && (
                <Button size="sm" variant="outline" className="gap-1.5 text-amber-500 border-amber-500/30 hover:bg-amber-500/10" onClick={() => handleStatusChange("in_progress")}>
                  <Clock className="w-3.5 h-3.5" /> Mulai Kerjakan
                </Button>
              )}
              {task.status === "in_progress" && (
                <Button size="sm" variant="outline" className="gap-1.5 text-muted-foreground" onClick={() => handleStatusChange("new")}>
                  <RotateCcw className="w-3.5 h-3.5" /> Kembalikan ke Baru
                </Button>
              )}
              <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white ml-auto" onClick={() => handleStatusChange("completed")}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Tandai Selesai
              </Button>
            </div>
          )}
          {isCancelled && isManager && (
            <div className="flex gap-2 pt-1 border-t">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleStatusChange("new")}>
                <RotateCcw className="w-3.5 h-3.5" /> Aktifkan Kembali
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Comments thread */}
      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Riwayat & Komentar</span>
          {comments.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">{comments.length}</span>
          )}
        </div>

        <div className="space-y-3 max-h-52 overflow-y-auto mb-3">
          {loadingComments && (
            <p className="text-sm text-muted-foreground text-center py-4">Memuat komentar...</p>
          )}
          {!loadingComments && comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada komentar.</p>
          )}
          {[...comments].reverse().map(comment => {
            const isMe = comment.userId === user?.id;
            return (
              <div key={comment.id} className={cn("flex gap-2.5", isMe ? "flex-row-reverse" : "")}>
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className={cn("flex flex-col gap-0.5 max-w-[75%]", isMe ? "items-end" : "")}>
                  <span className="text-xs text-muted-foreground">
                    {comment.userName ?? "?"} · {format(new Date(comment.createdAt), "dd MMM HH:mm")}
                  </span>
                  <div className={cn(
                    "px-3 py-2 rounded-2xl text-sm leading-relaxed",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  )}>
                    {comment.message}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={commentsEndRef} />
        </div>

        {/* Comment input */}
        <div className="flex gap-2">
          <textarea
            className="flex-1 min-h-[40px] max-h-24 px-3 py-2 rounded-xl bg-muted border text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Tulis update atau komentar..."
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendComment();
              }
            }}
          />
          <Button
            size="icon"
            className="shrink-0 rounded-xl"
            onClick={handleSendComment}
            disabled={!commentText.trim() || sendingComment}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Enter untuk kirim · Shift+Enter untuk baris baru</p>
      </div>
    </div>
  );
}
