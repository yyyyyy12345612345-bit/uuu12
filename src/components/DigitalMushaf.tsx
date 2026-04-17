"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2, BookOpen, Bookmark, Search, Maximize2, Play } from "lucide-react";

/**
 * DigitalMushaf Component
 * Replaces image-based Shamrely with dynamic text from Quran.com
 * Features: Page-by-page navigation (1-604), Premium UI, Live Text
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

  // Fetch page data whenever currentPage changes
  useEffect(() => {
    async function fetchPage() {
      setIsLoading(true);
      setIsPlayingPage(false);
      setCurrentPlayingVerse(null);
      try {
        // Fetch verses by page with words and word audio
        const response = await fetch(
          `${API_ROOT}/verses/by_page/${currentPage}?language=ar&words=true&word_fields=text_uthmani,audio_url&fields=text_uthmani,verse_key`
        );
        const data = await response.json();
        
        if (data.verses) {
            setPageData(data.verses);
            
            // Extract Juz and Hizb info from first verse
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

  // Function to play a single word
  const playWord = (word: any) => {
    if (!word.audio_url) return;
    setActiveWordId(word.id);
    if (wordAudioRef.current) {
        wordAudioRef.current.src = `https:${word.audio_url}`;
        wordAudioRef.current.play().catch(console.error);
    }
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(20);
  };

  // Function to start playing the whole page
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
    
    // Auto-scroll to verse
    const el = document.getElementById(`digital-verse-${verse.id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (audioRef.current) {
        // Using a standard high-quality reciter for page playback (Alafasy)
        audioRef.current.src = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${verse.verse_key.split(':')[0]}.mp3`;
        
        // Note: For real sequential playback of verses, we'd need specialized verse audio URLs.
        // For now, we'll use the API's verse sounds if possible or a stable provider.
        const [sura, ayah] = verse.verse_key.split(':');
        audioRef.current.src = `https://cdn.islamic.network/quran/audio/verses/128/${sura}${ayah.padStart(3, '0')}.mp3`;
        
        audioRef.current.play().catch(() => {
            // Fallback for audio
            setIsPlayingPage(false);
        });
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
    <div className="h-full flex flex-col bg-[#050505] text-white font-arabic relative overflow-hidden">
      
      {/* Hidden Audio Elements */}
      <audio ref={audioRef} onEnded={handleAudioEnd} />
      <audio ref={wordAudioRef} onEnded={() => setActiveWordId(null)} />

      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />

      {/* Header - Glassmorphism */}
      <header className="h-24 shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-2xl px-6 md:px-12 flex items-center justify-between z-50">
        <div className="flex items-center gap-5">
             <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <BookOpen className="w-6 h-6" />
             </div>
             <div className="text-right">
                <h2 className="text-xl font-bold bg-gradient-to-l from-white to-white/60 bg-clip-text text-transparent">المصحف الكامل</h2>
                <p className="text-[9px] text-white/20 uppercase tracking-[0.3em] font-bold">Word-by-Word Edition</p>
             </div>
        </div>

        <div className="flex items-center gap-4">
            <button 
                onClick={togglePlayPage}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${isPlayingPage ? 'bg-primary text-black border-primary' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
            >
                {isPlayingPage ? <Maximize2 className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4" />}
                <span className="text-sm font-bold font-arabic">{isPlayingPage ? 'جاري الاستماع...' : 'استماع للصفحة'}</span>
            </button>
            <div className="h-10 w-[1px] bg-white/10 mx-2 hidden lg:block" />
            <div className="bg-primary/10 px-8 py-3 rounded-2xl border border-primary/20 hidden md:block">
                <span className="text-lg font-bold text-primary font-mono tracking-tighter">PAGE {currentPage}</span>
            </div>
        </div>
      </header>

      {/* Main Content Space */}
      <main className="flex-1 relative overflow-hidden flex justify-center items-center p-4 lg:p-12">
        
        {/* Navigation Buttons (Desktop) */}
        <button onClick={prevPage} disabled={currentPage === 1} className="hidden lg:flex absolute left-8 z-[60] w-14 h-14 rounded-full glass-effect border border-white/10 items-center justify-center text-white/30 hover:text-primary transition-all disabled:opacity-0"><ChevronRight className="w-8 h-8" /></button>
        <button onClick={nextPage} disabled={currentPage === 604} className="hidden lg:flex absolute right-8 z-[60] w-14 h-14 rounded-full glass-effect border border-white/10 items-center justify-center text-white/30 hover:text-primary transition-all disabled:opacity-0"><ChevronLeft className="w-8 h-8" /></button>

        {/* The Digital Page Frame */}
        <div className="w-full max-w-[1000px] h-full relative group">
            <div 
                ref={scrollRef}
                className={`w-full h-full lg:h-auto lg:max-h-[78vh] overflow-y-auto no-scrollbar glass-effect-dark border-white/5 rounded-[3.5rem] p-8 md:p-20 shadow-2xl relative transition-all duration-700 ${isLoading ? 'opacity-20 translate-y-4 blur-xl' : 'opacity-100 translate-y-0 blur-0'}`}
            >
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="relative z-10 text-center select-none">
                        <div className="flex flex-wrap justify-center gap-x-2 md:gap-x-4 gap-y-10 md:gap-y-16">
                            {pageData.map((verse: any, vIdx: number) => (
                                <div 
                                    key={verse.id} 
                                    id={`digital-verse-${verse.id}`}
                                    className={`flex flex-wrap justify-center items-center gap-x-1 md:gap-x-2 transition-all duration-500 rounded-[2rem] p-4 ${currentPlayingVerse === vIdx ? 'bg-primary/5 ring-1 ring-primary/20 scale-105 shadow-2xl' : ''}`}
                                >
                                    {verse.words.map((word: any) => (
                                        <span 
                                            key={word.id}
                                            onClick={() => playWord(word)}
                                            className={`cursor-pointer transition-all duration-300 text-[2.2rem] md:text-[3.5rem] leading-[1.6] px-1 md:px-2 rounded-xl group/word relative ${activeWordId === word.id ? 'text-primary scale-125 bg-primary/5' : 'text-white/90 hover:text-primary hover:scale-110'}`}
                                        >
                                            {word.text_uthmani}
                                            {/* Word Highlight Underline */}
                                            <span className={`absolute bottom-0 left-0 h-[2px] bg-primary transition-all duration-500 ${activeWordId === word.id ? 'w-full' : 'w-0'}`} />
                                        </span>
                                    ))}
                                    
                                    {/* Verse End Marker */}
                                    <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border border-white/10 text-primary text-xs md:text-sm font-bold mx-2 shadow-inner">
                                        {verse.verse_number}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="h-32 shrink-0 bg-[#080808]/90 backdrop-blur-3xl border-t border-white/10 px-8 flex flex-col items-center justify-center gap-4 z-[100] pb-10 lg:pb-0">
          <div className="flex items-center gap-8 w-full max-w-2xl px-6 py-4 bg-white/[0.03] rounded-2xl border border-white/5 shadow-2xl">
                <button onClick={prevPage} className="p-3 bg-white/5 rounded-xl text-white/40"><ChevronRight className="w-5 h-5" /></button>
                <input type="range" min="1" max="604" value={currentPage} onChange={(e) => setCurrentPage(parseInt(e.target.value))} className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary" />
                <button onClick={nextPage} className="p-3 bg-white/5 rounded-xl text-white/40"><ChevronLeft className="w-5 h-5" /></button>
                <div className="min-w-[60px] text-right">
                    <span className="text-xl font-black text-primary font-mono">{currentPage}</span>
                </div>
          </div>
          <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest hidden md:block">اضغط على أي كلمة لسماع نطقها</p>
      </footer>

      <style jsx global>{`
        .font-arabic {
            font-family: var(--font-amiri), serif;
            word-spacing: 0.15em;
        }
        .glass-effect-dark {
            background: rgba(10, 10, 10, 0.7);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
        }
        input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 24px;
            height: 24px;
            background: #D4AF37;
            border-radius: 50%;
            cursor: pointer;
            border: 4px solid #111;
            box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
            transition: all 0.2s;
        }
        input[type='range']::-webkit-slider-thumb:hover {
            transform: scale(1.15);
            background: #fff;
        }
      `}</style>
    </div>
  );
}
