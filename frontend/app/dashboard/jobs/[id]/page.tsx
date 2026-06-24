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

interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  linkedin_url?: string;
  github_url?: string;
  created_at: string;
  updated_at: string;
}

interface Application {
  id: number;
  candidate_id: number;
  job_id: number;
  resume_storage_key: string;
  consent_given: boolean;
  status: string;
  applied_at: string;
  updated_at: string;
  candidate: Candidate;
  resume_download_url?: string;
}

interface ScreeningResult {
  id: number;
  application_id: number;
  status: "pending" | "processing" | "completed" | "failed";
  skills_score: number | null;
  experience_score: number | null;
  education_score: number | null;
  overall_score: number | null;
  reasoning: string | null;
  strengths: string[] | null;
  concerns: string[] | null;
  linkedin_manual_score: number | null;
  linkedin_notes: string | null;
  linkedin_status: string;
  github_consistency_score: number | null;
  github_reasoning: string | null;
  github_status: string;
  created_at: string;
  updated_at: string;
}

interface CombinedScore {
  application_id: number;
  cv_score: number | null;
  github_score: number | null;
  linkedin_score: number | null;
  cv_contribution: number;
  github_contribution: number;
  linkedin_contribution: number;
  combined_score: number | null;
  original_weights: { [key: string]: number };
  effective_weights: { [key: string]: number };
  missing_components: string[];
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

  const [activeTab, setActiveTab] = useState<"overview" | "polished" | "social" | "applications">("overview");
  const [socialContent, setSocialContent] = useState<SocialContentBundle | null>(null);

  // Candidate review dashboard states
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  // AI Resume screening states
  const [screening, setScreening] = useState<ScreeningResult | null>(null);
  const [loadingScreening, setLoadingScreening] = useState(false);
  const [screeningError, setScreeningError] = useState<string | null>(null);

  // Combined matching states
  const [combinedScore, setCombinedScore] = useState<CombinedScore | null>(null);
  const [loadingCombined, setLoadingCombined] = useState(false);
  const [combinedError, setCombinedError] = useState<string | null>(null);

  // LinkedIn manual assessment input states
  const [linkedinScoreInput, setLinkedinScoreInput] = useState<number | "">("");
  const [linkedinStatusInput, setLinkedinStatusInput] = useState<string>("unchecked");
  const [linkedinNotesInput, setLinkedinNotesInput] = useState<string>("");
  const [savingLinkedin, setSavingLinkedin] = useState(false);

  // GitHub check execution state
  const [runningGithubCheck, setRunningGithubCheck] = useState(false);

