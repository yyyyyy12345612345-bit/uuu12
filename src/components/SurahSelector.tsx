"use client";

import React, { useEffect, useState } from "react";
import surahsData from "@/data/surahs.json";
import { useEditor } from "@/store/useEditor";
import { ChevronDown } from "lucide-react";

export function SurahSelector() {
  const { state, updateState } = useEditor();
  const [maxVerses, setMaxVerses] = useState(7);

  useEffect(() => {
    const surah = surahsData.find(s => s.id.toString() === state.surahId);
    if (surah) {
      setMaxVerses(surah.total_verses);
      let updates: Partial<{ startAyah: number; endAyah: number }> = {};

      if (state.startAyah < 1) {
        updates.startAyah = 1;
      }

      if (state.startAyah > surah.total_verses) {
        updates.startAyah = surah.total_verses;
      }

      if (state.endAyah < state.startAyah) {
        updates.endAyah = state.startAyah;
      }

      if (state.endAyah > surah.total_verses) {
        updates.endAyah = surah.total_verses;
      }

      if (Object.keys(updates).length > 0) {
        updateState(updates);
      }
    }
  }, [state.surahId, state.startAyah, state.endAyah, updateState]);

  const [startInput, setStartInput] = useState(state.startAyah.toString());
  const [endInput, setEndInput] = useState(state.endAyah.toString());

  // Sync back if global state changes (e.g. surah changed)
  useEffect(() => {
    setStartInput(state.startAyah.toString());
    setEndInput(state.endAyah.toString());
  }, [state.startAyah, state.endAyah]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 mr-2 font-bold">السورة الكريمة</label>
        <div className="relative group">
          <select 
            value={state.surahId}
            onChange={(e) => updateState({ surahId: e.target.value })}
            className="w-full bg-white/[0.03] border border-white/5 p-4 rounded-2xl focus:border-primary/40 focus:bg-white/[0.05] outline-none appearance-none cursor-pointer text-base font-bold text-white transition-all shadow-xl"
          >
            {surahsData.map((s) => (
              <option key={s.id} value={s.id.toString()} className="bg-[#0a0a0a] text-white">
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
          <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 mr-2 font-bold">بداية المقطع</label>
          <input 
            type="number" 
            min="1"
            max={maxVerses}
            value={startInput}
            onChange={(e) => {
              setStartInput(e.target.value);
              const value = parseInt(e.target.value, 10);
              if (!Number.isNaN(value) && value > 0 && value <= maxVerses) {
                updateState({ startAyah: value });
              }
            }}
            className="w-full bg-white/[0.03] border border-white/5 p-4 rounded-2xl focus:border-primary/40 focus:bg-white/[0.05] outline-none transition-all text-base font-bold text-white text-center"
          />
        </div>
        <div className="flex flex-col gap-2.5">
          <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 mr-2 font-bold">نهاية المقطع</label>
          <input 
            type="number" 
            min="1"
            max={maxVerses}
            value={endInput}
            onChange={(e) => {
              setEndInput(e.target.value);
              const value = parseInt(e.target.value, 10);
              if (!Number.isNaN(value) && value > 0 && value <= maxVerses) {
                updateState({ endAyah: value });
              }
            }}
            className="w-full bg-white/[0.03] border border-white/5 p-4 rounded-2xl focus:border-primary/40 focus:bg-white/[0.05] outline-none transition-all text-base font-bold text-white text-center"
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="h-px flex-1 bg-white/5" />
        <span className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">
          {state.endAyah - state.startAyah + 1} آيات مختارة
        </span>
        <div className="h-px flex-1 bg-white/5" />
      </div>
    </div>

  );
}
