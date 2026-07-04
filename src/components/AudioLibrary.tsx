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

const OMAR_DIAA_MAPPING: Record<number, string> = {
  2: "002  2  الأكثر طلبا واستماعا - سورة البقرة - Surah Al-Baqarah.mp3",
  4: "004  14  سورة إبراهيم - Surah Ibrahim.mp3",
  7: "007   7  قصة أهل مدين من سورة الأعراف - تلاوة مرئية.mp3",
  8: "008   8   سورة الأنفال - Surah Al-Anfal.mp3",
  9: "009  29  سورة العنكبوت - Surah Al-'Ankabut.mp3",
  12: "012   12  سورة يوسف - Surah Yusuf.mp3",
  13: "013   13  ماتيسر من سورة الرعد - تلاوة مرئية.mp3",
  14: "004  14  سورة إبراهيم - Surah Ibrahim.mp3",
  16: "016  16  تلاوة ندية _ من سورة (النحل)_[القارئ عمر ضياء الدين].mp3",
  18: "018   18  سورة الكهف - Surah Al-Kahf.mp3",
  19: "019   19  سورة مريم - Surah Maryam.mp3",
  20: "020   20  سورة طه - Surah Taha.mp3",
  25: "0025   25  سورة الفرقان - Surah Al-Furqan.mp3",
  27: "027   27  تحبير رائع من سورة النمل علي طريقة القطامي بصوت القارئ عمر ضياء الدين.mp3",
  29: "009  29  سورة العنكبوت - Surah Al-'Ankabut.mp3",
  31: "031   31  سورة لقمان - Surah Luqman.mp3",
  32: "032   32  سورة السجدة - Surah As-Sajdah.mp3",
  33: "033   33  سورة الأحزاب - Surah Al-Ahzab.mp3",
  34: "034   34  سورة سبأ - Surah Saba.mp3",
  35: "035   35  سورة فاطر - Surah Fatir - تم تنقية الصوت وازالة صوت النفس.mp3",
  36: "036   36  سورة يس - Surah Ya-Sin.mp3",
  37: "037   37  سورة الصافات - Surah As-Saffat.mp3",
  38: "038   38  سورة ص - Surah Sad.mp3",
  41: "041   41  سورة فصلت - Surah Fussilat.mp3",
  44: "044   44  سورة الدخان - Surah Ad-Dukhan.mp3",
  46: "046   46  سورة الأحقاف - Surah Al-Ahqaf.mp3",
  47: "047    47  سورة محمد - Surah Muhammad.mp3",
  55: "055   55  سورة الرحمن - Surah Ar-Rahman.mp3",
  56: "056   56  سورة الواقعة - Surah Al-Waqi'ah.mp3",
  57: "057  57  سورة الحديد - Surah Al-Hadid.mp3",
  58: "058   58  سورة المجادلة - Surah Al-Mujadilah.mp3",
  59: "059   59  سورة الحشر - Surah Al-Hashr.mp3",
  60: "060    60  سورة الممتحنة - Surah Al-Mumtahanah.mp3",
  61: "061    61  سورة الصف - Surah As-Saf.mp3",
  62: "062   62  سورة الجمعة - Surah Al-Jumu'ah.mp3",
  63: "063   63  سورة المنافقون - Surah Al-Munafiqun.mp3",
  64: "064   64  سورة التغابن - Surah At-Taghabun.mp3",
  66: "066   66  سورة التحريم - Surah At-Tahrim.mp3",
  67: "067   67 سورة الملك - Surah Al-Mulk.mp3",
  68: "068   68  سورة القلم - Surah Al-Qalam.mp3",
  69: "069    69  سورة الحاقة - Surah Al-Haqqah.mp3",
  70: "070    70  سورة المعارج - Surah Al-Ma'arij.mp3",
  71: "037  71 سورة نوح - Surah Nuh.mp3",
  73: "073   73  سورة المزمل - Surah Al-Muzzammil.mp3",
  78: "078   78  سورة النبأ - تلاوة مرئية - Surah An-Naba.mp3"
};

