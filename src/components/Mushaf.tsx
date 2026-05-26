"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, Book, Headphones, ChevronRight, 
  Search, LayoutGrid, X, Volume2, Bookmark, 
  User, Star, BookOpen, ChevronLeft 
} from "lucide-react";
import { RECITERS } from "@/data/reciters";
import { useEditor } from "@/store/useEditor";
import surahsData from "@/data/surahs.json";
import { getAudioUrl } from "@/lib/quranUtils";
import { startAyahTimer, endAyahTimer } from "@/lib/points";
import { VerseDetailsModal } from "./VerseDetailsModal";


export function Mushaf() {
    const { state, updateState } = useEditor();
    const [selectedSurah, setSelectedSurah] = useState<string | null>(null);
    const [surahContent, setSurahContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [playingAyah, setPlayingAyah] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [showReciterPicker, setShowReciterPicker] = useState(false);
    const [selectedVerseForDetail, setSelectedVerseForDetail] = useState<{verseKey: string, surahName: string} | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sId = params.get('surahId');
        if (sId) setSelectedSurah(sId);
    }, []);

    useEffect(() => {
        if (selectedSurah) {
            const url = new URL(window.location.href);
            url.searchParams.set('surahId', selectedSurah);
            window.history.replaceState(null, '', url.toString());
        }
    }, [selectedSurah]);

    const audioRef = useRef<HTMLAudioElement>(null);
    const selectedReciter = RECITERS.find(r => r.id === state.reciterId) || RECITERS[0];

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

    const toggleAudio = (ayahId: number) => {
        if (playingAyah === ayahId) {
            audioRef.current?.pause();
            setPlayingAyah(null);
        } else {
            setPlayingAyah(ayahId);
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

    const filteredSurahs = surahsData.filter(s =>
        s.name.includes(search) || s.transliteration.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        if (!selectedSurah || !surahContent) return;
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const ayahId = entry.target.getAttribute("data-ayah-id");
                        if (ayahId) {
                            const pointsToAward = playingAyah === Number(ayahId) ? 0.2 : 0.1;
                            endAyahTimer(pointsToAward).then(res => {
                                if (res?.success) console.log(`Earned ${pointsToAward} points for an Ayah`);
                            });
                            startAyahTimer(ayahId);
                        }
                    }
                });
            },
            { threshold: 0.6 }
        );
        const ayahElements = document.querySelectorAll("[data-ayah-id]");
        ayahElements.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [selectedSurah, surahContent, playingAyah]);

    if (!selectedSurah) {
        return (
            <div className="flex flex-col min-h-full p-6 md:p-12 font-arabic relative animate-in fade-in duration-700 bg-transparent">
                {/* Background Patterns */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
                    <div className="absolute inset-0 islamic-pattern" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-transparent" />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                    {/* Header */}
                    <header className="p-8 md:p-12 text-center">

                        <h1 className={`font-['Amiri'] text-4xl md:text-6xl font-black mb-4 drop-shadow-2xl`}>المصحف الشريف</h1>
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-px w-12 bg-primary/30" />
                            <Star className="w-3 h-3 text-primary fill-primary" />
                            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">اختر السورة لبدء التلاوة</span>
                            <Star className="w-3 h-3 text-primary fill-primary" />
                            <div className="h-px w-12 bg-primary/30" />
                        </div>
                    </header>

                    {/* Search */}
                    <div className="px-4 md:px-8 mb-6">
                        <div className="max-w-xl mx-auto relative group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-all w-4 h-4" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="ابحث عن سورة..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-6 text-white text-sm outline-none focus:border-primary/50 transition-all text-right font-arabic"
                            />
                        </div>
                    </div>

                    {/* Surah List */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-32 no-scrollbar">
                        <div className="max-w-5xl mx-auto">
                            {state.bookmark && (
                                <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-black shadow-xl shadow-primary/20">
                                            <Bookmark className="w-6 h-6 fill-current" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-0.5">وردك المحفوظ</p>
                                            <p className="text-lg font-bold font-arabic">سورة {surahsData.find(s => s.id.toString() === state.bookmark?.surahId)?.name} - آية {state.bookmark.ayahId}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSurah(state.bookmark?.surahId || "1")}
                                        className="bg-primary text-black px-6 py-2.5 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                                    >
                                        مواصلة القراءة
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {filteredSurahs.map((surah) => (
                                    <button
                                        key={surah.id}
                                        onClick={() => setSelectedSurah(surah.id.toString())}
                                        className="group relative p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-primary/[0.05] transition-all flex flex-col gap-3 text-right"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="relative w-9 h-9 flex items-center justify-center">
                                                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-primary opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <path d="M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z" fill="currentColor" />
                                                </svg>
                                                <span className="relative z-10 text-[9px] font-black text-white group-hover:text-black transition-colors">{surah.id}</span>
                                            </div>
                                            <div className="text-[9px] font-bold text-white/20 group-hover:text-primary transition-colors">
                                                {surah.total_verses} آية
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold font-arabic group-hover:text-primary transition-colors">سورة {surah.name}</h3>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full bg-transparent text-foreground font-['Tajawal'] relative overflow-hidden animate-reveal`}>
            {/* Background Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.15]">
                <div className="absolute inset-0 mushaf-pattern" />
            </div>

            {/* Header */}
            <header className="shrink-0 p-6 md:p-8 flex items-center justify-between z-40 bg-background/80 backdrop-blur-xl border-b border-border">
                <button
                    onClick={() => setSelectedSurah(null)}
                    className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                >
                    <ChevronRight className="w-7 h-7" />
                </button>

                <div className="text-center">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1 block">سُورَةُ</span>
                    <h2 className="font-['Amiri'] text-3xl md:text-5xl font-black">
                        {surahContent?.name || "..."}
                    </h2>
                </div>

                <button 
                  onClick={() => setShowReciterPicker(!showReciterPicker)}
                  className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                    <User className="w-6 h-6" />
                </button>
            </header>

            {/* Reciter Picker Popover */}
            {showReciterPicker && (
                <div className="absolute top-28 right-8 w-80 bg-[#0c0d10]/98 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-[0_30px_90px_rgba(0,0,0,0.5)] z-[1000] p-6 animate-in zoom-in-95 duration-300">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest text-center mb-6">اختر قارئ المصحف</p>
                    <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto no-scrollbar">
                        {RECITERS.map(reciter => (
                            <button
                                key={reciter.id}
                                onClick={() => { updateState({ reciterId: reciter.id }); setShowReciterPicker(false); }}
                                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${state.reciterId === reciter.id ? 'bg-primary text-black' : 'hover:bg-white/5 text-white/40'}`}
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

            {/* Verse List */}
            <div className="flex-1 overflow-y-auto px-4 md:px-12 pb-20 no-scrollbar overscroll-contain">
                <div className="max-w-4xl mx-auto py-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-32 gap-8 text-center">
                            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-white/20 font-black tracking-[0.3em] uppercase">جاري جلب الآيات...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-12 md:gap-24 relative z-10">
                            {surahContent?.verses.map((verse: any) => (
                                <div
                                    key={verse.id}
                                    id={`verse-${verse.id}`}
                                    data-ayah-id={verse.id}
                                    onClick={() => toggleAudio(verse.id)}
                                    className={`group relative p-6 md:p-14 rounded-[3rem] border transition-all duration-700 cursor-pointer backdrop-blur-sm ${
                                        playingAyah === verse.id 
                                        ? 'bg-primary/5 border-primary shadow-[0_0_80px_rgba(212,175,55,0.15)] scale-[1.02]' 
                                        : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'
                                    }`}
                                >
                                    {/* Verse Actions */}
                                    <div className="flex items-center justify-between mb-12">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateState({ bookmark: { surahId: selectedSurah, ayahId: verse.id } });
                                            }}
                                            className={`flex items-center gap-3 px-6 py-2.5 rounded-full border text-[11px] font-black transition-all ${state.bookmark?.surahId === selectedSurah && state.bookmark?.ayahId === verse.id ? 'bg-primary border-primary text-black' : 'border-white/10 text-white/30 hover:bg-white/5'}`}
                                        >
                                            <Bookmark className="w-4 h-4" />
                                            <span>{state.bookmark?.surahId === selectedSurah && state.bookmark?.ayahId === verse.id ? 'تم حفظ الورد' : 'حفظ كورد'}</span>
                                        </button>
                                        
                                        <div className="w-14 h-14 relative flex items-center justify-center">
                                            <svg className="absolute inset-0 w-full h-full text-primary opacity-20" viewBox="0 0 100 100">
                                                <path d="M50 5 L62 38 L95 50 L62 62 L50 95 L38 62 L5 50 L38 38 Z" fill="currentColor" />
                                            </svg>
                                            <span className="relative z-10 text-sm font-black text-primary">{verse.id}</span>
                                        </div>
                                    </div>

                                    {/* Quran Text */}
                                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-8 md:gap-x-8 text-center">
                                        {verse.words?.filter((w: any) => w.char_type_name === 'word').map((word: any) => {
                                            const isAllah = word.text_uthmani?.includes('للَّ') || word.text_uthmani?.includes('اللَّ');
                                            return (
                                                <span
                                                    key={word.id}
                                                    className={`font-['Amiri'] text-4xl md:text-6xl px-1 transition-colors ${isAllah ? 'text-red-400' : 'text-white/90 group-hover:text-white'}`}
                                                >
                                                    {word.text_uthmani}
                                                </span>
                                            );
                                        })}
                                    </div>

                                    {/* Translation / Tafsir */}
                                    <div className="mt-16">
                                        <div 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedVerseForDetail({ 
                                                    verseKey: `${selectedSurah}:${verse.id}`, 
                                                    surahName: surahContent.name 
                                                });
                                            }}
                                            className="p-10 rounded-[2.5rem] bg-black/20 border border-white/5 relative text-right hover:bg-black/30 transition-all group/tafsir"
                                        >
                                            <p className="text-xl md:text-2xl text-white/40 leading-relaxed font-arabic font-medium group-hover:text-white/60 transition-colors">
                                                {verse.translation}
                                            </p>
                                            <div className="mt-6 flex items-center justify-end gap-3 text-primary/40 group-hover/tafsir:text-primary transition-colors">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">إظهار التفسير الكامل</span>
                                                <ChevronLeft className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <audio ref={audioRef}
                onEnded={() => {
                    if (playingAyah && playingAyah < (surahContent?.verses.length || 0)) {
                        toggleAudio(playingAyah + 1);
                        document.getElementById(`verse-${playingAyah + 1}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else { setPlayingAyah(null); }
                }}
            />

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
