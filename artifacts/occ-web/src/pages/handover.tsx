import { useState } from "react";
import {
  useListHandoverLogs,
  useCreateHandoverLog,
  useListShifts,
  useListTasks,
  useListComplaints,
  useListPts,
  useListBranches,
  type HandoverLogWithRelations,
  type TaskWithRelations,
  type ComplaintWithRelations,
  type Branch,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { Repeat, Plus, CheckCircle2, AlertTriangle, ClipboardList, Copy, Share2, Building2, MapPin, Filter, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { canCreate } from "@/lib/access-control";

const CHIEF_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "Admin System", "Superadmin"];

export default function Handover() {
  const { user } = useAuth();
  const isChief = CHIEF_AND_ABOVE.includes(user?.roleName ?? "");
  const canCreateHandover = canCreate("handover", user);

  const [filterPtId, setFilterPtId] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");

  const { data: pts } = useListPts();
  const { data: filterBranches } = useListBranches(
    filterPtId ? { ptId: Number(filterPtId) } : undefined
  );

  const { data: logs } = useListHandoverLogs({
    ptId: isChief && filterPtId ? Number(filterPtId) : undefined,
  });

  const filteredLogs = (logs ?? []).filter((log: HandoverLogWithRelations) => {
    if (isChief && filterBranchId && (log as HandoverLogWithRelations & { branchId?: number }).branchId !== Number(filterBranchId)) return false;
    return true;
  });

  const [createOpen, setCreateOpen] = useState(false);
  const { toast } = useToast();
  const qcMain = useQueryClient();

  const [editLog, setEditLog] = useState<HandoverLogWithRelations | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const isManager = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Co-SPV Dealing", "Admin System", "Superadmin"].includes(user?.roleName ?? "");

  const handleEditNotes = (log: HandoverLogWithRelations) => {
    setEditLog(log);
    setEditNotes(log.notes ?? "");
  };

  const handleSaveNotes = async () => {
    if (!editLog) return;
    setSavingEdit(true);
    const tkn = localStorage.getItem("occ_token");
    try {
      const res = await fetch(`/api/handover-logs/${editLog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tkn}` },
        body: JSON.stringify({ notes: editNotes }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Catatan diperbarui" });
      qcMain.invalidateQueries({ queryKey: ["/api/handover-logs"] });
      setEditLog(null);
    } catch {
      toast({ title: "Gagal menyimpan catatan", variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const handlePtChange = (ptId: string) => {
    setFilterPtId(ptId);
    setFilterBranchId("");
  };

  const buildHandoverText = (log: HandoverLogWithRelations) =>
    `SHIFT HANDOVER REPORT
From: ${log.fromShiftName ?? "-"} → ${log.toShiftName ?? "-"}
By: ${log.creatorName ?? "-"}
Date: ${log.createdAt ? format(new Date(log.createdAt), "yyyy-MM-dd HH:mm") : "-"}

SUMMARY: ${log.summary ?? "-"}
PENDING ACTIVITIES: ${log.pendingActivities ?? "None"}
PENDING TASKS: ${log.pendingTasks ?? "None"}
PENDING COMPLAINTS: ${log.pendingComplaints ?? "None"}
NOTES: ${log.notes ?? "-"}`;

  const handleCopy = (log: HandoverLogWithRelations) => {
    navigator.clipboard.writeText(buildHandoverText(log));
    toast({ title: "Disalin", description: "Laporan handover disalin ke clipboard" });
  };

  const handleShare = async (log: HandoverLogWithRelations) => {
    const text = buildHandoverText(log);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Shift Handover Report", text });
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          navigator.clipboard.writeText(text);
          toast({ title: "Disalin", description: "Laporan disalin ke clipboard" });
        }
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Disalin", description: "Laporan handover disalin ke clipboard" });
    }
  };

  const hasFilters = filterPtId || filterBranchId;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Handover</h1>
          <p className="text-muted-foreground mt-1">Laporan transisi shift terstruktur.</p>
        </div>
        {canCreateHandover && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Handover Baru
          </Button>
        )}
      </div>

      {isChief && (
        <div className="flex flex-wrap gap-3 items-center">
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
          {hasFilters && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setFilterPtId(""); setFilterBranchId(""); }}>
              <Filter className="w-3.5 h-3.5" /> Reset Filter
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {filteredLogs.map((log: HandoverLogWithRelations) => {
          const logWithBranch = log as HandoverLogWithRelations & { ptName?: string | null; branchName?: string | null };
          return (
            <div key={log.id} className="bg-card border rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Repeat className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Handover dari {log.creatorName ?? "-"}</h3>
                    <p className="text-sm text-muted-foreground">{log.fromShiftName ?? "-"} → {log.toShiftName ?? "-"}</p>
                    {(logWithBranch.ptName || logWithBranch.branchName) && (
                      <div className="flex items-center gap-2 mt-1">
                        {logWithBranch.ptName && (
                          <span className="flex items-center gap-1 text-xs text-primary font-medium">
                            <Building2 className="w-3 h-3" />{logWithBranch.ptName}
                          </span>
                        )}
                        {logWithBranch.branchName && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />{logWithBranch.branchName}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(isManager || (log as HandoverLogWithRelations & { createdBy?: number }).createdBy === user?.id) && (
                    <Button variant="ghost" size="icon" onClick={() => handleEditNotes(log)} title="Edit catatan">
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleShare(log)} title="Bagikan laporan">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(log)} title="Salin ke clipboard">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <div className="text-right">
                    <p className="font-mono text-sm font-medium">{log.createdAt ? format(new Date(log.createdAt), "MMM d, yyyy") : "-"}</p>
                    <p className="text-xs text-muted-foreground">{log.createdAt ? format(new Date(log.createdAt), "HH:mm") : ""}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5"/> Ringkasan</h4>
                  <p className="text-sm bg-muted/30 p-3 rounded-lg border">{log.summary ?? "-"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Catatan</h4>
                  <p className="text-sm bg-muted/30 p-3 rounded-lg border">{log.notes ?? "-"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Tugas Tertunda</h4>
                  <p className="text-sm font-mono bg-amber-500/5 p-3 rounded-lg border border-amber-500/20 whitespace-pre-line">{log.pendingTasks ?? "None"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-destructive mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Komplain Terbuka</h4>
                  <p className="text-sm font-mono bg-destructive/5 p-3 rounded-lg border border-destructive/20 whitespace-pre-line">{log.pendingComplaints ?? "None"}</p>
                </div>
              </div>
            </div>
          );
        })}
        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Belum ada log handover.</div>
        )}
      </div>

      <ResponsiveModal open={createOpen && canCreateHandover} onOpenChange={setCreateOpen} title="Checklist Handover Shift" description="Lengkapi semua poin sebelum submit.">
        <HandoverChecklistForm onSuccess={() => setCreateOpen(false)} lastLog={filteredLogs[0] as HandoverLogWithRelations | undefined} />
      </ResponsiveModal>

      <ResponsiveModal
        open={!!editLog}
        onOpenChange={(open) => { if (!open) setEditLog(null); }}
        title="Edit Catatan Handover"
        description={editLog ? `Handover ${editLog.fromShiftName ?? ""} → ${editLog.toShiftName ?? ""}` : undefined}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Catatan / Update</label>
            <textarea
              className="w-full min-h-[120px] px-3 py-2 rounded-md bg-background border text-sm resize-none"
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder="Tambahkan catatan atau update untuk shift ini..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditLog(null)}>Batal</Button>
            <Button onClick={handleSaveNotes} disabled={savingEdit}>
              {savingEdit ? "Menyimpan..." : "Simpan Catatan"}
            </Button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}

function HandoverChecklistForm({ onSuccess, lastLog }: { onSuccess: () => void; lastLog?: HandoverLogWithRelations }) {
  const { user } = useAuth();
  const createHandover = useCreateHandoverLog();
  const { data: shifts } = useListShifts();
  const { data: allTasks } = useListTasks();
  const { data: allComplaints } = useListComplaints();
  const tasks = (allTasks as TaskWithRelations[] | undefined)?.filter(
    t => t.status !== "completed" && t.status !== "cancelled"
  );
  const complaints = (allComplaints as ComplaintWithRelations[] | undefined)?.filter(
    c => c.status !== "closed" && c.status !== "resolved"
  );

  const lastHandoverComplaints = lastLog?.pendingComplaints ?? "";
  const { toast } = useToast();
  const qc = useQueryClient();
  const canCreateHandover = canCreate("handover", user);

  const [fromShiftId, setFromShiftId] = useState("");
  const [toShiftId, setToShiftId] = useState("");
  const [checks, setChecks] = useState({
    reviewedComplaints: false,
    reviewedTasks: false,
    systemStatus: false,
    activitiesLogged: false,
  });
  const [systemStatusNote, setSystemStatusNote] = useState("All systems operational");
  const [notes, setNotes] = useState("");

  const openComplaintNames = complaints?.map(c => `• ${c.title} [${c.severity}] (${c.status})`).join("\n") || "None";
  const allChecked = checks.reviewedComplaints && checks.reviewedTasks && checks.systemStatus && checks.activitiesLogged;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateHandover) {
      toast({ title: "Anda tidak memiliki akses", variant: "destructive" });
      return;
    }
    if (!allChecked) {
      toast({ title: "Belum Lengkap", description: "Lengkapi semua poin checklist", variant: "destructive" });
      return;
    }
    createHandover.mutate({ data: {
      fromShiftId: Number(fromShiftId),
      toShiftId: Number(toShiftId),
      systemStatusNote,
      complaintCount: complaints?.length ?? 0,
      pendingActivities: checks.activitiesLogged ? "Semua aktivitas shift ini sudah dilog" : "Ada aktivitas yang belum dilog",
      pendingComplaints: openComplaintNames,
      notes: notes || undefined,
    }}, {
      onSuccess: () => {
        toast({ title: "Handover Submitted", description: "Laporan handover berhasil disimpan" });
        qc.invalidateQueries({ queryKey: ["/api/handover"] });
        onSuccess();
      },
      onError: () => toast({ title: "Error", description: "Gagal submit handover", variant: "destructive" })
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Dari Shift *</label>
          <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={fromShiftId} onChange={e => setFromShiftId(e.target.value)} required>
            <option value="" disabled>Pilih...</option>
            {shifts?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Ke Shift *</label>
          <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={toShiftId} onChange={e => setToShiftId(e.target.value)} required>
            <option value="" disabled>Pilih...</option>
            {shifts?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Checklist Handover</h3>
        <ChecklistItem checked={checks.reviewedComplaints} onChange={v => setChecks({...checks, reviewedComplaints: v})} label="Review Komplain Tertunda" detail={`${complaints?.length ?? 0} komplain terbuka`} color="text-destructive">
          {complaints && complaints.length > 0 && (
            <div className="mt-2 space-y-1">
              {complaints.map(c => {
                const isCarryOver = lastHandoverComplaints.includes(c.title);
                return (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium border ${
                      c.severity === "high" ? "bg-destructive/10 text-destructive border-destructive/20" :
                      c.severity === "medium" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>{c.severity}</span>
                    <span className="text-muted-foreground truncate">{c.title}</span>
                    {isCarryOver && (
                      <span className="ml-auto flex items-center gap-0.5 text-orange-400 font-medium whitespace-nowrap shrink-0">
                        <RefreshCw className="w-3 h-3" /> Carry-over
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ChecklistItem>
        <ChecklistItem checked={checks.reviewedTasks} onChange={v => setChecks({...checks, reviewedTasks: v})} label="Review Tugas Belum Selesai" detail={`${tasks?.length ?? 0} tugas berjalan`} color="text-amber-500" />
        <ChecklistItem checked={checks.systemStatus} onChange={v => setChecks({...checks, systemStatus: v})} label="Verifikasi Status Sistem" color="text-emerald-500">
          <select className="w-full h-9 px-3 mt-2 rounded-md bg-background border text-sm" value={systemStatusNote} onChange={e => setSystemStatusNote(e.target.value)}>
            <option value="All systems operational">Semua sistem normal</option>
            <option value="Minor issues reported">Ada masalah kecil</option>
            <option value="System degraded">Sistem terganggu</option>
            <option value="Critical outage">Gangguan kritis</option>
          </select>
        </ChecklistItem>
        <ChecklistItem checked={checks.activitiesLogged} onChange={v => setChecks({...checks, activitiesLogged: v})} label="Semua Aktivitas Telah Dilog" color="text-blue-400" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Catatan Khusus</label>
        <textarea className="w-full min-h-[80px] px-3 py-2 rounded-md bg-background border text-sm resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Info penting untuk shift berikutnya..." />
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <span className="text-xs text-muted-foreground">{allChecked ? "✅ Semua item selesai" : "⚠️ Lengkapi semua item"}</span>
        <Button type="submit" disabled={createHandover.isPending || !allChecked || !canCreateHandover} className="px-8">
          {createHandover.isPending ? "Mengirim..." : "Submit Handover"}
        </Button>
      </div>
    </form>
  );
}

function ChecklistItem({ checked, onChange, label, detail, color, children }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; detail?: string; color: string; children?: React.ReactNode;
}) {
  return (
    <div className={`p-3 rounded-xl border transition-colors ${checked ? 'bg-muted/30 border-border' : 'bg-background border-dashed border-muted-foreground/30'}`}>
      <label className="flex items-start gap-3 cursor-pointer">
        <button type="button" onClick={() => onChange(!checked)} className="mt-0.5 shrink-0">
          {checked ? <CheckCircle2 className={`w-5 h-5 ${color}`} /> : <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40" />}
        </button>
        <div className="flex-1">
          <span className={`text-sm font-medium ${checked ? '' : 'text-muted-foreground'}`}>{label}</span>
          {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
          {children}
        </div>
      </label>
    </div>
  );
}
