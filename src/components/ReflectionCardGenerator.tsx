"use client";

import React, { useRef, useState, useEffect } from "react";
import { Download, Share2, Palette, X, Check, Loader2 } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface ReflectionCardGeneratorProps {
  verseText: string;
  verseKey: string;
  surahName: string;
  reflectionText: string;
  onClose: () => void;
  onShareSuccess: () => void;
}

type CardStyle = "emerald-gold" | "midnight" | "royal-purple" | "sunset-crimson" | "glass";

interface StyleOption {
  id: CardStyle;
  name: string;
  background: string;
  textColor: string;
  accentColor: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: "emerald-gold",
    name: "زمردي ذهبي",
    background: "linear-gradient(135deg, #092c20 0%, #03130d 100%)",
    textColor: "#f3f4f6",
    accentColor: "#d4af37"
  },
  {
    id: "midnight",
    name: "حلك الليل",
    background: "linear-gradient(135deg, #0f172a 0%, #020617 100%)",
    textColor: "#f3f4f6",
    accentColor: "#38bdf8"
  },
  {
    id: "royal-purple",
    name: "بنفسجي ملكي",
    background: "linear-gradient(135deg, #2e1065 0%, #090514 100%)",
    textColor: "#f3f4f6",
    accentColor: "#c084fc"
  },
  {
    id: "sunset-crimson",
    name: "شفق القرمزي",
    background: "linear-gradient(135deg, #4c0519 0%, #1c0007 100%)",
    textColor: "#f3f4f6",
    accentColor: "#fb7185"
  },
  {
    id: "glass",
    name: "بلوري غائم",
    background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
    textColor: "#ffffff",
    accentColor: "#a7f3d0"
  }
];

