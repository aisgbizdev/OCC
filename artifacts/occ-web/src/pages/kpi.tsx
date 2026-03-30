import { useState, useEffect } from "react";
import { useGetKpiLeaderboard, useListPts, useListBranches, type KpiScoreWithUser, type Branch } from "@workspace/api-client-react";
import { Trophy, Building2, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from "@/lib/auth";

type Period = "daily" | "weekly" | "monthly" | "yearly";

const CHIEF_AND_ABOVE = ["Owner", "Direksi", "Chief Dealing", "Admin System", "Superadmin"];

function getScore(user: KpiScoreWithUser, period: Period): number {
  switch (period) {
    case "daily": return Number(user.currentDailyScore ?? 0);
    case "weekly": return Number(user.currentWeeklyScore ?? 0);
    case "monthly": return Number(user.currentMonthlyScore ?? 0);
    case "yearly": return Number(user.currentYearlyScore ?? 0);
  }
}

export default function KPI() {
  const { user } = useAuth();
  const isChief = CHIEF_AND_ABOVE.includes(user?.roleName ?? "");
  const isDireksi = user?.roleName === "Direksi";

  const [period, setPeriod] = useState<Period>("daily");
  const [filterPtId, setFilterPtId] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");

  useEffect(() => {
    if (isDireksi && user?.ptId) {
      setFilterPtId(String(user.ptId));
    }
  }, [isDireksi, user?.ptId]);

  const { data: pts } = useListPts();
  const { data: filterBranches } = useListBranches(
    filterPtId ? { ptId: Number(filterPtId) } : undefined
  );

  const { data: leaderboard } = useGetKpiLeaderboard({
    period,
    ptId: isChief && filterPtId ? Number(filterPtId) : undefined,
  });

  const filteredLeaderboard = (leaderboard ?? []).filter((u: KpiScoreWithUser) => {
    if (isChief && filterBranchId) {
      const uWithBranch = u as KpiScoreWithUser & { branchId?: number };
      return uWithBranch.branchId === Number(filterBranchId);
    }
    return true;
  });

  const handlePtChange = (ptId: string) => {
    setFilterPtId(ptId);
    setFilterBranchId("");
  };

  const chartData = filteredLeaderboard.slice(0, 10).map((u: KpiScoreWithUser) => ({
    name: (u.userName ?? "?").split(" ")[0],
    score: getScore(u, period)
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" /> Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">Peringkat global seluruh tim operasional.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-xl">
          {(["daily", "weekly", "monthly", "yearly"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${period === p ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {p === "daily" ? "Harian" : p === "weekly" ? "Mingguan" : p === "monthly" ? "Bulanan" : "Tahunan"}
            </button>
          ))}
        </div>
      </div>

      {isChief && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <select
              className="h-9 px-3 rounded-md bg-background border text-sm min-w-[150px] disabled:opacity-60 disabled:cursor-not-allowed"
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
          {(filterPtId || filterBranchId) && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground underline"
              onClick={() => { setFilterPtId(""); setFilterBranchId(""); }}
            >
              Reset
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6 shadow-sm h-[400px]">
          <h3 className="font-bold mb-6">Top 10 Performer</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? 'hsl(160 84% 39%)' : 'hsl(217 91% 60%)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm overflow-y-auto max-h-[400px]">
          <h3 className="font-bold mb-4">Peringkat</h3>
          <div className="space-y-4">
            {filteredLeaderboard.map((u: KpiScoreWithUser, i: number) => (
              <div key={u.userId} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  i === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]' :
                  i === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                  i === 2 ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{u.userName ?? "-"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.ptName ?? "-"}</p>
                </div>
                <div className="font-mono font-bold text-lg">{getScore(u, period)}</div>
              </div>
            ))}
            {filteredLeaderboard.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Tidak ada data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
