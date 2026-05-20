import { useEffect, useRef, useState, useCallback } from 'react';
import {
  loadSettings,
  saveSettings,
  saveCachedTimes,
  smartReschedule,
  initLifecycleListeners,
  checkForegroundPrayer,
  getNextPrayer,
  requestNotificationPermission,
  getDiagnosticReport,
  cancelAllPrayerNotifications,
  sendTestNotification,
  type PrayerTimesData,
  type PrayerSettingsMap,
  type ScheduleResult,
  type NextPrayerInfo,
  type DiagnosticReport,
} from '@/lib/prayerNotifications';

interface UsePrayerNotificationsReturn {
  settings: PrayerSettingsMap;
  updateSettings: (s: PrayerSettingsMap) => Promise<void>;
  nextPrayer: NextPrayerInfo | null;
  scheduleResult: ScheduleResult | null;
  diagnostics: DiagnosticReport | null;
  reschedule: (force?: boolean) => Promise<void>;
  sendTest: () => Promise<boolean>;
  cancelAll: () => Promise<void>;
}

export function usePrayerNotifications(
  times: PrayerTimesData | null,
  fetchTimes: () => Promise<PrayerTimesData | null>
): UsePrayerNotificationsReturn {
  const [settings, setSettings] = useState<PrayerSettingsMap>(loadSettings);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticReport | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Init lifecycle listeners once
  useEffect(() => {
    cleanupRef.current = initLifecycleListeners(settingsRef, fetchTimes);
    return () => cleanupRef.current?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // First-time setup: request permission + schedule
  useEffect(() => {
    (async () => {
      await requestNotificationPermission();
      const result = await smartReschedule(settingsRef.current, fetchTimes);
      setScheduleResult(result);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cache times whenever they arrive
  useEffect(() => {
    if (times) saveCachedTimes(times);
  }, [times]);

  // Update next prayer countdown every second
  useEffect(() => {
    if (!times) return;
    const update = () => {
      const next = getNextPrayer(times, settings);
      setNextPrayer(next);
    };
    update();
    const interval = setInterval(update, 1_000);
    return () => clearInterval(interval);
  }, [times, settings]);

  // Foreground prayer checker (every second)
  useEffect(() => {
    if (!times) return;
    const interval = setInterval(() => {
      checkForegroundPrayer(times, settings, (key) => {
        // 🔔 Trigger your in-app adhan player here
        console.log(`[Adhan] 🕌 ${key} — play adhan in app`);
        // We trigger an event that PrayerTimes screen can listen to, 
        // or just rely on the component using the hook to play it.
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('adhan-play', { detail: { prayer: key } }));
        }
      });
    }, 1_000);
    return () => clearInterval(interval);
  }, [times, settings]);

  const updateSettings = useCallback(async (newSettings: PrayerSettingsMap) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    // Force reschedule with new settings
    const result = await smartReschedule(newSettings, fetchTimes, { forceRefresh: true });
    setScheduleResult(result);
  }, [fetchTimes]);

  const reschedule = useCallback(async (force = false) => {
    const result = await smartReschedule(settingsRef.current, fetchTimes, { forceRefresh: force });
    setScheduleResult(result);
    if (times) {
      const report = await getDiagnosticReport(settingsRef.current);
      setDiagnostics(report);
    }
  }, [fetchTimes, times]);

  const sendTest = useCallback(() => sendTestNotification(), []);
  const cancelAll = useCallback(() => cancelAllPrayerNotifications(), []);

  return {
    settings,
    updateSettings,
    nextPrayer,
    scheduleResult,
    diagnostics,
    reschedule,
    sendTest,
    cancelAll,
  };
}
