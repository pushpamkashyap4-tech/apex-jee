import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, Clock3, RefreshCw, Sparkles, MoreVertical, Plus, History, X, Trash2, ChevronDown } from "lucide-react";
import { AI_MODELS, CHAT_MODELS, SPEECH_MODELS, DEFAULT_MODEL_PREFERENCES, getTokenQuotaEstimate, groqChat, parseAIJson, resolveAIModel } from "./ai.js";
import { SYLLABUS } from "./syllabus-data.js";
import MathMarkdown from "./math-markdown.js";
const cycles = [{ day: 1, label: "Day 1", name: "Initial review" }, { day: 3, label: "Day 3", name: "Recall checkpoint" }, { day: 7, label: "Day 7", name: "Problem practice" }, { day: 15, label: "Day 15", name: "Mixed retrieval" }];
function plannerSvg(plan) {
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);
  const truncate = (value, max) => {
    const text = String(value || "");
    return text.length > max ? `${text.slice(0, max - 1)}\u2026` : text;
  };
  const rows = Array.isArray(plan?.schedule) ? plan.schedule : [];
  const width = 1120, rowHeights = rows.map((day) => Math.max(146, 78 + (day.blocks || []).length * 31)), height = 190 + rowHeights.reduce((sum, value) => sum + value, 0);
  let rowY = 174;
  const content = rows.map((day, index) => {
    const y = rowY, rowHeight = rowHeights[index], bg = index % 2 ? "#f5f8ff" : "#ffffff";
    const blocks = (day.blocks || []).map((block, blockIndex) => `<text x="596" y="${y + 41 + blockIndex * 31}" fill="#39476a" font-size="16" font-weight="700">${esc(truncate(`${block.time || ""} \xB7 ${block.subject || "Study"}`, 43))}</text><text x="596" y="${y + 58 + blockIndex * 31}" fill="#68738b" font-size="13">${esc(truncate(block.task, 62))}</text>`).join("");
    rowY += rowHeight;
    return `<rect x="36" y="${y}" width="1048" height="${rowHeight - 8}" rx="18" fill="${bg}" stroke="#e2e8f1"/><text x="58" y="${y + 34}" fill="#4e5b78" font-size="17" font-weight="700">${esc(truncate(day.date, 18))}</text><text x="58" y="${y + 66}" fill="#68738b" font-size="15">DAY ${String(index + 1).padStart(2, "0")}</text><text x="238" y="${y + 36}" fill="#5746ae" font-size="19" font-weight="700">${esc(truncate(day.focus, 32))}</text><text x="238" y="${y + 68}" fill="#68738b" font-size="15">${esc((day.blocks || []).length)} focused blocks</text>${blocks}`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f3f7ff"/><stop offset="1" stop-color="#fbf6ff"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/><rect x="24" y="22" width="1072" height="130" rx="24" fill="#ffffff" stroke="#e3e8f0"/><text x="54" y="68" fill="#201d36" font-size="29" font-weight="800">${esc(truncate(plan?.title || "AI study plan", 56))}</text><text x="54" y="104" fill="#64708a" font-size="16">${esc(truncate(plan?.summary || "Personalized study schedule", 115))}</text><text x="58" y="162" fill="#8791a7" font-size="12" font-weight="700">DATE</text><text x="238" y="162" fill="#8791a7" font-size="12" font-weight="700">DAILY FOCUS</text><text x="596" y="162" fill="#8791a7" font-size="12" font-weight="700">STUDY BLOCKS</text>${content}</svg>`;
}
function RevisionPlanner({ state, onChange, onAddTask }) {
  const today = /* @__PURE__ */ new Date();
  const chapters = SYLLABUS.advanced;
  const [chapterId, setChapterId] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All subjects");
  const [classFilter, setClassFilter] = useState("All classes");
  const [query, setQuery] = useState("");
  const reviews = state.revisionReviews || {};
  const existing = state.tasks || [];
  const classFor = (item) => item.classLevel || "Class 11 & 12";
  const visibleChapters = chapters.filter((item) => {
    const level = classFor(item);
    const classMatches = classFilter === "All classes" || level === classFilter || level === "Class 11 & 12";
    return (subjectFilter === "All subjects" || item.subject === subjectFilter) && classMatches && `${item.name} ${item.unit}`.toLowerCase().includes(query.toLowerCase());
  });
  const chapter = chapters.find((item) => item.id === chapterId) || null;
  const updateReview = (day, patch) => {
    if (!chapter) return;
    const key = `${chapter.id}:${day}`;
    onChange({ ...reviews, [key]: { ...reviews[key] || {}, ...patch } });
  };
  const addCycle = (item) => {
    if (!chapter) return;
    const date = new Date(today);
    date.setDate(date.getDate() + item.day - 1);
    onAddTask({ id: crypto.randomUUID(), title: `${item.name}: ${chapter.name}`, subject: chapter.subject, date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`, duration: 30, time: "", priority: "Medium", completed: false, revision: true });
  };
  return /* @__PURE__ */ jsxDEV("section", { className: "planner-view deep-view", children: [
    /* @__PURE__ */ jsxDEV("header", { className: "deep-heading", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("p", { className: "eyebrow", children: "SPACED REPETITION" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 43,
          columnNumber: 92
        }, this),
        /* @__PURE__ */ jsxDEV("h1", { children: "Revision Planner" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 43,
          columnNumber: 136
        }, this),
        /* @__PURE__ */ jsxDEV("p", { children: "Plan the next recall while today\u2019s learning is still fresh." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 43,
          columnNumber: 161
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 43,
        columnNumber: 87
      }, this),
      /* @__PURE__ */ jsxDEV(CalendarDays, { size: 25 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 43,
        columnNumber: 233
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 43,
      columnNumber: 54
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "revision-setup revision-filters", children: [
      /* @__PURE__ */ jsxDEV("label", { children: [
        "Find chapter",
        /* @__PURE__ */ jsxDEV("input", { value: query, onChange: (e) => setQuery(e.target.value), placeholder: `Search all ${chapters.length} chapters` }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 44,
          columnNumber: 73
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 44,
        columnNumber: 54
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        "Subject",
        /* @__PURE__ */ jsxDEV("select", { value: subjectFilter, onChange: (e) => setSubjectFilter(e.target.value), children: [
          /* @__PURE__ */ jsxDEV("option", { children: "All subjects" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 44,
            columnNumber: 274
          }, this),
          /* @__PURE__ */ jsxDEV("option", { children: "Physics" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 44,
            columnNumber: 303
          }, this),
          /* @__PURE__ */ jsxDEV("option", { children: "Chemistry" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 44,
            columnNumber: 327
          }, this),
          /* @__PURE__ */ jsxDEV("option", { children: "Mathematics" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 44,
            columnNumber: 353
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 44,
          columnNumber: 195
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 44,
        columnNumber: 181
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        "Class",
        /* @__PURE__ */ jsxDEV("select", { value: classFilter, onChange: (e) => setClassFilter(e.target.value), children: [
          /* @__PURE__ */ jsxDEV("option", { children: "All classes" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 44,
            columnNumber: 485
          }, this),
          /* @__PURE__ */ jsxDEV("option", { children: "Class 11" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 44,
            columnNumber: 513
          }, this),
          /* @__PURE__ */ jsxDEV("option", { children: "Class 12" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 44,
            columnNumber: 538
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 44,
          columnNumber: 410
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 44,
        columnNumber: 398
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        "Chapter",
        /* @__PURE__ */ jsxDEV("select", { value: chapterId, onChange: (e) => setChapterId(e.target.value), children: [
          /* @__PURE__ */ jsxDEV("option", { value: "", children: [
            "Choose from ",
            visibleChapters.length,
            " chapters"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 44,
            columnNumber: 665
          }, this),
          visibleChapters.map((item) => /* @__PURE__ */ jsxDEV("option", { value: item.id, children: [
            item.name,
            " \xB7 ",
            item.subject
          ] }, item.id, true, {
            fileName: "<stdin>",
            lineNumber: 44,
            columnNumber: 765
          }, this))
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 44,
          columnNumber: 594
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 44,
        columnNumber: 580
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 44,
      columnNumber: 5
    }, this),
    chapter && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV("div", { className: "revision-selected-chapter", children: [
        /* @__PURE__ */ jsxDEV("strong", { children: chapter.name }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 45,
          columnNumber: 62
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: [
          chapter.subject,
          " \xB7 ",
          classFor(chapter),
          " \xB7 ",
          chapter.unit
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 45,
          columnNumber: 93
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 45,
        columnNumber: 19
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "revision-timeline", children: cycles.map((item, index) => {
        const key = `${chapter.id}:${item.day}`, review = reviews[key] || {};
        return /* @__PURE__ */ jsxDEV("article", { className: `revision-cycle ${review.done ? "review-done" : ""}`, children: [
          /* @__PURE__ */ jsxDEV("div", { className: "revision-cycle-heading", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "revision-cycle-dot", children: index + 1 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 45,
              columnNumber: 424
            }, this),
            /* @__PURE__ */ jsxDEV("strong", { children: item.label }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 45,
              columnNumber: 477
            }, this),
            /* @__PURE__ */ jsxDEV("label", { className: "revision-check", children: [
              /* @__PURE__ */ jsxDEV("input", { type: "checkbox", checked: Boolean(review.done), onChange: (e) => updateReview(item.day, { done: e.target.checked }) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 45,
                columnNumber: 540
              }, this),
              " Reviewed"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 45,
              columnNumber: 506
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 45,
            columnNumber: 384
          }, this),
          /* @__PURE__ */ jsxDEV("small", { children: [
            new Intl.DateTimeFormat(void 0, { month: "short", day: "numeric" }).format(new Date(today.getFullYear(), today.getMonth(), today.getDate() + item.day - 1)),
            " \xB7 ",
            item.name
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 45,
            columnNumber: 681
          }, this),
          /* @__PURE__ */ jsxDEV("textarea", { "aria-label": `${item.label} review notes for ${chapter.name}`, rows: "3", value: review.note || "", onChange: (e) => updateReview(item.day, { note: e.target.value }), placeholder: "Write what you want to review\u2026" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 45,
            columnNumber: 858
          }, this),
          /* @__PURE__ */ jsxDEV("button", { className: "button", onClick: () => addCycle(item), children: [
            /* @__PURE__ */ jsxDEV(Check, { size: 13 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 45,
              columnNumber: 1126
            }, this),
            " Add to tasks"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 45,
            columnNumber: 1070
          }, this)
        ] }, item.day, true, {
          fileName: "<stdin>",
          lineNumber: 45,
          columnNumber: 299
        }, this);
      }) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 45,
        columnNumber: 168
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 45,
      columnNumber: 17
    }, this),
    !chapter && /* @__PURE__ */ jsxDEV("div", { className: "revision-empty-state", children: [
      visibleChapters.length,
      " chapters available \xB7 choose one to plan its reviews"
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 46,
      columnNumber: 18
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "revision-queue", children: [
      /* @__PURE__ */ jsxDEV("h2", { children: "Scheduled reviews" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 47,
        columnNumber: 41
      }, this),
      existing.filter((task) => task.revision).length ? existing.filter((task) => task.revision).map((task) => /* @__PURE__ */ jsxDEV("p", { children: [
        /* @__PURE__ */ jsxDEV("span", { children: task.title }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 47,
          columnNumber: 184
        }, this),
        /* @__PURE__ */ jsxDEV("small", { children: task.date }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 47,
          columnNumber: 209
        }, this)
      ] }, task.id, true, {
        fileName: "<stdin>",
        lineNumber: 47,
        columnNumber: 167
      }, this)) : /* @__PURE__ */ jsxDEV("p", { children: "Your new spaced reviews will appear here and in All Tasks." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 47,
        columnNumber: 241
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 47,
      columnNumber: 5
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 43,
    columnNumber: 10
  }, this);
}
function AstraPlanner({ apiKey, modelPrefs, chapters = [], config, onConfig }) {
  const [topics, setTopics] = useState(config?.topics || "");
  const [selectedChapterIds, setSelectedChapterIds] = useState(() => Array.isArray(config?.selectedChapterIds) ? config.selectedChapterIds : []);
  const [chapterSubject, setChapterSubject] = useState("All");
  const [chaptersOpen, setChaptersOpen] = useState(true);
  const [hours, setHours] = useState(config?.studyHours || 6);
  const [breaks, setBreaks] = useState(config?.breakMinutes || 15);
  const [studySlots, setStudySlots] = useState(() => Array.isArray(config?.studySlots) ? config.studySlots : [{ id: "slot-1", start: "16:30", end: "17:45" }, { id: "slot-2", start: "18:00", end: "19:45" }]);
  const [recommendation, setRecommendation] = useState(config?.currentRecommendation || config?.aiRecommendation || config?.recommendation || null);
  const [aiPlannerText, setAiPlannerText] = useState(config?.aiPlannerText || "");
  const [aiPlannerBusy, setAiPlannerBusy] = useState(false);
  const [aiPlannerFullView, setAiPlannerFullView] = useState(false);
  const [aiPlannerError, setAiPlannerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [offlinePlan, setOfflinePlan] = useState(config?.offlinePlan || null);
  const [examDate, setExamDate] = useState(config?.targetDate || "2027-01-22");
  const [mockTests, setMockTests] = useState(() => Array.isArray(config?.mockTests) && config.mockTests.length ? config.mockTests : [{ id: "mock-1", name: "Milestone 1", date: config?.mockDate || "" }]);
  const [history, setHistory] = useState(config?.recommendationHistory || []);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeHistory, setActiveHistory] = useState(null);
  const requestId = useRef(0);
  const plannerInputsReady = useRef(false);
  const updateConfig = (changes) => onConfig({ ...config, ...changes });
  const hasApiKey = () => Array.isArray(apiKey)
    ? apiKey.some((entry) => Boolean(String(typeof entry === "string" ? entry : entry?.key || "").trim()))
    : Boolean(String(apiKey || "").trim());
  const patchMock = (id, changes) => setMockTests((items) => items.map((item) => item.id === id ? { ...item, ...changes } : item));
  const patchStudySlot = (id, changes) => setStudySlots((items) => items.map((item) => item.id === id ? { ...item, ...changes } : item));
  const addStudySlot = () => setStudySlots((items) => [...items, { id: crypto.randomUUID(), start: "", end: "" }]);
  const removeStudySlot = (id) => setStudySlots((items) => items.filter((item) => item.id !== id));
  const toggleChapter = (id) => setSelectedChapterIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const selectedChapters = selectedChapterIds.map((id) => chapters.find((chapter) => chapter.id === id)).filter(Boolean);
  const visibleChapters = chapters.filter((chapter) => chapterSubject === "All" || chapter.subject === chapterSubject);
  const topicItems = topics.split(/[\n,;]+/).map((topic) => topic.trim()).filter(Boolean);
  const focusItems = [
    ...selectedChapters.map((chapter) => ({ name: chapter.name, subject: chapter.subject, kind: "chapter" })),
    ...topicItems.map((name) => ({ name, subject: "Mixed practice", kind: "topic" }))
  ];
  const planningItems = focusItems.length ? focusItems : [
    { name: "Physics concepts", subject: "Physics", kind: "topic" },
    { name: "Chemistry revision", subject: "Chemistry", kind: "topic" },
    { name: "Mathematics problem practice", subject: "Mathematics", kind: "topic" }
  ];
  const questionTarget = (text, availableMinutes = 90) => {
    const wordCount = String(text || "").trim().split(/\s+/).filter(Boolean).length;
    const minutes = Number(availableMinutes);
    const minutesFactor = Math.max(0.6, Math.min(1.5, (Number.isFinite(minutes) ? minutes : 90) / 90));
    return Math.max(8, Math.min(50, Math.round((8 + wordCount * 4) * minutesFactor)));
  };
  const formatClock = (value) => {
    const [hourText, minute = "00"] = String(value || "").split(":");
    const hour = Number(hourText);
    if (!Number.isFinite(hour)) return "";
    return `${hour % 12 || 12}:${minute} ${hour < 12 ? "AM" : "PM"}`;
  };
  const clockMinutes = (value) => Number(String(value || "").slice(0, 2)) * 60 + Number(String(value || "").slice(3, 5));
  const plannerSlots = studySlots.filter((slot) => slot.start && slot.end && clockMinutes(slot.end) > clockMinutes(slot.start));
  const slotPrompt = plannerSlots.length ? plannerSlots.map((slot, index) => `Slot ${index + 1} (${formatClock(slot.start)}\u2013${formatClock(slot.end)}, ${Math.max(15, Number(slot.end.slice(0, 2)) * 60 + Number(slot.end.slice(3, 5)) - (Number(slot.start.slice(0, 2)) * 60 + Number(slot.start.slice(3, 5))) - Number(breaks))} study minutes)`).join(", ") : "No fixed study slots";
  const clearHistory = () => {
    setHistory([]);
    setActiveHistory(null);
    updateConfig({ recommendationHistory: [] });
  };
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const daysUntil = (date) => !date || !/^\d{4}-\d{2}-\d{2}$/.test(date) ? null : Math.max(0, Math.round((new Date(`${date}T12:00:00`) - new Date(`${dateKey(new Date())}T12:00:00`)) / 864e5));
  const daysLeft = daysUntil(examDate);
  const scheduleDates = () => {
    if (daysLeft === null) return [];
    if (examDate < dateKey(new Date())) return [examDate];
    return Array.from({ length: daysLeft + 1 }, (_, index) => {
    const date = new Date(`${dateKey(new Date())}T12:00:00`);
    date.setDate(date.getDate() + index);
    return dateKey(date);
    });
  };
  const finalExamTask = "Review important formulas of these chapters and important topics based on the input.";
  const finalExamBlock = { time: "9:00 AM – 12:00 PM", subject: "Final review", focus: finalExamTask, task: finalExamTask, minutes: 180 };
  const applyInputConstraints = (plan) => {
    const rawDays = new Map((plan.schedule || []).map((day) => [day.date, day]));
    return {
    ...plan,
    schedule: scheduleDates().map((date, dayIndex) => {
      if (date === examDate) return { date, focus: finalExamTask, blocks: [{ ...finalExamBlock }] };
      const day = rawDays.get(date) || {};
      const rawBlocks = Array.isArray(day.blocks) ? day.blocks : [];
      const desiredBlocks = plannerSlots.length || Math.max(1, Math.ceil(Number(hours) / 2));
      const blocks = Array.from({ length: desiredBlocks }, (_, index) => rawBlocks[index] || {});
      const sessionCount = blocks.length || desiredBlocks;
      const totalStudyMinutes = Math.max(1, Math.round((Number(hours) || 1) * 60));
      const flexibleBaseMinutes = Math.floor(totalStudyMinutes / sessionCount);
      const flexibleRemainder = totalStudyMinutes % sessionCount;
      const constrainedBlocks = blocks.map((block, index) => {
        const slot = plannerSlots[index];
        const slotMinutes = slot ? Math.max(1, clockMinutes(slot.end) - clockMinutes(slot.start) - Number(breaks)) : flexibleBaseMinutes + (index < flexibleRemainder ? 1 : 0);
        const item = planningItems[(dayIndex * Math.max(1, blocks.length) + index) % planningItems.length];
        const focus = item.name;
        const questions = questionTarget(focus, slotMinutes);
        const rawTask = String(block.task || `Review ${focus}`).trim();
        const targetTask = /\b\d+\s+(?:exam-style\s+)?questions?\b/i.test(rawTask) ? rawTask.replace(/\b\d+\s+(?:exam-style\s+)?questions?\b/i, `${questions} questions`) : `${rawTask} \xB7 practice ${questions} questions`;
        const task = targetTask.toLowerCase().includes(focus.toLowerCase()) ? targetTask : `${targetTask} \xB7 focus: ${focus}`;
        return {
          ...block,
          time: slot ? `${formatClock(slot.start)}\u2013${formatClock(slot.end)}` : block.time || "Flexible",
          focus,
          subject: item.subject,
          minutes: slotMinutes,
          questions,
          task
        };
      });
      return {
        ...day,
        date,
        focus: constrainedBlocks.map((block) => block.focus).join(" \xB7 "),
        blocks: constrainedBlocks
      };
    })
  };
  };
  const update = async () => {
    if (!hasApiKey()) {
      buildOfflinePlan();
      setError("No Groq API key is set. An offline plan is ready below.");
      return;
    }
    const thisRequest = ++requestId.current;
    setBusy(true);
    setError("");
    try {
      const testList = mockTests.filter((test) => test.name.trim() || test.date).map((test) => `${test.name || "Mock test"}: ${test.date || "date not set"}`).join("; ") || "No mock tests scheduled";
      const chapterList = selectedChapters.map((chapter) => `${chapter.subject}: ${chapter.name}`).join("; ") || "No syllabus chapters selected";
      const topicList = topicItems.join("; ") || "No extra topics entered";
      const prompt = `Today's local date: ${dateKey(new Date())}. Target: ${config?.type || "JEE Main"} on ${examDate}. Mock tests: ${testList}. Selected syllabus chapters: ${chapterList}. Additional topics: ${topicList}. Keep chapters and additional topics distinct in the plan. Rotate through every selected chapter and topic, assigning one specific focus per block. Practice workload: use each focus's word length to scale question practice (about 8\u201350 questions per block; longer or broader focus gets more). Daily study hours: ${hours}; break minutes: ${breaks}. Preferred study slots: ${slotPrompt}. Use these supplied time ranges as the daily block times and do not invent conflicting times. Build one focused block per supplied slot (or 2\u20133 blocks when no slots are supplied). Include short tasks, subject, time, duration, and a questions count for every practice block. Return exactly one schedule entry for every local calendar date from today through and including ${examDate}, with no entries outside that range. Respect all supplied inputs. Include one mock test checklist, one next-day analysis step, one weekly milestone, and one adjustment rule. Do not claim official exam dates. Return valid JSON only in this shape: {"title":"...","summary":"...","schedule":[{"date":"YYYY-MM-DD","focus":"...","blocks":[{"time":"...","subject":"...","task":"...","minutes":45,"questions":20}]}],"mockPrep":[{"test":"...","steps":["..."]}],"weeklyMilestones":[{"week":"...","goal":"..."}],"adjustmentRule":"..."}. Keep it concise and specific.`;
      const raw = await groqChat(apiKey, [{ role: "system", content: "Return a valid JSON object only. Plan realistic JEE study sessions. Do not use markdown fences." }, { role: "user", content: prompt }], { json: true, model: resolveAIModel("planning", modelPrefs) });
      const parsed = parseAIJson(raw);
      if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.schedule) || scheduleDates().length > 0 && !parsed.schedule.length) throw new Error("The planner response was incomplete. Try again or use the offline planner.");
      const constrainedPlan = applyInputConstraints(parsed);
      const nextHistory = [{ id: crypto.randomUUID(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), topics, selectedChapterIds, examDate, mockTests: mockTests.map((item) => ({ ...item })), plan: constrainedPlan }, ...history].slice(0, 30);
      if (thisRequest !== requestId.current) return;
      setOfflinePlan(null);
      setRecommendation(constrainedPlan);
      setHistory(nextHistory);
      setActiveHistory(null);
      updateConfig({ targetDate: examDate, mockDate: mockTests[0]?.date || "", mockTests, topics, selectedChapterIds, studyHours: Number(hours), breakMinutes: Number(breaks), studySlots, offlinePlan: null, aiRecommendation: constrainedPlan, recommendation: constrainedPlan, recommendationHistory: nextHistory, currentRecommendation: constrainedPlan, planUpdatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    } catch (e) {
      if (thisRequest === requestId.current) {
        buildOfflinePlan();
        setError(`${e.message || "AI planning is unavailable."} An offline plan is ready below.`);
      }
    } finally {
      if (thisRequest === requestId.current) setBusy(false);
    }
  };
  const generateAIRecommendedPlanner = async () => {
    if (!hasApiKey()) {
      setAiPlannerError("Add a Groq API key in Settings to generate the AI recommended planner.");
      return;
    }
    setAiPlannerBusy(true);
    setAiPlannerError("");
    try {
      const chapterList = selectedChapters.map((chapter) => chapter.subject + ": " + chapter.name).join("; ") || "No syllabus chapters selected";
      const topicList = topicItems.join("; ") || "No additional topics";
      const testList = mockTests.filter((test) => test.name.trim() || test.date).map((test) => (test.name || "Mock test") + (test.date ? " (" + test.date + ")" : "")).join("; ") || "No mock tests specified";
      const slotList = plannerSlots.length ? plannerSlots.map((slot) => formatClock(slot.start) + "–" + formatClock(slot.end)).join(", ") : "No fixed time slots";
      const prompt = "Create a personalized, free-flowing study schedule using only these inputs. Exam: " + (config?.type || "JEE Main") + ". Target exam date: " + examDate + ". Selected chapters: " + chapterList + ". Additional topics: " + topicList + ". Daily study hours: " + hours + ". Break duration: " + breaks + " minutes. Preferred study slots: " + slotList + ". Mock tests: " + testList + ". Cover the supplied chapters and topics without inventing user preferences. Include dated daily guidance and practical breaks. Do not schedule any normal study task on the target exam date and do not write a target-date section; the app adds the required final review block for " + examDate + " after your response. End your schedule on the day before the target date. Return readable Markdown, concise but specific.";
      const answer = await groqChat(apiKey, [
        { role: "system", content: "You are an expert exam study planner. Personalize the schedule strictly from supplied inputs. Return a free-flowing, useful Markdown schedule. Do not add a target exam day section; the application appends its required final review block." },
        { role: "user", content: prompt }
      ], { model: "openai/gpt-oss-120b", maxCompletionTokens: 2400 });
      const finalBlock = "\n\n## " + finalExamTask + "\nTarget exam date: " + examDate + " · 9:00 AM – 12:00 PM";
      const response = answer.trim() + finalBlock;
      setAiPlannerText(response);
      updateConfig({ aiPlannerText: response });
    } catch (e) {
      setAiPlannerError(e.message || "Could not generate the AI recommended planner.");
    } finally {
      setAiPlannerBusy(false);
    }
  };
  const addMock = () => setMockTests((items) => [...items, { id: crypto.randomUUID(), name: `Mock Test ${items.length + 1}`, date: "" }]);
  const buildOfflinePlan = (recordHistory = true) => {
    const dates = scheduleDates();
    const count = dates.length;
    const sessions = plannerSlots.length || Math.max(1, Math.ceil(Number(hours) / 2));
    const totalStudyMinutes = Math.max(1, Math.round(Number(hours) * 60));
    const flexibleBaseMinutes = Math.floor(totalStudyMinutes / sessions);
    const flexibleRemainder = totalStudyMinutes % sessions;
    const schedule = Array.from({ length: count }, (_, i) => {
      const date = new Date(`${dates[i]}T12:00:00`);
      if (dates[i] === examDate) return { date: dates[i], focus: finalExamTask, blocks: [{ ...finalExamBlock }] };
      const dailyItems = Array.from({ length: sessions }, (_2, j) => planningItems[(i * sessions + j) % planningItems.length]);
      const focus = dailyItems.map((item) => item.name).join(" \xB7 ");
      const blocks = Array.from({ length: sessions }, (_2, j) => {
        const slot = plannerSlots[j];
        const item = dailyItems[j];
        const flexibleMinutes = flexibleBaseMinutes + (j < flexibleRemainder ? 1 : 0);
        const startMinute = slot ? Number(slot.start.slice(0, 2)) * 60 + Number(slot.start.slice(3, 5)) : 8 * 60 + j * flexibleBaseMinutes + Math.min(j, flexibleRemainder) + j * Number(breaks);
        const endMinute = slot ? Number(slot.end.slice(0, 2)) * 60 + Number(slot.end.slice(3, 5)) : startMinute + 90;
        const slotMinutes = endMinute > startMinute ? endMinute - startMinute : 90;
        const blockTime = slot ? `${formatClock(slot.start)}\u2013${formatClock(slot.end)}` : `${String(Math.floor(startMinute / 60)).padStart(2, "0")}:${String(startMinute % 60).padStart(2, "0")}`;
        const minutes = plannerSlots.length ? Math.max(1, slotMinutes - Number(breaks)) : flexibleMinutes;
        const questions = questionTarget(item.name, minutes);
        const task = j % 3 === 0 ? `Review ${item.kind === "chapter" ? "chapter" : "topic"} ${item.name}, then solve ${questions} exam-style questions.` : j % 3 === 1 ? `Timed practice: solve ${questions} questions on ${item.name} and mark uncertain answers.` : `Review errors from ${questions} questions on ${item.name} and strengthen the weakest concept.`;
        return { time: blockTime, subject: item.subject, focus: item.name, task, minutes, questions };
      });
      return { date: dates[i], focus, blocks };
    });
    const plan = { title: "Offline study plan", summary: `${config?.type || "JEE Main"} preparation for ${examDate}: ${count} days, ${selectedChapters.length} selected syllabus chapter${selectedChapters.length === 1 ? "" : "s"}, ${topicItems.length} additional topic${topicItems.length === 1 ? "" : "s"}, ${hours} study hours per day, and ${plannerSlots.length ? `${plannerSlots.length} fixed study slots` : "flexible study times"}. Practice targets scale with each chapter or topic length.`, schedule, mockPrep: mockTests.filter((item) => item.name || item.date).map((item) => ({ test: item.name || "Mock test", steps: ["Revise weak chapters before the test.", "Take the test under timed conditions.", "Review missed and guessed questions the next day."] })), weeklyMilestones: [{ week: "Every 7 days", goal: "Complete one mixed timed set and review the error log." }], adjustmentRule: "If a block runs long, keep tomorrow\u2019s first review and move the lowest priority practice block.", selectedChapterIds, topics: topicItems };
    const historyItem = { id: crypto.randomUUID(), createdAt: (/* @__PURE__ */ new Date()).toISOString(), topics, selectedChapterIds, examDate, mockTests: mockTests.map((item) => ({ ...item })), plan, source: "offline" };
    const nextHistory = recordHistory ? [historyItem, ...history].slice(0, 30) : history;
    setOfflinePlan(plan);
    setRecommendation(plan);
    setHistory(nextHistory);
    if (recordHistory) setActiveHistory(historyItem.id);
    setError("");
    updateConfig({ targetDate: examDate, mockDate: mockTests[0]?.date || "", mockTests, topics, selectedChapterIds, studyHours: Number(hours), breakMinutes: Number(breaks), studySlots, offlinePlan: plan, currentRecommendation: plan, recommendationHistory: nextHistory, planUpdatedAt: (/* @__PURE__ */ new Date()).toISOString() });
  };
  useEffect(() => {
    requestId.current += 1;
    setBusy(false);
    if (!plannerInputsReady.current) {
      plannerInputsReady.current = true;
      return;
    }
    if (offlinePlan || recommendation) buildOfflinePlan(false);
  }, [topics, selectedChapterIds, examDate, mockTests, hours, breaks, studySlots]);
  const currentPlan = offlinePlan || (typeof recommendation === "string" ? null : recommendation);
  const [imageOpen, setImageOpen] = useState(false);
  useEffect(() => {
    if (!aiPlannerFullView) return undefined;
    const closeOnEscape = (event) => event.key === "Escape" && setAiPlannerFullView(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [aiPlannerFullView]);
  const plannerImage = useMemo(() => currentPlan ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(plannerSvg(currentPlan))}` : "", [currentPlan]);
  const offlineSchedule = React.createElement("div", {
    className: "astra-offline-grid",
    children: currentPlan?.schedule?.map((day, index) => React.createElement("article", {
      className: "astra-offline-day",
      key: `${day.date}-${index}`,
      children: [
        React.createElement("header", { children: [
          React.createElement("strong", { children: day.date }),
          React.createElement("span", { children: day.focus })
        ] }),
        React.createElement("div", {
          className: "astra-offline-blocks",
          children: day.blocks?.map((block, i) => React.createElement("section", {
            className: "astra-plan-block",
            key: i,
            children: [
              React.createElement("b", { children: `${block.time} · ${block.subject}` }),
              React.createElement("span", { children: block.task }),
              React.createElement("small", { children: `${block.minutes} min${block.questions ? ` · ${block.questions} questions` : ""}` })
            ]
          }))
        })
      ]
    }))
  });
  return /* @__PURE__ */ jsxDEV("section", { className: "deep-view astra-view", children: [
    /* @__PURE__ */ jsxDEV("header", { className: "deep-heading", children: [
      /* @__PURE__ */ jsxDEV("div", { children: [
        /* @__PURE__ */ jsxDEV("p", { className: "eyebrow", children: "AI RECOMMENDATION \xB7 EXAM STRATEGY" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 84,
          columnNumber: 90
        }, this),
        /* @__PURE__ */ jsxDEV("h1", { children: "Exams & Mock Tests" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 84,
          columnNumber: 150
        }, this),
        /* @__PURE__ */ jsxDEV("p", { children: "Prepare for your target exam and multiple mock tests." }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 84,
          columnNumber: 177
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 84,
        columnNumber: 85
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "astra-history-wrap", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "astra-history-button", "aria-label": "Recommendation history", onClick: () => setHistoryOpen((value) => !value), children: /* @__PURE__ */ jsxDEV(MoreVertical, { size: 20 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 84,
          columnNumber: 400
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 84,
          columnNumber: 279
        }, this),
        historyOpen && /* @__PURE__ */ jsxDEV("div", { className: "astra-history-menu", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "astra-history-heading", children: [
            /* @__PURE__ */ jsxDEV("strong", { children: [
              /* @__PURE__ */ jsxDEV(History, { size: 14 }, void 0, false, { fileName: "<stdin>", lineNumber: 84, columnNumber: 492 }, this),
              " Planner history"
            ] }, void 0, true, { fileName: "<stdin>", lineNumber: 84, columnNumber: 484 }, this),
            history.length > 0 && /* @__PURE__ */ jsxDEV("button", { type: "button", className: "astra-history-clear", "aria-label": "Clear planner history", title: "Clear planner history", onClick: clearHistory, children: /* @__PURE__ */ jsxDEV(Trash2, { size: 16 }, void 0, false, { fileName: "<stdin>", lineNumber: 84, columnNumber: 550 }, this) }, void 0, false, { fileName: "<stdin>", lineNumber: 84, columnNumber: 520 }, this)
          ] }, void 0, true, { fileName: "<stdin>", lineNumber: 84, columnNumber: 448 }, this),
          history.length ? history.map((item) => /* @__PURE__ */ jsxDEV("button", { onClick: () => {
            setOfflinePlan(null);
            setRecommendation(item.plan);
            setActiveHistory(item.id);
            setHistoryOpen(false);
          }, children: [
            /* @__PURE__ */ jsxDEV("span", { children: item.plan?.title || item.topics || "Study plan" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 84,
              columnNumber: 708
            }, this),
            /* @__PURE__ */ jsxDEV("small", { children: new Date(item.createdAt).toLocaleString() }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 84,
              columnNumber: 766
            }, this)
          ] }, item.id, true, {
            fileName: "<stdin>",
            lineNumber: 84,
            columnNumber: 571
          }, this)) : /* @__PURE__ */ jsxDEV("p", { children: "Generated recommendations will be saved here." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 84,
            columnNumber: 835
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 84,
          columnNumber: 448
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 84,
        columnNumber: 243
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 84,
      columnNumber: 52
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "astra-form", children: [
      /* @__PURE__ */ jsxDEV("label", { children: [
        "Target Exam",
        /* @__PURE__ */ jsxDEV("select", { value: config?.type || "JEE Main", onChange: (e) => updateConfig({ type: e.target.value }), children: [
          /* @__PURE__ */ jsxDEV("option", { children: "JEE Main" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 85,
            columnNumber: 144
          }, this),
          /* @__PURE__ */ jsxDEV("option", { children: "JEE Advanced" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 85,
            columnNumber: 169
          }, this),
          /* @__PURE__ */ jsxDEV("option", { children: "Mock Test" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 85,
            columnNumber: 198
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 85,
          columnNumber: 51
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 85,
        columnNumber: 33
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        "Target Exam Date",
        /* @__PURE__ */ jsxDEV("input", { type: "date", value: examDate, onChange: (e) => setExamDate(e.target.value) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 85,
          columnNumber: 264
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 85,
        columnNumber: 241
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "astra-mock-list wide", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "astra-mock-heading", children: [
          /* @__PURE__ */ jsxDEV("strong", { children: "Mock tests" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 86,
            columnNumber: 81
          }, this),
          /* @__PURE__ */ jsxDEV("button", { className: "button", type: "button", onClick: addMock, children: [
            /* @__PURE__ */ jsxDEV(Plus, { size: 14 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 86,
              columnNumber: 167
            }, this),
            " Add mock test"
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 86,
            columnNumber: 108
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 86,
          columnNumber: 45
        }, this),
        mockTests.map((test, index) => /* @__PURE__ */ jsxDEV("div", { className: "astra-mock-row", children: [
          /* @__PURE__ */ jsxDEV("label", { children: [
            /* @__PURE__ */ jsxDEV("span", { children: "Test name" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 86,
              columnNumber: 295
            }, this),
            /* @__PURE__ */ jsxDEV("input", { className: "astra-mock-name", value: test.name, onChange: (e) => patchMock(test.id, { name: e.target.value }), placeholder: `Milestone ${index + 1}` }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 86,
              columnNumber: 317
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 86,
            columnNumber: 288
          }, this),
          mockTests.length > 1 && /* @__PURE__ */ jsxDEV("button", { className: "astra-remove-mock", "aria-label": `Remove ${test.name || "mock test"}`, onClick: () => setMockTests((items) => items.filter((item) => item.id !== test.id)), children: /* @__PURE__ */ jsxDEV(X, { size: 15 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 86,
            columnNumber: 748
          }, this) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 86,
            columnNumber: 589
          }, this)
        ] }, test.id, true, {
          fileName: "<stdin>",
          lineNumber: 86,
          columnNumber: 242
        }, this))
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 86,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "wide astra-chapter-picker", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "astra-chapter-heading", children: [
          /* @__PURE__ */ jsxDEV("button", { type: "button", className: "astra-chapter-toggle", "aria-expanded": chaptersOpen, onClick: () => setChaptersOpen((open) => !open), children: [
            /* @__PURE__ */ jsxDEV("strong", { children: "Syllabus chapters" }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 26 }, this),
            /* @__PURE__ */ jsxDEV(ChevronDown, { size: 16, "aria-hidden": "true" }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 65 }, this)
          ] }, void 0, true, { fileName: "<stdin>", lineNumber: 87, columnNumber: 9 }, this),
          /* @__PURE__ */ jsxDEV("span", { children: `${selectedChapters.length} selected` }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 74 }, this),
          /* @__PURE__ */ jsxDEV("select", { value: chapterSubject, "aria-label": "Filter chapters by subject", onChange: (event) => setChapterSubject(event.target.value), children: [
            /* @__PURE__ */ jsxDEV("option", { value: "All", children: "All subjects" }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 172 }, this),
            /* @__PURE__ */ jsxDEV("option", { value: "Physics", children: "Physics" }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 220 }, this),
            /* @__PURE__ */ jsxDEV("option", { value: "Chemistry", children: "Chemistry" }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 274 }, this),
            /* @__PURE__ */ jsxDEV("option", { value: "Mathematics", children: "Mathematics" }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 333 }, this)
          ] }, void 0, true, { fileName: "<stdin>", lineNumber: 87, columnNumber: 124 }, this)
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 87, columnNumber: 9 }, this),
        chaptersOpen && /* @__PURE__ */ jsxDEV("div", { className: "astra-chapter-options", role: "group", "aria-label": "Select syllabus chapters", children: visibleChapters.map((chapter) => /* @__PURE__ */ jsxDEV("label", { className: "astra-chapter-option", children: [
          /* @__PURE__ */ jsxDEV("input", { type: "checkbox", checked: selectedChapterIds.includes(chapter.id), onChange: () => toggleChapter(chapter.id) }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 581 }, this),
          /* @__PURE__ */ jsxDEV("span", { children: [
            /* @__PURE__ */ jsxDEV("strong", { children: chapter.name }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 731 }, this),
            /* @__PURE__ */ jsxDEV("small", { children: `${chapter.subject} \xB7 ${chapter.unit}` }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 765 }, this)
          ] }, void 0, true, { fileName: "<stdin>", lineNumber: 87, columnNumber: 714 }, this)
        ] }, chapter.id, true, { fileName: "<stdin>", lineNumber: 87, columnNumber: 527 }, this)) }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 77 }, this)
      ] }, void 0, true, { fileName: "<stdin>", lineNumber: 87, columnNumber: 7 }, this),
      /* @__PURE__ */ jsxDEV("label", { className: "wide", children: [
        "Additional Topics",
        /* @__PURE__ */ jsxDEV("textarea", { rows: "3", value: topics, onChange: (e) => setTopics(e.target.value), placeholder: "Add topics separately, using commas or new lines" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 87,
          columnNumber: 46
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 87,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        /* @__PURE__ */ jsxDEV("b", { children: "Daily Study Hours" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 87,
          columnNumber: 182
        }, this),
        /* @__PURE__ */ jsxDEV("input", { type: "number", min: "1", max: "18", value: hours, onChange: (e) => setHours(e.target.value) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 87,
          columnNumber: 206
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 87,
        columnNumber: 175
      }, this),
      /* @__PURE__ */ jsxDEV("label", { children: [
        /* @__PURE__ */ jsxDEV("b", { children: "Break Time Duration (mins)" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 87,
          columnNumber: 315
        }, this),
        /* @__PURE__ */ jsxDEV("input", { type: "number", min: "1", max: "90", value: breaks, onChange: (e) => setBreaks(e.target.value) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 87,
          columnNumber: 348
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 87,
        columnNumber: 308
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "astra-study-slots", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "astra-study-slots-heading", children: [
          /* @__PURE__ */ jsxDEV("strong", { children: "Study slots" }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 385 }, this),
          /* @__PURE__ */ jsxDEV("button", { type: "button", className: "button astra-add-slot", onClick: addStudySlot, children: [/* @__PURE__ */ jsxDEV(Plus, { size: 14 }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 475 }, this), "Add slot"] }, void 0, true, { fileName: "<stdin>", lineNumber: 87, columnNumber: 400 }, this)
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 87, columnNumber: 335 }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "astra-study-slot-list", children: studySlots.map((slot, index) => /* @__PURE__ */ jsxDEV("div", { className: "astra-study-slot", children: [
          /* @__PURE__ */ jsxDEV("strong", { children: `Slot ${index + 1}` }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 634 }, this),
          /* @__PURE__ */ jsxDEV("input", { type: "time", value: slot.start || "", "aria-label": `Slot ${index + 1} start time`, onChange: (event) => patchStudySlot(slot.id, { start: event.target.value }) }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 672 }, this),
          /* @__PURE__ */ jsxDEV("span", { children: "to" }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 832 }, this),
          /* @__PURE__ */ jsxDEV("input", { type: "time", value: slot.end || "", "aria-label": `Slot ${index + 1} end time`, onChange: (event) => patchStudySlot(slot.id, { end: event.target.value }) }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 866 }, this),
          studySlots.length > 1 && /* @__PURE__ */ jsxDEV("button", { type: "button", className: "astra-remove-slot", "aria-label": `Remove Slot ${index + 1}`, onClick: () => removeStudySlot(slot.id), children: /* @__PURE__ */ jsxDEV(X, { size: 15 }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 1035 }, this) }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 973 }, this)
        ] }, slot.id, true, { fileName: "<stdin>", lineNumber: 87, columnNumber: 574 }, this)) }, void 0, false, { fileName: "<stdin>", lineNumber: 87, columnNumber: 532 }, this)
      ] }, void 0, true, { fileName: "<stdin>", lineNumber: 87, columnNumber: 305 }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "button primary", disabled: busy, onClick: update, children: busy ? /* @__PURE__ */ jsxDEV(Fragment, { children: [
        /* @__PURE__ */ jsxDEV(RefreshCw, { size: 14, className: "spin" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 87,
          columnNumber: 528
        }, this),
        " Building planner\u2026"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 87,
        columnNumber: 526
      }, this) : recommendation ? "Update AI planner" : "Generate AI planner" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 87,
        columnNumber: 452
      }, this),
      /* @__PURE__ */ jsxDEV("button", { className: "button astra-offline-button", type: "button", onClick: buildOfflinePlan, children: "Build offline plan" }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 87,
        columnNumber: 657
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 85,
      columnNumber: 5
    }, this),
    error && /* @__PURE__ */ jsxDEV("p", { className: "upload-error", role: "alert", children: error }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 88,
      columnNumber: 13
    }, this),
    /* @__PURE__ */ jsxDEV("article", { className: "astra-ai-recommended", children: [
      /* @__PURE__ */ jsxDEV("header", { className: "astra-ai-recommended-head", children: [
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV(Sparkles, { size: 17 }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 95 }, this),
          /* @__PURE__ */ jsxDEV("strong", { children: "AI Recommended Planner" }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 115 }, this)
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 88, columnNumber: 83 }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          aiPlannerText && /* @__PURE__ */ jsxDEV("button", { type: "button", className: "button", onClick: () => setAiPlannerFullView(true), children: "Full View" }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 170 }, this),
          /* @__PURE__ */ jsxDEV("button", { type: "button", className: "button primary", disabled: aiPlannerBusy, onClick: generateAIRecommendedPlanner, children: aiPlannerBusy ? "Generating…" : aiPlannerText ? "Refresh plan" : "Generate plan" }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 246 }, this)
        ] }, void 0, true, { fileName: "<stdin>", lineNumber: 88, columnNumber: 158 }, this)
      ] }, void 0, true, { fileName: "<stdin>", lineNumber: 88, columnNumber: 67 }, this),
      aiPlannerError && /* @__PURE__ */ jsxDEV("p", { className: "astra-ai-planner-error", role: "alert", children: aiPlannerError }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 410 }, this),
      aiPlannerText ? /* @__PURE__ */ jsxDEV("div", { className: "astra-ai-planner-scroll", children: /* @__PURE__ */ jsxDEV(MathMarkdown, { legacy: true, className: "astra-ai-planner-copy", children: aiPlannerText }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 544 }, this) }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 462 }, this) : /* @__PURE__ */ jsxDEV("p", { className: "astra-ai-planner-empty", children: "Generate a personalized schedule from your selected chapters, topics, study hours, slots, mock tests, and target date." }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 630 }, this)
    ] }, void 0, true, { fileName: "<stdin>", lineNumber: 88, columnNumber: 35 }, this),
    /* @__PURE__ */ jsxDEV("article", { className: "astra-recommendation", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "astra-rec-head", children: [
        /* @__PURE__ */ jsxDEV(Sparkles, { size: 17 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 140
        }, this),
        /* @__PURE__ */ jsxDEV("strong", { children: offlinePlan === currentPlan ? "Offline Study Planner" : currentPlan?.title || "Study Plan" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 161
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: [
          daysLeft,
          " days to exam",
          activeHistory && " \xB7 Saved plan"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 219
        }, this),
        currentPlan && /* @__PURE__ */ jsxDEV("button", { className: "button astra-image-button", onClick: () => setImageOpen(true), children: "View planner image" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 301
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 88,
        columnNumber: 108
      }, this),
      currentPlan ? /* @__PURE__ */ jsxDEV("div", { className: "astra-plan-content", children: [
        offlinePlan && currentPlan === offlinePlan && /* @__PURE__ */ jsxDEV("p", { className: "astra-offline-label", children: "Offline plan \xB7 generated on this device" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 504
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "astra-plan-summary", children: currentPlan.summary }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 583
        }, this),
        currentPlan.schedule?.length > 0 && (offlinePlan === currentPlan ? offlineSchedule : /* @__PURE__ */ jsxDEV("div", { className: "astra-plan-table-wrap", children: /* @__PURE__ */ jsxDEV("table", { className: "astra-plan-table", children: [
          /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("th", { children: "Date" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 761
            }, this),
            /* @__PURE__ */ jsxDEV("th", { children: "Focus" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 774
            }, this),
            /* @__PURE__ */ jsxDEV("th", { children: "Study blocks" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 788
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 757
          }, this) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 750
          }, this),
          /* @__PURE__ */ jsxDEV("tbody", { children: currentPlan.schedule.map((day, index) => /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("td", { children: day.date }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 901
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: day.focus }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 920
            }, this),
            /* @__PURE__ */ jsxDEV("td", { children: day.blocks?.map((block, i) => /* @__PURE__ */ jsxDEV("div", { className: "astra-plan-block", children: [
              /* @__PURE__ */ jsxDEV("b", { children: [
                block.time,
                " \xB7 ",
                block.subject
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 88,
                columnNumber: 1014
              }, this),
              /* @__PURE__ */ jsxDEV("span", { children: block.task }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 88,
                columnNumber: 1051
              }, this),
              /* @__PURE__ */ jsxDEV("small", { children: [
                block.minutes,
                " min",
                block.questions ? ` \xB7 ${block.questions} questions` : ""
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 88,
                columnNumber: 1076
              }, this)
            ] }, i, true, {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 972
            }, this)) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 940
            }, this)
          ] }, `${day.date}-${index}`, true, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 868
          }, this)) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 822
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 714
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 675
        }, this)),
        currentPlan.mockPrep?.length > 0 && /* @__PURE__ */ jsxDEV("section", { className: "astra-plan-section", children: [
          /* @__PURE__ */ jsxDEV("h3", { children: "Mock test preparation" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 1226
          }, this),
          /* @__PURE__ */ jsxDEV("div", { children: currentPlan.mockPrep.map((mock, index) => /* @__PURE__ */ jsxDEV("article", { children: [
            /* @__PURE__ */ jsxDEV("strong", { children: mock.test }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 1322
            }, this),
            /* @__PURE__ */ jsxDEV("ul", { children: mock.steps?.map((step, i) => /* @__PURE__ */ jsxDEV("li", { children: step }, i, false, {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 1381
            }, this)) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 1350
            }, this)
          ] }, index, true, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 1301
          }, this)) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 1256
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 1186
        }, this),
        currentPlan.weeklyMilestones?.length > 0 && /* @__PURE__ */ jsxDEV("section", { className: "astra-plan-section", children: [
          /* @__PURE__ */ jsxDEV("h3", { children: "Milestones" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 1521
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "astra-milestone-grid", children: currentPlan.weeklyMilestones.map((item, index) => /* @__PURE__ */ jsxDEV("article", { children: [
            /* @__PURE__ */ jsxDEV("small", { children: item.week }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 1647
            }, this),
            /* @__PURE__ */ jsxDEV("strong", { children: item.goal }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 88,
              columnNumber: 1673
            }, this)
          ] }, index, true, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 1626
          }, this)) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 1540
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 1481
        }, this),
        currentPlan.adjustmentRule && /* @__PURE__ */ jsxDEV("p", { className: "astra-adjustment", children: [
          /* @__PURE__ */ jsxDEV("b", { children: "Adapt your plan" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 1791
          }, this),
          currentPlan.adjustmentRule
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 1759
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 88,
        columnNumber: 427
      }, this) : recommendation ? /* @__PURE__ */ jsxDEV("p", { children: recommendation }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 88,
        columnNumber: 1868
      }, this) : /* @__PURE__ */ jsxDEV("p", { children: hasApiKey() ? "Set your dates and topics, then generate a study planner." : "Add your Groq API key in Settings to generate a personalized planner." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 88,
        columnNumber: 1892
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 88,
      columnNumber: 66
    }, this),
    aiPlannerFullView && /* @__PURE__ */ jsxDEV("div", { className: "astra-ai-planner-fullview", onMouseDown: (event) => { if (event.target === event.currentTarget) setAiPlannerFullView(false); }, children: /* @__PURE__ */ jsxDEV("section", { className: "astra-ai-planner-fullview-panel", role: "dialog", "aria-modal": "true", "aria-label": "AI Recommended Planner", children: [
      /* @__PURE__ */ jsxDEV("header", { children: [
        /* @__PURE__ */ jsxDEV("strong", { children: "AI Recommended Planner" }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 2200 }, this),
        /* @__PURE__ */ jsxDEV("button", { type: "button", className: "close-button", "aria-label": "Close full view", onClick: () => setAiPlannerFullView(false), children: /* @__PURE__ */ jsxDEV(X, { size: 18 }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 2260 }, this) }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 2218 }, this)
      ] }, void 0, true, { fileName: "<stdin>", lineNumber: 88, columnNumber: 2158 }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "astra-ai-planner-fullview-copy", children: /* @__PURE__ */ jsxDEV(MathMarkdown, { legacy: true, className: "astra-ai-planner-copy", children: aiPlannerText }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 2390 }, this) }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 2345 }, this)
    ] }, void 0, true, { fileName: "<stdin>", lineNumber: 88, columnNumber: 2110 }, this) }, void 0, false, { fileName: "<stdin>", lineNumber: 88, columnNumber: 2075 }, this),
    imageOpen && /* @__PURE__ */ jsxDEV("div", { className: "planner-image-overlay", onMouseDown: (event) => {
      if (event.target === event.currentTarget) setImageOpen(false);
    }, children: /* @__PURE__ */ jsxDEV("section", { className: "planner-image-modal", role: "dialog", "aria-modal": "true", "aria-label": "Planner image", children: [
      /* @__PURE__ */ jsxDEV("header", { children: [
        /* @__PURE__ */ jsxDEV("strong", { children: "Planner image" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 2291
        }, this),
        /* @__PURE__ */ jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDEV("a", { className: "button", href: plannerImage, download: "apex-jee-planner.svg", children: "Download SVG" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 2326
          }, this),
          /* @__PURE__ */ jsxDEV("button", { className: "close-button", "aria-label": "Close planner image", onClick: () => setImageOpen(false), children: /* @__PURE__ */ jsxDEV(X, { size: 16 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 2516
          }, this) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 88,
            columnNumber: 2416
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 88,
          columnNumber: 2321
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 88,
        columnNumber: 2283
      }, this),
      /* @__PURE__ */ jsxDEV("img", { src: plannerImage, alt: `Image of ${currentPlan?.title || "AI study planner"}` }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 88,
        columnNumber: 2554
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 88,
      columnNumber: 2183
    }, this) }, void 0, false, {
      fileName: "<stdin>",
      lineNumber: 88,
      columnNumber: 2062
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 84,
    columnNumber: 10
  }, this);
}
function ApiKeySettings({ groqKeys = [], geminiKeys = [], onSaveKeys, modelPrefs = DEFAULT_MODEL_PREFERENCES, onModelPrefsChange, embedded = false }) {
  const h = React.createElement;
  const makeRows = (keys, prefix) => keys.length ? keys.map((entry, index) => ({ id: entry.id || `${prefix}-${index + 1}`, key: entry.key || "" })) : [{ id: `${prefix}-1`, key: "" }];
  const [draftGroq, setDraftGroq] = useState(() => makeRows(groqKeys, "groq"));
  const [draftGemini, setDraftGemini] = useState(() => makeRows(geminiKeys, "gemini"));
  const [visible, setVisible] = useState({});
  const [notice, setNotice] = useState("");
  useEffect(() => setDraftGroq(makeRows(groqKeys, "groq")), [groqKeys]);
  useEffect(() => setDraftGemini(makeRows(geminiKeys, "gemini")), [geminiKeys]);
  const preference = (task, nextValue) => onModelPrefsChange({ ...DEFAULT_MODEL_PREFERENCES, ...modelPrefs, [task]: nextValue });
  const chatOptions = [{ id: "auto", label: "Automatic" }, ...CHAT_MODELS.map((model) => ({ id: model.id, label: model.label }))];
  const renderKeyGroup = (title, rows, setRows, prefix, label) => h("section", { className: "provider-key-group", key: prefix },
    h("h3", null, title),
    h("p", { className: "provider-quota-estimate" }, `Shared pool estimate · ${getTokenQuotaEstimate(prefix, "aggregate").tpm.toLocaleString()} / ${getTokenQuotaEstimate(prefix, "aggregate").tpmLimit.toLocaleString()} TPM · ${getTokenQuotaEstimate(prefix, "aggregate").tpd.toLocaleString()} / ${getTokenQuotaEstimate(prefix, "aggregate").tpdLimit.toLocaleString()} TPD`),
    h("div", { className: "api-key-slot-list" }, rows.map((row, index) => {
      const quota = getTokenQuotaEstimate(prefix, row.id);
      return h("div", { className: "api-key-slot provider-key-row", key: row.id },
        h("label", { className: "api-key-slot-secret" },
          h("span", { className: "sr-only" }, `${label} ${index + 1}`),
          h("input", { "aria-label": `${label} ${index + 1}`, type: visible[row.id] ? "text" : "password", value: row.key, onChange: (event) => setRows((current) => current.map((item) => item.id === row.id ? { ...item, key: event.target.value } : item)), placeholder: label, autoComplete: "new-password" })
        ),
        h("div", { className: "provider-key-actions" },
          h("button", { className: "button", type: "button", onClick: () => setVisible((current) => ({ ...current, [row.id]: !current[row.id] })) }, visible[row.id] ? "Hide" : "Show"),
          rows.length > 1 && h("button", { className: "button", type: "button", "aria-label": `Remove ${label} ${index + 1}`, onClick: () => setRows((current) => current.filter((item) => item.id !== row.id)) }, "Remove")
        ),
        h("small", { className: "provider-quota-estimate" }, `Estimated use · ${quota.tpm.toLocaleString()} / ${quota.tpmLimit.toLocaleString()} TPM · ${quota.tpd.toLocaleString()} / ${quota.tpdLimit.toLocaleString()} TPD`)
      );
    })),
    h("button", { className: "button primary add-provider-key", type: "button", onClick: () => setRows((current) => [...current, { id: `${prefix}-${crypto.randomUUID()}`, key: "" }]) }, h(Plus, { size: 15 }), " Add another key")
  );
  const save = () => {
    onSaveKeys({ groq: draftGroq.map(({ id, key }) => ({ id, key: key.trim() })), gemini: draftGemini.map(({ id, key }) => ({ id, key: key.trim() })) });
    setNotice("API keys saved in this browser.");
  };
  const modelSelect = (task, label, defaultValue, options) => h("label", { className: "model-preference", key: task },
    h("span", null, label),
    h("select", { value: modelPrefs?.[task] || defaultValue, onChange: (event) => preference(task, event.target.value) }, options.map((item) => h("option", { value: item.id, key: item.id }, item.label)))
  );
  return h("section", { className: `api-key-settings ${embedded ? "embedded" : ""}` },
    h("div", { className: "ai-settings-copy" },
      h("p", { className: "eyebrow" }, "AI CONNECTIONS"),
      h("h2", null, "API keys & model routing"),
      h("p", null, "Keys stay in this browser and are sent directly to their provider. Requests rotate through saved keys using local token estimates and provider cooldowns.")
    ),
    h("div", { className: "api-key-vault provider-key-vault" },
      renderKeyGroup("Groq API Key", draftGroq, setDraftGroq, "groq", "Groq API Key"),
      renderKeyGroup("Google AI Studio (Gemini) Keys", draftGemini, setDraftGemini, "gemini", "Gemini API Key"),
      h("div", { className: "api-key-vault-actions" },
        h("span", null, "TPM / TPD figures are local estimates. Groq shares limits by organization; Gemini shares them by project, and exact caps vary."),
        h("button", { className: "button primary", type: "button", onClick: save }, "Save API keys")
      ),
      notice && h("p", { className: "key-vault-notice", role: "status" }, notice)
    ),
    h("section", { className: "ai-model-routing" },
      h("div", null, h("strong", null, "Automatic model routing"), h("p", null, "Apex Assistant uses Groq for text and Gemini for image questions. Memory Recall uses Gemini.")),
      h("div", { className: "model-preference-grid" },
        modelSelect("assistant", "AI assistant", "auto", chatOptions),
        modelSelect("planning", "Exam planning", "auto", chatOptions),
        h("div", { className: "model-preference", key: "recall" }, h("span", null, "Flashcards & quizzes"), h("strong", null, "Google AI Studio · Gemini")),
        modelSelect("transcription", "Audio transcription", "whisper-large-v3-turbo", AI_MODELS.filter((model) => model.kind === "transcription")),
        h("label", { className: "model-preference", key: "speech" }, h("span", null, "Read answers aloud"), h("select", { value: modelPrefs?.speech || "auto", onChange: (event) => preference("speech", event.target.value) }, h("option", { value: "auto" }, "Automatic"), SPEECH_MODELS.map((model) => h("option", { value: model.id, key: model.id }, model.label))))
      )
    )
  );
}
var stdin_default = { RevisionPlanner, AstraPlanner, ApiKeySettings };
export { RevisionPlanner, AstraPlanner, ApiKeySettings };
