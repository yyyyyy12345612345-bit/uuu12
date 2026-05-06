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
          source.connect(dest);
          try { await item.audio.play(); } catch(e) {}
          const startTime = Date.now();
          while (isRenderingRef.current && !item.audio.ended && (Date.now() - startTime) < (item.duration * 1000 + 1000)) {
            renderFrame(ctx, canvas, bgImage, bgVideo, item.verse, state, userPlan);
            const progress = Math.min(99, Math.round(((elapsed + item.audio.currentTime) / totalDuration) * 100));
            setProgressPct(progress);
            setMessage(`جاري التصميم: ${progress}%`);
            await new Promise(r => requestAnimationFrame(r));
          }
          item.audio.pause();
          source.disconnect();
        } else {
          for (let s = 0; s < 5 * 30; s++) {
            if (!isRenderingRef.current) break;
            renderFrame(ctx, canvas, bgImage, bgVideo, item.verse, state, userPlan);
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

  const renderFrame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, bg: HTMLImageElement | null, video: HTMLVideoElement | null, verse: any, state: any, userPlan: any) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (video) {
        const sc = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
        ctx.drawImage(video, (canvas.width - video.videoWidth * sc) / 2, (canvas.height - video.videoHeight * sc) / 2, video.videoWidth * sc, video.videoHeight * sc);
    } else if (bg) {
        const sc = Math.max(canvas.width / bg.width, canvas.height / bg.height);
        ctx.drawImage(bg, (canvas.width - bg.width * sc) / 2, (canvas.height - bg.height * sc) / 2, bg.width * sc, bg.height * sc);
    }
    
    // Watermark
    if (!userPlan || (userPlan.plan === "free" && userPlan.plan !== "trial")) {
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        const brand = "quran-app-premium.com";
        for (let y = 100; y < canvas.height; y += 400) {
          for (let x = 150; x < canvas.width; x += 400) {
            ctx.save(); ctx.translate(x, y); ctx.rotate(-Math.PI / 4); ctx.fillText(brand, 0, 0); ctx.restore();
          }
        }
        ctx.restore();
    }

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = state.textColor || "#ffffff";
    ctx.font = `${state.fontWeight} ${state.fontSize * 1.8}px "${state.fontFamily || 'Amiri'}", serif`;
    const lines = wrapText(ctx, verse.text, canvas.width - 120);
    const lineHeight = state.fontSize * 2.0;
    let startY = (canvas.height / 2) - (lines.length * lineHeight / 3);
    lines.forEach((l, idx) => ctx.fillText(l, canvas.width / 2, startY + (idx * lineHeight)));
    
    ctx.fillStyle = "#ffffff";
    ctx.font = `500 42px Tajawal`;
    const tLines = wrapText(ctx, verse.translation, canvas.width - 150);
    tLines.forEach((l, idx) => ctx.fillText(l, canvas.width / 2, startY + (lines.length * lineHeight) + 100 + (idx * 55)));
    
    ctx.fillStyle = "rgba(212,175,55,1)";
    ctx.font = "bold 40px Amiri";
    ctx.fillText(`﴿ ${verse.id} ﴾`, canvas.width/2, canvas.height - 150);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl font-['Tajawal']`}>
      <canvas ref={canvasRef} style={{ position: 'fixed', left: '-10000px', top: 0 }} />
      
      <div className="relative w-full max-w-xl bg-[#064E3B] border border-white/10 rounded-[3.5rem] p-10 flex flex-col items-center shadow-[0_40px_120px_rgba(0,0,0,0.6)] overflow-hidden">
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
            <button onClick={() => window.location.href = '/'} className="w-full bg-primary text-black py-5 rounded-[1.5rem] font-black shadow-2xl hover:scale-105 transition-all">العودة لتسجيل الدخول</button>
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
    const i = new Image(); i.crossOrigin="anonymous"; i.onload=()=>r(i); i.onerror=j; i.src=src; 
    setTimeout(() => j(new Error("Image timeout")), 15000);
  });
}

function loadVideo(src: string): Promise<HTMLVideoElement> {
  return new Promise((r, j) => { 
    const v = document.createElement("video"); v.src = src; v.crossOrigin = "anonymous"; v.muted = true; v.loop = true; v.playsInline = true;
    v.oncanplaythrough = () => { v.play().catch(() => {}); r(v); }; 
    v.onerror = () => j(new Error("Video load error"));
    setTimeout(() => j(new Error("Video timeout")), 20000);
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
