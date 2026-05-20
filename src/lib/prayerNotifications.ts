import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

// ── Types ────────────────────────────────────────────────────────────────

export interface PrayerTimesData {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface PrayerNotifSetting {
  enabled: boolean;
  soundEnabled: boolean;
  offset: number; // minutes
  muezzinId?: string;
}

export type PrayerSettingsMap = Record<string, PrayerNotifSetting>;

export interface ScheduleResult {
  scheduled: number;
  source: 'api' | 'cache' | 'none';
}

export interface NextPrayerInfo {
  id: string;
  nameEn: string;
  nameAr: string;
  date: Date;
  remainingMs: number;
  inLabel: string;
}

export interface DiagnosticReport {
  lastScheduleDate: string | null;
  totalScheduledPending: number;
  permissionsGranted: boolean;
  channelsCreated: boolean;
}

export const PRAYER_KEYS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

export const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

const CHANNEL_ID = 'prayer_notifications_v5';
const SETTINGS_KEY = 'prayer_notif_settings_v4';
const CACHE_KEY = 'prayer_times_cache';
const LAST_SCHEDULE_DATE_KEY = 'last_schedule_date_v4';

// ── Permissions & Channel ─────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    }
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  } catch (e) {
    console.error('[Notifications] Permission request failed:', e);
    return false;
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.checkPermissions();
      return result.display === 'granted';
    }
    if ('Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  } catch {
    return false;
  }
}

async function ensureChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'أذان الصلاة والمواقيت',
      description: 'تنبيهات عاجلة لمواقيت الصلاة مع الأذان',
      importance: 5,
      visibility: 1,
      sound: 'adhan',
      vibration: true,
      lights: true,
      lightColor: '#D4AF37',
    });
  } catch (e) {
    console.error('[Notifications] Channel creation failed:', e);
  }
}

// ── Core Scheduling ──────────────────────────────────────────────────────

export async function cancelAllPrayerNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch (e) {
    console.error('[Notifications] Cancel failed:', e);
  }
}

async function doSchedule(times: PrayerTimesData, settings: PrayerSettingsMap): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const notifications: any[] = [];
    const now = new Date();

    // 7 days limit to stay under Android 64 notification limit (5 * 7 = 35)
    for (let day = 0; day < 7; day++) {
      for (let i = 0; i < PRAYER_KEYS.length; i++) {
        const key = PRAYER_KEYS[i];
        const setting = settings[key];

        if (!setting?.enabled) continue;
        const timeStr = times[key as keyof PrayerTimesData];
        if (!timeStr) continue;

        const [h, m] = timeStr.split(':').map(Number);
        const scheduleDate = new Date(now);
        scheduleDate.setDate(scheduleDate.getDate() + day);
        scheduleDate.setHours(h, m, 0, 0); // Reset seconds and ms
        
        // Add offset safely
        if (setting.offset) {
          scheduleDate.setMinutes(scheduleDate.getMinutes() + setting.offset);
        }

        if (scheduleDate <= now) continue;

        const notificationId = (day * 10) + i + 1;

        notifications.push({
          id: notificationId,
          title: `🕌 حان الآن موعد أذان ${PRAYER_NAMES_AR[key]}`,
          body: 'حيّ على الصلاة.. حيّ على الفلاح',
          schedule: {
            at: scheduleDate,
            allowWhileIdle: true,
            repeats: false,
          },
          sound: setting.soundEnabled ? 'adhan' : undefined,
          channelId: CHANNEL_ID,
          importance: 5,
          smallIcon: 'ic_notification',
          iconColor: '#c5a059',
          autoCancel: true,
        });
      }
    }

    if (notifications.length > 0) {
      await cancelAllPrayerNotifications();
      await ensureChannel();
      await LocalNotifications.schedule({ notifications });
      console.log(`[Notifications] Scheduled ${notifications.length} notifications`);
      localStorage.setItem(LAST_SCHEDULE_DATE_KEY, new Date().toDateString());
    }

    return notifications.length;
  } catch (e) {
    console.error('[Notifications] Scheduling failed:', e);
    return 0;
  }
}

let _isScheduling = false;

