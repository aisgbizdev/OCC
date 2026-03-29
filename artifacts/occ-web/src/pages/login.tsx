import { useState, useEffect } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity, Lock, Shield, Crown, Eye,
  Star, Users, TrendingUp, Settings, Loader2, ChevronDown,
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

const ROLE_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  "Superadmin":    { color: "text-amber-400",   icon: <Shield className="w-4 h-4" /> },
  "Owner":         { color: "text-violet-400",  icon: <Crown className="w-4 h-4" /> },
  "Direksi":       { color: "text-blue-400",    icon: <Eye className="w-4 h-4" /> },
  "Chief Dealing": { color: "text-emerald-400", icon: <Star className="w-4 h-4" /> },
  "SPV Dealing":   { color: "text-orange-400",  icon: <Users className="w-4 h-4" /> },
  "Dealer":        { color: "text-cyan-400",    icon: <TrendingUp className="w-4 h-4" /> },
  "Admin System":  { color: "text-rose-400",    icon: <Settings className="w-4 h-4" /> },
};
const ROLE_ORDER: Record<string, number> = {
  "Superadmin": 0, "Owner": 1, "Direksi": 2, "Chief Dealing": 3,
  "SPV Dealing": 4, "Dealer": 5, "Admin System": 6,
};

const CORPORATE_ROLES = ["Superadmin", "Owner", "Direksi", "Chief Dealing", "Admin System"];

export default function Login() {
  const [users, setUsers]          = useState<LoginUser[]>([]);
  const [loadingUsers, setLoading] = useState(true);
  const [activePT, setActivePT]    = useState<string>("semua");
  const [selected, setSelected]    = useState<LoginUser | null>(null);
  const [password, setPassword]    = useState("");
  const login                      = useLogin();
  const { toast }                  = useToast();
  const [, setLocation]            = useLocation();
  const { isAuthenticated }        = useAuth();

  useEffect(() => {
    fetch("/api/auth/users")
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  const ptOptions = (() => {
    const seen = new Map<string, string>();
    for (const u of users) {
      if (!CORPORATE_ROLES.includes(u.roleName ?? "") && u.ptCode && u.ptName) {
        if (!seen.has(u.ptCode)) seen.set(u.ptCode, u.ptName);
      }
    }
    const sorted = Array.from(seen.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, name]) => ({ value: code, label: code, sublabel: name }));
    return [
      { value: "semua", label: "Semua PT", sublabel: "Korporat & Divisi" },
      ...sorted,
    ];
  })();

  const filteredUsers = (() => {
    if (activePT === "semua") {
      return users.filter(u => CORPORATE_ROLES.includes(u.roleName ?? ""));
    }
    return users.filter(u => u.ptCode === activePT && !CORPORATE_ROLES.includes(u.roleName ?? ""));
  })().sort((a, b) => {
    const oA = ROLE_ORDER[a.roleName ?? ""] ?? 99;
    const oB = ROLE_ORDER[b.roleName ?? ""] ?? 99;
    return oA !== oB ? oA - oB : a.name.localeCompare(b.name);
  });

  const handlePTChange = (pt: string) => {
    setActivePT(pt);
    setSelected(null);
    setPassword("");
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = users.find(u => String(u.id) === e.target.value) ?? null;
    setSelected(user);
    setPassword("");
  };

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

  const cfg = (role: string | null) => ROLE_CONFIG[role ?? ""] ?? { color: "text-primary", icon: <Users className="w-4 h-4" /> };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.08),transparent_50%)]" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4 py-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 border border-primary/30 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Activity className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-center">OCC — Operational Control Center</h1>
          <p className="text-muted-foreground mt-1 text-sm">Pilih jabatan Anda untuk masuk</p>
        </div>

        <div className="bg-card/60 backdrop-blur border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">

          {/* PT Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">PT / Divisi</label>
            <div className="relative">
              <select
                value={activePT}
                onChange={e => handlePTChange(e.target.value)}
                className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground focus:outline-none focus:border-primary/60 transition-colors cursor-pointer"
              >
                {ptOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.sublabel}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* User Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Nama / Jabatan</label>
            <div className="relative">
              {loadingUsers ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Memuat...
                </div>
              ) : (
                <>
                  <select
                    value={selected ? String(selected.id) : ""}
                    onChange={handleUserChange}
                    className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60 transition-colors cursor-pointer"
                  >
                    <option value="" disabled>— Pilih nama —</option>
                    {filteredUsers.map(u => (
                      <option key={u.id} value={String(u.id)}>
                        {u.name}  ·  {u.roleName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </>
              )}
            </div>
          </div>

          {/* Selected user badge */}
          {selected && (() => {
            const c = cfg(selected.roleName);
            return (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className={c.color}>{c.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">{selected.name}</p>
                  <p className={`text-xs font-bold uppercase tracking-wider ${c.color}`}>{selected.roleName}</p>
                </div>
              </div>
            );
          })()}

          {/* Password + Submit */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  className="pl-10 bg-black/40 border-white/10 h-11 rounded-xl focus:border-primary"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={!selected}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all"
              disabled={!selected || login.isPending}
            >
              {login.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</>
                : "Masuk"
              }
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-50">
          Solid Group © {new Date().getFullYear()} — OCC v1.0
        </p>
      </div>
    </div>
  );
}
