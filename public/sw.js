const CACHE_NAME = 'quran-pwa-v8';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/logo/logo.png',
  '/data/surahs.json'
];

const AUDIO_CACHE_NAME = 'quran-audio-v1';
const PRAYER_DB_NAME = 'quran-prayer-db';
const PRAYER_STORE_NAME = 'prayer-data';

const PRAYER_NAMES = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء'
};

// ── IndexedDB helpers for persistent prayer data ─────────────────────────
function openPrayerDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PRAYER_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PRAYER_STORE_NAME)) {
        db.createObjectStore(PRAYER_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePrayerData(data) {
  const db = await openPrayerDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PRAYER_STORE_NAME, 'readwrite');
    const store = tx.objectStore(PRAYER_STORE_NAME);
    store.put(data, 'current');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadPrayerData() {
  try {
    const db = await openPrayerDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PRAYER_STORE_NAME, 'readonly');
      const store = tx.objectStore(PRAYER_STORE_NAME);
      const request = store.get('current');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return null;
  }
}


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
            if (networkResponse.status === 200 || networkResponse.status === 206) {
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
    caches.match(request).then((response) => response || fetch(request))
  );
});

// ── Listen for messages from the app ─────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRAYER_DATA_UPDATE') {
    // Preserve lastNotifiedKey so we don't re-fire today's prayer
    loadPrayerData().then(existing => {
      const data = {
        times: event.data.times,
        settings: event.data.settings,
        updatedAt: Date.now(),
        lastNotifiedKey: existing?.lastNotifiedKey || null
      };
      savePrayerData(data).then(() => {
        console.log('[SW] Prayer data saved to IndexedDB');
      });
    });
  }
});

// ── Prayer Time Checker (runs from both interval AND periodic sync) ──────
async function checkPrayerTimes() {
  const data = await loadPrayerData();
  if (!data || !data.times || !data.settings) return;
  
  const now = new Date();
  const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  for (const [key, time] of Object.entries(data.times)) {
    if (!PRAYER_NAMES[key]) continue;
    
    const setting = data.settings[key];
    if (!setting?.notificationsEnabled) continue;
    
    // Apply offset
    const [h, m] = time.substring(0, 5).split(':').map(Number);
    const offsetDate = new Date(now);
    offsetDate.setHours(h, m + (setting.offset || 0), 0, 0);
    const prayerTimeStr = `${offsetDate.getHours().toString().padStart(2, '0')}:${offsetDate.getMinutes().toString().padStart(2, '0')}`;
    
    const uniqueKey = `${key}_${prayerTimeStr}_${now.toDateString()}`;
    
    if (prayerTimeStr === nowStr) {
      // Check if we already notified for this prayer today (persisted in IndexedDB)
      const lastKey = data.lastNotifiedKey;
      if (lastKey === uniqueKey) continue;

      // Save the key so we don't re-notify even after SW restart
      data.lastNotifiedKey = uniqueKey;
      await savePrayerData(data);
      
      // Show notification even when app is closed
      self.registration.showNotification(`🕌 حان الآن موعد أذان ${PRAYER_NAMES[key]}`, {
        body: 'حيّ على الصلاة.. حيّ على الفلاح',
        icon: '/logo/logo.png',
        badge: '/logo/logo.png',
        tag: `prayer-${key}`,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        data: { prayer: key, url: '/prayers' },
        silent: false
      });
      
      // Tell open clients to play audio if enabled
      if (setting?.athanEnabled) {
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'PLAY_ADHAN', prayer: key });
          });
        });
      }
    }
  }
}

// Check every 15 seconds for more accuracy (SW will keep alive while there are active timers)
setInterval(checkPrayerTimes, 15000);

// ── Periodic Background Sync (for when app is completely closed) ──────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-prayer-times') {
    event.waitUntil(checkPrayerTimes());
  }
});

// Fallback: Also check on any push event
self.addEventListener('push', (event) => {
  event.waitUntil(checkPrayerTimes());
});

// ── Notification Click Handler ───────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
        clients[0].navigate(event.notification.data?.url || '/prayers');
      } else {
        self.clients.openWindow(event.notification.data?.url || '/prayers');
      }
    })
  );
});
