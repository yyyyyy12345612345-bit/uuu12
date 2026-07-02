"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useEditor } from "@/store/useEditor";
import { useSurahData } from "@/hooks/useSurahData";
import { getAudioUrl } from "@/lib/quranUtils";
import { RECITERS, getReciterEnglishName, getSheikhAsset } from "@/data/reciters";
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
    vintage: "sepia(0.5) contrast(1.1) brightness(0.9)",
    cool: "saturate(0.8) hue-rotate(20deg) brightness(1.05)",
    warm: "saturate(1.3) hue-rotate(-10deg) brightness(1.05)",
    bw: "grayscale(1) contrast(1.2)",
    dramatic: "contrast(1.4) brightness(0.7) saturate(1.2)",
    blur: "blur(20px) brightness(0.8)",
    invert: "invert(1) hue-rotate(180deg)",
    midnight: "brightness(0.5) contrast(1.3) saturate(0.7) hue-rotate(20deg)",
    oceanic: "hue-rotate(30deg) brightness(1.05) saturate(1.2) contrast(1.1)",
    sepia: "sepia(1) contrast(0.9) brightness(1.1)",
    saturated: "saturate(2.2) contrast(1.15)",
    cinematic: "contrast(1.25) brightness(0.85) saturate(1.1) sepia(0.15)",
    golden: "sepia(0.35) contrast(1.15) brightness(1.05) saturate(1.3) hue-rotate(-5deg)",
    teal_orange: "contrast(1.2) saturate(1.25) hue-rotate(-15deg) sepia(0.1) brightness(0.9)",
    noir: "grayscale(1) contrast(1.7) brightness(0.75)",
    dreamy: "saturate(0.95) brightness(1.15) contrast(0.9) blur(1.5px)",
    neon: "saturate(2) hue-rotate(60deg) brightness(1.25) contrast(1.1)",
    pastel: "saturate(0.65) brightness(1.2) contrast(0.95)",
    lut_autumn: "sepia(0.2) saturate(1.45) hue-rotate(-20deg) contrast(1.15) brightness(0.95)",
    lut_forest: "hue-rotate(50deg) saturate(1.25) contrast(1.2) brightness(0.85)",
    high_contrast: "contrast(1.5) saturate(1.35) brightness(1.1)",
    faded: "contrast(0.8) brightness(1.15) saturate(0.65)",
    cross_process: "contrast(1.35) saturate(1.15) hue-rotate(10deg) sepia(0.12)",
  };
  return map[filter || "none"] || "none";
};

const wrapTextHelper = (text: string, _fontSize: number, _maxWidth: number) => {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 4) return [text];
  const wordsPerLine = 4;
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(" "));
  }
  return lines;
};

