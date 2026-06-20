"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import {
  type PrayerYearCalendar,
  type PrayerLocationMeta,
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

  const blanks = Array.from({ length: firstWeekday }, (_, i) => i);

  return (
    <section className={`rounded-[1.75rem] p-5 md:p-8 shadow-2xl border transition-all duration-300 ${
      isDark 
        ? "bg-slate-950/95 border-white/10 shadow-black/20 text-white" 
        : "bg-card border-border shadow-slate-100/50 text-foreground"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button type="button" onClick={prevMonth} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-foreground/5 hover:bg-foreground/10 text-foreground"
          }`}>
            <ChevronRight className="w-5 h-5" />
          </button>
          <button type="button" onClick={nextMonth} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-foreground/5 hover:bg-foreground/10 text-foreground"
          }`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 text-primary mb-1">
            <CalendarDays className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">تقويم المواقيت</span>
          </div>
          <h3 className={`text-xl font-black ${isDark ? "text-white" : "text-foreground"}`}>{AR_MONTHS[month]} {year}</h3>
          <p className={`text-[10px] font-bold ${isDark ? "text-white/40" : "text-foreground/45"}`}>محفوظ محلياً — يعمل بدون إنترنت</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center mb-3">
        {['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'].map((d) => (
          <span key={d} className={`text-[10px] font-black py-1 ${isDark ? "text-white/40" : "text-foreground/40"}`}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 mb-6 auto-rows-[70px]">
        {blanks.map((b) => (
          <div key={`b-${b}`} className={`rounded-3xl ${isDark ? "bg-white/5" : "bg-foreground/[0.03]"}`} />
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
              className={`w-full h-full rounded-[1.8rem] text-sm font-black transition-all duration-200 flex items-center justify-center ${
                !hasData
                  ? isDark 
                    ? "bg-white/5 text-white/20 cursor-not-allowed" 
                    : "bg-foreground/5 text-foreground/20 cursor-not-allowed"
                  : isSelected
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : isToday
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : isDark
                        ? "bg-white/10 hover:bg-white/20 text-white"
                        : "bg-foreground/5 hover:bg-foreground/10 text-foreground"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      {selectedTimings && selectedDay && (
        <div className={`border-t pt-5 ${isDark ? "border-white/10" : "border-border/60"}`}>
          <p className={`text-xs font-black text-right mb-4 ${isDark ? "text-white/40" : "text-foreground/45"}`}>
            مواقيت يوم {selectedDay.replace(/-/g, "/")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {PRAYER_KEYS.map((id) => (
              <div
                key={id}
                className={`p-3 rounded-xl border text-center ${
                  isDark ? "bg-white/5 border-white/10" : "bg-foreground/[0.02] border-border/50"
                }`}
              >
                <p className={`text-[10px] font-black mb-1 ${isDark ? "text-white/40" : "text-foreground/45"}`}>{PRAYER_NAMES_AR[id]}</p>
                <p className="text-lg md:text-2xl font-mono font-black text-primary" dir="ltr">
                  {formatTimeDisplay(selectedTimings[id as keyof typeof selectedTimings])}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
