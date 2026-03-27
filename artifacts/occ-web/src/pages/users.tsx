import { useState } from "react";
import {
  useListUsers, useListPts, useListShifts, useCreateUser,
  type UserWithRelations, type Pt, type Shift,
} from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users, Building, Shield, CheckCircle2, XCircle, Plus, X,
  Crown, Eye, Star, TrendingUp, Settings, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const DB_ROLES = [
  { id: 7, name: "Superadmin" },
  { id: 1, name: "Owner" },
  { id: 2, name: "Direksi" },
  { id: 3, name: "Chief Dealing" },
  { id: 4, name: "SPV Dealing" },
  { id: 5, name: "Dealer" },
  { id: 6, name: "Admin System" },
];

const ROLE_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  "Superadmin":    { color: "text-amber-400",   bg: "bg-amber-500/10",   icon: <Shield className="w-3.5 h-3.5" /> },
  "Owner":         { color: "text-violet-400",  bg: "bg-violet-500/10",  icon: <Crown className="w-3.5 h-3.5" /> },
  "Direksi":       { color: "text-blue-400",    bg: "bg-blue-500/10",    icon: <Eye className="w-3.5 h-3.5" /> },
  "Chief Dealing": { color: "text-emerald-400", bg: "bg-emerald-500/10", icon: <Star className="w-3.5 h-3.5" /> },
  "SPV Dealing":   { color: "text-orange-400",  bg: "bg-orange-500/10",  icon: <Star className="w-3.5 h-3.5" /> },
  "Dealer":        { color: "text-cyan-400",    bg: "bg-cyan-500/10",    icon: <TrendingUp className="w-3.5 h-3.5" /> },
  "Admin System":  { color: "text-rose-400",    bg: "bg-rose-500/10",    icon: <Settings className="w-3.5 h-3.5" /> },
};

const DEFAULT_ROLE_CFG = { color: "text-primary", bg: "bg-primary/10", icon: <Users className="w-3.5 h-3.5" /> };

interface UserForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  roleId: number;
  ptId: string;
  shiftId: string;
  positionTitle: string;
}

const EMPTY_FORM: UserForm = {
  name: "", email: "", password: "", confirmPassword: "",
  roleId: 5, ptId: "", shiftId: "", positionTitle: "",
};

