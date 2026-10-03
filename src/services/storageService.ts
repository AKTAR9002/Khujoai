import { SavedAnswerItem, SearchResultItem, UserProfile } from "../types/khujo";

const STORAGE_KEYS = {
  CURRENT_USER: "khujo_ai_current_user_v1",
  USERS_DB: "khujo_ai_users_db_v1",
  SEARCH_HISTORY: "khujo_ai_search_history_v1",
  SAVED_ANSWERS: "khujo_ai_saved_answers_v1",
};

interface StoredUserRecord extends UserProfile {
  passwordHash: string;
}

const DEFAULT_DEMO_HISTORY: SearchResultItem[] = [
  {
    id: "seed-hist-0",
    query: "বাংলাদেশের রাজধানী কোথায়?",
    directAnswer: "বাংলাদেশের রাজধানী হলো ঢাকা।",
    summary: "বাংলাদেশের রাজধানী হলো ঢাকা।",
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
      }
    ],
    relatedQuestions: [
      "ঢাকা কবে প্রথম বাংলার রাজধানী হয়েছিল?",
      "বাংলাদেশের দ্বিতীয় বৃহত্তম শহর কোনটি?"
    ],
    searchMode: "text",
    category: "তথ্য খুঁজুন",
    providerUsed: "khujo-verified-knowledge",
    timestamp: new Date().toISOString(),
  },
  {
    id: "seed-hist-1",
    query: "বাংলাদেশে অনলাইনে ই-পাসপোর্ট করার নিয়ম এবং প্রয়োজনীয় কাগজপত্র কী কী?",
    directAnswer: "বাংলাদেশে ই-পাসপোর্ট করার জন্য epassport.gov.bd পোর্টালে সরাসরি অনলাইনে আবেদন করতে হয়।",
    summary:
      "বাংলাদেশে ই-পাসপোর্ট করার জন্য epassport.gov.bd পোর্টালে সরাসরি অনলাইনে আবেদন করতে হয়।",
    understoodIntent: "বাংলাদেশে ই-পাসপোর্ট অনলাইন আবেদন প্রক্রিয়া ও প্রয়োজনীয় কাগজপত্র",
    language: "bn",
    reliableInfoFound: true,
    detailedAnswer: [
      "ই-পাসপোর্ট আবেদনের জন্য প্রথমে অফিসিয়াল ওয়েবসাইটে অ্যাকাউন্ট খুলে জাতীয় পরিচয়পত্র (NID) বা অনলাইন জন্ম নিবন্ধন সনদ অনুযায়ী ফরম পূরণ করতে হবে।",
      "অনলাইন ব্যাংকিং, মোবাইল ফিন্যান্সিয়াল সার্ভিস বা এ-চালানের মাধ্যমে ফি জমা দিয়ে অ্যাপয়েন্টমেন্টের তারিখে মূল কাগজপত্রসহ পাসপোর্ট অফিসে উপস্থিত হতে হয়।"
    ],
    keyTakeaways: [
      "অফিসিয়াল ওয়েবসাইট: epassport.gov.bd",
      "প্রাপ্তবয়স্কদের জন্য মূল NID কার্ড এবং ১৮ বছরের নিচে অনলাইন জন্ম সনদ আবশ্যক"
    ],
    stepsOrTips: [
      "১. epassport.gov.bd ওয়েবসাইটে গিয়ে আঞ্চলিক পাসপোর্ট অফিস নির্বাচন করুন।",
      "২. সঠিকভাবে তথ্য পূরণ করে সরকারি ফি পরিশোধ করুন।",
      "৩. নির্ধারিত দিনে ছবি ও আঙুলের ছাপ দিতে অফিসে যান।"
    ],
    sources: [
      {
        title: "E-Passport Online Portal Bangladesh",
        url: "https://www.epassport.gov.bd",
        domain: "epassport.gov.bd",
        snippet: "ই-পাসপোর্ট অনলাইন আবেদন ও স্ট্যাটাস চেক পোর্টাল।"
      }
    ],
    relatedQuestions: [
      "ই-পাসপোর্ট করতে বর্তমানে কত টাকা ফি লাগে?",
      "পাসপোর্ট ডেলিভারি পেতে কত দিন সময় লাগে?"
    ],
    searchMode: "text",
    category: "তথ্য খুঁজুন",
    providerUsed: "khujo-verified-knowledge",
    timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
  },
  {
    id: "seed-hist-2",
    query: "মোবাইল ফোন অতিরিক্ত গরম হলে এবং চার্জ দ্রুত শেষ হলে করণীয় কী?",
    directAnswer: "মোবাইল ফোন অতিরিক্ত গরম হলে ব্যাকগ্রাউন্ডের অপ্রয়োজনীয় অ্যাপ বন্ধ করুন এবং চার্জে থাকা অবস্থায় ফোন ব্যবহার পরিহার করুন।",
    summary:
      "মোবাইল ফোন অতিরিক্ত গরম হলে ব্যাকগ্রাউন্ডের অপ্রয়োজনীয় অ্যাপ বন্ধ করুন এবং চার্জে থাকা অবস্থায় ফোন ব্যবহার পরিহার করুন।",
    understoodIntent: "স্মার্টফোনের ব্যাটারি ও অতিরিক্ত গরম হওয়ার সমস্যার সমাধান",
    language: "bn",
    reliableInfoFound: true,
    detailedAnswer: [
      "ফোনের ইন্টারনাল স্টোরেজ অন্তত ২০% খালি রাখা এবং অনুমোদিত চার্জার ব্যবহারের মাধ্যমে ফোনের তাপমাত্রা নিয়ন্ত্রণ রাখা যায়।"
    ],
    keyTakeaways: [
      "ব্যাকগ্রাউন্ড অ্যাপ ও অটো-সিঙ্ক নিয়ন্ত্রণ করুন",
      "ইন্টারনাল স্টোরেজ কমপক্ষে ২০% ফাঁকা রাখুন"
    ],
    sources: [
      {
        title: "Android Help — Keep your device working smoothly",
        url: "https://support.google.com/android/answer/7667018",
        domain: "support.google.com",
        snippet: "Official guide for Android battery and performance troubleshooting."
      }
    ],
    relatedQuestions: [
      "ফোনের স্টোরেজ ছবি না কেটে খালি করার উপায় কী?",
      "ব্যাটারি হেলথ ভালো রাখার নিয়ম কী?"
    ],
    searchMode: "text",
    category: "সমস্যার সমাধান",
    providerUsed: "khujo-verified-knowledge",
    timestamp: new Date(Date.now() - 3600 * 1000 * 22).toISOString(),
  },
];

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCurrentUser(user: UserProfile | null): void {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

  const db = getUsersDB();
  const idx = db.findIndex((u) => u.id === user.id || u.email === user.email);
  if (idx >= 0) {
    db[idx] = { ...db[idx], ...user };
    localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(db));
  }
}

