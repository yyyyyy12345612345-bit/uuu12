"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  Clock, MapPin, Bell, BellOff, Volume2, Settings2, 
  RefreshCw, Globe, Calendar, X, Music
} from "lucide-react";
import { useEditor } from "@/store/useEditor";
import { usePrayerNotifications } from "@/hooks/usePrayerNotifications";
import {
  type PrayerTimesData,
  type PrayerSettingsMap,
  type PrayerNotifSetting,
  type NextPrayerInfo,
  PRAYER_NAMES_AR,
  loadCachedTimes,
  getNextPrayer,
} from "@/lib/prayerNotifications";

function PrayerCountdown({
  times,
  settings,
}: {
  times: PrayerTimesData;
  settings: PrayerSettingsMap;
}) {
  const [next, setNext] = useState<NextPrayerInfo | null>(null);
  useEffect(() => {
    const tick = () => setNext(getNextPrayer(times, settings));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [times, settings]);
  if (!next) {
    return <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />;
  }
  return (
    <>
      <div className="flex items-center gap-2 mb-3 bg-primary/10 px-4 py-1 rounded-full border border-primary/20">
        <Clock className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-black text-primary uppercase tracking-widest">القادمة: {next.nameAr}</span>
      </div>
      <h2 className="text-4xl md:text-7xl font-black tracking-widest text-foreground font-mono mb-4">{next.inLabel}</h2>
    </>
  );
}

const MUEZZINS = [
  { id: "haram", name: "الحرم المكي - الشيخ علي الملا", file: "/adhan/الحرم المكي.mp3" },
  { id: "naqshandi", name: "الشيخ سيد النقشبندي", file: "/adhan/الشيخ سيد النقشبندى.p3.mp3" },
  { id: "rifat", name: "الشيخ محمد رفعت", file: "/adhan/الشيخ محمد رفعت.mp3" },
];

export function PrayerTimes() {
  const [times, setTimes] = useState<PrayerTimesData | null>(null);
  const [clockLabel, setClockLabel] = useState("");
  const [locationName, setLocationName] = useState("القاهرة، مصر");
  const [loading, setLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAthanSettings, setShowAthanSettings] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  const [customCity, setCustomCity] = useState("");
  const [customCountry, setCustomCountry] = useState("");

  const { state: editorState, updateState: updateEditor } = useEditor();
  const activeSettingsPrayer = editorState.activeSettingsPrayer;
  const setActiveSettingsPrayer = (val: string | null) => updateEditor({ activeSettingsPrayer: val });

  const [draftPrayerSetting, setDraftPrayerSetting] = useState<PrayerNotifSetting | null>(null);

  const fetchTimesApi = useCallback(async (
    city: string,
    country: string,
    lat?: number,
    lon?: number,
    options?: { silent?: boolean }
  ): Promise<PrayerTimesData | null> => {
    if (!options?.silent) setLoading(true);
    try {
      let url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=5`;
      if (lat != null && lon != null) {
        url = `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=5`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.code === 200) {
        const timings = data.data.timings as PrayerTimesData;
        setTimes(timings);
        localStorage.setItem("prayer_location_cache", `${city}، ${country}`);
        if (!lat) setLocationName(`${city}، ${country}`);
        return timings;
      }
    } catch (err) {
      console.error("Prayer times fetch failed", err);
      const cached = loadCachedTimes();
      if (cached) {
        setTimes(cached.times);
        return cached.times;
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
    return null;
  }, []);

  const fetchTimesQuiet = useCallback(
    () => fetchTimesApi("Cairo", "Egypt", undefined, undefined, { silent: true }),
    [fetchTimesApi]
  );

  const [nextPrayerId, setNextPrayerId] = useState<string>("Fajr");

  const {
    settings: prayerSettings,
    updateSettings: setPrayerSettings,
    sendTest,
    diagnostics,
    refreshDiagnostics,
    reschedule,
  } = usePrayerNotifications(times, fetchTimesQuiet);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await fetchTimesApi("", "", latitude, longitude);
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`
          );
          const geoData = await geoRes.json();
          const name = geoData.address?.city || geoData.address?.town || geoData.address?.state || "موقعي";
          setLocationName(`${name}، ${geoData.address?.country || ""}`);
        } catch {
          setLocationName("موقعي الحالي");
        }
      },
      () => setLoading(false)
    );
  };

  useEffect(() => {
    const cachedLoc = localStorage.getItem("prayer_location_cache");
    if (cachedLoc) setLocationName(cachedLoc);
    const cached = loadCachedTimes();
    if (cached) setTimes(cached.times);
    void fetchTimesApi("Cairo", "Egypt");
  }, [fetchTimesApi]);

  useEffect(() => {
    if (!times) return;
    const tick = () => {
      const n = getNextPrayer(times, prayerSettings);
      if (n?.id) setNextPrayerId(n.id);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [times, prayerSettings]);

  // ساعة واحدة — بدون إعادة رسم الصفحة كل ثانية
  useEffect(() => {
    const tick = () => {
      setClockLabel(
        new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeSettingsPrayer || !prayerSettings[activeSettingsPrayer]) {
      setDraftPrayerSetting(null);
      return;
    }
    setDraftPrayerSetting({ ...prayerSettings[activeSettingsPrayer] });
  }, [activeSettingsPrayer, prayerSettings]);

  const applyDraftAndClose = async () => {
    if (!activeSettingsPrayer || !draftPrayerSetting) return;
    await setPrayerSettings({
      ...prayerSettings,
      [activeSettingsPrayer]: draftPrayerSetting,
    });
    setActiveSettingsPrayer(null);
  };

  const toggleTestAthan = () => {
    if (!audioRef.current) return;
    if (isPlayingTest) {
      audioRef.current.pause();
      setIsPlayingTest(false);
    } else {
      const muezzinId = prayerSettings[nextPrayerId]?.muezzinId || "haram";
      const muezzin = MUEZZINS.find((m) => m.id === muezzinId) || MUEZZINS[0];
      audioRef.current.src = muezzin.file;
      void audioRef.current.play();
      setIsPlayingTest(true);
    }
  };

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
          className={`p-6 md:p-8 rounded-[2rem] border transition-colors cursor-pointer flex flex-col items-center gap-3 w-full ${
            isNext
              ? "bg-primary border-primary/40 text-black shadow-lg"
              : "bg-card border-border hover:border-primary/30 text-foreground"
          }`}
        >
          <span className={`text-xs font-black uppercase tracking-widest ${isNext ? "text-black/70" : "text-foreground/40"}`}>
            {name}
          </span>
          <span className="text-2xl md:text-3xl font-black font-mono">{time}</span>
          <span className={`text-[10px] font-bold ${isNext ? "text-black/60" : "text-foreground/30"}`}>
            اضغط للإعدادات
          </span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isNext ? "bg-black/10" : "bg-foreground/5"}`}>
            {enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4 opacity-40" />}
          </div>
        </button>
      );
    });
  }, [times, nextPrayerId, prayerSettings, setActiveSettingsPrayer]);

  return (
    <div className="flex flex-col h-full p-4 md:p-10 pt-20 md:pt-14 overflow-y-auto overflow-x-hidden no-scrollbar font-arabic relative bg-transparent">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/40 to-background" />
        <div className="absolute inset-0 mushaf-pattern opacity-[0.06]" />
      </div>

      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 md:gap-8 relative z-10">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center md:justify-end gap-2 text-primary mb-1">
              <MapPin className="w-4 h-4" />
              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                className="text-base font-black hover:opacity-70 transition-opacity underline decoration-primary/20 underline-offset-4"
              >
                {locationName}
              </button>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground font-mono">
              {clockLabel}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={detectLocation}
              className="p-4 rounded-2xl bg-card border border-border shadow-lg hover:text-primary transition-colors active:scale-95"
              aria-label="تحديث الموقع"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowAthanSettings(true)}
              className="flex items-center gap-3 p-4 rounded-2xl bg-primary text-black shadow-lg hover:scale-[1.02] active:scale-95 transition-transform"
            >
              <Music className="w-5 h-5 text-black" />
              <span className="font-black text-sm">صوت الآذان العام</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="relative bg-card/80 border border-border rounded-[2.5rem] p-8 md:p-12 flex flex-col items-center justify-center text-center shadow-lg">
            {times ? (
              <>
                <PrayerCountdown times={times} settings={prayerSettings} />
                <div className="flex items-center gap-2 text-foreground/40 font-bold text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}</span>
                </div>
              </>
            ) : (
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {prayerCards ?? (
            <div className="col-span-full py-8 text-center text-foreground/40 font-bold">جاري تحميل المواقيت...</div>
          )}
        </div>

        <div className="bg-card border border-border p-5 md:p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Volume2 className="w-6 h-6 text-primary" />
            </div>
            <div className="text-right">
              <h4 className="text-base font-black">تجربة صوت الأذان</h4>
              <p className="text-xs text-foreground/40 font-bold line-clamp-1">
                {MUEZZINS.find((m) => m.id === (prayerSettings[nextPrayerId]?.muezzinId))?.name || MUEZZINS[0].name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTestAthan}
            className={`px-6 py-3 rounded-2xl font-black text-sm transition-colors ${isPlayingTest ? "bg-red-500/10 text-red-500" : "bg-primary text-black"}`}
          >
            {isPlayingTest ? "إيقاف" : "تشغيل"}
          </button>
        </div>

        <div className="bg-card border border-border p-6 rounded-[2rem] flex flex-col gap-4 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-right">
              <Settings2 className="w-8 h-8 text-primary shrink-0" />
              <div>
                <h4 className="text-lg font-black">الإشعارات والتجربة</h4>
                <p className="text-xs text-foreground/40 font-bold">اضغط أي صلاة أعلاه لتخصيصها</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                type="button"
                onClick={async () => {
                  const success = await sendTest();
                  alert(success ? "تم إرسال إشعار تجريبي" : "فعّل صلاحية الإشعارات أولاً");
                }}
                className="px-5 py-3 bg-primary text-black font-black rounded-xl text-sm"
              >
                تجربة إشعار
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDiagnostics((v) => !v);
                  if (!showDiagnostics) await refreshDiagnostics();
                }}
                className="px-5 py-3 bg-foreground/5 border border-border font-black rounded-xl text-sm"
              >
                {showDiagnostics ? "إخفاء التشخيص" : "حالة النظام"}
              </button>
              <button
                type="button"
                onClick={() => void reschedule(true)}
                className="px-5 py-3 bg-foreground/5 border border-border font-black rounded-xl text-sm"
              >
                إعادة الجدولة
              </button>
            </div>
          </div>

          {showDiagnostics && diagnostics && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border/40 pt-4 text-right text-sm">
              <div className="p-4 rounded-xl bg-foreground/[0.03] border border-border/30">
                <span className="text-[10px] text-foreground/40 font-black block mb-1">الإذن</span>
                <span className={diagnostics.permissionsGranted ? "text-green-600 font-black" : "text-amber-600 font-black"}>
                  {diagnostics.permissionsGranted ? "مفعّل" : "غير مفعّل"}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-foreground/[0.03] border border-border/30">
                <span className="text-[10px] text-foreground/40 font-black block mb-1">مجدول</span>
                <span className="font-black">{diagnostics.totalScheduledPending} إشعار</span>
              </div>
              <div className="p-4 rounded-xl bg-foreground/[0.03] border border-border/30">
                <span className="text-[10px] text-foreground/40 font-black block mb-1">آخر جدولة</span>
                <span className="font-mono text-xs" dir="ltr">{diagnostics.lastScheduleDate || "—"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAthanSettings && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowAthanSettings(false)} />
          <div className="relative w-full max-w-xl bg-card border border-border rounded-[2rem] p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button type="button" onClick={() => setShowAthanSettings(false)} className="absolute top-6 left-6 text-foreground/30"><X /></button>
            <h3 className="text-2xl font-black text-center mb-6">المؤذن لكل الصلوات</h3>
            <div className="space-y-3">
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
                  className={`w-full p-4 rounded-2xl border text-right font-black ${
                    prayerSettings.Fajr?.muezzinId === m.id ? "bg-primary text-black border-primary" : "bg-foreground/5"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showLocationPicker && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowLocationPicker(false)} />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-[2rem] p-8 shadow-2xl">
            <button type="button" onClick={() => setShowLocationPicker(false)} className="absolute top-6 left-6"><X /></button>
            <h3 className="text-2xl font-black text-center mb-6">تغيير المنطقة</h3>
            <div className="space-y-4">
              <input
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                placeholder="المدينة"
                className="w-full bg-foreground/5 rounded-2xl py-4 px-6 font-black outline-none focus:border-primary border border-transparent"
              />
              <input
                value={customCountry}
                onChange={(e) => setCustomCountry(e.target.value)}
                placeholder="الدولة"
                className="w-full bg-foreground/5 rounded-2xl py-4 px-6 font-black outline-none focus:border-primary border border-transparent"
              />
              <button
                type="button"
                onClick={() => {
                  void fetchTimesApi(customCity || "Cairo", customCountry || "Egypt");
                  setShowLocationPicker(false);
                }}
                className="w-full py-4 bg-primary text-black rounded-2xl font-black"
              >
                تحديث
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSettingsPrayer && draftPrayerSetting && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black/80" onClick={() => setActiveSettingsPrayer(null)} />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-[2rem] p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button type="button" onClick={() => setActiveSettingsPrayer(null)} className="absolute top-6 left-6"><X /></button>
            
            <h3 className="text-2xl font-black text-center mb-1">
              إعدادات {PRAYER_NAMES_AR[activeSettingsPrayer]}
            </h3>
            <p className="text-center text-xs text-foreground/40 font-bold mb-6">تنبيه · صوت · فرق الدقائق · مؤذن</p>

            <div className="space-y-4 text-right">
              <label className="flex items-center justify-between p-4 rounded-2xl bg-foreground/5 border border-border/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftPrayerSetting.enabled}
                  onChange={(e) => setDraftPrayerSetting({ ...draftPrayerSetting, enabled: e.target.checked })}
                  className="w-5 h-5 accent-primary"
                />
                <span className="font-black">تفعيل التنبيه</span>
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl bg-foreground/5 border border-border/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftPrayerSetting.soundEnabled}
                  onChange={(e) => setDraftPrayerSetting({ ...draftPrayerSetting, soundEnabled: e.target.checked })}
                  className="w-5 h-5 accent-primary"
                />
                <span className="font-black">تشغيل صوت الأذان</span>
              </label>

              <div className="p-4 rounded-2xl bg-foreground/5 border border-border/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-primary font-black" dir="ltr">
                    {draftPrayerSetting.offset > 0 ? `+${draftPrayerSetting.offset}` : draftPrayerSetting.offset} د
                  </span>
                  <span className="font-black text-sm">فرق التوقيت (دقيقة)</span>
                </div>
                <input
                  type="range"
                  min={-60}
                  max={60}
                  value={draftPrayerSetting.offset}
                  onChange={(e) =>
                    setDraftPrayerSetting({ ...draftPrayerSetting, offset: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-primary"
                />
              </div>

              <p className="text-xs font-black text-foreground/40 mr-1">المؤذن لهذه الصلاة</p>
              <div className="space-y-2">
                {MUEZZINS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setDraftPrayerSetting({ ...draftPrayerSetting, muezzinId: m.id })}
                    className={`w-full p-3 rounded-xl border text-right font-black text-sm ${
                      draftPrayerSetting.muezzinId === m.id ? "bg-primary text-black" : "bg-foreground/5"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const muezzin = MUEZZINS.find((m) => m.id === (draftPrayerSetting.muezzinId || "haram")) || MUEZZINS[0];
                    if (audioRef.current) {
                      audioRef.current.src = muezzin.file;
                      void audioRef.current.play();
                    }
                  }}
                  className="flex-1 py-3 rounded-xl bg-foreground/10 font-black text-sm"
                >
                  تجربة الصوت
                </button>
                <button
                  type="button"
                  onClick={() => void applyDraftAndClose()}
                  className="flex-1 py-3 rounded-xl bg-primary text-black font-black text-sm"
                >
                  حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} onEnded={() => setIsPlayingTest(false)} />
    </div>
  );
}
