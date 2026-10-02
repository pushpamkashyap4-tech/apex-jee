export const AI_MODEL = "openai/gpt-oss-120b";

export const AI_MODELS = [
  { id: "qwen/qwen3.8-27b", label: "Qwen 3.8 27B", kind: "chat", tags: ["reasoning", "vision", "JSON"] },
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", kind: "chat", tags: ["reasoning", "browser search", "JSON"] },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B", kind: "chat", tags: ["fast", "browser search", "JSON"] },
  { id: "openai/gpt-oss-safeguard-20b", label: "GPT-OSS Safeguard 20B", kind: "safety", tags: ["safety classification"] },
  { id: "meta-llama/llama-prompt-guard-2-22m", label: "Llama Prompt Guard 2 22M", kind: "safety", tags: ["prompt-injection screening"] },
  { id: "meta-llama/llama-prompt-guard-2-86m", label: "Llama Prompt Guard 2 86M", kind: "safety", tags: ["prompt-injection screening"] },
  { id: "whisper-large-v3", label: "Whisper Large V3", kind: "transcription", tags: ["audio transcription"] },
  { id: "whisper-large-v3-turbo", label: "Whisper Large V3 Turbo", kind: "transcription", tags: ["fast audio transcription"] },
  { id: "canopylabs/orpheus-v1-english", label: "Orpheus V1 English", kind: "speech", tags: ["English speech"] },
  { id: "canopylabs/orpheus-arabic-saudi", label: "Orpheus Arabic Saudi", kind: "speech", tags: ["Arabic speech"] }
];

export const CHAT_MODELS = AI_MODELS.filter((model) => model.kind === "chat");
export const SPEECH_MODELS = AI_MODELS.filter((model) => model.kind === "speech");
export function resolveSpeechModel(preference, text = "") {
  if (SPEECH_MODELS.some((model) => model.id === preference)) return preference;
  return /[\u0600-\u06FF]/.test(text) ? "canopylabs/orpheus-arabic-saudi" : "canopylabs/orpheus-v1-english";
}
export const DEFAULT_MODEL_PREFERENCES = { assistant: "auto", planning: "auto", recall: "auto", transcription: "whisper-large-v3-turbo", speech: "auto" };

const ASSISTANT_MODEL_POOLS = {
  search: ["openai/gpt-oss-120b", "openai/gpt-oss-20b"],
  reasoning: ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"],
  general: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
};
function nextAssistantModel(category, preference) {
  const pool = ASSISTANT_MODEL_POOLS[category];
  return preference && preference !== "auto" && pool.includes(preference) ? preference : pool[0];
}

export function resolveAIModel(task, preferences = {}, context = {}) {
  const selected = preferences?.[task];
  if (task === "recall") return "gemini-3.5-flash";
  if (task === "assistant" && context.hasImages) return "gemini-3.5-flash";
  if (task === "assistant") {
    const category = context.needsSearch ? "search" : context.complexReasoning ? "reasoning" : "general";
    return nextAssistantModel(category, selected);
  }
  if (selected && selected !== "auto" && CHAT_MODELS.some((model) => model.id === selected)) return selected;
  if (task === "planning") return "openai/gpt-oss-120b";
  return AI_MODEL;
}

