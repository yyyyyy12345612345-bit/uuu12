"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, BookOpen, Headphones, Bookmark, Sparkles,
  ChevronLeft, ChevronRight, ArrowLeft, Heart, Compass, Trophy
} from "lucide-react";
import { navigateInstantly } from "@/lib/navigation";
import { useTheme } from "@/components/ThemeProvider";

// Premium Islamic patterns & gradients
const BACKGROUND_LIGHT = "linear-gradient(180deg, #FAF7F0 0%, #F5EFE6 50%, #EAE3D2 100%)";
const BACKGROUND_DARK = "linear-gradient(180deg, #0A0A0C 0%, #111115 50%, #161622 100%)";

interface ReciterDemo {
  id: string;
  name: string;
  avatarText: string;
  audioUrl: string;
  avatarColor: string;
}

const RECITERS_DEMO: ReciterDemo[] = [
  {
    id: "minshawy",
    name: "محمد صديق المنشاوي",
    avatarText: "م",
    audioUrl: "https://server10.mp3quran.net/minsh/001.mp3",
    avatarColor: "from-amber-500/20 to-yellow-600/20 border-amber-500/30 text-amber-500"
  },
  {
    id: "ghamd",
    name: "سعد الغامدي",
    avatarText: "س",
    audioUrl: "https://server7.mp3quran.net/s_gmd/001.mp3",
    avatarColor: "from-emerald-500/20 to-teal-600/20 border-emerald-500/30 text-emerald-500"
  },
  {
    id: "afasy",
    name: "مشاري العفاسي",
    avatarText: "ع",
    audioUrl: "https://server8.mp3quran.net/afs/001.mp3",
    avatarColor: "from-blue-500/20 to-indigo-600/20 border-blue-500/30 text-blue-500"
  },
  {
    id: "basit",
    name: "عبد الباسط عبد الصمد",
    avatarText: "ب",
    audioUrl: "https://server7.mp3quran.net/basit/001.mp3",
    avatarColor: "from-purple-500/20 to-rose-600/20 border-purple-500/30 text-purple-500"
  },
  {
    id: "maher",
    name: "ماهر المعيقلي",
    avatarText: "هـ",
    audioUrl: "https://server12.mp3quran.net/maher/001.mp3",
    avatarColor: "from-amber-600/20 to-orange-600/20 border-amber-600/30 text-[#b8860b]"
  },
  {
    id: "yasser",
    name: "ياسر الدوسري",
    avatarText: "ي",
    audioUrl: "https://server11.mp3quran.net/yasser/001.mp3",
    avatarColor: "from-cyan-500/20 to-sky-600/20 border-cyan-500/30 text-cyan-500"
  }
];

