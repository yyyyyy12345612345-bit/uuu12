"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

export interface BrainrotDetoxDesignProps {
  /** إجمالي مدة التلاوة بالثواني */
  totalDuration: number;
  /** الوقت المنقضي الحالي بالثواني */
  currentElapsed: number;
  /** هل الفيديو قيد التشغيل */
  isPlaying?: boolean;
  /** دالة التبديل بين التشغيل والإيقاف */
  onTogglePlay?: () => void;
  /** إظهار العنوان العلوي */
  showTitle?: boolean;
  /** نص العنوان مخصص */
  titleText?: string;
  /** إظهار العدّاد التنازلي الضخم */
  showTimer?: boolean;
  /** إظهار شريط التقدم */
  showProgressBar?: boolean;
  /** اسم القارئ */
  reciterName?: string;
  /** نص الآية الحالي (اختياري) */
  verseText?: string;
  /** هل يظهر نص الآية */
  showVerseText?: boolean;
}

export function BrainrotDetoxDesign({
  totalDuration,
  currentElapsed,
  isPlaying = false,
  onTogglePlay,
  showTitle = true,
  titleText = "علاج التعفن الدماغي",
  showTimer = true,
  showProgressBar = true,
  verseText,
  showVerseText = false,
}: BrainrotDetoxDesignProps) {
  // حساب الوقت المتبقي بالثواني بدقة
  const remainingSecs = useMemo(() => {
    const total = totalDuration > 0 ? totalDuration : 300; // 5 دقائق افتراضياً
    return Math.max(0, Math.ceil(total - currentElapsed));
  }, [totalDuration, currentElapsed]);

  // تنسيق الوقت كـ MM:SS (مثال: 00:46)
  const formattedTime = useMemo(() => {
    const m = Math.floor(remainingSecs / 60);
    const s = remainingSecs % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }, [remainingSecs]);

  // نسبة الإنجاز للشريط
  const progressRatio = useMemo(() => {
    const total = totalDuration > 0 ? totalDuration : 300;
    return Math.min(1, Math.max(0, currentElapsed / total));
  }, [totalDuration, currentElapsed]);

  return (
    <div 
      onClick={onTogglePlay}
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center select-none cursor-pointer z-30 px-4 text-center overflow-hidden"
    >
      {/* استيراد الخطوط الجديدة المطابقة تماماً للصورة */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Rubik:wght@700;800;900&family=Inter:wght@800;900&family=IBM+Plex+Sans+Arabic:wght@700;800&display=swap');
        
        .modern-timer-numbers {
          font-family: 'Montserrat', 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 900;
          letter-spacing: -0.01em;
          line-height: 1;
        }

        .modern-detox-title {
          font-family: 'Rubik', 'IBM Plex Sans Arabic', 'Tajawal', sans-serif;
          font-weight: 800;
        }
      `}</style>

      {/* 1. العنوان: «علاج التعفن الدماغي» - بخط أصغر وأنيق ومطابق تماماً للصورة */}
      {showTitle && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-1.5 sm:mb-2.5"
        >
          <h2
            className="modern-detox-title text-white tracking-normal leading-tight"
            style={{
              fontSize: "clamp(1.15rem, 3.8vw, 1.85rem)",
              fontWeight: 800,
              textShadow: "0 2px 14px rgba(0,0,0,0.9)",
            }}
          >
            {titleText || "علاج التعفن الدماغي"}
          </h2>
        </motion.div>
      )}

      {/* 2. العدّاد التنازلي الضخم العريض (00:46) بفونت Montserrat/Inter Black 900 المطابق للصورة */}
      {showTimer && (
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative flex items-center justify-center my-0.5"
        >
          <span
            className="modern-timer-numbers text-white select-none inline-block"
            style={{
              fontSize: "clamp(5.2rem, 20vw, 8.8rem)",
              fontWeight: 900,
              textShadow: "0 4px 25px rgba(0,0,0,0.95)",
            }}
          >
            {formattedTime}
          </span>
        </motion.div>
      )}

      {/* 3. شريط التقدم النحيف الدقيق أسفل الأرقام مباشرة بنفس العرض */}
      {showProgressBar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-48 sm:w-64 h-[2.5px] bg-white/25 rounded-full mt-2.5 sm:mt-3 overflow-hidden"
        >
          <div
            className="h-full bg-white rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.9)]"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </motion.div>
      )}

      {/* 4. نص الآية (اختياري) */}
      {showVerseText && verseText && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 max-w-sm px-4"
        >
          <p
            className="text-base sm:text-lg font-bold leading-relaxed drop-shadow-[0_2px_15px_rgba(0,0,0,0.95)]"
            style={{
              color: "#FFFFFF",
              fontFamily: '"Amiri", serif',
            }}
          >
            {verseText}
          </p>
        </motion.div>
      )}
    </div>
  );
}
