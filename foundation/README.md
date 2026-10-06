# APEX App foundation — Parts 1 and 2

This is an isolated React/Express learning app added alongside the existing APEX JEE application. It does not replace or alter the root app entry point or its modules.

## Run locally

```sh
cd foundation
npm install
cp .env.example .env
# Edit .env and add your provider API keys.
npm run dev
```

The Express server and Vite development middleware share port `4000` by default. Open `http://localhost:4000`. Set `PORT` to change it. The server loads `.env` with dotenv; keep that file private and do not commit it.

For a production-style run:

```sh
npm run build
npm start
```

The production Express server serves the compiled frontend from `foundation/dist` and exposes the same `/api/chat` and `/api/tts` routes.

## Provider configuration

- `GROQ_API_KEY` is required for chat. Create a key at [Groq Console](https://console.groq.com/keys).
- `GROQ_MODEL` is optional and defaults to `openai/gpt-oss-120b`.
- `GEMINI_API_KEY` is required for Read Aloud. Create a key at [Google AI Studio](https://aistudio.google.com/apikey).
- `GEMINI_TTS_MODEL` is optional and defaults to `gemini-3.8-flash-tts`; the server requests the Aoede voice and returns a WAV audio response.

These keys are read only by Express. Do not put them in browser code, prefix them with `VITE_`, or commit `.env`. The `.env.example` file contains names and safe defaults, not credentials.

## Features and API

- Subject and unit filters and the Copilot share state through `useAppState()` in `src/DataProvider.jsx`. The active subject/unit are included as optional chat context.
- `POST /api/chat` accepts `{ "messages": [{ "role": "user"|"assistant", "content": "..." }], "studyContext": { "subject": "...", "unit": "..." } }` and returns `{ "role": "assistant", "content": "...", "model": "..." }`.
- Copilot answers render Markdown, GFM tables, and LaTeX via `remark-math` and KaTeX. A fenced `plot` block is rendered as an interactive function plot, with a grid and explicit x/y domains of `[-10, 10]`.
- `[WIKI_IMAGE: search term]` tags are resolved in the browser using Wikipedia's search and page-image API. A network or missing-thumbnail error is shown in place of the image.
- Each assistant answer has a Read Aloud button. `POST /api/tts` sends text to Gemini and returns the generated WAV bytes to the browser.
- Edit `public/data.json` to add topic records. Its fields are validated in `src/DataProvider.jsx`.
- Flashcards and quizzes remain placeholders; their counts still reflect the selected subject/unit data.
- For a separately hosted frontend, set `CLIENT_ORIGINS` to a comma-separated list of allowed origins. Same-origin frontend requests do not need a CORS allowlist.
