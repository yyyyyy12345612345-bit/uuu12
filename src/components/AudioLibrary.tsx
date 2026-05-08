"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { RECITERS } from "@/data/reciters";
import {
  Play, Pause, SkipBack, SkipForward, Search,
  Headphones, Repeat, Shuffle, ChevronDown, User,
  Disc, X, Sparkles, Heart, Share2, ListMusic
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { setupMediaSession, setPlaybackState, updatePositionState } from "@/lib/mediaSession";
import surahsData from "@/data/surahs.json";
import { addPoints } from "@/lib/points";

/* ─── Helpers ─── */
const fmt = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const rs = Math.floor(s % 60);
  return `${m}:${rs.toString().padStart(2, "0")}`;
};

/* ─── Components ─── */
const RubElHizb = ({ number, active }: { number: number; active: boolean }) => (
  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
    <svg viewBox="0 0 100 100" className={`absolute inset-0 w-full h-full transition-all duration-700 ${active ? 'text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]' : 'text-white/10'}`}>
      <path 
        fill="currentColor" 
        d="M50 0 L61.2 38.8 L100 50 L61.2 61.2 L50 100 L38.8 61.2 L0 50 L38.8 38.8 Z" 
        className="origin-center"
      />
      <path 
        fill="currentColor" 
        d="M50 0 L61.2 38.8 L100 50 L61.2 61.2 L50 100 L38.8 61.2 L0 50 L38.8 38.8 Z" 
        className="origin-center rotate-45 opacity-70"
      />
    </svg>
    <span className={`relative z-10 text-[10px] font-black ${active ? 'text-black' : 'text-white/40'}`}>
      {number}
    </span>
  </div>
);

