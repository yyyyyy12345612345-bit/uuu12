"use client";

import React, { useState, useEffect } from "react";
import surahsData from "@/data/surahs.json";
import { X, ChevronLeft, ChevronRight, Loader2, BookOpen } from "lucide-react";

// GLOBAL OFFICIAL QURAN IMAGE CDN (100% Reliable & Fast)
const PAGE_IMAGE_API = "https://images.quran.com/images/quran/pages/";

export function Shamrely() {
  const [selectedSurah, setSelectedSurah] = useState<typeof surahsData[0] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const openSurah = (surah: typeof surahsData[0]) => {
    const startPage = getStartPage(surah.id);
    setCurrentPage(startPage);
    setSelectedSurah(surah);
    setIsLoading(true);
  };

  const closeSurah = () => {
    setSelectedSurah(null);
  };

  const nextPage = () => setCurrentPage((p) => Math.min(604, p + 1));
  const prevPage = () => setCurrentPage((p) => Math.max(1, p - 1));

  // Global Madani/Shamrely standard paging
  const getStartPage = (id: number) => {
    const pages = [1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 587, 587, 589, 591, 591, 593, 594, 595, 596, 597, 597, 598, 599, 599, 600, 600, 601, 601, 602, 602, 603, 603, 603, 604, 604, 604, 604, 605, 605, 605, 606, 606, 606, 606];
    return pages[id - 1] || 1;
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] -z-10" />
      
      <div className="flex-1 overflow-y-auto no-scrollbar pt-28 pb-40 px-4 md:px-20 relative z-10 font-arabic">
        <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
                <h2 className="text-5xl md:text-7xl font-bold text-white">طبعة الشمرلي</h2>
                <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
            </div>

          {/* Grid Layout: Column on Mobile, Grid on Tablet/Desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 mt-12 pb-20">
            {surahsData.map((surah) => (
              <button
                key={surah.id}
                onClick={() => openSurah(surah)}
                className="group relative flex items-center justify-between p-6 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center border border-white/10 group-hover:border-primary/40 group-hover:bg-primary/20 transition-all">
                        <span className="text-sm font-bold text-primary">{surah.id}</span>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-white block">{surah.name}</span>
                        <span className="text-[10px] text-white/30 uppercase tracking-widest">Surah {surah.id}</span>
                    </div>
                </div>
                <BookOpen className="w-6 h-6 text-white/10 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedSurah && (
        <div className="fixed inset-0 z-[600] flex flex-col animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" />
          
          <div className="relative h-full flex flex-col">
            <header className="h-20 shrink-0 flex items-center justify-between px-6 z-[610] bg-black/40 border-b border-white/5">
              <button onClick={closeSurah} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10"><X className="w-6 h-6" /></button>
              
              <div className="flex items-center gap-4">
                 <button onClick={nextPage} className="p-3 bg-white/5 rounded-2xl hover:bg-primary/20"><ChevronRight className="w-6 h-6" /></button>
                 <div className="text-center min-w-[150px]">
                    <h3 className="text-2xl font-bold text-primary">سورة {selectedSurah.name}</h3>
                    <p className="text-[10px] text-white/40 font-bold">PAGE {currentPage}</p>
                 </div>
                 <button onClick={prevPage} className="p-3 bg-white/5 rounded-2xl hover:bg-primary/20"><ChevronLeft className="w-6 h-6" /></button>
              </div>

              <div className="w-12 h-12" />
            </header>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#080808]">
                {/* Visual navigation layers */}
                <div className="absolute inset-x-0 w-full h-full flex z-20 pointer-events-none">
                    <div className="w-1/2 h-full pointer-events-auto cursor-w-resize" onClick={prevPage} />
                    <div className="w-1/2 h-full pointer-events-auto cursor-e-resize" onClick={nextPage} />
                </div>

                {isLoading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#080808]">
                        <Loader2 className="w-14 h-14 text-primary animate-spin mb-6" />
                        <p className="text-white/30 text-xs font-bold uppercase tracking-[0.5em]">Loading High-Quality Page...</p>
                    </div>
                )}
                
                <img 
                    key={currentPage}
                    src={`${PAGE_IMAGE_API}${currentPage}.png`}
                    className="h-full object-contain shadow-[0_0_100px_rgba(196,164,132,0.1)] rounded-lg"
                    alt={`Quran Page ${currentPage}`}
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
