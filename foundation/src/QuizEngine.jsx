import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardCheck, RotateCcw, Trophy, XCircle } from "lucide-react";
import { useAppState } from "./DataProvider.jsx";
import "katex/dist/katex.min.css";

const OPTION_LETTERS = ["A", "B", "C", "D"];

const MarkdownRenderer = React.lazy(async () => {
  const [markdownModule, gfmModule, mathModule, katexModule] = await Promise.all([
    import("react-markdown"),
    import("remark-gfm"),
    import("remark-math"),
    import("rehype-katex")
  ]);
  const ReactMarkdown = markdownModule.default;
  const remarkGfm = gfmModule.default;
  const remarkMath = mathModule.default;
  const rehypeKatex = katexModule.default;

  return {
    default: function MarkdownContent({ children }) {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            h1: ({ children: content }) => <h1 className="mb-3 text-xl font-bold tracking-tight">{content}</h1>,
            h2: ({ children: content }) => <h2 className="mb-2 text-lg font-bold tracking-tight">{content}</h2>,
            h3: ({ children: content }) => <h3 className="mb-2 text-base font-bold">{content}</h3>,
            p: ({ children: content }) => <p className="my-2 first:mt-0 last:mb-0">{content}</p>,
            ul: ({ children: content }) => <ul className="my-2 list-disc space-y-1 pl-5">{content}</ul>,
            ol: ({ children: content }) => <ol className="my-2 list-decimal space-y-1 pl-5">{content}</ol>,
            li: ({ children: content }) => <li className="pl-0.5">{content}</li>,
            blockquote: ({ children: content }) => <blockquote className="my-3 border-l-2 border-indigo-300 pl-4 italic text-slate-600">{content}</blockquote>,
            code: ({ className = "", children: content }) => (
              <code className={className ? "rounded bg-slate-900/10 px-1 py-0.5 text-[0.9em]" : "rounded bg-slate-100 px-1 py-0.5 text-[0.9em] text-indigo-800"}>
                {content}
              </code>
            ),
            pre: ({ children: content }) => <pre className="my-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-left text-sm text-slate-100">{content}</pre>,
            a: ({ href = "#", title, children: content }) => <a href={href} title={title} target="_blank" rel="noreferrer" className="font-semibold text-indigo-700 underline decoration-indigo-200 underline-offset-2">{content}</a>,
            table: ({ children: content }) => <div className="my-3 overflow-x-auto"><table className="min-w-full border-collapse text-sm">{content}</table></div>,
            th: ({ children: content }) => <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-bold">{content}</th>,
            td: ({ children: content }) => <td className="border border-slate-200 px-3 py-2 align-top">{content}</td>
          }}
        >
          {String(children ?? "")}
        </ReactMarkdown>
      );
    }
  };
});

function MarkdownText({ value, className = "" }) {
  return (
    <div className={`min-w-0 break-words leading-7 ${className}`}>
      <React.Suspense fallback={<span className="text-sm text-slate-400">Preparing math…</span>}>
        <MarkdownRenderer>{String(value ?? "")}</MarkdownRenderer>
      </React.Suspense>
    </div>
  );
}

function UnitPrompt() {
  return (
    <div className="mx-auto flex min-h-[300px] max-w-2xl flex-col items-center justify-center rounded-3xl border border-indigo-100 bg-white px-6 py-12 text-center shadow-sm">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
        <ClipboardCheck size={25} aria-hidden="true" />
      </span>
      <h2 className="text-xl font-bold tracking-tight text-slate-900">Choose a unit to begin</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Please select a unit from the sidebar to begin.</p>
    </div>
  );
}

function EmptyQuiz() {
  return (
    <div className="mx-auto flex min-h-[300px] max-w-2xl flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <ClipboardCheck size={25} aria-hidden="true" />
      </span>
      <h2 className="text-xl font-bold tracking-tight text-slate-900">No quiz questions in this unit yet</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Try another unit or add quiz questions to this topic in the study data.</p>
    </div>
  );
}

function ScoreScreen({ score, total, onRetake }) {
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const message = percentage === 100
    ? "Perfect score — excellent work!"
    : percentage >= 70
      ? "Strong work. Keep building on what you know."
      : "Good practice. Review the explanations and give it another try.";

  return (
    <section className="mx-auto flex min-h-[460px] w-full max-w-3xl flex-col items-center justify-center rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-sky-50 px-6 py-12 text-center shadow-sm sm:px-12" aria-label="Quiz results">
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-indigo-100 text-indigo-700">
        <Trophy size={30} aria-hidden="true" />
      </span>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Quiz complete</p>
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">You scored {score}/{total}!</h2>
      <p className="mt-3 text-sm font-semibold text-slate-600">{percentage}% correct</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onRetake}
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
      >
        <RotateCcw size={17} aria-hidden="true" /> Retake Quiz
      </button>
    </section>
  );
}

