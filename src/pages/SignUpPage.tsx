import React, { useState } from "react";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { PageRoute, UserProfile } from "../types/khujo";
import { KhujoLogo } from "../components/KhujoLogo";
import { registerUser } from "../services/storageService";

interface SignUpPageProps {
  onSignUpSuccess: (user: UserProfile) => void;
  onInstantDemoLogin: () => void;
  onNavigate: (page: PageRoute) => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onSignUpSuccess,
  onInstantDemoLogin,
  onNavigate,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<"bn" | "en">("bn");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("অনুগ্রহ করে আপনার নাম লিখুন।");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।");
      return;
    }
    if (password.length < 4) {
      setError("পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে।");
      return;
    }

    try {
      const profile = registerUser({
        name,
        email,
        password,
        preferredLanguage,
      });
      onSignUpSuccess(profile);
    } catch (err: any) {
      setError(err.message || "অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <KhujoLogo size="md" className="justify-center mb-2" />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            নতুন অ্যাকাউন্ট খুলুন (Sign Up)
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            আপনার সার্চ হিস্ট্রি সংরক্ষণ, প্রয়োজনীয় উত্তর বুকমার্ক এবং ভাষা পছন্দ কাস্টমাইজ করুন।
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="signup-name"
              className="block text-sm font-semibold text-slate-800"
            >
              আপনার নাম (Full Name)
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: তানভীর আহমেদ"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none text-base text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="signup-email"
              className="block text-sm font-semibold text-slate-800"
            >
              ইমেইল ঠিকানা (Email)
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none text-base text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="signup-password"
              className="block text-sm font-semibold text-slate-800"
            >
              পাসওয়ার্ড (Password)
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="কমপক্ষে ৪ অক্ষর"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none text-base text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-sm font-semibold text-slate-800">
              উত্তরের পছন্দের ভাষা
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPreferredLanguage("bn")}
                className={`py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
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
                className={`py-2 px-3 rounded-xl border text-sm font-medium transition-colors ${
                  preferredLanguage === "en"
                    ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-semibold"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                English
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>অ্যাকাউন্ট তৈরি করুন (Sign Up)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-2 text-sm text-slate-600">
          <p>
            ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
            <button
              type="button"
              onClick={() => onNavigate("login")}
              className="font-semibold text-indigo-600 hover:text-indigo-800"
            >
              লগইন করুন (Login)
            </button>
          </p>
          <p>
            <button
              type="button"
              onClick={onInstantDemoLogin}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              অথবা এক ক্লিকে ডেমো অ্যাকাউন্ট ব্যবহার করুন →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