const getReciterAudioUrl = (reciter: any, surahId: number): string => {
  if (reciter.id === "omar_diaa") {
    const filename = OMAR_DIAA_MAPPING[surahId];
    if (filename) {
      return `https://archive.org/download/20231112_20231112_1610/${encodeURIComponent(filename)}`;
    }
    const sId = surahId.toString().padStart(3, "0");
    return `https://server8.mp3quran.net/afs/${sId}.mp3`;
  }
  const sId = surahId.toString().padStart(3, "0");
  const server = reciter.mp3quranServer || "";
  if (server.startsWith("http://") || server.startsWith("https://")) {
    return `${server}/${sId}.mp3`;
  }
  return `https://${server}/${sId}.mp3`;
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

  // Dynamic Mp3quran profile photo URL base (canonical HTTPS path to avoid insecure redirects)
  return `https://www.mp3quran.net/ar/images/profile/${code}.jpg`;
};

const ReciterAvatar = ({ src, name, className }: { src: string; name: string; className?: string }) => {
  const [error, setError] = useState(false);

  const initials = useMemo(() => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const filteredParts = parts.filter(p => p !== "الشيخ");
    const p1 = filteredParts[0] || parts[0] || "";
    const p2 = filteredParts[1] || parts[1] || "";
    const char1 = p1 ? p1[0] : "";
    const char2 = p2 ? p2[0] : "";
    return (char1 + char2).substring(0, 2);
  }, [name]);

  const isImgur = src && src.includes("imgur.com");

  if (error || isImgur || !src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#e2b43b]/20 to-[#e2b43b]/5 text-[#e2b43b] font-black text-xs select-none ${className}`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
};

