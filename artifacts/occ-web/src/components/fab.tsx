import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Activity, CheckSquare, AlertTriangle, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function FAB({ 
  onLogActivity, 
  onNewTask, 
  onNewComplaint, 
  onNewAnnouncement 
}: {
  onLogActivity: () => void;
  onNewTask: () => void;
  onNewComplaint: () => void;
  onNewAnnouncement: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  if (!user) return null;

  const canAnnounce = ["Owner", "Chief Dealing", "SPV Dealing", "Admin System"].includes(user.roleName);

  const actions = [
    { label: "Log Activity", icon: Activity, onClick: onLogActivity, color: "bg-blue-500" },
    { label: "New Task", icon: CheckSquare, onClick: onNewTask, color: "bg-emerald-500" },
    { label: "New Complaint", icon: AlertTriangle, onClick: onNewComplaint, color: "bg-amber-500" },
  ];

  if (canAnnounce) {
    actions.push({ label: "Announcement", icon: Megaphone, onClick: onNewAnnouncement, color: "bg-purple-500" });
  }

  return (
    <div className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col items-end gap-3 mb-2"
          >
            {actions.map((act, i) => (
              <motion.div 
                key={act.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="bg-card border px-3 py-1.5 rounded-lg text-sm font-medium shadow-md">
                  {act.label}
                </span>
                <Button 
                  size="icon" 
                  className={`rounded-full h-12 w-12 shadow-lg ${act.color} text-white hover:opacity-90 border-none`}
                  onClick={() => { setOpen(false); act.onClick(); }}
                >
                  <act.icon className="w-5 h-5" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <Button 
        size="icon" 
        onClick={() => setOpen(!open)}
        className="rounded-full h-14 w-14 shadow-xl bg-primary text-primary-foreground hover:scale-105 transition-transform border-none"
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }}>
          {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.div>
      </Button>
    </div>
  );
}
