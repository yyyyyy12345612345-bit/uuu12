"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle, Play, Crown, Lock, Info, Sparkles, ChevronLeft, X } from "lucide-react";
import { useEditor } from "@/store/useEditor";
import { useSurahData } from "@/hooks/useSurahData";
import { RECITERS } from "@/data/reciters";
import { getAudioUrl } from "@/lib/quranUtils";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { incrementVideoRenderCount } from "@/lib/points";


export function RenderModal({ isOpen, onClose, onOpenSubscription }: { 
  isOpen: boolean; 
  onClose: () => void;
  onOpenSubscription: () => void;
}) {
  const { state } = useEditor();
  const { data: surahData } = useSurahData(state.surahId);
  
  const isRenderingRef = useRef(false);
  const activeAudiosRef = useRef<HTMLAudioElement[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [renderMode, setRenderMode] = useState<"browser" | "server">("browser");
  const [status, setStatus] = useState<"idle" | "rendering" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const [userPlan, setUserPlan] = useState<any>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserPlan();
    }
  }, [isOpen]);

  const fetchUserPlan = async () => {
    const user = auth?.currentUser;
    if (!user) {
      setUserPlan(null);
      return;
    }
    if (!db) return;
    try {
      const s = await getDoc(doc(db, "users", user.uid));
      if (s.exists()) {
        const data = s.data();
        const plan = data.plan || "free";
        const count = data.videoRendersCount || 0;
        setUserPlan({ ...data, plan, count });
        if (plan === "free" && count >= 5) setIsLimitReached(true);
        else if (plan === "starter" && count >= 50) setIsLimitReached(true);
        else setIsLimitReached(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleStart = async () => {
    if (renderMode === "server") handleServerRender();
    else handleBrowserRender();
  };

  const handleServerRender = async () => {
    if (!surahData || status === "rendering") return;
    setStatus("rendering");
    setMessage("جاري إرسال الطلب للسيرفر السحابي...");
    setProgressPct(5);

    try {
      const verses = surahData.verses
        .filter((v: any) => v.id >= state.startAyah && v.id <= state.endAyah)
        .map((v: any) => ({
          ...v,
          audio: getAudioUrl(Number(state.surahId), v.id, state.reciterId)
        }));

      const response = await fetch("https://yousef891238-render-server.hf.space/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
        body: JSON.stringify({
          surahName: surahData.name,
          verses,
          backgroundUrl: state.backgroundUrl,
          textColor: state.textColor,
          fontSize: state.fontSize,
          fontWeight: state.fontWeight,
          fontFamily: state.fontFamily || "Amiri",
          filter: state.filter || "none",
          overlay: state.overlay || "none",
          animation: state.animation || "fade",
          textPosition: state.textPosition || "center",
          userPlan: userPlan?.plan || "free",
          ayahDecoration: state.ayahDecoration || "bracket1",
        }),
      });

      if (!response.ok) throw new Error("فشل التواصل مع السيرفر");
      const { jobId } = await response.json();
      setMessage("بدأت الرندرة في الخلفية. يمكنك الانتظار...");
      
      const checkStatus = async () => {
        try {
          const statusRes = await fetch(`https://yousef891238-render-server.hf.space/status/${jobId}`);
          if (!statusRes.ok) return;
          const jobData = await statusRes.json();
          if (jobData.status === "processing" || jobData.status === "merging") {
            setProgressPct(jobData.progress || 5);
            setMessage(jobData.message || "جاري المعالجة...");
            setTimeout(checkStatus, 7000);
          } else if (jobData.status === "completed") {
            setDownloadUrl(jobData.url);
            setStatus("success");
            setProgressPct(100);
            setMessage("تم تجهيز الفيديو بنجاح! اضغط للتحميل.");
          } else if (jobData.status === "failed") throw new Error(jobData.error || "فشلت عملية الرندرة");
        } catch (e: any) {
          setStatus("error");
          setMessage(e.message || "خطأ أثناء متابعة حالة الفيديو");
        }
      };
      setTimeout(checkStatus, 5000);
    } catch (e: any) {
      console.error(e);
      setStatus("error");
      setMessage(e.message || "حدث خطأ في السيرفر.");
    }
  };

  const handleBrowserRender = async () => {
    if (!surahData || status === "rendering") return;
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
      setStatus("error");
      setMessage("متصفحك لا يدعم تسجيل الفيديو.");
      return;
    }
    
    isRenderingRef.current = true;
    activeAudiosRef.current = [];

    let audioCtx: AudioContext;
    try {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = audioCtx;
        if (audioCtx.state === "suspended") await audioCtx.resume();
    } catch (e) {
        setStatus("error");
        setMessage("تعذر تشغيل معالج الصوت.");
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
      if (audioTracks.length > 0) stream.addTrack(audioTracks[0]);

      let bgImage: HTMLImageElement | null = null;
      let bgVideo: HTMLVideoElement | null = null;
      const isVideo = /\.(mp4|webm|mov|ogg|m4v|3gp|flv|avi)(\?.*|#.*)?$/i.test(state.backgroundUrl) || state.backgroundUrl.includes("video");

      if (isVideo) bgVideo = await loadVideo(state.backgroundUrl);
      else bgImage = await loadImage(state.backgroundUrl); 

      if (!isRenderingRef.current) return;

      const recorder = new MediaRecorder(stream, { videoBitsPerSecond: 5000000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      recorder.start(100);

      const verseAudios = [];
      for (let v of verses) {
        if (!isRenderingRef.current) break;
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.src = getAudioUrl(Number(state.surahId), v.id, state.reciterId);
        activeAudiosRef.current.push(audio);
        const loaded = await new Promise(r => { 
          audio.onloadedmetadata = () => r(true); 
          audio.onerror = () => r(false);
          setTimeout(() => r(false), 10000); 
        });
        verseAudios.push({ verse: v, audio, duration: loaded ? audio.duration : 5, failed: !loaded });
      }

      const totalDuration = verseAudios.reduce((a, b) => a + Number(b.duration), 0);
      let elapsed = 0;

      for (let i = 0; i < verseAudios.length; i++) {
        if (!isRenderingRef.current) break;
        const item = verseAudios[i];
        if (!item.failed) {
          const source = audioCtx.createMediaElementSource(item.audio);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          source.connect(analyser);
          analyser.connect(dest);
          try { await item.audio.play(); } catch(e) {}
          const startTime = Date.now();
          while (isRenderingRef.current && !item.audio.ended && (Date.now() - startTime) < (item.duration * 1000 + 1000)) {
            analyser.getByteFrequencyData(dataArray);
            const ayahProgress = item.audio.currentTime / item.duration;
            renderFrame(ctx, canvas, bgImage, bgVideo, item.verse, state, userPlan, ayahProgress, dataArray, surahData?.name || "");
            const progress = Math.min(99, Math.round(((elapsed + item.audio.currentTime) / totalDuration) * 100));
            setProgressPct(progress);
            setMessage(`جاري التصميم: ${progress}%`);
            await new Promise(r => requestAnimationFrame(r));
          }
          item.audio.pause();
          source.disconnect();
          analyser.disconnect();
        } else {
          for (let s = 0; s < 5 * 30; s++) {
            if (!isRenderingRef.current) break;
            const ayahProgress = s / (5 * 30);
            renderFrame(ctx, canvas, bgImage, bgVideo, item.verse, state, userPlan, ayahProgress, null, surahData?.name || "");
            const progress = Math.min(99, Math.round(((elapsed + (s/30)) / totalDuration) * 100));
            setProgressPct(progress);
            await new Promise(r => setTimeout(r, 33));
          }
        }
        elapsed += item.duration;
      }

      recorder.stop();
      recorder.onstop = async () => {
        const finalBlob = new Blob(chunks, { type: 'video/webm' });
        setDownloadUrl(URL.createObjectURL(finalBlob));
        setStatus("success");
        await incrementVideoRenderCount();
      };
    } catch (e: any) {
      console.error(e);
      if (isRenderingRef.current) {
        setStatus("error");
        setMessage(e.message || "حدث خطأ غير متوقع");
      }
    }
  };

  const handleClose = () => {
    isRenderingRef.current = false;
    activeAudiosRef.current.forEach(a => { try { a.pause(); a.src = ""; a.load(); a.remove(); } catch(e) {} });
    activeAudiosRef.current = [];
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    onClose();
    setStatus("idle");
    setMessage("");
    setProgressPct(0);
    setDownloadUrl(null);
  };

  const renderFrame = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    bg: HTMLImageElement | null, 
    video: HTMLVideoElement | null, 
    verse: any, 
    state: any, 
    userPlan: any, 
    ayahProgress: number = 1, 
    freqData: Uint8Array | null = null,
    surahName: string = ""
  ) => {
    ctx.save();
    
    // 1. Background & Filter
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Apply CSS-like filters manually or via ctx.filter (supported in most modern canvas)
    const filterMap: Record<string, string> = {
      none: "none",
      vintage: "sepia(0.5) contrast(1.1) brightness(0.8)",
      cool: "saturate(0.8) hue-rotate(20deg) brightness(1.1)",
      warm: "saturate(1.4) hue-rotate(-10deg) brightness(1.1)",
      bw: "grayscale(1) contrast(1.3) brightness(0.9)",
      dramatic: "contrast(1.5) brightness(0.6) saturate(1.3)",
      blur: "blur(10px) brightness(0.7)",
      midnight: "brightness(0.5) contrast(1.3) saturate(0.7) hue-rotate(20deg)",
      oceanic: "hue-rotate(170deg) brightness(1.2) saturate(1.3) contrast(1.1)",
      saturated: "saturate(3) contrast(1.2)",
    };
    ctx.filter = filterMap[state.filter || "none"] || "none";

    if (video) {
        const sc = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
        ctx.drawImage(video, (canvas.width - video.videoWidth * sc) / 2, (canvas.height - video.videoHeight * sc) / 2, video.videoWidth * sc, video.videoHeight * sc);
    } else if (bg) {
        const sc = Math.max(canvas.width / bg.width, canvas.height / bg.height);
        ctx.drawImage(bg, (canvas.width - bg.width * sc) / 2, (canvas.height - bg.height * sc) / 2, bg.width * sc, bg.height * sc);
    }
    ctx.filter = "none"; // Reset filter for overlays and text

    // 2. Overlays (12 effects implemented in 2D Canvas)
    if (state.overlay === "dust") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      for(let i=0; i<30; i++) {
        const x = (Math.sin(i * 1000 + Date.now()/2000) * 0.5 + 0.5) * canvas.width;
        const y = ((i * 50 - Date.now()/50) % canvas.height + canvas.height) % canvas.height;
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
      }
    } else if (state.overlay === "rays") {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "rgba(212,175,55,0)");
      grad.addColorStop(0.5, "rgba(212,175,55,0.05)");
      grad.addColorStop(1, "rgba(212,175,55,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (state.overlay === "bokeh") {
      for(let i=0; i<10; i++) {
        const x = (Math.cos(i * 500 + Date.now()/3000) * 0.4 + 0.5) * canvas.width;
        const y = (Math.sin(i * 800 + Date.now()/4000) * 0.4 + 0.5) * canvas.height;
        const rad = 50 + Math.sin(Date.now()/2000 + i) * 20;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, "rgba(212,175,55,0.1)");
        g.addColorStop(1, "rgba(212,175,55,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x-rad, y-rad, rad*2, rad*2);
      }
    } else if (state.overlay === "snow") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      for (let i = 0; i < 40; i++) {
        const x = ((Math.sin(i * 500 + Date.now() / 2500) * 80) + (i * 30)) % canvas.width;
        const y = ((i * 45 + Date.now() / 15) % (canvas.height + 40)) - 20;
        const r = (i % 3) + 1.5;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    } else if (state.overlay === "rain") {
      ctx.strokeStyle = "rgba(174, 194, 224, 0.35)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 50; i++) {
        const x = (i * 25 + Date.now() / 4) % (canvas.width + 100) - 50;
        const y = (i * 35 + Date.now() / 1.5) % (canvas.height + 100) - 50;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 10, y + 35);
        ctx.stroke();
      }
    } else if (state.overlay === "fireflies") {
      for (let i = 0; i < 20; i++) {
        const x = (Math.cos(i * 123 + Date.now() / 3000) * 0.45 + 0.5) * canvas.width;
        const y = (Math.sin(i * 456 + Date.now() / 2500) * 0.45 + 0.5) * canvas.height;
        const size = 3 + Math.sin(Date.now() / 1000 + i) * 1.5;
        if (size > 0.5) {
          ctx.save();
          ctx.shadowColor = "#D4AF37";
          ctx.shadowBlur = 10;
          ctx.fillStyle = "rgba(212, 175, 55, 0.8)";
          ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }
    } else if (state.overlay === "smoke") {
      for (let i = 0; i < 6; i++) {
        const x = (Math.sin(i * 100 + Date.now() / 4000) * 0.35 + 0.5) * canvas.width;
        const y = canvas.height - ((i * 250 + Date.now() / 20) % (canvas.height + 300));
        const r = 120 + Math.sin(Date.now() / 3000 + i) * 40;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(255, 255, 255, 0.05)");
        g.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      }
    } else if (state.overlay === "sparkle") {
      for (let i = 0; i < 15; i++) {
        const x = (Math.sin(i * 789) * 0.45 + 0.5) * canvas.width;
        const y = (Math.cos(i * 456) * 0.45 + 0.5) * canvas.height;
        const alpha = Math.max(0, Math.sin(Date.now() / 800 + i));
        if (alpha > 0.1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "#FFD700";
          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(x, y - 10);
          ctx.lineTo(x + 6, y);
          ctx.lineTo(x, y + 10);
          ctx.lineTo(x - 6, y);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    } else if (state.overlay === "film_grain") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    } else if (state.overlay === "light_leak") {
      const time = Date.now() / 5000;
      const x = (Math.sin(time) * 0.2 + 0.1) * canvas.width;
      const y = (Math.cos(time * 0.7) * 0.2 + 0.1) * canvas.height;
      const r = canvas.width * 0.7;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255, 99, 71, 0.25)");
      g.addColorStop(0.5, "rgba(255, 165, 0, 0.1)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else if (state.overlay === "aurora") {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.25;
      const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      grad.addColorStop(0, "rgba(0, 255, 136, 0.4)");
      grad.addColorStop(0.5, "rgba(0, 136, 255, 0.4)");
      grad.addColorStop(1, "rgba(200, 0, 255, 0.4)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= canvas.width; x += 20) {
        const y = Math.sin((x / 150) + (Date.now() / 1500)) * 40 + 80;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. Dark Overlay & Vignette
    const vignette = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.height);
    vignette.addColorStop(0, "rgba(0,0,0,0.3)");
    vignette.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 4. Watermark
    if (!userPlan || (userPlan.plan === "free" && userPlan.plan !== "trial")) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        const brand = "QURAN PREMIUM";
        for (let y = 100; y < canvas.height; y += 400) {
          for (let x = 150; x < canvas.width; x += 400) {
            ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 4); ctx.fillText(brand, 0, 0); ctx.restore();
          }
        }
        ctx.restore();
    }

    // 4.5 Visualizer & Social Handles
    if (state.showVisualizer && freqData) {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.globalCompositeOperation = "screen";
        const barWidth = (canvas.width / freqData.length) * 1.5;
        let x = (canvas.width - (barWidth * freqData.length)) / 2;
        for(let i = 0; i < freqData.length; i++) {
            const barHeight = (freqData[i] / 255) * (canvas.height * 0.3);
            ctx.fillStyle = state.visualizerColor || '#D4AF37';
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
            x += barWidth;
        }
        ctx.restore();
    }

    if (state.tiktokHandle || state.instaHandle) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "bold 26px Arial";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 10;
        let yPos = canvas.height - 50;
        if (state.instaHandle) {
           ctx.fillText(`Insta: @${state.instaHandle}`, canvas.width/2, yPos);
           yPos -= 40;
        }
        if (state.tiktokHandle) {
           ctx.fillText(`TikTok: @${state.tiktokHandle}`, canvas.width/2, yPos);
        }
        ctx.restore();
    }

    // 4.7 Draw Surah Name Badge at the top
    if (surahName) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 10;
        
        const text = `سورة ${surahName}`;
        ctx.font = `800 28px "${state.fontFamily || 'Amiri'}", serif`;
        const textWidth = ctx.measureText(text).width;
        
        const badgeW = textWidth + 60;
        const badgeH = 54;
        const badgeX = (canvas.width - badgeW) / 2;
        const badgeY = 80;
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 27);
        } else {
          ctx.rect(badgeX, badgeY, badgeW, badgeH);
        }
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = "#FFD700";
        ctx.fillText(text, canvas.width / 2, badgeY + 36);
        ctx.restore();
    }

    // 5. Text Animation & Rendering
    // ayahProgress goes from 0 to 1
    let opacity = 1;
    let scale = 1;
    let translateY = state.textVerticalOffset || 0;
    let blur = 0;

    if (state.animation === "fade") opacity = Math.min(1, ayahProgress * 2);
    if (state.animation === "scale") { scale = 0.8 + (Math.min(1, ayahProgress * 2) * 0.2); opacity = Math.min(1, ayahProgress * 2); }
    if (state.animation === "slide") { translateY += (1 - Math.min(1, ayahProgress * 2)) * 100; opacity = Math.min(1, ayahProgress * 2); }
    if (state.animation === "blur") { blur = (1 - Math.min(1, ayahProgress * 2)) * 20; opacity = Math.min(1, ayahProgress * 2); }
    if (state.animation === "zoom") { scale = 1.5 - (Math.min(1, ayahProgress * 2) * 0.5); opacity = Math.min(1, ayahProgress * 2); }

    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2 + translateY);
    ctx.scale(scale, scale);
    ctx.globalAlpha = opacity;
    if (blur > 0) ctx.filter = `blur(${blur}px)`;

    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 6;
    
    // Main Text
    ctx.fillStyle = state.textColor || "#ffffff";
    ctx.font = `${state.fontWeight || 700} ${state.fontSize * 1.8}px "${state.fontFamily || 'Amiri'}", serif`;
    const lines = wrapText(ctx, verse.text, canvas.width - 140);
    const lineHeight = state.fontSize * 2.2;
    let startY = -(lines.length * lineHeight / 2);
    
    lines.forEach((l, idx) => ctx.fillText(l, 0, startY + (idx * lineHeight)));
    
    // Translation
    ctx.globalAlpha = opacity * 0.8;
    ctx.fillStyle = "#ffffff";
    ctx.font = `500 44px Tajawal`;
    const tLines = wrapText(ctx, verse.translation, canvas.width - 160);
    let transStartY = startY + (lines.length * lineHeight) + 80;
    tLines.forEach((l, idx) => ctx.fillText(l, 0, transStartY + (idx * 60)));
    
    ctx.restore();

    // 6. Verse Number (Bottom)
    ctx.fillStyle = "rgba(212,175,55,0.9)";
    ctx.font = "bold 45px Amiri";
    let decoratedNum = `﴿ ${verse.id} ﴾`;
    if (state.ayahDecoration === "none") decoratedNum = `${verse.id}`;
    else if (state.ayahDecoration === "bracket1") decoratedNum = `﴿ ${verse.id} ﴾`;
    else if (state.ayahDecoration === "bracket2") decoratedNum = `﴾ ${verse.id} ﴿`;
    else if (state.ayahDecoration === "star") decoratedNum = `✧ ${verse.id} ✧`;
    else if (state.ayahDecoration === "diamond") decoratedNum = `✥ ${verse.id} ✥`;
    else if (state.ayahDecoration === "ornament") decoratedNum = `۞ ${verse.id} ۞`;
    ctx.fillText(decoratedNum, canvas.width/2, canvas.height - 180);

    ctx.restore();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl font-['Tajawal']`}>
      <canvas ref={canvasRef} style={{ position: 'fixed', left: '-10000px', top: 0 }} />
      
      <div className="relative w-full max-w-xl bg-[#0c0d10] border border-white/10 rounded-[3.5rem] p-10 flex flex-col items-center shadow-[0_40px_120px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Pattern */}
        <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
        
        {/* Close Button */}
        <button onClick={handleClose} className="absolute top-8 left-8 text-white/20 hover:text-white transition-all">
            <X className="w-8 h-8" />
        </button>

        {!auth?.currentUser ? (
          <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center py-10">
            <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 flex items-center justify-center mb-8 border border-red-500/20">
              <Lock className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">يتطلب تسجيل الدخول</h3>
            <p className="text-white/40 text-sm text-center mb-10 px-8 leading-relaxed">يرجى تسجيل الدخول بحسابك لتتمكن من إنشاء وتصدير الفيديوهات القرآنية.</p>
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent("show_auth_gate"));
                onClose();
              }} 
              className="w-full bg-primary text-black py-5 rounded-[1.5rem] font-black shadow-2xl hover:scale-105 transition-all"
            >
              تسجيل الدخول الآن
            </button>
          </div>
        ) : isLimitReached ? (
          <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center py-10">
            <div className="w-24 h-24 rounded-[2rem] bg-amber-500/10 flex items-center justify-center mb-8 border border-amber-500/20">
              <Sparkles className="w-12 h-12 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">انتهت المحاولات المتاحة</h3>
            <p className="text-white/40 text-sm text-center mb-10 px-8 leading-relaxed">لقد استهلكت جميع الرندرات المتاحة في خطتك. اشترك الآن في العضوية المميزة لرندرة غير محدودة.</p>
            <button onClick={() => { onClose(); onOpenSubscription(); }} className="w-full bg-primary text-black py-5 rounded-[1.5rem] font-black shadow-2xl hover:scale-105 transition-all">عرض خطط التميز</button>
          </div>
        ) : status === "idle" ? (
          <>
            <div className="w-full flex items-center justify-between mb-12">
                <div className="text-right">
                    <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1 block">الحالة الحالية</span>
                    <span className="text-base font-black text-white">{userPlan?.plan === 'free' ? 'العضوية المجانية' : 'عضوية التميز'}</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-right">
                    <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1 block">الرندرة المتاحة</span>
                    <span className="text-base font-black text-white">{userPlan?.plan === 'free' ? `${5 - (userPlan?.count || 0)} فيديوهات` : 'غير محدود'}</span>
                </div>
            </div>

            <div className="w-24 h-24 rounded-[2.5rem] bg-primary flex items-center justify-center mb-10 shadow-[0_20px_50px_rgba(212,175,55,0.2)]">
              <Play className="w-10 h-10 text-black fill-current" />
            </div>
            
            <h3 className="font-['Amiri'] text-4xl font-black text-white mb-2">تجهيز العمل الفني</h3>
            <p className="text-white/40 text-xs text-center mb-10 uppercase tracking-widest">اختر دقة الإخراج والجودة المطلوبة</p>
            
            <div className="w-full space-y-4 mb-10">
                <button onClick={() => setRenderMode("browser")} className={`w-full p-6 rounded-[2rem] border-2 transition-all flex flex-col items-start gap-1 text-right ${renderMode === "browser" ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                    <span className="text-base font-black text-white">رندرة المتصفح السريعة</span>
                    <span className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">تصدير فوري بجودة HD قياسية</span>
                </button>
                <button onClick={() => !userPlan || userPlan.plan !== 'free' ? setRenderMode("server") : null} className={`w-full p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between gap-4 text-right ${renderMode === "server" ? "border-primary bg-primary/10" : "border-white/5 bg-white/5"} ${userPlan?.plan === 'free' ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10'}`}>
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-base font-black text-white">الرندرة السحابية الفائقة</span>
                        <span className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">تصدير MP4 بجودة 4K احترافية</span>
                    </div>
                    <Crown className={`w-6 h-6 ${userPlan?.plan === 'free' ? 'text-white/20' : 'text-primary'}`} />
                </button>
            </div>

            <button onClick={handleStart} className="w-full bg-primary text-black py-6 rounded-[1.5rem] font-black text-lg shadow-2xl hover:scale-[1.03] transition-all">بدء التصميم والتصدير الآن</button>
          </>
        ) : (
          <div className="w-full flex flex-col items-center py-10">
            <div className="mb-10">
              {status === "rendering" ? (
                <div className="w-24 h-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center border border-white/10 relative overflow-hidden">
                   <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                   <Loader2 className="w-10 h-10 text-primary animate-spin relative z-10" />
                </div>
              ) : status === "success" ? (
                <div className="w-24 h-24 rounded-[2.5rem] bg-green-500/20 flex items-center justify-center border border-green-500/20 shadow-[0_20px_50px_rgba(34,197,94,0.2)]">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-[2.5rem] bg-red-500/20 flex items-center justify-center border border-red-500/20">
                    <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
              )}
            </div>
            
            <h3 className="text-2xl font-black text-white mb-4">
              {status === "rendering" ? "جاري إنشاء الفيديو..." : status === "success" ? "تم الانتهاء بنجاح!" : "عذراً، حدث خطأ ما"}
            </h3>
            
            {status === "rendering" && (
              <div className="w-full space-y-6 mb-10">
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-primary shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all duration-700" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] text-center">{message} ({progressPct}%)</p>
              </div>
            )}
            
            {status === "success" && downloadUrl && (
              <a href={downloadUrl} download={`quran-video-${Date.now()}.mp4`} className="w-full bg-white text-black py-6 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-2xl">
                <Download className="w-6 h-6" />
                تحميل الملف النهائي
              </a>
            )}
            
            {status === "error" && (
              <button onClick={() => setStatus("idle")} className="w-full bg-white/5 text-white py-5 rounded-[1.5rem] font-black border border-white/10 hover:bg-white/10 transition-all">إعادة المحاولة</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((r, j) => { 
    const i = new Image(); 
    i.crossOrigin = "anonymous"; 
    i.onload = () => {
      console.log("[Render] Image loaded successfully:", src.substring(0, 50));
      r(i);
    };
    i.onerror = (e) => {
      console.error("[Render] Image load error:", src, e);
      j(new Error("فشل في تحميل الصورة. تأكد من أن الرابط يعمل."));
    };
    i.src = src; 
    setTimeout(() => j(new Error("Image timeout: " + src.substring(0, 30))), 20000);
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
      console.log("[Render] Video loaded successfully:", src.substring(0, 50));
      v.play().catch(() => {}); 
      r(v); 
    }; 
    v.onerror = (e) => {
      console.error("[Render] Video load error:", src, e);
      j(new Error("فشل في تحميل الفيديو. تأكد من اتصالك بالإنترنت."));
    };
    setTimeout(() => j(new Error("انتهت مهلة تحميل الفيديو. حاول مرة أخرى.")), 45000);
    v.load();
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (!text) return [];
  const words = text.split(' '); const lines = []; let currentLine = words[0];
  for (let i = 1; i < words.length; i++) {
    if (ctx.measureText(currentLine + " " + words[i]).width < maxWidth) { currentLine += " " + words[i]; }
    else { lines.push(currentLine); currentLine = words[i]; }
  }
  lines.push(currentLine); return lines;
}
