import { useState } from "react";
import { useListComplaints, useCreateComplaint } from "@workspace/api-client-react";
import { format } from "date-fns";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlaTimer } from "@/components/sla-timer";
import { ResponsiveModal } from "@/components/responsive-modal";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Complaints() {
  const { data: complaints } = useListComplaints();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Complaints & SLAs</h1>
          <p className="text-muted-foreground mt-1">Monitor operational issues and resolution times.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Complaint
        </Button>
      </div>

      <div className="space-y-4">
        {complaints?.map(comp => (
          <div key={comp.id} className="bg-card border rounded-2xl p-5 shadow-sm hover:border-primary/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-bold text-lg truncate">{comp.title}</h3>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-muted text-muted-foreground">
                  {comp.complaintType}
                </span>
                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md ${
                  comp.severity === 'high' ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {comp.severity}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">{comp.chronology}</p>
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-3">
                <span>By {comp.creatorName}</span>
                <span>•</span>
                <span>{format(new Date(comp.createdAt), "MMM d, yyyy HH:mm")}</span>
                <span>•</span>
                <span className="capitalize text-foreground font-medium">Status: {comp.status.replace("_", " ")}</span>
              </div>
            </div>
            <div className="shrink-0 flex items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-4 sm:pt-0">
              <SlaTimer createdAt={comp.createdAt} status={comp.status} />
            </div>
          </div>
        ))}
      </div>

      <ResponsiveModal open={createOpen} onOpenChange={setCreateOpen} title="Report Complaint" description="Log a new complaint or operational issue.">
        <CreateComplaintForm onSuccess={() => setCreateOpen(false)} />
      </ResponsiveModal>
    </div>
  );
}

function CreateComplaintForm({ onSuccess }: { onSuccess: () => void }) {
  const createComplaint = useCreateComplaint();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", complaintType: "internal", severity: "medium", chronology: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createComplaint.mutate({ data: {
      title: form.title,
      complaintType: form.complaintType,
      severity: form.severity,
      chronology: form.chronology || undefined
    }}, {
      onSuccess: () => {
        toast({ title: "Complaint Filed", description: "SLA timer has started" });
        qc.invalidateQueries({ queryKey: ["/api/complaints"] });
        onSuccess();
      },
      onError: () => toast({ title: "Error", description: "Failed to create complaint", variant: "destructive" })
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title *</label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Brief description of the issue..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={form.complaintType} onChange={e => setForm({...form, complaintType: e.target.value})}>
            <option value="internal">Internal</option>
            <option value="external">External</option>
            <option value="system">System</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Severity</label>
          <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={form.severity} onChange={e => setForm({...form, severity: e.target.value})}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Chronology</label>
        <textarea className="w-full min-h-[100px] px-3 py-2 rounded-md bg-background border text-sm resize-none" value={form.chronology} onChange={e => setForm({...form, chronology: e.target.value})} placeholder="Describe what happened, when, and who was involved..." />
      </div>
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={createComplaint.isPending} className="px-8">
          {createComplaint.isPending ? "Submitting..." : "Submit Complaint"}
        </Button>
      </div>
    </form>
  );
}
