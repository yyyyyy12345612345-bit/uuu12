"use client";

import React, { useState, useEffect, useCallback } from "react";
import surahsData from "@/data/surahs.json";
import { X, ChevronLeft, ChevronRight, Download, ExternalLink, Loader2, RefreshCw } from "lucide-react";

// SUPER FAST GITHUB & CLOUD CDN SOURCES (No proxy needed, works 100% in embed)
const PDF_SOURCES = [
  "https://raw.githubusercontent.com/spa5k/quran-pdf/master/shamreli/",
  "https://cdn.jsdelivr.net/gh/spa5k/quran-pdf@master/shamreli/",
  "https://archive.org/download/Quran-Shamreli-114/"
];

export function Shamrely() {
  const [selectedSurah, setSelectedSurah] = useState<typeof surahsData[0] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sourceIndex, setSourceIndex] = useState(0);

  const openPdf = (surah: typeof surahsData[0]) => {
    setSelectedSurah(surah);
    setIsLoading(true);
    setSourceIndex(0);
  };

  const closePdf = () => {
    setSelectedSurah(null);
  };

  const navigateSurah = useCallback((direction: 'next' | 'prev') => {
    if (!selectedSurah) return;
    const currentIndex = surahsData.findIndex(s => s.id === selectedSurah.id);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= surahsData.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = surahsData.length - 1;
    
    setIsLoading(true);
    setSourceIndex(0);
    setSelectedSurah(surahsData[nextIndex]);
  }, [selectedSurah]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedSurah) return;
      if (e.key === "ArrowRight") navigateSurah('prev');
      if (e.key === "ArrowLeft") navigateSurah('next');
      if (e.key === "Escape") closePdf();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSurah, navigateSurah]);

  const pdfUrl = selectedSurah 
    ? `${PDF_SOURCES[sourceIndex]}${selectedSurah.id.toString().padStart(3, '0')}.pdf`
    : "";

  return (
    <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none opacity-40" />
      
      <div className="flex-1 overflow-y-auto no-scrollbar pt-28 pb-40 px-4 md:px-14 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white font-arabic italic">مصحف الشمرلي</h2>
            <p className="text-primary/60 text-sm uppercase tracking-widest font-bold">Premium Digital Edition</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {surahsData.map((surah) => (
              <button
                key={surah.id}
                onClick={() => openPdf(surah)}
                className="group relative flex items-center justify-between p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-primary/40 hover:bg-white/[0.06] transition-all duration-500 overflow-hidden shadow-xl"
              >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <span className="text-xs font-bold text-primary">{surah.id}</span>
                    </div>
                    <span className="text-xl font-bold text-white font-arabic">{surah.name}</span>
                </div>
                <div className="p-2 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-all">
                    <Download className="w-4 h-4 text-primary" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedSurah && (
        <div className="fixed inset-0 z-[500] flex flex-col animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-[#050505]" />
          
          <div className="relative h-full flex flex-col">
            <header className="h-20 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-black/60 backdrop-blur-md z-[510]">
              <div className="flex items-center gap-4">
                <button onClick={closePdf} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10"><X className="w-5 h-5 text-white" /></button>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigateSurah('prev')} className="p-2.5 bg-white/5 rounded-xl hover:bg-primary/20"><ChevronRight className="w-5 h-5 text-white" /></button>
                    <div className="text-center min-w-[120px]">
                        <h3 className="text-xl font-bold text-white font-arabic">سورة {selectedSurah.name}</h3>
                    </div>
                    <button onClick={() => navigateSurah('next')} className="p-2.5 bg-white/5 rounded-xl hover:bg-primary/20"><ChevronLeft className="w-5 h-5 text-white" /></button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="p-3 bg-primary text-black rounded-2xl font-bold flex items-center gap-2 hover:bg-white hover:text-black transition-all">
                    <ExternalLink className="w-5 h-5" />
                    <span className="hidden sm:inline">فتح في نافذة جديدة</span>
                </a>
              </div>
            </header>

            <div className="flex-1 bg-[#080808] relative overflow-hidden">
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#080808]">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-white/40 text-sm animate-pulse">جاري التحميل المباشر...</p>
                    </div>
                )}
                
                {/* Use EMBED or OBJECT for better native browser PDF rendering */}
                <object 
                    key={`${selectedSurah.id}-${sourceIndex}`}
                    data={pdfUrl}
                    type="application/pdf"
                    className="w-full h-full border-none z-10"
                    onLoad={() => setIsLoading(false)}
                >
                    <div className="flex flex-col items-center justify-center h-full p-10 text-center space-y-6">
                        <div className="p-6 bg-primary/10 rounded-full">
                            <RefreshCw className="w-12 h-12 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white">المتصفح لا يدعم العرض المباشر</h3>
                            <p className="text-white/40 text-sm max-w-xs">يرجى الضغط على الزر أدناه لفتح السورة في نافذة جديدة أو محاولة مصدر آخر</p>
                        </div>
                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            <button 
                                onClick={() => setSourceIndex((prev) => (prev + 1) % PDF_SOURCES.length)}
                                className="w-full py-4 bg-white/10 text-white rounded-2xl font-bold"
                            >
                                محاولة سيرفر آخر
                            </button>
                            <a href={pdfUrl} target="_blank" rel="noreferrer" className="w-full py-4 bg-primary text-black rounded-2xl font-bold">
                                فتح السورة الآن
                            </a>
                        </div>
                    </div>
                </object>

                {/* Overlying controls for experience */}
                {!isLoading && (
                    <div className="absolute bottom-6 right-6 z-20">
                         <button 
                            onClick={() => setSourceIndex((prev) => (prev + 1) % PDF_SOURCES.length)}
                            className="p-4 bg-black/80 backdrop-blur-md border border-white/10 rounded-full text-white/60 hover:text-primary transition-all flex items-center gap-2 shadow-2xl"
                            title="تغيير السيرفر"
                        >
                            <RefreshCw className="w-5 h-5" />
                            <span className="text-xs font-bold">تغيير السيرفر</span>
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
