"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, User, LayoutDashboard, FileText, Users, Settings, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // Redirect to login if user session is not found and loading is complete
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
          <p className="text-sm font-medium text-slate-500">Loading user session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Prevents layout flash before redirection
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Branding */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
                H
              </div>
              <span className="text-lg font-semibold text-slate-900 tracking-tight">
                AI HR Platform
              </span>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 border border-slate-200">
                <User className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Sidebar / Left Navigation */}
          <aside className="space-y-1">
            <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto pb-3 md:pb-0">
              <a
                href="#"
                className="flex items-center gap-2.5 rounded-md bg-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </a>
              <a
                href="#"
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Job Openings
              </a>
              <a
                href="#"
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Users className="h-4 w-4" />
                Candidates
              </a>
              <a
                href="#"
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </a>
            </nav>
          </aside>

          {/* Dashboard Main Workspace */}
          <main className="md:col-span-3 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Recruiter Workspace
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Welcome back to your workspace. Monitor candidate applications, design job descriptions, and view screening analytics.
              </p>

              {/* Status banner */}
              <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-4">
                <h3 className="text-sm font-medium text-slate-900">Phase 1 Complete</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Authentication modules are active. The workspace can resolve your identity and securely restrict navigation headers. Next phases will unlock Job Creation, AI screening, and evaluation scoring pipelines.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