const QUOTA_STORAGE_KEY = "apex-ai-quota-v1";
const keyRotors = new Map();
const quotaLimits = {
  // Conservative local thresholds leave headroom for provider TPM/TPD limits.
  groq: { tpm: 4800, tpd: 120000, windowMs: 86400000 },
  // Gemini quotas vary by project/tier and Google does not publish one universal free-tier cap.
  // This conservative local estimate is only a rotation threshold, not a statement of account quota.
  gemini: { tpm: 6000, tpd: 150000, windowMs: 86400000 }
};
function readQuotaLedger() {
  try { return JSON.parse(localStorage.getItem(QUOTA_STORAGE_KEY) || "{}"); } catch { return {}; }
}
function writeQuotaLedger(ledger) {
  try { localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(ledger)); } catch {}
}
function keyRows(keys, provider) {
  const rows = (Array.isArray(keys) ? keys : [keys]).map((item, index) => ({
    id: String(item?.id || `${provider}-${index + 1}`),
    key: typeof item === "string" ? item : item?.key
  })).filter((row) => typeof row.key === "string" && row.key.trim());
  if (!rows.length) throw new Error("Add API keys in Settings to use this feature.");
  return rows;
}
function quotaKey(provider, row) { return `${provider}:${row.id}`; }
function selectApiKey(keys, provider, estimatedTokens = 0) {
  const rows = keyRows(keys, provider);
  const ledger = readQuotaLedger();
  const now = Date.now();
  const start = keyRotors.get(provider) || 0;
  const limits = quotaLimits[provider];
  const aggregateId = `${provider}:aggregate`;
  const aggregate = ledger[aggregateId] || { usage: [], cooldownUntil: 0 };
  aggregate.usage = (aggregate.usage || []).filter((entry) => now - entry.at < limits.windowMs);
  ledger[aggregateId] = aggregate;
  const aggregateMinute = aggregate.usage.filter((entry) => now - entry.at < 60000).reduce((sum, entry) => sum + entry.tokens, 0);
  const aggregateDay = aggregate.usage.reduce((sum, entry) => sum + entry.tokens, 0);
  let selected = null;
  let earliest = Infinity;
  for (let offset = 0; offset < rows.length; offset += 1) {
    const index = (start + offset) % rows.length;
    const row = rows[index];
    const id = quotaKey(provider, row);
    const state = ledger[id] || { usage: [], cooldownUntil: 0 };
    state.usage = (state.usage || []).filter((entry) => now - entry.at < limits.windowMs);
    const minuteUsed = state.usage.filter((entry) => now - entry.at < 60000).reduce((sum, entry) => sum + entry.tokens, 0);
    const dayUsed = state.usage.reduce((sum, entry) => sum + entry.tokens, 0);
    const cooldown = Number(state.cooldownUntil || 0);
    ledger[id] = state;
    const available = cooldown <= now && minuteUsed + estimatedTokens < limits.tpm && dayUsed + estimatedTokens < limits.tpd && aggregateMinute + estimatedTokens < limits.tpm && aggregateDay + estimatedTokens < limits.tpd;
    if (available) { selected = { row, index, id, state, aggregate }; break; }
    const nextAt = cooldown > now ? cooldown : aggregateMinute + estimatedTokens >= limits.tpm || minuteUsed + estimatedTokens >= limits.tpm ? now + (60000 - (now % 60000)) : now + (limits.windowMs - (now % limits.windowMs));
    earliest = Math.min(earliest, nextAt);
  }
  if (!selected) {
    // Keep service usable if local estimates are pessimistic; the provider remains authoritative.
    const index = start % rows.length;
    const row = rows[index];
    selected = { row, index, id: quotaKey(provider, row), state: ledger[quotaKey(provider, row)] || { usage: [], cooldownUntil: 0 }, aggregate };
    selected.waitUntil = earliest;
    selected.coolingOnly = rows.every((entry) => Number(ledger[quotaKey(provider, entry)]?.cooldownUntil || 0) > now);
    selected.quotaLimitedOnly = !selected.coolingOnly;
  }
  selected.usageEntry = { at: now, tokens: Math.max(1, estimatedTokens), pending: true };
  selected.aggregateEntry = { ...selected.usageEntry };
  selected.state.usage.push(selected.usageEntry);
  selected.aggregate.usage.push(selected.aggregateEntry);
  keyRotors.set(provider, (selected.index + 1) % rows.length);
  writeQuotaLedger(ledger);
  return { ...selected, key: selected.row.key.trim(), ledger };
}
async function finalizeKey(selected, tokens, response) {
  const usedTokens = Math.max(1, Number(tokens) || selected.usageEntry.tokens);
  selected.usageEntry.pending = false;
  selected.usageEntry.tokens = usedTokens;
  selected.aggregateEntry.pending = false;
  selected.aggregateEntry.tokens = usedTokens;
  if (response?.status === 429 || response?.status === 401) {
    const retry = response.headers?.get?.("retry-after");
    const delay = Number(retry);
    let bodyDelay = 0;
    if (response.status === 429) {
      try {
        const body = await response.clone().json();
        bodyDelay = body?.error?.details?.map((item) => item.retryDelay).find(Boolean) || 0;
      } catch {}
    }
    selected.state.cooldownUntil = Date.now() + (Number.isFinite(delay) && delay > 0 ? delay * 1000 : parseDurationMs(bodyDelay) || (response.status === 401 ? 3600000 : 30000));
    if (response.status === 429) selected.aggregate.cooldownUntil = selected.state.cooldownUntil;
  }
  selected.ledger[selected.id] = selected.state;
  selected.ledger[`${selected.id.split(":")[0]}:aggregate`] = selected.aggregate;
  writeQuotaLedger(selected.ledger);
}
export function getTokenQuotaEstimate(provider, id) {
  const limits = quotaLimits[provider === "groq" ? "groq" : "gemini"];
  const state = readQuotaLedger()[`${provider}:${id}`] || { usage: [] };
  const now = Date.now();
  const usage = (state.usage || []).filter((entry) => now - entry.at < limits.windowMs);
  return {
    tpm: usage.filter((entry) => now - entry.at < 60000).reduce((sum, entry) => sum + entry.tokens, 0),
    tpd: usage.reduce((sum, entry) => sum + entry.tokens, 0),
    tpmLimit: limits.tpm,
    tpdLimit: limits.tpd
  };
}
function roughTokenCount(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value || "");
  return Math.max(1, Math.ceil(text.length / 4));
}
async function fetchWithRotatingKeys(keys, provider, estimatedTokens, makeRequest, usageTokens, onRateLimitRetry) {
  const rows = keyRows(keys, provider);
  let lastResponse = null;
  let lastError = null;
  for (let attempt = 0; attempt < rows.length; attempt += 1) {
    const selected = selectApiKey(keys, provider, estimatedTokens);
    if (selected.coolingOnly) {
      const wait = Math.max(1, Math.ceil((selected.waitUntil - Date.now()) / 1000));
      throw new Error(`All saved ${provider === "groq" ? "Groq" : "Gemini"} keys are cooling down. Try again in about ${wait} seconds.`);
    }
    if (selected.quotaLimitedOnly) {
      const wait = Math.max(1, Math.ceil((selected.waitUntil - Date.now()) / 1000));
      throw new Error(`Estimated ${provider === "groq" ? "Groq" : "Gemini"} token safety budget reached. Try again in about ${wait} seconds.`);
    }
    try {
      const response = await makeRequest(selected.key);
      const payload = await response.clone().json().catch(() => ({}));
      await finalizeKey(selected, usageTokens?.(payload) || estimatedTokens, response);
      if (response.ok || ![401, 429, 500, 502, 503, 504].includes(response.status)) return response;
      if (response.status === 429) onRateLimitRetry?.({ attempt: attempt + 1, maxRetries: rows.length, delayMs: Math.max(0, selected.state.cooldownUntil - Date.now()) });
      lastResponse = response;
    } catch (error) { lastError = error; }
  }
  if (lastResponse) return lastResponse;
  throw lastError || new Error("Provider request failed. Try again.");
}

