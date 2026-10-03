import React, { useState } from "react";
import {
  Bookmark,
  Trash2,
  ArrowUpRight,
  ExternalLink,
  Edit3,
  Check,
  Lock,
} from "lucide-react";
import {
  PageRoute,
  SavedAnswerItem,
  SearchResultItem,
  UserProfile,
} from "../types/khujo";

interface SavedAnswersPageProps {
  user: UserProfile | null;
  savedAnswers: SavedAnswerItem[];
  onSelectResult: (item: SearchResultItem) => void;
  onDeleteSaved: (savedId: string) => void;
  onUpdateNote: (savedId: string, note: string) => void;
  onNavigate: (page: PageRoute) => void;
  onInstantDemoLogin: () => void;
}

export const SavedAnswersPage: React.FC<SavedAnswersPageProps> = ({
  user,
  savedAnswers,
  onSelectResult,
  onDeleteSaved,
  onUpdateNote,
  onNavigate,
  onInstantDemoLogin,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="p-8 rounded-2xl bg-white border border-slate-200/90 text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            সংরক্ষিত উত্তর দেখতে লগইন করুন
          </h1>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            আপনার প্রয়োজনীয় উত্তর ও ওয়েবসাইট লিংকগুলো পরবর্তীতে দ্রুত খুঁজে পেতে অ্যাকাউন্টে প্রবেশ করুন।
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

  const startEditingNote = (item: SavedAnswerItem) => {
    setEditingId(item.id);
    setNoteDraft(item.personalNote || "");
  };

  const saveNote = (savedId: string) => {
    onUpdateNote(savedId, noteDraft.trim());
    setEditingId(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <Bookmark className="w-6 h-6 text-indigo-600" />
            <span>সংরক্ষিত উত্তর (Saved Answers)</span>
          </h1>
          <p className="mt-1 text-sm sm:text-base text-slate-600">
            আপনার বুকমার্ক করা গুরুত্বপূর্ণ উত্তর, নোট এবং যাচাইকৃত ওয়েব লিংকসমূহ।
          </p>
        </div>
        <span className="text-sm font-medium text-slate-500 tabular-nums">
          মোট সংরক্ষিত: {savedAnswers.length}টি
        </span>
      </div>

      {savedAnswers.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
          <p className="text-lg font-semibold text-slate-800">
            এখনো কোনো উত্তর সংরক্ষণ করা হয়নি
          </p>
          <p className="text-sm text-slate-600">
            যেকোনো প্রশ্নের উত্তরের নিচে থাকা “উত্তর সংরক্ষণ করুন” বাটনে ক্লিক করে এখানে যোগ করতে পারেন।
          </p>
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
          >
            প্রশ্ন খুঁজতে যান
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {savedAnswers.map((item) => (
            <div
              key={item.id}
              className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-indigo-600">
                      {item.result.category || "সংরক্ষিত উত্তর"}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {item.result.sources.length}টি তথ্যসূত্র
                    </span>
                  </div>
                  <h2
                    onClick={() => onSelectResult(item.result)}
                    className="text-xl font-bold text-slate-900 hover:text-indigo-700 cursor-pointer leading-snug"
                  >
                    {item.result.query}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectResult(item.result)}
                    className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors whitespace-nowrap"
                  >
                    <span>পূর্ণ উত্তর দেখুন</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSaved(item.id)}
                    aria-label="সংরক্ষিত উত্তর মুছে ফেলুন"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors whitespace-nowrap"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>মুছুন</span>
                  </button>
                </div>
              </div>

              <p className="text-base text-slate-700 leading-relaxed">
                {item.result.summary}
              </p>

              {item.result.sources.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">সূত্র:</span>
                  {item.result.sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
                    >
                      <span>{src.domain}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100">
                {editingId === item.id ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="এই উত্তরের সাথে আপনার ব্যক্তিগত নোট লিখুন..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-indigo-300 text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => saveNote(item.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs sm:text-sm font-semibold whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      <span>নোট সেভ করুন</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm text-slate-600">
                    <span>
                      {item.personalNote ? (
                        <>
                          <strong className="text-slate-800">আপনার নোট:</strong>{" "}
                          {item.personalNote}
                        </>
                      ) : (
                        <span className="text-slate-400">কোনো ব্যক্তিগত নোট যোগ করা হয়নি</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEditingNote(item)}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium whitespace-nowrap"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{item.personalNote ? "নোট সম্পাদনা" : "নোট যুক্ত করুন"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
