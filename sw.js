/* =========================================================
   Emergency Doctor Simulator — sw.js (v2.3.0)
   =========================================================
   ✔ Cache do cases.json (casos clínicos)
   ✔ Cache de imagens base (capa/fundo/avatares/ícones)
   ✔ Atualização automática (remove caches antigos)
   ✔ Offline-first estável para PWA
   ========================================================= */

const CACHE_VERSION = "eds-cache-v2.3.0";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",

  // ✅ JSON de casos
  "./cases.json",

  // Imagens principais (confira nomes exatos no repo)
  "./images/capa.jpg",
  "./images/fundo.jpg",

  // Avatares
  "./images/avatar1.png",
  "./images/avatar2.png",
  "./images/avatar3.png",
  "./images/avatar4.png",
  "./images/avatar5.png",
  "./images/avatar6.png",

  // Ícones PWA (manifest)
  "./images/icon-192.png",
  "./images/icon-512.png"
];

/* =========================
   INSTALL
========================= */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
});

/* =========================
   ACTIVATE
========================= */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_VERSION ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

/* =========================
   FETCH
   - HTML: network-first (pra atualizar rápido)
   - outros: stale-while-revalidate (rápido e atualiza em background)
========================= */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const req = event.request;
  const url = new URL(req.url);

  // Só controla o mesmo origin (GitHub Pages / Vercel)
  if (url.origin !== self.location.origin) return;

  const isHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    // Network-first para não “grudar” em versão antiga do index.html
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
    );
    return;
  }

  // Stale-while-revalidate para CSS/JS/JSON/imagens
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
