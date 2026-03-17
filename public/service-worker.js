const APP_SHELL_CACHE = "clali-app-shell-v1";
const RUNTIME_CACHE = "clali-runtime-v1";
const APP_SHELL_URLS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/offline.html",
  "/logo.png",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(cacheName))
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (shouldCacheAsset(request, url)) {
    event.respondWith(handleStaticAssetRequest(request));
  }
});

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put("/", networkResponse.clone());
    return networkResponse;
  } catch {
    const cachedResponse =
      (await caches.match(request)) ||
      (await caches.match("/")) ||
      (await caches.match("/index.html")) ||
      (await caches.match("/offline.html"));

    return cachedResponse || Response.error();
  }
}

async function handleStaticAssetRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    void refreshRuntimeCache(request);
    return cachedResponse;
  }

  return refreshRuntimeCache(request);
}

async function refreshRuntimeCache(request) {
  const response = await fetch(request);
  const cache = await caches.open(RUNTIME_CACHE);
  cache.put(request, response.clone());
  return response;
}

function shouldCacheAsset(request, url) {
  if (APP_SHELL_URLS.includes(url.pathname)) {
    return true;
  }

  if (["script", "style", "worker", "image", "font"].includes(request.destination)) {
    return true;
  }

  return /\.(?:js|css|png|jpg|jpeg|svg|gif|webp|woff2?|wasm|task)$/i.test(url.pathname);
}
