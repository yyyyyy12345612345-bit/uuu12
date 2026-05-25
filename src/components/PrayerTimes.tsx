"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Clock, MapPin, Bell, BellOff, Settings2,
  RefreshCw, Calendar, X, Music, Wifi, WifiOff, Loader2,
} from "lucide-react";
import { useEditor } from "@/store/useEditor";
import { usePrayerNotifications } from "@/hooks/usePrayerNotifications";
import { PrayerSettingsSheet, MUEZZINS } from "@/components/PrayerSettingsSheet";
import { PrayerYearCalendarView } from "@/components/PrayerYearCalendarView";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
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
    return (
      <div className="py-6 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="flex items-center justify-center gap-2 mb-3 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
        <Clock className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-black text-amber-400">الصلاة القادمة: {next.nameAr}</span>
      </div>
      <h2 className="text-4xl md:text-5xl font-black tracking-widest text-white font-mono mb-2 drop-shadow-[0_0_15px_rgba(251,191,36,0.1)]" dir="ltr">
        {next.inLabel}
      </h2>
      <p className="text-xs text-white/40 font-bold font-mono" dir="ltr">
        أذان {next.nameAr} في تمام الساعة {next.date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
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
  const [showDevSettings, setShowDevSettings] = useState(false);

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
    const id = setInterval(tick, 10000);
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

  const detectLocation = async () => {
    setLoading(true);
    setSyncMessage("جاري تحديد موقعك...");
    try {
      let latitude = 0;
      let longitude = 0;

      if (Capacitor.isNativePlatform()) {
        const permStatus = await Geolocation.checkPermissions();
        let finalPerm = permStatus.location;
        if (finalPerm !== 'granted') {
          const requestStatus = await Geolocation.requestPermissions();
          finalPerm = requestStatus.location;
        }
        if (finalPerm !== 'granted') {
          throw new Error("صلاحية الموقع مطلوبة لتحديد مواقيت الصلاة بدقة.");
        }
        const pos = await Geolocation.getCurrentPosition();
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } else {
        if (!navigator.geolocation) {
          throw new Error("متصفحك لا يدعم تحديد الموقع الجغرافي.");
        }
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      }

      let label = "موقعي الحالي";
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
        );
        const geoData = await geoRes.json();
        if (geoData && geoData.address) {
          const name = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.state || "موقعي";
          label = `${name}، ${geoData.address.country || ""}`;
        }
      } catch (err) {
        console.warn("Reverse geocode failed", err);
      }

      await syncCalendar({ latitude, longitude, label });
      setSyncMessage(`تم تحديث المواقيت لـ: ${label}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "فشل تحديد الموقع");
      setSyncMessage("فشل تحديد الموقع");
    } finally {
      setLoading(false);
    }
  };

  const locationLabel = calendar?.meta.label || "القاهرة، مصر";
  const dayCount = calendar ? Object.keys(calendar.days).length : 0;
  const isOfflineReady = dayCount > 300;

  const CARD_BG = "bg-[#0b0f19]/80 backdrop-blur-xl border border-white/[0.06] rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group";
  const LABEL = "text-[10px] font-black text-[#d4af37] uppercase tracking-[0.2em]";
  const INPUT_CLASS = "w-full bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 text-sm text-white outline-none placeholder:text-white/20 text-right focus:border-[#fbbf24]/40 transition";

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
          className={`p-4 md:p-5 rounded-[2rem] border transition-all duration-300 flex flex-col items-center gap-2 min-h-[145px] w-full text-center relative overflow-hidden group ${
            isNext
              ? "bg-gradient-to-br from-amber-400 to-orange-500 border-amber-500 text-black shadow-lg shadow-amber-500/20 scale-105 z-10"
              : "bg-[#0c0f19]/60 border-white/[0.05] hover:border-amber-500/30 hover:-translate-y-1 text-white"
          }`}
        >
          {isNext && (
            <span className="absolute -inset-1 rounded-full border border-amber-500 animate-pulse opacity-20" />
          )}
          <span className={`text-[10px] font-black uppercase tracking-widest ${isNext ? "text-black/60" : "text-white/30"}`}>
            {name}
          </span>
          <span className="text-2xl md:text-3xl font-black font-mono tracking-tight" dir="ltr">
            {formatTimeDisplay(time)}
          </span>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`text-[9px] font-bold ${isNext ? "text-black/40" : "text-white/20"}`}>خيارات التنبيه</span>
            {enabled ? (
              <Bell className={`w-3.5 h-3.5 ${isNext ? "text-black" : "text-amber-400 animate-swing"}`} />
            ) : (
              <BellOff className={`w-3.5 h-3.5 opacity-40 ${isNext ? "text-black/40" : "text-white/30"}`} />
            )}
          </div>
        </button>
      );
    });
  }, [times, nextPrayerId, prayerSettings, setActiveSettingsPrayer]);

  return (
    <div className="flex flex-col h-full p-4 md:p-6 pt-18 md:pt-12 overflow-y-auto overflow-x-hidden no-scrollbar font-arabic relative">
      <div className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#0b0f1a] via-[#0b0f1a]/95 to-[#0b0f1a]" />

      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 relative z-10">
        
        {/* Top Info Card */}
        <div className={CARD_BG}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.06),_transparent_40%)] opacity-90" />
          <div className="relative grid gap-5 lg:grid-cols-[1.3fr_0.7fr] items-center">
            <div className="space-y-3.5 text-right lg:text-right">
              <div className="flex flex-wrap items-center gap-3 justify-start lg:justify-start text-xs font-black uppercase tracking-[0.2em] text-amber-500">
                <MapPin className="w-4 h-4" />
                <span className="text-white/90 font-bold">{locationLabel}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 px-3.5 py-1 text-[10px] text-white/70">
                  {isOfflineReady ? (
                    <><WifiOff className="w-3.5 h-3.5 text-emerald-400" /> {dayCount} يوم محفوظ</>
                  ) : (
                    <><Wifi className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> يحتاج مزامنة</>
                  )}
                </span>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-white/30 font-bold">الوقت الحالي</p>
                <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.03)] font-mono" dir="ltr">
                  {clockLabel}
                </h1>
                <p className="text-xs text-white/40 leading-relaxed font-bold">
                  مواقيت الصلاة محفوظة محليًا وتشتغل بدون إنترنت. اضغط على "موقعي" لتحديث الموقع بدقة أكبر.
                </p>
              </div>
            </div>
            
            <div className="grid gap-2.5">
              <button
                type="button"
                onClick={() => calendar && syncCalendar(calendar.meta)}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-xs font-black text-white hover:bg-white/10 hover:border-amber-500/30 transition-all disabled:opacity-50"
                title="تحديث التقويم"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <RefreshCw className="w-4 h-4" />}
                تحديث المواقيت
              </button>
              <button
                type="button"
                onClick={detectLocation}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-xs font-black text-white hover:bg-white/10 hover:border-amber-500/30 transition-all disabled:opacity-50"
                title="موقعي"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                تحديد موقعي (GPS)
              </button>
              <button
                type="button"
                onClick={() => setShowAthanSettings(true)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3.5 text-xs font-black text-black shadow-lg shadow-amber-500/10 hover:brightness-110 active:scale-98 transition-all"
              >
                <Music className="w-4 h-4" />
                إعداد الأذان الموحد
              </button>
            </div>
          </div>
          {syncMessage && (
            <div className="mt-4 border-t border-white/[0.04] pt-3 text-center">
              <span className="text-[11px] font-bold text-amber-500/80 bg-amber-500/5 px-4 py-1.5 rounded-full border border-amber-500/10 inline-block animate-premium-in">
                {syncMessage}
              </span>
            </div>
          )}
        </div>

        {/* Countdown */}
        <div className="bg-[#0b0f19]/80 border border-white/[0.06] rounded-[2.5rem] p-6 md:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none" />
          {calendar ? (
            <PrayerCountdown calendar={calendar} settings={prayerSettings} />
          ) : (
            <div className="py-6 flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs font-bold text-white/40">جاري تحميل جدول المواقيت...</p>
            </div>
          )}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/50">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </div>

        {/* Today prayers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {prayerCards ?? <p className="col-span-full text-center text-white/30 py-6">جاري التحميل...</p>}
        </div>

        {/* Year calendar */}
        {calendar && <PrayerYearCalendarView calendar={calendar} />}

        {/* Collapsible Advanced Settings (Developer/Diagnostics) */}
        <div className="mt-6 border-t border-white/5 pt-6 flex flex-col items-center">
          <button 
            type="button" 
            onClick={() => setShowDevSettings(!showDevSettings)}
            className="text-[10px] font-black text-white/30 hover:text-white/60 transition flex items-center gap-2"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{showDevSettings ? "إخفاء خيارات المطورين" : "عرض خيارات المطورين والتنبيهات"}</span>
          </button>
          
          {showDevSettings && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center animate-premium-in">
              <button
                type="button"
                onClick={async () => {
                  const ok = await sendTest();
                  alert(ok ? "تم إرسال إشعار تجريبي بنجاح!" : "يرجى تفعيل صلاحية الإشعارات أولاً.");
                }}
                className="px-4 py-2 text-[11px] font-black rounded-xl bg-amber-500 text-black transition hover:brightness-110 shadow-lg shadow-amber-500/5"
              >
                إرسال إشعار تجريبي
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDiagnostics((v) => !v);
                  if (!showDiagnostics) await refreshDiagnostics();
                }}
                className="px-4 py-2 text-[11px] font-black rounded-xl bg-white/5 border border-white/10 text-white transition hover:bg-white/10"
              >
                فحص حالة النظام
              </button>
              <button 
                type="button" 
                onClick={() => void reschedule(true)} 
                className="px-4 py-2 text-[11px] font-black rounded-xl bg-white/5 border border-white/10 text-white transition hover:bg-white/10"
              >
                إعادة جدولة الأذان
              </button>
            </div>
          )}
          {showDiagnostics && diagnostics && (
            <p className="mt-3 text-center text-[10px] font-bold text-white/40 leading-relaxed">
              صلاحية النظام: {diagnostics.permissionsGranted ? "مفعّلة" : "غير مفعّلة"} — التنبيهات المجدولة في الانتظار: {diagnostics.totalScheduledPending}
            </p>
          )}
        </div>
      </div>

      {/* Adhan settings dialog */}
      {showAthanSettings && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setShowAthanSettings(false)} />
          <div className="relative w-full max-w-sm bg-[#0c0f19] border border-white/10 rounded-[2.5rem] p-6 max-h-[80vh] overflow-y-auto shadow-2xl text-right animate-in zoom-in-95 duration-300">
            <button type="button" onClick={() => setShowAthanSettings(false)} className="absolute top-5 left-5 text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-black text-white mb-4 pr-1">المؤذن الافتراضي لكل الصلوات</h3>
            <div className="space-y-2 mt-4">
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
                  className={`w-full p-4 rounded-xl text-right font-black text-xs transition-all flex items-center justify-between ${
                    prayerSettings.Fajr?.muezzinId === m.id 
                      ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black" 
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <span>{m.name}</span>
                  <span className="text-[10px] opacity-60 font-bold">{m.muezzinName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Location Picker Dialog */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setShowLocationPicker(false)} />
          <div className="relative w-full max-w-sm bg-[#0c0f19] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl text-right animate-in zoom-in-95 duration-300">
            <button type="button" onClick={() => setShowLocationPicker(false)} className="absolute top-5 left-5 text-white/40 hover:text-white transition"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-black text-white mb-1">تغيير المنطقة يدوياً</h3>
            <p className="text-[11px] text-white/40 font-bold mb-4">سيُحمَّل تقويم السنة كاملاً ويُحفظ للعمل بدون إنترنت</p>
            <div className="space-y-3">
              <input
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="المدينة (مثال: Banha)"
                className={INPUT_CLASS}
              />
              <input
                value={customCountry}
                onChange={(e) => setCustomCountry(e.target.value)}
                placeholder="الدولة (مثال: Egypt)"
                className={INPUT_CLASS}
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
                className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-xl font-black text-sm shadow-lg shadow-amber-500/10 hover:brightness-110 transition-all"
              >
                تحميل وحفظ التقويم
              </button>
            </div>
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
