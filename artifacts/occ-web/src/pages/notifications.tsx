import { useListNotifications, useMarkAllNotificationsRead, type ListNotifications200, type Notification } from "@workspace/api-client-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Bell, Check, ChevronDown, ChevronRight, BellOff, Clock, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface DndConfig { enabled: boolean; startHour: number; endHour: number; }

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    activity: "Aktivitas",
    announcement: "Pengumuman",
    complaint: "Pengaduan",
    task: "Tugas",
    handover: "Serah Terima",
    kpi: "KPI",
    alert: "Peringatan",
    system: "Sistem",
  };
  return map[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
}

function typeIcon(type: string, unread: boolean) {
  const cls = `w-4 h-4`;
  const base = `mt-1 p-2 rounded-full h-fit flex-shrink-0 ${unread ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`;
  return <div className={base}><Bell className={cls} /></div>;
}

function GroupedNotifications({ notifications }: { notifications: Notification[] }) {
  const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    const k = n.type ?? "system";
    if (!acc[k]) acc[k] = [];
    acc[k].push(n);
    return acc;
  }, {});

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(Object.keys(grouped).map(k => [k, true]))
  );

  const toggle = (key: string) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  const sortedGroups = Object.entries(grouped).sort((a, b) => {
    const aUnread = a[1].filter(n => !n.readStatus).length;
    const bUnread = b[1].filter(n => !n.readStatus).length;
    return bUnread - aUnread;
  });

  return (
    <div className="bg-card border rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
      {sortedGroups.map(([type, items]) => {
        const unreadCount = items.filter(n => !n.readStatus).length;
        const isOpen = expanded[type] ?? true;
        return (
          <div key={type}>
            <button
              onClick={() => toggle(type)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
            >
              {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              <span className="font-semibold text-sm flex-1">{typeLabel(type)}</span>
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 font-bold">
                  {unreadCount} baru
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-1">{items.length} total</span>
            </button>
            {isOpen && (
              <div className="divide-y divide-border">
                {items.map((notif) => (
                  <div key={notif.id} className={cn("p-4 flex gap-3 transition-colors", !notif.readStatus ? "bg-primary/5" : "hover:bg-muted/30")}>
                    {typeIcon(notif.type ?? "system", !notif.readStatus)}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className={cn("text-sm truncate", !notif.readStatus ? "font-bold" : "font-medium text-foreground")}>
                          {notif.title}
                        </h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {notif.createdAt ? format(new Date(notif.createdAt), "d MMM, HH:mm", { locale: localeId }) : ""}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DndSettings() {
  const [localConfig, setLocalConfig] = useState<DndConfig | null>(null);
  const [saved, setSaved] = useState(false);

  const { data: config, isLoading } = useQuery<DndConfig>({
    queryKey: ["/api/notifications/dnd"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/dnd");
      if (!res.ok) throw new Error("Failed to fetch DND config");
      return res.json();
    },
  });

  const effective = localConfig ?? config ?? { enabled: false, startHour: 22, endHour: 7 };

  const saveMutation = useMutation({
    mutationFn: async (cfg: DndConfig) => {
      const res = await fetch("/api/notifications/dnd", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json() as Promise<DndConfig>;
    },
    onSuccess: (data) => {
      setLocalConfig(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleToggle = (enabled: boolean) => {
    const newCfg = { ...effective, enabled };
    setLocalConfig(newCfg);
    saveMutation.mutate(newCfg);
  };

  const handleHourChange = (field: "startHour" | "endHour", val: string) => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 0 || n > 23) return;
    setLocalConfig(p => ({ ...(p ?? effective), [field]: n }));
  };

  const handleSave = () => saveMutation.mutate(effective);

  const padHour = (h: number) => String(h).padStart(2, "0") + ":00";

  return (
    <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-full">
          <Moon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Jangan Ganggu (DND)</h3>
          <p className="text-xs text-muted-foreground">Hentikan push notifikasi selama jam tertentu</p>
        </div>
        {isLoading ? (
          <div className="w-10 h-6 bg-muted animate-pulse rounded-full" />
        ) : (
          <Switch checked={effective.enabled} onCheckedChange={handleToggle} disabled={saveMutation.isPending} />
        )}
      </div>

      {effective.enabled && (
        <div className="pl-11 space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Mulai
              </Label>
              <select
                value={effective.startHour}
                onChange={e => handleHourChange("startHour", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{padHour(i)}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Selesai
              </Label>
              <select
                value={effective.endHour}
                onChange={e => handleHourChange("endHour", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{padHour(i)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground flex-1">
              Notifikasi akan dihentikan pukul {padHour(effective.startHour)} — {padHour(effective.endHour)}
            </p>
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saveMutation.isPending} className="h-8 text-xs">
              {saved ? <><Check className="w-3 h-3 mr-1" /> Tersimpan</> : "Simpan"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Notifications() {
  const { data } = useListNotifications<ListNotifications200>();
  const markAll = useMarkAllNotificationsRead();
  const qc = useQueryClient();

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] })
    });
  };

  const notifications: Notification[] = data?.notifications ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifikasi</h1>
          <p className="text-muted-foreground mt-1">Peringatan dan pembaruan sistem.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={markAll.isPending || (data?.unreadCount ?? 0) === 0} className="gap-2">
          <Check className="w-4 h-4" /> Tandai Semua Dibaca
        </Button>
      </div>

      <DndSettings />

      {notifications.length === 0 ? (
        <div className="bg-card border rounded-2xl shadow-sm p-8 text-center text-muted-foreground flex flex-col items-center">
          <BellOff className="w-8 h-8 mb-2 opacity-20" />
          <p>Tidak ada notifikasi baru!</p>
        </div>
      ) : (
        <GroupedNotifications notifications={notifications} />
      )}
    </div>
  );
}
