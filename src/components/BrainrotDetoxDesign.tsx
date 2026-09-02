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
  /** إظهار العنوان العلوي */
  showTitle?: boolean;
  /** نص العنوان مخصص */
  titleText?: string;
  /** إظهار العدّاد التنازلي الضخم */
  showTimer?: boolean;
  /** إظهار شريط التقدم */
  showProgressBar?: boolean;
  /** اسم القارئ (اختياري) */
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
  showTitle = true,
  titleText = "علاج التعفن الدماغي",
  showTimer = true,
  showProgressBar = true,
  reciterName,
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
    <div className="flex flex-col items-center justify-center w-full my-auto z-30 select-none px-4 text-center">
      {/* 1. العنوان الرئيسي: «علاج التعفن الدماغي» */}
      {showTitle && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <h1
            className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-wide drop-shadow-[0_4px_28px_rgba(0,0,0,0.95)]"
            style={{
              fontFamily: '"Cairo", "Amiri", sans-serif',
              textShadow: "0 4px 30px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)",
            }}
          >
            {titleText || "علاج التعفن الدماغي"}
          </h1>
        </motion.div>
      )}

      {/* 2. العدّاد التنازلي الحي الضخم (نفس الفونت العريض المكثف في الصورة) */}
      {showTimer && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative flex items-center justify-center"
        >
          <span
            className="text-7xl sm:text-8xl md:text-[140px] font-black text-white leading-none tracking-normal select-none"
            style={{
              fontFamily: "'Impact', 'Anton', 'Bebas Neue', 'Oswald', sans-serif",
              letterSpacing: "0.02em",
              textShadow: "0 10px 45px rgba(0,0,0,0.95), 0 4px 15px rgba(0,0,0,0.9)",
            }}
          >
            {formattedTime}
          </span>
        </motion.div>
      )}

      {/* 3. مؤشر التقدم الانسيابي الهادئ */}
      {showProgressBar && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-48 sm:w-64 md:w-80 h-1.5 bg-white/20 rounded-full mt-6 sm:mt-8 overflow-hidden backdrop-blur-md border border-white/10"
        >
          <div
            className="h-full bg-white rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.9)]"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </motion.div>
      )}

      {/* 4. نص الآية (اختياري إذا رغب المستخدم في عرضه) */}
      {showVerseText && verseText && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 max-w-lg px-4"
        >
          <p
            className="text-base sm:text-xl md:text-2xl text-white/95 font-bold leading-relaxed drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]"
            style={{ fontFamily: '"Amiri", serif' }}
          >
            {verseText}
          </p>
        </motion.div>
      )}

      {/* 5. شارة اسم القارئ والتلاوة */}
      {reciterName && (
        <div className="mt-5 px-4 py-1.5 rounded-full bg-black/45 border border-white/15 backdrop-blur-xl shadow-lg">
          <span className="text-[11px] sm:text-xs text-white/90 font-arabic font-bold">
            بصوت {reciterName}
          </span>
        </div>
      )}
    </div>
  );
}
