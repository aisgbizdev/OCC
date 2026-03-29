import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { User, Lock, Building2, Clock, Shield, Moon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

async function apiPut(url: string, body: object) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
  return data;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Profile form state ──────────────────────────────────────────────────
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [positionTitle, setPositionTitle] = useState(
    (user as { positionTitle?: string })?.positionTitle ?? ""
  );

  // ── Password form state ─────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── Mutations ────────────────────────────────────────────────────────────
  const dndMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      apiPut("/api/users/me/dnd", { dndEnabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const profileMutation = useMutation({
    mutationFn: () =>
      apiPut("/api/users/me", { name: name.trim(), phone: phone.trim(), positionTitle: positionTitle.trim() }),
    onSuccess: (updated) => {
      toast({ title: "Profil berhasil diperbarui" });
      queryClient.invalidateQueries({ queryKey: ["me"] });
      setName(updated.name ?? name);
      setPhone(updated.phone ?? phone);
      setPositionTitle(updated.positionTitle ?? positionTitle);
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      apiPut("/api/users/me/password", { currentPassword, newPassword }),
    onSuccess: () => {
      toast({ title: "Password berhasil diubah" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Nama tidak boleh kosong", variant: "destructive" }); return;
    }
    profileMutation.mutate();
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Semua field password wajib diisi", variant: "destructive" }); return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password baru minimal 6 karakter", variant: "destructive" }); return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Konfirmasi password tidak cocok", variant: "destructive" }); return;
    }
    passwordMutation.mutate();
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profil Saya</h1>
        <p className="text-muted-foreground text-sm mt-1">Kelola informasi akun dan keamanan</p>
      </div>

      {/* ── Info Summary Card ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-2xl border-2 border-primary/30 shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-lg leading-tight">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Shield className="w-3 h-3" /> {user.roleName}
                </Badge>
                {(user as { ptName?: string })?.ptName && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Building2 className="w-3 h-3" /> {(user as { ptName?: string }).ptName}
                  </Badge>
                )}
                {(user as { shiftName?: string })?.shiftName && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3" /> {(user as { shiftName?: string }).shiftName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Edit Profile ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-primary" /> Ubah Data Profil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nama lengkap"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="positionTitle">Jabatan / Posisi</Label>
              <Input
                id="positionTitle"
                value={positionTitle}
                onChange={e => setPositionTitle(e.target.value)}
                placeholder="Contoh: SPV Dealing Shift Pagi"
              />
              <p className="text-xs text-muted-foreground">Jabatan yang ditampilkan di profil (berbeda dengan role sistem)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor HP / WhatsApp</Label>
              <Input
                id="phone"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Role Sistem</Label>
                <p className="text-sm font-medium">{user.roleName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">PT / Divisi</Label>
                <p className="text-sm font-medium">{(user as { ptName?: string })?.ptName || "Lintas PT"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Shift</Label>
                <p className="text-sm font-medium">{(user as { shiftName?: string })?.shiftName || "—"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Role, PT, dan Shift hanya bisa diubah oleh Admin/Owner.</p>

            <div className="flex justify-end">
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? "Menyimpan..." : "Simpan Profil"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Do Not Disturb ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="w-4 h-4 text-primary" /> Jangan Ganggu (DND)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Mode Jangan Ganggu</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Saat aktif, push notifikasi tidak akan dikirim ke perangkat kamu (kecuali eskalasi/kritis).
              </p>
            </div>
            <Switch
              checked={(user as { dndEnabled?: boolean })?.dndEnabled ?? false}
              onCheckedChange={(checked) => dndMutation.mutate(checked)}
              disabled={dndMutation.isPending}
            />
          </div>
          {(user as { dndEnabled?: boolean })?.dndEnabled && (
            <div className="mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <Moon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400">DND aktif — push notifikasi dihentikan sementara</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Change Password ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Ganti Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password Lama *</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                autoComplete="new-password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Password tidak cocok</p>
              )}
              {confirmPassword && newPassword === confirmPassword && confirmPassword.length >= 6 && (
                <p className="text-xs text-green-600">Password cocok ✓</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={passwordMutation.isPending} variant="outline">
                {passwordMutation.isPending ? "Menyimpan..." : "Ganti Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground pb-4">
        Lupa password? Hubungi Admin System atau Owner untuk reset.
      </p>
    </div>
  );
}
