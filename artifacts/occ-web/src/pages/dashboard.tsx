import { useAuth } from "@/lib/auth";
import { useListKpiScores, useListTasks, useListActivityLogs } from "@workspace/api-client-react";
import { Activity, Award, CheckSquare, Target } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: scores } = useListKpiScores({ ptId: user?.ptId || undefined });
  const { data: tasks } = useListTasks({ assignedTo: user?.id, status: "in_progress" });
  const { data: logs } = useListActivityLogs({ userId: user?.id });

  const myScore = scores?.find(s => s.userId === user?.id);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name}. Here's your operational overview.</p>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Daily Score" value={myScore?.currentDailyScore || "0"} icon={Award} color="text-amber-400" />
        <StatCard title="Weekly Score" value={myScore?.currentWeeklyScore || "0"} icon={Target} color="text-primary" />
        <StatCard title="Pending Tasks" value={tasks?.length.toString() || "0"} icon={CheckSquare} color="text-emerald-400" />
        <StatCard title="Activities Logged" value={logs?.length.toString() || "0"} icon={Activity} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> Recent Activity</h2>
            <div className="space-y-4">
              {logs?.slice(0, 5).map(log => (
                <div key={log.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-transparent hover:border-border transition-colors">
                  <div>
                    <p className="font-medium text-sm">{log.activityTypeName}</p>
                    <p className="text-xs text-muted-foreground">Qty: {log.quantity} {log.note && `• ${log.note}`}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-primary font-bold">+{log.points}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "HH:mm")}</p>
                  </div>
                </div>
              ))}
              {!logs?.length && <p className="text-sm text-muted-foreground">No activities logged yet.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Top Performers (if visible) */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-400"/> PT Leaderboard</h2>
            <div className="space-y-3">
              {scores?.slice(0, 5).map((score, i) => (
                <div key={score.id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium truncate">{score.userName}</p>
                  </div>
                  <div className="font-mono text-sm font-bold">{score.currentDailyScore}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) {
  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-black mt-2 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-muted/50 group-hover:bg-muted transition-colors ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
