const CACHE_NAME = "apex-jee-shell-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.json",
  "./icons/apex-icon-192.png",
  "./icons/apex-icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("apex-jee-shell-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("./index.html")));
    return;
  }

  if (url.pathname.endsWith("/styles.css")) {
    event.respondWith(fetch(request).then((response) => {
      if (!response.ok) return response;
      return caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone())).then(() => response);
    }).catch(() => caches.match(request).then((cached) => cached || Response.error())));
  }
});
