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
  times: PrayerTimesData | null,
  fetchTimes: () => Promise<PrayerTimesData | null>
): UsePrayerNotificationsReturn {
  const [settings, setSettings] = useState<PrayerSettingsMap>(loadSettings);
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticReport | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const timesRef = useRef(times);
  const fetchTimesRef = useRef(fetchTimes);
  const scheduledForTimesRef = useRef<string | null>(null);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    timesRef.current = times;
  }, [times]);

  useEffect(() => {
    fetchTimesRef.current = fetchTimes;
  }, [fetchTimes]);

  const runReschedule = useCallback(async (force = false) => {
    const result = await smartReschedule(settingsRef.current, () => fetchTimesRef.current(), {
      forceRefresh: force,
      times: force ? undefined : timesRef.current,
    });
    setScheduleResult(result);
    return result;
  }, []);

  const debouncedReschedule = useRef(
    debounce(() => {
      void runReschedule(true);
    }, 800)
  ).current;

  // Init lifecycle listeners once
  useEffect(() => {
    cleanupRef.current = initLifecycleListeners(settingsRef, () => fetchTimesRef.current());
    return () => cleanupRef.current?.();
  }, []);

  // First-time: permission only (scheduling when times arrive)
  useEffect(() => {
    void requestNotificationPermission();
  }, []);

  // Cache times whenever they arrive; schedule once per day-key
  useEffect(() => {
    if (!times) return;
    saveCachedTimes(times);
    const dayKey = new Date().toDateString();
    if (scheduledForTimesRef.current === dayKey) return;
    scheduledForTimesRef.current = dayKey;
    void runReschedule(false);
  }, [times, runReschedule]);

  // Foreground adhan: check once per minute at :00 only
  useEffect(() => {
    if (!times) return;
    const tick = () => {
      if (new Date().getSeconds() !== 0) return;
      checkForegroundPrayer(times, settingsRef.current, (key) => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('adhan-play', { detail: { prayer: key } }));
        }
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [times, settings]);

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

  const reschedule = useCallback(
    async (force = false) => {
      await runReschedule(force);
    },
    [runReschedule]
  );

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
