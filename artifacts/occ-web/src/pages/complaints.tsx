import { useState } from "react";
import {
  useListComplaints, useCreateComplaint,
  useListPts, useListBranches,
  type Branch,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { AlertTriangle, Plus, Building2, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlaTimer } from "@/components/sla-timer";
import { ResponsiveModal } from "@/components/responsive-modal";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { canCreate } from "@/lib/access-control";

const CHIEF_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "Admin System", "Superadmin"];

export default function Complaints() {
  const { user } = useAuth();
  const isChief = CHIEF_AND_ABOVE.includes(user?.roleName ?? "");
  const canCreateComplaint = canCreate("complaint", user);

  const [createOpen, setCreateOpen] = useState(false);
  const [filterPtId, setFilterPtId] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const { data: pts } = useListPts();
  const { data: filterBranches } = useListBranches(
    filterPtId ? { ptId: Number(filterPtId) } : undefined
  );

  const { data: complaints } = useListComplaints({
    ptId: isChief && filterPtId ? Number(filterPtId) : undefined,
    status: filterStatus || undefined,
  });

  const filteredComplaints = (complaints ?? []).filter(comp => {
    if (isChief && filterBranchId && comp.branchId !== Number(filterBranchId)) return false;
    return true;
  });

  const handlePtChange = (ptId: string) => {
    setFilterPtId(ptId);
    setFilterBranchId("");
  };

  const hasFilters = filterPtId || filterBranchId || filterStatus;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Komplain & SLA</h1>
          <p className="text-muted-foreground mt-1">Catat dan monitor keluhan masuk dari cabang maupun internal.</p>
        </div>
        {canCreateComplaint && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Komplain Baru
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="h-9 px-3 rounded-md bg-background border text-sm"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
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

      <div className="space-y-4">
        {filteredComplaints.map(comp => (
          <div key={comp.id} className="bg-card border rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-bold text-lg truncate">{comp.title}</h3>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-muted text-muted-foreground">{comp.complaintType}</span>
                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md ${comp.severity === 'high' ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-500'}`}>{comp.severity}</span>
              </div>
              {(comp.ptName || comp.branchName) && (
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  {comp.ptName && (
                    <span className="flex items-center gap-1 text-xs text-primary font-medium">
                      <Building2 className="w-3 h-3" />{comp.ptName}
                    </span>
                  )}
                  {comp.branchName && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />{comp.branchName}
                    </span>
                  )}
                </div>
              )}
              <p className="text-sm text-muted-foreground line-clamp-1">{comp.chronology ?? ""}</p>
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-3">
                <span>Oleh {comp.creatorName ?? "-"}</span>
                <span>•</span>
                <span>{comp.createdAt ? format(new Date(comp.createdAt), "MMM d, yyyy HH:mm") : "-"}</span>
                <span>•</span>
                <span className="capitalize text-foreground font-medium">Status: {comp.status.replace("_", " ")}</span>
              </div>
            </div>
            <div className="shrink-0 flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-4 sm:pt-0">
              <SlaTimer createdAt={comp.createdAt} status={comp.status} />
            </div>
          </div>
        ))}
        {filteredComplaints.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Belum ada komplain.</div>
        )}
      </div>

      <ResponsiveModal open={createOpen && canCreateComplaint} onOpenChange={setCreateOpen} title="Laporkan Komplain" description="Catat komplain atau masalah operasional baru.">
        <CreateComplaintForm onSuccess={() => setCreateOpen(false)} />
      </ResponsiveModal>
    </div>
  );
}

function CreateComplaintForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const createComplaint = useCreateComplaint();
  const { toast } = useToast();
  const qc = useQueryClient();
  const canCreateComplaint = canCreate("complaint", user);
  const [form, setForm] = useState({
    title: "",
    complaintType: "external",
    severity: "medium",
    chronology: "",
    ptId: "" as string,
    branchId: "" as string,
  });

  const { data: pts } = useListPts();
  const { data: branches } = useListBranches(
    form.ptId ? { ptId: Number(form.ptId) } : undefined
  );

  const handlePtChange = (ptId: string) => {
    setForm({ ...form, ptId, branchId: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateComplaint) {
      toast({ title: "Anda tidak memiliki akses", variant: "destructive" });
      return;
    }
    createComplaint.mutate({ data: {
      title: form.title,
      complaintType: form.complaintType,
      severity: form.severity,
      chronology: form.chronology || undefined,
      ptId: form.ptId ? Number(form.ptId) : undefined,
      branchId: form.branchId ? Number(form.branchId) : undefined,
    }}, {
      onSuccess: () => {
        toast({ title: "Komplain Dicatat", description: "Timer SLA telah dimulai" });
        qc.invalidateQueries({ queryKey: ["/api/complaints"] });
        onSuccess();
      },
      onError: () => toast({ title: "Error", description: "Gagal mencatat komplain", variant: "destructive" })
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Judul *</label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Deskripsi singkat masalah..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />PT</label>
          <select
            className="w-full h-10 px-3 rounded-md bg-background border text-sm"
            value={form.ptId}
            onChange={e => handlePtChange(e.target.value)}
          >
            <option value="">— Pilih PT —</option>
            {pts?.map(pt => (
              <option key={pt.id} value={pt.id}>{pt.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Cabang</label>
          <select
            className="w-full h-10 px-3 rounded-md bg-background border text-sm disabled:opacity-50"
            value={form.branchId}
            onChange={e => setForm({...form, branchId: e.target.value})}
            disabled={!form.ptId}
          >
            <option value="">— Pilih Cabang —</option>
            {branches?.map((branch: Branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipe</label>
          <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={form.complaintType} onChange={e => setForm({...form, complaintType: e.target.value})}>
            <option value="external">Eksternal</option>
            <option value="internal">Internal</option>
            <option value="system">Sistem</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Urgensi</label>
          <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}>
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Kronologi</label>
        <textarea className="w-full min-h-[100px] px-3 py-2 rounded-md bg-background border text-sm resize-none" value={form.chronology} onChange={e => setForm({...form, chronology: e.target.value})} placeholder="Ceritakan apa yang terjadi, kapan, dan siapa yang terlibat..." />
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={createComplaint.isPending} className="px-8">
          {createComplaint.isPending ? "Mengirim..." : "Kirim Komplain"}
        </Button>
      </div>
    </form>
  );
}
