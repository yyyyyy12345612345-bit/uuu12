"use client";

import React, { useEffect, useState, useMemo } from "react";
import surahsData from "@/data/surahs.json";
import { useEditor } from "@/store/useEditor";
import { ChevronDown, Search, Lock, Crown, Hash, Clock, CheckCircle2, AlertTriangle, Scissors } from "lucide-react";
import { AyahSearchModal } from "./AyahSearchModal";
import { useUserPlan } from "@/hooks/useUserPlan";
import { useSurahData } from "@/hooks/useSurahData";
import { fetchBatchVerseDurations, estimateVerseDurationFallback, getShortsDurationInfo, findShortsOptimalEndAyah } from "@/lib/quranUtils";

export function SurahSelector() {
  const { state, updateState } = useEditor();
  const { data: surahData } = useSurahData(state.surahId);
  const [maxVerses, setMaxVerses] = useState(7);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isFeatureLocked } = useUserPlan();

  const [measuredDurations, setMeasuredDurations] = useState<Record<string, number>>({});
  const [isLoadingDurations, setIsLoadingDurations] = useState(false);

  const isSearchLocked = isFeatureLocked("search");

  useEffect(() => {
    const surah = surahsData.find(s => s.id.toString() === state.surahId);
    if (surah) {
      setMaxVerses(surah.total_verses);
      if (state.startAyah > surah.total_verses) updateState({ startAyah: 1 });
      if (state.endAyah > surah.total_verses) updateState({ endAyah: surah.total_verses });
    }
  }, [state.surahId, updateState]);

  const [startInput, setStartInput] = useState(state.startAyah.toString());
  const [endInput, setEndInput] = useState(state.endAyah.toString());
  const [surahSearch, setSurahSearch] = useState("");

  const filteredSurahs = React.useMemo(() => {
    const cleanSearch = surahSearch.trim().toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[ًٌٍَُِّْ]/g, "");
    if (!cleanSearch) return surahsData;
    return surahsData.filter(s => {
      const cleanName = s.name
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .replace(/[ًٌٍَُِّْ]/g, "")
        .toLowerCase();
      const cleanEnglish = (s.transliteration || "").toLowerCase();
      return cleanName.includes(cleanSearch) || cleanEnglish.includes(cleanSearch) || s.id.toString() === cleanSearch;
    });
  }, [surahSearch]);

  useEffect(() => {
    setStartInput(state.startAyah.toString());
    setEndInput(state.endAyah.toString());
  }, [state.startAyah, state.endAyah]);

  // Live Duration Calculation — BATCH API (exact MP3 parsing server-side)
  useEffect(() => {
    let isMounted = true;
    if (!surahData?.verses) return;

    const surahId = Number(state.surahId);
    if (!surahId || surahId <= 0) return;

    setIsLoadingDurations(true);

    (async () => {
      try {
        const result = await fetchBatchVerseDurations(surahId, state.startAyah, state.endAyah, state.reciterId);
        if (!isMounted) return;

        const newDurations: Record<string, number> = {};
        for (const [ayahIdStr, dur] of Object.entries(result.durations)) {
          const cacheKey = `${state.reciterId}_${state.surahId}_${ayahIdStr}`;
          newDurations[cacheKey] = dur as number;
        }
        setMeasuredDurations(prev => ({ ...prev, ...newDurations }));
      } catch (e) {
        console.warn("[SurahSelector] Batch duration fetch failed:", e);
      } finally {
        if (isMounted) setIsLoadingDurations(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [state.surahId, state.startAyah, state.endAyah, state.reciterId, surahData]);

  const { durationInfo, optimalEndAyah } = useMemo(() => {
    const versesInRange = surahData?.verses?.filter(v => v.id >= state.startAyah && v.id <= state.endAyah) || [];
    let sec = 0;
    if (versesInRange.length === 0) {
      sec = Math.max(1, state.endAyah - state.startAyah + 1) * (state.reciterId.includes("mjwd") ? 35 : 12);
    } else {
      versesInRange.forEach(v => {
        const cacheKey = `${state.reciterId}_${state.surahId}_${v.id}`;
        const measured = measuredDurations[cacheKey];
        if (measured) {
          sec += measured;
        } else {
          sec += estimateVerseDurationFallback(v.text, state.reciterId);
        }
      });
    }

    const info = getShortsDurationInfo(sec);
    const { optimalEndAyah: optEnd } = findShortsOptimalEndAyah(
      surahData?.verses || [],
      state.startAyah,
      state.reciterId,
      measuredDurations,
      179
    );

    return {
      durationInfo: info,
      optimalEndAyah: optEnd,
    };
  }, [surahData, state.startAyah, state.endAyah, state.reciterId, measuredDurations]);

  const handleAutoFitShorts = () => {
    if (optimalEndAyah >= state.startAyah) {
      updateState({ endAyah: optimalEndAyah });
      setEndInput(optimalEndAyah.toString());
    }
  };

  return (
    <div className={`flex flex-col gap-5 font-['Tajawal']`}>
      <AyahSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* Search Button */}
      <button 
        onClick={() => !isSearchLocked && setIsSearchOpen(true)}
        className={`relative overflow-hidden group w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-500 shadow-xl ${isSearchLocked ? 'bg-foreground/5 border-foreground/5 opacity-50 cursor-not-allowed' : 'bg-primary/10 border-primary/20 hover:border-primary shadow-primary/5 hover:scale-[1.02]'}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex items-center gap-3 relative z-10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isSearchLocked ? 'bg-foreground/5 text-foreground/10' : 'bg-primary text-primary-foreground shadow-md group-hover:rotate-12'}`}>
                {isSearchLocked ? <Lock className="w-4 h-4" /> : <Search className="w-4 h-4 stroke-[3px]" />}
            </div>
            <div className="text-right">
                <span className={`block text-[10px] font-black uppercase tracking-widest ${isSearchLocked ? 'text-foreground/20' : 'text-primary'}`}>
                    {isSearchLocked ? 'ميزة البحث الذكي' : 'محرك البحث القرآني'}
                </span>
                <p className="text-[9px] text-foreground/40 mt-0.5">ابحث عن آية لبدء الفيديو</p>
            </div>
        </div>
        {!isSearchLocked && (
            <div className="w-7 h-7 rounded-full bg-foreground/5 flex items-center justify-center text-primary/40 group-hover:text-primary transition-colors">
                <ChevronDown className="w-3.5 h-3.5 -rotate-90 animate-pulse" />
            </div>
        )}
      </button>

      {/* Surah Dropdown */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-1">
            <div className="w-1 h-1 rounded-full bg-primary" />
            <label className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40">السورة الكريمة</label>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="ابحث عن السورة بالاسم أو الرقم..." 
            value={surahSearch}
            onChange={(e) => setSurahSearch(e.target.value)}
            className="w-full bg-foreground/5 border-2 border-foreground/5 p-3 px-4 rounded-xl outline-none text-xs text-foreground placeholder-foreground/30 transition-all duration-500 focus:border-primary/30 focus:bg-foreground/10 mb-1"
          />
        </div>
        <div className="relative group">
          <select 
            value={state.surahId}
            onChange={(e) => updateState({ surahId: e.target.value })}
            className="w-full bg-foreground/5 border-2 border-foreground/5 p-4 rounded-2xl outline-none appearance-none cursor-pointer text-sm font-bold text-foreground transition-all duration-500 hover:border-foreground/10 focus:border-primary/50 focus:bg-foreground/10 shadow-xl"
          >
            {filteredSurahs.map((s) => (
              <option key={s.id} value={s.id.toString()} className="bg-card text-foreground">
                {s.id}. {s.name}
              </option>
            ))}
          </select>
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary group-hover:scale-125 transition-transform duration-500">
             <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Ayah Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
             <div className="w-1 h-1 rounded-full bg-primary" />
             <label className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40">البداية</label>
          </div>
          <div className="relative">
            <input 
                type="number" 
                value={startInput}
                onChange={(e) => {
                    const val = e.target.value;
                    setStartInput(val);
                    const value = parseInt(val, 10);
                    if (!Number.isNaN(value)) {
                        const capped = Math.max(1, Math.min(maxVerses, value));
                        updateState({ startAyah: capped });
                    }
                }}
                onBlur={() => {
                    const valNum = parseInt(startInput, 10);
                    if (!startInput || isNaN(valNum) || valNum < 1) {
                        setStartInput("1");
                        updateState({ startAyah: 1 });
                    } else if (valNum > maxVerses) {
                        setStartInput(maxVerses.toString());
                        updateState({ startAyah: maxVerses });
                    }
                }}
                className="w-full bg-foreground/5 border-2 border-foreground/5 p-4 rounded-xl outline-none transition-all duration-500 text-sm font-bold text-foreground text-center focus:border-primary/50 focus:bg-foreground/10"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/10">
                <Hash className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
             <div className="w-1 h-1 rounded-full bg-primary" />
             <label className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40">النهاية</label>
          </div>
          <div className="relative">
            <input 
                type="number" 
                value={endInput}
                onChange={(e) => {
                    const val = e.target.value;
                    setEndInput(val);
                    const value = parseInt(val, 10);
                    if (!Number.isNaN(value)) {
                        const capped = Math.max(1, Math.min(maxVerses, value));
                        updateState({ endAyah: capped });
                    }
                }}
                onBlur={() => {
                    const valNum = parseInt(endInput, 10);
                    if (!endInput || isNaN(valNum) || valNum < 1) {
                        setEndInput(maxVerses.toString());
                        updateState({ endAyah: maxVerses });
                    } else if (valNum > maxVerses) {
                        setEndInput(maxVerses.toString());
                        updateState({ endAyah: maxVerses });
                    } else if (valNum < state.startAyah) {
                        setEndInput(state.startAyah.toString());
                        updateState({ endAyah: state.startAyah });
                    }
                }}
                className="w-full bg-foreground/5 border-2 border-foreground/5 p-4 rounded-xl outline-none transition-all duration-500 text-sm font-bold text-foreground text-center focus:border-primary/50 focus:bg-foreground/10"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/10">
                <Hash className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Selected Ayahs Hint & Audio Duration Card */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-4 py-3 bg-foreground/5 rounded-xl border border-foreground/5">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5 rtl:space-x-reverse">
              {[...Array(Math.min(3, state.endAyah - state.startAyah + 1))].map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[7px] font-bold text-primary">
                  {state.startAyah + i}
                </div>
              ))}
            </div>
            <span className="text-[9px] text-foreground/50 font-black uppercase tracking-[0.2em]">
              {state.endAyah - state.startAyah + 1} آيات مختارة
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-foreground/5 border border-foreground/10 text-xs font-mono font-black text-primary">
            <Clock className="w-3.5 h-3.5" />
            <span>{durationInfo.formattedTime}</span>
            <span className="text-[9px] text-foreground/40 font-normal">({durationInfo.totalSeconds}ث)</span>
          </div>
        </div>

        {/* ⏱️ بطاقة توافق YouTube Shorts */}
        {!durationInfo.isOverThreeMinutes ? (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-[10px] text-emerald-300 font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>✅ متوافق 100% مع YouTube Shorts (المدة أقل من 3 دقائق)</span>
            </div>
            <span className="text-[9px] font-mono opacity-80">{durationInfo.totalSeconds}/180ث</span>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
            <div className="flex items-start gap-2 text-[10px] text-amber-300 font-bold leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span>⚠️ المدة ({durationInfo.formattedArabic}) تتجاوز حد YouTube Shorts (3 دقائق = 180ث)!</span>
                <span className="text-[8.5px] text-amber-400/80 font-normal">
                  سينشر كفيديو عادي طويل على يوتيوب ولن يظهر في خلاصة الشورتس.
                </span>
              </div>
            </div>

            {optimalEndAyah >= state.startAyah && optimalEndAyah < state.endAyah && (
              <button
                type="button"
                onClick={handleAutoFitShorts}
                className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 rounded-xl text-[10px] font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>✂️ ضبط تلقائي لـ Shorts (ضبط النهاية لآية {optimalEndAyah})</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
