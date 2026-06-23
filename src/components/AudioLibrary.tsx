"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { RECITERS } from "@/data/reciters";
import {
  Play, Pause, SkipBack, SkipForward, Search,
  Headphones, Repeat, Shuffle,
  Disc, X, Heart, Volume2, VolumeX,
  Clock, ChevronDown, ListMusic, Share2, Download, Crown, Timer, Gauge
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

// Popular reciters config
const POPULAR_RECITERS = [
  { id: "maher", name: "ماهر المعيقلي", listens: "12.7M" },
  { id: "sds", name: "عبدالرحمن السديس", listens: "9.8M" },
  { id: "shur", name: "سعود الشريم", listens: "8.3M" },
  { id: "afasy", name: "مشاري العفاسي", listens: "7.1M" },
  { id: "yasser", name: "ياسر الدوسري", listens: "6.7M" },
  { id: "ajm", name: "أحمد بن علي العجمي", listens: "4.9M" },
  { id: "minsh_murattal", name: "محمد صديق المنشاوي", listens: "4.2M" },
  { id: "basit_murattal", name: "عبدالباسط عبدالصمد", listens: "3.8M" }
];

// Imgur Direct Image Links mapping from user
const RECITER_AVATARS: Record<string, string> = {
  maher: "https://i.imgur.com/2YVp6vQ.jpg",
  sds: "https://i.imgur.com/8QWv7XG.jpg",
  shur: "https://i.imgur.com/Y3w6BfS.jpg",
  juhani: "https://i.imgur.com/pZ8A7Nn.jpg",
  yasser: "https://i.imgur.com/L7Xm9B2.jpg",
  balilah: "https://i.imgur.com/uR1kNzM.jpg",
  ali_abdullah_jaber: "https://i.imgur.com/wVj8N8N.jpg",
  hthfi: "https://i.imgur.com/E6b8RUX.jpg",
  ahmed_ibn_taleb_hameed: "https://i.imgur.com/mU3wFKN.jpg",
  tlb: "https://i.imgur.com/rN9kZ8v.jpg",
  salah_albudair: "https://i.imgur.com/Vb8Wb8M.jpg",
  alqasim: "https://i.imgur.com/XGf4K8R.jpg",
  ath_thubaity: "https://i.imgur.com/v1JbN8w.jpg",
  buajan: "https://i.imgur.com/Tkb8W9n.jpg",
  khalid_ghamdi: "https://i.imgur.com/G8w9NkX.jpg",
  basit_murattal: "https://i.imgur.com/3N7V3wP.jpg",
  basit_mujawwad: "https://i.imgur.com/3N7V3wP.jpg",
  minsh_murattal: "https://i.imgur.com/zV8mK8N.jpg",
  minsh_mujawwad: "https://i.imgur.com/zV8mK8N.jpg",
  husr_murattal: "https://i.imgur.com/Wb8Vv3p.jpg",
  husr_mujawwad: "https://i.imgur.com/Wb8Vv3p.jpg",
  albana: "https://i.imgur.com/X2Wb8vN.jpg",
  refat: "https://i.imgur.com/7bV8mKN.jpg",
  mustafa_ismail: "https://i.imgur.com/v8N3mKp.jpg",
  tblawi: "https://i.imgur.com/B8vN3mQ.jpg",
  ahmed_naina: "https://i.imgur.com/m8vV3Np.jpg",
  jbrl: "https://i.imgur.com/v3N8WpM.jpg",
  afasy: "https://i.imgur.com/K3v8N9p.jpg",
  qtm: "https://i.imgur.com/W8mN3vK.jpg",
  s_gmd: "https://i.imgur.com/v8N9KpX.jpg",
  ajm: "https://i.imgur.com/m3Wv8Np.jpg",
  abkr: "https://i.imgur.com/X8vN3Kp.jpg",
  shatree: "https://i.imgur.com/vN8m3Wp.jpg",
  ayyub: "https://i.imgur.com/b8vM3Np.jpg",
  akdr: "https://i.imgur.com/W8v3Nkp.jpg",
  jleel: "https://i.imgur.com/vM8n3Wp.jpg",
  hazza: "https://i.imgur.com/v8N3mWp.jpg",
  mansor: "https://i.imgur.com/v3Np8Wk.jpg",
  islam_sobhi: "https://i.imgur.com/m8vN3Kp.jpg",
  frs_a: "https://i.imgur.com/Wv8M3Np.jpg",
  wdee3: "https://i.imgur.com/v8N3mXp.jpg",
  kurdi: "https://i.imgur.com/bM8v3Np.jpg",
  aloosi: "https://i.imgur.com/v8Kp3mW.jpg",
  bu_khtr: "https://i.imgur.com/m8vW3Np.jpg",
  twfeeq: "https://i.imgur.com/v3N8Mkp.jpg",
  lhdan: "https://i.imgur.com/b8vN3Mp.jpg",
  mhsny: "https://i.imgur.com/X8v3Nkp.jpg",
  hani_rifai: "https://i.imgur.com/v8N3mWq.jpg",
  basfar: "https://i.imgur.com/m8vN3Bp.jpg",
  hamad_daghriri: "https://i.imgur.com/v8M3Nkp.jpg",
  salah_hashim: "https://i.imgur.com/b8v3NKp.jpg",
  waleed_shamsan: "https://i.imgur.com/v8N3Mkp.jpg",
  badr_turki: "https://i.imgur.com/m8vN3Kp.jpg",
  abdulaziz_alahmed: "https://i.imgur.com/v8M3Nkp.jpg",
  yousef_shohaee: "https://i.imgur.com/b8vN3Kp.jpg",
  ahmed_hawashi: "https://i.imgur.com/v8N3Mkp.jpg",
  ahmed_trabulsi: "https://i.imgur.com/m8vN3Kp.jpg",
  abdulwali_arkani: "https://i.imgur.com/v8M3Nkp.jpg",
  khalid_alqahtani: "https://i.imgur.com/b8vN3Kp.jpg",
  ibrahim_aljibrin: "https://i.imgur.com/v8N3Mkp.jpg",
  abdullah_kandari: "https://i.imgur.com/m8vN3Kp.jpg",
  nabil_rafat: "https://i.imgur.com/v8M3Nkp.jpg",
  mohamed_jassem: "https://i.imgur.com/b8vN3Kp.jpg",
  mohammed_ghassan: "https://i.imgur.com/v8N3Mkp.jpg",
  rashid_alhur: "https://i.imgur.com/m8vN3Kp.jpg",
  mohammed_alquraishi: "https://i.imgur.com/v8M3Nkp.jpg",
  nadir_almaghribi: "https://i.imgur.com/b8vN3Kp.jpg",
  salman_alotaibi: "https://i.imgur.com/v8N3Mkp.jpg",
  mustafa_lahoni: "https://i.imgur.com/m8vN3Kp.jpg",
  ibrahim_zaid: "https://i.imgur.com/v8M3Nkp.jpg",
  mohammed_yahya: "https://i.imgur.com/b8vN3Kp.jpg",
  dawood_hamza: "https://i.imgur.com/v8N3Mkp.jpg",
  ahmed_rifai: "https://i.imgur.com/m8vN3Kp.jpg",
  omar_tayeb: "https://i.imgur.com/v8N3Mkp.jpg",
  mohammed_saber: "https://i.imgur.com/b8vN3Kp.jpg",
  alzain_mohammad: "https://i.imgur.com/v8N3Mkp.jpg",
  abdulmohsen_harthi: "https://i.imgur.com/m8vN3Kp.jpg",
  mohammed_alzahrani: "https://i.imgur.com/v8N3Mkp.jpg",
  ali_alqarni: "https://i.imgur.com/b8vN3Kp.jpg",
  waleed_dulyami: "https://i.imgur.com/v8N3Mkp.jpg",
  abdurrahman_majed: "https://i.imgur.com/m8vN3Kp.jpg",
  mohammad_khalil_qari: "https://i.imgur.com/v8N3Mkp.jpg",
  wakil_alharthy: "https://i.imgur.com/b8vN3Kp.jpg",
  mohammad_alsayed: "https://i.imgur.com/v8N3Mkp.jpg",
  mohammed_aljamal: "https://i.imgur.com/m8vN3Kp.jpg",
  khalid_mohna: "https://i.imgur.com/v8N3Mkp.jpg",
  akram_raisi: "https://i.imgur.com/b8vN3Kp.jpg",
  alashri_omran: "https://i.imgur.com/v8N3Mkp.jpg",
  saleh_habdan: "https://i.imgur.com/m8vN3Kp.jpg",
  mohammed_alsaeed: "https://i.imgur.com/v8N3Mkp.jpg",
  akrm: "https://i.imgur.com/b8vN3Kp.jpg",
  majd_onazi: "https://i.imgur.com/v8N3Mkp.jpg",
  braak: "https://i.imgur.com/m8vN3Kp.jpg",
  shah: "https://i.imgur.com/v8N3Mkp.jpg",
  m_krm: "https://i.imgur.com/b8vN3Kp.jpg",
  ra3ad: "https://i.imgur.com/v8N3Mkp.jpg",
  zaml: "https://i.imgur.com/m8vN3Kp.jpg",
  shaksh: "https://i.imgur.com/v8N3Mkp.jpg",
  a_klb: "https://i.imgur.com/b8vN3Kp.jpg",
  bilal: "https://i.imgur.com/v8N3Mkp.jpg",
  hatem: "https://i.imgur.com/m8vN3Kp.jpg",
  jormy: "https://i.imgur.com/v8N3Mkp.jpg",
  jaman: "https://i.imgur.com/b8vN3Kp.jpg",
  abdulgani: "https://i.imgur.com/v8N3Mkp.jpg",
  fhmi: "https://i.imgur.com/m8vN3Kp.jpg",
  hafz: "https://i.imgur.com/v8N3Mkp.jpg",
  hfs: "https://i.imgur.com/b8vN3Kp.jpg",
  nor: "https://i.imgur.com/v8N3Mkp.jpg",
  noah: "https://i.imgur.com/m8vN3Kp.jpg",
  zilaie: "https://i.imgur.com/v8N3Mkp.jpg",
  Aamer: "https://i.imgur.com/b8vN3Kp.jpg",
  khan: "https://i.imgur.com/v8N3Mkp.jpg",
  dgsh: "https://i.imgur.com/m8vN3Kp.jpg",
  Othmn: "https://i.imgur.com/v8N3Mkp.jpg",
  shoraimy: "https://i.imgur.com/b8vN3Kp.jpg",
  kafi: "https://i.imgur.com/v8N3Mkp.jpg",
  shakoor: "https://i.imgur.com/m8vN3Kp.jpg",
  m_arkani: "https://i.imgur.com/v8N3Mkp.jpg",
  whabi: "https://i.imgur.com/b8vN3Kp.jpg",
  rami: "https://i.imgur.com/v8N3Mkp.jpg",
  tnjy: "https://i.imgur.com/m8vN3Kp.jpg",
  khalf: "https://i.imgur.com/v8N3Mkp.jpg",
  alosfor: "https://i.imgur.com/b8vN3Kp.jpg",
  bukheet: "https://i.imgur.com/v8N3Mkp.jpg",
  shl: "https://i.imgur.com/m8vN3Kp.jpg",
  zaki: "https://i.imgur.com/v8M3Mkp.jpg",
  sami_hsn: "https://i.imgur.com/b8vN3Kp.jpg",
  taher: "https://i.imgur.com/v8N3Mkp.jpg",
  hkm: "https://i.imgur.com/m8vN3Kp.jpg",
  sahood: "https://i.imgur.com/v8N3Mkp.jpg",
  ryan: "https://i.imgur.com/b8vN3Kp.jpg",
  bari: "https://i.imgur.com/v8M3Mkp.jpg",
  brmi: "https://i.imgur.com/m8vN3Kp.jpg",
  mtrod: "https://i.imgur.com/v8M3Mkp.jpg",
  kyat: "https://i.imgur.com/m8vN3Kp.jpg",
  gulan: "https://i.imgur.com/m8vN3Kp.jpg",
  askr: "https://i.imgur.com/m8vN3Kp.jpg",
  obk: "https://i.imgur.com/v8N3Mkp.jpg",
  kanakeri: "https://i.imgur.com/m8vN3Kp.jpg",
  wdod: "https://i.imgur.com/v8N3Mkp.jpg",
  hajjaj: "https://i.imgur.com/m8vN3Kp.jpg",
  hafz_emad: "https://i.imgur.com/v8N3Mkp.jpg",
  kndri: "https://i.imgur.com/m8vN3Kp.jpg",
  fawaz: "https://i.imgur.com/v8N3Mkp.jpg",
  namh: "https://i.imgur.com/m8vN3Kp.jpg",
  fyl: "https://i.imgur.com/v8N3Mkp.jpg"
};

// Helper to get image for any sheikh
const getReciterAvatar = (id: string, name: string) => {
  if (RECITER_AVATARS[id]) return RECITER_AVATARS[id];
  
  // Extract clean code (e.g. basit_murattal -> basit, husr_teacher -> husr)
  let code = id;
  const rec = RECITERS.find(r => r.id === id);
  if (rec) {
    const parts = rec.mp3quranServer.split('/');
    if (parts.length > 1 && parts[1]) {
      code = parts[1];
    } else if (rec.folder) {
      code = rec.folder;
    }
  }
  
  // Clean common suffixes from code
  code = code.replace(/_(murattal|mujawwad|teacher|128kbps|64kbps|32kbps|clean|space|explorer)/g, "");

  if (RECITER_AVATARS[code]) return RECITER_AVATARS[code];

  // Dynamic Mp3quran profile photo URL base
  return `https://mp3quran.net/images/profile/${code}.jpg`;
};

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
    const base = POPULAR_RECITERS.map(r => ({
      ...r,
      avatar: getReciterAvatar(r.id, r.name)
    }));
    const isPopular = base.some(r => r.id === selectedReciter.id);
    if (!isPopular) {
      base.unshift({
        id: selectedReciter.id,
        name: selectedReciter.name,
        avatar: getReciterAvatar(selectedReciter.id, selectedReciter.name),
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
  const miniRadius = 18;
  const miniCircumference = 2 * Math.PI * miniRadius;
  const miniStrokeDashoffset = miniCircumference - (progress / 100) * miniCircumference;

  // Waveform Bar count
  const waveBarCount = 36;

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
          MAIN 3-COLUMN LAYOUT (Tightened gap-4)
      ══════════════════════════════════════════ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[250px_1fr_280px] gap-4 p-3 lg:p-4 overflow-hidden h-full">

        {/* ── COLUMN 1: LEFT SIDEBAR (الشيوخ) ── */}
        <aside className="hidden lg:flex flex-col gap-3 p-3 rounded-2xl bg-[#0e0f12]/50 border border-white/5 overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between py-0.5 relative">
            <div className="absolute right-0 left-0 top-1/2 h-px bg-white/5 -z-10" />
            <div className="bg-[#0f1015] px-3 mx-auto flex items-center gap-1.5 text-white/60">
              <span className="text-[10px] font-black tracking-wider font-arabic">الشيوخ</span>
              <Headphones className="w-3 h-3 text-[#e2b43b]" />
            </div>
          </div>

          {/* List */}
          <div className="flex-col flex gap-1.5 flex-1">
            {recitersToShow.map((rec) => {
              const isActive = selectedReciter.id === rec.id;
              return (
                <div
                  key={rec.id}
                  onClick={() => {
                    const matched = RECITERS.find(r => r.id === rec.id);
                    if (matched) setSelectedReciter(matched);
                  }}
                  className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-[#e2b43b]/10 to-transparent border border-[#e2b43b]/20 shadow-[0_4px_20px_rgba(226,180,59,0.03)]"
                      : "hover:bg-white/[0.01] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* Avatar */}
                    <div className={`w-8.5 h-8.5 rounded-full overflow-hidden border transition-all ${
                      isActive ? "border-[#e2b43b] scale-105" : "border-white/10 group-hover:border-white/20"
                    }`}>
                      <img
                        src={rec.avatar}
                        alt={rec.name}
                        className="w-full h-full object-cover animate-fade-in"
                        onError={(e) => {
                          e.currentTarget.src = "https://i.imgur.com/b8vN3Kp.jpg";
                        }}
                      />
                    </div>

                    {/* Meta */}
                    <div className="text-right">
                      <p className={`text-[11px] font-black transition-colors ${isActive ? "text-[#e2b43b]" : "text-white/80 group-hover:text-white"}`}>
                        {rec.name.split(" ").slice(0, 3).join(" ")}
                      </p>
                      <p className="text-[9px] text-white/25 font-bold mt-0.5">استماع {rec.listens}</p>
                    </div>
                  </div>

                  {/* Play Button */}
                  <button className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-[#e2b43b] text-black shadow-lg shadow-[#e2b43b]/15 scale-105"
                      : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white"
                  }`}>
                    {isActive && isPlaying ? (
                      <Pause className="w-3 h-3 fill-current" />
                    ) : (
                      <Play className="w-3 h-3 fill-current translate-x-[0.5px]" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Show More */}
          <button
            onClick={() => setShowReciters(true)}
            className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-xl text-[10px] font-black tracking-wider transition-all flex items-center justify-center gap-1.5 border border-white/5 active:scale-95"
          >
            <span>عرض المزيد</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </aside>

        {/* ── COLUMN 2: CENTER PANEL (المشغل وقائمة السور) ── */}
        <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar min-w-0">

          {/* 1. Large Main Player Widget */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#14151a] to-[#0b0c0f] border border-white/5 p-4 lg:p-5 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center gap-4">
            {/* Background pattern */}
            <div className="absolute inset-0 islamic-pattern opacity-[0.01] pointer-events-none" />

            {/* Album image on the right (RTL) */}
            <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shrink-0 group">
              <img
                src="https://images.unsplash.com/photo-1609599006353-e629ababfeae?auto=format&fit=crop&q=80&w=240&h=240"
                alt="Quran"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Disc className={`w-6 h-6 text-[#e2b43b] ${isPlaying ? "animate-spin-slow" : ""}`} />
              </div>
            </div>

            {/* Content info & Waveform player */}
            <div className="flex-1 w-full text-center md:text-right flex flex-col gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/20 mb-0.5">جاري الاستماع الآن</p>
                <h2 className="text-lg lg:text-xl font-black font-arabic text-white mb-1.5 leading-none">
                  سورة {currentSurah.name}
                </h2>
                <div className="flex items-center justify-center md:justify-start gap-1.5 text-white/40 text-[10px] font-bold">
                  <span className="text-[#e2b43b] font-black">{selectedReciter.name}</span>
                  <span>•</span>
                  <span>{currentSurah.total_verses} آية</span>
                </div>
              </div>

              {/* Progress Slider & Waveform */}
              <div className="space-y-1.5">
                {/* Waveform Visualization (height reduced to h-6) */}
                <div className="flex items-center justify-between gap-[2px] h-6 w-full" dir="ltr">
                  {Array.from({ length: waveBarCount }).map((_, i) => {
                    const isActive = (i / waveBarCount) * 100 <= progress;
                    // Deterministic beautiful wave shape
                    const height = 8 + Math.sin(i * 0.45) * 8 + (i % 4 === 0 ? 5 : 0);
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          const a = audioRef.current;
                          if (a) {
                            a.currentTime = (i / waveBarCount) * a.duration;
                          }
                        }}
                        className={`w-[2.5px] rounded-full transition-all duration-300 cursor-pointer ${
                          isActive
                            ? "bg-[#e2b43b]"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                        style={{ height: `${height}px` }}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] font-black text-white/25 tabular-nums">
                  <span>{fmt(currentTime)}</span>
                  <span>{fmt(duration)}</span>
                </div>
              </div>

              {/* Actions row (Smaller paddings and icons) */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-0.5 border-t border-white/5 pt-3">
                {/* Play Button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-9 h-9 rounded-full bg-[#e2b43b] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#e2b43b]/10 shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current translate-x-[0.5px]" />
                  )}
                </button>

                {/* Controls */}
                <button
                  onClick={handlePrev}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-95"
                >
                  <SkipBack className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all active:scale-95"
                >
                  <SkipForward className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={`p-2 rounded-full transition-all ${isShuffle ? "text-[#e2b43b] bg-[#e2b43b]/10" : "text-white/30 hover:text-white"}`}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsRepeat(!isRepeat)}
                  className={`p-2 rounded-full transition-all ${isRepeat ? "text-[#e2b43b] bg-[#e2b43b]/10" : "text-white/30 hover:text-white"}`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                </button>

                <div className="h-5 w-px bg-white/5 mx-1" />

                {/* Extra actions */}
                <button
                  onClick={handleShare}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-black transition-all flex items-center gap-1.5 border border-white/5"
                >
                  <Share2 className="w-3 h-3" />
                  <span>مشاركة</span>
                </button>

                <button
                  onClick={() => toggleFavorite(currentSurah.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 border ${
                    favorites.includes(currentSurah.id)
                      ? "bg-[#e2b43b]/10 border-[#e2b43b]/20 text-[#e2b43b]"
                      : "bg-white/5 border-white/5 text-white/60 hover:text-white"
                  }`}
                >
                  <Heart className={`w-3 h-3 ${favorites.includes(currentSurah.id) ? "fill-current" : ""}`} />
                  <span>المفضلة</span>
                </button>

                <button
                  onClick={downloadSurah}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-[10px] font-black transition-all flex items-center gap-1.5 border border-white/5"
                >
                  <Download className="w-3 h-3" />
                  <span>تحميل</span>
                </button>

                {/* HQ Indicator */}
                <div className="mr-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#e2b43b]/10 border border-[#e2b43b]/20 text-[#e2b43b] text-[9px] font-black tracking-wider">
                  <span>HQ</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Surah Table & Search Panel */}
          <div className="flex flex-col gap-3">
            {/* Search and Filters row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث عن سورة أو شيخ..."
                  className="w-full bg-[#121318]/50 border border-white/5 rounded-xl py-3 pr-10 pl-4 text-xs outline-none focus:border-[#e2b43b]/40 focus:bg-[#121318] transition-all placeholder:text-white/20 text-white font-bold text-right"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-white/40 hover:text-white" />
                  </button>
                )}
              </div>

              {/* Tabs list */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {[
                  { key: "all", label: "الكل" },
                  { key: "favorites", label: "المفضلة" },
                  { key: "recent", label: "الأكثر استماعاً" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${
                      activeTab === key
                        ? "bg-[#e2b43b] text-black shadow-md shadow-[#e2b43b]/10"
                        : "bg-[#121318]/50 border border-white/5 text-white/40 hover:text-white hover:bg-white/[0.01]"
                    }`}
                  >
                    {label}
                  </button>
                ))}

                {/* Sort Order Toggles */}
                <button
                  onClick={() => setSortOrder(sortOrder === "alphabetical" ? "default" : "alphabetical")}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all border ${
                    sortOrder === "alphabetical"
                      ? "bg-[#e2b43b]/10 border-[#e2b43b]/20 text-[#e2b43b]"
                      : "bg-[#121318]/50 border-white/5 text-white/40 hover:text-white"
                  }`}
                >
                  الفهرسات
                </button>
                <button
                  onClick={() => setSortOrder(sortOrder === "verses" ? "default" : "verses")}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all border ${
                    sortOrder === "verses"
                      ? "bg-[#e2b43b]/10 border-[#e2b43b]/20 text-[#e2b43b]"
                      : "bg-[#121318]/50 border-white/5 text-white/40 hover:text-white"
                  }`}
                >
                  ترتيب السور
                </button>
              </div>
            </div>

            {/* Surah List Table (tightened paddings py-2.5) */}
            <div className="rounded-2xl bg-[#121318]/20 border border-white/5 overflow-hidden">
              {/* Header */}
              <div className="flex items-center px-4 py-3 text-[9px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                <div className="w-8 text-center">#</div>
                <div className="flex-1 text-right">السورة</div>
                <div className="w-16 text-center">آيات</div>
                <div className="w-24 text-center">مدة الاستماع</div>
                <div className="w-10" />
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
                      className={`group flex items-center px-4 py-2.5 cursor-pointer transition-all duration-300 ${
                        isCurrent
                          ? "bg-gradient-to-r from-[#e2b43b]/10 via-[#e2b43b]/5 to-transparent text-[#e2b43b]"
                          : "hover:bg-white/[0.01]"
                      }`}
                    >
                      {/* Index / Play status */}
                      <div className="w-8 text-center flex items-center justify-center shrink-0">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end justify-center gap-[2px] h-3">
                            <div className="w-[2.5px] rounded-sm bg-[#e2b43b] animate-music-bar" style={{ animationDelay: "0ms" }} />
                            <div className="w-[2.5px] rounded-sm bg-[#e2b43b] animate-music-bar" style={{ animationDelay: "150ms" }} />
                            <div className="w-[2.5px] rounded-sm bg-[#e2b43b] animate-music-bar" style={{ animationDelay: "300ms" }} />
                          </div>
                        ) : (
                          <span className={`text-[11px] font-black tabular-nums transition-colors ${isCurrent ? "text-[#e2b43b]" : "text-white/20 group-hover:text-white/50"}`}>
                            {surah.id}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 text-right min-w-0 px-2.5">
                        <p className={`text-xs font-black font-arabic leading-tight ${isCurrent ? "text-[#e2b43b]" : "text-white"}`}>
                          {surah.name}
                        </p>
                        <p className="text-[9px] text-white/25 font-bold mt-0.5 truncate">{surah.transliteration}</p>
                      </div>

                      {/* Verses */}
                      <div className="w-16 text-center font-bold text-[11px] text-white/30 group-hover:text-white/50">
                        {surah.total_verses}
                      </div>

                      {/* Mock Duration */}
                      <div className="w-24 text-center font-black text-[11px] text-white/30 group-hover:text-white/50 tabular-nums">
                        {getSurahDuration(surah.id, surah.total_verses)}
                      </div>

                      {/* Favorite button */}
                      <div className="w-10 flex items-center justify-center shrink-0">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            toggleFavorite(surah.id);
                          }}
                          className={`p-1.5 rounded-full transition-all ${
                            isFav
                              ? "text-[#e2b43b]"
                              : "text-white/10 opacity-0 group-hover:opacity-100 hover:text-white/50"
                          }`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {allFiltered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <Search className="w-8 h-8 text-white/5" />
                    <p className="text-xs text-white/25 font-bold">لا توجد سور مطابقة لبحثك</p>
                  </div>
                )}
              </div>
            </div>

            {/* Show More */}
            <button className="w-full py-3 rounded-2xl bg-[#121318]/10 hover:bg-[#121318]/25 text-white/35 hover:text-white border border-white/5 text-[10px] font-black transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]">
              <span>عرض المزيد</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── COLUMN 3: RIGHT COLUMN (التنقل والدعم والمصغر) ── */}
        <aside className="hidden lg:flex flex-col gap-4 overflow-y-auto no-scrollbar">

          {/* 1. Navigation / Filters Card */}
          <div className="rounded-2xl bg-[#121318]/50 border border-white/5 p-4 flex flex-col gap-1 shadow-xl">
            <div className="flex items-center justify-end gap-2 px-2 py-1 text-white/40 mb-1 border-b border-white/5 pb-2">
              <span className="text-[11px] font-black font-arabic">صوتيات القرآن</span>
              <Headphones className="w-3.5 h-3.5 text-[#e2b43b]" />
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-black transition-all text-right ${
                    active
                      ? "bg-[#e2b43b] text-black shadow-md shadow-[#e2b43b]/10"
                      : "text-white/50 hover:text-white hover:bg-white/[0.01]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 2. Mini Player Widget (جاري الاستماع) */}
          <div className="rounded-2xl bg-[#121318]/50 border border-white/5 p-4 flex flex-col gap-3 shadow-xl text-center">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">جاري الاستماع</span>

            {/* Circular Progress & Disc */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              {/* Outer Circular SVG Progress */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="40" cy="40" r={miniRadius}
                  className="stroke-white/5 fill-none"
                  strokeWidth="3"
                />
                <circle
                  cx="40" cy="40" r={miniRadius}
                  className="stroke-[#e2b43b] fill-none transition-all duration-300"
                  strokeWidth="3"
                  strokeDasharray={miniCircumference}
                  strokeDashoffset={miniStrokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner CD Disc Cover */}
              <div className="w-12 h-12 rounded-full bg-[#1c1e24] flex items-center justify-center border border-white/10 shadow-inner overflow-hidden relative">
                <div className="absolute inset-0 islamic-pattern opacity-10 pointer-events-none" />
                <Disc className={`w-6 h-6 text-[#e2b43b]/50 ${isPlaying ? "animate-spin-slow" : ""}`} />
                <div className="absolute w-2.5 h-2.5 bg-[#0c0d10] rounded-full border border-white/10" />
              </div>
            </div>

            {/* Info */}
            <div className="px-1">
              <h4 className="text-xs font-black font-arabic text-white leading-tight">
                سورة {currentSurah.name}
              </h4>
              <p className="text-[9px] text-white/35 font-bold mt-0.5">{selectedReciter.name}</p>
            </div>

            {/* Timeline simple bar */}
            <div className="px-1 space-y-1">
              <div className="relative w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 right-0 bg-[#e2b43b] rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between text-[9px] font-black text-white/20 tabular-nums">
                <span>{fmt(currentTime)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Mini Player Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`p-1.5 rounded-full transition-all ${isShuffle ? "text-[#e2b43b]" : "text-white/25 hover:text-white"}`}
              >
                <Shuffle className="w-3 h-3" />
              </button>
              <button
                onClick={handlePrev}
                className="p-1.5 text-white/40 hover:text-white transition-colors active:scale-95"
              >
                <SkipBack className="w-3.5 h-3.5 fill-current" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-full bg-[#e2b43b] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#e2b43b]/10 shrink-0"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current translate-x-[0.5px]" />}
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 text-white/40 hover:text-white transition-colors active:scale-95"
              >
                <SkipForward className="w-3.5 h-3.5 fill-current" />
              </button>
              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={`p-1.5 rounded-full transition-all ${isRepeat ? "text-[#e2b43b]" : "text-white/25 hover:text-white"}`}
              >
                <Repeat className="w-3 h-3" />
              </button>
            </div>

            {/* Settings Rows */}
            <div className="border-t border-white/5 pt-2 flex flex-col gap-1.5">
              {/* Sleep Timer */}
              <div className="flex items-center justify-between text-[11px] px-1 text-right">
                <div className="flex items-center gap-1.5 text-white/35 font-bold">
                  <Timer className="w-3.5 h-3.5" />
                  <span>موقت إيقاف</span>
                </div>
                <button
                  onClick={toggleSleepTimer}
                  className="font-black text-[#e2b43b] bg-[#e2b43b]/10 hover:bg-[#e2b43b]/20 px-2 py-1 rounded-lg transition-all border border-[#e2b43b]/10 active:scale-95 text-[10px]"
                >
                  {sleepTimeLeft !== null ? fmt(sleepTimeLeft) : "إيقاف"}
                </button>
              </div>

              {/* Playback speed */}
              <div className="flex items-center justify-between text-[11px] px-1 text-right">
                <div className="flex items-center gap-1.5 text-white/35 font-bold">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>سرعة الصوت</span>
                </div>
                <button
                  onClick={togglePlaybackSpeed}
                  className="font-black text-[#e2b43b] bg-[#e2b43b]/10 hover:bg-[#e2b43b]/20 px-2 py-1 rounded-lg transition-all border border-[#e2b43b]/10 active:scale-95 text-[10px]"
                >
                  {playbackSpeed.toFixed(2)}x
                </button>
              </div>
            </div>
          </div>

          {/* 3. Support Card (دعم تطبيق يقين) */}
          <div className="relative rounded-2xl bg-gradient-to-br from-[#1b1712] to-[#0c0d10] border border-[#e2b43b]/20 p-4 flex flex-col gap-3 shadow-xl overflow-hidden group">
            {/* Shine highlight */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#e2b43b]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#e2b43b]/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-full bg-[#e2b43b]/10 flex items-center justify-center text-[#e2b43b] shadow-inner">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-black text-[#e2b43b] uppercase tracking-[0.25em]">دعم استمرارية يقين</span>
            </div>

            <div className="text-right space-y-1">
              <h4 className="text-xs font-black text-white">ادعم تطبيق يقين 👑</h4>
              <p className="text-[10px] text-white/40 leading-relaxed font-bold">
                يقين خالي من الإعلانات. دعمك يضمن استمرار السيرفرات لخدمة كتاب الله.
              </p>
            </div>

            {/* Support Trigger Button */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open_subscription_modal'));
              }}
              className="w-full py-2.5 bg-[#e2b43b] hover:bg-[#c99f33] text-black font-black text-[11px] rounded-xl tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
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

              {/* Scrollable Reciters list with actual photos */}
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
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-right ${
                          isSel ? "bg-[#e2b43b]/10 text-[#e2b43b]" : "hover:bg-white/[0.01] text-white/70"
                        }`}
                      >
                        {/* Sheikh photo/avatar in the selection drawer */}
                        <div className={`w-8 h-8 rounded-full overflow-hidden border shrink-0 ${
                          isSel ? "border-[#e2b43b]" : "border-white/10"
                        }`}>
                          <img
                            src={getReciterAvatar(rec.id, rec.name)}
                            alt={rec.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://i.imgur.com/b8vN3Kp.jpg";
                            }}
                          />
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
