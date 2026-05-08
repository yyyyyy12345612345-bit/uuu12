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
  const audioRef = useRef<HTMLAudioElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredSurahs = useMemo(() => 
    surahsData.filter((s) => s.name.includes(search) || s.transliteration.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

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

  return (
    <div className="h-full w-full bg-[#0a0a0a] text-white overflow-hidden relative font-['Tajawal'] flex flex-col lg:flex-row">
      <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={handleNext} preload="auto" />

      {/* Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#06402B]/10 via-transparent to-transparent" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />
      </div>

      {/* ─── LEFT: PLAYER CONTROLS (Floating Glass on Desktop) ─── */}
      <div className="relative z-10 w-full lg:w-[450px] flex flex-col p-6 lg:p-10 lg:border-l lg:border-white/5 bg-black/40 backdrop-blur-3xl shrink-0">
          
          {/* Header Metadata */}
          <div className="flex items-center justify-between mb-10">
              <div className="flex flex-col">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1">يتم تشغيله الآن</span>
                  <h2 className="text-2xl font-black font-['Amiri']">سورة {currentSurah.name}</h2>
              </div>
              <button onClick={() => setShowReciters(true)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group">
                  <User className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              </button>
          </div>

          {/* Artwork / Visualizer Area */}
          <div className="relative flex-1 flex flex-col items-center justify-center mb-10">
              <div className="relative w-64 h-64 md:w-72 md:h-72">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-[80px] animate-pulse" />
                  <motion.div 
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="relative w-full h-full rounded-full border-2 border-primary/20 p-2 overflow-hidden bg-black/40 shadow-2xl flex items-center justify-center"
                  >
                      <div className="absolute inset-0 islamic-pattern opacity-10" />
                      <div className="w-full h-full rounded-full border border-white/10 flex flex-col items-center justify-center text-center p-8">
                          <Disc className={`w-12 h-12 text-primary/40 mb-4 ${isPlaying ? 'animate-spin-slow' : ''}`} />
                          <span className="text-xs font-bold text-white/60 mb-1">{selectedReciter.name}</span>
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Premium Audio</span>
                      </div>
                  </motion.div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-card rounded-2xl border border-white/10 flex items-center justify-center shadow-xl">
                      <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  </div>
              </div>
          </div>

          {/* Player Progress */}
          <div className="w-full space-y-4 mb-8">
              <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">الوقت المنقضي</span>
                      <span className="text-sm font-bold tabular-nums">{fmt(currentTime)}</span>
                  </div>
                  <div className="text-right flex flex-col">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">المدة الإجمالية</span>
                      <span className="text-sm font-bold tabular-nums">{fmt(duration)}</span>
                  </div>
              </div>
              <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden group cursor-pointer">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/40 transition-all duration-300"
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
          <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                  <button onClick={() => setIsShuffle(!isShuffle)} className={`p-2 transition-all ${isShuffle ? 'text-primary scale-110' : 'text-white/20 hover:text-white/40'}`}>
                      <Shuffle className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-8">
                      <button onClick={handlePrev} className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-90">
                          <SkipBack className="w-7 h-7 fill-current" />
                      </button>
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-black shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                      >
                          {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current translate-x-1" />}
                      </button>
                      <button onClick={handleNext} className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-90">
                          <SkipForward className="w-7 h-7 fill-current" />
                      </button>
                  </div>
                  <button onClick={() => setIsRepeat(!isRepeat)} className={`p-2 transition-all ${isRepeat ? 'text-primary scale-110' : 'text-white/20 hover:text-white/40'}`}>
                      <Repeat className="w-5 h-5" />
                  </button>
              </div>

              <div className="flex items-center justify-center gap-4 border-t border-white/5 pt-6">
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary">
                      <Heart className="w-3.5 h-3.5" /> تفضيل
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary">
                      <Share2 className="w-3.5 h-3.5" /> مشاركة
                  </button>
              </div>
          </div>
      </div>

      {/* ─── RIGHT: SCROLLABLE SURAH LIST ─── */}
      <div className="flex-1 flex flex-col relative z-10 bg-black/20">
          
          {/* List Header */}
          <div className="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <ListMusic className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                      <h3 className="text-xl font-black">المكتبة الصوتية</h3>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{filteredSurahs.length} SURAHS AVAILABLE</p>
                  </div>
              </div>
              
              <div className="relative w-full md:w-80 group">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-all" />
                  <input 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث عن سورة..."
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pr-12 pl-6 text-sm font-bold outline-none focus:bg-white/[0.07] focus:border-primary/20 transition-all placeholder:text-white/10"
                  />
              </div>
          </div>

          {/* Surahs Scroll Grid */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar pb-40">
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {filteredSurahs.map((surah) => {
                      const active = currentSurah.id === surah.id;
                      return (
                          <button
                            key={surah.id}
                            id={`surah-${surah.id}`}
                            onClick={() => { setCurrentSurah(surah); setIsPlaying(true); }}
                            className={`flex items-center gap-6 p-6 rounded-[2.5rem] transition-all duration-500 border text-right group relative overflow-hidden ${
                                active 
                                ? 'bg-primary/10 border-primary/40 shadow-2xl shadow-primary/5 scale-[1.02]' 
                                : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/5'
                            }`}
                          >
                              <RubElHizb number={surah.id} active={active} />
                              
                              <div className="flex-1 min-w-0">
                                  <h4 className={`text-lg font-black font-['Amiri'] mb-0.5 transition-colors ${active ? 'text-primary' : 'text-white/80 group-hover:text-white'}`}>
                                      سورة {surah.name}
                                  </h4>
                                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest truncate">
                                      {surah.transliteration} • {surah.total_verses} آيات
                                  </p>
                              </div>

                              {active && isPlaying && (
                                  <div className="flex gap-1 items-end h-4 mb-2">
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
