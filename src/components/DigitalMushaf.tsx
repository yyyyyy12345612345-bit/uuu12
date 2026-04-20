"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Loader2, Play, Search, List, User, X, ChevronRight, ChevronLeft, Book, Star, Settings } from "lucide-react";
import { Scheherazade_New } from "next/font/google";
import surahsData from "@/data/surahs.json";
import { RECITERS } from "@/data/reciters";
import { useEditor } from "@/store/useEditor";
import { getAudioUrl } from "@/lib/quranUtils";

const API_ROOT = "https://api.quran.com/api/v4";

const SURAH_START_PAGES: Record<number, number> = {
  1:1, 2:2, 3:50, 4:77, 5:106, 6:128, 7:151, 8:177, 9:187, 10:208, 11:221, 12:235, 13:249, 14:255, 15:262, 16:267, 17:282, 18:293, 19:305, 20:312, 
  21:322, 22:332, 23:342, 24:350, 25:359, 26:367, 27:377, 28:385, 29:396, 30:404, 31:411, 32:415, 33:418, 34:428, 35:434, 36:440, 37:446, 38:453, 39:458, 40:467, 
  41:477, 42:483, 43:489, 44:496, 45:499, 46:502, 47:507, 48:511, 49:515, 50:518, 51:520, 52:523, 53:526, 54:528, 55:531, 56:534, 57:537, 58:542, 59:545, 60:549, 
  61:551, 62:553, 63:554, 64:556, 65:558, 66:560, 67:562, 68:564, 69:566, 70:568, 71:570, 72:572, 73:574, 74:575, 75:577, 76:578, 77:580, 78:582, 79:583, 80:585, 
  81:586, 82:587, 83:587, 84:589, 85:590, 86:591, 87:591, 88:592, 89:593, 90:594, 91:595, 92:595, 93:596, 94:596, 95:597, 96:597, 97:598, 98:598, 99:599, 100:599, 
  101:600, 102:600, 103:601, 104:601, 105:601, 106:602, 107:602, 108:602, 109:603, 110:603, 111:603, 112:604, 113:604, 114:604
};

const scheherazade = Scheherazade_New({
  weight: ["400", "700"],
  subsets: ["arabic"],
  display: "swap",
});

