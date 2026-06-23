"use client";

import React, { use, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  Globe, 
  Share2, 
  Building2, 
  FileText,
  AlertCircle,
  Clock,
  User
} from "lucide-react";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import SocialAssetCard from "@/components/SocialAssetCard";
import BrandedVisualPreview from "@/components/BrandedVisualPreview";

interface Job {
  id: number;
  title: string;
  company_name: string;
  company_details: string | null;
  raw_jd: string;
  polished_jd: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PlatformContent {
  caption: string;
  suggested_communities: string[];
}

interface SocialContentBundle {
  job_id: number;
  linkedin: PlatformContent;
  twitter: PlatformContent;
  facebook: PlatformContent;
  instagram: PlatformContent;
  visual_title: string;
  visual_company: string;
  visual_location: string;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobIdStr } = use(params);
  const jobId = parseInt(jobIdStr, 10);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<"overview" | "polished" | "social">("overview");
  const [socialContent, setSocialContent] = useState<SocialContentBundle | null>(null);

  // Set mounted state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Redirect to login if user session is not found
  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router, mounted]);

  // Fetch the main job model properties and optionally fetch related social promotion assets
  const fetchJobDetails = useCallback(async () => {
    setLoadingJob(true);
    setErrorMsg(null);
    try {
      const response = await api.get<Job>(`/jobs/${jobId}`);
      setJob(response.data);
      
      // Auto switch tabs based on job status state: display polished tab directly if available
      if (response.data.polished_jd) {
        setActiveTab("polished");
      }

      // Fetch existing social content if approved or published
      const statusLower = response.data.status.toLowerCase();
      if (statusLower === "approved" || statusLower === "published") {
        try {
          const socialRes = await api.get<SocialContentBundle>(`/jobs/${jobId}/social-content`);
          setSocialContent(socialRes.data);
        } catch (socialErr) {
          console.log("No existing social content found:", socialErr);
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.detail || 
        "Failed to load job posting details from server."
      );
    } finally {
      setLoadingJob(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (mounted && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchJobDetails();
    }
  }, [user, fetchJobDetails, mounted]);

  // Execute workflow status operations: Approve, Reject, Publish, or Generate JD/Social assets.
  // Performs a POST request to the corresponding state machine endpoint on the backend.
  const handleWorkflowAction = async (action: "generate-jd" | "approve" | "reject" | "publish" | "generate-social-content") => {
    setActionLoading(action);
    setErrorMsg(null);
    try {
      if (action === "generate-social-content") {
        // Social assets have a unique route endpoint and returns a SocialContentBundle
        const response = await api.post<SocialContentBundle>(`/jobs/${jobId}/generate-social-content`);
        setSocialContent(response.data);
        setActiveTab("social");
      } else {
        // Status updates returns the updated Job object model
        const response = await api.post<Job>(`/jobs/${jobId}/${action}`);
        setJob(response.data);
        if (action === "generate-jd") {
          setActiveTab("polished");
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.detail || 
        `Operation failed: ${err.message}`
      );
    } finally {
      setActionLoading(null);
    }
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
    return null;
  }

  if (loadingJob) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          <p className="text-sm font-medium text-slate-500">Fetching job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Job Posting Not Found</h2>
          <p className="text-xs text-slate-500">
            The job opening you are trying to view does not exist or has been deleted.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const statusLower = job.status.toLowerCase();

  // Validate status transition rule helper constants
  const canGenerateJD = statusLower === "draft";
  const canReview = statusLower === "jd_generated";
  const canPublish = statusLower === "approved";
  const canGenerateSocial = statusLower === "approved" || statusLower === "published";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-slate-900 flex items-center justify-center text-white font-bold text-lg">H</div>
              <span className="text-lg font-semibold text-slate-900 tracking-tight">AI HR Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3.5 py-1.5 border border-slate-200">
                <User className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-medium text-slate-700">{user.email}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Back Link */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Openings</span>
        </Link>

        {/* Job Header Info */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between bg-white border border-slate-200 rounded-xl p-6 shadow-xs gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center flex-wrap gap-2.5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight select-text">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 select-text">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span>{job.company_name}</span>
            </div>
          </div>

          {/* Workflow Action Bar */}
          <div className="flex flex-wrap gap-2 items-center">
            
            {/* Generate JD */}
            <button
              onClick={() => handleWorkflowAction("generate-jd")}
              disabled={!canGenerateJD || !!actionLoading}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide transition-all border cursor-pointer select-none ${
                canGenerateJD
                  ? "bg-slate-900 hover:bg-slate-800 text-white border-transparent shadow-xs hover:shadow-md"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}
            >
              {actionLoading === "generate-jd" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span>{actionLoading === "generate-jd" ? "Polishing..." : "Generate JD"}</span>
            </button>

            {/* Approve */}
            <button
              onClick={() => handleWorkflowAction("approve")}
              disabled={!canReview || !!actionLoading}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide transition-all border cursor-pointer select-none ${
                canReview
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-xs hover:shadow-md"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}
            >
              {actionLoading === "approve" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle className="h-3.5 w-3.5" />
              )}
              <span>{actionLoading === "approve" ? "Approving..." : "Approve"}</span>
            </button>

            {/* Reject */}
            <button
              onClick={() => handleWorkflowAction("reject")}
              disabled={!canReview || !!actionLoading}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide transition-all border cursor-pointer select-none ${
                canReview
                  ? "bg-rose-600 hover:bg-rose-700 text-white border-transparent shadow-xs hover:shadow-md"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}
            >
              {actionLoading === "reject" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              <span>{actionLoading === "reject" ? "Rejecting..." : "Reject"}</span>
            </button>

            {/* Publish */}
            <button
              onClick={() => handleWorkflowAction("publish")}
              disabled={!canPublish || !!actionLoading}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide transition-all border cursor-pointer select-none ${
                canPublish
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs hover:shadow-md"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}
            >
              {actionLoading === "publish" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Globe className="h-3.5 w-3.5" />
              )}
              <span>{actionLoading === "publish" ? "Publishing..." : "Publish Job"}</span>
            </button>

            {/* Generate Social Assets */}
            <button
              onClick={() => handleWorkflowAction("generate-social-content")}
              disabled={!canGenerateSocial || !!actionLoading}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide transition-all border cursor-pointer select-none ${
                canGenerateSocial
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-xs hover:shadow-md"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}
            >
              {actionLoading === "generate-social-content" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              <span>{actionLoading === "generate-social-content" ? "Generating..." : "Generate Social Content"}</span>
            </button>

          </div>
        </div>

        {/* Backend Error Banner */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold">Workflow Execution Error</h3>
              <p className="text-xs mt-1 text-rose-600 font-medium">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 gap-1 pb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "overview"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("polished")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "polished"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200"
            }`}
          >
            Polished JD (AI)
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "social"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200"
            }`}
          >
            Social Content
          </button>
        </div>

        {/* Tab Content Display Workspace */}
        <div className="min-h-[40vh]">
          
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                
                {/* Raw JD Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    <FileText className="h-4 w-4" />
                    <span>Raw Job Description Input</span>
                  </div>
                  <div className="text-slate-800 text-sm font-normal leading-relaxed whitespace-pre-wrap select-text">
                    {job.raw_jd}
                  </div>
                </div>

              </div>

              {/* Sidebar Config info card */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Campaign Metadata
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Company Name</span>
                      <span className="text-sm font-medium text-slate-800 select-text">{job.company_name}</span>
                    </div>

                    {job.company_details && (
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Company Details</span>
                        <span className="text-xs text-slate-600 block leading-normal select-text">{job.company_details}</span>
                      </div>
                    )}

                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Created Date</span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium select-text mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(job.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Last Modified</span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium select-text mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(job.updated_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Polished JD Tab */}
          {activeTab === "polished" && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
              {job.polished_jd ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>AI-Refined Structured Job Description</span>
                  </div>
                  <div className="text-slate-800 text-sm font-normal leading-relaxed whitespace-pre-wrap select-text leading-loose bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                    {job.polished_jd}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <Sparkles className="h-10 w-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-semibold text-slate-800">Job Description Not Polished Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    The raw description must be processed by the LLM system to structure sections and enforce word budget constraints.
                  </p>
                  {canGenerateJD && (
                    <button
                      onClick={() => handleWorkflowAction("generate-jd")}
                      disabled={!!actionLoading}
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      {actionLoading === "generate-jd" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      <span>{actionLoading === "generate-jd" ? "Processing..." : "Generate JD Now"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Social Content Tab */}
          {activeTab === "social" && (
            <div className="space-y-6">
              {socialContent ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left columns: Generated platform assets */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Share2 className="h-4 w-4 text-indigo-500" />
                      <span>Social Media Captions</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <SocialAssetCard
                        platform="linkedin"
                        caption={socialContent.linkedin.caption}
                        communities={socialContent.linkedin.suggested_communities}
                      />
                      <SocialAssetCard
                        platform="twitter"
                        caption={socialContent.twitter.caption}
                        communities={socialContent.twitter.suggested_communities}
                      />
                      <SocialAssetCard
                        platform="facebook"
                        caption={socialContent.facebook.caption}
                        communities={socialContent.facebook.suggested_communities}
                      />
                      <SocialAssetCard
                        platform="instagram"
                        caption={socialContent.instagram.caption}
                        communities={socialContent.instagram.suggested_communities}
                      />
                    </div>
                  </div>

                  {/* Right column: Mock Branded visual */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Globe className="h-4 w-4 text-emerald-500" />
                      <span>Branded Visual Card Template</span>
                    </div>
                    
                    <BrandedVisualPreview
                      title={socialContent.visual_title}
                      company={socialContent.visual_company}
                      location={socialContent.visual_location}
                    />

                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-[11px] text-slate-500 leading-normal">
                      <strong>Visual Branding Guidelines:</strong> This card shows the dynamic metadata variables compiled for visual layout layers. Use these values within marketing assets or graphics templates.
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
                  <Share2 className="h-10 w-10 text-slate-300 mx-auto" />
                  <h3 className="text-sm font-semibold text-slate-800">No Promotional Content Generated</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Promotional assets can only be generated for job openings that are approved or published.
                  </p>
                  {canGenerateSocial && (
                    <button
                      onClick={() => handleWorkflowAction("generate-social-content")}
                      disabled={!!actionLoading}
                      className="inline-flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      {actionLoading === "generate-social-content" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                      <span>{actionLoading === "generate-social-content" ? "Generating..." : "Generate Promotional Content"}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
