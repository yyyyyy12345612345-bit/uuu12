"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { useEditor } from "@/store/useEditor";
import { useSurahData } from "@/hooks/useSurahData";
import { RECITERS } from "@/data/reciters";
import { getAudioUrl } from "@/lib/quranUtils";

export function RenderModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { state } = useEditor();
  const { data: surahData } = useSurahData(state.surahId);
  
  const isRenderingRef = useRef(false);
  const activeAudiosRef = useRef<HTMLAudioElement[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [status, setStatus] = useState<"idle" | "rendering" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleStart = async () => {
    if (!surahData || status === "rendering") return;
    
    // Safety check for browser support
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
      setStatus("error");
      setMessage("متصفحك لا يدعم خاصية تسجيل الفيديو. يرجى استخدام متصفح حديث مثل Chrome أو Edge.");
      return;
    }
    
    isRenderingRef.current = true;
    activeAudiosRef.current = [];

    // Analytics: Track Render Start
    // @ts-ignore
    window.gtag?.('event', 'render_video_start', {
      'surah': state.surahId,
      'reciter': state.reciterId,
      'range': `${state.startAyah}-${state.endAyah}`
    });

    // Create and Resume AudioContext
    let audioCtx: AudioContext;
    try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = audioCtx;
        
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }
    } catch (e) {
        console.error("AudioContext initialization failed", e);
        setStatus("error");
        setMessage("تعذر تشغيل معالج الصوت في متصفحك. يرجى محاولة استخدام متصفح حديث.");
        return;
    }

    setStatus("rendering");
    setMessage("جاري البدء وتجهيز الموارد...");
    setProgressPct(0);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas missing");
      const ctx = canvas.getContext("2d", { alpha: false })!;
      canvas.width = 720;
      canvas.height = 1280;

      const verses = surahData.verses.filter((v: any) => v.id >= state.startAyah && v.id <= state.endAyah);
      
      const dest = audioCtx.createMediaStreamDestination();
      const stream = canvas.captureStream(30); 
      
      const audioTracks = dest.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        stream.addTrack(audioTracks[0]);
      }

      const types = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      
      let mimeType = '';
      for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, { 
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 5000000 
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      recorder.start(100);

      let bgImage: HTMLImageElement | null = null;
      let bgVideo: HTMLVideoElement | null = null;
      
      const isVideo = state.backgroundUrl.includes(".mp4") || state.backgroundUrl.includes("video") || state.backgroundUrl.includes("pexels.com");

      try { 
        if (isVideo) {
          setMessage("جاري تحميل الفيديو...");
          bgVideo = await loadVideo(state.backgroundUrl);
          if (bgVideo) activeAudiosRef.current.push(bgVideo as any);
        } else {
          setMessage("جاري تحميل الخلفية...");
          bgImage = await loadImage(state.backgroundUrl); 
        }
      } catch(e) {
        console.error("Failed to load background", e);
      }

      if (!isRenderingRef.current) {
        recorder.stop();
        return;
      }

      const verseAudios = [];
      setMessage("جاري تجهيز الآيات الصوتية...");
      for (let v of verses) {
        if (!isRenderingRef.current) break;
        const sUrl = getAudioUrl(Number(state.surahId), v.id, state.reciterId);
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.src = sUrl;
        
        activeAudiosRef.current.push(audio);
        
        const loaded = await new Promise(r => { 
          audio.onloadedmetadata = () => r(true); 
          audio.onerror = () => r(false);
          setTimeout(() => r(false), 10000); 
        });

        if (!loaded) {
          verseAudios.push({ verse: v, audio, duration: 5, failed: true });
        } else {
          verseAudios.push({ verse: v, audio, duration: audio.duration });
        }
      }

      if (!isRenderingRef.current) {
        recorder.stop();
        return;
      }

      const totalDuration = verseAudios.reduce((a, b) => a + b.duration, 0);
      let elapsed = 0;

      setMessage("بدء الرندرة...");
      
      for (let i = 0; i < verseAudios.length; i++) {
        if (!isRenderingRef.current) break;
        const item = verseAudios[i];
        if (!item.failed) {
          const source = audioCtx.createMediaElementSource(item.audio);
          source.connect(dest);
          
          try {
            await item.audio.play();
          } catch(e) {
            console.warn("Audio play blocked", e);
          }

          const startTime = Date.now();
          while (isRenderingRef.current && !item.audio.ended && (Date.now() - startTime) < (item.duration * 1000 + 1000)) {
            const vTime = item.audio.currentTime;
            renderFrame(ctx, canvas, bgImage, bgVideo, item.verse, state);
            
            const progress = Math.min(99, Math.round(((elapsed + vTime) / totalDuration) * 100));
            setProgressPct(progress);
            setMessage(`جاري التصدير: ${progress}%`);

            await new Promise(r => requestAnimationFrame(r));
          }
          
          item.audio.pause();
          source.disconnect();
        } else {
          const duration = 5;
          const steps = duration * 30;
          for (let s = 0; s < steps; s++) {
            if (!isRenderingRef.current) break;
            renderFrame(ctx, canvas, bgImage, bgVideo, item.verse, state);
            const progress = Math.min(99, Math.round(((elapsed + (s/30)) / totalDuration) * 100));
            setProgressPct(progress);
            setMessage(`جاري التصدير (تخطي صوت): ${progress}%`);
            await new Promise(r => setTimeout(r, 33));
          }
        }
        elapsed += item.duration;
      }

      if (!isRenderingRef.current) {
        recorder.stop();
        return;
      }

      setMessage("جاري إنهاء الملف...");
      recorder.stop();
      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
        setDownloadUrl(URL.createObjectURL(finalBlob));
        setStatus("success");

        // Analytics: تفاصيل الفيديو الناجح
        // @ts-ignore
        window.gtag?.('event', 'render_video_success', {
          'surah_id': state.surahId,
          'reciter_name': RECITERS.find(r => r.id === state.reciterId)?.name || "Unknown",
          'background_type': state.backgroundUrl.includes(".mp4") ? "Video" : "Image",
          'font_size': state.fontSize,
          'text_color': state.textColor
        });
      };

    } catch (e: any) {
      console.error(e);
      if (isRenderingRef.current) {
        setStatus("error");
        setMessage(e.message || "حدث خطأ غير متوقع");
        
        // Analytics: تتبع الأخطاء بالتفصيل
        // @ts-ignore
        window.gtag?.('event', 'render_video_error', {
          'error_msg': e.message || "Unknown error",
          'surah_id': state.surahId,
          'reciter_id': state.reciterId
        });
      }
    }
  };

  const handleClose = () => {
    isRenderingRef.current = false;
    
    // Stop and clear all audio objects
    activeAudiosRef.current.forEach(a => {
      try {
        a.pause();
        a.src = "";
        a.load();
        a.remove();
      } catch(e) {}
    });
    activeAudiosRef.current = [];

    // Close AudioContext if exists
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    onClose();
    setStatus("idle");
    setMessage("");
    setProgressPct(0);
  };

  const renderFrame = (ctx: any, canvas: any, bg: HTMLImageElement | null, video: HTMLVideoElement | null, verse: any, state: any) => {
    // ... (logic remains same, just ensure it's called)
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (video) {
        const sc = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
        const w = video.videoWidth * sc;
        const h = video.videoHeight * sc;
        ctx.drawImage(video, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      } else if (bg) {
        const sc = Math.max(canvas.width / bg.width, canvas.height / bg.height);
        const w = bg.width * sc;
        const h = bg.height * sc;
        ctx.drawImage(bg, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      }
  
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      ctx.textAlign = "center";
      ctx.fillStyle = state.textColor;
      ctx.font = `${state.fontWeight} ${state.fontSize * 1.5}px serif`;
      
      const lines = wrapText(ctx, verse.text, canvas.width - 120);
      const lineHeight = state.fontSize * 1.8;
      const totalHeight = lines.length * lineHeight;
      let startY = (canvas.height / 2) - (totalHeight / 4);
  
      lines.forEach((l, idx) => {
        ctx.fillText(l, canvas.width / 2, startY + (idx * lineHeight));
      });
  
      // Translation
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = `500 32px serif`;
      const tLines = wrapText(ctx, verse.translation, canvas.width - 150);
      tLines.forEach((l, idx) => {
        ctx.fillText(l, canvas.width / 2, startY + totalHeight + 80 + (idx * 45));
      });
  
      ctx.fillStyle = "rgba(212,175,55,1)";
      ctx.font = "bold 35px serif";
      ctx.fillText(`﴿ ${verse.id} ﴾`, canvas.width/2, canvas.height - 150);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl font-arabic">
      {/* Canvas must be in DOM and not display:none for some browsers to render correctly */}
      <canvas ref={canvasRef} style={{ position: 'fixed', left: '-10000px', top: 0 }} />
      
      <div className="w-full max-w-sm bg-[#050505] border border-white/10 rounded-[3rem] p-10 flex flex-col items-center shadow-2xl">
        
        {status === "idle" ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Play className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">تصدير الفيديو</h3>
            <p className="text-white/40 text-xs text-center mb-8">سيتم دمج الآيات المختارة مع الخلفية والصوت في ملف واحد.</p>
            <button onClick={handleStart} className="w-full bg-primary text-black py-4 rounded-2xl font-bold hover:scale-105 transition-all">
              بدء التصميم والتصدير
            </button>
          </>
        ) : (
          <>
            <div className="mb-6">
              {status === "rendering" ? (
                <div className="relative">
                   <Loader2 className="w-12 h-12 text-primary animate-spin" />
                   <div className="absolute inset-0 flex items-center justify-center text-[10px] text-primary font-bold">{progressPct}%</div>
                </div>
              ) : status === "success" ? (
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              ) : (
                <AlertCircle className="w-12 h-12 text-red-500" />
              )}
            </div>
            <h3 className="text-white font-bold mb-4">
              {status === "rendering" ? "جاري المعالجة..." : status === "success" ? "تم التصدير بنجاح" : "عذراً، حدث خطأ"}
            </h3>
            {status === "rendering" && (
              <div className="w-full h-1.5 bg-white/5 rounded-full mb-6 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 shadow-[0_0_10px_rgba(212,175,55,0.5)]" 
                  style={{ width: `${progressPct}%` }} 
                />
              </div>
            )}
            <p className="text-white/40 text-[11px] mb-8 text-center leading-relaxed px-4">{message}</p>
            {status === "success" && downloadUrl && (
              <a 
                href={downloadUrl} 
                download={`quran-video-${Date.now()}.webm`} 
                className="w-full bg-primary text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all"
              >
                <Download className="w-5 h-5" />
                تحميل الفيديو النهائي
              </a>
            )}
            {status === "error" && (
              <button 
                onClick={() => setStatus("idle")}
                className="w-full bg-white/5 text-white py-4 rounded-2xl font-bold hover:bg-white/10 transition-all"
              >
                إعادة المحاولة
              </button>
            )}
          </>
        )}

        <button onClick={handleClose} className="mt-8 text-white/20 text-xs hover:text-white/40 transition-colors">إغلاق النافذة</button>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((r, j) => { 
    const i = new Image(); 
    i.crossOrigin="anonymous"; 
    i.onload=()=>r(i); 
    i.onerror=j; 
    i.src=src; 
    setTimeout(() => j(new Error("Image load timeout")), 15000);
  });
}

function loadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((r, j) => { 
    const v = document.createElement("video"); 
    v.src = src; 
    v.crossOrigin = "anonymous"; 
    v.muted = true; 
    v.loop = true;
    v.playsInline = true;
    v.oncanplaythrough = () => {
      v.play().catch(() => console.warn("Video background play deferred"));
      r(v);
    }; 
    v.onerror = () => j(new Error("Video load error"));
    setTimeout(() => j(new Error("Video load timeout")), 20000);
    v.load();
  });
}

function wrapText(ctx: any, text: string, maxWidth: number) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  for (let i = 1; i < words.length; i++) {
    if (ctx.measureText(currentLine + " " + words[i]).width < maxWidth) { currentLine += " " + words[i]; }
    else { lines.push(currentLine); currentLine = words[i]; }
  }
  lines.push(currentLine); return lines;
}
