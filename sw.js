// ── AudioForge Service Worker ─────────────────────────────────────────
const CACHE_NAME = 'audioforge-v1.0.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/audio-engine.js',
  './js/waveform.js',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Install: cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Removing old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static, network-first for others
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Don't cache audio files or external requests
  if (url.origin !== self.location.origin) return;
  if (event.request.url.includes('fonts.googleapis.com')) return;
  if (event.request.url.includes('fonts.gstatic.com')) return;

  // Cache-first strategy for app assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// Background sync (future use)
self.addEventListener('sync', event => {
  console.log('[SW] Sync event:', event.tag);
});

// Push notifications (future use)
self.addEventListener('push', event => {
  if (!event.data) return;
  self.registration.showNotification('AudioForge', {
    body: event.data.text(),
    icon: './icons/icon-192.png',
    badge: './icons/icon-72.png',
  });
});
