import { useState } from "react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ data: { email, password } }, {
      onSuccess: (data) => {
        localStorage.setItem("occ_token", data.token);
        window.location.href = "/dashboard"; // hard reload to init AuthContext with token
      },
      onError: (err: any) => {
        toast({ title: "Login Failed", description: err?.response?.data?.error || "Invalid credentials", variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={`${import.meta.env.BASE_URL}images/login-bg.png`} alt="Background" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 glass-panel rounded-3xl mx-4 shadow-2xl border border-primary/20">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.3)]">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">System Login</h1>
          <p className="text-muted-foreground mt-2 text-sm">Operational Control Center</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                type="email" 
                className="pl-10 bg-black/50 border-white/10 h-12 rounded-xl focus:border-primary" 
                placeholder="admin@occ.id"
                value={email} onChange={e => setEmail(e.target.value)} required 
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input 
                type="password" 
                className="pl-10 bg-black/50 border-white/10 h-12 rounded-xl focus:border-primary" 
                placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required 
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl text-md font-bold mt-4 shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] transition-all"
            disabled={login.isPending}
          >
            {login.isPending ? "Authenticating..." : "Authorize Access"}
          </Button>
        </form>
      </div>
    </div>
  );
}
