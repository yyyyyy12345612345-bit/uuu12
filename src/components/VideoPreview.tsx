"use client";

import React, { useRef, useState, useEffect } from "react";
import { useEditor } from "@/store/useEditor";
import { useSurahData } from "@/hooks/useSurahData";
import { getAudioUrl } from "@/lib/quranUtils";
import { RECITERS } from "@/data/reciters";
import { Play, Pause, Loader2, BookOpen, AlertCircle } from "lucide-react";

const isVideoUrl = (url: string) => {
  if (!url) return false;
  const videoExtensions = /\.(mp4|webm|mov|ogg|m4v|3gp|flv|avi)(\?.*|#.*)?$/i;
  const isVideo = videoExtensions.test(url) || 
         url.includes("pexels.com/video") || 
         url.includes("vimeo.com/external") ||
         url.includes("pexels.com/video/download") ||
         url.toLowerCase().includes(".mp4");
  return isVideo;
};

const getFilterCSS = (filter?: string): string => {
  const map: Record<string, string> = {
    none: "none",
    vintage: "sepia(0.5) contrast(1.1) brightness(0.8)",
    cool: "saturate(0.8) hue-rotate(20deg) brightness(1.1)",
    warm: "saturate(1.4) hue-rotate(-10deg) brightness(1.1)",
    bw: "grayscale(1) contrast(1.3) brightness(0.9)",
    dramatic: "contrast(1.5) brightness(0.6) saturate(1.3)",
    blur: "blur(30px) brightness(0.7)",
    invert: "invert(1) hue-rotate(180deg)",
    midnight: "brightness(0.5) contrast(1.3) saturate(0.7) hue-rotate(20deg)",
    oceanic: "hue-rotate(170deg) brightness(1.2) saturate(1.3) contrast(1.1)",
    sepia: "sepia(1) contrast(0.8) brightness(1.2)",
    saturated: "saturate(3) contrast(1.2)",
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
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!audioRef.current || !state.showVisualizer || !audioContextRef.current) return;
    
    let analyser = analyserRef.current;
    let source = sourceNodeRef.current;
    
    try {
      if (!analyser || !audioContextRef.current) return;
      
      const audioEl = audioRef.current as any;
      if (audioEl.__sourceNode) {
        source = audioEl.__sourceNode;
        sourceNodeRef.current = source;
      }
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
 
      const draw = () => {
        if (!visualizerCanvasRef.current || !analyserRef.current) return;
        const canvas = visualizerCanvasRef.current;
        const ctx = canvas.getContext('2d')!;
        analyserRef.current.getByteFrequencyData(dataArray);
 
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 1.2;
        let x = (canvas.width - (barWidth * bufferLength)) / 2;
 
        for(let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          ctx.fillStyle = state.visualizerColor || '#D4AF37';
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
          x += barWidth;
        }
        animationFrameRef.current = requestAnimationFrame(draw);
      };
 
      draw();
      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    } catch (e) { console.error("Visualizer error:", e); }
  }, [state.showVisualizer, state.visualizerColor]);

  useEffect(() => {
    setCurrentAyahIndex(state.startAyah);
  }, [state.startAyah, state.surahId]);

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [currentAyahIndex]);

  const handleAyahEnd = () => {
    if (currentAyahIndex < state.endAyah) {
      setCurrentAyahIndex(currentAyahIndex + 1);
    } else {
      setIsPlaying(false);
      videoRef.current?.pause();
      setCurrentAyahIndex(state.startAyah);
    }
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => console.error("Auto-play blocked:", error));
      }
    }
  }, [currentAyahIndex, isPlaying]);

  const setupAudioVisualizer = async () => {
    if (!audioRef.current || !state.showVisualizer) return;
    try {
      let audioContext = audioContextRef.current;
      if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;
      }
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      if (!analyserRef.current) {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        analyserRef.current = analyser;
      }
      const audioEl = audioRef.current as any;
      if (!sourceNodeRef.current) {
        const source = audioContext.createMediaElementSource(audioEl);
        audioEl.__sourceNode = source;
        sourceNodeRef.current = source;
        source.connect(analyserRef.current!);
        analyserRef.current!.connect(audioContext.destination);
      }
    } catch (error) {
      console.error("Visualizer setup failed:", error);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      videoRef.current?.pause();
      setIsPlaying(false);
    } else {
      try {
        if (state.showVisualizer) {
          await setupAudioVisualizer();
        }
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        audioRef.current.load();
        await audioRef.current.play();
        videoRef.current?.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Play failed:", error);
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
    <div className={`relative aspect-[9/16] h-full max-h-[78vh] group select-none font-['Tajawal']`} id="video-render-container">
      <style>{`
        @keyframes dustMovePreview {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(-500px) translateX(60px); opacity: 0; }
        }
        @keyframes rayMovePreview {
          0% { transform: rotate(-25deg) translateX(-10%); opacity: 0.15; }
          50% { transform: rotate(-15deg) translateX(5%); opacity: 0.3; }
          100% { transform: rotate(-25deg) translateX(-10%); opacity: 0.15; }
        }
        @keyframes bokehMovePreview {
           0% { transform: translate(0, 0) scale(1); opacity: 0.2; }
           50% { transform: translate(40px, -40px) scale(1.2); opacity: 0.5; }
           100% { transform: translate(-40px, 40px) scale(1); opacity: 0.2; }
        }
        @keyframes goldGlow {
            0% { box-shadow: 0 0 20px rgba(212,175,55,0.2); }
            50% { box-shadow: 0 0 50px rgba(212,175,55,0.5); }
            100% { box-shadow: 0 0 20px rgba(212,175,55,0.2); }
        }
      `}</style>

      {/* Premium Frame */}
      <div className="absolute inset-[-12px] rounded-[3.5rem] border-[1px] border-primary/20 bg-primary/5 pointer-events-none" />
      
      <div className="absolute inset-0 bg-[#0c0d10] rounded-[3rem] border-[8px] border-[#0A0A0A] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Background Media */}
        <div className="absolute inset-0 z-0">
          {state.backgroundUrl ? (
            isVideoUrl(state.backgroundUrl) ? (
              <video
                ref={videoRef}
                src={state.backgroundUrl}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
                style={{ filter: getFilterCSS(state.filter) }}
                loop
                muted
                autoPlay
                playsInline
              />
            ) : (
              <div
                className="absolute inset-0 bg-cover bg-center transition-[opacity,filter] duration-700"
                style={{ 
                  backgroundImage: `url(${state.backgroundUrl.includes('pexels.com') ? `${state.backgroundUrl.split('?')[0]}?auto=compress&cs=tinysrgb&fit=crop&h=1280&w=720` : state.backgroundUrl})`, 
                  filter: getFilterCSS(state.filter) 
                }}
              />
            )
          ) : (
            <div className="absolute inset-0 bg-[#0c0d10] islamic-pattern opacity-10" />
          )}
        </div>

        {/* Overlays */}
        {state.overlay === "dust" && (
           <div className="absolute inset-0 pointer-events-none z-10">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="absolute rounded-full bg-primary/30 blur-[2px]" style={{
                   bottom: '-20px',
                   left: `${Math.random() * 100}%`,
                   width: `${Math.random() * 6 + 2}px`,
                   height: `${Math.random() * 6 + 2}px`,
                   animation: `dustMovePreview ${Math.random() * 8 + 8}s linear infinite`,
                   animationDelay: `-${Math.random() * 15}s`
                }} />
              ))}
           </div>
        )}

        {state.overlay === "rays" && (
           <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              <div className="absolute top-[-60%] left-[-20%] w-[250%] h-[250%] blur-[40px]" style={{
                 background: 'repeating-linear-gradient(110deg, transparent, transparent 4%, rgba(212,175,55,0.06) 8%, transparent 12%)',
                 animation: 'rayMovePreview 12s ease-in-out infinite'
              }} />
           </div>
        )}

        {state.overlay === "bokeh" && (
           <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="absolute rounded-full" style={{
                   top: `${Math.random() * 100}%`,
                   left: `${Math.random() * 100}%`,
                   width: `${Math.random() * 120 + 60}px`,
                   height: `${Math.random() * 120 + 60}px`,
                   background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 75%)',
                   animation: `bokehMovePreview ${Math.random() * 12 + 12}s ease-in-out infinite`,
                   animationDelay: `-${Math.random() * 12}s`
                }} />
              ))}
           </div>
        )}

        {/* Visualizer Canvas */}
        {state.showVisualizer && (
           <canvas 
              ref={visualizerCanvasRef} 
              width={400} 
              height={200} 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[30%] opacity-40 z-[4] mix-blend-screen pointer-events-none"
           />
        )}

        {/* Vignette & Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-[5]" />
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.6)] z-[5]" />

        {/* Social Handles */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 z-[6] pointer-events-none">
           {state.tiktokHandle && (
              <div className="flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                 <span className="text-white text-xs font-bold font-mono">@{state.tiktokHandle}</span>
                 <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
              </div>
           )}
           {state.instaHandle && (
              <div className="flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
                 <span className="text-white text-xs font-bold font-mono">@{state.instaHandle}</span>
                 <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </div>
           )}
        </div>

        {/* Static Surah Header pinned to top */}
        {surahData && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-none">
            <div className="px-5 py-2 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl flex items-center gap-3 shadow-lg">
                <BookOpen className="w-3.5 h-3.5 text-primary animate-pulse" />
                <span className="text-[11px] text-white/90 font-black uppercase tracking-widest">{surahData?.name}</span>
            </div>
            {isPlaying && (
              <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                 <span className="text-[9px] text-primary font-black uppercase tracking-widest">آية {currentAyahIndex}</span>
              </div>
            )}
          </div>
        )}

        {/* Verse Number (Bottom) */}
        {surahData && currentVerse && (
          <div className="absolute bottom-[14%] left-0 right-0 flex justify-center z-30 pointer-events-none">
            <span className="text-[22px] font-bold text-primary font-['Amiri'] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {(() => {
                const dec = state.ayahDecoration || "bracket1";
                if (dec === "none") return `${currentVerse.id}`;
                if (dec === "bracket1") return `﴿ ${currentVerse.id} ﴾`;
                if (dec === "bracket2") return `﴾ ${currentVerse.id} ﴿`;
                if (dec === "star") return `✧ ${currentVerse.id} ✧`;
                if (dec === "diamond") return `✥ ${currentVerse.id} ✥`;
                if (dec === "ornament") return `۞ ${currentVerse.id} ۞`;
                return `﴿ ${currentVerse.id} ﴾`;
              })()}
            </span>
          </div>
        )}

        {/* Content Layer */}
        <div 
          className="absolute inset-0 flex flex-col items-center px-10 text-center z-20 transition-all duration-1000 ease-out"
          style={{ 
            justifyContent: state.textPosition === 'top' ? 'flex-start' : state.textPosition === 'bottom' ? 'flex-end' : 'center',
            paddingTop: state.textPosition === 'top' ? '180px' : '60px',
            paddingBottom: state.textPosition === 'bottom' ? '160px' : '60px',
            transform: `translateY(${state.textVerticalOffset / 2}px)` 
          }}
        >
          {surahLoading ? (
            <div className="flex flex-col items-center gap-6 py-20 animate-pulse">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] text-primary font-black uppercase tracking-[0.5em]">جاري جلب البيانات</span>
            </div>
          ) : surahData ? (
            <div 
              key={currentAyahIndex} 
              className={`flex flex-col gap-8 w-full transition-all duration-1000 ${
                state.animation === 'slide' ? 'animate-in slide-in-from-bottom-32 fade-in' : 
                state.animation === 'zoom' ? 'animate-in zoom-in-150 fade-in duration-1000' :
                state.animation === 'fly' ? 'animate-in slide-in-from-right-32 fade-in duration-1000' :
                state.animation === 'bounce' ? 'animate-in slide-in-from-top-32 fade-in duration-1000' :
                state.animation === 'glitch' ? 'animate-in skew-x-12 fade-in duration-100' :
                'animate-in fade-in duration-1000'
              }`}
            >
              {/* Quranic Text */}
              <p
                className={`font-['Amiri'] text-white leading-[1.8] text-center w-full break-words`}
                style={{
                  color: state.textColor,
                  fontSize: `${Math.min(state.fontSize, 70)}px`,
                  fontWeight: state.fontWeight,
                  textShadow: '0 8px 30px rgba(0,0,0,0.9)'
                }}
              >
                {currentVerse?.text || "لم يتم العثور على الآية"}
              </p>

              {/* Divider */}
              <div className="flex items-center gap-4 self-center w-32">
                 <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/40" />
                 <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                 <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/40" />
              </div>

              {/* Translation */}
              <p className="text-[15px] md:text-[17px] text-white/90 font-medium italic leading-loose text-center w-full line-clamp-5 px-4" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                {currentVerse?.translation}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 p-10 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] backdrop-blur-xl">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <span className="text-sm font-black text-white/80">تعذر تحميل بيانات السورة</span>
              <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white/5 rounded-xl text-[10px] text-white font-black hover:bg-white/10 transition-all uppercase tracking-widest">إعادة المحاولة</button>
            </div>
          )}
        </div>

        {/* Floating Play Control */}
        <div className="absolute inset-x-0 bottom-32 flex flex-col items-center z-40">
          <button
            onClick={togglePlay}
            disabled={surahLoading}
            className={`w-20 h-20 rounded-[2.5rem] bg-primary border-4 border-black/40 flex items-center justify-center transition-all duration-500 shadow-2xl hover:scale-110 active:scale-95 group/play ${isPlaying ? 'bg-primary/90' : 'animate-[goldGlow_3s_infinite]'}`}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-black fill-current" />
            ) : (
              <Play className="w-8 h-8 text-black fill-current ml-1" />
            )}
          </button>
        </div>

        <audio
          ref={audioRef}
          src={getAudioUrl(Number(state.surahId), currentAyahIndex, state.reciterId)}
          crossOrigin="anonymous"
          preload="auto"
          onEnded={handleAyahEnd}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={(e) => console.error("Audio load error:", e)}
        />
      </div>
    </div>
  );
}