function parseDurationMs(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text) * 1000;
  const parts = [...text.matchAll(/(\d+(?:\.\d+)?)\s*(ms|s|m|h)/gi)];
  if (!parts.length) return null;
  return parts.reduce((total, part) => total + Number(part[1]) * ({ ms: 1, s: 1000, m: 60000, h: 3600000 }[part[2].toLowerCase()]), 0);
}

export async function groqChat(apiKey, messages, { json = false, jsonSchema, browserSearch = false, model = AI_MODEL, maxCompletionTokens, onRateLimitRetry } = {}) {
  const completionLimit = Math.max(256, Math.min(3200, Number(maxCompletionTokens) || (json || jsonSchema ? 2800 : browserSearch ? 2400 : 1800)));
  const estimatedTokens = roughTokenCount(messages) + Math.min(completionLimit, 1200);
  const requestBody = JSON.stringify({
    model,
    messages,
    ...(browserSearch ? { max_completion_tokens: completionLimit, reasoning_effort: "low", temperature: 0.2, tools: [{ type: "browser_search" }], tool_choice: "required", citation_options: "disabled" } : {}),
    ...(json ? { response_format: { type: "json_object" }, temperature: 0.2, max_completion_tokens: completionLimit } : jsonSchema ? { response_format: { type: "json_schema", json_schema: { ...jsonSchema, strict: true } }, max_completion_tokens: completionLimit } : { max_completion_tokens: completionLimit })
  });
  const response = await fetchWithRotatingKeys(apiKey, "groq", estimatedTokens, (selectedKey) => fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${selectedKey}`, "Content-Type": "application/json" },
    body: requestBody
  }), (payload) => payload.usage?.total_tokens, onRateLimitRetry);
  const payload = await response.json().catch(() => ({}));
  if (response.status === 429) {
    const wait = response.headers.get("retry-after");
    throw new Error(`All saved Groq keys are currently rate limited.${wait ? ` Try again in ${wait} seconds.` : " Check the model limits in your Groq Console."}`);
  }
  if (!response.ok) throw new Error(payload.error?.message || `Groq request failed (${response.status}).`);
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned an empty response. Please try again.");
  return content;
}

export async function groqTranscribe(apiKey, file, model = "whisper-large-v3-turbo", { onRateLimitRetry } = {}) {
  const response = await fetchWithRotatingKeys(apiKey, "groq", 1, (selectedKey) => {
    const body = new FormData();
    body.append("file", file, file.name);
    body.append("model", model);
    body.append("response_format", "json");
    return fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${selectedKey}` }, body });
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `Audio transcription failed (${response.status}).`);
  if (!payload.text) throw new Error("Groq returned an empty transcription.");
  return payload.text;
}

