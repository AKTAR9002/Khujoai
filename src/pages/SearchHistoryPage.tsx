import React, { useState } from "react";
import { Clock, Trash2, Search, ArrowUpRight, Lock } from "lucide-react";
import { PageRoute, SearchResultItem, UserProfile } from "../types/khujo";

interface SearchHistoryPageProps {
  user: UserProfile | null;
  history: SearchResultItem[];
  onSelectResult: (item: SearchResultItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearAllHistory: () => void;
  onNavigate: (page: PageRoute) => void;
  onInstantDemoLogin: () => void;
}

export const SearchHistoryPage: React.FC<SearchHistoryPageProps> = ({
  user,
  history,
  onSelectResult,
  onDeleteHistoryItem,
  onClearAllHistory,
  onNavigate,
  onInstantDemoLogin,
}) => {
  const [filterText, setFilterText] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "text" | "image" | "voice">("all");

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="p-8 rounded-2xl bg-white border border-slate-200/90 text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            সার্চ হিস্ট্রি দেখতে লগইন করুন
          </h1>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            গেস্ট ইউজার হিসেবে আপনি যেকোনো সময় লগইন ছাড়াই সার্চ করতে পারেন। তবে আপনার পূর্ববর্তী অনুসন্ধানের তালিকা সংরক্ষণ ও দেখতে অ্যাকাউন্টে প্রবেশ করুন।
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold text-sm sm:text-base"
            >
              লগইন করুন (Login)
            </button>
            <button
              type="button"
              onClick={onInstantDemoLogin}
              className="px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm sm:text-base border border-indigo-200"
            >
              এক ক্লিকে ডেমো অ্যাকাউন্টে দেখুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredHistory = history.filter((item) => {
    const matchesText =
      !filterText.trim() ||
      item.query.toLowerCase().includes(filterText.toLowerCase()) ||
      item.summary.toLowerCase().includes(filterText.toLowerCase());
    const matchesMode = modeFilter === "all" || item.searchMode === modeFilter;
    return matchesText && matchesMode;
  });

  const formatBengaliDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("bn-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-indigo-600" />
            <span>সার্চ হিস্ট্রি (Search History)</span>
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">
            আপনার পূর্ববর্তী অনুসন্ধানগুলো আবার দেখুন অথবা অপ্রয়োজনীয় হিস্ট্রি মুছে ফেলুন।
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearAllHistory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors self-start sm:self-auto whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            <span>সব হিস্ট্রি মুছুন</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="হিস্ট্রির ভেতরে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 focus:border-indigo-600 focus:outline-none text-sm sm:text-base"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start">
          {[
            { id: "all", label: "সব" },
            { id: "text", label: "লেখা" },
            { id: "image", label: "ছবি" },
            { id: "voice", label: "ভয়েস" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setModeFilter(tab.id as any)}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                modeFilter === tab.id
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
          <p className="text-lg font-semibold text-slate-800">
            কোনো সার্চ হিস্ট্রি পাওয়া যায়নি
          </p>
          <p className="text-sm text-slate-600">
            নতুন কোনো বিষয় সম্পর্কে জানতে হোমপেজে গিয়ে প্রশ্ন করুন।
          </p>
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
          >
            নতুন অনুসন্ধান করুন
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div
                onClick={() => onSelectResult(item)}
                className="space-y-1.5 cursor-pointer flex-1 min-w-0"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-medium text-indigo-600">
                    {item.category || "সাধারণ অনুসন্ধান"}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{formatBengaliDate(item.timestamp)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{item.sources.length}টি লিংক</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 hover:text-indigo-700 leading-snug">
                  {item.query}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 line-clamp-2">
                  {item.summary}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => onSelectResult(item)}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors whitespace-nowrap"
                >
                  <span>উত্তর দেখুন</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteHistoryItem(item.id)}
                  aria-label="হিস্ট্রি মুছে ফেলুন"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
