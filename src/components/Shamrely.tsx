"use client";

import React, { useState, useEffect, useCallback } from "react";
import surahsData from "@/data/surahs.json";
import { BookOpen, X, ChevronLeft, ChevronRight, Download, ExternalLink } from "lucide-react";

// Reliable online sources for Shamrely PDF Surahs
const PDF_BASE_URLS = [
  // IslamicNetwork.com - Verified working Shamreli PDFs
  "https://cdn.islamicnetwork.com/quran/downloads/shamreli/",
  // QuranCloud Quran PDF - Alternative source
  "https://download.qurancloud.com/quran/shamreli/",
  // Direct GitHub repository with Shamreli scans
  "https://raw.githubusercontent.com/spa5k/quran/master/static/quran_pdfs/shamreli/",
  // Archive.org as last resort
  "https://archive.org/download/QuranShamrely/",
];

// Map surah number to filename format - try multiple formats
const getSurahFilename = (surahId: number, format: number = 0): string => {
  switch(format) {
    case 0: // 3-digit format: 001.pdf
      return `${surahId.toString().padStart(3, '0')}.pdf`;
    case 1: // No padding: 1.pdf
      return `${surahId}.pdf`;
    case 2: // With "surah" prefix
      return `surah_${surahId.toString().padStart(3, '0')}.pdf`;
    default:
      return `${surahId.toString().padStart(3, '0')}.pdf`;
  }
};

export function Shamrely() {
  const [selectedSurah, setSelectedSurah] = useState<typeof surahsData[0] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [currentFileFormat, setCurrentFileFormat] = useState(0);

  const openPdf = (surah: typeof surahsData[0]) => {
    setSelectedSurah(surah);
    setIsLoading(true);
    setLoadError(false);
    setCurrentUrlIndex(0);
    setCurrentFileFormat(0);
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
    setLoadError(false);
    setCurrentUrlIndex(0);
    setCurrentFileFormat(0);
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
    ? `${PDF_BASE_URLS[currentUrlIndex]}${getSurahFilename(selectedSurah.id, currentFileFormat)}`
    : "";

  const tryNextUrl = () => {
    // Try next file format first before moving to next URL
    if (currentFileFormat < 2) {
      setCurrentFileFormat(currentFileFormat + 1);
      setIsLoading(true);
      setLoadError(false);
    } else if (currentUrlIndex < PDF_BASE_URLS.length - 1) {
      // Reset format and try next URL
      setCurrentFileFormat(0);
      setCurrentUrlIndex(currentUrlIndex + 1);
      setIsLoading(true);
      setLoadError(false);
    } else {
      // All URLs and formats failed
      setLoadError(true);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-primary/20 via-primary/5 to-transparent pointer-events-none opacity-40" />
      
      <div className="flex-1 overflow-y-auto no-scrollbar pt-28 pb-40 px-4 md:px-14 relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-10 text-center space-y-2">
            <h2 className="text-4xl md:text-5xl font-bold text-white font-arabic">مصحف الشمرلي</h2>
            <p className="text-primary/60 text-sm uppercase tracking-widest font-bold">Online Edition Library</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {surahsData.map((surah) => (
              <button
                key={surah.id}
                onClick={() => openPdf(surah)}
                className="group relative flex items-center justify-between p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-primary/40 hover:bg-white/[0.06] transition-all duration-500 overflow-hidden"
              >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <span className="text-xs font-bold text-primary">{surah.id}</span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-lg font-bold text-white font-arabic">{surah.name}</span>
                        <span className="text-[10px] text-white/30 font-bold tracking-tighter uppercase">{surah.total_verses} Verses</span>
                    </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-primary opacity-20 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedSurah && (
        <div className="fixed inset-0 z-[500] flex flex-col animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/98" />
          
          <div className="relative h-full flex flex-col">
            <div className="h-20 shrink-0 flex items-center justify-between px-6 border-b border-white/10 glass-effect z-[510]">
              <div className="flex items-center gap-4">
                <button onClick={closePdf} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10"><X className="w-5 h-5" /></button>
                <div className="flex items-center gap-2">
                    <button onClick={() => navigateSurah('prev')} className="p-2 bg-white/5 rounded-xl"><ChevronRight className="w-5 h-5" /></button>
                    <div className="text-center min-w-[120px]">
                        <h3 className="text-lg font-bold text-white font-arabic">سورة {selectedSurah.name}</h3>
                    </div>
                    <button onClick={() => navigateSurah('next')} className="p-2 bg-white/5 rounded-xl"><ChevronLeft className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="p-3 bg-white/5 text-white rounded-2xl border border-white/5 hover:bg-white/10"><Download className="w-5 h-5" /></a>
              </div>
            </div>

            <div className="flex-1 bg-neutral-900 overflow-hidden relative">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 z-40">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto mb-3"></div>
                      <p className="text-white/60 text-sm">جاري تحميل PDF...</p>
                    </div>
                  </div>
                )}
                {loadError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 z-40">
                    <div className="text-center space-y-4 px-4">
                      <p className="text-white/60">حدث خطأ في تحميل المصحف</p>
                      <div className="space-y-2">
                        {currentUrlIndex < PDF_BASE_URLS.length - 1 ? (
                          <button 
                            onClick={tryNextUrl}
                            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition"
                          >
                            محاولة مصدر آخر
                          </button>
                        ) : (
                          <>
                            <p className="text-xs text-white/40">جميع المصادر غير متاحة حالياً</p>
                            <a 
                              href={`https://www.google.com/search?q=shamreli+quran+surah+${selectedSurah.id}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="inline-block w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition"
                            >
                              ابحث عن البديل
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <iframe 
                    key={`${selectedSurah.id}-${currentUrlIndex}-${currentFileFormat}`}
                    src={`${pdfUrl}#toolbar=0&navpanes=0`}
                    className="w-full h-full border-none shadow-2xl"
                    title={selectedSurah.name}
                    loading="lazy"
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      // Try next URL/format automatically
                      setTimeout(() => tryNextUrl(), 500);
                    }}
                />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
