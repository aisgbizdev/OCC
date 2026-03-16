import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Activity, CheckSquare, AlertTriangle, Megaphone, MessageSquare, Repeat, Bell, Users, Settings, LogOut, LayoutDashboard, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useListNotifications } from "@workspace/api-client-react";
import { FAB } from "@/components/fab";
import { ResponsiveModal } from "@/components/responsive-modal";
import { BatchActivityForm } from "@/components/batch-activity-form";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity-logs", label: "Activities", icon: Activity },
  { href: "/kpi", label: "KPI & Rank", icon: BarChart2 },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/complaints", label: "Complaints", icon: AlertTriangle },
  { href: "/handover", label: "Handover", icon: Repeat },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  const { data: notificationsData } = useListNotifications({ unreadOnly: "true" }, {
    query: { refetchInterval: 30000, enabled: !!user }
  });

  const unreadCount = notificationsData?.unreadCount || 0;

  if (!user) return <>{children}</>;

  const isAdmin = ["Owner", "Admin System"].includes(user.roleName);

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "4rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">

        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar h-full">
          <div className="p-6">
            <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" /> OCC
            </h1>
            <p className="text-xs text-muted-foreground mt-1 tracking-wide uppercase font-mono">Control Center</p>
          </div>

          <div className="px-4 pb-4">
            <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.roleName}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
            {NAV_ITEMS.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                )}>
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className="pt-6 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</div>
                <Link href="/users" className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  location === "/users" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}><Users className="w-4 h-4" /> Users</Link>
                <Link href="/system" className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  location === "/system" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}><Settings className="w-4 h-4" /> System</Link>
              </>
            )}
          </nav>

          <div className="p-4 mt-auto border-t">
            <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 h-full relative z-0">
          <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b glass-panel sticky top-0 z-40">
            <div className="md:hidden flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              <span className="font-bold">OCC</span>
            </div>
            <div className="hidden md:block text-sm font-mono text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            <div className="flex items-center gap-4">
              <Link href="/notifications" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
                )}
              </Link>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative">
            <div className="max-w-7xl mx-auto h-full">
              {children}
            </div>
          </main>
        </div>

        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around px-2 z-40">
          {[
            { href: "/dashboard", icon: LayoutDashboard },
            { href: "/activity-logs", icon: Activity },
            { href: "/kpi", icon: BarChart2 },
            { href: "/tasks", icon: CheckSquare },
          ].map(item => (
            <Link key={item.href} href={item.href} className={cn(
              "p-3 rounded-xl flex flex-col items-center justify-center transition-all",
              location === item.href ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
            )}>
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
          <button onClick={logout} className="p-3 text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <FAB
          onLogActivity={() => setActivityModalOpen(true)}
          onNewTask={() => setLocation("/tasks")}
          onNewComplaint={() => setLocation("/complaints")}
          onNewAnnouncement={() => setLocation("/announcements")}
        />

        <ResponsiveModal open={activityModalOpen} onOpenChange={setActivityModalOpen} title="Log Activities" description="Add one or more activities to your log.">
          <BatchActivityForm onSuccess={() => setActivityModalOpen(false)} />
        </ResponsiveModal>
      </div>
    </SidebarProvider>
  );
}
