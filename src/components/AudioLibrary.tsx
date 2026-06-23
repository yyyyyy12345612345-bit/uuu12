"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { RECITERS } from "@/data/reciters";
import {
  Play, Pause, SkipBack, SkipForward, Search,
  Headphones, Repeat, Shuffle,
  Disc, X, Heart, Volume2, Volume1, VolumeX,
  Clock, ChevronDown, ListMusic, Mic2, Share2, Download, Crown, Timer, Gauge
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
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

/* ─── NAV HEIGHT (px) ─── */
const NAV_H = 72;

// Popular reciters shown in the left column with list stats
const POPULAR_RECITERS = [
  { id: "maher", name: "ماهر المعيقلي", avatar: "https://i1.sndcdn.com/avatars-000494420079-s0l1ii-t240x240.jpg", listens: "12.7M" },
  { id: "sds", name: "عبدالرحمن السديس", avatar: "https://i1.sndcdn.com/avatars-000305886650-tq3lsq-t240x240.jpg", listens: "9.8M" },
  { id: "shur", name: "سعود الشريم", avatar: "https://i1.sndcdn.com/avatars-000132338573-04w9l7-t240x240.jpg", listens: "8.3M" },
  { id: "afasy", name: "مشاري العفاسي", avatar: "https://i1.sndcdn.com/avatars-000216174152-jyp76f-t240x240.jpg", listens: "7.1M" },
  { id: "yasser", name: "ياسر الدوسري", avatar: "https://i1.sndcdn.com/avatars-000481223403-xspmgo-t240x240.jpg", listens: "6.7M" },
  { id: "ajm", name: "أحمد بن علي العجمي", avatar: "https://i1.sndcdn.com/avatars-000109780182-p7y96l-t240x240.jpg", listens: "4.9M" },
  { id: "minsh_murattal", name: "محمد صديق المنشاوي", avatar: "https://i1.sndcdn.com/avatars-000196884639-65w2a5-t240x240.jpg", listens: "4.2M" },
  { id: "basit_murattal", name: "عبدالباسط عبدالصمد", avatar: "https://i1.sndcdn.com/avatars-000078204618-bnghba-t240x240.jpg", listens: "3.8M" }
];

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
  const [user, setUser] = useState<any>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "recent">("all");
  const [sortOrder, setSortOrder] = useState<"default" | "alphabetical" | "verses">("default");
  
  // Sleep Timer state (in seconds)
  const [sleepTimeLeft, setSleepTimeLeft] = useState<number | null>(null);
  
  // Playback speed state
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

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
    if (audio) {
      audio.volume = volume;
      audio.muted = isMuted;
    }
    localStorage.setItem("audio_player_volume", volume.toString());
    localStorage.setItem("audio_player_muted", isMuted.toString());
  }, [volume, isMuted, currentSurah, selectedReciter]);

  /* ── Playback rate persistence ── */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, currentSurah, selectedReciter]);

  /* ── Sleep Timer effect ── */
  useEffect(() => {
    if (sleepTimeLeft === null) return;
    if (sleepTimeLeft <= 0) {
      setIsPlaying(false);
      setSleepTimeLeft(null);
      return;
    }
    const timer = setTimeout(() => {
      setSleepTimeLeft(sleepTimeLeft - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [sleepTimeLeft]);

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
          setFavorites(favs);
          setRecentlyPlayed(hist);
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
      } catch (e) {
        console.error(e);
      }
    }
  };

  const addToHistory = async (id: number) => {
    const newH = [id, ...recentlyPlayed.filter(h => h !== id)].slice(0, 20);
    setRecentlyPlayed(newH);
    localStorage.setItem("quran_history", JSON.stringify(newH));
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), { audioHistory: newH });
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Prepend current custom reciter if not in popular ones
  const recitersToShow = useMemo(() => {
    const base = [...POPULAR_RECITERS];
    const isPopular = base.some(r => r.id === selectedReciter.id);
    if (!isPopular) {
      base.unshift({
        id: selectedReciter.id,
        name: selectedReciter.name,
        avatar: "https://api.dicebear.com/9.x/initials/svg?seed=" + encodeURIComponent(selectedReciter.name),
        listens: "مخصص"
      });
    }
    return base;
  }, [selectedReciter]);

  /* ── Derived lists ── */
  const allFiltered = useMemo(() => {
    let list = [...surahsData];
    if (activeTab === "favorites") list = list.filter(s => favorites.includes(s.id));
    if (activeTab === "recent") {
      const ids = recentlyPlayed;
      list = ids.map(id => surahsData.find(s => s.id === id)!).filter(Boolean);
    }
    
    // Applying Search
    if (search.trim()) {
      const queryNormalized = normalizeArabic(search);
      const queryWords = queryNormalized.split(" ").filter(Boolean);
      list = list.filter(s => {
        const normalizedName = normalizeArabic(s.name);
        const normalizedTrans = s.transliteration.toLowerCase();
        return queryWords.every(word =>
          normalizedName.includes(word) || normalizedTrans.includes(word.toLowerCase())
        );
      });
    }

    // Applying Sort Order
    if (sortOrder === "alphabetical") {
      list.sort((a, b) => a.name.localeCompare(b.name, "ar"));
    } else if (sortOrder === "verses") {
      list.sort((a, b) => b.total_verses - a.total_verses);
    }

    return list;
  }, [search, activeTab, favorites, recentlyPlayed, sortOrder]);

  const filteredReciters = useMemo(() => {
    if (!reciterSearch.trim()) return RECITERS;
    const queryNormalized = normalizeArabic(reciterSearch);
    const queryWords = queryNormalized.split(" ").filter(Boolean);
    return RECITERS.filter(r => {
      const reciterNameNormalized = normalizeArabic(r.name);
      return queryWords.every(word => {
        if (reciterNameNormalized.includes(word)) return true;
        const reciterNoSpaces = reciterNameNormalized.replace(/\s/g, "");
        const wordNoSpaces = word.replace(/\s/g, "");
        return reciterNoSpaces.includes(wordNoSpaces);
      });
    });
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
    a.href = url;
    a.download = `Surah_${currentSurah.transliteration}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `سورة ${currentSurah.name}`,
        text: `استمع إلى سورة ${currentSurah.name} بصوت القارئ ${selectedReciter.name} عبر منصة يقين القرآنية`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("تم نسخ رابط الصفحة لمشاركتها!");
    }
  };

  const toggleSleepTimer = () => {
    // Cycles: Off -> 15m (900s) -> 30m (1800s) -> 45m (2700s) -> 60m (3600s)
    if (sleepTimeLeft === null) setSleepTimeLeft(900);
    else if (sleepTimeLeft === 900) setSleepTimeLeft(1800);
    else if (sleepTimeLeft === 1800) setSleepTimeLeft(2700);
    else if (sleepTimeLeft === 2700) setSleepTimeLeft(3600);
    else setSleepTimeLeft(null);
  };

  const togglePlaybackSpeed = () => {
    // Cycles: 1.0x -> 1.25x -> 1.5x -> 2.0x
    if (playbackSpeed === 1.0) setPlaybackSpeed(1.25);
    else if (playbackSpeed === 1.25) setPlaybackSpeed(1.5);
    else if (playbackSpeed === 1.5) setPlaybackSpeed(2.0);
    else setPlaybackSpeed(1.0);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (a) a.currentTime = (parseFloat(e.target.value) / 100) * a.duration;
  };

  // Mock static surah listen duration matching screenshot
  const mockDurations: Record<number, string> = {
    1: "2:17",
    2: "1:37:18",
    3: "51:12",
    4: "48:33",
    5: "38:19",
    6: "43:07"
  };

  const getSurahDuration = (id: number, totalVerses: number) => {
    return mockDurations[id] || fmt(totalVerses * 15);
  };

  // Progress circle configuration for right column mini player
  const miniRadius = 24;
  const miniCircumference = 2 * Math.PI * miniRadius;
  const miniStrokeDashoffset = miniCircumference - (progress / 100) * miniCircumference;

  // Waveform Bar count
  const waveBarCount = 45;

  return (
    <div
      dir="rtl"
      className="h-full w-full flex flex-col font-['Tajawal'] overflow-hidden text-foreground relative bg-[#0c0d10]"
    >
      <audio
        ref={audioRef}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => {
          if (isRepeat) {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            }
          } else {
            handleNext();
          }
          claimSurahCompletionPoints(currentSurah.id, 10);
        }}
        preload="auto"
      />

      {/* ══════════════════════════════════════════
          MAIN 3-COLUMN LAYOUT
      ══════════════════════════════════════════ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6 p-4 lg:p-6 overflow-hidden h-full">

        {/* ── COLUMN 1: LEFT SIDEBAR (الشيوخ) ── */}
        <aside className="hidden lg:flex flex-col gap-5 p-4 rounded-3xl bg-[#0e0f12]/50 border border-white/5 overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between py-1 relative">
            <div className="absolute right-0 left-0 top-1/2 h-px bg-white/5 -z-10" />
            <div className="bg-[#0f1015] px-4 mx-auto flex items-center gap-2 text-white/70">
              <span className="text-xs font-black tracking-wider font-arabic">الشيوخ</span>
              <Headphones className="w-3.5 h-3.5 text-[#e2b43b]" />
            </div>
          </div>

          {/* List */}
          <div className="flex-col flex gap-2 flex-1">
            {recitersToShow.map((rec) => {
              const isActive = selectedReciter.id === rec.id;
              return (
                <div
                  key={rec.id}
                  onClick={() => {
                    const matched = RECITERS.find(r => r.id === rec.id);
                    if (matched) setSelectedReciter(matched);
                  }}
                  className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-[#e2b43b]/10 to-transparent border border-[#e2b43b]/20 shadow-[0_4px_20px_rgba(226,180,59,0.05)]"
                      : "hover:bg-white/[0.02] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full overflow-hidden border transition-all ${
                      isActive ? "border-[#e2b43b] scale-105" : "border-white/10 group-hover:border-white/20"
                    }`}>
                      <img src={rec.avatar} alt={rec.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Meta */}
                    <div className="text-right">
                      <p className={`text-xs font-black transition-colors ${isActive ? "text-[#e2b43b]" : "text-white/80 group-hover:text-white"}`}>
                        {rec.name.split(" ").slice(0, 3).join(" ")}
                      </p>
                      <p className="text-[10px] text-white/30 font-bold mt-0.5">استماع {rec.listens}</p>
                    </div>
                  </div>

                  {/* Play Button */}
                  <button className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-[#e2b43b] text-black shadow-lg shadow-[#e2b43b]/20 scale-105"
                      : "bg-white/5 text-white/50 group-hover:bg-white/10 group-hover:text-white"
                  }`}>
                    {isActive && isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current translate-x-[1px]" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Show More */}
          <button
            onClick={() => setShowReciters(true)}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-2xl text-xs font-black tracking-wider transition-all flex items-center justify-center gap-2 border border-white/5 active:scale-95"
          >
            <span>عرض المزيد</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </aside>

        {/* ── COLUMN 2: CENTER PANEL (المشغل وقائمة السور) ── */}
        <div className="flex flex-col gap-6 overflow-y-auto no-scrollbar min-w-0">

          {/* 1. Large Main Player Widget */}
          <div className="relative rounded-[2.5rem] bg-gradient-to-b from-[#14151a] to-[#0b0c0f] border border-white/5 p-6 lg:p-8 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-6">
            {/* Background pattern */}
            <div className="absolute inset-0 islamic-pattern opacity-[0.015] pointer-events-none" />

            {/* Album image on the right (RTL) */}
            <div className="relative w-32 h-32 lg:w-36 lg:h-36 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shrink-0 group">
              <img
                src="https://images.unsplash.com/photo-1609599006353-e629ababfeae?auto=format&fit=crop&q=80&w=240&h=240"
                alt="Quran"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Disc className={`w-8 h-8 text-[#e2b43b] ${isPlaying ? "animate-spin-slow" : ""}`} />
              </div>
            </div>

            {/* Content info & Waveform player */}
            <div className="flex-1 w-full text-center md:text-right flex flex-col gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">جاري الاستماع الآن</p>
                <h2 className="text-2xl lg:text-3xl font-black font-arabic text-white mb-2 leading-none">
                  سورة {currentSurah.name}
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-2 text-white/50 text-xs font-bold">
                  <span className="text-[#e2b43b] font-black">{selectedReciter.name}</span>
                  <span>•</span>
                  <span>{currentSurah.total_verses} آية</span>
                </div>
              </div>

              {/* Progress Slider & Timeline */}
              <div className="space-y-2.5">
                {/* Waveform Visualization */}
                <div className="flex items-center justify-between gap-[2px] h-8 w-full" dir="ltr">
                  {Array.from({ length: waveBarCount }).map((_, i) => {
                    const isActive = (i / waveBarCount) * 100 <= progress;
                    // Deterministic beautiful wave shape
                    const height = 10 + Math.sin(i * 0.45) * 12 + (i % 4 === 0 ? 8 : 0);
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          const a = audioRef.current;
                          if (a) {
                            a.currentTime = (i / waveBarCount) * a.duration;
                          }
                        }}
                        className={`w-[3px] rounded-full transition-all duration-300 cursor-pointer ${
                          isActive
                            ? "bg-[#e2b43b]"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}
                </div>

                {/* Progress bar input (Invisible overlay on wave for smooth touch, or basic time display) */}
                <div className="flex items-center justify-between text-[11px] font-black text-white/30 tabular-nums">
                  <span>{fmt(currentTime)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 mt-1 border-t border-white/5 pt-4">
                {/* Play Button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-[#e2b43b] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#e2b43b]/10"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current translate-x-[1px]" />
                  )}
                </button>

                {/* Controls */}
                <button
                  onClick={handlePrev}
                  className="p-3 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-95"
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-3 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-95"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>
                <button
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={`p-3 rounded-full transition-all ${isShuffle ? "text-[#e2b43b] bg-[#e2b43b]/10" : "text-white/30 hover:text-white"}`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={`p-3 rounded-full transition-all ${isRepeat ? "text-[#e2b43b] bg-[#e2b43b]/10" : "text-white/30 hover:text-white"}`}
                >
                  <Repeat className="w-4 h-4" />
                </button>

                <div className="h-6 w-px bg-white/5 mx-2" />

                {/* Extra actions */}
                <button
                  onClick={handleShare}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-black transition-all flex items-center gap-2 border border-white/5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>مشاركة</span>
                </button>

                <button
                  onClick={() => toggleFavorite(currentSurah.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 border ${
                    favorites.includes(currentSurah.id)
                      ? "bg-[#e2b43b]/10 border-[#e2b43b]/20 text-[#e2b43b]"
                      : "bg-white/5 border-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${favorites.includes(currentSurah.id) ? "fill-current" : ""}`} />
                  <span>المفضلة</span>
                </button>

                <button
                  onClick={downloadSurah}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-black transition-all flex items-center gap-2 border border-white/5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل</span>
                </button>

                {/* HQ Indicator */}
                <div className="mr-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e2b43b]/10 border border-[#e2b43b]/20 text-[#e2b43b] text-[10px] font-black tracking-wider">
                  <span>HQ</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Surah Table & Search Panel */}
          <div className="flex flex-col gap-4">
            {/* Search and Filters row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث عن سورة أو شيخ..."
                  className="w-full bg-[#121318]/50 border border-white/5 rounded-2xl py-3.5 pr-11 pl-4 text-sm outline-none focus:border-[#e2b43b]/40 focus:bg-[#121318] transition-all placeholder:text-white/25 text-white font-bold text-right"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute left-4 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-white/40 hover:text-white" />
                  </button>
                )}
              </div>

              {/* Tabs list */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { key: "all", label: "الكل" },
                  { key: "favorites", label: "المفضلة" },
                  { key: "recent", label: "الأكثر استماعاً" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                      activeTab === key
                        ? "bg-[#e2b43b] text-black shadow-lg shadow-[#e2b43b]/10"
                        : "bg-[#121318]/50 border border-white/5 text-white/40 hover:text-white hover:bg-white/[0.02]"
                    }`}
                  >
                    {label}
                  </button>
                ))}

                {/* Sort Order Toggles */}
                <button
                  onClick={() => setSortOrder(sortOrder === "alphabetical" ? "default" : "alphabetical")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                    sortOrder === "alphabetical"
                      ? "bg-[#e2b43b]/10 border-[#e2b43b]/20 text-[#e2b43b]"
                      : "bg-[#121318]/50 border-white/5 text-white/40 hover:text-white"
                  }`}
                >
                  الفهرسات
                </button>
                <button
                  onClick={() => setSortOrder(sortOrder === "verses" ? "default" : "verses")}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                    sortOrder === "verses"
                      ? "bg-[#e2b43b]/10 border-[#e2b43b]/20 text-[#e2b43b]"
                      : "bg-[#121318]/50 border-white/5 text-white/40 hover:text-white"
                  }`}
                >
                  ترتيب السور
                </button>
              </div>
            </div>

            {/* Surah List Table */}
            <div className="rounded-[2rem] bg-[#121318]/20 border border-white/5 overflow-hidden">
              {/* Header */}
              <div className="flex items-center px-6 py-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                <div className="w-10 text-center">#</div>
                <div className="flex-1 text-right">السورة</div>
                <div className="w-20 text-center">آيات</div>
                <div className="w-28 text-center">مدة الاستماع</div>
                <div className="w-12" />
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/5">
                {allFiltered.map((surah) => {
                  const isCurrent = surah.id === currentSurah.id;
                  const isFav = favorites.includes(surah.id);
                  return (
                    <div
                      key={surah.id}
                      onClick={() => handleSurahSelect(surah)}
                      className={`group flex items-center px-6 py-4 cursor-pointer transition-all duration-300 ${
                        isCurrent
                          ? "bg-gradient-to-r from-[#e2b43b]/10 via-[#e2b43b]/5 to-transparent text-[#e2b43b]"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Index / Play status */}
                      <div className="w-10 text-center flex items-center justify-center shrink-0">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end justify-center gap-[2.5px] h-4">
                            <div className="w-[3px] rounded-sm bg-[#e2b43b] animate-music-bar" style={{ animationDelay: "0ms" }} />
                            <div className="w-[3px] rounded-sm bg-[#e2b43b] animate-music-bar" style={{ animationDelay: "150ms" }} />
                            <div className="w-[3px] rounded-sm bg-[#e2b43b] animate-music-bar" style={{ animationDelay: "300ms" }} />
                          </div>
                        ) : (
                          <span className={`text-xs font-black tabular-nums transition-colors ${isCurrent ? "text-[#e2b43b]" : "text-white/20 group-hover:text-white/50"}`}>
                            {surah.id}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 text-right min-w-0 px-3">
                        <p className={`text-sm font-black font-arabic leading-tight ${isCurrent ? "text-[#e2b43b]" : "text-white"}`}>
                          {surah.name}
                        </p>
                        <p className="text-[10px] text-white/30 font-bold mt-0.5 truncate">{surah.transliteration}</p>
                      </div>

                      {/* Verses */}
                      <div className="w-20 text-center font-bold text-xs text-white/40 group-hover:text-white/60">
                        {surah.total_verses}
                      </div>

                      {/* Mock Duration */}
                      <div className="w-28 text-center font-black text-xs text-white/40 group-hover:text-white/60 tabular-nums">
                        {getSurahDuration(surah.id, surah.total_verses)}
                      </div>

                      {/* Favorite button */}
                      <div className="w-12 flex items-center justify-center shrink-0">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggleFavorite(surah.id);
                          }}
                          className={`p-2 rounded-full transition-all ${
                            isFav
                              ? "text-[#e2b43b]"
                              : "text-white/15 opacity-0 group-hover:opacity-100 hover:text-white/60"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {allFiltered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                    <Search className="w-10 h-10 text-white/10" />
                    <p className="text-sm text-white/35 font-bold">لا توجد سور مطابقة لبحثك</p>
                  </div>
                )}
              </div>
            </div>

            {/* Show More */}
            <button className="w-full py-4 rounded-[2rem] bg-[#121318]/10 hover:bg-[#121318]/25 text-white/40 hover:text-white border border-white/5 text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              <span>عرض المزيد</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── COLUMN 3: RIGHT COLUMN (التنقل والدعم والمصغر) ── */}
        <aside className="hidden lg:flex flex-col gap-6 overflow-y-auto no-scrollbar">

          {/* 1. Navigation / Filters Card */}
          <div className="rounded-[2rem] bg-[#121318]/50 border border-white/5 p-5 flex flex-col gap-1.5 shadow-xl">
            <div className="flex items-center justify-end gap-2.5 px-3 py-2 text-white/40 mb-2 border-b border-white/5 pb-3">
              <span className="text-xs font-black font-arabic">صوتيات القرآن</span>
              <Headphones className="w-4 h-4 text-[#e2b43b]" />
            </div>

            {[
              { key: "all", label: "جميع السور", icon: ListMusic },
              { key: "favorites", label: "المفضلة", icon: Heart },
              { key: "recent", label: "آخر استماع", icon: Clock },
              { key: "download", label: "التنزيلات", icon: Download, action: downloadSurah },
              { key: "playlist", label: "قائمة التشغيل", icon: ListMusic },
            ].map(({ key, label, icon: Icon, action }) => {
              const active = activeTab === key || (key === "playlist" && activeTab === "all");
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (action) action();
                    else if (key !== "playlist") setActiveTab(key as any);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black transition-all text-right ${
                    active
                      ? "bg-[#e2b43b] text-black shadow-lg shadow-[#e2b43b]/10"
                      : "text-white/50 hover:text-white hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 2. Mini Player Widget (جاري الاستماع) */}
          <div className="rounded-[2rem] bg-[#121318]/50 border border-white/5 p-5 flex flex-col gap-4 shadow-xl text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">جاري الاستماع</span>

            {/* Circular Progress & Disc */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              {/* Outer Circular SVG Progress */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="56" cy="56" r={miniRadius}
                  className="stroke-white/5 fill-none"
                  strokeWidth="4"
                />
                <circle
                  cx="56" cy="56" r={miniRadius}
                  className="stroke-[#e2b43b] fill-none transition-all duration-300"
                  strokeWidth="4"
                  strokeDasharray={miniCircumference}
                  strokeDashoffset={miniStrokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner CD Disc Cover */}
              <div className="w-16 h-16 rounded-full bg-[#1c1e24] flex items-center justify-center border border-white/10 shadow-inner overflow-hidden relative">
                <div className="absolute inset-0 islamic-pattern opacity-10 pointer-events-none" />
                <Disc className={`w-8 h-8 text-[#e2b43b]/50 ${isPlaying ? "animate-spin-slow" : ""}`} />
                <div className="absolute w-3.5 h-3.5 bg-[#0c0d10] rounded-full border border-white/10" />
              </div>
            </div>

            {/* Info */}
            <div className="px-2">
              <h4 className="text-sm font-black font-arabic text-white leading-tight">
                سورة {currentSurah.name}
              </h4>
              <p className="text-[10px] text-white/40 font-bold mt-1">{selectedReciter.name}</p>
            </div>

            {/* Timeline simple bar */}
            <div className="px-2 space-y-1">
              <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 right-0 bg-[#e2b43b] rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] font-black text-white/20 tabular-nums">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Mini Player Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`p-2 rounded-full transition-all ${isShuffle ? "text-[#e2b43b]" : "text-white/30 hover:text-white"}`}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handlePrev}
                className="p-2 text-white/50 hover:text-white transition-colors active:scale-95"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-[#e2b43b] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#e2b43b]/10"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-[1px]" />}
              </button>
              <button
                onClick={handleNext}
                className="p-2 text-white/50 hover:text-white transition-colors active:scale-95"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>
              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={`p-2 rounded-full transition-all ${isRepeat ? "text-[#e2b43b]" : "text-white/30 hover:text-white"}`}
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Premium Settings Rows */}
            <div className="border-t border-white/5 pt-3 mt-1 flex flex-col gap-2.5">
              {/* Sleep Timer */}
              <div className="flex items-center justify-between text-xs px-2 text-right">
                <div className="flex items-center gap-2 text-white/40 font-bold">
                  <Timer className="w-4 h-4" />
                  <span>موقت إيقاف</span>
                </div>
                <button
                  onClick={toggleSleepTimer}
                  className="font-black text-[#e2b43b] bg-[#e2b43b]/10 hover:bg-[#e2b43b]/20 px-3 py-1.5 rounded-xl transition-all border border-[#e2b43b]/10 active:scale-95 text-[11px]"
                >
                  {sleepTimeLeft !== null ? fmt(sleepTimeLeft) : "إيقاف"}
                </button>
              </div>

              {/* Playback speed */}
              <div className="flex items-center justify-between text-xs px-2 text-right">
                <div className="flex items-center gap-2 text-white/40 font-bold">
                  <Gauge className="w-4 h-4" />
                  <span>سرعة الصوت</span>
                </div>
                <button
                  onClick={togglePlaybackSpeed}
                  className="font-black text-[#e2b43b] bg-[#e2b43b]/10 hover:bg-[#e2b43b]/20 px-3 py-1.5 rounded-xl transition-all border border-[#e2b43b]/10 active:scale-95 text-[11px]"
                >
                  {playbackSpeed.toFixed(2)}x
                </button>
              </div>
            </div>
          </div>

          {/* 3. Support Card (دعم تطبيق يقين) */}
          <div className="relative rounded-[2rem] bg-gradient-to-br from-[#1b1712] to-[#0c0d10] border border-[#e2b43b]/20 p-5 flex flex-col gap-4 shadow-xl overflow-hidden group">
            {/* Shine highlight */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#e2b43b]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#e2b43b]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-full bg-[#e2b43b]/10 flex items-center justify-center text-[#e2b43b] shadow-inner">
                <Crown className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-[#e2b43b] uppercase tracking-[0.25em]">دعم استمرارية يقين</span>
            </div>

            <div className="text-right space-y-1.5">
              <h4 className="text-sm font-black text-white">ادعم تطبيق يقين 👑</h4>
              <p className="text-[11px] text-white/50 leading-relaxed font-bold">
                يقين خالٍ تماماً من الإعلانات لراحتك. دعمك السخي يضمن استمرار السيرفرات وتطوير الميزات لخدمة كتاب الله.
              </p>
            </div>

            {/* Support Trigger Button */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open_subscription_modal'));
              }}
              className="w-full py-3.5 bg-[#e2b43b] hover:bg-[#c99f33] text-black font-black text-xs rounded-2xl tracking-wider transition-all shadow-lg shadow-[#e2b43b]/10 active:scale-95 flex items-center justify-center gap-2"
            >
              <span>ادعم الآن</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE BOTTOM CONTROLLER BAR
      ══════════════════════════════════════════ */}
      <div
        className="fixed left-0 right-0 z-[900] bg-[#121318]/95 backdrop-blur-2xl border-t border-white/5 shadow-[0_-8px_32px_rgba(0,0,0,0.4)] lg:hidden flex flex-col"
        style={{ bottom: `${NAV_H}px` }}
      >
        {/* Progress bar thin */}
        <div
          className="relative w-full h-1 bg-white/5 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = 1 - (e.clientX - rect.left) / rect.width;
            const a = audioRef.current;
            if (a) a.currentTime = ratio * a.duration;
          }}
        >
          <div className="absolute inset-y-0 right-0 bg-[#e2b43b]" style={{ width: `${progress}%` }} />
          <input
            type="range" min="0" max="100" value={progress}
            onChange={seek}
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
          />
        </div>

        {/* Controller items */}
        <div className="flex items-center px-4 h-16 gap-3">
          {/* Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0 text-right">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden relative">
              <div className="absolute inset-0 islamic-pattern opacity-10 pointer-events-none" />
              <Disc className={`w-4 h-4 text-[#e2b43b]/50 ${isPlaying ? "animate-spin-slow" : ""}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black truncate text-white leading-tight">سورة {currentSurah.name}</p>
              <p className="text-[9px] text-white/40 truncate font-bold">{selectedReciter.name}</p>
            </div>
          </div>

          {/* Volume button on mobile */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 text-white/40 hover:text-white shrink-0"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Playback Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handlePrev}
              className="p-2 text-white/50 hover:text-white"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-[1px]" />}
            </button>
            <button
              onClick={handleNext}
              className="p-2 text-white/50 hover:text-white"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FULL SCREEN RECITER PICKER DRAWER
      ══════════════════════════════════════════ */}
      <AnimatePresence>
        {showReciters && (
          <div className="fixed inset-0 z-[2000] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowReciters(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-md bg-[#121318] rounded-t-3xl border-t border-white/10 overflow-hidden flex flex-col shadow-2xl"
              style={{ maxHeight: "75dvh" }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-8 h-1 bg-white/10 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 pb-3 pt-1 flex items-center justify-between shrink-0 border-b border-white/5">
                <button
                  onClick={() => setShowReciters(false)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-white/40" />
                </button>
                <h3 className="text-sm font-black text-white font-arabic">اختر القارئ</h3>
                <div className="w-8" />
              </div>

              {/* Search input inside drawer */}
              <div className="px-4 py-3 shrink-0 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                  <input
                    type="text"
                    value={reciterSearch}
                    onChange={e => setReciterSearch(e.target.value)}
                    placeholder="ابحث عن قارئ..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pr-9 pl-9 text-xs outline-none focus:border-[#e2b43b]/40 focus:bg-white/[0.07] transition-all placeholder:text-white/20 font-bold text-right text-white"
                  />
                  {reciterSearch && (
                    <button onClick={() => setReciterSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-white/40 hover:text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Reciters list */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-0.5">
                {filteredReciters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <Search className="w-8 h-8 text-white/10" />
                    <p className="text-xs text-white/30 font-bold">لا يوجد قراء بهذا الاسم</p>
                  </div>
                ) : (
                  filteredReciters.map(rec => {
                    const isSel = selectedReciter.id === rec.id;
                    return (
                      <button
                        key={rec.id}
                        onClick={() => { setSelectedReciter(rec); setShowReciters(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-right ${
                          isSel ? "bg-[#e2b43b]/10 text-[#e2b43b]" : "hover:bg-white/[0.02] text-white/70"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isSel ? "bg-[#e2b43b]/20 text-[#e2b43b]" : "bg-white/5 text-white/30"
                        }`}>
                          <Mic2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-black flex-1 truncate">{rec.name}</span>
                        {isSel && <div className="w-2 h-2 rounded-full bg-[#e2b43b] shrink-0" />}
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
