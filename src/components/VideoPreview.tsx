"use client";

import React, { useRef, useState, useEffect } from "react";
import { useEditor } from "@/store/useEditor";
import { useSurahData } from "@/hooks/useSurahData";
import { getAudioUrl } from "@/lib/quranUtils";
import { RECITERS } from "@/data/reciters";

const isVideoUrl = (url: string) => {
  if (!url) return false;
  const videoExtensions = /\.(mp4|webm|mov|ogg|m4v|3gp|flv|avi)(\?.*|#.*)?$/i;
  return videoExtensions.test(url) || url.includes("pexels.com/video") || url.includes("vimeo.com/external");
};

const getFilterCSS = (filter?: string): string => {
  const map: Record<string, string> = {
    none: "none",
    vintage: "sepia(0.5) contrast(1.1) brightness(0.9)",
    cool: "saturate(0.8) hue-rotate(20deg) brightness(1.05)",
    warm: "saturate(1.3) hue-rotate(-10deg) brightness(1.05)",
    bw: "grayscale(1) contrast(1.2)",
    dramatic: "contrast(1.4) brightness(0.7) saturate(1.2)",
    blur: "blur(20px) brightness(0.8)",
    invert: "invert(1) hue-rotate(180deg)",
    midnight: "brightness(0.4) contrast(1.5) saturate(0.5) hue-rotate(220deg)",
    oceanic: "hue-rotate(180deg) brightness(1.1) saturate(1.8) contrast(1.1)",
    sepia: "sepia(1) contrast(0.9) brightness(1.1)",
    saturated: "saturate(2.5) contrast(1.1)",
  };
  return map[filter || "none"] || "none";
};

export function VideoPreview() {
  const { state } = useEditor();
  const { data: surahData, loading: surahLoading } = useSurahData(state.surahId);

  const [currentAyahIndex, setCurrentAyahIndex] = useState(state.startAyah);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Sync index when startAyah changes
  useEffect(() => {
    setCurrentAyahIndex(state.startAyah);
  }, [state.startAyah, state.surahId]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [currentAyahIndex]);

  // Handle the "Next" logic
  const handleAyahEnd = () => {
    if (currentAyahIndex < state.endAyah) {
      const nextIndex = currentAyahIndex + 1;
      setCurrentAyahIndex(nextIndex);
      // We don't call play here, the useEffect below handles it when index changes
    } else {
      setIsPlaying(false);
      videoRef.current?.pause();
      setCurrentAyahIndex(state.startAyah);
    }
  };

  // Watch for index change and play immediately if we are in "isPlaying" mode
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      // Essential: load the new source
      audioRef.current.load();

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Auto-play blocked after end:", error);
          // Optional: Show a subtle hint to user if it fails
        });
      }
    }
  }, [currentAyahIndex, isPlaying]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      videoRef.current?.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        videoRef.current?.play();
        setIsPlaying(true);
        
        // Analytics: تفاصيل دقيقة عن الاستماع
        // @ts-ignore
        window.gtag?.('event', 'play_quran_detailed', {
            'reciter_id': state.reciterId,
            'reciter_name': RECITERS.find(r => r.id === state.reciterId)?.name || "Unknown",
            'surah_id': state.surahId,
            'ayah_id': currentAyahIndex,
            'font_size': state.fontSize,
            'text_color': state.textColor
        });
      } catch (error) {
        console.error("Initial play failed:", error);
        // Analytics: تتبع فشل تشغيل الصوت
        // @ts-ignore
        window.gtag?.('event', 'audio_play_error', {
            'reciter_id': state.reciterId,
            'surah_id': state.surahId,
            'error_msg': "Initial play failed"
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

  const currentVerse = surahData?.verses.find(v => v.id === currentAyahIndex);

  return (
    <div className="relative aspect-[9/16] h-full max-h-[72vh] group select-none" id="video-render-container">
      <style>{`
        @keyframes dustMovePreview {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          50% { opacity: 0.4; }
          100% { transform: translateY(-400px) translateX(40px); opacity: 0; }
        }
        @keyframes rayMovePreview {
          0% { transform: rotate(-20deg) translateX(-5%); opacity: 0.1; }
          50% { transform: rotate(-15deg) translateX(0%); opacity: 0.2; }
          100% { transform: rotate(-20deg) translateX(-5%); opacity: 0.1; }
        }
        @keyframes bokehMovePreview {
           0% { transform: translate(0, 0); opacity: 0.2; }
           50% { transform: translate(20px, -20px); opacity: 0.4; }
           100% { transform: translate(-20px, 20px); opacity: 0.2; }
        }
      `}</style>

      <div className="absolute inset-0 bg-black rounded-[2.5rem] border-[8px] border-white/5 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden">

        {/* Background Media */}
        {state.backgroundUrl && (
          isVideoUrl(state.backgroundUrl) ? (
            <video
              ref={videoRef}
              src={state.backgroundUrl}
              className="absolute inset-0 w-full h-full object-cover opacity-60 transition-all duration-500"
              style={{ filter: getFilterCSS(state.filter) }}
              loop
              muted
              autoPlay
              playsInline
              crossOrigin="anonymous"
            />
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-90 transition-all duration-1000"
              style={{ backgroundImage: `url(${state.backgroundUrl})`, filter: getFilterCSS(state.filter) }}
            />
          )
        )}

        {/* Overlays Preview */}
        {state.overlay === "dust" && (
           <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="absolute rounded-full bg-white/40 blur-[1px]" style={{
                   bottom: '-10px',
                   left: `${Math.random() * 100}%`,
                   width: `${Math.random() * 4 + 2}px`,
                   height: `${Math.random() * 4 + 2}px`,
                   animation: `dustMovePreview ${Math.random() * 5 + 5}s linear infinite`,
                   animationDelay: `-${Math.random() * 10}s`
                }} />
              ))}
           </div>
        )}

        {state.overlay === "rays" && (
           <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-[-50%] left-[-10%] w-[200%] h-[200%] blur-[30px]" style={{
                 background: 'repeating-linear-gradient(90deg, transparent, transparent 5%, rgba(255,255,255,0.03) 10%, transparent 15%)',
                 animation: 'rayMovePreview 10s ease-in-out infinite'
              }} />
           </div>
        )}

        {state.overlay === "bokeh" && (
           <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="absolute rounded-full" style={{
                   top: `${Math.random() * 100}%`,
                   left: `${Math.random() * 100}%`,
                   width: `${Math.random() * 100 + 50}px`,
                   height: `${Math.random() * 100 + 50}px`,
                   background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
                   animation: `bokehMovePreview ${Math.random() * 10 + 10}s ease-in-out infinite`,
                   animationDelay: `-${Math.random() * 10}s`
                }} />
              ))}
           </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-[#000000]/20 to-[#000000]/40" />

        {/* Content Container with dynamic positioning and transition */}
        <div 
          className="absolute inset-0 flex flex-col items-center px-12 text-center z-10 transition-all duration-700 ease-out"
          style={{ 
            justifyContent: state.textPosition === 'top' ? 'flex-start' : state.textPosition === 'bottom' ? 'flex-end' : 'center',
            paddingTop: state.textPosition === 'top' ? '80px' : '40px',
            paddingBottom: state.textPosition === 'bottom' ? '140px' : '40px',
            transform: `translateY(${state.textVerticalOffset / 2.5}px)` // Normalizing offset for smaller preview
          }}
        >
          {surahLoading ? (
            <div className="flex flex-col items-center gap-4 mt-auto mb-auto">
              <div className="w-12 h-12 border-2 border-primary/10 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">جاري تحميل البيانات...</span>
            </div>
          ) : surahData ? (
            <div 
              key={currentAyahIndex} 
              className={`flex flex-col gap-6 w-full max-w-full overflow-hidden transition-all duration-700 ${
                state.animation === 'scale' ? 'animate-in zoom-in-75 fade-in' : 
                state.animation === 'slide' ? 'animate-in slide-in-from-bottom-20 fade-in' : 
                state.animation === 'blur' ? 'animate-in fade-in blur-in' :
                state.animation === 'zoom' ? 'animate-in zoom-in-150 fade-in' :
                state.animation === 'flip' ? 'animate-in flip-in-x fade-in' :
                state.animation === 'bounce' ? 'animate-in slide-in-from-top-20 fade-in duration-1000' :
                state.animation === 'glitch' ? 'animate-pulse' :
                'animate-in fade-in'
              }`}
            >
              <div className="flex flex-col gap-1 items-center shrink-0">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/70 font-bold uppercase backdrop-blur-sm">
                  {surahData?.name} · {state.startAyah} - {state.endAyah}
                </span>
                {isPlaying && (
                  <span className="text-[10px] text-primary font-bold animate-pulse">آية {currentAyahIndex}</span>
                )}
              </div>

              <p
                className="text-white font-arabic leading-[1.6] text-center w-full break-words"
                style={{
                  color: state.textColor,
                  fontSize: `${Math.min(state.fontSize, 80)}px`, // Cap preview size for frame safety
                  fontFamily: `"${state.fontFamily || 'Amiri'}", serif`,
                  fontWeight: state.fontWeight,
                  textShadow: '0 10px 30px rgba(0,0,0,0.8)'
                }}
              >
                {currentVerse?.text || "لم يتم العثور على الآية"}
              </p>

              <div className="w-16 h-[2px] bg-primary/40 self-center shrink-0" />

              <p className="text-[14px] md:text-[16px] text-white/90 font-medium italic leading-relaxed text-center w-full line-clamp-4">
                {currentVerse?.translation}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 p-8 glass rounded-3xl border-red-500/20 mt-auto mb-auto">
              <span className="text-red-400 text-sm font-bold font-arabic">تعذر تحميل بيانات السورة</span>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white/10 rounded-xl text-[10px] text-white hover:bg-white/20 transition-all font-bold"
              >
                إعادة المحاولة
              </button>
            </div>
          )}
        </div>

        {/* Play Control */}
        <div className="absolute inset-x-0 bottom-28 flex flex-col items-center gap-4 z-30">
          <button
            onClick={togglePlay}
            disabled={surahLoading}
            className="w-16 h-16 rounded-full glass border-white/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(212,175,55,0.2)]"
          >
            {isPlaying ? (
              <div className="flex gap-2">
                <div className="w-1.5 h-5 bg-primary rounded-sm shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                <div className="w-1.5 h-5 bg-primary rounded-sm shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
              </div>
            ) : (
              <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-primary border-b-[10px] border-b-transparent ml-1.5" />
            )}
          </button>

        </div>

        <audio
          ref={audioRef}
          src={getAudioUrl(Number(state.surahId), currentAyahIndex, state.reciterId)}
          onEnded={handleAyahEnd}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
      </div>
    </div>
  );
}