export function DigitalMushaf() {
  const { state, updateState } = useEditor();
  const [pages, setPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isPlayingPage, setIsPlayingPage] = useState(false);
  const [currentPlayingVerse, setCurrentPlayingVerse] = useState<{pageIndex: number, verseIndex: number} | null>(null);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const [isIndexOpen, setIsIndexOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const observerTarget = useRef(null);
  const loadingRef = useRef(false);

  async function fetchPageBatch(startPage: number, clear = false) {
    if (loadingRef.current || startPage > 604) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
        const batchSize = 3;
        const newPagesData = [];
        
        // Complete Mapping for all popular reciters to Quran.com IDs
        const quranComIds: Record<string, number> = {
            'basit': 1, 'basit_m': 2, 'sds': 3, 'shur': 4, 'husr': 5, 'afasy': 7, 
            'abkr': 8, 'shatree': 9, 'minsh': 10, 'jbr': 11, 'yasser': 12, 'maher': 12,
            'ajm': 54, 's_gmd': 55, 'qtm': 56, 'lhdan': 61, 'ayyub': 113, 'jleel': 41, 'hazza': 128
        };
        const recitationId = quranComIds[state.reciterId] || 7;

        for (let i = 0; i < batchSize; i++) {
            const pageNum = startPage + i;
            if (pageNum > 604) break;
            const response = await fetch(`${API_ROOT}/verses/by_page/${pageNum}?language=ar&words=true&word_fields=text_uthmani,char_type_name&fields=text_uthmani,verse_key&audio=${recitationId}`);
            const data = await response.json();
            if (data.verses) newPagesData.push({ page: pageNum, verses: data.verses });
        }
        if (clear) {
            setPages(newPagesData);
        } else {
            setPages(prev => {
                const existingPageNums = new Set(prev.map(p => p.page));
                const uniqueNewPages = newPagesData.filter(p => !existingPageNums.has(p.page));
                return [...prev, ...uniqueNewPages];
            });
        }
        if (newPagesData.length > 0) {
            setCurrentPage(startPage + newPagesData.length - 1);
            localStorage.setItem("last_read_page", startPage.toString());
        }
    } catch (error) {
        console.error('Error fetching pages:', error);
    } finally {
        setIsLoading(false);
        loadingRef.current = false;
    }
  }

  useEffect(() => {
    const savedPage = localStorage.getItem("last_read_page");
    const initialPage = savedPage ? parseInt(savedPage) : 1;
    fetchPageBatch(initialPage, true);
  }, []);

  useEffect(() => {
    fetchPageBatch(pages[0]?.page || currentPage, true);
  }, [state.reciterId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loadingRef.current && currentPage < 604) {
          fetchPageBatch(currentPage + 1);
        }
      },
      { threshold: 0.1, rootMargin: '1500px' }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [pages, currentPage]);

  const playVerse = (pIdx: number, vIdx: number) => {
    const verse = pages[pIdx]?.verses[vIdx];
    if (!verse) return;
    
    setCurrentPlayingVerse({ pageIndex: pIdx, verseIndex: vIdx });
    if (audioRef.current) {
        const [sura, ayah] = verse.verse_key.split(':');
        
        // Use our smart utility that handles Islamic Network and Fallbacks
        const audioUrl = getAudioUrl(parseInt(sura), parseInt(ayah), state.reciterId, verse.id);
            
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(err => {
            console.error("Playback failed for url:", audioUrl, err);
            // Final safety fallback to Alafasy
            if (!audioUrl.includes('Alafasy')) {
                audioRef.current!.src = getAudioUrl(parseInt(sura), parseInt(ayah), 'afasy', verse.id);
                audioRef.current!.play();
            }
        });
    }
  };

  const handleAudioEnd = () => {
    if (isPlayingPage && currentPlayingVerse) {
        const { pageIndex, verseIndex } = currentPlayingVerse;
        if (verseIndex + 1 < pages[pageIndex].verses.length) {
            playVerse(pageIndex, verseIndex + 1);
        } else if (pageIndex + 1 < pages.length) {
            playVerse(pageIndex + 1, 0);
        }
    }
  };

  const filteredSurahs = surahsData.filter(s => 
    s.name.includes(searchQuery) || s.transliteration.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground font-arabic relative overflow-hidden">
      
      {/* Dynamic Thematic Background Layers */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
          <div className="absolute inset-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')" }} />
      </div>
      
      <audio ref={audioRef} onEnded={handleAudioEnd} onError={handleAudioEnd} />

      {/* --- Premium Header --- */}
      <header className="h-[75px] md:h-[85px] shrink-0 border-b border-border bg-background/95 backdrop-blur-xl px-2 md:px-10 flex items-center justify-between z-[100] shadow-sm">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
             <button onClick={() => setIsIndexOpen(true)} className="flex items-center justify-center md:justify-start gap-2 h-11 px-3 md:px-6 bg-primary/20 text-foreground rounded-2xl font-bold border border-primary/20 transition-all hover:bg-primary/30 active:scale-95">
                <List className="w-5 h-5 text-primary" />
                <span className="text-sm hidden md:block">فهرس السور</span>
             </button>
             <button onClick={() => setShowReciterPicker(!showReciterPicker)} className="w-11 h-11 md:w-12 md:h-12 bg-foreground/5 rounded-2xl flex items-center justify-center text-foreground/60 hover:text-foreground border border-border transition-all relative active:scale-95">
                <User className="w-5 h-5 md:w-6 h-6" />
                {showReciterPicker && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />}
             </button>
        </div>

        <div className="hidden sm:flex flex-col items-center flex-1">
            <h2 className="text-base md:text-xl font-black text-foreground tracking-tight whitespace-nowrap">المصحف المرتل</h2>
            <div className="flex items-center gap-2 mt-1">
                <Star className="w-2.5 h-2.5 text-primary" />
                <span className="text-[9px] md:text-[10px] text-foreground/40 font-bold uppercase tracking-widest whitespace-nowrap">مكتبة متميزة</span>
                <Star className="w-2.5 h-2.5 text-primary" />
            </div>
        </div>

        <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
            <div className="hidden lg:flex flex-col items-end mr-4">
                <span className="text-[10px] text-foreground/30 font-bold uppercase">القارئ الحالي</span>
                <span className="text-sm font-bold text-foreground">{RECITERS.find(r => r.id === state.reciterId)?.name}</span>
            </div>
            <button 
                onClick={() => {
                    if(isPlayingPage) {
                        setIsPlayingPage(false);
                        audioRef.current?.pause();
                    } else {
                        setIsPlayingPage(true);
                        playVerse(0, 0);
                    }
                }}
                className={`flex items-center justify-center gap-2 h-11 px-4 md:px-8 md:h-12 rounded-2xl transition-all shadow-lg font-bold active:scale-95 ${isPlayingPage ? 'bg-primary text-black' : 'bg-foreground/5 border border-primary/20 text-foreground hover:border-primary'}`}
            >
                {isPlayingPage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                <span className="text-xs md:text-sm hidden xs:block">{isPlayingPage ? 'استماع...' : 'بدء الترتيل'}</span>
            </button>
        </div>

      </header>

        {showReciterPicker && (
            <div className="absolute top-[85px] left-4 md:left-10 w-80 bg-background border border-border rounded-[2.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.3)] z-[1000] p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-300">
                <div className="p-3 border-b border-border mb-2 text-center text-foreground/40 font-bold text-[10px] uppercase tracking-[0.3em]">اختر صوت القارئ</div>
                {RECITERS.map(reciter => (
                    <button key={reciter.id} onClick={() => { updateState({ reciterId: reciter.id }); setShowReciterPicker(false); }} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${state.reciterId === reciter.id ? 'bg-primary/10 border border-primary/30 text-foreground' : 'hover:bg-foreground/5 text-foreground/60'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${state.reciterId === reciter.id ? 'bg-primary text-black' : 'bg-foreground/10'}`}>
                            <User className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm text-right flex-1">{reciter.name}</span>
                    </button>
                ))}
            </div>
        )}

      {/* --- Main Reading Area --- */}
      <main className="flex-1 relative flex flex-col items-center overflow-hidden">
        {/* Index Sidebar Overlay */}
        {isIndexOpen && (
          <div className="absolute inset-0 z-[150] bg-background/60 backdrop-blur-md flex justify-end animate-in fade-in duration-300">
             <div className="w-full md:w-[400px] h-full bg-background shadow-[-10px_0_50px_rgba(0,0,0,0.12)] flex flex-col p-6 md:p-10 animate-in slide-in-from-left-full duration-500">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setIsIndexOpen(false)} className="w-10 h-10 bg-foreground/5 rounded-full flex items-center justify-center text-foreground hover:bg-primary transition-all">
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-xl font-bold text-foreground">فهرس السور</h3>
                </div>
                
                <div className="relative group mb-5">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors w-3.5 h-3.5" />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن اسم السورة..." className="w-full bg-foreground/5 border-2 border-border focus:border-primary/30 rounded-xl py-2.5 pr-10 pl-5 text-sm outline-none transition-all text-foreground text-right font-bold" />
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-20">
                    {filteredSurahs.map((s) => (
                        <button key={s.id} onClick={() => { setPages([]); fetchPageBatch(SURAH_START_PAGES[s.id] || 1, true); setIsIndexOpen(false); }} className="w-full flex items-center justify-between p-5 rounded-[2rem] bg-foreground/[0.03] hover:bg-primary/[0.05] hover:scale-[1.01] transition-all group border border-border/40 hover:border-primary/40">
                            <div className="flex items-center gap-5">
                                <div className="relative w-14 h-14 flex items-center justify-center group-hover:rotate-[360deg] transition-all duration-1000">
                                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-sm">
                                        <path d="M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z" fill="#06402B" stroke="#d4af37" strokeWidth="2" />
                                        <circle cx="50" cy="50" r="28" fill="none" stroke="#d4af37" strokeWidth="0.5" opacity="0.3" />
                                    </svg>
                                    <span className="relative z-10 text-[10px] font-black text-[#d4af37]">{s.id}</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xl font-bold font-arabic group-hover:text-primary transition-colors">سورة {s.name}</span>
                                    <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">{s.transliteration}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-primary">{s.total_verses} آية</span>
                                <span className="text-[8px] text-foreground/20 font-bold uppercase">نزولها: {s.revelation_type === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                            </div>
                        </button>
                    ))}
                </div>
             </div>
          </div>
        )}

        {/* The Mushaf Page Centered */}
        <div className="flex-1 w-full overflow-y-auto no-scrollbar scroll-smooth py-10 flex flex-col items-center relative">
            {/* Unified Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none sticky top-0">
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 opacity-[0.3] dark:opacity-[0.2]"
                    style={{ 
                        backgroundImage: "url('/mushaf-bg.jpg.png')",
                        filter: "sepia(0.3) brightness(1.05) contrast(1.1)"
                    }}
                />
                <div className="absolute inset-0 bg-background/40" />
            </div>

            <div className="max-w-[1200px] w-full flex flex-col items-center px-4">
                {pages.length > 0 ? (
                    pages.map((pData, pIdx) => (
                        <div key={`p-${pData.page}`} className="mb-20 w-full max-w-[850px] relative transition-all duration-1000">
                             {/* Page Shadow & Depth Decorations */}
                             <div className="absolute -inset-4 bg-primary/5 blur-[40px] rounded-[3rem] -z-10" />
                             
                             <MushafPage 
                                pData={pData}
                                pIdx={pIdx}
                                currentPlayingVerse={currentPlayingVerse}
                                playVerse={playVerse}
                                mushafFontSize={state.mushafFontSize}
                            />
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center gap-6 py-40">
                         <Loader2 className="w-12 h-12 text-primary animate-spin" />
                         <span className="text-sm font-bold text-foreground/40 tracking-widest uppercase">جاري صبغ الصفحات...</span>
                    </div>
                )}
                <div ref={observerTarget} className="h-60 w-full flex items-center justify-center">
                    {isLoading && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
                </div>
            </div>
        </div>

      </main>

      {/* --- Organized Bottom Navigation Bar --- */}
      <footer className="h-[80px] md:h-[90px] shrink-0 bg-background border-t border-border px-4 md:px-14 flex items-center justify-between z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4 md:gap-8 overflow-hidden">
              <div className="flex flex-col min-w-0">
                  <span className="text-[8px] md:text-[10px] text-foreground/30 font-bold uppercase tracking-widest truncate">موقعك الحالي</span>
                  <div className="flex items-center gap-2">
                      <Book className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs md:text-sm font-bold text-foreground whitespace-nowrap">الصفحة {pages[pages.length-1]?.page || ".."}</span>
                  </div>
              </div>
              <div className="hidden xs:block h-6 md:h-8 w-px bg-border flex-shrink-0" />
              <div className="flex items-center gap-2 md:gap-4 text-foreground/60">
                  <div className="flex items-center bg-foreground/5 rounded-xl px-1">
                       <button 
                         onClick={() => updateState({ mushafFontSize: Math.max(16, state.mushafFontSize - 2) })}
                         className="p-1 px-2 md:p-2 hover:text-primary transition-all font-bold text-base md:text-lg"
                       >
                         A-
                       </button>
                       <div className="w-px h-4 bg-border" />
                       <button 
                         onClick={() => updateState({ mushafFontSize: Math.min(60, state.mushafFontSize + 2) })}
                         className="p-1 px-2 md:p-2 hover:text-primary transition-all font-bold text-base md:text-lg"
                       >
                         A+
                       </button>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
              <button 
                  onClick={() => {
                      const prevPage = (pages[0]?.page || 1) - 3;
                      if (prevPage >= 1) { setPages([]); fetchPageBatch(prevPage, true); }
                  }}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 hover:bg-primary hover:text-black transition-all active:scale-95"
              >
                  <ChevronRight className="w-5 h-5" />
              </button>
              <button 
                  onClick={() => {
                      const nextPage = (pages[pages.length-1]?.page || 1) + 1;
                      if (nextPage <= 604) fetchPageBatch(nextPage);
                  }}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20 hover:scale-105 transition-all active:scale-90"
              >
                  <ChevronLeft className="w-5 h-5" />
              </button>
          </div>
      </footer>
    </div>
  );
}

// Re-built Premium Mushaf Page Component
const MushafPage = React.memo(({ pData, pIdx, currentPlayingVerse, playVerse, mushafFontSize }: any) => {
    return (
        <div 
            data-page={pData.page}
            className="flex flex-col relative w-full min-h-[85vh] bg-card dark:bg-[#1a1714] md:rounded-[1rem] shadow-[0_30px_70px_rgba(0,0,0,0.2)] border-2 border-[#d4af37]/30 transition-all overflow-hidden"
        >
            {/* --- MINIMALIST ROYAL OTTOMAN FRAME --- */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 1200">
                    <defs>
                        <linearGradient id="premiumGold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#d4af37" />
                            <stop offset="50%" stopColor="#fdfcf0" />
                            <stop offset="100%" stopColor="#c5a059" />
                        </linearGradient>
                    </defs>
                    
                    {/* Main Border - Triple Thin Lines */}
                    <rect x="20" y="20" width="760" height="1160" fill="none" stroke="url(#premiumGold)" strokeWidth="1.5" />
                    <rect x="25" y="25" width="750" height="1150" fill="none" stroke="url(#premiumGold)" strokeWidth="0.5" opacity="0.4" />
                    <rect x="35" y="35" width="730" height="1130" fill="none" stroke="url(#premiumGold)" strokeWidth="3" opacity="0.8" />
                    
                    {/* Minimalist Geometric Corners */}
                    {[
                        {t: "translate(35,35)", r: 0},
                        {t: "translate(765,35)", r: 90},
                        {t: "translate(765,1165)", r: 180},
                        {t: "translate(35,1165)", r: 270}
                    ].map((c, i) => (
                        <g key={i} transform={`${c.t} rotate(${c.r})`}>
                            {/* Elegant Geometric L-Shape */}
                            <path d="M 0,100 L 0,0 L 100,0" fill="none" stroke="url(#premiumGold)" strokeWidth="6" strokeLinecap="square" />
                            {/* Small Ottoman Star at tip */}
                            <g transform="translate(0,0)">
                                <path d="M-10,0 L0,-10 L10,0 L0,10 Z" fill="#06402B" stroke="url(#premiumGold)" strokeWidth="1.5" />
                                <circle r="2" fill="url(#premiumGold)" />
                            </g>
                        </g>
                    ))}

                    {/* Royal Side Medallions - Minimalist */}
                    {[
                        {t: "translate(400, 35)", r: 0},
                        {t: "translate(400, 1165)", r: 180},
                        {t: "translate(35, 600) rotate(-90)", r: 0},
                        {t: "translate(765, 600) rotate(90)", r: 0}
                    ].map((m, i) => (
                        <g key={i} transform={m.t}>
                             <path d="M -60,0 Q 0,40 60,0" fill="none" stroke="url(#premiumGold)" strokeWidth="2" />
                             <circle cx="0" cy="15" r="5" fill="#06402B" stroke="url(#premiumGold)" strokeWidth="1.5" />
                        </g>
                    ))}
                </svg>
            </div>

            {/* Premium Information Badges - Deluxe Mini Style */}
            <div className="relative h-24 flex items-center justify-between px-16 md:px-32 z-20 mt-4 pointer-events-none">
                {/* Juz Medallion */}
                <div className="w-12 h-12 relative flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                        <circle cx="50" cy="50" r="48" fill="#06402B" stroke="url(#brilliantGold)" strokeWidth="3" />
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" strokeWidth="0.5" opacity="0.2" />
                    </svg>
                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-[6px] text-[#d4af37] font-black leading-none">جزء</span>
                        <span className="text-white font-black text-sm">{pData.verses[0]?.juz_number}</span>
                    </div>
                </div>
                
                {/* Center Page Number Badge */}
                <div className="w-16 h-16 relative flex items-center justify-center translate-y-2">
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-lg">
                        <rect x="15" y="15" width="70" height="70" rx="10" transform="rotate(45 50 50)" fill="#06402B" stroke="url(#brilliantGold)" strokeWidth="4" />
                        <circle cx="50" cy="50" r="30" fill="none" stroke="#fff" opacity="0.1" />
                    </svg>
                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-[7px] text-[#d4af37] font-black mb-0.5">صفحة</span>
                        <span className="text-white font-black text-xl">{pData.page}</span>
                    </div>
                </div>

                {/* Hizb Medallion */}
                <div className="w-12 h-12 relative flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                        <circle cx="50" cy="50" r="48" fill="#06402B" stroke="url(#brilliantGold)" strokeWidth="3" />
                    </svg>
                    <div className="relative z-10 flex flex-col items-center">
                        <span className="text-[6px] text-[#d4af37] font-black leading-none">حزب</span>
                        <span className="text-white font-black text-sm">{pData.verses[0]?.hizb_number}</span>
                    </div>
                </div>
            </div>

            {/* --- Main Verses Layout --- */}
            <div className="relative z-10 w-full flex flex-col items-center px-[12%] md:px-[18%] pt-4 pb-20">
                <div 
                    className="w-full text-justify [text-align-last:justify] leading-[2.8] md:leading-[3.4] text-[#2a231b] dark:text-[#e2d6c5]" 
                    style={{ 
                        textJustify: 'inter-word',
                        wordSpacing: '0.25em'
                    }}
                >
                    {pData.verses.map((verse: any, vIdx: number) => {
                        const [sId, vId] = verse.verse_key.split(':');
                        const isFirstVerse = vId === "1";
                        const surahName = surahsData.find(s => s.id === parseInt(sId))?.name;
                        const isPlaying = currentPlayingVerse?.pageIndex === pIdx && currentPlayingVerse?.verseIndex === vIdx;

                        return (
                            <React.Fragment key={verse.id}>
                                {isFirstVerse && (
                                    <div className="w-full flex flex-col items-center gap-2 my-10 animate-in fade-in zoom-in duration-1000 relative">
                                         <div className="relative w-full max-w-[500px] min-h-[100px] flex items-center justify-center my-6">
                                               {/* --- ROYAL MINIMALIST SURAH HEADER --- */}
                                               <svg className="absolute inset-0 w-full h-full drop-shadow-lg" preserveAspectRatio="none" viewBox="0 0 500 100">
                                                   <defs>
                                                        <linearGradient id="headerGold" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#d4af37" />
                                                            <stop offset="100%" stopColor="#8a6d3b" />
                                                        </linearGradient>
                                                   </defs>
                                                   {/* Master Line Decoration */}
                                                   <path d="M 20,50 L 150,50 M 350,50 L 480,50" stroke="url(#headerGold)" strokeWidth="1" opacity="0.4" />
                                                   
                                                   {/* Elegant Box with Side Diamonds */}
                                                   <path d="M 170,30 L 330,30 Q 340,30 340,40 L 340,60 Q 340,70 330,70 L 170,70 Q 160,70 160,60 L 160,40 Q 160,30 170,30" fill="#06402B" stroke="url(#headerGold)" strokeWidth="2" />
                                                   
                                                   {/* Side Diamond Medallions */}
                                                   {[160, 340].map(x => (
                                                       <g key={x} transform={`translate(${x}, 50)`}>
                                                           <path d="M -15,0 L 0,-15 L 15,0 L 0,15 Z" fill="url(#headerGold)" />
                                                           <circle r="4" fill="#06402B" />
                                                       </g>
                                                   ))}
                                               </svg>
                                              <div className="relative z-20 flex flex-col items-center">
                                                  <span className="text-[10px] text-[#d4af37] font-black uppercase tracking-[0.4em] mb-1 opacity-80">سُورَةُ</span>
                                                  <span 
                                                     className="font-arabic font-black text-white drop-shadow-lg"
                                                     style={{ fontSize: `${mushafFontSize * 1.6}px` }}
                                                  >
                                                     {surahName}
                                                  </span>
                                              </div>
                                         </div>
                                         
                                        {sId !== "1" && sId !== "9" && (
                                            <div 
                                                className="font-arabic py-6 font-bold flex items-center justify-center gap-12 w-full"
                                                style={{ fontSize: `${mushafFontSize * 1.3}px` }}
                                            >
                                                <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-20" />
                                                <span className="text-[#06402B] dark:text-[#d4af37]/80">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</span>
                                                <div className="flex-1 h-[1.5px] bg-gradient-to-l from-transparent via-[#d4af37] to-transparent opacity-20" />
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <span 
                                    onClick={() => playVerse(pIdx, vIdx)} 
                                    className={`inline transition-all duration-300 rounded-2xl cursor-pointer p-1 ${isPlaying ? 'bg-[#d4af37]/20 text-primary shadow-[0_0_20px_rgba(212,175,55,0.2)] scale-105' : 'hover:bg-[#d4af37]/5'}`}
                                >
                                    <span 
                                        className={`${scheherazade.className} inline font-medium antialiased`}
                                        style={{ fontSize: `${mushafFontSize}px` }}
                                     >
                                        {verse.words?.filter((w: any) => w.char_type_name === 'word').map((word: any) => {
                                            const isAllah = word.text_uthmani?.includes('للَّ') || word.text_uthmani?.includes('اللَّ');
                                            return (
                                                <span 
                                                    key={word.id} 
                                                    className={`inline-block px-[2px] transition-colors ${isAllah ? 'text-[#cd4d4d]' : 'currentColor'}`}
                                                >
                                                    {word.text_uthmani}
                                                </span>
                                            );
                                        })}
                                        
                                        <span 
                                            className="inline-flex items-center justify-center relative select-none mx-4 translate-y-3"
                                            style={{ width: `${mushafFontSize * 1.6}px`, height: `${mushafFontSize * 1.6}px` }}
                                        >
                                            <svg className="absolute inset-0 w-full h-full drop-shadow-md" viewBox="0 0 100 100">
                                                {/* Detailed Ottoman Verse Medallion */}
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="#06402B" strokeWidth="1" opacity="0.1" />
                                                <path d="M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z" fill="none" stroke="url(#madinahGoldRich)" strokeWidth="2" />
                                                <circle cx="50" cy="50" r="28" fill="none" stroke="#06402B" strokeWidth="0.5" opacity="0.2" />
                                                <circle cx="50" cy="50" r="22" fill="#06402B" opacity="0.05" />
                                            </svg>
                                            <span 
                                                className="relative z-10 font-bold font-serif text-[#06402B] dark:text-[#d4af37]"
                                                style={{ fontSize: `${mushafFontSize * 0.5}px` }}
                                            >
                                                {vId}
                                            </span>
                                        </span>
                                    </span>
                                </span>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});
MushafPage.displayName = "MushafPage";
