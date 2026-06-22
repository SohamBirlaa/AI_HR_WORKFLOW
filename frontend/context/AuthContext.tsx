"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import api from "@/lib/api";

interface User {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    // Check token presence immediately to set loading state on mount
    return typeof window !== "undefined" && !!Cookies.get("auth_token");
  });

  const loadUser = useCallback(async () => {
    try {
      const response = await api.get<User>("/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      Cookies.remove("auth_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = Cookies.get("auth_token");
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadUser();
    }
    // If no token, loading was initialized to false, so no action/render cycle is needed.
  }, [loadUser]);

  const login = useCallback(async (token: string) => {
    Cookies.set("auth_token", token, { expires: 7, path: "/", sameSite: "strict" });
    setLoading(true);
    try {
      const response = await api.get<User>("/auth/me");
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch current user on login:", error);
      Cookies.remove("auth_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    Cookies.remove("auth_token", { path: "/" });
    setUser(null);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
