const CACHE_NAME = 'expensetrack-v1';

// Assets to cache immediately on install (app shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// ── Install: cache app shell ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for static assets ───────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always go network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(() =>
          new Response(JSON.stringify({ error: 'You are offline. Please check your connection.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
        )
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, fonts, images)
  if (
    request.method === 'GET' &&
    (url.pathname.match(/\.(js|css|png|jpg|svg|woff2?|ico)$/) ||
     url.hostname.includes('fonts.googleapis.com') ||
     url.hostname.includes('fonts.gstatic.com'))
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first for HTML navigation (so app always loads latest)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
  }
});
