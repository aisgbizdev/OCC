import { useListNotifications, useMarkAllNotificationsRead } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export default function Notifications() {
  const { data } = useListNotifications();
  const markAll = useMarkAllNotificationsRead();
  const qc = useQueryClient();

  const handleMarkAll = () => {
    markAll.mutate(undefined, {
      onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/notifications"] })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">System alerts and updates.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={markAll.isPending || data?.unreadCount === 0} className="gap-2">
          <Check className="w-4 h-4" /> Mark All Read
        </Button>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
        {data?.notifications?.map(notif => (
          <div key={notif.id} className={`p-4 flex gap-4 transition-colors ${!notif.readStatus ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
            <div className={`mt-1 p-2 rounded-full h-fit ${!notif.readStatus ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className={`text-sm ${!notif.readStatus ? 'font-bold' : 'font-medium text-foreground'}`}>{notif.title}</h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{format(new Date(notif.createdAt), "MMM d, HH:mm")}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{notif.content}</p>
            </div>
          </div>
        ))}
        {data?.notifications?.length === 0 && (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <Bell className="w-8 h-8 mb-2 opacity-20" />
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
