"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Star } from "lucide-react";
import { navigateInstantly } from "@/lib/navigation";
import { useTheme } from "@/components/ThemeProvider";

// Premium detailed custom SVGs for the exact look of the image
const BookOpenIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
    <path d="M32 18 Q20 16 8 20 L8 52 Q20 48 32 50 Z" fill={`${color}08`} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M32 18 Q44 16 56 20 L56 52 Q44 48 32 50 Z" fill={`${color}08`} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="32" y1="18" x2="32" y2="50" stroke={color} strokeWidth="3" strokeLinecap="round" />
    <path d="M14 28 H26 M14 34 H26 M14 40 H24" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
    <path d="M50 28 H38 M50 34 H38 M50 40 H40" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
  </svg>
);

const VerticalBookIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
    <rect x="16" y="10" width="32" height="44" rx="4" fill={`${color}08`} stroke={color} strokeWidth="2" />
    <line x1="22" y1="10" x2="22" y2="54" stroke={color} strokeWidth="2" />
    <circle cx="34" cy="32" r="8" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" />
    {/* Geometric center design */}
    <path d="M34 28 L38 32 L34 36 L30 32 Z" fill={`${color}20`} stroke={color} strokeWidth="1.5" />
    <line x1="26" y1="20" x2="42" y2="20" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
    <line x1="26" y1="44" x2="42" y2="44" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
  </svg>
);

const TafseerDocIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-14 h-14">
    <rect x="14" y="10" width="36" height="44" rx="4" fill={`${color}08`} stroke={color} strokeWidth="2" />
    <path d="M20 20 H44 M20 26 H44 M20 32 H34" stroke={color} strokeWidth="2" strokeLinecap="round" strokeOpacity="0.6" />
    {/* Small badge inside with chat bubble style */}
    <rect x="36" y="34" width="16" height="12" rx="3" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
    <circle cx="41" cy="40" r="1.5" fill={color} />
    <circle cx="47" cy="40" r="1.5" fill={color} />
    <path d="M40 46 L38 49 V46 Z" fill={color} />
  </svg>
);

