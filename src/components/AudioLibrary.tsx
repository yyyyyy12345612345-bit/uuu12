"use client";

import React, { useState, useRef, useEffect } from "react";
import { RECITERS } from "@/data/reciters";
import {
  Play, Pause, SkipBack, SkipForward, Search,
  Headphones, Repeat, Shuffle, ChevronDown, User,
  Disc, X
} from "lucide-react";
import { setupMediaSession, setPlaybackState, updatePositionState } from "@/lib/mediaSession";
import surahsData from "@/data/surahs.json";
import { logAppEvent } from "@/lib/firebase";
import { addPoints } from "@/lib/points";

/* ─── Helpers ─── */
const fmt = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  return Math.floor(s / 60) + ":" + Math.floor(s % 60).toString().padStart(2, "0");
};

/* ─── Main Component ─── */
export function AudioLibrary() {
  const [currentSurah, setCurrentSurah] = useState(surahsData[0]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sId = params.get('surahId');
    if (sId) {
      const found = surahsData.find(s => s.id === parseInt(sId));
      if (found) setCurrentSurah(found);
    }
  }, []);
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

  const filteredReciters = RECITERS.filter((r) => r.name.includes(reciterSearch));
  const filteredSurahs = surahsData.filter((s) => s.name.includes(search) || s.transliteration.toLowerCase().includes(search.toLowerCase()));

  /* ── Audio source sync ── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const sId = currentSurah.id.toString().padStart(3, "0");
    const newSrc = `https://${selectedReciter.mp3quranServer}/${sId}.mp3`;
    if (audio.src !== newSrc) {
      audio.pause();
      audio.src = newSrc;
      audio.load();
      if (isPlaying) {
        audio.play().catch(err => {
          if (err.name !== 'AbortError') setIsPlaying(false);
        });
        setPlaybackState('playing');
      }
      logAppEvent("change_reciter", { reciter_name: selectedReciter.name });
    }
    setupMediaSession(
      { 
        title: `سورة ${currentSurah.name}`, 
        artist: selectedReciter.name, 
        album: "المكتبة الصوتية" 
      },
      {
        onPlay: () => { 
          audio.play(); 
          setIsPlaying(true); 
          setPlaybackState('playing');
        },
        onPause: () => { 
          audio.pause(); 
          setIsPlaying(false); 
          setPlaybackState('paused');
        },
        onNext: () => nextSurah(),
        onPrev: () => prevSurah(),
        onSeekTo: (t) => { if (audio) audio.currentTime = t; },
      }
    );
  }, [currentSurah, selectedReciter, isPlaying]);

  useEffect(() => { setPlaybackState(isPlaying ? "playing" : "paused"); }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const iv = setInterval(() => {
      const a = audioRef.current;
      if (a && !isNaN(a.duration)) updatePositionState(a.duration, a.currentTime);
    }, 1000);
    return () => clearInterval(iv);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;
    const iv = setInterval(() => { addPoints("listen", 1); }, 30000);
    return () => clearInterval(iv);
  }, [isPlaying]);

  /* ── Playback controls ── */
  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) { a.pause(); setIsPlaying(false); }
    else { a.play().catch(() => setIsPlaying(false)); setIsPlaying(true); }
  };

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setCurrentTime(a.currentTime);
    setDuration(a.duration || 0);
    setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (a && a.duration) a.currentTime = (parseFloat(e.target.value) / 100) * a.duration;
  };

  const playSurah = (s: any) => {
    setCurrentSurah(s);
    setIsPlaying(true);
    logAppEvent("play_audio", { surah_id: s.id, surah_name: s.name, reciter: selectedReciter.name });
    // Scroll to active surah in list
    setTimeout(() => {
      const el = document.getElementById(`surah-${s.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const nextSurah = () => {
    const idx = surahsData.findIndex((s) => s.id === currentSurah.id);
    const next = isShuffle
      ? surahsData[Math.floor(Math.random() * surahsData.length)]
      : surahsData[(idx + 1) % surahsData.length];
    playSurah(next);
  };

  const prevSurah = () => {
    const idx = surahsData.findIndex((s) => s.id === currentSurah.id);
    playSurah(surahsData[(idx - 1 + surahsData.length) % surahsData.length]);
  };

  const onEnded = () => { 
    if (isRepeat) { 
      audioRef.current!.currentTime = 0; 
      audioRef.current!.play(); 
      setPlaybackState('playing');
    } else {
      nextSurah(); 
    }
  };

  return (
    <>
    <div className="h-full w-full flex flex-col bg-[#0a0f0d] text-white overflow-hidden relative font-['Tajawal']">
      <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={onEnded} preload="auto" />

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto pb-56">

        {/* ── Spotify Style Now Playing ── */}
        <div className="relative px-8 pt-10 pb-12 flex flex-col items-center">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent opacity-40" />
          
          {/* Compact Surah Card (Replaces Large Album Art) */}
          <div className="relative z-10 w-full max-w-[200px] aspect-[4/3] mb-8 group">
             <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-xl group-hover:bg-primary/20 transition-all duration-700" />
             <div className="relative h-full w-full rounded-3xl bg-gradient-to-br from-[#0d1411] to-[#0a0f0d] border border-white/5 shadow-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center">
                <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Headphones className="w-6 h-6 text-primary" />
                </div>
                <span className="text-2xl font-black text-primary font-['Amiri']">سورة {currentSurah.name}</span>
                <span className="text-[8px] text-white/20 font-black uppercase tracking-[0.2em] mt-2">جاري الاستماع الآن</span>
             </div>
          </div>

          {/* Track Metadata */}
          <div className="relative z-10 text-center mb-8 w-full">
            <button
              onClick={() => setShowReciters(true)}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-bold text-white/70 group-hover:text-primary transition-colors">
                {selectedReciter.name}
              </span>
              <ChevronDown className="w-4 h-4 text-white/30" />
            </button>
          </div>

          {/* Spotify Progress Section */}
          <div className="relative z-10 w-full max-w-md px-4 mb-10">
            <div className="relative group h-6 flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleSeek}
                  dir="rtl"
                  className="absolute w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary z-10 hover:h-2 transition-all"
                />
                <div 
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 bg-primary rounded-full pointer-events-none transition-all group-hover:h-2"
                  style={{ width: `${progress}%` }}
                />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[10px] font-black text-white/30 font-mono tracking-tighter">{fmt(currentTime)}</span>
              <span className="text-[10px] font-black text-white/30 font-mono tracking-tighter">{fmt(duration)}</span>
            </div>
          </div>

          {/* Main Controls Section */}
          <div className="relative z-10 flex items-center justify-between w-full max-w-md px-6">
            <button 
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-2 transition-all ${isShuffle ? 'text-primary' : 'text-white/20 hover:text-white/40'}`}
            >
              <Shuffle className={`w-5 h-5 ${isShuffle ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : ''}`} />
            </button>

            <div className="flex items-center gap-8">
                <button onClick={prevSurah} className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-90">
                  <SkipBack className="w-7 h-7 fill-current" />
                </button>

                <button 
                  onClick={togglePlay}
                  className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-black shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:scale-110 active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current translate-x-1" />}
                </button>

                <button onClick={nextSurah} className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-90">
                  <SkipForward className="w-7 h-7 fill-current" />
                </button>
            </div>

            <button 
              onClick={() => setIsRepeat(!isRepeat)}
              className={`p-2 transition-all ${isRepeat ? 'text-primary' : 'text-white/20 hover:text-white/40'}`}
            >
              <Repeat className={`w-5 h-5 ${isRepeat ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Surah List Header ── */}
        <div className="px-8 mt-4 mb-8">
           <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">قائمة السور</h2>
              <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">{filteredSurahs.length} سورة</div>
           </div>
           
           {/* Spotify Search Bar */}
           <div className="relative group">
             <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-all" />
             <input
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="ابحث عن سورة..."
               className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pr-14 pl-6 text-base font-bold outline-none focus:bg-white/[0.07] focus:border-primary/20 transition-all placeholder:text-white/10"
             />
           </div>
        </div>

          {/* List */}
          <div ref={listRef} className="space-y-2">
            {filteredSurahs.map((surah) => {
              const active = currentSurah.id === surah.id;
              return (
                <button
                  key={surah.id}
                  id={`surah-${surah.id}`}
                  onClick={() => playSurah(surah)}
                  className={`w-full flex items-center gap-6 p-5 rounded-[2rem] transition-all duration-500 border text-right group ${
                    active
                      ? "bg-primary/10 border-primary/30 shadow-[0_15px_40px_rgba(212,175,55,0.1)] scale-[1.02]"
                      : "bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:scale-[1.01]"
                  }`}
                >
                  {/* Number */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 transition-all duration-500 ${
                    active ? "bg-primary text-black shadow-xl shadow-primary/20" : "bg-white/5 text-white/20 group-hover:bg-white/10"
                  }`}>
                    {active && isPlaying ? (
                      <div className="flex gap-[3px] items-end h-4">
                        <div className="w-[3px] bg-black rounded-full animate-music-bar" style={{ animationDelay: "0s" }} />
                        <div className="w-[3px] bg-black rounded-full animate-music-bar" style={{ animationDelay: "0.2s" }} />
                        <div className="w-[3px] bg-black rounded-full animate-music-bar" style={{ animationDelay: "0.1s" }} />
                      </div>
                    ) : (
                      surah.id
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-lg font-bold truncate font-arabic ${active ? "text-primary" : "text-white/90 group-hover:text-white"}`}>
                      {surah.name}
                    </h4>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">
                      {surah.transliteration} • {surah.total_verses} آيات
                    </p>
                  </div>

                  {/* Play indicator */}
                  {!active && (
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-3.5 h-3.5 text-white/40 fill-current ml-0.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ RECITER BOTTOM SHEET ═══ */}
      {showReciters && (
        <div className="fixed inset-0 z-[500]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowReciters(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-[#021a10] rounded-t-[2rem] border-t border-[#D4AF37]/10 flex flex-col overflow-hidden animate-premium-in">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-white/10 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <button onClick={() => setShowReciters(false)} className="p-2 rounded-full bg-white/5">
                <X className="w-5 h-5 text-white/40" />
              </button>
              <h3 className="text-lg font-black">اختر القارئ</h3>
            </div>

            {/* Search */}
            <div className="px-6 pb-4">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  value={reciterSearch}
                  onChange={(e) => setReciterSearch(e.target.value)}
                  placeholder="بحث عن قارئ..."
                  className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pr-10 pl-4 text-sm font-bold outline-none focus:border-[#D4AF37]/40 transition-all placeholder:text-white/20"
                />
              </div>
            </div>

            {/* Reciter Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-8">
              <div className="grid grid-cols-1 gap-2">
                {filteredReciters.map((r) => {
                  const sel = selectedReciter.id === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedReciter(r); setShowReciters(false); }}
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-all border text-right ${
                        sel
                          ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                          : "bg-white/[0.03] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${sel ? "bg-black/10" : "bg-white/5"}`}>
                        <User className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold truncate">{r.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
