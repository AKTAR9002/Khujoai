import { useState, useEffect } from "react";
import {
  PageRoute,
  SavedAnswerItem,
  SearchMode,
  SearchResultItem,
  UserProfile,
} from "./types/khujo";
import { searchWithKhujoAI } from "./services/apiAdapter";
import {
  addSearchToHistory,
  clearAllHistory,
  deleteHistoryItem,
  deleteSavedAnswer,
  ensureInitialSeedData,
  getCurrentUser,
  getSavedAnswers,
  getSearchHistory,
  loginDemoUser,
  saveCurrentUser,
  toggleSaveAnswer,
  updateSavedAnswerNote,
} from "./services/storageService";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { SearchResultsPage } from "./pages/SearchResultsPage";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";
import { SearchHistoryPage } from "./pages/SearchHistoryPage";
import { SavedAnswersPage } from "./pages/SavedAnswersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AboutPage } from "./pages/AboutPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageRoute>("home");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<SearchResultItem[]>([]);
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswerItem[]>([]);
  const [currentResult, setCurrentResult] = useState<SearchResultItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    ensureInitialSeedData();
    const existingUser = getCurrentUser();
    setUser(existingUser);
    const loadedHistory = getSearchHistory();
    setHistory(loadedHistory);
    setSavedAnswers(getSavedAnswers());
  }, []);

  const handleNavigate = (page: PageRoute) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitSearch = async (params: {
    query: string;
    searchMode: SearchMode;
    category?: string;
    imageBase64?: string;
    imageMimeType?: string;
    imagePreviewUrl?: string;
    imageDescription?: string;
  }) => {
    setCurrentPage("results");
    setIsSearching(true);
    setSearchError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const result = await searchWithKhujoAI({
        ...params,
        language: user?.preferredLanguage || "bn",
        detailLevel: user?.detailLevel || "balanced",
      });

      setCurrentResult(result);

      if (!user || user.saveHistoryAutomatically) {
        const updatedHistory = addSearchToHistory(result);
        setHistory(updatedHistory);
      }
    } catch (err: any) {
      setSearchError(
        err.message || "অনুসন্ধান সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।"
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectHistoryOrSavedResult = (item: SearchResultItem) => {
    setCurrentResult(item);
    setSearchError(null);
    setCurrentPage("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleSave = (result: SearchResultItem) => {
    const { savedAnswers: updated } = toggleSaveAnswer(result);
    setSavedAnswers(updated);
  };

  const handleDeleteSaved = (savedId: string) => {
    setSavedAnswers(deleteSavedAnswer(savedId));
  };

  const handleUpdateSavedNote = (savedId: string, note: string) => {
    setSavedAnswers(updateSavedAnswerNote(savedId, note));
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(deleteHistoryItem(id));
  };

  const handleClearAllHistory = () => {
    setHistory(clearAllHistory());
  };

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    setHistory(getSearchHistory());
    setSavedAnswers(getSavedAnswers());
    setCurrentPage("home");
  };

  const handleInstantDemoLogin = () => {
    const demoUser = loginDemoUser();
    setUser(demoUser);
    setHistory(getSearchHistory());
    setSavedAnswers(getSavedAnswers());
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    saveCurrentUser(updated);
    setUser(updated);
  };

  const handleLogout = () => {
    saveCurrentUser(null);
    setUser(null);
    setCurrentPage("home");
  };

  const isCurrentResultSaved = Boolean(
    currentResult &&
      savedAnswers.some(
        (s) =>
          s.result.id === currentResult.id ||
          s.result.query === currentResult.query
      )
  );

  return (
    <div className="min-h-screen flex flex-col khujo-ambient-bg text-slate-900">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
        savedCount={savedAnswers.length}
        historyCount={history.length}
      />

      <main className="flex-1">
        {currentPage === "home" && (
          <HomePage
            onSubmitSearch={handleSubmitSearch}
            isSearching={isSearching}
            user={user}
            recentHistory={history}
            onSelectHistoryItem={handleSelectHistoryOrSavedResult}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === "results" && (
          <SearchResultsPage
            currentResult={currentResult}
            isSearching={isSearching}
            searchError={searchError}
            onSubmitSearch={handleSubmitSearch}
            isSaved={isCurrentResultSaved}
            onToggleSave={handleToggleSave}
            user={user}
            onNavigate={handleNavigate}
            onInstantDemoLogin={handleInstantDemoLogin}
          />
        )}

        {currentPage === "login" && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onInstantDemoLogin={() => {
              handleInstantDemoLogin();
              setCurrentPage("home");
            }}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === "signup" && (
          <SignUpPage
            onSignUpSuccess={handleLoginSuccess}
            onInstantDemoLogin={() => {
              handleInstantDemoLogin();
              setCurrentPage("home");
            }}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === "history" && (
          <SearchHistoryPage
            user={user}
            history={history}
            onSelectResult={handleSelectHistoryOrSavedResult}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearAllHistory={handleClearAllHistory}
            onNavigate={handleNavigate}
            onInstantDemoLogin={handleInstantDemoLogin}
          />
        )}

        {currentPage === "saved" && (
          <SavedAnswersPage
            user={user}
            savedAnswers={savedAnswers}
            onSelectResult={handleSelectHistoryOrSavedResult}
            onDeleteSaved={handleDeleteSaved}
            onUpdateNote={handleUpdateSavedNote}
            onNavigate={handleNavigate}
            onInstantDemoLogin={handleInstantDemoLogin}
          />
        )}

        {currentPage === "profile" && (
          <ProfilePage
            user={user}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onInstantDemoLogin={handleInstantDemoLogin}
            historyCount={history.length}
            savedCount={savedAnswers.length}
          />
        )}

        {currentPage === "about" && <AboutPage onNavigate={handleNavigate} />}
      </main>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
