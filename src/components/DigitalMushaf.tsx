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
  const [showTafseerDrawer, setShowTafseerDrawer] = useState(true);

  useEffect(() => {
    if (currentPlayingVerse) {
      setShowTafseerDrawer(true);
    }
  }, [currentPlayingVerse]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const observerTarget = useRef(null);
  const loadingRef = useRef(false);

  async function fetchPageBatch(startPage: number, clear = false) {
    if (loadingRef.current || startPage > 604) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
        const batchSize = 3;
        const newPagesData: { page: number; verses: unknown[] }[] = [];
        const quranComIds: Record<string, number> = {
            'basit': 1, 'basit_m': 2, 'sds': 3, 'shur': 4, 'husr': 5, 'afasy': 7, 
            'abkr': 8, 'shatree': 9, 'minsh': 10, 'jbr': 11, 'yasser': 12, 'maher': 12,
            'ajm': 54, 's_gmd': 55, 'qtm': 56, 'lhdan': 61, 'ayyub': 113, 'jleel': 41, 'hazza': 128
        };
        const recitationId = quranComIds[state.reciterId] || 7;

        for (let i = 0; i < batchSize; i++) {
            const pageNum = startPage + i;
            if (pageNum > 604) break;
            const response = await fetch(`${API_ROOT}/verses/by_page/${pageNum}?language=ar&words=true&word_fields=text_uthmani,char_type_name&fields=text_uthmani,verse_key,text_uthmani_tajweed&audio=${recitationId}`);
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
            setCurrentPage(startPage);
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
    const params = new URLSearchParams(window.location.search);
    const sId = params.get('surahId');
    const pId = params.get('page');
    
    let initialPage = 1;
    if (pId) {
      initialPage = parseInt(pId);
    } else if (sId) {
      initialPage = SURAH_START_PAGES[parseInt(sId)] || 1;
    } else {
      const savedPage = localStorage.getItem("last_read_page");
      initialPage = savedPage ? parseInt(savedPage) : 1;
    }
    fetchPageBatch(initialPage, true);

    // Cleanup: pause audio on unmount to avoid "play() interrupted" errors
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Update URL when page changes to support sharing/deep-linking
  useEffect(() => {
    if (currentPage > 0) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', currentPage.toString());
        url.searchParams.delete('surahId'); // Prioritize page for accuracy
        window.history.replaceState(null, '', url.toString());
    }
  }, [currentPage]);

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

    const isSameVerse = currentPlayingVerse?.pageIndex === pIdx && currentPlayingVerse?.verseIndex === vIdx;
    if (isSameVerse && isPlayingPage) {
        setIsPlayingPage(false);
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setPlaybackState('paused');
        return;
    }

    setCurrentPlayingVerse({ pageIndex: pIdx, verseIndex: vIdx });
    setIsPlayingPage(true);
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
    <div className={`h-full w-full flex flex-col bg-[#edf2ef] text-[#234d40] font-['Tajawal'] relative overflow-hidden`}>
      
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]">
          <div className="absolute inset-0 islamic-pattern" />
      </div>
      
      <audio ref={audioRef} onEnded={handleAudioEnd} onError={handleAudioEnd} />

      {/* Premium Header */}
      <header className="h-14 md:h-16 shrink-0 bg-[#edf2ef] border-b border-[#bcdad0] px-4 md:px-8 flex items-center justify-between z-[100] shadow-sm">
          <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsIndexOpen(true)}
                className="w-9 h-9 rounded-xl bg-[#234d40]/10 hover:bg-[#234d40]/20 flex items-center justify-center text-[#234d40] transition-all active:scale-90 border border-[#234d40]/10"
              >
                  <Menu className="w-4 h-4" />
              </button>
          </div>

          <div className="flex flex-col items-center">
              <h1 className="font-['Amiri'] text-lg md:text-xl font-black text-[#234d40] drop-shadow-sm">
                {isTafseerMode ? 'مصحف التفسير' : 'المصحف الشريف'}
              </h1>
              <div className="flex items-center gap-2">
                  <div className="h-[1px] w-5 bg-[#234d40]/30" />
                  <Star className="w-1.5 h-1.5 text-[#234d40] fill-[#234d40]" />
                  <div className="h-[1px] w-5 bg-[#234d40]/30" />
              </div>
          </div>

          <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowReciterPicker(!showReciterPicker)}
                className="w-9 h-9 rounded-xl bg-[#234d40]/10 hover:bg-[#234d40]/20 flex items-center justify-center text-[#234d40] transition-all border border-[#234d40]/10 relative"
              >
                  <User className="w-4 h-4" />
                  {showReciterPicker && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#d4af37] rounded-full" />}
              </button>
          </div>
      </header>

      {/* Reciter Picker Popover */}
      {showReciterPicker && (
          <div className="absolute top-28 right-6 md:right-12 w-80 bg-white dark:bg-[#0c0d10] backdrop-blur-3xl border border-black/10 dark:border-white/10 rounded-[3rem] shadow-[0_30px_90px_rgba(0,0,0,0.3)] z-[200] p-6 animate-in zoom-in-95 duration-300">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] text-center mb-6">اختر قارئ المصحف</p>
              <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto no-scrollbar">
                  {RECITERS.map(reciter => (
                      <button 
                        key={reciter.id} 
                        onClick={() => { updateState({ reciterId: reciter.id }); setShowReciterPicker(false); }}
                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${state.reciterId === reciter.id ? 'bg-primary text-black' : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-white/60'}`}
                      >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${state.reciterId === reciter.id ? 'bg-black/10' : 'bg-black/5 dark:bg-white/5'}`}>
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
              <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setIsIndexOpen(false)} />
              <div className="relative w-full max-w-sm bg-white dark:bg-[#0c0d10] border-l border-black/10 dark:border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.3)] flex flex-col p-4 md:p-6 animate-in slide-in-from-left duration-500 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white">فهرس السور</h3>
                      <button onClick={() => setIsIndexOpen(false)} className="w-8 h-8 bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center text-gray-600 dark:text-white hover:bg-primary hover:text-black transition-all">
                          <X className="w-4 h-4" />
                      </button>
                  </div>

                  <div className="relative mb-4 group">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/20 group-focus-within:text-primary transition-all w-4 h-4" />
                      <input 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن السورة..."
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl py-3 pr-12 pl-6 text-gray-900 dark:text-white text-sm outline-none focus:border-primary/50 transition-all text-right font-arabic placeholder:text-gray-400 dark:placeholder:text-white/30"
                      />
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                      {filteredSurahs.map(s => (
                          <button 
                            key={s.id} 
                            onClick={() => { setPages([]); fetchPageBatch(SURAH_START_PAGES[s.id] || 1, true); setIsIndexOpen(false); }}
                            className="w-full p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-primary/30 hover:bg-primary/[0.08] transition-all group flex items-center justify-between text-right"
                          >
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#0c0d10] border border-primary/20 flex items-center justify-center text-primary text-xs font-bold relative overflow-hidden">
                                      <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                                      {s.id}
                                  </div>
                                  <div>
                                      <h4 className="text-sm font-black text-gray-900 dark:text-white group-hover:text-primary transition-colors">سورة {s.name}</h4>
                                  </div>
                              </div>
                              <div className="text-left">
                                  <p className="text-xs font-black text-primary">{s.total_verses} آية</p>
                                  <p className="text-[9px] font-bold text-gray-400 dark:text-white/20">{s.type === 'meccan' ? 'مكية' : 'مدنية'}</p>
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
      <footer className="force-dark fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#0c0d10]/90 backdrop-blur-3xl border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-[100]">
          <div className="flex items-center gap-1.5">
              <button 
                onClick={() => updateState({ mushafFontSize: Math.max(16, state.mushafFontSize - 2) })}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-black transition-all text-[10px]"
              >A-</button>
              <button 
                onClick={() => updateState({ mushafFontSize: Math.min(60, state.mushafFontSize + 2) })}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center font-black transition-all text-[10px]"
              >A+</button>
          </div>

          <div className="w-px h-6 bg-white/10" />

          <div className="flex items-center gap-2">
              <button 
                disabled={isLoading}
                onClick={() => { 
                    const p = pages[0]?.page || currentPage;
                    const target = Math.max(1, p - 1);
                    if (target !== p) {
                        setPages([]);
                        fetchPageBatch(target, true);
                    }
                }}
                className={`w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <div className="text-center min-w-[72px]">
                  <p className="text-[9px] font-black text-primary font-arabic leading-none">
                    {(() => {
                      const vKey = pages[0]?.verses[0]?.verse_key || pages[pages.length-1]?.verses[0]?.verse_key;
                      if (!vKey) return "سورة ...";
                      const sId = parseInt(vKey.split(':')[0]);
                      return `سورة ${surahsData.find(s => s.id === sId)?.name || ""}`;
                    })()}
                  </p>
                  <p className="text-[9px] font-bold text-white/40 leading-none mt-0.5">ص {pages[0]?.page || currentPage || ".."}</p>
              </div>
              <button 
                disabled={isLoading}
                onClick={() => { 
                    const p = pages[0]?.page || currentPage;
                    const target = Math.min(604, p + 1);
                    if (target <= 604 && target !== p) {
                        setPages([]);
                        fetchPageBatch(target, true);
                    }
                }}
                className={`w-7 h-7 rounded-lg bg-primary text-black hover:scale-110 flex items-center justify-center transition-all shadow-[0_0_12px_rgba(212,175,55,0.3)] ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
          </div>

          <div className="w-px h-6 bg-white/10" />

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
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${isPlayingPage ? 'bg-red-500 text-white' : 'bg-primary text-black hover:scale-110'}`}
          >
              {isPlayingPage ? <X className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
      </footer>

      {/* Tafsir Drawer */}
      {currentPlayingVerse && showTafseerDrawer && (
          <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[88%] max-w-md z-[90] animate-in slide-in-from-bottom-10 duration-700">
              <div className="bg-[#fbfaf7] border border-[#234d40]/40 rounded-2xl p-4 shadow-[0_15px_45px_rgba(35,77,64,0.15)] relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#234d40] text-[#fbfaf7] px-4 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
                      تفسير ميسر
                  </div>
                  
                  <button
                    onClick={() => setShowTafseerDrawer(false)}
                    className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-[#234d40]/10 hover:bg-[#234d40]/20 flex items-center justify-center text-[#234d40] transition-all"
                    title="إغلاق التفسير"
                  >
                      <X className="w-3.5 h-3.5" />
                  </button>

                  <p className="text-xs md:text-sm text-zinc-800 font-arabic font-bold text-center leading-relaxed pt-2 px-4">
                      {pages[currentPlayingVerse.pageIndex].verses[currentPlayingVerse.verseIndex].translations?.[0]?.text.replace(/<[^>]*>?/gm, '') || "جاري جلب التفسير..."}
                  </p>
                  <button 
                    onClick={() => {
                        const verse = pages[currentPlayingVerse.pageIndex].verses[currentPlayingVerse.verseIndex];
                        const [sId] = verse.verse_key.split(':');
                        setSelectedVerseForDetail({ verseKey: verse.verse_key, surahName: surahsData.find(s => s.id === parseInt(sId))?.name || "" });
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-1 text-[#234d40]/70 hover:text-[#234d40] transition-colors text-[9px] font-black uppercase tracking-[0.1em]"
                  >
                      عرض التفاصيل الكاملة
                      <ChevronLeft className="w-2.5 h-2.5" />
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

function toArabicNumerals(numStr: string | number) {
  const arabicChars = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return numStr.toString().replace(/[0-9]/g, (w) => arabicChars[parseInt(w)]);
}

const SurahHeaderLine = ({ isLeft }: { isLeft: boolean }) => (
    <svg 
        width="120" 
        height="20" 
        viewBox="0 0 120 20" 
        fill="none" 
        className={`text-[#234d40] opacity-60 hidden md:block ${isLeft ? '' : 'scale-x-[-1]'}`}
    >
        {/* Horizontal line */}
        <line x1="0" y1="10" x2="45" y2="10" stroke="currentColor" strokeWidth="1" />
        {/* First dot */}
        <circle cx="51" cy="10" r="2" fill="currentColor" />
        {/* Line */}
        <line x1="57" y1="10" x2="67" y2="10" stroke="currentColor" strokeWidth="1" />
        {/* Center ornament (Circle with inner dot) */}
        <circle cx="76" cy="10" r="4.5" stroke="currentColor" strokeWidth="1" fill="none" />
        <circle cx="76" cy="10" r="1.5" fill="currentColor" />
        {/* Line */}
        <line x1="85" y1="10" x2="95" y2="10" stroke="currentColor" strokeWidth="1" />
        {/* Second dot */}
        <circle cx="101" cy="10" r="2" fill="currentColor" />
        {/* Right line */}
        <line x1="107" y1="10" x2="120" y2="10" stroke="currentColor" strokeWidth="1" />
    </svg>
);

const MushafPage = React.memo(({ pData, pIdx, currentPlayingVerse, playVerse, mushafFontSize, onShowDetail }: any) => {
    const firstVerse = pData.verses[0];
    const juzNumber = firstVerse?.juz_number || 1;
    const sId = firstVerse ? parseInt(firstVerse.verse_key.split(':')[0]) : 1;
    const surahInfo = surahsData.find(s => s.id === sId);
    const surahTranslit = surahInfo?.transliteration || "";
    const pageNum = pData.page;

    return (
        <div 
            data-page={pData.page}
            className="flex flex-col relative w-full min-h-[900px] md:min-h-[1100px] bg-[#fbfaf7] border border-[#bcdad0] rounded-[2rem] shadow-[0_20px_50px_rgba(35,77,64,0.12)] overflow-hidden"
        >
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.04] mix-blend-multiply bg-[radial-gradient(#c5d1cb_1px,transparent_1px)] [background-size:16px_16px]" />
            
            {/* Ornate Borders */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 1200">
                    <defs>
                        <linearGradient id="mushafBorderColor" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#234d40" />
                            <stop offset="100%" stopColor="#1e3f34" />
                        </linearGradient>
                    </defs>
                    
                    {/* Outer border (with rounded concave corners) */}
                    <path 
                      d="
                        M 50 20 
                        L 750 20 
                        A 30 30 0 0 0 780 50 
                        L 780 1150 
                        A 30 30 0 0 0 750 1180 
                        L 50 1180 
                        A 30 30 0 0 0 20 1150 
                        L 20 50 
                        A 30 30 0 0 0 50 20 
                        Z
                      " 
                      fill="none" 
                      stroke="url(#mushafBorderColor)" 
                      strokeWidth="2.5" 
                      opacity="0.9" 
                    />
                    
                    {/* Inner border (spaced 8px inside) */}
                    <path 
                      d="
                        M 54 28 
                        L 746 28 
                        A 26 26 0 0 0 772 54 
                        L 772 1146 
                        A 26 26 0 0 0 746 1172 
                        L 54 1172 
                        A 26 26 0 0 0 28 1146 
                        L 28 54 
                        A 26 26 0 0 0 54 28 
                        Z
                      " 
                      fill="none" 
                      stroke="url(#mushafBorderColor)" 
                      strokeWidth="0.8" 
                      opacity="0.6" 
                    />
                    
                    {/* Corner concentric circle ornaments */}
                    <circle cx="50" cy="50" r="3" fill="#234d40" />
                    <circle cx="50" cy="50" r="6" stroke="#234d40" strokeWidth="0.5" fill="none" />

                    <circle cx="750" cy="50" r="3" fill="#234d40" />
                    <circle cx="750" cy="50" r="6" stroke="#234d40" strokeWidth="0.5" fill="none" />

                    <circle cx="50" cy="1150" r="3" fill="#234d40" />
                    <circle cx="50" cy="1150" r="6" stroke="#234d40" strokeWidth="0.5" fill="none" />

                    <circle cx="750" cy="1150" r="3" fill="#234d40" />
                    <circle cx="750" cy="1150" r="6" stroke="#234d40" strokeWidth="0.5" fill="none" />
                </svg>
            </div>

            {/* Page Header (Matching screenshot pill shape and decorative lines) */}
            <div className="relative h-20 flex items-center justify-center px-16 z-20 mt-6 pointer-events-none select-none" dir="rtl">
                {/* Horizontal left decorative line */}
                <SurahHeaderLine isLeft={true} />

                {/* Center: Surah Name pill */}
                <div className="flex items-center justify-center bg-[#e8f2ee] border border-[#bcdad0] rounded-full px-8 py-1.5 shadow-sm min-w-[200px] mx-4">
                    <span className="font-['Amiri'] text-lg font-bold text-[#1e4a3e] leading-none">
                        سورة {surahInfo?.name} {toArabicNumerals(sId)}
                    </span>
                </div>
                
                {/* Horizontal right decorative line */}
                <SurahHeaderLine isLeft={false} />
            </div>

            {/* Quran Text Area */}
            <div className="relative z-10 w-full flex flex-col items-center px-6 sm:px-[12%] md:px-[15%] pt-6 pb-28 flex-1">
                <div className="w-full text-justify [text-align-last:justify] leading-[3] md:leading-[3.6] text-black" style={{ textJustify: 'inter-word', wordSpacing: '0.35em' }}>
                    {pData.verses.map((verse: any, vIdx: number) => {
                        const [sIdStr, vId] = verse.verse_key.split(':');
                        const isFirstVerse = vId === "1";
                        const surahName = surahsData.find(s => s.id === parseInt(sIdStr))?.name;
                        const isPlaying = currentPlayingVerse?.pageIndex === pIdx && currentPlayingVerse?.verseIndex === vIdx;

                        return (
                            <React.Fragment key={verse.id}>
                                {isFirstVerse && (
                                    <div className="w-full flex flex-col items-center gap-4 my-10 animate-in fade-in duration-1000 select-none">
                                        {/* Ornate Surah Title Header Banner */}
                                        <div className="relative w-full max-w-[620px] h-[70px] flex items-center justify-between px-8 bg-[#e8f2ee]/60 border-4 border-double border-[#234d40]/60 rounded-2xl my-6">
                                            {/* Left Box: Verse count */}
                                            <div className="flex items-center justify-center border border-[#234d40]/30 rounded-lg px-3 py-0.5 bg-[#234d40]/5 min-w-[90px]">
                                                <span className="font-['Amiri'] text-xs font-bold text-[#1e4a3e]">
                                                    آيَاتُهَا {toArabicNumerals(surahInfo?.total_verses || 0)}
                                                </span>
                                            </div>
                                            
                                            {/* Center: Surah Title */}
                                            <div className="flex-1 text-center">
                                                <h3 className="font-['Amiri'] text-2xl font-black text-[#1e4a3e]">
                                                    سُورَةُ {surahName}
                                                </h3>
                                            </div>
                                            
                                            {/* Right Box: Revelation Type */}
                                            <div className="flex items-center justify-center border border-[#234d40]/30 rounded-lg px-3 py-0.5 bg-[#234d40]/5 min-w-[90px]">
                                                <span className="font-['Amiri'] text-xs font-bold text-[#1e4a3e]">
                                                    {surahInfo?.type === 'meccan' ? 'مَكِّيَّةٌ' : 'مَدَنِيةٌ'}
                                                </span>
                                            </div>

                                            {/* Corner dot ornaments */}
                                            <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                                            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                                            <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                                            <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
                                        </div>

                                        {/* Basmalah */}
                                        {sId !== 1 && sId !== 9 && (
                                            <div className="font-['Amiri'] text-4xl py-6 font-bold text-[#1e4a3e] opacity-95">
                                                بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <span 
                                    onClick={() => playVerse(pIdx, vIdx)} 
                                    className={`inline transition-all duration-300 rounded-xl cursor-pointer py-1 px-2 ${isPlaying ? 'bg-primary/20 text-[#234d40] shadow-[0_0_30px_rgba(212,175,55,0.2)] scale-105 z-50' : 'hover:bg-[#234d40]/5 text-black'}`}
                                >
                                    <span className="font-['Amiri'] inline font-bold antialiased" style={{ fontSize: `${mushafFontSize}px` }}>
                                        {verse.text_uthmani_tajweed ? (
                                            <span dangerouslySetInnerHTML={{ __html: verse.text_uthmani_tajweed.replace(/\s*<span class="?end"?[^>]*>.*?<\/span>/gi, '') }} />
                                        ) : (
                                            verse.words?.filter((w: any) => w.char_type_name === 'word').map((word: any) => {
                                                const isAllah = word.text_uthmani?.includes('للَّ') || word.text_uthmani?.includes('اللَّ');
                                                return (
                                                    <span key={word.id} className={`inline-block mx-[2px] ${isAllah ? 'text-[#cd4d4d]' : 'currentColor'}`}>
                                                        {word.text_uthmani}
                                                    </span>
                                                );
                                            })
                                        )}
                                        
                                        {/* Ornate End-of-Verse Marker (8-pointed Islamic Star Rub el Hizb) */}
                                        <span 
                                            onClick={(e) => { e.stopPropagation(); onShowDetail(verse.verse_key, surahName); }}
                                            className="inline-block mx-2 relative cursor-help select-none align-middle"
                                            style={{ width: `${mushafFontSize * 1.2}px`, height: `${mushafFontSize * 1.2}px` }}
                                        >
                                            <svg className={`absolute inset-0 w-full h-full transition-colors ${isPlaying ? 'text-[#d4af37]' : 'text-[#234d40]'}`} viewBox="0 0 100 100" fill="none">
                                                {/* First square */}
                                                <rect x="23" y="23" width="54" height="54" rx="4" fill="currentColor" />
                                                {/* Second square rotated 45 deg */}
                                                <rect x="23" y="23" width="54" height="54" rx="4" fill="currentColor" transform="rotate(45 50 50)" />
                                                {/* Inner circle with light page background fill */}
                                                <circle cx="50" cy="50" r="21" fill="#fbfaf7" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                            <span className={`absolute inset-0 flex items-center justify-center font-bold font-arabic transition-colors ${isPlaying ? 'text-[#b08b20]' : 'text-[#1e4a3e]'}`} style={{ fontSize: `${mushafFontSize * 0.45}px`, fontFamily: 'Amiri, serif' }}>
                                              {toArabicNumerals(vId)}
                                            </span>
                                        </span>
                                    </span>
                                </span>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Page Number Pill at bottom center */}
            <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center items-center pointer-events-none select-none">
                <div className="flex items-center justify-center bg-[#e8f2ee] border border-[#bcdad0] rounded-full px-5 py-0.5 shadow-sm min-w-[50px]">
                    <span className="font-['Amiri'] text-xs font-bold text-[#1e4a3e]">{toArabicNumerals(pageNum)}</span>
                </div>
            </div>
        </div>
    );
});
MushafPage.displayName = "MushafPage";