export async function smartReschedule(
  settings: PrayerSettingsMap,
  fetchTimes: () => Promise<PrayerTimesData | null>,
  options?: { forceRefresh?: boolean }
): Promise<ScheduleResult> {
  if (_isScheduling) {
    return { scheduled: 0, source: 'none' };
  }
  _isScheduling = true;

  try {
    const lastSchedule = localStorage.getItem(LAST_SCHEDULE_DATE_KEY);
    const today = new Date().toDateString();

    if (!options?.forceRefresh && lastSchedule === today) {
      console.log('[Notifications] Already scheduled today, skipping.');
      return { scheduled: 0, source: 'none' };
    }

    let timesToUse: PrayerTimesData | null = null;
    let source: 'api' | 'cache' = 'api';

    try {
      timesToUse = await fetchTimes();
      if (timesToUse) {
        saveCachedTimes(timesToUse);
      }
    } catch (e) {
      console.warn('[Notifications] Fetch failed, checking cache...');
    }

    if (!timesToUse) {
      const cached = loadCachedTimes();
      if (cached) {
        if (cached.isStale) {
          console.warn('[Notifications] Cache is stale (>24h), times may be inaccurate');
        }
        timesToUse = cached.times;
        source = 'cache';
      }
    }

    if (timesToUse) {
      const scheduledCount = await doSchedule(timesToUse, settings);
      return { scheduled: scheduledCount, source };
    }

    return { scheduled: 0, source: 'none' };
  } finally {
    _isScheduling = false;
  }
}

// ── Lifecycle & Background ───────────────────────────────────────────────

let _isInitialized = false;

export function initLifecycleListeners(
  settingsRef: { current: PrayerSettingsMap } | (() => PrayerSettingsMap),
  fetchTimes: () => Promise<PrayerTimesData | null>
): () => void {
  if (_isInitialized) return () => {};
  _isInitialized = true;

  const getSettings = () => {
    if (typeof settingsRef === 'function') {
      return settingsRef();
    }
    return settingsRef.current;
  };

  const isNative = Capacitor.isNativePlatform();
  let listener: Promise<any> | null = null;

  if (isNative) {
    listener = App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        console.log('[Notifications] App active, checking schedule...');
        await smartReschedule(getSettings(), fetchTimes);
      }
    });
  }

  // date-change watcher
  let lastDate = new Date().toISOString().slice(0, 10);
  const dateInterval = setInterval(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== lastDate) {
      lastDate = today;
      console.log('[Notifications] Date changed, triggering smartReschedule...');
      smartReschedule(getSettings(), fetchTimes, { forceRefresh: true });
    }
  }, 60_000);

  return () => {
    _isInitialized = false;
    if (listener) {
      listener.then(l => l.remove());
    }
    clearInterval(dateInterval);
  };
}

// ── State & Utilities ────────────────────────────────────────────────────

export function getDefaultSettings(): PrayerSettingsMap {
  return {
    Fajr: { enabled: true, soundEnabled: true, offset: 0, muezzinId: 'haram' },
    Dhuhr: { enabled: true, soundEnabled: true, offset: 0, muezzinId: 'haram' },
    Asr: { enabled: true, soundEnabled: true, offset: 0, muezzinId: 'haram' },
    Maghrib: { enabled: true, soundEnabled: true, offset: 0, muezzinId: 'haram' },
    Isha: { enabled: true, soundEnabled: true, offset: 0, muezzinId: 'haram' },
  };
}

export function loadSettings(): PrayerSettingsMap {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const defaults = getDefaultSettings();
        return Object.fromEntries(
          PRAYER_KEYS.map(key => [key, { ...defaults[key], ...(parsed[key] ?? {}) }])
        ) as PrayerSettingsMap;
      }
    }
  } catch {}
  return getDefaultSettings();
}

export function saveSettings(settings: PrayerSettingsMap): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

interface CachedEntry {
  times: PrayerTimesData;
  savedAt: number;
}

export function saveCachedTimes(times: PrayerTimesData): void {
  const entry: CachedEntry = { times, savedAt: Date.now() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

export function loadCachedTimes(): { times: PrayerTimesData; isStale: boolean } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CachedEntry = JSON.parse(raw);
    const ageHours = (Date.now() - entry.savedAt) / 3600000;
    const isStale = !isFinite(ageHours) || ageHours > 24;
    return {
      times: entry.times,
      isStale,
    };
  } catch {
    return null;
  }
}

const TRIGGERED_KEY = 'adhan:triggered:v1';