export default function QuizEngine() {
  const { selectedSubject, selectedUnit, filteredQuizzes } = useAppState();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    setCurrentIndex(0);
    setAnswers([]);
  }, [selectedSubject, selectedUnit, filteredQuizzes]);

  const score = useMemo(() => answers.reduce((total, answer, index) => (
    answer === filteredQuizzes[index]?.correctAnswer ? total + 1 : total
  ), 0), [answers, filteredQuizzes]);

  if (!selectedUnit) return <UnitPrompt />;
  if (!filteredQuizzes.length) return <EmptyQuiz />;
  if (currentIndex >= filteredQuizzes.length) {
    return <ScoreScreen score={score} total={filteredQuizzes.length} onRetake={() => { setCurrentIndex(0); setAnswers([]); }} />;
  }

  const questions = filteredQuizzes;
  const question = questions[currentIndex];
  const selectedAnswer = answers[currentIndex] ?? null;
  const isAnswered = selectedAnswer !== null;
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);
  const scopeLabel = [selectedSubject, selectedUnit].filter(Boolean).join(" · ");
  const optionExplanation = typeof question.optionExplanations?.[selectedAnswer] === "string"
    ? question.optionExplanations[selectedAnswer].trim()
    : "";
  const fullExplanation = typeof question.fullExplanation === "string" ? question.fullExplanation.trim() : "";

  const answerQuestion = (optionIndex) => {
    setAnswers((previousAnswers) => {
      if (previousAnswers[currentIndex] !== undefined && previousAnswers[currentIndex] !== null) return previousAnswers;
      const nextAnswers = [...previousAnswers];
      nextAnswers[currentIndex] = optionIndex;
      return nextAnswers;
    });
  };
  const nextQuestion = () => {
    if (!isAnswered) return;
    setCurrentIndex((index) => index + 1);
  };

  return (
    <section className="mx-auto w-full max-w-4xl" aria-label="Multiple-choice quiz">
      <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Testing mode</p>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Quiz</h2>
            <p className="mt-1 text-sm text-slate-500">{scopeLabel}</p>
          </div>
          <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-800" aria-live="polite">
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label="Quiz progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-7">
        <div className="mb-6 flex items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-50 text-sm font-extrabold text-indigo-700">{currentIndex + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Question</p>
            <div className="text-lg font-semibold leading-8 text-slate-900 sm:text-xl">
              <MarkdownText value={question.question} />
            </div>
          </div>
        </div>

        <div className="grid gap-3" role="group" aria-label="Answer options">
          {question.options.map((option, optionIndex) => {
            const isSelected = selectedAnswer === optionIndex;
            const isCorrect = question.correctAnswer === optionIndex;
            let optionStyle = "border-slate-200 bg-white text-slate-800 hover:border-indigo-300 hover:bg-indigo-50";
            let letterStyle = "bg-slate-100 text-slate-600";
            if (isAnswered && isCorrect) {
              optionStyle = "border-emerald-300 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200";
              letterStyle = "bg-emerald-600 text-white";
            } else if (isAnswered && isSelected) {
              optionStyle = "border-rose-300 bg-rose-50 text-rose-950 ring-1 ring-rose-200";
              letterStyle = "bg-rose-600 text-white";
            } else if (isAnswered) {
              optionStyle = "border-slate-200 bg-slate-50 text-slate-500";
              letterStyle = "bg-slate-200 text-slate-500";
            }

            return (
              <button
                key={`${question.topicId || "topic"}-${question.index ?? currentIndex}-${optionIndex}`}
                type="button"
                onClick={() => answerQuestion(optionIndex)}
                disabled={isAnswered}
                aria-pressed={isSelected}
                className={`flex min-h-16 w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-medium leading-6 transition sm:px-4 ${optionStyle} disabled:cursor-default`}
              >
                <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${letterStyle}`} aria-hidden="true">{OPTION_LETTERS[optionIndex]}</span>
                <span className="min-w-0 flex-1 pt-0.5"><MarkdownText value={option} /></span>
                {isAnswered && isCorrect && <CheckCircle2 size={19} className="mt-1 shrink-0 text-emerald-600" aria-label="Correct answer" />}
                {isAnswered && isSelected && !isCorrect && <XCircle size={19} className="mt-1 shrink-0 text-rose-600" aria-label="Your answer was incorrect" />}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <section className={`mt-5 rounded-2xl border p-4 sm:p-5 ${selectedAnswer === question.correctAnswer ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/70"}`} aria-live="polite">
            <div className="mb-3 flex items-center gap-2">
              {selectedAnswer === question.correctAnswer
                ? <CheckCircle2 size={18} className="shrink-0 text-emerald-600" aria-hidden="true" />
                : <XCircle size={18} className="shrink-0 text-rose-600" aria-hidden="true" />}
              <h3 className="font-bold text-slate-900">{selectedAnswer === question.correctAnswer ? "Correct!" : "Not quite — the correct answer is highlighted."}</h3>
            </div>
            <div className="space-y-4 text-sm leading-7 text-slate-700">
              {optionExplanation && (
                <div>
                  <h4 className="mb-1 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">For your choice</h4>
                  <MarkdownText value={optionExplanation} />
                </div>
              )}
              {fullExplanation && (
                <div>
                  <h4 className="mb-1 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Full explanation</h4>
                  <MarkdownText value={fullExplanation} />
                </div>
              )}
              {!optionExplanation && !fullExplanation && <p className="text-sm text-slate-600">No explanation is available for this question yet.</p>}
            </div>
          </section>
        )}

        {isAnswered && (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={nextQuestion}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
            >
              {currentIndex === questions.length - 1 ? "See Results" : "Next Question"}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
