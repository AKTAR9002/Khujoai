import React from "react";
import { ArrowRight, ShieldCheck, Globe, Cpu } from "lucide-react";
import { PageRoute } from "../types/khujo";
import { KhujoLogo } from "../components/KhujoLogo";

interface AboutPageProps {
  onNavigate: (page: PageRoute) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
      <section className="space-y-4">
        <KhujoLogo size="md" className="mb-2" />
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
          সাধারণ সার্চে যা সহজে মেলে না, নিজের ভাষায় তার নির্ভরযোগ্য উত্তর দেয় KHUJO AI
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
          অনেক সময় সাধারণ সার্চ ইঞ্জিনে কোনো সমস্যার কথা লিখলে অসংখ্য ওয়েবসাইটের ভিড়ে আসল উত্তর খুঁজে পাওয়া কঠিন হয়ে পড়ে। বিশেষ করে বাংলা ভাষায় কারিগরি সমস্যা, ছবির মাধ্যমে কিছু চেনা বা জটিল বিষয়ের সহজ ব্যাখ্যা পেতে ব্যবহারকারীদের ভোগান্তি পোহাতে হয়। এই সমস্যার সমাধানেই তৈরি হয়েছে KHUJO AI।
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          KHUJO AI কীভাবে কাজ করে?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2">
            <p className="text-sm font-semibold text-indigo-600 tabular-nums">
              ০১. প্রশ্নের আসল অর্থ বোঝা
            </p>
            <h3 className="text-lg font-bold text-slate-900">
              নিজের ভাষায় প্রশ্ন করার স্বাধীনতা
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              আপনি কথ্য বাংলা, শুদ্ধ বাংলা বা ইংরেজিতে যেভাবেই প্রশ্ন করুন না কেন, KHUJO AI প্রথমে আপনার প্রশ্নের মূল উদ্দেশ্য শনাক্ত করে।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2">
            <p className="text-sm font-semibold text-indigo-600 tabular-nums">
              ০২. তাৎক্ষণিক ওয়েব অনুসন্ধান
            </p>
            <h3 className="text-lg font-bold text-slate-900">
              সাম্প্রতিক ও বাহ্যিক তথ্যের সমন্বয়
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              যখন সাম্প্রতিক তথ্য বা সরকারি নিয়মকানুন জানার প্রয়োজন হয়, তখন KHUJO AI সরাসরি ওয়েব সার্চ থেকে তথ্য সংগ্রহ করে।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2">
            <p className="text-sm font-semibold text-indigo-600 tabular-nums">
              ০৩. সহজ সারসংক্ষেপ ও উৎস লিংক
            </p>
            <h3 className="text-lg font-bold text-slate-900">
              যাচাইকৃত ওয়েবসাইটের সরাসরি লিংক
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              লম্বা ও জটিল লেখাকে সহজ পয়েন্ট আকারে সাজিয়ে দেওয়ার পাশাপাশি প্রতিটি উত্তরের নিচে মূল ওয়েবসাইটের লিংক যুক্ত থাকে।
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-2">
            <p className="text-sm font-semibold text-indigo-600 tabular-nums">
              ০৪. শতভাগ সততা ও নির্ভরযোগ্যতা
            </p>
            <h3 className="text-lg font-bold text-slate-900">
              কোনো কাল্পনিক তথ্য তৈরি করা হয় না
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              কোনো বিষয়ে নির্ভরযোগ্য তথ্য না পাওয়া গেলে KHUJO AI কখনো মনগড়া উত্তর দেয় না, বরং স্পষ্টভাবে জানিয়ে দেয় যে প্রমাণিত তথ্য পাওয়া যায়নি।
            </p>
          </div>
        </div>
      </section>

      <section className="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
        <div className="flex items-center gap-2.5 text-indigo-700 font-semibold text-sm">
          <Cpu className="w-5 h-5" />
          <span>Modular AI & Web Search Architecture</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          ভবিষ্যৎমুখী ও সংযোগযোগ্য এপিআই কাঠামো
        </h2>
        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
          KHUJO AI এমনভাবে তৈরি করা হয়েছে যাতে ওয়েবসাইটের ডিজাইন পরিবর্তন না করেই যেকোনো উন্নত AI Model API এবং Web Search API যুক্ত বা পরিবর্তন করা যায়। বর্তমানে এটি সার্ভার-সাইড এআই ও লাইভ ওয়েব সার্চ গ্রাউন্ডিংয়ের সাথে সংযুক্ত।
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200">
            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>Web Search Grounding</span>
            </p>
            <p className="text-slate-600 mt-1">
              `POST /api/search` রিয়েল-টাইম ওয়েব তথ্যসূত্র ও সাইটেশন এক্সট্রাক্ট করে।
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-slate-200">
            <p className="font-semibold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Multimodal Vision & Voice</span>
            </p>
            <p className="text-slate-600 mt-1">
              ছবি বিশ্লেষণ, ভয়েস ট্রান্সক্রিপশন (`/api/transcribe`) ও অডিও পাঠ (`/api/tts`)।
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-slate-200">
            <p className="font-semibold text-slate-900">
              গেস্ট ও অ্যাকাউন্ট মোড
            </p>
            <p className="text-slate-600 mt-1">
              লগইন ছাড়াই প্রথম সার্চ এবং অ্যাকাউন্টে হিস্ট্রি ও উত্তর সংরক্ষণ।
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white">
        <div>
          <h2 className="text-xl font-bold">আপনার মনে কী প্রশ্ন আছে?</h2>
          <p className="text-sm text-blue-100 mt-0.5">
            লগইন ছাড়াই এখনই বাংলায় প্রশ্ন করুন, ছবি দিন বা কথা বলুন।
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-950 font-semibold text-sm sm:text-base hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <span>এখনই খুঁজুন</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