export function checkForegroundPrayer(
  times: PrayerTimesData,
  settings: PrayerSettingsMap,
  onPrayerTime: (prayerKey: string) => void
): void {
  const now = new Date();
  const secondsNow = now.getSeconds();
  if (secondsNow > 3) return; // quick exit: accepts :00, :01, :02, :03

  const today = now.toISOString().slice(0, 10);
  let triggered: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(TRIGGERED_KEY);
    triggered = raw ? JSON.parse(raw) : {};
    // Clean up old days
    Object.keys(triggered).forEach(k => {
      if (!k.startsWith(today)) delete triggered[k];
    });
  } catch {}

  for (const key of PRAYER_KEYS) {
    const setting = settings[key];
    if (!setting?.enabled) continue;

    const timeStr = times[key as keyof PrayerTimesData];
    if (!timeStr) continue;

    const [h, m] = timeStr.split(':').map(Number);
    const prayerDate = new Date(now);
    prayerDate.setHours(h, m, 0, 0);
    if (setting.offset) {
      prayerDate.setMinutes(prayerDate.getMinutes() + setting.offset);
    }

    const prayerHHMM = `${String(prayerDate.getHours()).padStart(2, '0')}:${String(prayerDate.getMinutes()).padStart(2, '0')}`;
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (prayerHHMM !== nowHHMM) continue;

    const key2 = `${today}:${key}`;
    if (triggered[key2]) continue; // Already triggered today

    triggered[key2] = now.toISOString();
    localStorage.setItem(TRIGGERED_KEY, JSON.stringify(triggered));
    onPrayerTime(key);
  }
}

export function getNextPrayer(
  times: PrayerTimesData,
  settings: PrayerSettingsMap
): NextPrayerInfo | null {
  const now = new Date();

  const prayersToday = PRAYER_KEYS
    .filter(id => settings[id]?.enabled)
    .map(id => {
      const timeStr = times[id as keyof PrayerTimesData];
      if (!timeStr) return null;
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
      if (settings[id]?.offset) {
        d.setMinutes(d.getMinutes() + settings[id].offset);
      }
      return { id, nameAr: PRAYER_NAMES_AR[id], date: d };
    })
    .filter((p): p is { id: string; nameAr: string; date: Date } => p !== null);

  if (prayersToday.length === 0) return null;

  // Find first prayer that hasn't happened yet today
  let next = prayersToday.find(p => p.date > now);

  // If all prayers today have passed, calculate Fajr for tomorrow with its offset
  if (!next) {
    const fajr = prayersToday[0];
    const tomorrow = new Date(fajr.date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    next = { ...fajr, date: tomorrow };
  }

  const diffMs = next.date.getTime() - now.getTime();
  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);

  return {
    id: next.id,
    nameEn: next.id,
    nameAr: next.nameAr,
    date: next.date,
    remainingMs: diffMs,
    inLabel: `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
  };
}

export async function getDiagnosticReport(
  settings: PrayerSettingsMap
): Promise<DiagnosticReport> {
  const lastScheduleDate = localStorage.getItem(LAST_SCHEDULE_DATE_KEY);
  let totalScheduledPending = 0;
  let permissionsGranted = false;

  if (Capacitor.isNativePlatform()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const pending = await LocalNotifications.getPending();
      totalScheduledPending = pending.notifications.length;
      
      const perms = await LocalNotifications.checkPermissions();
      permissionsGranted = perms.display === 'granted';
    } catch (e) {}
  } else if ('Notification' in window) {
    permissionsGranted = Notification.permission === 'granted';
  }

  return {
    lastScheduleDate,
    totalScheduledPending,
    permissionsGranted,
    channelsCreated: true, // We assume if it runs it creates them
  };
}

export async function sendTestNotification(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    if ('Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        new Notification('🔔 تجربة إشعار الأذان', {
          body: 'إذا ظهر هذا الإشعار، فالتطبيق يعمل بشكل صحيح.',
          icon: '/logo/logo.png',
        });
      }, 3000);
      return true;
    }
    return false;
  }

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await ensureChannel();

    await LocalNotifications.schedule({
      notifications: [{
        id: 9999,
        title: '🔔 تجربة إشعار الأذان',
        body: 'إذا ظهر هذا الإشعار، فالتطبيق يعمل بشكل صحيح ✅',
        schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true },
        sound: 'adhan',
        channelId: CHANNEL_ID,
        smallIcon: 'ic_notification',
        iconColor: '#c5a059',
      }],
    });

    return true;
  } catch (e) {
    console.error('[Notifications] Test failed:', e);
    return false;
  }
}
