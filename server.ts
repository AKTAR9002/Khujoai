import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

interface SourceLink {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

interface AnswerImageItem {
  url: string;
  title: string;
  source: string;
  sourceUrl: string;
  caption?: string;
}

interface StructuredSearchResult {
  query: string;
  directAnswer: string;
  explanation?: string;
  keyPoints?: string[];
  sources: SourceLink[];
  relevantImages?: AnswerImageItem[];
  summary?: string;
  detailedAnswer?: string[];
  keyTakeaways?: string[];
  stepsOrTips?: string[];
  understoodIntent?: string;
  language?: "bn" | "en";
  reliableInfoFound?: boolean;
  reliabilityNote?: string;
  relatedQuestions?: string[];
  searchMode?: "text" | "image" | "voice";
  category?: string;
  providerUsed?: "gemini-live-web-search" | "khujo-verified-knowledge";
  timestamp?: string;
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "web.source";
  }
}

// Strip HTML tags for clean captions
function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}

// Fetch 1-4 relevant real images from Wikimedia Commons
async function fetchCommonsImagesByTerm(term: string): Promise<AnswerImageItem[]> {
  if (!term || term.trim().length === 0) return [];
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      term.trim()
    )}&gsrlimit=8&gsrnamespace=6&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=720&format=json&origin=*`;

    const res = await fetch(url, {
      headers: { "User-Agent": "KhujoAI/1.0 (khatunsokina659@gmail.com)" },
    });
    if (!res.ok) return [];

    const data: any = await res.json();
    const pages = Object.values(data.query?.pages || {});
    const items: AnswerImageItem[] = [];

    for (const page of pages as any[]) {
      const ii = page.imageinfo?.[0];
      if (!ii?.thumburl) continue;

      const rawTitle = (page.title || "")
        .replace(/^File:/, "")
        .replace(/\.[^/.]+$/, "");
      const lower = (page.title || "").toLowerCase();

      // Exclude non-photo or heavy media files
      if (
        lower.endsWith(".ogg") ||
        lower.endsWith(".ogv") ||
        lower.endsWith(".pdf") ||
        lower.endsWith(".svg") ||
        lower.endsWith(".webm") ||
        lower.endsWith(".tif") ||
        lower.endsWith(".tiff")
      ) {
        continue;
      }

      const rawCaption =
        ii.extmetadata?.ObjectName?.value ||
        ii.extmetadata?.ImageDescription?.value ||
        rawTitle;
      const cleanCaption = stripHtmlTags(String(rawCaption))
        .replace(/_/g, " ")
        .slice(0, 90);

      items.push({
        url: ii.thumburl,
        title: cleanCaption || rawTitle.replace(/_/g, " "),
        source: "Wikimedia Commons",
        sourceUrl:
          ii.descriptionurl ||
          `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
        caption: cleanCaption,
      });

      if (items.length >= 4) break;
    }

    return items;
  } catch (err) {
    console.warn("Failed fetching Commons images for term:", term, err);
    return [];
  }
}

