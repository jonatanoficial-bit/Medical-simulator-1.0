/* =========================================================
   Emergency Doctor Simulator — sw.js (v2.2.0)
   =========================================================
   ✔ Cache inteligente
   ✔ Atualização automática
   ✔ Corrige splash travada
   ✔ Offline-first (PWA)
   ========================================================= */

const CACHE_VERSION = "eds-cache-v2.2.0";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",

  // Imagens principais
  "./images/capa.jpg",
  "./images/fundo.jpg",

  // Avatares
  "./images/avatar1.png",
  "./images/avatar2.png",
  "./images/avatar3.png",
  "./images/avatar4.png",
  "./images/avatar5.png",
  "./images/avatar6.png",

  // Ícones PWA
  "./images/icon-192.png",
  "./images/icon-512.png"
];

/* =========================
   INSTALL
========================= */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

/* =========================
   ACTIVATE
========================= */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/* =========================
   FETCH (NETWORK FIRST)
========================= */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
