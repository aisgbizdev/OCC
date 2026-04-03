import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  MessageSquare, Clock, CheckCircle2, AlertTriangle, ArrowRight,
  Send, User, ChevronRight, FileText, RefreshCw, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlaTimer } from "@/components/sla-timer";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ComplaintComment = {
  id: number;
  complaintId: number;
  userId: number;
  content: string;
  createdAt: string;
  userName: string | null;
};

type ComplaintHistoryEntry = {
  id: number;
  complaintId: number;
  userId: number | null;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  createdAt: string;
  userName: string | null;
};

type ComplaintDetail = {
  id: number;
  title: string;
  complaintType: string;
  ptId: number | null;
  ptName: string | null;
  branchId: number | null;
  branchName: string | null;
  assignedUserId: number | null;
  assignedUserName: string | null;
  severity: string;
  chronology: string | null;
  followUp: string | null;
  status: string;
  createdBy: number | null;
  creatorName: string | null;
  createdAt: string;
  updatedAt: string;
  slaStatus: "normal" | "warning" | "critical";
  elapsedHours: number;
  comments: ComplaintComment[];
  history: ComplaintHistoryEntry[];
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  open: ["in_progress", "escalated"],
  in_progress: ["escalated", "resolved"],
  escalated: ["in_progress", "resolved"],
  resolved: ["closed", "open"],
  closed: [],
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  escalated: "Eskalasi",
  resolved: "Selesai",
  closed: "Ditutup",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  escalated: "bg-destructive/20 text-destructive border-destructive/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};

const STATUS_NEXT_LABELS: Record<string, string> = {
  in_progress: "Tandai In Progress",
  escalated: "Eskalasi",
  resolved: "Tandai Selesai",
  closed: "Tutup",
  open: "Buka Kembali",
};

const CHANGE_TYPE_LABELS: Record<string, string> = {
  created: "Komplain dibuat",
  status_changed: "Status diubah",
  severity_changed: "Urgensi diubah",
  assignee_changed: "Penanggung jawab diubah",
  followup_updated: "Tindak lanjut diperbarui",
  chronology_updated: "Kronologi diperbarui",
};

const SEVERITY_LABELS: Record<string, string> = {
  low: "Rendah",
  medium: "Sedang",
  high: "Tinggi",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "bg-green-500/20 text-green-400",
  medium: "bg-amber-500/20 text-amber-400",
  high: "bg-destructive/20 text-destructive",
};

const TYPE_LABELS: Record<string, string> = {
  external: "Eksternal",
  internal: "Internal",
  system: "Sistem",
};

const CAN_UPDATE_ROLES = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Admin System", "Superadmin"];

async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

type TimelineItem =
  | { kind: "comment"; data: ComplaintComment }
  | { kind: "history"; data: ComplaintHistoryEntry };

function buildTimeline(comments: ComplaintComment[], history: ComplaintHistoryEntry[]): TimelineItem[] {
  const items: TimelineItem[] = [
    ...comments.map(c => ({ kind: "comment" as const, data: c })),
    ...history.map(h => ({ kind: "history" as const, data: h })),
  ];
  items.sort((a, b) => new Date(a.data.createdAt).getTime() - new Date(b.data.createdAt).getTime());
  return items;
}

function HistoryItem({ entry }: { entry: ComplaintHistoryEntry }) {
  const label = CHANGE_TYPE_LABELS[entry.changeType] ?? entry.changeType;
  const time = format(new Date(entry.createdAt), "d MMM yyyy HH:mm");

  return (
    <div className="flex gap-3">
      <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-muted flex items-center justify-center">
        {entry.changeType === "created" ? (
          <FileText className="w-3.5 h-3.5 text-primary" />
        ) : entry.changeType === "status_changed" ? (
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-0.5">
          <span className="font-medium text-foreground">{entry.userName ?? "Sistem"}</span>
          {" — "}
          <span>{label}</span>
          {entry.changeType === "status_changed" && entry.oldValue && entry.newValue && (
            <span className="inline-flex items-center gap-1 ml-1">
              <span className="font-medium">{STATUS_LABELS[entry.oldValue] ?? entry.oldValue}</span>
              <ArrowRight className="w-3 h-3" />
              <span className="font-medium">{STATUS_LABELS[entry.newValue] ?? entry.newValue}</span>
            </span>
          )}
          {entry.changeType === "severity_changed" && entry.oldValue && entry.newValue && (
            <span className="inline-flex items-center gap-1 ml-1">
              <span className="font-medium">{SEVERITY_LABELS[entry.oldValue] ?? entry.oldValue}</span>
              <ArrowRight className="w-3 h-3" />
              <span className="font-medium">{SEVERITY_LABELS[entry.newValue] ?? entry.newValue}</span>
            </span>
          )}
          {entry.changeType === "assignee_changed" && entry.newValue && (
            <span className="ml-1">ke <span className="font-medium">{entry.newValue}</span></span>
          )}
          {entry.note && entry.changeType === "followup_updated" && (
            <span className="ml-1 italic opacity-70">"{entry.note.slice(0, 80)}{entry.note.length > 80 ? "…" : ""}"</span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground/60">{time}</div>
      </div>
    </div>
  );
}

function CommentItem({ comment, currentUserId }: { comment: ComplaintComment; currentUserId?: number }) {
  const isMe = comment.userId === currentUserId;
  const time = format(new Date(comment.createdAt), "d MMM yyyy HH:mm");

  return (
    <div className={cn("flex gap-3", isMe && "flex-row-reverse")}>
      <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
        <User className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className={cn("flex-1 min-w-0 max-w-[85%]", isMe && "items-end flex flex-col")}>
        <div className={cn(
          "rounded-xl px-3 py-2 text-sm",
          isMe ? "bg-primary/20 text-foreground" : "bg-card border text-foreground"
        )}>
          {!isMe && (
            <div className="text-[11px] font-semibold text-primary mb-1">{comment.userName ?? "—"}</div>
          )}
          <p className="whitespace-pre-wrap break-words">{comment.content}</p>
        </div>
        <div className={cn("text-[10px] text-muted-foreground/60 mt-1", isMe ? "text-right" : "text-left")}>
          {isMe ? "Anda" : (comment.userName ?? "—")} · {time}
        </div>
      </div>
    </div>
  );
}

export function ComplaintDetailModal({
  complaintId,
  open,
  onOpenChange,
}: {
  complaintId: number | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");

  const canManage = CAN_UPDATE_ROLES.includes(user?.roleName ?? "");

  const { data: complaint, isLoading, isError, refetch } = useQuery<ComplaintDetail>({
    queryKey: ["/api/complaints", complaintId],
    queryFn: () => apiFetch(`/api/complaints/${complaintId}`),
    enabled: !!complaintId && open,
    refetchInterval: open ? 15000 : false,
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      apiFetch(`/api/complaints/${complaintId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["/api/complaints", complaintId] });
      qc.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({ title: "Komentar dikirim" });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      apiFetch(`/api/complaints/${complaintId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["/api/complaints", complaintId] });
      qc.invalidateQueries({ queryKey: ["/api/complaints"] });
      toast({ title: `Status diubah ke ${STATUS_LABELS[data.status] ?? data.status}` });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const handleComment = () => {
    const text = commentText.trim();
    if (!text) return;
    commentMutation.mutate(text);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-background border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError || !complaint ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <X className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-center text-muted-foreground text-sm">Gagal memuat detail komplain.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}>Coba Lagi</Button>
              <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>Tutup</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b px-5 py-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="font-bold text-lg leading-tight">{complaint.title}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md border", STATUS_COLORS[complaint.status])}>
                    {STATUS_LABELS[complaint.status] ?? complaint.status}
                  </span>
                  <span className={cn("px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md", SEVERITY_COLORS[complaint.severity])}>
                    {SEVERITY_LABELS[complaint.severity] ?? complaint.severity}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-muted text-muted-foreground">
                    {TYPE_LABELS[complaint.complaintType] ?? complaint.complaintType}
                  </span>
                  <SlaTimer createdAt={complaint.createdAt} status={complaint.status} />
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="shrink-0 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {complaint.ptName && (
                    <div>
                      <span className="text-muted-foreground text-xs">PT</span>
                      <p className="font-medium">{complaint.ptName}</p>
                    </div>
                  )}
                  {complaint.branchName && (
                    <div>
                      <span className="text-muted-foreground text-xs">Cabang</span>
                      <p className="font-medium">{complaint.branchName}</p>
                    </div>
                  )}
                  {complaint.creatorName && (
                    <div>
                      <span className="text-muted-foreground text-xs">Dilaporkan oleh</span>
                      <p className="font-medium">{complaint.creatorName}</p>
                    </div>
                  )}
                  {complaint.assignedUserName && (
                    <div>
                      <span className="text-muted-foreground text-xs">Ditugaskan ke</span>
                      <p className="font-medium">{complaint.assignedUserName}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground text-xs">Dibuat</span>
                    <p className="font-medium">{format(new Date(complaint.createdAt), "d MMM yyyy HH:mm")}</p>
                  </div>
                </div>

                {complaint.chronology && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Kronologi</div>
                    <p className="text-sm bg-muted/50 rounded-xl px-3 py-2 whitespace-pre-wrap leading-relaxed">{complaint.chronology}</p>
                  </div>
                )}

                {complaint.followUp && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">Tindak Lanjut</div>
                    <p className="text-sm bg-green-500/5 border border-green-500/20 rounded-xl px-3 py-2 whitespace-pre-wrap leading-relaxed">{complaint.followUp}</p>
                  </div>
                )}

                {canManage && complaint.status !== "closed" && (VALID_TRANSITIONS[complaint.status]?.length ?? 0) > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Ubah Status</div>
                    <div className="flex flex-wrap gap-2">
                      {(VALID_TRANSITIONS[complaint.status] ?? []).map(nextStatus => (
                        <Button
                          key={nextStatus}
                          size="sm"
                          variant={nextStatus === "escalated" ? "destructive" : nextStatus === "resolved" ? "default" : "outline"}
                          onClick={() => statusMutation.mutate(nextStatus)}
                          disabled={statusMutation.isPending}
                          className="gap-1.5"
                        >
                          {nextStatus === "resolved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {nextStatus === "escalated" && <AlertTriangle className="w-3.5 h-3.5" />}
                          {nextStatus !== "resolved" && nextStatus !== "escalated" && <ChevronRight className="w-3.5 h-3.5" />}
                          {STATUS_NEXT_LABELS[nextStatus] ?? nextStatus}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Riwayat & Komentar
                    {(complaint.comments.length + complaint.history.length) > 0 && (
                      <span className="bg-muted rounded-full px-1.5 py-0.5 text-[10px]">
                        {complaint.comments.length + complaint.history.length}
                      </span>
                    )}
                  </div>

                  {complaint.comments.length === 0 && complaint.history.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      Belum ada aktivitas. Mulai percakapan di bawah.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {buildTimeline(complaint.comments, complaint.history).map((item) =>
                        item.kind === "comment" ? (
                          <CommentItem key={`c-${item.data.id}`} comment={item.data} currentUserId={user?.id} />
                        ) : (
                          <HistoryItem key={`h-${item.data.id}`} entry={item.data} />
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t px-4 py-3 bg-background">
              <div className="flex gap-2 items-end">
                <textarea
                  className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-xl border bg-muted/50 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Tulis komentar atau update tindak lanjut..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={handleComment}
                  disabled={!commentText.trim() || commentMutation.isPending}
                  className="shrink-0 h-11 w-11 rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 pl-1">Enter untuk kirim · Shift+Enter untuk baris baru</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