export function LandingPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  
  // Reciter slider states
  const sliderRef = useRef<HTMLDivElement>(null);

  // Stats numerical counter values
  const [counts, setCounts] = useState({ users: 0, surahs: 0, reciters: 0, translations: 0 });

  useEffect(() => {
    // Soft animate statistic counters on mount
    const duration = 2000;
    const steps = 50;
    const intervalTime = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setCounts({
        users: Math.floor((100000 / steps) * step),
        surahs: Math.floor((114 / steps) * step),
        reciters: Math.floor((200 / steps) * step),
        translations: Math.floor((50 / steps) * step)
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounts({ users: 100000, surahs: 114, reciters: 200, translations: 50 });
      }
    }, intervalTime);

    return () => {
      clearInterval(timer);
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  const handlePlayReciter = (reciter: ReciterDemo) => {
    if (playingId === reciter.id) {
      if (audio) {
        audio.pause();
      }
      setPlayingId(null);
    } else {
      if (audio) {
        audio.pause();
      }
      const newAudio = new Audio(reciter.audioUrl);
      newAudio.play().catch(e => console.log("Audio playback failed:", e));
      newAudio.onended = () => setPlayingId(null);
      setAudio(newAudio);
      setPlayingId(reciter.id);
    }
  };

  useEffect(() => {
    return () => {
      if (audio) audio.pause();
    };
  }, [audio]);

  const slideSlider = (direction: "left" | "right") => {
    if (sliderRef.current) {
      const scrollAmount = 300;
      sliderRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div 
      className="relative w-full h-full overflow-y-auto no-scrollbar font-['Tajawal'] select-none pb-24"
      style={{ background: isDark ? BACKGROUND_DARK : BACKGROUND_LIGHT }}
      dir="rtl"
    >
      {/* Dynamic Background Sparkles/Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 islamic-pattern opacity-[0.02] dark:opacity-[0.03] scale-110" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#d4af37]/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-blue-500/3 blur-[150px]" />
      </div>

      {/* Floating lanterns background container */}
      <div className="absolute top-10 left-10 md:left-24 w-12 h-24 pointer-events-none opacity-45 dark:opacity-20 animate-bounce duration-[4000ms] hidden sm:block">
        <svg viewBox="0 0 100 200" fill="none" className="w-full h-full text-[#d4af37]">
          <line x1="50" y1="0" x2="50" y2="80" stroke="currentColor" strokeWidth="2" />
          <path d="M30 80 L70 80 L80 120 L50 160 L20 120 Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
          <circle cx="50" cy="120" r="10" fill="currentColor" className="animate-pulse" />
        </svg>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-14 pb-8 flex flex-col-reverse lg:flex-row items-center justify-between gap-12">
        {/* Right Side: Text & Actions */}
        <div className="flex-1 text-right space-y-6 max-w-2xl">
          {/* Badge Pill */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/20 text-[#b8860b] dark:text-[#d4af37]"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span className="text-[11px] font-black tracking-wide">خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ</span>
          </motion.div>

          {/* Main Titles */}
          <div className="space-y-3">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-zinc-900 dark:text-white"
            >
              رحلتك اليومية <br />
              مع <span className="text-[#b8860b] dark:text-[#d4af37] bg-gradient-to-r from-[#b8860b] to-[#d4af37] bg-clip-text text-transparent">القرآن الكريم</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base md:text-lg font-bold leading-loose max-w-lg"
            >
              استمع، اقرأ، تدبر، واحفظ كلام الله أينما كنت بتجربة رقمية فريدة ونظام نقاط تحفيزي.
            </motion.p>
          </div>

          {/* CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <button 
              onClick={() => navigateInstantly("/mushaf-choice")}
              className="px-8 py-3.5 rounded-[1.5rem] bg-[#b8860b] hover:bg-[#d4af37] text-white font-black text-sm transition-all duration-300 shadow-[0_20px_50px_rgba(184,134,11,0.25)] hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Headphones className="w-4 h-4" />
              <span>ابدأ التلاوة</span>
            </button>
            
            <button 
              onClick={() => navigateInstantly("/mushaf-full")}
              className="px-8 py-3.5 rounded-[1.5rem] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[#b8860b] dark:text-[#d4af37] font-black text-sm hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>المصحف الرقمي</span>
            </button>
          </motion.div>
        </div>

        {/* Left Side: 3D Quran Stand Render */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, x: -30 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.9, cubicBezier: [0.16, 1, 0.3, 1] }}
          className="flex-1 w-full flex items-center justify-center relative"
        >
          {/* Subtle halo ring background */}
          <div className="absolute w-[280px] h-[280px] md:w-[380px] md:h-[380px] rounded-full border border-[#d4af37]/15 animate-[spin_100s_linear_infinite] opacity-60 pointer-events-none" />
          
          <div className="relative w-full max-w-[340px] md:max-w-[420px] aspect-[4/3] rounded-3xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_70px_rgba(0,0,0,0.5)] border border-[#d4af37]/10 bg-white/5 dark:bg-black/10 backdrop-blur-sm group">
            <img 
              src="/quran_3d_hero.png" 
              alt="المصحف الشريف ثلاثي الأبعاد"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Elegant overlay highlight */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />
          </div>
        </motion.div>
      </section>

      {/* Statistics Section Banner */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full bg-white/60 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/30 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {/* 100K Users */}
          <div className="space-y-1">
            <h3 className="text-2xl md:text-3xl font-black text-[#b8860b] dark:text-[#d4af37]">
              {counts.users >= 100000 ? "100K+" : `${Math.floor(counts.users / 1000)}K+`}
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">مستخدم حول العالم</p>
          </div>
          {/* 114 Surahs */}
          <div className="space-y-1 border-r border-zinc-200/50 dark:border-zinc-800/50">
            <h3 className="text-2xl md:text-3xl font-black text-zinc-800 dark:text-zinc-100">
              {counts.surahs}
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">سورة كاملة</p>
          </div>
          {/* 200+ Reciters */}
          <div className="space-y-1 border-r border-zinc-200/50 dark:border-zinc-800/50">
            <h3 className="text-2xl md:text-3xl font-black text-zinc-800 dark:text-zinc-100">
              {counts.reciters}+
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">قارئ ومقرئ</p>
          </div>
          {/* 50+ Translations */}
          <div className="space-y-1 border-r border-zinc-200/50 dark:border-zinc-800/50">
            <h3 className="text-2xl md:text-3xl font-black text-[#b8860b] dark:text-[#d4af37]">
              {counts.translations}+
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold">ترجمة معاني</p>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-8">
        <div className="text-center md:text-right space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">أبرز خدمات المنصة</h2>
          <p className="text-zinc-400 dark:text-zinc-500 text-xs font-bold">كل ما تحتاجه لتلاوة وفهم كتاب الله في مكان واحد</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Ayah by Ayah */}
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[1.5rem] shadow-md dark:shadow-xl flex flex-col justify-between gap-6 cursor-pointer"
            onClick={() => navigateInstantly("/mushaf")}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-500/10">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">آية بآية</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed font-bold mt-1">تفسير وشرح مبسط لكل آية لتسهيل التدبر وفهم معاني القرآن الكريم.</p>
              </div>
            </div>
            <button className="w-9 h-9 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-[#b8860b] dark:hover:text-[#d4af37] transition-all cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Card 2: Al-Mushaf Al-Murattal */}
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[1.5rem] shadow-md dark:shadow-xl flex flex-col justify-between gap-6 cursor-pointer"
            onClick={() => navigateInstantly("/library")}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-500/10">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">المصحف المرتل</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed font-bold mt-1">استمع لتلاوات عذبة بجودة عالية من كبار القراء في العالم الإسلامي.</p>
              </div>
            </div>
            <button className="w-9 h-9 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-[#b8860b] dark:hover:text-[#d4af37] transition-all cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Card 3: Bookmarks */}
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[1.5rem] shadow-md dark:shadow-xl flex flex-col justify-between gap-6 cursor-pointer"
            onClick={() => navigateInstantly("/mushaf-choice")}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-500/10">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">علاماتك المفضلة</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed font-bold mt-1">احفظ مواضع قراءتك الأخيرة والآيات المميزة للرجوع إليها فوراً.</p>
              </div>
            </div>
            <button className="w-9 h-9 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-[#b8860b] dark:hover:text-[#d4af37] transition-all cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </motion.div>

          {/* Card 4: Daily Remembrance */}
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 rounded-[1.5rem] shadow-md dark:shadow-xl flex flex-col justify-between gap-6 cursor-pointer"
            onClick={() => navigateInstantly("/daily")}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-500/10">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white">أدعية وأذكار</h3>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed font-bold mt-1">حافظ على وردك اليومي من الأذكار والتسبيحات مع عداد تفاعلي ذكي.</p>
              </div>
            </div>
            <button className="w-9 h-9 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-[#b8860b] dark:hover:text-[#d4af37] transition-all cursor-pointer">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Reciters Slider Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => slideSlider("right")}
              className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-[#b8860b] transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => slideSlider("left")}
              className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-[#b8860b] transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="text-right space-y-1">
            <h2 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white">أشهر القراء</h2>
            <p className="text-zinc-400 dark:text-zinc-500 text-xs font-bold">استمع لسورة الفاتحة بأعذب الأصوات المتوفرة</p>
          </div>
        </div>

        {/* Reciter Circular Cards Slider */}
        <div 
          ref={sliderRef}
          className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth py-4 px-2"
        >
          {RECITERS_DEMO.map((reciter) => {
            const isPlaying = playingId === reciter.id;
            return (
              <motion.div
                key={reciter.id}
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-3 shrink-0 p-4 bg-white/30 dark:bg-zinc-900/10 border border-zinc-200/40 dark:border-zinc-800/40 rounded-3xl min-w-[150px] shadow-sm relative group"
              >
                {/* Circular Avatar / Initial Display */}
                <div 
                  className={`w-20 h-20 rounded-full bg-gradient-to-tr ${reciter.avatarColor} border-2 flex items-center justify-center relative cursor-pointer shadow-inner`}
                  onClick={() => handlePlayReciter(reciter)}
                >
                  <span className="text-2xl font-black leading-none">{reciter.avatarText}</span>
                  
                  {/* Play/Pause Hover Overlay */}
                  <div className={`absolute inset-0 rounded-full bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                    {isPlaying ? (
                      <Pause className="w-7 h-7 text-white fill-white animate-pulse" />
                    ) : (
                      <Play className="w-7 h-7 text-white fill-white" />
                    )}
                  </div>

                  {/* Equalizer animation when playing */}
                  {isPlaying && (
                    <div className="absolute -bottom-1 flex gap-0.5 justify-center items-end h-4 w-8">
                      <span className="w-1 bg-white/80 animate-music-bar" style={{ animationDelay: "0.1s" }} />
                      <span className="w-1 bg-white/80 animate-music-bar" style={{ animationDelay: "0.3s" }} />
                      <span className="w-1 bg-white/80 animate-music-bar" style={{ animationDelay: "0.2s" }} />
                    </div>
                  )}
                </div>

                <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 text-center truncate max-w-[120px]">
                  {reciter.name}
                </span>

                <button 
                  onClick={() => handlePlayReciter(reciter)}
                  className={`px-3 py-1 rounded-full text-[9px] font-black tracking-wider uppercase transition-all ${isPlaying ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-[#d4af37]/10 text-[#b8860b] dark:text-[#d4af37] border border-[#d4af37]/20"}`}
                >
                  {isPlaying ? "إيقاف المؤقت" : "استمع الآن 🎧"}
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
