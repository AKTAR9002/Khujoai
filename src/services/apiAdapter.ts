import { SearchMode, SearchResultItem, SampleVisualPreset, CategoryPreset } from "../types/khujo";

export interface SearchAPIConfig {
  searchEndpoint: string;
  transcribeEndpoint: string;
  ttsEndpoint: string;
}

const defaultConfig: SearchAPIConfig = {
  searchEndpoint: "/api/search",
  transcribeEndpoint: "/api/transcribe",
  ttsEndpoint: "/api/tts",
};

export const EXAMPLE_CATEGORIES: CategoryPreset[] = [
  {
    id: "image-search",
    emoji: "📷",
    label: "ছবি দিয়ে খুঁজুন",
    englishLabel: "Image Search",
    description: "যেকোনো অচেনা বস্তু, গাছের পাতা, যন্ত্রের ত্রুটি বা কাগজের ছবি তুলে সমাধান জানুন।",
    mode: "image",
    sampleQueries: [
      "এই গাছের পাতায় হলুদ ও বাদামী দাগ কেন পড়ছে এবং এর প্রতিকার কী?",
      "এই রাউটারের লাল বাতি জ্বলার মানে কী এবং কীভাবে ঠিক করব?",
      "ছবির এই ভেষজ উদ্ভিদটির নাম ও উপকারিতা কী?"
    ],
  },
  {
    id: "problem-solving",
    emoji: "🛠️",
    label: "সমস্যার সমাধান",
    englishLabel: "Problem Solving",
    description: "মোবাইল, কম্পিউটার, দৈনন্দিন কাজ বা কারিগরি সমস্যার ধাপে ধাপে সমাধান।",
    mode: "text",
    sampleQueries: [
      "মোবাইল ফোন অতিরিক্ত গরম হলে এবং চার্জ দ্রুত শেষ হলে করণীয় কী?",
      "ওয়াইফাই কানেক্ট থাকা সত্ত্বেও ইন্টারনেট কাজ না করলে কীভাবে ঠিক করব?",
      "পাসপোর্টে নামের বানান ভুল হলে সংশোধন করার নিয়ম কী?"
    ],
  },
  {
    id: "explain-simply",
    emoji: "💡",
    label: "কিছু বুঝছেন না?",
    englishLabel: "Explain Simply",
    description: "কঠিন বিষয়, অর্থনীতি, বিজ্ঞান বা ইংরেজি পরিভাষা সহজ বাংলায় উদাহরণসহ বুঝুন।",
    mode: "text",
    sampleQueries: [
      "মুদ্রাস্ফীতি (Inflation) কী এবং এর ফলে জিনিসপত্রের দাম কেন বাড়ে সহজ বাংলায় বুঝিয়ে বলুন",
      "কৃত্রিম বুদ্ধিমত্তা বা AI কীভাবে মানুষের ভাষা বোঝে?",
      "ক্লাউড স্টোরেজ কী এবং সেখানে আমাদের ছবি কীভাবে নিরাপদ থাকে?"
    ],
  },
  {
    id: "find-info",
    emoji: "🌐",
    label: "তথ্য খুঁজুন",
    englishLabel: "Find Information",
    description: "সরকারি সেবা, শিক্ষা, স্বাস্থ্য বা সমসাময়িক বিষয়ে যাচাইকৃত তথ্য ও ওয়েব লিংক।",
    mode: "text",
    sampleQueries: [
      "বাংলাদেশে অনলাইনে ই-পাসপোর্ট করার নিয়ম এবং প্রয়োজনীয় কাগজপত্র কী কী?",
      "ফ্রিল্যান্সিং শুরু করার জন্য কোন কোন দক্ষতা শেখা সবচেয়ে জরুরি?",
      "ডেঙ্গু জ্বরের লক্ষণ এবং ঘরে বসে প্রাথমিক চিকিৎসার সঠিক নিয়ম কী?"
    ],
  },
];

