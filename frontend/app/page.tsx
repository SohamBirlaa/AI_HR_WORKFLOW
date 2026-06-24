"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Calendar, MapPin, Search, ArrowRight, LogIn, AlertCircle } from "lucide-react";
import api from "@/lib/api";

// Job interface matching the backend schema
interface Job {
  id: number;
  title: string;
  company_name: string;
  company_details: string | null;
  polished_jd: string | null;
  created_at: string;
}

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Load published job vacancies from the public endpoint upon mount
  // No auth headers are required, ensuring candidate flows remain unauthenticated
  useEffect(() => {
    const fetchPublicJobs = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const response = await api.get<Job[]>("/public/jobs");
        setJobs(response.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error("Error loading open jobs:", err);
        setErrorMsg(
          err.response?.data?.detail || 
          "Failed to load open job vacancies. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPublicJobs();
  }, []);

  // Filter open vacancies client-side based on job title, company name, or description query
  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.company_name.toLowerCase().includes(query) ||
      (job.polished_jd && job.polished_jd.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Sticky Header with Modern Glassmorphism */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo area */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                A
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
                Antigravity HR
              </span>
            </div>

            {/* Recruiter Access CTA */}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 px-4 py-2 text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer select-none hover:text-slate-950"
            >
              <LogIn className="h-3.5 w-3.5 text-indigo-500" />
              <span>HR Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner Section using a sleek dark-themed gradient background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-20 text-white">
        {/* Abstract background glowing shapes */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 border border-indigo-400/20">
            Now Hiring Active Talents
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
            Discover Your Next Career Breakthrough
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto font-medium leading-relaxed">
            Browse our open positions, review detailed requirements, and submit your candidate profile to join our teams.
          </p>
          <div className="pt-4">
            <a
              href="#open-vacancies"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl px-6 py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <span>Explore Vacancies</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Main Container Section */}
      <main id="open-vacancies" className="flex-1 mx-auto max-w-5xl w-full px-4 py-16 sm:px-6 lg:px-8 space-y-8">
        
        {/* Browse Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Browse Open Jobs
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Explore job openings and apply directly. No registration required.
            </p>
          </div>

          {/* Search Input Container */}
          <div className="relative w-full md:w-80">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-950 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm shadow-xs transition-all"
              placeholder="Search roles or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Loading Skeletons for Rich User Experience */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="space-y-2.5 w-2/3">
                    <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-4 bg-slate-100 rounded-md w-1/2" />
                  </div>
                  <div className="h-4 bg-slate-200 rounded-md w-20" />
                </div>
                <div className="h-4 bg-slate-100 rounded-md w-5/6" />
                <div className="flex gap-2 pt-2 justify-end">
                  <div className="h-9 bg-slate-200 rounded-lg w-24" />
                  <div className="h-9 bg-slate-200 rounded-lg w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          // Error Message Display
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-8 rounded-2xl text-center max-w-xl mx-auto space-y-3">
            <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold">Unable to Fetch Jobs</h3>
            <p className="text-xs text-rose-600 font-medium leading-relaxed">{errorMsg}</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          // Vacancies List
          <div className="grid grid-cols-1 gap-4.5">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="group flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-slate-200/80 rounded-2xl p-6 hover:border-indigo-200 hover:shadow-md transition-all duration-300 gap-6"
              >
                <div className="space-y-3.5 flex-1">
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      <span>{job.company_name}</span>
                    </div>
                  </div>

                  {/* Company Details Field - short overview */}
                  {job.company_details && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 max-w-2xl">
                      {job.company_details}
                    </p>
                  )}

                  {/* Location and Metadata Tags */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>Remote / Hybrid</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex items-center gap-2.5 md:flex-col md:items-stretch justify-end min-w-[130px]">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer select-none text-center"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/jobs/${job.id}/apply`}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-xs font-bold tracking-wide transition-all shadow-xs hover:shadow-md cursor-pointer select-none text-center"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center bg-white border border-slate-200/80 rounded-2xl py-24 text-slate-400 text-center px-4 shadow-xs">
            <Briefcase className="h-12 w-12 mb-4.5 text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No Job Openings Listed</h3>
            <p className="text-xs mt-1.5 text-slate-500 max-w-sm leading-relaxed">
              We don&apos;t have any published openings right now. Check back soon or search with different keywords.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-400 font-medium">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Antigravity HR Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}


