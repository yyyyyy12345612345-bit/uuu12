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
  titleText = "علاج التعفن الدماغي:",
  showTimer = true,
  showProgressBar = false,
  verseText,
  showVerseText = false,
}: BrainrotDetoxDesignProps) {
  // حساب الوقت المتبقي بالثواني بدقة
  const remainingSecs = useMemo(() => {
    const total = totalDuration > 0 ? totalDuration : 300; // 5 دقائق افتراضياً
    return Math.max(0, Math.ceil(total - currentElapsed));
  }, [totalDuration, currentElapsed]);

  // تنسيق الوقت كـ MM:SS بالضبط مثل لقطة الشاشة (مثال: 04:57)
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
      {/* استيراد الخطوط المطابقة للشاشة تماماً */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Cairo:wght@700;800;900&family=Oswald:wght@700&display=swap');
        
        .timer-font {
          font-family: 'Anton', 'Bebas Neue', 'Oswald', 'Impact', sans-serif;
          letter-spacing: 0.03em;
          line-height: 0.9;
        }

        .detox-title-font {
          font-family: 'Cairo', 'Tajawal', 'Alexandria', -apple-system, sans-serif;
        }
      `}</style>

      {/* 1. العنوان: «علاج التعفن الدماغي:» */}
      {showTitle && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-1 sm:mb-2"
        >
          <h1
            className="detox-title-font font-black tracking-wide leading-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]"
            style={{
              color: "#FFFFFF",
              fontWeight: 900,
              fontSize: "clamp(1.6rem, 5.5vw, 2.9rem)",
              letterSpacing: "0.01em",
              textShadow: "0 4px 28px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.9)",
            }}
          >
            {titleText || "علاج التعفن الدماغي:"}
          </h1>
        </motion.div>
      )}

      {/* 2. العدّاد التنازلي الحي الضخم في منتصف الشاشة مطابق 100% للصورة */}
      {showTimer && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative flex items-center justify-center my-1"
        >
          <span
            className="timer-font select-none"
            style={{
              color: "#FFFFFF",
              fontSize: "clamp(4.8rem, 18vw, 8.5rem)",
              fontWeight: 900,
              display: "inline-block",
              lineHeight: 0.88,
              transform: "scaleX(1.1)",
              filter: "drop-shadow(0 10px 45px rgba(0,0,0,0.98)) drop-shadow(0 2px 12px rgba(0,0,0,0.9))",
            }}
          >
            {formattedTime}
          </span>
        </motion.div>
      )}

      {/* 3. مؤشر التقدم الانسيابي الهادئ (اختياري) */}
      {showProgressBar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-40 sm:w-56 h-1.5 bg-white/20 rounded-full mt-4 overflow-hidden backdrop-blur-md border border-white/15 shadow-lg"
        >
          <div
            className="h-full bg-white rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(255,255,255,0.95)]"
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
