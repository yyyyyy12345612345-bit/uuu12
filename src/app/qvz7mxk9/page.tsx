"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Download, Loader2, CheckCircle2, AlertCircle, Send, Clock,
  ChevronLeft, X, Play, RefreshCw
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import {
  getDocs, collection, addDoc, serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";

// Custom YouTube SVG icon
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

// ==========================================
// YAQEEN WIDE STUDIO — Secret YouTube Page
// Route: /qvz7mxk9 (hidden, not in nav/sitemap)
// Purpose: Render + publish 1920x1080 YouTube videos
// ==========================================

type Status = "idle" | "rendering" | "success" | "error";

interface YoutubeAccount {
  id: string;
  channelId: string;
  channelTitle: string;
  channelHandle: string;
  avatar: string;
  subscriberCount: number;
}

export default function WideStudioPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  // YouTube publish states
  const [ytAccounts, setYtAccounts] = useState<YoutubeAccount[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [ytTitle, setYtTitle] = useState("");
  const [ytDescription, setYtDescription] = useState("");
  const [ytTags, setYtTags] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState("");

  // Video config
  const [surahName, setSurahName] = useState("الفاتحة");
  const [reciterName, setReciterName] = useState("مشاري العفاسي");
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(7);
  const [videoUrl, setVideoUrl] = useState(""); // paste rendered video URL

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("youssefosama@gmail.com");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const isAdmin = React.useMemo(() => {
    const email = currentUser?.email?.toLowerCase() || "";
    return (
      email === "youssefosama@gmail.com" ||
      email === "youssef@yaqeen.app" ||
      email.includes("youssef")
    );
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      if (!auth) throw new Error("Firebase Auth غير مهيأ");
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError(err.message || "فشل تسجيل الدخول");
    } finally {
      setLoginLoading(false);
    }
  };

  // Load YouTube accounts
  useEffect(() => {
    if (!isAdmin || !db) return;
    getDocs(collection(db, "youtube_accounts"))
      .then((snap) => {
        const list: YoutubeAccount[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as any));
        setYtAccounts(list);
        if (list.length > 0) setSelectedChannelId(list[0].id);
      })
      .catch(console.error);
  }, [isAdmin]);

  // Auto-generate YouTube caption when success
  useEffect(() => {
    if (status === "success") {
      const ayahText =
        startAyah === endAyah
          ? `آية ${startAyah}`
          : `الآيات من ${startAyah} إلى ${endAyah}`;

      const sTag = surahName.replace(/\s+/g, "_");
      const rTag = reciterName.split(" (")[0]?.trim().replace(/\s+/g, "_") || "";

      setYtTitle(`سورة ${surahName} - ${ayahText} - الشيخ ${reciterName} 📖`);
      setYtDescription(
        `📖 سورة ${surahName} | ${ayahText}\n` +
        `🎙 تلاوة بصوت الشيخ ${reciterName}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🌟 اشترك في القناة وفعّل الجرس 🔔 للمزيد من التلاوات القرآنية\n\n` +
        `📱 صنع الفيديو مجاناً على موقع يقين القرآن:\n` +
        `🔗 yaqeenalquran.online\n\n` +
        `⭐ يمكنك تصميم فيديوهاتك القرآنية بنفسك في أقل من 3 دقائق!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `#قرآن #قران_كريم #تلاوة_قرآنية #سورة_${sTag} #${rTag} ` +
        `#Quran #QuranRecitation #Islam #islamicvideo #قرآن_كريم #يقين_القران`
      );
      setYtTags(
        `قرآن, قران كريم, تلاوة قرآنية, سورة ${surahName}, ${reciterName}, Quran, QuranRecitation, Islam, يقين القران, yaqeenalquran`
      );
      setPublishSuccess(false);
      setPublishError("");
      setIsScheduled(false);
      setScheduledTime("");
    }
  }, [status, surahName, reciterName, startAyah, endAyah]);

  // Trigger wide render (1920x1080)
  const handleRender = async () => {
    setStatus("rendering");
    setProgressPct(10);
    setMessage("جاري إرسال طلب الرندرة العريضة...");
    setError("");
    setDownloadUrl(null);

    try {
      const fakeConfig = {
        surahId: "1",
        reciterId: "mishary",
        startAyah,
        endAyah,
        width: 1920,
        height: 1080,
        orientation: "landscape",
      };

      setProgressPct(30);
      setMessage("جاري رندرة فيديو 1920×1080...");

      const res = await fetch("/api/render-wide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fakeConfig),
      });

      setProgressPct(80);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Server error" }));
        throw new Error(errData.error || "Wide render failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setProgressPct(100);
      setMessage("تم الانتهاء!");
      setStatus("success");
    } catch (e: any) {
      setError(e.message || "حدث خطأ غير متوقع");
      setStatus("error");
    }
  };

  const handlePublishToYouTube = async () => {
    const urlToPublish = downloadUrl || videoUrl;
    if (!urlToPublish) {
      alert("يرجى رندرة الفيديو أو إدخال رابط الفيديو أولاً.");
      return;
    }
    if (!ytTitle.trim()) {
      alert("يرجى كتابة عنوان الفيديو.");
      return;
    }
    if (isScheduled && !scheduledTime) {
      alert("يرجى تحديد وقت الجدولة.");
      return;
    }

    setPublishing(true);
    setPublishError("");
    setPublishSuccess(false);

    try {
      const adminToken = await auth.currentUser?.getIdToken();
      if (!adminToken) throw new Error("فشل التحقق من جلسة المسؤول.");

      const res = await fetch("/api/youtube/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannelId || ytAccounts[0]?.id,
          videoUrl: urlToPublish,
          title: ytTitle.substring(0, 100),
          description: ytDescription,
          tags: ytTags.split(",").map((t) => t.trim()).filter(Boolean),
          scheduledFor: isScheduled ? scheduledTime : null,
          adminToken,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل نشر الفيديو على يوتيوب");

      setPublishSuccess(true);
    } catch (e: any) {
      setPublishError(e.message || "حدث خطأ غير متوقع.");
    } finally {
      setPublishing(false);
    }
  };

  const handleLinkYouTube = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      alert("يرجى تسجيل الدخول أولاً.");
      return;
    }
    const width = 600, height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open(
      `/api/auth/youtube?token=${encodeURIComponent(token)}`,
      "YouTubeAuth",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
    const handleMsg = (event: MessageEvent) => {
      if (event.data?.type === "YOUTUBE_LINKED" && event.data?.success) {
        window.location.reload();
        window.removeEventListener("message", handleMsg);
      }
    };
    window.addEventListener("message", handleMsg);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-arabic" dir="rtl">
        <div className="flex flex-col items-center gap-3 text-white/50">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <span className="text-xs font-bold">جاري التحقق من صلاحيات المشرف...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 font-arabic" dir="rtl">
        <div className="w-full max-w-md bg-white/[0.04] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center mx-auto shadow-lg shadow-red-600/30">
              <YouTubeIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-black text-white">استوديو يوتيوب العريض</h1>
            <p className="text-xs text-white/50">يرجى تسجيل الدخول بحساب المشرف للوصول إلى الاستوديو</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center font-bold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-white/60 block mb-1">البريد الإلكتروني للمسؤول</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 transition"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-white/60 block mb-1">كلمة المرور</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 transition"
                dir="ltr"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-sm transition shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تسجيل الدخول إلى الاستوديو"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-arabic" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-white/10 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
            <YouTubeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">استوديو يوتيوب العريض 🎬</h1>
            <p className="text-xs text-white/40 font-bold">رندرة ونشر فيديوهات 1920×1080 على يوتيوب</p>
          </div>
        </div>

        {/* YouTube Account */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <YouTubeIcon className="w-4 h-4 text-red-500" />
            حساب يوتيوب
          </h2>
          {ytAccounts.length === 0 ? (
            <button
              onClick={handleLinkYouTube}
              className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white font-black rounded-xl hover:brightness-110 transition text-xs"
            >
              <YouTubeIcon className="w-4 h-4" />
              ربط قناة يوتيوب
            </button>
          ) : (
            <div className="space-y-2">
              <select
                value={selectedChannelId}
                onChange={(e) => setSelectedChannelId(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl p-3 text-sm text-white outline-none"
              >
                {ytAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.channelTitle} {acc.channelHandle ? `(${acc.channelHandle})` : ""}
                  </option>
                ))}
              </select>
              <button
                onClick={handleLinkYouTube}
                className="text-xs text-white/40 hover:text-white/60 transition font-bold flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                ربط قناة أخرى
              </button>
            </div>
          )}
        </div>

        {/* Video URL (paste from render output or HF server) */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-black text-white">رابط الفيديو العريض</h2>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://... رابط مباشر لملف MP4 الفيديو العريض"
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl p-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-red-500/40"
          />
          <p className="text-[10px] text-white/30 font-bold">
            الصق رابط الفيديو العريض الذي حصلت عليه من سيرفر الرندرة أو من جهازك
          </p>
        </div>

        {/* YouTube Caption */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-black text-white">تفاصيل المنشور على يوتيوب 📝</h2>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-white/40 block">عنوان الفيديو (Title) — أقصى 100 حرف</label>
            <input
              type="text"
              value={ytTitle}
              onChange={(e) => setYtTitle(e.target.value)}
              maxLength={100}
              placeholder="سورة الفاتحة - آيات 1-7 - الشيخ مشاري العفاسي 📖"
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl p-3 text-sm text-white outline-none focus:border-red-500/40 placeholder:text-white/20"
            />
            <span className="text-[9px] text-white/20">{ytTitle.length}/100</span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-white/40 block">وصف الفيديو (Description) — أقوى وصف ممكن</label>
            <textarea
              value={ytDescription}
              onChange={(e) => setYtDescription(e.target.value)}
              rows={8}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl p-3 text-sm text-white outline-none resize-none focus:border-red-500/40 placeholder:text-white/20 leading-relaxed"
              placeholder="اكتب وصفاً شاملاً للفيديو مع الهاشتاجات..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-white/40 block">
              Tags (مفصولة بفاصلة ,)
            </label>
            <input
              type="text"
              value={ytTags}
              onChange={(e) => setYtTags(e.target.value)}
              placeholder="قرآن, تلاوة, Quran..."
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl p-3 text-sm text-white outline-none focus:border-red-500/40 placeholder:text-white/20"
            />
          </div>

          {/* Scheduling */}
          <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
            <input
              type="checkbox"
              id="yt-schedule"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="w-4 h-4 accent-red-500 cursor-pointer"
            />
            <label htmlFor="yt-schedule" className="text-xs font-bold text-white/80 cursor-pointer flex items-center gap-1.5">
              جدولة النشر لاحقاً
              <Clock className="w-3.5 h-3.5 text-red-500" />
            </label>
          </div>

          {isScheduled && (
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl p-3 text-sm text-white outline-none focus:border-red-500/40"
            />
          )}

          {/* Feedback */}
          {publishError && (
            <p className="text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              {publishError}
            </p>
          )}
          {publishSuccess && (
            <p className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {isScheduled ? "تمت جدولة الفيديو على يوتيوب بنجاح! 🎉" : "تم رفع الفيديو على يوتيوب بنجاح! 🎉"}
            </p>
          )}

          {/* Publish Button */}
          <button
            onClick={handlePublishToYouTube}
            disabled={publishing || publishSuccess || (!videoUrl && !downloadUrl)}
            className="w-full py-4 bg-red-600 hover:brightness-110 text-white font-black rounded-2xl transition disabled:opacity-40 text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
          >
            {publishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isScheduled ? "جاري الجدولة..." : "جاري الرفع على يوتيوب..."}
              </>
            ) : (
              <>
                <YouTubeIcon className="w-4 h-4" />
                {isScheduled ? "جدولة على يوتيوب" : "نشر الآن على يوتيوب"}
              </>
            )}
          </button>
        </div>

        {/* Status/Error */}
        {status === "error" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm text-red-400 font-bold text-center">
            {error}
          </div>
        )}

      </div>
    </div>
  );
}
