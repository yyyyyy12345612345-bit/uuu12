"use client";

import React, { useState, useEffect } from "react";
import surahsData from "@/data/surahs.json";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// FIXED: Added 3-digit padding (001, 002...) to match the server requirements
const SHAMRELY_IMAGE_API = "https://everyayah.com/data/images_shamrely/";

export function Shamrely() {
  const [selectedSurah, setSelectedSurah] = useState<typeof surahsData[0] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const openSurah = (surah: typeof surahsData[0]) => {
    const startPage = getStartPage(surah.id);
    setCurrentPage(startPage);
    setSelectedSurah(surah);
    setIsLoading(true);
    
    // Safety Force-hide loader after 2s
    setTimeout(() => setIsLoading(false), 2000);
  };

  const closeSurah = () => {
    setSelectedSurah(null);
  };

  const nextPage = () => {
    setIsLoading(true);
    setCurrentPage((p) => Math.min(604, p + 1));
  };
  const prevPage = () => {
    setIsLoading(true);
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const getStartPage = (id: number) => {
    const pages = [1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 587, 587, 589, 591, 591, 593, 594, 595, 596, 597, 597, 598, 599, 599, 600, 600, 601, 601, 602, 602, 603, 603, 603, 604, 604, 604, 604];
    return pages[id - 1] || 1;
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar pt-28 pb-40 px-4 md:px-20 relative z-10 font-arabic">
        <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <h2 className="text-5xl md:text-7xl font-bold text-white uppercase italic">طبعة الشمرلي</h2>
                <p className="text-primary/60 text-[10px] font-bold tracking-[0.4em] uppercase">Original Scanned High-Res</p>
            </div>

          <div className="grid grid-cols-1 gap-4 mt-12 pb-20">
            {surahsData.map((surah) => (
              <button
                key={surah.id}
                onClick={() => openSurah(surah)}
                className="group relative flex items-center justify-between p-7 rounded-[2.5rem] bg-white/[0.04] border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                <div className="flex items-center gap-10">
                    <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center border border-white/10 group-hover:bg-primary/20 transition-all">
                        <span className="text-xl font-bold text-primary">{surah.id}</span>
                    </div>
                    <span className="text-3xl font-bold text-white font-arabic">{surah.name}</span>
                </div>
                <ChevronLeft className="w-8 h-8 text-white/5 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedSurah && (
        <div className="fixed inset-0 z-[600] flex flex-col animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/98" />
          
          <div className="relative h-full flex flex-col">
            <header className="h-20 shrink-0 flex items-center justify-between px-6 z-[610] bg-black/80 border-b border-white/5 backdrop-blur-xl">
              <button onClick={closeSurah} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10"><X className="w-6 h-6 text-white" /></button>
              
              <div className="flex items-center gap-4">
                 <button onClick={prevPage} className="p-3 bg-white/5 rounded-2xl hover:bg-primary/20"><ChevronRight className="w-6 h-6 text-white" /></button>
                 <div className="text-center min-w-[120px]">
                    <h3 className="text-xl font-bold text-primary font-arabic">سورة {selectedSurah.name}</h3>
                    <p className="text-[10px] text-white/40">PAGE {currentPage}</p>
                 </div>
                 <button onClick={nextPage} className="p-3 bg-white/5 rounded-2xl hover:bg-primary/20"><ChevronLeft className="w-6 h-6 text-white" /></button>
              </div>

              <div className="w-12 h-12" />
            </header>

            <div className="flex-1 relative overflow-y-auto no-scrollbar bg-[#111] overscroll-contain">
                {isLoading && (
                    <div className="sticky top-0 h-full w-full z-50 flex flex-col items-center justify-center bg-[#111]">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-white/20 text-[10px] font-bold tracking-widest uppercase">Fetching HD Page...</p>
                    </div>
                )}
                
                <div className="w-full flex justify-center py-4 bg-[#111]">
                    <img 
                        key={currentPage}
                        src={`${SHAMRELY_IMAGE_API}${currentPage.toString().padStart(3, '0')}.png`}
                        className="w-full max-w-[1200px] h-auto object-contain shadow-2xl rounded-lg"
                        alt={`Shamrely Quran Page ${currentPage}`}
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                    />
                </div>
                
                {!isLoading && (
                    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex items-center gap-10 z-[620] bg-black/80 backdrop-blur-md px-10 py-5 rounded-full border border-white/5 shadow-2xl">
                        <button onClick={prevPage} className="text-white hover:text-primary transition-all"><ChevronRight className="w-8 h-8" /></button>
                        <div className="h-6 w-px bg-white/10" />
                        <span className="text-xs font-bold text-white/50">{currentPage} / 604</span>
                        <div className="h-6 w-px bg-white/10" />
                        <button onClick={nextPage} className="text-white hover:text-primary transition-all"><ChevronLeft className="w-8 h-8" /></button>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
