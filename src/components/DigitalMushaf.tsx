"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Loader2, Play, Search, List, User, X, 
  ChevronRight, ChevronLeft, Book, Star, 
  Download, BookOpen, Settings, Volume2,
  Maximize2, Menu
} from "lucide-react";
import surahsData from "@/data/surahs.json";
import { RECITERS } from "@/data/reciters";
import { useEditor } from "@/store/useEditor";
import { getAudioUrl } from "@/lib/quranUtils";
import { logAppEvent } from "@/lib/firebase";
import { setupMediaSession, setPlaybackState } from "@/lib/mediaSession";
import { startPageTimer, endPageTimer } from "@/lib/points";
import { VerseDetailsModal } from "./VerseDetailsModal";

const API_ROOT = "https://api.quran.com/api/v4";

const SURAH_START_PAGES: Record<number, number> = {
  1:1, 2:2, 3:50, 4:77, 5:106, 6:128, 7:151, 8:177, 9:187, 10:208, 11:221, 12:235, 13:249, 14:255, 15:262, 16:267, 17:282, 18:293, 19:305, 20:312, 
  21:322, 22:332, 23:342, 24:350, 25:359, 26:367, 27:377, 28:385, 29:396, 30:404, 31:411, 32:415, 33:418, 34:428, 35:434, 36:440, 37:446, 38:453, 39:458, 40:467, 
  41:477, 42:483, 43:489, 44:496, 45:499, 46:502, 47:507, 48:511, 49:515, 50:518, 51:520, 52:523, 53:526, 54:528, 55:531, 56:534, 57:537, 58:542, 59:545, 60:549, 
  61:551, 62:553, 63:554, 64:556, 65:558, 66:560, 67:562, 68:564, 69:566, 70:568, 71:570, 72:572, 73:574, 74:575, 75:577, 76:578, 77:580, 78:582, 79:583, 80:585, 
  81:586, 82:587, 83:587, 84:589, 85:590, 86:591, 87:591, 88:592, 89:593, 90:594, 91:595, 92:595, 93:596, 94:596, 95:597, 96:597, 97:598, 98:598, 99:599, 100:599, 
  101:600, 102:600, 103:601, 104:601, 105:601, 106:602, 107:602, 108:602, 109:603, 110:603, 111:603, 112:604, 113:604, 114:604
};

