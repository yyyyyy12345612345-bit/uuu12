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
          `${API_ROOT}/verses/by_page/${currentPage}?language=ar&words=true&word_fields=text_uthmani,audio_url,char_type_name&fields=text_uthmani,verse_key,juz_number,hizb_number`
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
    if (!word || !word.audio_url) {
        console.warn("No audio URL found for this word.");
        return;
    }
    
    setActiveWordId(word.id);
    
    // Clean and verify URL (Using audio.qurancdn.com as the official WBW base)
    const baseWordUrl = "https://audio.qurancdn.com/";
    let audioUrl = word.audio_url;

    if (!audioUrl.startsWith('http')) {
        if (audioUrl.startsWith('//')) {
            audioUrl = `https:${audioUrl}`;
        } else if (audioUrl.startsWith('/')) {
            audioUrl = `${baseWordUrl}${audioUrl.substring(1)}`;
        } else {
            audioUrl = `${baseWordUrl}${audioUrl}`;
        }
    }

    const audio = new Audio(audioUrl);
    audio.play().catch((err) => {
        console.error("Word audio playback failed, trying fallback...", err);
        // Fallback to verses.quran.com if needed
        const fallbackUrl = audioUrl.replace('audio.qurancdn.com', 'verses.quran.com');
        new Audio(fallbackUrl).play().catch(console.error);
    });

    if (navigator.vibrate) navigator.vibrate(20);
    
    audio.onended = () => setActiveWordId(null);
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
                <div className="flex flex-col bg-white/[0.01] border border-white/5 p-6 md:p-12 rounded-[2.5rem] shadow-2xl relative">
                    <div className="w-full text-right leading-[2.6] md:leading-[3.6]">
                        {pageData?.map((verse: any, idx: number) => {
                            if (!verse) return null;
                            const [sId, vId] = verse.verse_key.split(':');
                            const isFirstVerse = vId === "1";
                            const surahName = surahsData.find(s => s.id === parseInt(sId))?.name;
                            
                            return (
                                <React.Fragment key={verse.id}>
                                    {isFirstVerse && (
                                        <div className="block w-full text-center my-10 animate-in fade-in duration-700">
                                            <div className="inline-block px-12 md:px-20 py-4 md:py-6 border border-primary/20 bg-primary/5 rounded-[2rem] mb-8">
                                                <h3 className="text-2xl md:text-4xl font-bold font-arabic text-primary">سورة {surahName}</h3>
                                            </div>
                                            {sId !== "1" && sId !== "9" && (
                                                <div className="text-2xl md:text-[2.8rem] font-arabic text-white/40 mb-8 opacity-60">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
                                            )}
                                        </div>
                                    )}
                                    <span 
                                        id={`digital-verse-${verse.id}`}
                                        onClick={() => playVerse(idx)}
                                        className={`inline transition-all duration-700 rounded-xl cursor-pointer ${currentPlayingVerse === idx ? 'bg-primary/10 text-white' : 'text-white/80 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <span className="inline text-[1.9rem] md:text-[3rem] font-arabic">
                                            {verse.words?.filter((w: any) => w.char_type_name === 'word').map((word: any) => (
                                                <span 
                                                    key={word.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevents verse audio from playing
                                                        playWord(word);
                                                    }}
                                                    className={`inline-block px-0.5 md:px-1 rounded-lg transition-all duration-200 ${activeWordId === word.id ? 'text-primary scale-110' : 'hover:text-primary'}`}
                                                >
                                                    {word.text_uthmani}
                                                </span>
                                            ))}
                                            <span className="inline-flex items-center justify-center w-10 h-10 md:w-[50px] md:h-[50px] relative top-[-4px] md:top-[-8px] mx-2 md:mx-4 group/ayah">
                                                <svg className="absolute inset-0 w-full h-full text-white/10 group-hover/ayah:text-primary/20 transition-colors" viewBox="0 0 100 100">
                                                    <path fill="currentColor" d="M50 0 L100 50 L50 100 L0 50 Z" />
                                                    <path fill="none" stroke="currentColor" strokeWidth="2" d="M50 10 L90 50 L50 90 L10 50 Z" />
                                                </svg>
                                                <span className="relative z-10 text-[9px] md:text-[11px] font-bold font-mono text-white/30 tracking-tighter">{vId}</span>
                                            </span>
                                        </span>
                                    </span>
                                </React.Fragment>
                            );
                        })}
                    </div>
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
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-12 pb-10">
                    <div className="flex flex-col gap-3 max-w-4xl mx-auto">
                        {filteredSurahs.map((s) => (
                            <button 
                                key={s.id}
                                onClick={() => {
                                    const startPage = SURAH_START_PAGES[s.id] || 1;
                                    setCurrentPage(startPage);
                                    setIsIndexOpen(false);
                                }}
                                className="w-full flex items-center gap-6 p-5 md:p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-primary/40 hover:bg-primary/[0.03] transition-all group relative overflow-hidden text-right shadow-sm"
                            >
                                <div className="w-14 h-14 shrink-0 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-lg font-black font-mono text-white/20 group-hover:text-primary transition-colors">
                                    {s.id}
                                </div>
                                
                                <div className="flex-1 flex flex-col items-start text-right">
                                    <span className="font-arabic text-2xl md:text-3xl font-bold group-hover:text-white transition-colors">{s.name}</span>
                                    <div className="flex items-center gap-3 mt-1 opacity-40">
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{s.revelation_place === 'makkah' ? 'مكية' : 'مدنية'}</span>
                                        <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{s.total_verses} آية</span>
                                    </div>
                                </div>

                                <div className="hidden md:flex flex-col items-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[10px] font-bold font-mono">PAGE</span>
                                    <span className="text-xl font-black font-mono text-primary">{SURAH_START_PAGES[s.id] || "?"}</span>
                                </div>

                                <div className="w-10 h-10 shrink-0 rounded-full border border-white/5 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
                                    <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-primary transition-all group-hover:translate-x-[2px]" />
                                </div>

                                {/* Decorative Background Accent */}
                                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
