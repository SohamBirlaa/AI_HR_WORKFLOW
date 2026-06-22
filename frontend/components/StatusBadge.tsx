import React from "react";

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  let bgClass = "bg-slate-100 text-slate-700 border-slate-200";
  let text = status;

  switch (status.toLowerCase()) {
    case "draft":
      bgClass = "bg-slate-100 text-slate-700 border-slate-300";
      text = "Draft";
      break;
    case "jd_generated":
      bgClass = "bg-amber-50 text-amber-700 border-amber-200";
      text = "JD Generated";
      break;
    case "approved":
      bgClass = "bg-blue-50 text-blue-700 border-blue-200";
      text = "Approved";
      break;
    case "rejected":
      bgClass = "bg-rose-50 text-rose-700 border-rose-200";
      text = "Rejected";
      break;
    case "published":
      bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      text = "Published";
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${bgClass}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {text}
    </span>
  );
}
