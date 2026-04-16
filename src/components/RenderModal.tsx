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
  
  const [status, setStatus] = useState<"idle" | "rendering" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleStart = async () => {
    if (!surahData || status === "rendering") return;
    setStatus("rendering");
    setMessage("جاري البدء...");

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas missing");
      const ctx = canvas.getContext("2d")!;
      canvas.width = 720;
      canvas.height = 1280;

      const verses = surahData.verses.filter((v: any) => v.id >= state.startAyah && v.id <= state.endAyah);
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const stream = canvas.captureStream(25); // Lowered FPS for mobile stability
      
      const audioTracks = dest.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        stream.addTrack(audioTracks[0]);
      }

      const types = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/quicktime'
      ];
      
      let mimeType = '';
      for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }

      console.log("Selected MIME type:", mimeType);

      const recorder = new MediaRecorder(stream, { 
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 2500000 // Lowered for better mobile compatibility
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      recorder.start(100);

      let bgImage: HTMLImageElement | null = null;
      let bgVideo: HTMLVideoElement | null = null;
      
      const isVideo = state.backgroundUrl.includes(".mp4") || state.backgroundUrl.includes("video");

      try { 
        if (isVideo) {
          bgVideo = await loadVideo(state.backgroundUrl);
        } else {
          bgImage = await loadImage(state.backgroundUrl); 
        }
      } catch(e) {
        console.error("Failed to load background", e);
      }

      const verseAudios = [];
      setMessage("جاري تجهيز الآيات...");
      for (let v of verses) {
        const sUrl = getAudioUrl(Number(state.surahId), v.id, state.reciterId);
        const audio = new Audio(sUrl);
        audio.crossOrigin = "anonymous";
        
        const loaded = await new Promise(r => { 
          audio.onloadedmetadata = () => r(true); 
          audio.onerror = () => r(false);
          setTimeout(() => r(false), 15000); 
        });

        if (!loaded) {
          console.warn(`Failed to load audio for ayah ${v.id}`);
          // Fallback duration if audio fails
          verseAudios.push({ verse: v, audio, duration: 5, failed: true });
        } else {
          verseAudios.push({ verse: v, audio, duration: audio.duration });
        }
      }

      const totalDuration = verseAudios.reduce((a, b) => a + b.duration, 0);
      let elapsed = 0;

      for (let i = 0; i < verseAudios.length; i++) {
        const item = verseAudios[i];
        if (!(item as any).failed) {
          const source = audioCtx.createMediaElementSource(item.audio);
          source.connect(dest);
          source.connect(audioCtx.destination);
          
          try {
            await item.audio.play();
          } catch(e) {
            console.error("Playback failed", e);
          }

          const startTime = Date.now();
          while (!item.audio.ended && (Date.now() - startTime) < (item.duration * 1000 + 2000)) {
            const vTime = item.audio.currentTime;
            renderFrame(ctx, canvas, bgImage, bgVideo, item.verse, state);
            
            const progress = Math.min(99, Math.round(((elapsed + vTime) / totalDuration) * 100));
            setProgressPct(progress);
            setMessage(`جاري التصدير: ${progress}%`);

            await new Promise(r => setTimeout(r, 20));
            if (item.audio.paused && vTime > 0) break;
          }
          
          item.audio.pause();
          source.disconnect();
        } else {
          // If audio failed, just show frame for 5 seconds
          const frameCount = 100; // ~5 seconds at 50ms intervals
          for (let f = 0; f < frameCount; f++) {
            renderFrame(ctx, canvas, bgImage, bgVideo, item.verse, state);
            const progress = Math.min(99, Math.round(((elapsed + (f/20)) / totalDuration) * 100));
            setProgressPct(progress);
            setMessage(`جاري التصدير (تخطي صوت): ${progress}%`);
            await new Promise(r => setTimeout(r, 50));
          }
        }
        elapsed += item.duration;
      }

      recorder.stop();
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setDownloadUrl(URL.createObjectURL(blob));
        setStatus("success");
      };

    } catch (e: any) {
      console.error(e);
      setStatus("error");
      setMessage(e.message);
    }
  };

  const renderFrame = (ctx: any, canvas: any, bg: HTMLImageElement | null, video: HTMLVideoElement | null, verse: any, state: any) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const drawBg = (el: any) => {
      const elWidth = el.width || el.videoWidth;
      const elHeight = el.height || el.videoHeight;
      const sc = Math.max(canvas.width / elWidth, canvas.height / elHeight);
      const w = elWidth * sc;
      const h = elHeight * sc;
      ctx.drawImage(el, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    if (video) {
      drawBg(video);
    } else if (bg) {
      drawBg(bg);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = state.textColor;
    ctx.font = `${state.fontWeight} ${state.fontSize}px serif`;
    const lines = wrapText(ctx, verse.text, canvas.width - 150);
    const sY = canvas.height/2 - (lines.length * state.fontSize * 0.6);
    lines.forEach((l, idx) => ctx.fillText(l, canvas.width/2, sY + idx * state.fontSize * 1.4));
    ctx.fillStyle = "rgba(212,175,55,1)";
    ctx.font = "bold 30px serif";
    ctx.fillText(`﴿ ${verse.id} ﴾`, canvas.width/2, canvas.height - 200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl font-arabic">
      <canvas ref={canvasRef} className="hidden" />
      <div className="w-full max-w-sm bg-[#050505] border border-white/10 rounded-[3rem] p-10 flex flex-col items-center">
        
        {status === "idle" ? (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Play className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">استعداد للتصدير</h3>
            <p className="text-white/40 text-xs text-center mb-8">اضغط على الزر أدناه لبدء رندرة الفيديو بجودة عالية.</p>
            <button onClick={handleStart} className="w-full bg-primary text-black py-4 rounded-2xl font-bold hover:scale-105 transition-all">
              ابدأ الآن
            </button>
          </>
        ) : (
          <>
            <div className="mb-6">
              {status === "rendering" ? (
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              ) : status === "success" ? (
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              ) : (
                <AlertCircle className="w-10 h-10 text-red-500" />
              )}
            </div>
            <h3 className="text-white font-bold mb-4">
              {status === "rendering" ? "جاري الرندرة..." : status === "success" ? "تم بنجاح" : "حدث خطأ"}
            </h3>
            {status === "rendering" && (
              <div className="w-full h-1 bg-white/5 rounded-full mb-6 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${progressPct}%` }} /></div>
            )}
            <p className="text-white/20 text-[10px] mb-8">{message}</p>
            {status === "success" && downloadUrl && (
              <a href={downloadUrl} download="quran-video.webm" className="w-full bg-primary text-black py-4 rounded-2xl font-bold flex items-center justify-center">
                تحميل الملف النهائي
              </a>
            )}
          </>
        )}

        <button onClick={onClose} className="mt-8 text-white/20 text-xs">إغلاق</button>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((r, j) => { const i = new Image(); i.crossOrigin="anonymous"; i.onload=()=>r(i); i.onerror=j; i.src=src; });
}

function loadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((r, j) => { 
    const v = document.createElement("video"); 
    v.src = src; 
    v.crossOrigin = "anonymous"; 
    v.muted = true; 
    v.loop = true;
    v.oncanplaythrough = () => {
      v.play();
      r(v);
    }; 
    v.onerror = j;
    v.load();
  });
}

function wrapText(ctx: any, text: string, maxWidth: number) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  for (let i = 1; i < words.length; i++) {
    if (ctx.measureText(currentLine + " " + words[i]).width < maxWidth) { currentLine += " " + words[i]; }
    else { lines.push(currentLine); currentLine = words[i]; }
  }
  lines.push(currentLine); return lines;
}
