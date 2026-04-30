const CACHE_NAME = 'quran-pwa-v10';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/logo/logo.png',
  '/data/surahs.json'
];

const AUDIO_CACHE_NAME = 'quran-audio-v1';

// ── Service Worker Lifecycle ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== AUDIO_CACHE_NAME)
          .map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch Handler with Audio Caching ─────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Special handling for Audio files (.mp3) - Cache them when heard
  if (url.pathname.endsWith('.mp3') || request.destination === 'audio') {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            return new Response('Audio not available offline', { status: 503 });
          });
        });
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }
  
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).catch(() => {
        return new Response('Network error occurred', { status: 404, statusText: 'Network error' });
      });
    })
  );
});

// ── Notification Click Handler ───────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
        clients[0].navigate(event.notification.data?.url || '/');
      } else {
        self.clients.openWindow(event.notification.data?.url || '/');
      }
    })
  );
});
