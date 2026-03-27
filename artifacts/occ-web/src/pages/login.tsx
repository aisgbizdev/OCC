import { useState, useEffect, useRef } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity, Lock, ChevronLeft, Shield, Crown, Eye,
  Star, Users, TrendingUp, Settings, Loader2, ChevronDown, Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginUser {
  id: number;
  name: string;
  email: string;
  roleName: string | null;
  ptId: number | null;
  ptCode: string | null;
  ptName: string | null;
}

const ROLE_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; order: number }> = {
  "Superadmin":    { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   icon: <Shield className="w-5 h-5" />,     order: 0 },
  "Owner":         { color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/30",  icon: <Crown className="w-5 h-5" />,      order: 1 },
  "Direksi":       { color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30",    icon: <Eye className="w-5 h-5" />,        order: 2 },
  "Chief Dealing": { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: <Star className="w-5 h-5" />,       order: 3 },
  "SPV Dealing":   { color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30",  icon: <Users className="w-5 h-5" />,      order: 4 },
  "Dealer":        { color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/30",    icon: <TrendingUp className="w-5 h-5" />, order: 5 },
  "Admin System":  { color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/30",    icon: <Settings className="w-5 h-5" />,   order: 6 },
};
const DEFAULT_CFG = { color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", icon: <Users className="w-5 h-5" />, order: 99 };

const CORPORATE_ROLES = ["Superadmin", "Owner", "Direksi"];

const PT_OPTIONS = [
  { value: "semua", label: "Semua", sublabel: "Superadmin · Owner · Direksi" },
  { value: "SGB",   label: "SGB",   sublabel: "PT Solid Gold Berjangka" },
  { value: "RFB",   label: "RFB",   sublabel: "PT Rifan Financindo Berjangka" },
  { value: "KPF",   label: "KPF",   sublabel: "PT Kontak Perkasa Futures" },
  { value: "BPF",   label: "BPF",   sublabel: "PT Bestprofit Futures" },
  { value: "EWF",   label: "EWF",   sublabel: "PT Equityworld Futures" },
] as const;

export default function Login() {
  const [users, setUsers]           = useState<LoginUser[]>([]);
  const [loadingUsers, setLoading]  = useState(true);
  const [activeTab, setActiveTab]   = useState<string>("semua");
  const [dropdownOpen, setDropdown] = useState(false);
  const [selected, setSelected]     = useState<LoginUser | null>(null);
  const [password, setPassword]     = useState("");
  const dropdownRef                 = useRef<HTMLDivElement>(null);
  const login                       = useLogin();
  const { toast }                   = useToast();
  const [, setLocation]             = useLocation();
  const { isAuthenticated }         = useAuth();

  useEffect(() => {
    fetch("/api/auth/users")
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  const cfg = (role: string | null) => ROLE_CONFIG[role ?? ""] ?? DEFAULT_CFG;

  const filteredUsers = (() => {
    if (activeTab === "semua") {
      return users.filter(u => CORPORATE_ROLES.includes(u.roleName ?? ""));
    }
    return users.filter(u => u.ptCode === activeTab && !CORPORATE_ROLES.includes(u.roleName ?? ""));
  })();

  const sorted = [...filteredUsers].sort((a, b) => {
    const oA = ROLE_CONFIG[a.roleName ?? ""]?.order ?? 99;
    const oB = ROLE_CONFIG[b.roleName ?? ""]?.order ?? 99;
    if (oA !== oB) return oA - oB;
    return a.name.localeCompare(b.name);
  });

  const activePT  = PT_OPTIONS.find(p => p.value === activeTab) ?? PT_OPTIONS[0];

  const handleSelect = (u: LoginUser) => { setSelected(u); setPassword(""); };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    login.mutate({ data: { email: selected.email, password } }, {
      onSuccess: (data) => {
        localStorage.setItem("occ_token", data.token);
        window.location.href = "/dashboard";
      },
      onError: () => {
        toast({ title: "Login Gagal", description: "Password salah. Coba lagi.", variant: "destructive" });
        setPassword("");
      },
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.08),transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-4 py-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 border border-primary/30 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Activity className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">OCC — Operational Control Center</h1>
          <p className="text-muted-foreground mt-1 text-sm">Pilih jabatan Anda untuk masuk</p>
        </div>

        {!selected ? (
          <div className="bg-card/60 backdrop-blur border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            {/* PT Dropdown */}
            <div className="px-5 pt-5 pb-4 border-b border-white/5">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdown(o => !o)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-black/30 border border-white/10 hover:border-primary/40 hover:bg-black/40 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-bold text-primary min-w-[36px]">{activePT.label}</span>
                    <span className="text-sm text-muted-foreground truncate">{activePT.sublabel}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                    {PT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setActiveTab(opt.value); setDropdown(false); }}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                          activeTab === opt.value ? "bg-primary/10" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`text-sm font-bold min-w-[36px] ${activeTab === opt.value ? "text-primary" : "text-foreground"}`}>
                            {opt.label}
                          </span>
                          <span className="text-sm text-muted-foreground truncate">{opt.sublabel}</span>
                        </div>
                        {activeTab === opt.value && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* User cards */}
            <div className="p-4">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-2">
                  <Users className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Tidak ada pengguna aktif</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {sorted.map(u => {
                    const c = cfg(u.roleName);
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleSelect(u)}
                        className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl border ${c.border} ${c.bg} hover:scale-[1.03] hover:shadow-lg transition-all duration-200 cursor-pointer text-center`}
                      >
                        <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.color} flex items-center justify-center border ${c.border} shadow-sm`}>
                          {c.icon}
                        </div>
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-wider ${c.color}`}>{u.roleName}</p>
                          <p className="text-sm font-semibold text-foreground mt-0.5 leading-tight">{u.name}</p>
                          {u.ptName && activeTab === "semua" && (
                            <p className="text-xs text-muted-foreground mt-1 leading-tight">{u.ptName}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Password form */
          <div className="bg-card/60 backdrop-blur border border-white/10 rounded-3xl p-6 shadow-2xl max-w-sm mx-auto">
            <button
              onClick={() => setSelected(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Ganti akun
            </button>

            {(() => {
              const c = cfg(selected.roleName);
              return (
                <div className={`flex items-center gap-4 p-4 rounded-2xl border ${c.border} ${c.bg} mb-6`}>
                  <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.color} flex items-center justify-center border ${c.border} flex-shrink-0`}>
                    {c.icon}
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${c.color}`}>{selected.roleName}</p>
                    <p className="text-base font-bold text-foreground">{selected.name}</p>
                    {selected.ptName && <p className="text-xs text-muted-foreground">{selected.ptName}</p>}
                  </div>
                </div>
              );
            })()}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium pl-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    className="pl-10 bg-black/40 border-white/10 h-11 rounded-xl focus:border-primary"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all"
                disabled={login.isPending}
              >
                {login.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</>
                  : "Masuk"
                }
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-50">
          Solid Group © {new Date().getFullYear()} — OCC v1.0
        </p>
      </div>
    </div>
  );
}
