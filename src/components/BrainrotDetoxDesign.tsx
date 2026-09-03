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

  // تنسيق الوقت كـ MM:SS (مثال: 00:35)
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
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center select-none cursor-pointer z-30 px-3 sm:px-6 text-center overflow-hidden [container-type:inline-size]"
    >
      {/* استيراد الخطوط الجديدة المطابقة تماماً للصورة */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800;900&family=Rubik:wght@700;800;900&family=Inter:wght@800;900&family=IBM+Plex+Sans+Arabic:wght@700;800&display=swap');
        
        .modern-timer-numbers {
          font-family: 'Montserrat', 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 0.95;
        }

        .modern-detox-title {
          font-family: 'Rubik', 'IBM Plex Sans Arabic', 'Tajawal', -apple-system, sans-serif;
          font-weight: 800;
        }
      `}</style>

      {/* 1. العنوان: «علاج التعفن الدماغي» - حجم متناسق لا يخرج عن الإطار أبداً على الحاسوب أو الجوال */}
      {showTitle && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-1 sm:mb-2 max-w-[90%]"
        >
          <h2
            className="modern-detox-title text-white tracking-normal leading-tight select-none"
            style={{
              fontSize: "clamp(0.95rem, 5.2cqi, 1.35rem)",
              fontWeight: 800,
              textShadow: "0 2px 14px rgba(0,0,0,0.95)",
            }}
          >
            {titleText || "علاج التعفن الدماغي"}
          </h2>
        </motion.div>
      )}

      {/* 2. العدّاد التنازلي (00:35) - قياس متجاوب مع حاوية الهاتف بدقة cqi ليناسب اللابتوب والموبايل */}
      {showTimer && (
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative flex items-center justify-center my-0.5 w-full max-w-full"
        >
          <span
            className="modern-timer-numbers text-white select-none inline-block whitespace-nowrap"
            style={{
              fontSize: "clamp(2.8rem, 20cqi, 4.4rem)",
              fontWeight: 900,
              textShadow: "0 4px 28px rgba(0,0,0,0.98), 0 2px 10px rgba(0,0,0,0.9)",
            }}
          >
            {formattedTime}
          </span>
        </motion.div>
      )}

      {/* 3. شريط التقدم النحيف الدقيق أسفل الأرقام مباشرة متناسق مع عرض الأرقام */}
      {showProgressBar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-[55%] max-w-[210px] min-w-[140px] h-[2.5px] bg-white/25 rounded-full mt-2 sm:mt-2.5 overflow-hidden backdrop-blur-sm"
        >
          <div
            className="h-full bg-white rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.95)]"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </motion.div>
      )}

      {/* 4. نص الآية (اختياري) */}
      {showVerseText && verseText && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 max-w-[85%] px-2"
        >
          <p
            className="text-xs sm:text-sm font-bold leading-relaxed drop-shadow-[0_2px_15px_rgba(0,0,0,0.95)] text-white"
            style={{
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