export function AudioLibrary() {
  const [currentSurah, setCurrentSurah] = useState(surahsData[0]);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localProgress, setLocalProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Sync localProgress with progress when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [search, setSearch] = useState("");
  const [showReciters, setShowReciters] = useState(false);
  const [reciterSearch, setReciterSearch] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [user, setUser] = useState<any>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "recent" | "meccan" | "medinan">("all");
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
    if (activeTab === "meccan") {
      list = list.filter(s => s.type === "meccan");
    }
    if (activeTab === "medinan") {
      list = list.filter(s => s.type === "medinan");
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
    const newSrc = getReciterAudioUrl(selectedReciter, currentSurah.id);
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

  const lastTimeUpdateRef = useRef<number>(0);

  const onTimeUpdate = () => {
    const a = audioRef.current;
    if (a) {
      const now = Date.now();
      if (now - lastTimeUpdateRef.current > 200 || a.ended) {
        lastTimeUpdateRef.current = now;
        setCurrentTime(a.currentTime);
        setDuration(a.duration || 0);
        const p = a.duration ? (a.currentTime / a.duration) * 100 : 0;
        setProgress(p);
        if (!isDragging) {
          setLocalProgress(p);
        }
      }
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
    const url = getReciterAudioUrl(selectedReciter, currentSurah.id);
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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setLocalProgress(val);
    if (!isDragging) {
      const a = audioRef.current;
      if (a && a.duration) {
        a.currentTime = (val / 100) * a.duration;
      }
    }
  };

  const handleSliderRelease = () => {
    setIsDragging(false);
    const a = audioRef.current;
    if (a && a.duration) {
      a.currentTime = (localProgress / 100) * a.duration;
    }
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
      className="h-full w-full flex flex-col font-['Tajawal'] overflow-hidden text-slate-800 dark:text-foreground relative bg-transparent"
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[250px_1fr_280px] gap-2 lg:gap-4 p-2 lg:p-4 overflow-hidden h-full">

        {/* ── COLUMN 1: LEFT SIDEBAR (الشيوخ) ── */}
        <aside className="hidden lg:flex flex-col gap-3 p-3 rounded-2xl bg-white/40 dark:bg-black/30 backdrop-blur-md border border-slate-200/50 dark:border-white/5 h-full overflow-hidden shadow-sm dark:shadow-none">
          {/* Header */}
          <div className="flex items-center justify-between py-0.5 relative shrink-0">
            <div className="absolute right-0 left-0 top-1/2 h-px bg-slate-200/30 dark:bg-white/5 -z-10" />
            <div className="bg-[#f8fafc]/50 dark:bg-[#0f1015]/50 px-3 mx-auto flex items-center gap-1.5 text-slate-500 dark:text-white/60">
              <span className="text-[10px] font-black tracking-wider font-arabic">الشيوخ</span>
              <Headphones className="w-3 h-3 text-[#e2b43b]" />
            </div>
          </div>

          {/* Search Input for Reciters */}
          <div className="relative shrink-0">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-white/20 pointer-events-none" />
            <input
              type="text"
              value={reciterSearch}
              onChange={e => setReciterSearch(e.target.value)}
              placeholder="ابحث عن قارئ..."
              className="w-full bg-slate-100/50 dark:bg-[#121318]/30 backdrop-blur-sm border border-slate-200/50 dark:border-white/5 rounded-lg py-1.5 pr-8 pl-3 text-[10px] outline-none focus:border-[#e2b43b]/40 focus:bg-white/80 dark:focus:bg-[#121318]/60 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20 text-slate-800 dark:text-white font-bold text-right"
            />
            {reciterSearch && (
              <button onClick={() => setReciterSearch("")} className="absolute left-2.5 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white" />
              </button>
            )}
          </div>

          {/* Scrollable Reciters List */}
          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-1.5 pr-0.5">
            {filteredReciters.map((rec) => {
              const isActive = selectedReciter.id === rec.id;
              const popular = POPULAR_RECITERS.find(p => p.id === rec.id);
              const listens = popular ? popular.listens : "مخصص";
              return (
                <div
                  key={rec.id}
                  onClick={() => {
                    setSelectedReciter(rec);
                  }}
                  className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-[#e2b43b]/10 to-transparent border border-[#e2b43b]/20 shadow-[0_4px_20px_rgba(226,180,59,0.03)]"
                      : "hover:bg-slate-100 dark:hover:bg-white/[0.01] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* Avatar */}
                    <ReciterAvatar
                      src={getReciterAvatar(rec.id, rec.name)}
                      name={rec.name}
                      className={`w-8.5 h-8.5 rounded-full border transition-all ${
                        isActive ? "border-[#e2b43b] scale-105" : "border-slate-200 dark:border-white/10 group-hover:border-slate-300 dark:group-hover:border-white/20"
                      }`}
                    />

                    {/* Meta */}
                    <div className="text-right">
                      <p className={`text-[11px] font-black transition-colors ${isActive ? "text-[#e2b43b]" : "text-slate-700 dark:text-white/80 group-hover:text-slate-900 dark:group-hover:text-white"}`}>
                        {rec.name.split(" ").slice(0, 3).join(" ")}
                      </p>
                      {popular && (
                        <p className="text-[9px] text-slate-400 dark:text-white/25 font-bold mt-0.5">استماع {listens}</p>
                      )}
                    </div>
                  </div>

                  {/* Play Button */}
                  <button className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-[#e2b43b] text-black shadow-lg shadow-[#e2b43b]/15 scale-105"
                      : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 group-hover:bg-slate-200 dark:group-hover:bg-white/10 group-hover:text-slate-700 dark:group-hover:text-white"
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
        </aside>

        {/* ── COLUMN 2: CENTER PANEL (المشغل وقائمة السور) ── */}
        <div className="flex flex-col gap-2 sm:gap-4 overflow-hidden min-w-0">

          {/* 1. Sticky Player, Search & Filters Section */}
          <div className="relative z-30 bg-transparent pb-0.5 pt-0.5 flex flex-col gap-2 sm:gap-3 shadow-sm dark:shadow-none shrink-0">
            {/* Large Main Player Widget */}
            <div className="relative rounded-2xl bg-white/40 dark:bg-black/30 backdrop-blur-md border border-slate-200/50 dark:border-white/5 p-2.5 sm:p-5 overflow-hidden shadow-md dark:shadow-2xl flex flex-col sm:flex-row items-center gap-2.5 sm:gap-4">
              {/* Background pattern */}
              <div className="absolute inset-0 islamic-pattern opacity-[0.01] pointer-events-none" />

              {/* Album image on the right (RTL) */}
              <div className="hidden sm:block relative w-16 h-16 lg:w-24 lg:h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-2xl shrink-0 group">
                <img
                  src="/quran_3d_hero.png"
                  alt="Quran"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    e.currentTarget.src = "/logo/logo.png";
                  }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Disc className={`w-6 h-6 text-[#e2b43b] ${isPlaying ? "animate-spin-slow" : ""}`} />
                </div>
              </div>

              {/* Content info & Waveform player */}
              <div className="flex-1 w-full text-center sm:text-right flex flex-col gap-2 sm:gap-3">
                {/* Mobile compact title/reciter row */}
                <div className="flex sm:hidden items-center justify-between w-full">
                  <div className="text-right">
                    <h2 className="text-sm font-black font-arabic text-slate-800 dark:text-white leading-none">
                      سورة {currentSurah.name}
                    </h2>
                    <p className="text-[9px] text-slate-400 dark:text-white/30 font-bold mt-1">
                      {currentSurah.total_verses} آية
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReciters(true)}
                    className="flex items-center gap-1 text-[#e2b43b] hover:text-[#c99f33] font-black bg-[#e2b43b]/10 dark:bg-[#e2b43b]/5 px-2 py-1 rounded-lg border border-[#e2b43b]/20 transition-all active:scale-95 shrink-0 text-[10px]"
                  >
                    <Headphones className="w-2.5 h-2.5" />
                    <span>{selectedReciter.name.split(" ").slice(0, 2).join(" ")}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Desktop detailed block */}
                <div className="hidden sm:block">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-white/20 mb-0.5">جاري الاستماع الآن</p>
                  <h2 className="text-lg lg:text-xl font-black font-arabic text-slate-800 dark:text-white mb-1.5 leading-none">
                    سورة {currentSurah.name}
                  </h2>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-500 dark:text-white/40 text-[10px] font-bold">
                    <button
                      onClick={() => setShowReciters(true)}
                      className="flex items-center gap-1 text-[#e2b43b] hover:text-[#c99f33] font-black bg-[#e2b43b]/10 dark:bg-[#e2b43b]/5 px-2.5 py-1 rounded-full border border-[#e2b43b]/20 transition-all active:scale-95 shrink-0"
                    >
                      <Headphones className="w-3 h-3" />
                      <span>{selectedReciter.name}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <span>•</span>
                    <span>{currentSurah.total_verses} آية</span>
                  </div>
                </div>

                {/* Progress Slider & Waveform */}
                <div className="space-y-1 sm:space-y-2">
                  {/* Waveform Visualization (Dense and Decorative) */}
                  <div className="hidden sm:flex items-end justify-center gap-[2.5px] h-6 w-full opacity-60 pointer-events-none" dir="ltr">
                    {Array.from({ length: waveBarCount }).map((_, i) => {
                      const isActive = (i / waveBarCount) * 100 <= progress;
                      const height = 6 + Math.sin(i * 0.45) * 8 + (i % 4 === 0 ? 4 : 0);
                      return (
                        <div
                          key={i}
                          className={`w-[2.5px] rounded-full transition-all duration-300 ${
                            isActive
                              ? "bg-[#e2b43b]"
                              : "bg-slate-200 dark:bg-white/10"
                          }`}
                          style={{ height: `${height}px` }}
                        />
                      );
                    })}
                  </div>

                  {/* Seek Bar / Progress Slider - Inline on Mobile */}
                  <div className="flex items-center gap-2 w-full mt-1 sm:mt-0">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-white/25 tabular-nums shrink-0">{fmt(currentTime)}</span>
                    <div className="relative flex-1 h-3 flex items-center group/slider">
                      {/* Background track */}
                      <div className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden relative">
                        {/* Active progress track */}
                        <div
                          className="absolute inset-y-0 right-0 bg-[#e2b43b] rounded-full"
                          style={{ width: `${localProgress}%` }}
                        />
                      </div>
                      {/* Drag thumb/handle */}
                      <div
                        className="absolute w-2.5 h-2.5 rounded-full bg-white border border-[#e2b43b] shadow-md transition-transform scale-100 sm:scale-0 group-hover/slider:scale-100 focus-within:scale-100"
                        style={{ right: `calc(${localProgress}% - 5px)` }}
                      />
                      {/* Native slider input for interaction */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={localProgress}
                        onChange={handleSliderChange}
                        onMouseDown={() => setIsDragging(true)}
                        onTouchStart={() => setIsDragging(true)}
                        onMouseUp={handleSliderRelease}
                        onTouchEnd={handleSliderRelease}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-white/25 tabular-nums shrink-0">{fmt(duration)}</span>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row items-center justify-between mt-1 sm:mt-0.5 border-t border-slate-100 dark:border-white/5 pt-2 w-full overflow-hidden">
                  {/* Playback Controls & Volume */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-3 shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#e2b43b] text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current translate-x-[0.5px]" />}
                      </button>
                      <button onClick={handlePrev} className="p-1 sm:p-2 text-slate-400 hover:text-slate-800 dark:text-white/40 dark:hover:text-white rounded-full transition-all active:scale-95"><SkipForward className="w-3.5 h-3.5 fill-current" /></button>
                      <button onClick={handleNext} className="p-1 sm:p-2 text-slate-400 hover:text-slate-800 dark:text-white/40 dark:hover:text-white rounded-full transition-all active:scale-95"><SkipBack className="w-3.5 h-3.5 fill-current" /></button>
                      
                      {/* Shuffle & Repeat are only visible on desktop here; on mobile they go to the scrollable row */}
                      <button onClick={() => setIsShuffle(!isShuffle)} className={`hidden sm:block p-1.5 sm:p-2 rounded-full transition-all ${isShuffle ? "text-[#e2b43b] bg-[#e2b43b]/10" : "text-slate-400 hover:text-slate-700 dark:text-white/30 dark:hover:text-white"}`}><Shuffle className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setIsRepeat(!isRepeat)} className={`hidden sm:block p-1.5 sm:p-2 rounded-full transition-all ${isRepeat ? "text-[#e2b43b] bg-[#e2b43b]/10" : "text-slate-400 hover:text-slate-700 dark:text-white/30 dark:hover:text-white"}`}><Repeat className="w-3.5 h-3.5" /></button>
                    </div>

                    {/* Volume Slider - Fixed width and non-overlapping */}
                    <div className="flex items-center gap-1.5 w-24 sm:w-28 shrink-0">
                      <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white p-1 shrink-0">
                        {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          setVolume(parseFloat(e.target.value));
                          if (isMuted) setIsMuted(false);
                        }}
                        className="w-full h-1 bg-slate-200 dark:bg-white/10 rounded-full cursor-pointer accent-[#e2b43b]"
                      />
                    </div>
                  </div>

                  {/* Divider (Desktop only) */}
                  <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-white/5 mx-1" />

                  {/* Extra Actions Scrollable Row */}
                  <div className="w-full sm:flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 justify-start -mx-2 px-2 sm:mx-0 sm:px-0">
                    {/* Shuffle & Repeat added on mobile here */}
                    <button
                      onClick={() => setIsShuffle(!isShuffle)}
                      className={`block sm:hidden px-2.5 py-1 rounded-lg text-[9px] font-black transition-all border shrink-0 ${
                        isShuffle
                          ? "bg-[#e2b43b]/10 border-[#e2b43b]/20 text-[#e2b43b]"
                          : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/60"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Shuffle className="w-3 h-3" />
                        <span>عشوائي</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setIsRepeat(!isRepeat)}
                      className={`block sm:hidden px-2.5 py-1 rounded-lg text-[9px] font-black transition-all border shrink-0 ${
                        isRepeat
                          ? "bg-[#e2b43b]/10 border-[#e2b43b]/20 text-[#e2b43b]"
                          : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/60"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        <span>تكرار</span>
                      </div>
                    </button>

                    <button
                      onClick={handleShare}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 hover:text-slate-800 dark:hover:text-white text-[9px] font-black transition-all flex items-center gap-1 border border-slate-200 dark:border-white/5 shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>مشاركة</span>
                    </button>

                    <button
                      onClick={() => toggleFavorite(currentSurah.id)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all flex items-center gap-1 border shrink-0 ${
                        favorites.includes(currentSurah.id)
                          ? "bg-[#e2b43b]/10 border-[#e2b43b]/20 text-[#e2b43b]"
                          : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/60 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${favorites.includes(currentSurah.id) ? "fill-current" : ""}`} />
                      <span>المفضلة</span>
                    </button>

                    <button
                      onClick={downloadSurah}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 hover:text-slate-800 dark:hover:text-white text-[9px] font-black transition-all flex items-center gap-1 border border-slate-200 dark:border-white/5 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل</span>
                    </button>

                    <button
                      onClick={toggleSleepTimer}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all flex items-center gap-1 border shrink-0 ${
                        sleepTimeLeft !== null
                          ? "bg-[#e2b43b]/10 border-[#e2b43b]/20 text-[#e2b43b]"
                          : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/60 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>{sleepTimeLeft !== null ? fmt(sleepTimeLeft) : "موقت إيقاف"}</span>
                    </button>

                    <button
                      onClick={togglePlaybackSpeed}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black transition-all flex items-center gap-1 border shrink-0 ${
                        playbackSpeed !== 1.0
                          ? "bg-[#e2b43b]/10 border-[#e2b43b]/20 text-[#e2b43b]"
                          : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/60 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      <Gauge className="w-3.5 h-3.5" />
                      <span>{playbackSpeed.toFixed(2)}x</span>
                    </button>

                    {/* HQ Indicator */}
                    <div className="mr-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#e2b43b]/10 border border-[#e2b43b]/20 text-[#e2b43b] text-[9px] font-black tracking-wider shrink-0">
                      <span>HQ</span>
                      <ChevronDown className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters row */}
            <div className="sticky top-0 z-20 lg:relative lg:top-auto lg:z-auto bg-[#f8fafc]/80 dark:bg-[#0c0d10]/80 backdrop-blur-md py-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100/50 dark:border-white/5 lg:border-none">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-white/20 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث عن سورة أو شيخ..."
                  className="w-full bg-white/50 dark:bg-[#121318]/30 backdrop-blur-sm border border-slate-200/50 dark:border-white/5 rounded-xl py-2 pr-9 pl-3 text-xs outline-none focus:border-[#e2b43b]/40 focus:bg-white/80 dark:focus:bg-[#121318]/60 transition-all placeholder:text-slate-400 dark:placeholder:text-white/20 text-slate-800 dark:text-white font-bold text-right"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white" />
                  </button>
                )}
              </div>

              {/* Tabs list */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 w-full">
                {[
                  { key: "all", label: "الكل" },
                  { key: "meccan", label: "سور مكية" },
                  { key: "medinan", label: "سور مدنية" },
                  { key: "favorites", label: "المفضلة" },
                  { key: "recent", label: "الأكثر استماعاً" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black whitespace-nowrap transition-all ${
                      activeTab === key
                        ? "bg-[#e2b43b] text-black shadow-md shadow-[#e2b43b]/10"
                        : "bg-white/40 dark:bg-[#121318]/30 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}

                {/* Sort Order Toggles */}
                <button
                  onClick={() => setSortOrder(sortOrder === "alphabetical" ? "default" : "alphabetical")}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black whitespace-nowrap transition-all border ${
                    sortOrder === "alphabetical"
                      ? "bg-[#e2b43b]/10 border-[#e2b43b]/20 text-[#e2b43b]"
                      : "bg-white/40 dark:bg-[#121318]/30 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  الفهرسات
                </button>
                <button
                  onClick={() => setSortOrder(sortOrder === "verses" ? "default" : "verses")}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black whitespace-nowrap transition-all border ${
                    sortOrder === "verses"
                      ? "bg-[#e2b43b]/10 border-[#e2b43b]/20 text-[#e2b43b]"
                      : "bg-white/40 dark:bg-[#121318]/30 border border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  ترتيب السور
                </button>

                {/* Support Yaqeen Button */}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open_subscription_modal'))}
                  className="px-2.5 py-1.5 rounded-lg text-[9px] font-black whitespace-nowrap bg-[#e2b43b]/10 border border-[#e2b43b]/20 text-[#e2b43b] hover:bg-[#e2b43b]/20 transition-all shrink-0 mr-auto flex items-center gap-1"
                >
                  <Crown className="w-3 h-3 text-[#e2b43b]" />
                  <span>ادعم يقين</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Surah Table */}
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            {/* Surah List Table (tightened paddings py-2.5) */}
            <div className="rounded-2xl bg-white/40 dark:bg-[#121318]/15 backdrop-blur-md border border-slate-200/50 dark:border-white/5 overflow-hidden shadow-sm dark:shadow-none flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center px-4 py-2.5 text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5">
                <div className="w-8 text-center">#</div>
                <div className="flex-1 text-right">السورة</div>
                <div className="hidden sm:block w-16 text-center">آيات</div>
                <div className="hidden md:block w-24 text-center">مدة الاستماع</div>
                <div className="w-10" />
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100 dark:divide-white/5 overflow-y-auto flex-1 no-scrollbar">
                {allFiltered.map((surah) => {
                  const isCurrent = surah.id === currentSurah.id;
                  const isFav = favorites.includes(surah.id);
                  return (
                    <div
                      key={surah.id}
                      onClick={() => handleSurahSelect(surah)}
                      className={`group flex items-center px-4 py-2 cursor-pointer transition-all duration-300 ${
                        isCurrent
                          ? "bg-gradient-to-r from-[#e2b43b]/10 via-[#e2b43b]/5 to-transparent text-[#e2b43b]"
                          : "hover:bg-slate-50 dark:hover:bg-white/[0.01]"
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
                          <span className={`text-[11px] font-black tabular-nums transition-colors ${isCurrent ? "text-[#e2b43b]" : "text-slate-300 dark:text-white/20 group-hover:text-slate-500 dark:group-hover:text-white/50"}`}>
                            {surah.id}
                          </span>
                        )}
                      </div>

                      {/* Name */}
                      <div className="flex-1 text-right min-w-0 px-2.5">
                        <p className={`text-xs font-black font-arabic leading-tight ${isCurrent ? "text-[#e2b43b]" : "text-slate-800 dark:text-white"}`}>
                          {surah.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 dark:text-white/25 font-bold">
                          <span className="truncate">{surah.transliteration}</span>
                          <span className="sm:hidden">•</span>
                          <span className="sm:hidden">{surah.total_verses} آية</span>
                          <span className="md:hidden">•</span>
                          <span className="md:hidden">{getSurahDuration(surah.id, surah.total_verses)}</span>
                        </div>
                      </div>

                      {/* Verses */}
                      <div className="hidden sm:block w-16 text-center font-bold text-[11px] text-slate-400 dark:text-white/30 group-hover:text-slate-600 dark:group-hover:text-white/50">
                        {surah.total_verses}
                      </div>

                      {/* Mock Duration */}
                      <div className="hidden md:block w-24 text-center font-black text-[11px] text-slate-400 dark:text-white/30 group-hover:text-slate-600 dark:group-hover:text-white/50 tabular-nums">
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
                              : "text-slate-300 dark:text-white/10 opacity-0 group-hover:opacity-100 hover:text-slate-500 dark:hover:text-white/50"
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
                    <Search className="w-8 h-8 text-slate-200 dark:text-white/5" />
                    <p className="text-xs text-slate-400 dark:text-white/25 font-bold">لا توجد سور مطابقة لبحثك</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── COLUMN 3: RIGHT COLUMN (التنقل والدعم والمصغر) ── */}
        <aside className="hidden lg:flex flex-col gap-4 overflow-y-auto no-scrollbar">

          {/* 1. Navigation / Filters Card */}
          <div className="rounded-2xl bg-white/40 dark:bg-black/30 backdrop-blur-md border border-slate-200/50 dark:border-white/5 p-3 flex flex-col gap-0.5 shadow-xl">
            <div className="flex items-center justify-end gap-2 px-2 py-0.5 text-slate-400 dark:text-white/40 mb-0.5 border-b border-slate-100 dark:border-white/5 pb-1.5">
              <span className="text-[10px] font-black font-arabic">صوتيات القرآن</span>
              <Headphones className="w-3 h-3 text-[#e2b43b]" />
            </div>

            {[
              { key: "all", label: "جميع السور", icon: ListMusic },
              { key: "meccan", label: "السور المكية", icon: Disc },
              { key: "medinan", label: "السور المدنية", icon: Disc },
              { key: "favorites", label: "المفضلة", icon: Heart },
              { key: "recent", label: "آخر استماع", icon: Clock },
              { key: "download", label: "التنزيلات", icon: Download, action: downloadSurah },
              { key: "playlist", label: "قائمة التشغيل", icon: ListMusic },
              { key: "support", label: "ادعم يقين 👑", icon: Crown, action: () => window.dispatchEvent(new CustomEvent('open_subscription_modal')) },
            ].map(({ key, label, icon: Icon, action }) => {
              const active = activeTab === key || (key === "playlist" && activeTab === "all");
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (action) action();
                    else if (key !== "playlist") setActiveTab(key as any);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all text-right ${
                    active
                      ? "bg-[#e2b43b] text-black shadow-md shadow-[#e2b43b]/10"
                      : "text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.01]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3 h-3 shrink-0" />
                    <span>{label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
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
              className="relative w-full max-w-md bg-white dark:bg-[#121318] rounded-t-3xl border-t border-slate-200 dark:border-t-white/10 overflow-hidden flex flex-col shadow-2xl"
              style={{ maxHeight: "75dvh" }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-8 h-1 bg-slate-200 dark:bg-white/10 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 pb-3 pt-1 flex items-center justify-between shrink-0 border-b border-slate-100 dark:border-white/5">
                <button
                  onClick={() => setShowReciters(false)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400 dark:text-white/40" />
                </button>
                <h3 className="text-sm font-black text-slate-800 dark:text-white font-arabic">اختر القارئ</h3>
                <div className="w-8" />
              </div>

              {/* Search input inside drawer */}
              <div className="px-4 py-3 shrink-0 border-b border-slate-100 dark:border-white/5">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/20 pointer-events-none" />
                  <input
                    type="text"
                    value={reciterSearch}
                    onChange={e => setReciterSearch(e.target.value)}
                    placeholder="ابحث عن قارئ..."
                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pr-9 pl-9 text-xs outline-none focus:border-[#e2b43b]/40 focus:bg-slate-200 dark:focus:bg-white/[0.07] transition-all placeholder:text-slate-400 dark:placeholder:text-white/20 font-bold text-right text-slate-800 dark:text-white"
                  />
                  {reciterSearch && (
                    <button onClick={() => setReciterSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Reciters list with actual photos */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-0.5">
                {filteredReciters.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                    <Search className="w-8 h-8 text-slate-300 dark:text-white/10" />
                    <p className="text-xs text-slate-400 dark:text-white/30 font-bold">لا يوجد قراء بهذا الاسم</p>
                  </div>
                ) : (
                  filteredReciters.map(rec => {
                    const isSel = selectedReciter.id === rec.id;
                    return (
                      <button
                        key={rec.id}
                        onClick={() => { setSelectedReciter(rec); setShowReciters(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-right ${
                          isSel ? "bg-[#e2b43b]/10 text-[#e2b43b]" : "hover:bg-slate-50 dark:hover:bg-white/[0.01] text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {/* Sheikh photo/avatar in the selection drawer */}
                        <ReciterAvatar
                          src={getReciterAvatar(rec.id, rec.name)}
                          name={rec.name}
                          className={`w-8 h-8 rounded-full border shrink-0 ${
                            isSel ? "border-[#e2b43b]" : "border-slate-200 dark:border-white/10"
                          }`}
                        />
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