// High-fidelity vector SVG for the resting gold lantern (left side)
const LeftLanternSVG = () => (
  <svg viewBox="0 0 160 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#d4af37] dark:text-[#d4af37]/60 drop-shadow-[0_10px_20px_rgba(212,175,55,0.2)]">
    {/* Top Ring */}
    <circle cx="80" cy="40" r="12" stroke="currentColor" strokeWidth="3" />
    {/* Top Cap */}
    <path d="M50 70 C 50 45, 110 45, 110 70 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
    <path d="M35 90 L125 90 L110 70 L50 70 Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" />
    
    {/* Glass Chamber */}
    <path d="M40 90 L30 190 L130 190 L120 90 Z" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" />
    {/* Glass chamber panes details */}
    <path d="M60 90 L52 190 M80 90 V190 M100 90 L108 190" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
    
    {/* Glowing Candle Light Inside */}
    <ellipse cx="80" cy="155" rx="14" ry="22" fill="url(#lanternGlow)" className="animate-pulse" />
    <path d="M80 135 C 75 145, 75 155, 80 165 C 85 155, 85 145, 80 135 Z" fill="#fff" className="animate-pulse" />

    {/* Bottom Base */}
    <path d="M25 190 L135 190 L125 215 L35 215 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
    <rect x="45" y="215" width="70" height="10" rx="3" fill="currentColor" />

    <defs>
      <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff" />
        <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

// High-fidelity vector SVG for the mosque silhouette background (right side)
const MosqueBackgroundSVG = () => (
  <svg viewBox="0 0 350 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#d4af37] dark:text-[#d4af37]/30 opacity-[0.06] dark:opacity-[0.04]">
    {/* Big Dome */}
    <path d="M120 250 C 120 170, 200 170, 200 250 Z" fill="currentColor" />
    <path d="M160 173 L160 140 M160 140 L155 148 M160 140 L165 148" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="160" cy="136" r="3" fill="currentColor" />
    
    {/* Small Left Dome */}
    <path d="M60 250 C 60 200, 110 200, 110 250 Z" fill="currentColor" />
    
    {/* Minaret 1 (Right) */}
    <rect x="230" y="80" width="16" height="170" fill="currentColor" />
    <path d="M224 80 L246 80 L238 60 L238 40" stroke="currentColor" strokeWidth="2" />
    <path d="M220 120 H256" stroke="currentColor" strokeWidth="3" />
    <path d="M220 170 H256" stroke="currentColor" strokeWidth="3" />

    {/* Minaret 2 (Far Right) */}
    <rect x="280" y="110" width="12" height="140" fill="currentColor" />
    <path d="M276 110 L296 110 L286 95" stroke="currentColor" strokeWidth="2" />

    {/* Arch shapes along bottom */}
    <path d="M10 250 C 10 230, 30 230, 30 250" stroke="currentColor" strokeWidth="2" />
    <path d="M30 250 C 30 230, 50 230, 50 250" stroke="currentColor" strokeWidth="2" />
    <path d="M310 250 C 310 230, 330 230, 330 250" stroke="currentColor" strokeWidth="2" />
  </svg>
);

interface ChoiceMode {
  href: string;
  title: string;
  desc: string;
  colorClass: string; // Tailwind text color class
  bgGradientClass: string; // Tailwind bg gradient class
  borderClass: string; // Tailwind border class
  shadowClass: string; // Tailwind shadow class
  hoverBorderClass: string;
  icon: React.ComponentType<{ color: string }>;
  iconColor: string;
}

const MODES: ChoiceMode[] = [
  {
    href: "/mushaf",
    title: "آية بآية",
    desc: "تجربة تلاوة مركزة تتيح لك الاستماع لكل آية على حدة مع عرض التفسير والترجمة الفورية.",
    colorClass: "text-[#B8860B] dark:text-[#E9C46A]",
    bgGradientClass: "from-[#faf6ee] to-white dark:from-zinc-900/60 dark:to-zinc-950/40",
    borderClass: "border-[#D4AF37]/35 dark:border-[#D4AF37]/20",
    hoverBorderClass: "hover:border-[#D4AF37]/70 dark:hover:border-[#D4AF37]/50",
    shadowClass: "shadow-[0_15px_45px_-10px_rgba(212,175,55,0.08)] hover:shadow-[0_20px_50px_-5px_rgba(212,175,55,0.15)]",
    icon: BookOpenIcon,
    iconColor: "#B8860B"
  },
  {
    href: "/mushaf-full",
    title: "المصحف المرئي",
    desc: "تصفح المصحف بالترتيب التقليدي مع إمكانية التنقل السريع بين الصفحات.",
    colorClass: "text-[#16423C] dark:text-[#52B788]",
    bgGradientClass: "from-[#f4fbf7] to-white dark:from-zinc-900/60 dark:to-zinc-950/40",
    borderClass: "border-[#16423C]/20 dark:border-[#16423C]/15",
    hoverBorderClass: "hover:border-[#16423C]/50 dark:hover:border-[#16423C]/40",
    shadowClass: "shadow-[0_15px_45px_-10px_rgba(22,66,60,0.06)] hover:shadow-[0_20px_50px_-5px_rgba(22,66,60,0.12)]",
    icon: BookOpenIcon,
    iconColor: "#16423C"
  },
  {
    href: "/mushaf-tafseer",
    title: "مصحف بالتفسير",
    desc: "قراءة ممتعة مع عرض التفسير بجانب كل صفحة، مثالي لطلبة العلم والباحثين.",
    colorClass: "text-[#1d4ed8] dark:text-[#60a5fa]",
    bgGradientClass: "from-[#f0f7ff] to-white dark:from-zinc-900/60 dark:to-zinc-950/40",
    borderClass: "border-[#1d4ed8]/20 dark:border-[#1d4ed8]/15",
    hoverBorderClass: "hover:border-[#1d4ed8]/50 dark:hover:border-[#1d4ed8]/40",
    shadowClass: "shadow-[0_15px_45px_-10px_rgba(29,78,216,0.06)] hover:shadow-[0_20px_50px_-5px_rgba(29,78,216,0.12)]",
    icon: BookOpenIcon,
    iconColor: "#1d4ed8"
  }
];

export function MushafChoice() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-between px-4 md:px-6 py-2.5">
      
      {/* ── Custom Theme Background Images ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Light Mode Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 opacity-100 dark:opacity-0"
          style={{ backgroundImage: "url('https://res.cloudinary.com/dwxrjggkj/image/upload/v1782144747/3_b46mzp.png')" }}
        />
        {/* Dark Mode Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 opacity-0 dark:opacity-100"
          style={{ backgroundImage: "url('https://res.cloudinary.com/dwxrjggkj/image/upload/v1782144746/4_usgepb.png')" }}
        />
        <div className="absolute inset-0 bg-black/[0.01] dark:bg-black/25 transition-colors duration-300" />
        <div className="absolute inset-0 islamic-pattern opacity-[0.01] dark:opacity-[0.02] scale-110" />
      </div>

      {/* ── Main Content Container ── */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-3 pt-2 md:pt-3 text-center">
        
        {/* ── Title Header (Directly matching the image layout) ── */}
        <div className="space-y-1.5 max-w-2xl">
          {/* Basmala Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#D4AF37]/8 border border-[#D4AF37]/20 text-[#B8860B] dark:text-[#D4AF37] font-arabic text-[9px] font-bold"
          >
            <span>✦ بسم الله الرحمن الرحيم ✦</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-xl md:text-2xl font-black font-arabic tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            اختر طريقة التلاوة
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold font-arabic leading-none"
          >
            صمّمت لك ثلاثة أوضاع متكاملة لرحلتك مع القرآن الكريم
          </motion.p>

          {/* Elegant geometric divider */}
          <div className="flex items-center justify-center gap-1.5 pt-0.5 scale-75">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#D4AF37]/35" />
            <div className="w-3.5 h-3.5 rounded-full border border-[#D4AF37]/45 flex items-center justify-center rotate-45">
              <div className="w-1 h-1 bg-[#D4AF37]" />
            </div>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#D4AF37]/35" />
          </div>
        </div>

        {/* ── Three Reading Mode Cards (Stacked Vertically exactly like the image) ── */}
        <div className="w-full flex flex-col gap-2.5 max-w-2xl">
          {MODES.map((mode, idx) => {
            const Icon = mode.icon;
            
            return (
              <motion.div
                key={mode.href}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 + idx * 0.08 }}
                whileHover={{ scale: 1.01, y: -1 }}
                onClick={() => navigateInstantly(mode.href)}
                className={`relative w-full rounded-[18px] overflow-hidden bg-gradient-to-r ${mode.bgGradientClass} border-2 ${mode.borderClass} ${mode.hoverBorderClass} ${mode.shadowClass} p-3.5 md:p-4 flex items-center justify-between gap-5 cursor-pointer transition-all duration-300 group`}
              >
                {/* RTL Arrow button (left side) */}
                <div 
                  className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 group-hover:scale-105 active:scale-95`}
                  style={{
                    borderColor: `${mode.iconColor}25`,
                    backgroundColor: `${mode.iconColor}06`,
                    color: mode.iconColor
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </div>

                {/* Text Content (center, right-aligned) */}
                <div className="flex-1 text-right space-y-0.5 min-w-0 pr-1">
                  <h3 className={`text-base font-black font-arabic ${mode.colorClass} leading-none`}>
                    {mode.title}
                  </h3>
                  <p className="text-[10px] md:text-[11px] text-zinc-500 dark:text-zinc-400 font-bold font-arabic leading-relaxed">
                    {mode.desc}
                  </p>
                </div>

                {/* Icon (right side) */}
                <div 
                  className="shrink-0 w-18 h-18 rounded-full border flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:rotate-6 group-hover:scale-105"
                  style={{
                    borderColor: `${mode.iconColor}25`,
                    backgroundColor: `${mode.iconColor}06`,
                    color: mode.iconColor
                  }}
                >
                  {/* Subtle circular background pattern */}
                  <div className="absolute inset-0.5 rounded-full border border-dashed opacity-25" style={{ borderColor: mode.iconColor }} />
                  <Icon color={mode.iconColor} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Calligraphy Verse Card with Gold Frame (Bottom) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-full max-w-lg bg-white/40 dark:bg-zinc-950/20 border border-[#D4AF37]/20 rounded-full px-4 py-1.5 shadow-[0_8px_20px_rgba(212,175,55,0.03)] relative flex flex-col md:flex-row items-center justify-center gap-1.5 mb-1"
        >
          {/* Small decorative leaf vector branch graphics on sides */}
          <div className="absolute right-4 text-[#D4AF37]/35 hidden md:block select-none scale-x-[-1] scale-75">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10V2M14 6c1.1 0 2 .9 2 2s-.9 2-2 2V6m0 6c1.1 0 2 .9 2 2s-.9 2-2 2v-4Z" />
            </svg>
          </div>
          <div className="absolute left-4 text-[#D4AF37]/35 hidden md:block select-none scale-75">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10V2M14 6c1.1 0 2 .9 2 2s-.9 2-2 2V6m0 6c1.1 0 2 .9 2 2s-.9 2-2 2v-4Z" />
            </svg>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tiny open book icon */}
            <span className="text-[#D4AF37] text-[10px]">📖</span>
            <p className="text-[10px] md:text-xs font-arabic font-bold text-zinc-800 dark:text-zinc-200">
              "كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ وَلِيَتَذَكَّرَ أُولُو الْأَلْبَابِ"
            </p>
            <span className="text-[#D4AF37] text-[10px]">📖</span>
          </div>

          <span className="text-[8px] text-zinc-400 font-black tracking-wide font-arabic shrink-0">
            (سورة ص - ٢٩)
          </span>
        </motion.div>

      </div>
    </div>
  );
}
