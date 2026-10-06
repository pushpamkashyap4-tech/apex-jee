import React, { useEffect, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { useAppState } from "./DataProvider.jsx";
import "katex/dist/katex.min.css";

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

function MarkdownText({ value }) {
  return (
    <React.Suspense fallback={<span className="text-sm text-slate-400">Preparing math…</span>}>
      <MarkdownRenderer>{String(value ?? "")}</MarkdownRenderer>
    </React.Suspense>
  );
}

function UnitPrompt() {
  return (
    <div className="mx-auto flex min-h-[300px] max-w-2xl flex-col items-center justify-center rounded-3xl border border-indigo-100 bg-white px-6 py-12 text-center shadow-sm">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
        <BookOpen size={25} aria-hidden="true" />
      </span>
      <h2 className="text-xl font-bold tracking-tight text-slate-900">Choose a unit to begin</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Please select a unit from the sidebar to begin.</p>
    </div>
  );
}

export default function FlashcardEngine() {
  const { selectedSubject, selectedUnit, filteredFlashcards } = useAppState();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedSubject, selectedUnit, filteredFlashcards]);

  if (!selectedUnit) return <UnitPrompt />;

  const cards = filteredFlashcards;
  if (!cards.length) {
    return (
      <div className="mx-auto flex min-h-[300px] max-w-2xl flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <BookOpen size={25} aria-hidden="true" />
        </span>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">No flashcards in this unit yet</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Try another unit or add flashcards to this topic in the study data.</p>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, cards.length - 1);
  const card = cards[safeIndex];
  const scopeLabel = [selectedSubject, selectedUnit].filter(Boolean).join(" · ");

  const goToCard = (nextIndex) => {
    setCurrentIndex(Math.max(0, Math.min(nextIndex, cards.length - 1)));
    setIsFlipped(false);
  };
  const flipCard = () => setIsFlipped((flipped) => !flipped);
  const handleCardKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      flipCard();
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl" aria-label="Flashcard study mode">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600">Study mode</p>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">Flashcards</h2>
          <p className="mt-1 text-sm text-slate-500">{scopeLabel}</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm" aria-live="polite">
          Card {safeIndex + 1} of {cards.length}
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl [perspective:1400px]">
        <div
          role="button"
          tabIndex={0}
          aria-pressed={isFlipped}
          aria-label={`${isFlipped ? "Show front" : "Flip to back"} of card ${safeIndex + 1}`}
          onClick={flipCard}
          onKeyDown={handleCardKeyDown}
          className="relative h-[min(60vh,560px)] min-h-[340px] cursor-pointer select-none rounded-[2rem] text-left outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 focus-visible:ring-offset-4"
        >
          <div
            className="relative h-full w-full transform-gpu transition-transform duration-700 [transform-style:preserve-3d] motion-reduce:transition-none"
            style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-white via-indigo-50 to-sky-50 px-6 py-8 text-center shadow-xl shadow-indigo-100/70 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] sm:px-12">
              <span className="absolute left-6 top-6 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700 ring-1 ring-indigo-100">Front</span>
              <div className="my-auto max-h-[72%] w-full overflow-y-auto px-1 text-lg font-semibold leading-8 text-slate-900 sm:text-2xl sm:leading-10">
                <MarkdownText value={card.front} />
              </div>
              <span className="absolute bottom-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                Click the card or use Flip to reveal the answer
              </span>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-8 text-center shadow-xl shadow-emerald-100/70 [transform:rotateY(180deg)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] sm:px-12">
              <span className="absolute left-6 top-6 rounded-full bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 ring-1 ring-emerald-100">Back</span>
              <div className="my-auto max-h-[72%] w-full overflow-y-auto px-1 text-base leading-8 text-slate-800 sm:text-xl sm:leading-9">
                <MarkdownText value={card.back} />
              </div>
              <span className="absolute bottom-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400">
                <RotateCw size={13} aria-hidden="true" /> Click to see the front again
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-2xl flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => goToCard(safeIndex - 1)}
          disabled={safeIndex === 0}
          className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={17} aria-hidden="true" /> Previous
        </button>
        <button
          type="button"
          onClick={flipCard}
          className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
        >
          <RotateCw size={17} aria-hidden="true" /> Flip
        </button>
        <button
          type="button"
          onClick={() => goToCard(safeIndex + 1)}
          disabled={safeIndex === cards.length - 1}
          className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next <ChevronRight size={17} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
