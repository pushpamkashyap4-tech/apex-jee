# APEX App — Part 1 foundation

This is an isolated React/Express starter scaffold added alongside the existing APEX JEE app. It does not replace or alter the existing app entry point or modules.

## Run locally

```sh
cd foundation
npm install
npm run dev
```

The Express server and Vite development middleware share port `4000` by default. Open `http://localhost:4000`. Set `PORT` to change it.

For a production-style run:

```sh
npm run build
npm start
```

The production Express server serves the compiled frontend from `foundation/dist` and keeps the `/api/chat` and `/api/tts` placeholder routes available.

## Data and API

- Edit `public/data.json` to add topic records. Its fields are validated in `src/DataProvider.jsx`.
- Subject and unit filters are shared through `useAppState()`.
- `POST /api/chat` and `POST /api/tts` currently return HTTP 501 with the Part 2 placeholder message.
- In development, the server allows the local Vite origins. For a separately hosted frontend, set `CLIENT_ORIGINS` to a comma-separated list of allowed origins.

The Copilot, Flashcards, and Quizzes screens are navigation placeholders by design; feature interfaces are not part of Part 1.
