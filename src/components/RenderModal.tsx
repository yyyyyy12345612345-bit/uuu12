"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle, Play, Crown, Lock, Info, Sparkles, ChevronLeft, X } from "lucide-react";
import { useEditor } from "@/store/useEditor";
import { useSurahData } from "@/hooks/useSurahData";
import { RECITERS, getReciterEnglishName, getSheikhAsset } from "@/data/reciters";
import { getAudioUrl } from "@/lib/quranUtils";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
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

  const [renderMode, setRenderMode] = useState<"browser" | "server">("server");
  const [status, setStatus] = useState<"idle" | "rendering" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const [userPlan, setUserPlan] = useState<any>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState<number | null>(null);
  
  const [renderConfig, setRenderConfig] = useState<{
    enabled: boolean;
    message: string;
    reason: string;
    allowPlans: string[];
  }>({ enabled: true, message: "", reason: "maintenance", allowPlans: ["free", "starter", "supporter", "premium"] });

  const isRenderDisabled = React.useMemo(() => {
    if (renderConfig.enabled) return false;
    
    const email = auth?.currentUser?.email || "";
    const username = userPlan?.username || "";
    const displayName = userPlan?.displayName || "";
    if (
      email.toLowerCase() === "youssefosama@gmail.com" ||
      username.toLowerCase() === "youssef" ||
      displayName.toLowerCase() === "youssef"
    ) {
      return false;
    }
    
    return true;
  }, [renderConfig, auth?.currentUser, userPlan]);

  useEffect(() => {
    if (isOpen) {
      fetchUserPlan();
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: any = null;
    if (isOpen && isLimitReached && cooldownTimeLeft !== null && cooldownTimeLeft > 0) {
      timer = setInterval(() => {
        setCooldownTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            setIsLimitReached(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isLimitReached, cooldownTimeLeft]);

  const fetchUserPlan = async () => {
    const user = auth?.currentUser;
    
    let cooldownFree = 30;
    let cooldownStarter = 15;
    let cooldownSupporter = 10;
    let cooldownPremium = 5;

    if (db) {
      try {
        const pricingDoc = await getDoc(doc(db, "settings", "pricing"));
        if (pricingDoc.exists()) {
          const pData = pricingDoc.data();
          if (pData.cooldownFree !== undefined) cooldownFree = pData.cooldownFree;
          if (pData.cooldownStarter !== undefined) cooldownStarter = pData.cooldownStarter;
          if (pData.cooldownSupporter !== undefined) cooldownSupporter = pData.cooldownSupporter;
          if (pData.cooldownPremium !== undefined) cooldownPremium = pData.cooldownPremium;
        }
      } catch (err) {
        console.warn("Failed to load pricing/cooldown configurations:", err);
      }

      try {
        const configDoc = await getDoc(doc(db, "settings", "render_config"));
        if (configDoc.exists()) {
          const cData = configDoc.data();
          setRenderConfig({
            enabled: cData.enabled ?? true,
            message: cData.message ?? "",
            reason: cData.reason ?? "maintenance",
            allowPlans: cData.allowPlans ?? ["free", "starter", "supporter", "premium"]
          });
        }
      } catch (err) {
        console.warn("Failed to load render_config:", err);
      }
    }

    if (!user) {
      setUserPlan(null);
      setRenderMode("server");
      
      const lastGuestRenderStr = localStorage.getItem("last_guest_render_time");
      if (lastGuestRenderStr) {
        const lastGuestRender = parseInt(lastGuestRenderStr);
        const elapsedMinutes = (Date.now() - lastGuestRender) / (60 * 1000);
        if (elapsedMinutes < cooldownFree) {
          setIsLimitReached(true);
          setCooldownTimeLeft(Math.ceil(cooldownFree * 60 - (Date.now() - lastGuestRender) / 1000));
          return;
        }
      }
      setIsLimitReached(false);
      setCooldownTimeLeft(null);
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

        let cooldownMinutes = cooldownFree;
        if (plan === "starter") cooldownMinutes = cooldownStarter;
        else if (plan === "supporter") cooldownMinutes = cooldownSupporter;
        else if (plan === "premium" || plan === "vip") cooldownMinutes = cooldownPremium;

        const totalPoints = data.totalPoints || 0;
        const username = data.username || "";
        const email = data.email || user.email || "";
        const displayName = data.displayName || user.displayName || "";
        const isBypassedUser = 
          username.toLowerCase() === "youssef" || 
          email.toLowerCase().includes("youssef") ||
          displayName.toLowerCase() === "youssef";

        if (isBypassedUser || totalPoints >= 10000) {
          setIsLimitReached(false);
          setCooldownTimeLeft(null);
          setRenderMode("server");
          return;
        }

        const lastRenderedAtVal = data.lastRenderedAt;
        if (lastRenderedAtVal) {
          const lastRenderTime = lastRenderedAtVal.toDate ? lastRenderedAtVal.toDate().getTime() : new Date(lastRenderedAtVal).getTime();
          const elapsedMinutes = (Date.now() - lastRenderTime) / (60 * 1000);
          if (elapsedMinutes < cooldownMinutes) {
            setIsLimitReached(true);
            setCooldownTimeLeft(Math.ceil(cooldownMinutes * 60 - (Date.now() - lastRenderTime) / 1000));
            return;
          }
        }

        setIsLimitReached(false);
        setCooldownTimeLeft(null);

        setRenderMode("server");
      }
    } catch (e) {
      console.error(e);
      setRenderMode("browser");
    }
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
      const selectedReciter = RECITERS.find(r => r.id === state.reciterId);
      let quranComData: any = null;
      if (selectedReciter?.quranComId) {
        try {
          const res = await fetch(`https://api.quran.com/api/v4/quran/recitations/${selectedReciter.quranComId}?chapter_number=${state.surahId}`);
          if (res.ok) {
            quranComData = await res.json();
          }
        } catch(e) { console.warn("Failed to fetch premium sync data", e); }
      }

      const verses = surahData.verses
        .filter((v: any) => v.id >= state.startAyah && v.id <= state.endAyah)
        .map((v: any) => {
          let quranComVerse = null;
          if (quranComData?.audio_files) {
            const verseKey = `${state.surahId}:${v.id}`;
            quranComVerse = quranComData.audio_files.find((af:any) => af.verse_key === verseKey);
          }
          const premiumAudio = quranComVerse?.url 
            ? (quranComVerse.url.startsWith('http') 
                ? quranComVerse.url 
                : (quranComVerse.url.startsWith('//') 
                    ? `https:${quranComVerse.url}` 
                    : `https://verses.quran.com/${quranComVerse.url}`)) 
            : null;
            
          return {
            ...v,
            audio: premiumAudio || getAudioUrl(Number(state.surahId), v.id, state.reciterId),
            words: quranComVerse?.words || undefined
          };
        });

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
          textVerticalOffset: state.textVerticalOffset ?? 0,
          showVisualizer: state.showVisualizer ?? false,
          visualizerColor: state.visualizerColor ?? "#D4AF37",
          visualizerStyle: state.visualizerStyle ?? "bars",
          tiktokHandle: state.tiktokHandle ?? "",
          instaHandle: state.instaHandle ?? "",
          particles: state.particles ?? "none",
          userPlan: userPlan?.plan || "free",
           ayahDecoration: state.ayahDecoration || "bracket1",
          videoTemplate: state.videoTemplate || "default",
          reciterName: getReciterEnglishName(state.reciterId),
          reciterId: state.reciterId,
        }),
      });

      if (!response.ok) throw new Error("فشل التواصل مع السيرفر");
      const { jobId } = await response.json();
      const startTime = Date.now();

      // Log render job start to Firestore
      if (db) {
        try {
          const user = auth?.currentUser;
          const isVideoBg = !!state.backgroundUrl?.match(/\.(mp4|webm|mov)$/i);
          await setDoc(doc(db, "video_renders", jobId), {
            jobId,
            userId: user?.uid || "guest",
            userEmail: user?.email || "guest@guest.com",
            surahId: state.surahId,
            surahName: surahData.name,
            reciterId: state.reciterId,
            reciterName: getReciterEnglishName(state.reciterId),
            videoTemplate: state.videoTemplate || "default",
            backgroundUrl: state.backgroundUrl || "",
            isVideoBg,
            status: "rendering",
            createdAt: serverTimestamp(),
            completedAt: null,
            renderTime: 0,
            error: null,
            userPlan: userPlan?.plan || "free"
          });
        } catch (err) {
          console.error("Failed to create video_renders log:", err);
        }
      }

      setMessage("بدأت الرندرة في الخلفية. يمكنك الانتظار...");
      
      const checkStatus = async () => {
        try {
          const statusRes = await fetch(`https://yousef891238-render-server.hf.space/status/${jobId}`);
          if (!statusRes.ok) return;
          const jobData = await statusRes.json();
          if (jobData.status === "processing" || jobData.status === "merging") {
            setProgressPct(jobData.progress || 5);
            setMessage(jobData.message || "جاري المعالجة...");
            
            // Optional: update status to merging in Firestore
            if (db && jobData.status === "merging") {
              updateDoc(doc(db, "video_renders", jobId), {
                status: "merging"
              }).catch(() => {});
            }

            setTimeout(checkStatus, 7000);
          } else if (jobData.status === "completed") {
            setDownloadUrl(jobData.url);
            setStatus("success");
            setProgressPct(100);
            setMessage("تم تجهيز الفيديو بنجاح! اضغط للتحميل.");

            // Log successful completion in Firestore
            if (db) {
              try {
                await updateDoc(doc(db, "video_renders", jobId), {
                  status: "completed",
                  completedAt: serverTimestamp(),
                  renderTime: Math.round((Date.now() - startTime) / 1000)
                });
              } catch (err) {
                console.error("Failed to update video_renders log for success:", err);
              }
            }

            if (!auth?.currentUser) {
              localStorage.setItem("guest_video_renders", "1");
              localStorage.setItem("last_guest_render_time", Date.now().toString());
            } else {
              await incrementVideoRenderCount();
            }
          } else if (jobData.status === "failed") {
            const errMsg = jobData.error || "فشلت عملية الرندرة";
            // Log failure in Firestore
            if (db) {
              try {
                await updateDoc(doc(db, "video_renders", jobId), {
                  status: "failed",
                  completedAt: serverTimestamp(),
                  error: errMsg
                });
              } catch (err) {
                console.error("Failed to update video_renders log for failure:", err);
              }
            }
            throw new Error(errMsg);
          }
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
      const isDossary = state.videoTemplate === "dossary_player";
      const isYoussef = state.videoTemplate === "youssef_player";
      const dossaryBgUrl = "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782871516/12_gahaqi.png";
      const youssefBgUrl = "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1783004228/Untitled_design_zawi7h.png";
      const actualBgUrl = isDossary ? dossaryBgUrl : (isYoussef ? youssefBgUrl : state.backgroundUrl);
      
      const isVideo = !isDossary && !isYoussef && (/\.(mp4|webm|mov|ogg|m4v|3gp|flv|avi)(\?.*|#.*)?$/i.test(state.backgroundUrl) || state.backgroundUrl.includes("video"));

      if (isVideo) bgVideo = await loadVideo(actualBgUrl);
      else bgImage = await loadImage(actualBgUrl); 

      let templatePhoto: HTMLImageElement | null = null;
      let templateCalligraphy: HTMLImageElement | null = null;
      const isPlayerTemplate = ["dossary_player", "minshawi_player", "youssef_player", "basit_player"].includes(state.videoTemplate || "");

      if (isPlayerTemplate) {
        const sheikh = getSheikhAsset(state.reciterId || "");
        templatePhoto = await loadImage(sheikh.photoUrl);
        if ((state.videoTemplate === "youssef_player" || state.videoTemplate === "basit_player") && sheikh.calligraphyUrl) {
          templateCalligraphy = await loadImage(sheikh.calligraphyUrl);
        }
      }

      if (!isRenderingRef.current) return;

      let mimeType = "video/webm";
      let options: any = { videoBitsPerSecond: 5000000 };

      if (typeof MediaRecorder.isTypeSupported === "function") {
        if (MediaRecorder.isTypeSupported("video/mp4;codecs=h264")) {
          mimeType = "video/mp4;codecs=h264";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
          mimeType = "video/webm;codecs=vp9";
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
          mimeType = "video/webm;codecs=vp8";
        }
        options.mimeType = mimeType;
        console.log("[RenderModal] Browser rendering using mimeType:", mimeType);
      }

      const recorder = new MediaRecorder(stream, options);
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
             renderFrame(ctx, canvas, bgImage, bgVideo, item.verse, state, userPlan, ayahProgress, dataArray, surahData?.name || "", templatePhoto, templateCalligraphy);
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
             renderFrame(ctx, canvas, bgImage, bgVideo, item.verse, state, userPlan, ayahProgress, null, surahData?.name || "", templatePhoto, templateCalligraphy);
            const progress = Math.min(99, Math.round(((elapsed + (s/30)) / totalDuration) * 100));
            setProgressPct(progress);
            await new Promise(r => setTimeout(r, 33));
          }
        }
        elapsed += item.duration;
      }

      recorder.stop();
      recorder.onstop = async () => {
        const recordedMime = recorder.mimeType || mimeType || "video/webm";
        const finalBlob = new Blob(chunks, { type: recordedMime });
        setDownloadUrl(URL.createObjectURL(finalBlob));
        setStatus("success");
        if (!auth?.currentUser) {
          localStorage.setItem("guest_video_renders", "1");
          localStorage.setItem("last_guest_render_time", Date.now().toString());
        } else {
          await incrementVideoRenderCount();
        }
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
    surahName: string = "",
    templatePhoto: HTMLImageElement | null = null,
    templateCalligraphy: HTMLImageElement | null = null
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
      sepia: "sepia(1) contrast(0.8) brightness(1.2)",
      midnight: "brightness(0.5) contrast(1.3) saturate(0.7) hue-rotate(20deg)",
      oceanic: "hue-rotate(170deg) brightness(1.2) saturate(1.3) contrast(1.1)",
      saturated: "saturate(3) contrast(1.2)",
      cinematic: "contrast(1.4) saturate(1.6) brightness(0.85) sepia(0.1)",
      golden: "brightness(1.1) saturate(1.3) sepia(0.35) hue-rotate(-5deg)",
      teal_orange: "contrast(1.2) saturate(1.1) sepia(0.15) hue-rotate(5deg) brightness(1.05)",
      noir: "grayscale(1) contrast(1.5) brightness(0.85)",
      dreamy: "brightness(1.15) saturate(0.7) contrast(0.9) blur(0.5px) sepia(0.15)",
      neon: "saturate(2.5) contrast(1.3) hue-rotate(300deg) brightness(1.2)",
      pastel: "saturate(0.5) brightness(1.2) contrast(0.85) sepia(0.2)",
      lut_autumn: "sepia(0.6) saturate(1.4) hue-rotate(-20deg) brightness(1.0)",
      lut_forest: "sepia(0.3) saturate(1.2) hue-rotate(80deg) brightness(0.9)",
      high_contrast: "contrast(2) brightness(0.8) saturate(1.5)",
      faded: "brightness(1.1) contrast(0.7) saturate(0.4) sepia(0.3)",
      vignette: "brightness(0.9) contrast(1.3) saturate(1.1)",
      cross_process: "contrast(1.3) saturate(0.7) sepia(0.4) hue-rotate(20deg) brightness(0.9)",
    };
    ctx.filter = filterMap[state.filter || "none"] || "none";

    if (state.videoTemplate === "minshawi_player") {
        ctx.fillStyle = "#383838";
        ctx.fillRect(0, 380, canvas.width, 520);
    } else if (state.videoTemplate === "dossary_player") {
        if (bg) {
            const middleH = 520;
            const sc = Math.max(canvas.width / bg.width, middleH / bg.height);
            ctx.drawImage(bg, (canvas.width - bg.width * sc) / 2, 380 + (middleH - bg.height * sc) / 2, bg.width * sc, bg.height * sc);
        }
    } else if (state.videoTemplate === "youssef_player") {
        if (bg) {
            ctx.save();
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(30, 380, 1020, 520, 45);
            } else {
                ctx.rect(30, 380, 1020, 520);
            }
            ctx.closePath();
            ctx.clip();
            
            const middleH = 520;
            const sc = Math.max(1020 / bg.width, middleH / bg.height);
            ctx.drawImage(bg, 30 + (1020 - bg.width * sc) / 2, 380 + (middleH - bg.height * sc) / 2, bg.width * sc, bg.height * sc);
            ctx.restore();
        }
    } else if (state.videoTemplate === "basit_player") {
        ctx.fillStyle = "#c5beb8";
        ctx.fillRect(0, 380, canvas.width, 520);
    } else {
        if (video) {
            const sc = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
            ctx.drawImage(video, (canvas.width - video.videoWidth * sc) / 2, (canvas.height - video.videoHeight * sc) / 2, video.videoWidth * sc, video.videoHeight * sc);
        } else if (bg) {
            const sc = Math.max(canvas.width / bg.width, canvas.height / bg.height);
            ctx.drawImage(bg, (canvas.width - bg.width * sc) / 2, (canvas.height - bg.height * sc) / 2, bg.width * sc, bg.height * sc);
        }
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

    // 4. Watermark (Removed by request)

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
    if (surahName && state.videoTemplate !== "dossary_player" && state.videoTemplate !== "minshawi_player") {
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

    if (state.videoTemplate === "youssef_player") {
      // 1. Draw Sheikh Photo on the left (y=[480,790])
      const rx = 35;
      const photoX = 45;
      const photoY = 480;
      const photoW = 235;
      const photoH = 310;
      
      if (templatePhoto) {
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
        ctx.shadowBlur = 15;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(photoX, photoY, photoW, photoH, rx);
        } else {
          ctx.rect(photoX, photoY, photoW, photoH);
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.clip();
        ctx.drawImage(templatePhoto, photoX, photoY, photoW, photoH);
        ctx.restore();
      }

      // 2. Draw Calligraphy on the top right
      if (templateCalligraphy) {
        ctx.save();
        const callW = 320;
        const callH = 75;
        const callX = 330;
        const callY = 425;
        ctx.drawImage(templateCalligraphy, callX, callY, callW, callH);
        ctx.restore();
      }

      // 3. Draw Active Verse Text (Middle right)
      if (verse && verse.text) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#1a0f00"; // Dark ink
        ctx.font = `600 32px "Amiri", serif`;
        
        const rightAreaW = 360;
        const textCenterX = 310 + rightAreaW / 2; // 490
        const lines = wrapText(ctx, verse.text, rightAreaW - 20);
        if (lines.length > 0) {
          const progressPct = ayahProgress || 0;
          const activeLineIdx = Math.min(lines.length - 1, Math.floor(progressPct * lines.length));
          const activeLineText = lines[activeLineIdx];
          
          const startY = 570;
          ctx.fillText(activeLineText, textCenterX, startY);
        }
        ctx.restore();
      }

      // 4. Visualizer
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      const visX = 295;
      const visY = 740;
      const barCount = 42;
      const barW = 4;
      const barGap = 5;
      for (let i = 0; i < barCount; i++) {
        const timeFactor = (elapsedTime || 0) * 3;
        const wave = Math.sin(i * 0.15 + timeFactor) * 0.4 + 0.6;
        const randomHeight = (i % 3 === 0 ? 12 : i % 2 === 0 ? 25 : 8) * wave;
        const h = Math.max(3, randomHeight);
        ctx.fillRect(visX + i * (barW + barGap), visY - h / 2, barW, h);
      }
      ctx.restore();

      // 5. Player Controls
      const ctrlY = 765;
      const ctrlCenterX = 490;
      
      // Shuffle Icon
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2.5;
      ctx.translate(ctrlCenterX - 90, ctrlY);
      ctx.beginPath();
      ctx.moveTo(0, 4); ctx.bezierCurveTo(8, 4, 12, 16, 20, 16);
      ctx.moveTo(0, 16); ctx.bezierCurveTo(8, 16, 12, 4, 20, 4);
      ctx.stroke();
      ctx.restore();

      // Prev Icon
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.translate(ctrlCenterX - 45, ctrlY);
      ctx.beginPath();
      ctx.moveTo(15, 17); ctx.lineTo(5, 10); ctx.lineTo(15, 3);
      ctx.fill();
      ctx.fillRect(2, 3, 2.5, 14);
      ctx.restore();

      // Play/Pause (Circle Pause)
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ctrlCenterX + 10, ctrlY + 10, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#a88a50";
      ctx.fillRect(ctrlCenterX + 5, ctrlY + 4, 3.5, 12);
      ctx.fillRect(ctrlCenterX + 12, ctrlY + 4, 3.5, 12);
      ctx.restore();

      // Next Icon
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.translate(ctrlCenterX + 50, ctrlY);
      ctx.beginPath();
      ctx.moveTo(5, 17); ctx.lineTo(15, 10); ctx.lineTo(5, 3);
      ctx.fill();
      ctx.fillRect(15.5, 3, 2.5, 14);
      ctx.restore();

      // Repeat Icon
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 2.5;
      ctx.translate(ctrlCenterX + 85, ctrlY);
      ctx.beginPath();
      ctx.arc(10, 10, 7, -Math.PI/4, 5*Math.PI/4);
      ctx.stroke();
      ctx.restore();

      // 6. Draw Sheikh Name above Photo (Aref Ruqaa font, permanent with writing animation)
      ctx.save();
      
      let writeProgress = 1.0;
      if (elapsedTime < 2.0) {
        writeProgress = elapsedTime < 0.5 ? 0 : Math.min(1.0, (elapsedTime - 0.5) / 1.5);
      }
      
      const textWidth = 405;
      const textHeight = 70;
      const clipW = textWidth * writeProgress;
      const clipX = 450 - clipW; // reveal from right (450) to left (45)
      
      ctx.beginPath();
      ctx.rect(clipX, 400, clipW, textHeight);
      ctx.closePath();
      ctx.clip();
      
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      
      const nameText = `القارئ الشيخ ${getSheikhAsset(state.reciterId || "").nameAr}`;
      ctx.font = `bold 32px "Reem Kufi Fun", "Amiri", serif`;
      
      ctx.fillStyle = "#1a0f00";
      // Draw at x = 45, y = 445
      ctx.fillText(nameText, 45, 445);
      
      ctx.restore();
    }

    if (state.videoTemplate === "dossary_player") {
      // 1. Draw Sheikh Photo on the left (y=[480,800])
      const rx = 35;
      const photoX = 70;
      const photoY = 480;
      const photoW = 240;
      const photoH = 320;
      
      if (templatePhoto) {
        ctx.save();
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.shadowBlur = 20;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(photoX, photoY, photoW, photoH, rx);
        } else {
          ctx.rect(photoX, photoY, photoW, photoH);
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.clip();
        ctx.drawImage(templatePhoto, photoX, photoY, photoW, photoH);
        ctx.restore();
      }

      const rightAreaX = 345;
      const rightAreaW = 330;
      const textCenterX = rightAreaX + rightAreaW / 2; // 510

      // 2. Draw Active Verse Text (Top part of right area y=[480,620])
      if (verse && verse.text) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = "#ffffff";
        ctx.font = `600 32px "Noto Naskh Arabic", serif`;
        
        const lines = wrapText(ctx, verse.text, rightAreaW);
        if (lines.length > 0) {
          const progressPct = ayahProgress || 0;
          const activeLineIdx = Math.min(lines.length - 1, Math.floor(progressPct * lines.length));
          const activeLineText = lines[activeLineIdx];
          
          const startY = 480 + 150 / 2;
          ctx.fillText(activeLineText, textCenterX, startY);
        }
        ctx.restore();
      }

      // 3. Progress Bar & Controls (in right area y=[640,800])
      const progressPct = ayahProgress || 0;
      const barWidth = 300;
      const progressWidth = barWidth * progressPct;
      const barX = rightAreaX + (rightAreaW - barWidth) / 2; // 360
      const barY = 660;
      
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(barX, barY, barWidth, 3, 1.5);
      } else {
        ctx.rect(barX, barY, barWidth, 3);
      }
      ctx.fill();
      
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(barX, barY, progressWidth, 3, 1.5);
      } else {
        ctx.rect(barX, barY, progressWidth, 3);
      }
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(barX + progressWidth, barY + 1.5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.fillText("0:00", barX, barY + 20);
      ctx.textAlign = "right";
      ctx.fillText("1:30", barX + barWidth, barY + 20);
      ctx.restore();
      
      // Control Buttons (y around 715)
      const btnY = 715;
      
      // Heart Button
      ctx.save();
      ctx.translate(360, btnY);
      ctx.scale(0.9, 0.9);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(12, 6);
      ctx.bezierCurveTo(12, 6, 11, 2, 6.5, 2);
      ctx.bezierCurveTo(2, 2, 2, 7.5, 2, 7.5);
      ctx.bezierCurveTo(2, 12, 12, 20, 12, 20);
      ctx.bezierCurveTo(12, 20, 22, 12, 22, 7.5);
      ctx.bezierCurveTo(22, 7.5, 22, 2, 17.5, 2);
      ctx.bezierCurveTo(13, 2, 12, 6, 12, 6);
      ctx.stroke();
      ctx.restore();
      
      // Prev Button
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.translate(430, btnY);
      ctx.scale(0.9, 0.9);
      ctx.beginPath();
      ctx.moveTo(19, 20); ctx.lineTo(9, 12); ctx.lineTo(19, 4);
      ctx.fill();
      ctx.fillRect(5, 4, 2, 16);
      ctx.restore();
      
      // Play Button (Circle Pause)
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(510, btnY + 11, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000000";
      ctx.fillRect(503, btnY + 2, 4, 18);
      ctx.fillRect(513, btnY + 2, 4, 18);
      ctx.restore();
      
      // Next Button
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.translate(590, btnY);
      ctx.scale(0.9, 0.9);
      ctx.beginPath();
      ctx.moveTo(5, 4); ctx.lineTo(15, 12); ctx.lineTo(5, 20);
      ctx.fill();
      ctx.fillRect(17, 4, 2, 16);
      ctx.restore();
      
      // Minus Circle Button
      ctx.save();
      ctx.translate(660, btnY);
      ctx.scale(0.9, 0.9);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(12, 12, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(7, 12); ctx.lineTo(17, 12);
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "500 22px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(getSheikhAsset(state.reciterId).nameEn, canvas.width / 2, 1140);
      ctx.restore();

      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "center";
      const startAyah = state.startAyah || 1;
      const endAyah = state.endAyah || 1;
      const rangeText = startAyah === endAyah ? `AYAH ${startAyah}` : `AYAH ${startAyah} - ${endAyah}`;
      ctx.fillText(rangeText, canvas.width / 2, 1170);
      ctx.restore();
    } else if (state.videoTemplate === "basit_player") {
      // Draw centered oval/ellipse photo of reciter
      // Center of oval: x = 360, y = 520 (middle section is from y = 380 to y = 900)
      const ovalW = 360;
      const ovalH = 260;
      const ovalX = 360;
      const ovalY = 525;

      if (templatePhoto) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(ovalX, ovalY, ovalW / 2, ovalH / 2, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(templatePhoto, ovalX - ovalW / 2, ovalY - ovalH / 2, ovalW, ovalH);
        ctx.restore();
        
        // Soft border around the oval
        ctx.save();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(ovalX, ovalY, ovalW / 2, ovalH / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Progress bar below the oval
      const progressPct = ayahProgress || 0;
      const barX = 180;
      const barY = 690;
      const barW = 360;
      
      ctx.save();
      // Track line (thin grey/black)
      ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
      ctx.fillRect(barX, barY, barW, 2.5);
      // Progress line (solid black)
      ctx.fillStyle = "#000000";
      ctx.fillRect(barX, barY, barW * progressPct, 2.5);
      // Knob dot (black circle)
      ctx.beginPath();
      ctx.arc(barX + barW * progressPct, barY + 1.25, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Controls Row (Shuffle / Prev / Play (Circle) / Next / Repeat) in Black
      const ctrlY = 740;

      // Play circle filled with black, white play/pause icon in center
      ctx.save();
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(360, ctrlY, 20, 0, Math.PI * 2);
      ctx.fill();
      
      // Inside circle: white play/pause icon
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(353, ctrlY - 7, 4, 14);
      ctx.fillRect(363, ctrlY - 7, 4, 14);
      ctx.restore();

      // Shuffle icon at x = 360 - 130 = 230
      ctx.save();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.translate(220, ctrlY - 10);
      ctx.beginPath();
      ctx.moveTo(0, 5); ctx.lineTo(5, 5); ctx.lineTo(13, 15); ctx.lineTo(18, 15);
      ctx.moveTo(0, 15); ctx.lineTo(5, 15); ctx.lineTo(13, 5); ctx.lineTo(18, 5);
      ctx.stroke();
      // arrow heads
      ctx.beginPath();
      ctx.moveTo(15, 2); ctx.lineTo(18, 5); ctx.lineTo(15, 8);
      ctx.moveTo(15, 12); ctx.lineTo(18, 15); ctx.lineTo(15, 18);
      ctx.stroke();
      ctx.restore();

      // Prev icon at x = 360 - 70 = 290
      ctx.save();
      ctx.fillStyle = "#000000";
      ctx.translate(280, ctrlY - 10);
      ctx.beginPath();
      ctx.moveTo(17, 18); ctx.lineTo(5, 10); ctx.lineTo(17, 2);
      ctx.fill();
      ctx.fillRect(4, 2, 2.5, 16);
      ctx.restore();

      // Next icon at x = 360 + 70 = 430
      ctx.save();
      ctx.fillStyle = "#000000";
      ctx.translate(420, ctrlY - 10);
      ctx.beginPath();
      ctx.moveTo(2, 2); ctx.lineTo(14, 10); ctx.lineTo(2, 18);
      ctx.fill();
      ctx.fillRect(14, 2, 2.5, 16);
      ctx.restore();

      // Repeat icon at x = 360 + 130 = 490
      ctx.save();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2.5;
      ctx.translate(480, ctrlY - 10);
      ctx.beginPath();
      ctx.arc(9, 10, 7, -Math.PI/4, 1.25 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(13, 2); ctx.lineTo(16, 5); ctx.lineTo(13, 8);
      ctx.stroke();
      ctx.restore();

      // Sheikh English Name below controls
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
      ctx.shadowBlur = 4;
      ctx.font = "bold 22px 'Times New Roman', Georgia, serif";
      ctx.fillText(getReciterEnglishName(state.reciterId), 360, 815);
      ctx.restore();

      // Draw Surah Name in bottom black section (y from 900 to 1280)
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 34px 'Noto Naskh Arabic', Amiri, sans-serif";
      ctx.fillText(surahName || "سورة", 360, 1090);
      ctx.restore();
    } else if (state.videoTemplate === "minshawi_player") {
      // Draw Minshawi player
      const cardX = 80;
      const cardY = 450;
      const cardW = 560;
      const cardH = 380;
      
      ctx.save();
      ctx.fillStyle = "#000000";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(cardX, cardY, cardW, cardH, 95);
      } else {
        ctx.rect(cardX, cardY, cardW, cardH);
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      
      if (templatePhoto) {
        ctx.save();
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(190, 475, 340, 200, 45);
        } else {
          ctx.rect(190, 475, 340, 200);
        }
        ctx.clip();
        ctx.drawImage(templatePhoto, 190, 475, 340, 200);
        ctx.restore();
      }
      
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px 'Noto Naskh Arabic', serif";
      ctx.fillText(surahName || "سورة", 190, 707);
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "15px Arial";
      ctx.fillText(getReciterEnglishName(state.reciterId), 190, 733);
      ctx.restore();
      
      // progress bar
      const progressPct = ayahProgress || 0;
      ctx.save();
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(190, 760, 340, 4);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(190, 760, 340 * progressPct, 4);
      ctx.beginPath();
      ctx.arc(190 + 340 * progressPct, 762, 6, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
      
      // play button and controls
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(360, 805, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000000";
      ctx.fillRect(351, 799, 4, 12);
      ctx.fillRect(359, 799, 4, 12);
      ctx.restore();
    } else {
      // 5. Text Animation & Rendering
      // ayahProgress goes from 0 to 1
      let opacity = 1;
      let scale = 1;
      let translateY = state.textVerticalOffset || 0;
      let blur = 0;

      const ap = Math.min(1, ayahProgress * 2);
      if (state.animation === "fade") { opacity = ap; }
      if (state.animation === "scale") { scale = 0.8 + (ap * 0.2); opacity = ap; }
      if (state.animation === "slide") { translateY += (1 - ap) * 100; opacity = ap; }
      if (state.animation === "blur") { blur = (1 - ap) * 20; opacity = ap; }
      if (state.animation === "zoom") { scale = 1.5 - (ap * 0.5); opacity = ap; }
      if (state.animation === "flip") { scale = 1 - (1 - ap) * 0.5; opacity = ap; }
      if (state.animation === "bounce") { scale = 0.9 + Math.sin(ap * Math.PI * 3) * 0.1; opacity = ap; }
      if (state.animation === "glitch") { if (ap < 0.9) { opacity = Math.random() > 0.9 ? 0 : 1; translateY += (Math.random() - 0.5) * 20; } else { opacity = 1; } }
      if (state.animation === "rotate") { opacity = ap; scale = ap; }
      if (state.animation === "wave") { translateY += Math.sin(Date.now() / 200 + 0) * (1 - ap) * 30; opacity = ap; }
      if (state.animation === "elastic") { scale = 0.5 + (ap * 0.5) + Math.sin(ap * Math.PI * 4) * (1 - ap) * 0.2; opacity = ap; }
      if (state.animation === "swing") { const rot = (1 - ap) * 30 * Math.sin(ap * Math.PI * 2); ctx.rotate(rot * Math.PI / 180); opacity = ap; }
      if (state.animation === "typewriter") { opacity = ap; }
      if (state.animation === "spiral") { translateY += (1 - ap) * 200; const rot = (1 - ap) * 720; ctx.rotate(rot * Math.PI / 180); opacity = ap; }
      if (state.animation === "cinematic") { scale = 1 + (1 - ap) * 0.3; opacity = Math.min(1, ap * 3); }
      if (state.animation === "split") { opacity = ap; }

      ctx.save();
      let centerY = canvas.height / 2;
      if (state.textPosition === "top") centerY = canvas.height * 0.28;
      else if (state.textPosition === "bottom") centerY = canvas.height * 0.72;
      ctx.translate(canvas.width/2, centerY + translateY);
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
    }

    ctx.restore();
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl font-['Tajawal']`}>
      <canvas ref={canvasRef} style={{ position: 'fixed', left: '-10000px', top: 0 }} />
      
      <div className="relative w-full max-w-xl bg-[#0c0d10] border border-white/10 rounded-[3.5rem] p-10 flex flex-col items-center shadow-[0_40px_120px_rgba(0,0,0,0.6)] overflow-hidden force-dark">
        {/* Pattern */}
        <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
        
        {/* Close Button */}
        <button onClick={handleClose} className="absolute top-8 left-8 text-white/20 hover:text-white transition-all">
            <X className="w-8 h-8" />
        </button>

        {isRenderDisabled ? (
          <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center py-10">
            <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 flex items-center justify-center mb-8 border border-red-500/20">
              <AlertCircle className="w-12 h-12 text-red-500 animate-bounce" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">خدمة الرندر غير متوفرة حالياً</h3>
            <p className="text-white/60 text-sm text-center mb-10 px-8 leading-relaxed font-arabic">
              {renderConfig.message || "السيرفر تحت الصيانة حالياً لترقية وتحسين خوادم المعالجة السحابية. يرجى المحاولة مرة أخرى لاحقاً."}
            </p>
            <button 
              onClick={handleClose} 
              className="w-full bg-white/5 text-white/70 py-5 rounded-[1.5rem] font-black border border-white/10 hover:bg-white/10 transition-all"
            >
              إغلاق النافذة
            </button>
          </div>
        ) : !auth?.currentUser && isLimitReached ? (
          <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center py-10">
            <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 flex items-center justify-center mb-8 border border-red-500/20">
              <Lock className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-4">فترة انتظار الزوار</h3>
            <p className="text-white/40 text-sm text-center mb-10 px-8 leading-relaxed font-arabic">
              يرجى الانتظار <span className="text-primary font-bold font-mono">{cooldownTimeLeft !== null ? `${Math.floor(cooldownTimeLeft / 60)} دقيقة و ${cooldownTimeLeft % 60} ثانية` : '30 دقيقة'}</span> لإنشاء فيديو آخر كزائر. نطبق هذا الانتظار لنحافظ على مجانية الخدمة وتغطية تكاليف الخوادم لنساعد أكبر عدد ممكن من المسلمين في نشر كتاب الله. يمكنك تسجيل الدخول لتقليل الانتظار.
            </p>
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
            <h3 className="text-2xl font-black text-white mb-4">فترة انتظار التصدير</h3>
            <p className="text-white/40 text-sm text-center mb-10 px-8 leading-relaxed font-arabic">
              طبقاً لخطة تبرعك الحالي، يرجى الانتظار <span className="text-primary font-bold font-mono">{cooldownTimeLeft !== null ? `${Math.floor(cooldownTimeLeft / 60)} دقيقة و ${cooldownTimeLeft % 60} ثانية` : '15 دقيقة'}</span> قبل تصدير الفيديو التالي. نطبق فترات الانتظار لضمان استقرار السيرفرات السحابية وتوزيع الموارد بشكل عادل، لنحافظ على مجانية الموقع ونساعد أكبر عدد من المستخدمين في تصميم ونشر القرآن الكريم.
            </p>
            <button onClick={() => { onClose(); onOpenSubscription(); }} className="w-full bg-primary text-black py-5 rounded-[1.5rem] font-black shadow-2xl hover:scale-105 transition-all">ترقية خطة التبرع لسرعة أكبر</button>
          </div>
        ) : status === "idle" ? (
          <>
            <div className="w-full flex items-center justify-between mb-12">
                <div className="text-right">
                    <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1 block">الحالة الحالية</span>
                    <span className="text-base font-black text-white">{!auth?.currentUser ? 'زائر' : userPlan?.plan === 'free' ? 'العضوية المجانية' : 'عضوية التميز'}</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="text-right">
                    <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1 block">الرندرة المتاحة</span>
                    <span className="text-base font-black text-white">{!auth?.currentUser ? '1 فيديو' : userPlan?.plan === 'free' ? `${5 - (userPlan?.count || 0)} فيديوهات` : 'غير محدود'}</span>
                </div>
            </div>

            <div className="w-24 h-24 rounded-[2.5rem] bg-primary flex items-center justify-center mb-10 shadow-[0_20px_50px_rgba(212,175,55,0.2)]">
              <Play className="w-10 h-10 text-black fill-current" />
            </div>
            
            <h3 className="font-['Amiri'] text-4xl font-black text-white mb-2">تجهيز العمل الفني</h3>
            <p className="text-white/40 text-xs text-center mb-10 uppercase tracking-widest">اختر دقة الإخراج والجودة المطلوبة</p>
            
            <div className="w-full space-y-4 mb-6">
                <button onClick={() => setRenderMode("server")} className={`w-full p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between gap-4 text-right ${renderMode === "server" ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                    <div className="flex flex-col items-start gap-1 flex-1">
                        <span className="text-base font-black text-white flex items-center gap-2">
                          الرندرة السحابية الفائقة
                          <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">موصى به</span>
                        </span>
                        <span className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">فيديو MP4 حقيقي يعمل على كل الأجهزة والآيفون والواتساب بنسبة 100%</span>
                    </div>
                    <Crown className="w-6 h-6 text-primary shrink-0" />
                </button>
                <button onClick={() => setRenderMode("browser")} className={`w-full p-6 rounded-[2rem] border-2 transition-all flex flex-col items-start gap-1 text-right ${renderMode === "browser" ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:bg-white/10"}`}>
                    <span className="text-base font-black text-white">رندرة المتصفح السريعة</span>
                    <span className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">تصدير فوري بصيغة WebM (قد لا يشتغل على بعض هواتف الآيفون والواتساب)</span>
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
              <>
                <p className="text-red-500 text-xs md:text-sm font-bold text-center mb-8 px-6 leading-relaxed font-arabic bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                  {message || "حدث خطأ غير متوقع أثناء المعالجة."}
                </p>
                <button onClick={() => setStatus("idle")} className="w-full bg-white/5 text-white py-5 rounded-[1.5rem] font-black border border-white/10 hover:bg-white/10 transition-all">إعادة المحاولة</button>
              </>
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
