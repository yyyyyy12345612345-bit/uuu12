"use client";

import React, { useState } from "react";
import surahsData from "@/data/surahs.json";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// GOOGLE PROXY + ARCHIVE.ORG (The Ultimate Combination)
const GOOGLE_PROXY = "https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=";
const SHAMRELY_ROOT = "https://quran.archive.org/data/shamreli/";

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
        <div className="max-w-5xl mx-auto space-y-12 text-center">
            <h2 className="text-6xl md:text-8xl font-black text-white italic">طبعة الشمرلي</h2>
            <div className="grid grid-cols-1 gap-4 mt-16">
                {surahsData.map((surah) => (
                <button key={surah.id} onClick={() => openSurah(surah)} className="flex items-center justify-between p-8 rounded-[3rem] bg-white/[0.04] border border-white/5 hover:bg-primary/10 transition-all group">
                    <div className="flex items-center gap-10">
                        <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center border border-white/10 group-hover:bg-primary/20"><span className="text-xl font-bold text-primary">{surah.id}</span></div>
                        <span className="text-4xl font-bold text-white tracking-tighter">{surah.name}</span>
                    </div>
                </button>
                ))}
            </div>
        </div>
      </div>

      {selectedSurah && (
        <div className="fixed inset-0 z-[800] flex flex-col bg-black animate-in fade-in duration-300">
            <header className="h-20 flex items-center justify-between px-6 bg-black border-b border-white/10">
              <button onClick={closeSurah} className="p-3 bg-white/5 rounded-2xl"><X className="w-6 h-6 text-white" /></button>
              <div className="flex items-center gap-4">
                 <button onClick={prevPage} className="p-2"><ChevronRight className="w-8 h-8 text-white" /></button>
                 <div className="text-center"><h3 className="text-xl font-bold text-primary">سورة {selectedSurah.name}</h3><p className="text-[10px] text-white/40">ص {currentPage}</p></div>
                 <button onClick={nextPage} className="p-2"><ChevronLeft className="w-8 h-8 text-white" /></button>
              </div>
              <div className="w-10 h-10" />
            </header>

            <div className="flex-1 overflow-y-auto bg-[#111] relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#111] z-50">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    </div>
                )}
                <div className="w-full flex justify-center py-4">
                    <img 
                        key={currentPage}
                        src={`${GOOGLE_PROXY}${encodeURIComponent(`${SHAMRELY_ROOT}${currentPage}.png`)}`}
                        className="w-full max-w-[1200px] h-auto object-contain shadow-2xl"
                        alt="Shamrely Page"
                        onLoad={() => setIsLoading(false)}
                    />
                </div>
                
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-20 bg-black/90 px-12 py-6 rounded-full border border-white/10 shadow-3xl">
                    <button onClick={prevPage} className="text-white hover:text-primary active:scale-90"><ChevronRight className="w-12 h-12" /></button>
                    <button onClick={nextPage} className="text-white hover:text-primary active:scale-90"><ChevronLeft className="w-12 h-12" /></button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