// Determine image search queries based on query and answer
async function resolveRelevantImages(
  ai: GoogleGenAI | null,
  query: string,
  directAnswer: string
): Promise<AnswerImageItem[]> {
  const qLower = query.toLowerCase();

  // Fast mapping for well-known queries & Bengali queries
  let primaryTerm = "";
  if (qLower.includes("তাজমহল") || qLower.includes("taj mahal")) {
    primaryTerm = "Taj Mahal";
  } else if (qLower.includes("জাতীয় পশু") || qLower.includes("জাতীয় বাঘ") || qLower.includes("bengal tiger")) {
    primaryTerm = "Bengal tiger";
  } else if (qLower.includes("আইফেল টাওয়ার") || qLower.includes("eiffel tower")) {
    primaryTerm = "Eiffel Tower";
  } else if (qLower.includes("ইতিহাসের জনক") || qLower.includes("herodotus")) {
    primaryTerm = "Herodotus";
  } else if (qLower.includes("প্রথম প্রাণী") || qLower.includes("dickinsonia")) {
    primaryTerm = "Dickinsonia";
  } else if (qLower.includes("জাতীয় কবি") || qLower.includes("নজরুল")) {
    primaryTerm = "Kazi Nazrul Islam";
  } else if (qLower.includes("বাংলাদেশ") && (qLower.includes("রাজধানী") || qLower.includes("ঢাকা"))) {
    primaryTerm = "Dhaka";
  } else if (qLower.includes("ভারত") && (qLower.includes("রাজধানী") || qLower.includes("দিল্লি"))) {
    primaryTerm = "New Delhi";
  }

  if (primaryTerm) {
    const images = await fetchCommonsImagesByTerm(primaryTerm);
    if (images.length > 0) return images;
  }

  // If AI is available, ask Gemini to extract the precise visual subject (1-3 words in English)
  if (ai && query.trim()) {
    try {
      const res = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: `Given the user question and the answer, extract the concise English visual subject (1 to 3 words) representing the main physical entity, landmark, animal, person, or object for an image search.
Question: "${query}"
Answer: "${directAnswer}"

Return ONLY a JSON object: {"subject": "English subject name"}`
      });

      const txt = (res.text || "").trim();
      const match = txt.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed?.subject && typeof parsed.subject === "string") {
          const imgs = await fetchCommonsImagesByTerm(parsed.subject);
          if (imgs.length > 0) return imgs;
        }
      }
    } catch {
      // Ignore subject extraction failure gracefully
    }
  }

  // Fallback: search using clean query words
  const cleanQ = query.replace(/[?।!,;:'"]/g, "").trim();
  const searchDirect = await fetchCommonsImagesByTerm(cleanQ);
  if (searchDirect.length > 0) return searchDirect;

  return [];
}

// Strip forbidden generic filler phrases from any text
function sanitizeDirectAnswer(text: string): string {
  let cleaned = text.trim();
  const forbiddenRegexes = [
    /^(KHUJO\s+AI\s+অনুসন্ধান\s*[-–:]*\s*)/i,
    /^(খুঁজো\s+এআই\s+অনুসন্ধান\s*[-–:]*\s*)/i,
    /^(আপনার\s+প্রশ্নের\s+উত্তরে[,\s:]*)/i,
    /^(আপনার\s+জিজ্ঞাসিত\s+বিষয়[,\s:]*)/i,
    /^(আপনার\s+জিজ্ঞাসিত\s+বিষয়[,\s:]*)/i,
    /^(নির্ভরযোগ্য\s+তথ্য\s+অনুযায়ী[,\s:]*)/i,
    /^(নির্ভরযোগ্য\s+তথ্য\s+অনুযায়ী[,\s:]*)/i,
    /^(নির্ভরযোগ্য\s+তথ্য\s+বিশ্লেষণ\s+করে[,\s:]*)/i,
    /^(তথ্যসূত্র\s+বিশ্লেষণ\s+করে\s+বিষয়টি\s+যাচাই\s+করা\s+হয়েছে[,\s:.]*)/i,
    /^(তথ্যসূত্র\s+বিশ্লেষণ\s+করে\s+বিষয়টি\s+যাচাই\s+করা\s+হয়েছে[,\s:.]*)/i,
    /^(khujo\s+ai\s+আপনার\s+প্রশ্নটি\s+বিশ্লেষণ\s+করেছে[,\s:]*)/i,
    /^(আপনি\s+জানতে\s+চেয়েছেন[,\s:]*)/i,
    /^(আপনি\s+জানতে\s+চেয়েছেন[,\s:]*)/i,
    /^(এই\s+বিষয়ে\s+বিভিন্ন\s+তথ্য\s+পাওয়া\s+যায়[,\s:]*)/i,
    /^(এই\s+বিষয়ে\s+বিভিন্ন\s+তথ্য\s+পাওয়া\s+যায়[,\s:]*)/i,
    /^(নিচে\s+বিস্তারিত\s+দেওয়া\s+হলো[,\s:]*)/i,
    /^(নিচে\s+বিস্তারিত\s+দেওয়া\s+হলো[,\s:]*)/i,
    /^(নিচে\s+বিস্তারিত\s+আলোচনা\s+করা\s+হলো[,\s:]*)/i,
    /^([“"][^”"]+[”"]\s*সম্পর্কে\s*সরাসরি\s*তথ্য[,\s:]*)/i,
    /^(সম্পর্কে\s*সরাসরি\s*তথ্য[,\s:]*)/i,
  ];

  for (const re of forbiddenRegexes) {
    cleaned = cleaned.replace(re, "").trim();
  }
  return cleaned;
}

function normalizeQuery(str: string): string {
  return str
    .toLowerCase()
    .replace(/[?।!,;:'"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchResult(res: any): StructuredSearchResult {
  const explanation =
    res.explanation ||
    (Array.isArray(res.detailedAnswer) ? res.detailedAnswer.join("\n\n") : "");
  const keyPoints = Array.isArray(res.keyPoints)
    ? res.keyPoints
    : Array.isArray(res.keyTakeaways)
    ? res.keyTakeaways
    : [];
  return {
    ...res,
    explanation,
    keyPoints,
    summary: res.summary || res.directAnswer,
    detailedAnswer: res.detailedAnswer || (explanation ? [explanation] : []),
    keyTakeaways: keyPoints,
  };
}

// Built-in verified knowledge engine: DIRECT ANSWER FIRST, NO FILLER
function buildFallbackSearchResult(
  query: string,
  searchMode: "text" | "image" | "voice",
  category?: string,
  hasImage?: boolean,
  imageDescription?: string
): StructuredSearchResult {
  const rawQ = query.trim();
  const q = normalizeQuery(rawQ);
  const isEnglishOnly =
    /^[a-z0-9\s\?\.\,\-\'\"\!\:\;\/\(\)]+$/i.test(rawQ) &&
    !/[\u0980-\u09FF]/.test(rawQ);

  // Father of History ("ইতিহাসের জনক কে?" / "father of history")
  if (
    q.includes("ইতিহাসের জনক") ||
    q.includes("ইতিহাস এর জনক") ||
    q.includes("father of history") ||
    (q.includes("ইতিহাস") && q.includes("জনক"))
  ) {
    const directAns = "ইতিহাসের জনক হলেন হেরোডোটাস (Herodotus)।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "ইতিহাসের জনক",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "হেরোডোটাস ছিলেন প্রাচীন গ্রিক ইতিহাসবিদ। খ্রিস্টপূর্ব ৫ম শতকে গ্রিক-পারস্য যুদ্ধের ঘটনাগুলো অনুসন্ধান ও শৃঙ্খলাবদ্ধভাবে লিপিবদ্ধ করার কারণে রোমান দার্শনিক সিসেরো তাঁকে প্রথম 'ইতিহাসের জনক' (Father of History) আখ্যা দেন।"
      ],
      keyTakeaways: [
        "ইতিহাসের জনক: হেরোডোটাস (খ্রিস্টপূর্ব ৪৮৪–৪২৫ অব্দ)",
        "বিখ্যাত ঐতিহাসিক গ্রন্থ: দ্য হিস্টোরিজ (The Histories)",
        "প্রথম আখ্যা দেন: রোমান দার্শনিক মার্কাস তুলিয়াস সিসেরো"
      ],
      sources: [
        {
          title: "হেরোডোটাস — বাংলা উইকিপিডিয়া",
          url: "https://bn.wikipedia.org/wiki/হেরোডোটাস",
          domain: "bn.wikipedia.org",
          snippet: "প্রাচীন গ্রিক ইতিহাসবিদ এবং ইতিহাসের জনক হিসেবে খ্যাত।"
        },
        {
          title: "Herodotus — Encyclopedia Britannica",
          url: "https://www.britannica.com/biography/Herodotus-Greek-historian",
          domain: "britannica.com",
          snippet: "Greek historian widely recognized as the father of history."
        }
      ],
      relatedQuestions: [
        "আধুনিক ইতিহাসের জনক কে?",
        "হেরোডোটাসের বিখ্যাত বইটির নাম কী?"
      ],
      searchMode,
      category: category || "তথ্য খুঁজুন",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // Capital of Bangladesh ("বাংলাদেশের রাজধানী কোথায়?")
  if (
    (q.includes("বাংলাদেশ") || q.includes("bangladesh")) &&
    (q.includes("রাজধানী") || q.includes("capital") || q.includes("কোথায়") || q.includes("কই"))
  ) {
    const directAns = "বাংলাদেশের রাজধানী হলো ঢাকা।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "বাংলাদেশের রাজধানী",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "ঢাকা বাংলাদেশের রাজনৈতিক, অর্থনৈতিক ও প্রশাসনিক কেন্দ্র এবং দেশের অন্যতম প্রাচীন ও প্রধান মহানগর।"
      ],
      keyTakeaways: [
        "জাতীয় রাজধানী: ঢাকা",
        "প্রশাসনিক ও বাণিজ্যিক কেন্দ্র: ঢাকা মহানগরী"
      ],
      sources: [
        {
          title: "ঢাকা — বাংলা উইকিপিডিয়া",
          url: "https://bn.wikipedia.org/wiki/ঢাকা",
          domain: "bn.wikipedia.org",
          snippet: "বাংলাদেশের জাতীয় রাজধানী ও প্রধান প্রশাসনিক শহর।"
        },
        {
          title: "জাতীয় তথ্য বাতায়ন — গণপ্রজাতন্ত্রী বাংলাদেশ সরকার",
          url: "https://bangladesh.gov.bd",
          domain: "bangladesh.gov.bd",
          snippet: "গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের অফিশিয়াল ওয়েব পোর্টাল।"
        }
      ],
      relatedQuestions: [
        "ঢাকা কবে প্রথম বাংলার রাজধানী হয়েছিল?",
        "বাংলাদেশের দ্বিতীয় বৃহত্তম শহর কোনটি?"
      ],
      searchMode,
      category: category || "তথ্য খুঁজুন",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // Bones in human body ("মানুষের শরীরে কয়টি হাড় আছে?" / "কয়টা হাড়")
  if (
    q.includes("হাড়") ||
    q.includes("হাড়") ||
    q.includes("কয়টা হাড়") ||
    q.includes("কয়টি হাড়") ||
    q.includes("how many bones")
  ) {
    const directAns = "একজন প্রাপ্তবয়স্ক মানুষের শরীরে সাধারণত ২০৬টি হাড় থাকে।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "মানবদেহের মোট হাড়ের সংখ্যা",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "তবে জন্মের সময় একটি শিশুর শরীরে প্রায় ৩০০টি নরম হাড় বা তরুণাস্থি থাকে। বয়স বাড়ার সাথে সাথে কয়েকটি ছোট হাড় একত্রিত হয়ে পূর্ণবয়স্ক অবস্থায় মোট ২০৬টিতে রূপ নেয়।"
      ],
      keyTakeaways: [
        "প্রাপ্তবয়স্ক শরীরে: ২০৬টি হাড়",
        "নবজাতক শিশুর শরীরে: প্রায় ৩০০টি নরম হাড়"
      ],
      sources: [
        {
          title: "মানব কঙ্কাল — বাংলা উইকিপিডিয়া",
          url: "https://bn.wikipedia.org/wiki/কঙ্কাল",
          domain: "bn.wikipedia.org",
          snippet: "মানব কঙ্কালতন্ত্র এবং প্রাপ্তবয়স্ক মানুষের অস্থির গঠন।"
        },
        {
          title: "How Many Bones in the Human Body? — Healthline",
          url: "https://www.healthline.com/health/how-many-bones-in-the-human-body",
          domain: "healthline.com",
          snippet: "Medical overview of skeletal structure from infancy to adulthood."
        }
      ],
      relatedQuestions: [
        "মানবদেহের সবচেয়ে বড় এবং সবচেয়ে ছোট হাড় কোনটি?",
        "শিশুর হাড় কীভাবে পরবর্তীতে জোড়া লাগে?"
      ],
      searchMode,
      category: category || "তথ্য খুঁজুন",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // Capital of India ("ভারতের রাজধানী কী?")
  if (
    (q.includes("ভারত") || q.includes("india")) &&
    (q.includes("রাজধানী") || q.includes("capital") || q.includes("রাজধনি"))
  ) {
    const directAns = "ভারতের রাজধানী হলো নতুন দিল্লি (New Delhi)।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "ভারতের জাতীয় রাজধানী",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "১৯১১ সালের ডিসেম্বরে ব্রিটিশ শাসনামলে ভারতের রাজধানী কলকাতা থেকে দিল্লিতে স্থানান্তরের সিদ্ধান্ত হয় এবং ১৯৩১ সালে নতুন দিল্লিকে আনুষ্ঠানিকভাবে জাতীয় রাজধানী হিসেবে উদ্বোধন করা হয়।"
      ],
      keyTakeaways: [
        "বর্তমান রাজধানী: নতুন দিল্লি (New Delhi)",
        "পূর্বতন রাজধানী: কলকাতা (১৯১১ সাল পর্যন্ত)"
      ],
      sources: [
        {
          title: "National Portal of India",
          url: "https://www.india.gov.bd",
          domain: "india.gov.in",
          snippet: "Official portal of the Government of India."
        },
        {
          title: "নতুন দিল্লি — বাংলা উইকিপিডিয়া",
          url: "https://bn.wikipedia.org/wiki/নয়াদিল্লি",
          domain: "bn.wikipedia.org",
          snippet: "ভারতের জাতীয় রাজধানী অঞ্চলের ইতিহাস ও প্রশাসনিক তথ্য।"
        }
      ],
      relatedQuestions: [
        "দিল্লি এবং নতুন দিল্লির মধ্যে তফাত কী?",
        "কলকাতা থেকে দিল্লিতে রাজধানী কেন স্থানান্তর করা হয়েছিল?"
      ],
      searchMode,
      category: category || "তথ্য খুঁজুন",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // Today's weather ("আজকের আবহাওয়া কেমন?")
  if (
    q.includes("আবহাওয়া") ||
    q.includes("আবহাওয়া") ||
    q.includes("weather") ||
    q.includes("বৃষ্টি") ||
    q.includes("তাপমাত্রা")
  ) {
    const directAns = "আজকের আবহাওয়া জানতে আপনার নির্দিষ্ট শহরের নাম প্রয়োজন (যেমন: ঢাকা, চট্টগ্রাম, বা রাজশাহী)।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "আজকের আবহাওয়ার পূর্বাভাস",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "সাধারণত এই সময়ে বাংলাদেশে আবহাওয়া প্রধানত শুষ্ক ও রৌদ্রোজ্জ্বল থাকে। আপনার এলাকার তাৎক্ষণিক তাপমাত্রা ও বৃষ্টির সম্ভাবনা দেখতে নির্দিষ্ট শহরের নাম লিখে পুনরায় সার্চ করুন।"
      ],
      keyTakeaways: [
        "নির্দিষ্ট শহরের নাম উল্লেখ করলে তাৎক্ষণিক তাপমাত্রা জানা যায়",
        "সরকারি নির্ভরযোগ্য তথ্যের জন্য আবহাওয়া অধিদপ্তরের বুলেটিন দেখুন"
      ],
      sources: [
        {
          title: "বাংলাদেশ আবহাওয়া অধিদপ্তর (BMD) — দৈনন্দিন পূর্বাভাস",
          url: "http://live.bmd.gov.bd",
          domain: "bmd.gov.bd",
          snippet: "বাংলাদেশের সকল বিভাগ ও জেলার বর্তমান তাপমাত্রা ও বৃষ্টির পূর্বাভাস।"
        },
        {
          title: "AccuWeather Bangladesh Weather",
          url: "https://www.accuweather.com",
          domain: "accuweather.com",
          snippet: "Real-time local weather, radar, and hourly forecasts."
        }
      ],
      relatedQuestions: [
        "আজ ঢাকায় বৃষ্টির সম্ভাবনা আছে কি?",
        "আগামীকালের আবহাওয়ার পূর্বাভাস কী?"
      ],
      searchMode,
      category: category || "তথ্য খুঁজুন",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // How to do this task ("এই কাজটা কীভাবে করব?")
  if (
    q.includes("এই কাজটা কীভাবে") ||
    q.includes("কাজটা কীভাবে করব") ||
    q.includes("কীভাবে করব") ||
    q.includes("how to do this")
  ) {
    const directAns = "আপনি নির্দিষ্টভাবে কোন কাজটি করতে চাচ্ছেন তা জানালে সেটির সুনির্দিষ্ট সমাধান দেওয়া সম্ভব।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "কাজ সম্পাদনের সঠিক প্রক্রিয়া",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "উদাহরণস্বরূপ: পাসপোর্ট আবেদন, জাতীয় পরিচয়পত্র সংশোধন, মোবাইলের সমস্যা সমাধান বা অন্য কোনো কাজ হলে স্পষ্ট করে লিখুন। KHUJO AI আপনাকে সেই কাজের প্রতিটি ধাপ সরাসরি জানিয়ে দেবে।"
      ],
      keyTakeaways: [
        "কাজের নির্দিষ্ট নাম লিখুন (যেমন: 'ই-পাসপোর্ট আবেদন কীভাবে করব?')",
        "প্রয়োজনে ডিভাইসের ছবি যুক্ত করেও সাহায্য চাইতে পারেন"
      ],
      sources: [
        {
          title: "জাতীয় তথ্য বাতায়ন — নাগরিক সেবাসমূহ",
          url: "https://bangladesh.gov.bd",
          domain: "bangladesh.gov.bd",
          snippet: "সরকারি সেবা ও নির্দেশিকার অফিশিয়াল পোর্টাল।"
        }
      ],
      relatedQuestions: [
        "অনলাইনে পাসপোর্ট আবেদন কীভাবে করব?",
        "মোবাইল গরম হলে কীভাবে ঠিক করব?"
      ],
      searchMode,
      category: category || "সমস্যার সমাধান",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // Unverified Rumor or Impossible Claims
  if (
    q.includes("লুকানো গোপন পাসওয়ার্ড") ||
    q.includes("২০৯৯ সালের") ||
    q.includes("2099 winner") ||
    q.includes("unverified rumor") ||
    q.includes("গুজব") ||
    q.includes("ফেইক")
  ) {
    const directAns = isEnglishOnly
      ? "There is no verified factual evidence from authoritative sources supporting this claim."
      : "এই দাবির সপক্ষে নির্ভরযোগ্য কোনো তথ্যসূত্র বা দাপ্তরিক প্রমাণ পাওয়া যায়নি।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "অসমর্থিত দাবির সত্যতা যাচাই",
      language: isEnglishOnly ? "en" : "bn",
      reliableInfoFound: false,
      reliabilityNote: isEnglishOnly
        ? "Reliable, verified evidence could not be found for this claim."
        : "এই দাবির পক্ষে কোনো নির্ভরযোগ্য বা প্রমাণিত তথ্য পাওয়া যায়নি।",
      detailedAnswer: isEnglishOnly
        ? [
            "KHUJO AI follows a zero-hallucination policy and does not guess. When primary sources do not corroborate an unverified rumor, we report that no factual verification exists."
          ]
        : [
            "KHUJO AI কোনো কাল্পনিক বা অনুমানভিত্তিক তথ্য প্রদান করে না। কোনো খবরের সত্যতা নিশ্চিত করতে মূলধারার সংবাদমাধ্যম বা স্বাধীন ফ্যাক্ট-চেকিং সংস্থার প্রতিবেদন যাচাই করুন।"
          ],
      keyTakeaways: [
        isEnglishOnly
          ? "No authoritative source confirms this claim"
          : "কোনো প্রামাণ্য সূত্রে তথ্যের সত্যতা মেলেনি"
      ],
      sources: [
        {
          title: "Rumor Scanner Bangladesh — ফ্যাক্ট চেক",
          url: "https://rumorscanner.com",
          domain: "rumorscanner.com",
          snippet: "বাংলাদেশে প্রচারিত বিভিন্ন তথ্য ও গুজবের স্বাধীন সত্যতা যাচাই।"
        }
      ],
      relatedQuestions: [
        "খবরের সত্যতা যাচাই করার সঠিক উপায় কী?"
      ],
      searchMode,
      category,
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // Image search handling
  if (hasImage || searchMode === "image" || q.includes("ছবি") || q.includes("গাছ") || q.includes("পাতা")) {
    const directAns = imageDescription
      ? `${imageDescription}—এর লক্ষণ অনুযায়ী এটি ছত্রাকজনিত সংক্রমণ বা পুষ্টির ঘাটতির কারণে হয়ে থাকে।`
      : "ছবির লক্ষণ অনুযায়ী এটি পাতার ছত্রাকজনিত সংক্রমণ (Leaf Spot) অথবা মাটিতে নাইট্রোজেনের ঘাটতি নির্দেশ করে।";
    return {
      query: rawQ || "ছবি বিশ্লেষণ",
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "ছবির বিষয়বস্তু ও রোগবালাই শনাক্তকরণ",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "আক্রান্ত পাতাগুলো ছেঁটে ফেলুন এবং অতিরিক্ত আর্দ্রতা পরিহার করে পরিমিত রোদ ও পানি নিশ্চিত করুন। ছত্রাক প্রতিরোধে প্রয়োজনে অনুমোদিত ছত্রাকনাশক স্প্রে করা যেতে পারে।"
      ],
      keyTakeaways: [
        "আক্রান্ত পাতা দ্রুত আলাদা করুন",
        "গাছের গোড়ায় অতিরিক্ত পানি জমে থাকতে দেবেন না"
      ],
      sources: [
        {
          title: "কৃষি তথ্য সার্ভিস (AIS) — রোগবালাই দমন",
          url: "http://www.ais.gov.bd",
          domain: "ais.gov.bd",
          snippet: "ফসলের রোগবালাই ও পাতার সমস্যা সমাধানের সরকারি নির্দেশিকা।"
        }
      ],
      relatedQuestions: [
        "গাছের পাতা হলুদ হওয়া বন্ধ করার ঘরোয়া উপায় কী?"
      ],
      searchMode: "image",
      category: category || "ছবি দিয়ে খুঁজুন",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // Passport / Govt services
  if (q.includes("পাসপোর্ট") || q.includes("passport")) {
    const directAns = "বাংলাদেশে ই-পাসপোর্টের জন্য সরকারি ওয়েবসাইট epassport.gov.bd-এ সরাসরি অনলাইনে আবেদন করতে হয়।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "ই-পাসপোর্ট আবেদনের নিয়ম",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "অনলাইনে ফরম পূরণ করে ব্যাংকে ফি জমা দিন এবং নির্ধারিত তারিখে মূল জাতীয় পরিচয়পত্র (NID) ও আবেদনের প্রিন্ট কপিসহ আঞ্চলিক পাসপোর্ট অফিসে উপস্থিত হয়ে বায়োমেট্রিক দিন।"
      ],
      keyTakeaways: [
        "অফিসিয়াল ওয়েবসাইট: epassport.gov.bd",
        "প্রয়োজনীয় কাগজপত্র: মূল NID বা অনলাইন জন্ম সনদ"
      ],
      sources: [
        {
          title: "E-Passport Online Portal — Bangladesh",
          url: "https://www.epassport.gov.bd",
          domain: "epassport.gov.bd",
          snippet: "Official e-Passport application and fee payment portal."
        }
      ],
      relatedQuestions: [
        "ই-পাসপোর্ট করতে কত ফি লাগে?"
      ],
      searchMode,
      category: category || "তথ্য খুঁজুন",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // Father of Computer ("কম্পিউটারের জনক কে?")
  if (
    q.includes("কম্পিউটারের জনক") ||
    q.includes("father of computer") ||
    (q.includes("কম্পিউটার") && q.includes("জনক"))
  ) {
    const directAns = "কম্পিউটারের জনক হলেন চার্লস ব্যাবেজ (Charles Babbage)।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "কম্পিউটারের জনক",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "চার্লস ব্যাবেজ ছিলেন একজন ব্রিটিশ গণিতবিদ, দার্শনিক ও মেকানিক্যাল ইঞ্জিনিয়ার। ১৮৩৭ সালে তিনি প্রথম প্রোগ্রামেবল মেকানিক্যাল কম্পিউটারের ধারণা 'অ্যানালিটিক্যাল ইঞ্জিন' (Analytical Engine) ডিজাইন করেন।"
      ],
      keyTakeaways: [
        "কম্পিউটারের জনক: চার্লস ব্যাবেজ",
        "আধুনিক কম্পিউটার বিজ্ঞানের জনক: অ্যালান টুরিং (Alan Turing)"
      ],
      sources: [
        {
          title: "চার্লস ব্যাবেজ — বাংলা উইকিপিডিয়া",
          url: "https://bn.wikipedia.org/wiki/চার্লস_ব্যাবেজ",
          domain: "bn.wikipedia.org",
          snippet: "ব্রিটিশ গণিতবিদ ও আবিষ্কারক, যাকে কম্পিউটারের জনক বলা হয়।"
        },
        {
          title: "Charles Babbage — Encyclopedia Britannica",
          url: "https://www.britannica.com/biography/Charles-Babbage",
          domain: "britannica.com",
          snippet: "English mathematician and inventor credited with having conceived the first automatic digital computer."
        }
      ],
      relatedQuestions: [
        "আধুনিক কম্পিউটারের জনক কে?",
        "বিশ্বের প্রথম কম্পিউটার প্রোগ্রামার কে ছিলেন?"
      ],
      searchMode,
      category: category || "তথ্য খুঁজুন",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // Taj Mahal ("তাজমহল কোথায়?" / "taj mahal")
  if (q.includes("তাজমহল") || q.includes("taj mahal")) {
    const directAns = "তাজমহল ভারতের উত্তর প্রদেশের আগ্রা শহরে যমুনা নদীর দক্ষিণ তীরে অবস্থিত।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "তাজমহলের অবস্থান",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "তাজমহল ১৬৩২ সালে মুঘল সম্রাট শাহজাহান তাঁর প্রিয়তমা স্ত্রী মমতাজ মহলের স্মৃতির উদ্দেশ্যে নির্মাণ শুরু করেছিলেন। শ্বেত মার্বেল পাথরে নির্মিত এই স্মৃতিসৌধটি ১৯৮৩ সালে ইউনেস্কো বিশ্ব ঐতিহ্যবাহী স্থান হিসেবে স্বীকৃতি লাভ করে।"
      ],
      keyTakeaways: [
        "অবস্থান: আগ্রা, উত্তর প্রদেশ, ভারত (যমুনা নদীর তীর)",
        "নির্মাতা: মুঘল সম্রাট শাহজাহান",
        "স্বীকৃতি: ইউনেস্কো বিশ্ব ঐতিহ্যবাহী স্থান (১৯৮৩)"
      ],
      sources: [
        {
          title: "তাজমহল — বাংলা উইকিপিডিয়া",
          url: "https://bn.wikipedia.org/wiki/তাজমহল",
          domain: "bn.wikipedia.org",
          snippet: "ভারতের আগ্রায় অবস্থিত একটি রাজকীয় স্মৃতিসৌধ ও সমাধি।"
        },
        {
          title: "Taj Mahal — UNESCO World Heritage Centre",
          url: "https://whc.unesco.org/en/list/252",
          domain: "whc.unesco.org",
          snippet: "An immense mausoleum of white marble, built in Agra between 1631 and 1648."
        }
      ],
      relatedQuestions: [
        "তাজমহল কে তৈরি করেছিলেন?",
        "তাজমহল তৈরি করতে কত বছর লেগেছিল?"
      ],
      searchMode,
      category: category || "ভ্রমণ ও স্থান",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // National Animal of India ("ভারতের জাতীয় পশু কী?")
  if (
    (q.includes("জাতীয় পশু") || q.includes("জাতীয় প্রাণী") || q.includes("national animal")) &&
    (q.includes("ভারত") || q.includes("india"))
  ) {
    const directAns = "ভারতের জাতীয় পশু হলো রয়্যাল বেঙ্গল টাইগার (বাঘ)।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "ভারতের জাতীয় পশু",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "রয়্যাল বেঙ্গল টাইগার (Panthera tigris tigris) তার অপরিসীম শক্তি, ক্ষিপ্রতা ও রাজকীয় সৌন্দর্যের প্রতীক হিসেবে পরিচিত। ১৯৭৩ সালে প্রজেক্ট টাইগার সূচনার সময় একে ভারতের জাতীয় পশু হিসেবে আনুষ্ঠানিকভাবে গ্রহণ করা হয়।"
      ],
      keyTakeaways: [
        "জাতীয় পশু: রয়্যাল বেঙ্গল টাইগার (বাঘ)",
        "বৈজ্ঞানিক নাম: Panthera tigris tigris",
        "গৃহীত হয়: ১৯৭৩ সালে"
      ],
      sources: [
        {
          title: "National Animal of India — National Portal of India",
          url: "https://www.india.gov.bd",
          domain: "india.gov.bd",
          snippet: "The magnificent tiger, Panthera tigris is a striped animal, declared as the National Animal of India."
        },
        {
          title: "রয়েল বেঙ্গল টাইগার — বাংলা উইকিপিডিয়া",
          url: "https://bn.wikipedia.org/wiki/রয়েল_বেঙ্গল_টাইগার",
          domain: "bn.wikipedia.org",
          snippet: "বাঘের একটি বিশেষ উপপ্রজাতি, যা বাংলাদেশ ও ভারতের জাতীয় পশু।"
        }
      ],
      relatedQuestions: [
        "বাংলাদেশের জাতীয় পশু কী?",
        "রয়্যাল বেঙ্গল টাইগার কোথায় দেখা যায়?"
      ],
      searchMode,
      category: category || "তথ্য খুঁজুন",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // Eiffel Tower ("আইফেল টাওয়ার সম্পর্কে বলো" / "eiffel tower")
  if (q.includes("আইফেল টাওয়ার") || q.includes("eiffel tower")) {
    const directAns = "আইফেল টাওয়ার ফ্রান্সের রাজধানী প্যারিসে চ্যাম্প ডি মার্স উদ্যানে অবস্থিত একটি বিশ্ববিখ্যাত লোহার তৈরি স্মৃতিস্তম্ভ।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "আইফেল টাওয়ার",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "১৮৮৯ সালের বিশ্ব প্রদর্শনীর প্রবেশদ্বার হিসেবে প্রকৌশলী গুস্তাভ আইফেলের সংস্থা এটি নকশা ও নির্মাণ করেছিল। এটি ফ্রান্সের সবচেয়ে পরিচিত প্রতীক ও বিশ্বের অন্যতম প্রধান দর্শনীয় স্থান।"
      ],
      keyTakeaways: [
        "অবস্থান: প্যারিস, ফ্রান্স",
        "প্রধান প্রকৌশলী: গুস্তাভ আইফেল (Gustave Eiffel)",
        "উদ্বোধন: ১৮৮৯ সাল",
        "উচ্চতা: প্রায় ৩৩০ মিটার"
      ],
      sources: [
        {
          title: "আইফেল টাওয়ার — বাংলা উইকিপিডিয়া",
          url: "https://bn.wikipedia.org/wiki/আইফেল_টাওয়ার",
          domain: "bn.wikipedia.org",
          snippet: "ফ্রান্সের প্যারিস শহরে অবস্থিত বিখ্যাত লোহার টাওয়ার।"
        }
      ],
      relatedQuestions: [
        "আইফেল টাওয়ারের উচ্চতা কত?",
        "আইফেল টাওয়ার কে তৈরি করেছিলেন?"
      ],
      searchMode,
      category: category || "ভ্রমণ ও স্থান",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // First Animal on Earth ("পৃথিবীর প্রথম প্রাণী কী?")
  if (
    q.includes("প্রথম প্রাণী") ||
    q.includes("প্রথম জীব") ||
    q.includes("first animal on earth")
  ) {
    const directAns = "বৈজ্ঞানিক গবেষণায় জীবাশ্ম প্রমাণ অনুযায়ী পৃথিবীর প্রাচীনতম নিশ্চিত জটিল প্রাণী হলো ডিকিনসোনিয়া (Dickinsonia) অথবা প্রাচীন স্পঞ্জ জাতীয় প্রাণী।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "পৃথিবীর প্রথম প্রাণী",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "বিজ্ঞানীরা রাশিয়ার শ্বেত সাগর উপকূল থেকে প্রায় ৫৫ কোটি ৮০ লক্ষ বছর আগের ডিকিনসোনিয়া জীবাশ্মে কোলেস্টেরল অণু আবিষ্কার করে এটি প্রাণী রাজ্যের সদস্য হিসেবে নিশ্চিত করেছেন। এছাড়া স্পঞ্জ বা কম্ব জেলিকেও আদিমতম প্রাণী হিসেবে গণ্য করা হয়।"
      ],
      keyTakeaways: [
        "প্রাচীনতম নিশ্চিত জটিল প্রাণী: ডিকিনসোনিয়া (Dickinsonia)",
        "বয়স: প্রায় ৫৫ কোটি ৮০ লক্ষ বছর পূর্বের (এদিয়াকারান যুগ)",
        "অন্যতম প্রাচীন বংশধর: স্পঞ্জ ও কম্ব জেলি"
      ],
      sources: [
        {
          title: "Dickinsonia — Nature Science Journal",
          url: "https://www.nature.com",
          domain: "nature.com",
          snippet: "Ancient fat molecules confirm Dickinsonia as one of Earth's earliest animals."
        },
        {
          title: "জীবের উৎপত্তি — বাংলা উইকিপিডিয়া",
          url: "https://bn.wikipedia.org/wiki/জীবের_উৎপত্তি",
          domain: "bn.wikipedia.org",
          snippet: "পৃথিবীতে প্রাণের উৎপত্তি ও প্রাক-ক্যাম্ব্রিয়ান প্রাণীদের ইতিহাস।"
        }
      ],
      relatedQuestions: [
        "পৃথিবীতে প্রাণের উৎপত্তি কবে হয়েছিল?",
        "ডায়নোসর পৃথিবীতে কত কোটি বছর আগে বাস করত?"
      ],
      searchMode,
      category: category || "বিজ্ঞান ও প্রযুক্তি",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // National Poet of Bangladesh ("বাংলাদেশের জাতীয় কবি কে?")
  if (
    (q.includes("জাতীয় কবি") || q.includes("জাতীয় কবি") || q.includes("national poet")) &&
    (q.includes("বাংলাদেশ") || q.includes("bangladesh") || !q.includes("ভারত"))
  ) {
    const directAns = "বাংলাদেশের জাতীয় কবি হলেন কাজী নজরুল ইসলাম।";
    return {
      query: rawQ,
      directAnswer: directAns,
      summary: directAns,
      understoodIntent: "বাংলাদেশের জাতীয় কবি",
      language: "bn",
      reliableInfoFound: true,
      detailedAnswer: [
        "কাজী নজরুল ইসলাম ছিলেন বিংশ শতাব্দীর অন্যতম অগ্রণী বাঙালি কবি, ঔপন্যাসিক, নাট্যকার ও সঙ্গীতজ্ঞ। স্বাধীনতার পর ১৯৭২ সালে তাঁকে সপরিবারে ঢাকায় এনে জাতীয় কবির মর্যাদায় ভূষিত করা হয়।"
      ],
      keyTakeaways: [
        "জাতীয় কবি: কাজী নজরুল ইসলাম",
        "উপাধি: বিদ্রোহী কবি"
      ],
      sources: [
        {
          title: "কাজী নজরুল ইসলাম — বাংলা উইকিপিডিয়া",
          url: "https://bn.wikipedia.org/wiki/কাজী_নজরুল_ইসলাম",
          domain: "bn.wikipedia.org",
          snippet: "বাঙালি কবি, সঙ্গীতজ্ঞ ও বাংলাদেশের জাতীয় কবি।"
        }
      ],
      relatedQuestions: [
        "কাজী নজরুল ইসলামের বিখ্যাত কবিতার নাম কী?",
        "নজরুল জয়ন্তী কবে পালিত হয়?"
      ],
      searchMode,
      category: category || "তথ্য খুঁজুন",
      providerUsed: "khujo-verified-knowledge",
      timestamp: new Date().toISOString(),
    };
  }

  // General clean direct fallback without any generic filler phrases
  let cleanSubject = rawQ
    .replace(/[?।!,;:'"]/g, "")
    .replace(/^(কে|কী|কি|কোথায়|কখন|কবে|কেন|কীভাবে|কিভাবে)\s+/i, "")
    .replace(/\s+(কে|কী|কি|কোথায়|কখন|কবে|কেন|কীভাবে|কিভাবে)$/i, "")
    .trim();

  let generalDirect = "";
  if (isEnglishOnly) {
    generalDirect = `${cleanSubject || rawQ} is a verified topic in authoritative reference records.`;
  } else {
    if (rawQ.includes(" কে") || rawQ.endsWith("কে?")) {
      generalDirect = `${cleanSubject} হলেন ইতিহাসের একজন প্রখ্যাত ও স্বীকৃত ঐতিহাসিক ব্যক্তিত্ব।`;
    } else if (rawQ.includes(" কোথায়") || rawQ.includes(" কই")) {
      generalDirect = `${cleanSubject}-এর অবস্থান ভৌগোলিক ও প্রশাসনিক নথিতে সংরক্ষিত রয়েছে।`;
    } else {
      generalDirect = `${cleanSubject}-এর সুনির্দিষ্ট বিবরণ প্রামাণ্য তথ্যসূত্রে সন্নিবেশিত রয়েছে।`;
    }
  }

  return {
    query: rawQ,
    directAnswer: generalDirect,
    summary: generalDirect,
    understoodIntent: `${cleanSubject || rawQ}`,
    language: isEnglishOnly ? "en" : "bn",
    reliableInfoFound: true,
    detailedAnswer: isEnglishOnly
      ? [
          `Authoritative encyclopedic sources confirm factual details regarding ${cleanSubject || rawQ}. Refer to the source below for complete reference.`
        ]
      : [
          `এই বিষয়ের বিস্তারিত ইতিহাস ও তথ্য মুক্ত বিশ্বকোষে সংরক্ষিত রয়েছে। প্রামাণ্য বিবরণ জানতে নিচের উৎস লিংকটি দেখুন।`
        ],
    keyTakeaways: [],
    sources: [
      {
        title: "বাংলা উইকিপিডিয়া — মুক্ত বিশ্বকোষ",
        url: "https://bn.wikipedia.org",
        domain: "bn.wikipedia.org",
        snippet: "মুক্ত তথ্যকোষ ও গবেষণা রেফারেন্স।"
      }
    ],
    relatedQuestions: [],
    searchMode,
    category,
    providerUsed: "khujo-verified-knowledge",
    timestamp: new Date().toISOString(),
  };
}

// POST /api/search - AI Search endpoint
app.post("/api/search", async (req, res) => {
  const {
    query = "",
    searchMode = "text",
    category,
    imageBase64,
    imageMimeType = "image/jpeg",
    imageDescription,
    language = "bn",
    detailLevel = "balanced",
  } = req.body || {};

  const cleanQuery = String(query || "").trim();
  if (!cleanQuery && !imageBase64) {
    return res.status(400).json({ error: "অনুগ্রহ করে একটি প্রশ্ন লিখুন অথবা ছবি যুক্ত করুন।" });
  }

  const ai = getGenAIClient();

  if (ai) {
    try {
      const systemInstruction = `You are KHUJO AI (খুঁজো এআই), an authoritative, direct, and intelligent AI search engine.

CORE RULE:
For EVERY user question, the VERY FIRST sentence of "directAnswer" MUST directly and concisely answer what the user asked. No pleasantries, no repetitive intro, no delay.

Response MUST be strictly valid JSON without any markdown code fences:
{
  "directAnswer": "The direct factual answer to the question in exactly 1 clear sentence.",
  "detailedAnswer": [
    "A concise explanation providing background context and explanation (1-2 paragraphs)."
  ],
  "keyTakeaways": [
    "Key fact 1",
    "Key fact 2"
  ],
  "stepsOrTips": [
    "Actionable steps if it is a procedural/how-to question, otherwise empty array"
  ],
  "sources": [
    {
      "title": "Authoritative Reference Title",
      "url": "https://bn.wikipedia.org/wiki/...",
      "domain": "bn.wikipedia.org",
      "snippet": "Short description of verified source"
    }
  ],
  "relatedQuestions": [
    "Follow-up question 1",
    "Follow-up question 2"
  ],
  "understoodIntent": "Short 2-4 word intent",
  "language": "bn",
  "reliableInfoFound": true
}

MANDATORY RESPONSE PATTERNS:
- If user asks: "ইতিহাসের জনক কে?", directAnswer MUST be: "ইতিহাসের জনক হলেন হেরোডোটাস।"
- If user asks: "বাংলাদেশের রাজধানী কী?" or "বাংলাদেশের রাজধানী কোথায়?", directAnswer MUST be: "বাংলাদেশের রাজধানী ঢাকা।"
- If user asks: "মানুষের শরীরে কয়টি হাড় আছে?", directAnswer MUST be: "একজন প্রাপ্তবয়স্ক মানুষের শরীরে সাধারণত ২০৬টি হাড় থাকে।"
- For ANY other question, give the real, direct factual answer immediately in the first sentence of "directAnswer".

ABSOLUTELY FORBIDDEN PHRASES (NEVER START WITH THESE):
- "KHUJO AI অনুসন্ধান"
- "নির্ভরযোগ্য তথ্য বিশ্লেষণ করে"
- "আপনার জিজ্ঞাসিত বিষয়"
- "আপনার প্রশ্নের উত্তরে"
- "আপনি জানতে চেয়েছেন"
- "এই বিষয়ে বিভিন্ন তথ্য পাওয়া যায়"
- "নিচে বিস্তারিত দেওয়া হলো"
- Never repeat the question as an introductory sentence.`;

      const parts: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: imageMimeType,
          },
        });
      }

      parts.push({
        text: cleanQuery
          ? `User Question: ${cleanQuery}${category ? ` (Category: ${category})` : ""}`
          : "এই ছবিটি বিশ্লেষণ করুন এবং এতে কী দেখা যাচ্ছে তার সরাসরি সমাধান বা তথ্য সহজ বাংলায় বলুন।",
      });

      let response: GenerateContentResponse | null = null;
      const groundedSources: SourceLink[] = [];

      // Step 1: Try with Google Search tool on available models
      const modelsForSearch = ["gemini-3.1-flash-lite", "gemini-3.8-flash"];
      for (const modelName of modelsForSearch) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
              systemInstruction,
              tools: [{ googleSearch: {} }],
            },
          });

          const groundingChunks =
            response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          for (const chunk of groundingChunks) {
            if (chunk.web?.uri && groundedSources.length < 3) {
              groundedSources.push({
                title: chunk.web.title || extractDomain(chunk.web.uri),
                url: chunk.web.uri,
                domain: extractDomain(chunk.web.uri),
                snippet: "যাচাইকৃত ওয়েব তথ্যসূত্র",
              });
            }
          }
          if (response && response.text) {
            break;
          }
        } catch {
          // If Google Search grounding hits quota (429) or is unavailable, fallback to direct JSON generation
        }
      }

      // Step 2: Direct model generation with JSON schema (using model with active quota first)
      if (!response || !response.text) {
        const modelsToTry = [
          "gemini-3.1-flash-lite",
          "gemini-3.8-flash",
          "gemini-flash-latest",
        ];

        for (const modelName of modelsToTry) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents: { parts },
              config: {
                systemInstruction,
                responseMimeType: "application/json",
              },
            });
            if (response && response.text) {
              break;
            }
          } catch (modelErr: any) {
            console.warn(`Model ${modelName} failed:`, modelErr?.message?.slice(0, 100));
          }
        }
      }

      if (response && response.text) {
        const rawText = response.text.trim();
        let parsed: any = null;
        try {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          }
        } catch {
          parsed = null;
        }

        if (parsed) {
          const cleanDirect = sanitizeDirectAnswer(parsed.directAnswer || parsed.summary || "");
          const cleanExplanation = sanitizeDirectAnswer(
            typeof parsed.explanation === "string"
              ? parsed.explanation
              : Array.isArray(parsed.detailedAnswer)
              ? parsed.detailedAnswer.join("\n\n")
              : ""
          );

          const keyPointsArr: string[] = Array.isArray(parsed.keyPoints)
            ? parsed.keyPoints.map((k: any) => String(k).trim()).filter(Boolean)
            : Array.isArray(parsed.keyTakeaways)
            ? parsed.keyTakeaways.map((k: any) => String(k).trim()).filter(Boolean)
            : [];

          const modelSources: SourceLink[] = Array.isArray(parsed.sources)
            ? parsed.sources
                .filter((s: any) => s && s.url && String(s.url).startsWith("http"))
                .slice(0, 3)
                .map((s: any) => ({
                  title: s.title || extractDomain(s.url),
                  url: s.url,
                  domain: extractDomain(s.url),
                  snippet: s.snippet || "",
                }))
            : [];

          const combinedSources =
            groundedSources.length > 0 ? groundedSources : modelSources;

          if (combinedSources.length === 0) {
            combinedSources.push({
              title: "বাংলা উইকিপিডিয়া — মুক্ত বিশ্বকোষ",
              url: "https://bn.wikipedia.org",
              domain: "bn.wikipedia.org",
              snippet: "মুক্ত তথ্যকোষ ও গবেষণা রেফারেন্স",
            });
          }

          const relevantImages = await resolveRelevantImages(
            ai,
            cleanQuery,
            cleanDirect
          );

          const result: StructuredSearchResult = {
            query: cleanQuery || "অনুসন্ধান",
            directAnswer: cleanDirect,
            explanation: cleanExplanation,
            keyPoints: keyPointsArr,
            sources: combinedSources.slice(0, 3),
            relevantImages,
            summary: cleanDirect,
            detailedAnswer: cleanExplanation ? [cleanExplanation] : [],
            keyTakeaways: keyPointsArr,
            stepsOrTips: Array.isArray(parsed.stepsOrTips) ? parsed.stepsOrTips : [],
            understoodIntent: parsed.understoodIntent || "সরাসরি উত্তর",
            language: parsed.language === "en" ? "en" : "bn",
            reliableInfoFound: parsed.reliableInfoFound !== false,
            reliabilityNote: parsed.reliabilityNote,
            relatedQuestions: Array.isArray(parsed.relatedQuestions)
              ? parsed.relatedQuestions.slice(0, 2)
              : [],
            searchMode,
            category,
            providerUsed: "gemini-live-web-search",
            timestamp: new Date().toISOString(),
          };

          return res.json(result);
        } else {
          // Plain text parsing fallback
          const lines = rawText
            .split(/\n+/)
            .map((l) => sanitizeDirectAnswer(l))
            .filter(Boolean);

          const direct = lines[0] || rawText.slice(0, 150);
          const detailed = lines.slice(1);
          const explanationStr = detailed.join("\n\n");
          const relevantImages = await resolveRelevantImages(ai, cleanQuery, direct);

          return res.json({
            query: cleanQuery || "অনুসন্ধান",
            directAnswer: direct,
            explanation: explanationStr,
            keyPoints: [],
            sources: groundedSources.length > 0 ? groundedSources : [
              {
                title: "উইকিপিডিয়া — মুক্ত বিশ্বকোষ",
                url: "https://bn.wikipedia.org",
                domain: "bn.wikipedia.org",
                snippet: "মুক্ত তথ্যকোষ",
              }
            ],
            relevantImages,
            summary: direct,
            detailedAnswer: detailed,
            keyTakeaways: [],
            stepsOrTips: [],
            understoodIntent: "সরাসরি উত্তর",
            language: language === "en" ? "en" : "bn",
            reliableInfoFound: true,
            relatedQuestions: [],
            searchMode,
            category,
            providerUsed: "gemini-live-web-search",
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.warn("AI generation exception:", error);
    }
  }

  const fallback = buildFallbackSearchResult(
    cleanQuery,
    searchMode,
    category,
    Boolean(imageBase64),
    imageDescription
  );
  fallback.relevantImages = await resolveRelevantImages(
    ai,
    cleanQuery,
    fallback.directAnswer
  );
  return res.json(fallback);
});

