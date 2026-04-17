"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2, BookOpen, Play, Search, X, List, Bookmark as BookmarkIcon } from "lucide-react";
import surahsData from "@/data/surahs.json";

/**
 * DigitalMushaf Component - Version 4.0 (Enhanced Index & Persistence)
 * Mimics Quran.com perfectly with an integrated Surah Index and Last Page Resume.
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
  const [isIndexOpen, setIsIndexOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wordAudioRef = useRef<HTMLAudioElement>(null);

  // Load last page from localStorage on mount
  useEffect(() => {
    const savedPage = localStorage.getItem("last_read_page");
    if (savedPage) {
        setCurrentPage(parseInt(savedPage));
    }
  }, []);

  // Sync current page to localStorage
  useEffect(() => {
    if (currentPage > 0) {
        localStorage.setItem("last_read_page", currentPage.toString());
    }
  }, [currentPage]);

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

  const filteredSurahs = surahsData.filter(s => 
    s.name.includes(searchQuery) || s.transliteration.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#111111] text-white font-arabic relative overflow-hidden">
      
      <audio ref={audioRef} onEnded={handleAudioEnd} />
      <audio ref={wordAudioRef} onEnded={() => setActiveWordId(null)} />

      {/* Optimized Header */}
      <header className="h-[70px] shrink-0 border-b border-white/5 bg-[#111111]/90 backdrop-blur-xl px-4 md:px-10 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
             <button onClick={() => setIsIndexOpen(true)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all text-white/60">
                <List className="w-5 h-5" />
             </button>
             <div className="flex items-center gap-2 text-[13px] font-bold text-white/50">
                <BookmarkIcon className="w-4 h-4 text-primary/60" />
                <span className="text-white/80">Page {currentPage}</span>
                <span className="opacity-20 mx-1">|</span>
                <span>Juz {meta?.juz || ".."}</span>
             </div>
        </div>

        <div className="flex items-center gap-3">
            <button 
                onClick={togglePlayPage}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isPlayingPage ? 'bg-primary text-black' : 'bg-white/5 border border-white/5 text-white/40 hover:text-white'}`}
            >
                {isPlayingPage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                <span className="text-[11px] font-bold font-arabic">{isPlayingPage ? 'استماع' : 'تشغيل'}</span>
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <div className="flex items-center gap-1">
                <button onClick={prevPage} disabled={currentPage === 1} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-10"><ChevronRight className="w-5 h-5" /></button>
                <button onClick={nextPage} disabled={currentPage === 604} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-10"><ChevronLeft className="w-5 h-5" /></button>
            </div>
        </div>
      </header>

      {/* Main Flow */}
      <main className="flex-1 overflow-y-auto no-scrollbar pt-8 pb-32 overscroll-contain" ref={scrollRef}>
        <div className="max-w-[950px] mx-auto px-6 md:px-16 text-center">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="flex flex-col">
                    {pageData.map((verse: any, idx: number) => {
                        const [sId, vId] = verse.verse_key.split(':');
                        const isFirstVerse = vId === "1";
                        const surahName = surahsData.find(s => s.id === parseInt(sId))?.name;
                        
                        return (
                            <React.Fragment key={verse.id}>
                                {isFirstVerse && (
                                    <div className="my-12 animate-in fade-in duration-700">
                                        <div className="inline-block px-20 py-6 border border-white/5 bg-white/[0.01] rounded-[2rem] mb-10 overflow-hidden relative">
                                            <div className="absolute inset-0 bg-primary/[0.01]" />
                                            <h3 className="text-3xl md:text-5xl font-bold font-arabic text-primary/80">سورة {surahName}</h3>
                                        </div>
                                        {sId !== "1" && sId !== "9" && (
                                            <div className="text-3xl md:text-[3.5rem] font-arabic text-white/50 mb-10 opacity-60">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                                        )}
                                    </div>
                                )}
                                <div 
                                    id={`digital-verse-${verse.id}`}
                                    className={`inline leading-[2.8] md:leading-[3.2] transition-colors duration-700 ${currentPlayingVerse === idx ? 'bg-primary/5 rounded-2xl' : ''}`}
                                >
                                    <span className="inline text-[2.2rem] md:text-[3.3rem] text-white/90">
                                        {verse.words.map((word: any) => (
                                            <span 
                                                key={word.id}
                                                onClick={() => playWord(word)}
                                                className={`inline-block cursor-pointer px-0.5 md:px-1 rounded-xl transition-all duration-200 ${activeWordId === word.id ? 'text-primary scale-110' : 'hover:text-primary'}`}
                                            >
                                                {word.text_uthmani}
                                            </span>
                                        ))}
                                        {/* Ayah Ornament - Custom Design */}
                                        <span className="inline-flex items-center justify-center w-12 h-12 md:w-[60px] md:h-[60px] relative top-[-6px] md:top-[-10px] mx-2 md:mx-4 group/ayah">
                                            <svg className="absolute inset-0 w-full h-full text-white/10 group-hover/ayah:text-primary/20 transition-colors" viewBox="0 0 100 100">
                                                <path fill="currentColor" d="M50 0 L100 50 L50 100 L0 50 Z" />
                                                <path fill="none" stroke="currentColor" strokeWidth="2" d="M50 10 L90 50 L50 90 L10 50 Z" />
                                            </svg>
                                            <span className="relative z-10 text-[10px] md:text-xs font-bold font-mono text-white/30 tracking-tighter">{vId}</span>
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

      {/* Surah Index Drawer (The Answer to 'bidedkhlni 3al fatiha') */}
      {isIndexOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#0a0a0a]/98 backdrop-blur-2xl" />
            <div className="relative w-full max-w-6xl h-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden">
                
                <div className="flex items-center justify-between p-8 shrink-0">
                    <div>
                        <h3 className="text-3xl font-black font-arabic text-primary mb-2">فهرس السور</h3>
                        <p className="text-[10px] text-white/20 uppercase tracking-[0.4em] font-bold">Select a Surah to Read</p>
                    </div>
                    <button 
                        onClick={() => setIsIndexOpen(false)} 
                        className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 group"
                    >
                        <X className="w-6 h-6 text-white/40 group-hover:text-white" />
                    </button>
                </div>

                <div className="px-8 pb-8 shrink-0">
                    <div className="relative group max-w-2xl">
                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث عن سورة... (مثلاً: البقرة، الكهف)"
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pr-16 pl-8 text-xl outline-none focus:border-primary/40 focus:bg-white/5 transition-all font-arabic text-white"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-10">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredSurahs.map((s) => (
                            <button 
                                key={s.id}
                                onClick={() => {
                                    setCurrentPage(s.pages[0]);
                                    setIsIndexOpen(false);
                                }}
                                className="flex flex-col gap-3 p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/40 hover:bg-primary/[0.03] transition-all group overflow-hidden relative"
                            >
                                <div className="absolute top-0 left-0 px-3 py-1 bg-white/5 text-[9px] font-bold text-white/10 rounded-br-xl group-hover:text-primary transition-colors">#{s.id}</div>
                                <span className="font-arabic text-xl md:text-2xl font-bold group-hover:text-white transition-colors mt-2 text-right">{s.name}</span>
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5 group-hover:border-primary/10">
                                    <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest font-mono">P. {s.pages[0]}</span>
                                    <ChevronLeft className="w-4 h-4 text-white/10 group-hover:text-primary transition-all group-hover:translate-x-[-4px]" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Persistence Bar */}
      <footer className="h-16 shrink-0 bg-black/60 border-t border-white/5 px-8 flex items-center justify-center z-50">
          <input 
            type="range" 
            min="1" 
            max="604" 
            value={currentPage} 
            onChange={(e) => setCurrentPage(parseInt(e.target.value))} 
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary max-w-2xl" 
          />
      </footer>

      <style jsx global>{`
        .font-arabic {
            font-family: 'Amiri', serif;
            word-spacing: 0.12em;
        }
        input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            background: #D4AF37;
            border-radius: 50%;
            cursor: pointer;
        }
      `}</style>
    </div>
  );
}
