"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LogOut, 
  User, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Loader2, 
  Plus, 
  Briefcase, 
  Calendar,
  AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import CreateJobModal from "@/components/CreateJobModal";

interface Job {
  id: number;
  title: string;
  company_name: string;
  status: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Redirect to login if user session is not found and loading is complete
  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router, mounted]);

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    setErrorMsg(null);
    try {
      const response = await api.get<Job[]>("/jobs");
      setJobs(response.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.detail || 
        "Failed to load job listings from server."
      );
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    if (mounted && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchJobs();
    }
  }, [user, fetchJobs, mounted]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!mounted || authLoading) {
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

  // Calculate statistics
  const totalCount = jobs.length;
  const draftCount = jobs.filter(j => j.status.toLowerCase() === "draft").length;
  const approvedCount = jobs.filter(j => j.status.toLowerCase() === "approved").length;
  const publishedCount = jobs.filter(j => j.status.toLowerCase() === "published").length;

  // Filter listings
  const filteredJobs = jobs.filter(j => {
    if (filterStatus === "all") return true;
    return j.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
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
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 rounded-md bg-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Job Openings
              </Link>
              <a
                href="#"
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed"
                onClick={(e) => e.preventDefault()}
              >
                <Users className="h-4 w-4" />
                Candidates
              </a>
              <a
                href="#"
                className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed"
                onClick={(e) => e.preventDefault()}
              >
                <Settings className="h-4 w-4" />
                Settings
              </a>
            </nav>
          </aside>

          {/* Dashboard Main Workspace */}
          <main className="md:col-span-3 space-y-6">
            
            {/* Header + Create Trigger */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Job Postings
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  Manage raw descriptions, refine content with AI, and review published recruitment drives.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-sm font-semibold tracking-wide transition-all shadow-sm cursor-pointer hover:shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>Create Job Posting</span>
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Listings</span>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Drafts</span>
                <p className="text-2xl font-extrabold text-slate-700 mt-1">{draftCount}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Approved JDs</span>
                <p className="text-2xl font-extrabold text-indigo-700 mt-1">{approvedCount}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Published Campaigns</span>
                <p className="text-2xl font-extrabold text-emerald-700 mt-1">{publishedCount}</p>
              </div>
            </div>

            {/* Error handling */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold">Server Communication Error</h3>
                  <p className="text-xs mt-1 text-rose-600 font-medium">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="flex border-b border-slate-200 gap-1 pb-px overflow-x-auto">
              {["all", "draft", "jd_generated", "approved", "rejected", "published"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                    filterStatus === status
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200"
                  }`}
                >
                  {status === "all" ? "All Jobs" : status.replace("_", " ")}
                </button>
              ))}
            </div>

            {/* Job Listings Area */}
            <div className="space-y-3">
              {loadingJobs ? (
                <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-slate-500 mb-2" />
                  <span className="text-xs font-medium text-slate-400">Loading your job postings...</span>
                </div>
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all shadow-xs gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center flex-wrap gap-2.5">
                        <h3 className="text-base font-bold text-slate-900 select-text">
                          {job.title}
                        </h3>
                        <StatusBadge status={job.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                        <div className="flex items-center gap-1 select-text">
                          <Briefcase className="h-3.5 w-3.5" />
                          <span>{job.company_name}</span>
                        </div>
                        <div className="flex items-center gap-1 select-text">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Created {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer select-none"
                    >
                      View Details
                    </Link>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl py-12 text-slate-400 text-center p-4">
                  <Briefcase className="h-8 w-8 mb-2 text-slate-300" />
                  <p className="text-sm font-semibold">No postings found</p>
                  <p className="text-xs mt-1 text-slate-400 max-w-sm">
                    {filterStatus === "all"
                      ? "Create your first job posting to begin managing JDs and social content."
                      : `No job openings are currently matching the filtered status: ${filterStatus.replace("_", " ")}`}
                  </p>
                </div>
              )}
            </div>

          </main>
        </div>
      </div>

      {/* Creation Modal */}
      <CreateJobModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchJobs}
      />
    </div>
  );
}
