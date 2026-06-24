"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  Search, 
  ArrowRight, 
  LogIn, 
  AlertCircle, 
  Brain, 
  Code2, 
  FileText, 
  Sparkles, 
  Building2, 
  CheckCircle,
  Clock,
  Layers,
  GraduationCap,
  X
} from "lucide-react";
import api from "@/lib/api";

// Job interface matching the backend schema and potential future integrations
interface Job {
  id: number;
  title: string;
  company_name: string;
  company_details: string | null;
  polished_jd: string | null;
  created_at: string;
  salary?: string | null; // Supported for future schema enhancement
}

// Inline custom LinkedIn icon to avoid package dependency mismatch
const LinkedInIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// High-fidelity inline SVG illustrating the hiring pipeline
const HeroIllustration = () => (
  <svg className="w-full h-auto max-w-[440px] mx-auto select-none drop-shadow-xl animate-none" viewBox="0 0 440 340" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="440" y2="340" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
      </linearGradient>
      <linearGradient id="primaryGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
      <linearGradient id="emeraldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
      </radialGradient>
    </defs>
    
    {/* Glow Background effect */}
    <circle cx="220" cy="170" r="150" fill="url(#glowGrad)" />

    {/* Outer Dashboard Card Glass Frame */}
    <rect x="5" y="5" width="430" height="330" rx="20" fill="url(#bgGrad)" stroke="#334155" strokeWidth="1.5" />
    
    {/* Flow Stage 1: Resume Upload */}
    <g transform="translate(25, 30)">
      <rect width="105" height="65" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
      <text x="12" y="20" fill="#94a3b8" fontSize="9" fontWeight="bold" letterSpacing="0.05em">APPLICANT CV</text>
      <line x1="12" y1="33" x2="90" y2="33" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="41" x2="70" y2="41" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="49" x2="80" y2="49" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      <circle cx="90" cy="18" r="6" fill="#10b981" />
      <path d="M87 18l2 2 3-3" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </g>

    {/* Flow Stage 2: AI Match evaluation */}
    <g transform="translate(170, 30)">
      <rect width="110" height="65" rx="8" fill="#1e293b" stroke="#6366f1" strokeWidth="1.5" />
      <text x="12" y="20" fill="#a5b4fc" fontSize="9" fontWeight="bold" letterSpacing="0.05em">AI MATCH</text>
      <rect x="12" y="33" width="86" height="18" rx="9" fill="url(#primaryGrad)" />
      <text x="25" y="45" fill="white" fontSize="9" fontWeight="bold">94% score</text>
    </g>

    {/* Connector between Resume and AI Screening */}
    <path d="M130 62.5h40" stroke="#475569" strokeWidth="2" strokeDasharray="3 3" />

    {/* Flow Stage 3: Dynamic Integrity Verification Checks */}
    {/* GitHub card details */}
    <g transform="translate(90, 135)">
      <rect width="110" height="50" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />
      <path d="M18 20a4 4 0 0 1 6.8 2.8c0 1.6-.8 2.8-2 3.6" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
      <text x="32" y="22" fill="#cbd5e1" fontSize="9" fontWeight="bold">GitHub</text>
      <text x="32" y="34" fill="#10b981" fontSize="8" fontWeight="bold">CONSISTENT</text>
    </g>
    
    {/* LinkedIn manual verification card */}
    <g transform="translate(240, 135)">
      <rect width="110" height="50" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />
      <rect x="12" y="16" width="12" height="12" rx="2" fill="#0077b5" />
      <text x="16" y="25" fill="white" fontSize="8" fontWeight="bold">in</text>
      <text x="32" y="22" fill="#cbd5e1" fontSize="9" fontWeight="bold">LinkedIn</text>
      <text x="32" y="34" fill="#10b981" fontSize="8" fontWeight="bold">VERIFIED</text>
    </g>

    {/* Splitting connectors from AI score down to GitHub and LinkedIn checks */}
    <path d="M225 95v15M225 110H145v25M225 110h95v25" stroke="#6366f1" strokeWidth="1.5" />

    {/* Re-converging connectors from Checks down to Decision card */}
    <path d="M145 185v15M340 185v15M145 200H220v25M340 200H220v25" stroke="#475569" strokeWidth="1.5" strokeDasharray="2 2" />

    {/* Flow Stage 4: Recruiter final assessment panel */}
    <g transform="translate(135, 225)">
      <rect width="170" height="75" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
      <text x="12" y="20" fill="#94a3b8" fontSize="8" fontWeight="bold" letterSpacing="0.05em">HR WORKFLOW</text>
      
      {/* Shortlist Action */}
      <rect x="12" y="35" width="68" height="26" rx="5" fill="url(#emeraldGrad)" />
      <text x="22" y="51" fill="white" fontSize="9" fontWeight="bold">Shortlist</text>
      
      {/* Reject Action */}
      <rect x="90" y="35" width="68" height="26" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <text x="108" y="51" fill="#64748b" fontSize="9" fontWeight="bold">Reject</text>
    </g>
  </svg>
);

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

  // Filter open vacancies client-side based on job title, company name, details, or location
  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase();
    
    const matchesTitle = job.title.toLowerCase().includes(query);
    const matchesCompany = job.company_name.toLowerCase().includes(query);
    const matchesDetails = job.company_details?.toLowerCase().includes(query) || false;
    const matchesJd = job.polished_jd?.toLowerCase().includes(query) || false;
    
    // Support location match keywords explicitly
    const matchesLocation = "remote/hybrid".includes(query) || "remote".includes(query) || "hybrid".includes(query);

    return matchesTitle || matchesCompany || matchesDetails || matchesJd || matchesLocation;
  });

  // Calculate dynamic stats from retrieved jobs list
  const totalPositions = jobs.length;
  const uniqueCompanies = new Set(jobs.map((job) => job.company_name)).size;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800 scroll-smooth">
      
      {/* Sticky Header with Modern Glassmorphism */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo area */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                AI
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
                AI HR Platform
              </span>
            </div>

            {/* Navigation links for smooth scrolling */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <a href="#open-vacancies" className="hover:text-indigo-600 transition-colors">Find Jobs</a>
              <a href="#hiring-pipeline" className="hover:text-indigo-600 transition-colors">How It Works</a>
              <a href="#why-us" className="hover:text-indigo-600 transition-colors">For Employers</a>
            </nav>

            {/* Recruiter Access CTA */}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white px-4 py-2 text-xs font-bold tracking-wide transition-all shadow-md cursor-pointer select-none hover:shadow-lg"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>HR Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner Section - Optimized padding & refined headline sizes */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 py-16 text-white border-b border-slate-900">
        {/* Glow vector bubbles */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Text column - responsive alignment */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 px-3 py-1 text-[11px] font-bold text-indigo-300 border border-indigo-400/25 tracking-wide">
                AI-Powered Hiring Platform
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto lg:mx-0 md:leading-tight">
                AI-Powered Recruitment for Modern Teams
              </h1>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Hire faster using AI-assisted resume screening, GitHub consistency analysis, automated job descriptions, and structured recruiter workflows.
              </p>
              
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="#open-vacancies"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl px-5 py-3 text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <span>Browse Jobs</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-xl px-5 py-3 text-xs font-bold transition-all"
                >
                  <LogIn className="h-3.5 w-3.5 text-indigo-400" />
                  <span>HR Login</span>
                </Link>
              </div>

              {/* Trust caption */}
              <span className="text-[11px] text-slate-400 mt-4 block font-semibold tracking-wide">
                No registration required for candidates.
              </span>
            </div>

            {/* Flowchart SVG column */}
            <div className="lg:col-span-5 w-full flex justify-center">
              <HeroIllustration />
            </div>

          </div>
        </div>
      </section>

      {/* Dynamic Platform Stats - Refined hierarchy & spacing */}
      <section className="relative -mt-10 z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-5 shadow-lg">
          
          {/* Stat 1: Open Positions */}
          <div className="flex flex-col items-center sm:items-start gap-3.5 p-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                {totalPositions}
              </div>
              <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Open Positions</div>
            </div>
          </div>

          {/* Stat 2: Published Jobs */}
          <div className="flex flex-col items-center sm:items-start gap-3.5 p-3 border-l border-slate-100 text-center sm:text-left">
            <div className="h-9 w-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-xs">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                {totalPositions}
              </div>
              <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Published Jobs</div>
            </div>
          </div>

          {/* Stat 3: Companies Hiring */}
          <div className="flex flex-col items-center sm:items-start gap-3.5 p-3 border-l border-slate-100 text-center sm:text-left">
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                {uniqueCompanies || 1}
              </div>
              <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Companies Hiring</div>
            </div>
          </div>

          {/* Stat 4: AI Screening */}
          <div className="flex flex-col items-center sm:items-start gap-3.5 p-3 border-l border-slate-100 text-center sm:text-left">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                Active
              </div>
              <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">AI Screening</div>
            </div>
          </div>

        </div>
      </section>

      {/* Hiring Pipeline Section - Snug spacing */}
      <section id="hiring-pipeline" className="mx-auto max-w-5xl w-full px-4 pt-16 pb-6 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-[10px] uppercase font-extrabold text-indigo-600 tracking-wider">Hiring Flow</span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Structured AI Hiring Pipeline</h2>
          <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
            From apply to final feedback, AI and recruiters work together transparently.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 relative">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-4.5 text-center space-y-2 shadow-xs relative">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5.5 h-5.5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">1</span>
            <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Candidate Applies</h3>
            <p className="text-[10px] text-slate-500 leading-normal font-medium">Submit resume, links & consent</p>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-4.5 text-center space-y-2 shadow-xs relative">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5.5 h-5.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">2</span>
            <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <Brain className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">AI Resume Screening</h3>
            <p className="text-[10px] text-slate-500 leading-normal font-medium">Evaluates Skills, Exp, & Education</p>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-4.5 text-center space-y-2 shadow-xs relative">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5.5 h-5.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">3</span>
            <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <Code2 className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">GitHub Analysis</h3>
            <p className="text-[10px] text-slate-500 leading-normal font-medium">Checks commits & language consistency</p>
          </div>

          {/* Step 4 */}
          <div className="bg-white border border-slate-200/60 rounded-xl p-4.5 text-center space-y-2 shadow-xs relative">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5.5 h-5.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">4</span>
            <div className="h-9 w-9 rounded-full bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <LinkedInIcon className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">LinkedIn Review</h3>
            <p className="text-[10px] text-slate-500 leading-normal font-medium">Recruiter logs manual assessment</p>
          </div>

          {/* Step 5 */}
          <div className="bg-white border border-slate-950 rounded-xl p-4.5 text-center space-y-2 shadow-xs relative">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5.5 h-5.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">5</span>
            <div className="h-9 w-9 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">HR Decision</h3>
            <p className="text-[10px] text-slate-500 leading-normal font-medium">Recruiter manually approves or rejects</p>
          </div>
        </div>
      </section>

      {/* Why Choose AI HR Platform Section */}
      <section id="why-us" className="bg-white border-y border-slate-200/60 py-16 mt-8">
        <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-1.5">
            <span className="text-[10px] uppercase font-extrabold text-indigo-600 tracking-wider">Features Grid</span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Why Choose AI HR Platform</h2>
            <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
              Automate high-volume sourcing and focus resources on recruiting the absolute best.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-5 space-y-3 hover:border-indigo-200 hover:bg-white transition-all duration-300 shadow-xs">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Brain className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">AI Resume Screening</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Advanced AI parses PDF/DOCX uploads to grade Skills, Experience, and Education (0-100) instantly.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-5 space-y-3 hover:border-indigo-200 hover:bg-white transition-all duration-300 shadow-xs">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Code2 className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">GitHub Consistency</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Analyzes commits and repos using public footprints to measure true capability against claimed profile skills.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-5 space-y-3 hover:border-indigo-200 hover:bg-white transition-all duration-300 shadow-xs">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <LinkedInIcon className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">LinkedIn Review</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Recruiters conduct structured assessments to log profile verification flags alongside AI scores.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50/50 border border-slate-200/50 rounded-xl p-5 space-y-3 hover:border-indigo-200 hover:bg-white transition-all duration-300 shadow-xs">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Automated JD Generation</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Quickly generates structured job descriptions matching constraints while staying strictly under an 800-word budget.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Browse Jobs Container Section */}
      <main id="open-vacancies" className="flex-1 mx-auto max-w-5xl w-full px-4 py-16 sm:px-6 lg:px-8 space-y-6">
        
        {/* Browse Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Explore Open Positions
            </h2>
            <p className="text-xs text-slate-500 font-semibold">
              Search and apply for roles that match your skills and interests.
            </p>
          </div>

          {/* Search Input Container - Refined animations and button controls */}
          <div className="relative w-full md:w-96">
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
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2].map((idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="space-y-2.5 w-2/3">
                    <div className="h-5 bg-slate-200 rounded-md w-3/4" />
                    <div className="h-4 bg-slate-100 rounded-md w-1/2" />
                  </div>
                  <div className="h-4 bg-slate-200 rounded-md w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6.5 rounded-xl text-center max-w-xl mx-auto space-y-2 shadow-xs">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <h3 className="text-xs font-bold">Unable to Fetch Jobs</h3>
            <p className="text-[11px] text-rose-600 font-medium leading-relaxed">{errorMsg}</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="group flex flex-col lg:flex-row lg:items-center lg:justify-between bg-white border border-slate-200/80 rounded-xl p-5 hover:border-indigo-500 hover:shadow-md transition-all duration-300 gap-5"
              >
                <div className="space-y-3 flex-1">
                  
                  {/* Job Header & Title details */}
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100/30 shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                        {job.title}
                      </h3>
                      <div className="text-[11px] font-bold text-slate-500">
                        {job.company_name}
                      </div>
                    </div>
                  </div>

                  {/* Company/JD Details - clamped to maximum 3 lines */}
                  {job.company_details && (
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3 select-text font-medium">
                      {job.company_details}
                    </p>
                  )}

                  {/* Metadata tags (chips): Remote, Full-Time, Exp, Posted Date */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/50 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>Remote / Hybrid</span>
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/50 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>Full-Time</span>
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/50 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      <GraduationCap className="h-3 w-3 text-slate-400" />
                      <span>Mid-Senior Level</span>
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200/50 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                    </span>
                    {/* Support salary display if payload is enriched in the future */}
                    {job.salary && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        <span>{job.salary}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action paths aligned on the right */}
                <div className="flex items-center gap-2 lg:flex-col lg:items-stretch justify-end min-w-[130px] border-t border-slate-100 lg:border-t-0 pt-3 lg:pt-0">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex-1 lg:flex-initial inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold tracking-wide transition-all shadow-xs cursor-pointer select-none text-center hover:border-slate-300"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/jobs/${job.id}/apply`}
                    className="flex-1 lg:flex-initial inline-flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 text-xs font-bold tracking-wide transition-all shadow-xs hover:shadow-md cursor-pointer select-none text-center"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Friendly empty state when search returns no matching postings
          <div className="flex flex-col items-center justify-center bg-white border border-slate-200/80 rounded-xl py-20 text-slate-400 text-center px-4 shadow-xs">
            <Briefcase className="h-10 w-10 mb-3 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-800">No vacancies match your search</h3>
            <p className="text-[11px] mt-1 text-slate-500 max-w-sm leading-relaxed">
              We couldn&apos;t find any open roles matching your query. Try resetting filters or using generic keywords.
            </p>
            <button 
              onClick={() => setSearchQuery("")}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Reset Search Filter
            </button>
          </div>
        )}
      </main>

      {/* SaaS Footer Section */}
      <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-12 mt-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-6 space-y-3">
              <span className="text-base font-bold text-white tracking-tight">AI HR Platform</span>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium">
                AI-powered recruitment platform built for modern hiring teams. Smart. Fast. Fair.
              </p>
            </div>
            
            <div className="md:col-span-6 grid grid-cols-3 gap-4">
              <div className="space-y-2.5">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Candidate</span>
                <ul className="space-y-1.5">
                  <li>
                    <a href="#open-vacancies" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">Browse Jobs</a>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-2.5">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Recruiters</span>
                <ul className="space-y-1.5">
                  <li>
                    <Link href="/login" className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">HR Login</Link>
                  </li>
                </ul>
              </div>

              <div className="space-y-2.5">
                <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-500">Company</span>
                <ul className="space-y-1.5 text-xs font-semibold text-slate-300">
                  <li>
                    <a href="#" className="hover:text-white transition-colors">About</a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">Contact</a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-900 pt-6 text-[10px] font-bold text-slate-500 gap-4 tracking-wide">
            <p>© 2026 AI HR Platform. All rights reserved.</p>
            <p>Built with FastAPI • Next.js • PostgreSQL • AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
