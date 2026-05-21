"use client";

import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
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

export function PrayerYearCalendarView({ calendar }: Props) {
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
    <section className="bg-card/80 border border-border rounded-[2rem] p-5 md:p-8 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button type="button" onClick={prevMonth} className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center hover:bg-primary/10">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button type="button" onClick={nextMonth} className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center hover:bg-primary/10">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-2 text-primary mb-1">
            <CalendarDays className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">تقويم المواقيت</span>
          </div>
          <h3 className="text-xl font-black">{AR_MONTHS[month]} {year}</h3>
          <p className="text-[10px] text-foreground/40 font-bold">محفوظ محلياً — يعمل بدون إنترنت</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"].map((d) => (
          <span key={d} className="text-[10px] font-black text-foreground/30 py-1">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-6">
        {blanks.map((b) => (
          <div key={`b-${b}`} className="aspect-square" />
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
              className={`aspect-square rounded-xl text-sm font-black transition-all ${
                !hasData
                  ? "opacity-20 cursor-not-allowed"
                  : isSelected
                    ? "bg-primary text-black scale-105 shadow-md"
                    : isToday
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-foreground/5 hover:bg-primary/10 text-foreground"
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      {selectedTimings && selectedDay && (
        <div className="border-t border-border/50 pt-5">
          <p className="text-xs font-black text-foreground/40 text-right mb-4">
            مواقيت يوم {selectedDay.replace(/-/g, "/")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {PRAYER_KEYS.map((id) => (
              <div
                key={id}
                className="p-3 rounded-xl bg-foreground/[0.04] border border-border/40 text-center"
              >
                <p className="text-[10px] font-black text-foreground/40 mb-1">{PRAYER_NAMES_AR[id]}</p>
                <p className="text-base font-mono font-black text-primary" dir="ltr">
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
