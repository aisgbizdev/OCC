import { useEffect, useState, useCallback, Component } from "react";
import type { ReactNode } from "react";
import { useSearch } from "wouter";
import { useAuth } from "@/lib/auth";
import { Award, Activity, AlertTriangle, Clock, Wifi, WifiOff, Monitor } from "lucide-react";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error: String(error) };
  }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("Wallboard error:", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", background: "#030712", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "rgba(127,29,29,0.3)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "32px", maxWidth: "600px", textAlign: "center" }}>
            <p style={{ color: "#f87171", fontWeight: "bold", fontSize: "18px", marginBottom: "8px" }}>Wallboard Error</p>
            <p style={{ color: "#fca5a5", fontSize: "14px", fontFamily: "monospace", wordBreak: "break-all" }}>{this.state.error}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface WallboardPulse {
  status: "normal" | "caution" | "critical";
  openComplaints: number;
  highSeverityComplaints: number;
  inactiveCount: number;
  warningThresholdHours: number;
  criticalThresholdHours: number;
}

interface WallboardLeader {
  userId: number;
  userName: string;
  ptName: string | null;
  currentDailyScore: string;
  currentWeeklyScore: string;
  rank: number;
}

interface WallboardDealer {
  userId: number;
  userName: string;
  ptName: string | null;
  lastActivity: string | null;
  hoursInactive: number | null;
  isActive: boolean;
  severity: "active" | "warning" | "critical";
}

interface WallboardData {
  pulse: WallboardPulse;
  leaderboard: WallboardLeader[];
  dealers: WallboardDealer[];
  pts: Array<{ id: number; name: string; code: string | null }>;
  generatedAt: string;
}

const REFRESH_INTERVAL_MS = 30000;

function useWallboardData(pt?: string) {
  const [data, setData] = useState<WallboardData | null>(null);
  const [error, setError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const url = pt
        ? `/api/wallboard?pt=${encodeURIComponent(pt)}`
        : `/api/wallboard`;
      const token = localStorage.getItem("occ_token");
      const headers: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Network error");
      const json = await res.json();
      setData(json);
      setError(false);
      setIsOnline(true);
      setLastRefresh(new Date());
    } catch {
      setError(true);
      setIsOnline(false);
    }
  }, [pt]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, error, isOnline, lastRefresh, refetch: fetchData };
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function padZero(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(d: Date) {
  return `${padZero(d.getHours())}:${padZero(d.getMinutes())}:${padZero(d.getSeconds())}`;
}

function formatDate(d: Date) {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const PULSE_CONFIG = {
  normal: { label: "NORMAL", color: "text-emerald-400", dot: "bg-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  caution: { label: "HATI-HATI", color: "text-amber-400", dot: "bg-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
  critical: { label: "KRITIS", color: "text-red-400", dot: "bg-red-500", border: "border-red-500/30", bg: "bg-red-500/10" },
};

function WallboardInner() {
  const { user } = useAuth();
  const isDireksi = user?.roleName === "Direksi";
  const search = useSearch();
  const params = new URLSearchParams(search);
  const rawPt = params.get("pt") ?? undefined;
  const pt = isDireksi && user?.ptName ? user.ptName : rawPt;
  const now = useClock();
  const { data, error, isOnline, lastRefresh } = useWallboardData(pt);

  const pulseStatus = data?.pulse.status ?? "normal";
  const pulse = PULSE_CONFIG[pulseStatus];

  const activeCount = data ? data.dealers.filter(d => d.isActive).length : 0;
  const inactiveCount = data ? data.dealers.filter(d => !d.isActive).length : 0;
  const openComplaintsCount = data?.pulse.openComplaints ?? 0;

  const sortedDealers = data ? [...data.dealers].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    if (!a.isActive && !b.isActive) return (b.hoursInactive ?? 0) - (a.hoursInactive ?? 0);
    return 0;
  }) : [];

  let inactiveColor: "emerald" | "amber" | "red" | "gray" = "gray";
  if (inactiveCount > 5) inactiveColor = "red";
  else if (inactiveCount > 2) inactiveColor = "amber";

  let complaintsColor: "emerald" | "amber" | "red" | "gray" = "gray";
  if (openComplaintsCount > 5) complaintsColor = "red";
  else if (openComplaintsCount > 0) complaintsColor = "amber";

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col select-none overflow-hidden font-sans">
      <header className="flex-shrink-0 border-b border-gray-800 bg-gray-900/80 backdrop-blur px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-6 h-6 text-primary" />
              <div>
                <span className="text-lg font-black tracking-widest text-primary uppercase">OCC</span>
                <span className="text-xs text-gray-400 ml-2">Operational Control Center</span>
              </div>
            </div>
            {pt && (
              <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold">
                {pt}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border ${pulse.border} ${pulse.bg}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${pulse.dot} ${pulseStatus !== "normal" ? "animate-pulse" : ""}`} />
              <span className={`text-sm font-bold ${pulse.color}`}>PULSE: {pulse.label}</span>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black font-mono tracking-wider text-white tabular-nums">
                {formatTime(now)}
              </div>
              <div className="text-xs text-gray-400">{formatDate(now)}</div>
            </div>

            <div className="flex items-center gap-1.5">
              {isOnline
                ? <Wifi className="w-4 h-4 text-emerald-400" />
                : <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />}
              {lastRefresh && (
                <span className="text-xs text-gray-500">
                  {padZero(lastRefresh.getHours())}:{padZero(lastRefresh.getMinutes())}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        <div className="col-span-12 grid grid-cols-4 gap-4">
          <StatTile label="Dealer Aktif" value={error ? "--" : String(activeCount)} color="emerald" icon={<Activity className="w-5 h-5" />} />
          <StatTile label="Dealer Inaktif" value={error ? "--" : String(inactiveCount)} color={inactiveColor} icon={<Clock className="w-5 h-5" />} />
          <StatTile label="Komplain Terbuka" value={error ? "--" : String(openComplaintsCount)} color={complaintsColor} icon={<AlertTriangle className="w-5 h-5" />} />
          <StatTile label="Top Skor Harian" value={error ? "--" : String(data?.leaderboard[0]?.currentDailyScore ?? "0")} color="primary" icon={<Award className="w-5 h-5" />} />
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800 flex-shrink-0">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Leaderboard Harian</h2>
            {pt && <span className="text-xs text-gray-400 ml-auto">{pt}</span>}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {error ? (
              <OfflineState />
            ) : !data ? (
              <EmptyState text="Memuat data..." />
            ) : data.leaderboard.length === 0 ? (
              <EmptyState text="Belum ada data skor" />
            ) : (
              data.leaderboard.map((leader, i) => (
                <div key={leader.userId} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${i === 0 ? "bg-amber-500/10 border border-amber-500/20" : "bg-gray-800/50"}`}>
                  <div className="w-8 text-center text-lg font-bold">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate text-white">{leader.userName}</p>
                    {!pt && leader.ptName && <p className="text-xs text-gray-400 truncate">{leader.ptName}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-black font-mono text-lg text-primary">{leader.currentDailyScore}</p>
                    <p className="text-xs text-gray-500">poin</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800 flex-shrink-0">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-white">Status Dealer</h2>
            <div className="ml-auto flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Aktif ({activeCount})
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Peringatan
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
                Kritis
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {error ? (
              <OfflineState />
            ) : sortedDealers.length === 0 ? (
              <EmptyState text={!data ? "Memuat data..." : "Tidak ada data dealer"} />
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                {sortedDealers.map(dealer => (
                  <DealerCard key={dealer.userId} dealer={dealer} showPt={!pt} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="flex-shrink-0 border-t border-gray-800 bg-gray-900/50 px-6 py-2 flex items-center justify-between">
        <span className="text-xs text-gray-600">OCC Wallboard — Solid Group</span>
        <span className="text-xs text-gray-600">
          Auto-refresh setiap {REFRESH_INTERVAL_MS / 1000}s
          {lastRefresh && ` · Diperbarui: ${formatTime(lastRefresh)}`}
        </span>
      </footer>
    </div>
  );
}

function StatTile({ label, value, color, icon }: {
  label: string;
  value: string;
  color: "emerald" | "amber" | "red" | "gray" | "primary";
  icon: ReactNode;
}) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    gray: "text-gray-400 bg-gray-800 border-gray-700",
    primary: "text-primary bg-primary/10 border-primary/20",
  };
  const cls = colors[color] ?? colors.gray;
  return (
    <div className={`rounded-2xl border p-5 flex items-center gap-4 ${cls}`}>
      <div className="opacity-70">{icon}</div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-4xl font-black font-mono tabular-nums leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}

function DealerCard({ dealer, showPt }: { dealer: WallboardDealer; showPt: boolean }) {
  const isWarning = dealer.severity === "warning";
  const isCritical = dealer.severity === "critical";

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
      isCritical ? "bg-red-500/10 border-red-500/30" : isWarning ? "bg-amber-500/10 border-amber-500/20" : "bg-gray-800/60 border-gray-700/50"
    }`}>
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isCritical ? "bg-red-500 animate-pulse" : isWarning ? "bg-amber-400" : "bg-emerald-400"}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isCritical ? "text-red-300" : isWarning ? "text-amber-200" : "text-white"}`}>
          {dealer.userName}
        </p>
        {showPt && dealer.ptName && <p className="text-xs text-gray-500 truncate">{dealer.ptName}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        {dealer.isActive ? (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Aktif</span>
        ) : (
          <span className={`text-xs font-mono font-bold ${isCritical ? "text-red-400" : "text-amber-400"}`}>
            {dealer.hoursInactive === null ? "—" : `${dealer.hoursInactive}j`}
          </span>
        )}
      </div>
    </div>
  );
}

function OfflineState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
      <WifiOff className="w-8 h-8 animate-pulse text-red-500" />
      <p className="text-sm">Tidak dapat terhubung ke server</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-gray-600">
      <p className="text-sm">{text}</p>
    </div>
  );
}

export default function Wallboard() {
  return (
    <ErrorBoundary>
      <WallboardInner />
    </ErrorBoundary>
  );
}
