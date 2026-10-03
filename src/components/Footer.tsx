import React from "react";
import { PageRoute } from "../types/khujo";
import { KhujoLogo } from "./KhujoLogo";

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const links: Array<{ id: PageRoute; label: string }> = [
    { id: "home", label: "হোম (Home)" },
    { id: "results", label: "সার্চ রেজাল্ট (Search Results)" },
    { id: "history", label: "সার্চ হিস্ট্রি (History)" },
    { id: "saved", label: "সংরক্ষিত উত্তর (Saved Answers)" },
    { id: "profile", label: "প্রোফাইল (Profile)" },
    { id: "about", label: "KHUJO AI সম্পর্কে (About)" },
    { id: "login", label: "Login" },
    { id: "signup", label: "Sign Up" },
  ];

  return (
    <footer className="border-t border-slate-200/80 bg-white mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <KhujoLogo size="sm" />
          <p className="text-xs sm:text-sm text-slate-500">
            যা খুঁজছেন, নিজের ভাষায় সহজে খুঁজুন — যাচাইকৃত তথ্যসূত্রসহ এআই অনুসন্ধান।
          </p>
        </div>

        <nav
          aria-label="ফুটার লিংক"
          className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-slate-600"
        >
          {links.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="hover:text-indigo-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </footer>
  );
};
