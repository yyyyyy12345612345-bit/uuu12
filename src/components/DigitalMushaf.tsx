"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2, BookOpen, Play, Maximize2, X, List } from "lucide-react";
import surahsData from "@/data/surahs.json";

/**
 * DigitalMushaf Component - Version 3.0 (Quran.com Reading Mode Style)
 * Mimics the exact look and feel of Quran.com's reading interface.
 */

const API_ROOT = "https://api.quran.com/api/v4";

export function DigitalMushaf() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageData, setPageData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState<any>(null);
  const [isPlayingPage, setIsPlayingPage] = useState(false);
  const [currentPlayingVerse, setCurrentPlayingVerse] = useState<number | null>(null);
  const [activeWordId, setActiveWordId] = useState<number | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wordAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    async function fetchPage() {
      setIsLoading(true);
      setIsPlayingPage(false);
      setCurrentPlayingVerse(null);
      try {
        const response = await fetch(
          `${API_ROOT}/verses/by_page/${currentPage}?language=ar&words=true&word_fields=text_uthmani,audio_url&fields=text_uthmani,verse_key,juz_number,hizb_number`
        );
        const data = await response.json();
        
        if (data.verses) {
            setPageData(data.verses);
            if (data.verses.length > 0) {
                setMeta({
                    juz: data.verses[0].juz_number,
                    hizb: data.verses[0].hizb_number,
                });
            }
        }
      } catch (err) {
        console.error("Failed to fetch page data", err);
      } finally {
        setIsLoading(false);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }
    }
    fetchPage();
  }, [currentPage]);

  const playWord = (word: any) => {
    if (!word.audio_url) return;
    setActiveWordId(word.id);
    if (wordAudioRef.current) {
        wordAudioRef.current.src = `https:${word.audio_url}`;
        wordAudioRef.current.play().catch(console.error);
    }
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const togglePlayPage = () => {
    if (isPlayingPage) {
        setIsPlayingPage(false);
        audioRef.current?.pause();
        setCurrentPlayingVerse(null);
    } else {
        setIsPlayingPage(true);
        playVerse(0);
    }
  };

  const playVerse = (index: number) => {
    if (index >= pageData.length) {
        setIsPlayingPage(false);
        setCurrentPlayingVerse(null);
        return;
    }
    const verse = pageData[index];
    setCurrentPlayingVerse(index);
    const el = document.getElementById(`digital-verse-${verse.id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (audioRef.current) {
        const [sura, ayah] = verse.verse_key.split(':');
        audioRef.current.src = `https://cdn.islamic.network/quran/audio/verses/128/${sura}${ayah.padStart(3, '0')}.mp3`;
        audioRef.current.play().catch(() => setIsPlayingPage(false));
    }
  };

  const handleAudioEnd = () => {
    if (isPlayingPage && currentPlayingVerse !== null) {
        playVerse(currentPlayingVerse + 1);
    }
  };

  const nextPage = () => setCurrentPage(p => Math.min(604, p + 1));
  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));

  return (
    <div className="h-full flex flex-col bg-[#121212] text-white font-arabic relative overflow-hidden selection:bg-primary/30">
      
      <audio ref={audioRef} onEnded={handleAudioEnd} />
      <audio ref={wordAudioRef} onEnded={() => setActiveWordId(null)} />

      {/* Top Header - Mirroring the screenshot */}
      <header className="h-[70px] shrink-0 border-b border-white/5 bg-[#121212]/80 backdrop-blur-xl px-4 md:px-10 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
             <button onClick={prevPage} className="p-2 hover:bg-white/5 rounded-lg transition-all text-white/40 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
             <div className="flex items-center gap-2 text-sm font-bold text-white/60">
                <Bookmark className="w-4 h-4" />
                <span>Page {currentPage}</span>
                <span className="opacity-20 mx-1">|</span>
                <span>Juz {meta?.juz || ".."} / Hizb {meta?.hizb || ".."}</span>
             </div>
             <button onClick={nextPage} className="p-2 hover:bg-white/5 rounded-lg transition-all text-white/40 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center gap-3">
            <button 
                onClick={togglePlayPage}
                className={`p-2 rounded-lg transition-all ${isPlayingPage ? 'bg-primary text-black' : 'hover:bg-white/5 text-white/40 hover:text-white'}`}
            >
                {isPlayingPage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"><List className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Main Reading Flow */}
      <main className="flex-1 relative overflow-y-auto custom-scrollbar pt-10 pb-32 overscroll-contain" ref={scrollRef}>
        <div className="max-w-[1000px] mx-auto px-6 md:px-20 text-center">
            
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">Loading Verses...</span>
                </div>
            ) : (
                <div className="flex flex-col gap-0">
                    {pageData.map((verse: any, idx: number) => {
                        const [sId, vId] = verse.verse_key.split(':');
                        const isFirstVerse = vId === "1";
                        const surahName = surahsData.find(s => s.id === parseInt(sId))?.name;
                        
                        return (
                            <React.Fragment key={verse.id}>
                                {isFirstVerse && (
                                    <div className="my-16 animate-in fade-in duration-1000">
                                        <div className="relative inline-block px-16 py-6 border border-white/5 bg-white/[0.02] rounded-3xl mb-8">
                                            <h3 className="text-3xl md:text-4xl font-bold font-arabic text-primary/80">سورة {surahName}</h3>
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#121212] px-4 text-[9px] font-bold text-white/10 uppercase tracking-widest">Beginning of Chapter</div>
                                        </div>
                                        {sId !== "1" && sId !== "9" && (
                                            <div className="text-3xl md:text-[3.2rem] font-arabic text-white/70 mb-12 opacity-90 leading-normal">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                                        )}
                                    </div>
                                )}
                                <div 
                                    id={`digital-verse-${verse.id}`}
                                    className={`inline transition-all duration-700 leading-[3] ${currentPlayingVerse === idx ? 'bg-primary/5 rounded-2xl' : ''}`}
                                >
                                    <span className="inline flex-wrap justify-center font-arabic text-[2.4rem] md:text-[3.2rem] text-white/90">
                                        {verse.words.map((word: any) => (
                                            <span 
                                                key={word.id}
                                                onClick={() => playWord(word)}
                                                className={`inline-block cursor-pointer transition-all duration-200 px-0.5 rounded-xl ${activeWordId === word.id ? 'text-primary scale-110 bg-white/5 shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'hover:text-primary'}`}
                                            >
                                                {word.text_uthmani}
                                            </span>
                                        ))}
                                        {/* Ayah Marker with precise styling */}
                                        <span className="inline-flex items-center justify-center w-11 h-11 md:w-14 md:h-14 rounded-full border border-white/10 text-[11px] md:text-sm font-bold text-white/20 mx-2 md:mx-4 relative top-[-6px] bg-white/[0.02] hover:border-primary/40 transition-colors">
                                            {vId}
                                        </span>
                                    </span>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
        </div>
      </main>

      {/* Interaction Hint */}
      {!isLoading && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">اضغط على أي كلمة لسماع نطقها</span>
            </div>
        </div>
      )}

      {/* Floating Action Menu (Like quran.com) */}
      <footer className="h-16 shrink-0 bg-[#0a0a0a] border-t border-white/5 px-8 flex items-center justify-center z-50">
          <div className="flex items-center gap-10 w-full max-w-xl">
                <input 
                    type="range" 
                    min="1" 
                    max="604" 
                    value={currentPage} 
                    onChange={(e) => setCurrentPage(parseInt(e.target.value))}
                    className="flex-1 h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-primary" 
                />
          </div>
      </footer>

      <style jsx global>{`
        .font-arabic {
            font-family: 'Amiri', serif;
            word-spacing: 0.12em;
            text-rendering: optimizeLegibility;
        }
        input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            background: #D4AF37;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(212, 175, 55, 0.4);
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
      `}</style>
    </div>
  );
}

// Sub-icons for the screen
function Bookmark(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
}
