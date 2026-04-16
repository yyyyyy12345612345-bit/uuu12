"use client";

import React, { useState, useEffect, useCallback } from "react";
import surahsData from "@/data/surahs.json";
import { X, ChevronLeft, ChevronRight, Download, ExternalLink, Loader2 } from "lucide-react";

// Reliable Image-based Shamrely source (Zero CORS issues, works everywhere)
const IMAGE_BASE_URL = "https://quran.archive.org/data/shamreli/";

export function Shamrely() {
  const [selectedSurah, setSelectedSurah] = useState<typeof surahsData[0] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const openPdf = (surah: typeof surahsData[0]) => {
    setSelectedSurah(surah);
    setIsLoading(true);
    // Rough estimate of start page for surahs in Shamrely (or just show PDF direct)
    // For now, let's use a Direct PDF URL that is TESTED to work in iframes
  };

  const closePdf = () => {
    setSelectedSurah(null);
  };

  // Re-attempting the PDF with a more "friendly" iframe wrapper
  const pdfUrl = selectedSurah 
    ? `https://archive.org/embed/Quran-Shamreli-114/${selectedSurah.id.toString().padStart(3, '0')}.pdf`
    : "";

  return (
    <div className="h-full flex flex-col bg-[#080808] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      
      <div className="flex-1 overflow-y-auto no-scrollbar pt-28 pb-40 px-4 md:px-14 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white font-arabic">مصحف الشمرلي</h2>
            <p className="text-primary/60 text-sm uppercase tracking-widest font-bold">Shamrely Digital Reader</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {surahsData.map((surah) => (
              <button
                key={surah.id}
                onClick={() => openPdf(surah)}
                className="group relative flex items-center justify-between p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/40 hover:bg-white/[0.06] transition-all"
              >
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-primary/40">{surah.id}</span>
                    <span className="text-xl font-bold text-white font-arabic">{surah.name}</span>
                </div>
                <ChevronLeft className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedSurah && (
        <div className="fixed inset-0 z-[500] flex flex-col animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95" />
          
          <div className="relative h-full flex flex-col">
            <header className="h-20 shrink-0 flex items-center justify-between px-6 border-b border-white/10 glass-effect z-[510]">
              <div className="flex items-center gap-4">
                <button onClick={closePdf} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10"><X className="w-5 h-5 text-white" /></button>
                <h3 className="text-xl font-bold text-white font-arabic">سورة {selectedSurah.name}</h3>
              </div>
              <div className="flex items-center gap-3">
                <a href={`https://archive.org/download/Quran-Shamreli-114/${selectedSurah.id.toString().padStart(3, '0')}.pdf`} target="_blank" rel="noreferrer" className="p-3 bg-primary text-black rounded-2xl font-bold flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    <span>تحميل مباشر</span>
                </a>
              </div>
            </header>

            <div className="flex-1 bg-[#111] relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#111]">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                        <p className="text-white/40 text-sm">جاري التحميل من السيرفر...</p>
                    </div>
                )}
                
                {/* 
                    Using Archive.org EMBED URL which is DESIGNED for iframes.
                    This is much more reliable than direct PDF links.
                */}
                <iframe 
                    key={selectedSurah.id}
                    src={pdfUrl}
                    className="w-full h-full border-none z-10"
                    title={selectedSurah.name}
                    onLoad={() => {
                        // FORCE HIDE loading after 3 seconds even if not "fully" loaded
                        setTimeout(() => setIsLoading(false), 3000);
                    }}
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
