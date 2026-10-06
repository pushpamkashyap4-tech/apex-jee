import React, { useMemo, useState } from "react";
import { BookOpen, Bot, ChevronDown, ClipboardCheck, Database, RefreshCw } from "lucide-react";
import { useAppState } from "./DataProvider.jsx";
import StudyCopilot from "./StudyCopilot.jsx";
import FlashcardEngine from "./FlashcardEngine.jsx";
import QuizEngine from "./QuizEngine.jsx";

const MODULES = [
  { id: "copilot", label: "Study Copilot", hint: "AI study workspace", icon: Bot },
  { id: "flashcards", label: "Flashcards", hint: "Study mode", icon: BookOpen },
  { id: "quizzes", label: "Quizzes", hint: "Testing mode", icon: ClipboardCheck }
];

export default function App() {
  const [activeModule, setActiveModule] = useState("copilot");
  const {
    subjects,
    units,
    selectedSubject,
    setSelectedSubject,
    selectedUnit,
    setSelectedUnit,
    filteredTopics,
    filteredFlashcards,
    filteredQuizzes,
    loading,
    error,
    refreshData
  } = useAppState();
  const active = MODULES.find((module) => module.id === activeModule) || MODULES[0];
  const topicSummary = useMemo(() => {
    const cards = filteredFlashcards.length;
    const quizzes = filteredQuizzes.length;
    return `${filteredTopics.length} topic${filteredTopics.length === 1 ? "" : "s"} · ${cards} flashcard${cards === 1 ? "" : "s"} · ${quizzes} quiz${quizzes === 1 ? "" : "zes"}`;
  }, [filteredTopics.length, filteredFlashcards.length, filteredQuizzes.length]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <aside className="border-b border-slate-200 bg-white px-4 py-4 md:flex md:min-h-screen md:w-64 md:flex-col md:border-b-0 md:border-r md:px-5 md:py-6">
        <div className="mb-5 flex items-center gap-3 md:mb-10">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <BookOpen size={21} aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">APEX App</p>
            <p className="text-xs font-medium text-slate-500">Focused JEE learning</p>
          </div>
        </div>

        <p className="mb-2 hidden px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 md:block">Workspace</p>
        <nav aria-label="Main navigation" className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {MODULES.map((module) => {
            const Icon = module.icon;
            const isActive = module.id === activeModule;
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => setActiveModule(module.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-w-max items-center gap-3 rounded-xl px-3 py-3 text-left transition md:w-full ${isActive ? "bg-indigo-50 text-indigo-800 ring-1 ring-inset ring-indigo-100" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                <Icon size={18} className={isActive ? "text-indigo-600" : "text-slate-400"} aria-hidden="true" />
                <span className="grid gap-0.5">
                  <span className="text-sm font-semibold">{module.label}</span>
                  <span className="hidden text-[11px] text-slate-500 md:block">{module.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 md:block">
          <div className="mb-2 flex items-center gap-2 text-slate-700">
            <Database size={16} className="text-indigo-600" aria-hidden="true" />
            <span className="text-xs font-bold">Local study data</span>
          </div>
          <p className="text-xs leading-5 text-slate-500">{loading ? "Loading topic database…" : topicSummary}</p>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-7 lg:px-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">APEX learning</p>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">{active.label}</h1>
              <p className="mt-1 text-sm text-slate-500">{active.hint} · Part 1 foundation</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                Subject
                <span className="relative">
                  <select
                    value={selectedSubject}
                    onChange={(event) => setSelectedSubject(event.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">All subjects</option>
                    {subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                </span>
              </label>
              <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                Unit
                <span className="relative">
                  <select
                    value={selectedUnit}
                    onChange={(event) => setSelectedUnit(event.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">All units</option>
                    {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                  <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                </span>
              </label>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-7 lg:px-10 lg:py-9" aria-live="polite">
          {loading && (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600" role="status">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
              Loading topic database…
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between" role="alert">
              <div>
                <p className="font-semibold text-rose-800">Study data did not load</p>
                <p className="mt-1 text-sm text-slate-600">{error}</p>
              </div>
              <button type="button" onClick={() => refreshData()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                <RefreshCw size={15} aria-hidden="true" /> Try again
              </button>
            </div>
          )}
          {!loading && !error && (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{topicSummary}</p>
                <button type="button" onClick={() => refreshData()} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white hover:text-indigo-700">
                  <RefreshCw size={14} aria-hidden="true" /> Refresh data
                </button>
              </div>
              {activeModule === "copilot" && <StudyCopilot />}
              {activeModule === "flashcards" && <FlashcardEngine count={filteredFlashcards.length} />}
              {activeModule === "quizzes" && <QuizEngine count={filteredQuizzes.length} />}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
