"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  MapPin, Bell, BellOff,
  RefreshCw, X, Music, Wifi, WifiOff, Loader2, Navigation,
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

/* ─── Prayer Icons ─── */
const PRAYER_ICONS: Record<string, React.ReactNode> = {
  Fajr: (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <path d="M24 8 C15 8 8 15 8 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M16 12 C12 16 10 20 10 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <circle cx="38" cy="10" r="1.5" fill="currentColor" opacity="0.8"/>
      <circle cx="42" cy="18" r="1" fill="currentColor" opacity="0.6"/>
      <circle cx="34" cy="6" r="1" fill="currentColor" opacity="0.7"/>
      <path d="M6 28 L42 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M4 32 L44 32" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.15"/>
    </svg>
  ),
  Sunrise: (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <circle cx="24" cy="20" r="7" fill="currentColor" opacity="0.9"/>
      <path d="M24 6 L24 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M10 20 L6 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M14 10 L11 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M34 10 L37 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M4 32 L44 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <path d="M12 28 L36 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M20 38 L24 32 L28 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Dhuhr: (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <circle cx="24" cy="24" r="9" fill="currentColor" opacity="0.95"/>
      <path d="M24 4 L24 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 38 L24 44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M4 24 L10 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M38 24 L44 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M9 9 L13 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M35 35 L39 39" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M35 13 L39 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M9 39 L13 35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  ),
  Asr: (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <circle cx="24" cy="22" r="7" fill="currentColor" opacity="0.85"/>
      <path d="M24 6 L24 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M38 22 L43 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M34 12 L38 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M4 38 L44 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      <path d="M4 42 L44 42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
    </svg>
  ),
  Maghrib: (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <path d="M8 28 A16 16 0 0 1 40 28" fill="currentColor" opacity="0.9"/>
      <path d="M4 30 L44 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <path d="M4 34 L44 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
      <path d="M24 8 L24 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
      <path d="M10 14 L14 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M38 14 L34 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  Isha: (
    <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
      <path d="M24 10 C16 10 10 17 10 25 C10 33 16 39 24 39 C18 36 14 30 14 24 C14 17 19 11 26 10 C25.3 10 24.7 10 24 10Z" fill="currentColor" opacity="0.9"/>
      <circle cx="36" cy="12" r="1.5" fill="currentColor" opacity="0.8"/>
      <circle cx="40" cy="20" r="1" fill="currentColor" opacity="0.6"/>
      <circle cx="34" cy="8" r="1" fill="currentColor" opacity="0.7"/>
      <circle cx="38" cy="30" r="1" fill="currentColor" opacity="0.5"/>
    </svg>
  ),
};

/* ─── Countdown Component ─── */
function PrayerCountdown({ calendar, settings }: { calendar: PrayerYearCalendar; settings: PrayerSettingsMap }) {
  const [next, setNext] = useState<NextPrayerInfo | null>(null);

  useEffect(() => {
    const tick = () => setNext(getNextPrayerFromCalendar(calendar, settings));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [calendar, settings]);

  if (!next) return <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />;

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-xs font-black text-amber-400/70 uppercase tracking-[0.3em]">الصلاة القادمة</span>
      <h3 className="text-2xl font-black text-white font-arabic">{next.nameAr}</h3>
      <div className="font-mono text-5xl md:text-6xl font-black text-white tracking-widest" dir="ltr"
        style={{ textShadow: "0 0 40px rgba(212,175,55,0.4)" }}>
        {next.inLabel}
      </div>
      <p className="text-xs text-white/30 font-bold">
        في تمام الساعة {next.date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}

/* ─── Main Component ─── */
export function PrayerTimes() {
  const [calendar, setCalendar] = useState<PrayerYearCalendar | null>(null);
  const [times, setTimes] = useState<PrayerTimesData | null>(null);
  const [clockLabel, setClockLabel] = useState("");
  const [clockParts, setClockParts] = useState({ hh: "00", mm: "00", ss: "00" });
  const [loading, setLoading] = useState(true);
  const [syncMessage, setSyncMessage] = useState("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showAthanSettings, setShowAthanSettings] = useState(false);

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
      setSyncMessage("فشل التحميل — يُستخدم التقويم المحفوظ");
      const cached = loadYearCalendar();
      if (cached) applyCalendar(cached);
    } finally {
      setLoading(false);
    }
  }, [applyCalendar]);

  const fetchTimesQuiet = useCallback(async () => {
    const cached = loadYearCalendar();
    if (cached) { applyCalendar(cached); return getTodayTimes(cached); }
    const meta = loadLocationMeta() || { city: "Cairo", country: "Egypt", label: "القاهرة، مصر" };
    await syncCalendar(meta);
    return getTodayTimes(loadYearCalendar()!);
  }, [applyCalendar, syncCalendar]);

  const { settings: prayerSettings, updateSettings: setPrayerSettings } =
    usePrayerNotifications(calendar, fetchTimesQuiet);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [nextPrayerId, setNextPrayerId] = useState("Fajr");

  useEffect(() => {
    const cached = loadYearCalendar();
    const meta = loadLocationMeta();
    if (cached) {
      applyCalendar(cached);
      setLoading(false);
      if (!meta || Date.now() - cached.fetchedAt > 7 * 86400000) void syncCalendar(cached.meta);
    } else {
      void syncCalendar({ city: "Cairo", country: "Egypt", label: "القاهرة، مصر" });
    }
  }, [applyCalendar, syncCalendar]);

  useEffect(() => {
    if (!calendar) return;
    const tick = () => { const n = getNextPrayerFromCalendar(calendar, prayerSettings); if (n?.id) setNextPrayerId(n.id); };
    tick();
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [calendar, prayerSettings]);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const hh = n.getHours().toString().padStart(2, "0");
      const mm = n.getMinutes().toString().padStart(2, "0");
      const ss = n.getSeconds().toString().padStart(2, "0");
      setClockParts({ hh, mm, ss });
      setClockLabel(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!activeSettingsPrayer || !prayerSettings[activeSettingsPrayer]) { setDraftPrayerSetting(null); return; }
    setDraftPrayerSetting({ ...prayerSettings[activeSettingsPrayer] });
  }, [activeSettingsPrayer, prayerSettings]);

  const detectLocation = async () => {
    setLoading(true);
    setSyncMessage("جاري تحديد موقعك...");
    try {
      let latitude = 0, longitude = 0;
      if (Capacitor.isNativePlatform()) {
        const permStatus = await Geolocation.checkPermissions();
        let finalPerm = permStatus.location;
        if (finalPerm !== "granted") { const r = await Geolocation.requestPermissions(); finalPerm = r.location; }
        if (finalPerm !== "granted") throw new Error("صلاحية الموقع مطلوبة.");
        const pos = await Geolocation.getCurrentPosition();
        latitude = pos.coords.latitude; longitude = pos.coords.longitude;
      } else {
        if (!navigator.geolocation) throw new Error("متصفحك لا يدعم تحديد الموقع.");
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        latitude = pos.coords.latitude; longitude = pos.coords.longitude;
      }
      let label = "موقعي الحالي";
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
        const geoData = await geoRes.json();
        if (geoData?.address) {
          const name = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.state || "موقعي";
          label = `${name}، ${geoData.address.country || ""}`;
        }
      } catch { }
      await syncCalendar({ latitude, longitude, label });
      setSyncMessage(`تم التحديث لـ: ${label}`);
    } catch (err: any) {
      alert(err.message || "فشل تحديد الموقع");
      setSyncMessage("فشل تحديد الموقع");
    } finally { setLoading(false); }
  };

  const locationLabel = calendar?.meta.label || "القاهرة، مصر";
  const dayCount = calendar ? Object.keys(calendar.days).length : 0;
  const isOfflineReady = dayCount > 300;

  const PRAYER_COLORS: Record<string, { bg: string; glow: string; icon: string; grad: string }> = {
    Fajr:    { bg: "#0f1626", glow: "rgba(99,130,201,0.4)",  icon: "#93b4ff", grad: "from-blue-900/60 to-indigo-900/40" },
    Sunrise: { bg: "#1a1008", glow: "rgba(251,146,60,0.4)",  icon: "#fb923c", grad: "from-orange-900/60 to-amber-900/40" },
    Dhuhr:   { bg: "#1a1400", glow: "rgba(253,224,71,0.4)",  icon: "#fde047", grad: "from-yellow-900/60 to-amber-900/40" },
    Asr:     { bg: "#1a0e00", glow: "rgba(234,179,8,0.4)",   icon: "#eab308", grad: "from-amber-900/60 to-yellow-900/40" },
    Maghrib: { bg: "#1a0a0a", glow: "rgba(239,68,68,0.4)",   icon: "#f87171", grad: "from-red-900/60 to-rose-900/40" },
    Isha:    { bg: "#0d0d1a", glow: "rgba(139,92,246,0.4)",  icon: "#a78bfa", grad: "from-violet-900/60 to-purple-900/40" },
  };

  const nextPrayerColor = PRAYER_COLORS[nextPrayerId] || PRAYER_COLORS.Fajr;

  const prayerCards = useMemo(() => {
    if (!times) return null;
    return Object.entries(PRAYER_NAMES_AR).map(([id, name]) => {
      const isNext = nextPrayerId === id;
      const time = times[id as keyof PrayerTimesData];
      const enabled = prayerSettings[id]?.enabled;
      const colors = PRAYER_COLORS[id] || PRAYER_COLORS.Fajr;

      return (
        <button
          type="button"
          key={id}
          onClick={() => setActiveSettingsPrayer(id)}
          className={`relative flex flex-col items-center gap-3 p-5 rounded-[2rem] border transition-all duration-500 overflow-hidden group w-full ${
            isNext
              ? "border-white/20 scale-[1.03] z-10 shadow-2xl"
              : "border-white/[0.06] hover:-translate-y-1 hover:border-white/15"
          }`}
          style={{
            background: isNext
              ? `radial-gradient(ellipse at top, ${colors.glow} -20%, ${colors.bg} 70%)`
              : `radial-gradient(ellipse at top, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.3) 100%)`,
            boxShadow: isNext ? `0 0 50px ${colors.glow}` : "none",
          }}
        >
          {/* Animated glow ring for next */}
          {isNext && (
            <div className="absolute inset-0 rounded-[2rem] border border-white/20 animate-pulse" />
          )}
          {/* Icon */}
          <div
            className="w-10 h-10 transition-transform duration-500 group-hover:scale-110"
            style={{ color: isNext ? colors.icon : "rgba(255,255,255,0.25)" }}
          >
            {PRAYER_ICONS[id] || <div className="w-full h-full rounded-full bg-white/10" />}
          </div>
          {/* Name */}
          <span className={`text-sm font-black font-arabic ${isNext ? "text-white" : "text-white/50"}`}>
            {name}
          </span>
          {/* Time */}
          <span
            className="text-2xl font-black font-mono tracking-tight"
            dir="ltr"
            style={{ color: isNext ? colors.icon : "rgba(255,255,255,0.85)", textShadow: isNext ? `0 0 20px ${colors.icon}` : "none" }}
          >
            {formatTimeDisplay(time)}
          </span>
          {/* Bell */}
          <div className="flex items-center gap-1">
            {enabled
              ? <Bell className={`w-3 h-3 ${isNext ? "" : "text-white/30"}`} style={{ color: isNext ? colors.icon : undefined }} />
              : <BellOff className="w-3 h-3 text-white/20" />
            }
          </div>
        </button>
      );
    });
  }, [times, nextPrayerId, prayerSettings]);

  return (
    <div className="relative flex flex-col h-full overflow-y-auto overflow-x-hidden no-scrollbar font-arabic" style={{ background: "#06080f" }}>
      {/* ─── Animated celestial background ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Stars */}
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 2 + 1 + "px",
              height: Math.random() * 2 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              background: "white",
              opacity: Math.random() * 0.6 + 0.1,
              animation: `pulse ${Math.random() * 4 + 2}s ease-in-out infinite`,
              animationDelay: Math.random() * 4 + "s",
            }}
          />
        ))}
        {/* Nebula gradient blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px]"
          style={{ background: `radial-gradient(ellipse, ${nextPrayerColor.glow} 0%, transparent 70%)`, opacity: 0.3, transition: "background 2s ease" }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full blur-[150px]"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.15) 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 flex flex-col gap-6 p-4 md:p-6 pt-6 pb-24 max-w-2xl mx-auto w-full">

        {/* ─── Header: Location + Date ─── */}
        <div className="flex items-center justify-between">
          <button
            onClick={detectLocation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white/60 hover:text-white hover:border-white/20 transition-all text-xs font-bold disabled:opacity-50"
          >
            {loading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              : <Navigation className="w-3.5 h-3.5 text-amber-400" />
            }
            <span className="font-arabic text-sm">{locationLabel}</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] text-xs text-white/30">
            {isOfflineReady
              ? <WifiOff className="w-3 h-3 text-emerald-400" />
              : <Wifi className="w-3 h-3 text-amber-400 animate-pulse" />
            }
            <span className="font-bold">{dayCount} يوم</span>
          </div>
        </div>

        {/* ─── HERO: Celestial Clock ─── */}
        <div className="relative flex flex-col items-center justify-center py-8">
          {/* Outer decorative ring */}
          <div className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full border border-white/[0.04]" />
          <div className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full border border-white/[0.03]"
            style={{ borderStyle: "dashed", animation: "spin 60s linear infinite" }} />
          
          {/* Degree ticks */}
          <div className="absolute w-72 h-72 md:w-80 md:h-80">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-full h-full"
                style={{ transform: `rotate(${i * 6}deg)` }}
              >
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2"
                  style={{
                    width: i % 5 === 0 ? "2px" : "1px",
                    height: i % 5 === 0 ? "10px" : "5px",
                    background: i % 5 === 0 ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.1)",
                    borderRadius: "2px",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center gap-2 text-center">
            {/* Arabic date */}
            <span className="text-xs text-white/30 font-bold">
              {new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}
            </span>

            {/* Big clock */}
            <div className="flex items-end gap-1 my-1" dir="ltr">
              <span className="text-6xl md:text-7xl font-black font-mono text-white leading-none"
                style={{ textShadow: `0 0 60px ${nextPrayerColor.glow}` }}>
                {clockParts.hh}
              </span>
              <span className="text-4xl font-black text-white/40 mb-1 font-mono animate-pulse">:</span>
              <span className="text-6xl md:text-7xl font-black font-mono text-white leading-none"
                style={{ textShadow: `0 0 60px ${nextPrayerColor.glow}` }}>
                {clockParts.mm}
              </span>
              <span className="text-4xl font-black text-white/40 mb-1 font-mono animate-pulse">:</span>
              <span className="text-3xl md:text-4xl font-black font-mono mb-1 leading-none"
                style={{ color: nextPrayerColor.icon, textShadow: `0 0 30px ${nextPrayerColor.glow}` }}>
                {clockParts.ss}
              </span>
            </div>

            {/* Countdown to next prayer */}
            {calendar ? (
              <PrayerCountdown calendar={calendar} settings={prayerSettings} />
            ) : (
              <div className="flex items-center gap-2 text-white/30 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التحميل...</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Action Buttons ─── */}
        <div className="flex gap-3">
          <button
            onClick={() => calendar && syncCalendar(calendar.meta)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:border-white/20 transition-all text-xs font-black disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
            تحديث
          </button>
          <button
            onClick={detectLocation}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:border-white/20 transition-all text-xs font-black disabled:opacity-40"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            موقعي
          </button>
          <button
            onClick={() => setShowAthanSettings(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black text-black transition-all hover:brightness-110"
            style={{ background: "linear-gradient(135deg, #d4af37 0%, #f59e0b 50%, #d97706 100%)", boxShadow: "0 8px 30px rgba(212,175,55,0.35)" }}
          >
            <Music className="w-4 h-4" />
            الأذان
          </button>
        </div>

        {/* Sync message */}
        {syncMessage && (
          <div className="text-center">
            <span className="text-[11px] font-bold text-amber-400/70 bg-amber-400/5 px-4 py-1.5 rounded-full border border-amber-400/10 inline-block">
              {syncMessage}
            </span>
          </div>
        )}

        {/* ─── Prayer Cards Grid ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {prayerCards ?? (
            <div className="col-span-full flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-amber-400/40 animate-spin" />
            </div>
          )}
        </div>

        {/* ─── Year Calendar ─── */}
        {calendar && <PrayerYearCalendarView calendar={calendar} />}


      </div>

      {/* ─── Athan Settings Dialog ─── */}
      {showAthanSettings && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setShowAthanSettings(false)} />
          <div className="relative w-full max-w-sm rounded-[2.5rem] border border-white/10 p-6 max-h-[80vh] overflow-y-auto shadow-2xl"
            style={{ background: "#0a0c15" }}>
            <button onClick={() => setShowAthanSettings(false)} className="absolute top-7 left-6 text-white/30 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-white mb-5 text-right">اختر المؤذن</h3>
            <div className="space-y-2">
              {MUEZZINS.map((m) => (
                <button key={m.id} type="button"
                  onClick={() => {
                    const newSet: PrayerSettingsMap = { ...prayerSettings };
                    Object.keys(newSet).forEach((k) => { newSet[k] = { ...newSet[k], muezzinId: m.id }; });
                    void setPrayerSettings(newSet);
                    setShowAthanSettings(false);
                  }}
                  className={`w-full p-4 rounded-xl text-right font-black text-sm transition-all flex items-center justify-between ${
                    prayerSettings.Fajr?.muezzinId === m.id
                      ? "text-black"
                      : "bg-white/[0.04] border border-white/[0.06] text-white/70 hover:bg-white/[0.08]"
                  }`}
                  style={prayerSettings.Fajr?.muezzinId === m.id
                    ? { background: "linear-gradient(135deg,#d4af37,#f59e0b)", boxShadow: "0 8px 25px rgba(212,175,55,0.3)" }
                    : {}
                  }
                >
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Location Picker Dialog ─── */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setShowLocationPicker(false)} />
          <div className="relative w-full max-w-sm rounded-[2.5rem] border border-white/10 p-6 shadow-2xl"
            style={{ background: "#0a0c15" }}>
            <button onClick={() => setShowLocationPicker(false)} className="absolute top-7 left-6 text-white/30 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-white mb-1 text-right">تغيير المنطقة يدوياً</h3>
            <p className="text-[11px] text-white/30 mb-5 text-right">سيُحمَّل تقويم السنة ويُحفظ محلياً</p>
            <div className="space-y-3">
              {[
                { val: customCity, set: setCustomCity, placeholder: "المدينة (مثال: Banha)" },
                { val: customCountry, set: setCustomCountry, placeholder: "الدولة (مثال: Egypt)" },
              ].map(({ val, set, placeholder }) => (
                <input key={placeholder} value={val} onChange={e => set(e.target.value)} placeholder={placeholder}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3.5 text-sm text-white outline-none placeholder:text-white/20 text-right focus:border-amber-400/40 transition" />
              ))}
              <button
                onClick={() => { void syncCalendar({ city: customCity, country: customCountry, label: `${customCity}، ${customCountry}` }); setShowLocationPicker(false); }}
                className="w-full py-4 rounded-xl font-black text-sm text-black transition hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#d4af37,#f59e0b)", boxShadow: "0 8px 25px rgba(212,175,55,0.3)" }}
              >
                تحميل وحفظ التقويم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Prayer Settings Sheet ─── */}
      {activeSettingsPrayer && draftPrayerSetting && (
        <PrayerSettingsSheet
          prayerId={activeSettingsPrayer}
          draft={draftPrayerSetting}
          onChange={setDraftPrayerSetting}
          onClose={() => setActiveSettingsPrayer(null)}
          onSave={() => { void setPrayerSettings({ ...prayerSettings, [activeSettingsPrayer]: draftPrayerSetting }); setActiveSettingsPrayer(null); }}
          onTestSound={(file) => { if (audioRef.current) { audioRef.current.src = file; void audioRef.current.play(); } }}
        />
      )}

      <audio ref={audioRef} onEnded={() => setIsPlayingTest(false)} />
    </div>
  );
}
