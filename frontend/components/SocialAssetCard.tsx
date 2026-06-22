import React, { useState } from "react";
import { Copy, Check, Users, MessageSquare } from "lucide-react";

interface SocialAssetCardProps {
  platform: "linkedin" | "twitter" | "facebook" | "instagram";
  caption: string;
  communities: string[];
}

export default function SocialAssetCard({ platform, caption, communities }: SocialAssetCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const getPlatformDetails = () => {
    switch (platform) {
      case "linkedin":
        return { name: "LinkedIn", color: "text-blue-700 bg-blue-50 border-blue-200" };
      case "twitter":
        return { name: "Twitter / X", color: "text-slate-900 bg-slate-50 border-slate-200" };
      case "facebook":
        return { name: "Facebook", color: "text-indigo-700 bg-indigo-50 border-indigo-200" };
      case "instagram":
        return { name: "Instagram", color: "text-pink-700 bg-pink-50 border-pink-200" };
    }
  };

  const { name, color } = getPlatformDetails();
  const charLimit = platform === "twitter" ? 280 : null;
  const isOverLimit = charLimit ? caption.length > charLimit : false;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${color}`}>
          {name}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Caption</span>
            </>
          )}
        </button>
      </div>

      {/* Caption Content */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Caption
        </label>
        <div className="bg-slate-50 rounded-lg p-3 text-slate-800 text-sm font-normal border border-slate-100 whitespace-pre-wrap leading-relaxed select-text">
          {caption}
        </div>
        {charLimit && (
          <div className="flex items-center justify-end text-xs font-medium">
            <span className={isOverLimit ? "text-rose-600 font-bold" : "text-slate-500"}>
              {caption.length} / {charLimit} chars
            </span>
          </div>
        )}
      </div>

      {/* Suggested Communities */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span>Recommended Communities (AI-Suggested & Unverified)</span>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {communities && communities.length > 0 ? (
            communities.map((comm, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 rounded-lg bg-amber-50/50 border border-amber-100 px-3 py-2 text-xs text-amber-800 font-medium select-text"
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span>{comm}</span>
              </div>
            ))
          ) : (
            <span className="text-slate-400 text-xs italic">No communities suggested</span>
          )}
        </div>
      </div>

    </div>
  );
}
