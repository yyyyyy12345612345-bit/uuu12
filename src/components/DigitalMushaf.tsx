"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Loader2, Play, Search, List, User, X, ChevronRight, ChevronLeft, Book, Star, Settings, Download } from "lucide-react";
import { Scheherazade_New } from "next/font/google";
import surahsData from "@/data/surahs.json";
import { RECITERS } from "@/data/reciters";
import { useEditor } from "@/store/useEditor";
import { getAudioUrl } from "@/lib/quranUtils";
import { logAppEvent } from "@/lib/firebase";
import { updateMediaSession, updatePlaybackState } from "@/lib/mediaSession";
import { startPageTimer, endPageTimer } from "@/lib/points";

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
            logAppEvent("change_page", { page: startPage });
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

  // Points Tracking Observer
  useEffect(() => {
    const pointsObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageId = entry.target.getAttribute("data-page");
            if (pageId) {
              // End timer for previous page (if any) and start for new one
              endPageTimer(pageId).then(res => {
                if (res.success) {
                   console.log("Points added for page", pageId);
                }
              });
              startPageTimer(pageId);
            }
          }
        });
      },
      { threshold: 0.7 } // Must see 70% of the page to start counting
    );

    const pageElements = document.querySelectorAll("[data-page]");
    pageElements.forEach(el => pointsObserver.observe(el));

    return () => pointsObserver.disconnect();
  }, [pages]);

  const playVerse = (pIdx: number, vIdx: number) => {
    const verse = pages[pIdx]?.verses[vIdx];
    if (!verse) return;
    
    setCurrentPlayingVerse({ pageIndex: pIdx, verseIndex: vIdx });
    if (audioRef.current) {
        const [sura, ayah] = verse.verse_key.split(':');
        const audioUrl = getAudioUrl(parseInt(sura), parseInt(ayah), state.reciterId, verse.id);
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(err => {
            console.error("Playback failed for url:", audioUrl, err);
            if (!audioUrl.includes('Alafasy')) {
                audioRef.current!.src = getAudioUrl(parseInt(sura), parseInt(ayah), 'afasy', verse.id);
                audioRef.current!.play();
            }
        });

        // Media Session Update
        const surahName = surahsData.find(s => s.id === parseInt(sura))?.name || "";
        updateMediaSession({
            title: `سورة ${surahName} - آية ${ayah}`,
            artist: RECITERS.find(r => r.id === state.reciterId)?.name || "قارئ",
        }, {
            onPlay: () => { audioRef.current?.play(); setIsPlayingPage(true); },
            onPause: () => { audioRef.current?.pause(); setIsPlayingPage(false); },
            onNext: () => {
                if (vIdx + 1 < pages[pIdx].verses.length) playVerse(pIdx, vIdx + 1);
                else if (pIdx + 1 < pages.length) playVerse(pIdx + 1, 0);
            },
            onPrev: () => {
                if (vIdx > 0) playVerse(pIdx, vIdx - 1);
                else if (pIdx > 0) playVerse(pIdx - 1, pages[pIdx-1].verses.length - 1);
            }
        });
        updatePlaybackState('playing');

        logAppEvent("play_verse", { surah: sura, verse: ayah, reciter: state.reciterId });
        
        // Add points for listening to a verse
        addPoints("listen");
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
    <div className="h-full w-full flex flex-col bg-[#FDFBF7] dark:bg-zinc-950 text-black font-arabic relative overflow-hidden transition-colors duration-500">
      
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
          <div className="absolute inset-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')" }} />
      </div>
      
      <audio ref={audioRef} onEnded={handleAudioEnd} onError={handleAudioEnd} />

      {/* Mushaf Internal Header - Should match bg in light mode */}
      <header className="h-[75px] md:h-[85px] shrink-0 border-b border-border bg-[#FDFBF7]/95 dark:bg-zinc-950/95 backdrop-blur-xl px-2 md:px-10 flex items-center justify-between z-[100] shadow-sm">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
             <button onClick={() => setIsIndexOpen(true)} className="flex items-center justify-center md:justify-start gap-2 h-11 px-3 md:px-6 bg-primary/20 text-foreground dark:text-zinc-100 rounded-2xl font-bold border border-primary/20 transition-all hover:bg-primary/30 active:scale-95">
                <List className="w-5 h-5 text-primary" />
                <span className="text-sm hidden md:block">فهرس السور</span>
             </button>
             <button onClick={() => setShowReciterPicker(!showReciterPicker)} className="w-11 h-11 md:w-12 md:h-12 bg-foreground/5 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-foreground/60 dark:text-zinc-100/60 hover:text-foreground dark:hover:text-zinc-100 border border-border transition-all relative active:scale-95">
                <User className="w-5 h-5 md:w-6 h-6" />
                {showReciterPicker && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />}
             </button>
        </div>

        <div className="hidden sm:flex flex-col items-center flex-1">
            <h2 className="text-base md:text-xl font-black text-foreground dark:text-zinc-100 tracking-tight whitespace-nowrap">المصحف المرتل</h2>
            <div className="flex items-center gap-2 mt-1">
                <Star className="w-2.5 h-2.5 text-primary" />
                <span className="text-[9px] md:text-[10px] text-foreground/40 dark:text-zinc-100/40 font-bold uppercase tracking-widest whitespace-nowrap">مكتبة متميزة</span>
                <Star className="w-2.5 h-2.5 text-primary" />
            </div>
        </div>

        <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">
            <div className="hidden lg:flex flex-col items-end mr-4">
                <span className="text-[10px] text-foreground/30 dark:text-zinc-100/30 font-bold uppercase">القارئ الحالي</span>
                <span className="text-sm font-bold text-foreground dark:text-zinc-100">{RECITERS.find(r => r.id === state.reciterId)?.name}</span>
            </div>
            <button 
                onClick={() => {
                    if(isPlayingPage) {
                        setIsPlayingPage(false);
                        audioRef.current?.pause();
                        updatePlaybackState('paused');
                    } else {
                        setIsPlayingPage(true);
                        playVerse(0, 0);
                    }
                }}
                className={`flex items-center justify-center gap-2 h-11 px-4 md:px-8 md:h-12 rounded-2xl transition-all shadow-lg font-bold active:scale-95 ${isPlayingPage ? 'bg-primary text-black' : 'bg-foreground/5 dark:bg-zinc-800 border border-primary/20 text-foreground dark:text-zinc-100 hover:border-primary'}`}
            >
                {isPlayingPage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                <span className="text-xs md:text-sm hidden xs:block">{isPlayingPage ? 'استماع...' : 'بدء الترتيل'}</span>
            </button>
        </div>
      </header>

      {showReciterPicker && (
          <div className="absolute top-[85px] left-4 md:left-10 w-80 bg-background dark:bg-zinc-900 border border-border rounded-[2.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.3)] z-[1000] p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-300">
              <div className="p-3 border-b border-border mb-2 text-center text-foreground/40 dark:text-zinc-100/40 font-bold text-[10px] uppercase tracking-[0.3em]">اختر صوت القارئ</div>
              {RECITERS.map(reciter => (
                  <button key={reciter.id} onClick={() => { updateState({ reciterId: reciter.id }); setShowReciterPicker(false); }} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${state.reciterId === reciter.id ? 'bg-primary/10 border border-primary/30 text-foreground dark:text-zinc-100' : 'hover:bg-foreground/5 dark:hover:bg-zinc-800 text-foreground/60 dark:text-zinc-100/60'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${state.reciterId === reciter.id ? 'bg-primary text-black' : 'bg-foreground/10 dark:bg-zinc-700'}`}>
                          <User className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-sm text-right flex-1">{reciter.name}</span>
                  </button>
              ))}
          </div>
      )}

      <main className="flex-1 relative flex flex-col items-center overflow-hidden">
        {isIndexOpen && (
          <div className="absolute inset-0 z-[150] bg-background/60 dark:bg-zinc-950/60 backdrop-blur-md flex justify-end animate-in fade-in duration-300">
             <div className="w-full md:w-[400px] h-full bg-background dark:bg-zinc-900 shadow-[-10px_0_50px_rgba(0,0,0,0.12)] flex flex-col p-6 md:p-10 animate-in slide-in-from-left-full duration-500">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setIsIndexOpen(false)} className="w-10 h-10 bg-foreground/5 dark:bg-zinc-800 rounded-full flex items-center justify-center text-foreground dark:text-zinc-100 hover:bg-primary transition-all">
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-xl font-bold text-foreground dark:text-zinc-100">القائمة الرئيسية</h3>
                </div>

                {/* Manual Update Check Button */}
                <button 
                    onClick={() => { window.dispatchEvent(new CustomEvent('check-for-updates')); }}
                    className="w-full mb-6 flex items-center gap-4 p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all active:scale-95 group"
                >
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-black shadow-lg shadow-primary/20 group-hover:rotate-[360deg] transition-transform duration-500">
                        <Download className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-sm">تحديث التطبيق</span>
                        <span className="text-[9px] opacity-60 font-bold uppercase tracking-wider">البحث عن إصدار جديد</span>
                    </div>
                </button>
                
                <div className="relative group mb-5">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors w-3.5 h-3.5" />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن اسم السورة..." className="w-full bg-foreground/5 dark:bg-zinc-800 border-2 border-border focus:border-primary/30 rounded-xl py-2.5 pr-10 pl-5 text-sm outline-none transition-all text-foreground dark:text-zinc-100 text-right font-bold" />
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-20">
                    <div className="p-2 text-[10px] text-foreground/30 dark:text-zinc-100/30 font-bold uppercase tracking-[0.3em]">فهرس السور</div>
                    {filteredSurahs.map((s) => (
                        <button key={s.id} onClick={() => { 
                            setPages([]); 
                            fetchPageBatch(SURAH_START_PAGES[s.id] || 1, true); 
                            setIsIndexOpen(false); 
                            logAppEvent("open_surah", { surah_id: s.id, surah_name: s.name });
                        }} className="w-full flex items-center justify-between p-5 rounded-[2rem] bg-foreground/[0.03] dark:bg-zinc-800/20 hover:bg-primary/[0.05] hover:scale-[1.01] transition-all group border border-border/40 hover:border-primary/40">
                            <div className="flex items-center gap-5">
                                <div className="relative w-14 h-14 flex items-center justify-center group-hover:rotate-[360deg] transition-all duration-1000">
                                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-sm">
                                        <path d="M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z" fill="#06402B" stroke="#d4af37" strokeWidth="2" />
                                        <circle cx="50" cy="50" r="28" fill="none" stroke="#d4af37" strokeWidth="0.5" opacity="0.3" />
                                    </svg>
                                    <span className="relative z-10 text-[10px] font-black text-[#d4af37]">{s.id}</span>
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-xl font-bold font-arabic group-hover:text-primary transition-colors text-foreground dark:text-zinc-100">سورة {s.name}</span>
                                    <span className="text-[10px] text-foreground/30 dark:text-zinc-100/30 font-bold uppercase tracking-widest">{s.transliteration}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-primary">{s.total_verses} آية</span>
                                <span className="text-[8px] text-foreground/20 dark:text-zinc-100/20 font-bold uppercase">نزولها: {s.revelation_type === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                            </div>
                        </button>
                    ))}
                </div>
             </div>
          </div>
        )}

        {/* The main scroll area - ALWAYS WHITE background in light mode */}
        <div className="flex-1 w-full overflow-y-auto no-scrollbar scroll-smooth py-10 flex flex-col items-center relative bg-transparent transition-colors duration-500">
            <div className="max-w-[1200px] w-full flex flex-col items-center px-4 relative z-10">
                {pages.length > 0 ? (
                    pages.map((pData, pIdx) => (
                        <div key={`p-${pData.page}`} className="mb-20 w-full max-w-[850px] relative transition-all duration-1000">
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
                         <span className="text-sm font-bold text-foreground/40 dark:text-zinc-100/40 tracking-widest uppercase">جاري صبغ الصفحات...</span>
                    </div>
                )}
                <div ref={observerTarget} className="h-60 w-full flex items-center justify-center">
                    {isLoading && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
                </div>
            </div>
        </div>
      </main>

      <footer className="h-[80px] md:h-[90px] shrink-0 bg-white dark:bg-zinc-950 border-t border-border px-4 md:px-14 flex items-center justify-between z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.03)] transition-colors duration-500">
          <div className="flex items-center gap-4 md:gap-8 overflow-hidden">
              <div className="flex flex-col min-w-0">
                  <span className="text-[8px] md:text-[10px] text-foreground/30 dark:text-zinc-100/30 font-bold uppercase tracking-widest truncate">موقعك الحالي</span>
                  <div className="flex items-center gap-2">
                      <Book className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs md:text-sm font-bold text-foreground dark:text-zinc-100 whitespace-nowrap">الصفحة {pages[pages.length-1]?.page || ".."}</span>
                  </div>
              </div>
              <div className="hidden xs:block h-6 md:h-8 w-px bg-border flex-shrink-0" />
              <div className="flex items-center gap-2 md:gap-4 text-foreground/60 dark:text-zinc-100/60">
                  <div className="flex items-center bg-foreground/5 dark:bg-zinc-800 rounded-xl px-1">
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
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-foreground/5 dark:bg-zinc-800 flex items-center justify-center text-foreground/40 dark:text-zinc-100/40 hover:bg-primary hover:text-black transition-all active:scale-95"
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

const MushafPage = React.memo(({ pData, pIdx, currentPlayingVerse, playVerse, mushafFontSize }: any) => {
    return (
        <div 
            data-page={pData.page}
            className="flex flex-col relative w-full min-h-[85vh] bg-[#FDFBF7] md:rounded-[1rem] shadow-[0_30px_70px_rgba(0,0,0,0.1)] border-2 border-[#d4af37]/20 transition-all overflow-hidden"
        >
            <div className="absolute inset-0 z-10 pointer-events-none">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 1200">
                    <defs>
                        <linearGradient id="premiumGold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#d4af37" />
                            <stop offset="50%" stopColor="#fdfcf0" />
                            <stop offset="100%" stopColor="#c5a059" />
                        </linearGradient>
                    </defs>
                    <rect x="20" y="20" width="760" height="1160" fill="none" stroke="url(#premiumGold)" strokeWidth="1.5" />
                    <rect x="25" y="25" width="750" height="1150" fill="none" stroke="url(#premiumGold)" strokeWidth="0.5" opacity="0.4" />
                    <rect x="35" y="35" width="730" height="1130" fill="none" stroke="url(#premiumGold)" strokeWidth="3" opacity="0.8" />
                </svg>
            </div>

            <div className="relative h-16 flex items-center justify-between px-16 md:px-32 z-20 mt-4 pointer-events-none">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[#8b6d1b] font-bold">جُزْء</span>
                    <span className="text-black font-black text-lg leading-none">{pData.verses[0]?.juz_number}</span>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                    <span className="text-black/30 text-[9px] font-bold uppercase tracking-widest mb-0.5">صفحة</span>
                    <span className="text-black font-bold text-xl leading-none">{pData.page}</span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[#8b6d1b] font-bold">حِزْب</span>
                    <span className="text-black font-black text-lg leading-none">{pData.verses[0]?.hizb_number}</span>
                </div>
            </div>

            <div className="relative z-10 w-full flex flex-col items-center px-[12%] md:px-[18%] pt-4 pb-20">
                <div className="w-full text-justify [text-align-last:justify] leading-[2.8] md:leading-[3.4] text-black" style={{ textJustify: 'inter-word', wordSpacing: '0.25em' }}>
                    {pData.verses.map((verse: any, vIdx: number) => {
                        const [sId, vId] = verse.verse_key.split(':');
                        const isFirstVerse = vId === "1";
                        const surahName = surahsData.find(s => s.id === parseInt(sId))?.name;
                        const isPlaying = currentPlayingVerse?.pageIndex === pIdx && currentPlayingVerse?.verseIndex === vIdx;

                        return (
                            <React.Fragment key={verse.id}>
                                {isFirstVerse && (
                                    <div className="w-full flex flex-col items-center gap-1 my-6 animate-in fade-in zoom-in duration-1000 relative">
                                        <div className="relative z-20 flex items-center justify-center w-full max-w-[320px] h-[80px]">
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                                <svg className="w-full h-full" viewBox="0 0 320 80" preserveAspectRatio="none">
                                                     <rect x="10" y="10" width="300" height="60" fill="none" stroke="#d4af37" strokeWidth="0.5" opacity="0.3" rx="4" />
                                                     <rect x="15" y="15" width="290" height="50" fill="none" stroke="#d4af37" strokeWidth="1.5" opacity="0.8" rx="2" />
                                                     <path d="M 10,25 L 10,10 L 25,10" fill="none" stroke="#d4af37" strokeWidth="3" />
                                                     <path d="M 295,10 L 310,10 L 310,25" fill="none" stroke="#d4af37" strokeWidth="3" />
                                                     <path d="M 310,55 L 310,70 L 295,70" fill="none" stroke="#d4af37" strokeWidth="3" />
                                                     <path d="M 25,70 L 10,70 L 10,55" fill="none" stroke="#d4af37" strokeWidth="3" />
                                                </svg>
                                            </div>
                                            <div className="absolute top-[12.5px] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FDFBF7] px-4 z-30">
                                                <span className="text-[10px] md:text-[11px] text-[#8b6d1b] font-black uppercase tracking-[0.4em] opacity-80">سُورَةُ</span>
                                            </div>
                                            <div className="relative z-20 flex items-center justify-center w-full h-full pt-1">
                                                <span className="font-arabic font-black text-black leading-none" style={{ fontSize: `${mushafFontSize * 1.3}px` }}>{surahName}</span>
                                            </div>
                                        </div>
                                        {sId !== "1" && sId !== "9" && (
                                            <div className="font-arabic py-6 font-bold flex items-center justify-center gap-12 w-full" style={{ fontSize: `${mushafFontSize * 1.3}px` }}>
                                                <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-20" />
                                                <span className="text-[#06402B]">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</span>
                                                <div className="flex-1 h-[1.5px] bg-gradient-to-l from-transparent via-[#d4af37] to-transparent opacity-20" />
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <span 
                                    onClick={() => playVerse(pIdx, vIdx)} 
                                    className={`inline transition-all duration-300 rounded-2xl cursor-pointer p-1 ${isPlaying ? 'bg-[#d4af37]/20 text-primary shadow-[0_0_20px_rgba(212,175,55,0.2)] scale-105' : 'hover:bg-[#d4af37]/5'}`}
                                >
                                    <span className={`${scheherazade.className} inline font-medium antialiased`} style={{ fontSize: `${mushafFontSize}px` }}>
                                        {verse.words?.filter((w: any) => w.char_type_name === 'word').map((word: any) => {
                                            const isAllah = word.text_uthmani?.includes('للَّ') || word.text_uthmani?.includes('اللَّ');
                                            return (
                                                <span key={word.id} className={`inline-block px-[2px] transition-colors ${isAllah ? 'text-[#cd4d4d]' : 'currentColor'}`}>
                                                    {word.text_uthmani}
                                                </span>
                                            );
                                        })}
                                        <span className="inline-flex items-center justify-center relative select-none mx-2" style={{ width: `${mushafFontSize * 0.8}px`, height: `${mushafFontSize * 0.8}px`, verticalAlign: 'middle' }}>
                                            <span className="relative z-10 font-bold text-black border border-black/20 rounded-full w-full h-full flex items-center justify-center" style={{ fontSize: `${mushafFontSize * 0.45}px` }}>
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
