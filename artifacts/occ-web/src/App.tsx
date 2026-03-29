import React from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./lib/fetch-interceptor"; // Import interceptor before anything else
import { AuthProvider, useAuth } from "@/lib/auth";
import { AppLayout } from "@/components/layout";

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

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType; allowedRoles?: string[] }) {
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

  if (allowedRoles && user && !allowedRoles.includes(user.roleName ?? "")) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center py-24 text-muted-foreground flex-col gap-3">
          <p className="text-lg font-semibold">Akses Ditolak</p>
          <p className="text-sm">Halaman ini hanya tersedia untuk {allowedRoles.join(", ")}.</p>
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
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/activity-logs"><ProtectedRoute component={ActivityLogs} /></Route>
      <Route path="/kpi"><ProtectedRoute component={KPI} /></Route>
      <Route path="/tasks"><ProtectedRoute component={Tasks} /></Route>
      <Route path="/complaints"><ProtectedRoute component={Complaints} /></Route>
      <Route path="/announcements"><ProtectedRoute component={Announcements} /></Route>
      <Route path="/messages"><ProtectedRoute component={Messages} /></Route>
      <Route path="/chats"><ProtectedRoute component={Chats} /></Route>
      <Route path="/handover"><ProtectedRoute component={Handover} /></Route>
      <Route path="/notifications"><ProtectedRoute component={Notifications} /></Route>
      <Route path="/system"><ProtectedRoute component={SystemSettings} /></Route>
      <Route path="/users"><ProtectedRoute component={MasterData} /></Route>
      <Route path="/wallboard" component={Wallboard} />
      <Route path="/branches"><ProtectedRoute component={Branches} allowedRoles={["Owner", "Direksi", "Chief Dealing", "Admin System", "Superadmin"]} /></Route>
      <Route path="/quality"><QualityRedirect /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
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
  );
}

export default App;
