import { useState } from "react";
import {
  useListMessages,
  useAcknowledgeMessage,
  useCreateMessage,
  useListUsers,
  type UserWithRelations,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { MessageSquare, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/responsive-modal";
import { useAuth } from "@/lib/auth";
import { canSend } from "@/lib/access-control";

export default function Messages() {
  const { user } = useAuth();
  const { data: messages } = useListMessages();
  const { data: users } = useListUsers();
  const ackMsg = useAcknowledgeMessage();
  const createMsg = useCreateMessage();
  const qc = useQueryClient();
  const { toast } = useToast();
  const canSendMessage = canSend("message", user);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    content: "",
    targetType: "all",
    targetId: "",
    requireAck: true,
  });

  const handleAck = (id: number) => {
    ackMsg.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Dikonfirmasi", description: "Pesan ditandai sudah dibaca" });
        qc.invalidateQueries({ queryKey: ["/api/messages"] });
      }
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSendMessage) {
      toast({ title: "Anda tidak memiliki akses", variant: "destructive" });
      return;
    }

    createMsg.mutate(
      {
        data: {
          subject: form.subject,
          content: form.content,
          targetType: form.targetType || undefined,
          targetId: form.targetType === "user" && form.targetId ? Number(form.targetId) : undefined,
          requireAck: form.requireAck,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Pesan terkirim" });
          qc.invalidateQueries({ queryKey: ["/api/messages"] });
          setCreateOpen(false);
          setForm({ subject: "", content: "", targetType: "all", targetId: "", requireAck: true });
        },
        onError: () => toast({ title: "Gagal mengirim pesan", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pesan Resmi</h1>
          <p className="text-muted-foreground mt-1">Komunikasi langsung yang memerlukan konfirmasi.</p>
        </div>
        {canSendMessage && (
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Kirim Pesan
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {messages?.map(msg => (
          <div key={msg.id} className={`bg-card border rounded-2xl p-6 shadow-sm transition-all ${msg.requireAck && !msg.acknowledged ? 'border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-muted text-muted-foreground">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{msg.subject}</h3>
                  <span className="text-xs text-muted-foreground font-mono">{msg.createdAt ? format(new Date(msg.createdAt), "MMM d, HH:mm") : ""}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed bg-background p-4 rounded-xl border">{msg.content}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Dari: {msg.senderName ?? "-"}</span>
                  {msg.requireAck && (
                    msg.acknowledged ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="w-4 h-4" /> Dikonfirmasi
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => handleAck(msg.id)} disabled={ackMsg.isPending}>
                        Konfirmasi Penerimaan
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {messages?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
            Tidak ada pesan masuk.
          </div>
        )}
      </div>

      <ResponsiveModal
        open={createOpen && canSendMessage}
        onOpenChange={setCreateOpen}
        title="Kirim Pesan Resmi"
        description="Kirim pengumuman/pesan resmi ke user atau semua role."
      >
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subjek *</label>
            <Input
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              required
              placeholder="Subjek pesan"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Isi Pesan *</label>
            <textarea
              className="w-full min-h-[120px] px-3 py-2 rounded-md bg-background border text-sm resize-none"
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              required
              placeholder="Tulis isi pesan resmi..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target</label>
              <select
                className="w-full h-10 px-3 rounded-md bg-background border text-sm"
                value={form.targetType}
                onChange={(e) => setForm((p) => ({ ...p, targetType: e.target.value, targetId: "" }))}
              >
                <option value="all">Semua</option>
                <option value="user">User Tertentu</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Perlu Konfirmasi</label>
              <select
                className="w-full h-10 px-3 rounded-md bg-background border text-sm"
                value={form.requireAck ? "true" : "false"}
                onChange={(e) => setForm((p) => ({ ...p, requireAck: e.target.value === "true" }))}
              >
                <option value="true">Ya</option>
                <option value="false">Tidak</option>
              </select>
            </div>
          </div>

          {form.targetType === "user" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Pilih User</label>
              <select
                className="w-full h-10 px-3 rounded-md bg-background border text-sm"
                value={form.targetId}
                onChange={(e) => setForm((p) => ({ ...p, targetId: e.target.value }))}
                required
              >
                <option value="">Pilih user</option>
                {(users as UserWithRelations[] | undefined)
                  ?.filter((u) => u.activeStatus)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleName ?? "-"})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button type="submit" disabled={createMsg.isPending || !canSendMessage} className="px-8">
              {createMsg.isPending ? "Mengirim..." : "Kirim Pesan"}
            </Button>
          </div>
        </form>
      </ResponsiveModal>
    </div>
  );
}
