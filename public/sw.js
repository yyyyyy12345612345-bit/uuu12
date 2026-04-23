const CACHE_NAME = 'quran-pwa-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/logo/logo.png',
  '/data/surahs.json'
];

// Store prayer times and settings received from the app
let prayerData = {
  times: null,
  settings: null
};
let lastNotifiedPrayer = null;

const PRAYER_NAMES = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء'
};

const AUDIO_CACHE_NAME = 'quran-audio-v1';

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
            // Check if we received a valid response
            if (networkResponse.status === 200 || networkResponse.status === 206) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Offline and not in cache
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

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRAYER_DATA_UPDATE') {
    prayerData.times = event.data.times;
    prayerData.settings = event.data.settings;
    lastNotifiedPrayer = null; 
    console.log('[SW] Prayer data updated');
  }
});

function checkPrayerTimes() {
  if (!prayerData.times || !prayerData.settings) return;
  
  const now = new Date();
  const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  for (const [key, time] of Object.entries(prayerData.times)) {
    if (!PRAYER_NAMES[key]) continue;
    
    const prayerTime = time.substring(0, 5);
    const setting = prayerData.settings[key];
    
    // Only notify if notifications are enabled for this specific prayer
    if (prayerTime === nowStr && setting?.notificationsEnabled && lastNotifiedPrayer !== `${key}_${nowStr}`) {
      lastNotifiedPrayer = `${key}_${nowStr}`;
      
      self.registration.showNotification(`🕌 حان الآن موعد أذان ${PRAYER_NAMES[key]}`, {
        body: 'حيّ على الصلاة.. حيّ على الفلاح',
        icon: '/logo/logo.png',
        badge: '/logo/logo.png',
        tag: `prayer-${key}`,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        data: { prayer: key, url: '/prayers' }
      });
      
      // Tell open clients to play audio if enabled
      if (setting?.athanEnabled) {
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({ type: 'PLAY_ADHAN', prayer: key });
            });
          });
      }
    }
  }
}

setInterval(checkPrayerTimes, 30000);

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow(event.notification.data?.url || '/prayers');
      }
    })
  );
});
