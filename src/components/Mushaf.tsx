"use client";

import React, { useState, useEffect, useRef, memo } from "react";
import { Play, Pause, Book, Headphones, ChevronRight, Search, LayoutGrid, X, Volume2, Bookmark, User } from "lucide-react";
import { RECITERS } from "@/data/reciters";
import { useEditor } from "@/store/useEditor";
import surahsData from "@/data/surahs.json";
import { getAudioUrl } from "@/lib/quranUtils";

export function Mushaf() {
    const { state, updateState } = useEditor();
    const [selectedSurah, setSelectedSurah] = useState<string | null>(null);
    const [surahContent, setSurahContent] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [playingAyah, setPlayingAyah] = useState<number | null>(null);
    const [activeWordId, setActiveWordId] = useState<number | null>(null);
    const [search, setSearch] = useState("");
    const [showReciterPicker, setShowReciterPicker] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const wordAudioRef = useRef<HTMLAudioElement>(null);

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
                        audioRef.current.src = getAudioUrl(Number(selectedSurah), ayahId, state.reciterId, 'fallback');
                        audioRef.current.play().catch(console.error);
                    }
                });
            }
        }
    };

    const playWord = (word: any) => {
        if (!word || !word.audio_url) return;
        setActiveWordId(word.id);

        let audioUrl = word.audio_url;
        if (!audioUrl.startsWith('http')) {
            audioUrl = `https://audio.qurancdn.com/${audioUrl}`;
        }

        const audio = new Audio(audioUrl);
        audio.play().catch(() => {
            const alt = `https://verses.quran.com/${word.audio_url}`;
            new Audio(alt).play().catch(() => {});
        });

        if (navigator.vibrate) navigator.vibrate(20);
        audio.onended = () => setActiveWordId(null);
    };

    const filteredSurahs = surahsData.filter(s =>
        s.name.includes(search) || s.transliteration.toLowerCase().includes(search.toLowerCase())
    );

    if (!selectedSurah) {
        return (
            <div className="flex flex-col h-full animate-in fade-in duration-700 relative overflow-hidden">
                {/* Unified Background Layer */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div 
                        className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                        style={{ 
                            backgroundImage: "url('/mushaf-bg.jpg.png')",
                            filter: "brightness(0.3) contrast(1.2)"
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
                </div>

                <div className="relative z-10 flex flex-col h-full">


                {/* Search Bar */}
                <div className="py-4 px-6 md:px-12 shrink-0">

                    <div className="max-w-4xl mx-auto relative group">
                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-all transition-colors duration-500" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ابحث عن سورة... (الفاتحة، البقرة...)"
                            className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] py-5 pr-16 pl-8 text-white outline-none focus:border-primary/20 focus:bg-white/[0.05] transition-all text-right font-arabic text-lg"
                        />
                    </div>
                </div>

                {/* Scrollable Content */}
                <div key="surah-list-container" className="flex-1 overflow-y-auto p-4 md:px-12 pb-32 no-scrollbar custom-scrollbar">


                    <div className="max-w-7xl mx-auto flex flex-col gap-6">

                        {state.bookmark && (
                            <div className="premium-card p-8 flex flex-col md:flex-row items-center justify-between gap-8 bg-primary/[0.03] border-primary/20">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-lg">
                                        <Bookmark className="w-8 h-8 fill-current" />
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-primary font-bold text-[10px] uppercase tracking-[0.3em] mb-1">وردك الحالي</h4>
                                        <p className="text-2xl font-bold text-white font-arabic">سورة {surahsData.find(s => s.id.toString() === state.bookmark?.surahId)?.name} - آية {state.bookmark.ayahId}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedSurah(state.bookmark?.surahId || "1")}
                                    className="bg-primary text-black px-10 py-4 rounded-2xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                                >
                                    انتقل للآية الآن
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-6">
                            {filteredSurahs.map((surah) => (
                                <button
                                    key={surah.id}
                                    onClick={() => setSelectedSurah(surah.id.toString())}
                                    className={`group relative flex flex-col gap-3 p-4 premium-card border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:scale-[1.02] hover:border-primary/20 transition-all duration-500 ease-out ${state.bookmark?.surahId === surah.id.toString() ? 'border-primary/30 bg-primary/[0.03]' : ''}`}
                                >
                                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[9px] font-bold text-white/20 group-hover:text-primary transition-all">
                                        {surah.id.toString().padStart(3, '0')}
                                    </div>
                                    <div className="text-right flex-1">
                                        <h3 className="text-lg font-bold text-white font-arabic group-hover:text-primary-foreground transition-colors leading-tight">{surah.name}</h3>
                                        <p className="text-[9px] text-white/10 font-bold uppercase tracking-widest mt-0.5">{surah.transliteration}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/5">
                                        <span className="text-[8px] text-white/10 font-bold">{surah.total_verses} آية</span>
                                        <ChevronRight className="w-3 h-3 text-white/10 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
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
        <div className="flex flex-col h-full animate-reveal relative overflow-hidden bg-[#1a1510]"> {/* Fallback color to see if code updated */}
            {/* Mushaf Background Image Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div 
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
                    style={{ 
                        backgroundImage: "url('./mushaf-bg.jpg.png')", // Try relative path
                        filter: "brightness(0.7) contrast(1.1)"
                    }}
                />
                {/* Visual debug: if you see this overlay, then the code IS working */}
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/10 to-transparent mix-blend-overlay" />
                <div className="absolute inset-0 bg-black/30" />
            </div>

            <audio ref={wordAudioRef} onEnded={() => setActiveWordId(null)} />

            <header className="shrink-0 p-5 glass-effect border-b border-white/5 flex items-center justify-between z-40 mx-4 mt-2 rounded-2xl relative">
                <button
                    onClick={() => setSelectedSurah(null)}
                    className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/10 shrink-0"
                >
                    <ChevronRight className="w-7 h-7 cursor-pointer" />
                </button>

                <div className="text-center flex-1">
                    <h2 className="text-xl md:text-2xl font-bold font-arabic gold-shimmer-pro">سورة {surahContent?.name || "..."}</h2>
                    <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{surahContent?.transliteration}</p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0" onClick={() => setShowReciterPicker(!showReciterPicker)}>
                    <User className="w-6 h-6" />
                </div>

                {/* Reciter Selection Overlay */}
                {showReciterPicker && (
                    <div className="absolute top-24 left-0 right-0 lg:left-auto lg:right-0 lg:w-80 bg-[#0a0a0a]/98 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.9)] z-[100] p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-300">
                        <div className="p-4 border-b border-white/5 mb-2 text-center">
                            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">اختر قارئ المصحف</p>
                        </div>
                        {RECITERS.map(reciter => (
                            <button
                                key={reciter.id}
                                onClick={() => {
                                    updateState({ reciterId: reciter.id });
                                    setShowReciterPicker(false);
                                }}
                                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${state.reciterId === reciter.id ? 'bg-primary/10 border border-primary/20 text-primary' : 'hover:bg-white/5 text-white/40'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 ${state.reciterId === reciter.id ? 'text-primary' : 'text-white/20'}`}>
                                    <User className="w-5 h-5" />
                                </div>
                                <span className="font-arabic font-bold text-sm text-right flex-1">{reciter.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </header>

            <div key={`surah-verses-${selectedSurah}`} className="flex-1 overflow-y-auto p-6 md:p-12 pb-32 no-scrollbar custom-scrollbar overscroll-contain">


                <div className="max-w-4xl mx-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-32 gap-6">
                            <div className="w-14 h-14 border-2 border-primary/10 border-t-primary rounded-full animate-spin" />
                            <span className="text-xs text-white/20 font-bold uppercase tracking-widest">تحميل السورة...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-12 md:gap-24 relative z-10">
                            {surahContent?.verses.map((verse: any) => (
                                <div
                                    key={verse.id}
                                    id={`verse-${verse.id}`}
                                    onClick={() => toggleAudio(verse.id)}
                                    className={`group relative transition-all duration-700 p-6 md:p-10 rounded-[2.5rem] border cursor-pointer backdrop-blur-sm ${
                                        playingAyah === verse.id 
                                        ? 'bg-primary/[0.03] border-primary/40 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)] scale-[1.01]' 
                                        : 'bg-black/10 border-white/5 hover:border-white/10 hover:bg-black/20'
                                    }`}
                                >

                                    <div className="flex items-center justify-between mb-8">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                updateState({ bookmark: { surahId: selectedSurah, ayahId: verse.id } });
                                            }}
                                            className={`flex items-center gap-3 px-5 py-2 rounded-full border text-[11px] font-bold transition-all ${state.bookmark?.surahId === selectedSurah && state.bookmark?.ayahId === verse.id ? 'bg-primary border-primary text-black' : 'border-white/10 text-white/30 hover:bg-white/5'}`}
                                        >
                                            <Bookmark className="w-3.5 h-3.5" />
                                            <span className="font-arabic">{state.bookmark?.surahId === selectedSurah && state.bookmark?.ayahId === verse.id ? 'تم حفظ الورد' : 'حفظ كورد'}</span>
                                        </button>
                                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[11px] font-bold text-white/20 font-mono tracking-tighter shadow-inner cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleAudio(verse.id); }}>{verse.id}</div>
                                    </div>

                                    <div className="flex flex-wrap justify-center gap-x-2 gap-y-4 md:gap-x-4">
                                        {verse.words?.filter((w: any) => w.char_type_name === 'word').map((word: any) => (
                                            <span
                                                key={word.id}
                                                className="text-4xl md:text-6xl px-1 md:px-2 text-white/80"
                                            >
                                                {word.text_uthmani}
                                            </span>
                                        ))}
                                    </div>

                                    <div className={`mt-10 overflow-hidden transition-all duration-1000 ${playingAyah === verse.id ? 'max-h-96 opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-4'}`}>
                                        <div className="p-8 rounded-[2rem] bg-primary/[0.02] border border-primary/10 relative text-right">
                                            <p className="text-lg md:text-xl text-white/50 leading-relaxed font-arabic font-medium italic">
                                                {verse.translation}
                                            </p>
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
                onError={() => {
                    if (playingAyah && audioRef.current) {
                        console.warn("Retrying with fallback...");
                        audioRef.current.src = getAudioUrl(Number(selectedSurah), playingAyah, state.reciterId, 'fallback');
                        audioRef.current.play().catch(console.error);
                    }
                }}
            />
        </div>
    );
}
