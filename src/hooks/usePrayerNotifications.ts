import { useEffect, useRef, useState, useCallback } from 'react';
import {
  loadSettings,
  saveSettings,
  saveCachedTimes,
  smartReschedule,
  initLifecycleListeners,
  checkForegroundPrayer,
  requestNotificationPermission,
  getDiagnosticReport,
  cancelAllPrayerNotifications,
  sendTestNotification,
  type PrayerTimesData,
  type PrayerSettingsMap,
  type ScheduleResult,
  type DiagnosticReport,
} from '@/lib/prayerNotifications';
import {
  type PrayerYearCalendar,
  getTodayTimes,
} from '@/lib/prayerCalendar';

interface UsePrayerNotificationsReturn {
  settings: PrayerSettingsMap;
  updateSettings: (s: PrayerSettingsMap, options?: { reschedule?: boolean }) => Promise<void>;
  scheduleResult: ScheduleResult | null;
  diagnostics: DiagnosticReport | null;
  refreshDiagnostics: () => Promise<void>;
  reschedule: (force?: boolean) => Promise<void>;
  sendTest: () => Promise<boolean>;
  cancelAll: () => Promise<void>;
}

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function usePrayerNotifications(
  calendar: PrayerYearCalendar | null,
  fetchTimes: () => Promise<PrayerTimesData | null>
): UsePrayerNotificationsReturn {
  const [settings, setSettings] = useState<PrayerSettingsMap>(loadSettings);
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticReport | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const calendarRef = useRef(calendar);
  const fetchTimesRef = useRef(fetchTimes);
  const scheduledForCalendarRef = useRef<string | null>(null);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    calendarRef.current = calendar;
  }, [calendar]);

  useEffect(() => {
    fetchTimesRef.current = fetchTimes;
  }, [fetchTimes]);

  const runReschedule = useCallback(async (force = false) => {
    const cal = calendarRef.current;
    const todayTimes = cal ? getTodayTimes(cal) : null;
    if (todayTimes) saveCachedTimes(todayTimes);

    const result = await smartReschedule(settingsRef.current, () => fetchTimesRef.current(), {
      forceRefresh: force,
      times: todayTimes,
      calendar: cal,
    });
    setScheduleResult(result);
    return result;
  }, []);

  const debouncedReschedule = useRef(
    debounce(() => {
      void runReschedule(true);
    }, 800)
  ).current;

  useEffect(() => {
    cleanupRef.current = initLifecycleListeners(settingsRef, () => fetchTimesRef.current());
    return () => cleanupRef.current?.();
  }, []);

  useEffect(() => {
    void requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!calendar) return;
    const sig = `${calendar.fetchedAt}-${calendar.meta.label}`;
    if (scheduledForCalendarRef.current === sig) return;
    scheduledForCalendarRef.current = sig;
    void runReschedule(false);
  }, [calendar, runReschedule]);

  useEffect(() => {
    if (!calendar) return;
    const tick = () => {
      if (new Date().getSeconds() !== 0) return;
      checkForegroundPrayer(calendar, settingsRef.current, (key) => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('adhan-play', { detail: { prayer: key } }));
        }
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [calendar, settings]);

  const updateSettings = useCallback(
    async (newSettings: PrayerSettingsMap, options?: { reschedule?: boolean }) => {
      setSettings(newSettings);
      saveSettings(newSettings);
      settingsRef.current = newSettings;
      if (options?.reschedule === false) return;
      debouncedReschedule();
    },
    [debouncedReschedule]
  );

  const reschedule = useCallback(async (force = false) => {
    await runReschedule(force);
  }, [runReschedule]);

  const refreshDiagnostics = useCallback(async () => {
    const report = await getDiagnosticReport(settingsRef.current);
    setDiagnostics(report);
  }, []);

  const sendTest = useCallback(() => sendTestNotification(), []);
  const cancelAll = useCallback(() => cancelAllPrayerNotifications(), []);

  return {
    settings,
    updateSettings,
    scheduleResult,
    diagnostics,
    refreshDiagnostics,
    reschedule,
    sendTest,
    cancelAll,
  };
}