export const SAMPLE_VISUAL_PRESETS: SampleVisualPreset[] = [
  {
    id: "leaf-spot",
    title: "গাছের পাতার রোগ শনাক্তকরণ",
    subtitle: "হলুদ ও বাদামী ছোপযুক্ত পাতা",
    query: "এই গাছের পাতায় হলুদ ও বাদামী দাগ কেন পড়ছে এবং এর ঘরোয়া সমাধান কী?",
    imageDescription: "হলুদ ও বাদামী ছোপযুক্ত গাছের পাতা (Fungal Leaf Spot / Nutrient Deficiency)",
    svgDataUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#f0fdf4"/>
              <stop offset="100%" stop-color="#dcfce7"/>
            </linearGradient>
          </defs>
          <rect width="480" height="320" rx="20" fill="url(#bg)"/>
          <path d="M110 245 C135 105, 285 65, 370 85 C355 185, 290 255, 110 245 Z" fill="#22c55e" stroke="#15803d" stroke-width="4"/>
          <path d="M110 245 Q235 165 365 87" stroke="#bbf7d0" stroke-width="4" fill="none"/>
          <circle cx="220" cy="145" r="22" fill="#eab308" opacity="0.85"/>
          <circle cx="220" cy="145" r="11" fill="#854d0e"/>
          <circle cx="285" cy="175" r="18" fill="#eab308" opacity="0.85"/>
          <circle cx="285" cy="175" r="9" fill="#713f12"/>
          <circle cx="185" cy="195" r="14" fill="#fde047" opacity="0.9"/>
          <circle cx="185" cy="195" r="6" fill="#854d0e"/>
        </svg>
      `),
  },
  {
    id: "router-error",
    title: "রাউটারের সিগন্যাল ত্রুটি",
    subtitle: "ইন্টারনেট LED লাল হয়ে আছে",
    query: "আমার ওয়াইফাই রাউটারে এই লাল বাতি জ্বলছে কেন এবং ইন্টারনেট না চললে কীভাবে ঠিক করব?",
    imageDescription: "Wi-Fi Router with red LOS / Internet indicator light blinking",
    svgDataUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
          <rect width="480" height="320" rx="20" fill="#eff6ff"/>
          <rect x="145" y="70" width="14" height="115" rx="7" fill="#334155"/>
          <rect x="321" y="70" width="14" height="115" rx="7" fill="#334155"/>
          <rect x="105" y="170" width="270" height="72" rx="16" fill="#1e293b"/>
          <circle cx="155" cy="206" r="8" fill="#22c55e"/>
          <circle cx="195" cy="206" r="8" fill="#22c55e"/>
          <circle cx="235" cy="206" r="10" fill="#ef4444"/>
          <circle cx="235" cy="206" r="18" fill="#ef4444" opacity="0.28"/>
          <circle cx="275" cy="206" r="8" fill="#38bdf8"/>
        </svg>
      `),
  },
  {
    id: "nutrition-label",
    title: "প্যাকেটের গায়ে লেখা তথ্য",
    subtitle: "খাদ্য উপাদান ও মেয়াদ বিশ্লেষণ",
    query: "খাবারের প্যাকেটের গায়ে থাকা Trans Fat এবং Sodium-এর মাত্রা শরীরের জন্য কতটা নিরাপদ?",
    imageDescription: "Nutrition Facts food label showing Trans Fat, Sodium, and Carbohydrates",
    svgDataUrl:
      "data:image/svg+xml;utf8," +
      encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
          <rect width="480" height="320" rx="20" fill="#f5f3ff"/>
          <rect x="130" y="40" width="220" height="240" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="3"/>
          <rect x="150" y="62" width="180" height="22" rx="4" fill="#1e293b"/>
          <rect x="150" y="96" width="180" height="6" fill="#0f172a"/>
          <rect x="150" y="116" width="120" height="12" rx="3" fill="#64748b"/>
          <rect x="285" y="116" width="45" height="12" rx="3" fill="#ef4444"/>
          <rect x="150" y="144" width="110" height="12" rx="3" fill="#64748b"/>
          <rect x="285" y="144" width="45" height="12" rx="3" fill="#f59e0b"/>
          <rect x="150" y="172" width="135" height="12" rx="3" fill="#64748b"/>
          <rect x="150" y="202" width="180" height="10" rx="3" fill="#94a3b8"/>
          <rect x="150" y="226" width="150" height="10" rx="3" fill="#94a3b8"/>
        </svg>
      `),
  },
];

export interface ExecuteSearchParams {
  query: string;
  searchMode?: SearchMode;
  category?: string;
  imageBase64?: string;
  imageMimeType?: string;
  imagePreviewUrl?: string;
  imageDescription?: string;
  language?: "bn" | "en";
  detailLevel?: "concise" | "balanced" | "detailed";
}

export async function searchWithKhujoAI(
  params: ExecuteSearchParams
): Promise<SearchResultItem> {
  const {
    query,
    searchMode = "text",
    category,
    imageBase64,
    imageMimeType = "image/jpeg",
    imagePreviewUrl,
    imageDescription,
    language = "bn",
    detailLevel = "balanced",
  } = params;

  const response = await fetch(defaultConfig.searchEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      searchMode,
      category,
      imageBase64,
      imageMimeType,
      imageDescription,
      language,
      detailLevel,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || "অনুসন্ধান সম্পন্ন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
  }

  const data = await response.json();
  return {
    id: `khujo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...data,
    imagePreviewUrl,
    imageDescription,
  };
}

export async function transcribeVoiceAudio(
  audioBase64: string,
  mimeType: string = "audio/webm",
  language: "bn" | "en" = "bn"
): Promise<string> {
  const response = await fetch(defaultConfig.transcribeEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType, language }),
  });

  if (!response.ok) {
    throw new Error("ভয়েস ট্রান্সক্রিপশন সম্পন্ন করা যায়নি।");
  }

  const data = await response.json();
  return data.text || "";
}

export async function synthesizeAnswerSpeech(
  text: string
): Promise<{ audioBase64: string | null; useBrowserSpeech: boolean }> {
  try {
    const response = await fetch(defaultConfig.ttsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      return { audioBase64: null, useBrowserSpeech: true };
    }
    return await response.json();
  } catch {
    return { audioBase64: null, useBrowserSpeech: true };
  }
}
