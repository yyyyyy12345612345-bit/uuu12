"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Download, Smartphone, Star, Zap } from "lucide-react";
import {
  getPlatform,
  getBannerDismissed,
  setBannerDismissed,
  isApkInstalled,
} from "@/lib/device";

interface AppBannerProps {
  apkDownloadUrl?: string;
}

export function AppBanner({ apkDownloadUrl = "https://quran1-mu.vercel.app/download/" }: AppBannerProps) {
  const [platform, setPlatform] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPWAInstallable, setIsPWAInstallable] = useState(false);
  const [installing, setInstalling] = useState(false);
  const checkDone = useRef(false);

  useEffect(() => {
    if (checkDone.current) return;
    checkDone.current = true;

    // Capture beforeinstallprompt for Android/Chrome PWA
    const handler = (e: Event) => {
      try {
        console.log("[AppBanner] beforeinstallprompt event fired", { eventType: e.type });
        e.preventDefault();
        setDeferredPrompt(e);
        setIsPWAInstallable(true);
        console.log("[AppBanner] beforeinstallprompt stored successfully");
      } catch (error) {
        console.error("[AppBanner] Error handling beforeinstallprompt:", error);
      }
    };
    window.addEventListener("beforeinstallprompt", handler as any);
    console.log("[AppBanner] Registered beforeinstallprompt listener");

    const init = async () => {
      try {
        const p = getPlatform();
        console.log("[AppBanner] Platform detected:", p);

        // Emulator/desktop - show nothing
        if (p === "emulator" || p === "browser") return;

        // Already installed as PWA - show nothing
        if (p === "pwa") return;

        if (p === "android") {
          if (getBannerDismissed("apk")) return;
          // Check if APK is already installed
          const installed = await isApkInstalled();
          if (installed) return;
          setPlatform("android");
          setTimeout(() => setVisible(true), 2000); // show after 2s
        }

        if (p === "ios") {
          if (getBannerDismissed("pwa")) return;
          // iOS Safari - show PWA install guide
          setPlatform("ios");
          setTimeout(() => setVisible(true), 2000);
        }
      } catch (error) {
        console.error("[AppBanner] Init error:", error);
      }
    };

    init();

    return () => window.removeEventListener("beforeinstallprompt", handler as any);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    if (platform === "android") setBannerDismissed("apk");
    if (platform === "ios") setBannerDismissed("pwa");
  };

  const handleAndroidAction = async () => {
    // If PWA install prompt is available (Android Chrome), use it
    if (deferredPrompt) {
      try {
        setInstalling(true);
        console.log("[AppBanner] Calling prompt() on deferred prompt");
        await deferredPrompt.prompt();
        console.log("[AppBanner] prompt() completed successfully");
        
        const { outcome } = await deferredPrompt.userChoice;
        console.log("[AppBanner] User outcome:", outcome);
        
        if (outcome === "accepted") {
          localStorage.setItem("sakina_apk_installed", "true");
          setVisible(false);
        }
        setInstalling(false);
        setDeferredPrompt(null);
        return;
      } catch (error) {
        console.error("[AppBanner] Error calling prompt():", error);
        setInstalling(false);
        setDeferredPrompt(null);
      }
    }
    // Otherwise open APK download page
    console.log("[AppBanner] No deferred prompt, opening download URL");
    window.open(apkDownloadUrl, "_blank");
  };

  if (!visible || !platform) return null;

  if (platform === "android") {
    return (
      <div className="fixed bottom-6 left-4 right-4 z-[3000] animate-in slide-in-from-bottom-4 duration-500 font-arabic">
        <div className="relative max-w-md mx-auto bg-[#0d0d0d]/95 backdrop-blur-2xl border border-[#d4af37]/20 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Gold shimmer line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

          <div className="flex items-center gap-4 p-4">
            {/* App Icon */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 border border-[#d4af37]/30 flex items-center justify-center shadow-lg overflow-hidden">
                <img src="/logo/logo.png" alt="Sakina" className="w-10 h-10 object-contain" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0d0d0d]">
                <Download className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 text-right">
              <div className="flex items-center justify-end gap-2 mb-0.5">
                <span className="text-[9px] font-black text-[#d4af37] uppercase tracking-[0.2em] bg-[#d4af37]/10 px-2 py-0.5 rounded-full">
                  تطبيق أصلي
                </span>
              </div>
              <p className="text-white font-black text-sm leading-tight">ثبّت تطبيق سكينة</p>
              <p className="text-white/40 text-[11px] font-bold mt-0.5">تجربة أفضل · أذان تلقائي · بدون إنترنت</p>
              {/* Stars */}
              <div className="flex items-center justify-end gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 text-[#d4af37] fill-[#d4af37]" />
                ))}
                <span className="text-[9px] text-white/30 mr-1">5.0</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={handleAndroidAction}
                disabled={installing}
                className="px-4 py-2.5 bg-[#d4af37] text-black rounded-2xl font-black text-sm shadow-lg shadow-[#d4af37]/30 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
              >
                {installing ? "جاري..." : isPWAInstallable ? "تثبيت" : "تحميل"}
              </button>
              <button
                onClick={handleDismiss}
                className="w-full h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-white/30 hover:text-white transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (platform === "ios") {
    return (
      <div className="fixed bottom-6 left-4 right-4 z-[3000] animate-in slide-in-from-bottom-4 duration-500 font-arabic">
        <div className="relative max-w-md mx-auto bg-[#0d0d0d]/95 backdrop-blur-2xl border border-violet-500/20 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden">
          {/* Violet shimmer line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 left-3 w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="p-5 pt-4 text-right">
            <div className="flex items-center justify-end gap-3 mb-3">
              <div className="text-right">
                <div className="flex items-center justify-end gap-2 mb-1">
                  <span className="text-[9px] font-black text-violet-400 uppercase tracking-[0.2em] bg-violet-500/10 px-2 py-0.5 rounded-full">
                    PWA · iOS
                  </span>
                </div>
                <p className="text-white font-black text-base">أضف للشاشة الرئيسية</p>
                <p className="text-white/40 text-[11px] font-bold">استمتع بتجربة تطبيق كاملة على iPhone</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <img src="/logo/logo.png" alt="Sakina" className="w-9 h-9 object-contain" />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2 mt-4">
              {[
                { step: "١", text: 'اضغط على زر المشاركة', sub: "أسفل Safari" },
                { step: "٢", text: '"إضافة إلى الشاشة الرئيسية"', sub: "من القائمة" },
                { step: "٣", text: "اضغط «إضافة»", sub: "يظهر أيقونة التطبيق" },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-2xl border border-white/5">
                  <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-black text-xs shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-white font-black text-xs">{item.text}</p>
                    <p className="text-white/30 text-[10px]">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-white/20">
              <Zap className="w-3 h-3" />
              <span className="text-[10px] font-bold">أسرع · أذكى · بدون متجر</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