const formatTime = (secs: number) => {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export function VideoPreview() {
  const { state } = useEditor();
  const { data: surahData, loading: surahLoading } = useSurahData(state.surahId);

  const [currentAyahIndex, setCurrentAyahIndex] = useState(state.startAyah);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressDotRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [visualizerActive, setVisualizerActive] = useState(false);

  const [verseDurations, setVerseDurations] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!surahData) return;
    const versesToLoad = surahData.verses.filter(v => v.id >= state.startAyah && v.id <= state.endAyah);
    setVerseDurations({});
    versesToLoad.forEach(v => {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.src = getAudioUrl(Number(state.surahId), v.id, state.reciterId);
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        setVerseDurations(prev => ({ ...prev, [v.id]: audio.duration }));
      };
      audio.onerror = () => {
        setVerseDurations(prev => ({ ...prev, [v.id]: 5 }));
      };
    });
  }, [state.surahId, state.startAyah, state.endAyah, state.reciterId, surahData]);

  const totalSelectedDuration = useMemo(() => {
    if (!surahData) return 0;
    const versesInRange = surahData.verses.filter(v => v.id >= state.startAyah && v.id <= state.endAyah);
    return versesInRange.reduce((sum, v) => sum + (verseDurations[v.id] || 5), 0);
  }, [verseDurations, state.startAyah, state.endAyah, surahData]);

  const totalSelectedElapsed = useMemo(() => {
    if (!surahData) return 0;
    const versesInRange = surahData.verses.filter(v => v.id >= state.startAyah && v.id <= state.endAyah);
    let sum = 0;
    for (let v of versesInRange) {
      if (v.id < currentAyahIndex) {
        sum += verseDurations[v.id] || 5;
      } else if (v.id === currentAyahIndex) {
        sum += currentTime;
        break;
      } else {
        break;
      }
    }
    return sum;
  }, [verseDurations, currentAyahIndex, currentTime, state.startAyah, state.endAyah, surahData]);

  // Buttery smooth progress updates at 60fps
  useEffect(() => {
    let animFrameId: number;
    
    const updateProgressSmoothly = () => {
      if (audioRef.current && totalSelectedDuration > 0 && isPlaying) {
        const versesInRange = surahData?.verses.filter(v => v.id >= state.startAyah && v.id <= state.endAyah) || [];
        let elapsed = 0;
        for (let v of versesInRange) {
          if (v.id < currentAyahIndex) {
            elapsed += verseDurations[v.id] || 5;
          } else if (v.id === currentAyahIndex) {
            elapsed += audioRef.current.currentTime;
            break;
          } else {
            break;
          }
        }
        
        const pct = (elapsed / totalSelectedDuration) * 100;
        
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${pct}%`;
        }
        if (progressDotRef.current) {
          progressDotRef.current.style.left = `${pct}%`;
        }
        if (progressTextRef.current) {
          progressTextRef.current.innerText = formatTime(elapsed);
        }
      }
      animFrameId = requestAnimationFrame(updateProgressSmoothly);
    };
    
    if (isPlaying) {
      animFrameId = requestAnimationFrame(updateProgressSmoothly);
    }
    
    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isPlaying, totalSelectedDuration, surahData, currentAyahIndex, state.startAyah, state.endAyah, verseDurations]);

  const textWrapperRef = useRef<HTMLDivElement>(null);
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!visualizerActive || !state.showVisualizer) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      if (textWrapperRef.current) {
        textWrapperRef.current.style.transform = 'scale(1)';
      }
      return;
    }

    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!visualizerCanvasRef.current || !analyserRef.current) return;
      const canvas = visualizerCanvasRef.current;
      const ctx = canvas.getContext('2d')!;
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 0.8;
      const spacing = 4;
      let x = (canvas.width - (barWidth * bufferLength)) / 2;

      const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
      grad.addColorStop(0, (state.visualizerColor || '#D4AF37') + '22');
      grad.addColorStop(0.5, state.visualizerColor || '#D4AF37');
      grad.addColorStop(1, '#ffffff');

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
        const barHeight = (dataArray[i] / 255) * canvas.height * 1.5;
        ctx.fillStyle = grad;
        
        const rx = x;
        const ry = canvas.height - barHeight;
        const rw = barWidth - spacing;
        const rh = barHeight;

        if (rh > 0) {
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(rx, ry, rw, rh, [rw / 2, rw / 2, 0, 0]);
          } else {
            ctx.rect(rx, ry, rw, rh);
          }
          ctx.fill();
        }
        x += barWidth;
      }

      // Audio-reactive text pulse
      const average = sum / bufferLength;
      const scale = 1 + (average / 255) * 0.08;
      if (textWrapperRef.current) {
        textWrapperRef.current.style.transform = `scale(${scale})`;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (textWrapperRef.current) {
        textWrapperRef.current.style.transform = 'scale(1)';
      }
    };
  }, [visualizerActive, state.showVisualizer, state.visualizerColor]);

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
      setVisualizerActive(false);
      videoRef.current?.pause();
      setCurrentAyahIndex(state.startAyah);
    }
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("preview_play_state_changed", { detail: { isPlaying } }));
  }, [isPlaying]);

  useEffect(() => {
    const handleToggle = () => {
      togglePlay();
    };
    window.addEventListener("toggle_preview_play", handleToggle);
    return () => {
      window.removeEventListener("toggle_preview_play", handleToggle);
    };
  }, [isPlaying, state.showVisualizer]);

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
      setVisualizerActive(true);
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
      setVisualizerActive(false);
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
        
        if (videoRef.current) {
          videoRef.current.volume = 0.25;
        }
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

  // Scale font size for preview (preview is ~40% of final render size)
  const previewFontSize = Math.min(Math.round(state.fontSize * 0.55), 68);

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
        /* ── 16 Text Transition Animations ── */
        @keyframes vpFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes vpScaleIn {
          0% { opacity: 0; transform: scale(0.3); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes vpSlideUp {
          0% { opacity: 0; transform: translateY(120px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes vpBlurIn {
          0% { opacity: 0; filter: blur(20px); transform: scale(1.1); }
          100% { opacity: 1; filter: blur(0); transform: scale(1); }
        }
        @keyframes vpZoomIn {
          0% { opacity: 0; transform: scale(2.5); filter: blur(10px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes vpFlipIn {
          0% { opacity: 0; transform: perspective(800px) rotateY(90deg); }
          100% { opacity: 1; transform: perspective(800px) rotateY(0); }
        }
        @keyframes vpBounceIn {
          0% { opacity: 0; transform: translateY(-200px); }
          60% { opacity: 1; transform: translateY(20px); }
          80% { transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes vpGlitchIn {
          0% { opacity: 0; transform: translate(-5px, 3px) skewX(5deg); filter: blur(4px); }
          12% { opacity: 0.7; transform: translate(4px, -2px) skewX(-3deg); filter: blur(2px); }
          25% { transform: translate(-3px, 1px) skewX(2deg); filter: blur(1px); }
          37% { transform: translate(2px, -1px) skewX(-1deg); filter: blur(0); }
          50% { opacity: 1; transform: translate(-1px, 0) skewX(0); }
          62% { transform: translate(1px, 0); }
          75% { transform: translate(0, 0); }
          100% { opacity: 1; transform: translate(0, 0); filter: blur(0); }
        }
        @keyframes vpTypewriter {
          0% { opacity: 0; clip-path: inset(0 100% 0 0); }
          100% { opacity: 1; clip-path: inset(0 0 0 0); }
        }
        @keyframes vpWaveIn {
          0% { opacity: 0; transform: translateY(60px); }
          25% { opacity: 0.5; transform: translateY(-20px); }
          50% { opacity: 0.8; transform: translateY(10px); }
          75% { transform: translateY(-5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes vpSpiralIn {
          0% { opacity: 0; transform: scale(0) rotate(360deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes vpElasticIn {
          0% { opacity: 0; transform: scale(0.2); }
          40% { opacity: 0.8; transform: scale(1.15); }
          60% { transform: scale(0.9); }
          80% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes vpSwingIn {
          0% { opacity: 0; transform: rotate(-15deg) translateY(30px); transform-origin: top center; }
          40% { opacity: 1; transform: rotate(10deg); }
          60% { transform: rotate(-5deg); }
          80% { transform: rotate(2deg); }
          100% { opacity: 1; transform: rotate(0); }
        }
        @keyframes vpCinematicIn {
          0% { opacity: 0; clip-path: inset(45% 0 45% 0); transform: scale(1.3); }
          50% { opacity: 0.8; clip-path: inset(15% 0 15% 0); transform: scale(1.1); }
          100% { opacity: 1; clip-path: inset(0 0 0 0); transform: scale(1); }
        }
        @keyframes vpSplitIn {
          0% { opacity: 0; clip-path: inset(0 50% 0 50%); transform: scaleY(0.8); }
          100% { opacity: 1; clip-path: inset(0 0 0 0); transform: scaleY(1); }
        }
        @keyframes vpRotateIn {
          0% { opacity: 0; transform: rotate(-180deg) scale(0.5); }
          100% { opacity: 1; transform: rotate(0) scale(1); }
        }
      `}</style>

      {/* Premium Frame */}
      <div className="absolute inset-[-12px] rounded-[3.5rem] border-[1px] border-primary/20 bg-primary/5 pointer-events-none" />
      
      <div 
        className={`absolute inset-0 rounded-[3rem] border-[8px] border-[#0A0A0A] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden transition-colors duration-500 ${
          (state.videoTemplate === "dossary_player" || state.videoTemplate === "youssef_player") ? "bg-gradient-to-b from-zinc-950 via-zinc-900 to-black" : ""
        }`} 
        style={{ backgroundColor: (state.videoTemplate === "minshawi_player" || state.videoTemplate === "dossary_player" || state.videoTemplate === "basit_player" || state.videoTemplate === "youssef_player") ? "#000000" : "#0c0d10" }}
      >
        
        {/* Background Media */}
        <div className="absolute inset-0 z-0 bg-black">
          {state.videoTemplate !== "minshawi_player" && state.videoTemplate !== "dossary_player" && state.videoTemplate !== "basit_player" && state.videoTemplate !== "youssef_player" ? (
            state.backgroundUrl ? (
              isVideoUrl(state.backgroundUrl) ? (
                <video
                  ref={videoRef}
                  src={state.backgroundUrl}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
                  style={{ filter: getFilterCSS(state.filter) }}
                  loop
                  muted={false}
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
            )
          ) : (
            state.videoTemplate === "minshawi_player" ? (
              <div className="absolute top-[29.69%] bottom-[29.69%] left-0 right-0 bg-[#383838] z-10" />
            ) : state.videoTemplate === "dossary_player" ? (
              <>
                <div className="absolute top-0 left-0 right-0 h-[29.69%] bg-black z-10" />
                <div 
                  className="absolute top-[29.69%] bottom-[29.69%] left-0 right-0 bg-cover bg-center z-10"
                  style={{ backgroundImage: `url(https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782871516/12_gahaqi.png)` }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-[29.69%] bg-black z-10" />
              </>
            ) : state.videoTemplate === "youssef_player" ? (
              <div className="absolute inset-0 bg-black z-10">
                <div 
                  className="absolute top-[29.69%] bottom-[29.69%] bg-cover bg-center rounded-[2.5rem]"
                  style={{ left: '2.7%', right: '2.7%', backgroundImage: `url(https://res.cloudinary.com/dtuyo4gqm/image/upload/v1783004228/Untitled_design_zawi7h.png)` }}
                />
              </div>
            ) : null
          )}
        </div>

        {/* Overlays */}
        {state.videoTemplate !== "minshawi_player" && state.videoTemplate !== "dossary_player" && state.videoTemplate !== "basit_player" && state.videoTemplate !== "youssef_player" && (
          <>
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

        {/* ── Snow Overlay ── */}
        {state.overlay === "snow" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {[...Array(35)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute', top: '-20px',
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 5 + 2}px`, height: `${Math.random() * 5 + 2}px`,
                background: 'white', borderRadius: '50%', boxShadow: '0 0 4px white',
                animation: `snowFall ${Math.random() * 8 + 8}s linear infinite`,
                animationDelay: `-${Math.random() * 15}s`
              }} />
            ))}
          </div>
        )}

        {/* ── Rain Overlay ── */}
        {state.overlay === "rain" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {[...Array(50)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: `${Math.random() * -20}%`,
                left: `${Math.random() * 120}%`,
                width: '1px', height: `${Math.random() * 30 + 20}px`,
                background: 'rgba(174,194,224,0.4)',
                transform: 'rotate(15deg)',
                animation: `rainFall ${Math.random() * 0.8 + 0.6}s linear infinite`,
                animationDelay: `-${Math.random() * 2}s`
              }} />
            ))}
          </div>
        )}

        {/* ── Fireflies Overlay ── */}
        {state.overlay === "fireflies" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {[...Array(18)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                bottom: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 5 + 3}px`, height: `${Math.random() * 5 + 3}px`,
                background: '#D4AF37', borderRadius: '50%',
                boxShadow: '0 0 10px #D4AF37, 0 0 20px #FFD700',
                animation: `fireflyFloat ${Math.random() * 10 + 8}s ease-in-out infinite`,
                animationDelay: `-${Math.random() * 15}s`
              }} />
            ))}
          </div>
        )}

        {/* ── Smoke Overlay ── */}
        {state.overlay === "smoke" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute', bottom: '-100px',
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 200 + 100}px`, height: `${Math.random() * 200 + 100}px`,
                background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: `smokeRise ${Math.random() * 18 + 15}s ease-out infinite`,
                animationDelay: `-${Math.random() * 20}s`
              }} />
            ))}
          </div>
        )}

        {/* ── Sparkle Overlay ── */}
        {state.overlay === "sparkle" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {[...Array(16)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                top: `${Math.random() * 90}%`,
                left: `${Math.random() * 90}%`,
                width: '10px', height: '10px',
                background: '#FFD700',
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                boxShadow: '0 0 8px #FFD700',
                animation: `sparklePulse ${Math.random() * 3 + 2}s ease-in-out infinite`,
                animationDelay: `-${Math.random() * 5}s`
              }} />
            ))}
          </div>
        )}

        {/* ── Film Grain Overlay ── */}
        {state.overlay === "film_grain" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-[0.08] mix-blend-overlay">
            <div style={{
              position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              animation: 'grainShift 0.4s steps(1) infinite'
            }} />
          </div>
        )}

        {/* ── Light Leak Overlay ── */}
        {state.overlay === "light_leak" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10" style={{ mixBlendMode: 'screen' as any }}>
            <div style={{
              position: 'absolute', top: '-20%', left: '-20%', width: '140%', height: '140%',
              background: 'radial-gradient(circle at 10% 20%, rgba(255,99,71,0.35) 0%, rgba(255,165,0,0.15) 40%, transparent 70%)',
              filter: 'blur(50px)',
              animation: 'lightLeakPulse 10s ease-in-out infinite'
            }} />
          </div>
        )}

        {/* ── Aurora Overlay ── */}
        {state.overlay === "aurora" && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-50" style={{ mixBlendMode: 'color-dodge' as any }}>
            <div style={{
              position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '55%',
              background: 'linear-gradient(90deg, rgba(0,255,136,0.3) 0%, rgba(0,136,255,0.3) 50%, rgba(200,0,255,0.3) 100%)',
              filter: 'blur(60px)',
              animation: 'auroraSway 12s ease-in-out infinite'
            }} />
          </div>
        )}

        {/* ── Vignette for vignette filter ── */}
        {state.filter === "vignette" && (
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{ boxShadow: 'inset 0 0 120px rgba(0,0,0,0.85)' }} />
        )}
          </>
        )}

        {/* Visualizer Canvas */}
        {state.showVisualizer && state.videoTemplate !== "minshawi_player" && state.videoTemplate !== "dossary_player" && (
           <canvas 
              ref={visualizerCanvasRef} 
              width={400} 
              height={200} 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[40%] opacity-70 z-[4] mix-blend-screen pointer-events-none"
           />
        )}

        {/* Vignette & Gradients */}
        {state.videoTemplate !== "minshawi_player" && state.videoTemplate !== "dossary_player" && (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-[5]" />
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.6)] z-[5]" />
          </>
        )}

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
        {surahData && state.videoTemplate !== "basit_player" && (
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



        {/* Custom Surah name for basit_player in bottom black section */}
        {state.videoTemplate === "basit_player" && surahData && (
          <div className="absolute bottom-[13%] left-0 right-0 flex justify-center z-30 pointer-events-none">
            <span className="text-[25px] font-bold text-white tracking-wide" style={{ fontFamily: '"Noto Naskh Arabic", Amiri, serif' }}>
              {surahData.name}
            </span>
          </div>
        )}

        {/* Verse Number (Bottom) */}
        {state.videoTemplate !== "minshawi_player" && state.videoTemplate !== "dossary_player" && state.videoTemplate !== "basit_player" && state.videoTemplate !== "youssef_player" && surahData && currentVerse && (
          <div className="absolute bottom-[14%] left-0 right-0 flex justify-center z-30 pointer-events-none">
            <span className="text-[22px] font-bold text-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Amiri, serif' }}>
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

        {/* Particles Layer */}
        {state.particles && state.particles !== "none" && (
          <div className="absolute inset-0 z-15 pointer-events-none overflow-hidden">
            {state.particles === "snow" && Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="absolute w-1.5 h-1.5 bg-white/70 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `snowFall ${4 + Math.random() * 6}s linear infinite`,
                  animationDelay: `${Math.random() * 5}s`,
                  opacity: 0.3 + Math.random() * 0.5,
                  width: `${2 + Math.random() * 3}px`,
                  height: `${2 + Math.random() * 3}px`
                }}
              />
            ))}
            {state.particles === "leaves" && Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="absolute text-lg"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-5%`,
                  animation: `leafFall ${8 + Math.random() * 7}s linear infinite`,
                  animationDelay: `${Math.random() * 8}s`,
                  opacity: 0.3 + Math.random() * 0.4,
                }}
              >🍂</div>
            ))}
            {state.particles === "petals" && Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="absolute text-lg"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-5%`,
                  animation: `leafFall ${10 + Math.random() * 8}s linear infinite`,
                  animationDelay: `${Math.random() * 10}s`,
                  opacity: 0.3 + Math.random() * 0.4,
                }}
              >🌸</div>
            ))}
          </div>
        )}

        {/* Keyframes for particles & overlays */}
        <style>{`
          @keyframes snowFall {
            0% { transform: translateY(-10px) translateX(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 0.5; }
            100% { transform: translateY(100vh) translateX(30px); opacity: 0; }
          }
          @keyframes leafFall {
            0% { transform: translateX(0) rotate(0deg); opacity: 0; }
            10% { opacity: 0.8; }
            100% { transform: translateX(-80px) translateY(110vh) rotate(360deg); opacity: 0; }
          }
          @keyframes rainFall {
            0% { transform: translateY(-100px) translateX(0); opacity: 0.6; }
            100% { transform: translateY(110vh) translateX(-80px); opacity: 0.6; }
          }
          @keyframes fireflyFloat {
            0% { transform: translate(0, 0) scale(0.8); opacity: 0.2; }
            50% { transform: translate(60px, -60px) scale(1.2); opacity: 0.9; }
            100% { transform: translate(-30px, -120px) scale(0.8); opacity: 0.2; }
          }
          @keyframes smokeRise {
            0% { transform: translateY(0) scale(1); opacity: 0; }
            30% { opacity: 0.2; }
            100% { transform: translateY(-900px) scale(2.5); opacity: 0; }
          }
          @keyframes sparklePulse {
            0%, 100% { transform: scale(0); opacity: 0; }
            50% { transform: scale(1.2) rotate(45deg); opacity: 0.9; }
          }
          @keyframes grainShift {
            0%, 100% { transform: translate(0,0); }
            25% { transform: translate(-2%,-1%); }
            50% { transform: translate(1%,2%); }
            75% { transform: translate(-1%,1%); }
          }
          @keyframes lightLeakPulse {
            0%, 100% { transform: translate(-5%,-5%) scale(1); opacity: 0.5; }
            50% { transform: translate(5%,5%) scale(1.2); opacity: 0.8; }
          }
          @keyframes auroraSway {
            0%, 100% { transform: skewY(-3deg) translateY(0); filter: hue-rotate(0deg); }
            50% { transform: skewY(3deg) translateY(-15px); filter: hue-rotate(40deg); }
          }
        `}</style>

        {/* Content Layer */}
        <div 
          className="absolute inset-0 flex flex-col items-center px-10 text-center z-20 transition-all duration-700 ease-out"
          style={{ 
            justifyContent: (state.videoTemplate === "minshawi_player" || state.videoTemplate === "dossary_player" || state.videoTemplate === "basit_player" || state.videoTemplate === "youssef_player") ? 'center' : (state.textPosition === 'top' ? 'flex-start' : state.textPosition === 'bottom' ? 'flex-end' : 'center'),
            paddingTop: (state.videoTemplate === "minshawi_player" || state.videoTemplate === "dossary_player" || state.videoTemplate === "basit_player" || state.videoTemplate === "youssef_player") ? '0px' : (state.textPosition === 'top' ? '180px' : '60px'),
            paddingBottom: (state.videoTemplate === "minshawi_player" || state.videoTemplate === "dossary_player" || state.videoTemplate === "basit_player" || state.videoTemplate === "youssef_player") ? '0px' : (state.textPosition === 'bottom' ? '160px' : '60px'),
            transform: (state.videoTemplate === "minshawi_player" || state.videoTemplate === "dossary_player" || state.videoTemplate === "basit_player" || state.videoTemplate === "youssef_player") ? 'none' : `translateY(${state.textVerticalOffset * 0.45}px)` 
          }}
        >
          {/* Youssef Player: content bounded exactly to card dimensions */}
          {state.videoTemplate === "youssef_player" && (
            <div 
              className="absolute z-20 select-none animate-in fade-in duration-500 flex flex-row items-center justify-between p-3"
              style={{ top: '34.37%', bottom: '35.15%', left: '3.47%', right: '3.47%' }}
              dir="ltr"
            >
            {/* Left Side: Vintage Pill Tag + Sheikh Photo (Centered Vertically) */}
            <div className="w-[34%] h-full flex flex-col justify-center items-center gap-1.5 shrink-0">
              {/* Vintage Pill Tag above Photo (Sheikh Title) */}
              <div className="w-full bg-black/10 border border-black/15 rounded-md py-0.5 text-center shrink-0">
                <span className="text-[10px] font-bold text-black/70 tracking-wide font-arabic" style={{ fontFamily: '"Noto Naskh Arabic", serif' }}>
                  {(() => {
                    const name = getSheikhAsset(state.reciterId).nameAr || "";
                    if (name.includes("المنشاوي")) return "الشيخ المنشاوي";
                    if (name.includes("الدوسري")) return "الشيخ الدوسري";
                    if (name.includes("الحصري")) return "الشيخ الحصري";
                    if (name.includes("عبدالباسط") || name.includes("عبد الباسط")) return "الشيخ عبد الباسط";
                    if (name.includes("المعيقلي")) return "الشيخ المعيقلي";
                    return "الشيخ " + (name.split(/\s+/).pop() || "");
                  })()}
                </span>
              </div>

              {/* Sheikh Photo (Grayscale B&W) */}
              <div 
                className="w-full h-[72%] overflow-hidden bg-black border border-black/15 shadow-sm shrink-0"
                style={{ borderRadius: "1.3rem" }}
              >
                <img
                  src={getSheikhAsset(state.reciterId).photoUrl}
                  alt={getSheikhAsset(state.reciterId).nameAr}
                  className="w-full h-full object-cover grayscale brightness-105 contrast-110"
                />
              </div>
            </div>

            {/* Right Side: Header Calligraphy, Verse Text, Visualizer & Player Controls */}
            <div className="flex-1 flex flex-col justify-between h-full py-0.5 max-w-[62%]">
              {/* Top Right: "القارئ الشيخ :" بخط Oi المخصص مع أنيميشن كتابة حرف بحرف */}
              {(() => {
                const rawName = getSheikhAsset(state.reciterId).nameAr || "";
                const cleanName = rawName.replace(/^الشيخ\s*/, '');
                const fullText = `القارئ الشيخ : ${cleanName}`;
                const visibleCount = Math.min(fullText.length, Math.floor(currentTime * 18));
                const animatedText = fullText.slice(0, visibleCount);
                return (
                  <div className="w-full text-right pr-0.5 pt-0.5">
                    <style>{`@import url('https://fonts.googleapis.com/css2?family=Oi&display=swap');`}</style>
                    <span 
                      className="text-[12px] font-bold text-[#1a0f00] tracking-wide inline-block whitespace-nowrap"
                      style={{
                        fontFamily: '"Oi", "Aref Ruqaa", "Amiri", serif',
                        direction: 'rtl',
                      }}
                    >
                      {animatedText}
                    </span>
                  </div>
                );
              })()}

              {/* Sheikh Calligraphy logo image if available */}
              {getSheikhAsset(state.reciterId).calligraphyUrl && (
                <div className="h-6 w-full flex items-center justify-end pr-1 shrink-0">
                  <img
                    src={getSheikhAsset(state.reciterId).calligraphyUrl}
                    alt="calligraphy"
                    className="h-full object-contain"
                  />
                </div>
              )}

              {/* Middle Right: Verse Text without brackets + Ayah Symbol ﴿١﴾ */}
              <div className="flex-1 flex items-center justify-center py-1">
                {currentVerse ? (() => {
                  const rawVerseText = (currentVerse.text || "").replace(/[﴿﴾\uFD3F\uFD3E]/g, '').trim();
                  const lines = wrapTextHelper(rawVerseText, Math.max(15, previewFontSize * 0.6), 160);
                  const progress = duration > 0 ? (currentTime / duration) : 0;
                  const activeLineIdx = Math.min(lines.length - 1, Math.floor(progress * lines.length));
                  const activeLineText = lines[activeLineIdx] || rawVerseText;
                  
                  // رقم الآية الحقيقية للحالية
                  const ayahNumRaw = currentVerse.verse_number || currentVerse.ayah_number || currentVerse.numberInSurah || currentVerse.id || currentAyahIndex || state.startAyah || 1;
                  const arabicAyahNum = String(ayahNumRaw).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

                  return (
                    <p
                      className="text-[#1a0f00] text-center w-full break-words leading-[1.7] font-arabic"
                      style={{
                        fontSize: `${Math.max(15, previewFontSize * 0.6)}px`,
                        fontFamily: '"Scheherazade New", "Amiri", serif',
                        fontWeight: 700,
                        direction: 'rtl',
                      }}
                    >
                      {activeLineText} ﴿{arabicAyahNum}﴾
                    </p>
                  );
                })() : (
                  <p className="text-black/40 text-xs font-arabic">لم يتم تحديد آية</p>
                )}
              </div>

              {/* Bottom Right: Dense Visualizer & Media Controls */}
              <div className="w-full flex flex-col gap-1 justify-end pb-0.5">
                {/* Visualizer bars */}
                <div className="w-full h-4 flex items-center justify-center gap-0.5">
                  {Array.from({ length: 36 }).map((_, i) => {
                    const wave = Math.sin(i * 0.22 + (currentTime * 3.8)) * 0.45 + 0.55;
                    const randH = (i % 4 === 0 ? 12 : i % 3 === 0 ? 9 : i % 2 === 0 ? 16 : 6) * (isPlaying ? wave : 0.5);
                    return (
                      <div 
                        key={i} 
                        className="w-[2px] bg-white rounded-full transition-all duration-75"
                        style={{ height: `${randH}px` }}
                      />
                    );
                  })}
                </div>

                {/* Player Controls */}
                <div className="flex items-center justify-center gap-3 text-white select-none scale-95">
                  <button className="opacity-85 hover:opacity-100 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
                  </button>
                  <button 
                    onClick={() => { if (audioRef.current) audioRef.current.currentTime = 0; }}
                    className="hover:scale-105 transition active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5" stroke="currentColor" strokeWidth="2.2"/></svg>
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-md shrink-0"
                  >
                    {isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1"/><rect x="15" y="4" width="4" height="16" rx="1"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                    )}
                  </button>
                  <button 
                    onClick={handleAyahEnd}
                    className="hover:scale-105 transition active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.2"/></svg>
                  </button>
                  <button className="opacity-85 hover:opacity-100 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {state.videoTemplate === "dossary_player" && (
            <div className="w-full h-full flex flex-col justify-between z-20 select-none animate-in fade-in duration-500">
              {/* Top Area: Clean and Black */}
              <div className="h-[29.69%]" />

              {/* Middle Area: Photo on Left, Verses on Right */}
              <div className="h-[40.62%] flex flex-row items-center justify-between gap-4 px-6" dir="ltr">
                {/* Left Side: Photo */}
                <div 
                  className="w-[44%] aspect-[3/4] overflow-hidden bg-black border-[3px] border-white shadow-[0_0_20px_rgba(255,255,255,0.5)] shrink-0"
                  style={{ borderRadius: "2rem" }}
                >
                  <img
                    src={getSheikhAsset(state.reciterId).photoUrl}
                    alt={getSheikhAsset(state.reciterId).nameAr}
                    className="w-full h-full object-cover grayscale brightness-110"
                  />
                </div>
                
                {/* Right Side: Active Verse Text & Player Controls */}
                <div className="flex-1 flex flex-col justify-between py-2 text-right h-[320px] max-w-[55%]">
                  {/* Verse Text */}
                  <div className="flex-1 flex items-center justify-center">
                    {currentVerse ? (() => {
                      const lines = wrapTextHelper(currentVerse.text, Math.max(16, previewFontSize * 0.65), 180);
                      const progress = duration > 0 ? (currentTime / duration) : 0;
                      const activeLineIdx = Math.min(lines.length - 1, Math.floor(progress * lines.length));
                      const activeLineText = lines[activeLineIdx] || currentVerse.text;
                      return (
                        <p
                          className="text-white text-center w-full break-words leading-[1.9] drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] font-arabic"
                          style={{
                            fontSize: `${Math.max(16, previewFontSize * 0.65)}px`,
                            fontFamily: '"Noto Naskh Arabic", serif',
                            direction: 'rtl',
                          }}
                        >
                          {activeLineText}
                        </p>
                      );
                    })() : (
                      <p className="text-white/40 text-sm font-arabic">لم يتم تحديد آية</p>
                    )}
                  </div>

                  {/* Player Controls inside the Right Side! */}
                  <div className="flex flex-col gap-2 mt-2">
                    {/* Progress Bar */}
                    <div className="w-full">
                      <div className="w-full h-[3px] bg-white/20 rounded-full relative cursor-pointer" onClick={(e) => {
                        if (audioRef.current && totalSelectedDuration > 0 && surahData) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const pct = clickX / rect.width;
                          const targetTime = pct * totalSelectedDuration;

                          const versesInRange = surahData.verses.filter(v => v.id >= state.startAyah && v.id <= state.endAyah);
                          let accumulatedTime = 0;
                          for (let v of versesInRange) {
                            const vDur = verseDurations[v.id] || 5;
                            if (targetTime <= accumulatedTime + vDur) {
                              setCurrentAyahIndex(v.id);
                              const seekOffset = targetTime - accumulatedTime;
                              setTimeout(() => {
                                if (audioRef.current) {
                                  audioRef.current.currentTime = seekOffset;
                                }
                              }, 80);
                              break;
                            }
                            accumulatedTime += vDur;
                          }
                        }
                      }}>
                        <div 
                          ref={progressBarRef}
                          className="h-full bg-white rounded-full transition-all duration-75" 
                          style={{ width: `${(totalSelectedElapsed / (totalSelectedDuration || 1)) * 100}%` }}
                        />
                        <div 
                          ref={progressDotRef}
                          className="w-2 h-2 bg-white rounded-full absolute -top-0.75 -ml-1 shadow-md" 
                          style={{ left: `${(totalSelectedElapsed / (totalSelectedDuration || 1)) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-white/50 font-mono mt-1" dir="ltr">
                        <span ref={progressTextRef}>{formatTime(totalSelectedElapsed)}</span>
                        <span>{formatTime(totalSelectedDuration)}</span>
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between px-1" dir="ltr">
                      {/* Heart Button */}
                      <button className="text-white/60 hover:text-white transition active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                      </button>

                      {/* Previous Button */}
                      <button 
                        onClick={() => {
                          if (audioRef.current) audioRef.current.currentTime = 0;
                        }}
                        className="text-white hover:scale-105 transition active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5" stroke="currentColor" strokeWidth="1.6"/></svg>
                      </button>

                      {/* Play/Pause Button */}
                      <button 
                        onClick={togglePlay}
                        className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg shrink-0"
                      >
                        {isPlaying ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1"/><rect x="15" y="4" width="4" height="16" rx="1"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                        )}
                      </button>

                      {/* Next Button */}
                      <button 
                        onClick={handleAyahEnd}
                        className="text-white hover:scale-105 transition active:scale-95"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19" stroke="currentColor" strokeWidth="1.6"/></svg>
                      </button>

                      {/* Minus Circle Button */}
                      <button className="text-white/60 hover:text-white transition active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Area: Ayah Range + Sheikh Name */}
              <div className="h-[29.69%] flex flex-col items-center justify-center bg-black gap-1">
                <div className="text-center text-[13px] font-medium text-white/60 tracking-wide" style={{ fontFamily: '"Inter", sans-serif' }}>
                  {getSheikhAsset(state.reciterId).nameEn}
                </div>
                {/* Small Ayah range/number */}
                <div className="text-center text-[10px] font-black text-white/40 tracking-wider font-mono">
                  {state.startAyah === state.endAyah ? `AYAH ${state.startAyah}` : `AYAH ${state.startAyah} - ${state.endAyah}`}
                </div>
              </div>
            </div>
          )}
          {(state.videoTemplate as any) === "basit_player" ? (
            <div className="absolute top-[29.69%] bottom-[29.69%] left-0 right-0 z-20 flex flex-col justify-between py-8 px-8 select-none" dir="ltr">
              {/* Photo - Horizontal Oval */}
              <div className="w-[58%] aspect-[1.38] rounded-full overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.15)] mx-auto bg-black shrink-0">
                <img
                  src={getSheikhAsset(state.reciterId).photoUrl}
                  alt={getSheikhAsset(state.reciterId).nameAr}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Progress Bar (scrubber) */}
              <div className="w-[75%] mx-auto mt-4 shrink-0">
                <div 
                  className="w-full h-[2.5px] bg-black/20 rounded-full relative cursor-pointer" 
                  onClick={(e) => {
                    if (audioRef.current && totalSelectedDuration > 0 && surahData) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const pct = clickX / rect.width;
                      const targetTime = pct * totalSelectedDuration;

                      const versesInRange = surahData.verses.filter(v => v.id >= state.startAyah && v.id <= state.endAyah);
                      let accumulatedTime = 0;
                      for (let v of versesInRange) {
                        const vDur = verseDurations[v.id] || 5;
                        if (targetTime <= accumulatedTime + vDur) {
                          setCurrentAyahIndex(v.id);
                          const seekOffset = targetTime - accumulatedTime;
                          setTimeout(() => {
                            if (audioRef.current) {
                              audioRef.current.currentTime = seekOffset;
                            }
                          }, 80);
                          break;
                        }
                        accumulatedTime += vDur;
                      }
                    }
                  }}
                >
                  <div 
                    ref={progressBarRef}
                    className="h-full bg-black rounded-full" 
                    style={{ width: `${(totalSelectedElapsed / (totalSelectedDuration || 1)) * 100}%` }}
                  />
                  <div 
                    ref={progressDotRef}
                    className="w-2.5 h-2.5 bg-black rounded-full absolute -top-1 -ml-1 shadow-sm" 
                    style={{ left: `${(totalSelectedElapsed / (totalSelectedDuration || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="w-[75%] mx-auto flex items-center justify-between mt-3 px-1 text-black shrink-0" dir="ltr">
                {/* Shuffle */}
                <button className="text-black/85 hover:text-black transition active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 3 21 3 21 8"/>
                    <line x1="4" y1="20" x2="21" y2="3"/>
                    <polyline points="21 16 21 21 16 21"/>
                    <line x1="15" y1="15" x2="21" y2="21"/>
                    <line x1="4" y1="4" x2="9" y2="9"/>
                  </svg>
                </button>

                {/* Prev */}
                <button 
                  onClick={() => {
                    if (audioRef.current) audioRef.current.currentTime = 0;
                  }}
                  className="text-black hover:scale-105 transition active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="19 20 9 12 19 4 19 20"/>
                    <line x1="5" x2="5" y1="19" y2="5" stroke="currentColor" strokeWidth="2.2"/>
                  </svg>
                </button>

                {/* Play/Pause */}
                <button 
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-[0_2px_8px_rgba(0,0,0,0.25)] shrink-0"
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="5" y="4" width="4" height="16" rx="1"/>
                      <rect x="15" y="4" width="4" height="16" rx="1"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                      <polygon points="6 3 20 12 6 21 6 3"/>
                    </svg>
                  )}
                </button>

                {/* Next */}
                <button 
                  onClick={handleAyahEnd}
                  className="text-black hover:scale-105 transition active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 4 15 12 5 20 5 4"/>
                    <line x1="19" x2="19" y1="5" y2="19" stroke="currentColor" strokeWidth="2.2"/>
                  </svg>
                </button>

                {/* Repeat */}
                <button className="text-black/85 hover:text-black transition active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="17 1 21 5 17 9"/>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <polyline points="7 23 3 19 7 15"/>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </svg>
                </button>
              </div>

              {/* Sheikh English Name */}
              <div className="w-[85%] mx-auto text-center font-serif mt-2 shrink-0">
                <p className="text-[12.5px] text-white font-semibold tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.15)]">
                  {getSheikhAsset(state.reciterId).nameEn}
                </p>
              </div>
            </div>
          ) : state.videoTemplate === "minshawi_player" ? (
            <div className="w-[70%] aspect-[500/450] bg-black rounded-[2rem] p-5 pb-6 flex flex-col justify-between shadow-2xl z-20 text-left select-none animate-in fade-in duration-500 border border-white/5">
              {/* Photo */}
              <div className="w-[90%] mx-auto aspect-[450/185] rounded-[1.2rem] overflow-hidden bg-black border-[3px] border-[#8a8070]/40 shrink-0">
                <img
                  src={getSheikhAsset(state.reciterId).photoUrl}
                  alt={getSheikhAsset(state.reciterId).nameAr}
                  className="w-full h-full object-contain rounded-[1rem]"
                />
              </div>
              
              {/* Title & Artist */}
              <div className="w-[90%] mx-auto text-left font-sans mt-2">
                <h3 className="text-base font-bold text-white tracking-tight leading-tight" style={{ fontFamily: '"Noto Naskh Arabic", serif' }}>
                  {surahData ? surahData.name : "..."}
                </h3>
                <p className="text-[10px] text-white/50 mt-0.5 font-medium">{getSheikhAsset(state.reciterId).nameEn}</p>
              </div>
 
              {/* Progress Bar */}
              <div className="w-[90%] mx-auto mt-2">
                <div className="w-full h-[2px] bg-white/20 rounded-full relative cursor-pointer" onClick={(e) => {
                  if (audioRef.current && totalSelectedDuration > 0 && surahData) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const pct = clickX / rect.width;
                    const targetTime = pct * totalSelectedDuration;
 
                    const versesInRange = surahData.verses.filter(v => v.id >= state.startAyah && v.id <= state.endAyah);
                    let accumulatedTime = 0;
                    for (let v of versesInRange) {
                      const vDur = verseDurations[v.id] || 5;
                      if (targetTime <= accumulatedTime + vDur) {
                        setCurrentAyahIndex(v.id);
                        const seekOffset = targetTime - accumulatedTime;
                        setTimeout(() => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = seekOffset;
                          }
                        }, 80);
                        break;
                      }
                      accumulatedTime += vDur;
                    }
                  }
                }}>
                  <div 
                    ref={progressBarRef}
                    className="h-full bg-white rounded-full" 
                    style={{ width: `${(totalSelectedElapsed / (totalSelectedDuration || 1)) * 100}%` }}
                  />
                  <div 
                    ref={progressDotRef}
                    className="w-2 h-2 bg-white rounded-full absolute -top-0.75 -ml-1 shadow-md" 
                    style={{ left: `${(totalSelectedElapsed / (totalSelectedDuration || 1)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] text-white/50 font-mono mt-1" dir="ltr">
                  <span ref={progressTextRef}>{formatTime(totalSelectedElapsed)}</span>
                  <span>{formatTime(totalSelectedDuration)}</span>
                </div>
              </div>
 
              {/* Player Controls */}
              <div className="w-[90%] mx-auto flex items-center justify-between mt-2 px-0" dir="ltr">
                {/* Heart */}
                <button className="text-white/60 hover:text-white transition active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </button>
 
                {/* Prev */}
                <button 
                  onClick={() => {
                    if (audioRef.current) audioRef.current.currentTime = 0;
                  }}
                  className="text-white hover:scale-105 transition active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5" stroke="currentColor" strokeWidth="1.6"/></svg>
                </button>
 
                {/* Play/Pause Circle */}
                <button 
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg shrink-0"
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="4" height="16" rx="1"/><rect x="15" y="4" width="4" height="16" rx="1"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="6 3 20 12 6 21 6 3"/></svg>
                  )}
                </button>
 
                {/* Next */}
                <button 
                  onClick={handleAyahEnd}
                  className="text-white hover:scale-105 transition active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19" stroke="currentColor" strokeWidth="1.6"/></svg>
                </button>
 
                {/* Minus */}
                <button className="text-white/60 hover:text-white transition active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </button>
              </div>
            </div>
          ) : surahLoading ? (
            <div className="flex flex-col items-center gap-6 py-20 animate-pulse">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <span className="text-[10px] text-primary font-black uppercase tracking-[0.5em]">جاري جلب البيانات</span>
            </div>
          ) : surahData ? (
            <div 
              ref={textWrapperRef}
              className="w-full flex flex-col items-center justify-center transition-transform duration-75"
              style={{ transform: 'scale(1)' }}
            >
              <div 
                key={`${currentAyahIndex}-${state.animation}`}
                className="flex flex-col gap-8 w-full"
                style={{
                  animation: (() => {
                    const map: Record<string, string> = {
                      fade: 'vpFadeIn 1s ease-out forwards',
                      scale: 'vpScaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                      slide: 'vpSlideUp 0.8s ease-out forwards',
                      blur: 'vpBlurIn 1s ease-out forwards',
                      zoom: 'vpZoomIn 1s ease-out forwards',
                      flip: 'vpFlipIn 0.8s ease-out forwards',
                      bounce: 'vpBounceIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                      glitch: 'vpGlitchIn 0.5s steps(8) forwards',
                      typewriter: 'vpTypewriter 1.2s ease-out forwards',
                      wave: 'vpWaveIn 1s ease-out forwards',
                      spiral: 'vpSpiralIn 0.9s ease-out forwards',
                      elastic: 'vpElasticIn 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards',
                      swing: 'vpSwingIn 0.8s ease-out forwards',
                      cinematic: 'vpCinematicIn 1.2s ease-out forwards',
                      split: 'vpSplitIn 0.8s ease-out forwards',
                      rotate: 'vpRotateIn 0.9s ease-out forwards',
                    };
                    return map[state.animation] || map.fade;
                  })(),
                  opacity: 0,
                }}
              >
                {/* Quranic Text */}
                <p
                  className={`text-white leading-[1.8] text-center w-full break-words`}
                  style={{
                    color: state.textColor,
                    fontSize: `${previewFontSize}px`,
                    fontWeight: Number(state.fontWeight) || 700,
                    fontFamily: `"${state.fontFamily || 'Amiri'}", "Amiri", serif`,
                    direction: 'rtl',
                    lineHeight: 2.2,
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
        {state.videoTemplate !== "minshawi_player" && state.videoTemplate !== "dossary_player" && (
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
        )}

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
