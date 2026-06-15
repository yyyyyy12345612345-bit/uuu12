"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { RECITERS } from "@/data/reciters";
import {
  Play, Pause, SkipBack, SkipForward, Search,
  Headphones, Repeat, Shuffle,
  Disc, X, Heart, Volume2, Volume1, VolumeX,
  Clock, ChevronDown, ListMusic, Mic2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { setupMediaSession, setPlaybackState } from "@/lib/mediaSession";
import surahsData from "@/data/surahs.json";
import { addPoints, claimSurahCompletionPoints } from "@/lib/points";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/* ─── Helpers ─── */
const fmt = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const rs = Math.floor(s % 60);
  return `${m}:${rs.toString().padStart(2, "0")}`;
};

const normalizeArabic = (text: string) => {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .replace(/\s+/g, "");
};

/* ─── NAV HEIGHT (px) – must match Navigation.tsx ─── */
const NAV_H = 72;

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
  const [user, setUser] = useState<any>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "recent">("all");
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const sv = localStorage.getItem("audio_player_volume");
      return sv !== null ? parseFloat(sv) : 1;
    }
    return 1;
  });
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("audio_player_muted") === "true";
    }
    return false;
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const lastAwardedTime = useRef<number>(0);

  /* ── volume / mute persistence ── */
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) { audio.volume = volume; audio.muted = isMuted; }
    localStorage.setItem("audio_player_volume", volume.toString());
    localStorage.setItem("audio_player_muted", isMuted.toString());
  }, [volume, isMuted, currentSurah, selectedReciter]);

  /* ── Auth & Firestore ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.audioFavorites) setFavorites(d.audioFavorites);
          if (d.audioHistory) setRecentlyPlayed(d.audioHistory);
        } else {
          const saved = localStorage.getItem("quran_favorites");
          const savedH = localStorage.getItem("quran_history");
          const favs = saved ? JSON.parse(saved) : [];
          const hist = savedH ? JSON.parse(savedH) : [];
          setFavorites(favs); setRecentlyPlayed(hist);
          await setDoc(doc(db, "users", u.uid), { audioFavorites: favs, audioHistory: hist }, { merge: true });
        }
      } else {
        const saved = localStorage.getItem("quran_favorites");
        const savedH = localStorage.getItem("quran_history");
        if (saved) setFavorites(JSON.parse(saved));
        if (savedH) setRecentlyPlayed(JSON.parse(savedH));
      }
    });
    return () => unsub();
  }, []);

  const toggleFavorite = async (id: number) => {
    const isFav = favorites.includes(id);
    const newFavs = isFav ? favorites.filter(f => f !== id) : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem("quran_favorites", JSON.stringify(newFavs));
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          audioFavorites: isFav ? arrayRemove(id) : arrayUnion(id)
        });
      } catch (e) { console.error(e); }
    }
  };

  const addToHistory = async (id: number) => {
    const newH = [id, ...recentlyPlayed.filter(h => h !== id)].slice(0, 20);
    setRecentlyPlayed(newH);
    localStorage.setItem("quran_history", JSON.stringify(newH));
    if (user) {
      try { await updateDoc(doc(db, "users", user.uid), { audioHistory: newH }); }
      catch (e) { console.error(e); }
    }
  };

  /* ── Derived lists ── */
  const allFiltered = useMemo(() => {
    let list = surahsData;
    if (activeTab === "favorites") list = list.filter(s => favorites.includes(s.id));
    if (activeTab === "recent") {
      const ids = recentlyPlayed;
      list = ids.map(id => surahsData.find(s => s.id === id)!).filter(Boolean);
    }
    return list.filter(s =>
      s.name.includes(search) || s.transliteration.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, activeTab, favorites, recentlyPlayed]);

  const filteredReciters = useMemo(() => {
    const q = normalizeArabic(reciterSearch);
    return RECITERS.filter(r => normalizeArabic(r.name).includes(q));
  }, [reciterSearch]);

  /* ── Audio Source ── */
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
      { title: `سورة ${currentSurah.name}`, artist: selectedReciter.name, album: "Quran" },
      {
        onPlay: () => { audio.play(); setIsPlaying(true); },
        onPause: () => { audio.pause(); setIsPlaying(false); },
        onNext: handleNext,
        onPrev: handlePrev,
      }
    );
  }, [currentSurah, selectedReciter]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) audio.play().catch(() => setIsPlaying(false));
      else audio.pause();
      setPlaybackState(isPlaying ? "playing" : "paused");
    }
  }, [isPlaying]);

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (a) {
      setCurrentTime(a.currentTime);
      setDuration(a.duration || 0);
      setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
      const ts = Math.floor(a.currentTime);
      if (ts > 0 && ts % 30 === 0 && lastAwardedTime.current !== ts) {
        addPoints("listen", 1);
        lastAwardedTime.current = ts;
      }
    }
  };

  const handleNext = () => {
    const idx = surahsData.findIndex(s => s.id === currentSurah.id);
    const next = isShuffle
      ? surahsData[Math.floor(Math.random() * surahsData.length)]
      : surahsData[(idx + 1) % surahsData.length];
    handleSurahSelect(next);
  };

  const handlePrev = () => {
    const idx = surahsData.findIndex(s => s.id === currentSurah.id);
    handleSurahSelect(surahsData[(idx - 1 + surahsData.length) % surahsData.length]);
  };

  const handleSurahSelect = (s: typeof surahsData[0]) => {
    setCurrentSurah(s);
    setIsPlaying(true);
    addToHistory(s.id);
    lastAwardedTime.current = 0;
  };

  const downloadSurah = () => {
    const sId = currentSurah.id.toString().padStart(3, "0");
    const url = `https://${selectedReciter.mp3quranServer}/${sId}.mp3`;
    const a = document.createElement("a");
    a.href = url; a.download = `Surah_${currentSurah.transliteration}.mp3`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (a) a.currentTime = (parseFloat(e.target.value) / 100) * a.duration;
  };

  /* ── Player bottom offset: above Navigation ── */
  const playerBottom = NAV_H; // px

  return (
    <div
      dir="rtl"
      className="h-full w-full flex flex-col font-['Tajawal'] overflow-hidden text-foreground relative"
      style={{ background: "transparent" }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => {
          if (isRepeat) {
            if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); }
          } else { handleNext(); }
          claimSurahCompletionPoints(currentSurah.id, 10);
        }}
        preload="auto"
      />

      {/* ══════════════════════════════════════════
          LAYOUT: sidebar (lg) + main
      ══════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:flex w-60 shrink-0 flex-col gap-6 p-6 border-r border-border/40 bg-card/40 backdrop-blur-xl overflow-y-auto no-scrollbar">
          {/* Brand */}
          <div className="flex items-center gap-2.5 text-primary">
            <Headphones className="w-5 h-5" />
            <span className="text-base font-black tracking-tight">صوتيات القرآن</span>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            {[
              { key: "all", label: "جميع السور", icon: ListMusic },
              { key: "favorites", label: "المفضلة", icon: Heart },
              { key: "recent", label: "آخر استماع", icon: Clock },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-right ${
                  activeTab === key
                    ? "bg-primary/15 text-primary"
                    : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="h-px bg-border/50" />

          {/* Reciter picker */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-3">القارئ</p>
            <button
              onClick={() => setShowReciters(true)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-all text-right"
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Headphones className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm font-bold truncate flex-1">{selectedReciter.name}</span>
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Now-playing hero (desktop) / compact hero (mobile) ── */}
          <div className="shrink-0 px-4 lg:px-8 pt-4 pb-3 flex items-center gap-4 border-b border-border/30 bg-gradient-to-b from-primary/5 to-transparent">
            {/* Album art */}
            <div className={`shrink-0 rounded-xl overflow-hidden bg-card border border-border/50 relative flex items-center justify-center shadow-lg
              w-14 h-14 lg:w-20 lg:h-20`}>
              <div className="absolute inset-0 islamic-pattern opacity-10 pointer-events-none" />
              <Disc className={`w-7 h-7 lg:w-10 lg:h-10 text-primary/50 ${isPlaying ? "animate-spin-slow" : ""}`} />
              <span className="absolute bottom-1 right-1 text-[8px] bg-black/50 backdrop-blur-sm text-white px-1 rounded font-bold">HQ</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mb-0.5">تلاوة قرآنية</p>
              <h2 className="text-lg lg:text-2xl font-black font-['Amiri'] leading-tight truncate">
                سورة {currentSurah.name}
              </h2>
              <button
                onClick={() => setShowReciters(true)}
                className="flex items-center gap-1.5 mt-1 group"
              >
                <span className="text-xs text-foreground/50 group-hover:text-primary transition-colors font-bold">
                  {selectedReciter.name}
                </span>
                <span className="text-foreground/30 text-xs">• {currentSurah.total_verses} آية</span>
              </button>
            </div>

            {/* Desktop action buttons */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => toggleFavorite(currentSurah.id)}
                className={`p-2 rounded-full transition-all ${
                  favorites.includes(currentSurah.id)
                    ? "text-primary bg-primary/10"
                    : "text-foreground/30 hover:text-foreground"
                }`}
              >
                <Heart className={`w-4 h-4 ${favorites.includes(currentSurah.id) ? "fill-current" : ""}`} />
              </button>
              <button
                onClick={downloadSurah}
                className="p-2 rounded-full text-foreground/30 hover:text-foreground transition-all"
                title="تحميل"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile: play button in hero */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 shrink-0 hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying
                ? <Pause className="w-4 h-4 fill-current" />
                : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
            </button>
          </div>

          {/* ── Mobile quick actions row ── */}
          <div className="lg:hidden flex items-center justify-between px-4 py-2 border-b border-border/20">
            <div className="flex gap-1">
              {[
                { key: "all", label: "الكل", icon: ListMusic },
                { key: "favorites", label: "المفضلة", icon: Heart },
                { key: "recent", label: "الأخيرة", icon: Clock },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                    activeTab === key
                      ? "bg-primary/15 text-primary"
                      : "text-foreground/40 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReciters(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-foreground/5 text-foreground/50 text-[11px] font-bold hover:bg-foreground/10 transition-all"
            >
              <Headphones className="w-3 h-3" />
              <span className="truncate max-w-[80px]">{selectedReciter.name}</span>
            </button>
          </div>

          {/* ── Search ── */}
          <div className="px-4 lg:px-8 pt-3 pb-2 shrink-0">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث عن سورة..."
                className="w-full bg-foreground/5 border border-border/50 rounded-full py-2 pr-9 pl-4 text-sm outline-none focus:border-primary/60 focus:bg-foreground/5 transition-all placeholder:text-foreground/30 font-bold"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2">
                  <X className="w-3 h-3 text-foreground/40" />
                </button>
              )}
            </div>
          </div>

          {/* ── Track list ── */}
          <div
            className="flex-1 overflow-y-auto no-scrollbar px-2 lg:px-6"
            style={{ paddingBottom: `${playerBottom + 100}px` }}
          >
            {/* Table header */}
            <div className="flex items-center px-3 py-2 text-[10px] font-black text-foreground/25 uppercase tracking-widest border-b border-border/20 mb-1">
              <div className="w-9 text-center">#</div>
              <div className="flex-1 text-right">السورة</div>
              <div className="w-16 text-center hidden sm:block">الآيات</div>
              <div className="w-9" />
            </div>

            <div className="space-y-0.5">
              {allFiltered.map((s) => {
                const active = s.id === currentSurah.id;
                const isFav = favorites.includes(s.id);
                return (
                  <motion.div
                    key={s.id}
                    layout
                    onClick={() => handleSurahSelect(s)}
                    className={`group flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-colors select-none ${
                      active ? "bg-primary/10" : "hover:bg-foreground/5 active:bg-foreground/8"
                    }`}
                  >
                    {/* Index / playing indicator */}
                    <div className="w-9 text-center flex items-center justify-center shrink-0">
                      {active && isPlaying ? (
                        <div className="flex items-end justify-center gap-[2px] h-4">
                          <div className="w-[3px] rounded-sm bg-primary animate-music-bar" style={{ animationDelay: "0ms" }} />
                          <div className="w-[3px] rounded-sm bg-primary animate-music-bar" style={{ animationDelay: "150ms" }} />
                          <div className="w-[3px] rounded-sm bg-primary animate-music-bar" style={{ animationDelay: "300ms" }} />
                        </div>
                      ) : (
                        <span className={`text-xs font-bold tabular-nums ${active ? "text-primary" : "text-foreground/25 group-hover:text-foreground/50"}`}>
                          {s.id}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0 text-right px-2">
                      <p className={`text-sm font-black truncate font-arabic leading-tight ${active ? "text-primary" : "text-foreground"}`}>
                        {s.name}
                      </p>
                      <p className="text-[11px] text-foreground/35 truncate">{s.transliteration}</p>
                    </div>

                    {/* Verses count */}
                    <div className="w-16 text-center hidden sm:block">
                      <span className="text-[11px] text-foreground/30 font-bold">{s.total_verses} آية</span>
                    </div>

                    {/* Favorite */}
                    <div className="w-9 flex items-center justify-center shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); toggleFavorite(s.id); }}
                        className={`p-1.5 rounded-full transition-all ${
                          isFav
                            ? "text-primary opacity-100"
                            : "text-foreground/20 opacity-0 group-hover:opacity-100 hover:text-foreground/60"
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {allFiltered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                  <Search className="w-8 h-8 text-foreground/15" />
                  <p className="text-sm text-foreground/30 font-bold">لا توجد سور تطابق بحثك</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          BOTTOM PLAYER — sits above Navigation bar
      ══════════════════════════════════════════ */}
      <div
        className="fixed left-0 right-0 z-[900] bg-card/95 backdrop-blur-2xl border-t border-border/60 shadow-[0_-8px_32px_rgba(0,0,0,0.25)]"
        style={{ bottom: `${playerBottom}px` }}
      >
        {/* Progress bar (thin, full-width, on top of player) */}
        <div
          className="relative w-full h-1 bg-foreground/8 cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = 1 - (e.clientX - rect.left) / rect.width; // RTL
            const a = audioRef.current;
            if (a) a.currentTime = ratio * a.duration;
          }}
        >
          <div
            className="absolute inset-y-0 right-0 bg-primary/70 group-hover:bg-primary transition-colors"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-all scale-50 group-hover:scale-100" />
          </div>
          <input
            type="range" min="0" max="100" value={progress}
            onChange={seek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>

        {/* Player content */}
        <div className="flex items-center px-3 lg:px-6 h-16 gap-3">

          {/* Now playing info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 lg:flex-none lg:w-56">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-background border border-border/50 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 islamic-pattern opacity-10 pointer-events-none" />
              <Disc className={`w-5 h-5 text-primary/50 ${isPlaying ? "animate-spin-slow" : ""}`} />
            </div>
            <div className="min-w-0 flex-1 text-right">
              <p className="text-xs font-black truncate leading-tight">سورة {currentSurah.name}</p>
              <p className="text-[10px] text-foreground/40 truncate font-bold">{selectedReciter.name}</p>
            </div>
            {/* Volume control (Mobile/Compact) */}
            <div className="flex items-center lg:hidden gap-1.5">
              <button onClick={() => setIsMuted(!isMuted)} className="p-1.5 shrink-0 text-foreground/25 hover:text-foreground/60 transition-colors">
                {isMuted || volume === 0
                  ? <VolumeX className="w-4 h-4 text-red-400" />
                  : volume < 0.4
                    ? <Volume1 className="w-4 h-4" />
                    : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="relative w-16 h-1 bg-foreground/10 rounded-full group cursor-pointer" dir="ltr">
                <div
                  className="absolute inset-y-0 left-0 bg-foreground/50 group-hover:bg-primary transition-colors rounded-full"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-2.5 h-2.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-all scale-50 group-hover:scale-100 pointer-events-none" />
                </div>
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    if (val > 0 && isMuted) setIsMuted(false);
                  }}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                />
              </div>
            </div>

            {/* Fav on mobile */}
            <button
              onClick={() => toggleFavorite(currentSurah.id)}
              className={`p-1.5 shrink-0 transition-all ${
                favorites.includes(currentSurah.id) ? "text-primary" : "text-foreground/25 hover:text-foreground/60"
              }`}
            >
              <Heart className={`w-4 h-4 ${favorites.includes(currentSurah.id) ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Centre controls */}
          <div className="flex items-center gap-2 lg:gap-4 mx-auto lg:mx-0">
            {/* Shuffle — hidden on small mobile */}
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`hidden sm:flex p-1.5 rounded-full transition-all ${
                isShuffle ? "text-primary" : "text-foreground/30 hover:text-foreground"
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={handlePrev}
              className="p-1.5 text-foreground/60 hover:text-foreground transition-colors hover:scale-110 active:scale-95"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 bg-foreground text-background rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              {isPlaying
                ? <Pause className="w-4 h-4 fill-current" />
                : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
            </button>

            <button
              onClick={handleNext}
              className="p-1.5 text-foreground/60 hover:text-foreground transition-colors hover:scale-110 active:scale-95"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat — hidden on small mobile */}
            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`hidden sm:flex p-1.5 rounded-full transition-all ${
                isRepeat ? "text-primary" : "text-foreground/30 hover:text-foreground"
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Right: time + volume (desktop) */}
          <div className="hidden lg:flex items-center justify-end gap-3 w-56">
            <span className="text-[10px] text-foreground/30 tabular-nums">
              {fmt(currentTime)} / {fmt(duration)}
            </span>
            <button onClick={() => setIsMuted(!isMuted)} className="text-foreground/40 hover:text-foreground transition-colors">
              {isMuted || volume === 0
                ? <VolumeX className="w-4 h-4 text-red-400" />
                : volume < 0.4
                  ? <Volume1 className="w-4 h-4" />
                  : <Volume2 className="w-4 h-4" />}
            </button>
            <div className="relative w-20 h-1.5 bg-foreground/10 rounded-full group cursor-pointer" dir="ltr">
              <div
                className="absolute inset-y-0 left-0 bg-foreground/50 group-hover:bg-primary transition-colors rounded-full"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 shadow-md transition-all scale-50 group-hover:scale-100 pointer-events-none" />
              </div>
              <input
                type="range" min="0" max="1" step="0.01"
                value={isMuted ? 0 : volume}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (val > 0 && isMuted) setIsMuted(false);
                }}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RECITER DRAWER
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {showReciters && (
          <div className="fixed inset-0 z-[2000] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowReciters(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-md bg-card rounded-t-3xl border-t border-border overflow-hidden flex flex-col shadow-2xl"
              style={{ maxHeight: "75dvh" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-8 h-1 bg-foreground/15 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 pb-3 pt-1 flex items-center justify-between shrink-0 border-b border-border/50">
                <button
                  onClick={() => setShowReciters(false)}
                  className="p-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
                >
                  <X className="w-4 h-4 text-foreground/40" />
                </button>
                <h3 className="text-base font-black">اختر القارئ</h3>
                <div className="w-8" />
              </div>

              {/* Search */}
              <div className="px-4 py-3 shrink-0 border-b border-border/30">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30 pointer-events-none" />
                  <input
                    value={reciterSearch}
                    onChange={e => setReciterSearch(e.target.value)}
                    placeholder="ابحث عن قارئ..."
                    className="w-full bg-foreground/5 border border-border/50 rounded-xl py-2 pr-9 pl-9 text-sm outline-none focus:border-primary/60 transition-all placeholder:text-foreground/30 font-bold text-right"
                  />
                  {reciterSearch && (
                    <button onClick={() => setReciterSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2">
                      <X className="w-3.5 h-3.5 text-foreground/40 hover:text-foreground transition-colors" />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-0.5">
                {filteredReciters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <Search className="w-8 h-8 text-foreground/15" />
                    <p className="text-sm text-foreground/30 font-bold">لا يوجد قراء بهذا الاسم</p>
                    <button
                      onClick={() => setReciterSearch("")}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      مسح البحث
                    </button>
                  </div>
                ) : (
                  filteredReciters.map(r => {
                    const sel = selectedReciter.id === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => { setSelectedReciter(r); setShowReciters(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-right ${
                          sel ? "bg-primary/10 text-primary" : "hover:bg-foreground/5 text-foreground/70"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          sel ? "bg-primary/20 text-primary" : "bg-foreground/8 text-foreground/40"
                        }`}>
                          <Mic2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-bold flex-1 truncate">{r.name}</span>
                        {sel && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
