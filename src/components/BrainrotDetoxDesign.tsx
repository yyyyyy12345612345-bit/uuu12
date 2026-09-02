"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Play, Pause } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center w-full h-full select-none px-4 text-center z-30 pointer-events-auto">
      {/* 1. العنوان الرئيسي: «علاج التعفن الدماغي» */}
      {showTitle && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 sm:mb-6"
        >
          <h1
            className="font-black tracking-wide leading-tight drop-shadow-[0_4px_25px_rgba(0,0,0,0.95)]"
            style={{
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              fontFamily: '"Cairo", "Amiri", sans-serif',
              fontSize: "clamp(1.4rem, 4.5vw, 2.5rem)",
              textShadow: "0 4px 28px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.9)",
            }}
          >
            {titleText || "علاج التعفن الدماغي"}
          </h1>
        </motion.div>
      )}

      {/* 2. العدّاد التنازلي الحي الضخم (نفس الفونت العريض المكثف في الصورة بلون أبيض ناصع) */}
      {showTimer && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative flex items-center justify-center my-1"
        >
          <span
            className="font-black select-none tracking-normal"
            style={{
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              fontFamily: "'Anton', 'Impact', 'Bebas Neue', 'Oswald', sans-serif",
              fontSize: "clamp(4.2rem, 16vw, 7.8rem)",
              letterSpacing: "0.02em",
              lineHeight: 0.95,
              filter: "drop-shadow(0 8px 35px rgba(0,0,0,0.95)) drop-shadow(0 2px 10px rgba(0,0,0,0.9))",
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
          className="w-44 sm:w-56 h-1.5 bg-white/20 rounded-full mt-5 overflow-hidden backdrop-blur-md border border-white/15"
        >
          <div
            className="h-full bg-white rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(255,255,255,0.9)]"
            style={{ width: `${progressRatio * 100}%` }}
          />
        </motion.div>
      )}

      {/* 4. زر تشغيل وإيقاف أنيق وصغير ونظيف تحت التايمر مباشرة */}
      {onTogglePlay && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onTogglePlay}
          className="mt-6 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white transition-all active:scale-90 shadow-xl cursor-pointer"
          title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-white text-white" />
          ) : (
            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
          )}
        </motion.button>
      )}

      {/* 5. نص الآية (اختياري إذا رغب المستخدم في عرضه) */}
      {showVerseText && verseText && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 max-w-sm px-4"
        >
          <p
            className="text-base sm:text-lg font-bold leading-relaxed drop-shadow-[0_2px_15px_rgba(0,0,0,0.95)]"
            style={{
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
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
