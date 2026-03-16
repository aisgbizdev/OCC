import { useListUsers, useListPts, useListRoles, type UserWithRelations } from "@workspace/api-client-react";
import { Users, Building, Shield, CheckCircle2, XCircle } from "lucide-react";

export default function MasterData() {
  const { data: users } = useListUsers();
  const { data: pts } = useListPts();
  const { data: roles } = useListRoles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Master Data</h1>
        <p className="text-muted-foreground mt-1">Data referensi sistem: pengguna, PT, dan role.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Pengguna</p>
            <p className="text-2xl font-black">{users?.length ?? 0}</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total PT</p>
            <p className="text-2xl font-black">{pts?.length ?? 0}</p>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Role</p>
            <p className="text-2xl font-black">{roles?.length ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Daftar Pengguna</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">PT</th>
                <th className="px-6 py-4">Shift</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(users as UserWithRelations[] | undefined)?.map((u: UserWithRelations) => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                        {u.name.charAt(0)}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">{u.roleName ?? "-"}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{u.ptName ?? "-"}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.shiftName ?? "-"}</td>
                  <td className="px-6 py-4 text-center">
                    {u.activeStatus ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
              {!users?.length && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada data pengguna</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Building className="w-5 h-5 text-emerald-500"/> Daftar PT</h2>
          <div className="space-y-2">
            {pts?.map(pt => (
              <div key={pt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                <div>
                  <p className="font-medium text-sm">{pt.name}</p>
                  <p className="text-xs text-muted-foreground">{pt.legalName ?? ""}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">#{pt.id}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-purple-500"/> Daftar Role</h2>
          <div className="space-y-2">
            {roles?.map(role => (
              <div key={role.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                <div>
                  <p className="font-medium text-sm">{role.name}</p>
                  <p className="text-xs text-muted-foreground">{role.description ?? ""}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground">Level {role.hierarchyLevel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
