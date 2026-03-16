import { useState } from "react";
import { useListTasks, useUpdateTask, useCreateTask, useListUsers } from "@workspace/api-client-react";
import { format } from "date-fns";
import { CheckCircle2, Circle, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ResponsiveModal } from "@/components/responsive-modal";

export default function Tasks() {
  const { data: tasks } = useListTasks();
  const updateTask = useUpdateTask();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const handleStatusToggle = (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === "new" ? "in_progress" : currentStatus === "in_progress" ? "completed" : "new";
    const progress = nextStatus === "completed" ? 100 : nextStatus === "in_progress" ? 50 : 0;

    updateTask.mutate({ id, data: { status: nextStatus, progressPercent: progress } }, {
      onSuccess: () => {
        toast({ title: "Task Updated", description: `Status changed to ${nextStatus}` });
        qc.invalidateQueries({ queryKey: ["/api/tasks"] });
      },
      onError: () => toast({ title: "Error", description: "Failed to update task status", variant: "destructive" })
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
          <p className="text-muted-foreground mt-1">Track and update assigned operations.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Task
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks?.map(task => (
          <div key={task.id} className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full relative group">
            <div className="flex justify-between items-start mb-3">
              <div
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  task.priority === 'high' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                  task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}
              >
                {task.priority.toUpperCase()}
              </div>
              <button
                onClick={() => handleStatusToggle(task.id, task.status)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {task.status === "completed" ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> :
                 task.status === "in_progress" ? <Clock className="w-6 h-6 text-amber-500" /> :
                 <Circle className="w-6 h-6" />}
              </button>
            </div>
            <h3 className="font-bold text-lg mb-1">{task.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">{task.description}</p>
            <div className="mt-auto space-y-3">
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${task.progressPercent === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                  style={{ width: `${task.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {task.deadline ? `Due ${format(new Date(task.deadline), "MMM d")}` : "No deadline"}</span>
                <span>{task.assigneeName}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ResponsiveModal open={createOpen} onOpenChange={setCreateOpen} title="Create Task" description="Assign a new task to a team member.">
        <CreateTaskForm onSuccess={() => setCreateOpen(false)} />
      </ResponsiveModal>
    </div>
  );
}

function CreateTaskForm({ onSuccess }: { onSuccess: () => void }) {
  const createTask = useCreateTask();
  const { data: users } = useListUsers();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", assignedTo: "", deadline: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTask.mutate({ data: {
      title: form.title,
      description: form.description || undefined,
      priority: form.priority,
      assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
      deadline: form.deadline || undefined
    }}, {
      onSuccess: () => {
        toast({ title: "Task Created", description: "New task has been assigned" });
        qc.invalidateQueries({ queryKey: ["/api/tasks"] });
        onSuccess();
      },
      onError: () => toast({ title: "Error", description: "Failed to create task", variant: "destructive" })
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title *</label>
        <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Task title..." />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <textarea className="w-full min-h-[80px] px-3 py-2 rounded-md bg-background border text-sm resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the task..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Deadline</label>
          <Input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Assign To</label>
        <select className="w-full h-10 px-3 rounded-md bg-background border text-sm" value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})}>
          <option value="">Unassigned</option>
          {users?.filter(u => u.activeStatus).map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.roleName})</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" disabled={createTask.isPending} className="px-8">
          {createTask.isPending ? "Creating..." : "Create Task"}
        </Button>
      </div>
    </form>
  );
}
