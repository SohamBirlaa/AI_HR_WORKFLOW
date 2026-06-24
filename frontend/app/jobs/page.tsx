"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Briefcase, Calendar, MapPin, Search, X } from "lucide-react";
import api from "@/lib/api";

interface Job {
  id: number;
  title: string;
  company_name: string;
  company_details: string | null;
  polished_jd: string | null;
  created_at: string;
}

export default function PublicJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const fetchPublicJobs = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // Fetch only published job vacancies from the public router endpoint
        const response = await api.get<Job[]>("/public/jobs");
        setJobs(response.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error(err);
        setErrorMsg(
          err.response?.data?.detail || 
          "Failed to load job vacancies from the server."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPublicJobs();
  }, []);

  // Filter open vacancies client-side based on job title, company name, details, description, or badges
  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    
    const tokens = query.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return true;

    // Consolidate all searchable job fields and tags
    const searchableText = [
      job.title,
      job.company_name,
      job.company_details || "",
      job.polished_jd || "",
      "remote / hybrid",
      "full-time",
      "mid-senior level"
    ].join(" ").toLowerCase();

    // Verify that every search token is found in the consolidated searchable text
    return tokens.every((token) => searchableText.includes(token));
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Logo block with standard indigo-600 background for visual branding */}
              <div className="h-8 w-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                C
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                Careers Portal
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Apply Now
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <div className="bg-white border-b border-slate-200 py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Explore Open Vacancies
          </h1>
          <p className="text-sm font-medium text-slate-500 max-w-lg mx-auto">
            Join our teams and shape the future of technology. Browse our open positions below.
          </p>
        </div>
      </div>

      {/* Main Jobs Listing Container */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Search Filter Input Container */}
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-slate-950 placeholder-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none text-xs font-semibold shadow-xs transition-all"
            placeholder="Search by role, skill, company or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Loading and Error states */}
        {loading ? (
          <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl py-20 shadow-xs">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
            <span className="text-sm font-medium text-slate-500">Searching active job postings...</span>
          </div>
        ) : errorMsg ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl text-center space-y-2">
            <p className="text-sm font-semibold">Unable to Load Jobs</p>
            <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-all shadow-xs gap-4 hover:shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 leading-tight">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                      <span>{job.company_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-700">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span>Remote / Hybrid</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-stretch justify-end gap-2">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-5 py-3 text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer select-none text-center"
                  >
                    View Details
                  </Link>
                  {/* Apply Now button navigating directly to the specific job apply page */}
                  <Link
                    href={`/jobs/${job.id}/apply`}
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 text-xs font-bold tracking-wide transition-all shadow-xs hover:shadow-md cursor-pointer select-none text-center"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl py-20 text-slate-400 text-center px-4 shadow-xs">
            <Briefcase className="h-10 w-10 mb-3 text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">
              {searchQuery ? "No jobs match your search" : "No Job Openings Found"}
            </h3>
            <p className="text-xs mt-1 text-slate-500 max-w-sm leading-relaxed">
              {searchQuery 
                ? "We couldn't find any job openings matching your query. Try resetting filters or using generic keywords." 
                : "We don't have any published openings at the moment. Please check back later."}
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