  // Fetch applications list from database via the protected endpoint
  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    setAppsError(null);
    try {
      const response = await api.get<Application[]>(`/jobs/${jobId}/applications`);
      setApplications(response.data);
      if (response.data.length > 0) {
        setSelectedAppId(response.data[0].id);
      } else {
        setSelectedAppId(null);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setAppsError(
        err.response?.data?.detail || "Failed to load candidate applications."
      );
    } finally {
      setLoadingApps(false);
    }
  }, [jobId]);

  // Fetch the AI Screening results for the selected application
  const fetchScreeningResult = useCallback(async (appId: number) => {
    setLoadingScreening(true);
    setScreeningError(null);
    try {
      const response = await api.get<ScreeningResult>(`/applications/${appId}/screening`);
      setScreening(response.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setScreening(null);
      setScreeningError(
        err.response?.data?.detail || "Failed to retrieve screening data."
      );
    } finally {
      setLoadingScreening(false);
    }
  }, []);

  // Fetch combined score details for the selected application
  const fetchCombinedScore = useCallback(async (appId: number) => {
    setLoadingCombined(true);
    setCombinedError(null);
    try {
      const response = await api.get<CombinedScore>(`/applications/${appId}/combined-score`);
      setCombinedScore(response.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setCombinedScore(null);
      setCombinedError(
        err.response?.data?.detail || "Failed to retrieve combined score breakdown."
      );
    } finally {
      setLoadingCombined(false);
    }
  }, []);

  // Recruiter triggers GitHub check manually
  const triggerGithubCheck = useCallback(async (appId: number) => {
    setRunningGithubCheck(true);
    try {
      const response = await api.post<ScreeningResult>(`/applications/${appId}/github-check`);
      setScreening(response.data);
      // Recalculate combined score immediately
      await fetchCombinedScore(appId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      alert(
        err.response?.data?.detail || "Failed to execute GitHub consistency check."
      );
    } finally {
      setRunningGithubCheck(false);
    }
  }, [fetchCombinedScore]);

  /* eslint-disable react-hooks/set-state-in-effect */
  // Fetch screening results when a new candidate is selected or tab is switched
  useEffect(() => {
    if (selectedAppId && activeTab === "applications" && mounted && user) {
      fetchScreeningResult(selectedAppId);
      fetchCombinedScore(selectedAppId);
    } else {
      setScreening(null);
      setScreeningError(null);
      setCombinedScore(null);
      setCombinedError(null);
    }
  }, [selectedAppId, activeTab, mounted, user, fetchScreeningResult, fetchCombinedScore]);

  // Synchronize LinkedIn manual evaluation form states when candidate details load
  useEffect(() => {
    if (screening) {
      setLinkedinScoreInput(screening.linkedin_manual_score !== null ? screening.linkedin_manual_score : "");
      setLinkedinStatusInput(screening.linkedin_status || "unchecked");
      setLinkedinNotesInput(screening.linkedin_notes || "");
    } else {
      setLinkedinScoreInput("");
      setLinkedinStatusInput("unchecked");
      setLinkedinNotesInput("");
    }
  }, [screening]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Save the HR manual LinkedIn assessment inputs
  const handleSaveLinkedinAssessment = async () => {
    if (!selectedAppId) return;
    setSavingLinkedin(true);
    setErrorMsg(null);
    try {
      const score = linkedinScoreInput === "" ? null : Number(linkedinScoreInput);
      const payload = {
        linkedin_manual_score: score,
        linkedin_notes: linkedinNotesInput,
        linkedin_status: linkedinStatusInput
      };
      await api.put(`/applications/${selectedAppId}/linkedin-assessment`, payload);
      // Re-fetch screening result and combined score to refresh the screen
      await fetchScreeningResult(selectedAppId);
      await fetchCombinedScore(selectedAppId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.detail || "Failed to save LinkedIn manual assessment."
      );
    } finally {
      setSavingLinkedin(false);
    }
  };

  // Load applications whenever Applications tab becomes active
  useEffect(() => {
    if (activeTab === "applications" && mounted && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchApplications();
    }
  }, [activeTab, fetchApplications, mounted, user]);


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
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide transition-all border cursor-pointer select-none ${canGenerateJD
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
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide transition-all border cursor-pointer select-none ${canReview
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
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide transition-all border cursor-pointer select-none ${canReview
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
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide transition-all border cursor-pointer select-none ${canPublish
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
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold tracking-wide transition-all border cursor-pointer select-none ${canGenerateSocial
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
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === "overview"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("polished")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === "polished"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
              }`}
          >
            Polished JD (AI)
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === "social"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
              }`}
          >
            Social Content
          </button>
          <button
            onClick={() => setActiveTab("applications")}
            className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === "applications"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
              }`}
          >
            Applications
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
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2">
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
                      <span className="block text-[10px] uppercase font-medium text-slate-600">Company Name</span>
                      <span className="text-sm font-medium text-slate-800 select-text">{job.company_name}</span>
                    </div>

                    {job.company_details && (
                      <div>
                        <span className="block text-[10px] uppercase font-medium text-slate-600">Company Details</span>
                        <span className="text-xs text-slate-600 block leading-normal select-text">{job.company_details}</span>
                      </div>
                    )}

                    <div>
                      <span className="block text-[10px] uppercase font-medium text-slate-600">Created Date</span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium select-text mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>{new Date(job.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] uppercase font-medium text-slate-600">Last Modified</span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium select-text mt-0.5">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
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
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2">
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
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
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
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
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

          {/* Applications Tab */}
          {activeTab === "applications" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {loadingApps ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
                  <p className="text-sm font-medium text-slate-500">Loading submitted applications...</p>
                </div>
              ) : appsError ? (
                <div className="p-8 text-center space-y-2">
                  <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">Error Loading Applications</p>
                  <p className="text-xs text-rose-605 font-medium">{appsError}</p>
                </div>
              ) : applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center px-4">
                  <User className="h-10 w-10 mb-3 text-slate-300" />
                  <p className="text-base font-bold text-slate-800">No Applications Submitted</p>
                  <p className="text-xs mt-1 text-slate-500 max-w-sm">
                    No candidates have submitted applications for this job opening yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[500px]">
                  {/* Left Column: Applications List (2/5) */}
                  <div className="md:col-span-2 divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
                    {applications.map((app) => {
                      const isSelected = selectedAppId === app.id;
                      return (
                        <div
                          key={app.id}
                          onClick={() => setSelectedAppId(app.id)}
                          className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? "bg-slate-50 border-l-4 border-slate-900 pl-3" : ""
                            }`}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-sm font-bold text-slate-900 truncate">{app.candidate.name}</h4>
                              <span className="shrink-0 inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 capitalize">
                                {app.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">{app.candidate.email}</p>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                              <span>Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Candidate Detail View (3/5) */}
                  <div className="md:col-span-3 p-6 bg-slate-50/30 flex flex-col justify-between max-h-[600px] overflow-y-auto">
                    {(() => {
                      const selectedApp = applications.find((a) => a.id === selectedAppId);
                      if (!selectedApp) {
                        return (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
                            <User className="h-12 w-12 mb-2 text-slate-300" />
                            <p className="text-sm font-bold text-slate-800">Select a Candidate</p>
                            <p className="text-xs text-slate-500">Choose a candidate from the list to review their contact information, social links, and resume.</p>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-6">
                          {/* Candidate Header */}
                          <div className="border-b border-slate-200 pb-4 space-y-1">
                            <h3 className="text-lg font-extrabold text-slate-900 select-text">{selectedApp.candidate.name}</h3>
                            <p className="text-xs font-semibold text-slate-500">Application ID: {selectedApp.id}</p>
                          </div>

                          {/* Candidate Info Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <span className="block text-[10px] uppercase font-medium text-slate-600">Email Address</span>
                              <a href={`mailto:${selectedApp.candidate.email}`} className="text-sm font-semibold text-slate-800 hover:text-indigo-600 hover:underline select-text">
                                {selectedApp.candidate.email}
                              </a>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase font-medium text-slate-600">Phone Number</span>
                              <span className="text-sm font-semibold text-slate-800 select-text">
                                {selectedApp.candidate.phone}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase font-medium text-slate-600">Applied Date</span>
                              <span className="text-sm font-semibold text-slate-800 select-text">
                                {new Date(selectedApp.applied_at).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase font-medium text-slate-600">Consent Given</span>
                              <span className="text-sm font-semibold text-emerald-600 select-text">
                                Yes, Consent Agreed
                              </span>
                            </div>
                          </div>

                          {/* Social Profiles */}
                          <div className="space-y-2">
                            <span className="block text-[10px] uppercase font-medium text-slate-600">Professional Links</span>
                            <div className="flex flex-wrap gap-3">
                              {selectedApp.candidate.linkedin_url ? (
                                <a
                                  href={selectedApp.candidate.linkedin_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer select-none"
                                >
                                  LinkedIn
                                </a>
                              ) : (
                                <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 text-slate-500 px-3 py-2 text-xs font-medium cursor-not-allowed select-none">
                                  No LinkedIn Provided
                                </span>
                              )}
                              {selectedApp.candidate.github_url ? (
                                <a
                                  href={selectedApp.candidate.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer select-none"
                                >
                                  GitHub
                                </a>
                              ) : (
                                <span className="inline-flex items-center rounded-lg border border-slate-100 bg-slate-50 text-slate-500 px-3 py-2 text-xs font-medium cursor-not-allowed select-none">
                                  No GitHub Provided
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Dynamic Combined Match Index Card */}
                          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs select-text">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="block text-[10px] uppercase font-semibold text-slate-600">Combined Match Index</span>
                              <span className="inline-flex items-center gap-1 text-[9px] text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider select-none">
                                Advisory-Only
                              </span>
                            </div>

                            {loadingCombined ? (
                              <div className="flex items-center justify-center py-4 gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                <span className="text-xs text-slate-500 font-medium">Calculating dynamic match...</span>
                              </div>
                            ) : combinedError ? (
                              <p className="text-xs text-rose-500 font-medium">{combinedError}</p>
                            ) : combinedScore ? (
                              <div className="space-y-4">
                                <div className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                  <div className="h-16 w-16 rounded-full bg-slate-900 flex flex-col items-center justify-center text-white shrink-0 shadow-xs select-none">
                                    <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tight -mb-1">Score</span>
                                    <span className="text-lg font-black">{combinedScore.combined_score !== null ? `${combinedScore.combined_score}%` : "N/A"}</span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <h4 className="text-xs font-bold text-slate-800">Dynamic Matching Score</h4>
                                    <p className="text-[10px] text-slate-500 leading-normal font-medium">
                                      Weighted dynamic index representing the overall match across evaluated components.
                                    </p>
                                  </div>
                                </div>

                                {/* Contributions progress bars */}
                                <div className="space-y-3 pt-1">
                                  <span className="block text-[9px] uppercase font-semibold text-slate-600 tracking-wider">Contributions Summary</span>

                                  <div className="space-y-2.5">
                                    {/* CV Match */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                                        <span>CV Screening Score ({combinedScore.cv_score ?? "N/A"})</span>
                                        <span className="text-slate-500">
                                          {combinedScore.cv_contribution} pts / {Math.round(combinedScore.effective_weights.cv * 100)}% weight
                                        </span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-indigo-650 rounded-full transition-all duration-500"
                                          style={{ width: `${combinedScore.cv_score ?? 0}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* LinkedIn Manual */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                                        <span>LinkedIn manual check ({combinedScore.linkedin_score ?? "N/A"})</span>
                                        <span className="text-slate-500">
                                          {combinedScore.linkedin_contribution} pts / {Math.round(combinedScore.effective_weights.linkedin * 100)}% weight
                                        </span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                          style={{ width: `${combinedScore.linkedin_score ?? 0}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* GitHub Placeholder */}
                                    <div className="space-y-1">
                                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                                        <span>GitHub consistency check ({combinedScore.github_score ?? "N/A"})</span>
                                        <span className="text-slate-500">
                                          {combinedScore.github_contribution} pts / {Math.round(combinedScore.effective_weights.github * 100)}% weight
                                        </span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                          style={{ width: `${combinedScore.github_score ?? 0}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Component missing notifications */}
                                {combinedScore.missing_components.length > 0 && (
                                  <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-3 text-[10px] text-amber-800 space-y-1 leading-normal">
                                    <div className="font-bold flex items-center gap-1 select-none">
                                      <span>⚠</span> Excluded assessment parameters
                                    </div>
                                    <p className="font-medium">
                                      We redistribution weight away from: <span className="font-bold uppercase">{combinedScore.missing_components.join(", ")}</span> due to pending or unavailable evaluations. Missing checks do not lower the final rating index.
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-center">
                                <span className="text-xs text-slate-450 italic">Combined score calculation unavailable.</span>
                              </div>
                            )}
                          </div>

                          {/* LinkedIn Manual Assessment Form */}
                          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                              <span className="block text-[10px] uppercase font-semibold text-slate-600">LinkedIn manual evaluation</span>
                              <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-650 border border-slate-200 uppercase tracking-tight select-none">
                                HR Assessment
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                                  Manual Score (0 - 100)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  placeholder="Enter score 0-100"
                                  value={linkedinScoreInput}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "") {
                                      setLinkedinScoreInput("");
                                    } else {
                                      const num = Number(val);
                                      if (num >= 0 && num <= 100) {
                                        setLinkedinScoreInput(num);
                                      }
                                    }
                                  }}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-slate-500 focus:outline-hidden"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                                  Verification Status
                                </label>
                                <select
                                  value={linkedinStatusInput}
                                  onChange={(e) => setLinkedinStatusInput(e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-slate-500 focus:outline-hidden"
                                >
                                  <option value="unchecked">Unchecked</option>
                                  <option value="verified">Verified Profile</option>
                                  <option value="weak">Weak profile fit</option>
                                  <option value="red_flag">Red Flag</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                                Assessment Notes
                              </label>
                              <textarea
                                placeholder="HR observations, candidate endorsements, red flags, or background details..."
                                rows={3}
                                value={linkedinNotesInput}
                                onChange={(e) => setLinkedinNotesInput(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-500 focus:outline-hidden leading-relaxed"
                              />
                            </div>

                            <button
                              onClick={handleSaveLinkedinAssessment}
                              disabled={savingLinkedin}
                              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer select-none"
                            >
                              {savingLinkedin ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : null}
                              <span>{savingLinkedin ? "Saving..." : "Save LinkedIn Evaluation"}</span>
                            </button>
                          </div>                          {/* AI Resume Screening Section */}
                          <div className="border-t border-slate-200 pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="block text-[10px] uppercase font-semibold text-slate-600">AI Resume Screening</span>
                              {screening && (screening.status === "pending" || screening.status === "processing") && (
                                <button
                                  onClick={() => fetchScreeningResult(selectedApp.id)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-650 hover:text-indigo-850 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>Syncing...</span>
                                </button>
                              )}
                              {screening && (screening.status === "completed" || screening.status === "failed") && (
                                <button
                                  onClick={() => fetchScreeningResult(selectedApp.id)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                  Refresh
                                </button>
                              )}
                            </div>

                            {loadingScreening ? (
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                                <span className="text-xs text-slate-500 font-medium">Fetching screening results...</span>
                              </div>
                            ) : screeningError ? (
                              <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs text-rose-700 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-bold">Failed to load screening data</p>
                                  <p className="text-[11px] text-rose-600 font-medium mt-0.5">{screeningError}</p>
                                  <button
                                    onClick={() => fetchScreeningResult(selectedApp.id)}
                                    className="mt-2 text-[10px] font-bold uppercase text-rose-800 hover:underline cursor-pointer"
                                  >
                                    Try Again
                                  </button>
                                </div>
                              </div>
                            ) : screening ? (
                              <>
                                {(screening.status === "pending" || screening.status === "processing") && (
                                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex flex-col items-center justify-center text-center py-6 space-y-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                    <h4 className="text-xs font-bold text-indigo-900">Analysis In Progress</h4>
                                    <p className="text-[10px] text-indigo-650 max-w-xs leading-normal">
                                      The candidate&apos;s resume is currently being parsed and scored by the AI engine. This process runs in the background and takes up to 30 seconds.
                                    </p>
                                    <button
                                      onClick={() => fetchScreeningResult(selectedApp.id)}
                                      className="mt-1 inline-flex items-center gap-1 bg-white border border-indigo-200 text-indigo-700 rounded-lg px-3 py-1.5 text-[10px] font-bold shadow-xs hover:bg-indigo-50 transition-all cursor-pointer"
                                    >
                                      Check Status
                                    </button>
                                  </div>
                                )}

                                {screening.status === "failed" && (
                                  <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-rose-850">
                                      <XCircle className="h-4 w-4 text-rose-500" />
                                      <h4 className="text-xs font-bold">Screening Evaluation Failed</h4>
                                    </div>
                                    <p className="text-[11px] text-rose-650 leading-relaxed font-medium">
                                      {screening.reasoning || "The AI evaluation failed during text extraction or LLM completion."}
                                    </p>
                                    <button
                                      onClick={() => fetchScreeningResult(selectedApp.id)}
                                      className="inline-flex items-center gap-1 bg-white border border-rose-200 text-rose-700 rounded-lg px-3 py-1.5 text-[10px] font-bold shadow-xs hover:bg-rose-50 transition-all cursor-pointer"
                                    >
                                      Retry Check
                                    </button>
                                  </div>
                                )}

                                {screening.status === "completed" && (
                                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs select-text">

                                    {/* Score Header Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      <div className="bg-indigo-50/40 border border-indigo-100 rounded-lg p-2.5 text-center">
                                        <span className="block text-[9px] uppercase font-bold text-indigo-500">Overall Match</span>
                                        <span className="text-lg font-black text-indigo-700">{screening.overall_score}%</span>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-center">
                                        <span className="block text-[9px] uppercase font-semibold text-slate-600">Skills Score</span>
                                        <span className="text-base font-bold text-slate-800">{screening.skills_score}/100</span>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-center">
                                        <span className="block text-[9px] uppercase font-semibold text-slate-600">Experience</span>
                                        <span className="text-base font-bold text-slate-800">{screening.experience_score}/100</span>
                                      </div>
                                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-center">
                                        <span className="block text-[9px] uppercase font-semibold text-slate-600">Education</span>
                                        <span className="text-base font-bold text-slate-800">{screening.education_score}/100</span>
                                      </div>
                                    </div>

                                    {/* AI Reasoning Summary */}
                                    {screening.reasoning && (
                                      <div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                        <span className="block text-[9px] uppercase font-semibold text-slate-600">AI Evaluation Reasoning</span>
                                        <p className="text-[11px] text-slate-800 leading-relaxed font-normal">{screening.reasoning}</p>
                                      </div>
                                    )}

                                    {/* Strengths & Concerns Lists */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                      {/* Strengths */}
                                      <div className="space-y-1.5">
                                        <span className="block text-[9px] uppercase font-bold text-emerald-600">Strengths</span>
                                        {screening.strengths && screening.strengths.length > 0 ? (
                                          <ul className="space-y-1 text-[11px] text-slate-700">
                                            {screening.strengths.map((str, idx) => (
                                              <li key={idx} className="flex items-start gap-1.5">
                                                <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                                                <span>{str}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <span className="text-[10px] text-slate-500 block font-medium italic">No specific strengths listed.</span>
                                        )}
                                      </div>

                                      {/* Concerns */}
                                      <div className="space-y-1.5">
                                        <span className="block text-[9px] uppercase font-bold text-amber-600">Concerns (Advisory)</span>
                                        {screening.concerns && screening.concerns.length > 0 ? (
                                          <ul className="space-y-1 text-[11px] text-slate-700">
                                            {screening.concerns.map((con, idx) => (
                                              <li key={idx} className="flex items-start gap-1.5">
                                                <span className="text-amber-500 font-bold shrink-0 mt-0.5">⚠</span>
                                                <span>{con}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <span className="text-[10px] text-slate-500 block font-medium italic">No concerns identified.</span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="text-[10px] text-slate-500 leading-normal border-t border-slate-100 pt-2 flex items-center gap-1 justify-center">
                                      <span>ℹ</span>
                                      <span className="font-semibold italic">Screening results are advisory-only soft heuristics. All final decisions are manual.</span>
                                    </div>

                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-center gap-2">
                                <span className="text-xs text-slate-450 italic">No screening data found. Click Refresh to synchronize.</span>
                              </div>
                            )}
                          </div>

                          {/* GitHub Consistency Check Section */}
                          <div className="border-t border-slate-200 pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="block text-[10px] uppercase font-semibold text-slate-600">GitHub Consistency Check</span>
                              {screening && screening.github_status === "checked" && (
                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-250 uppercase tracking-tight select-none">
                                  Checked
                                </span>
                              )}
                              {screening && screening.github_status === "unavailable" && (
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-250 uppercase tracking-tight select-none">
                                  Unavailable
                                </span>
                              )}
                              {(!screening || screening.github_status === "not_checked") && (
                                <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-700 border border-slate-200 uppercase tracking-tight select-none">
                                  Not Checked
                                </span>
                              )}
                              {screening && screening.github_status === "processing" && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-700 border border-indigo-200 uppercase tracking-tight select-none">
                                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                  Analyzing...
                                </span>
                              )}
                            </div>

                            {runningGithubCheck ? (
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                <span className="text-xs text-slate-500 font-medium">Running GitHub consistency evaluation...</span>
                              </div>
                            ) : screening ? (
                              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-xs select-text">
                                {screening.github_status === "not_checked" && (
                                  <div className="flex flex-col items-center justify-center py-4 text-center space-y-2.5">
                                    <p className="text-xs text-slate-500 max-w-sm">
                                      The GitHub footprint check has not been run for this candidate yet.
                                    </p>
                                    <button
                                      onClick={() => triggerGithubCheck(selectedApp.id)}
                                      disabled={!selectedApp.candidate.github_url}
                                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer select-none"
                                    >
                                      <span>Run GitHub Consistency Check</span>
                                    </button>
                                    {!selectedApp.candidate.github_url && (
                                      <p className="text-[10px] text-amber-600 font-medium italic">
                                        Candidate did not provide a GitHub profile URL.
                                      </p>
                                    )}
                                  </div>
                                )}

                                {screening.github_status === "processing" && (
                                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                    <h4 className="text-xs font-bold text-indigo-900">Analysis In Progress</h4>
                                    <p className="text-[10px] text-indigo-650 max-w-xs leading-normal">
                                      We are fetching the candidate&apos;s repository lists, primary languages, and recent push events to analyze tech consistency.
                                    </p>
                                  </div>
                                )}

                                {screening.github_status === "unavailable" && (
                                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-700">Check Results Unavailable</span>
                                      <button
                                        onClick={() => triggerGithubCheck(selectedApp.id)}
                                        disabled={!selectedApp.candidate.github_url}
                                        className="text-[10px] text-indigo-650 hover:text-indigo-850 font-bold uppercase tracking-wider disabled:hidden cursor-pointer"
                                      >
                                        Re-run Check
                                      </button>
                                    </div>
                                    <p className="text-[11px] text-slate-605 leading-relaxed font-medium">
                                      {screening.github_reasoning || "Evaluation could not be performed for this candidate."}
                                    </p>
                                  </div>
                                )}

                                {screening.github_status === "checked" && (
                                  <div className="space-y-4">
                                    {/* Score Header Grid */}
                                    <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-emerald-600 flex flex-col items-center justify-center text-white shrink-0 shadow-xs select-none">
                                          <span className="text-[8px] font-bold text-emerald-100 uppercase tracking-tight -mb-0.5">Score</span>
                                          <span className="text-sm font-black">{screening.github_consistency_score}%</span>
                                        </div>
                                        <div>
                                          <h4 className="text-xs font-bold text-emerald-900">Consistency Rating</h4>
                                          <p className="text-[10px] text-emerald-600 font-medium">
                                            GitHub repositories and activity alignment with claimed skills.
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => triggerGithubCheck(selectedApp.id)}
                                        className="text-[10px] bg-white border border-emerald-250 text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer"
                                      >
                                        Re-run
                                      </button>
                                    </div>

                                    {/* GitHub Reasoning */}
                                    {screening.github_reasoning && (
                                      <div className="space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                        <span className="block text-[9px] uppercase font-semibold text-slate-600">GitHub Consistency Analysis</span>
                                        <p className="text-[11px] text-slate-800 leading-relaxed font-normal">{screening.github_reasoning}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-center">
                                <span className="text-xs text-slate-450 italic">No GitHub consistency data available.</span>
                              </div>
                            )}
                          </div>

                          {/* Resume Access Section */}
                          <div className="bg-slate-100/50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">

                              <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">Resume Attachment</h4>
                                <p className="text-[10px] text-slate-500 truncate max-w-[200px]">
                                  Key: {selectedApp.resume_storage_key}
                                </p>
                              </div>
                            </div>
                            <a
                              href={selectedApp.resume_download_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer select-none text-center"
                            >
                              Download Resume
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
