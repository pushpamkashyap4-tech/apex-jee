import { Fragment, jsxDEV } from "react/jsx-dev-runtime";
import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, Menu, MoreHorizontal, Plus, Sparkles, Trash2, X, Send, FileText, Volume2, Play, Square } from "lucide-react";
import MathMarkdown from "./math-markdown.js";
import { ImageFullView, readImageDataUrl } from "./image-viewer.js";
import { STUDY_FIGURES, findRelevantStudyFigures } from "./figure-library.js";
import { AI_MODEL, geminiGenerate, groqChat, groqSpeech, groqTranscribe, resolveAIModel, resolveSpeechModel } from "./ai.js";
import { JEE_DIAGRAMS, findLocalDiagramKey } from "./lib/jee-diagrams.js";
import AssistantVisual from "./assistant-visual-renderer.js";
import { extractAssistantVisualBlocks, hasAssistantVisualIntent, inferAssistantVisualType } from "./lib/assistant-visuals.js";
const THREAD_KEY = "apexjee-copilot-threads-v1";
const ACTIVE_THREAD_KEY = "apexjee-copilot-active-thread-v1";
function readThreads() {
  try {
    const saved = JSON.parse(localStorage.getItem(THREAD_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}
function rateLimitMessage({ attempt, maxRetries, delayMs }) {
  const seconds = Math.max(1, Math.ceil(delayMs / 1e3));
  const wait = seconds >= 3600 ? `${Math.ceil(seconds / 3600)} hr` : seconds >= 60 ? `${Math.ceil(seconds / 60)} min` : `${seconds} sec`;
  return `Groq rate limit \xB7 retry ${attempt}/${maxRetries} in ${wait}`;
}
function summarizeLimitError(error) {
  const message = String(error?.message || error || "");
  const metric = message.match(/tokens per minute\s*\(TPM\)|tokens per day\s*\(TPD\)|requests per minute\s*\(RPM\)|requests per day\s*\(RPD\)/i)?.[0];
  const limit = Number(message.match(/\bLimit\s+([\d,]+)/i)?.[1]?.replace(/,/g, ""));
  const requested = Number(message.match(/\bRequested\s+([\d,]+)/i)?.[1]?.replace(/,/g, ""));
  if (!metric || !limit || !requested) return "";

  const code = metric.match(/\((TPM|TPD|RPM|RPD)\)/i)?.[1].toUpperCase();
  const used = Number(message.match(/\bUsed\s+([\d,]+)/i)?.[1]?.replace(/,/g, "") || 0);
  const over = Math.max(0, used + requested - limit);
  const daily = code === "TPD" || code === "RPD";
  const now = new Date();
  const retryText = message.match(/(?:try again in|retry after)\s+((?:[\d.]+\s*(?:milliseconds?|ms|seconds?|secs?|s|minutes?|mins?|min|m|hours?|hrs?|h)\s*)+)/i)?.[1] || "";
  const retryParts = [...retryText.matchAll(/([\d.]+)\s*(milliseconds?|ms|seconds?|secs?|s|minutes?|mins?|min|m|hours?|hrs?|h)/gi)];
  let retryMs = 0;
  for (const part of retryParts) {
    const unit = part[2].toLowerCase();
    const multiplier = unit.startsWith("ms") || unit.startsWith("millisecond") ? 1 : unit.startsWith("m") ? 60000 : unit.startsWith("h") ? 3600000 : 1000;
    retryMs += Number(part[1]) * multiplier;
  }
  const resetAt = retryMs
    ? new Date(now.getTime() + retryMs)
    : daily
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1);
  const seconds = Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));
  const wait = seconds < 60 ? seconds + "s" : Math.ceil(seconds / 60) + " min";
  const time = resetAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const unit = code.startsWith("T") ? "tokens" : "requests";
  return code + " limit reached: " + requested.toLocaleString() + " / " + limit.toLocaleString() + " " + unit + "/" + (daily ? "day" : "min") + (over ? " (" + over.toLocaleString() + " over)" : "") + " · resets in " + wait + " at " + time;
}
function isGroqQuotaLimit(error) {
  return /rate limit|cooling down|token safety budget|tokens per minute|tokens per day|requests per minute|requests per day/i.test(String(error?.message || error || ""));
}
const ASSISTANT_RULES = `You are the core AI assistant for APEX JEE, a premium JEE Main and Advanced preparation app. Give highly accurate, concise answers with clear, polished formatting. Answer the latest question directly, using earlier chat only when relevant. For a JEE problem, present the governing formula first, explain its variables when useful, and solve step by step. Avoid filler.

MATH FORMATTING: Typeset every mathematical expression with standard LaTeX delimiters: $...$ inline and $$...$$ on separate lines for important/display equations. Use LaTeX commands for all scripts and symbols, including \\frac{a+b}{c+d}, x_{abc}, x^{abcdefghij}, \\sqrt{...}, \\int_{a}^{b}, \\sum_{i=1}^{n}, \\prod, \\pi, and \\sigma. Scripts may contain any English letters and digits; use braces around the complete subscript or superscript so every character is included. Use \\dfrac or \\frac for stacked fractions, never slash notation for complex fractions. Put the complete radicand inside braces so the root bar extends across the entire expression. Use \\displaystyle in inline math when a larger integral or sum with limits needs above/below limits. Preserve correct signs, grouping, units, and dimensions. Never leave raw LaTeX commands outside math delimiters.

For chemistry, use → for forward reactions and ⇌ for equilibrium. Put heat as Δ above the arrow or state it in readable reaction conditions, such as A + B —(Δ)→ C. Use lowercase state labels (s), (l), (g), and (aq). Use —, =, and ≡ for single, double, and triple bonds. Put isotope mass numbers in superscript and atomic numbers in subscript before the element, such as ¹²₆C and ²³⁵₉₂U. Preserve correct reaction conditions, signs, units, stoichiometry, and state labels.

Use clean Markdown tables for comparisons and Markdown lists for steps, properties, and trends. Bold key laws, formulas, and final answers. Standard prose should remain readable paragraphs. For factual or current claims, use browser search when available. Never expose internal search markers or invent citations; use ordinary Markdown links when reliable source URLs are available.

VISUAL OUTPUT: When the user explicitly asks for a graph, plot, chart, diagram, schematic, flowchart, mind map, labeled illustration, or infographic, answer normally and include one fenced block per requested graphic (at most three), each whose language is exactly apex-visual. The block must contain valid JSON only; never output raw SVG, HTML, Base64, image-generation markers, or a guessed image URL. The app renders this JSON locally as a crisp, downloadable SVG image.

Choose the requested visual type. Graph JSON shape: {"type":"graph","title":"...","description":"...","xLabel":"...","yLabel":"...","xMin":0,"xMax":10,"yMin":0,"yMax":10,"series":[{"label":"...","style":"line","points":[[0,0],[1,1],[2,4]],"segments":[[[0,0],[1,1]],[[2,4],[3,9]]]}],"annotations":[{"x":1,"y":1,"label":"..."}]}. Use style line for curves, scatter for unconnected measurements, and bar for bar charts. Include 12–48 numerically correct points for a smooth function, preserving important intercepts and turning points. For discontinuities or asymptotes, use separate segments arrays so branches do not connect. When exact data is supplied, plot those values only; do not invent measurements. Include units in axis labels and say when a curve is qualitative or schematic.

Diagram JSON shape: {"type":"diagram","title":"...","description":"...","nodes":[{"id":"a","label":"...","x":15,"y":50,"kind":"process","accent":"blue"},{"id":"b","label":"...","x":85,"y":50}],"edges":[{"from":"a","to":"b","label":"...","directed":true}]}. Place node x and y on a 0–100 canvas; use concise labels, correct arrow direction, and only factual connections. Infographic JSON shape: {"type":"infographic","title":"...","subtitle":"...","cards":[{"heading":"...","body":"...","accent":"teal"}],"footer":"..."}. Keep the graphic focused, accurate, and readable; use 2–8 short cards. If both an explanation and visual(s) are requested, put all visual blocks after the explanation. If up to three reference images are attached, use them as content/style guidance when relevant, but do not copy mistakes or pretend to create a photorealistic image. If no visual is requested, do not emit an apex-visual block.`;
function FigureGallery({ ids = [] }) {
  const figures = ids.map((id) => STUDY_FIGURES.find((figure) => figure.id === id)).filter(Boolean);
  if (!figures.length) return null;
  return React.createElement("div", { className: "assistant-figure-gallery", "aria-label": "Related study diagrams" }, figures.map((figure) => React.createElement(
    "figure",
    { className: "assistant-figure-card", key: figure.id },
    React.createElement(ImageFullView, { src: figure.src, alt: figure.title, loading: "lazy" }),
    React.createElement("figcaption", null, React.createElement("strong", null, figure.title), React.createElement("span", null, `${figure.subject} \xB7 handbook figure`))
  )));
}
function AssistantMessageContent({ message }) {
  const boundedBox = "border border-indigo-400/40 shadow-[0_0_12px_rgba(99,102,241,0.25)] bg-[#0B1120]/60 rounded-xl my-4 overflow-x-auto p-3";
  const tableComponents = {
    table: ({ children, ...props }) => React.createElement("div", { className: `assistant-table-scroll assistant-bounded-box ${boundedBox}` }, React.createElement("table", props, children)),
    pre: ({ children, ...props }) => React.createElement("div", { className: `assistant-code-scroll assistant-bounded-box ${boundedBox}` }, React.createElement("pre", props, children)),
    code: ({ children, className = "", ...props }) => React.createElement("code", { ...props, className: `assistant-markdown-code ${className}`.trim() }, children),
    div: ({ children, className = "", ...props }) => className.includes("math-display") || className.includes("katex-display")
      ? React.createElement("div", { className: `assistant-math-scroll assistant-bounded-box ${boundedBox}` }, React.createElement("div", { ...props, className }, children))
      : React.createElement("div", { ...props, className }, children),
    img: (props) => React.createElement(AssistantMarkdownImage, { ...props, boundedBox })
  };
  const markdown = (text, key) => text ? React.createElement(MathMarkdown, { key, legacy: true, components: tableComponents, children: text }) : null;
  const renderWithDiagramTags = (text, key) => {
    const chunks = String(text || "").split(/(<jee-[a-zA-Z0-9-]+\s*\/?>)/g);
    if (chunks.length === 1) return markdown(text, key);
    return React.createElement(React.Fragment, { key }, chunks.map((chunk, index) => {
      const match = chunk.match(/^<jee-([a-zA-Z0-9-]+)\s*\/?>$/);
      const src = match && JEE_DIAGRAMS[match[1]];
      return src
        ? React.createElement(AssistantMarkdownImage, { key: `${key}-diagram-${index}`, src, alt: match[1].replace(/^chem-/, "").replace(/-/g, " "), boundedBox })
        : markdown(chunk, `${key}-markdown-${index}`);
    }));
  };
  const renderWithVisualBlocks = (text, key) => {
    const blocks = extractAssistantVisualBlocks(text);
    if (!blocks.some((block) => block.type === "visual")) return renderWithDiagramTags(text, key);
    return React.createElement(React.Fragment, { key }, blocks.map((block, index) => {
      if (block.type === "visual") {
        return block.data
          ? React.createElement(AssistantVisual, { key: `${key}-visual-${index}`, data: block.data })
          : React.createElement("div", { key: `${key}-visual-error-${index}`, className: "assistant-visual-error", role: "status" }, "I couldn't render that visual. Ask me to redraw it as a graph, diagram, or infographic.");
      }
      return renderWithDiagramTags(block.text, `${key}-markdown-${index}`);
    }));
  };
  const visual = message.visual;
  return React.createElement(React.Fragment, null,
    visual ? renderWithVisualBlocks(visual.before, "before") : renderWithVisualBlocks(message.content, "body"),
    visual && React.createElement("figure", { className: visual.error ? "assistant-generated-figure has-error" : "assistant-generated-figure" },
      visual.url ? React.createElement(ImageFullView, { src: visual.url, alt: visual.explanation || "Educational illustration", loading: "lazy" }) : React.createElement("div", { className: "assistant-generated-placeholder", role: "status" }, "Image unavailable"),
      React.createElement("figcaption", null, visual.explanation)
    ),
    visual && renderWithVisualBlocks(visual.after, "after"),
    React.createElement(FigureGallery, { ids: message.figureIds })
  );
}
function AssistantMarkdownImage({ src, alt = "Study diagram", boundedBox, ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return React.createElement("div", { className: `assistant-image-scroll assistant-bounded-box ${boundedBox} ${loaded ? "is-loaded" : "is-loading"} ${failed ? "has-error" : ""}` },
    !loaded && !failed && React.createElement("div", { className: "assistant-image-skeleton", role: "status", "aria-label": `Loading ${alt}` }),
    failed && React.createElement("div", { className: "assistant-image-unavailable", role: "status" }, `${alt} is not available in the local diagram library.`),
    React.createElement(ImageFullView, {
      ...props,
      src,
      alt,
      loading: "lazy",
      className: `assistant-markdown-image ${loaded ? "is-loaded" : ""}`,
      style: failed ? { display: "none" } : props.style,
      onLoad: (event) => { props.onLoad?.(event); setLoaded(true); },
      onError: (event) => { props.onError?.(event); setFailed(true); }
    })
  );
}
function StudyCopilot({ messages = [], onChange, apiKey = "", geminiKeys = [], userName = "", onHome, modelPrefs }) {
  const [threads, setThreads] = useState(readThreads);
  const [threadId, setThreadId] = useState(() => localStorage.getItem(ACTIVE_THREAD_KEY) || null);
  const [chatMessages, setChatMessages] = useState(() => {
    const id = localStorage.getItem(ACTIVE_THREAD_KEY);
    const active = readThreads().find((thread) => thread.id === id);
    return active?.messages || messages || [];
  });
  const [sidebar, setSidebar] = useState(false);
  const [threadMenu, setThreadMenu] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [retryStatus, setRetryStatus] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [audioUrls, setAudioUrls] = useState({});
  const [speaking, setSpeaking] = useState(null);
  const [localNow, setLocalNow] = useState(() => new Date());
  const audioRefs = useRef({});
  const stopAudio = (id) => {
    const audio = audioRefs.current[id];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setSpeaking(null);
  };
  const fileInputRef = useRef(null);
  const listRef = useRef(null);
  useEffect(() => {
    const timer = window.setInterval(() => setLocalNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [chatMessages, sending, retryStatus]);
  useEffect(() => {
    onChange?.(chatMessages);
  }, [chatMessages]);
  const persistThreads = (next) => {
    setThreads(next);
    try {
      localStorage.setItem(THREAD_KEY, JSON.stringify(next));
    } catch {
      setError("Could not save chat history on this device.");
    }
  };
  const saveThread = (id, items, title) => {
    const nextThread = { id, title: title || "New thread", messages: items, updatedAt: Date.now() };
    persistThreads([nextThread, ...threads.filter((item) => item.id !== id)].slice(0, 50));
  };
  const newThread = () => {
    setThreadId(null);
    localStorage.removeItem(ACTIVE_THREAD_KEY);
    setChatMessages([]);
    setDraft("");
    setError("");
    setSidebar(false);
    setThreadMenu(null);
  };
  const selectThread = (thread) => {
    setThreadId(thread.id);
    localStorage.setItem(ACTIVE_THREAD_KEY, thread.id);
    setChatMessages(thread.messages || []);
    setDraft("");
    setError("");
    setSidebar(false);
  };
  const removeThread = (id) => {
    persistThreads(threads.filter((thread) => thread.id !== id));
    if (threadId === id) newThread();
    setThreadMenu(null);
  };
  const readAttachment = async (file) => {
    if (file.size > 15 * 1024 * 1024) throw new Error(`${file.name} is larger than 15 MB.`);
    if (file.type === "application/pdf") {
      const pdfjs = await import("https://esm.sh/pdfjs-dist@4.4.168/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc = "https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs";
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
      const pages = [];
      for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 35); pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(content.items.map((item) => item.str).join(" "));
      }
      return { name: file.name, type: "application/pdf", text: pages.join("\n").slice(0, 8e3) };
    }
    if (file.type.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|webm)$/i.test(file.name)) {
      const transcript = await groqTranscribe(apiKey, file, modelPrefs?.transcription || "whisper-large-v3-turbo", { onRateLimitRetry: (status) => setRetryStatus(rateLimitMessage(status)) });
      return { name: file.name, type: "audio/transcript", transcript, text: transcript };
    }
    if (!file.type.startsWith("image/")) throw new Error("Choose a photo, PDF, or audio recording.");
    const data = await readImageDataUrl(file, 1200, 0.72);
    return { name: file.name, type: "image/jpeg", data };
  };
  const addAttachments = async (files) => {
    setError("");
    setRetryStatus("");
    try {
      const next = [];
      for (const file of files) next.push(await readAttachment(file));
      const combined = [...attachments, ...next].slice(0, 5);
      if (combined.filter((item) => item.data).length > 3) {
        setError("Attach up to three images per message.");
        return;
      }
      setAttachments(combined);
    } catch (e) {
      setError(summarizeLimitError(e) || e.message || "Could not attach that file.");
    } finally {
      setRetryStatus("");
    }
  };
  const send = async (event) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text && !attachments.length || sending) return;
    const promptText = text || "Please analyze the attached file.";
    const attachmentText = attachments.map((item) => item.type === "application/pdf" ? `

PDF ${item.name}:
${item.text}` : item.transcript ? `

Audio transcript (${item.name}):
${item.transcript}` : `
[Image attached: ${item.name}]`).join("");
    const user = { id: crypto.randomUUID(), role: "user", content: `${promptText}${attachmentText}`, attachments };
    const current = [...chatMessages, user].slice(-50);
    const id = threadId || crypto.randomUUID();
    const title = threads.find((thread) => thread.id === id)?.title || promptText.replace(/\s+/g, " ").slice(0, 56);
    setThreadId(id);
    localStorage.setItem(ACTIVE_THREAD_KEY, id);
    setChatMessages(current);
    saveThread(id, current, title);
    setDraft("");
    setAttachments([]);
    setSending(true);
    setError("");
    setRetryStatus("");
    try {
      const history = current.slice(-8).map((message) => {
        const content = String(message.content || "");
        const boundedText = message.id === user.id ? content.slice(-9e3) : content.slice(-1100);
        return { role: message.role, content: message.id === user.id && message.attachments?.some((file) => file.data) ? [{ type: "text", text: boundedText }, ...message.attachments.filter((file) => file.data).slice(0, 3).map((file) => ({ type: "image_url", image_url: { url: file.data } }))] : boundedText };
      });
      const hasImages = Boolean(user.attachments?.some((file) => file.data));
      const requestText = String(user.content).toLowerCase();
      const requestedLocalKey = findLocalDiagramKey(promptText);
      const localVisualRequest = Boolean(requestedLocalKey && /\b(draw|show|create|make|generate|provide|give|diagram|graph|image|picture|visual|structure|schematic|plot|chart|sketch|illustrat|infographic|flowchart)\b/i.test(promptText));
      const visualReferenceRequest = hasImages && /\b(draw|create|make|generate|produce|render|illustrate|visuali[sz]e|recreate|redraw)\b/i.test(promptText);
      const wantsVisual = hasAssistantVisualIntent(promptText) || localVisualRequest || visualReferenceRequest;
      const visualKind = inferAssistantVisualType(promptText);
      const needsSearch = /\b(latest|current|today|news|price|recent|source|cite|search|update|verify|verified|accurate data)\b/.test(requestText);
      const complexReasoning = /\b(prove|derive|solve|evaluate|calculate|why|explain|compare|step by step|mechanism)\b/.test(requestText) || /[=^√∫Σ]/.test(requestText);
      const model = resolveAIModel("assistant", modelPrefs, { hasImages, needsSearch, complexReasoning });
      const visualInstruction = wantsVisual
        ? `\n\nThis turn requires locally rendered visual(s), starting with a ${visualKind}. Include one fenced block for each graphic the user explicitly requested (up to three), opened with \`\`\`apex-visual and closed with \`\`\`; put valid JSON only inside each. Use the matching schema from VISUAL OUTPUT. Do not satisfy this request with a web image, Markdown image, URL, or unsupported custom tag.${hasImages ? " The attached image(s) are the user's visual/content references; use them to guide the requested result." : ""}${requestedLocalKey ? ` The topic is ${requestedLocalKey.replace(/^chem-/, "").replace(/-/g, " ")}.` : ""}`
        : "";
      const requestMessages = [{ role: "system", content: ASSISTANT_RULES + visualInstruction }, ...history];
      let responseModel = model;
      let answer;
      if (hasImages) {
        responseModel = "gemini-3.5-flash";
        answer = await geminiGenerate(geminiKeys, requestMessages, { model: responseModel, googleSearch: needsSearch });
      } else {
        try {
          answer = await groqChat(apiKey, requestMessages, { browserSearch: needsSearch, model, maxCompletionTokens: wantsVisual ? 3200 : undefined, onRateLimitRetry: (status) => setRetryStatus(rateLimitMessage(status)) });
        } catch (error) {
          const hasGeminiKey = (Array.isArray(geminiKeys) ? geminiKeys : [geminiKeys]).some((entry) => Boolean((typeof entry === "string" ? entry : entry?.key)?.trim()));
          if (!hasGeminiKey || !isGroqQuotaLimit(error)) throw error;
          setRetryStatus("Groq token safety threshold reached · switching to Google AI");
          responseModel = "gemini-3.5-flash";
          answer = await geminiGenerate(geminiKeys, requestMessages, { model: responseModel, googleSearch: needsSearch });
        }
      }
      const figureIds = findRelevantStudyFigures(promptText, 2);
      const next = [...current, { id: crypto.randomUUID(), role: "assistant", content: answer, model: responseModel, figureIds }].slice(-50);
      setChatMessages(next);
      saveThread(id, next, title);
    } catch (e) {
      setError(summarizeLimitError(e) || e.message || "The AI request failed. Check your provider API key in Settings and try again.");
    } finally {
      setSending(false);
      setRetryStatus("");
    }
  };
  const speakAnswer = async (message) => {
    if (audioUrls[message.id]) {
      const audio = audioRefs.current[message.id];
      if (audio) {
        if (speaking === message.id) {
          audio.pause();
          setSpeaking(null);
        } else {
          Object.values(audioRefs.current).forEach((item) => item?.pause());
          audio.play();
          setSpeaking(message.id);
        }
      }
      return;
    }
    if (speaking) return;
    setSpeaking(message.id);
    setError("");
    setRetryStatus("");
    try {
      const speechModel = resolveSpeechModel(modelPrefs?.speech, message.content);
      const url = await groqSpeech(apiKey, message.content, speechModel, { onRateLimitRetry: (status) => setRetryStatus(rateLimitMessage(status)) });
      setAudioUrls((current) => ({ ...current, [message.id]: url }));
    } catch (e) {
      setError(summarizeLimitError(e) || e.message || "Could not create spoken audio.");
    } finally {
      setSpeaking(null);
      setRetryStatus("");
    }
  };
  const greetingName = userName?.trim() ? `, ${userName.trim()}` : "";
  const greetingHour = localNow.getHours();
  const greetingMinute = localNow.getMinutes();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 17 || greetingHour === 17 && greetingMinute < 30 ? "Good afternoon" : "Good evening";
  const limitStatus = error.includes(" limit reached: ");
  return /* @__PURE__ */ jsxDEV("section", { className: "assistant-page", "aria-label": "AI Assistant", children: [
    /* @__PURE__ */ jsxDEV("header", { className: "assistant-topbar", children: [
      /* @__PURE__ */ jsxDEV("button", { className: "assistant-icon-button", onClick: () => setSidebar(true), "aria-label": "Open chat threads", children: /* @__PURE__ */ jsxDEV(Menu, { size: 21 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 179,
        columnNumber: 113
      }, this) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 179,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "assistant-brand", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "assistant-brand-mark", children: /* @__PURE__ */ jsxDEV(Sparkles, { size: 17 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 180,
          columnNumber: 79
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 180,
          columnNumber: 40
        }, this),
        /* @__PURE__ */ jsxDEV("strong", { children: "Apex Assistant" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 180,
          columnNumber: 107
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 180,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "assistant-top-actions", children: [
        /* @__PURE__ */ jsxDEV("button", { className: "assistant-new-top", onClick: newThread, children: [
          /* @__PURE__ */ jsxDEV(Plus, { size: 16 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 181,
            columnNumber: 104
          }, this),
          /* @__PURE__ */ jsxDEV("span", { children: "New chat" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 181,
            columnNumber: 121
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 181,
          columnNumber: 46
        }, this),
        /* @__PURE__ */ jsxDEV("button", { className: "assistant-icon-button assistant-exit", onClick: onHome, "aria-label": "Close assistant", children: /* @__PURE__ */ jsxDEV(X, { size: 19 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 181,
          columnNumber: 254
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 181,
          columnNumber: 151
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 181,
        columnNumber: 7
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 178,
      columnNumber: 5
    }, this),
    sidebar && /* @__PURE__ */ jsxDEV(Fragment, { children: [
      /* @__PURE__ */ jsxDEV("button", { className: "assistant-sidebar-backdrop", "aria-label": "Close chat threads", onClick: () => setSidebar(false) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 184,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDEV("aside", { className: "assistant-sidebar", "aria-label": "Chat history", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "assistant-sidebar-head", children: [
          /* @__PURE__ */ jsxDEV("strong", { children: "Chats" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 186,
            columnNumber: 49
          }, this),
          /* @__PURE__ */ jsxDEV("button", { className: "assistant-icon-button", "aria-label": "Close threads", onClick: () => setSidebar(false), children: /* @__PURE__ */ jsxDEV(X, { size: 18 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 186,
            columnNumber: 174
          }, this) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 186,
            columnNumber: 71
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 186,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("button", { className: "assistant-new-thread", onClick: newThread, children: [
          /* @__PURE__ */ jsxDEV(Plus, { size: 16 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 187,
            columnNumber: 70
          }, this),
          " New thread"
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 187,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "assistant-thread-list", children: [
          threads.map((thread) => /* @__PURE__ */ jsxDEV("div", { className: `assistant-thread-row ${thread.id === threadId ? "active" : ""}`, children: [
            /* @__PURE__ */ jsxDEV("button", { className: "assistant-thread-select", onClick: () => selectThread(thread), title: thread.title, children: thread.title || "New thread" }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 190,
              columnNumber: 13
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "assistant-thread-actions", children: [
              /* @__PURE__ */ jsxDEV("button", { className: "assistant-icon-button", "aria-label": `Options for ${thread.title}`, onClick: () => setThreadMenu(threadMenu === thread.id ? null : thread.id), children: /* @__PURE__ */ jsxDEV(MoreHorizontal, { size: 17 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 191,
                columnNumber: 215
              }, this) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 191,
                columnNumber: 55
              }, this),
              threadMenu === thread.id && /* @__PURE__ */ jsxDEV("button", { className: "assistant-delete-thread", onClick: () => removeThread(thread.id), children: [
                /* @__PURE__ */ jsxDEV(Trash2, { size: 14 }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 192,
                  columnNumber: 128
                }, this),
                "Delete"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 192,
                columnNumber: 44
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 191,
              columnNumber: 13
            }, this)
          ] }, thread.id, true, {
            fileName: "<stdin>",
            lineNumber: 189,
            columnNumber: 36
          }, this)),
          !threads.length && /* @__PURE__ */ jsxDEV("p", { className: "assistant-empty-history", children: "Your conversations will appear here." }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 195,
            columnNumber: 31
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 188,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("button", { className: "assistant-back-home", onClick: () => {
          setSidebar(false);
          onHome?.();
        }, children: "\u2190 Back to study home" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 197,
          columnNumber: 9
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 185,
        columnNumber: 7
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 183,
      columnNumber: 17
    }, this),
    !chatMessages.length ? /* @__PURE__ */ jsxDEV("main", { className: "assistant-landing", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "assistant-welcome-mark", children: /* @__PURE__ */ jsxDEV(Sparkles, { size: 25 }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 201,
        columnNumber: 47
      }, this) }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 201,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDEV("h1", { children: [
        greeting,
        greetingName,
        ".",
        /* @__PURE__ */ jsxDEV("br", {}, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 202,
          columnNumber: 38
        }, this),
        /* @__PURE__ */ jsxDEV("span", { children: "What\u2019s on your mind?" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 202,
          columnNumber: 43
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 202,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ jsxDEV("p", { children: "Ask a question, request a graph or diagram, or attach up to three reference images." }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 203,
        columnNumber: 7
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 200,
      columnNumber: 29
    }, this) : /* @__PURE__ */ jsxDEV("main", { className: "assistant-conversation", ref: listRef, children: [
      chatMessages.map((message) => message.role === "user" ? /* @__PURE__ */ jsxDEV("div", { className: "assistant-user-row", children: /* @__PURE__ */ jsxDEV("div", { className: "assistant-user-bubble", children: [
        /* @__PURE__ */ jsxDEV("span", { children: String(message.content).split("\n\nPDF ")[0].replace(/\n\[Image attached: [^\]]+\]/g, "") }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 205,
          columnNumber: 156
        }, this),
        message.attachments?.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "assistant-attachment-preview", children: message.attachments.map((file, index) => file.data ? /* @__PURE__ */ jsxDEV(ImageFullView, { src: file.data, alt: file.name }, index, false, {
          fileName: "<stdin>",
          lineNumber: 205,
          columnNumber: 386
        }, this) : /* @__PURE__ */ jsxDEV("span", { children: [
          /* @__PURE__ */ jsxDEV(FileText, { size: 14 }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 205,
            columnNumber: 455
          }, this),
          file.name
        ] }, index, true, {
          fileName: "<stdin>",
          lineNumber: 205,
          columnNumber: 437
        }, this)) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 205,
          columnNumber: 291
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 205,
        columnNumber: 117
      }, this) }, message.id, false, {
        fileName: "<stdin>",
        lineNumber: 205,
        columnNumber: 64
      }, this) : /* @__PURE__ */ jsxDEV("article", { className: "assistant-answer", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "assistant-answer-mark", children: /* @__PURE__ */ jsxDEV(Sparkles, { size: 15 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 206,
          columnNumber: 48
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 206,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "assistant-answer-body", children: [
          /* @__PURE__ */ jsxDEV("div", { className: `assistant-answer-tools ${audioUrls[message.id] ? "audio-ready" : ""}`, children: [
            /* @__PURE__ */ jsxDEV("span", { className: "assistant-model-used", children: message.model || AI_MODEL }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 207,
              columnNumber: 136
            }, this),
            /* @__PURE__ */ jsxDEV("button", { className: "assistant-speak", onClick: () => speakAnswer(message), "aria-label": audioUrls[message.id] ? speaking === message.id ? "Pause read aloud" : "Play read aloud" : "Read answer aloud", children: [
              /* @__PURE__ */ jsxDEV(Play, { size: 14 }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 207,
                columnNumber: 394
              }, this),
              audioUrls[message.id] ? speaking === message.id ? "Pause" : "Play audio" : speaking === message.id ? "Creating audio\u2026" : "Read aloud"
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 207,
              columnNumber: 207
            }, this),
            audioUrls[message.id] && /* @__PURE__ */ jsxDEV(Fragment, { children: [
              /* @__PURE__ */ jsxDEV("button", { className: "assistant-speak assistant-stop", onClick: () => stopAudio(message.id), "aria-label": "Stop read aloud", children: [
                /* @__PURE__ */ jsxDEV(Square, { size: 12, fill: "currentColor" }, void 0, false, {
                  fileName: "<stdin>",
                  lineNumber: 207,
                  columnNumber: 685
                }, this),
                " Stop"
              ] }, void 0, true, {
                fileName: "<stdin>",
                lineNumber: 207,
                columnNumber: 569
              }, this),
              /* @__PURE__ */ jsxDEV("audio", { ref: (node) => audioRefs.current[message.id] = node, className: "assistant-audio-hidden", src: audioUrls[message.id], onEnded: () => setSpeaking(null), onPause: () => setSpeaking((value) => value === message.id ? null : value) }, void 0, false, {
                fileName: "<stdin>",
                lineNumber: 207,
                columnNumber: 738
              }, this)
            ] }, void 0, true, {
              fileName: "<stdin>",
              lineNumber: 207,
              columnNumber: 567
            }, this)
          ] }, void 0, true, {
            fileName: "<stdin>",
            lineNumber: 207,
            columnNumber: 48
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "assistant-markdown", children: React.createElement(AssistantMessageContent, { message }) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 208,
            columnNumber: 9
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 207,
          columnNumber: 9
        }, this)
      ] }, message.id, true, {
        fileName: "<stdin>",
        lineNumber: 205,
        columnNumber: 518
      }, this)),
      sending && /* @__PURE__ */ jsxDEV("div", { className: "assistant-thinking", children: [
        /* @__PURE__ */ jsxDEV("span", {}, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 210,
          columnNumber: 55
        }, this),
        retryStatus || "Thinking\u2026"
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 210,
        columnNumber: 19
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 204,
      columnNumber: 15
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: `assistant-composer-wrap ${chatMessages.length ? "has-chat" : ""}`, children: [
      error && /* @__PURE__ */ jsxDEV("p", { className: limitStatus ? "assistant-error assistant-limit-status" : "assistant-error", role: limitStatus ? "status" : "alert", children: error }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 213,
        columnNumber: 17
      }, this),
      retryStatus && !sending && /* @__PURE__ */ jsxDEV("p", { className: "assistant-retry-status", role: "status", children: retryStatus }, void 0, false, {
        fileName: "<stdin>",
        lineNumber: 213,
        columnNumber: 97
      }, this),
      /* @__PURE__ */ jsxDEV("form", { className: "assistant-composer", onSubmit: send, children: [
        /* @__PURE__ */ jsxDEV("input", { ref: fileInputRef, className: "assistant-file-input", type: "file", accept: "image/*,.pdf,application/pdf", multiple: true, onChange: (event) => {
          addAttachments(Array.from(event.target.files || []));
          event.target.value = "";
        }, "aria-label": "Attach images or PDF files" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 215,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("button", { type: "button", className: "assistant-attach", onClick: () => fileInputRef.current?.click(), "aria-label": "Attach images or PDF files", children: /* @__PURE__ */ jsxDEV(Plus, { size: 20 }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 216,
          columnNumber: 144
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 216,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "assistant-compose-content", children: [
          attachments.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "assistant-pending-files", children: attachments.map((file, index) => /* @__PURE__ */ jsxDEV("span", { children: [
            file.type.startsWith("image/") ? /* @__PURE__ */ jsxDEV(ImageFullView, { src: file.data, alt: file.name }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 217,
              columnNumber: 215
            }, this) : /* @__PURE__ */ jsxDEV(FileText, { size: 13 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 217,
              columnNumber: 245
            }, this),
            /* @__PURE__ */ jsxDEV("small", { children: file.name }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 217,
              columnNumber: 267
            }, this),
            /* @__PURE__ */ jsxDEV("button", { type: "button", "aria-label": `Remove ${file.name}`, onClick: () => setAttachments((items) => items.filter((_, i) => i !== index)), children: /* @__PURE__ */ jsxDEV(X, { size: 12 }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 217,
              columnNumber: 418
            }, this) }, void 0, false, {
              fileName: "<stdin>",
              lineNumber: 217,
              columnNumber: 293
            }, this)
          ] }, `${file.name}-${index}`, true, {
            fileName: "<stdin>",
            lineNumber: 217,
            columnNumber: 147
          }, this)) }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 217,
            columnNumber: 75
          }, this),
          /* @__PURE__ */ jsxDEV("textarea", { value: draft, onChange: (event) => setDraft(event.target.value), onKeyDown: (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send(event);
            }
          }, placeholder: "Ask Apex assistant", rows: 1, "aria-label": "Ask Apex assistant" }, void 0, false, {
            fileName: "<stdin>",
            lineNumber: 218,
            columnNumber: 11
          }, this)
        ] }, void 0, true, {
          fileName: "<stdin>",
          lineNumber: 217,
          columnNumber: 9
        }, this),
        /* @__PURE__ */ jsxDEV("button", { className: "assistant-send", disabled: !draft.trim() && !attachments.length || sending, "aria-label": "Send message", children: /* @__PURE__ */ jsxDEV(Send, { size: 17, fill: "currentColor" }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 220,
          columnNumber: 129
        }, this) }, void 0, false, {
          fileName: "<stdin>",
          lineNumber: 220,
          columnNumber: 9
        }, this)
      ] }, void 0, true, {
        fileName: "<stdin>",
        lineNumber: 214,
        columnNumber: 7
      }, this)
    ] }, void 0, true, {
      fileName: "<stdin>",
      lineNumber: 212,
      columnNumber: 5
    }, this)
  ] }, void 0, true, {
    fileName: "<stdin>",
    lineNumber: 177,
    columnNumber: 10
  }, this);
}
export {
  StudyCopilot as default
};
