"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Loader2, UploadCloud, CheckCircle, FileText, AlertCircle, Building2 } from "lucide-react";
import api from "@/lib/api";

interface Job {
  id: number;
  title: string;
  company_name: string;
}

const applySchema = z.object({
  name: z.string().min(1, "Full name is required").max(255),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required").max(50),
  linkedin_url: z.string().optional().or(z.literal("")),
  github_url: z.string().optional().or(z.literal("")),
  consent_given: z.boolean().refine((val) => val === true, {
    message: "You must accept the consent checkbox to submit.",
  }),
});

type ApplyFields = z.infer<typeof applySchema>;

export default function JobApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobIdStr } = use(params);
  const jobId = parseInt(jobIdStr, 10);

  const [job, setJob] = useState<Job | null>(null);
  const [loadingJob, setLoadingJob] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Custom state for the file upload parameter
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
    const fetchJobInfo = async () => {
      setLoadingJob(true);
      setErrorMsg(null);
      try {
        const response = await api.get<Job>(`/public/jobs/${jobId}`);
        setJob(response.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        console.error(err);
        setErrorMsg("Failed to retrieve job details. This vacancy may not be accepting applications.");
      } finally {
        setLoadingJob(false);
      }
    };
    fetchJobInfo();
  }, [jobId]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyFields>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      consent_given: false
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = e.target.files;
    if (!files || files.length === 0) {
      setResumeFile(null);
      return;
    }

    const file = files[0];
    const extension = file.name.split(".").pop()?.toLowerCase();
    
    // Preliminary client-side validation
    if (extension !== "pdf" && extension !== "docx") {
      setFileError("Only PDF and DOCX resume files are accepted.");
      setResumeFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError("Maximum file upload size is 10 MB.");
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  };

  const onSubmit = async (data: ApplyFields) => {
    setErrorMsg(null);
    setFileError(null);
    setIsDuplicate(false);

    if (!resumeFile) {
      setFileError("Please upload your resume to complete your application.");
      return;
    }

    setIsSubmitting(true);
    
    // Prepare multipart form data payload
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("phone", data.phone);
    if (data.linkedin_url) formData.append("linkedin_url", data.linkedin_url);
    if (data.github_url) formData.append("github_url", data.github_url);
    formData.append("consent_given", data.consent_given ? "true" : "false");
    formData.append("resume", resumeFile);

    try {
      await api.post(`/apply/${jobId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSubmitSuccess(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.response?.status === 409) {
        setIsDuplicate(true);
        setErrorMsg(
          "You have already applied for this position. Our HR team will review your application."
        );
      } else {
        console.error(err);
        setIsDuplicate(false);
        setErrorMsg(
          err.response?.data?.detail || 
          "An unexpected error occurred during submission. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingJob) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading application form...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Job Posting Unavailable</h2>
          <p className="text-xs text-slate-500 leading-normal">
            Applications are currently closed for this position or the posting is no longer active.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-3 text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer select-none"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>View Open Openings</span>
          </Link>
        </div>
      </div>
    );
  }

  // Success view state
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 antialiased">
        <div className="max-w-md w-full text-center space-y-5 bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-md">
          <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Application Submitted Successfully</h2>
            <p className="text-sm text-slate-500 leading-normal select-text">
              Thank you for applying to the <strong>{job.title}</strong> position at <strong>{job.company_name}</strong>.
            </p>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Our recruitment team will review your credentials and get back to you shortly.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-3.5 text-xs font-bold tracking-wide transition-all shadow-xs hover:shadow-md cursor-pointer select-none w-full"
          >
            Return to Career Board
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Logo block with standard indigo-600 background for visual branding */}
              <div className="h-8 w-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                C
              </div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">Careers Portal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 mx-auto max-w-2xl w-full px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation */}
        <Link 
          href={`/jobs/${jobId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Vacancy Details</span>
        </Link>

        {/* Vacancy Title Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-1.5">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Application Form</span>
          <h1 className="text-xl font-extrabold text-slate-900 select-text">{job.title}</h1>
          {/* Increased contrast text-slate-700 for better employer metadata readability */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 select-text">
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
            <span>{job.company_name}</span>
          </div>
        </div>

        {/* Global Submit Errors/Info banner */}
        {errorMsg && (
          isDuplicate ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-start gap-3 select-text">
              <CheckCircle className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold">Application Already Submitted</h3>
                <p className="text-xs mt-1 text-blue-700 font-medium">{errorMsg}</p>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3 select-text">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold">Submission Error</h3>
                <p className="text-xs mt-1 text-rose-600 font-medium">{errorMsg}</p>
              </div>
            </div>
          )
        )}

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                className={`block w-full rounded-lg border border-slate-200 py-2.5 px-3.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-sm shadow-2xs ${
                  errors.name ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500" : ""
                }`}
                placeholder="Jane Doe"
                {...register("name")}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Grid for Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email Address */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className={`block w-full rounded-lg border border-slate-200 py-2.5 px-3.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-sm shadow-2xs ${
                    errors.email ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500" : ""
                  }`}
                  placeholder="jane.doe@example.com"
                  {...register("email")}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={`block w-full rounded-lg border border-slate-200 py-2.5 px-3.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-sm shadow-2xs ${
                    errors.phone ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500" : ""
                  }`}
                  placeholder="+1 (555) 019-2834"
                  {...register("phone")}
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{errors.phone.message}</p>
                )}
              </div>
            </div>

            {/* Grid for Social Profile URLs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* LinkedIn Profile */}
              <div>
                <label htmlFor="linkedin_url" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  LinkedIn URL
                </label>
                <input
                  id="linkedin_url"
                  type="url"
                  className="block w-full rounded-lg border border-slate-200 py-2.5 px-3.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-sm shadow-2xs"
                  placeholder="https://linkedin.com/in/janedoe"
                  {...register("linkedin_url")}
                  disabled={isSubmitting}
                />
              </div>

              {/* GitHub Profile */}
              <div>
                <label htmlFor="github_url" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  GitHub Profile URL
                </label>
                <input
                  id="github_url"
                  type="url"
                  className="block w-full rounded-lg border border-slate-200 py-2.5 px-3.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-sm shadow-2xs"
                  placeholder="https://github.com/janedoe"
                  {...register("github_url")}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Resume Upload File Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Upload Resume (PDF or DOCX only) <span className="text-rose-500">*</span>
              </label>
              
              <div className={`flex justify-center rounded-xl border border-dashed border-slate-300 px-6 py-6 transition-all hover:border-slate-400 bg-slate-50/50 ${isSubmitting ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                  <div className="flex justify-center text-xs text-slate-600 font-medium">
                    <label
                      htmlFor="resume-upload"
                      className="relative cursor-pointer rounded-md font-semibold text-indigo-600 focus-within:outline-hidden hover:text-indigo-700"
                    >
                      <span>Upload a file</span>
                      <input
                        id="resume-upload"
                        type="file"
                        accept=".pdf,.docx"
                        className="sr-only"
                        onChange={handleFileChange}
                        disabled={isSubmitting}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">PDF, DOCX up to 10MB</p>
                </div>
              </div>

              {/* Selected file card display */}
              {resumeFile && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <FileText className="h-5 w-5 text-indigo-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate select-text">{resumeFile.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}

              {fileError && (
                <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fileError}</span>
                </p>
              )}
            </div>

            {/* Consent Checkbox */}
            <div className="relative flex items-start pt-2">
              <div className="flex h-5 items-center">
                <input
                  id="consent_given"
                  type="checkbox"
                  className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  {...register("consent_given")}
                  disabled={isSubmitting}
                />
              </div>
              <div className="ml-3 text-xs leading-relaxed">
                <label htmlFor="consent_given" className="font-semibold text-slate-700 cursor-pointer">
                  Consent Agreement <span className="text-rose-500">*</span>
                </label>
                <p className="text-slate-400 font-medium select-text mt-0.5">
                  I consent to the collection, processing, and storage of my personal contact details and resume history by recruiters for evaluation purposes.
                </p>
                {errors.consent_given && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.consent_given.message}</p>
                )}
              </div>
            </div>

            {/* Form Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-3.5 text-xs font-bold tracking-wide transition-all shadow-xs hover:shadow-md cursor-pointer select-none disabled:bg-slate-400 disabled:shadow-none"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Application...
                  </span>
                ) : (
                  "Submit Application"
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
