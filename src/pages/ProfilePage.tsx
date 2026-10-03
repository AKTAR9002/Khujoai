import React, { useState } from "react";
import { User, Check, LogOut, Lock } from "lucide-react";
import { PageRoute, UserProfile } from "../types/khujo";

interface ProfilePageProps {
  user: UserProfile | null;
  onUpdateProfile: (updated: UserProfile) => void;
  onLogout: () => void;
  onNavigate: (page: PageRoute) => void;
  onInstantDemoLogin: () => void;
  historyCount: number;
  savedCount: number;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  onUpdateProfile,
  onLogout,
  onNavigate,
  onInstantDemoLogin,
  historyCount,
  savedCount,
}) => {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [preferredLanguage, setPreferredLanguage] = useState<"bn" | "en">(
    user?.preferredLanguage || "bn"
  );
  const [detailLevel, setDetailLevel] = useState<"concise" | "balanced" | "detailed">(
    user?.detailLevel || "balanced"
  );
  const [voiceLanguage, setVoiceLanguage] = useState<"bn-BD" | "en-US">(
    user?.voiceLanguage || "bn-BD"
  );
  const [saveHistoryAutomatically, setSaveHistoryAutomatically] = useState<boolean>(
    user?.saveHistoryAutomatically ?? true
  );
  const [savedBanner, setSavedBanner] = useState(false);

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="p-8 rounded-2xl bg-white border border-slate-200/90 text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            প্রোফাইল পরিচালনা করতে লগইন করুন
          </h1>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            আপনার নাম, পছন্দের ভাষা, উত্তরের ধরন এবং ভয়েস সার্চ সেটিংস পরিবর্তন করতে লগইন করুন।
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
              এক ক্লিকে ডেমো প্রোফাইল খুলুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...user,
      name: name.trim() || user.name,
      email: email.trim() || user.email,
      preferredLanguage,
      detailLevel,
      voiceLanguage,
      saveHistoryAutomatically,
    });
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center text-xl font-bold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {user.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500 mt-0.5">
              <span>{user.email}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{historyCount}টি অনুসন্ধান</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{savedCount}টি সংরক্ষিত উত্তর</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors self-start sm:self-auto whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          <span>লগআউট করুন</span>
        </button>
      </div>

      <form
        onSubmit={handleSave}
        className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <span>প্রোফাইল ও সার্চ পছন্দসমূহ</span>
          </h2>
          {savedBanner && (
            <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-emerald-700">
              <Check className="w-4 h-4" />
              <span>পরিবর্তন সংরক্ষিত হয়েছে</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label
              htmlFor="prof-name"
              className="block text-sm font-semibold text-slate-800"
            >
              আপনার নাম
            </label>
            <input
              id="prof-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none text-base"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="prof-email"
              className="block text-sm font-semibold text-slate-800"
            >
              ইমেইল ঠিকানা
            </label>
            <input
              id="prof-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-slate-800">
              ডিফল্ট উত্তরের ভাষা
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreferredLanguage("bn")}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors ${
                  preferredLanguage === "bn"
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-semibold"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                বাংলা (Bengali)
              </button>
              <button
                type="button"
                onClick={() => setPreferredLanguage("en")}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors ${
                  preferredLanguage === "en"
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-semibold"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-sm font-semibold text-slate-800">
              ভয়েস সার্চের ভাষা (Voice Search)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVoiceLanguage("bn-BD")}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors ${
                  voiceLanguage === "bn-BD"
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-semibold"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                বাংলা (bn-BD)
              </button>
              <button
                type="button"
                onClick={() => setVoiceLanguage("en-US")}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors ${
                  voiceLanguage === "en-US"
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-semibold"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                English (en-US)
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <span className="block text-sm font-semibold text-slate-800">
            উত্তরের বিস্তারিত মাত্রা (Answer Detail Level)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: "concise", label: "সংক্ষিপ্ত ও সরাসরি (Concise)" },
              { id: "balanced", label: "ভারসাম্যপূর্ণ ও সহজ (Balanced)" },
              { id: "detailed", label: "বিস্তারিত ও ধাপে ধাপে (Detailed)" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDetailLevel(opt.id as any)}
                className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors ${
                  detailLevel === opt.id
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-semibold"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div>
            <p className="text-sm sm:text-base font-semibold text-slate-900">
              স্বয়ংক্রিয়ভাবে সার্চ হিস্ট্রি সংরক্ষণ করুন
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              প্রতিটি অনুসন্ধান আপনার সার্চ হিস্ট্রি পাতায় জমা থাকবে যাতে পরে খুঁজে পান।
            </p>
          </div>
          <input
            type="checkbox"
            checked={saveHistoryAutomatically}
            onChange={(e) => setSaveHistoryAutomatically(e.target.checked)}
            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer shrink-0"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold text-sm sm:text-base transition-all cursor-pointer"
          >
            প্রোফাইল সেভ করুন
          </button>
        </div>
      </form>
    </div>
  );
};
