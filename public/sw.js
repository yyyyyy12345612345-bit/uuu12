const CACHE_NAME = 'quran-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Generate list of 114 Surah PDF paths
const SURAHS_PDFS = Array.from({ length: 114 }, (_, i) => {
    const id = (i + 1).toString().padStart(3, '0');
    return `/pdf/${id}.pdf`;
});

// Install Event: Cache Static Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches and cache ALL Surahs in background
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all([
        // Delete old caches
        ...cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
        // Cache All PDFs in background
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Pre-caching all 114 Surahs for offline use...');
            return cache.addAll(SURAHS_PDFS);
        })
      ]);
    })
  );
  self.clients.claim();
});

// Fetch Event: Cache Audio, PDF and External Assets on the fly
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy for Media and Documents (Cache First)
  if (
    url.href.includes('.pdf') || // Added PDF support
    url.href.includes('.mp3') || 
    url.href.includes('.wav') || 
    url.href.includes('.mp4') ||
    url.href.includes('/adhan/') ||
    url.href.includes('everyayah.com') ||
    url.href.includes('qurancdn.com') ||
    url.href.includes('pexels.com') ||
    url.href.includes('images.pexels.com') ||
    url.href.includes('fonts.googleapis.com') ||
    url.href.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        });
      })
    );
    return;
  }

  // DEFAULT Strategy: Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse.clone());
        });
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
