"use client";

import React, { useMemo, useState } from "react";
import { 
  ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, 
  Sparkles, Clock, Sun, Moon, Sunrise, Sunset, Compass
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import {
  type PrayerYearCalendar,
  getMonthDayKeys,
  getTimesForDate,
  formatTimeDisplay,
  getTodayKey,
  AR_MONTHS,
} from "@/lib/prayerCalendar";
import { PRAYER_KEYS, PRAYER_NAMES_AR } from "@/lib/prayerNotifications";

interface Props {
  calendar: PrayerYearCalendar;
}

const PRAYER_ICONS: Record<string, React.ReactNode> = {
  Fajr: <Moon className="w-4 h-4 text-sky-400" />,
  Sunrise: <Sunrise className="w-4 h-4 text-amber-400" />,
  Dhuhr: <Sun className="w-4 h-4 text-yellow-400" />,
  Asr: <Sun className="w-4 h-4 text-orange-400" />,
  Maghrib: <Sunset className="w-4 h-4 text-rose-400" />,
  Isha: <Moon className="w-4 h-4 text-indigo-300" />,
};

const WEEKDAY_NAMES = [
  { short: "أحد", full: "الأحد" },
  { short: "إثن", full: "الإثنين" },
  { short: "ثلا", full: "الثلاثاء" },
  { short: "أرب", full: "الأربعاء" },
  { short: "خمي", full: "الخميس" },
  { short: "جمع", full: "الجمعة", isJumua: true },
  { short: "سبت", full: "السبت" },
];

export function PrayerYearCalendarView({ calendar }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const today = getTodayKey();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<string>(today);

  const dayKeys = useMemo(() => getMonthDayKeys(year, month), [year, month]);
  const firstWeekday = useMemo(() => new Date(year, month, 1).getDay(), [year, month]);

  const selectedTimings = useMemo(
    () => (selectedDay ? getTimesForDate(calendar, selectedDay) : null),
    [calendar, selectedDay]
  );

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const jumpToToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDay(today);
  };

  const blanks = Array.from({ length: firstWeekday }, (_, i) => i);

  // Selected Day detailed date
  const selectedDateObj = useMemo(() => {
    if (!selectedDay) return new Date();
    const [y, m, d] = selectedDay.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedDay]);

  const selectedDayArabicName = selectedDateObj.toLocaleDateString("ar-EG", { weekday: "long" });
  const selectedFullDate = selectedDateObj.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" });

  return (
    <section className="relative w-full max-w-4xl mx-auto my-6 font-arabic select-none">
      {/* ─── Hanging Calendar Top Bar (هيكل النتيجة المعلقة) ─── */}
      <div className="relative mx-auto w-[92%] h-7 rounded-t-2xl bg-gradient-to-r from-amber-900 via-stone-800 to-amber-950 border-t border-x border-amber-600/40 shadow-lg flex items-center justify-between px-8 z-10">
        {/* Metallic Hanging Rivets/Rings */}
        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-inner border border-amber-700/60" />
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[9px] font-black text-amber-200 tracking-wider">تقويم نتيجة مواقيت الصلاة</span>
        </div>
        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-inner border border-amber-700/60" />
      </div>

      {/* ─── Main Calendar Sheet (ورقة النتيجة الحائطية) ─── */}
      <div className={`rounded-3xl p-5 md:p-8 shadow-2xl border transition-all duration-300 relative overflow-hidden ${
        isDark 
          ? "bg-[#0c101b] border-zinc-800/80 shadow-black/60 text-white" 
          : "bg-white border-stone-200 shadow-xl shadow-stone-200/50 text-zinc-900"
      }`}>

        {/* Paper Corner Cut / Binder Shadow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-b from-black/20 to-transparent" />

        {/* Header: Month, Year, Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/40 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevMonth}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isDark ? "bg-zinc-800/80 hover:bg-zinc-700 text-white" : "bg-stone-100 hover:bg-stone-200 text-zinc-800"
              }`}
              title="الشهر السابق"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={jumpToToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                isDark ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isDark ? "bg-zinc-800/80 hover:bg-zinc-700 text-white" : "bg-stone-100 hover:bg-stone-200 text-zinc-800"
              }`}
              title="الشهر القادم"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-2 text-primary mb-1">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              <span className="text-[11px] font-black uppercase tracking-wider">تقويم المواقيت الشهرية</span>
            </div>
            <h3 className={`text-2xl md:text-3xl font-black ${isDark ? "text-white" : "text-zinc-950"}`}>
              {AR_MONTHS[month]} {year}
            </h3>
            <p className={`text-[11px] font-bold flex items-center justify-end gap-1.5 mt-0.5 ${isDark ? "text-zinc-400" : "text-stone-500"}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              محفوظ محلياً — يعمل بدون إنترنت
            </p>
          </div>
        </div>

        {/* ─── Day-of-Week Row (صف أيام الأسبوع: أحد، إثن، ثلا، أرب، خمي، جمع، سبت) ─── */}
        <div className="grid grid-cols-7 gap-1.5 text-center mb-3">
          {WEEKDAY_NAMES.map((d) => (
            <div
              key={d.short}
              className={`py-2 rounded-xl text-xs font-black transition-colors ${
                d.isJumua
                  ? isDark
                    ? "bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-black"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200 font-black"
                  : isDark
                    ? "text-zinc-400 bg-zinc-900/40"
                    : "text-zinc-600 bg-stone-50"
              }`}
            >
              <span>{d.short}</span>
              {d.isJumua && <span className="block text-[8px] opacity-75 font-normal">مباركة</span>}
            </div>
          ))}
        </div>

        {/* ─── Days Grid (شبكة الأيام) ─── */}
        <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-6 auto-rows-[62px] md:auto-rows-[70px]">
          {blanks.map((b) => (
            <div
              key={`b-${b}`}
              className={`rounded-2xl border border-dashed ${
                isDark ? "border-zinc-800/40 bg-zinc-900/10" : "border-stone-200/50 bg-stone-50/30"
              }`}
            />
          ))}

          {dayKeys.map((key) => {
            const dayNum = parseInt(key.split("-")[2], 10);
            const hasData = !!calendar.days[key];
            const isToday = key === today;
            const isSelected = key === selectedDay;

            return (
              <button
                type="button"
                key={key}
                onClick={() => setSelectedDay(key)}
                disabled={!hasData}
                className={`relative w-full h-full rounded-2xl text-base font-black transition-all duration-200 flex flex-col items-center justify-center group ${
                  !hasData
                    ? isDark
                      ? "bg-zinc-900/20 text-zinc-600 cursor-not-allowed"
                      : "bg-stone-100 text-stone-300 cursor-not-allowed"
                    : isSelected
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-[1.04] z-10 ring-2 ring-primary"
                      : isToday
                        ? isDark
                          ? "bg-emerald-950/60 text-emerald-300 border-2 border-emerald-500 shadow-md"
                          : "bg-emerald-100 text-emerald-900 border-2 border-emerald-600 shadow-md"
                        : isDark
                          ? "bg-zinc-900/60 hover:bg-zinc-800 text-zinc-100 border border-zinc-800/60"
                          : "bg-stone-50 hover:bg-stone-100 text-zinc-900 border border-stone-200/80 shadow-xs"
                }`}
              >
                {/* Day Number */}
                <span className="leading-none text-lg md:text-xl">{dayNum}</span>

                {/* Today Badge */}
                {isToday && (
                  <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full mt-1 ${
                    isSelected ? "bg-white text-emerald-900" : "bg-emerald-500 text-white"
                  }`}>
                    اليوم
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Tear-Off Slip: Selected Day Timings (ورقة النتيجة اليومية) ─── */}
        {selectedTimings && selectedDay && (
          <div className={`pt-5 border-t ${isDark ? "border-zinc-800" : "border-stone-200"}`}>
            {/* Sheet Title */}
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                selectedDay === today
                  ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                  : isDark ? "bg-zinc-800 text-zinc-300" : "bg-stone-100 text-stone-700"
              }`}>
                {selectedDay === today ? "مواقيت اليوم الحالي" : "يوم محدد"}
              </span>

              <div className="text-right">
                <p className={`text-sm md:text-base font-black ${isDark ? "text-white" : "text-zinc-950"}`}>
                  {selectedDayArabicName}، {selectedFullDate}
                </p>
                <p className={`text-[10px] font-bold ${isDark ? "text-zinc-400" : "text-stone-500"}`}>
                  مواقيت الأذان الدقيقة المحسوبة
                </p>
              </div>
            </div>

            {/* Prayer Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {PRAYER_KEYS.map((id) => (
                <div
                  key={id}
                  className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    isDark 
                      ? "bg-zinc-900/80 border-zinc-800/90 text-white shadow-xs" 
                      : "bg-stone-50 border-stone-200/90 text-zinc-900 shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {PRAYER_ICONS[id] || <Clock className="w-3.5 h-3.5 text-primary" />}
                    <p className={`text-[11px] font-black ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                      {PRAYER_NAMES_AR[id]}
                    </p>
                  </div>
                  <p className="text-lg md:text-xl font-mono font-black text-primary tracking-tight" dir="ltr">
                    {formatTimeDisplay(selectedTimings[id as keyof typeof selectedTimings])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
