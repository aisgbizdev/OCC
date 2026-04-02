import React from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", background: "#0a0e1a", color: "#ef4444", minHeight: "100vh" }}>
          <h2 style={{ marginBottom: 16 }}>OCC — Runtime Error</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>{this.state.error.message}{"\n"}{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

import "./lib/fetch-interceptor"; // Import interceptor before anything else
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/layout";
import { canAccessPage, type PageKey } from "@/lib/access-control";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ActivityLogs from "@/pages/activity-logs";
import KPI from "@/pages/kpi";
import Tasks from "@/pages/tasks";
import Complaints from "@/pages/complaints";
import Announcements from "@/pages/announcements";
import Messages from "@/pages/messages";
import Chats from "@/pages/chats";
import Handover from "@/pages/handover";
import Notifications from "@/pages/notifications";
import SystemSettings from "@/pages/system";
import MasterData from "@/pages/users";
import Profile from "@/pages/profile";
import NotFound from "@/pages/not-found";
import Wallboard from "@/pages/wallboard";
import Branches from "@/pages/branches";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, page }: { component: React.ComponentType; page: PageKey }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading OCC...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (user && !canAccessPage(page, user)) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center py-24 text-muted-foreground flex-col gap-3">
          <p className="text-lg font-semibold">Akses Ditolak</p>
          <p className="text-sm">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} page="dashboard" /></Route>
      <Route path="/activity-logs"><ProtectedRoute component={ActivityLogs} page="activityLogs" /></Route>
      <Route path="/kpi"><ProtectedRoute component={KPI} page="kpi" /></Route>
      <Route path="/tasks"><ProtectedRoute component={Tasks} page="tasks" /></Route>
      <Route path="/complaints"><ProtectedRoute component={Complaints} page="complaints" /></Route>
      <Route path="/announcements"><ProtectedRoute component={Announcements} page="announcements" /></Route>
      <Route path="/messages"><ProtectedRoute component={Messages} page="messages" /></Route>
      <Route path="/chats"><ProtectedRoute component={Chats} page="chats" /></Route>
      <Route path="/handover"><ProtectedRoute component={Handover} page="handover" /></Route>
      <Route path="/notifications"><ProtectedRoute component={Notifications} page="notifications" /></Route>
      <Route path="/system"><ProtectedRoute component={SystemSettings} page="system" /></Route>
      <Route path="/users"><ProtectedRoute component={MasterData} page="users" /></Route>
      <Route path="/wallboard" component={Wallboard} />
      <Route path="/branches"><ProtectedRoute component={Branches} page="branches" /></Route>
      <Route path="/quality"><QualityRedirect /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} page="profile" /></Route>
      <Route path="/"><RootRedirect /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function QualityRedirect() {
  const [, setLocation] = useLocation();
  React.useEffect(() => { setLocation("/dashboard"); }, [setLocation]);
  return null;
}

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading) {
      setLocation(isAuthenticated ? "/dashboard" : "/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;
