"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Download, Smartphone, Laptop, CheckCircle2, ShieldCheck, 
  ArrowRight, BookOpen, Volume2, Compass, Bell,
  Sun, Moon, Share2, HelpCircle
} from "lucide-react";

export default function DownloadPage() {
  const [activeTab, setActiveTab] = useState<"android" | "ios" | "pc">("android");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [detectedOS, setDetectedOS] = useState<string>("جاري الفحص...");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent || "";
    const isAndroid = /android/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;

    if (isAndroid) {
      setDetectedOS("هاتف أندرويد");
      setActiveTab("android");
    } else if (isIOS) {
      setDetectedOS("آيفون / آيباد (Apple)");
      setActiveTab("ios");
    } else {
      setDetectedOS("كمبيوتر / سطح المكتب");
      setActiveTab("pc");
    }

    // Default to White Mode, but check saved preference if any
    const saved = localStorage.getItem("yaqeen_dl_theme");
    if (saved === "dark") {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("yaqeen_dl_theme", next ? "dark" : "light");
  };

  return (
    <div className={`min-h-screen font-arabic transition-colors duration-300 ${
      isDarkMode 
        ? "bg-[#090b10] text-slate-100" 
        : "bg-[#f8fafc] text-slate-800"
    }`}>

      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-3xl opacity-30 ${
          isDarkMode ? "bg-amber-600/15" : "bg-amber-400/20"
        }`} />
        <div className={`absolute bottom-10 right-10 w-[400px] h-[300px] rounded-full blur-3xl opacity-20 ${
          isDarkMode ? "bg-emerald-600/10" : "bg-emerald-400/15"
        }`} />
      </div>

      {/* Top Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors ${
        isDarkMode 
          ? "bg-[#090b10]/90 border-slate-800/80" 
          : "bg-white/90 border-slate-200/80 shadow-sm"
      }`}>
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-right no-underline">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-500/30 flex items-center justify-center text-xl shadow-sm">
              📖
            </div>
            <div>
              <h1 className={`text-base font-black leading-none ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>
                يَقِين القُرْآن
              </h1>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                تطبيق الموبايل الرسمي
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm transition-all ${
                isDarkMode 
                  ? "bg-slate-800/80 border-slate-700 text-amber-400 hover:bg-slate-700" 
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 shadow-sm"
              }`}
              title="تبديل المظهر"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isDarkMode 
                  ? "bg-slate-800 border-slate-700 text-slate-200 hover:border-amber-500" 
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-500 hover:text-amber-700 shadow-sm"
              }`}
            >
              <span>الرئيسية</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-xl mx-auto px-4 py-6 pb-20 space-y-5">

        {/* Hero Card */}
        <div className={`rounded-3xl border p-5 md:p-6 transition-all relative overflow-hidden ${
          isDarkMode 
            ? "bg-[#12151f] border-slate-800 shadow-2xl" 
            : "bg-white border-slate-200/90 shadow-lg shadow-slate-200/50"
        }`}>
          {/* Gold Accent Top Bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600" />

          {/* App Info Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border-2 border-amber-500/40 flex items-center justify-center text-4xl shadow-md shrink-0">
              📖
            </div>
            <div className="text-right flex-1 min-w-0">
              <h2 className={`text-xl font-black ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>
                يقين القرآن الكريم
              </h2>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                النسخة الرسمية V 22 · استقرار تام في الخلفية
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300">
                  4.9 تقييم ممتاز
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                  🛡️ خالٍ من الإعلانات 100%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className={`grid grid-cols-3 gap-2 p-3 rounded-2xl border text-center mb-5 ${
            isDarkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200/80"
          }`}>
            <div>
              <strong className={`block text-sm font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                9.2 MB
              </strong>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                حجم خفيف جداً
              </span>
            </div>
            <div className="border-x border-slate-200 dark:border-slate-800">
              <strong className={`block text-sm font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                114 سورة
              </strong>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                المصحف كاملاً
              </span>
            </div>
            <div>
              <strong className={`block text-sm font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                بدون إنترنت
              </strong>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                يعمل أوفلاين
              </span>
            </div>
          </div>

          {/* Auto-detected OS Banner */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs mb-5">
            <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
              <span className="text-base">📱</span>
              <span>جهازك: {detectedOS}</span>
            </div>
            <span className="bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full text-[10px]">
              موصى به
            </span>
          </div>

          {/* Segmented OS Switcher */}
          <div className={`flex p-1 rounded-2xl border gap-1 mb-5 ${
            isDarkMode ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
          }`}>
            <button
              onClick={() => setActiveTab("android")}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "android"
                  ? isDarkMode 
                    ? "bg-[#1e2230] text-amber-400 shadow-md border border-amber-500/30" 
                    : "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <span>🤖</span>
              <span>أندرويد (APK)</span>
            </button>

            <button
              onClick={() => setActiveTab("ios")}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "ios"
                  ? isDarkMode 
                    ? "bg-[#1e2230] text-amber-400 shadow-md border border-amber-500/30" 
                    : "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <span>🍏</span>
              <span>آيفون (Apple)</span>
            </button>

            <button
              onClick={() => setActiveTab("pc")}
              className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "pc"
                  ? isDarkMode 
                    ? "bg-[#1e2230] text-amber-400 shadow-md border border-amber-500/30" 
                    : "bg-white text-slate-900 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              <span>💻</span>
              <span>الكمبيوتر</span>
            </button>
          </div>

          {/* TAB 1: ANDROID */}
          {activeTab === "android" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Primary Action Button */}
              <a
                href="/apk/yaqeen.apk"
                download="yaqeen.apk"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm md:text-base shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 no-underline"
              >
                <Download className="w-5 h-5 text-slate-950" />
                <div className="text-center">
                  <div>تحميل تطبيق أندرويد (APK)</div>
                  <div className="text-[11px] font-bold opacity-85">نسخة 64-bit السريعة (9.2 MB) · موصى بها</div>
                </div>
              </a>

              {/* 32-bit Legacy Phone Alternative */}
              <div className={`p-3 rounded-xl border text-center ${
                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
              }`}>
                <a
                  href="/apk/yaqeen-v7a.apk"
                  download="yaqeen-v7a.apk"
                  className="text-xs font-black text-amber-600 dark:text-amber-400 underline inline-flex items-center gap-1"
                >
                  <span>نسخة الهواتف الاقتصادية / الأقدم (8.8 MB) ↗</span>
                </a>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  مخصصة للهواتف المصنوعة قبل 2018 أو الأجهزة ذات الرامات المحدودة
                </p>
              </div>

              {/* 3-Step Mini Guide */}
              <div className={`p-4 rounded-2xl border text-right space-y-2.5 ${
                isDarkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/80 border-slate-200"
              }`}>
                <div className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center justify-end gap-1.5">
                  <span>طريقة التثبيت السريعة:</span>
                  <span>⚡</span>
                </div>
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                    <span>اضغط على زر التحميل الذهبي بالأعلى.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                    <span>إذا ظهر تنبيه التحميل، اضغط <strong>«تنزيل على أي حال»</strong> فالملف آمن 100%.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</span>
                    <span>افتح الملف واضغط <strong>«تثبيت» (Install)</strong> وسيعمل فوراً.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: iOS / APPLE */}
          {activeTab === "ios" && (
            <div className={`p-4 rounded-2xl border text-right space-y-3 animate-in fade-in duration-200 ${
              isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-amber-50/50 border-amber-200"
            }`}>
              <h3 className={`text-sm font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                تثبيت فوري على iPhone و iPad (تطبيق ويب PWA):
              </h3>
              <ol className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <li className="flex items-center gap-2">
                  <span>1️⃣</span>
                  <span>افتح الموقع من متصفح <strong>Safari</strong> الأصلي.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>2️⃣</span>
                  <span>اضغط على زر <strong>المشاركة (Share ⎋)</strong> في أسفل الشاشة.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>3️⃣</span>
                  <span>اختر <strong>«إضافة إلى الشاشة الرئيسية» ➕</strong>.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>4️⃣</span>
                  <span>اضغط <strong>«إضافة»</strong> وسيظهر التطبيق كأيقونة أصلية دون تحميل ملفات.</span>
                </li>
              </ol>

              <Link
                href="/"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-md no-underline mt-3"
              >
                <span>فتح الموقع في Safari لتثبيته 🚀</span>
              </Link>
            </div>
          )}

          {/* TAB 3: PC / DESKTOP */}
          {activeTab === "pc" && (
            <div className={`p-4 rounded-2xl border text-right space-y-3 animate-in fade-in duration-200 ${
              isDarkMode ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}>
              <h3 className={`text-sm font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                تثبيت يقين على الكمبيوتر (Windows / Mac):
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                يمكنك تثبيت الموقع كتطبيق مستقل على سطح المكتب وشريط المهام بلمسة زر واحدة عبر متصفح Chrome أو Edge.
              </p>

              <Link
                href="/"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-md no-underline"
              >
                <span>فتح وتثبيت تطبيق سطح المكتب 💻</span>
              </Link>

              <div className="pt-2 text-center">
                <a
                  href="/apk/yaqeen.apk"
                  download="yaqeen.apk"
                  className="text-xs font-black text-amber-600 dark:text-amber-400 underline"
                >
                  أو حمّل ملف APK لنقله إلى هاتفك (9.2 MB)
                </a>
              </div>
            </div>
          )}

        </div>

        {/* Feature Highlights Cards */}
        <div className="space-y-3">
          <div className={`p-4 rounded-2xl border flex items-center gap-3.5 text-right transition-all ${
            isDarkMode 
              ? "bg-[#12151f] border-slate-800 hover:border-amber-500/40" 
              : "bg-white border-slate-200/90 shadow-sm hover:border-amber-400"
          }`}>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-xl shrink-0">
              🎧
            </div>
            <div>
              <strong className={`block text-xs md:text-sm font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                استقرار كامل للصوت في الخلفية
              </strong>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                تلاوات متواصلة بدون انقطاع حتى مع إغلاق شاشة الهاتف
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3.5 text-right transition-all ${
            isDarkMode 
              ? "bg-[#12151f] border-slate-800 hover:border-amber-500/40" 
              : "bg-white border-slate-200/90 shadow-sm hover:border-amber-400"
          }`}>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-xl shrink-0">
              🕋
            </div>
            <div>
              <strong className={`block text-xs md:text-sm font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                إشعارات الأذان والصلوات بدقة 100%
              </strong>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                تنبيهات في موعدها الدقيق تتجاوز قيود توفير الطاقة
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3.5 text-right transition-all ${
            isDarkMode 
              ? "bg-[#12151f] border-slate-800 hover:border-amber-500/40" 
              : "bg-white border-slate-200/90 shadow-sm hover:border-amber-400"
          }`}>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-xl shrink-0">
              📖
            </div>
            <div>
              <strong className={`block text-xs md:text-sm font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                المصحف العثماني كاملاً بدون إنترنت
              </strong>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                قراءة مريحة مع تفاسير الآيات، علامات الحفظ، والبحث السريع
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3.5 text-right transition-all ${
            isDarkMode 
              ? "bg-[#12151f] border-slate-800 hover:border-amber-500/40" 
              : "bg-white border-slate-200/90 shadow-sm hover:border-amber-400"
          }`}>
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-xl shrink-0">
              🧭
            </div>
            <div>
              <strong className={`block text-xs md:text-sm font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                القبلة التفاعلية والسبحة الإلكترونية
              </strong>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                حساب دقيق لاتجاه الكعبة أينما كنت مع عداد التسبيح الذكي
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* Page Footer */}
      <footer className={`py-6 px-4 text-center border-t text-xs transition-colors ${
        isDarkMode 
          ? "bg-[#090b10] border-slate-800 text-slate-500" 
          : "bg-white border-slate-200 text-slate-500 shadow-sm"
      }`}>
        <p>جميع الحقوق محفوظة © تطبيق يقين القرآن الكريم 2026</p>
        <p className="mt-1">
          تطبيق إسلامي نقي 100% بدون إعلانات · <Link href="/" className="text-amber-600 dark:text-amber-400 font-bold no-underline">العودة للرئيسية</Link>
        </p>
      </footer>

    </div>
  );
}
