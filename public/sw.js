const CACHE_NAME = 'quran-pwa-v21';
const STATIC_CACHE_NAME = 'quran-static-assets-v1';
const AUDIO_CACHE_NAME = 'quran-audio-v1';
const FONT_CACHE_NAME = 'quran-fonts-v1';
const API_CACHE_NAME = 'quran-api-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/logo/logo.png',
  '/data/surahs.json',
  '/mushaf-bg.jpg.png'
];

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
          .filter(k => k !== CACHE_NAME && k !== AUDIO_CACHE_NAME && k !== FONT_CACHE_NAME && k !== STATIC_CACHE_NAME && k !== API_CACHE_NAME)
          .map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch Handler with Advanced Caching Strategies ────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension:// and other unsupported URL schemes
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) return;

  // 1. Audio files (.mp3) - Cache on demand (Cache-First)
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

  // 2. Google Fonts & Font files - Cache-First (highly static)
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf')
  ) {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 3. Quran API request caching (api.quran.com) - Stale-While-Revalidate
  if (url.hostname === 'api.quran.com' || url.hostname.includes('quran.com')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => null);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 4. Next.js Static Chunks / Styles / Scripts - Stale-While-Revalidate
  const isStaticChunk = url.pathname.includes('/_next/static/') || 
                        url.pathname.endsWith('.js') || 
                        url.pathname.endsWith('.css');

  if (isStaticChunk && !url.pathname.includes('hot-update')) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => null);

          // Return cached response instantly if available, otherwise wait for network
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 5. Navigation requests - Network-First, fallback to Cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // 6. Default: Cache-First for static preloaded assets, otherwise Network-First
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) return response;

      return fetch(request).then((networkResponse) => {
        // Cache images dynamically
        if (request.destination === 'image' && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
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
