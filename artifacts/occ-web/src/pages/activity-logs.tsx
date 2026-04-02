import { useState, useEffect } from "react";
import { useListActivityLogs, useListPts, useListBranches, useUpdateActivityLog, useDeleteActivityLog, type ActivityLogWithRelations, type Branch } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Plus, Filter, Flag, Building2, MapPin, Pencil, Trash2, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/responsive-modal";
import { BatchActivityForm } from "@/components/batch-activity-form";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { can, canCreate, canDeleteActivityLog, canEditActivityLog } from "@/lib/access-control";

const SPV_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Admin System", "Superadmin"];
const CHIEF_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "Admin System", "Superadmin"];
// Edit: Owner/Admin System bypass window; all non-Dealer roles can edit anyone's log (within window)

type ActivityLogEnriched = ActivityLogWithRelations & {
  ptName?: string | null;
  branchName?: string | null;
  flagged?: boolean;
};

type ChecklistItem = {
  id: number;
  name: string;
  category?: string | null;
  weightPoints: string;
  activeStatus: boolean;
  done: boolean;
};

export default function ActivityLogs() {
  const [modalOpen, setModalOpen] = useState(false);
  const [presetActivityTypeId, setPresetActivityTypeId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [flagging, setFlagging] = useState<number | null>(null);
  const [filterPtId, setFilterPtId] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");

  const [editLog, setEditLog] = useState<ActivityLogEnriched | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editNote, setEditNote] = useState("");
  const [deleteLog, setDeleteLog] = useState<ActivityLogEnriched | null>(null);

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(true);

  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const isSPV = can("activityLog", "flag", user);
  const isChief = CHIEF_AND_ABOVE.includes(user?.roleName ?? "");
  const isDireksi = user?.roleName === "Direksi";
  const canCreateLog = canCreate("activityLog", user);
  const editWindowMinutes = 60;

  useEffect(() => {
    if (isDireksi && user?.ptId) {
      setFilterPtId(String(user.ptId));
    }
  }, [isDireksi, user?.ptId]);

  async function fetchChecklist() {
    try {
      const res = await fetch("/api/activity-types/checklist");
      if (res.ok) {
        const data = await res.json();
        setChecklist(data);
      }
    } catch {
    } finally {
      setChecklistLoading(false);
    }
  }

  useEffect(() => {
    fetchChecklist();
  }, []);

  const { data: pts } = useListPts();
  const { data: branches } = useListBranches(
    filterPtId ? { ptId: Number(filterPtId) } : undefined
  );

  const { data: rawLogs } = useListActivityLogs({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    ptId: isChief && filterPtId ? Number(filterPtId) : undefined,
  });

  const logs = (rawLogs ?? []) as ActivityLogEnriched[];

  const filtered = logs.filter((log) => {
    if (isChief && filterBranchId && log.branchId !== Number(filterBranchId)) return false;
    return (
      search === "" ||
      (log.userName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (log.activityTypeName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (log.branchName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (log.ptName ?? "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const handlePtChange = (ptId: string) => {
    setFilterPtId(ptId);
    setFilterBranchId("");
  };

  function canEdit(log: ActivityLogEnriched): boolean {
    return canEditActivityLog(user, log, editWindowMinutes);
  }

  function canDelete(log: ActivityLogEnriched): boolean {
    return canDeleteActivityLog(user, log, editWindowMinutes);
  }

  async function handleFlag(logId: number) {
    if (flagging === logId) return;
    setFlagging(logId);
    try {
      const res = await fetch(`/api/activity-logs/${logId}/flag`, { method: "PUT" });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: data.error ?? "Gagal menandai", variant: "destructive" });
        return;
      }
      qc.invalidateQueries({ queryKey: ["/api/activity-logs"] });
    } catch {
      toast({ title: "Gagal menghubungi server", variant: "destructive" });
    } finally {
      setFlagging(null);
    }
  }

  const updateMutation = useUpdateActivityLog({
    mutation: {
      onSuccess: () => {
        toast({ title: "Log berhasil diperbarui" });
        qc.invalidateQueries({ queryKey: ["/api/activity-logs"] });
        setEditLog(null);
      },
      onError: (err: unknown) => {
        const msg = (err as { message?: string })?.message ?? "Gagal memperbarui log";
        toast({ title: msg, variant: "destructive" });
      },
    },
  });

  const deleteMutation = useDeleteActivityLog({
    mutation: {
      onSuccess: () => {
        toast({ title: "Log berhasil dihapus" });
        qc.invalidateQueries({ queryKey: ["/api/activity-logs"] });
        setDeleteLog(null);
      },
      onError: (err: unknown) => {
        const msg = (err as { message?: string })?.message ?? "Gagal menghapus log";
        toast({ title: msg, variant: "destructive" });
      },
    },
  });

  function openEdit(log: ActivityLogEnriched) {
    setEditLog(log);
    setEditQty(String(log.quantity ?? 1));
    setEditNote(log.note ?? "");
  }

  function handleEditSave() {
    if (!editLog) return;
    const qty = Number(editQty);
    if (!Number.isInteger(qty) || qty < 1) {
      toast({ title: "Qty harus bilangan bulat positif", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: editLog.id, data: { quantity: qty, note: editNote } });
  }

  function openFormWithType(activityTypeId: number) {
    setPresetActivityTypeId(activityTypeId);
    setModalOpen(true);
  }

  function handleModalClose(open: boolean) {
    setModalOpen(open);
    if (!open) {
      setPresetActivityTypeId(undefined);
      fetchChecklist();
    }
  }

  const hasFilters = search || dateFrom || dateTo || filterPtId || filterBranchId;
  const showActionsCol = true;

  const donePct = checklist.length > 0
    ? Math.round((checklist.filter(c => c.done).length / checklist.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log Aktivitas</h1>
          <p className="text-muted-foreground mt-1">Lacak operasional harian dan KPI.</p>
        </div>
        {canCreateLog && (
          <Button onClick={() => { setPresetActivityTypeId(undefined); setModalOpen(true); }} className="hidden md:flex gap-2">
            <Plus className="w-4 h-4" /> Log Aktivitas
          </Button>
        )}
      </div>

      {checklist.length > 0 && (
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Checklist Hari Ini</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {checklist.filter(c => c.done).length}/{checklist.length} selesai
              </span>
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${donePct}%` }}
                />
              </div>
            </div>
          </div>
          {checklistLoading ? (
            <div className="px-5 py-4 text-sm text-muted-foreground">Memuat checklist...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {checklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => !item.done && canCreateLog && openFormWithType(item.id)}
                  disabled={item.done || !canCreateLog}
                  title={item.done ? "Sudah dicatat hari ini" : `Klik untuk log: ${item.name}`}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3 text-left transition-colors text-sm",
                    item.done
                      ? "cursor-default opacity-60"
                      : "hover:bg-muted/40 cursor-pointer group"
                  )}
                >
                  {item.done ? (
                    <CheckSquare className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                  )}
                  <span className={cn("leading-snug", item.done && "line-through text-muted-foreground")}>
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Cari dealer, tipe aktivitas, atau cabang..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="flex gap-2">
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-background w-40" placeholder="Dari" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-background w-40" placeholder="Sampai" />
            {hasFilters && (
              <Button variant="outline" size="icon" onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setFilterPtId(""); setFilterBranchId(""); }}>
                <Filter className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {isChief && (
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <select
                className="h-9 px-3 rounded-md bg-background border text-sm min-w-[160px] disabled:opacity-60 disabled:cursor-not-allowed"
                value={filterPtId}
                onChange={e => handlePtChange(e.target.value)}
                disabled={isDireksi}
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
                className="h-9 px-3 rounded-md bg-background border text-sm min-w-[160px] disabled:opacity-50"
                value={filterBranchId}
                onChange={e => setFilterBranchId(e.target.value)}
                disabled={!filterPtId}
              >
                <option value="">Semua Cabang</option>
                {(branches as Branch[] | undefined)?.map((b: Branch) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {isSPV && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Flag className="w-3 h-3 text-amber-500" />
          Klik ikon bendera untuk menandai entri mencurigakan
        </p>
      )}

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Dealer</th>
                <th className="px-6 py-4">Cabang</th>
                <th className="px-6 py-4">Tipe Aktivitas</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Catatan</th>
                <th className="px-6 py-4 text-right">Poin</th>
                {isSPV && <th className="px-4 py-4 text-center">Flag</th>}
                {showActionsCol && <th className="px-4 py-4 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((log) => {
                const showEdit = canEdit(log);
                const showDelete = canDelete(log);
                return (
                  <tr key={log.id} className={cn("hover:bg-muted/20 transition-colors", log.flagged && "bg-amber-500/5")}>
                    <td className="px-6 py-4 font-mono">{log.createdAt ? format(new Date(log.createdAt), "MMM d, HH:mm") : "-"}</td>
                    <td className="px-6 py-4 font-medium">{log.userName ?? "-"}</td>
                    <td className="px-6 py-4">
                      {(log.ptName || log.branchName) ? (
                        <div className="flex flex-col gap-0.5">
                          {log.ptName && (
                            <span className="flex items-center gap-1 text-xs text-primary font-medium">
                              <Building2 className="w-3 h-3 shrink-0" />{log.ptName}
                            </span>
                          )}
                          {log.branchName && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 shrink-0" />{log.branchName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{log.activityTypeName ?? "-"}</td>
                    <td className="px-6 py-4 font-mono">{log.quantity}</td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">{log.note ?? "-"}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-primary">+{log.points}</td>
                    {isSPV && (
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleFlag(log.id)}
                          disabled={flagging === log.id}
                          title={log.flagged ? "Cabut flag" : "Tandai mencurigakan"}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            log.flagged
                              ? "text-amber-500 hover:text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
                              : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                          )}
                        >
                          <Flag className="w-3.5 h-3.5" fill={log.flagged ? "currentColor" : "none"} />
                        </button>
                      </td>
                    )}
                    {showActionsCol && (
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {showEdit && (
                            <button
                              onClick={() => openEdit(log)}
                              title="Edit log"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {showDelete && (
                            <button
                              onClick={() => setDeleteLog(log)}
                              title="Hapus log"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={isSPV ? (showActionsCol ? 9 : 8) : (showActionsCol ? 8 : 7)} className="text-center py-8 text-muted-foreground">Tidak ada aktivitas ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ResponsiveModal open={modalOpen && canCreateLog} onOpenChange={handleModalClose} title="Log Aktivitas" description="Tambah satu atau beberapa aktivitas sekaligus.">
        <BatchActivityForm
          onSuccess={() => handleModalClose(false)}
          presetActivityTypeId={presetActivityTypeId}
        />
      </ResponsiveModal>

      <ResponsiveModal
        open={!!editLog}
        onOpenChange={(open) => { if (!open) setEditLog(null); }}
        title="Edit Log Aktivitas"
        description={editLog ? `${editLog.activityTypeName} — ${editLog.userName}` : ""}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Jumlah (Qty)</label>
            <Input
              type="number"
              min={1}
              step={1}
              value={editQty}
              onChange={e => setEditQty(e.target.value)}
              placeholder="1"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Catatan</label>
            <Input
              value={editNote}
              onChange={e => setEditNote(e.target.value)}
              placeholder="Catatan opsional..."
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setEditLog(null)}>Batal</Button>
            <Button onClick={handleEditSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>

      <ResponsiveModal
        open={!!deleteLog}
        onOpenChange={(open) => { if (!open) setDeleteLog(null); }}
        title="Hapus Log Aktivitas"
        description="Tindakan ini tidak dapat dibatalkan."
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Yakin ingin menghapus log <span className="font-medium text-foreground">{deleteLog?.activityTypeName}</span>{" "}
            milik <span className="font-medium text-foreground">{deleteLog?.userName}</span>{" "}
            {deleteLog?.createdAt ? `(${format(new Date(deleteLog.createdAt), "MMM d, HH:mm")})` : ""}?
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteLog(null)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={() => deleteLog && deleteMutation.mutate({ id: deleteLog.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
