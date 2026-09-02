"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  MapPin, Bell, BellOff,
  RefreshCw, X, Music, Wifi, WifiOff, Loader2, Navigation,
  ChevronDown, Sparkles, Sun, Moon, Sunrise, Sunset,
  Search, Globe, AlertCircle, Check
} from "lucide-react";
import { useEditor } from "@/store/useEditor";
import { usePrayerNotifications } from "@/hooks/usePrayerNotifications";
import { useTheme } from "@/components/ThemeProvider";
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
      <path d="M4 38 L44 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
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
function PrayerCountdown({ calendar, settings, isDark }: { calendar: PrayerYearCalendar; settings: PrayerSettingsMap; isDark: boolean }) {
  const [next, setNext] = useState<NextPrayerInfo | null>(null);

  useEffect(() => {
    const tick = () => setNext(getNextPrayerFromCalendar(calendar, settings));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [calendar, settings]);

  if (!next) return <Loader2 className="w-8 h-8 text-primary animate-spin" />;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">الصلاة القادمة</span>
      <h3 className={`text-xl md:text-2xl font-black font-arabic ${isDark ? 'text-white' : 'text-zinc-950'}`}>
        {next.nameAr}
      </h3>
      <div
        className="font-mono text-3xl md:text-4xl font-black tracking-widest text-emerald-500"
        dir="ltr"
        style={{ textShadow: isDark ? "0 0 30px rgba(16,185,129,0.4)" : "none" }}
      >
        {next.inLabel}
      </div>
      <p className={`text-[11px] font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
        في تمام الساعة {next.date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}

export interface DayAtmosphere {
  id: "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";
  name: string;
  tag: string;
  icon: string;
  isLightDefault: boolean;
  darkBg: string;
  lightBg: string;
  darkNebula: string;
  lightNebula: string;
  darkGlow: string;
  lightGlow: string;
  badgeDark: string;
  badgeLight: string;
}

export const DAY_ATMOSPHERES: Record<string, DayAtmosphere> = {
  fajr: {
    id: "fajr",
    name: "طور الفجر والسكينة",
    tag: "الفجر 🌌",
    icon: "🌌",
    isLightDefault: false,
    darkBg: "linear-gradient(to bottom, #060a14 0%, #0c1527 50%, #04070e 100%)",
    lightBg: "linear-gradient(to bottom, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)",
    darkNebula: "rgba(99, 130, 201, 0.25)",
    lightNebula: "rgba(99, 130, 201, 0.2)",
    darkGlow: "rgba(99, 130, 201, 0.45)",
    lightGlow: "rgba(99, 130, 201, 0.35)",
    badgeDark: "bg-blue-950/80 text-blue-200 border-blue-800/60",
    badgeLight: "bg-blue-100 text-blue-950 border-blue-300 shadow-sm"
  },
  sunrise: {
    id: "sunrise",
    name: "طور إشراقة الصباح",
    tag: "الصباح 🌅",
    icon: "🌅",
    isLightDefault: true,
    darkBg: "linear-gradient(to bottom, #110d0a 0%, #1a1208 50%, #0a0705 100%)",
    lightBg: "linear-gradient(to bottom, #fff7ed 0%, #ffedd5 45%, #fef3c7 100%)",
    darkNebula: "rgba(251, 146, 60, 0.2)",
    lightNebula: "rgba(251, 146, 60, 0.25)",
    darkGlow: "rgba(251, 146, 60, 0.45)",
    lightGlow: "rgba(251, 146, 60, 0.45)",
    badgeDark: "bg-orange-950/80 text-orange-200 border-orange-800/60",
    badgeLight: "bg-amber-100 text-amber-950 border-amber-300 shadow-sm"
  },
  dhuhr: {
    id: "dhuhr",
    name: "طور الظهيرة والضياء",
    tag: "الظهيرة ☀️",
    icon: "☀️",
    isLightDefault: true,
    darkBg: "linear-gradient(to bottom, #0c0b05 0%, #151307 50%, #070603 100%)",
    lightBg: "linear-gradient(to bottom, #ffffff 0%, #f1f5f9 50%, #e2e8f0 100%)",
    darkNebula: "rgba(234, 179, 8, 0.2)",
    lightNebula: "rgba(234, 179, 8, 0.2)",
    darkGlow: "rgba(234, 179, 8, 0.45)",
    lightGlow: "rgba(234, 179, 8, 0.4)",
    badgeDark: "bg-yellow-950/80 text-yellow-200 border-yellow-800/60",
    badgeLight: "bg-yellow-100 text-yellow-950 border-yellow-300 shadow-sm"
  },
  asr: {
    id: "asr",
    name: "طور أصيل العصر",
    tag: "العصر 🌤️",
    icon: "🌤️",
    isLightDefault: true,
    darkBg: "linear-gradient(to bottom, #0f0b06 0%, #171108 50%, #080603 100%)",
    lightBg: "linear-gradient(to bottom, #fefce8 0%, #fef08a 40%, #fed7aa 100%)",
    darkNebula: "rgba(245, 158, 11, 0.2)",
    lightNebula: "rgba(245, 158, 11, 0.25)",
    darkGlow: "rgba(245, 158, 11, 0.45)",
    lightGlow: "rgba(245, 158, 11, 0.45)",
    badgeDark: "bg-amber-950/80 text-amber-200 border-amber-800/60",
    badgeLight: "bg-orange-100 text-orange-950 border-orange-300 shadow-sm"
  },
  maghrib: {
    id: "maghrib",
    name: "طور شفق الغروب",
    tag: "الغروب 🌇",
    icon: "🌇",
    isLightDefault: false,
    darkBg: "linear-gradient(to bottom, #16080c 0%, #200d14 50%, #0b0306 100%)",
    lightBg: "linear-gradient(to bottom, #fff1f2 0%, #ffe4e6 50%, #fecdd3 100%)",
    darkNebula: "rgba(244, 63, 94, 0.2)",
    lightNebula: "rgba(244, 63, 94, 0.25)",
    darkGlow: "rgba(244, 63, 94, 0.45)",
    lightGlow: "rgba(244, 63, 94, 0.45)",
    badgeDark: "bg-rose-950/80 text-rose-200 border-rose-800/60",
    badgeLight: "bg-rose-100 text-rose-950 border-rose-300 shadow-sm"
  },
  isha: {
    id: "isha",
    name: "طور سكون الليل",
    tag: "الليل 🌙",
    icon: "🌙",
    isLightDefault: false,
    darkBg: "linear-gradient(to bottom, #05060a 0%, #090b14 50%, #020306 100%)",
    lightBg: "linear-gradient(to bottom, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
    darkNebula: "rgba(148, 163, 184, 0.15)",
    lightNebula: "rgba(148, 163, 184, 0.2)",
    darkGlow: "rgba(226, 232, 240, 0.35)",
    lightGlow: "rgba(148, 163, 184, 0.4)",
    badgeDark: "bg-slate-900/90 text-slate-200 border-slate-700/60",
    badgeLight: "bg-slate-100 text-slate-950 border-slate-300 shadow-sm"
  }
};

export interface PresetCity {
  name: string;
  country: string;
  label: string;
  lat: number;
  lng: number;
  category: "egypt" | "saudi" | "arab" | "world";
}

export const PRESET_CITIES: PresetCity[] = [
  // ─── مصر (المحافظات والمدن الكبرى) ───
  { name: "القاهرة", country: "مصر", label: "القاهرة، مصر", lat: 30.0444, lng: 31.2357, category: "egypt" },
  { name: "الجيزة", country: "مصر", label: "الجيزة، مصر", lat: 30.0131, lng: 31.2089, category: "egypt" },
  { name: "الإسكندرية", country: "مصر", label: "الإسكندرية، مصر", lat: 31.2001, lng: 29.9187, category: "egypt" },
  { name: "بنها / القليوبية", country: "مصر", label: "بنها، القليوبية", lat: 30.4660, lng: 31.1834, category: "egypt" },
  { name: "المنصورة / الدقهلية", country: "مصر", label: "المنصورة، الدقهلية", lat: 31.0409, lng: 31.3785, category: "egypt" },
  { name: "طنطا / الغربية", country: "مصر", label: "طنطا، الغربية", lat: 30.7865, lng: 31.0004, category: "egypt" },
  { name: "الزقازيق / الشرقية", country: "مصر", label: "الزقازيق، الشرقية", lat: 30.5877, lng: 31.5020, category: "egypt" },
  { name: "شبين الكوم / المنوفية", country: "مصر", label: "شبين الكوم، المنوفية", lat: 30.5583, lng: 31.0094, category: "egypt" },
  { name: "دمنهور / البحيرة", country: "مصر", label: "دمنهور، البحيرة", lat: 31.0364, lng: 30.4689, category: "egypt" },
  { name: "دمياط", country: "مصر", label: "دمياط، مصر", lat: 31.4175, lng: 31.8144, category: "egypt" },
  { name: "بورسعيد", country: "مصر", label: "بورسعيد، مصر", lat: 31.2653, lng: 32.3019, category: "egypt" },
  { name: "الإسماعيلية", country: "مصر", label: "الإسماعيلية، مصر", lat: 30.5965, lng: 32.2715, category: "egypt" },
  { name: "السويس", country: "مصر", label: "السويس، مصر", lat: 29.9668, lng: 32.5498, category: "egypt" },
  { name: "الفيوم", country: "مصر", label: "الفيوم، مصر", lat: 29.3084, lng: 30.8428, category: "egypt" },
  { name: "بني سويف", country: "مصر", label: "بني سويف، مصر", lat: 29.0661, lng: 31.0994, category: "egypt" },
  { name: "المنيا", country: "مصر", label: "المنيا، مصر", lat: 28.0871, lng: 30.7618, category: "egypt" },
  { name: "أسيوط", country: "مصر", label: "أسيوط، مصر", lat: 27.1783, lng: 31.1859, category: "egypt" },
  { name: "سوهاج", country: "مصر", label: "سوهاج، مصر", lat: 26.5590, lng: 31.6957, category: "egypt" },
  { name: "قنا", country: "مصر", label: "قنا، مصر", lat: 26.1551, lng: 32.7160, category: "egypt" },
  { name: "الأقصر", country: "مصر", label: "الأقصر، مصر", lat: 25.6872, lng: 32.6396, category: "egypt" },
  { name: "أسوان", country: "مصر", label: "أسوان، مصر", lat: 24.0889, lng: 32.8998, category: "egypt" },
  { name: "الغردقة / البحر الأحمر", country: "مصر", label: "الغردقة، مصر", lat: 27.2579, lng: 33.8116, category: "egypt" },
  { name: "شرم الشيخ", country: "مصر", label: "شرم الشيخ، مصر", lat: 27.9158, lng: 34.3299, category: "egypt" },
  { name: "مرسى مطروح", country: "مصر", label: "مرسى مطروح، مصر", lat: 31.3543, lng: 27.2373, category: "egypt" },
  { name: "كفر الشيخ", country: "مصر", label: "كفر الشيخ، مصر", lat: 31.1107, lng: 30.9388, category: "egypt" },
  { name: "العريش / شمال سيناء", country: "مصر", label: "العريش، مصر", lat: 31.1325, lng: 33.8033, category: "egypt" },
  { name: "الخارجة / الوادي الجديد", country: "مصر", label: "الخارجة، مصر", lat: 25.4514, lng: 30.5464, category: "egypt" },
  { name: "العاشر من رمضان", country: "مصر", label: "العاشر من رمضان، مصر", lat: 30.2985, lng: 31.7412, category: "egypt" },
  { name: "6 أكتوبر", country: "مصر", label: "6 أكتوبر، مصر", lat: 29.9737, lng: 30.9592, category: "egypt" },
  { name: "حلوان", country: "مصر", label: "حلوان، مصر", lat: 29.8499, lng: 31.3342, category: "egypt" },

  // ─── السعودية ───
  { name: "مكة المكرمة", country: "السعودية", label: "مكة المكرمة، السعودية", lat: 21.3891, lng: 39.8579, category: "saudi" },
  { name: "المدينة المنورة", country: "السعودية", label: "المدينة المنورة، السعودية", lat: 24.5247, lng: 39.5692, category: "saudi" },
  { name: "الرياض", country: "السعودية", label: "الرياض، السعودية", lat: 24.7136, lng: 46.6753, category: "saudi" },
  { name: "جدة", country: "السعودية", label: "جدة، السعودية", lat: 21.5433, lng: 39.1728, category: "saudi" },
  { name: "الدمام", country: "السعودية", label: "الدمام، السعودية", lat: 26.4207, lng: 50.0888, category: "saudi" },
  { name: "الخبر", country: "السعودية", label: "الخبر، السعودية", lat: 26.2172, lng: 50.1971, category: "saudi" },
  { name: "تبوك", country: "السعودية", label: "تبوك، السعودية", lat: 28.3835, lng: 36.5662, category: "saudi" },
  { name: "أبها", country: "السعودية", label: "أبها، السعودية", lat: 18.2164, lng: 42.5053, category: "saudi" },
  { name: "الطائف", country: "السعودية", label: "الطائف، السعودية", lat: 21.2854, lng: 40.4222, category: "saudi" },
  { name: "بريدة", country: "السعودية", label: "بريدة، القصيم", lat: 26.3260, lng: 43.9750, category: "saudi" },

  // ─── العالم العربي ───
  { name: "القدس الشريف", country: "فلسطين", label: "القدس، فلسطين", lat: 31.7683, lng: 35.2137, category: "arab" },
  { name: "دبي", country: "الإمارات", label: "دبي، الإمارات", lat: 25.2048, lng: 55.2708, category: "arab" },
  { name: "أبوظبي", country: "الإمارات", label: "أبوظبي، الإمارات", lat: 24.4539, lng: 54.3773, category: "arab" },
  { name: "الشارقة", country: "الإمارات", label: "الشارقة، الإمارات", lat: 25.3463, lng: 55.4209, category: "arab" },
  { name: "الكويت", country: "الكويت", label: "الكويت العاصمة", lat: 29.3759, lng: 47.9774, category: "arab" },
  { name: "الدوحة", country: "قطر", label: "الدوحة، قطر", lat: 25.2854, lng: 51.5310, category: "arab" },
  { name: "المنامة", country: "البحرين", label: "المنامة، البحرين", lat: 26.2285, lng: 50.5860, category: "arab" },
  { name: "مسقط", country: "عمان", label: "مسقط، عمان", lat: 23.5880, lng: 58.3829, category: "arab" },
  { name: "عمان", country: "الأردن", label: "عمان، الأردن", lat: 31.9454, lng: 35.9284, category: "arab" },
  { name: "بيروت", country: "لبنان", label: "بيروت، لبنان", lat: 33.8938, lng: 35.5018, category: "arab" },
  { name: "دمشق", country: "سوريا", label: "دمشق، سوريا", lat: 33.5138, lng: 36.2765, category: "arab" },
  { name: "بغداد", country: "العراق", label: "بغداد، العراق", lat: 33.3152, lng: 44.3661, category: "arab" },
  { name: "أربيل", country: "العراق", label: "أربيل، العراق", lat: 36.1901, lng: 43.9930, category: "arab" },
  { name: "تونس", country: "تونس", label: "تونس العاصمة", lat: 36.8065, lng: 10.1815, category: "arab" },
  { name: "الجزائر", country: "الجزائر", label: "الجزائر العاصمة", lat: 36.7538, lng: 3.0588, category: "arab" },
  { name: "وهران", country: "الجزائر", label: "وهران، الجزائر", lat: 35.6987, lng: -0.6349, category: "arab" },
  { name: "الرباط", country: "المغرب", label: "الرباط، المغرب", lat: 34.0209, lng: -6.8416, category: "arab" },
  { name: "الدار البيضاء", country: "المغرب", label: "الدار البيضاء، المغرب", lat: 33.5731, lng: -7.5898, category: "arab" },
  { name: "مراكش", country: "المغرب", label: "مراكش، المغرب", lat: 31.6295, lng: -7.9811, category: "arab" },
  { name: "فاس", country: "المغرب", label: "فاس، المغرب", lat: 34.0181, lng: -5.0078, category: "arab" },
  { name: "طرابلس", country: "ليبيا", label: "طرابلس، ليبيا", lat: 32.8872, lng: 13.1913, category: "arab" },
  { name: "بنغازي", country: "ليبيا", label: "بنغازي، ليبيا", lat: 32.1167, lng: 20.0667, category: "arab" },
  { name: "الخرطوم", country: "السودان", label: "الخرطوم، السودان", lat: 15.5007, lng: 32.5599, category: "arab" },
  { name: "صنعاء", country: "اليمن", label: "صنعاء، اليمن", lat: 15.3694, lng: 44.1910, category: "arab" },
  { name: "عدن", country: "اليمن", label: "عدن، اليمن", lat: 12.7855, lng: 45.0187, category: "arab" },

  // ─── مدن عالمية ───
  { name: "إسطنبول", country: "تركيا", label: "إسطنبول، تركيا", lat: 41.0082, lng: 28.9784, category: "world" },
  { name: "لندن", country: "بريطانيا", label: "لندن، بريطانيا", lat: 51.5074, lng: -0.1278, category: "world" },
  { name: "باريس", country: "فرنسا", label: "باريس، فرنسا", lat: 48.8566, lng: 2.3522, category: "world" },
  { name: "برلين", country: "ألمانيا", label: "برلين، ألمانيا", lat: 52.5200, lng: 13.4050, category: "world" },
  { name: "نيويورك", country: "أمريكا", label: "نيويورك، أمريكا", lat: 40.7128, lng: -74.0060, category: "world" },
  { name: "تورونتو", country: "كندا", label: "تورونتو، كندا", lat: 43.6532, lng: -79.3832, category: "world" },
  { name: "سيدني", country: "أستراليا", label: "سيدني، أستراليا", lat: -33.8688, lng: 151.2093, category: "world" },
  { name: "كوالالمبور", country: "ماليزيا", label: "كوالالمبور، ماليزيا", lat: 3.1390, lng: 101.6869, category: "world" },
  { name: "جاكرتا", country: "إندونيسيا", label: "جاكرتا، إندونيسيا", lat: -6.2088, lng: 106.8456, category: "world" },
];

function getAutoDayMood(times: PrayerTimesData | null): string {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (!times) {
    const hr = now.getHours();
    if (hr >= 4 && hr < 6) return "fajr";
    if (hr >= 6 && hr < 12) return "sunrise";
    if (hr >= 12 && hr < 15) return "dhuhr";
    if (hr >= 15 && hr < 18) return "asr";
    if (hr >= 18 && hr < 20) return "maghrib";
    return "isha";
  }

  const toMin = (t?: string) => {
    if (!t) return 0;
    const parts = t.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  };

  const fajrMin = toMin(times.Fajr);
  const sunriseMin = toMin(times.Sunrise);
  const dhuhrMin = toMin(times.Dhuhr);
  const asrMin = toMin(times.Asr);
  const maghribMin = toMin(times.Maghrib);
  const ishaMin = toMin(times.Isha);

  if (currentMinutes >= fajrMin && currentMinutes < sunriseMin) return "fajr";
  if (currentMinutes >= sunriseMin && currentMinutes < dhuhrMin) return "sunrise";
  if (currentMinutes >= dhuhrMin && currentMinutes < asrMin) return "dhuhr";
  if (currentMinutes >= asrMin && currentMinutes < maghribMin) return "asr";
  if (currentMinutes >= maghribMin && currentMinutes < ishaMin + 30) return "maghrib";
  return "isha";
}

/* ─── Main Component ─── */
export function PrayerTimes() {
  const { theme } = useTheme();
  const [moodSetting, setMoodSetting] = useState<string>("auto");
  const [showMoodMenu, setShowMoodMenu] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("prayer_day_mood_setting");
      if (saved) setMoodSetting(saved);
    } catch {}
  }, []);

  const handleSetMood = (mode: string) => {
    setMoodSetting(mode);
    try {
      localStorage.setItem("prayer_day_mood_setting", mode);
    } catch {}
    setShowMoodMenu(false);
  };
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
  const [locationSearch, setLocationSearch] = useState("");
  const [locationCategory, setLocationCategory] = useState<"egypt" | "saudi" | "arab" | "world">("egypt");
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState<PresetCity[]>([]);

  const searchOnlineLocation = async (query: string) => {
    if (!query.trim()) return;
    setIsSearchingOnline(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&accept-language=ar`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped: PresetCity[] = data.map((item: any) => ({
          name: item.name || item.display_name.split(",")[0],
          country: item.display_name.split(",").slice(-1)[0]?.trim() || "",
          label: item.display_name.split(",").slice(0, 2).join("، "),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          category: "world"
        }));
        setOnlineResults(mapped);
      } else {
        setOnlineResults([]);
      }
    } catch (e) {
      console.warn("Online search error:", e);
    } finally {
      setIsSearchingOnline(false);
    }
  };

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
      // If no cached location meta, try to detect location automatically
      if (!meta || Date.now() - cached.fetchedAt > 7 * 86400000) {
        void syncCalendar(cached.meta);
        // Auto-detect location on first load if no location set
        if (!meta && !localStorage.getItem('locationDetectionAttempted')) {
          localStorage.setItem('locationDetectionAttempted', 'true');
          setTimeout(() => detectLocation(), 1000);
        }
      }
    } else {
      // First time user - try to detect location automatically
      if (!localStorage.getItem('locationDetectionAttempted')) {
        localStorage.setItem('locationDetectionAttempted', 'true');
        void detectLocation();
      } else {
        void syncCalendar({ city: "Cairo", country: "Egypt", label: "القاهرة، مصر" });
      }
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
    if (typeof window !== "undefined" && navigator?.permissions?.query) {
      navigator.permissions.query({ name: "geolocation" as any }).then((perm) => {
        perm.onchange = () => {
          if (perm.state === "granted") {
            void detectLocation();
          }
        };
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!activeSettingsPrayer || !prayerSettings[activeSettingsPrayer]) { setDraftPrayerSetting(null); return; }
    setDraftPrayerSetting({ ...prayerSettings[activeSettingsPrayer] });
  }, [activeSettingsPrayer, prayerSettings]);

  const detectLocation = async (retryCount = 0) => {
    setLoading(true);
    setSyncMessage("جاري تحديد موقعك...");
    try {
      let latitude = 0, longitude = 0;
      
      if (Capacitor.isNativePlatform()) {
        // Native Android/iOS
        try {
          const permStatus = await Geolocation.checkPermissions();
          let finalPerm = permStatus.location;
          
          if (finalPerm !== "granted") {
            setSyncMessage("طلب إذن الوصول للموقع...");
            const r = await Geolocation.requestPermissions();
            finalPerm = r.location;
          }
          
          if (finalPerm !== "granted") {
            throw new Error("يرجى السماح بالوصول للموقع من إعدادات التطبيق");
          }
          
          setSyncMessage("جاري الحصول على الإحداثيات...");
          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch (permError: any) {
          console.error("Location permission error:", permError);
          if (retryCount < 2) {
            setSyncMessage(`محاولة ${retryCount + 2} من 3...`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            return await detectLocation(retryCount + 1);
          }
          throw new Error("فشل في الحصول على صلاحية الموقع");
        }
      } else {
        // Web browser
        try {
          if (!navigator.geolocation) {
            throw new Error("متصفحك لا يدعم تحديد الموقع");
          }
          
          setSyncMessage("جاري التحديد التلقائي عبر الـ GPS...");
          const pos = await new Promise<GeolocationPosition>((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, {
              enableHighAccuracy: true,
              timeout: 7000,
              maximumAge: 0
            });
          }).catch(() => {
            return new Promise<GeolocationPosition>((res, rej) => {
              navigator.geolocation.getCurrentPosition(res, rej, {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 60000
              });
            });
          });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch (geoError: any) {
          console.warn("Browser GPS unavailable or denied, using auto network fallback:", geoError?.message || geoError);
          try {
            setSyncMessage("تحديد تلقائي عبر الشبكة...");
            const ipRes = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(4000) });
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              if (ipData.latitude && ipData.longitude) {
                latitude = ipData.latitude;
                longitude = ipData.longitude;
              }
            }
          } catch {}
          if (!latitude || !longitude) {
            latitude = 30.0444;
            longitude = 31.2357;
          }
          setSyncMessage("📍 فعل خيار (الموقع) في المتصفح للحصول على دقة الشارع تلقائياً");
        }
      }
      
      setSyncMessage("جاري البحث عن المدينة...");
      let label = "موقعي الحالي";
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`,
          { headers: { 'User-Agent': 'QuranApp/1.0' } }
        );
        const geoData = await geoRes.json();
        if (geoData?.address) {
          const name = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.state || "موقعي";
          label = `${name}، ${geoData.address.country || ""}`;
        }
      } catch (revError) {
        label = latitude === 30.0444 ? "القاهرة، مصر" : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }
      
      setSyncMessage("جاري تحميل أوقات الصلاة...");
      await syncCalendar({ latitude, longitude, label });
      setSyncMessage(`✓ تم التحديث: ${label}`);
    } catch (err: any) {
      console.warn("Location detection fallback:", err);
      // Fallback safely to Cairo without crashing or alerting
      await syncCalendar({ latitude: 30.0444, longitude: 31.2357, label: "القاهرة، مصر" });
      setSyncMessage("✓ تم ضبط الموقع الافتراضي: القاهرة، مصر");
    } finally {
      setLoading(false);
    }
  };

  const locationLabel = calendar?.meta.label || "القاهرة، مصر";
  const dayCount = calendar ? Object.keys(calendar.days).length : 0;
  const isOfflineReady = dayCount > 300;

  const PRAYER_COLORS: Record<string, { bg: string; glow: string; icon: string; grad: string }> = {
    Fajr:    { bg: "#0f1626", glow: "rgba(99,130,201,0.4)",  icon: "#93b4ff", grad: "from-blue-900/60 to-indigo-900/40" },
    Sunrise: { bg: "#1a1008", glow: "rgba(251,146,60,0.4)",  icon: "#fb923c", grad: "from-orange-900/60 to-amber-900/40" },
    Dhuhr:   { bg: "#1a1400", glow: "rgba(234,179,8,0.4)",   icon: "#facc15", grad: "from-yellow-900/60 to-amber-900/40" },
    Asr:     { bg: "#1a0e00", glow: "rgba(245,158,11,0.4)",  icon: "#f59e0b", grad: "from-amber-900/60 to-yellow-900/40" },
    Maghrib: { bg: "#1a0a0a", glow: "rgba(239,68,68,0.4)",   icon: "#f87171", grad: "from-red-900/60 to-rose-900/40" },
    Isha:    { bg: "#090d16", glow: "rgba(148,163,184,0.35)", icon: "#cbd5e1", grad: "from-slate-900 to-zinc-950" },
  };

  const nextPrayerColor = PRAYER_COLORS[nextPrayerId] || PRAYER_COLORS.Fajr;

  const autoMoodId = useMemo(() => getAutoDayMood(times), [times, clockParts.mm]);
  const effectiveMoodId = (moodSetting === "auto" ? autoMoodId : moodSetting) in DAY_ATMOSPHERES 
    ? (moodSetting === "auto" ? autoMoodId : moodSetting) 
    : autoMoodId;

  const currentAtmosphere = DAY_ATMOSPHERES[effectiveMoodId] || DAY_ATMOSPHERES.isha;

  // When user toggles dark mode in navbar (theme === 'dark'), or when in a dark mood:
  // If theme is dark, page MUST remain dark and never wash out to white!
  const isDark = moodSetting === "auto"
    ? (theme === "dark" ? true : !currentAtmosphere.isLightDefault)
    : (moodSetting === "dark" ? true : moodSetting === "light" ? false : theme === "dark");

  const activeBackground = isDark ? currentAtmosphere.darkBg : currentAtmosphere.lightBg;
  const activeNebula = isDark ? currentAtmosphere.darkNebula : currentAtmosphere.lightNebula;
  const activeGlow = isDark ? currentAtmosphere.darkGlow : currentAtmosphere.lightGlow;
  const activeBadge = isDark ? currentAtmosphere.badgeDark : currentAtmosphere.badgeLight;

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
              ? "force-dark border-white/20 scale-[1.03] z-10 shadow-2xl"
              : isDark
                ? "border-zinc-800/80 hover:-translate-y-1 hover:border-zinc-700"
                : "border-stone-200 hover:-translate-y-1 hover:border-stone-300 shadow-xs"
          }`}
          style={{
            background: isNext
              ? `radial-gradient(ellipse at top, ${colors.glow} -20%, ${colors.bg} 70%)`
              : isDark
                ? `radial-gradient(ellipse at top, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.3) 100%)`
                : `linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)`,
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
            style={{ color: isNext ? colors.icon : isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}
          >
            {PRAYER_ICONS[id] || <div className="w-full h-full rounded-full bg-white/10" />}
          </div>
          {/* Name */}
          <span className={`text-sm font-black font-arabic ${isNext ? "text-white" : isDark ? "text-zinc-400" : "text-zinc-600"}`}>
            {name}
          </span>
          {/* Time */}
          <span
            className="text-2xl font-black font-mono tracking-tight"
            dir="ltr"
            style={{ 
              color: isNext ? colors.icon : isDark ? "#ffffff" : "#09090b", 
              textShadow: isNext ? `0 0 20px ${colors.icon}` : "none" 
            }}
          >
            {formatTimeDisplay(time)}
          </span>
          {/* Bell */}
          <div className="flex items-center gap-1">
            {enabled
              ? <Bell className={`w-3 h-3 ${isNext ? "" : isDark ? "text-zinc-500" : "text-zinc-400"}`} style={{ color: isNext ? colors.icon : undefined }} />
              : <BellOff className={`w-3 h-3 ${isDark ? "text-zinc-700" : "text-zinc-300"}`} />
            }
          </div>
        </button>
      );
    });
  }, [times, nextPrayerId, prayerSettings, isDark]);

  return (
    <div
      className={`relative flex flex-col h-full overflow-y-auto overflow-x-hidden no-scrollbar font-arabic transition-all duration-1000 ${
        isDark ? 'force-dark text-white' : 'text-zinc-950'
      }`}
      style={{
        background: activeBackground,
        colorScheme: isDark ? "dark" : "light"
      }}
    >
      {/* ─── Animated celestial background ─── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Stars in Dark Moods */}
        {isDark && Array.from({ length: 60 }).map((_, i) => (
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
        {/* Nebula gradient blobs tailored to current day atmosphere */}
        <div
          className="absolute top-1/2 left-0 w-[350px] h-[350px] rounded-full blur-[130px] transition-all duration-1000"
          style={{ background: `radial-gradient(ellipse, ${activeNebula} 0%, transparent 70%)` }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-6 p-4 md:p-8 pt-6 pb-24 max-w-5xl mx-auto w-full">

        {/* ─── Header: Location + Mood Selector + Status ─── */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <button
            onClick={() => setShowLocationPicker(true)}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all disabled:opacity-50 ${
              isDark 
                ? "border-zinc-800 bg-zinc-900/80 text-zinc-100 hover:bg-zinc-800" 
                : "border-stone-300 bg-white text-zinc-950 shadow-sm hover:bg-stone-50"
            }`}
          >
            {loading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              : <Navigation className="w-3.5 h-3.5 text-primary" />
            }
            <span className="font-arabic text-sm">{locationLabel}</span>
          </button>

          {/* Dynamic Day Mood & Theme Selector */}
          <div className="relative">
            <button
              onClick={() => setShowMoodMenu(!showMoodMenu)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-black transition-all shadow-sm active:scale-95 ${activeBadge}`}
              title="تغيير طور أجواء الصلاة واليوم (تلقائي حسب الوقت أو يدوي)"
            >
              <span className="text-sm">{currentAtmosphere.icon}</span>
              <span>{moodSetting === "auto" ? `تلقائي: ${currentAtmosphere.tag}` : currentAtmosphere.name}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Mood Dropdown Popover (Zero purple, sleek dark obsidian/slate) */}
            {showMoodMenu && (
              <div className="absolute top-10 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-0 z-50 w-64 p-2 rounded-2xl bg-zinc-950/98 backdrop-blur-2xl border border-zinc-800 shadow-2xl text-white animate-in zoom-in-95 duration-150">
                <div className="p-2 border-b border-zinc-800/80 mb-1 text-right">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">أطوار أجواء الصلاة واليوم</p>
                </div>

                {/* Auto Mode Option */}
                <button
                  onClick={() => handleSetMood("auto")}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${
                    moodSetting === "auto" ? "bg-primary text-primary-foreground font-black shadow-sm" : "hover:bg-zinc-800/60 text-zinc-200"
                  }`}
                >
                  <span className="text-[10px] opacity-75">حسب وقت الصلاة الحالي</span>
                  <div className="flex items-center gap-1.5">
                    <span>تلقائي ديناميكي</span>
                    <span>⏳</span>
                  </div>
                </button>

                <div className="my-1 border-t border-zinc-800/60" />

                {/* 6 Day Atmospheres */}
                {Object.values(DAY_ATMOSPHERES).map((atm) => (
                  <button
                    key={atm.id}
                    onClick={() => handleSetMood(atm.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all my-0.5 ${
                      moodSetting === atm.id ? "bg-zinc-800 font-black text-white" : "hover:bg-zinc-800/60 text-zinc-300"
                    }`}
                  >
                    <span className="text-[10px] opacity-60">{atm.isLightDefault ? "نهاري" : "ليلي"}</span>
                    <div className="flex items-center gap-1.5">
                      <span>{atm.name}</span>
                      <span>{atm.icon}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${
            isDark 
              ? "border-zinc-800 bg-zinc-900/60 text-zinc-300" 
              : "border-stone-300 bg-white text-zinc-950 shadow-sm"
          }`}>
            {isOfflineReady
              ? <WifiOff className="w-3 h-3 text-emerald-500" />
              : <Wifi className="w-3 h-3 text-primary animate-pulse" />
            }
            <span className="font-bold">{dayCount} يوم</span>
          </div>
        </div>

        {/* ─── HERO: Celestial Clock ─── */}
        <div className="relative flex flex-col items-center justify-center py-8">
          {/* Outer decorative ring */}
          <div className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full border border-foreground/[0.04]" />
          <div className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full border border-foreground/[0.03]"
            style={{ borderStyle: "dashed", animation: "spin 60s linear infinite" }} />

          {/* Degree ticks */}
          <div className="absolute w-72 h-72 md:w-80 md:h-80">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`absolute w-0.5 h-2 rounded-full left-1/2 -translate-x-1/2 origin-[50%_144px] md:origin-[50%_160px] ${
                  isDark ? "bg-white/10" : "bg-black/10"
                }`}
                style={{ transform: `rotate(${i * 30}deg)` }}
              />
            ))}
          </div>

          {/* Glowing Center Ring */}
          <div
            className="relative w-64 h-64 md:w-80 md:h-80 rounded-full flex flex-col items-center justify-center transition-all duration-1000 shadow-2xl p-6 text-center z-10"
            style={{
              background: isDark
                ? `radial-gradient(ellipse at center, ${nextPrayerColor.bg} 0%, rgba(0,0,0,0.85) 100%)`
                : `radial-gradient(ellipse at center, #ffffff 0%, #f8fafc 100%)`,
              border: `2px solid ${activeGlow}`,
              boxShadow: `0 0 60px ${activeGlow}`,
            }}
          >
            {/* Arabic date */}
            <span className={`text-[11px] font-bold mb-1 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              {new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" })}
            </span>

            {/* Big clock with crisp high contrast numbers */}
            <div className="flex items-end gap-1 my-1" dir="ltr">
              <span className={`text-4xl md:text-5xl font-black font-mono leading-none ${isDark ? "text-white" : "text-zinc-950"}`}>
                {clockParts.hh}
              </span>
              <span className={`text-3xl font-black mb-0.5 font-mono animate-pulse ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>:</span>
              <span className={`text-4xl md:text-5xl font-black font-mono leading-none ${isDark ? "text-white" : "text-zinc-950"}`}>
                {clockParts.mm}
              </span>
              <span className={`text-3xl font-black mb-0.5 font-mono animate-pulse ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>:</span>
              <span className="text-2xl md:text-3xl font-black font-mono mb-0.5 leading-none text-emerald-500">
                {clockParts.ss}
              </span>
            </div>

            {/* Countdown to next prayer */}
            {calendar ? (
              <PrayerCountdown calendar={calendar} settings={prayerSettings} isDark={isDark} />
            ) : (
              <div className="flex items-center gap-2 text-primary text-xs mt-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
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
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-xs font-black transition-all disabled:opacity-40 ${
              isDark 
                ? "border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700" 
                : "border-stone-300 bg-white text-zinc-950 hover:bg-stone-50 shadow-sm"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
            تحديث
          </button>
          <button
            onClick={() => detectLocation()}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border text-xs font-black transition-all disabled:opacity-40 ${
              isDark 
                ? "border-zinc-800 bg-zinc-900/60 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700" 
                : "border-stone-300 bg-white text-zinc-950 hover:bg-stone-50 shadow-sm"
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-500" />
            موقعي
          </button>
          <button
            onClick={() => setShowAthanSettings(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-xs font-black text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-[0_8px_25px_rgba(16,185,129,0.3)]"
          >
            <Music className="w-4 h-4" />
            الأذان
          </button>
        </div>

        {/* Sync message */}
        {syncMessage && (
          <div className="text-center">
            <span className="text-[11px] font-bold text-primary/80 bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20 inline-block">
              {syncMessage}
            </span>
          </div>
        )}

        {/* ─── Prayer Cards Grid: 6 columns on desktop, 2-3 on mobile ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
          {prayerCards ?? (
            <div className="col-span-full flex justify-center py-10">
              <Loader2 className="w-8 h-8 text-primary/40 animate-spin" />
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
          <div className="relative w-full max-w-sm rounded-[2.5rem] border border-border/20 p-6 max-h-[80vh] overflow-y-auto shadow-2xl bg-card text-foreground">
            <button onClick={() => setShowAthanSettings(false)} className="absolute top-7 left-6 text-foreground/30 hover:text-foreground transition">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black text-foreground mb-5 text-right font-arabic">اختر المؤذن</h3>
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
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-foreground/[0.03] border border-border/10 text-foreground/70 hover:bg-foreground/[0.06]"
                  }`}
                >
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Modern Location & Governorate Picker Dialog ─── */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setShowLocationPicker(false)} />
          <div className="relative w-full max-w-lg rounded-[2.5rem] border border-border/60 p-5 sm:p-7 shadow-2xl bg-card text-foreground max-h-[90vh] flex flex-col overflow-hidden z-10">
            {/* Close Button */}
            <button 
              onClick={() => setShowLocationPicker(false)} 
              className="absolute top-6 left-6 w-8 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-foreground/60 hover:text-foreground transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-right mb-4">
              <div className="flex items-center justify-end gap-2 text-primary mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-wider">تحديد مكانك لمواقيت دقيقة</span>
              </div>
              <h3 className="text-xl font-black text-foreground">اختر محافظتك أو مدينتك</h3>
              <p className="text-xs text-foreground/50 mt-0.5">
                تُحسب مواقيت الصلاة بدقة بناءً على إحداثيات مدينتك
              </p>
            </div>

            {/* GPS Retry Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={async () => {
                  setShowLocationPicker(false);
                  await detectLocation();
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center gap-2 transition"
              >
                <Navigation className="w-3.5 h-3.5 animate-pulse" />
                <span>طلب إذن الـ GPS الدقيق من جهازك تلقائياً</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => {
                  setLocationSearch(e.target.value);
                  if (e.target.value.length > 2) {
                    searchOnlineLocation(e.target.value);
                  }
                }}
                placeholder="ابحث عن أي محافظة، مدينة، أو دولة..."
                className="w-full bg-foreground/[0.04] border border-border/40 focus:border-primary/60 rounded-2xl py-3 pr-10 pl-4 text-xs font-bold text-foreground placeholder:text-foreground/30 outline-none transition"
              />
              <Search className="w-4 h-4 text-foreground/40 absolute right-3.5 top-1/2 -translate-y-1/2" />
              {locationSearch && (
                <button
                  type="button"
                  onClick={() => { setLocationSearch(""); setOnlineResults([]); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-foreground/40 hover:text-foreground"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Category Tabs (when not actively searching) */}
            {!locationSearch && (
              <div className="flex items-center gap-1.5 p-1 bg-foreground/[0.03] rounded-2xl mb-3 border border-border/30 overflow-x-auto no-scrollbar shrink-0">
                {[
                  { id: "egypt", label: "🇪🇬 مصر" },
                  { id: "saudi", label: "🇸🇦 السعودية" },
                  { id: "arab", label: "🌍 العالم العربي" },
                  { id: "world", label: "🌐 دول العالم" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setLocationCategory(tab.id as any)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition whitespace-nowrap ${
                      locationCategory === tab.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Scrollable Cities Grid */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 pr-1 mb-3">
              {/* Online search results if searching */}
              {locationSearch && onlineResults.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-black text-primary mb-1 text-right">نتائج البحث من الخريطة:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {onlineResults.map((city, idx) => (
                      <button
                        key={`online-${idx}`}
                        type="button"
                        onClick={async () => {
                          setShowLocationPicker(false);
                          await syncCalendar({ latitude: city.lat, longitude: city.lng, label: city.label });
                        }}
                        className="p-3 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-right transition flex items-center justify-between"
                      >
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <div>
                          <p className="text-xs font-black text-foreground">{city.name}</p>
                          <p className="text-[10px] text-foreground/40">{city.label}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Local filtered cities */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {PRESET_CITIES
                  .filter((c) => {
                    if (locationSearch.trim()) {
                      const q = locationSearch.toLowerCase().trim();
                      return (
                        c.name.toLowerCase().includes(q) ||
                        c.label.toLowerCase().includes(q) ||
                        c.country.toLowerCase().includes(q)
                      );
                    }
                    return c.category === locationCategory;
                  })
                  .map((city, idx) => {
                    const isCurrent = calendar?.meta.label?.includes(city.name);
                    return (
                      <button
                        key={`city-${idx}`}
                        type="button"
                        onClick={async () => {
                          setShowLocationPicker(false);
                          await syncCalendar({ latitude: city.lat, longitude: city.lng, label: city.label });
                        }}
                        className={`p-3 rounded-2xl border text-right transition flex flex-col justify-center ${
                          isCurrent
                            ? "bg-primary text-primary-foreground border-primary font-black shadow-md"
                            : "bg-foreground/[0.02] hover:bg-foreground/[0.06] border-border/30 text-foreground"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          {isCurrent && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                          <span className="text-xs font-black leading-tight">{city.name}</span>
                        </div>
                        <span className={`text-[9px] ${isCurrent ? "text-primary-foreground/75" : "text-foreground/40"}`}>
                          {city.country}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* No results prompt */}
              {locationSearch && onlineResults.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-foreground/50 mb-2">لم نجد مدينة مطابقة في القائمة السريعة</p>
                  <button
                    type="button"
                    onClick={() => searchOnlineLocation(locationSearch)}
                    disabled={isSearchingOnline}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-md"
                  >
                    {isSearchingOnline ? "جاري البحث..." : `البحث في خريطة العالم عن "${locationSearch}"`}
                  </button>
                </div>
              )}
            </div>

            {/* Custom Coordinates / City Fallback */}
            <div className="pt-2 border-t border-border/30 text-right">
              <details className="text-xs text-foreground/60">
                <summary className="cursor-pointer font-bold hover:text-foreground text-[11px]">
                  + كتابة اسم مدينة مخصصة يدوياً (بالإنجليزي)
                </summary>
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={customCountry}
                      onChange={(e) => setCustomCountry(e.target.value)}
                      placeholder="الدولة (مثال: Egypt)"
                      className="flex-1 bg-foreground/[0.04] border border-border/30 rounded-xl p-2 text-xs text-right text-foreground"
                    />
                    <input
                      value={customCity}
                      onChange={(e) => setCustomCity(e.target.value)}
                      placeholder="المدينة (مثال: Cairo)"
                      className="flex-1 bg-foreground/[0.04] border border-border/30 rounded-xl p-2 text-xs text-right text-foreground"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void syncCalendar({ city: customCity, country: customCountry, label: `${customCity}، ${customCountry}` });
                      setShowLocationPicker(false);
                    }}
                    className="w-full py-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 font-black text-xs text-foreground"
                  >
                    حفظ وتحديث
                  </button>
                </div>
              </details>
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
