import React, { useEffect, useMemo, useState } from "react";
import { BookOpen, Bot, ChevronDown, ChevronRight, ClipboardCheck, Database, Settings, X } from "lucide-react";
import { useAppState } from "./DataProvider.jsx";

export const MODULES = [
  { id: "copilot", label: "Study Copilot", shortLabel: "Copilot", hint: "AI study workspace", icon: Bot },
  { id: "flashcards", label: "Flashcards", shortLabel: "Flashcards", hint: "Study mode", icon: BookOpen },
  { id: "quizzes", label: "Quizzes", shortLabel: "Quizzes", hint: "Testing mode", icon: ClipboardCheck }
];

export default function Sidebar({
  activeModule,
  onNavigate,
  onOpenSettings,
  onClose,
  variant = "desktop"
}) {
  const {
    topics,
    selectedSubject,
    setSelectedSubject,
    selectedUnit,
    setSelectedUnit,
    loading
  } = useAppState();
  const isDrawer = variant === "drawer";
  const subjects = useMemo(() => [...new Set(topics.map((topic) => topic.subject))].sort(), [topics]);
  const unitsBySubject = useMemo(() => {
    const map = new Map();
    topics.forEach((topic) => {
      if (!map.has(topic.subject)) map.set(topic.subject, new Set());
      map.get(topic.subject).add(topic.unit);
    });
    return new Map([...map.entries()].map(([subject, units]) => [subject, [...units].sort()]));
  }, [topics]);
  const [expandedSubjects, setExpandedSubjects] = useState(() => new Set(selectedSubject ? [selectedSubject] : []));

  useEffect(() => {
    setExpandedSubjects((current) => {
      if (selectedSubject && !current.has(selectedSubject)) return new Set([...current, selectedSubject]);
      if (!selectedSubject && !current.size && subjects.length) return new Set([subjects[0]]);
      return current;
    });
  }, [selectedSubject, subjects]);

  const toggleSubject = (subject) => {
    const isExpanded = expandedSubjects.has(subject);
    if (!isExpanded && selectedSubject !== subject) setSelectedSubject(subject);
    setExpandedSubjects((current) => {
      const next = new Set(current);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });
  };

  const chooseUnit = (subject, unit) => {
    if (selectedSubject !== subject) setSelectedSubject(subject);
    setSelectedUnit(unit);
    setExpandedSubjects((current) => new Set([...current, subject]));
    if (isDrawer) onClose?.();
  };

  const navigate = (moduleId) => {
    onNavigate(moduleId);
    if (isDrawer) onClose?.();
  };

  const topicSummary = `${topics.length} topic${topics.length === 1 ? "" : "s"} · ${subjects.length} subject${subjects.length === 1 ? "" : "s"}`;

  return (
    <aside
      aria-label={isDrawer ? "Mobile study navigation" : "Study navigation"}
      className={isDrawer
        ? "flex h-full w-full flex-col border-r border-gray-200 bg-white shadow-2xl"
        : "sticky top-0 hidden h-screen min-h-screen w-72 shrink-0 flex-col border-r border-gray-200 bg-white shadow-sm md:flex"}
    >
      {isDrawer ? (
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-100">
              <BookOpen size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="font-extrabold tracking-tight text-gray-950">APEX App</p>
              <p className="text-[11px] font-medium text-gray-500">Choose a study unit</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 active:scale-95"
            aria-label="Close unit menu"
          >
            <X size={21} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 pb-6 pt-7">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-100">
            <BookOpen size={21} aria-hidden="true" />
          </span>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-gray-950">APEX App</p>
            <p className="text-xs font-medium text-gray-500">Focused JEE learning</p>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-3">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Workspace</p>
        <nav aria-label="Main navigation" className="grid gap-1.5">
          {MODULES.map((module) => {
            const Icon = module.icon;
            const isActive = module.id === activeModule;
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => navigate(module.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition active:scale-[0.98] ${isActive ? "bg-blue-50 text-blue-800 shadow-sm ring-1 ring-inset ring-blue-100" : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"}`}
              >
                <Icon size={19} className={isActive ? "text-blue-600" : "text-gray-400"} aria-hidden="true" />
                <span className="grid gap-0.5">
                  <span className="text-sm font-semibold">{module.label}</span>
                  <span className="text-[11px] text-gray-500">{module.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <section className="mt-7" aria-label="Subject and unit selection">
          <div className="mb-2 flex items-center justify-between px-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Subjects & units</h2>
            {selectedUnit && <span className="max-w-28 truncate text-[10px] font-semibold text-blue-600">Unit selected</span>}
          </div>
          {!loading && !subjects.length && (
            <p className="rounded-lg px-3 py-3 text-xs leading-5 text-gray-500">No study units are available yet.</p>
          )}
          {loading && <p className="px-3 py-3 text-xs text-gray-500">Loading subjects…</p>}
          <div className="grid gap-1">
            {subjects.map((subject) => {
              const isExpanded = expandedSubjects.has(subject);
              const isSubjectActive = selectedSubject === subject;
              const units = unitsBySubject.get(subject) || [];
              return (
                <div key={subject}>
                  <button
                    type="button"
                    onClick={() => toggleSubject(subject)}
                    aria-expanded={isExpanded}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition hover:bg-gray-50 active:scale-[0.99] ${isSubjectActive ? "text-blue-700" : "text-gray-700"}`}
                  >
                    {isExpanded
                      ? <ChevronDown size={16} className="shrink-0 text-blue-600" aria-hidden="true" />
                      : <ChevronRight size={16} className="shrink-0 text-gray-400" aria-hidden="true" />}
                    <span className="min-w-0 flex-1 truncate">{subject}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">{units.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="ml-3 mt-1 grid gap-1 border-l border-gray-100 pl-2">
                      {units.map((unit) => {
                        const isUnitActive = selectedSubject === subject && selectedUnit === unit;
                        return (
                          <button
                            key={`${subject}-${unit}`}
                            type="button"
                            onClick={() => chooseUnit(subject, unit)}
                            aria-current={isUnitActive ? "true" : undefined}
                            className={`min-h-10 w-full rounded-r-lg border-l-4 px-3 py-2 text-left text-xs font-semibold leading-5 transition active:scale-[0.99] ${isUnitActive ? "border-blue-600 bg-blue-50 text-blue-700" : "border-transparent text-gray-600 hover:border-blue-200 hover:bg-gray-50 hover:text-gray-900"}`}
                          >
                            {unit}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="mt-auto space-y-3 border-t border-gray-100 p-4">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
          <div className="mb-1.5 flex items-center gap-2 text-gray-700">
            <Database size={15} className="text-blue-600" aria-hidden="true" />
            <span className="text-xs font-bold">Local study data</span>
          </div>
          <p className="text-[11px] leading-5 text-gray-500">{loading ? "Loading topic database…" : topicSummary}</p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-950 active:scale-[0.98]"
        >
          <Settings size={18} aria-hidden="true" /> Settings
        </button>
      </div>
    </aside>
  );
}
