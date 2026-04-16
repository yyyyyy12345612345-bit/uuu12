"use client";

import React, { useState } from "react";
import surahsData from "@/data/surahs.json";
import { X, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

// THE CORE STABLE SHAMRELY SOURCE (Clean IDs: 1.png, 2.png...)
const SHAMRELY_ROOT = "https://raw.githubusercontent.com/spa5k/quran-images-shamreli/master/";

export function Shamrely() {
  const [selectedSurah, setSelectedSurah] = useState<typeof surahsData[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sourceKey, setSourceKey] = useState(0);

  const openSurah = (surah: typeof surahsData[0]) => {
    const pages = [1, 2, 50, 77, 106, 128, 151, 177, 187, 208, 221, 235, 249, 255, 262, 267, 282, 293, 305, 312, 322, 332, 342, 350, 359, 367, 377, 385, 396, 404, 411, 415, 418, 428, 434, 440, 446, 453, 458, 467, 477, 483, 489, 496, 499, 502, 507, 511, 515, 518, 520, 523, 526, 528, 531, 534, 537, 542, 545, 549, 551, 553, 554, 556, 558, 560, 562, 564, 566, 568, 570, 572, 574, 575, 577, 578, 580, 582, 583, 585, 587, 587, 589, 591, 591, 593, 594, 595, 596, 597, 597, 598, 599, 599, 600, 600, 601, 601, 602, 602, 603, 603, 603, 604, 604, 604, 604];
    setCurrentPage(pages[surah.id - 1] || 1);
    setSelectedSurah(surah);
  };

  const closeSurah = () => setSelectedSurah(null);
  const nextPage = () => setCurrentPage((p) => Math.min(604, p + 1));
  const prevPage = () => setCurrentPage((p) => Math.max(1, p - 1));

  return (
    <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden">
      <div className="flex-1 overflow-y-auto pt-28 pb-40 px-4 md:px-20 font-arabic">
        <div className="max-w-5xl mx-auto space-y-12">
            <h2 className="text-6xl font-bold text-center text-white">مصحف الشمرلي</h2>
          <div className="grid grid-cols-1 gap-4">
            {surahsData.map((surah) => (
              <button key={surah.id} onClick={() => openSurah(surah)} className="flex items-center justify-between p-7 rounded-[2rem] bg-white/[0.04] border border-white/5 hover:bg-primary/5 transition-all">
                <div className="flex items-center gap-8"><span className="text-xl font-bold text-primary">{surah.id}</span><span className="text-3xl font-bold text-white">{surah.name}</span></div>
                <ChevronLeft className="w-8 h-8 text-white/10" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedSurah && (
        <div className="fixed inset-0 z-[700] flex flex-col bg-black animate-in fade-in duration-300">
            <header className="h-20 flex items-center justify-between px-6 bg-black/80 border-b border-white/10">
              <button onClick={closeSurah} className="p-3 bg-white/5 rounded-2xl"><X className="w-6 h-6 text-white" /></button>
              <div className="flex items-center gap-4">
                 <button onClick={prevPage} className="p-2"><ChevronRight className="w-8 h-8 text-white" /></button>
                 <div className="text-center"><h3 className="text-xl font-bold text-primary">سورة {selectedSurah.name}</h3><p className="text-[10px] text-white/40">ص {currentPage}</p></div>
                 <button onClick={nextPage} className="p-2"><ChevronLeft className="w-8 h-8 text-white" /></button>
              </div>
              <div className="w-10 h-10" />
            </header>

            <div className="flex-1 overflow-y-auto bg-[#111]">
                <div className="w-full flex justify-center py-4">
                    <img 
                        key={`${currentPage}-${sourceKey}`}
                        src={`${SHAMRELY_ROOT}${currentPage}.png`}
                        className="w-full max-w-[1200px] h-auto object-contain"
                        alt="Shamrely Page"
                        onError={() => setSourceKey(k => k + 1)}
                    />
                </div>
                
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-10 bg-black/90 px-10 py-5 rounded-full border border-white/10 shadow-2xl">
                    <button onClick={prevPage} className="text-white hover:text-primary"><ChevronRight className="w-10 h-10" /></button>
                    <button onClick={nextPage} className="text-white hover:text-primary"><ChevronLeft className="w-10 h-10" /></button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
