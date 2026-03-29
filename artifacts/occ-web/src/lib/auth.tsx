import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, type UserWithRelations } from "@workspace/api-client-react";

interface AuthContextType {
  user: UserWithRelations | null;
  isLoading: boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState(localStorage.getItem("occ_token"));
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      queryKey: ["me"],
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (isError) {
      localStorage.removeItem("occ_token");
      setToken(null);
      queryClient.clear();
      setLocation("/login");
    }
  }, [isError, setLocation, queryClient]);

  const logout = () => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("occ_token");
    setToken(null);
    queryClient.clear();
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{
      user: user ?? null,
      isLoading: isLoading && !!token,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
