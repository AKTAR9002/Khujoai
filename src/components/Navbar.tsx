import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { PageRoute, UserProfile } from "../types/khujo";

interface NavbarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  user: UserProfile | null;
  onLogout: () => void;
  savedCount: number;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  user,
  onLogout,
  savedCount,
  historyCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: PageRoute; label: string }> = [
    { id: "home", label: "হোম" },
    { id: "results", label: "অনুসন্ধান" },
    { id: "history", label: "সার্চ হিস্ট্রি" },
    { id: "saved", label: "সংরক্ষিত উত্তর" },
    { id: "about", label: "KHUJO AI সম্পর্কে" },
  ];

  const handleNav = (page: PageRoute) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => handleNav("home")}
          className="text-xl font-bold tracking-tight text-slate-900 hover:text-indigo-600 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-indigo-600 rounded-md"
        >
          KHUJO AI
        </button>

        <nav
          aria-label="প্রধান নেভিগেশন"
          className="hidden md:flex items-center gap-6 text-[15px] font-medium text-slate-600"
        >
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`py-1 whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? "border-indigo-600 text-slate-900 font-semibold"
                    : "border-transparent hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => handleNav("profile")}
                className={`px-3.5 py-1.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap ${
                  currentPage === "profile"
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                প্রোফাইল ({user.name.split(" ")[0]})
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
              >
                লগআউট
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleNav("login")}
                className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors whitespace-nowrap"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleNav("signup")}
                className="px-3.5 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 rounded-lg transition-all whitespace-nowrap shadow-xs"
              >
                Sign Up
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1.5 shadow-lg">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-base font-medium flex items-center justify-between ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{item.label}</span>
                {item.id === "saved" && savedCount > 0 && (
                  <span className="text-xs text-slate-500 tabular-nums">
                    {savedCount}টি সংরক্ষিত
                  </span>
                )}
                {item.id === "history" && historyCount > 0 && (
                  <span className="text-xs text-slate-500 tabular-nums">
                    {historyCount}টি অনুসন্ধান
                  </span>
                )}
              </button>
            );
          })}
          {user && (
            <button
              type="button"
              onClick={() => handleNav("profile")}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg text-base font-medium ${
                currentPage === "profile"
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              আমার প্রোফাইল ({user.name})
            </button>
          )}
        </div>
      )}
    </header>
  );
};
