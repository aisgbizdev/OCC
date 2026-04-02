import { useState } from "react";
import { useListAnnouncements, useCreateAnnouncement } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/responsive-modal";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { canCreate } from "@/lib/access-control";

export default function Announcements() {
  const { data: announcements } = useListAnnouncements();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const canCreateAnnouncement = canCreate("announcement", user);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengumuman</h1>
          <p className="text-muted-foreground mt-1">Komunikasi resmi dan pemberitahuan.</p>
        </div>
        {canCreateAnnouncement && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Buat Pengumuman
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {announcements?.map(ann => (
          <div key={ann.id} className="bg-card border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            {ann.priority === 'high' && <div className="absolute top-0 left-0 w-1 h-full bg-destructive" />}
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${ann.priority === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg">{ann.title}</h3>
                  <span className="text-xs text-muted-foreground font-mono">{ann.createdAt ? format(new Date(ann.createdAt), "MMM d, HH:mm") : ""}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                <div className="mt-4 flex items-center gap-3 text-xs font-medium">
                  <span className="bg-muted px-2 py-1 rounded-md text-foreground">By {ann.creatorName ?? "-"}</span>
                  {ann.targetScope && (
                    <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md">
                      Scope: {ann.targetScope.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {announcements?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Belum ada pengumuman.</div>
        )}
      </div>

      <ResponsiveModal open={createOpen && canCreateAnnouncement} onOpenChange={setCreateOpen} title="Buat Pengumuman" description="Broadcast pesan ke seluruh tim.">
        <CreateAnnouncementForm onSuccess={() => setCreateOpen(false)} />
      </ResponsiveModal>
    </div>
  );
}

function CreateAnnouncementForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const createAnn = useCreateAnnouncement();
  const { toast } = useToast();
  const qc = useQueryClient();
  const canCreateAnnouncement = canCreate("announcement", user);
  const [form, setForm] = useState({ title: "", content: "", priority: "normal", targetScope: "all" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateAnnouncement) {
      toast({ title: "Anda tidak memiliki akses", variant: "destructive" });
      return;
    }
    createAnn.mutate({ data: {
      title: form.title,
      content: form.content,
      priority: form.priority,
      targetScope: form.targetScope
    }}, {
      onSuccess: () => {
        toast({ title: "Pengumuman Dibuat", description: "Pengumuman berhasil di-broadcast" });
        qc.invalidateQueries({ queryKey: ["/api/announcements"] });
        onSuccess();
      },
      onError: () => toast({ title: "Error", description: "Gagal membuat pengumuman", variant: "destructive" })
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Judul *</label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Judul pengumuman..." />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Isi *</label>
        <textarea className="w-full min-h-[120px] px-3 py-2 rounded-md bg-background border text-sm resize-none" value={form.content} onChange={e => setForm({...form, content: e.target.value})} required placeholder="Tulis pengumuman..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Prioritas</label>
          <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
            <option value="normal">Normal</option>
            <option value="high">Tinggi</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Scope</label>
          <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={form.targetScope} onChange={e => setForm({...form, targetScope: e.target.value})}>
            <option value="all">Semua</option>
            <option value="pt">PT Saya</option>
            <option value="shift">Shift Ini</option>
            <option value="role">Role Saya</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={createAnn.isPending || !canCreateAnnouncement} className="px-8">
          {createAnn.isPending ? "Mengirim..." : "Kirim Pengumuman"}
        </Button>
      </div>
    </form>
  );
}
