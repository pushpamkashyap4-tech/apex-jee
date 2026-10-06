import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Menu, RefreshCw, Settings } from "lucide-react";
import { useAppState } from "./DataProvider.jsx";
import StudyCopilot from "./StudyCopilot.jsx";
import FlashcardEngine from "./FlashcardEngine.jsx";
import QuizEngine from "./QuizEngine.jsx";
import Sidebar, { MODULES } from "./Sidebar.jsx";
import SettingsModal from "./SettingsModal.jsx";

export default function App() {
  const [activeModule, setActiveModule] = useState("copilot");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const {
    selectedSubject,
    selectedUnit,
    filteredTopics,
    filteredFlashcards,
    filteredQuizzes,
    loading,
    error,
    refreshData
  } = useAppState();
  const active = MODULES.find((module) => module.id === activeModule) || MODULES[0];
  const scopeLabel = [selectedSubject, selectedUnit].filter(Boolean).join(" · ") || "Choose a subject and unit";
  const topicSummary = useMemo(() => {
    const cards = filteredFlashcards.length;
    const quizzes = filteredQuizzes.length;
    return `${filteredTopics.length} topic${filteredTopics.length === 1 ? "" : "s"} · ${cards} flashcard${cards === 1 ? "" : "s"} · ${quizzes} quiz${quizzes === 1 ? "" : "zes"}`;
  }, [filteredTopics.length, filteredFlashcards.length, filteredQuizzes.length]);

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
  const openSettings = useCallback(() => {
    setIsDrawerOpen(false);
    setIsSettingsOpen(true);
  }, []);
  const clearChatHistory = useCallback(() => {
    window.dispatchEvent(new Event("apex:clear-chat"));
  }, []);

  useEffect(() => {
    if (!isDrawerOpen) return undefined;
    const previouslyFocused = document.activeElement;
    const drawer = document.querySelector("#mobile-study-drawer [role='dialog']");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer?.querySelector("button[aria-label='Close unit menu']")?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }
      if (event.key !== "Tab" || !drawer) return;
      const focusable = Array.from(drawer.querySelectorAll("button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex='0']"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isDrawerOpen, closeDrawer]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 md:flex">
      <Sidebar
        activeModule={activeModule}
        onNavigate={setActiveModule}
        onOpenSettings={openSettings}
      />

      <main className="min-w-0 flex-1 pb-28 md:pb-0">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:px-6 sm:py-4 lg:px-9">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-blue-700 active:scale-95 md:hidden"
                aria-label="Open subject and unit menu"
                aria-expanded={isDrawerOpen}
                aria-controls="mobile-study-drawer"
              >
                <Menu size={20} aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <p className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600 sm:block">APEX learning</p>
                <h1 className="truncate text-lg font-extrabold tracking-tight text-gray-950 sm:mt-0.5 sm:text-2xl">{active.label}</h1>
                <p className="hidden text-xs text-gray-500 sm:block">{active.hint} · Part 4 polish</p>
              </div>
            </div>

            <div className="hidden min-w-0 max-w-[45%] items-center gap-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 lg:flex">
              <BookOpen size={14} className="shrink-0 text-blue-600" aria-hidden="true" />
              <span className="truncate">{scopeLabel}</span>
            </div>

            <button
              type="button"
              onClick={openSettings}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-blue-50 hover:text-blue-700 active:scale-95 md:hidden"
              aria-label="Open settings"
            >
              <Settings size={19} aria-hidden="true" />
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-3 pb-6 pt-5 sm:px-6 sm:pb-8 sm:pt-7 lg:px-9" aria-live="polite">
          {loading && (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm" role="status">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
              Loading topic database…
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between" role="alert">
              <div>
                <p className="font-semibold text-red-800">Study data did not load</p>
                <p className="mt-1 text-sm text-gray-600">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => refreshData()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-95"
              >
                <RefreshCw size={15} aria-hidden="true" /> Try again
              </button>
            </div>
          )}
          {!loading && !error && (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">{topicSummary}</p>
                  <p className="mt-1 text-xs text-gray-400 lg:hidden">{scopeLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => refreshData()}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-white hover:text-blue-700 hover:shadow-sm active:scale-95"
                >
                  <RefreshCw size={14} aria-hidden="true" /> Refresh data
                </button>
              </div>
              <div hidden={activeModule !== "copilot"}><StudyCopilot /></div>
              {activeModule === "flashcards" && <FlashcardEngine count={filteredFlashcards.length} />}
              {activeModule === "quizzes" && <QuizEngine count={filteredQuizzes.length} />}
            </>
          )}
        </section>
      </main>

      <nav
        aria-label="Mobile primary navigation"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-gray-200 bg-white/95 px-2 pt-1 shadow-[0_-8px_24px_-20px_rgba(15,23,42,0.5)] backdrop-blur md:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      >
        {MODULES.map((module) => {
          const Icon = module.icon;
          const isActive = module.id === activeModule;
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => setActiveModule(module.id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition active:scale-95 ${isActive ? "text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
              <span>{module.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      <div
        id="mobile-study-drawer"
        className={`fixed inset-0 z-50 md:hidden ${isDrawerOpen ? "visible" : "invisible pointer-events-none"}`}
        aria-hidden={!isDrawerOpen}
      >
        <button
          type="button"
          tabIndex={isDrawerOpen ? 0 : -1}
          aria-label="Close subject and unit menu"
          onClick={closeDrawer}
          className={`absolute inset-0 h-full w-full bg-black/50 transition-opacity duration-200 ${isDrawerOpen ? "opacity-100" : "opacity-0"}`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Select a subject and unit"
          className={`absolute inset-y-0 left-0 w-[min(88vw,20rem)] max-w-full transition-transform duration-300 ease-out ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <Sidebar
            activeModule={activeModule}
            onNavigate={setActiveModule}
            onOpenSettings={openSettings}
            onClose={closeDrawer}
            variant="drawer"
          />
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        onClearChat={clearChatHistory}
      />
    </div>
  );
}
