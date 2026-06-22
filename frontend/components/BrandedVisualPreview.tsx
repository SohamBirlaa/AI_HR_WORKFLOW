import React from "react";
import { MapPin, Briefcase, Building2 } from "lucide-react";

interface BrandedVisualPreviewProps {
  title: string;
  company: string;
  location: string;
}

export default function BrandedVisualPreview({ title, company, location }: BrandedVisualPreviewProps) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 text-white border border-slate-700 aspect-video flex flex-col justify-between shadow-md">
      
      {/* Decorative backdrop glow */}
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Top row */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-xs">
          <Building2 className="h-3.5 w-3.5 text-indigo-200" />
          <span className="text-xs font-semibold tracking-wide text-indigo-100 uppercase">{company}</span>
        </div>
        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
          We Are Hiring
        </div>
      </div>

      {/* Middle row */}
      <div className="my-auto z-10 space-y-2">
        <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight max-w-lg bg-clip-text text-transparent bg-linear-to-r from-white via-slate-100 to-indigo-100">
          {title}
        </h3>
        <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-300">
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
            <span>Full-Time</span>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 z-10 text-[10px] text-slate-400">
        <div>AI HR AUTOMATION PLATFORM</div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Apply Online</span>
        </div>
      </div>
    </div>
  );
}
