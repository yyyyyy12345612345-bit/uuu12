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
    <div className="h-full w-full flex flex-col bg-[#FDFBF7] text-[#332a1d] font-arabic relative overflow-hidden">
      
      {/* Dynamic Thematic Background Layers */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
          <div className="absolute inset-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')" }} />
      </div>
      
      <audio ref={audioRef} onEnded={handleAudioEnd} onError={handleAudioEnd} />

      {/* --- Premium Header --- */}
      <header className="h-[75px] shrink-0 border-b border-[#e9e0d1] bg-[#f8f1e4]/95 backdrop-blur-xl px-4 md:px-10 flex items-center justify-between z-[100] shadow-sm">
        <div className="flex items-center gap-4">
             <button onClick={() => setIsIndexOpen(true)} className="flex items-center gap-3 px-6 py-2.5 bg-[#4a3f35] text-[#f8f1e4] rounded-2xl font-bold shadow-lg hover:bg-[#5c4f42] transition-all">
                <List className="w-5 h-5" />
                <span className="text-sm hidden sm:block">فهرس السور</span>
             </button>
             <button onClick={() => setShowReciterPicker(!showReciterPicker)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#4a3f35]/60 hover:text-[#4a3f35] border border-[#e9e0d1] transition-all relative">
                <User className="w-6 h-6" />
                {showReciterPicker && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white" />}
             </button>
        </div>

        <div className="flex flex-col items-center">
            <h2 className="text-xl font-black text-[#4a3f35] tracking-tight">المصحف المرتل</h2>
            <div className="flex items-center gap-2 mt-1">
                <Star className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-[#4a3f35]/40 font-bold uppercase tracking-widest">Premium Library</span>
                <Star className="w-3 h-3 text-primary" />
            </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end mr-4">
                <span className="text-[10px] text-[#4a3f35]/30 font-bold uppercase">القارئ الحالي</span>
                <span className="text-sm font-bold text-[#4a3f35]">{RECITERS.find(r => r.id === state.reciterId)?.name}</span>
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
                className={`flex items-center gap-3 px-8 py-3 rounded-2xl transition-all shadow-xl font-bold ${isPlayingPage ? 'bg-primary text-black' : 'bg-white border-2 border-primary/20 text-[#4a3f35] hover:border-primary'}`}
            >
                {isPlayingPage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span className="text-sm">{isPlayingPage ? 'استماع جاري' : 'بدء الترتيل'}</span>
            </button>
        </div>

        {showReciterPicker && (
            <div className="absolute top-[85px] left-4 md:left-10 w-80 bg-white border border-[#e9e0d1] rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] z-[200] p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-300">
                <div className="p-3 border-b border-[#f8f1e4] mb-2 text-center text-[#4a3f35]/40 font-bold text-[10px] uppercase tracking-[0.3em]">اختر صوت القارئ</div>
                {RECITERS.map(reciter => (
                    <button key={reciter.id} onClick={() => { updateState({ reciterId: reciter.id }); setShowReciterPicker(false); }} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${state.reciterId === reciter.id ? 'bg-primary/10 border border-primary/30 text-[#4a3f35]' : 'hover:bg-[#f8f1e4]/50 text-[#4a3f35]/60'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${state.reciterId === reciter.id ? 'bg-primary text-black' : 'bg-[#f8f1e4]'}`}>
                            <User className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm text-right flex-1">{reciter.name}</span>
                    </button>
                ))}
            </div>
        )}
      </header>

      {/* --- Main Reading Area --- */}
      <main className="flex-1 relative flex flex-col items-center overflow-hidden">
        {/* Index Sidebar Overlay */}
        {isIndexOpen && (
          <div className="absolute inset-0 z-[150] bg-[#f8f1e4]/60 backdrop-blur-md flex justify-end animate-in fade-in duration-300">
             <div className="w-full md:w-[400px] h-full bg-white shadow-[-10px_0_50px_rgba(74,63,53,0.12)] flex flex-col p-6 md:p-10 animate-in slide-in-from-left-full duration-500">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setIsIndexOpen(false)} className="w-10 h-10 bg-[#f8f1e4] rounded-full flex items-center justify-center text-[#4a3f35] hover:bg-primary transition-all">
                        <X className="w-5 h-5" />
                    </button>
                    <h3 className="text-xl font-bold text-[#4a3f35]">فهرس السور</h3>
                </div>
                
                <div className="relative group mb-5">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a3f35]/20 group-focus-within:text-primary transition-colors w-3.5 h-3.5" />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="ابحث عن اسم السورة..." className="w-full bg-[#f8f1e4]/50 border-2 border-[#f8f1e4] focus:border-primary/30 rounded-xl py-2.5 pr-10 pl-5 text-sm outline-none transition-all text-[#4a3f35] text-right font-bold" />
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-20">
                    {filteredSurahs.map((s) => (
                        <button key={s.id} onClick={() => { setPages([]); fetchPageBatch(SURAH_START_PAGES[s.id] || 1, true); setIsIndexOpen(false); }} className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-[#f8f1e4]/30 hover:bg-primary hover:text-black hover:scale-[1.02] transition-all group">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-sm font-bold shadow-sm group-hover:bg-black/10">{s.id}</div>
                                <span className="text-xl font-bold">سورة {s.name}</span>
                            </div>
                            <span className="text-[11px] font-black opacity-30 group-hover:opacity-60">{s.total_verses} آية</span>
                        </button>
                    ))}
                </div>
             </div>
          </div>
        )}

        {/* The Mushaf Page Centered */}
        <div className="flex-1 w-full overflow-y-auto no-scrollbar scroll-smooth bg-[#f1e9db] py-10 flex flex-col items-center">
            <div className="max-w-[1200px] w-full flex flex-col items-center px-4">
                {pages.length > 0 ? (
                    pages.map((pData, pIdx) => (
                        <div key={`p-${pData.page}`} className="mb-20 w-full max-w-[850px] relative transition-all duration-1000">
                             {/* Page Shadow & Depth Decorations */}
                             <div className="absolute -inset-4 bg-[#7a6d5d]/10 blur-[40px] rounded-[3rem] -z-10" />
                             <div className="absolute top-0 right-0 bottom-0 w-2 bg-black/[0.04] -mr-2 rounded-r-full blur-sm" />
                             <div className="absolute top-0 left-0 bottom-0 w-2 bg-black/[0.04] -ml-2 rounded-l-full blur-sm" />

                             <MushafPage 
                                pData={pData}
                                pIdx={pIdx}
                                currentPlayingVerse={currentPlayingVerse}
                                playVerse={playVerse}
                            />
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center gap-6 py-40">
                         <Loader2 className="w-12 h-12 text-primary animate-spin" />
                         <span className="text-sm font-bold text-[#4a3f35]/40 tracking-widest uppercase">جاري صبغ الصفحات...</span>
                    </div>
                )}
                <div ref={observerTarget} className="h-60 w-full flex items-center justify-center">
                    {isLoading && <Loader2 className="w-8 h-8 text-primary animate-spin" />}
                </div>
            </div>
        </div>

      </main>

      {/* --- Organized Bottom Navigation Bar --- */}
      <footer className="h-[90px] shrink-0 bg-white border-t border-[#e9e0d1] px-6 md:px-14 flex items-center justify-between z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-8">
              <div className="flex flex-col">
                  <span className="text-[10px] text-[#4a3f35]/30 font-bold uppercase tracking-widest">موقعك الحالي</span>
                  <div className="flex items-center gap-2">
                      <Book className="w-4 h-4 text-primary" />
                      <span className="text-sm font-bold text-[#4a3f35]">الصفحة {pages[pages.length-1]?.page || ".."}</span>
                  </div>
              </div>
              <div className="h-8 w-px bg-[#e9e0d1]" />
              <div className="flex items-center gap-4 text-[#4a3f35]/60">
                  <button className="p-3 hover:bg-[#f8f1e4] rounded-xl transition-all"><Settings className="w-5 h-5" /></button>
                  <button className="p-3 hover:bg-[#f8f1e4] rounded-xl transition-all"><Star className="w-5 h-5" /></button>
              </div>
          </div>

          <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                     const el = document.querySelector(`[data-page="${(pages[0]?.page || 1) + 1}"]`);
                     el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-14 h-14 rounded-2xl border-2 border-[#e9e0d1] flex items-center justify-center hover:bg-primary hover:border-primary transition-all group"
              >
                  <ChevronLeft className="w-6 h-6 group-hover:text-black" />
              </button>
              <button 
                onClick={() => {
                     const el = document.querySelector(`[data-page="${(pages[0]?.page || 1) - 1}"]`);
                     el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-14 h-14 rounded-2xl border-2 border-[#e9e0d1] flex items-center justify-center hover:bg-primary hover:border-primary transition-all group"
              >
                  <ChevronRight className="w-6 h-6 group-hover:text-black" />
              </button>
          </div>
      </footer>
    </div>
  );
}

// Re-built Premium Mushaf Page Component
const MushafPage = React.memo(({ pData, pIdx, currentPlayingVerse, playVerse }: any) => {
    return (
        <div 
            data-page={pData.page}
            className="flex flex-col relative w-full min-h-[85vh] bg-[#FAF8F5] md:rounded-[1.5rem] shadow-[0_30px_70px_rgba(74,63,53,0.12)] border border-[#e9e0d1] transition-all"
        >
            {/* Page Grain & Texture Overlay */}
            <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/handmade-paper.png')" }} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/[0.02] via-transparent to-black/[0.02] pointer-events-none" />

            {/* Header / Surah Name Decoration */}
            <div className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-10 text-[10px] font-bold text-[#4a3f35]/30 tracking-[0.3em] z-10">
                <span>الجزء {Math.ceil(pData.page / 20)}</span>
                <span className="scale-x-[-1]">﴿ {pData.page} ﴾</span>
                <span>الحزب {Math.ceil(pData.page / 10)}</span>
            </div>

            {/* --- Main Verses Layout --- */}
            <div className="relative z-10 h-full w-full flex flex-col justify-center items-center px-[8%] md:px-[12%] pt-14 pb-14">
                <div 
                    className="w-full text-justify [text-align-last:justify] leading-[2.6] md:leading-[3.2] text-[#2a231b]" 
                    style={{ 
                        textJustify: 'inter-word',
                        wordSpacing: '0.2em'
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
                                    <div className="w-full flex flex-col items-center gap-4 my-6 animate-in fade-in zoom-in duration-1000">
                                        {/* Surah Decorative Box */}
                                        <div className="relative w-full max-w-[400px] h-[70px] flex items-center justify-center">
                                             <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[#a89078] to-transparent" />
                                             <div className="bg-[#FAF8F5] px-10 py-3 border-2 border-[#a89078]/20 rounded-full shadow-sm z-10 relative">
                                                <span className="font-arabic text-2xl md:text-3xl font-black text-[#5c4f42]">سورة {surahName}</span>
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                                                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary rounded-full" />
                                             </div>
                                        </div>
                                        
                                        {/* Basmalah */}
                                        {sId !== "1" && sId !== "9" && (
                                            <div className="font-arabic text-2xl md:text-3xl text-[#4a3f35]/90 py-4 drop-shadow-sm">
                                                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <span 
                                    onClick={() => playVerse(pIdx, vIdx)} 
                                    className={`inline transition-all duration-300 rounded-2xl cursor-pointer py-1 px-1 ${isPlaying ? 'bg-primary/10 text-[#8b0000] shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'hover:bg-black/5'}`}
                                >
                                    <span className={`${scheherazade.className} inline text-2xl md:text-3xl font-medium tracking-normal antialiased`}>
                                        {verse.words?.filter((w: any) => w.char_type_name === 'word').map((word: any) => {
                                            const isAllah = word.text_uthmani?.includes('للَّ') || word.text_uthmani?.includes('اللَّ');
                                            return (
                                                <span 
                                                    key={word.id} 
                                                    className={`inline-block px-[1.5px] md:px-[2.5px] transition-colors ${isAllah ? 'text-[#cd4d4d]' : 'text-[#2a231b]'}`}
                                                >
                                                    {word.text_uthmani}
                                                </span>
                                            );
                                        })}
                                        
                                        {/* Premium Octagonal Ayah Symbol */}
                                        <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 relative top-[-4px] md:top-[-6px] mx-1 md:mx-2 select-none">
                                            <svg className="absolute inset-0 w-full h-full text-[#a89078]/40" viewBox="0 0 100 100" fill="none">
                                                <path d="M50 5 L85 20 L100 50 L85 80 L50 95 L15 80 L0 50 L15 20 Z" stroke="currentColor" strokeWidth="4" />
                                                <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                            </svg>
                                            <span className="relative z-10 text-[9px] md:text-[11px] font-bold font-serif text-[#a89078]">{vId}</span>
                                        </span>
                                    </span>
                                </span>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
            
            {/* Page Bottom Frame Border */}
            <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#e9e0d1] to-transparent" />
        </div>
    );
});
MushafPage.displayName = "MushafPage";
