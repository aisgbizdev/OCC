import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, AlertTriangle, Activity, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BranchAnalytics {
  branchId: number;
  branchName: string;
  city: string | null;
  ptId: number;
  ptName: string | null;
  activeComplaints: number;
  complaintsByStatus: Record<string, number>;
  errorActivityCount30d: number;
  avgKpiScore: number | null;
  lastActivityAt: string | null;
  hoursInactive: number | null;
  needsAttention: boolean;
}

async function fetchBranchAnalytics(): Promise<BranchAnalytics[]> {
  const token = localStorage.getItem("occ_token");
  const res = await fetch("/api/branches/analytics", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Failed to fetch branch analytics");
  return res.json();
}

export default function Branches() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["/api/branches/analytics"],
    queryFn: fetchBranchAnalytics,
    refetchInterval: 60000,
  });

  const branches = data ?? [];
  const needsAttentionCount = branches.filter(b => b.needsAttention).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" /> Branch Overview
          </h1>
          <p className="text-muted-foreground mt-1">Ringkasan performa dan status seluruh cabang.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
          <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {needsAttentionCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">
            {needsAttentionCount} cabang memerlukan perhatian — komplain tinggi atau tidak ada aktivitas.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card border rounded-2xl p-5 shadow-sm animate-pulse">
              <div className="h-5 bg-muted rounded w-2/3 mb-3" />
              <div className="h-4 bg-muted rounded w-1/3 mb-6" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-14 bg-muted rounded-xl" />
                <div className="h-14 bg-muted rounded-xl" />
                <div className="h-14 bg-muted rounded-xl" />
                <div className="h-14 bg-muted rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-destructive/50" />
          <p className="font-medium">Gagal memuat data cabang.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>Coba Lagi</Button>
        </div>
      )}

      {!isLoading && !isError && branches.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Belum ada cabang terdaftar.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {branches.map(branch => (
          <BranchCard key={branch.branchId} branch={branch} />
        ))}
      </div>
    </div>
  );
}

function BranchCard({ branch }: { branch: BranchAnalytics }) {
  const isHighComplaint = branch.activeComplaints >= 3;
  const isInactive = branch.hoursInactive !== null && branch.hoursInactive > 48;
  const hasNoActivity = branch.lastActivityAt === null;

  return (
    <div className={cn(
      "bg-card border rounded-2xl p-5 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md",
      branch.needsAttention && "border-destructive/40 ring-1 ring-destructive/20"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-lg truncate">{branch.branchName}</h3>
            {branch.needsAttention && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-destructive/15 text-destructive border border-destructive/20 shrink-0">
                <AlertTriangle className="w-2.5 h-2.5" /> Perlu Perhatian
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {branch.ptName && (
              <span className="flex items-center gap-1 text-xs text-primary font-medium">
                <Building2 className="w-3 h-3" />{branch.ptName}
              </span>
            )}
            {branch.city && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />{branch.city}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Komplain Aktif"
          value={branch.activeComplaints}
          highlight={isHighComplaint ? "red" : branch.activeComplaints > 0 ? "yellow" : "none"}
        />
        <MetricCard
          icon={<Activity className="w-4 h-4" />}
          label="Error (30h)"
          value={branch.errorActivityCount30d}
          highlight={branch.errorActivityCount30d > 5 ? "red" : branch.errorActivityCount30d > 0 ? "yellow" : "none"}
        />
        <MetricCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Avg KPI"
          value={branch.avgKpiScore !== null ? branch.avgKpiScore : "—"}
          highlight={branch.avgKpiScore !== null && branch.avgKpiScore < 50 ? "yellow" : "none"}
        />
        <MetricCard
          icon={<Clock className="w-4 h-4" />}
          label="Terakhir Aktif"
          value={
            hasNoActivity ? "Tidak ada"
            : branch.lastActivityAt
            ? formatDistanceToNow(new Date(branch.lastActivityAt), { addSuffix: true, locale: id })
            : "—"
          }
          highlight={isInactive || hasNoActivity ? "red" : "none"}
          small
        />
      </div>

      {Object.keys(branch.complaintsByStatus).length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t">
          {Object.entries(branch.complaintsByStatus).map(([status, count]) => (
            count > 0 && (
              <span key={status} className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                status === "open" ? "bg-destructive/10 text-destructive" :
                status === "in_progress" ? "bg-amber-500/10 text-amber-500" :
                "bg-muted text-muted-foreground"
              )}>
                {count} {status.replace("_", " ")}
              </span>
            )
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  highlight,
  small = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight: "red" | "yellow" | "none";
  small?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl p-3 flex flex-col gap-1 border",
      highlight === "red" ? "bg-destructive/5 border-destructive/20" :
      highlight === "yellow" ? "bg-amber-500/5 border-amber-500/20" :
      "bg-muted/30 border-border"
    )}>
      <div className={cn(
        "flex items-center gap-1.5 text-xs font-medium",
        highlight === "red" ? "text-destructive" :
        highlight === "yellow" ? "text-amber-500" :
        "text-muted-foreground"
      )}>
        {icon}
        {label}
      </div>
      <div className={cn(
        "font-bold",
        small ? "text-sm" : "text-xl",
        highlight === "red" ? "text-destructive" :
        highlight === "yellow" ? "text-amber-500" :
        "text-foreground"
      )}>
        {value}
      </div>
    </div>
  );
}
