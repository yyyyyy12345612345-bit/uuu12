"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Loader2, BookOpen, Play, Search, X, List, Bookmark as BookmarkIcon } from "lucide-react";
import surahsData from "@/data/surahs.json";
import { useEditor } from "@/store/useEditor";
import { getAudioUrl } from "@/lib/quranUtils";

/**
 * DigitalMushaf Component - Version 6.0 (Stability & Error-Free Routing)
 */

const API_ROOT = "https://api.quran.com/api/v4";

// Mapping of Surah IDs to their starting pages in the standard Mushaf
const SURAH_START_PAGES: Record<number, number> = {
  1:1, 2:2, 3:50, 4:77, 5:106, 6:128, 7:151, 8:177, 9:187, 10:208, 11:221, 12:235, 13:249, 14:255, 15:262, 16:267, 17:282, 18:293, 19:305, 20:312, 
  21:322, 22:332, 23:342, 24:350, 25:359, 26:367, 27:377, 28:385, 29:396, 30:404, 31:411, 32:415, 33:418, 34:428, 35:434, 36:440, 37:446, 38:453, 39:458, 40:467, 
  41:477, 42:483, 43:489, 44:496, 45:499, 46:502, 47:507, 48:511, 49:515, 50:518, 51:520, 52:523, 53:526, 54:528, 55:531, 56:534, 57:537, 58:542, 59:545, 60:549, 
  61:551, 62:553, 63:554, 64:556, 65:558, 66:560, 67:562, 68:564, 69:566, 70:568, 71:570, 72:572, 73:574, 74:575, 75:577, 76:578, 77:580, 78:582, 79:583, 80:585, 
  81:586, 82:587, 83:587, 84:589, 85:590, 86:591, 87:591, 88:592, 89:593, 90:594, 91:595, 92:595, 93:596, 94:596, 95:597, 96:597, 97:598, 98:598, 99:599, 100:599, 
  101:600, 102:600, 103:601, 104:601, 105:601, 106:602, 107:602, 108:602, 109:603, 110:603, 111:603, 112:604, 113:604, 114:604
};

