"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Share2, 
  Search, 
  Star, 
  ArrowLeft, 
  Maximize2, 
  Plus, 
  Play, 
  Pause, 
  Music, 
  Sparkles,
  Check,
  Disc3
} from "lucide-react";

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
  /** إظهار محاكي واجهة تيك توك */
  showTiktokUI?: boolean;
  /** عدد الإعجابات */
  tiktokLikes?: string;
  /** عدد التعليقات */
  tiktokComments?: string;
  /** عدد الحفظ */
  tiktokBookmarks?: string;
  /** عدد المشاركات */
  tiktokShares?: string;
  /** اسم الحساب */
  tiktokAccountName?: string;
  /** وصف الفيديو والهاشتاغات */
  tiktokCaption?: string;
  /** نص شريط البحث في الأسفل */
  tiktokSearchQuery?: string;
}

export function BrainrotDetoxDesign({
  totalDuration,
  currentElapsed,
  isPlaying = false,
  onTogglePlay,
  showTitle = true,
  titleText = "علاج التعفن الدماغي:",
  showTimer = true,
  showProgressBar = true,
  reciterName = "محمد",
  verseText,
  showVerseText = false,
  showTiktokUI = true,
  tiktokLikes = "22.2 ألف",
  tiktokComments = "285",
  tiktokBookmarks = "1639",
  tiktokShares = "1061",
  tiktokAccountName = "قرآن | Quran · 30-06",
  tiktokCaption = "علاج التعفن الدماغي 5 دقايق من القرآن الكريم #اجر_لي_ولكم #ناصر_القطامي #fyp #قرآن ... المزيد",
  tiktokSearchQuery = "health benefits of quran recitation",
}: BrainrotDetoxDesignProps) {
  // حالات التفاعل في واجهة تيك توك
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);

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
    <div className="absolute inset-0 w-full h-full flex flex-col justify-between select-none pointer-events-auto overflow-hidden font-sans text-white">
      {/* استيراد الخطوط المطابقة للشاشة تماماً */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Cairo:wght@700;800;900&family=Oswald:wght@700&display=swap');
        
        .timer-font {
          font-family: 'Anton', 'Bebas Neue', 'Oswald', 'Montserrat', sans-serif;
          letter-spacing: 0.04em;
          line-height: 0.95;
        }

        .tiktok-arabic-font {
          font-family: 'Cairo', 'Tajawal', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
      `}</style>

      {/* ── 1. الشريط العلوي (TikTok Top Header) ── */}
      {showTiktokUI && (
        <div className="w-full z-40 pt-2 px-3 flex flex-col gap-1 pointer-events-auto">
          {/* Status bar mock */}
          <div className="w-full flex items-center justify-between text-[11px] font-semibold text-white/80 px-2 pt-1 opacity-90">
            <span>03:37</span>
            <div className="flex items-center gap-2 text-[10px]">
              <span>13.0 KB/s</span>
              <div className="w-4 h-2.5 border border-white/70 rounded-sm p-[1px]">
                <div className="w-full h-full bg-white rounded-xs"></div>
              </div>
            </div>
          </div>

          {/* Search Header Bar */}
          <div className="w-full flex items-center justify-between gap-2 mt-1">
            <button className="p-1.5 text-white hover:text-white/80 transition-colors">
              <ArrowLeft className="w-5 h-5 drop-shadow-md" />
            </button>

            <div className="flex-1 max-w-md h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/10 px-3 flex items-center justify-between text-xs text-white/90 shadow-lg">
              <div className="flex items-center gap-2 overflow-hidden truncate">
                <span className="text-white/60 text-[11px] font-arabic">بحث</span>
                <span className="text-white/30">|</span>
                <span className="truncate text-white/90 text-xs">quran recitation for relaxation...</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Search className="w-4 h-4 text-white/80" />
                <Star className="w-4 h-4 text-white/80" />
              </div>
            </div>

            <button className="p-1.5 text-white hover:text-white/80 transition-colors">
              <Share2 className="w-5 h-5 drop-shadow-md" />
            </button>
          </div>
        </div>
      )}

      {/* ── 2. المحتوى الرئيسي في المنتصف (العنوان + العدّاد التنازلي الضخم) ── */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-4 text-center z-30 my-auto">
        {/* العنوان: «علاج التعفن الدماغي:» */}
        {showTitle && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-2 sm:mb-3"
          >
            <h1
              className="tiktok-arabic-font font-black tracking-wide leading-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)]"
              style={{
                color: "#FFFFFF",
                fontWeight: 900,
                fontSize: "clamp(1.5rem, 5.5vw, 2.8rem)",
                letterSpacing: "0.01em",
                textShadow: "0 4px 28px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.9)",
              }}
            >
              {titleText || "علاج التعفن الدماغي:"}
            </h1>
          </motion.div>
        )}

        {/* العدّاد التنازلي الحي الضخم بفونت Anton/Bebas Neue العريض والقوي مطابق تماماً للصورة */}
        {showTimer && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative flex items-center justify-center my-0.5"
          >
            <span
              className="timer-font select-none"
              style={{
                color: "#FFFFFF",
                fontSize: "clamp(4.2rem, 16vw, 7.5rem)",
                fontWeight: 900,
                display: "inline-block",
                lineHeight: 0.9,
                filter: "drop-shadow(0 10px 40px rgba(0,0,0,0.98)) drop-shadow(0 2px 12px rgba(0,0,0,0.9))",
              }}
            >
              {formattedTime}
            </span>
          </motion.div>
        )}

        {/* مؤشر التقدم الانسيابي الهادئ */}
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

        {/* زر تشغيل / إيقاف سريع */}
        {onTogglePlay && !showTiktokUI && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onTogglePlay}
            className="mt-5 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-xl flex items-center justify-center text-white transition-all active:scale-90 shadow-xl cursor-pointer"
            title={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white text-white" />
            ) : (
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            )}
          </motion.button>
        )}

        {/* نص الآية (اختياري) */}
        {showVerseText && verseText && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 max-w-sm px-4"
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

      {/* ── 3. القائمة الجانبية التفاعلية لتيك توك (TikTok Right Action Sidebar) ── */}
      {showTiktokUI && (
        <div className="absolute right-3 bottom-24 z-40 flex flex-col items-center gap-4 text-center pointer-events-auto">
          {/* Avatar with Follow '+' Button */}
          <div className="relative mb-1">
            <div className="w-12 h-12 rounded-full border-2 border-white bg-gradient-to-tr from-amber-900 to-red-950 flex items-center justify-center text-white font-bold text-sm shadow-xl overflow-hidden">
              <span className="font-arabic">{reciterName?.[0] || "م"}</span>
            </div>
            {!isFollowed ? (
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => setIsFollowed(true)}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#FE2C55] rounded-full flex items-center justify-center text-white shadow-lg border border-white"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
              </motion.button>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg border border-white"
              >
                <Check className="w-3 h-3 stroke-[3px]" />
              </motion.div>
            )}
          </div>

          {/* Like Button */}
          <div className="flex flex-col items-center">
            <motion.button
              whileTap={{ scale: 1.3 }}
              onClick={() => setIsLiked(!isLiked)}
              className="p-1 rounded-full text-white transition-all drop-shadow-lg cursor-pointer"
            >
              <Heart
                className={`w-8 h-8 transition-colors ${
                  isLiked ? "fill-[#FE2C55] text-[#FE2C55]" : "fill-white/10 text-white"
                }`}
                strokeWidth={1.5}
              />
            </motion.button>
            <span className="text-[11px] font-bold drop-shadow-md text-white/95 mt-0.5 font-arabic">
              {tiktokLikes}
            </span>
          </div>

          {/* Comment Button */}
          <div className="flex flex-col items-center">
            <motion.button
              whileTap={{ scale: 1.2 }}
              className="p-1 rounded-full text-white drop-shadow-lg cursor-pointer"
            >
              <MessageCircle className="w-8 h-8 fill-white/10 text-white" strokeWidth={1.5} />
            </motion.button>
            <span className="text-[11px] font-bold drop-shadow-md text-white/95 mt-0.5 font-arabic">
              {tiktokComments}
            </span>
          </div>

          {/* Bookmark Button */}
          <div className="flex flex-col items-center">
            <motion.button
              whileTap={{ scale: 1.3 }}
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="p-1 rounded-full text-white drop-shadow-lg cursor-pointer"
            >
              <Bookmark
                className={`w-8 h-8 transition-colors ${
                  isBookmarked ? "fill-[#FACD3D] text-[#FACD3D]" : "fill-white/10 text-white"
                }`}
                strokeWidth={1.5}
              />
            </motion.button>
            <span className="text-[11px] font-bold drop-shadow-md text-white/95 mt-0.5 font-arabic">
              {tiktokBookmarks}
            </span>
          </div>

          {/* Share Button */}
          <div className="flex flex-col items-center">
            <motion.button
              whileTap={{ scale: 1.2 }}
              className="p-1 rounded-full text-white drop-shadow-lg cursor-pointer"
            >
              <Share2 className="w-8 h-8 fill-white/10 text-white" strokeWidth={1.5} />
            </motion.button>
            <span className="text-[11px] font-bold drop-shadow-md text-white/95 mt-0.5 font-arabic">
              {tiktokShares}
            </span>
          </div>

          {/* Rotating Music Disc */}
          <div className="relative mt-1">
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="w-10 h-10 rounded-full bg-black/80 border-2 border-zinc-800 flex items-center justify-center p-1 shadow-2xl"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-zinc-600 flex items-center justify-center">
                <Music className="w-2.5 h-2.5 text-white/80" />
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* ── 4. الجزء السفلي: الوصف واسم الحساب وشريط البحث (TikTok Bottom Bar) ── */}
      {showTiktokUI && (
        <div className="w-full z-40 pb-2 px-3 flex flex-col gap-2 pointer-events-auto">
          {/* Full Screen Pill Button (شاشة كاملة) */}
          <div className="flex justify-center mb-1">
            <button
              onClick={onTogglePlay}
              className="px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold font-arabic flex items-center gap-1.5 text-white shadow-xl transition-all active:scale-95"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>شاشة كاملة</span>
            </button>
          </div>

          {/* Account Title & Caption */}
          <div className="max-w-[75%] flex flex-col gap-1 text-right self-start rtl">
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-white drop-shadow-md font-arabic">
                {tiktokAccountName}
              </span>
            </div>

            <p className="text-xs font-medium text-white/95 leading-relaxed drop-shadow-md font-arabic line-clamp-2">
              {tiktokCaption}
            </p>
          </div>

          {/* Bottom Search Pill */}
          <div className="w-full h-8 rounded-lg bg-black/50 backdrop-blur-md border border-white/10 px-3 flex items-center justify-between text-[11px] text-white/80 shadow-md">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="text-white/40 font-bold">&lt;</span>
              <span className="truncate">{tiktokSearchQuery}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60">
              <span className="text-[10px] font-arabic">البحث</span>
              <Search className="w-3 h-3" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
