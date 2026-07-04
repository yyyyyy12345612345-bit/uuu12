"use client";

import React, { useEffect, useState } from "react";
import surahsData from "@/data/surahs.json";
import { useEditor } from "@/store/useEditor";
import { ChevronDown, Search, Lock, Crown, Hash } from "lucide-react";
import { AyahSearchModal } from "./AyahSearchModal";
import { useUserPlan } from "@/hooks/useUserPlan";

export function SurahSelector() {
  const { state, updateState } = useEditor();
  const [maxVerses, setMaxVerses] = useState(7);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isFeatureLocked } = useUserPlan();

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
      const cleanEnglish = s.english.toLowerCase();
      return cleanName.includes(cleanSearch) || cleanEnglish.includes(cleanSearch) || s.id.toString() === cleanSearch;
    });
  }, [surahSearch]);

  useEffect(() => {
    setStartInput(state.startAyah.toString());
    setEndInput(state.endAyah.toString());
  }, [state.startAyah, state.endAyah]);

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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isSearchLocked ? 'bg-foreground/5 text-foreground/10' : 'bg-primary text-black shadow-xl shadow-primary/20 group-hover:rotate-12'}`}>
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
                    if (!Number.isNaN(value)) updateState({ startAyah: value });
                }}
                onBlur={() => {
                    if (!startInput || parseInt(startInput) < 1) {
                        setStartInput("1");
                        updateState({ startAyah: 1 });
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
                    if (!Number.isNaN(value)) updateState({ endAyah: value });
                }}
                onBlur={() => {
                    if (!endInput || parseInt(endInput) < 1) {
                        setEndInput(maxVerses.toString());
                        updateState({ endAyah: maxVerses });
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
      
      {/* Selected Ayahs Hint */}
      <div className="flex items-center gap-4 px-4 py-3 bg-foreground/5 rounded-xl border border-foreground/5">
        <div className="flex -space-x-1.5 rtl:space-x-reverse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="w-5 h-5 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center text-[7px] font-bold text-primary">
                    {state.startAyah + i}
                </div>
            ))}
        </div>
        <span className="text-[9px] text-foreground/40 font-black uppercase tracking-[0.3em]">
          {state.endAyah - state.startAyah + 1} آيات مختارة للتصميم
        </span>
      </div>
    </div>
  );
}