export function ReflectionCardGenerator({
  verseText,
  verseKey,
  surahName,
  reflectionText,
  onClose,
  onShareSuccess
}: ReflectionCardGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedStyle, setSelectedStyle] = useState<CardStyle>("emerald-gold");
  const [sharing, setSharing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const activeStyle = STYLE_OPTIONS.find((s) => s.id === selectedStyle) || STYLE_OPTIONS[0];

  // Draw card on canvas
  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high resolution for downloading (1200x1200 px square)
    const W = 1200;
    const H = 1200;
    canvas.width = W;
    canvas.height = H;

    // 1. Draw Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    if (selectedStyle === "emerald-gold") {
      gradient.addColorStop(0, "#092c20");
      gradient.addColorStop(1, "#03130d");
    } else if (selectedStyle === "midnight") {
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(1, "#020617");
    } else if (selectedStyle === "royal-purple") {
      gradient.addColorStop(0, "#2e1065");
      gradient.addColorStop(1, "#090514");
    } else if (selectedStyle === "sunset-crimson") {
      gradient.addColorStop(0, "#4c0519");
      gradient.addColorStop(1, "#1c0007");
    } else {
      // Glass/slate
      gradient.addColorStop(0, "#1e293b");
      gradient.addColorStop(1, "#0f172a");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // 2. Decorative Border (Islamic Ornament Style)
    ctx.strokeStyle = activeStyle.accentColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    ctx.strokeStyle = activeStyle.accentColor + "40"; // 25% opacity
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, W - 110, H - 110);

    // Decorative Corners
    const drawCorner = (x: number, y: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.strokeStyle = activeStyle.accentColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(0, 0);
      ctx.lineTo(40, 0);
      ctx.stroke();
      ctx.restore();
    };
    drawCorner(40, 40, 0);
    drawCorner(W - 40, 40, Math.PI / 2);
    drawCorner(W - 40, W - 40, Math.PI);
    drawCorner(40, W - 40, -Math.PI / 2);

    // 3. Header text
    ctx.fillStyle = activeStyle.accentColor;
    ctx.font = "bold 28px Tajawal, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("وَتَدَبَّرُوا 🌟 خاطرة وتدبر آية كَرِيمة", W / 2, 110);

    // 4. Draw Quranic symbol/divider
    ctx.strokeStyle = activeStyle.accentColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 120, 150);
    ctx.lineTo(W / 2 + 120, 150);
    ctx.stroke();
    // Center diamond
    ctx.fillStyle = activeStyle.accentColor;
    ctx.beginPath();
    ctx.arc(W / 2, 150, 8, 0, Math.PI * 2);
    ctx.fill();

    // 5. Draw Quranic Verse (Amiri font)
    ctx.fillStyle = "#ffffff";
    // Check if Amiri is loaded, otherwise fallback to Georgia/serif
    ctx.font = "bold 46px Amiri, Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add quotes around the verse
    const fullVerseText = `« ${verseText.trim()} »`;
    const verseLines = wrapText(ctx, fullVerseText, W - 200);
    
    let currentY = 280;
    // Calculate total height of verse to center it roughly
    const verseLineHeight = 85;
    
    verseLines.forEach((line) => {
      ctx.fillText(line, W / 2, currentY);
      currentY += verseLineHeight;
    });

    // 6. Draw Verse Info Label (e.g. سورة الفاتحة - آية 1)
    currentY += 15;
    ctx.fillStyle = activeStyle.accentColor;
    ctx.font = "bold 24px Tajawal, sans-serif";
    ctx.fillText(`[ سورة ${surahName} • الآية ${verseKey.split(":")[1]} ]`, W / 2, currentY);

    // 7. Divider before reflection
    currentY += 60;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, currentY);
    ctx.lineTo(W - 200, currentY);
    ctx.stroke();

    // 8. Draw User Reflection Title
    currentY += 60;
    ctx.fillStyle = activeStyle.accentColor;
    ctx.font = "black 28px Tajawal, sans-serif";
    ctx.fillText("خاطرة وتدبر العبد:", W / 2, currentY);

    // 9. Draw Reflection Text
    currentY += 60;
    ctx.fillStyle = activeStyle.textColor;
    ctx.font = "medium 34px Tajawal, sans-serif";
    
    const reflectionLines = wrapText(ctx, reflectionText, W - 250);
    const reflectionLineHeight = 55;
    
    reflectionLines.forEach((line) => {
      ctx.fillText(line, W / 2, currentY);
      currentY += reflectionLineHeight;
    });

    // 10. Draw Footer Signature
    ctx.fillStyle = activeStyle.accentColor + "90";
    ctx.font = "bold 20px Tajawal, sans-serif";
    ctx.fillText("تطبيق ومجتمع يقين للهواتف الذكية ✨", W / 2, H - 90);

    // Generate preview URL
    setPreviewUrl(canvas.toDataURL("image/png"));
  };

  // Helper to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        lines.push(currentLine.trim());
        currentLine = words[n] + " ";
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine.trim());
    return lines;
  };

  useEffect(() => {
    // Redraw whenever style changes
    drawCard();
  }, [selectedStyle, reflectionText, verseText]);

  // Download png function
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `tadabbor_${surahName}_${verseKey.replace(":", "_")}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share to community feed function
  const handleShareToCommunity = async () => {
    const user = auth?.currentUser;
    if (!user || !db) {
      alert("يجب عليك تسجيل الدخول أولاً للمشاركة في المجتمع");
      return;
    }

    setSharing(true);
    try {
      // Create a new post in the posts collection
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        displayName: user.displayName || "قارئ يقين",
        photoURL: user.photoURL || "",
        username: user.email?.split("@")[0] || "user",
        text: `💡 تَدَبُّر في سورة ${surahName} (الآية ${verseKey.split(":")[1]}):\n\n"${reflectionText}"`,
        createdAt: serverTimestamp(),
        likes: [],
        reportsCount: 0,
        isBlocked: false,
        // Reflection specific metadata to render as card
        isReflection: true,
        verseKey,
        surahName,
        verseText,
        reflectionText,
        theme: selectedStyle
      });

      alert("تم النشر في مجتمع يقين بنجاح! 🎉");
      onShareSuccess();
    } catch (e) {
      console.error("Failed to share reflection post:", e);
      alert("حدث خطأ أثناء النشر، حاول مجدداً");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 md:p-6 font-['Tajawal'] select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

      {/* Main Modal Container */}
      <div className="relative w-full max-w-4xl bg-[#090a0d] border border-white/10 rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Left/Top: Live Canvas preview */}
        <div className="flex-1 flex items-center justify-center p-6 bg-black/20 border-b lg:border-b-0 lg:border-l border-white/5 overflow-hidden">
          <div className="relative w-full max-w-[400px] aspect-square rounded-[2rem] overflow-hidden border border-white/10 shadow-inner group">
            {/* Hidden canvas used for rendering */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Preview image */}
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Tadabbor Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-card">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Right/Bottom: Controls panel */}
        <div className="w-full lg:w-[400px] flex flex-col p-8 md:p-10 text-right overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 left-6 w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/5 transition-all z-10"
          >
            <X className="w-5 h-5 text-white/40 hover:text-white" />
          </button>

          <div className="flex items-center gap-2 mb-6">
            <div className="h-px w-8 bg-primary/30" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">تصميم بطاقة التدبر</span>
          </div>

          <h3 className="text-2xl font-black text-white mb-2 leading-tight">اصنع بطاقتك الدعوية</h3>
          <p className="text-xs text-white/40 font-bold mb-8 leading-relaxed">
            اختر قالباً وتصميماً يناسب خاطرتك لتنزيله كصورة أو مشاركته مع إخوتك في المجتمع الإيماني.
          </p>

          {/* Style Selector */}
          <div className="mb-10">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">النمط والخلفية</p>
            <div className="grid grid-cols-2 gap-3">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`relative p-3.5 rounded-2xl text-right transition-all border flex items-center gap-3 overflow-hidden ${
                    selectedStyle === style.id
                      ? "border-primary bg-primary/10 text-white"
                      : "border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full border border-white/20 shrink-0 flex items-center justify-center"
                    style={{ background: style.background }}
                  >
                    {selectedStyle === style.id && (
                      <Check className="w-3 h-3 text-white fill-white" />
                    )}
                  </div>
                  <span className="text-xs font-black truncate">{style.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto space-y-3">
            <button
              onClick={handleDownload}
              className="w-full py-4.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-3 text-white text-sm font-black transition-all"
            >
              <Download className="w-4 h-4 text-primary" />
              <span>تنزيل الصورة لجهازك</span>
            </button>

            <button
              disabled={sharing}
              onClick={handleShareToCommunity}
              className="w-full py-4.5 rounded-2xl bg-primary text-black flex items-center justify-center gap-3 text-sm font-black transition-all shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {sharing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4 fill-current" />
              )}
              <span>انشر في مجتمع يقين</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