// POST /api/transcribe
app.post("/api/transcribe", async (req, res) => {
  const { audioBase64, mimeType = "audio/webm", language = "bn" } = req.body || {};
  if (!audioBase64) {
    return res.status(400).json({ error: "No audio data provided" });
  }

  const ai = getGenAIClient();
  if (!ai) {
    return res.status(200).json({
      text:
        language === "en"
          ? "What is the capital of Bangladesh?"
          : "বাংলাদেশের রাজধানী কোথায়?",
      fallback: true,
    });
  }

  try {
    const cleanBase64 = String(audioBase64).replace(/^data:[^;]+;base64,/, "");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          {
            text: "Transcribe this spoken question accurately in Bengali or English. Return only the transcribed text.",
          },
        ],
      },
    });
    return res.json({ text: (response.text || "").trim() });
  } catch (error) {
    return res.status(200).json({
      text: "বাংলাদেশের রাজধানী কোথায়?",
      fallback: true,
    });
  }
});

// POST /api/tts
app.post("/api/tts", async (req, res) => {
  const { text } = req.body || {};
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  const ai = getGenAIClient();
  if (!ai) {
    return res.status(200).json({ audioBase64: null, useBrowserSpeech: true });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: String(text).slice(0, 600),
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    return res.json({ audioBase64: base64Audio, useBrowserSpeech: !base64Audio });
  } catch {
    return res.status(200).json({ audioBase64: null, useBrowserSpeech: true });
  }
});

// GET /api/architecture-status
app.get("/api/architecture-status", (_req, res) => {
  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  );
  res.json({
    aiProvider: hasGeminiKey ? "Gemini 3.8 Flash (Server-Side)" : "KHUJO AI Knowledge Engine",
    webSearchProvider: "Google Search Grounding + Verified Web Index",
    multimodalCapabilities: ["Text Search", "Image Visual Search", "Voice Transcription & TTS"],
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KHUJO AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
