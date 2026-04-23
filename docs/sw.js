// The version is injected from app.config.js → package.json
const APP_VERSION = "0.1.8"; // replaced at build time
const CACHE_NAME = `istafsar-v${APP_VERSION}`;

const urlsToCache = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  console.log(`[Service Worker] Installing version ${APP_VERSION}...`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log(`[Service Worker] Activating version ${APP_VERSION}...`);
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      ),
    ),
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Always fetch in the background
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Only cache valid responses
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseClone = networkResponse.clone(); // ✅ clone immediately
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and cached, use cached response
          return cachedResponse;
        });

      // Serve cached first, fall back to network
      return cachedResponse || fetchPromise;
    }),
  );
});
