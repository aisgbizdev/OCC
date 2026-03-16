import { useState } from "react";
import { useListActivityLogs, type ActivityLogWithRelations } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/responsive-modal";
import { BatchActivityForm } from "@/components/batch-activity-form";

export default function ActivityLogs() {
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: logs } = useListActivityLogs({
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const filtered = (logs ?? []).filter((log: ActivityLogWithRelations) =>
    search === "" ||
    (log.userName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (log.activityTypeName ?? "").toLowerCase().includes(search.toLowerCase())
  );

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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Cari dealer atau tipe aktivitas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-background"
          />
        </div>
        <div className="flex gap-2">
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-background w-40" placeholder="Dari" />
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-background w-40" placeholder="Sampai" />
          {(search || dateFrom || dateTo) && (
            <Button variant="outline" size="icon" onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); }}>
              <Filter className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Dealer</th>
                <th className="px-6 py-4">Tipe Aktivitas</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Catatan</th>
                <th className="px-6 py-4 text-right">Poin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((log: ActivityLogWithRelations) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-mono">{log.createdAt ? format(new Date(log.createdAt), "MMM d, HH:mm") : "-"}</td>
                  <td className="px-6 py-4 font-medium">{log.userName ?? "-"}</td>
                  <td className="px-6 py-4">{log.activityTypeName ?? "-"}</td>
                  <td className="px-6 py-4 font-mono">{log.quantity}</td>
                  <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">{log.note ?? "-"}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-primary">+{log.points}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Tidak ada aktivitas ditemukan</td></tr>
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
