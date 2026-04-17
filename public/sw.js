const CACHE_NAME = 'quran-pwa-v5';
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

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
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
