/**
 * 🕌 Prayer Notifications System — Built from scratch
 * 
 * Handles scheduling prayer time notifications using Capacitor LocalNotifications.
 * Works natively on Android with proper channels, sounds, and icons.
 * Falls back to Web Notifications API on browsers.
 */

import { Capacitor } from '@capacitor/core';

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
  offset: number; // minutes (positive = after, negative = before)
}

export type PrayerSettingsMap = Record<string, PrayerNotifSetting>;

const PRAYER_KEYS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

const CHANNEL_ID = 'prayer-notifications';

// ── Permission Request ───────────────────────────────────────────────────

/**
 * Request notification permissions (Native + Web).
 * Returns true if granted.
 */
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

/**
 * Check if notification permission is already granted.
 */
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

// ── Native Notification Channel ──────────────────────────────────────────

/**
 * Create the Android notification channel for prayer times.
 * Must be called before scheduling notifications on Android 8+.
 */
async function ensureChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.createChannel({
      id: CHANNEL_ID,
      name: 'مواقيت الأذان',
      description: 'تنبيهات مواقيت الصلاة والأذان',
      importance: 5, // MAX — shows heads-up notification with sound
      visibility: 1, // PUBLIC
      sound: 'adhan.mp3',
      vibration: true,
    });
  } catch (e) {
    console.error('[Notifications] Channel creation failed:', e);
  }
}

// ── Schedule Prayer Notifications ────────────────────────────────────────

/**
 * Schedule prayer notifications for the next 30 days.
 * Cancels all existing prayer notifications first to avoid duplicates.
 */
export async function schedulePrayerNotifications(
  times: PrayerTimesData,
  settings: PrayerSettingsMap
): Promise<number> {
  if (!Capacitor.isNativePlatform()) return 0;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');

    // 1. Cancel ALL existing scheduled notifications
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    // 2. Create channel
    await ensureChannel();

    // 3. Build notification list for next 30 days
    const notifications: any[] = [];
    const now = new Date();

    for (let day = 0; day < 30; day++) {
      for (let i = 0; i < PRAYER_KEYS.length; i++) {
        const key = PRAYER_KEYS[i];
        const setting = settings[key];

        // Skip if disabled
        if (!setting?.enabled) continue;

        const timeStr = times[key as keyof PrayerTimesData];
        if (!timeStr) continue;

        const [h, m] = timeStr.split(':').map(Number);
        const scheduleDate = new Date(now);
        scheduleDate.setDate(scheduleDate.getDate() + day);
        scheduleDate.setHours(h, m + (setting.offset || 0), 0, 0);

        // Skip if already passed
        if (scheduleDate <= now) continue;

        // Unique ID: day * 10 + prayer index + 1 (avoid 0)
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
          sound: setting.soundEnabled ? 'adhan.mp3' : undefined,
          channelId: CHANNEL_ID,
          smallIcon: 'ic_notification',
          iconColor: '#c5a059',
          autoCancel: true,
        });
      }
    }

    // 4. Schedule all
    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
      console.log(`[Notifications] Scheduled ${notifications.length} prayer notifications`);
    }

    return notifications.length;
  } catch (e) {
    console.error('[Notifications] Scheduling failed:', e);
    return 0;
  }
}

// ── Test Notification ────────────────────────────────────────────────────

/**
 * Send a test notification after 5 seconds to verify the system works.
 */
export async function sendTestNotification(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    // Web fallback
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
        sound: 'adhan.mp3',
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

// ── Foreground Prayer Check ──────────────────────────────────────────────

/**
 * Check if it's time for any prayer and trigger foreground notification.
 * Call this every second from the PrayerTimes component.
 */
export function checkForegroundPrayer(
  times: PrayerTimesData,
  settings: PrayerSettingsMap,
  onPrayerTime: (prayerKey: string) => void
): void {
  const now = new Date();

  for (const key of PRAYER_KEYS) {
    const setting = settings[key];
    if (!setting?.enabled) continue;

    const timeStr = times[key as keyof PrayerTimesData];
    if (!timeStr) continue;

    const [h, m] = timeStr.split(':').map(Number);
    const prayerDate = new Date(now);
    prayerDate.setHours(h, m + (setting.offset || 0), 0, 0);

    const prayerTime = `${prayerDate.getHours().toString().padStart(2, '0')}:${prayerDate.getMinutes().toString().padStart(2, '0')}`;
    const nowTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (prayerTime === nowTime && now.getSeconds() === 0) {
      onPrayerTime(key);
    }
  }
}

// ── Settings Helpers ─────────────────────────────────────────────────────

const SETTINGS_KEY = 'prayer_notif_settings_v3';

export function getDefaultSettings(): PrayerSettingsMap {
  return {
    Fajr: { enabled: true, soundEnabled: true, offset: 0 },
    Dhuhr: { enabled: true, soundEnabled: true, offset: 0 },
    Asr: { enabled: true, soundEnabled: true, offset: 0 },
    Maghrib: { enabled: true, soundEnabled: true, offset: 0 },
    Isha: { enabled: true, soundEnabled: true, offset: 0 },
  };
}

export function loadSettings(): PrayerSettingsMap {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return getDefaultSettings();
}

export function saveSettings(settings: PrayerSettingsMap): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export { PRAYER_KEYS, PRAYER_NAMES_AR };
