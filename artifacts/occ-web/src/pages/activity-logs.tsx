import { useState } from "react";
import { useListActivityLogs } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Plus, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAB } from "@/components/fab";
import { ResponsiveModal } from "@/components/responsive-modal";
import { BatchActivityForm } from "@/components/batch-activity-form";

export default function ActivityLogs() {
  const { data: logs, isLoading } = useListActivityLogs();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground mt-1">Track your daily operations and KPIs.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="hidden md:flex gap-2">
          <Plus className="w-4 h-4" /> Log Activities
        </Button>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Activity Type</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs?.map(log => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-mono">{format(new Date(log.createdAt), "MMM d, HH:mm")}</td>
                  <td className="px-6 py-4 font-medium">{log.userName}</td>
                  <td className="px-6 py-4">{log.activityTypeName}</td>
                  <td className="px-6 py-4 font-mono">{log.quantity}</td>
                  <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">{log.note || "-"}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-primary">+{log.points}</td>
                </tr>
              ))}
              {logs?.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No activities found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ResponsiveModal open={modalOpen} onOpenChange={setModalOpen} title="Log Activities" description="Add one or more activities to your log.">
        <BatchActivityForm onSuccess={() => setModalOpen(false)} />
      </ResponsiveModal>

      <FAB 
        onLogActivity={() => setModalOpen(true)}
        onNewTask={() => {}}
        onNewComplaint={() => {}}
        onNewAnnouncement={() => {}}
      />
    </div>
  );
}
