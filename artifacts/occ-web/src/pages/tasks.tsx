import { useState, useRef, useCallback } from "react";
import { useListTasks, useUpdateTask, useCreateTask, useListUsers, useListPts, useListBranches, type TaskWithRelations, type UserWithRelations, type Branch } from "@workspace/api-client-react";
import { format } from "date-fns";

import { CheckCircle2, Circle, Clock, Plus, ChevronRight, Check, Building2, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ResponsiveModal } from "@/components/responsive-modal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

type TaskEnriched = TaskWithRelations & {
  ptName?: string | null;
  branchName?: string | null;
};

const CHIEF_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "Admin System", "Superadmin"];

export default function Tasks() {
  const { user } = useAuth();
  const isChief = CHIEF_AND_ABOVE.includes(user?.roleName ?? "");

  const [filterPtId, setFilterPtId] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data: pts } = useListPts();
  const { data: filterBranches } = useListBranches(
    filterPtId ? { ptId: Number(filterPtId) } : undefined
  );

  const { data: tasks } = useListTasks({
    ptId: isChief && filterPtId ? Number(filterPtId) : undefined,
    status: filterStatus || undefined,
  });

  const filteredTasks = (tasks as TaskEnriched[] | undefined)?.filter(task => {
    if (isChief && filterBranchId && task.branchId !== Number(filterBranchId)) return false;
    return true;
  });

  const updateTask = useUpdateTask();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskEnriched | null>(null);

  const handlePtChange = (ptId: string) => {
    setFilterPtId(ptId);
    setFilterBranchId("");
  };

  const handleStatusToggle = (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "new" ? "in_progress" : currentStatus === "in_progress" ? "completed" : "new";
    const progress = nextStatus === "completed" ? 100 : nextStatus === "in_progress" ? 50 : 0;

    updateTask.mutate({ id, data: { status: nextStatus, progressPercent: progress } }, {
      onSuccess: () => {
        toast({ title: "Tugas Diperbarui", description: `Status diubah ke ${nextStatus}` });
        qc.invalidateQueries({ queryKey: ["/api/tasks"] });
      },
      onError: () => toast({ title: "Error", description: "Gagal memperbarui status tugas", variant: "destructive" })
    });
  };

  const handleComplete = useCallback((task: TaskEnriched) => {
    if (task.status === "completed") return;
    updateTask.mutate({ id: task.id, data: { status: "completed", progressPercent: 100 } }, {
      onSuccess: () => {
        toast({ title: "Tugas Selesai", description: `"${task.title}" ditandai selesai` });
        qc.invalidateQueries({ queryKey: ["/api/tasks"] });
      },
      onError: () => toast({ title: "Error", description: "Gagal memperbarui tugas", variant: "destructive" })
    });
  }, [updateTask, toast, qc]);

  const hasFilters = filterPtId || filterBranchId || filterStatus;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Tugas</h1>
          <p className="text-muted-foreground mt-1">Lacak dan perbarui operasi yang ditugaskan.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Tugas Baru
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="h-9 px-3 rounded-md bg-background border text-sm"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="new">Baru</option>
          <option value="in_progress">Sedang Berjalan</option>
          <option value="completed">Selesai</option>
          <option value="cancelled">Dibatalkan</option>
        </select>

        {isChief && (
          <>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                className="h-9 px-3 rounded-md bg-background border text-sm min-w-[150px]"
                value={filterPtId}
                onChange={e => handlePtChange(e.target.value)}
              >
                <option value="">Semua PT</option>
                {pts?.map(pt => (
                  <option key={pt.id} value={pt.id}>{pt.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                className="h-9 px-3 rounded-md bg-background border text-sm min-w-[150px] disabled:opacity-50"
                value={filterBranchId}
                onChange={e => setFilterBranchId(e.target.value)}
                disabled={!filterPtId}
              >
                <option value="">Semua Cabang</option>
                {(filterBranches as Branch[] | undefined)?.map((b: Branch) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {hasFilters && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setFilterPtId(""); setFilterBranchId(""); setFilterStatus(""); }}>
            <Filter className="w-3.5 h-3.5" /> Reset Filter
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground md:hidden -mt-2">
        Geser kanan untuk selesaikan · Geser kiri untuk detail
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks?.map((task: TaskEnriched) => (
          <SwipeableTaskCard
            key={task.id}
            task={task}
            onStatusToggle={handleStatusToggle}
            onComplete={handleComplete}
            onDetail={setDetailTask}
          />
        ))}
        {!filteredTasks?.length && (
          <div className="col-span-3 text-center py-12 text-muted-foreground">Belum ada tugas.</div>
        )}
      </div>

      <ResponsiveModal open={createOpen} onOpenChange={setCreateOpen} title="Buat Tugas" description="Assign tugas baru ke anggota tim.">
        <CreateTaskForm onSuccess={() => setCreateOpen(false)} />
      </ResponsiveModal>

      <ResponsiveModal
        open={!!detailTask}
        onOpenChange={(open) => { if (!open) setDetailTask(null); }}
        title="Detail Tugas"
        description={detailTask?.title}
      >
        {detailTask && <TaskDetail task={detailTask} onComplete={handleComplete} onClose={() => setDetailTask(null)} />}
      </ResponsiveModal>
    </div>
  );
}

interface SwipeableTaskCardProps {
  task: TaskEnriched;
  onStatusToggle: (id: number, currentStatus: string) => void;
  onComplete: (task: TaskEnriched) => void;
  onDetail: (task: TaskEnriched) => void;
}

function SwipeableTaskCard({ task, onStatusToggle, onComplete, onDetail }: SwipeableTaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const currentXRef = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeAction, setSwipeAction] = useState<"complete" | "detail" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAnimating) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentXRef.current = 0;
  }, [isAnimating]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startXRef.current === null || startYRef.current === null) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startXRef.current;
    const dy = touch.clientY - startYRef.current;

    if (Math.abs(dy) > Math.abs(dx) * 1.2 && Math.abs(dx) < 15) {
      startXRef.current = null;
      return;
    }

    currentXRef.current = dx;
    const clamped = Math.max(-120, Math.min(120, dx));
    setSwipeOffset(clamped);

    if (clamped > 30) setSwipeAction("complete");
    else if (clamped < -30) setSwipeAction("detail");
    else setSwipeAction(null);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (startXRef.current === null) return;
    const dx = currentXRef.current;

    if (dx > THRESHOLD && task.status !== "completed") {
      setIsAnimating(true);
      setSwipeOffset(200);
      setTimeout(() => {
        onComplete(task);
        setSwipeOffset(0);
        setSwipeAction(null);
        setIsAnimating(false);
      }, 300);
    } else if (dx < -THRESHOLD) {
      setSwipeOffset(0);
      setSwipeAction(null);
      onDetail(task);
    } else {
      setSwipeOffset(0);
      setSwipeAction(null);
    }

    startXRef.current = null;
    startYRef.current = null;
    currentXRef.current = 0;
  }, [task, onComplete, onDetail]);

  return (
    <div className="relative overflow-hidden rounded-2xl" ref={cardRef}>
      <div
        className={cn(
          "absolute inset-0 flex items-center px-6 transition-opacity duration-150",
          swipeAction === "complete" ? "opacity-100" : "opacity-0"
        )}
        style={{ background: "linear-gradient(90deg, #10b981 0%, #059669 100%)" }}
      >
        <Check className="w-7 h-7 text-white" />
        <span className="ml-2 text-white font-bold text-sm">Selesai</span>
      </div>

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-end px-6 transition-opacity duration-150",
          swipeAction === "detail" ? "opacity-100" : "opacity-0"
        )}
        style={{ background: "linear-gradient(270deg, #3b82f6 0%, #2563eb 100%)" }}
      >
        <span className="mr-2 text-white font-bold text-sm">Detail</span>
        <ChevronRight className="w-7 h-7 text-white" />
      </div>

      <div
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isAnimating ? "transform 0.3s ease" : swipeOffset === 0 ? "transform 0.2s ease" : "none",
          touchAction: "pan-y",
          cursor: "grab",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full relative group"
      >
        <div className="flex justify-between items-start mb-3">
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
            task.priority === 'high' ? 'bg-destructive/10 text-destructive border-destructive/20' :
            task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
            'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }`}>
            {task.priority.toUpperCase()}
          </div>
          <button onClick={() => onStatusToggle(task.id, task.status)} className="text-muted-foreground hover:text-primary transition-colors">
            {task.status === "completed" ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> :
             task.status === "in_progress" ? <Clock className="w-6 h-6 text-amber-500" /> :
             <Circle className="w-6 h-6" />}
          </button>
        </div>
        <button
          className="text-left"
          onClick={() => onDetail(task)}
          aria-label={`Lihat detail: ${task.title}`}
        >
          <h3 className="font-bold text-lg mb-1">{task.title}</h3>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description ?? ""}</p>
        </button>

        {(task.ptName || task.branchName) && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {task.ptName && (
              <span className="flex items-center gap-1 text-xs text-primary font-medium bg-primary/5 border border-primary/15 px-2 py-0.5 rounded-full">
                <Building2 className="w-3 h-3 shrink-0" />{task.ptName}
              </span>
            )}
            {task.branchName && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                <MapPin className="w-3 h-3 shrink-0" />{task.branchName}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto space-y-3">
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div className={`h-full transition-all duration-500 ${task.progressPercent === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${task.progressPercent}%` }} />
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {task.deadline ? `Tenggat ${format(new Date(task.deadline), "MMM d")}` : "Tanpa tenggat"}</span>
            <span>{task.assigneeName ?? "-"}</span>
          </div>
        </div>

        <button
          onClick={() => onDetail(task)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-2 md:absolute md:bottom-4 md:right-4 md:opacity-0 md:group-hover:opacity-100"
        >
          Detail <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function TaskDetail({ task, onComplete, onClose }: { task: TaskEnriched; onComplete: (t: TaskEnriched) => void; onClose: () => void }) {
  const priorityLabel: Record<string, string> = { low: "Rendah", medium: "Sedang", high: "Tinggi" };
  const statusLabel: Record<string, string> = { new: "Baru", in_progress: "Sedang Berjalan", completed: "Selesai" };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
          task.priority === 'high' ? 'bg-destructive/10 text-destructive border-destructive/20' :
          task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
          'bg-blue-500/10 text-blue-400 border-blue-500/20'
        }`}>
          Prioritas: {priorityLabel[task.priority] ?? task.priority}
        </span>
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-muted text-muted-foreground border-border">
          {statusLabel[task.status] ?? task.status}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-muted-foreground">{task.description}</p>
      )}

      <div className="space-y-2 text-sm">
        {(task.ptName || task.branchName) && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cabang</span>
            <span className="font-medium flex items-center gap-1.5">
              {task.ptName && <span className="text-primary">{task.ptName}</span>}
              {task.ptName && task.branchName && <span className="text-muted-foreground">·</span>}
              {task.branchName && <span>{task.branchName}</span>}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Ditugaskan ke</span>
          <span className="font-medium">{task.assigneeName ?? "Tidak di-assign"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tenggat</span>
          <span className="font-medium">{task.deadline ? format(new Date(task.deadline), "dd MMM yyyy") : "Tanpa tenggat"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{task.progressPercent}%</span>
        </div>
      </div>

      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${task.progressPercent === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
          style={{ width: `${task.progressPercent}%` }}
        />
      </div>

      {task.status !== "completed" && (
        <div className="pt-2 border-t flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => { onComplete(task); onClose(); }}
          >
            <Check className="w-4 h-4" /> Tandai Selesai
          </Button>
        </div>
      )}
    </div>
  );
}

function CreateTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const createTask = useCreateTask();
  const { data: users } = useListUsers();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", assignedTo: "", deadline: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTask.mutate({ data: {
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
      deadline: form.deadline || undefined
    }}, {
      onSuccess: () => {
        toast({ title: "Tugas Dibuat", description: "Tugas baru berhasil di-assign" });
        qc.invalidateQueries({ queryKey: ["/api/tasks"] });
        onSuccess();
      },
      onError: () => toast({ title: "Error", description: "Gagal membuat tugas", variant: "destructive" })
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Judul *</label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Judul tugas..." />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Deskripsi</label>
        <textarea className="w-full min-h-[80px] px-3 py-2 rounded-md bg-background border text-sm resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Deskripsikan tugas..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Prioritas</label>
          <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Tenggat</label>
          <Input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Assign Ke</label>
        <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})}>
          <option value="">Tidak di-assign</option>
          {(users as UserWithRelations[] | undefined)?.filter((u: UserWithRelations) => u.activeStatus).map((u: UserWithRelations) => (
            <option key={u.id} value={u.id}>{u.name} ({u.roleName ?? "-"})</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={createTask.isPending} className="px-8">
          {createTask.isPending ? "Membuat..." : "Buat Tugas"}
        </Button>
      </div>
    </form>
  );
}
