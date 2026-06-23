"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import api from "@/lib/api";

/**
 * Checks if a JWT token has expired or is malformed client-side.
 * This prevents making unnecessary API calls to /auth/me that would result in 401 network errors in the browser console.
 */
function isTokenExpired(token: string): boolean {
  if (!token || token === "undefined" || token === "null") {
    return true;
  }
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return true; // Malformed JWT
    }
    // Base64URL decode the payload segment
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    // exp is represented as a Unix timestamp in seconds
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return true; // Token has expired
    }
    return false; // Token is valid
  } catch {
    return true; // Any error decoding means token is invalid
  }
}

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
  // Store details of the currently authenticated User profile
  const [user, setUser] = useState<User | null>(null);
  
  // Set initial loading state to true on mount if a valid, non-expired 'auth_token' cookie exists.
  // This prevents flashes of unauthenticated content during app boot on protected pages.
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const token = Cookies.get("auth_token");
    return !!token && !isTokenExpired(token);
  });

  // Fetch the authenticated user profile data from /auth/me using the stored cookie
  const loadUser = useCallback(async () => {
    try {
      const response = await api.get<User>("/auth/me");
      setUser(response.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Silently handle expected 401 Unauthorized status (e.g., expired session or unauthenticated public view)
      if (error?.response?.status !== 401) {
        console.error("Failed to fetch current user:", error);
      }
      // Clean up invalid or expired tokens
      Cookies.remove("auth_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run the session verification once when the component mounts.
  // Validate token expiration client-side to prevent triggering 401 errors.
  useEffect(() => {
    const token = Cookies.get("auth_token");
    if (token) {
      if (isTokenExpired(token)) {
        // Automatically clean up expired or malformed token
        Cookies.remove("auth_token");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(null);
        setLoading(false);
      } else {
        loadUser();
      }
    } else {
      setLoading(false);
    }
  }, [loadUser]);

  // Login handler: stores token in a Strict SameSite cookie and loads the user info
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

  // Logout handler: clears cookie and resets state variables
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
