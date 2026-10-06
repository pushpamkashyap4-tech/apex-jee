import React, { useEffect, useRef, useState } from "react";
import { Bot, Send, Volume2 } from "lucide-react";
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
    default: function MarkdownContent({ children, components }) {
      return <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components}>{children}</ReactMarkdown>;
    }
  };
});

const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const PLOT_DOMAIN = [-10, 10];
const ALLOWED_FUNCTIONS = new Set([
  "sin", "cos", "tan", "asin", "acos", "atan", "sinh", "cosh", "tanh",
  "sqrt", "log", "ln", "exp", "abs", "floor", "ceil", "sign", "pi", "e"
]);

function parsePlotExpression(rawCode) {
  const firstLine = String(rawCode || "").split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
  const equation = firstLine.match(/^(?:y|f\s*\(\s*x\s*\))\s*=\s*(.+)$/i);
  const expression = (equation ? equation[1] : firstLine).trim();
  if (!expression || expression.length > 160) return "";

  const identifiers = expression.match(/[a-zA-Z_]+/g) || [];
  if (identifiers.some((identifier) => identifier.toLowerCase() !== "x" && !ALLOWED_FUNCTIONS.has(identifier.toLowerCase()))) return "";
  const remaining = expression.replace(/[a-zA-Z_]+/g, "").replace(/[0-9xX+\-*/^().,\s]/g, "");
  return remaining ? "" : expression;
}

function FunctionPlot({ code }) {
  const frameRef = useRef(null);
  const plotRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [plotError, setPlotError] = useState("");
  const expression = parsePlotExpression(code);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const updateWidth = () => setWidth(Math.max(280, Math.floor(frame.clientWidth)));
    updateWidth();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }
    const observer = new ResizeObserver(updateWidth);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const target = plotRef.current;
    if (!target) return undefined;
    target.replaceChildren();
    if (!expression) {
      setPlotError("This plot expression is invalid or unsupported.");
      return () => target.replaceChildren();
    }

    let cancelled = false;
    setPlotError("");
    import("function-plot")
      .then((module) => {
        if (cancelled) return;
        const renderPlot = module.default || module;
        renderPlot({
          target,
          width,
          height: 320,
          grid: true,
          xAxis: { domain: PLOT_DOMAIN, label: "x" },
          yAxis: { domain: PLOT_DOMAIN, label: "y" },
          data: [{ fn: expression, color: "#4f46e5", graphType: "polyline", sampler: "builtIn" }]
        });
      })
      .catch((error) => {
        if (cancelled) return;
        target.replaceChildren();
        setPlotError(error?.message || "The function could not be plotted.");
      });
    return () => {
      cancelled = true;
      target.replaceChildren();
    };
  }, [expression, width]);

  return (
    <figure className="my-4 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 shadow-sm">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 px-4 py-3">
        <span className="text-sm font-bold text-indigo-950">Function plot</span>
        <code className="rounded-md bg-white/80 px-2 py-1 text-xs text-indigo-800">{expression ? `y = ${expression}` : "Invalid plot expression"}</code>
      </figcaption>
      <div ref={frameRef} className="min-h-[320px] overflow-x-auto px-2 py-3" aria-label={`Plot of ${expression || "invalid expression"}`}>
        <div ref={plotRef} className={`mx-auto min-h-[300px] ${plotError ? "hidden" : ""}`} />
        {plotError && <p className="grid min-h-[290px] place-items-center px-4 text-center text-sm text-rose-700" role="status">{plotError}</p>}
      </div>
      <p className="border-t border-indigo-100 px-4 py-2 text-[11px] text-slate-500">Grid enabled · x and y domains: [−10, 10]</p>
    </figure>
  );
}

function PlotCodeBlock({ code }) {
  return <FunctionPlot code={code} />;
}

function MarkdownCode({ className = "", children }) {
  if (/\blanguage-plot\b/i.test(className)) {
    return <PlotCodeBlock code={String(children).replace(/\n$/, "")} />;
  }
  const isFencedBlock = /\blanguage-/.test(className);
  const codeClassName = isFencedBlock
    ? `${className} rounded bg-transparent px-0 py-0 text-[0.9em] text-slate-100`
    : "rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-indigo-800";
  return <code className={codeClassName}>{children}</code>;
}