export default function MasterData() {
  const { user: me } = useAuth();
  const { data: users, isLoading } = useListUsers();
  const { data: pts } = useListPts();
  const { data: shifts } = useListShifts();
  const createUser = useCreateUser();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<UserForm>>({});

  const isSuperAdmin = me?.roleName === "Superadmin";
  const canManage = isSuperAdmin || me?.roleName === "Admin System" || me?.roleName === "Owner";

  const f = (k: keyof UserForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
    setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<UserForm> = {};
    if (!form.name.trim()) errs.name = "Nama wajib diisi";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = "Email tidak valid";
    if (!form.password || form.password.length < 6) errs.password = "Password minimal 6 karakter";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Password tidak cocok";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createUser.mutate({
      data: {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        roleId: Number(form.roleId),
        ptId: form.ptId ? Number(form.ptId) : undefined,
        shiftId: form.shiftId ? Number(form.shiftId) : undefined,
        positionTitle: form.positionTitle.trim() || undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Pengguna berhasil ditambahkan" });
        qc.invalidateQueries({ queryKey: ["listUsers"] });
        setShowForm(false);
        setForm(EMPTY_FORM);
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Gagal menambahkan pengguna";
        toast({ title: "Gagal", description: msg, variant: "destructive" });
      }
    });
  };

  const roleCfg = (roleName: string | null | undefined) => ROLE_CONFIG[roleName ?? ""] ?? DEFAULT_ROLE_CFG;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Data</h1>
          <p className="text-muted-foreground mt-1">Kelola pengguna, PT, dan role sistem OCC.</p>
        </div>
        {canManage && !showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Tambah User
          </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              <h2 className="font-bold">Tambah Pengguna Baru</h2>
            </div>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setErrors({}); }}
              className="text-muted-foreground hover:text-foreground transition-colors rounded-full p-1 hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nama Lengkap <span className="text-red-500">*</span></label>
                <Input value={form.name} onChange={f("name")} placeholder="Contoh: Andi Santoso" className={errors.name ? "border-red-500" : ""} />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                <Input type="email" value={form.email} onChange={f("email")} placeholder="andi@occ.id" className={errors.email ? "border-red-500" : ""} />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password <span className="text-red-500">*</span></label>
                <Input type="password" value={form.password} onChange={f("password")} placeholder="Min. 6 karakter" className={errors.password ? "border-red-500" : ""} />
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Konfirmasi Password <span className="text-red-500">*</span></label>
                <Input type="password" value={form.confirmPassword} onChange={f("confirmPassword")} placeholder="Ulangi password" className={errors.confirmPassword ? "border-red-500" : ""} />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Jabatan / Role <span className="text-red-500">*</span></label>
                <select
                  value={form.roleId}
                  onChange={e => setForm(p => ({ ...p, roleId: Number(e.target.value) }))}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {DB_ROLES.filter(r => isSuperAdmin || r.name !== "Superadmin").map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">PT</label>
                <select
                  value={form.ptId}
                  onChange={e => setForm(p => ({ ...p, ptId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— Pilih PT (opsional) —</option>
                  {(pts as Pt[] | undefined)?.map(pt => (
                    <option key={pt.id} value={pt.id}>{pt.name} ({pt.code})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Shift</label>
                <select
                  value={form.shiftId}
                  onChange={e => setForm(p => ({ ...p, shiftId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">— Pilih Shift (opsional) —</option>
                  {(shifts as Shift[] | undefined)?.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Jabatan Teknis</label>
                <Input value={form.positionTitle} onChange={f("positionTitle")} placeholder="Contoh: Dealer Senior" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setErrors({}); }}>
                Batal
              </Button>
              <Button type="submit" disabled={createUser.isPending} className="gap-2">
                {createUser.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : <><Plus className="w-4 h-4" />Tambah Pengguna</>}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary"><Users className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Total Pengguna</p>
            <p className="text-2xl font-black">{users?.length ?? 0}</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500"><Building className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Total PT</p>
            <p className="text-2xl font-black">{pts?.length ?? 0}</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500"><Shield className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Total Role</p>
            <p className="text-2xl font-black">{DB_ROLES.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Daftar Pengguna</h2>
          <span className="ml-auto text-xs text-muted-foreground">{users?.length ?? 0} pengguna</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Jabatan</th>
                <th className="px-6 py-4">PT</th>
                <th className="px-6 py-4">Shift</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></td></tr>
              ) : (users as UserWithRelations[] | undefined)?.map((u: UserWithRelations) => {
                const rc = roleCfg(u.roleName);
                return (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${rc.bg} flex items-center justify-center font-bold text-xs border ${rc.color.replace("text-", "border-").replace("400", "400/40")}`}>
                          <span className={rc.color}>{u.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          {u.positionTitle && <p className="text-xs text-muted-foreground">{u.positionTitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${rc.bg} ${rc.color} text-xs font-semibold`}>
                        {rc.icon}
                        {u.roleName ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{u.ptName ?? "—"}</td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">{u.shiftName ?? "—"}</td>
                    <td className="px-6 py-4 text-center">
                      {u.activeStatus
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        : <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !users?.length && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada data pengguna</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-500" /> Daftar PT
          </h2>
          <div className="space-y-2">
            {(pts as Pt[] | undefined)?.map((pt: Pt) => (
              <div key={pt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                <div>
                  <p className="font-medium text-sm">{pt.name}</p>
                  <p className="text-xs text-muted-foreground">Kode: {pt.code}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">#{pt.id}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" /> Daftar Role & Jabatan
          </h2>
          <div className="space-y-2">
            {DB_ROLES.map(role => {
              const rc = roleCfg(role.name);
              return (
                <div key={role.id} className={`flex items-center gap-3 p-3 rounded-lg border ${rc.bg}`}>
                  <div className={`${rc.color}`}>{rc.icon}</div>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${rc.color}`}>{role.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
