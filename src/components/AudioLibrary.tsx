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
      if (isPlaying) audio.play().catch(() => setIsPlaying(false));
      logAppEvent("change_reciter", { reciter_name: selectedReciter.name });
    }
    setupMediaSession(
      { title: `سورة ${currentSurah.name}`, artist: selectedReciter.name, album: "المكتبة الصوتية" },
      {
        onPlay: () => { audio.play(); setIsPlaying(true); },
        onPause: () => { audio.pause(); setIsPlaying(false); },
        onNext: nextSurah,
        onPrev: prevSurah,
        onSeekTo: (t) => { audio.currentTime = t; },
      }
    );
  }, [currentSurah, selectedReciter]);

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

  const onEnded = () => { if (isRepeat) { audioRef.current!.currentTime = 0; audioRef.current!.play(); } else nextSurah(); };

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0f0d] text-white overflow-hidden relative font-['Tajawal']">
      <audio ref={audioRef} onTimeUpdate={onTimeUpdate} onEnded={onEnded} preload="auto" />

      {/* ═══ SCROLLABLE CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto pb-56">

        {/* ── Hero / Now Playing ── */}
        <div className="relative px-5 pt-6 pb-8">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d1411] via-[#0a0f0d] to-transparent opacity-60" />
          <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />

          <div className="relative z-10 flex flex-col items-center">

            {/* Small Disc + Info */}
            <div className="flex items-center gap-5 w-full max-w-md mb-6">
              {/* Disc */}
              <div className="relative shrink-0">
                <div className={`w-20 h-20 rounded-full border-4 border-primary/10 shadow-lg overflow-hidden ${isPlaying ? "animate-spin-slow" : ""}`}>
                  <div className="w-full h-full bg-[#0d1411] flex items-center justify-center">
                    <Disc className="w-10 h-10 text-primary/30" />
                    <div className="absolute w-5 h-5 bg-[#0a0f0d] rounded-full border-2 border-primary/30 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    </div>
                  </div>
                </div>
                {isPlaying && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg"><Pause className="w-2.5 h-2.5 text-black fill-current" /></div>}
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0 text-right">
                <h1 className="text-2xl font-black text-primary truncate font-['Amiri'] leading-tight">
                  سورة {currentSurah.name}
                </h1>
                <button
                  onClick={() => setShowReciters(true)}
                  className="flex items-center gap-2 mt-1 group"
                >
                  <span className="text-sm text-white/50 font-bold truncate group-hover:text-[#D4AF37] transition-colors">
                    {selectedReciter.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/30 shrink-0" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md space-y-2">
              <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#D4AF37] to-[#f0d060] rounded-full transition-[width] duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/30 font-bold tabular-nums">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-5 mt-4 w-full max-w-xs">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`p-2 rounded-full transition-all ${isShuffle ? "text-[#D4AF37] bg-[#D4AF37]/10" : "text-white/25 hover:text-white/60"}`}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button onClick={prevSurah} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all active:scale-90">
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-[0_8px_30px_rgba(212,175,55,0.35)] hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
              </button>

              <button onClick={nextSurah} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all active:scale-90">
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={`p-2 rounded-full transition-all ${isRepeat ? "text-[#D4AF37] bg-[#D4AF37]/10" : "text-white/25 hover:text-white/60"}`}
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Reciter Chip (quick access) ── */}
        <div className="px-5 mb-5">
          <button
            onClick={() => setShowReciters(true)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#043927]/50 border border-white/5 hover:border-[#D4AF37]/20 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white/80">{selectedReciter.name}</p>
                <p className="text-[10px] text-white/30 font-bold">اضغط لتغيير القارئ</p>
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-white/20" />
          </button>
        </div>

        {/* ── Surah List ── */}
        <div className="px-5">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن سورة..."
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pr-11 pl-4 text-sm font-bold outline-none focus:border-[#D4AF37]/40 transition-all placeholder:text-white/20"
            />
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
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border text-right ${
                    active
                      ? "bg-[#043927] border-[#D4AF37]/30 shadow-[0_4px_20px_rgba(4,57,39,0.6)]"
                      : "bg-white/[0.02] border-transparent hover:bg-white/[0.04] hover:border-white/5"
                  }`}
                >
                  {/* Number */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                    active ? "bg-[#D4AF37] text-black" : "bg-white/5 text-white/30"
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
                    <h4 className={`text-base font-black truncate font-['Amiri'] ${active ? "text-[#D4AF37]" : "text-white/90"}`}>
                      {surah.name}
                    </h4>
                    <p className="text-[10px] text-white/30 font-bold mt-0.5">
                      {surah.transliteration} • {surah.total_verses} آية
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
  );
}
