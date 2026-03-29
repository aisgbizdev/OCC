import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  Activity, CheckSquare, AlertTriangle, Megaphone, MessageSquare, Repeat, Bell,
  Users, Settings, LogOut, LayoutDashboard, BarChart2, Menu, X, MessageCircle, UserCircle, Monitor, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useListNotifications, type ListNotifications200 } from "@workspace/api-client-react";
import { FAB } from "@/components/fab";
import { ResponsiveModal } from "@/components/responsive-modal";
import { BatchActivityForm } from "@/components/batch-activity-form";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { CommandPalette } from "@/components/command-palette";
import { useSwipe } from "@/hooks/use-swipe";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  minRole?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity-logs", label: "Aktivitas", icon: Activity },
  { href: "/kpi", label: "KPI & Rank", icon: BarChart2 },
  { href: "/tasks", label: "Tugas", icon: CheckSquare },
  { href: "/complaints", label: "Komplain", icon: AlertTriangle },
  { href: "/handover", label: "Handover", icon: Repeat },
  { href: "/messages", label: "Pesan", icon: MessageSquare },
  { href: "/chats", label: "Chat", icon: MessageCircle },
  { href: "/announcements", label: "Pengumuman", icon: Megaphone },
  { href: "/notifications", label: "Notifikasi", icon: Bell },
];

const MOBILE_BOTTOM_NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/activity-logs", icon: Activity, label: "Aktivitas" },
  { href: "/kpi", icon: BarChart2, label: "KPI" },
  { href: "/tasks", icon: CheckSquare, label: "Tugas" },
  { href: "/complaints", icon: AlertTriangle, label: "Komplain" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  usePushNotifications();

  const openCommand = useCallback(() => setCommandOpen(true), []);
  const closeCommand = useCallback(() => setCommandOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useSwipe(
    mainRef,
    {
      onSwipeRight: () => setMobileMenuOpen(true),
      onSwipeLeft: () => setMobileMenuOpen(false),
    },
    { edgeThreshold: 40, threshold: 60 }
  );

  const { data: notificationsData } = useListNotifications<ListNotifications200>(
    { unreadOnly: "true" },
    { query: { queryKey: ["notifications-unread"], refetchInterval: 30000, enabled: !!user } }
  );

  const unreadCount = notificationsData?.unreadCount ?? 0;

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  if (!user) return <>{children}</>;

  const isAdmin = ["Owner", "Admin System", "Superadmin"].includes(user.roleName ?? "");

  return (
    <SidebarProvider style={{ "--sidebar-width": "16rem", "--sidebar-width-icon": "4rem" } as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">

        <aside className="hidden md:flex flex-col w-64 border-r border-border bg-sidebar h-full shrink-0">
          <div className="p-6">
            <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" /> OCC
            </h1>
            <p className="text-xs text-muted-foreground mt-1 tracking-wide uppercase font-mono">Control Center</p>
          </div>

          <div className="px-4 pb-4">
            <Link href="/profile" className="block">
              <div className="bg-card border rounded-xl p-4 shadow-sm flex items-center gap-3 hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20 shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.roleName}</p>
                </div>
                <UserCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
            {NAV_ITEMS.filter(item => !item.minRole || item.minRole.includes(user.roleName ?? "")).map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                )}>
                  <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount > 99 ? "99+" : unreadCount}</span>
                  )}
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className="pt-6 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</div>
                <Link href="/users" className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  location === "/users" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted border border-transparent"
                )}><Users className="w-4 h-4" /> Users</Link>
                <Link href="/system" className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  location === "/system" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted border border-transparent"
                )}><Settings className="w-4 h-4" /> System</Link>
                <a href="/wallboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted border border-transparent transition-all">
                  <Monitor className="w-4 h-4" /> TV Wallboard
                </a>
              </>
            )}
          </nav>

          <div className="p-4 mt-auto border-t">
            <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="relative w-72 max-w-[85vw] bg-sidebar border-r border-border h-full flex flex-col z-10 animate-in slide-in-from-left-full duration-200">
              <div className="p-6 flex items-center justify-between">
                <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
                  <Activity className="w-6 h-6 text-primary" /> OCC
                </h1>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 pb-4">
                <Link href="/profile" className="block">
                  <div className="bg-card border rounded-xl p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors group">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20 shrink-0 text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="font-semibold text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.roleName} · {(user as { ptName?: string })?.ptName ?? "Korporat"}</p>
                    </div>
                    <UserCircle className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </Link>
              </div>

              <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
                {NAV_ITEMS.filter(item => !item.minRole || item.minRole.includes(user.roleName ?? "")).map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href} className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                    )}>
                      <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "")} />
                      {item.label}
                      {item.href === "/notifications" && unreadCount > 0 && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                      )}
                    </Link>
                  );
                })}

                {isAdmin && (
                  <>
                    <div className="pt-4 pb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</div>
                    <Link href="/users" className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                      location === "/users" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted border border-transparent"
                    )}><Users className="w-5 h-5" /> Master Data</Link>
                    <Link href="/system" className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                      location === "/system" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-muted border border-transparent"
                    )}><Settings className="w-5 h-5" /> System</Link>
                    <a href="/wallboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted border border-transparent transition-all">
                      <Monitor className="w-5 h-5" /> TV Wallboard
                    </a>
                  </>
                )}
              </nav>

              <div className="p-4 border-t">
                <button onClick={logout} className="flex items-center gap-3 px-3 py-3 w-full rounded-lg text-sm font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </div>
            </aside>
          </div>
        )}

        <div ref={mainRef} className="flex-1 flex flex-col min-w-0 h-full relative z-0">
          <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-8 border-b glass-panel sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="md:hidden flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <span className="font-bold text-sm">OCC</span>
              </div>
              <div className="hidden md:block text-sm font-mono text-muted-foreground">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openCommand}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
                title="Command Palette (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="text-xs">Cari...</span>
                <kbd className="ml-2 text-[10px] font-mono px-1 py-0.5 rounded bg-background border border-border">⌘K</kbd>
              </button>
              <button
                onClick={openCommand}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Cari"
              >
                <Search className="w-5 h-5" />
              </button>
              <Link href="/notifications" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
                )}
              </Link>
              <Link href="/profile" className="hidden md:flex w-8 h-8 rounded-full bg-primary/20 items-center justify-center text-primary font-bold text-xs border border-primary/20 hover:ring-2 hover:ring-primary/40 transition-all" title="Profil Saya">
                {user.name.charAt(0)}
              </Link>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative">
            <div className="max-w-7xl mx-auto h-full">
              {children}
            </div>
          </main>
        </div>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border flex items-center z-40 safe-bottom">
          {MOBILE_BOTTOM_NAV.map(item => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-all min-w-0",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-muted-foreground hover:text-foreground transition-all relative"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">Lainnya</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-4 w-2 h-2 bg-destructive rounded-full" />
            )}
          </button>
        </nav>

        <FAB
          onLogActivity={() => setActivityModalOpen(true)}
          onNewTask={() => setLocation("/tasks")}
          onNewComplaint={() => setLocation("/complaints")}
          onNewAnnouncement={() => setLocation("/announcements")}
        />

        <PwaInstallBanner />

        <CommandPalette open={commandOpen} onClose={closeCommand} isAdmin={isAdmin} />

        <ResponsiveModal open={activityModalOpen} onOpenChange={setActivityModalOpen} title="Log Aktivitas" description="Tambah satu atau beberapa aktivitas sekaligus.">
          <BatchActivityForm onSuccess={() => setActivityModalOpen(false)} />
        </ResponsiveModal>
      </div>
    </SidebarProvider>
  );
}
