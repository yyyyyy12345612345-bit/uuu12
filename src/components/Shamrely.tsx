"use client";

import React, { useState } from "react";
import surahsData from "@/data/surahs.json";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// THE ABSOLUTE FINAL RELIABLE SOURCE (USED BY MILLIONS)
const SHAMRELY_FINAL_ROOT = "https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=https://quran.archive.org/data/shamreli/";

export function Shamrely() {
  const [selectedSurah, setSelectedSurah] = useState<typeof surahsData[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const openSurah = (surah: typeof surahsData[0]) => {
    const pages = [1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 587, 587, 589, 591, 591, 593, 594, 595, 596, 597, 597, 598, 599, 599, 600, 600, 601, 601, 602, 602, 603, 603, 603, 604, 604, 604, 604];
    setCurrentPage(pages[surah.id - 1] || 1);
    setSelectedSurah(surah);
    setIsLoading(true);
  };

  const closeSurah = () => setSelectedSurah(null);
  const nextPage = () => { setIsLoading(true); setCurrentPage((p) => Math.min(604, p + 1)); };
  const prevPage = () => { setIsLoading(true); setCurrentPage((p) => Math.max(1, p - 1)); };

  return (
    <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden font-arabic">
      <div className="flex-1 overflow-y-auto pt-28 pb-40 px-4 md:px-20">
        <div className="max-w-5xl mx-auto space-y-12">
            <h2 className="text-6xl md:text-8xl font-black text-white italic text-center">طبعة الشمرلي</h2>
            <div className="grid grid-cols-1 gap-6">
                {surahsData.map((surah) => (
                <button key={surah.id} onClick={() => openSurah(surah)} className="flex items-center justify-between p-8 rounded-[3rem] bg-white/[0.04] border border-white/10 hover:bg-primary/10 transition-all shadow-xl">
                    <div className="flex items-center gap-10">
                        <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center border border-primary/20 shadow-inner"><span className="text-xl font-bold text-primary">{surah.id}</span></div>
                        <span className="text-4xl font-bold text-white tracking-widest">{surah.name}</span>
                    </div>
                    <ChevronLeft className="w-8 h-8 text-white/10" />
                </button>
                ))}
            </div>
        </div>
      </div>

      {selectedSurah && (
        <div className="fixed inset-0 z-[900] flex flex-col bg-black animate-in fade-in duration-300">
            <header className="h-24 flex items-center justify-between px-8 bg-black/95 border-b border-white/5 backdrop-blur-3xl">
              <button onClick={closeSurah} className="p-4 bg-white/5 rounded-3xl"><X className="w-7 h-7 text-white" /></button>
              <div className="flex items-center gap-6">
                 <button onClick={prevPage} className="p-3 bg-white/5 rounded-2xl"><ChevronRight className="w-10 h-10 text-white" /></button>
                 <div className="text-center min-w-[200px]"><h3 className="text-3xl font-bold text-primary font-arabic">سورة {selectedSurah.name}</h3><p className="text-[12px] text-white/30 tracking-widest uppercase">Page {currentPage}</p></div>
                 <button onClick={nextPage} className="p-3 bg-white/5 rounded-2xl"><ChevronLeft className="w-10 h-10 text-white" /></button>
              </div>
              <div className="w-12 h-12" />
            </header>

            <div className="flex-1 overflow-y-auto no-scrollbar bg-[#080808] relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black z-50">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    </div>
                )}
                <div className="w-full flex justify-center py-6">
                    <img 
                        key={currentPage}
                        src={`${SHAMRELY_FINAL_ROOT}${currentPage}.png`}
                        className="w-full max-w-[1200px] h-auto object-contain shadow-2xl rounded-2xl"
                        alt="Holy Quran Page"
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                    />
                </div>
                
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-20 bg-black/80 px-14 py-7 rounded-full border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                    <button onClick={prevPage} className="text-white hover:text-primary transition-all scale-125"><ChevronRight className="w-10 h-10" /></button>
                    <button onClick={nextPage} className="text-white hover:text-primary transition-all scale-125"><ChevronLeft className="w-10 h-10" /></button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
