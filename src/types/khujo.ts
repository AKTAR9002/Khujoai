export type PageRoute =
  | "home"
  | "results"
  | "login"
  | "signup"
  | "history"
  | "saved"
  | "profile"
  | "about";

export type SearchMode = "text" | "image" | "voice";

export interface SourceLink {
  title: string;
  url: string;
  domain: string;
  snippet?: string;
}

export interface AnswerImageItem {
  url: string;
  title: string;
  source: string;
  sourceUrl: string;
  caption?: string;
}

export interface SearchResultItem {
  id: string;
  query: string;
  directAnswer: string; // The short direct answer to the user question
  explanation?: string; // Detailed explanation providing context and background
  keyPoints?: string[]; // Key facts and takeaways
  sources: SourceLink[]; // Sources with title and url
  relevantImages?: AnswerImageItem[]; // 1-4 relevant real images related to the answer
  summary: string; // Compatibility alias for directAnswer
  detailedAnswer: string[]; // Array form of explanation paragraphs
  keyTakeaways: string[]; // Compatibility alias for keyPoints
  stepsOrTips?: string[]; // Actionable steps for procedural questions
  understoodIntent: string;
  language: "bn" | "en";
  reliableInfoFound: boolean;
  reliabilityNote?: string;
  relatedQuestions: string[];
  searchMode: SearchMode;
  category?: string;
  imagePreviewUrl?: string;
  imageDescription?: string;
  providerUsed: "gemini-live-web-search" | "khujo-verified-knowledge";
  timestamp: string;
}

export interface SavedAnswerItem {
  id: string;
  savedAt: string;
  personalNote?: string;
  result: SearchResultItem;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferredLanguage: "bn" | "en";
  detailLevel: "concise" | "balanced" | "detailed";
  voiceLanguage: "bn-BD" | "en-US";
  saveHistoryAutomatically: boolean;
  joinedAt: string;
}

export interface CategoryPreset {
  id: string;
  emoji: string;
  label: string;
  englishLabel: string;
  description: string;
  mode: SearchMode;
  sampleQueries: string[];
}

export interface SampleVisualPreset {
  id: string;
  title: string;
  subtitle: string;
  query: string;
  imageDescription: string;
  svgDataUrl: string;
}