function getUsersDB(): StoredUserRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS_DB);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function ensureInitialSeedData(): void {
  const histRaw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
  if (!histRaw) {
    localStorage.setItem(
      STORAGE_KEYS.SEARCH_HISTORY,
      JSON.stringify(DEFAULT_DEMO_HISTORY)
    );
  }
  const savedRaw = localStorage.getItem(STORAGE_KEYS.SAVED_ANSWERS);
  if (!savedRaw) {
    const initialSaved: SavedAnswerItem[] = [
      {
        id: "saved-seed-1",
        savedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
        personalNote: "পাসপোর্ট আবেদনের আগে প্রয়োজনীয় কাগজপত্রের চেকলিস্ট",
        result: DEFAULT_DEMO_HISTORY[0],
      },
    ];
    localStorage.setItem(STORAGE_KEYS.SAVED_ANSWERS, JSON.stringify(initialSaved));
  }
}

export function registerUser(params: {
  name: string;
  email: string;
  password: string;
  preferredLanguage?: "bn" | "en";
}): UserProfile {
  const db = getUsersDB();
  const cleanEmail = params.email.trim().toLowerCase();
  if (db.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error("এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট খোলা হয়েছে। অনুগ্রহ করে লগইন করুন।");
  }

  const newUser: StoredUserRecord = {
    id: `user-${Date.now()}`,
    name: params.name.trim(),
    email: cleanEmail,
    preferredLanguage: params.preferredLanguage || "bn",
    detailLevel: "balanced",
    voiceLanguage: "bn-BD",
    saveHistoryAutomatically: true,
    joinedAt: new Date().toISOString(),
    passwordHash: btoa(encodeURIComponent(params.password)),
  };

  db.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(db));
  ensureInitialSeedData();

  const { passwordHash: _, ...profile } = newUser;
  saveCurrentUser(profile);
  return profile;
}

