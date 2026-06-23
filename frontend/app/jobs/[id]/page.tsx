"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Calendar, MapPin, Building2, AlertCircle } from "lucide-react";
import api from "@/lib/api";

interface Job {
  id: number;
  title: string;
  company_name: string;
  company_details: string | null;
  polished_jd: string | null;
  created_at: string;
}

export default function PublicJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobIdStr } = use(params);
  const jobId = parseInt(jobIdStr, 10);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        // Query the public endpoint (which filters only published jobs)
        const response = await api.get<Job>(`/public/jobs/${jobId}`);
        setJob(response.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error(err);
        setErrorMsg(
          err.response?.data?.detail || 
          "Failed to load job posting details from the server."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchJobDetails();
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Fetching vacancy details...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !job) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Vacancy Not Found</h2>
          <p className="text-xs text-slate-500 leading-normal">
            The job posting you are trying to view does not exist, is no longer open for applications, or has been archived.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-3 text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer select-none"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Job Openings</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Logo block with standard indigo-600 background for visual branding */}
              <div className="h-8 w-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                C
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">Careers Portal</span>
            </div>
            <Link
              href="/jobs"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors"
            >
              Browse Openings
            </Link>
          </div>
        </div>
      </header>

      {/* Detail Wrapper */}
      <div className="flex-1 mx-auto max-w-4xl w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Back navigation */}
        <Link 
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Vacancies</span>
        </Link>

        {/* Job Header Info card */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs gap-6">
          <div className="space-y-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight select-text">{job.title}</h1>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 select-text">
                <Building2 className="h-4 w-4 text-slate-500" />
                <span>{job.company_name}</span>
              </div>
            </div>
            <div className="flex items-center flex-wrap gap-4 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-slate-500" />
                <span>Remote / Hybrid</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div>
            {/* Apply Now button navigating to job apply page */}
            <Link
              href={`/jobs/${job.id}/apply`}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 text-xs font-bold tracking-wide transition-all shadow-xs hover:shadow-md cursor-pointer select-none text-center w-full md:w-auto"
            >
              Apply Now
            </Link>
          </div>
        </div>

        {/* Job Body Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Polished JD content */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                Job Description
              </h3>
              {job.polished_jd ? (
                <div className="text-slate-800 text-sm font-normal leading-relaxed whitespace-pre-wrap select-text leading-loose">
                  {job.polished_jd}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No description details available.</p>
              )}
            </div>
          </div>

          {/* Sidebar Metadata */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                Company Overview
              </h3>
              
              <div className="space-y-3">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">Employer</span>
                  <span className="text-sm font-bold text-slate-800 select-text">{job.company_name}</span>
                </div>

                {job.company_details && (
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">About the Company</span>
                    {/* Increased contrast text class (slate-700) for standard accessibility compliance */}
                    <span className="text-xs text-slate-700 block leading-relaxed select-text">{job.company_details}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
