"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, ChevronRight, Search, Bookmark, 
  User, Star, BookOpen, ChevronLeft, Volume2, Menu
} from "lucide-react";
import { RECITERS } from "@/data/reciters";
import { useEditor } from "@/store/useEditor";
import surahsData from "@/data/surahs.json";
import { getAudioUrl } from "@/lib/quranUtils";
import { startAyahTimer, endAyahTimer } from "@/lib/points";
import { VerseDetailsModal } from "./VerseDetailsModal";
import { useTheme } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";

const slideVariants = {
    enter: (dir: number) => ({
        x: dir > 0 ? 100 : dir < 0 ? -100 : 0,
        opacity: 0,
        scale: 0.98
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1
    },
    exit: (dir: number) => ({
        x: dir > 0 ? -100 : dir < 0 ? 100 : 0,
        opacity: 0,
        scale: 0.98
    })
};

export function Mushaf() {
    const { theme } = useTheme();
    const { state, updateState } = useEditor();
    
    // Core states
    const [selectedSurah, setSelectedSurah] = useState<string | null>(null);
    const [surahContent, setSurahContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [playingAyah, setPlayingAyah] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [showReciterPicker, setShowReciterPicker] = useState(false);
    const [selectedVerseForDetail, setSelectedVerseForDetail] = useState<{verseKey: string, surahName: string} | null>(null);
    const [activeVerseId, setActiveVerseId] = useState<number>(1);
    const [direction, setDirection] = useState<number>(0);

    const navigateAyah = (newId: number) => {
        if (newId > activeVerseId) {
            setDirection(1);
        } else if (newId < activeVerseId) {
            setDirection(-1);
        } else {
            setDirection(0);
        }
        setActiveVerseId(newId);
    };

    const audioRef = useRef<HTMLAudioElement>(null);
    const selectedReciter = RECITERS.find(r => r.id === state.reciterId) || RECITERS[0];

    // Load surahId from URL query param on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sId = params.get('surahId');
        if (sId) setSelectedSurah(sId);
    }, []);

    // Sync surahId with URL query params
    useEffect(() => {
        const url = new URL(window.location.href);
        if (selectedSurah) {
            url.searchParams.set('surahId', selectedSurah);
        } else {
            url.searchParams.delete('surahId');
        }
        window.history.replaceState(null, '', url.toString());
    }, [selectedSurah]);

    // Reset active verse when surah changes
    useEffect(() => {
        setActiveVerseId(1);
        setPlayingAyah(null);
    }, [selectedSurah]);

    // Fetch surah content
    useEffect(() => {
        if (!selectedSurah) return;
        async function fetchSurah() {
            setLoading(true);
            setSurahContent(null);
            try {
                const response = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${selectedSurah}?language=ar&words=true&word_fields=text_uthmani,audio_url,char_type_name&fields=text_uthmani&translations=131&per_page=500`);
                const data = await response.json();
                if (!data.verses || data.verses.length === 0) throw new Error("No verses found");
                const formattedVerses = data.verses.map((v: any) => ({
                    id: v.verse_number,
                    text: v.text_uthmani || v.text_indopak || "نص الآية غير متوفر",
                    words: v.words || [],
                    translation: v.translations?.[0]?.text.replace(/<[^>]*>?/gm, '') || ""
                }));
                const sData = surahsData.find(s => s.id.toString() === selectedSurah);
                setSurahContent({
                    name: sData?.name,
                    transliteration: sData?.transliteration,
                    verses: formattedVerses
                });
            } catch (err) {
                console.error("Failed to fetch surah", err);
            } finally {
                setLoading(false);
            }
        }
        fetchSurah();
    }, [selectedSurah]);

    // Points timer awarding points when viewing/listening to active verse
    useEffect(() => {
        if (!selectedSurah || !surahContent) return;
        const pointsToAward = playingAyah === activeVerseId ? 0.2 : 0.1;
        endAyahTimer(pointsToAward).then(res => {
            if (res?.success) console.log(`Earned ${pointsToAward} points for an Ayah`);
        });
        startAyahTimer(activeVerseId.toString());
    }, [selectedSurah, surahContent, activeVerseId, playingAyah]);

    const lastScrollTime = useRef<number>(0);
    const scrollCooldown = 800; // ms cooldown
    const touchStart = useRef<{ x: number, y: number } | null>(null);

    // Wheel navigation (scroll down -> next, scroll up -> prev)
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (!selectedSurah || loading || !surahContent) return;
            if (showReciterPicker || selectedVerseForDetail) return;
            
            const now = Date.now();
            if (now - lastScrollTime.current < scrollCooldown) return;

            const total = surahContent?.verses?.length || 0;

            // Threshold deltaY to prevent tiny scrolls
            if (e.deltaY > 30) {
                if (activeVerseId < total) {
                    navigateAyah(activeVerseId + 1);
                    lastScrollTime.current = now;
                }
            } else if (e.deltaY < -30) {
                if (activeVerseId > 1) {
                    navigateAyah(activeVerseId - 1);
                    lastScrollTime.current = now;
                }
            }
        };

        window.addEventListener("wheel", handleWheel, { passive: true });
        return () => window.removeEventListener("wheel", handleWheel);
    }, [selectedSurah, activeVerseId, loading, surahContent, showReciterPicker, selectedVerseForDetail]);

    // Touch Swipe navigation
    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            if (!selectedSurah || loading || !surahContent) return;
            if (showReciterPicker || selectedVerseForDetail) return;
            
            const touch = e.touches[0];
            touchStart.current = { x: touch.clientX, y: touch.clientY };
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (!selectedSurah || loading || !surahContent || !touchStart.current) return;
            if (showReciterPicker || selectedVerseForDetail) return;

            const now = Date.now();
            if (now - lastScrollTime.current < scrollCooldown) return;

            const touch = e.changedTouches[0];
            const diffX = touch.clientX - touchStart.current.x;
            const diffY = touch.clientY - touchStart.current.y;
            const total = surahContent?.verses?.length || 0;

            // Swipe threshold of 50px
            if (Math.abs(diffY) > 50 || Math.abs(diffX) > 50) {
                if (Math.abs(diffY) > Math.abs(diffX)) {
                    // Vertical Swipe: Swipe up (diffY < 0) -> Next, Swipe down (diffY > 0) -> Prev
                    if (diffY < 0) {
                        if (activeVerseId < total) {
                            navigateAyah(activeVerseId + 1);
                            lastScrollTime.current = now;
                        }
                    } else {
                        if (activeVerseId > 1) {
                            navigateAyah(activeVerseId - 1);
                            lastScrollTime.current = now;
                        }
                    }
                } else {
                    // Horizontal Swipe: Swipe left (diffX < 0) -> Next, Swipe right (diffX > 0) -> Prev (Arabic RTL flow)
                    if (diffX < 0) {
                        if (activeVerseId < total) {
                            navigateAyah(activeVerseId + 1);
                            lastScrollTime.current = now;
                        }
                    } else {
                        if (activeVerseId > 1) {
                            navigateAyah(activeVerseId - 1);
                            lastScrollTime.current = now;
                        }
                    }
                }
            }
            touchStart.current = null;
        };

        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchend", handleTouchEnd, { passive: true });
        return () => {
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchend", handleTouchEnd);
        };
    }, [selectedSurah, activeVerseId, loading, surahContent, showReciterPicker, selectedVerseForDetail]);


    const toggleAudio = (ayahId: number) => {
        if (playingAyah === ayahId) {
            audioRef.current?.pause();
            setPlayingAyah(null);
        } else {
            setPlayingAyah(ayahId);
            navigateAyah(ayahId);
            if (audioRef.current) {
                const audioUrl = getAudioUrl(Number(selectedSurah), ayahId, state.reciterId);
                audioRef.current.src = audioUrl;
                audioRef.current.play().catch(e => {
                    console.warn("Primary audio failed, trying fallback...", e);
                    if (audioRef.current) {
                        audioRef.current.src = getAudioUrl(Number(selectedSurah), ayahId, "afasy");
                        audioRef.current.play().catch(console.error);
                    }
                });
            }
        }
    };

    const handleAudioEnded = () => {
        const total = surahContent?.verses.length || 0;
        if (playingAyah && playingAyah < total) {
            const nextAyah = playingAyah + 1;
            navigateAyah(nextAyah);
            toggleAudio(nextAyah);
        } else {
            setPlayingAyah(null);
        }
    };

    const filteredSurahs = surahsData.filter(s =>
        s.name.includes(search) || s.transliteration.toLowerCase().includes(search.toLowerCase())
    );

    // ── SURAH INDEX VIEW (if !selectedSurah) ──
    if (!selectedSurah) {
        return (
            <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-between px-4 md:px-6 py-2.5 font-arabic select-none">
                
                {/* Custom Theme Background Images */}
                <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 opacity-100 dark:opacity-0"
                      style={{ backgroundImage: "url('/backgrounds/light.jpg.png')" }}
                    />
                    <div 
                      className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 opacity-0 dark:opacity-100"
                      style={{ backgroundImage: "url('/backgrounds/dark.jpg.png')" }}
                    />
                    <div className="absolute inset-0 bg-black/[0.01] dark:bg-black/25 transition-colors duration-300" />
                </div>

                {/* mosque/lantern overlays */}
                <div className="absolute bottom-0 left-0 w-[240px] h-[360px] pointer-events-none opacity-20 dark:opacity-15 z-0 hidden lg:block select-none">
                    <svg viewBox="0 0 280 450" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#B8860B]">
                        <path d="M0 450 V 120 C0 80, 40 40, 100 40 C160 40, 180 80, 180 120 V 450" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                        <path d="M0 450 V 100 C0 60, 60 20, 120 20 C180 20, 200 60, 200 100 V 450" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="120" y1="20" x2="120" y2="100" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M105 100 H135 L127 125 H113 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="120" cy="112" r="3" fill="currentColor" />
                        <path d="M0 450 Q 80 400 120 450 M0 420 Q 60 380 90 450" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>

                {/* Custom Top Header Bar */}
                <header className="relative z-10 w-full h-14 shrink-0 flex items-center justify-between px-2 md:px-4 pt-2">
                    {/* Right: Guest profile */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 dark:bg-[#0c0d10]/70 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm text-xs font-bold text-zinc-700 dark:text-zinc-300 font-arabic">
                        <span className="text-zinc-400 dark:text-zinc-500 text-sm">👤</span>
                        <span>زائر</span>
                    </div>

                    {/* Center: Open book logo */}
                    <div className="flex flex-col items-center select-none text-center">
                        <div className="flex items-center gap-1.5 text-[#B8860B] dark:text-[#E9C46A]">
                            <span className="text-xs">📖</span>
                            <span className="font-arabic font-black text-xs md:text-sm tracking-wide">المصحف الشريف</span>
                        </div>
                        <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 mt-0.5">نور على قلبك وقرآن</span>
                    </div>

                    {/* Left: Menu Toggle */}
                    <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { window.location.hash = 'menu'; }}
                          className="w-8 h-8 rounded-full bg-white/70 dark:bg-[#0c0d10]/70 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-95 transition-all"
                        >
                            <Menu className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="relative z-10 flex-1 w-full flex flex-col items-center min-h-0 mt-2 px-2 md:px-4">
                    {/* Header */}
                    <div className="text-center flex flex-col items-center select-none shrink-0 mb-3">
                        <h1 className="text-2xl md:text-3xl font-black text-zinc-800 dark:text-zinc-100 mb-1">المصحف الشريف</h1>
                        <div className="flex items-center justify-center gap-3">
                            <div className="h-px w-8 bg-[#B8860B]/30 dark:bg-[#E9C46A]/30" />
                            <span className="text-[9px] font-bold text-[#B8860B] dark:text-[#E9C46A] tracking-wider font-arabic">اقرأ وتدبر كلام الله عز وجل</span>
                            <div className="h-px w-8 bg-[#B8860B]/30 dark:bg-[#E9C46A]/30" />
                        </div>
                    </div>

                    {/* Search */}
                    <div className="w-full max-w-xl shrink-0 mb-4 px-2">
                        <div className="relative group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#B8860B] transition-all w-4 h-4" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="ابحث عن سورة..."
                                className="w-full bg-white/90 dark:bg-[#0c0d10]/60 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm rounded-full py-2.5 pr-11 pl-6 text-zinc-800 dark:text-zinc-100 text-xs outline-none focus:border-[#B8860B]/40 transition-all text-right font-arabic placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                            />
                        </div>
                    </div>

                    {/* Elegant Divider */}
                    <div className="flex flex-col items-center gap-1 mb-3 select-none shrink-0">
                        <h2 className="text-xs font-black text-zinc-700 dark:text-zinc-300">السور</h2>
                        <div className="flex items-center gap-1 scale-75">
                          <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#B8860B]/40 dark:to-[#E9C46A]/40" />
                          <div className="w-2.5 h-2.5 rounded-full border border-[#B8860B]/50 dark:border-[#E9C46A]/50 flex items-center justify-center rotate-45">
                            <div className="w-1 h-1 bg-[#B8860B] dark:bg-[#E9C46A]" />
                          </div>
                          <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#B8860B]/40 dark:to-[#E9C46A]/40" />
                        </div>
                    </div>

                    {/* Scrollable Surah Grid */}
                    <div className="flex-1 w-full overflow-y-auto no-scrollbar pb-4 max-w-6xl">
                        {state.bookmark && (
                            <div className="mb-4 p-3 rounded-2xl bg-[#B8860B]/10 border border-[#B8860B]/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm max-w-4xl mx-auto">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#B8860B] text-white flex items-center justify-center shadow-md">
                                        <Bookmark className="w-4 h-4 fill-current" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[7px] font-black text-[#B8860B] uppercase tracking-widest">وردك المحفوظ</p>
                                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">سورة {surahsData.find(s => s.id.toString() === state.bookmark?.surahId)?.name} - آية {state.bookmark.ayahId}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedSurah(state.bookmark?.surahId || "1")}
                                    className="bg-[#B8860B] hover:bg-[#B8860B]/90 text-white px-4 py-1.5 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-md"
                                >
                                    مواصلة القراءة
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                            {filteredSurahs.map((surah) => (
                                <button
                                    key={surah.id}
                                    onClick={() => setSelectedSurah(surah.id.toString())}
                                    className="group relative p-3 rounded-2xl bg-white/95 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/60 hover:border-[#B8860B]/50 dark:hover:border-[#E9C46A]/50 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between gap-3 text-right"
                                >
                                    {/* Left Side: Star Badge */}
                                    <div className="flex flex-col items-center gap-1 shrink-0 select-none">
                                        <div className="relative w-8 h-8 flex items-center justify-center">
                                            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#B8860B] opacity-85 group-hover:opacity-100 transition-opacity">
                                                <path d="M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z" fill="none" stroke="currentColor" strokeWidth="6" />
                                                <path d="M50 12 L60 40 L88 50 L60 60 L50 88 L40 60 L12 50 L40 40 Z" fill="currentColor" fillOpacity="0.1" />
                                            </svg>
                                            <span className="relative z-10 text-[9px] font-black text-[#B8860B] dark:text-[#E9C46A]">{surah.id.toString().padStart(2, '0')}</span>
                                        </div>
                                        <span className="text-[9px] text-zinc-300 dark:text-zinc-700 group-hover:text-[#B8860B] dark:group-hover:text-[#E9C46A] transition-colors">📖</span>
                                    </div>

                                    {/* Right Side: Details */}
                                    <div className="text-right flex-1 min-w-0 pr-1 space-y-0.5">
                                        <h3 className="text-xs md:text-sm font-black text-zinc-800 dark:text-zinc-100 group-hover:text-[#B8860B] dark:group-hover:text-[#E9C46A] transition-colors">سورة {surah.name}</h3>
                                        <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">{surah.total_verses} آية</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="relative z-10 w-full flex flex-col items-center justify-center gap-2 pt-3 border-t border-zinc-200/10 dark:border-zinc-800/40 select-none text-center shrink-0">
                    <div className="flex items-center gap-4 text-[#B8860B]/70 dark:text-[#E9C46A]/60 text-xs">
                        <span className="hover:text-[#B8860B] cursor-pointer">📘</span>
                        <span className="hover:text-[#B8860B] cursor-pointer">🐦</span>
                        <span className="hover:text-[#B8860B] cursor-pointer">📸</span>
                        <span className="hover:text-[#B8860B] cursor-pointer">📺</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[9px] text-zinc-400 dark:text-zinc-500">
                        <div className="h-px w-5 bg-[#B8860B]/30" />
                        <span className="font-bold">جميع الحقوق محفوظة © 2025</span>
                        <div className="h-px w-5 bg-[#B8860B]/30" />
                    </div>
                </footer>
            </div>
        );
    }

    // ── SELECTED SURAH / AYAH-BY-AYAH DETAIL VIEW ──
    const currentVerse = surahContent?.verses.find((v: any) => v.id === activeVerseId) || surahContent?.verses[0];
    const totalVerses = surahContent?.verses?.length || 0;

    return (
        <div className="relative w-full min-h-full flex flex-col items-center justify-between px-4 md:px-6 py-2.5 font-arabic">
            
            {/* Custom Theme Background Images (Full bleed) */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 opacity-100 dark:opacity-0"
                  style={{ backgroundImage: "url('/backgrounds/light.jpg.png')" }}
                />
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 opacity-0 dark:opacity-100"
                  style={{ backgroundImage: "url('/backgrounds/dark.jpg.png')" }}
                />
                <div className="absolute inset-0 bg-black/[0.01] dark:bg-black/25 transition-colors duration-300" />
            </div>

            {/* Custom Top Header Bar */}
            <header className="relative z-10 w-full h-14 shrink-0 flex items-center justify-between px-2 md:px-4 pt-2">
                {/* Right: Back Button */}
                <button
                    onClick={() => setSelectedSurah(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-[#0c0d10]/70 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-95 transition-all font-arabic"
                >
                    <ChevronRight className="w-4 h-4 text-[#B8860B] dark:text-[#E9C46A]" />
                    <span>الفهرس</span>
                </button>

                {/* Center: Surah details */}
                <div className="flex flex-col items-center select-none text-center">
                    <span className="text-[8px] font-black text-[#B8860B] dark:text-[#E9C46A] tracking-[0.3em] uppercase block">سُورَةُ</span>
                    <h2 className="font-['Amiri'] text-lg md:text-xl font-black text-zinc-800 dark:text-zinc-100">
                        {surahContent?.name || "..."}
                    </h2>
                </div>

                {/* Left: Reciter Selection button */}
                <button 
                  onClick={() => setShowReciterPicker(!showReciterPicker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-[#0c0d10]/70 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-95 transition-all font-arabic"
                >
                    <User className="w-3.5 h-3.5 text-[#B8860B] dark:text-[#E9C46A]" />
                    <span className="max-w-[70px] truncate">{selectedReciter.name.split(" ").slice(0, 2).join(" ")}</span>
                </button>
            </header>

            {/* Reciter Picker Popover */}
            {showReciterPicker && (
                <div className="absolute top-16 left-6 w-72 bg-white/95 dark:bg-[#0c0d10]/98 backdrop-blur-2xl border border-black/10 dark:border-white/10 rounded-[2rem] shadow-xl z-50 p-4 animate-in zoom-in-95 duration-200">
                    <p className="text-[8px] font-black text-[#B8860B] dark:text-[#E9C46A] uppercase tracking-widest text-center mb-3">اختر قارئ المصحف</p>
                    <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto no-scrollbar">
                        {RECITERS.map(reciter => (
                            <button
                                key={reciter.id}
                                onClick={() => { updateState({ reciterId: reciter.id }); setShowReciterPicker(false); }}
                                className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${state.reciterId === reciter.id ? 'bg-[#B8860B] text-white' : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-700 dark:text-white/40'}`}
                            >
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${state.reciterId === reciter.id ? 'bg-black/10' : 'bg-black/5 dark:bg-white/5'}`}>
                                    <User className="w-3.5 h-3.5" />
                                </div>
                                <span className="font-bold text-xs text-right flex-1">{reciter.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Interactive Ayah Card Container */}
            <div className="relative z-10 flex-1 w-full max-w-3xl flex items-center justify-center py-4 px-2 min-h-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-3 text-center">
                        <div className="w-10 h-10 border-3 border-[#B8860B]/20 border-t-[#B8860B] rounded-full animate-spin" />
                        <p className="text-[#B8860B]/60 font-black tracking-widest text-[9px] uppercase">جاري جلب الآيات...</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait" custom={direction}>
                        {currentVerse ? (
                            <motion.div
                                key={currentVerse.id}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.15 }
                                }}
                                className="w-full bg-white/80 dark:bg-[#0c0d10]/75 backdrop-blur-md border border-[#B8860B]/15 dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 shadow-[0_20px_50px_rgba(212,175,55,0.04)] flex flex-col justify-between min-h-[320px] md:min-h-[420px] max-h-[500px]"
                            >
                                
                                {/* Card Top Actions */}
                                <div className="flex items-center justify-between shrink-0 mb-4">
                                    {/* Bookmark Action */}
                                    <button
                                        onClick={() => {
                                            updateState({ bookmark: { surahId: selectedSurah, ayahId: currentVerse.id } });
                                        }}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black transition-all ${state.bookmark?.surahId === selectedSurah && state.bookmark?.ayahId === currentVerse.id ? 'bg-[#B8860B] border-[#B8860B] text-white' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                                    >
                                        <Bookmark className="w-3 h-3" />
                                        <span>{state.bookmark?.surahId === selectedSurah && state.bookmark?.ayahId === currentVerse.id ? 'وردك المحفوظ' : 'حفظ كورد'}</span>
                                    </button>

                                    {/* Ayah Star Badge */}
                                    <div className="w-8 h-8 relative flex items-center justify-center">
                                        <svg className="absolute inset-0 w-full h-full text-[#B8860B] opacity-20" viewBox="0 0 100 100">
                                            <path d="M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z" fill="currentColor" />
                                        </svg>
                                        <span className="relative z-10 text-[10px] font-black text-[#B8860B] dark:text-[#E9C46A]">{currentVerse.id}</span>
                                    </div>
                                </div>

                                {/* Arabic text - Flex-1 Scrollable to handle very long verses gracefully */}
                                <div className="flex-1 flex items-center justify-center overflow-y-auto no-scrollbar py-4 px-2 min-h-0 text-center">
                                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-4 text-center leading-relaxed">
                                        {currentVerse.words?.filter((w: any) => w.char_type_name === 'word').map((word: any) => {
                                            const isAllah = word.text_uthmani?.includes('للَّ') || word.text_uthmani?.includes('اللَّ');
                                            return (
                                                <span
                                                    key={word.id}
                                                    className={`font-['Amiri'] text-2xl md:text-3xl px-0.5 transition-colors ${isAllah ? 'text-red-600 dark:text-red-400 font-bold' : 'text-zinc-800 dark:text-zinc-100'}`}
                                                >
                                                    {word.text_uthmani}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Gold diamond geometric divider */}
                                <div className="flex items-center justify-center gap-1.5 my-3 shrink-0 scale-75">
                                  <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#B8860B]/30" />
                                  <div className="w-2.5 h-2.5 rounded-full border border-[#B8860B]/40 flex items-center justify-center rotate-45">
                                    <div className="w-1 h-1 bg-[#B8860B]" />
                                  </div>
                                  <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#B8860B]/30" />
                                </div>

                                {/* Translation / Tafsir Section */}
                                <div className="shrink-0">
                                    <div 
                                        onClick={() => {
                                            setSelectedVerseForDetail({ 
                                                verseKey: `${selectedSurah}:${currentVerse.id}`, 
                                                surahName: surahContent.name 
                                            });
                                        }}
                                        className="p-3 rounded-2xl bg-zinc-50 dark:bg-black/30 border border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-black/50 cursor-pointer transition-all text-right group/tafsir"
                                    >
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-arabic font-medium truncate">
                                            {currentVerse.translation}
                                        </p>
                                        <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[#B8860B]/80 group-hover/tafsir:text-[#B8860B] transition-colors">
                                            <span className="text-[7.5px] font-black uppercase tracking-wider">إظهار التفسير والترجمات</span>
                                            <ChevronLeft className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                        ) : (
                            <p className="text-zinc-400 dark:text-zinc-600 text-xs">لا تتوفر تفاصيل للآية</p>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Bottom Controls / Paginator Bar */}
            <div className="relative z-10 w-full max-w-xl flex flex-col items-center gap-3 shrink-0 pb-3">
                {/* Progress bar */}
                <div className="w-full bg-zinc-200/50 dark:bg-zinc-800/60 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#B8860B] h-full transition-all duration-300"
                      style={{ width: `${(activeVerseId / (totalVerses || 1)) * 100}%` }}
                    />
                </div>

                <div className="w-full flex items-center justify-between px-2">
                    {/* Next Button */}
                    <button
                        onClick={() => {
                            if (activeVerseId < totalVerses) {
                                navigateAyah(activeVerseId + 1);
                            }
                        }}
                        disabled={activeVerseId >= totalVerses || loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-[#0c0d10]/70 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm text-xs font-bold text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-95 transition-all select-none font-arabic"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span>الآية التالية</span>
                    </button>

                    {/* Play / Pause button */}
                    <button
                        onClick={() => currentVerse && toggleAudio(currentVerse.id)}
                        disabled={loading}
                        className="w-10 h-10 rounded-full bg-[#B8860B] hover:bg-[#B8860B]/90 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
                    >
                        {playingAyah === currentVerse?.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>

                    {/* Prev Button */}
                    <button
                        onClick={() => {
                            if (activeVerseId > 1) {
                                navigateAyah(activeVerseId - 1);
                            }
                        }}
                        disabled={activeVerseId <= 1 || loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 dark:bg-[#0c0d10]/70 border border-zinc-200/50 dark:border-zinc-800/80 shadow-sm text-xs font-bold text-zinc-700 dark:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-900 active:scale-95 transition-all select-none font-arabic"
                    >
                        <span>الآية السابقة</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Progress details */}
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold font-arabic select-none">
                    الآية {activeVerseId} من {totalVerses}
                </span>
            </div>

            {/* Audio engine */}
            <audio 
                ref={audioRef}
                onEnded={handleAudioEnded}
            />

            {/* Verse details popup */}
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
