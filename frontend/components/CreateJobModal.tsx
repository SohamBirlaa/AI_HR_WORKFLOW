import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { X, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface JobFormValues {
  title: string;
  company_name: string;
  company_details: string;
  raw_jd: string;
}

export default function CreateJobModal({ isOpen, onClose, onSuccess }: CreateJobModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<JobFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const onSubmit = async (data: JobFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.post("/jobs", {
        title: data.title,
        company_name: data.company_name,
        company_details: data.company_details || null,
        raw_jd: data.raw_jd,
        status: "draft"
      });
      reset();
      onSuccess();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.detail || 
        "Failed to create job posting. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Create New Job Posting</h2>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Job Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Frontend Engineer"
                {...register("title", { required: "Job title is required" })}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white caret-slate-900 focus:outline-hidden focus:ring-2 transition-all ${
                  errors.title 
                    ? "border-rose-300 focus:ring-rose-200" 
                    : "border-slate-200 focus:border-slate-800 focus:ring-slate-100"
                }`}
              />
              {errors.title && (
                <span className="text-rose-600 text-xs mt-1 block">{errors.title.message}</span>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corporation"
                {...register("company_name", { required: "Company name is required" })}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white caret-slate-900 focus:outline-hidden focus:ring-2 transition-all ${
                  errors.company_name 
                    ? "border-rose-300 focus:ring-rose-200" 
                    : "border-slate-200 focus:border-slate-800 focus:ring-slate-100"
                }`}
              />
              {errors.company_name && (
                <span className="text-rose-600 text-xs mt-1 block">{errors.company_name.message}</span>
              )}
            </div>

            {/* Company Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company Details (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Brief details about the company culture, size, industry..."
                {...register("company_details")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white caret-slate-900 focus:outline-hidden focus:border-slate-800 focus:ring-2 focus:ring-slate-100 transition-all"
              />
            </div>

            {/* Raw Job Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Raw Job Description *
              </label>
              <textarea
                rows={5}
                placeholder="Paste the raw, unformatted job details, key requirements, or notes..."
                {...register("raw_jd", { required: "Raw job description is required" })}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white caret-slate-900 focus:outline-hidden focus:ring-2 transition-all ${
                  errors.raw_jd 
                    ? "border-rose-300 focus:ring-rose-200" 
                    : "border-slate-200 focus:border-slate-800 focus:ring-slate-100"
                }`}
              />
              {errors.raw_jd && (
                <span className="text-rose-600 text-xs mt-1 block">{errors.raw_jd.message}</span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Creating..." : "Create Job"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
