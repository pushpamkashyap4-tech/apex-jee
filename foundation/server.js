require("dotenv").config();

const path = require("node:path");
const http = require("node:http");
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
const port = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === "production";
const configuredOrigins = (process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const defaultDevOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4000",
  "http://127.0.0.1:4000"
];
const allowedOrigins = new Set(configuredOrigins.length ? configuredOrigins : isProduction ? [] : defaultDevOrigins);

const SYSTEM_PROMPT = [
  "You are an expert AI tutor.",
  "",
  "VISUAL GENERATION RULES: You have two distinct ways to show visuals.",
  "",
  "PATH 1 (Math Graphs): If asked to plot a mathematical function, output a plot code block like this:",
  "",
  "```plot",
  "",
  "y = x^2",
  "",
  "```",
  "",
  "PATH 2 (Scientific Diagrams): If asked for a physical or anatomical diagram, DO NOT draw it. Output a Wikipedia search tag: [WIKI_IMAGE: Human kidney].",
  "",
  "Always use $and$$ for LaTeX math formatting.",
  "For math rendering, use standard $...$ for inline math and $$...$$ for display math."
].join("\n");

let groqClient = null;
let groqClientKey = "";
function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!groqClient || groqClientKey !== apiKey) {
    groqClient = new Groq({ apiKey });
    groqClientKey = apiKey;
  }
  return groqClient;
}

function normalizedMessages(body) {
  const source = Array.isArray(body?.messages)
    ? body.messages
    : typeof body?.message === "string"
      ? [{ role: "user", content: body.message }]
      : [];
  return source
    .filter((message) => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
    .slice(-16)
    .map((message) => ({ role: message.role, content: message.content.trim().slice(0, 12000) }))
    .filter((message) => message.content);
}

function selectedStudyContext(value) {
  if (!value || typeof value !== "object") return "";
  const subject = typeof value.subject === "string" ? value.subject.trim().slice(0, 80) : "";
  const unit = typeof value.unit === "string" ? value.unit.trim().slice(0, 100) : "";
  if (!subject && !unit) return "";
  return `Current study filter: ${[subject && `Subject: ${subject}`, unit && `Unit: ${unit}`].filter(Boolean).join("; ")}. Use this context when relevant.`;
}

function pcmToWav(pcm, sampleRate = 24000) {
  const dataLength = pcm.length - (pcm.length % 2);
  const wavHeader = Buffer.alloc(44);
  const channelCount = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * channelCount * bitsPerSample / 8;
  const blockAlign = channelCount * bitsPerSample / 8;

  wavHeader.write("RIFF", 0);
  wavHeader.writeUInt32LE(36 + dataLength, 4);
  wavHeader.write("WAVE", 8);
  wavHeader.write("fmt ", 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(channelCount, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write("data", 36);
  wavHeader.writeUInt32LE(dataLength, 40);
  return Buffer.concat([wavHeader, pcm.subarray(0, dataLength)]);
}

app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin are accepted. In production, set CLIENT_ORIGINS
    // to a comma-separated allowlist when the frontend is hosted separately.
    callback(null, !origin || allowedOrigins.has(origin));
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", app: "APEX App" });
});

app.post("/api/chat", async (request, response) => {
  const client = getGroqClient();
  if (!client) return response.status(503).json({ error: "Chat is not configured. Set GROQ_API_KEY on the server." });

  const messages = normalizedMessages(request.body);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return response.status(400).json({ error: "Send at least one user message to start the chat." });
  }

  const context = selectedStudyContext(request.body?.studyContext);
  const promptMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(context ? [{ role: "system", content: context }] : []),
    ...messages
  ];

  try {
    const completion = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      messages: promptMessages,
      max_completion_tokens: 1800
    });
    const content = completion.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return response.status(502).json({ error: "The AI provider returned an empty answer. Please try again." });
    }
    return response.json({ role: "assistant", content: content.trim(), model: completion.model || process.env.GROQ_MODEL || "openai/gpt-oss-120b" });
  } catch (error) {
    console.error("Groq chat request failed:", error?.status || error?.message || "unknown provider error");
    return response.status(502).json({ error: "The chat provider request failed. Check the server configuration and try again." });
  }
});

app.post("/api/tts", async (request, response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return response.status(503).json({ error: "Read Aloud is not configured. Set GEMINI_API_KEY on the server." });
  const text = typeof request.body?.text === "string" ? request.body.text.trim().slice(0, 4000) : "";
  if (!text) return response.status(400).json({ error: "Provide text to read aloud." });

  const model = process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  try {
    const providerResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      signal: AbortSignal.timeout(45000),
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          responseFormat: {
            audio: { mimeType: "AUDIO_WAV", sampleRate: 24000 }
          },
          speechConfig: {
            voiceConfig: { voice: "Aoede" }
          }
        }
      })
    });
    const payload = await providerResponse.json().catch(() => ({}));
    if (!providerResponse.ok) {
      console.error("Gemini TTS request failed:", providerResponse.status, payload?.error?.message || "unknown provider error");
      return response.status(502).json({ error: "Gemini could not generate speech. Check the TTS model and API key." });
    }

    const audioPart = payload.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
    if (!audioPart?.inlineData?.data) {
      return response.status(502).json({ error: "Gemini returned no audio data." });
    }

    const audioBuffer = Buffer.from(audioPart.inlineData.data, "base64");
    const mimeType = String(audioPart.inlineData.mimeType || "").toLowerCase();
    const sampleRate = Number(mimeType.match(/rate=(\d+)/)?.[1]) || 24000;
    const wavBuffer = mimeType.includes("wav") || audioBuffer.subarray(0, 4).toString("ascii") === "RIFF"
      ? audioBuffer
      : pcmToWav(audioBuffer, sampleRate);

    response.set({
      "Content-Type": "audio/wav",
      "Content-Length": String(wavBuffer.length),
      "Cache-Control": "no-store",
      "Content-Disposition": "inline; filename=apex-read-aloud.wav"
    });
    return response.status(200).send(wavBuffer);
  } catch (error) {
    console.error("Gemini TTS request failed:", error?.message || "unknown provider error");
    return response.status(502).json({ error: "Read Aloud failed. Please try again." });
  }
});

function listen(server = app) {
  server.listen(port, "0.0.0.0", () => {
    console.log(`APEX App foundation listening on http://0.0.0.0:${port}`);
  });
}

async function start() {
  if (isProduction) {
    const distDirectory = path.join(__dirname, "dist");
    app.use(express.static(distDirectory));
    app.use((request, response, next) => {
      if (request.method === "GET" && request.accepts("html") && !request.path.startsWith("/api/")) {
        return response.sendFile(path.join(distDirectory, "index.html"), (error) => {
          if (error) next(error);
        });
      }
      return next();
    });
    return listen();
  }

  // Vite compiles the React JSX and serves public/data.json in development.
  const { createServer } = await import("vite");
  const httpServer = http.createServer(app);
  const vite = await createServer({
    configFile: path.join(__dirname, "vite.config.js"),
    server: { middlewareMode: true, hmr: { server: httpServer } },
    appType: "spa"
  });
  app.use(vite.middlewares);
  listen(httpServer);
}

start().catch((error) => {
  console.error("Could not start APEX App foundation:", error);
  process.exitCode = 1;
});
