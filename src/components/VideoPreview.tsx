"use client";

import React, { useRef, useState, useEffect } from "react";
import { useEditor } from "@/store/useEditor";
import { useSurahData } from "@/hooks/useSurahData";
import { getAudioUrl } from "@/lib/quranUtils";

const isVideoUrl = (url: string) => {
  if (!url) return false;
  // Common video extensions, handles query params and fragments
  const videoExtensions = /\.(mp4|webm|mov|ogg|m4v|3gp|flv|avi)(\?.*|#.*)?$/i;
  return videoExtensions.test(url) || url.includes("pexels.com/video") || url.includes("vimeo.com/external");
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
      } catch (error) {
        console.error("Initial play failed:", error);
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
    <div className="relative aspect-[9/16] h-full max-h-[85vh] group select-none" id="video-render-container">
      <div className="absolute inset-0 bg-black rounded-[2.5rem] border-[8px] border-white/5 shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden">
        
        {/* Background Media */}
        {state.backgroundUrl && (
          isVideoUrl(state.backgroundUrl) ? (
            <video 
              ref={videoRef}
              src={state.backgroundUrl}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              loop
              muted
              autoPlay
              playsInline
              crossOrigin="anonymous"
            />
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-90 transition-all duration-1000"
              style={{ backgroundImage: `url(${state.backgroundUrl})` }}
            />
          )
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

        {/* Content */}
        <div className="relative h-full w-full flex flex-col items-center justify-end pb-36 p-10 text-center z-10">
          {surahLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-2 border-primary/10 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">جاري تحميل البيانات...</span>
            </div>
          ) : surahData ? (
            <div key={currentAyahIndex} className="flex flex-col gap-6 animate-in fade-in zoom-in duration-700">
              <div className="flex flex-col gap-1 items-center">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/70 font-bold uppercase">
                   {surahData?.name} · {state.startAyah} - {state.endAyah}
                </span>
                {isPlaying && (
                   <span className="text-[10px] text-primary font-bold animate-pulse">آية {currentAyahIndex}</span>
                )}
              </div>
              
              <p 
                className="text-4xl md:text-5xl text-white font-arabic leading-[1.6] text-center w-full" 
                style={{ 
                   color: state.textColor,
                   fontSize: `${state.fontSize}px`,
                   fontFamily: 'serif',
                   fontWeight: state.fontWeight,
                   textAlign: 'center'
                }}
              >
                {currentVerse?.text || "لم يتم العثور على الآية"}
              </p>
              
              <div className="w-16 h-[2px] bg-primary/40 self-center" />
              
              <p className="text-[15px] text-white/80 font-medium italic leading-relaxed text-center w-full">
                {currentVerse?.translation}
              </p>
            </div>
          ) : (
             <div className="flex flex-col items-center gap-4 p-8 glass rounded-3xl border-red-500/20">
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
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
}
