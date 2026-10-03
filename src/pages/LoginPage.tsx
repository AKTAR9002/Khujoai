import React, { useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { PageRoute, UserProfile } from "../types/khujo";
import { KhujoLogo } from "../components/KhujoLogo";
import { loginUser } from "../services/storageService";

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onInstantDemoLogin: () => void;
  onNavigate: (page: PageRoute) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onInstantDemoLogin,
  onNavigate,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।");
      return;
    }
    if (password.length < 4) {
      setError("পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে।");
      return;
    }

    try {
      const profile = loginUser(email, password);
      onLoginSuccess(profile);
    } catch (err: any) {
      setError(err.message || "লগইন করতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <KhujoLogo size="md" className="justify-center mb-2" />
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            আপনার অ্যাকাউন্টে লগইন করুন
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            সার্চ হিস্ট্রি দেখতে এবং প্রয়োজনীয় উত্তর সংরক্ষণ করতে লগইন করুন।
            (মূল সার্চ ব্যবহারের জন্য লগইন বাধ্যতামূলক নয়)
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-indigo-950">
            <p className="font-semibold">দ্রুত পরীক্ষা করতে চান?</p>
            <p className="text-slate-600">এক ক্লিকে ডেমো অ্যাকাউন্টে প্রবেশ করুন</p>
          </div>
          <button
            type="button"
            onClick={onInstantDemoLogin}
            className="w-full sm:w-auto px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            ডেমো লগইন
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-sm font-semibold text-slate-800"
            >
              ইমেইল ঠিকানা (Email)
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                id="login-email"
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
              htmlFor="login-password"
              className="block text-sm font-semibold text-slate-800"
            >
              পাসওয়ার্ড (Password)
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none text-base text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>লগইন করুন (Login)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center space-y-2 text-sm text-slate-600">
          <p>
            এখনো অ্যাকাউন্ট নেই?{" "}
            <button
              type="button"
              onClick={() => onNavigate("signup")}
              className="font-semibold text-indigo-600 hover:text-indigo-800"
            >
              নতুন অ্যাকাউন্ট খুলুন (Sign Up)
            </button>
          </p>
          <p>
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              লগইন ছাড়াই সরাসরি সার্চে ফিরে যান →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
