const path = require("node:path");
const http = require("node:http");
const express = require("express");
const cors = require("cors");

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

app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin are accepted. In production, set CLIENT_ORIGINS
    // to a comma-separated allowlist when the frontend is hosted separately.
    callback(null, !origin || allowedOrigins.size === 0 || allowedOrigins.has(origin));
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", app: "APEX App" });
});

app.post("/api/chat", (_request, response) => {
  // To be implemented in Part 2.
  response.status(501).json({ error: "To be implemented in Part 2" });
});

app.post("/api/tts", (_request, response) => {
  // To be implemented in Part 2.
  response.status(501).json({ error: "To be implemented in Part 2" });
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
