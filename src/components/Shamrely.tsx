"use client";

import React, { useState, useEffect } from "react";
import surahsData from "@/data/surahs.json";
import { X, ChevronLeft, ChevronRight, Loader2, Maximize2 } from "lucide-react";

// The Best Image API for Quran Pages (Madani/Shamreli style)
const PAGE_IMAGE_API = "https://android.quran.com/data/z/images_local/width_1024/";

export function Shamrely() {
  const [selectedSurah, setSelectedSurah] = useState<typeof surahsData[0] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const openSurah = (surah: typeof surahsData[0]) => {
    // Each surah starts at a specific page. 
    // This is a rough mapping for Shamrely/Madani style
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

  // Start pages for each surah (Standard Madani/Shamrely)
  const getStartPage = (id: number) => {
    const pages = [1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 587, 587, 589, 591, 591, 593, 594, 595, 596, 597, 597, 598, 599, 599, 600, 600, 601, 601, 602, 602, 603, 603, 603, 604, 604, 604, 604, 605, 605, 605, 606, 606, 606, 606];
    return pages[id - 1] || 1;
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-primary/10 blur-[100px] pointer-events-none" />
      
      <div className="flex-1 overflow-y-auto no-scrollbar pt-28 pb-40 px-4 md:px-14 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-4xl md:text-6xl font-bold text-white font-arabic italic">مصحف الشمرلي</h2>
                <p className="text-primary/60 text-xs uppercase tracking-[0.3em] font-bold">The Royal Digital Experience</p>
            </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-12 pb-20">
            {surahsData.map((surah) => (
              <button
                key={surah.id}
                onClick={() => openSurah(surah)}
                className="group flex flex-col items-center gap-3 p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all duration-500"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-primary/20 transition-all">
                    <span className="text-sm font-bold text-primary/40 group-hover:text-primary">{surah.id}</span>
                </div>
                <span className="text-lg font-bold text-white font-arabic group-hover:scale-110 transition-transform">{surah.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedSurah && (
        <div className="fixed inset-0 z-[600] flex flex-col animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" />
          
          <div className="relative h-full flex flex-col">
            <header className="h-20 shrink-0 flex items-center justify-between px-6 z-[610]">
              <button onClick={closeSurah} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10"><X className="w-6 h-6" /></button>
              
              <div className="flex items-center gap-6">
                 <button onClick={nextPage} className="p-3 bg-white/5 rounded-2xl hover:bg-primary/20"><ChevronRight className="w-6 h-6" /></button>
                 <div className="text-center">
                    <h3 className="text-xl font-bold text-primary font-arabic">سورة {selectedSurah.name}</h3>
                    <p className="text-[10px] text-white/30 uppercase font-bold">Page {currentPage} of 604</p>
                 </div>
                 <button onClick={prevPage} className="p-3 bg-white/5 rounded-2xl hover:bg-primary/20"><ChevronLeft className="w-6 h-6" /></button>
              </div>

              <button className="p-3 bg-white/5 rounded-2xl md:opacity-0"><Maximize2 className="w-5 h-5" /></button>
            </header>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden p-2 md:p-10">
                <div className="absolute inset-x-0 top-0 bottom-0 flex justify-between z-20 pointer-events-none">
                    <div className="w-1/4 h-full pointer-events-auto cursor-pointer" onClick={prevPage} />
                    <div className="w-1/4 h-full pointer-events-auto cursor-pointer" onClick={nextPage} />
                </div>

                {isLoading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Loading Digital Page...</p>
                    </div>
                )}
                
                <img 
                    key={currentPage}
                    src={`${PAGE_IMAGE_API}${currentPage}.png`}
                    className="h-full object-contain shadow-[0_0_100px_rgba(196,164,132,0.15)] rounded-lg transition-all duration-700"
                    alt={`Quran Page ${currentPage}`}
                    onLoad={() => setIsLoading(false)}
                />
            </div>
            
            <footer className="h-16 shrink-0 flex items-center justify-center gap-2 pb-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 2 ? 'bg-primary' : 'bg-white/10'}`} />
                ))}
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