export function DigitalMushaf() {
  const { state } = useEditor();
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

  useEffect(() => {
    const savedPage = localStorage.getItem("last_read_page");
    if (savedPage) {
        setCurrentPage(parseInt(savedPage));
    }
  }, []);

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
                    juz: data.verses[0]?.juz_number,
                    hizb: data.verses[0]?.hizb_number,
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
    if (!word?.audio_url) return;
    setActiveWordId(word.id);
    if (wordAudioRef.current) {
        const audioUrl = word.audio_url.startsWith('http') ? word.audio_url : `https:${word.audio_url}`;
        wordAudioRef.current.src = audioUrl;
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
    if (!pageData || index >= pageData.length) {
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
        const audioUrl = getAudioUrl(parseInt(sura), parseInt(ayah), state.reciterId);
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(() => {
            if (audioRef.current) {
                audioRef.current.src = getAudioUrl(parseInt(sura), parseInt(ayah), state.reciterId, 'fallback');
                audioRef.current.play().catch(console.error);
            }
        });
    }
  };

  const handleAudioEnd = () => {
    if (isPlayingPage && currentPlayingVerse !== null) {
        playVerse(currentPlayingVerse + 1);
    }
  };

  const handleAudioError = () => {
    if (isPlayingPage && currentPlayingVerse !== null && audioRef.current) {
         const [sura, ayah] = pageData[currentPlayingVerse].verse_key.split(':');
         audioRef.current.src = getAudioUrl(parseInt(sura), parseInt(ayah), state.reciterId, 'fallback');
         audioRef.current.play().catch(() => playVerse(currentPlayingVerse + 1));
    }
  };

  const nextPage = () => setCurrentPage(p => Math.min(604, p + 1));
  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));

  const filteredSurahs = surahsData.filter(s => 
    s.name.includes(searchQuery) || s.transliteration.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[#111111] text-white font-arabic relative overflow-hidden text-right">
      
      <audio ref={audioRef} onEnded={handleAudioEnd} onError={handleAudioError} />
      <audio ref={wordAudioRef} onEnded={() => setActiveWordId(null)} />

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

      <main className="flex-1 overflow-y-auto no-scrollbar pt-8 pb-32 overscroll-contain" ref={scrollRef}>
        <div className="max-w-[950px] mx-auto px-6 md:px-16 text-center">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="flex flex-col">
                    {pageData?.map((verse: any, idx: number) => {
                        if (!verse) return null;
                        const [sId, vId] = verse.verse_key.split(':');
                        const isFirstVerse = vId === "1";
                        const surahName = surahsData.find(s => s.id === parseInt(sId))?.name;
                        
                        return (
                            <React.Fragment key={verse.id}>
                                {isFirstVerse && (
                                    <div className="my-12 animate-in fade-in duration-700 w-full text-center">
                                        <div className="inline-block px-20 py-6 border border-white/5 bg-white/[0.01] rounded-[2rem] mb-10 relative">
                                            <h3 className="text-3xl md:text-5xl font-bold font-arabic text-primary/80">سورة {surahName}</h3>
                                        </div>
                                        {sId !== "1" && sId !== "9" && (
                                            <div className="text-3xl md:text-[3.5rem] font-arabic text-white/50 mb-10 opacity-60 uppercase">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                                        )}
                                    </div>
                                )}
                                <div 
                                    id={`digital-verse-${verse.id}`}
                                    className={`inline leading-[2.8] md:leading-[3.2] transition-colors duration-700 ${currentPlayingVerse === idx ? 'bg-primary/5 rounded-2xl' : ''}`}
                                >
                                    <span className="inline text-[2.2rem] md:text-[3.3rem] text-white/90">
                                        {verse.words?.map((word: any) => (
                                            <span 
                                                key={word.id}
                                                onClick={() => playWord(word)}
                                                className={`inline-block cursor-pointer px-0.5 md:px-1 rounded-xl transition-all duration-200 ${activeWordId === word.id ? 'text-primary scale-110' : 'hover:text-primary'}`}
                                            >
                                                {word.text_uthmani}
                                            </span>
                                        ))}
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

      {isIndexOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 text-right">
            <div className="absolute inset-0 bg-[#0a0a0a]/98 backdrop-blur-2xl" />
            <div className="relative w-full max-w-6xl h-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden">
                <div className="flex items-center justify-between p-8 shrink-0">
                    <button onClick={() => setIsIndexOpen(false)} className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all border border-white/10 group"><X className="w-6 h-6 text-white/40 group-hover:text-white" /></button>
                    <div><h3 className="text-3xl font-black font-arabic text-primary mb-2">فهرس السور</h3><p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">Select a Surah</p></div>
                </div>
                <div className="px-8 pb-8 shrink-0 flex justify-end">
                    <div className="relative group w-full max-w-2xl">
                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن سورة..." className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pr-16 pl-8 text-xl outline-none focus:border-primary/40 focus:bg-white/5 transition-all text-white text-right font-arabic" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-10">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredSurahs.map((s) => (
                            <button 
                                key={s.id}
                                onClick={() => {
                                    const startPage = SURAH_START_PAGES[s.id] || 1;
                                    setCurrentPage(startPage);
                                    setIsIndexOpen(false);
                                }}
                                className="flex flex-col gap-3 p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/40 hover:bg-primary/[0.03] transition-all group overflow-hidden relative text-right"
                            >
                                <div className="absolute top-0 right-0 px-3 py-1 bg-white/5 text-[9px] font-bold text-white/10 rounded-bl-xl group-hover:text-primary transition-colors">#{s.id}</div>
                                <span className="font-arabic text-xl md:text-2xl font-bold group-hover:text-white transition-colors mt-2">{s.name}</span>
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5 group-hover:border-primary/10">
                                    <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-primary transition-all group-hover:translate-x-[4px]" />
                                    <span className="text-[10px] font-bold text-white/20 font-mono">P. {SURAH_START_PAGES[s.id] || "?"}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}
      <footer className="h-16 shrink-0 bg-black/60 border-t border-white/5 px-8 flex items-center justify-center z-50">
          <input type="range" min="1" max="604" value={currentPage} onChange={(e) => setCurrentPage(parseInt(e.target.value))} className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary max-w-2xl" />
      </footer>
      <style jsx global>{` .font-arabic { font-family: 'Amiri', serif; word-spacing: 0.12em; } input[type='range']::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; background: #D4AF37; border-radius: 50%; cursor: pointer; } `}</style>
    </div>
  );
}