function MarkdownPre({ children }) {
  const child = React.Children.toArray(children).find(React.isValidElement);
  if (/\blanguage-plot\b/i.test(child?.props?.className || "")) return <>{children}</>;
  return (
    <div className="my-4 max-w-full overflow-x-auto rounded-xl bg-slate-950 p-4 text-slate-100">
      <pre className="m-0 whitespace-pre">{children}</pre>
    </div>
  );
}

function splitWikipediaImageTags(text) {
  const source = String(text || "");
  const pattern = /\[WIKI_IMAGE:\s*([^\]\r\n]{1,160})\]/gi;
  const parts = [];
  let cursor = 0;
  let match;
  while ((match = pattern.exec(source))) {
    if (match.index > cursor) parts.push({ type: "markdown", content: source.slice(cursor, match.index) });
    parts.push({ type: "wiki-image", term: match[1].trim() });
    cursor = pattern.lastIndex;
  }
  if (cursor < source.length) parts.push({ type: "markdown", content: source.slice(cursor) });
  return parts.length ? parts : [{ type: "markdown", content: source }];
}

function WikiImage({ term }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setImage(null);
    setError("");
    setLoading(true);
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: term,
      gsrlimit: "1",
      prop: "pageimages|info",
      inprop: "url",
      pithumbsize: "800",
      format: "json",
      origin: "*"
    });
    fetch(`${WIKIPEDIA_API}?${params.toString()}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Wikipedia search failed (${response.status}).`);
        return response.json();
      })
      .then((payload) => {
        const page = Object.values(payload?.query?.pages || {})[0];
        if (!page?.thumbnail?.source) throw new Error("No Wikipedia thumbnail was found for this term.");
        let sourceUrl = "";
        try {
          const parsedUrl = new URL(page.fullurl);
          if (parsedUrl.protocol === "https:" && parsedUrl.hostname.endsWith(".wikipedia.org")) sourceUrl = parsedUrl.href;
        } catch {
          // The thumbnail remains useful when the page metadata has no safe link.
        }
        setImage({ src: page.thumbnail.source, title: page.title || term, sourceUrl });
      })
      .catch((fetchError) => {
        if (!controller.signal.aborted) setError(fetchError?.message || "No diagram image was found.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [term]);

  return (
    <figure className="my-4 max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {loading && <div className="grid min-h-40 place-items-center bg-slate-50 text-sm text-slate-500" role="status">Searching Wikipedia for “{term}”…</div>}
      {!loading && image && (
        <img
          src={image.src}
          alt={image.title}
          loading="lazy"
          onError={() => {
            setImage(null);
            setError("The Wikipedia thumbnail could not be loaded.");
          }}
          className="max-h-[520px] w-full bg-slate-50 object-contain"
        />
      )}
      {!loading && error && <div className="grid min-h-28 place-items-center px-5 py-6 text-center text-sm text-slate-600" role="status">{error}</div>}
      {!loading && image && (
        <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
          <span>Wikipedia image: {image.title}</span>
          {image.sourceUrl && <a href={image.sourceUrl} target="_blank" rel="noreferrer" className="font-medium text-indigo-700 hover:underline">Source article ↗</a>}
        </figcaption>
      )}
    </figure>
  );
}

function MessageContent({ content }) {
  const parts = splitWikipediaImageTags(content);
  const markdownComponents = {
    code: MarkdownCode,
    pre: MarkdownPre,
    h1: ({ children }) => <h1 className="mb-3 mt-5 text-xl font-bold tracking-tight text-slate-900 first:mt-0">{children}</h1>,
    h2: ({ children }) => <h2 className="mb-2 mt-5 text-lg font-bold tracking-tight text-slate-900 first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="mb-2 mt-4 text-base font-bold text-slate-900 first:mt-0">{children}</h3>,
    p: ({ children }) => <p className="my-2 leading-7 first:mt-0 last:mb-0">{children}</p>,
    ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
    li: ({ children }) => <li className="pl-0.5">{children}</li>,
    blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-indigo-300 pl-4 italic text-slate-600">{children}</blockquote>,
    hr: () => <hr className="my-4 border-slate-200" />,
    a: ({ href = "#", title, children }) => <a href={href} title={title} target="_blank" rel="noreferrer" className="font-medium text-indigo-700 underline decoration-indigo-200 underline-offset-2">{children}</a>,
    table: ({ children }) => <div className="my-3 max-w-full overflow-x-auto"><table className="min-w-full border-collapse text-sm">{children}</table></div>,
    th: ({ children }) => <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-bold">{children}</th>,
    td: ({ children }) => <td className="border border-slate-200 px-3 py-2 align-top">{children}</td>,
    img: ({ src, alt = "Study visual", title }) => <img src={src} alt={alt} title={title} loading="lazy" className="my-3 max-h-[520px] max-w-full rounded-xl object-contain" />
  };

  return (
    <div className="min-w-0 break-words text-sm leading-7 text-slate-700 [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex]:text-[1em]">
      {parts.map((part, index) => part.type === "wiki-image" ? (
        <WikiImage key={`wiki-${index}`} term={part.term} />
      ) : part.content ? (
        <React.Suspense key={`markdown-${index}`} fallback={<span className="text-xs text-slate-400">Formatting answer…</span>}>
          <MarkdownRenderer components={markdownComponents}>{part.content}</MarkdownRenderer>
        </React.Suspense>
      ) : null)}
    </div>
  );
}

function speechText(markdown) {
  return String(markdown || "")
    .replace(/```plot\s*([\s\S]*?)```/gi, "$1")
    .replace(/\[WIKI_IMAGE:\s*([^\]]+)\]/gi, "diagram of $1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\$\$?([\s\S]*?)\$\$?/g, "$1")
    .replace(/[`*_>#|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function StudyCopilot() {
  const { selectedSubject, selectedUnit } = useAppState();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [generatingVoiceId, setGeneratingVoiceId] = useState(null);
  const [playingVoiceId, setPlayingVoiceId] = useState(null);
  const [error, setError] = useState("");
  const historyRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef("");
  const chatAbortRef = useRef(null);
  const ttsAbortRef = useRef(null);

  useEffect(() => {
    const history = historyRef.current;
    if (history) history.scrollTo({ top: history.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => () => {
    chatAbortRef.current?.abort();
    ttsAbortRef.current?.abort();
    audioRef.current?.pause();
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const clearAudio = () => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = "";
    }
    setPlayingVoiceId(null);
  };

  const clearChat = () => {
    chatAbortRef.current?.abort();
    chatAbortRef.current = null;
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;
    clearAudio();
    setMessages([]);
    setDraft("");
    setError("");
    setSending(false);
    setGeneratingVoiceId(null);
  };

  useEffect(() => {
    window.addEventListener("apex:clear-chat", clearChat);
    return () => window.removeEventListener("apex:clear-chat", clearChat);
  }, []);

  const sendMessage = async (event) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    const userMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);
    setError("");
    const controller = new AbortController();
    chatAbortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: nextMessages.slice(-16).map(({ role, content }) => ({ role, content })),
          studyContext: { subject: selectedSubject, unit: selectedUnit }
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Chat request failed (${response.status}).`);
      const content = typeof payload.content === "string" ? payload.content : typeof payload.message === "string" ? payload.message : "";
      if (!content.trim()) throw new Error("The assistant returned an empty answer.");
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: content.trim(), model: payload.model }]);
    } catch (sendError) {
      if (!controller.signal.aborted) setError(sendError?.message || "Could not send that message. Please try again.");
    } finally {
      if (chatAbortRef.current === controller) {
        chatAbortRef.current = null;
        setSending(false);
      }
    }
  };

  const readAloud = async (message) => {
    if (playingVoiceId === message.id) {
      clearAudio();
      return;
    }
    clearAudio();
    ttsAbortRef.current?.abort();
    const controller = new AbortController();
    ttsAbortRef.current = controller;
    setGeneratingVoiceId(message.id);
    setError("");
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "audio/wav, application/json" },
        signal: controller.signal,
        body: JSON.stringify({ text: speechText(message.content) })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Read Aloud failed (${response.status}).`);
      }
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      const objectUrl = URL.createObjectURL(blob);
      const audio = new Audio(objectUrl);
      let playbackRate = 1;
      try {
        const savedRate = Number(window.localStorage.getItem("apex-tts-playback-rate"));
        if ([0.75, 1, 1.25].includes(savedRate)) playbackRate = savedRate;
      } catch {
        // Keep the default playback rate if browser storage is unavailable.
      }
      audio.defaultPlaybackRate = playbackRate;
      audio.playbackRate = playbackRate;
      audioUrlRef.current = objectUrl;
      audioRef.current = audio;
      audio.onended = () => {
        clearAudio();
      };
      await audio.play();
      setPlayingVoiceId(message.id);
    } catch (voiceError) {
      if (!controller.signal.aborted) {
        clearAudio();
        setError(voiceError?.message || "Could not generate speech. Please try again.");
      }
    } finally {
      if (ttsAbortRef.current === controller) {
        ttsAbortRef.current = null;
        setGeneratingVoiceId(null);
      }
    }
  };

  return (
    <section className="mx-auto flex h-[calc(100dvh-285px)] min-h-[420px] max-h-[760px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Study Copilot chat">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white"><Bot size={19} aria-hidden="true" /></span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Study Copilot</h2>
            <p className="text-[11px] text-slate-500">Ask a question or request a function plot</p>
          </div>
        </div>
        <p className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-600">
          {[selectedSubject, selectedUnit].filter(Boolean).join(" · ") || "All subjects and units"}
        </p>
      </header>

      <div ref={historyRef} className="flex-1 space-y-5 overflow-y-auto bg-slate-50/70 px-3 py-5 sm:px-6" aria-live="polite">
        {!messages.length && (
          <div className="mx-auto mt-12 max-w-md text-center">
            <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-100 text-indigo-700"><Bot size={24} aria-hidden="true" /></span>
            <h3 className="text-lg font-bold text-slate-900">What would you like to study?</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Ask for an explanation, plot a function, or request a scientific diagram.</p>
          </div>
        )}
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <article key={message.id} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`min-w-0 max-w-[92%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[82%] ${isUser ? "rounded-br-md bg-indigo-600 text-white" : "rounded-bl-md border border-slate-200 bg-white"}`}>
                {!isUser && (
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-600">APEX Tutor</span>
                    <button
                      type="button"
                      onClick={() => readAloud(message)}
                      disabled={generatingVoiceId !== null}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 disabled:cursor-wait disabled:opacity-70"
                      aria-label={generatingVoiceId === message.id ? "Generating voice" : playingVoiceId === message.id ? "Stop read aloud" : "Read answer aloud"}
                    >
                      <Volume2 size={13} aria-hidden="true" />
                      {generatingVoiceId === message.id ? "Generating voice..." : playingVoiceId === message.id ? "Stop audio" : "Read Aloud"}
                    </button>
                  </div>
                )}
                {isUser ? (
                  <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white">{message.content}</p>
                ) : (
                  <MessageContent content={message.content} />
                )}
                {!isUser && message.model && <p className="mt-3 text-[10px] text-slate-400">{message.model}</p>}
              </div>
            </article>
          );
        })}
        {sending && (
          <div className="flex justify-start" role="status">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" /> Thinking…
            </div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-slate-200 bg-white p-3 sm:px-5 sm:py-4">
        {error && <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700" role="alert">{error}</p>}
        <form onSubmit={sendMessage} className="flex items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage(event);
              }
            }}
            rows={1}
            maxLength={4000}
            placeholder="Ask a question or request a graph…"
            aria-label="Message the Study Copilot"
            className="max-h-32 min-h-10 min-w-0 flex-1 resize-y bg-transparent px-2 py-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button type="submit" disabled={!draft.trim() || sending} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message">
            <Send size={17} aria-hidden="true" />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-slate-400">Part 2 · AI replies use the server-side provider key</p>
      </div>
    </section>
  );
}