export function DigitalMushaf({ isTafseerMode = false }: { isTafseerMode?: boolean }) {
  const { state, updateState } = useEditor();
  const [pages, setPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingPage, setIsPlayingPage] = useState(false);
  const [currentPlayingVerse, setCurrentPlayingVerse] = useState<{pageIndex: number, verseIndex: number} | null>(null);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVerseForDetail, setSelectedVerseForDetail] = useState<{verseKey: string, surahName: string} | null>(null);
  
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

  useEffect(() => {
    const pointsObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageId = entry.target.getAttribute("data-page");
            if (pageId) {
              const pointsToAward = isPlayingPage ? 6 : 3;
              endPageTimer(pointsToAward).then(res => {
                if (res.success) console.log(`Earned ${pointsToAward} points for a page`);
              });
              startPageTimer(pageId);
            }
          }
        });
      },
      { threshold: 0.7 }
    );
    const pageElements = document.querySelectorAll("[data-page]");
    pageElements.forEach(el => pointsObserver.observe(el));
    return () => pointsObserver.disconnect();
  }, [pages, isPlayingPage]);

  const playVerse = (pIdx: number, vIdx: number) => {
    const verse = pages[pIdx]?.verses[vIdx];
    if (!verse) return;
    if (isTafseerMode) {
        const [sId] = verse.verse_key.split(':');
        const sName = surahsData.find(s => s.id === parseInt(sId))?.name || "";
        setSelectedVerseForDetail({ verseKey: verse.verse_key, surahName: sName });
        return;
    }
    setCurrentPlayingVerse({ pageIndex: pIdx, verseIndex: vIdx });
    if (audioRef.current) {
        const [sura, ayah] = verse.verse_key.split(':');
        const audioUrl = getAudioUrl(parseInt(sura), parseInt(ayah), state.reciterId, verse.id);
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(err => {
            console.error("Playback failed", err);
        });
        const surahName = surahsData.find(s => s.id === parseInt(sura))?.name || "";
        setupMediaSession(
            { title: `سورة ${surahName} - آية ${ayah}`, artist: RECITERS.find(r => r.id === state.reciterId)?.name || "قارئ", album: 'المصحف المرتل' },
            { 
              onPlay: () => { audioRef.current?.play(); setIsPlayingPage(true); },
              onPause: () => { audioRef.current?.pause(); setIsPlayingPage(false); },
              onNext: () => { if (vIdx + 1 < pages[pIdx].verses.length) playVerse(pIdx, vIdx + 1); else if (pIdx + 1 < pages.length) playVerse(pIdx + 1, 0); },
              onPrev: () => { if (vIdx > 0) playVerse(pIdx, vIdx - 1); else if (pIdx > 0) playVerse(pIdx - 1, pages[pIdx-1].verses.length - 1); },
            }
        );
        setPlaybackState('playing');
        logAppEvent("play_verse", { surah: sura, verse: ayah, reciter: state.reciterId });
    }
  };

  const handleAudioEnd = () => {
    if (isPlayingPage && currentPlayingVerse) {
        const { pageIndex, verseIndex } = currentPlayingVerse;
        if (verseIndex + 1 < pages[pageIndex].verses.length) playVerse(pageIndex, verseIndex + 1);
        else if (pageIndex + 1 < pages.length) playVerse(pageIndex + 1, 0);
    }
  };

  const filteredSurahs = surahsData.filter(s => s.name.includes(searchQuery) || s.transliteration.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={`h-full w-full flex flex-col bg-[#0a0f0d] text-white font-['Tajawal'] relative overflow-hidden`}>
      
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
          <div className="absolute inset-0 islamic-pattern" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0d] via-transparent to-[#0a0f0d]" />
      </div>
      
      <audio ref={audioRef} onEnded={handleAudioEnd} onError={handleAudioEnd} />

      {/* Premium Header */}
      <header className="h-24 md:h-28 shrink-0 border-b border-white/5 bg-[#0d1411]/80 backdrop-blur-3xl px-6 md:px-12 flex items-center justify-between z-[100] shadow-2xl">
          <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsIndexOpen(true)}
                className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-primary transition-all active:scale-90 border border-white/5"
              >
                  <Menu className="w-7 h-7" />
              </button>
              <div className="hidden md:flex flex-col text-right">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">الفهرس الشامل</span>
                  <span className="text-sm font-bold text-white">البحث في السور</span>
              </div>
          </div>

          <div className="flex flex-col items-center">
              <h1 className="font-['Amiri'] text-3xl md:text-5xl font-black text-white drop-shadow-2xl">
                {isTafseerMode ? 'مصحف التفسير' : 'المصحف الشريف'}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                  <div className="h-[1px] w-8 bg-primary/40" />
                  <Star className="w-2 h-2 text-primary fill-primary" />

                  <Star className="w-2 h-2 text-primary fill-primary" />
                  <div className="h-[1px] w-8 bg-primary/40" />
              </div>
          </div>

          <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowReciterPicker(!showReciterPicker)}
                className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/5 relative"
              >
                  <User className="w-6 h-6" />
                  {showReciterPicker && <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]" />}
              </button>
              <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">القارئ الحالي</span>
                  <span className="text-xs font-bold text-primary">{RECITERS.find(r => r.id === state.reciterId)?.name}</span>
              </div>
          </div>
      </header>

      {/* Reciter Picker Popover */}
      {showReciterPicker && (
          <div className="absolute top-28 right-6 md:right-12 w-80 bg-[#0d1411]/95 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_30px_90px_rgba(0,0,0,0.5)] z-[200] p-6 animate-in zoom-in-95 duration-300">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] text-center mb-6">اختر قارئ المصحف</p>
              <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto no-scrollbar">
                  {RECITERS.map(reciter => (
                      <button 
                        key={reciter.id} 
                        onClick={() => { updateState({ reciterId: reciter.id }); setShowReciterPicker(false); }}
                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${state.reciterId === reciter.id ? 'bg-primary text-black' : 'hover:bg-white/5 text-white/60'}`}
                      >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${state.reciterId === reciter.id ? 'bg-black/10' : 'bg-white/5'}`}>
                              <User className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-sm text-right flex-1">{reciter.name}</span>
                      </button>
                  ))}
              </div>
          </div>
      )}

      {/* Side Surah Index */}
      {isIndexOpen && (
          <div className="absolute inset-0 z-[2000] flex animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-[#064E3B]/60 backdrop-blur-md" onClick={() => setIsIndexOpen(false)} />
              <div className="relative w-full max-w-lg bg-[#064E3B] border-l border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col p-10 animate-in slide-in-from-left duration-500">
                  <div className="flex items-center justify-between mb-12">
                      <h3 className="text-3xl font-black text-white">فهرس السور</h3>
                      <button onClick={() => setIsIndexOpen(false)} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white hover:bg-primary hover:text-black transition-all">
                          <X className="w-6 h-6" />
                      </button>
                  </div>

                  <div className="relative mb-10 group">
                      <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-all w-5 h-5" />
                      <input 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن السورة..."
                        className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pr-16 pl-8 text-white text-lg outline-none focus:border-primary/50 transition-all text-right font-arabic"
                      />
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                      {filteredSurahs.map(s => (
                          <button 
                            key={s.id} 
                            onClick={() => { setPages([]); fetchPageBatch(SURAH_START_PAGES[s.id] || 1, true); setIsIndexOpen(false); }}
                            className="w-full p-6 rounded-[2.5rem] bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-primary/[0.08] transition-all group flex items-center justify-between text-right"
                          >
                              <div className="flex items-center gap-6">
                                  <div className="w-14 h-14 rounded-2xl bg-[#064E3B] border border-primary/20 flex items-center justify-center text-primary font-bold relative overflow-hidden">
                                      <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                                      {s.id}
                                  </div>
                                  <div>
                                      <h4 className="text-2xl font-black text-white group-hover:text-primary transition-colors">سورة {s.name}</h4>
                                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{s.transliteration}</p>
                                  </div>
                              </div>
                              <div className="text-left">
                                  <p className="text-sm font-black text-primary">{s.total_verses} آية</p>
                                  <p className="text-[10px] font-bold text-white/20">{s.revelation_type === 'Meccan' ? 'مكية' : 'مدنية'}</p>
                              </div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Main Mushaf Content */}
      <main className="flex-1 flex flex-col items-center overflow-y-auto no-scrollbar py-20 px-6">
          <div className="max-w-4xl w-full flex flex-col items-center gap-24">
              {pages.length > 0 ? (
                  pages.map((pData, pIdx) => (
                      <div key={`p-${pData.page}`} className="w-full relative animate-in zoom-in-95 duration-1000">
                          <MushafPage 
                              pData={pData}
                              pIdx={pIdx}
                              currentPlayingVerse={currentPlayingVerse}
                              playVerse={playVerse}
                              mushafFontSize={state.mushafFontSize}
                              onShowDetail={(verseKey: string, surahName: string) => setSelectedVerseForDetail({ verseKey, surahName })}
                          />
                      </div>
                  ))
              ) : (
                  <div className="flex flex-col items-center gap-8 py-40 text-center">
                      <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_40px_rgba(212,175,55,0.2)]" />
                      <p className="text-white/40 font-black text-lg tracking-[0.4em] uppercase">جاري صبغ الصفحات...</p>
                  </div>
              )}
              <div ref={observerTarget} className="h-40 w-full" />
          </div>
      </main>

      {/* Floating Action Bar */}
      <footer className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-[#064E3B]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] px-6 py-3 flex items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100]">
          <div className="flex items-center gap-2">
              <button 
                onClick={() => updateState({ mushafFontSize: Math.max(16, state.mushafFontSize - 2) })}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-black transition-all text-xs"
              >A-</button>
              <button 
                onClick={() => updateState({ mushafFontSize: Math.min(60, state.mushafFontSize + 2) })}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-black transition-all text-xs"
              >A+</button>
          </div>

          <div className="w-px h-8 bg-white/10" />

          <div className="flex items-center gap-4">
              <button 
                onClick={() => { const prevPage = (pages[0]?.page || 1) - 3; if (prevPage >= 1) { setPages([]); fetchPageBatch(prevPage, true); } }}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                  <ChevronRight className="w-5 h-5" />
              </button>
              <div className="text-center min-w-[100px]">
                  <p className="text-[10px] font-black text-primary font-arabic mb-0.5">
                    {(() => {
                      const vKey = pages[pages.length-1]?.verses[0]?.verse_key;
                      if (!vKey) return "سورة ...";
                      const sId = parseInt(vKey.split(':')[0]);
                      return `سورة ${surahsData.find(s => s.id === sId)?.name || ""}`;
                    })()}
                  </p>
                  <p className="text-xs font-bold text-white/40 leading-none">صفحة {pages[pages.length-1]?.page || ".."}</p>
              </div>
              <button 
                onClick={() => { const nextPage = (pages[pages.length-1]?.page || 1) + 1; if (nextPage <= 604) fetchPageBatch(nextPage); }}
                className="w-10 h-10 rounded-xl bg-primary text-black hover:scale-110 flex items-center justify-center transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              >
                  <ChevronLeft className="w-5 h-5" />
              </button>
          </div>

          <div className="w-px h-8 bg-white/10" />

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
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-xl ${isPlayingPage ? 'bg-red-500 text-white' : 'bg-primary text-black hover:scale-110'}`}
          >
              {isPlayingPage ? <X className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
          </button>
      </footer>

      {/* Tafsir Drawer */}
      {currentPlayingVerse && (
          <div className="fixed bottom-40 left-1/2 -translate-x-1/2 w-[90%] max-w-xl z-[90] animate-in slide-in-from-bottom-10 duration-700">
              <div className="bg-white/95 backdrop-blur-3xl border-4 border-primary rounded-[3rem] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.4)] relative group">
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-black px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                      تفسير ميسر
                  </div>
                  <p className="text-xl md:text-2xl text-[#064E3B] font-arabic font-bold text-center leading-relaxed">
                      {pages[currentPlayingVerse.pageIndex].verses[currentPlayingVerse.verseIndex].translations?.[0]?.text.replace(/<[^>]*>?/gm, '') || "جاري جلب التفسير..."}
                  </p>
                  <button 
                    onClick={() => {
                        const verse = pages[currentPlayingVerse.pageIndex].verses[currentPlayingVerse.verseIndex];
                        const [sId] = verse.verse_key.split(':');
                        setSelectedVerseForDetail({ verseKey: verse.verse_key, surahName: surahsData.find(s => s.id === parseInt(sId))?.name || "" });
                    }}
                    className="mt-6 w-full flex items-center justify-center gap-3 text-[#064E3B]/40 hover:text-primary transition-colors text-xs font-black uppercase tracking-[0.2em]"
                  >
                      عرض التفاصيل الكاملة
                      <ChevronLeft className="w-4 h-4" />
                  </button>
              </div>
          </div>
      )}

      {selectedVerseForDetail && (
          <VerseDetailsModal 
              verseKey={selectedVerseForDetail.verseKey}
              surahName={selectedVerseForDetail.surahName}
              onClose={() => setSelectedVerseForDetail(null)}
          />
      )}
    </div>
  );
}

const MushafPage = React.memo(({ pData, pIdx, currentPlayingVerse, playVerse, mushafFontSize, onShowDetail }: any) => {
    return (
        <div 
            data-page={pData.page}
            className="flex flex-col relative w-full min-h-[1100px] bg-[#FDFBF7] rounded-[1rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden"
        >
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20 mix-blend-multiply" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')" }} />
            
            {/* Ornate Borders */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 1200">
                    <defs>
                        <linearGradient id="mushafGold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#d4af37" />
                            <stop offset="50%" stopColor="#fdfcf0" />
                            <stop offset="100%" stopColor="#8a6d3b" />
                        </linearGradient>
                    </defs>
                    <rect x="30" y="30" width="740" height="1140" fill="none" stroke="url(#mushafGold)" strokeWidth="4" />
                    <rect x="45" y="45" width="710" height="1110" fill="none" stroke="url(#mushafGold)" strokeWidth="1" opacity="0.3" />
                    <path d="M 30,100 L 770,100 M 30,1100 L 770,1100 M 100,30 L 100,1170 M 700,30 L 700,1170" fill="none" stroke="url(#mushafGold)" strokeWidth="0.5" opacity="0.2" />
                </svg>
            </div>

            {/* Page Header */}
            <div className="relative h-24 flex items-center justify-between px-20 z-20 mt-8 pointer-events-none">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[#8b6d1b] font-black uppercase tracking-widest">الجُزْء</span>
                    <span className="text-black font-black text-2xl leading-none">{pData.verses[0]?.juz_number}</span>
                </div>
                
                <div className="flex flex-col items-center bg-[#FDFBF7] px-8 py-2 border-x border-[#d4af37]/20">
                    <span className="text-black font-bold text-3xl leading-none">{pData.page}</span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[#8b6d1b] font-black uppercase tracking-widest">الحِزْب</span>
                    <span className="text-black font-black text-2xl leading-none">{pData.verses[0]?.hizb_number}</span>
                </div>
            </div>

            {/* Quran Text Area */}
            <div className="relative z-10 w-full flex flex-col items-center px-[15%] pt-10 pb-24 flex-1">
                <div className="w-full text-justify [text-align-last:justify] leading-[3] md:leading-[3.6] text-black" style={{ textJustify: 'inter-word', wordSpacing: '0.3em' }}>
                    {pData.verses.map((verse: any, vIdx: number) => {
                        const [sId, vId] = verse.verse_key.split(':');
                        const isFirstVerse = vId === "1";
                        const surahName = surahsData.find(s => s.id === parseInt(sId))?.name;
                        const isPlaying = currentPlayingVerse?.pageIndex === pIdx && currentPlayingVerse?.verseIndex === vIdx;

                        return (
                            <React.Fragment key={verse.id}>
                                {isFirstVerse && (
                                    <div className="w-full flex flex-col items-center gap-4 my-10 animate-in fade-in duration-1000">
                                        <div className="relative w-full max-w-[400px] h-[100px] flex items-center justify-center">
                                            <svg className="absolute inset-0 w-full h-full text-[#d4af37]" viewBox="0 0 400 100" preserveAspectRatio="none">
                                                <path d="M0,50 L20,10 L380,10 L400,50 L380,90 L20,90 Z" fill="rgba(6, 78, 59, 0.05)" stroke="currentColor" strokeWidth="2" />
                                                <path d="M40,25 L360,25 M40,75 L360,75" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
                                            </svg>
                                            <h3 className="font-['Amiri'] text-4xl font-black text-primary">سُورَةُ {surahName}</h3>
                                        </div>
                                        {sId !== "1" && sId !== "9" && (
                                            <div className="font-['Amiri'] text-4xl py-6 font-bold text-primary opacity-90">
                                                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <span 
                                    onClick={() => playVerse(pIdx, vIdx)} 
                                    className={`inline transition-all duration-300 rounded-2xl cursor-pointer py-1 px-2 ${isPlaying ? 'bg-primary/20 text-primary shadow-[0_0_30px_rgba(212,175,55,0.3)] scale-105 z-50' : 'hover:bg-primary/5 text-black'}`}
                                >
                                    <span className="font-['Amiri'] inline font-bold antialiased" style={{ fontSize: `${mushafFontSize}px` }}>
                                        {verse.words?.filter((w: any) => w.char_type_name === 'word').map((word: any) => {
                                            const isAllah = word.text_uthmani?.includes('للَّ') || word.text_uthmani?.includes('اللَّ');
                                            return (
                                                <span key={word.id} className={`inline-block mx-[2px] ${isAllah ? 'text-[#cd4d4d]' : 'currentColor'}`}>
                                                    {word.text_uthmani}
                                                </span>
                                            );
                                        })}
                                        <span 
                                            onClick={(e) => { e.stopPropagation(); onShowDetail(verse.verse_key, surahName); }}
                                            className="inline-flex items-center justify-center mx-3 border-2 border-black/10 rounded-full hover:bg-primary/20 hover:border-primary transition-all cursor-help"
                                            style={{ width: `${mushafFontSize * 0.9}px`, height: `${mushafFontSize * 0.9}px`, verticalAlign: 'middle' }}
                                        >
                                            <span className="font-sans font-black text-black/60" style={{ fontSize: `${mushafFontSize * 0.45}px` }}>{vId}</span>
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