export function loginUser(email: string, password: string): UserProfile {
  const db = getUsersDB();
  const cleanEmail = email.trim().toLowerCase();
  const found = db.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    return registerUser({
      name: cleanEmail.split("@")[0] || "KHUJO ব্যবহারকারী",
      email: cleanEmail,
      password,
    });
  }

  const encoded = btoa(encodeURIComponent(password));
  if (found.passwordHash !== encoded) {
    throw new Error("পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।");
  }

  ensureInitialSeedData();
  const { passwordHash: _, ...profile } = found;
  saveCurrentUser(profile);
  return profile;
}

export function loginDemoUser(): UserProfile {
  ensureInitialSeedData();
  const demoProfile: UserProfile = {
    id: "user-demo-khujo",
    name: "তানভীর আহমেদ (ডেমো ইউজার)",
    email: "tanvir@khujo.ai",
    preferredLanguage: "bn",
    detailLevel: "balanced",
    voiceLanguage: "bn-BD",
    saveHistoryAutomatically: true,
    joinedAt: new Date().toISOString(),
  };
  saveCurrentUser(demoProfile);
  return demoProfile;
}

export function getSearchHistory(): SearchResultItem[] {
  ensureInitialSeedData();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addSearchToHistory(item: SearchResultItem): SearchResultItem[] {
  const current = getSearchHistory();
  const filtered = current.filter(
    (existing) => existing.query.toLowerCase() !== item.query.toLowerCase()
  );
  const updated = [item, ...filtered].slice(0, 50);
  localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updated));
  return updated;
}

export function deleteHistoryItem(id: string): SearchResultItem[] {
  const current = getSearchHistory();
  const updated = current.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updated));
  return updated;
}

export function clearAllHistory(): SearchResultItem[] {
  localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify([]));
  return [];
}

export function getSavedAnswers(): SavedAnswerItem[] {
  ensureInitialSeedData();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SAVED_ANSWERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSaveAnswer(
  result: SearchResultItem,
  personalNote?: string
): { savedAnswers: SavedAnswerItem[]; isSaved: boolean } {
  const current = getSavedAnswers();
  const existingIdx = current.findIndex(
    (s) => s.result.id === result.id || s.result.query === result.query
  );

  if (existingIdx >= 0) {
    const updated = current.filter((_, i) => i !== existingIdx);
    localStorage.setItem(STORAGE_KEYS.SAVED_ANSWERS, JSON.stringify(updated));
    return { savedAnswers: updated, isSaved: false };
  } else {
    const newItem: SavedAnswerItem = {
      id: `saved-${Date.now()}`,
      savedAt: new Date().toISOString(),
      personalNote: personalNote || "",
      result,
    };
    const updated = [newItem, ...current];
    localStorage.setItem(STORAGE_KEYS.SAVED_ANSWERS, JSON.stringify(updated));
    return { savedAnswers: updated, isSaved: true };
  }
}

export function deleteSavedAnswer(savedId: string): SavedAnswerItem[] {
  const current = getSavedAnswers();
  const updated = current.filter((item) => item.id !== savedId);
  localStorage.setItem(STORAGE_KEYS.SAVED_ANSWERS, JSON.stringify(updated));
  return updated;
}

export function updateSavedAnswerNote(
  savedId: string,
  note: string
): SavedAnswerItem[] {
  const current = getSavedAnswers();
  const updated = current.map((item) =>
    item.id === savedId ? { ...item, personalNote: note } : item
  );
  localStorage.setItem(STORAGE_KEYS.SAVED_ANSWERS, JSON.stringify(updated));
  return updated;
}
