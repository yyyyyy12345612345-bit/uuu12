"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Monitor, Smartphone, Download, Check, Zap, Info, 
  Sparkles, CheckCircle2, Share2, PlusSquare, ExternalLink, Laptop,
  Compass, ShieldCheck, Volume2, Bell
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  isDesktop, isAndroid, isIOS, isPWA, isWindows, isMac,
  getMobileBrowserType, isSamsungBrowser, isSafariMobile
} from "@/lib/device";

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type MobileBrowserTab = "chrome" | "safari" | "samsung" | "firefox";

export function AppInstallModal({ isOpen, onClose }: AppInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [activeTab, setActiveTab] = useState<"desktop" | "mobile">("desktop");
  const [mobileSubTab, setMobileSubTab] = useState<MobileBrowserTab>("chrome");
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [showHelperGuide, setShowHelperGuide] = useState(false);
  const [userIsDesktop, setUserIsDesktop] = useState(true);
  const [userIsIOS, setUserIsIOS] = useState(false);
  const [userIsWindows, setUserIsWindows] = useState(false);
  const [userIsMac, setUserIsMac] = useState(false);
  const [detectedBrowserName, setDetectedBrowserName] = useState<string>("متصفحك الحالي");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect device characteristics
    const desktop = isDesktop();
    const ios = isIOS();
    const standalone = isPWA();
    const win = isWindows();
    const mac = isMac();
    const mobileBrowser = getMobileBrowserType();

    setUserIsDesktop(desktop);
    setUserIsIOS(ios);
    setIsStandalone(standalone);
    setUserIsWindows(win);
    setUserIsMac(mac);

    // Auto-select main tab
    setActiveTab(desktop ? "desktop" : "mobile");

    // Auto-select mobile browser tab
    if (mobileBrowser === "safari" || ios) {
      setMobileSubTab("safari");
      setDetectedBrowserName("Safari على iPhone/iPad");
    } else if (mobileBrowser === "samsung") {
      setMobileSubTab("samsung");
      setDetectedBrowserName("متصفح Samsung Internet");
    } else if (mobileBrowser === "firefox") {
      setMobileSubTab("firefox");
      setDetectedBrowserName("متصفح Firefox");
    } else {
      setMobileSubTab("chrome");
      setDetectedBrowserName("Google Chrome / أندرويد");
    }

    // Check if deferredPrompt was already captured globally
    if ((window as any).__deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).__deferredPWAInstallPrompt);
    }

    // Listen for prompt availability
    const handlePromptReady = (e: any) => {
      const prompt = (window as any).__deferredPWAInstallPrompt || e;
      if (prompt) {
        setDeferredPrompt(prompt);
      }
    };

    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", (e: any) => {
      e.preventDefault();
      (window as any).__deferredPWAInstallPrompt = e;
      setDeferredPrompt(e);
    });

    window.addEventListener("pwa-prompt-available", handlePromptReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("pwa-prompt-available", handlePromptReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setInstalledSuccess(true);
          setDeferredPrompt(null);
          (window as any).__deferredPWAInstallPrompt = null;
          setTimeout(() => {
            onClose();
          }, 2500);
          return;
        }
      } catch (err) {
        console.error("PWA Prompt error:", err);
      }
    }
    // If prompt wasn't natively available, show visual guide
    setShowHelperGuide(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-3 sm:p-5 md:p-8 font-arabic">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.92, opacity: 0, y: 25 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 25 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="relative w-full max-w-2xl bg-[#0b0d11] border border-[#d4af37]/25 rounded-[2.5rem] shadow-[0_0_120px_rgba(212,175,55,0.15)] overflow-hidden flex flex-col max-h-[92vh] force-dark"
          >
            {/* Ambient Lighting & Luxury Accents */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-36 bg-gradient-to-b from-[#d4af37]/15 to-transparent blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-emerald-500/10 blur-[100px] pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

            {/* Header */}
            <div className="relative z-10 px-6 pt-6 pb-4 md:px-8 md:pt-7 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                  {activeTab === "desktop" ? <Laptop className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg md:text-2xl font-black text-white">تثبيت يقين القرآن</h2>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30 px-2.5 py-0.5 rounded-full">
                      PWA الذكي
                    </span>
                  </div>
                  <p className="text-[11px] md:text-xs text-white/60 font-medium mt-0.5">
                    {userIsDesktop 
                      ? "تثبيت مباشر على سطح المكتب وشريط المهام" 
                      : `تثبيت ذكي لجميع هواتف الموبايل (${detectedBrowserName})`}
                  </p>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Tabs (Desktop vs Mobile) */}
            <div className="relative z-10 px-6 pt-4 md:px-8 flex gap-2">
              <button
                onClick={() => {
                  setActiveTab("desktop");
                  setShowHelperGuide(false);
                }}
                className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 border transition-all duration-300 ${
                  activeTab === "desktop"
                    ? "bg-[#d4af37]/15 border-[#d4af37]/40 text-[#fbf5b7] shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                    : "bg-white/[0.02] border-white/5 text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>أجهزة الكمبيوتر وسطح المكتب</span>
                {userIsDesktop && (
                  <span className="text-[9px] bg-[#d4af37]/30 text-[#fff] px-1.5 py-0.5 rounded-full font-bold">
                    جهازك
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab("mobile");
                  setShowHelperGuide(false);
                }}
                className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 border transition-all duration-300 ${
                  activeTab === "mobile"
                    ? "bg-[#d4af37]/15 border-[#d4af37]/40 text-[#fbf5b7] shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                    : "bg-white/[0.02] border-white/5 text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>الهواتف الذكية (موبايل)</span>
                {!userIsDesktop && (
                  <span className="text-[9px] bg-[#d4af37]/30 text-[#fff] px-1.5 py-0.5 rounded-full font-bold">
                    جهازك
                  </span>
                )}
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="relative z-10 p-6 md:p-8 overflow-y-auto no-scrollbar flex-1 space-y-6">

              {/* Success Notification if already installed */}
              {isStandalone || installedSuccess ? (
                <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-right flex items-start gap-3.5 animate-in fade-in duration-300">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm md:text-base font-black text-emerald-300">
                      التطبيق مثبت بالفعل ويعمل على جهازك! 🎉
                    </h3>
                    <p className="text-xs text-white/70 leading-relaxed mt-1">
                      يقين القرآن يعمل الآن كنافذة تطبيق أصلية مستقلة. يمكنك دائماً فتحه مباشرة من سطح المكتب، شريط المهام، أو شاشة هاتفك الرئيسية.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* ============================================================ */}
              {/* TAB 1: DESKTOP PWA                                           */}
              {/* ============================================================ */}
              {activeTab === "desktop" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="p-6 md:p-7 rounded-[2rem] bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 relative overflow-hidden text-right">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        نسخة سطح المكتب الرسمية
                      </span>
                      <div className="text-right">
                        <h3 className="text-xl md:text-2xl font-black text-white">
                          تطبيق سطح المكتب الفوري
                        </h3>
                        <p className="text-xs text-[#d4af37] font-bold mt-0.5">
                          {userIsWindows ? "يدعم Windows 10 & 11" : userIsMac ? "يدعم أجهزة Apple Mac (macOS)" : "يدعم جميع أنظمة الكمبيوتر"}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-white/70 leading-relaxed mb-6 font-medium">
                      يتم تثبيت التطبيق بنقرة واحدة ليظهر مباشرة كأيقونة على <strong className="text-white">سطح المكتب (Desktop)</strong> وفي <strong className="text-white">شريط المهام (Taskbar)</strong>، ويعمل في نافذة مستقلة كاملة وسريعة خالية من تشتيت أشرطة المتصفح.
                    </p>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {[
                        { title: "أيقونة على سطح المكتب وشريط المهام", desc: "فتح فوري بضغطة زر واحدة" },
                        { title: "نافذة مستقلة فائقة السرعة", desc: "بدون علامات تبويب أو أشرطة مشتتة" },
                        { title: "تشغيل مستقر للصوتيات والأذكار", desc: "أداء نقي ومستمر في الخلفية" },
                        { title: "تحديثات سحابية تلقائية", desc: "تطبيق خفيف لا يستهلك سعة التخزين" },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-end gap-3 text-right">
                          <div>
                            <span className="text-xs font-black text-white block">{item.title}</span>
                            <span className="text-[10px] text-white/50 font-medium">{item.desc}</span>
                          </div>
                          <div className="w-7 h-7 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37] shrink-0">
                            <Check className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Install Action Button */}
                    <button
                      onClick={handleTriggerInstall}
                      className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black text-sm md:text-base shadow-[0_10px_35px_rgba(212,175,55,0.25)] hover:shadow-[0_15px_45px_rgba(212,175,55,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2.5"
                    >
                      <Download className="w-5 h-5 text-black" />
                      <span>تثبيت التطبيق على سطح المكتب الآن</span>
                    </button>

                    {/* Step-by-step Helper for Desktop Browsers */}
                    {showHelperGuide && (
                      <div className="mt-5 p-4 md:p-5 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/25 text-right space-y-3 animate-in fade-in duration-300">
                        <div className="flex items-center justify-end gap-2 text-xs font-black text-[#fbf5b7]">
                          <span>خطوات التثبيت المباشرة من متصفحك:</span>
                          <Info className="w-4 h-4 text-[#d4af37]" />
                        </div>
                        <ol className="space-y-2 text-xs text-white/80 font-medium leading-relaxed list-decimal list-inside pr-1">
                          <li>
                            انظر إلى <strong className="text-white">أقصى شريط عنوان الرابط بالأعلى (Address Bar)</strong>: ستجد أيقونة تثبيت صغيرة <span className="inline-block px-1.5 py-0.5 rounded bg-white/10 font-bold">🖥️ أو ⊕</span> بجانب النجمة.
                          </li>
                          <li>
                            اضغط عليها ثم اختر <strong className="text-white">«تثبيت» (Install)</strong> وسيتم وضع الأيقونة فوراً على سطح المكتب وشريط المهام.
                          </li>
                          <li>
                            أو اضغط على زر القائمة <span className="inline-block px-1.5 py-0.5 rounded bg-white/10 font-bold">⋮</span> أعلى المتصفح ← ثم اختر <strong className="text-white">«تثبيت يقين القرآن»</strong> أو <strong className="text-white">«حفظ ومشاركة ← إنشاء اختصار»</strong>.
                          </li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 2: MOBILE PWA (ALL TYPES & BROWSERS)                     */}
              {/* ============================================================ */}
              {activeTab === "mobile" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Sub-tabs for Mobile Browsers */}
                  <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/5">
                    {[
                      { id: "chrome", label: "أندرويد وكروم", icon: "🤖" },
                      { id: "safari", label: "آيفون وآيباد (Safari)", icon: "🍎" },
                      { id: "samsung", label: "سامسونج إنترنت", icon: "🌌" },
                      { id: "firefox", label: "فايرفوكس والمتصفحات الأخرى", icon: "🌐" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setMobileSubTab(tab.id as MobileBrowserTab);
                          setShowHelperGuide(false);
                        }}
                        className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 ${
                          mobileSubTab === tab.id
                            ? "bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Main Mobile Card */}
                  <div className="p-6 md:p-7 rounded-[2rem] bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 relative overflow-hidden text-right">
                    
                    {/* Header Info */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        تطبيق الموبايل فائق السرعة
                      </span>
                      <div className="text-right">
                        <h3 className="text-xl md:text-2xl font-black text-white">
                          {mobileSubTab === "safari" 
                            ? "تثبيت يقين على iPhone و iPad"
                            : mobileSubTab === "samsung"
                            ? "تثبيت يقين على هواتف سامسونج"
                            : mobileSubTab === "firefox"
                            ? "تثبيت يقين عبر متصفح فايرفوكس"
                            : "تثبيت يقين على أجهزة أندرويد وكروم"}
                        </h3>
                        <p className="text-xs text-[#d4af37] font-bold mt-0.5">
                          تطبيق متكامل بدون الحاجة لمتجر التطبيقات · مساحة أقل من 3MB
                        </p>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-white/70 leading-relaxed mb-6 font-medium">
                      يعمل تطبيق يقين بتقنية PWA الحديثة ليمنحك تجربة التطبيق الأصلي كاملة: يضاف مباشرة إلى <strong className="text-white">شاشتك الرئيسية</strong>، ويعمل في <strong className="text-white">شاشة كاملة</strong>، مع دعم تشغيل الأذكار والصوتيات في الخلفية ومواقيت الصلاة.
                    </p>

                    {/* Mobile Features List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {[
                        { title: "أيقونة حقيقية على الشاشة الرئيسية", desc: "فتح بضغطة زر واحدة بدون المتصفح" },
                        { title: "شاشة كاملة بدون أشرطة", desc: "تصميم أنيق ونقي مثل التطبيقات الأصلية" },
                        { title: "استماع في الخلفية وعلى شاشة القفل", desc: "تشغيل مستقر للأذكار والمصحف المرتل" },
                        { title: "إشعارات مواقيت الصلاة والأذان", desc: "تنبيهات دقيقة لصلواتك الخمس" },
                      ].map((feat, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-end gap-3 text-right">
                          <div>
                            <span className="text-xs font-black text-white block">{feat.title}</span>
                            <span className="text-[10px] text-white/50 font-medium">{feat.desc}</span>
                          </div>
                          <div className="w-7 h-7 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37] shrink-0">
                            <Check className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ======================================================= */}
                    {/* BROWSER SPECIFIC INSTALL GUIDANCE                       */}
                    {/* ======================================================= */}

                    {/* 1. ANDROID & CHROME */}
                    {mobileSubTab === "chrome" && (
                      <div className="space-y-4">
                        <button
                          onClick={handleTriggerInstall}
                          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black text-sm md:text-base shadow-[0_10px_35px_rgba(212,175,55,0.25)] hover:shadow-[0_15px_45px_rgba(212,175,55,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2.5"
                        >
                          <Download className="w-5 h-5 text-black" />
                          <span>تثبيت التطبيق على الشاشة الرئيسية (PWA)</span>
                        </button>

                        <a
                          href="/apk/yaqeen.apk"
                          download="yaqeen.apk"
                          className="w-full py-3.5 px-6 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-[#d4af37]/30 text-white font-bold text-xs md:text-sm transition-all duration-300 flex items-center justify-center gap-2.5 hover:border-[#d4af37]"
                        >
                          <Download className="w-4 h-4 text-[#d4af37]" />
                          <span>تحميل ملف APK المباشر للأندرويد (9.2 MB)</span>
                        </a>

                        <a
                          href="/download/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#fbf5b7]/75 hover:text-[#fbf5b7] underline flex items-center justify-center gap-1.5 transition-colors py-1 font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>مركز التحميل: تعرف على الفرق بين النسخ ومعمارية الهواتف</span>
                        </a>

                        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 text-right space-y-2">
                          <div className="flex items-center justify-end gap-2 text-xs font-black text-[#fbf5b7]">
                            <span>طريقة التثبيت اليدوية السريعة (كروم وأندرويد):</span>
                            <Info className="w-4 h-4 text-[#d4af37]" />
                          </div>
                          <ol className="space-y-2 text-xs text-white/80 font-medium leading-relaxed list-decimal list-inside pr-1">
                            <li>اضغط على زر الخيارات <strong className="text-white">(3 نقاط ⋮)</strong> في أعلى يمين المتصفح.</li>
                            <li>اختر <strong className="text-white">«تثبيت التطبيق» (Install app)</strong> أو <strong className="text-white">«إضافة إلى الشاشة الرئيسية»</strong>.</li>
                            <li>اضغط على <strong className="text-white">«تثبيت»</strong> وسيضاف التطبيق فوراً لشاشة هاتفك.</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    {/* 2. IPHONE & IPAD (SAFARI) */}
                    {mobileSubTab === "safari" && (
                      <div className="p-5 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/25 space-y-3.5">
                        <div className="flex items-center justify-end gap-2 text-xs md:text-sm font-black text-[#fbf5b7]">
                          <span>خطوات التثبيت المباشرة على أجهزة Apple (Safari):</span>
                          <Share2 className="w-4 h-4 text-[#d4af37]" />
                        </div>
                        <ol className="space-y-3 text-xs text-white/90 font-medium leading-relaxed list-decimal list-inside pr-1">
                          <li className="flex items-start justify-end gap-2">
                            <span className="text-right">اضغط على زر <strong className="text-white">المشاركة (Share ⎋)</strong> في الشريط السفلي لمتصفح Safari.</span>
                            <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center text-xs font-black shrink-0">١</span>
                          </li>
                          <li className="flex items-start justify-end gap-2">
                            <span className="text-right">مرر القائمة لأسفل ثم اضغط على <strong className="text-white">«إضافة إلى الشاشة الرئيسية» (Add to Home Screen ➕)</strong>.</span>
                            <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center text-xs font-black shrink-0">٢</span>
                          </li>
                          <li className="flex items-start justify-end gap-2">
                            <span className="text-right">اضغط على كلمة <strong className="text-white">«إضافة» (Add)</strong> في الزاوية العلوية اليمنى.</span>
                            <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center text-xs font-black shrink-0">٣</span>
                          </li>
                        </ol>
                        <p className="text-[11px] text-[#fbf5b7]/80 pt-2 border-t border-[#d4af37]/20 text-center font-bold">
                          💡 نصيحة: بعد إضافته، افتح التطبيق من أيقونته على الشاشة الرئيسية لتتمتع بتجربة شاشة كاملة وسرعة فائقة.
                        </p>
                      </div>
                    )}

                    {/* 3. SAMSUNG INTERNET */}
                    {mobileSubTab === "samsung" && (
                      <div className="p-5 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/25 space-y-3.5">
                        <div className="flex items-center justify-end gap-2 text-xs md:text-sm font-black text-[#fbf5b7]">
                          <span>خطوات التثبيت على متصفح سامسونج إنترنت (Galaxy):</span>
                          <Info className="w-4 h-4 text-[#d4af37]" />
                        </div>
                        <ol className="space-y-3 text-xs text-white/90 font-medium leading-relaxed list-decimal list-inside pr-1">
                          <li className="flex items-start justify-end gap-2">
                            <span className="text-right">ابحث عن أيقونة التثبيت <strong className="text-white">(السهم لأسفل ↓ أو ⊕)</strong> بجانب شريط العنوان أو أسفل الشاشة واضغط عليها.</span>
                            <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center text-xs font-black shrink-0">١</span>
                          </li>
                          <li className="flex items-start justify-end gap-2">
                            <span className="text-right">أو اضغط على زر القائمة <strong className="text-white">(≡ الثلاث خطوط)</strong> أسفل يمين الشاشة.</span>
                            <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center text-xs font-black shrink-0">٢</span>
                          </li>
                          <li className="flex items-start justify-end gap-2">
                            <span className="text-right">اختر <strong className="text-white">«إضافة الصفحة إلى» (Add page to)</strong> ثم اضغط <strong className="text-white">«الشاشة الرئيسية» (Home screen)</strong>.</span>
                            <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center text-xs font-black shrink-0">٣</span>
                          </li>
                        </ol>
                      </div>
                    )}

                    {/* 4. FIREFOX MOBILE & OTHER */}
                    {mobileSubTab === "firefox" && (
                      <div className="p-5 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/25 space-y-3.5">
                        <div className="flex items-center justify-end gap-2 text-xs md:text-sm font-black text-[#fbf5b7]">
                          <span>خطوات التثبيت على فايرفوكس والمتصفحات الأخرى:</span>
                          <Info className="w-4 h-4 text-[#d4af37]" />
                        </div>
                        <ol className="space-y-3 text-xs text-white/90 font-medium leading-relaxed list-decimal list-inside pr-1">
                          <li className="flex items-start justify-end gap-2">
                            <span className="text-right">اضغط على زر القائمة <strong className="text-white">(الثلاث نقاط ⋮)</strong> بجانب شريط العنوان.</span>
                            <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center text-xs font-black shrink-0">١</span>
                          </li>
                          <li className="flex items-start justify-end gap-2">
                            <span className="text-right">اضغط على خيار <strong className="text-white">«تثبيت» (Install)</strong> أو <strong className="text-white">«إضافة إلى الشاشة الرئيسية»</strong>.</span>
                            <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center text-xs font-black shrink-0">٢</span>
                          </li>
                          <li className="flex items-start justify-end gap-2">
                            <span className="text-right">أكّد التثبيت ليظهر التطبيق فوراً على شاشة هاتفك مع باقي تطبيقاتك.</span>
                            <span className="w-6 h-6 rounded-full bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center text-xs font-black shrink-0">٣</span>
                          </li>
                        </ol>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* Bottom Assurance Note */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-right flex items-center justify-end gap-3 text-xs text-white/50 font-medium">
                <span>تطبيق إسلامي نقي وآمن 100%، خالي من أي إعلانات، ويعمل بسلاسة على كافة الأجهزة</span>
                <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
