import React, { useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  Volume2,
  VolumeX,
  ExternalLink,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import {
  PageRoute,
  SearchMode,
  SearchResultItem,
  UserProfile,
} from "../types/khujo";
import { SearchBox } from "../components/SearchBox";
import { synthesizeAnswerSpeech } from "../services/apiAdapter";

interface SearchResultsPageProps {
  currentResult: SearchResultItem | null;
  isSearching: boolean;
  searchError: string | null;
  onSubmitSearch: (params: {
    query: string;
    searchMode: SearchMode;
    category?: string;
    imageBase64?: string;
    imageMimeType?: string;
    imagePreviewUrl?: string;
    imageDescription?: string;
  }) => void;
  isSaved: boolean;
  onToggleSave: (result: SearchResultItem) => void;
  user: UserProfile | null;
  onNavigate: (page: PageRoute) => void;
  onInstantDemoLogin: () => void;
}

const TEST_QUESTIONS = [
  "তাজমহল কোথায়?",
  "ভারতের জাতীয় পশু কী?",
  "ইতিহাসের জনক কে?",
  "বাংলাদেশের রাজধানী কী?",
];

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({
  currentResult,
  isSearching,
  searchError,
  onSubmitSearch,
  isSaved,
  onToggleSave,
  user,
  onNavigate,
  onInstantDemoLogin,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<string>("");
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, boolean>>({});

  const handleImageError = (url: string) => {
    setFailedImageUrls((prev) => ({ ...prev, [url]: true }));
  };

  // Clean and sanitize answer texts to guarantee direct answer first with no boilerplate
  const stripBoilerplate = (str: string): string => {
    let s = str.trim().replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
    const patterns = [
      /^(KHUJO\s+AI\s+অনুসন্ধান\s*[-–:]*\s*)/i,
      /^(খুঁজো\s+এআই\s+অনুসন্ধান\s*[-–:]*\s*)/i,
      /^(নির্ভরযোগ্য\s+তথ্য\s+বিশ্লেষণ\s+করে[,\s:]*)/i,
      /^(নির্ভরযোগ্য\s+তথ্য\s+অনুযায়ী[,\s:]*)/i,
      /^(নির্ভরযোগ্য\s+তথ্য\s+অনুযায়ী[,\s:]*)/i,
      /^(তথ্যসূত্র\s+বিশ্লেষণ\s+করে\s+বিষয়টি\s+যাচাই\s+করা\s+হয়েছে[,\s:.]*)/i,
      /^(তথ্যসূত্র\s+বিশ্লেষণ\s+করে\s+বিষয়টি\s+যাচাই\s+করা\s+হয়েছে[,\s:.]*)/i,
      /^(আপনার\s+প্রশ্নের\s+উত্তরে[,\s:]*)/i,
      /^(আপনার\s+জিজ্ঞাসিত\s+বিষয়[,\s:]*)/i,
      /^(আপনার\s+জিজ্ঞাসিত\s+বিষয়[,\s:]*)/i,
      /^(আপনি\s+জানতে\s+চেয়েছেন[,\s:]*)/i,
      /^(আপনি\s+জানতে\s+চেয়েছেন[,\s:]*)/i,
      /^(এই\s+বিষয়ে\s+বিভিন্ন\s+তথ্য\s+পাওয়া\s+যায়[,\s:]*)/i,
      /^(এই\s+বিষয়ে\s+বিভিন্ন\s+তথ্য\s+পাওয়া\s+যায়[,\s:]*)/i,
      /^(নিচে\s+বিস্তারিত\s+দেওয়া\s+হলো[,\s:]*)/i,
      /^(নিচে\s+বিস্তারিত\s+দেওয়া\s+হলো[,\s:]*)/i,
      /^(নিচে\s+বিস্তারিত\s+আলোচনা\s+করা\s+হলো[,\s:]*)/i,
      /^(KHUJO\s+AI\s+আপনার\s+প্রশ্নটি\s+বিশ্লেষণ\s+করেছে[,\s:]*)/i,
      /^([“"][^”"]+[”"]\s*সম্পর্কে\s*সরাসরি\s*তথ্য[,\s:]*)/i,
      /^(সম্পর্কে\s*সরাসরি\s*তথ্য[,\s:]*)/i,
    ];
    for (const pat of patterns) {
      s = s.replace(pat, "").trim();
    }
    return s;
  };

  const rawDirect = (currentResult?.directAnswer || currentResult?.summary || "").trim();
  const queryText = currentResult?.query || "";

  let directAnswerText = stripBoilerplate(rawDirect);

  // If directAnswerText was empty or just repeated the query, use first valid sentence from explanation
  if (!directAnswerText || directAnswerText === queryText) {
    if (currentResult?.explanation) {
      directAnswerText = stripBoilerplate(currentResult.explanation.split("\n")[0]);
    } else if (currentResult?.detailedAnswer && currentResult.detailedAnswer.length > 0) {
      const candidate = stripBoilerplate(currentResult.detailedAnswer[0]);
      if (candidate) {
        directAnswerText = candidate;
      }
    }
  }
  if (!directAnswerText) {
    directAnswerText = queryText;
  }

  // Explanation paragraphs
  const explanationParagraphs: string[] = [];
  if (currentResult?.explanation) {
    const rawParas = currentResult.explanation.split(/\n\n+/);
    for (const p of rawParas) {
      const cleaned = stripBoilerplate(p);
      if (cleaned && cleaned !== directAnswerText) {
        explanationParagraphs.push(cleaned);
      }
    }
  } else if (currentResult?.detailedAnswer) {
    for (const para of currentResult.detailedAnswer) {
      const cleaned = stripBoilerplate(para);
      if (cleaned && cleaned !== directAnswerText) {
        explanationParagraphs.push(cleaned);
      }
    }
  }

  // Key points
  const keyPointsList = (currentResult?.keyPoints || currentResult?.keyTakeaways || []).filter(
    (k) => k && String(k).trim() !== ""
  );

  const handleCopyAnswer = () => {
    if (!currentResult) return;
    const fullText = `${currentResult.query}\n\nসরাসরি উত্তর:\n${directAnswerText}\n\n${explanationParagraphs.join(
      "\n\n"
    )}\n\nতথ্যসূত্র:\n${currentResult.sources
      .map((s) => `- ${s.title}: ${s.url}`)
      .join("\n")}`;

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleListenAnswer = async () => {
    if (!currentResult) return;

    if (isPlayingAudio) {
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    const speechText = `${directAnswerText}. ${explanationParagraphs.join(" ")}`;

    const ttsRes = await synthesizeAnswerSpeech(speechText);
    if (ttsRes.audioBase64) {
      const audio = new Audio(`data:audio/wav;base64,${ttsRes.audioBase64}`);
      setAudioElement(audio);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().catch(() => setIsPlayingAudio(false));
      return;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = currentResult.language === "en" ? "en-US" : "bn-BD";
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(false);
    }
  };

  const handleSaveButtonClick = () => {
    if (!currentResult) return;
    onToggleSave(currentResult);
    setSaveFeedback(
      isSaved
        ? "সংরক্ষিত তালিকা থেকে সরানো হয়েছে"
        : "উত্তরটি আপনার সংরক্ষিত তালিকায় যোগ করা হয়েছে"
    );
    setTimeout(() => setSaveFeedback(""), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top Header & Search Bar */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>হোমপেজে ফিরে যান</span>
          </button>

          {/* Quick test questions chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">সরাসরি প্রশ্ন:</span>
            {TEST_QUESTIONS.map((tq) => (
              <button
                key={tq}
                type="button"
                onClick={() => onSubmitSearch({ query: tq, searchMode: "text" })}
                className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                {tq}
              </button>
            ))}
          </div>
        </div>

        <SearchBox
          initialQuery={currentResult?.query || ""}
          onSubmitSearch={onSubmitSearch}
          isSearching={isSearching}
          compact
          voiceLanguage={user?.voiceLanguage || "bn-BD"}
        />
      </div>

      {/* Loading State: Clean, focused search progress */}
      {isSearching && (
        <div className="my-8 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-indigo-600 animate-ping" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              KHUJO AI সরাসরি উত্তর খুঁজছে...
            </h2>
          </div>
          <div className="space-y-2 pt-2">
            <div className="h-6 bg-slate-100 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-full animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-1/2 animate-pulse" />
          </div>
        </div>
      )}

      {/* Error State */}
      {searchError && !isSearching && (
        <div className="my-6 p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
          <p className="font-semibold text-base">{searchError}</p>
        </div>
      )}

      {/* Empty State */}
      {!currentResult && !isSearching && !searchError && (
        <div className="my-10 p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            যেকোনো প্রশ্ন লিখে সরাসরি উত্তর জানুন
          </h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            ওপরের সার্চ বক্সে যেকোনো প্রশ্ন লিখুন। KHUJO AI কোনো অপ্রয়োজনীয় ভূমিকা ছাড়া প্রথম বাক্যেই সরাসরি উত্তর দেবে।
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 pt-2">
            {TEST_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onSubmitSearch({ query: q, searchMode: "text" })}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-sm font-medium text-slate-800 transition-colors cursor-pointer"
              >
                “{q}”
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Populated Search Result */}
      {currentResult && !isSearching && (
        <article className="space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                1. DIRECT ANSWER: The FIRST visible content inside the answer card
                Direct answer is prominently displayed immediately!
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            <section
              aria-label="সরাসরি উত্তর"
              className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-blue-50/90 via-indigo-50/80 to-violet-50/90 p-5 sm:p-7 shadow-xs"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-700">
                  সরাসরি উত্তর · DIRECT ANSWER
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug tracking-tight">
                {directAnswerText}
              </h1>
            </section>

            {/* Optional Uploaded Image Preview if search was by image */}
            {currentResult.imagePreviewUrl && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <img
                  src={currentResult.imagePreviewUrl}
                  alt="অনুসন্ধানকৃত ছবি"
                  referrerPolicy="no-referrer"
                  className="w-20 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
                />
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">অনুসন্ধানকৃত ছবি</span>
                  {currentResult.imageDescription && (
                    <p className="text-slate-500 line-clamp-1">{currentResult.imageDescription}</p>
                  )}
                </div>
              </div>
            )}

            {/* Unverified Information Warning (Only if reliable sources could not confirm) */}
            {!currentResult.reliableInfoFound && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-bold text-amber-950">
                    নির্ভরযোগ্য তথ্য পাওয়া যায়নি
                  </p>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {currentResult.reliabilityNote ||
                      "বিশ্বস্ত তথ্যসূত্রে এই দাবির কোনো প্রমাণ পাওয়া যায়নি। KHUJO AI কোনো কাল্পনিক বা অনুমানভিত্তিক তথ্য তৈরি করে না।"}
                  </p>
                </div>
              </div>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                2. DETAILED EXPLANATION (বিস্তারিত:): Below the direct answer
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {explanationParagraphs.length > 0 && (
              <section className="space-y-2 pt-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  বিস্তারিত:
                </h2>
                <div className="space-y-2.5 text-base sm:text-[17px] text-slate-700 leading-relaxed">
                  {explanationParagraphs.map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              </section>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                3. KEY POINTS (মূল তথ্য:): Structured key points
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
            {keyPointsList.length > 0 && (
              <section className="space-y-2 pt-3 border-t border-slate-100">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  মূল তথ্য:
                </h2>
                <ul className="space-y-1.5 text-sm sm:text-base text-slate-700">
                  {keyPointsList.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold mt-0.5">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Action Bar: Listen, Save, Copy & Status */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleListenAnswer}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                    isPlayingAudio
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>পড়া বন্ধ করুন</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-indigo-600" />
                      <span>উত্তরটি শুনুন</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveButtonClick}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                    isSaved
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                      <span>সংরক্ষিত আছে</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-slate-600" />
                      <span>উত্তর সংরক্ষণ করুন</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyAnswer}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>কপি করুন</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {currentResult.reliableInfoFound
                    ? "যাচাইকৃত তথ্য"
                    : "অসমর্থিত তথ্য সতর্কতা"}
                </span>
                {!user && (
                  <button
                    type="button"
                    onClick={onInstantDemoLogin}
                    className="ml-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    হিস্ট্রি সেভ রাখতে লগইন করুন →
                  </button>
                )}
              </div>
            </div>

            {saveFeedback && (
              <p className="text-xs font-medium text-indigo-700">{saveFeedback}</p>
            )}
          </div>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              3.5 RELATED IMAGES (সম্পর্কিত ছবি): 1-4 relevant real images
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {(() => {
            const validImages = (currentResult.relevantImages || []).filter(
              (img) => img && img.url && !failedImageUrls[img.url]
            );

            if (validImages.length === 0) return null;

            return (
              <section aria-labelledby="related-images-heading" className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-600 shrink-0" />
                    <h2
                      id="related-images-heading"
                      className="text-base sm:text-lg font-bold text-slate-900"
                    >
                      সম্পর্কিত ছবি ({validImages.length})
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    প্রাসঙ্গিক বাস্তব ছবি
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {validImages.map((img, idx) => (
                    <div
                      key={`${img.url}-${idx}`}
                      className="group flex flex-col rounded-xl overflow-hidden bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all"
                    >
                      {/* Image Preview Container */}
                      <a
                        href={img.sourceUrl || img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block aspect-[4/3] bg-slate-100 overflow-hidden"
                      >
                        <img
                          src={img.url}
                          alt={img.title || "সম্পর্কিত ছবি"}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={() => handleImageError(img.url)}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-2 right-2 bg-slate-900/60 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </a>

                      {/* Caption & Website Attribution */}
                      <div className="p-3 flex flex-col justify-between flex-1 gap-2 bg-white">
                        <p
                          className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug"
                          title={img.caption || img.title}
                        >
                          {img.caption || img.title || "সম্পর্কিত দৃশ্য"}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="truncate max-w-[140px] text-indigo-700 font-medium">
                            {img.source || "উইকিমিডিয়া"}
                          </span>
                          <a
                            href={img.sourceUrl || img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium shrink-0"
                          >
                            <span>উৎস</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              4. SOURCES (Sources:): Shown cleanly below the answer card
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {currentResult.sources && currentResult.sources.length > 0 && (
            <section aria-labelledby="sources-heading" className="space-y-3">
              <div className="flex items-center justify-between">
                <h2
                  id="sources-heading"
                  className="text-base sm:text-lg font-bold text-slate-900"
                >
                  Sources / তথ্যসূত্র ({currentResult.sources.length}):
                </h2>
                <span className="text-xs text-slate-400">
                  যাচাইকৃত লিংক
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentResult.sources.map((src, idx) => {
                  let domain = "";
                  try {
                    domain = new URL(src.url).hostname.replace(/^www\./, "");
                  } catch {
                    domain = src.domain || "web.source";
                  }
                  return (
                    <a
                      key={`${src.url}-${idx}`}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-3.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 transition-all flex flex-col justify-between gap-1.5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span className="font-mono text-indigo-600 truncate">
                            {idx + 1}. {domain}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 leading-snug line-clamp-2 mt-1">
                          {src.title}
                        </h3>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {/* Related / Follow-up Questions */}
          {currentResult.relatedQuestions.length > 0 && (
            <section aria-labelledby="followup-heading" className="space-y-2 pt-2">
              <h2
                id="followup-heading"
                className="text-base sm:text-lg font-bold text-slate-900"
              >
                সম্পর্কিত প্রশ্ন:
              </h2>
              <div className="grid grid-cols-1 gap-2">
                {currentResult.relatedQuestions.map((relQ) => (
                  <button
                    key={relQ}
                    type="button"
                    onClick={() =>
                      onSubmitSearch({
                        query: relQ,
                        searchMode: "text",
                        category: currentResult.category,
                      })
                    }
                    className="group w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 text-left transition-colors cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-medium text-slate-800 group-hover:text-indigo-950">
                      {relQ}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          )}
        </article>
      )}
    </div>
  );
};
