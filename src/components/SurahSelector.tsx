"use client";

import React, { useEffect, useState } from "react";
import surahsData from "@/data/surahs.json";
import { useEditor } from "@/store/useEditor";
import { ChevronDown, Search } from "lucide-react";
import { AyahSearchModal } from "./AyahSearchModal";

export function SurahSelector() {
  const { state, updateState } = useEditor();
  const [maxVerses, setMaxVerses] = useState(7);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const surah = surahsData.find(s => s.id.toString() === state.surahId);
    if (surah) {
      setMaxVerses(surah.total_verses);
      // Only clamp if surah changed and current values are definitely out of range
      if (state.startAyah > surah.total_verses) {
        updateState({ startAyah: 1 });
      }
      if (state.endAyah > surah.total_verses) {
        updateState({ endAyah: surah.total_verses });
      }
    }
  }, [state.surahId, updateState]);

  const [startInput, setStartInput] = useState(state.startAyah.toString());
  const [endInput, setEndInput] = useState(state.endAyah.toString());

  // Sync back if global state changes
  useEffect(() => {
    setStartInput(state.startAyah.toString());
    setEndInput(state.endAyah.toString());
  }, [state.startAyah, state.endAyah]);

  return (
    <div className="flex flex-col gap-6">
      <AyahSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* Smart Search Initiation */}
      <button 
        onClick={() => setIsSearchOpen(true)}
        className="w-full flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-2xl hover:bg-primary/20 transition-all group animate-in slide-in-from-top-4 duration-500 shadow-lg shadow-primary/5"
      >
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Search className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold font-arabic text-primary">ابحث عن آية للفيديو...</span>
        </div>
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </div>
      </button>

      <div className="flex flex-col gap-2.5">
        <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/30 mr-2 font-bold">السورة الكريمة</label>
        <div className="relative group">
          <select 
            value={state.surahId}
            onChange={(e) => updateState({ surahId: e.target.value })}
            className="w-full bg-foreground/[0.03] border border-border p-4 rounded-2xl focus:border-primary/40 focus:bg-foreground/[0.05] outline-none appearance-none cursor-pointer text-base font-bold text-foreground transition-all shadow-xl"
          >
            {surahsData.map((s) => (
              <option key={s.id} value={s.id.toString()} className="bg-background text-foreground">
                {s.id}. {s.name}
              </option>
            ))}
          </select>
          <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">
             <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2.5">
          <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/30 mr-2 font-bold">بداية المقطع</label>
          <input 
            type="number" 
            value={startInput}
            onChange={(e) => {
              const val = e.target.value;
              setStartInput(val);
              const value = parseInt(val, 10);
              if (!Number.isNaN(value)) {
                updateState({ startAyah: value });
              }
            }}
            onBlur={() => {
                if (!startInput || parseInt(startInput) < 1) {
                    setStartInput("1");
                    updateState({ startAyah: 1 });
                }
            }}
            className="w-full bg-foreground/[0.03] border border-border p-4 rounded-2xl focus:border-primary/40 focus:bg-foreground/[0.05] outline-none transition-all text-base font-bold text-foreground text-center"
          />
        </div>
        <div className="flex flex-col gap-2.5">
          <label className="text-[10px] uppercase tracking-[0.2em] text-foreground/30 mr-2 font-bold">نهاية المقطع</label>
          <input 
            type="number" 
            value={endInput}
            onChange={(e) => {
              const val = e.target.value;
              setEndInput(val);
              const value = parseInt(val, 10);
              if (!Number.isNaN(value)) {
                updateState({ endAyah: value });
              }
            }}
            onBlur={() => {
                if (!endInput || parseInt(endInput) < 1) {
                    setEndInput(maxVerses.toString());
                    updateState({ endAyah: maxVerses });
                }
            }}
            className="w-full bg-foreground/[0.03] border border-border p-4 rounded-2xl focus:border-primary/40 focus:bg-foreground/[0.05] outline-none transition-all text-base font-bold text-foreground text-center"
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="h-px flex-1 bg-foreground/5" />
        <span className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">
          {state.endAyah - state.startAyah + 1} آيات مختارة
        </span>
        <div className="h-px flex-1 bg-foreground/5" />
      </div>
    </div>

  );
}
