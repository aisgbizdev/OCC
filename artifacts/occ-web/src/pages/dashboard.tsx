import { useAuth } from "@/lib/auth";
import {
  useListKpiScores,
  useListTasks,
  useListActivityLogs,
  useListComplaints,
  useCheckInactivity,
  useGetKpiLeaderboard,
  type KpiScoreWithUser,
  type ActivityLogWithRelations,
  type TaskWithRelations,
  type ComplaintWithRelations,
} from "@workspace/api-client-react";
import { Activity, Award, CheckSquare, Target, AlertTriangle, TrendingUp, Users, Clock, Zap, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";

interface InactiveDealer {
  userId: number;
  userName: string;
  hoursInactive: number;
  severity: string;
}
interface InactivityData {
  inactiveCount?: number;
  dealers?: InactiveDealer[];
}

export default function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.roleName ?? "";
  if (role === "Dealer") return <DealerDashboard />;
  if (role === "SPV Dealing" || role === "Chief Dealing") return <SupervisorDashboard />;
  if (role === "Owner" || role === "Direksi") return <ManagementDashboard />;
  return <DealerDashboard />;
}

function DealerDashboard() {
  const { user } = useAuth();
  const { data: scores } = useListKpiScores({ ptId: user?.ptId });
  const { data: tasks } = useListTasks({ assignedTo: user?.id, status: "in_progress" });
  const { data: logs } = useListActivityLogs({ userId: user?.id });

  const myScore = scores?.find((s: KpiScoreWithUser) => s.userId === user?.id);
  const myRank = scores?.findIndex((s: KpiScoreWithUser) => s.userId === user?.id);
  const rankDisplay = myRank !== undefined && myRank >= 0 ? myRank + 1 : "-";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Saya</h1>
        <p className="text-muted-foreground mt-1">Selamat datang, {user?.name}. Ini performa Anda hari ini.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Skor Harian" value={myScore?.currentDailyScore ?? "0"} icon={Zap} color="text-amber-400" />
        <StatCard title="Skor Mingguan" value={myScore?.currentWeeklyScore ?? "0"} icon={Target} color="text-primary" />
        <StatCard title="Ranking Saya" value={String(rankDisplay)} icon={Award} color="text-emerald-400" />
        <StatCard title="Tugas Aktif" value={String(tasks?.length ?? 0)} icon={CheckSquare} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><CheckSquare className="w-5 h-5 text-primary"/> Tugas Aktif</h2>
            <Link href="/tasks" className="text-xs text-primary hover:underline flex items-center gap-1">Semua <ArrowRight className="w-3 h-3"/></Link>
          </div>
          <div className="space-y-3">
            {tasks?.slice(0, 5).map((task: TaskWithRelations) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.deadline ? `Tenggat ${format(new Date(task.deadline), "MMM d")}` : "Tanpa tenggat"} • {task.priority}</p>
                </div>
                <div className="ml-3">
                  <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center">
                    <span className="text-xs font-bold">{task.progressPercent}%</span>
                  </div>
                </div>
              </div>
            ))}
            {!tasks?.length && <p className="text-sm text-muted-foreground py-4 text-center">Tidak ada tugas aktif!</p>}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> Aktivitas Terkini</h2>
            <Link href="/activity-logs" className="text-xs text-primary hover:underline flex items-center gap-1">Semua <ArrowRight className="w-3 h-3"/></Link>
          </div>
          <div className="space-y-3">
            {logs?.slice(0, 5).map((log: ActivityLogWithRelations) => (
              <div key={log.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-colors">
                <div>
                  <p className="font-medium text-sm">{log.activityTypeName ?? "-"}</p>
                  <p className="text-xs text-muted-foreground">Qty: {log.quantity}{log.note ? ` • ${log.note}` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-primary font-bold">+{log.points}</p>
                  <p className="text-xs text-muted-foreground">{log.createdAt ? format(new Date(log.createdAt), "HH:mm") : ""}</p>
                </div>
              </div>
            ))}
            {!logs?.length && <p className="text-sm text-muted-foreground py-4 text-center">Belum ada aktivitas.</p>}
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-400"/> Leaderboard PT</h2>
        <div className="space-y-3">
          {scores?.slice(0, 5).map((score: KpiScoreWithUser, i: number) => (
            <div key={score.id} className={`flex items-center gap-3 p-3 rounded-lg ${score.userId === user?.id ? 'bg-primary/10 border border-primary/20' : 'bg-muted/20'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-500' : i === 1 ? 'bg-slate-300/20 text-slate-400' : i === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                {i + 1}
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium truncate">{score.userName ?? "-"}{score.userId === user?.id && <span className="text-primary text-xs ml-1">(Anda)</span>}</p>
              </div>
              <div className="font-mono text-sm font-bold">{score.currentDailyScore ?? "0"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SupervisorDashboard() {
  const { user } = useAuth();
  const { data: scores } = useListKpiScores({ ptId: user?.ptId });
  const { data: tasks } = useListTasks({ ptId: user?.ptId });
  const { data: complaints } = useListComplaints({ ptId: user?.ptId });
  const { data: logs } = useListActivityLogs({ ptId: user?.ptId });
  const { data: rawInactivity } = useCheckInactivity();
  const inactivity = rawInactivity as InactivityData | undefined;

  const pendingTasks = (tasks as TaskWithRelations[] | undefined)?.filter(t => t.status !== "completed") ?? [];
  const openComplaints = (complaints as ComplaintWithRelations[] | undefined)?.filter(c => c.status === "open" || c.status === "in_progress") ?? [];
  const todayLogs = (logs as ActivityLogWithRelations[] | undefined)?.filter(l => {
    if (!l.createdAt) return false;
    return new Date(l.createdAt).toDateString() === new Date().toDateString();
  }) ?? [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Operasional</h1>
        <p className="text-muted-foreground mt-1">Overview tim untuk {user?.ptName ?? "PT Anda"}.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Aktivitas Tim Hari Ini" value={String(todayLogs.length)} icon={Activity} color="text-blue-400" />
        <StatCard title="Dealer Aktif" value={String(scores?.length ?? 0)} icon={Users} color="text-emerald-400" />
        <StatCard title="Tugas Tertunda" value={String(pendingTasks.length)} icon={CheckSquare} color="text-amber-400" />
        <StatCard title="Komplain Terbuka" value={String(openComplaints.length)} icon={AlertTriangle} color="text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 pb-3">
            <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary"/> Aktivitas Tim Hari Ini</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-y text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Dealer</th>
                  <th className="px-6 py-3 text-left">Aktivitas</th>
                  <th className="px-6 py-3 text-right">Qty</th>
                  <th className="px-6 py-3 text-right">Poin</th>
                  <th className="px-6 py-3 text-right">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {todayLogs.slice(0, 10).map((log: ActivityLogWithRelations) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3 font-medium">{log.userName ?? "-"}</td>
                    <td className="px-6 py-3">{log.activityTypeName ?? "-"}</td>
                    <td className="px-6 py-3 text-right font-mono">{log.quantity}</td>
                    <td className="px-6 py-3 text-right font-mono text-primary font-bold">+{log.points}</td>
                    <td className="px-6 py-3 text-right text-muted-foreground font-mono">{log.createdAt ? format(new Date(log.createdAt), "HH:mm") : ""}</td>
                  </tr>
                ))}
                {todayLogs.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-6 text-muted-foreground">Belum ada aktivitas tim hari ini.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive"/> Inaktivitas Dealer</h2>
            <div className="space-y-3">
              {inactivity?.dealers?.slice(0, 5).map((d: InactiveDealer) => (
                <div key={d.userId} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${d.severity === 'critical' ? 'bg-destructive animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-sm font-medium truncate">{d.userName}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${d.severity === 'critical' ? 'text-destructive' : 'text-amber-500'}`}>{d.hoursInactive}j</span>
                </div>
              ))}
              {(inactivity?.inactiveCount ?? 0) === 0 && <p className="text-sm text-muted-foreground text-center py-2">Semua dealer aktif</p>}
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500"/> Komplain Terbuka</h2>
            <div className="space-y-3">
              {openComplaints.slice(0, 5).map((comp: ComplaintWithRelations) => (
                <div key={comp.id} className="p-2 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium truncate">{comp.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${comp.severity === 'high' ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-500'}`}>{comp.severity}</span>
                    <span className="text-xs text-muted-foreground">{comp.status.replace("_", " ")}</span>
                  </div>
                </div>
              ))}
              {openComplaints.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">Tidak ada komplain terbuka</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ManagementDashboard() {
  const { data: leaderboard } = useGetKpiLeaderboard({ period: "daily" });
  const { data: tasks } = useListTasks();
  const { data: complaints } = useListComplaints();
  const { data: rawInactivity } = useCheckInactivity();
  const inactivity = rawInactivity as InactivityData | undefined;

  const allComplaints = complaints as ComplaintWithRelations[] | undefined;
  const allTasks = tasks as TaskWithRelations[] | undefined;
  const openComplaints = allComplaints?.filter(c => c.status === "open" || c.status === "in_progress") ?? [];
  const pendingTasks = allTasks?.filter(t => t.status !== "completed") ?? [];
  const highSeverity = openComplaints.filter(c => c.severity === "high");

  const getOperationalPulse = () => {
    if (highSeverity.length > 3 || (inactivity?.inactiveCount ?? 0) > 5) return { color: "bg-red-500", label: "KRITIS", textColor: "text-red-400" };
    if (highSeverity.length > 0 || openComplaints.length > 5 || (inactivity?.inactiveCount ?? 0) > 2) return { color: "bg-amber-500", label: "HATI-HATI", textColor: "text-amber-400" };
    return { color: "bg-emerald-500", label: "NORMAL", textColor: "text-emerald-400" };
  };
  const pulse = getOperationalPulse();

  const ptNameMap: Record<string, string> = {};
  (leaderboard as KpiScoreWithUser[] | undefined)?.forEach(u => {
    if (u.ptName) ptNameMap[u.ptName] = u.ptName;
  });

  const ptStats: Record<string, { name: string; complaints: number; tasks: number; topScore: number }> = {};
  allComplaints?.forEach((c: ComplaintWithRelations) => {
    const key = c.ptId !== undefined ? `PT #${c.ptId}` : "Unknown";
    if (!ptStats[key]) ptStats[key] = { name: key, complaints: 0, tasks: 0, topScore: 0 };
    if (c.status === "open" || c.status === "in_progress") ptStats[key].complaints++;
  });
  allTasks?.forEach((t: TaskWithRelations) => {
    const key = t.ptId !== undefined ? `PT #${t.ptId}` : "Unknown";
    if (!ptStats[key]) ptStats[key] = { name: key, complaints: 0, tasks: 0, topScore: 0 };
    if (t.status !== "completed") ptStats[key].tasks++;
  });
  (leaderboard as KpiScoreWithUser[] | undefined)?.forEach((u: KpiScoreWithUser) => {
    const key = u.ptName ?? "Unknown";
    if (!ptStats[key]) ptStats[key] = { name: key, complaints: 0, tasks: 0, topScore: 0 };
    ptStats[key].topScore = Math.max(ptStats[key].topScore, Number(u.currentDailyScore ?? 0));
  });

  const topLeader = (leaderboard as KpiScoreWithUser[] | undefined)?.[0];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Radar Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview manajemen — semua PT.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl border bg-card shadow-sm">
          <div className={`w-3 h-3 rounded-full ${pulse.color} animate-pulse`} />
          <span className={`text-sm font-bold ${pulse.textColor}`}>Pulse: {pulse.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Komplain Terbuka" value={String(openComplaints.length)} icon={AlertTriangle} color="text-destructive" />
        <StatCard title="Tugas Tertunda" value={String(pendingTasks.length)} icon={CheckSquare} color="text-amber-400" />
        <StatCard title="Dealer Inaktif" value={String(inactivity?.inactiveCount ?? 0)} icon={Clock} color="text-orange-400" />
        <StatCard title="Top Skor Harian" value={String(topLeader?.currentDailyScore ?? 0)} icon={TrendingUp} color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 pb-3">
              <h2 className="text-lg font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary"/> PT Radar</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-y text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">PT</th>
                    <th className="px-6 py-3 text-center">Komplain</th>
                    <th className="px-6 py-3 text-center">Tugas</th>
                    <th className="px-6 py-3 text-center">Top Skor</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.values(ptStats).map(pt => {
                    const status = pt.complaints > 3 ? "critical" : pt.complaints > 0 ? "caution" : "normal";
                    return (
                      <tr key={pt.name} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3 font-bold">{pt.name}</td>
                        <td className="px-6 py-3 text-center font-mono">{pt.complaints}</td>
                        <td className="px-6 py-3 text-center font-mono">{pt.tasks}</td>
                        <td className="px-6 py-3 text-center font-mono text-primary font-bold">{pt.topScore}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${status === "critical" ? "bg-destructive/20 text-red-400" : status === "caution" ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status === "critical" ? "bg-red-400 animate-pulse" : status === "caution" ? "bg-amber-400" : "bg-emerald-400"}`} />
                            {status === "critical" ? "Kritis" : status === "caution" ? "Hati-hati" : "Normal"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {Object.keys(ptStats).length === 0 && (
                    <tr><td colSpan={5} className="text-center py-6 text-muted-foreground">Belum ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {highSeverity.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5"/> Alert Panel — Urgensi Tinggi</h2>
              <div className="space-y-3">
                {highSeverity.map((comp: ComplaintWithRelations) => (
                  <div key={comp.id} className="flex items-center justify-between p-3 rounded-lg bg-card border">
                    <div>
                      <p className="font-medium text-sm">{comp.title}</p>
                      <p className="text-xs text-muted-foreground">{comp.creatorName ?? "-"} • {comp.createdAt ? format(new Date(comp.createdAt), "MMM d, HH:mm") : ""}</p>
                    </div>
                    <span className="px-2 py-1 text-[10px] uppercase font-bold rounded bg-destructive/20 text-destructive">{comp.status.replace("_", " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-400"/> Leaderboard Harian</h2>
          <div className="space-y-3">
            {(leaderboard as KpiScoreWithUser[] | undefined)?.slice(0, 10).map((u: KpiScoreWithUser, i: number) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-500' : i === 1 ? 'bg-slate-300/20 text-slate-400' : i === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-muted text-muted-foreground'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.userName ?? "-"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.ptName ?? "-"}</p>
                </div>
                <div className="font-mono text-sm font-bold">{u.currentDailyScore ?? "0"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: LucideIcon; color: string }) {
  return (
    <div className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-black mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={`p-2.5 rounded-xl bg-muted/50 group-hover:bg-muted transition-colors ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
