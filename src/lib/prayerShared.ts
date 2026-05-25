// Shared types and constants for prayer functionality
// Extracted to break circular dependency between prayerCalendar.ts and prayerNotifications.ts

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

export interface PrayerLocationMeta {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  label: string;
}

export interface PrayerYearCalendar {
  meta: PrayerLocationMeta;
  year: number;
  days: Record<string, PrayerTimesData>;
  fetchedAt: number;
}

export const PRAYER_KEYS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;

export const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};
