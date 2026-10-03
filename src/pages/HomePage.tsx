import React, { useState } from "react";
import { ArrowUpRight, Bookmark, Clock } from "lucide-react";
import {
  CategoryPreset,
  PageRoute,
  SearchMode,
  SearchResultItem,
  UserProfile,
} from "../types/khujo";
import { EXAMPLE_CATEGORIES, SAMPLE_VISUAL_PRESETS } from "../services/apiAdapter";
import { KhujoLogo } from "../components/KhujoLogo";
import { SearchBox } from "../components/SearchBox";

interface HomePageProps {
  onSubmitSearch: (params: {
    query: string;
    searchMode: SearchMode;
    category?: string;
    imageBase64?: string;
    imageMimeType?: string;
    imagePreviewUrl?: string;
    imageDescription?: string;
  }) => void;
  isSearching: boolean;
  user: UserProfile | null;
  recentHistory: SearchResultItem[];
  onSelectHistoryItem: (item: SearchResultItem) => void;
  onNavigate: (page: PageRoute) => void;
}

const QUICK_TEST_QUERIES = [
  "তাজমহল কোথায়?",
  "ভারতের জাতীয় পশু কী?",
  "ইতিহাসের জনক কে?",
  "বাংলাদেশের রাজধানী কী?",
];

export const HomePage: React.FC<HomePageProps> = ({
  onSubmitSearch,
  isSearching,
  user,
  recentHistory,
  onSelectHistoryItem,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryPreset>(
    EXAMPLE_CATEGORIES[1]
  );
  const [searchModeOverride, setSearchModeOverride] = useState<SearchMode>("text");

  const handleCategoryClick = (cat: CategoryPreset) => {
    setSelectedCategory(cat);
    if (cat.id === "image-search") {
      setSearchModeOverride("image");
    } else {
      setSearchModeOverride("text");
    }
  };

  const handleQuickSampleClick = (queryText: string, cat: CategoryPreset) => {
    if (cat.id === "image-search") {
      const preset = SAMPLE_VISUAL_PRESETS[0];
      onSubmitSearch({
        query: queryText,
        searchMode: "image",
        category: cat.label,
        imagePreviewUrl: preset.svgDataUrl,
        imageDescription: preset.imageDescription,
      });
      return;
    }

    onSubmitSearch({
      query: queryText,
      searchMode: "text",
      category: cat.label,
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <section className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12">
        <div className="flex flex-col items-center text-center mb-8">
          <KhujoLogo size="lg" className="mb-6" />

          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.2] max-w-3xl">
            যা খুঁজছেন,{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              KHUJO AI
            </span>
            -কে জিজ্ঞেস করুন
          </h1>

          <p className="mt-4 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
            প্রশ্ন করুন, ছবি দিন বা নিজের ভাষায় বলুন—KHUJO আপনার জন্য উত্তর খুঁজবে।
          </p>
        </div>

        <div className="mt-6">
          <SearchBox
            initialMode={searchModeOverride}
            onSubmitSearch={onSubmitSearch}
            isSearching={isSearching}
            voiceLanguage={user?.voiceLanguage || "bn-BD"}
          />

          {/* Quick Direct Question Chips */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400 font-medium">সরাসরি জিজ্ঞেস করুন:</span>
            {QUICK_TEST_QUERIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSubmitSearch({ query: q, searchMode: "text" })}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 text-xs sm:text-sm text-slate-700 hover:text-indigo-800 transition-colors"
              >
                “{q}”
              </button>
            ))}
          </div>

          <p className="mt-3 text-center text-xs text-slate-400">
            লগইন ছাড়াই যেকোনো প্রশ্ন খুঁজুন · কোনো দীর্ঘ ভূমিকা ছাড়া সরাসরি উত্তর
          </p>
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">
              কীভাবে খুঁজতে চান বেছে নিন
            </h2>
            <span className="text-xs sm:text-sm text-slate-500">
              যেকোনো বিভাগে ক্লিক করে উদাহরণ দেখুন
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {EXAMPLE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryClick(cat)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-br from-blue-50/90 to-violet-50/90 border-indigo-400 shadow-xs"
                      : "bg-white hover:bg-slate-50/80 border-slate-200/90"
                  }`}
                >
                  <div className="text-2xl mb-2" aria-hidden="true">
                    {cat.emoji}
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {cat.label}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 line-clamp-2">
                    {cat.description}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-sm sm:text-base font-semibold text-slate-800">
                {selectedCategory.emoji} {selectedCategory.label} — এক ক্লিকে জিজ্ঞেস করুন:
              </p>
              <span className="text-xs text-slate-500">
                {selectedCategory.englishLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {selectedCategory.sampleQueries.map((sampleQ) => (
                <button
                  key={sampleQ}
                  type="button"
                  onClick={() => handleQuickSampleClick(sampleQ, selectedCategory)}
                  className="group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white hover:bg-indigo-50/50 border border-slate-200/90 hover:border-indigo-300 text-left transition-colors cursor-pointer"
                >
                  <span className="text-base sm:text-[17px] text-slate-800 group-hover:text-indigo-950 font-medium leading-snug">
                    “{sampleQ}”
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {recentHistory.length > 0 && (
          <div className="mt-10 pt-8 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>সাম্প্রতিক অনুসন্ধান</span>
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => onNavigate("history")}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  সব হিস্ট্রি দেখুন
                </button>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate("saved")}
                  className="text-slate-600 hover:text-slate-900 font-medium inline-flex items-center gap-1"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>সংরক্ষিত উত্তর</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentHistory.slice(0, 2).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectHistoryItem(item)}
                  className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-indigo-300 text-left transition-colors"
                >
                  <p className="text-base font-semibold text-slate-900 line-clamp-1">
                    {item.query}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                    {item.summary}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
                    <span>{item.category || "সাধারণ অনুসন্ধান"}</span>
                    {item.sources.length > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{item.sources.length}টি তথ্যসূত্র</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
