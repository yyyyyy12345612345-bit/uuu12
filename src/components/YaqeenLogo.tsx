"use client";

import React from "react";

interface YaqeenLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "compact" | "emblem" | "text-only";
  className?: string;
  showTagline?: boolean;
}

export function YaqeenLogo({
  size = "md",
  variant = "full",
  className = "",
  showTagline = true,
}: YaqeenLogoProps) {
  // Sizing scales
  const config = {
    sm: {
      titleSize: "text-lg md:text-xl",
      latinSize: "text-[7px]",
      taglineSize: "text-[7.5px]",
      lineWidth: "w-32",
    },
    md: {
      titleSize: "text-xl md:text-2xl",
      latinSize: "text-[8px]",
      taglineSize: "text-[8.5px]",
      lineWidth: "w-44",
    },
    lg: {
      titleSize: "text-2xl md:text-3xl",
      latinSize: "text-[9px]",
      taglineSize: "text-[10px]",
      lineWidth: "w-56",
    },
    xl: {
      titleSize: "text-3xl md:text-4xl",
      latinSize: "text-[10px]",
      taglineSize: "text-xs",
      lineWidth: "w-64",
    },
  }[size];

  // Pure Typographic Wordmark Only (كلمة فقط بدون أي صناديق أو أيقونات)
  return (
    <div className={`inline-flex flex-col items-start justify-center select-none font-arabic ${className}`}>
      {/* 1. Main Pure Calligraphic Wordmark */}
      <div className="flex items-baseline leading-tight group">
        <span className={`font-black font-arabic ${config.titleSize} text-black dark:text-white tracking-tight flex items-baseline gap-1.5`}>
          <span className="hover:opacity-90 transition-opacity">يَقِـيـنُ</span>
          <span className="text-black/90 dark:text-white/90 font-extrabold hover:opacity-90 transition-opacity">القُـرْآن</span>
        </span>
      </div>

      {/* 2. Geometric Accent Underline & Subtitle */}
      {showTagline && variant !== "compact" && (
        <div className="flex flex-col gap-0.5 mt-0.5">
          {/* Subtle Accent Line with end dots */}
          <div className={`flex items-center gap-1 opacity-60 ${config.lineWidth}`}>
            <span className="w-1 h-1 rounded-full bg-black dark:bg-white shrink-0" />
            <span className="h-[1.5px] flex-1 bg-black/80 dark:bg-white/80" />
            <span className="w-1 h-1 rounded-full bg-black dark:bg-white shrink-0" />
          </div>

          {/* English Wordmark & Spiritual Tagline */}
          <div className="flex items-center justify-between gap-2 px-0.5 mt-0.5">
            <span className={`text-black/80 dark:text-white/80 font-black uppercase tracking-[0.25em] font-sans ${config.latinSize}`}>
              YAQEEN AL-QURAN
            </span>
            <span className={`text-black/80 dark:text-white/80 font-bold font-arabic ${config.taglineSize}`}>
              نُورٌ وَهُدَى
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default YaqeenLogo;
