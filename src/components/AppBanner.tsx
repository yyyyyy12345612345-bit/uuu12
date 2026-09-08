"use client";

import React, { useState, useEffect } from "react";
import { X, Download, Smartphone, Laptop, Sparkles } from "lucide-react";
import { isPWA, isDesktop } from "@/lib/device";

export function AppBanner() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDesktopDevice, setIsDesktopDevice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Do not show if already running inside an installed PWA
    if (isPWA()) return;

    // Check if dismissed recently (7 days)
    const dismissed = localStorage.getItem("pwa_banner_dismissed");
    if (dismissed) {
      const time = parseInt(dismissed, 10);
      if (Date.now() - time < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    setIsDesktopDevice(isDesktop());

    // Check for existing deferredPrompt
    if ((window as any).__deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).__deferredPWAInstallPrompt);
    }

    const handlePromptReady = () => {
      if ((window as any).__deferredPWAInstallPrompt) {
        setDeferredPrompt((window as any).__deferredPWAInstallPrompt);
      }
    };

    const handleAppInstalled = () => {
      setVisible(false);
    };

    window.addEventListener("pwa-prompt-available", handlePromptReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Show floating banner after 3.5 seconds
    const timer = setTimeout(() => {
      setVisible(true);
    }, 3500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pwa-prompt-available", handlePromptReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("pwa_banner_dismissed", Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setVisible(false);
          setDeferredPrompt(null);
          (window as any).__deferredPWAInstallPrompt = null;
          return;
        }
      } catch (e) {
        console.error("Install prompt error:", e);
      }
    }
    // Open full smart install modal
    window.dispatchEvent(new Event("open-app-install"));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:max-w-md z-[2900] animate-in slide-in-from-bottom-5 duration-500 font-arabic">
      <div className="relative bg-[#0d0f14]/95 backdrop-blur-2xl border border-[#d4af37]/30 rounded-[1.75rem] shadow-[0_20px_70px_rgba(0,0,0,0.85)] p-4 flex items-center justify-between gap-3 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#d4af37]/10 blur-2xl rounded-full pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="w-7 h-7 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors shrink-0"
          aria-label="إغلاق"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Action Button */}
        <button
          onClick={handleInstallClick}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black font-black text-xs md:text-sm shadow-md shadow-[#d4af37]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-black" />
          <span>تثبيت</span>
        </button>

        {/* Text & Icon */}
        <div className="flex items-center gap-3 text-right flex-1 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-white font-black text-xs md:text-sm truncate">
                {isDesktopDevice ? "تطبيق سطح المكتب" : "تطبيق يقين للموبايل"}
              </span>
              <Sparkles className="w-3 h-3 text-[#d4af37] shrink-0" />
            </div>
            <p className="text-white/60 text-[10px] md:text-[11px] truncate font-medium mt-0.5">
              {isDesktopDevice 
                ? "أيقونة مباشرة على سطح المكتب ونافذة سريعة" 
                : "أضف التطبيق لشاشتك لتجربة كاملة وسريعة"}
            </p>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0 shadow-inner">
            {isDesktopDevice ? <Laptop className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
          </div>
        </div>
      </div>
    </div>
  );
}