export async function groqSpeech(apiKey, text, model = "canopylabs/orpheus-v1-english", { onRateLimitRetry } = {}) {
  if (!SPEECH_MODELS.some((entry) => entry.id === model)) throw new Error("Read Aloud supports Canopy Labs Orpheus models only.");
  const arabic = model === "canopylabs/orpheus-arabic-saudi";
  const requestBody = JSON.stringify({ model, input: text.slice(0, 4000), voice: arabic ? "noura" : "daniel", response_format: "wav" });
  const response = await fetchWithRotatingKeys(apiKey, "groq", roughTokenCount(text), (selectedKey) => fetch("https://api.groq.com/openai/v1/audio/speech", {
    method: "POST", headers: { Authorization: `Bearer ${selectedKey}`, "Content-Type": "application/json" },
    body: requestBody
  }), undefined, onRateLimitRetry);
  if (!response.ok) { let error = {}; try { error = await response.json(); } catch {} throw new Error(error.error?.message || `Speech generation failed (${response.status}).`); }
  return URL.createObjectURL(await response.blob());
}

function geminiPart(part) {
  if (typeof part === "string") return { text: part };
  if (part?.type === "image_url") {
    const url = part.image_url?.url || "";
    const match = url.match(/^data:([^;,]+);base64,(.+)$/);
    return match ? { inlineData: { mimeType: match[1], data: match[2] } } : { text: "[Image omitted: unsupported image URL]" };
  }
  return { text: part?.text || "" };
}

export async function geminiGenerate(apiKeys, messages, { model = "gemini-3.5-flash", googleSearch = false, responseSchema, maxOutputTokens = 8192 } = {}) {
  const systemInstruction = messages.find((message) => message.role === "system")?.content || "";
  const contents = messages.filter((message) => message.role !== "system").map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: (Array.isArray(message.content) ? message.content : [message.content]).map(geminiPart)
  }));
  const generationConfig = { maxOutputTokens, temperature: 0.3 };
  if (responseSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseJsonSchema = responseSchema;
  }
  const response = await fetchWithRotatingKeys(apiKeys, "gemini", roughTokenCount(messages) + Math.min(maxOutputTokens, 1200), (key) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents,
      generationConfig,
      ...(googleSearch ? { tools: [{ google_search: {} }] } : {})
    })
  }), (payload) => payload.usageMetadata?.totalTokenCount);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || `Gemini request failed (${response.status}).`);
  const content = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!content) throw new Error("Gemini returned an empty response. Please try again.");
  return content;
}

export function parseAIJson(content) {
  const raw = String(content || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(raw); } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("The model did not return valid JSON. Please try again.");
    try { return JSON.parse(raw.slice(start, end + 1)); } catch { throw new Error("The model returned incomplete JSON. Please try again."); }
  }
}
