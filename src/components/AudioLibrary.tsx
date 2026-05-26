"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { RECITERS } from "@/data/reciters";
import {
  Play, Pause, SkipBack, SkipForward, Search,
  Headphones, Repeat, Shuffle, ChevronDown, User,
  Disc, X, Heart, Share2, ListMusic, Volume2, Volume1, VolumeX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { setupMediaSession, setPlaybackState, updatePositionState } from "@/lib/mediaSession";
import surahsData from "@/data/surahs.json";
import { addPoints, claimSurahCompletionPoints } from "@/lib/points";

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

import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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
  const [volume, setVolume] = useState(() => {
    if (typeof window !== "undefined") {
      const savedVolume = localStorage.getItem("audio_player_volume");
      return savedVolume !== null ? parseFloat(savedVolume) : 1;
    }
    return 1;
  });
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("audio_player_muted");
      return savedMute === "true";
    }
    return false;
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const lastAwardedTime = useRef<number>(0);
  const horizontalListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
      audio.muted = isMuted;
    }
    localStorage.setItem("audio_player_volume", volume.toString());
    localStorage.setItem("audio_player_muted", isMuted.toString());
  }, [volume, isMuted, currentSurah, selectedReciter]);

  // Auth & Persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.audioFavorites) setFavorites(data.audioFavorites);
          if (data.audioHistory) setRecentlyPlayed(data.audioHistory);
        } else {
          // Fallback to local
          const saved = localStorage.getItem("quran_favorites");
          const savedHistory = localStorage.getItem("quran_history");
          const favs = saved ? JSON.parse(saved) : [];
          const hist = savedHistory ? JSON.parse(savedHistory) : [];
          setFavorites(favs);
          setRecentlyPlayed(hist);
          await setDoc(doc(db, "users", user.uid), { audioFavorites: favs, audioHistory: hist }, { merge: true });
        }
      } else {
        const saved = localStorage.getItem("quran_favorites");
        const savedHistory = localStorage.getItem("quran_history");
        if (saved) setFavorites(JSON.parse(saved));
        if (savedHistory) setRecentlyPlayed(JSON.parse(savedHistory));
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleFavorite = async (id: number) => {
    const isFav = favorites.includes(id);
    const newFavs = isFav 
      ? favorites.filter(f => f !== id) 
      : [...favorites, id];
    
    setFavorites(newFavs);
    localStorage.setItem("quran_favorites", JSON.stringify(newFavs));

    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          audioFavorites: isFav ? arrayRemove(id) : arrayUnion(id)
        });
      } catch (err) {
        console.error("Error updating favorites in cloud:", err);
      }
    }
  };

  const addToHistory = async (id: number) => {
    const newHistory = [id, ...recentlyPlayed.filter(h => h !== id)].slice(0, 10);
    setRecentlyPlayed(newHistory);
    localStorage.setItem("quran_history", JSON.stringify(newHistory));

    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          audioHistory: newHistory
        });
      } catch (err) {
        console.error("Error updating history in cloud:", err);
      }
    }
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

      // Award 1 point for every 30 seconds of active listening
      const totalSeconds = Math.floor(a.currentTime);
      if (totalSeconds > 0 && totalSeconds % 30 === 0 && lastAwardedTime.current !== totalSeconds) {
        addPoints("listen", 1);
        lastAwardedTime.current = totalSeconds;
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

  const handleSurahSelect = (s: typeof surahsData[0]) => {
      setCurrentSurah(s);
      setIsPlaying(true);
      addToHistory(s.id);
      lastAwardedTime.current = 0; // Reset timer for new surah
  };

  return (
    <div className="h-full w-full bg-transparent text-foreground overflow-y-auto lg:overflow-hidden relative font-['Tajawal'] flex flex-col lg:flex-row no-scrollbar">
      <audio 
        ref={audioRef} 
        onTimeUpdate={onTimeUpdate} 
        onEnded={() => {
          handleNext();
          claimSurahCompletionPoints(currentSurah.id, 10);
        }} 
        preload="auto" 
      />

      {/* Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#0a0a0d]/10 via-transparent to-transparent" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full" />
          <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="relative z-10 w-full h-full flex flex-col items-center p-6 lg:p-12 overflow-y-auto no-scrollbar">
          
          {/* Professional Header */}
          <div className="w-full max-w-4xl flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full border border-white/10 p-1 relative">
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-primary to-primary/40 flex items-center justify-center text-black font-black text-sm">
                          {user?.displayName?.[0] || <User className="w-5 h-5" />}
                      </div>
                      {user && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0a0a0d] rounded-full border-2 border-black flex items-center justify-center">
                              <Heart className="w-2.5 h-2.5 text-primary animate-pulse fill-current" />
                          </div>
                      )}
                  </div>
                  <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">مكتبتك الصوتية</span>
                      </div>
                      <span className="text-lg font-black truncate max-w-[200px]">{user?.displayName || "ضيف الرحمن"}</span>
                  </div>
              </div>
              
              <div className="flex items-center gap-3">
                   <a 
                    href="https://www.instagram.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 rounded-2xl bg-white/5 border border-white/5 text-white/20 hover:text-primary hover:border-primary/20 transition-all group"
                   >
                       <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                   </a>
              </div>
          </div>

          <div className="w-full max-w-4xl flex flex-col gap-12">
              
              {/* Surah Selection & Search */}
              <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                      <div className="flex flex-col">
                           <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">اختر السورة</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} 
                            className={`p-3 rounded-2xl border transition-all ${showOnlyFavorites ? 'bg-primary border-primary text-black shadow-xl shadow-primary/20 scale-105' : 'bg-white/5 border-white/5 text-white/40 hover:text-white'}`}
                          >
                              <Heart className={`w-4 h-4 ${showOnlyFavorites ? 'fill-current' : ''}`} />
                          </button>
                          <div className="relative group w-48 lg:w-64">
                               <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-primary transition-all" />
                               <input 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="ابحث..."
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pr-10 pl-4 text-xs font-bold outline-none focus:bg-white/10 focus:border-primary/40 transition-all placeholder:text-white/10"
                               />
                          </div>
                      </div>
                  </div>

                  <div ref={horizontalListRef} className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-2 -mx-2">
                      {filteredSurahs.map((s) => {
                          const active = s.id === currentSurah.id;
                          return (
                              <button 
                                key={s.id}
                                onClick={() => handleSurahSelect(s)}
                                className={`flex items-center gap-3 shrink-0 px-6 py-3 rounded-full border transition-all duration-300 group ${active ? 'bg-primary border-primary shadow-[0_0_20px_rgba(212,175,55,0.3)] scale-105' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                              >
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[11px] transition-all ${active ? 'bg-black/20 text-black shadow-inner' : 'bg-white/10 text-white group-hover:bg-primary/20 group-hover:text-primary'}`}>
                                      {s.id}
                                  </div>
                                  <span className={`text-sm font-bold font-arabic whitespace-nowrap ${active ? 'text-black' : 'text-white'}`}>{s.name}</span>
                              </button>
                          );
                      })}
                      <div className="w-20 shrink-0" />
                      {filteredSurahs.length === 0 && (
                          <div className="w-full py-10 flex flex-col items-center justify-center text-white/20 gap-3">
                               <Search className="w-8 h-8 opacity-20" />
                               <span className="text-xs font-bold italic">لا توجد سور تطابق بحثك</span>
                          </div>
                      )}
                  </div>
              </div>

              {/* Main Player Visualizer & Metadata */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                  
                  {/* Artwork / Visualizer Area */}
                  <div className="relative flex flex-col items-center justify-center">
                      <div className="relative w-64 h-64 lg:w-96 lg:h-96">
                          <div className="absolute inset-0 bg-primary/20 rounded-full blur-[60px] lg:blur-[120px] animate-pulse" />
                          <motion.div 
                            animate={{ rotate: isPlaying ? 360 : 0 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="relative w-full h-full rounded-full border-[16px] border-black p-3 overflow-hidden bg-gradient-to-br from-white/10 to-transparent shadow-[0_50px_120px_rgba(0,0,0,0.9)] flex items-center justify-center"
                          >
                              <div className="absolute inset-0 islamic-pattern opacity-10" />
                              <div className="w-full h-full rounded-full border border-white/5 flex flex-col items-center justify-center text-center p-8 lg:p-12">
                                  <Disc className={`w-12 h-12 lg:w-20 lg:h-20 text-primary/30 mb-4 lg:mb-6 ${isPlaying ? 'animate-spin-slow' : ''}`} />
                                  <span className="text-[10px] lg:text-base font-bold text-white/70 mb-2">{selectedReciter.name}</span>
                                  <span className="text-[10px] lg:text-xs font-black text-primary px-5 py-2 bg-primary/10 rounded-full font-arabic">صوت عالي الجودة</span>
                              </div>
                          </motion.div>
                          
                          {/* Recently Played History (Desktop Only - Floating) */}
                          <div className="hidden lg:flex absolute -right-20 top-1/2 -translate-y-1/2 flex-col gap-3">
                               <span className="text-[8px] font-black text-primary/40 uppercase tracking-widest vertical-text mb-2">History</span>
                               {recentlyPlayed.slice(0, 4).map(id => {
                                   const s = surahsData.find(sur => sur.id === id);
                                   if (!s) return null;
                                   return (
                                       <button 
                                            key={id}
                                            onClick={() => handleSurahSelect(s)}
                                            className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[10px] font-black transition-all hover:scale-110 hover:border-primary/40 ${s.id === currentSurah.id ? 'bg-primary text-black border-primary' : 'bg-black/40 text-white/40'}`}
                                            title={s.name}
                                       >
                                            {s.id}
                                       </button>
                                   );
                               })}
                          </div>
                      </div>
                  </div>

                  {/* Player Metadata & Controls */}
                  <div className="flex flex-col">
                      <div className="flex flex-col mb-10">
                          <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">يتم تشغيله الآن</span>
                          <h2 className="text-3xl lg:text-5xl font-black font-['Amiri'] leading-tight mb-2">سورة {currentSurah.name}</h2>
                          <div className="flex items-center gap-4 text-white/40">
                               <span className="text-sm font-bold font-arabic">عدد الآيات: {currentSurah.total_verses}</span>
                          </div>
                      </div>

                      {/* Progress */}
                      <div className="w-full space-y-5 mb-6">
                          <div className="flex justify-between items-end px-1">
                              <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">الوقت المنقضي</span>
                                  <span className="text-lg font-bold tabular-nums text-white/90">{fmt(currentTime)}</span>
                              </div>
                              <div className="text-right flex flex-col">
                                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">المدة الإجمالية</span>
                                  <span className="text-lg font-bold tabular-nums text-white/90">{fmt(duration)}</span>
                              </div>
                          </div>
                          <div className="relative h-2.5 w-full bg-white/5 rounded-full overflow-hidden group cursor-pointer border border-white/5" dir="ltr">
                              <div 
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/80 to-primary/40"
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

                      {/* Volume & Audio Controls */}
                      <div className="flex items-center justify-between mb-8 px-1">
                          <div className="flex items-center gap-2">
                              {/* Left slot can be empty or have another control */}
                          </div>
                          
                          {/* Volume Control Pill */}
                          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:bg-white/10 transition-colors">
                              <button 
                                onClick={() => setIsMuted(!isMuted)} 
                                className="text-white/60 hover:text-primary transition-colors flex items-center justify-center"
                                title={isMuted ? "إلغاء الكتم" : "كتم الصوت"}
                              >
                                  {isMuted || volume === 0 ? (
                                    <VolumeX className="w-5 h-5 text-red-400" />
                                  ) : volume < 0.4 ? (
                                    <Volume1 className="w-5 h-5" />
                                  ) : (
                                    <Volume2 className="w-5 h-5 text-primary" />
                                  )}
                              </button>
                              <div className="relative w-24 h-1.5 bg-white/10 rounded-full overflow-hidden group cursor-pointer" dir="ltr">
                                  <div 
                                    className="absolute inset-y-0 left-0 bg-primary"
                                    style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                                  />
                                  <input 
                                    type="range" min="0" max="1" step="0.01" 
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setVolume(val);
                                        if (val > 0 && isMuted) {
                                            setIsMuted(false);
                                        }
                                    }}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                  />
                              </div>
                              <span className="text-[10px] font-bold text-white/50 w-7 text-left font-mono tabular-nums">
                                  {Math.round((isMuted ? 0 : volume) * 100)}%
                              </span>
                          </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between mb-12">
                          <button onClick={() => setIsShuffle(!isShuffle)} className={`p-4 rounded-2xl transition-all ${isShuffle ? 'text-primary bg-primary/10 scale-110' : 'text-white/20 hover:text-white/40 hover:bg-white/5'}`}>
                              <Shuffle className="w-6 h-6" />
                          </button>
                          <div className="flex items-center gap-10 lg:gap-14">
                              <button onClick={handlePrev} className="text-white/40 hover:text-white transition-all hover:scale-125 active:scale-90">
                                  <SkipBack className="w-10 h-10 lg:w-12 lg:h-12 fill-current" />
                              </button>
                              <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-24 h-24 lg:w-32 lg:h-32 rounded-[3rem] bg-primary flex items-center justify-center text-black shadow-[0_25px_60px_rgba(212,175,55,0.5)] hover:scale-105 active:scale-95 transition-all group"
                              >
                                  {isPlaying ? <Pause className="w-10 h-10 lg:w-14 lg:h-14 fill-current" /> : <Play className="w-10 h-10 lg:w-14 lg:h-14 fill-current translate-x-1" />}
                              </button>
                              <button onClick={handleNext} className="text-white/40 hover:text-white transition-all hover:scale-125 active:scale-90">
                                  <SkipForward className="w-10 h-10 lg:w-12 lg:h-12 fill-current" />
                              </button>
                          </div>
                          <button onClick={() => setIsRepeat(!isRepeat)} className={`p-4 rounded-2xl transition-all ${isRepeat ? 'text-primary bg-primary/10 scale-110' : 'text-white/20 hover:text-white/40 hover:bg-white/5'}`}>
                              <Repeat className="w-6 h-6" />
                          </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-center gap-4 border-t border-white/5 pt-10">
                          <button 
                            onClick={() => toggleFavorite(currentSurah.id)}
                            className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] border transition-all text-xs font-black uppercase tracking-[0.2em] ${favorites.includes(currentSurah.id) ? 'bg-primary border-primary text-black shadow-xl shadow-primary/20' : 'bg-white/5 border-white/5 text-white/40 hover:text-primary hover:border-primary/20'}`}
                          >
                              <Heart className={`w-5 h-5 ${favorites.includes(currentSurah.id) ? 'fill-current' : ''}`} /> {favorites.includes(currentSurah.id) ? 'مفضلة' : 'إضافة للمفضلة'}
                          </button>
                          <button 
                            onClick={downloadSurah}
                            className="flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-xs font-black uppercase tracking-[0.2em] text-white/40 hover:text-primary"
                          >
                              <ChevronDown className="w-5 h-5" /> تحميل السورة
                          </button>
                          <button 
                            onClick={() => setShowReciters(true)}
                            className="p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-primary"
                          >
                              <User className="w-5 h-5" />
                          </button>
                      </div>

                      {/* Recently Played (Mobile Specific) */}
                      <div className="mt-12 lg:hidden">
                           <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 block">آخر القراءات</span>
                           <div className="grid grid-cols-2 gap-3">
                                {recentlyPlayed.slice(0, 4).map(id => {
                                    const s = surahsData.find(sur => sur.id === id);
                                    if (!s) return null;
                                    return (
                                        <button 
                                            key={id}
                                            onClick={() => handleSurahSelect(s)}
                                            className="flex flex-col p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all text-right group"
                                        >
                                            <span className="text-[10px] font-black font-['Amiri'] block truncate group-hover:text-primary transition-colors">{s.name}</span>
                                            <span className="text-[8px] text-white/20 uppercase tracking-widest mt-1">Surah {s.id}</span>
                                        </button>
                                    );
                                })}
                                {recentlyPlayed.length === 0 && <span className="text-[10px] text-white/20 italic">لا يوجد تاريخ استماع بعد</span>}
                           </div>
                      </div>
                  </div>
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
                    className="relative w-full max-w-sm bg-[#0d0d0d] rounded-t-3xl md:rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-2xl h-[70vh] md:h-auto md:max-h-[80vh]"
                  >
                      <div className="p-4 md:p-5 border-b border-white/5 flex items-center justify-between">
                          <h3 className="text-lg font-black">اختر القارئ</h3>
                          <button onClick={() => setShowReciters(false)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                              <X className="w-4 h-4 text-white/40" />
                          </button>
                      </div>

                      <div className="p-4 border-b border-white/5">
                          <div className="relative group">
                              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                              <input 
                                value={reciterSearch}
                                onChange={(e) => setReciterSearch(e.target.value)}
                                placeholder="ابحث عن قارئ..."
                                className="w-full bg-white/5 border border-white/5 rounded-xl py-2.5 pr-12 pl-6 text-sm font-bold outline-none focus:border-primary/40 transition-all text-right font-arabic"
                              />
                          </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                          {filteredReciters.map((r) => {
                              const sel = selectedReciter.id === r.id;
                              return (
                                  <button
                                    key={r.id}
                                    onClick={() => { setSelectedReciter(r); setShowReciters(false); }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-right ${
                                        sel ? 'bg-primary text-black border-primary' : 'bg-white/[0.03] border-transparent hover:bg-white/[0.06]'
                                    }`}
                                  >
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${sel ? 'bg-black/10' : 'bg-white/5'}`}>
                                          <User className="w-4 h-4" />
                                      </div>
                                      <span className="text-xs font-black truncate">{r.name}</span>
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
