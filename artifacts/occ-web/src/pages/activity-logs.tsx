import { useState, useEffect } from "react";
import { useListActivityLogs, useListPts, useListBranches, type ActivityLogWithRelations, type Branch } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Plus, Filter, Flag, Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/responsive-modal";
import { BatchActivityForm } from "@/components/batch-activity-form";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SPV_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "SPV Dealing", "Admin System", "Superadmin"];
const CHIEF_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "Admin System", "Superadmin"];

type ActivityLogEnriched = ActivityLogWithRelations & {
  ptName?: string | null;
  branchName?: string | null;
  flagged?: boolean;
};

export default function ActivityLogs() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [flagging, setFlagging] = useState<number | null>(null);
  const [filterPtId, setFilterPtId] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const isSPV = SPV_AND_ABOVE.includes(user?.roleName ?? "");
  const isChief = CHIEF_AND_ABOVE.includes(user?.roleName ?? "");
  const isDireksi = user?.roleName === "Direksi";

  useEffect(() => {
    if (isDireksi && user?.ptId) {
      setFilterPtId(String(user.ptId));
    }
  }, [isDireksi, user?.ptId]);

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

  const hasFilters = search || dateFrom || dateTo || filterPtId || filterBranchId;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log Aktivitas</h1>
          <p className="text-muted-foreground mt-1">Lacak operasional harian dan KPI.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="hidden md:flex gap-2">
          <Plus className="w-4 h-4" /> Log Aktivitas
        </Button>
      </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((log) => (
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
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={isSPV ? 8 : 7} className="text-center py-8 text-muted-foreground">Tidak ada aktivitas ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ResponsiveModal open={modalOpen} onOpenChange={setModalOpen} title="Log Aktivitas" description="Tambah satu atau beberapa aktivitas sekaligus.">
        <BatchActivityForm onSuccess={() => setModalOpen(false)} />
      </ResponsiveModal>
    </div>
  );
}
