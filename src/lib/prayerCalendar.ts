import {
  type PrayerTimesData,
  type PrayerSettingsMap,
  type NextPrayerInfo,
  type PrayerLocationMeta,
  type PrayerYearCalendar,
  PRAYER_KEYS,
  PRAYER_NAMES_AR,
} from './prayerShared';

// Re-export for backward compatibility
export type { PrayerLocationMeta, PrayerYearCalendar } from './prayerShared';

const CALENDAR_KEY = 'prayer_year_calendar_v21';
const LOCATION_META_KEY = 'prayer_location_meta_v21';
const METHOD = 5;

/** يزيل "(EET)" ويُرجع HH:MM أو HH:MM:SS */
export function cleanPrayerTime(raw: string): string {
  const base = raw.split(' ')[0].trim();
  const parts = base.split(':');
  if (parts.length >= 3) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
  }
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
  }
  return base;
}

export function formatTimeDisplay(t: string): string {
  const c = cleanPrayerTime(t);
  return c.slice(0, 5);
}

function mapTimings(raw: Record<string, string>): PrayerTimesData {
  return {
    Fajr: cleanPrayerTime(raw.Fajr),
    Sunrise: cleanPrayerTime(raw.Sunrise),
    Dhuhr: cleanPrayerTime(raw.Dhuhr),
    Asr: cleanPrayerTime(raw.Asr),
    Maghrib: cleanPrayerTime(raw.Maghrib),
    Isha: cleanPrayerTime(raw.Isha),
  };
}

function gregorianToKey(gregorianDate: string): string {
  const [d, m, y] = gregorianDate.split('-').map((part) => part.padStart(2, '0'));
  return `${y}-${m}-${d}`;
}

function calendarUrl(meta: PrayerLocationMeta, year: number, month: number): string {
  const m = month + 1;
  const params = new URLSearchParams({ year: String(year), month: String(m) });
  if (meta.latitude != null && meta.longitude != null) {
    params.set('latitude', String(meta.latitude));
    params.set('longitude', String(meta.longitude));
  } else {
    params.set('city', meta.city || 'Cairo');
    params.set('country', meta.country || 'Egypt');
  }
  return `/api/prayer-calendar?${params.toString()}`;
}

async function fetchMonth(meta: PrayerLocationMeta, year: number, month: number): Promise<Record<string, PrayerTimesData>> {
  const res = await fetch(calendarUrl(meta, year, month));
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Calendar API request failed ${res.status} ${res.statusText}: ${body.slice(0, 300)}`);
  }

  if (!contentType.includes('application/json')) {
    const body = await res.text();
    throw new Error(`Calendar API returned non-JSON content for ${year}-${month + 1}: ${body.slice(0, 300)}`);
  }

  const json = await res.json();
  if (json.code !== 200 || !Array.isArray(json.data)) {
    throw new Error(`Calendar API failed for ${year}-${month + 1}`);
  }
  const out: Record<string, PrayerTimesData> = {};
  for (const entry of json.data) {
    const key = gregorianToKey(entry.date.gregorian.date);
    out[key] = mapTimings(entry.timings);
  }
  return out;
}

export async function fetchYearCalendar(
  meta: PrayerLocationMeta,
  year?: number,
  onProgress?: (done: number, total: number) => void
): Promise<PrayerYearCalendar> {
  const y = year ?? new Date().getFullYear();
  const days: Record<string, PrayerTimesData> = {};
  const months = Array.from({ length: 12 }, (_, i) => i);

  await Promise.all(
    months.map(async (month, idx) => {
      const chunk = await fetchMonth(meta, y, month);
      Object.assign(days, chunk);
      onProgress?.(idx + 1, 12);
    })
  );

  const calendar: PrayerYearCalendar = {
    meta,
    year: y,
    days,
    fetchedAt: Date.now(),
  };
  saveYearCalendar(calendar);
  saveLocationMeta(meta);
  return calendar;
}

/** جلب السنة الحالية + التالية للتغطية الكاملة */
export async function fetchFullCalendar(
  meta: PrayerLocationMeta,
  onProgress?: (message: string) => void
): Promise<PrayerYearCalendar> {
  const currentYear = new Date().getFullYear();
  onProgress?.('جاري تحميل تقويم السنة الحالية...');
  const current = await fetchYearCalendar(meta, currentYear);
  onProgress?.('جاري تحميل تقويم السنة القادمة...');
  const next = await fetchYearCalendar(meta, currentYear + 1);
  const merged: PrayerYearCalendar = {
    meta,
    year: currentYear,
    days: { ...current.days, ...next.days },
    fetchedAt: Date.now(),
  };
  saveYearCalendar(merged);
  return merged;
}

export function saveYearCalendar(cal: PrayerYearCalendar): void {
  try {
    localStorage.setItem(CALENDAR_KEY, JSON.stringify(cal));
  } catch (e) {
    console.warn('[Calendar] Storage full or failed', e);
  }
}

export function loadYearCalendar(): PrayerYearCalendar | null {
  try {
    const raw = localStorage.getItem(CALENDAR_KEY);
    if (!raw) return null;
    const cal = JSON.parse(raw) as PrayerYearCalendar;
    if (!cal?.days || !cal.meta) return null;
    return cal;
  } catch {
    return null;
  }
}

export function saveLocationMeta(meta: PrayerLocationMeta): void {
  localStorage.setItem(LOCATION_META_KEY, JSON.stringify(meta));
}

export function loadLocationMeta(): PrayerLocationMeta | null {
  try {
    const raw = localStorage.getItem(LOCATION_META_KEY);
    return raw ? (JSON.parse(raw) as PrayerLocationMeta) : null;
  } catch {
    return null;
  }
}

export function getTodayKey(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

export function getTimesForDate(cal: PrayerYearCalendar, dateKey: string): PrayerTimesData | null {
  return cal.days[dateKey] ?? null;
}

export function getTodayTimes(cal: PrayerYearCalendar): PrayerTimesData | null {
  return getTimesForDate(cal, getTodayKey());
}

export function parsePrayerDateTime(dateKey: string, timeStr: string): Date {
  const clean = cleanPrayerTime(timeStr);
  const segments = clean.split(':').map(Number);
  const [y, mo, d] = dateKey.split('-').map(Number);
  return new Date(y, mo - 1, d, segments[0] || 0, segments[1] || 0, segments[2] || 0, 0);
}

export function getNextPrayerFromCalendar(
  cal: PrayerYearCalendar,
  settings: PrayerSettingsMap
): NextPrayerInfo | null {
  const now = Date.now();
  const upcoming: { id: string; nameAr: string; date: Date }[] = [];

  for (const [dateKey, timings] of Object.entries(cal.days)) {
    for (const key of PRAYER_KEYS) {
      if (!settings[key]?.enabled) continue;
      const timeStr = timings[key as keyof PrayerTimesData];
      if (!timeStr) continue;
      const at = parsePrayerDateTime(dateKey, timeStr);
      if (at.getTime() > now) {
        upcoming.push({ id: key, nameAr: PRAYER_NAMES_AR[key], date: at });
      }
    }
  }

  if (upcoming.length === 0) return null;
  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  const next = upcoming[0];
  const diffMs = next.date.getTime() - now;
  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);

  return {
    id: next.id,
    nameEn: next.id,
    nameAr: next.nameAr,
    date: next.date,
    remainingMs: diffMs,
    inLabel: `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
  };
}

export function getMonthDayKeys(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const keys: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    keys.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return keys;
}

export const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