export function AudioLibrary() {
  const [currentSurah, setCurrentSurah] = useState(surahsData[0]);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [search, setSearch] = useState("");
  const [showReciters, setShowReciters] = useState(false);
  const [reciterSearch, setReciterSearch] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const horizontalListRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem("quran_favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  const toggleFavorite = (id: number) => {
    const newFavs = favorites.includes(id) 
      ? favorites.filter(f => f !== id) 
      : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem("quran_favorites", JSON.stringify(newFavs));
  };

  const filteredSurahs = useMemo(() => {
    let list = surahsData;
    if (showOnlyFavorites) list = list.filter(s => favorites.includes(s.id));
    return list.filter((s) => s.name.includes(search) || s.transliteration.toLowerCase().includes(search.toLowerCase()));
  }, [search, showOnlyFavorites, favorites]);

  const filteredReciters = useMemo(() => 
    RECITERS.filter((r) => r.name.includes(reciterSearch)),
    [reciterSearch]
  );

  // Audio Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const sId = currentSurah.id.toString().padStart(3, "0");
    const newSrc = `https://${selectedReciter.mp3quranServer}/${sId}.mp3`;
    if (audio.src !== newSrc) {
      audio.pause();
      audio.src = newSrc;
      audio.load();
      if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    }
    setupMediaSession(
      { title: `سورة ${currentSurah.name}`, artist: selectedReciter.name, album: "Divine Audio" },
      {
        onPlay: () => { audio.play(); setIsPlaying(true); },
        onPause: () => { audio.pause(); setIsPlaying(false); },
        onNext: () => handleNext(),
        onPrev: () => handlePrev(),
      }
    );
  }, [currentSurah, selectedReciter]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
        if (isPlaying) audio.play().catch(() => setIsPlaying(false));
        else audio.pause();
        setPlaybackState(isPlaying ? 'playing' : 'paused');
    }
  }, [isPlaying]);

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (a) {
      setCurrentTime(a.currentTime);
      setDuration(a.duration || 0);
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    }
  };

  const handleNext = () => {
    const idx = surahsData.findIndex(s => s.id === currentSurah.id);
    const next = isShuffle 
      ? surahsData[Math.floor(Math.random() * surahsData.length)]
      : surahsData[(idx + 1) % surahsData.length];
    setCurrentSurah(next);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    const idx = surahsData.findIndex(s => s.id === currentSurah.id);
    setCurrentSurah(surahsData[(idx - 1 + surahsData.length) % surahsData.length]);
    setIsPlaying(true);
  };

  const downloadSurah = () => {
    const sId = currentSurah.id.toString().padStart(3, "0");
    const url = `https://${selectedReciter.mp3quranServer}/${sId}.mp3`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `Surah_${currentSurah.transliteration}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="h-full w-full bg-[#0a0a0a] text-white overflow-y-auto lg:overflow-hidden relative font-['Tajawal'] flex flex-col lg:flex-row no-scrollbar pb-32 lg:pb-0">
      <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={handleNext} preload="auto" />

      {/* Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#06402B]/10 via-transparent to-transparent" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />
      </div>

      {/* ─── LEFT/TOP: PLAYER CONTROLS ─── */}
      <div className="relative z-10 w-full lg:w-[420px] lg:h-full flex flex-col p-6 lg:p-10 lg:border-l lg:border-white/5 bg-black/60 backdrop-blur-3xl shrink-0 overflow-y-auto no-scrollbar">
          
          {/* Horizontal Surah Selection (Mobile Only) */}
          <div className="lg:hidden mb-8">
              <div className="flex items-center justify-between mb-4 px-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">اختر السورة</span>
                  <div className="flex gap-2">
                      <button onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} className={`p-2 rounded-xl border transition-all ${showOnlyFavorites ? 'bg-primary border-primary text-black shadow-lg shadow-primary/20' : 'bg-white/5 border-white/5 text-white/40'}`}>
                          <Heart className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-current' : ''}`} />
                      </button>
                  </div>
              </div>
              <div ref={horizontalListRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
                  {surahsData.map((s) => {
                      const active = s.id === currentSurah.id;
                      return (
                          <button 
                            key={s.id}
                            onClick={() => { setCurrentSurah(s); setIsPlaying(true); }}
                            className={`flex flex-col items-center gap-2 shrink-0 p-3 rounded-[2rem] border transition-all duration-500 ${active ? 'bg-primary border-primary shadow-xl shadow-primary/20 scale-105' : 'bg-white/5 border-white/5 opacity-60'}`}
                          >
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-[10px] ${active ? 'bg-black/10 text-black' : 'bg-white/5 text-white'}`}>
                                  {s.id}
                              </div>
                              <span className={`text-[9px] font-black font-['Amiri'] ${active ? 'text-black' : 'text-white'}`}>{s.name}</span>
                          </button>
                      );
                  })}
              </div>
          </div>

          {/* Header Metadata */}
          <div className="flex items-center justify-between mb-8 lg:mb-10">
              <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">يتم تشغيله الآن</span>
                  <h2 className="text-xl lg:text-3xl font-black font-['Amiri'] leading-tight">سورة {currentSurah.name}</h2>
              </div>
              <div className="flex items-center gap-3">
                  <button 
                    onClick={downloadSurah}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group shadow-xl"
                    title="تحميل MP3"
                  >
                      <ChevronDown className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  </button>
                  <button onClick={() => setShowReciters(true)} className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group shadow-xl">
                      <User className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                  </button>
              </div>
          </div>

          {/* Artwork / Visualizer Area */}
          <div className="relative flex flex-col items-center justify-center mb-8 lg:mb-12 lg:flex-1">
              <div className="relative w-56 h-56 lg:w-80 lg:h-80">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-[60px] lg:blur-[100px] animate-pulse" />
                  <motion.div 
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="relative w-full h-full rounded-full border-[12px] border-black p-2 overflow-hidden bg-gradient-to-br from-white/10 to-transparent shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex items-center justify-center"
                  >
                      <div className="absolute inset-0 islamic-pattern opacity-10" />
                      <div className="w-full h-full rounded-full border border-white/5 flex flex-col items-center justify-center text-center p-6 lg:p-10">
                          <Disc className={`w-10 h-10 lg:w-16 lg:h-16 text-primary/30 mb-3 lg:mb-5 ${isPlaying ? 'animate-spin-slow' : ''}`} />
                          <span className="text-[10px] lg:text-sm font-bold text-white/70 mb-1.5">{selectedReciter.name}</span>
                          <span className="text-[8px] lg:text-[10px] font-black text-primary uppercase tracking-[0.3em] px-4 py-1.5 bg-primary/10 rounded-full">Premium Audio</span>
                      </div>
                  </motion.div>
              </div>
          </div>

          {/* Player Progress */}
          <div className="w-full space-y-4 mb-8 lg:mb-10">
              <div className="flex justify-between items-end px-1">
                  <div className="flex flex-col">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">الوقت المنقضي</span>
                      <span className="text-sm lg:text-base font-bold tabular-nums text-white/90">{fmt(currentTime)}</span>
                  </div>
                  <div className="text-right flex flex-col">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">المدة الإجمالية</span>
                      <span className="text-sm lg:text-base font-bold tabular-nums text-white/90">{fmt(duration)}</span>
                  </div>
              </div>
              <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden group cursor-pointer border border-white/5">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/80 to-primary/40 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                  <input 
                    type="range" min="0" max="100" value={progress}
                    onChange={(e) => {
                        const a = audioRef.current;
                        if (a) a.currentTime = (parseFloat(e.target.value)/100) * a.duration;
                    }}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                  />
              </div>
          </div>

          {/* Main Controls */}
          <div className="flex flex-col gap-10 lg:gap-12">
              <div className="flex items-center justify-between">
                  <button onClick={() => setIsShuffle(!isShuffle)} className={`p-3 rounded-2xl transition-all ${isShuffle ? 'text-primary bg-primary/10 scale-110' : 'text-white/20 hover:text-white/40 hover:bg-white/5'}`}>
                      <Shuffle className="w-5 h-5 lg:w-6 lg:h-6" />
                  </button>
                  <div className="flex items-center gap-8 lg:gap-10">
                      <button onClick={handlePrev} className="text-white/40 hover:text-white transition-all hover:scale-125 active:scale-90">
                          <SkipBack className="w-8 h-8 lg:w-10 lg:h-10 fill-current" />
                      </button>
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-20 h-20 lg:w-24 lg:h-24 rounded-[2.5rem] bg-primary flex items-center justify-center text-black shadow-[0_20px_50px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all group"
                      >
                          {isPlaying ? <Pause className="w-8 h-8 lg:w-10 lg:h-10 fill-current" /> : <Play className="w-8 h-8 lg:w-10 lg:h-10 fill-current translate-x-1" />}
                      </button>
                      <button onClick={handleNext} className="text-white/40 hover:text-white transition-all hover:scale-125 active:scale-90">
                          <SkipForward className="w-8 h-8 lg:w-10 lg:h-10 fill-current" />
                      </button>
                  </div>
                  <button onClick={() => setIsRepeat(!isRepeat)} className={`p-3 rounded-2xl transition-all ${isRepeat ? 'text-primary bg-primary/10 scale-110' : 'text-white/20 hover:text-white/40 hover:bg-white/5'}`}>
                      <Repeat className="w-5 h-5 lg:w-6 lg:h-6" />
                  </button>
              </div>

              <div className="flex items-center justify-center gap-4 border-t border-white/5 pt-8">
                  <button 
                    onClick={() => toggleFavorite(currentSurah.id)}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] border transition-all text-xs font-black uppercase tracking-[0.2em] ${favorites.includes(currentSurah.id) ? 'bg-primary border-primary text-black shadow-xl shadow-primary/20' : 'bg-white/5 border-white/5 text-white/40 hover:text-primary hover:border-primary/20'}`}
                  >
                      <Heart className={`w-4 h-4 ${favorites.includes(currentSurah.id) ? 'fill-current' : ''}`} /> {favorites.includes(currentSurah.id) ? 'مفضلة' : 'إضافة للمفضلة'}
                  </button>
                  <button 
                    onClick={downloadSurah}
                    className="flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-xs font-black uppercase tracking-[0.2em] text-white/40 hover:text-primary"
                  >
                      <ChevronDown className="w-4 h-4" /> تحميل MP3
                  </button>
              </div>
          </div>
      </div>

      {/* ─── RIGHT: SCROLLABLE SURAH LIST ─── */}
      <div className="flex-1 flex flex-col relative z-10 bg-black/20">
          
          {/* List Header */}
          <div className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                      <ListMusic className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                      <h3 className="text-2xl font-black">المكتبة الصوتية</h3>
                      <div className="flex items-center gap-3 mt-1">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{filteredSurahs.length} SURAHS AVAILABLE</p>
                          {favorites.length > 0 && <div className="w-1 h-1 rounded-full bg-primary/40" />}
                          {favorites.length > 0 && <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{favorites.length} FAVORITED</p>}
                      </div>
                  </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                  <button 
                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                    className={`p-4 rounded-2xl border transition-all ${showOnlyFavorites ? 'bg-primary border-primary text-black shadow-xl shadow-primary/20' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'}`}
                  >
                      <Heart className={`w-5 h-5 ${showOnlyFavorites ? 'fill-current' : ''}`} />
                  </button>
                  <div className="relative flex-1 md:w-80 group">
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-all" />
                      <input 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="ابحث عن سورة..."
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pr-12 pl-6 text-sm font-bold outline-none focus:bg-white/[0.07] focus:border-primary/20 transition-all placeholder:text-white/10"
                      />
                  </div>
              </div>
          </div>

          {/* Surahs Scroll Grid */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar pb-60">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
                  {filteredSurahs.map((surah) => {
                      const active = currentSurah.id === surah.id;
                      const isFav = favorites.includes(surah.id);
                      return (
                          <button
                            key={surah.id}
                            id={`surah-${surah.id}`}
                            onClick={() => { setCurrentSurah(surah); setIsPlaying(true); }}
                            className={`flex items-center gap-6 p-6 rounded-[2.5rem] transition-all duration-700 border text-right group relative overflow-hidden ${
                                active 
                                ? 'bg-primary/10 border-primary/40 shadow-2xl shadow-primary/5 scale-[1.02]' 
                                : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/5'
                            }`}
                          >
                              <div className="absolute top-4 left-4">
                                  {isFav && <Heart className="w-3 h-3 text-primary fill-current" />}
                              </div>

                              <RubElHizb number={surah.id} active={active} />
                              
                              <div className="flex-1 min-w-0">
                                  <h4 className={`text-xl font-black font-['Amiri'] mb-1 transition-colors ${active ? 'text-primary' : 'text-white/80 group-hover:text-white'}`}>
                                      سورة {surah.name}
                                  </h4>
                                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest truncate">
                                      {surah.transliteration} • {surah.total_verses} آيات
                                  </p>
                              </div>

                              {active && isPlaying && (
                                  <div className="flex gap-1 items-end h-5 mb-2">
                                      {[...Array(3)].map((_, i) => (
                                          <div 
                                            key={i} 
                                            className="w-1 bg-primary rounded-full animate-music-bar" 
                                            style={{ animationDelay: `${i * 0.2}s` }} 
                                          />
                                      ))}
                                  </div>
                              )}
                          </button>
                      );
                  })}
              </div>
          </div>
      </div>

      {/* ─── RECITER DRAWER ─── */}
      <AnimatePresence>
          {showReciters && (
              <div className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-10">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowReciters(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                  />
                  <motion.div 
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    className="relative w-full max-w-xl bg-[#0d0d0d] rounded-t-[3rem] md:rounded-[3rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl h-[80vh] md:h-auto md:max-h-[85vh]"
                  >
                      <div className="p-8 border-b border-white/5 flex items-center justify-between">
                          <h3 className="text-2xl font-black">اختر القارئ</h3>
                          <button onClick={() => setShowReciters(false)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all">
                              <X className="w-5 h-5 text-white/40" />
                          </button>
                      </div>

                      <div className="p-6 border-b border-white/5">
                          <div className="relative group">
                              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                              <input 
                                value={reciterSearch}
                                onChange={(e) => setReciterSearch(e.target.value)}
                                placeholder="ابحث عن قارئ..."
                                className="w-full bg-white/5 border border-white/5 rounded-xl py-4 pr-12 pl-6 text-sm font-bold outline-none focus:border-primary/40 transition-all"
                              />
                          </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-2 no-scrollbar">
                          {filteredReciters.map((r) => {
                              const sel = selectedReciter.id === r.id;
                              return (
                                  <button
                                    key={r.id}
                                    onClick={() => { setSelectedReciter(r); setShowReciters(false); }}
                                    className={`w-full flex items-center gap-4 p-5 rounded-2xl transition-all border text-right ${
                                        sel ? 'bg-primary text-black border-primary' : 'bg-white/[0.03] border-transparent hover:bg-white/[0.06]'
                                    }`}
                                  >
                                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${sel ? 'bg-black/10' : 'bg-white/5'}`}>
                                          <User className="w-6 h-6" />
                                      </div>
                                      <span className="text-sm font-black truncate">{r.name}</span>
                                  </button>
                              );
                          })}
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

    </div>
  );
}
