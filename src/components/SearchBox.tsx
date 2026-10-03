import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Camera,
  Mic,
  MicOff,
  X,
  Upload,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { SearchMode, SampleVisualPreset } from "../types/khujo";
import { SAMPLE_VISUAL_PRESETS, transcribeVoiceAudio } from "../services/apiAdapter";

interface SearchBoxProps {
  initialQuery?: string;
  initialMode?: SearchMode;
  onSubmitSearch: (params: {
    query: string;
    searchMode: SearchMode;
    category?: string;
    imageBase64?: string;
    imageMimeType?: string;
    imagePreviewUrl?: string;
    imageDescription?: string;
  }) => void;
  isSearching?: boolean;
  compact?: boolean;
  voiceLanguage?: "bn-BD" | "en-US";
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  initialQuery = "",
  initialMode = "text",
  onSubmitSearch,
  isSearching = false,
  compact = false,
  voiceLanguage = "bn-BD",
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeMode, setActiveMode] = useState<SearchMode>(initialMode);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | undefined>(undefined);
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [imageDescription, setImageDescription] = useState<string | undefined>(undefined);

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"bn-BD" | "en-US">(voiceLanguage);
  const [voiceStatusMessage, setVoiceStatusMessage] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setImagePreviewUrl(dataUrl);
      setImageBase64(dataUrl);
      setImageMimeType(file.type || "image/jpeg");
      setImageDescription(file.name);
      setActiveMode("image");
      if (!query.trim()) {
        setQuery("এই ছবিটি বিশ্লেষণ করে এতে কী দেখা যাচ্ছে এবং এর সমাধান বা বিস্তারিত তথ্য সহজ বাংলায় বলুন।");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectVisualPreset = (preset: SampleVisualPreset) => {
    setImagePreviewUrl(preset.svgDataUrl);
    setImageBase64(undefined);
    setImageDescription(preset.imageDescription);
    setQuery(preset.query);
    setActiveMode("image");
  };

  const clearAttachedImage = () => {
    setImagePreviewUrl(undefined);
    setImageBase64(undefined);
    setImageDescription(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const stopVoiceListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  const startVoiceSearch = async () => {
    setActiveMode("voice");
    if (isListening) {
      stopVoiceListening();
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = voiceLang;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setVoiceStatusMessage(
            voiceLang === "bn-BD"
              ? "শুনছি... আপনার প্রশ্নটি বাংলায় বলুন"
              : "Listening... Speak your question clearly"
          );
        };

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setQuery(transcript.trim());
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
          setVoiceStatusMessage(
            "মাইক্রোফোন অ্যাক্সেস পাওয়া যায়নি। নিচের তাৎক্ষণিক ভয়েস প্রশ্ন থেকে বেছে নিন অথবা টাইপ করুন।"
          );
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch {
        // fallback
      }
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (ev) => {
          if (ev.data.size > 0) {
            audioChunksRef.current.push(ev.data);
          }
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = String(reader.result || "");
            setIsTranscribing(true);
            setVoiceStatusMessage("আপনার কথা থেকে প্রশ্ন তৈরি করা হচ্ছে...");
            try {
              const text = await transcribeVoiceAudio(
                base64Audio,
                "audio/webm",
                voiceLang === "en-US" ? "en" : "bn"
              );
              if (text) {
                setQuery(text);
                setVoiceStatusMessage("ভয়েস সফলভাবে টেক্সটে রূপান্তরিত হয়েছে!");
              }
            } catch {
              setVoiceStatusMessage("ভয়েস প্রসেসিং সম্পন্ন হয়নি, নিচের নমুনা প্রশ্ন ব্যবহার করুন।");
            } finally {
              setIsTranscribing(false);
            }
          };
          reader.readAsDataURL(blob);
        };

        mediaRecorderRef.current = recorder;
        recorder.start();
        setIsListening(true);
        setVoiceStatusMessage("রেকর্ডিং চলছে... কথা শেষ হলে আবার ভয়েস বাটনে চাপুন।");
        return;
      } catch {
        setVoiceStatusMessage(
          "ব্রাউজারে মাইক্রোফোন অনুমতি বন্ধ রয়েছে। নিচের ভয়েস প্রম্পট বাটনে ক্লিক করে সরাসরি পরীক্ষা করুন।"
        );
      }
    } else {
      setVoiceStatusMessage(
        "নিচের যেকোনো একটি কথ্য প্রশ্নে ক্লিক করে ভয়েস সার্চ পরীক্ষা করুন।"
      );
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearching) return;
    const trimmed = query.trim();
    if (!trimmed && !imagePreviewUrl) return;

    stopVoiceListening();
    onSubmitSearch({
      query:
        trimmed ||
        "এই ছবিটি বিশ্লেষণ করে এতে কী দেখা যাচ্ছে এবং এর সমাধান সহজ বাংলায় বলুন।",
      searchMode: imagePreviewUrl ? "image" : activeMode,
      imageBase64,
      imageMimeType,
      imagePreviewUrl,
      imageDescription,
    });
  };

  const handleAskKhujoClick = () => {
    const trimmed = query.trim();
    if (!trimmed && !imagePreviewUrl) {
      const defaultQ =
        "বাংলাদেশে অনলাইনে ই-পাসপোর্ট করার নিয়ম এবং প্রয়োজনীয় কাগজপত্র কী কী?";
      setQuery(defaultQ);
      onSubmitSearch({
        query: defaultQ,
        searchMode: "text",
      });
      return;
    }
    onSubmitSearch({
      query:
        trimmed ||
        "এই ছবিটি বিশ্লেষণ করে এতে কী দেখা যাচ্ছে এবং এর সমাধান সহজ বাংলায় বলুন।",
      searchMode: imagePreviewUrl ? "image" : activeMode,
      imageBase64,
      imageMimeType,
      imagePreviewUrl,
      imageDescription,
    });
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleFormSubmit}
        className="w-full bg-white rounded-2xl border border-slate-200/90 khujo-search-glow transition-all duration-200 p-3 sm:p-4"
      >
        {imagePreviewUrl && (
          <div className="mb-3 flex items-center justify-between gap-3 p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={imagePreviewUrl}
                alt="সংযুক্ত ছবি"
                referrerPolicy="no-referrer"
                className="w-14 h-12 object-cover rounded-lg border border-indigo-200 bg-white shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-indigo-900 truncate">
                  ছবি যুক্ত করা হয়েছে (Image Search সক্রিয়)
                </p>
                <p className="text-xs text-slate-600 truncate">
                  {imageDescription || "আপনার ছবির সাথে যেকোনো প্রশ্ন নিচে লিখতে পারেন"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearAttachedImage}
              aria-label="ছবি মুছে ফেলুন"
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="relative flex items-center gap-2.5">
          <Search
            className={`w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 shrink-0 ml-1 ${
              isSearching ? "animate-pulse" : ""
            }`}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="আপনি কী খুঁজছেন?"
            aria-label="আপনি কী খুঁজছেন?"
            className={`w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none ${
              compact
                ? "text-base sm:text-lg py-1.5"
                : "text-lg sm:text-xl py-2.5 font-medium"
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="মুছে ফেলুন"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveMode((prev) => (prev === "image" ? "text" : "image"));
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                activeMode === "image" || imagePreviewUrl
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80"
              }`}
            >
              <Camera className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Image Search · ছবি</span>
            </button>

            <button
              type="button"
              onClick={startVoiceSearch}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                isListening
                  ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                  : activeMode === "voice"
                  ? "bg-violet-50 text-violet-700 border border-violet-200"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80"
              }`}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Mic className="w-4 h-4 text-violet-600 shrink-0" />
              )}
              <span>{isListening ? "শুনছি... থামান" : "Voice Search · কণ্ঠ"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleAskKhujoClick}
            disabled={isSearching}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 disabled:opacity-60 transition-all shadow-sm whitespace-nowrap cursor-pointer ml-auto"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>উত্তর খোঁজা হচ্ছে...</span>
              </>
            ) : (
              <>
                <span>Ask KHUJO</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </>
            )}
          </button>
        </div>

        {activeMode === "image" && (
          <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/70 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  📷 ছবি দিয়ে অনুসন্ধান করুন (Image Search)
                </p>
                <p className="text-xs text-slate-600">
                  নিজের মোবাইল/কম্পিউটার থেকে ছবি আপলোড করুন অথবা নিচের নমুনা ছবি দিয়ে এক ক্লিকে পরীক্ষা করুন:
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors whitespace-nowrap shadow-2xs"
              >
                <Upload className="w-4 h-4" />
                <span>ডিভাইস থেকে ছবি নিন</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {SAMPLE_VISUAL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectVisualPreset(preset)}
                  className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-left transition-colors"
                >
                  <img
                    src={preset.svgDataUrl}
                    alt={preset.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-10 object-cover rounded-md shrink-0 border border-slate-100"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {preset.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {preset.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeMode === "voice" && (
          <div className="mt-3 pt-3 border-t border-slate-100 bg-violet-50/50 rounded-xl p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isListening ? "bg-rose-500 animate-ping" : "bg-violet-600"
                  }`}
                />
                <p className="text-sm font-semibold text-slate-800">
                  {isTranscribing
                    ? "অডিও বিশ্লেষণ করা হচ্ছে..."
                    : voiceStatusMessage || "নিজের ভাষায় কথা বলে প্রশ্ন করুন"}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setVoiceLang("bn-BD")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    voiceLang === "bn-BD"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  বাংলা (bn-BD)
                </button>
                <button
                  type="button"
                  onClick={() => setVoiceLang("en-US")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    voiceLang === "en-US"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-500">তাৎক্ষণিক ভয়েস ডেমো প্রশ্ন:</span>
              {[
                "আমার ফোনের চার্জ দ্রুত শেষ হয়ে যাচ্ছে কেন?",
                "জমির খতিয়ান অনলাইনে কীভাবে চেক করব?",
                "সহজ ভাষায় মুদ্রাস্ফীতি মানে কী?",
              ].map((sampleVoice) => (
                <button
                  key={sampleVoice}
                  type="button"
                  onClick={() => {
                    setQuery(sampleVoice);
                    onSubmitSearch({
                      query: sampleVoice,
                      searchMode: "voice",
                    });
                  }}
                  className="text-xs bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  “{sampleVoice}”
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
