"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Clock, MapPin, Bell, BellOff, Volume2, Settings2,
  RefreshCw, Globe, Calendar, X, Music, Wifi, WifiOff, Loader2,
} from "lucide-react";
import { useEditor } from "@/store/useEditor";
import { usePrayerNotifications } from "@/hooks/usePrayerNotifications";
import { PrayerSettingsSheet, MUEZZINS } from "@/components/PrayerSettingsSheet";
import { PrayerYearCalendarView } from "@/components/PrayerYearCalendarView";
import {
  type PrayerTimesData,
  type PrayerSettingsMap,
  type PrayerNotifSetting,
  type NextPrayerInfo,
  PRAYER_NAMES_AR,
} from "@/lib/prayerNotifications";
import {
  type PrayerYearCalendar,
  type PrayerLocationMeta,
  fetchFullCalendar,
  loadYearCalendar,
  loadLocationMeta,
  getTodayTimes,
  getNextPrayerFromCalendar,
  formatTimeDisplay,
  getTodayKey,
} from "@/lib/prayerCalendar";

function PrayerCountdown({
  calendar,
  settings,
}: {
  calendar: PrayerYearCalendar;
  settings: PrayerSettingsMap;
}) {
  const [next, setNext] = useState<NextPrayerInfo | null>(null);
  useEffect(() => {
    const tick = () => setNext(getNextPrayerFromCalendar(calendar, settings));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [calendar, settings]);

  if (!next) {
    return <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />;
  }

  return (
    <>
      <div className="flex items-center justify-center gap-2 mb-3 bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
        <Clock className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-black text-primary tracking-widest">القادمة: {next.nameAr}</span>
      </div>
      <h2 className="text-4xl md:text-6xl font-black tracking-widest text-foreground font-mono mb-2" dir="ltr">
        {next.inLabel}
      </h2>
      <p className="text-xs text-foreground/40 font-bold font-mono" dir="ltr">
        {next.date.toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
    </>
  );
}

export function PrayerTimes() {
  const [calendar, setCalendar] = useState<PrayerYearCalendar | null>(null);
  const [times, setTimes] = useState<PrayerTimesData | null>(null);
  const [clockLabel, setClockLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAthanSettings, setShowAthanSettings] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const [customCity, setCustomCity] = useState("Cairo");
  const [customCountry, setCustomCountry] = useState("Egypt");

  const { state: editorState, updateState: updateEditor } = useEditor();
  const activeSettingsPrayer = editorState.activeSettingsPrayer;
  const setActiveSettingsPrayer = (val: string | null) => updateEditor({ activeSettingsPrayer: val });

  const [draftPrayerSetting, setDraftPrayerSetting] = useState<PrayerNotifSetting | null>(null);

  const applyCalendar = useCallback((cal: PrayerYearCalendar) => {
    setCalendar(cal);
    const today = getTodayTimes(cal);
    if (today) setTimes(today);
  }, []);

  const syncCalendar = useCallback(async (meta: PrayerLocationMeta) => {
    setLoading(true);
    setSyncMessage("جاري تحميل تقويم السنة...");
    try {
      const cal = await fetchFullCalendar(meta, (msg) => setSyncMessage(msg));
      applyCalendar(cal);
      setSyncMessage(`تم حفظ ${Object.keys(cal.days).length} يوم محلياً`);
    } catch (e) {
      console.error(e);
      setSyncMessage("فشل التحميل — يُستخدم التقويم المحفوظ إن وُجد");
      const cached = loadYearCalendar();
      if (cached) applyCalendar(cached);
    } finally {
      setLoading(false);
    }
  }, [applyCalendar]);

  const fetchTimesQuiet = useCallback(async () => {
    const cached = loadYearCalendar();
    if (cached) {
      applyCalendar(cached);
      return getTodayTimes(cached);
    }
    const meta = loadLocationMeta() || { city: "Cairo", country: "Egypt", label: "القاهرة، مصر" };
    await syncCalendar(meta);
    return getTodayTimes(loadYearCalendar()!);
  }, [applyCalendar, syncCalendar]);

  const {
    settings: prayerSettings,
    updateSettings: setPrayerSettings,
    sendTest,
    diagnostics,
    refreshDiagnostics,
    reschedule,
  } = usePrayerNotifications(calendar, fetchTimesQuiet);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [nextPrayerId, setNextPrayerId] = useState("Fajr");

  useEffect(() => {
    const cached = loadYearCalendar();
    const meta = loadLocationMeta();
    if (cached) {
      applyCalendar(cached);
      setLoading(false);
      if (!meta || Date.now() - cached.fetchedAt > 7 * 86400000) {
        void syncCalendar(cached.meta);
      }
    } else {
      void syncCalendar({ city: "Cairo", country: "Egypt", label: "القاهرة، مصر" });
    }
  }, [applyCalendar, syncCalendar]);

  useEffect(() => {
    if (!calendar) return;
    const tick = () => {
      const n = getNextPrayerFromCalendar(calendar, prayerSettings);
      if (n?.id) setNextPrayerId(n.id);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [calendar, prayerSettings]);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClockLabel(
        n.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!activeSettingsPrayer || !prayerSettings[activeSettingsPrayer]) {
      setDraftPrayerSetting(null);
      return;
    }
    setDraftPrayerSetting({ ...prayerSettings[activeSettingsPrayer] });
  }, [activeSettingsPrayer, prayerSettings]);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let label = "موقعي الحالي";
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
          );
          const geoData = await geoRes.json();
          const name = geoData.address?.city || geoData.address?.town || geoData.address?.state || "موقعي";
          label = `${name}، ${geoData.address?.country || ""}`;
        } catch { /* ignore */ }
        await syncCalendar({ latitude, longitude, label });
      },
      () => setLoading(false)
    );
  };

  const locationLabel = calendar?.meta.label || "القاهرة، مصر";
  const dayCount = calendar ? Object.keys(calendar.days).length : 0;
  const isOfflineReady = dayCount > 300;

  const prayerCards = useMemo(() => {
    if (!times) return null;
    return Object.entries(PRAYER_NAMES_AR).map(([id, name]) => {
      const isNext = nextPrayerId === id;
      const time = times[id as keyof PrayerTimesData];
      const enabled = prayerSettings[id]?.enabled;
      return (
        <button
          type="button"
          key={id}
          onClick={() => setActiveSettingsPrayer(id)}
          className={`p-5 md:p-6 rounded-2xl border transition-colors flex flex-col items-center gap-2 w-full ${
            isNext ? "bg-primary border-primary text-black shadow-md" : "bg-card border-border hover:border-primary/30"
          }`}
        >
          <span className={`text-[10px] font-black uppercase tracking-widest ${isNext ? "text-black/60" : "text-foreground/40"}`}>
            {name}
          </span>
          <span className="text-2xl md:text-4xl font-black font-mono" dir="ltr">
            {formatTimeDisplay(time)}
          </span>
          <span className={`text-[10px] font-bold ${isNext ? "text-black/50" : "text-foreground/25"}`}>إعدادات</span>
          {enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5 opacity-40" />}
        </button>
      );
    });
  }, [times, nextPrayerId, prayerSettings, setActiveSettingsPrayer]);

  return (
    <div className="flex flex-col h-full p-4 md:p-8 pt-20 md:pt-12 overflow-y-auto overflow-x-hidden no-scrollbar font-arabic relative">
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-background via-background/95 to-background" />

      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <MapPin className="w-4 h-4" />
              <button type="button" onClick={() => setShowLocationPicker(true)} className="font-black text-sm hover:underline">
                {locationLabel}
              </button>
              {isOfflineReady ? (
                <span className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                  <WifiOff className="w-3 h-3" /> {dayCount} يوم محفوظ
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  <Wifi className="w-3 h-3" /> يحتاج مزامنة
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-mono text-foreground" dir="ltr">{clockLabel}</h1>
            {syncMessage && <p className="text-xs text-foreground/40 font-bold mt-1">{syncMessage}</p>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => calendar && syncCalendar(calendar.meta)}
              disabled={loading}
              className="p-3 rounded-xl bg-card border border-border hover:border-primary/30"
              title="تحديث التقويم"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            </button>
            <button type="button" onClick={detectLocation} className="p-3 rounded-xl bg-card border border-border" title="موقعي">
              <MapPin className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowAthanSettings(true)}
              className="px-4 py-3 rounded-xl bg-primary text-black font-black text-sm flex items-center gap-2"
            >
              <Music className="w-4 h-4" />
              المؤذن
            </button>
          </div>
        </div>

        {/* Countdown */}
        <div className="bg-card/90 border border-border rounded-[2rem] p-8 md:p-10 text-center shadow-lg">
          {calendar ? (
            <PrayerCountdown calendar={calendar} settings={prayerSettings} />
          ) : (
            <div className="py-6 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-bold text-foreground/40">تحميل جدول المواقيت...</p>
            </div>
          )}
          <div className="flex items-center justify-center gap-2 text-foreground/40 font-bold text-sm mt-4">
            <Calendar className="w-4 h-4" />
            <span>{new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </div>

        {/* Today prayers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
          {prayerCards ?? <p className="col-span-full text-center text-foreground/40 py-6">جاري التحميل...</p>}
        </div>

        {/* Test + diagnostics */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={async () => {
              const ok = await sendTest();
              alert(ok ? "تم إرسال إشعار تجريبي" : "فعّل الإشعارات");
            }}
            className="px-5 py-2.5 rounded-xl bg-primary text-black font-black text-sm"
          >
            تجربة إشعار
          </button>
          <button
            type="button"
            onClick={async () => {
              setShowDiagnostics((v) => !v);
              if (!showDiagnostics) await refreshDiagnostics();
            }}
            className="px-5 py-2.5 rounded-xl bg-card border border-border font-black text-sm"
          >
            حالة النظام
          </button>
          <button type="button" onClick={() => void reschedule(true)} className="px-5 py-2.5 rounded-xl bg-card border border-border font-black text-sm">
            إعادة جدولة
          </button>
        </div>
        {showDiagnostics && diagnostics && (
          <p className="text-center text-xs font-bold text-foreground/50">
            إذن: {diagnostics.permissionsGranted ? "نعم" : "لا"} — مجدول: {diagnostics.totalScheduledPending}
          </p>
        )}

        {/* Year calendar */}
        {calendar && <PrayerYearCalendarView calendar={calendar} />}
      </div>

      {showAthanSettings && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowAthanSettings(false)} />
          <div className="relative w-full max-w-md bg-[#0c1210] border border-white/10 rounded-[2rem] p-6 max-h-[80vh] overflow-y-auto">
            <button type="button" onClick={() => setShowAthanSettings(false)} className="absolute top-4 left-4 text-white/40"><X /></button>
            <h3 className="text-xl font-black text-white text-right mb-4">المؤذن لكل الصلوات</h3>
            {MUEZZINS.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => {
                  const newSet: PrayerSettingsMap = { ...prayerSettings };
                  Object.keys(newSet).forEach((k) => {
                    newSet[k] = { ...newSet[k], muezzinId: m.id };
                  });
                  void setPrayerSettings(newSet);
                  setShowAthanSettings(false);
                }}
                className={`w-full p-4 rounded-xl mb-2 text-right font-black ${
                  prayerSettings.Fajr?.muezzinId === m.id ? "bg-primary text-black" : "bg-white/5 text-white"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {showLocationPicker && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowLocationPicker(false)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-[2rem] p-6">
            <h3 className="text-xl font-black text-right mb-4">تغيير المنطقة</h3>
            <p className="text-xs text-foreground/40 font-bold text-right mb-4">سيُحمَّل تقويم السنة كاملاً ويُحفظ للعمل بدون إنترنت</p>
            <input
              value={customCity}
              onChange={(e) => setCustomCity(e.target.value)}
              placeholder="المدينة"
              className="w-full mb-3 p-4 rounded-xl bg-foreground/5 font-black"
            />
            <input
              value={customCountry}
              onChange={(e) => setCustomCountry(e.target.value)}
              placeholder="الدولة"
              className="w-full mb-4 p-4 rounded-xl bg-foreground/5 font-black"
            />
            <button
              type="button"
              onClick={() => {
                void syncCalendar({
                  city: customCity,
                  country: customCountry,
                  label: `${customCity}، ${customCountry}`,
                });
                setShowLocationPicker(false);
              }}
              className="w-full py-4 bg-primary text-black rounded-xl font-black"
            >
              تحميل وحفظ التقويم
            </button>
          </div>
        </div>
      )}

      {activeSettingsPrayer && draftPrayerSetting && (
        <PrayerSettingsSheet
          prayerId={activeSettingsPrayer}
          draft={draftPrayerSetting}
          onChange={setDraftPrayerSetting}
          onClose={() => setActiveSettingsPrayer(null)}
          onSave={() => {
            void setPrayerSettings({
              ...prayerSettings,
              [activeSettingsPrayer]: draftPrayerSetting,
            });
            setActiveSettingsPrayer(null);
          }}
          onTestSound={(file) => {
            if (audioRef.current) {
              audioRef.current.src = file;
              void audioRef.current.play();
            }
          }}
        />
      )}

      <audio ref={audioRef} onEnded={() => setIsPlayingTest(false)} />
    </div>
  );
}
