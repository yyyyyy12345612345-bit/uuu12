"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, Play, Search, List, User, X } from "lucide-react";
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

export function DigitalMushaf() {
  const { state, updateState } = useEditor();
  const [pages, setPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [isPlayingPage, setIsPlayingPage] = useState(false);
  const [currentPlayingVerse, setCurrentPlayingVerse] = useState<{pageIndex: number, verseIndex: number} | null>(null);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const [isIndexOpen, setIsIndexOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const observerTarget = useRef(null);

  useEffect(() => {
    const savedPage = localStorage.getItem("last_read_page");
    const initialPage = savedPage ? parseInt(savedPage) : 1;
    setCurrentPage(initialPage);
    fetchPage(initialPage, true);
  }, []);

  async function fetchPage(pageNum: number, clear = false) {
    if (isLoading || pageNum > 604) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_ROOT}/verses/by_page/${pageNum}?language=ar&words=true&word_fields=text_uthmani,audio_url,char_type_name&fields=text_uthmani,verse_key,juz_number,hizb_number`
      );
      const data = await response.json();
      
      if (data.verses) {
          if (clear) {
              setPages([{ page: pageNum, verses: data.verses }]);
          } else {
              setPages(prev => [...prev, { page: pageNum, verses: data.verses }]);
          }
          localStorage.setItem("last_read_page", pageNum.toString());
      }
    } catch (err) {
      console.error("Failed to fetch page data", err);
    } finally {
      setIsLoading(false);
    }
  }

  // Optimized Infinite Scroll with rootMargin for smooth connecting surahs
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          const nextP = (pages[pages.length - 1]?.page || 1) + 1;
          if (nextP <= 604) {
              fetchPage(nextP);
          } else {
              setHasMore(false);
          }
        }
      },
      { threshold: 0.1, rootMargin: '1200px' } // Pre-load pages 1200px before reaching bottom
    );

    if (observerTarget.current) {
        observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [pages, isLoading, hasMore]);

  const playVerse = (pIdx: number, vIdx: number) => {
    const verse = pages[pIdx]?.verses[vIdx];
    if (!verse) return;
    setCurrentPlayingVerse({ pageIndex: pIdx, verseIndex: vIdx });
    if (audioRef.current) {
        const [sura, ayah] = verse.verse_key.split(':');
        audioRef.current.src = getAudioUrl(parseInt(sura), parseInt(ayah), state.reciterId);
        audioRef.current.play().catch(console.error);
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
    <div className="h-full flex flex-col bg-[#111111] text-white font-arabic relative overflow-hidden text-right">
      <audio ref={audioRef} onEnded={handleAudioEnd} onError={handleAudioEnd} />

      <header className="h-[75px] shrink-0 border-b border-white/5 bg-[#111111]/90 backdrop-blur-xl px-4 md:px-10 flex items-center justify-between z-50">
        <div className="flex items-center gap-2">
             <button onClick={() => setIsIndexOpen(true)} className="w-[50px] h-[50px] bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 hover:scale-105 transition-all">
                <List className="w-6 h-6" />
             </button>
             <button onClick={() => setShowReciterPicker(!showReciterPicker)} className="w-[50px] h-[50px] bg-white/5 rounded-2xl flex items-center justify-center text-white/40 hover:text-white border border-white/5 transition-all shadow-inner">
                <User className="w-6 h-6" />
             </button>
        </div>

        <div className="flex flex-col items-center">
            <span className="text-[10px] text-primary/40 font-bold uppercase tracking-widest leading-none mb-1">المصحف الكامل</span>
            <div className="text-sm font-bold opacity-30 font-mono tracking-tighter">P {pages[pages.length-1]?.page || ".."}</div>
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
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${isPlayingPage ? 'bg-primary text-black' : 'bg-white/5 border border-white/5 text-white/40 hover:text-white'}`}
        >
            {isPlayingPage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span className="text-sm font-bold font-arabic">{isPlayingPage ? 'جاري الاستماع' : 'استماع'}</span>
        </button>

        {showReciterPicker && (
            <div className="absolute top-[85px] left-4 md:left-10 w-80 bg-black/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl z-[100] p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-300">
                <div className="p-3 border-b border-white/5 mb-2 text-center text-primary font-bold text-[10px] uppercase tracking-widest">اختر القارئ</div>
                {RECITERS.map(reciter => (
                    <button key={reciter.id} onClick={() => { updateState({ reciterId: reciter.id }); setShowReciterPicker(false); }} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${state.reciterId === reciter.id ? 'bg-primary/10 border border-primary/20 text-primary' : 'hover:bg-white/5 text-white/40'}`}>
                        <User className="w-5 h-5 opacity-20" />
                        <span className="font-arabic font-bold text-sm text-right flex-1">{reciter.name}</span>
                    </button>
                ))}
            </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar overscroll-contain" ref={scrollRef}>
        {isIndexOpen || pages.length === 0 ? (
          <div className="max-w-[1200px] mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex flex-col gap-8">
                <h3 className="text-3xl font-black font-arabic text-primary text-right">فهرس السور</h3>
                <div className="relative group max-w-2xl ml-auto">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن سورة..." className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] py-5 pr-16 pl-8 text-xl outline-none focus:border-primary/40 focus:bg-white/5 transition-all text-white text-right font-arabic" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSurahs.map((s) => (
                        <button key={s.id} onClick={() => { setPages([]); setCurrentPage(SURAH_START_PAGES[s.id] || 1); fetchPage(SURAH_START_PAGES[s.id] || 1, true); setIsIndexOpen(false); }} className="flex items-center justify-between p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center text-sm font-bold text-white/20 group-hover:text-primary transition-colors border border-white/5">{s.id}</div>
                                <span className="font-arabic text-xl font-bold text-white/80 group-hover:text-white transition-colors">سورة {s.name}</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-40 group-hover:opacity-100">{s.total_verses} آية</span>
                        </button>
                    ))}
                </div>
             </div>
          </div>
        ) : (
          <div className="max-w-[950px] mx-auto px-6 md:px-16 text-center pt-8 pb-32">
            {pages.map((pData, pIdx) => (
                <div key={`page-wrapper-${pData.page}`} className="flex flex-col bg-white/[0.01] border border-white/5 p-6 md:p-12 rounded-[2.5rem] shadow-2xl relative mb-12 animate-in fade-in duration-1000">
                    <div className="absolute top-6 left-6 text-[10px] font-bold text-white/10 tracking-widest uppercase">P. {pData.page}</div>
                    <div className="w-full text-right leading-[2.6] md:leading-[3.6]">
                        {pData.verses.map((verse: any, vIdx: number) => {
                            const isPlaying = currentPlayingVerse?.pageIndex === pIdx && currentPlayingVerse?.verseIndex === vIdx;
                            return (
                                <span key={verse.id} id={`digital-verse-${verse.id}`} onClick={() => playVerse(pIdx, vIdx)} className={`inline transition-all duration-700 rounded-xl cursor-pointer ${isPlaying ? 'bg-primary/10 text-white' : 'text-white/80 hover:text-white hover:bg-white/5'}`}>
                                    <span className="inline text-[1.9rem] md:text-[3rem] font-arabic">
                                        {verse.words?.filter((w: any) => w.char_type_name === 'word').map((word: any) => (
                                            <span key={word.id} className="inline-block px-0.5 md:px-1">{word.text_uthmani}</span>
                                        ))}
                                        <span className="inline-flex items-center justify-center w-10 h-10 md:w-[50px] md:h-[50px] relative top-[-4px] md:top-[-8px] mx-2 md:mx-4 group/ayah">
                                            <svg className="absolute inset-0 w-full h-full text-white/10 group-hover/ayah:text-primary/20 transition-colors" viewBox="0 0 100 100"><path fill="currentColor" d="M50 0 L100 50 L50 100 L0 50 Z" /><path fill="none" stroke="currentColor" strokeWidth="2" d="M50 10 L90 50 L50 90 L10 50 Z" /></svg>
                                            <span className="relative z-10 text-[9px] md:text-[11px] font-bold font-mono text-white/30 tracking-tighter">{verse.verse_key.split(':')[1]}</span>
                                        </span>
                                    </span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            ))}
            <div ref={observerTarget} className="h-40 flex items-center justify-center">{isLoading && <Loader2 className="w-8 h-8 text-primary animate-spin" />}</div>
          </div>
        )}
      </main>
    </div>
  );
}
"
