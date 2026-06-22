"use client";

import React, { useState, useEffect, useRef } from "react";
import { Capacitor } from '@capacitor/core';
import { X, Download, Info, ShieldCheck, Bell, MapPin, CheckCircle2, ArrowRight, SkipForward } from 'lucide-react';
import { gsap } from "gsap";
import { requestNotificationPermission, smartReschedule, loadSettings } from '@/lib/prayerNotifications';
import { initializePushNotifications } from '@/lib/pushNotifications';
import { Geolocation } from '@capacitor/geolocation';
import { auth, db, initFirebase } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { registerPlugin } from '@capacitor/core';
import { AppBanner } from '@/components/AppBanner';
import { initSmartNotifications, cleanupSmartNotifications } from '@/lib/smartNotifications';
import dynamic from "next/dynamic";

const OnboardingOverlay = dynamic(
  () => import("@/components/OnboardingOverlay").then((mod) => mod.OnboardingOverlay),
  { ssr: false }
);

// Custom Native Plugin for Battery Optimization


export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // GSAP animation refs
  const overlayRef = useRef<HTMLDivElement>(null);
  const starPathRef = useRef<SVGPathElement>(null);
  const bookPathRef = useRef<SVGPathElement>(null);
  const logoImgRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const authorRef = useRef<HTMLDivElement>(null);
  const skipBtnRef = useRef<HTMLButtonElement>(null);

  const handleSkipSplash = () => {
    if (overlayRef.current) {
      gsap.killTweensOf(overlayRef.current);
      gsap.killTweensOf(starPathRef.current);
      gsap.killTweensOf(bookPathRef.current);
      gsap.killTweensOf(logoImgRef.current);
      gsap.killTweensOf(textContainerRef.current);
      gsap.killTweensOf(authorRef.current);
    }
    setShowSplash(false);
    sessionStorage.setItem("has_seen_splash", "true");
    checkFirstRun();
  };

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [globalAlert, setGlobalAlert] = useState<{ id: string; title: string; message: string } | null>(null);
  const [mandatoryAnnouncement, setMandatoryAnnouncement] = useState<string | null>(null);
  const [announcementTimer, setAnnouncementTimer] = useState<number>(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Custom global dialogs state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmData, setConfirmData] = useState<{ message: string; resolve: (val: boolean) => void } | null>(null);

  useEffect(() => {
    setMounted(true);
    // Override window.alert
    window.alert = (message: string) => {
      setToast({ message, type: 'info' });
    };

    // Override window.confirm (returns Promise<boolean>)
    (window as any).confirm = (message: string) => {
      return new Promise<boolean>((resolve) => {
        setConfirmData({ message, resolve });
      });
    };

    const hasSeenOnboarding = localStorage.getItem("has_seen_onboarding");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    const handleShowOnboarding = () => setShowOnboarding(true);
    window.addEventListener("show_onboarding", handleShowOnboarding);
    return () => window.removeEventListener("show_onboarding", handleShowOnboarding);
  }, []);

  // Handle toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    // Only show splash once per session to avoid annoying re-loads during navigation
    const hasSeenSplash = sessionStorage.getItem("has_seen_splash");
    
    // Check for prefers-reduced-motion
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (hasSeenSplash) {
      setShowSplash(false);
      checkFirstRun();
      return;
    }

    if (prefersReducedMotion) {
      // Reduced motion: simple fast fade-out
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("has_seen_splash", "true");
        checkFirstRun();
      }, 800);
      return () => clearTimeout(timer);
    }

    // GSAP Intro Timeline
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setShowSplash(false);
          sessionStorage.setItem("has_seen_splash", "true");
          checkFirstRun();
        }
      });

      // 1. Initially set element starting properties
      gsap.set([textContainerRef.current, authorRef.current, skipBtnRef.current], { opacity: 0, y: 15 });
      gsap.set(logoImgRef.current, { scale: 0.8, opacity: 0 });

      // Animate the SVG paths stroke drawing
      if (starPathRef.current && bookPathRef.current) {
        const starLength = starPathRef.current.getTotalLength();
        const bookLength = bookPathRef.current.getTotalLength();

        gsap.set(starPathRef.current, { strokeDasharray: starLength, strokeDashoffset: starLength });
        gsap.set(bookPathRef.current, { strokeDasharray: bookLength, strokeDashoffset: bookLength });

        tl.to(starPathRef.current, {
          strokeDashoffset: 0,
          duration: 1.2,
          ease: "power2.inOut"
        })
        .to(bookPathRef.current, {
          strokeDashoffset: 0,
          duration: 0.8,
          ease: "power2.out"
        }, "-=0.6")
        .to(logoImgRef.current, {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          ease: "back.out(1.5)"
        }, "-=0.2");
      } else {
        // Fallback if SVG paths not present/resolvable
        tl.to(logoImgRef.current, {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "power2.out"
        });
      }

      // 2. Animate title, subtitle and author text
      tl.to(textContainerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.2")
      .to(authorRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      }, "-=0.3")
      .to(skipBtnRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out"
      }, "-=0.4");

      // 3. Pause momentarily for impact
      tl.to({}, { duration: 0.8 });

      // 4. Exit screen transition (fade out overlay)
      tl.to(overlayRef.current, {
        opacity: 0,
        scale: 1.02,
        duration: 0.6,
        ease: "power3.inOut"
      });
    });

    return () => ctx.revert();
  }, []);

  const checkFirstRun = async () => {
    if (!Capacitor.isNativePlatform()) return;
    
    const hasPrompted = localStorage.getItem("has_prompted_permissions");
    if (!hasPrompted) {
      setShowPermissionModal(true);
    }
  };

  const requestAllPermissions = async () => {
    try {
      // 1. Notifications (using new system)
      await requestNotificationPermission();
      
      // 2. Location
      await Geolocation.requestPermissions();

      // 3. Android Specific: Battery Optimization Exemption
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
         try {
           const BatteryOptimization = registerPlugin<any>('BatteryOptimization');
           const { isIgnoring } = await BatteryOptimization.isIgnoringBatteryOptimizations();
           if (!isIgnoring) {
             await BatteryOptimization.requestIgnoreBatteryOptimizations();
           }
         } catch (e) {
           console.log("Battery optimization plugin not available or failed", e);
         }
      }
    } catch (e) {
      console.error("Permission request failed", e);
    } finally {
      localStorage.setItem("has_prompted_permissions", "true");
      setShowPermissionModal(false);
    }
  };

  const normalizeVersion = (version: string) => {
    return version
      .toString()
      .trim()
      .replace(/^[^0-9]*/, "")
      .replace(/[^0-9.]/g, "")
      .split('.')
      .slice(0, 3)
      .map(Number)
      .map((value) => Number.isFinite(value) ? value : 0)
      .map((value) => Math.max(value, 0));
  };

  const isNewerVersion = (serverVer: string, localVer: string) => {
    const s = normalizeVersion(serverVer);
    const l = normalizeVersion(localVer);
    const length = Math.max(s.length, l.length);
    for (let i = 0; i < length; i++) {
      const left = s[i] || 0;
      const right = l[i] || 0;
      if (left > right) return true;
      if (left < right) return false;
    }
    return false;
  };

  const checkForUpdates = async (isManual = false) => {
    try {
      const response = await fetch('/version.json?t=' + Date.now());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not valid JSON");
      }
      const data = await response.json();
      const LOCAL_VERSION = "22.0";
      
      if (isNewerVersion(data.version, LOCAL_VERSION)) {
        setUpdateInfo(data);
        setShowUpdateModal(true);
      } else if (isManual) {
        alert("أنت تستخدم أحدث نسخة بالفعل!");
      }
    } catch (e) {
      console.warn("Update check bypassed:", e instanceof Error ? e.message : e);
    }
  };

  useEffect(() => {
    // 1. Initialize Push Notifications
    if (Capacitor.isNativePlatform()) {
      initializePushNotifications();
    }

    // 2. Initial Prayer Scheduling (smart sync) - delayed to ensure Firebase is ready
    const syncPrayers = async () => {
      try {
        const settings = loadSettings();
        await smartReschedule(settings, async () => null);
        console.log("[App] Background Adhan checked/re-synced.");
      } catch (e) {
        console.error("[App] Initial prayer sync failed", e);
      }
    };
    // Delay sync to ensure Firebase initialization
    setTimeout(syncPrayers, 2000);

    // 3. Check for updates on mount
    setTimeout(() => checkForUpdates(false), 5000);

    // 4. Listen for manual update trigger
    const handleManualUpdate = () => checkForUpdates(true);
    window.addEventListener('check-for-updates', handleManualUpdate);

    // 5. Initialize Smart Notifications (daily + Friday reminders)
    setTimeout(() => initSmartNotifications(), 3000);

    let isMounted = true;
    let unsubscribeSettings: (() => void) | null = null;
    let unsubscribeAuth: (() => void) | null = null;
    let unsubscribeVersion: (() => void) | null = null;
    let unsubscribeAlerts: (() => void) | null = null;

    const setupListeners = async () => {
      await initFirebase();
      if (!isMounted || !db) return;

      unsubscribeSettings = onSnapshot(doc(db, "settings", "global"), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const message = data.mandatoryAnnouncement || data.announcement;
          if (message && message.trim() !== "") {
            setMandatoryAnnouncement(message);
            setAnnouncementTimer(data.mandatoryDuration || 60);
          } else {
            setMandatoryAnnouncement(null);
          }
        }
      });

      unsubscribeAlerts = onSnapshot(doc(db, "settings", "alerts"), (snapshot) => {
        if (snapshot.exists()) {
          const items = snapshot.data().items || [];
          const active = items.find((alert: any) => {
            if (!alert.active) return false;
            const createdTime = new Date(alert.createdAt?.toDate ? alert.createdAt.toDate() : alert.createdAt).getTime();
            const durationMs = (alert.durationHours || 24) * 60 * 60 * 1000;
            return (Date.now() - createdTime) < durationMs;
          });

          if (active) {
            try {
              const closed = JSON.parse(sessionStorage.getItem("closed_alerts") || "[]");
              if (!closed.includes(active.id)) {
                setGlobalAlert(active);
              } else {
                setGlobalAlert(null);
              }
            } catch {
              setGlobalAlert(active);
            }
          } else {
            setGlobalAlert(null);
          }
        } else {
          setGlobalAlert(null);
        }
      });

      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user && Capacitor.isNativePlatform()) {
          console.log("[App] User detected, re-initializing push token...");
          initializePushNotifications();
        }
      });

      unsubscribeVersion = onSnapshot(doc(db, "settings", "version"), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const remoteVersion = data?.version || "0.0";
          const LOCAL_VERSION = "22.0";
          if (isNewerVersion(remoteVersion, LOCAL_VERSION)) {
            setUpdateInfo(data);
            setShowUpdateModal(true);
          }
        }
      });
    };
    setupListeners();

    return () => {
      isMounted = false;
      window.removeEventListener('check-for-updates', handleManualUpdate);
      cleanupSmartNotifications();
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeAlerts) unsubscribeAlerts();
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeVersion) unsubscribeVersion();
    };
  }, []);

  // منطق المؤقت للإعلان الإجباري
  useEffect(() => {
    if (announcementTimer > 0) {
      const timer = setInterval(() => {
        setAnnouncementTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (mandatoryAnnouncement) {
      setMandatoryAnnouncement(null);
    }
  }, [announcementTimer, mandatoryAnnouncement]);

  return (
    <>
      {/* Mandatory Announcement - Premium Top Bar Version */}
      {mandatoryAnnouncement && announcementTimer > 0 && (
        <div className="force-dark fixed top-0 left-0 right-0 z-[10000] p-4 animate-in slide-in-from-top duration-700">
           <div className="max-w-xl mx-auto bg-[#0a0a0a]/90 backdrop-blur-xl border border-[#d4af37]/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden relative group">
              {/* Progress Bar (Background) */}
              <div 
                className="absolute bottom-0 left-0 h-[2px] bg-[#d4af37] transition-all duration-1000 ease-linear shadow-[0_0_100px_#d4af37]"
                style={{ width: `${(announcementTimer / 60) * 100}%` }}
              />

              <div className="flex items-center gap-4 px-6 py-4">
                 {/* Icon with Mini Timer */}
                 <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center border border-[#d4af37]/20">
                       <Bell className="w-5 h-5 text-[#d4af37] animate-swing" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#d4af37] rounded-full flex items-center justify-center shadow-lg">
                       <span className="text-[9px] font-black text-black">{announcementTimer}</span>
                    </div>
                 </div>

                 {/* Message Content */}
                 <div className="flex-1 text-center min-w-0">
                    <p className="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.2em] mb-0.5 opacity-60">تنبيه إداري</p>
                    <p className="text-sm font-bold text-white font-arabic leading-relaxed truncate">
                       {mandatoryAnnouncement}
                    </p>
                 </div>

                 {/* Status Label & Close */}
                 <div className="shrink-0 flex items-center gap-2">
                    <button 
                      onClick={() => setAnnouncementTimer(0)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all border border-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Permission Request Modal (First Run Only) */}
      {showPermissionModal && (
        <div className="force-dark fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black font-arabic overflow-hidden">
           {/* Decorative BG */}
           <div className="absolute inset-0 bg-[#0a0a0a]">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5" />
              <div className="absolute inset-0 islamic-pattern opacity-[0.03] scale-150 rotate-12" />
           </div>

           <div className="relative w-full max-w-lg">
              <div className="relative bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-10 md:p-14 rounded-[3rem] flex flex-col items-center gap-10 shadow-2xl animate-in zoom-in-95 duration-700">
                 
                 <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-2xl">
                    <ShieldCheck className="w-12 h-12 text-primary" />
                 </div>

                 <div className="text-center space-y-4">
                    <h2 className="text-3xl font-black text-white tracking-tight">صلاحيات التشغيل</h2>
                    <p className="text-white/50 text-sm font-bold leading-relaxed">
                       لكي يعمل التطبيق بشكل صحيح ويطلق الأذان في وقته، نحتاج منك السماح ببعض الصلاحيات الأساسية.
                    </p>
                 </div>

                 <div className="w-full space-y-4">
                    <div className="flex items-center gap-5 p-5 bg-white/[0.03] rounded-2xl border border-white/5">
                       <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                          <Bell className="w-6 h-6" />
                       </div>
                       <div className="flex-1 text-right">
                          <p className="text-white font-black text-sm">إشعارات الأذان</p>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">For Background Athan</p>
                       </div>
                       <CheckCircle2 className="w-5 h-5 text-emerald-500/40" />
                    </div>

                    <div className="flex items-center gap-5 p-5 bg-white/[0.03] rounded-2xl border border-white/5">
                       <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                          <MapPin className="w-6 h-6" />
                       </div>
                       <div className="flex-1 text-right">
                          <p className="text-white font-black text-sm">تحديد الموقع</p>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">For Accurate Prayer Times</p>
                       </div>
                       <CheckCircle2 className="w-5 h-5 text-emerald-500/40" />
                    </div>
                 </div>

                 <button 
                   onClick={requestAllPermissions}
                   className="w-full py-5 bg-primary text-black rounded-[2rem] font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                    <span>سماح بالصلاحيات الآن</span>
                    <ArrowRight className="w-5 h-5" />
                 </button>

                 <p className="text-[9px] text-white/15 font-black text-center leading-relaxed">
                    نحن لا نشارك بيانات موقعك مع أي طرف ثالث، تستخدم فقط لحساب مواقيت الصلاة محلياً.
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* Global Announcement Banner */}
      {globalAlert && (
        <div className="force-dark fixed top-0 left-0 right-0 z-[4000] p-4 animate-in slide-in-from-top duration-700">
           <div className="max-w-xl mx-auto bg-[#0a0a0a]/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden relative group">
              <div className="flex items-center gap-4 px-6 py-4">
                 {/* Icon */}
                 <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                       <Bell className="w-5 h-5 text-amber-400 group-hover:animate-swing" />
                    </div>
                 </div>

                 {/* Message Content */}
                 <div className="flex-1 text-right min-w-0">
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-0.5 opacity-65">{globalAlert.title || "تنبيه جديد"}</p>
                    <p className="text-sm font-bold text-white font-arabic leading-relaxed whitespace-pre-line">
                       {globalAlert.message}
                    </p>
                 </div>

                 {/* Close Button */}
                 <div className="shrink-0 flex items-center gap-2">
                    <button 
                      onClick={() => {
                        try {
                          const closed = JSON.parse(sessionStorage.getItem("closed_alerts") || "[]");
                          closed.push(globalAlert.id);
                          sessionStorage.setItem("closed_alerts", JSON.stringify(closed));
                        } catch (err) {
                          console.error(err);
                        }
                        setGlobalAlert(null);
                      }}
                      className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all border border-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-[#FDFBF7] dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border-2 border-primary/20 flex flex-col items-center text-center animate-in zoom-in-95 duration-500 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')" }} />
            
            <button 
              onClick={() => setShowUpdateModal(false)}
              className="absolute top-6 left-6 text-black/20 dark:text-white/20 hover:text-black dark:hover:text-white transition-colors z-30"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative z-20 w-full flex flex-col items-center p-8">
                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6 border border-primary/20">
                  <Download className="w-10 h-10 text-primary animate-bounce" />
                </div>

                <h3 className="text-2xl font-black text-black dark:text-white font-arabic mb-2">تحديث جديد متاح!</h3>
                <p className="text-black/60 dark:text-white/60 text-sm mb-6 leading-relaxed px-4 font-bold">
                   نسخة جديدة من التطبيق متوفرة الآن ({updateInfo?.version}). يرجى التحميل للحصول على آخر المميزات والتحسينات.
                </p>

                {updateInfo?.releaseNotes && (
                  <div className="w-full bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 mb-8 flex items-start gap-3 text-right border border-primary/10">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <p className="text-[11px] text-primary/80 font-bold leading-normal">{updateInfo.releaseNotes}</p>
                  </div>
                )}

                <button 
                  onClick={() => window.open(updateInfo?.downloadUrl, '_blank')}
                  className="w-full py-5 bg-primary text-black rounded-[1.5rem] font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Download className="w-5 h-5" />
                  تحديث الآن
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Splash Screen Overlay */}
      {showSplash && (
        <div 
          ref={overlayRef}
          className="force-dark fixed inset-0 z-[5000] bg-[#05060a] flex flex-col items-center justify-center font-arabic overflow-hidden select-none"
        >
           {/* Decorative Background Glows */}
           <div className="absolute inset-0 bg-gradient-to-b from-[#0e1424] via-[#090b11] to-[#05060a]" />
           <div className="absolute w-[45rem] h-[45rem] rounded-full bg-[#fbbf24]/5 blur-[120px] pointer-events-none" />
           <div className="absolute inset-0 islamic-pattern opacity-[0.02] scale-110" />
           
           {/* Central SVG Calligraphy / Logo animation */}
           <div ref={logoImgRef} className="relative w-44 h-44 flex items-center justify-center mb-6">
              {/* Rotating background ring - hidden on mobile for performance */}
              <div className="absolute inset-0 md:block hidden animate-[spin_60s_linear_infinite] opacity-15">
                 <svg viewBox="0 0 100 100" className="w-full h-full text-[#fbbf24]/40">
                    <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.25" strokeDasharray="3 6" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" />
                 </svg>
              </div>
              
              {/* SVG drawing */}
              <svg viewBox="0 0 100 100" className="w-32 h-32 text-[#fbbf24] drop-shadow-[0_0_15px_rgba(251,191,36,0.35)]">
                 {/* Islamic 8-pointed star (Rub el Hizb) */}
                 <path 
                    ref={starPathRef}
                    d="M 50 8 L 62 20 L 78 20 L 78 36 L 90 48 L 78 60 L 78 76 L 62 76 L 50 88 L 38 76 L 22 76 L 22 60 L 10 48 L 22 36 L 22 20 L 38 20 Z" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.2" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                 />
                 {/* Open Quran Book */}
                 <path 
                    ref={bookPathRef}
                    d="M 50 62 C 43 57 32 57 30 59 L 30 40 C 32 38 43 38 50 43 Z M 50 62 C 57 57 68 57 70 59 L 70 40 C 68 38 57 38 50 43 Z M 50 43 L 50 63" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.2" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                 />
              </svg>
           </div>
           
           {/* Brand and titles */}
           <div ref={textContainerRef} className="text-center z-10">
              <h1 className="text-3xl font-black text-white tracking-wider mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] font-arabic">
                 يَـقِـيـن
              </h1>
              <p className="text-[10px] text-[#fbbf24] font-black tracking-[0.25em] font-arabic uppercase opacity-85">
                 المصحف الإلكتروني والأذكار
              </p>
           </div>
           
           {/* Footer info & Skip button */}
           <div className="absolute bottom-10 flex flex-col items-center gap-6 z-10 w-full px-6">
              <button
                 ref={skipBtnRef}
                 onClick={handleSkipSplash}
                 className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition duration-300 text-[10px] font-black text-white/75 active:scale-95 shadow-md"
              >
                 <SkipForward className="w-3.5 h-3.5" />
                 تخطي التحميل
              </button>
              
              <div ref={authorRef} className="flex flex-col items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] animate-ping" />
                 <p className="text-[9px] text-white/30 font-bold tracking-widest uppercase">
                    بواسطة يوسف أسامة
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmData && (
        <div className="force-dark fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 font-arabic">
          <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[2rem] p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#fbbf24]/10 text-[#fbbf24] flex items-center justify-center mx-auto mb-4 border border-[#fbbf24]/20">
               <Info className="w-6 h-6 animate-pulse" />
            </div>
            
            <h3 className="text-base font-black text-white mb-2 leading-relaxed">تأكيد الإجراء</h3>
            <p className="text-white/70 text-xs leading-relaxed mb-6 whitespace-pre-line">
              {confirmData.message}
            </p>
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  confirmData.resolve(true);
                  setConfirmData(null);
                }}
                className="flex-1 py-3 bg-[#fbbf24] text-black rounded-xl text-xs font-black hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#fbbf24]/10"
              >
                تأكيد
              </button>
              <button
                onClick={() => {
                  confirmData.resolve(false);
                  setConfirmData(null);
                }}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-white/80 rounded-xl text-xs font-black hover:bg-white/10 active:scale-95 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast Alert */}
      {toast && (
        <div className="force-dark fixed bottom-6 left-1/2 -translate-x-1/2 z-[100000] p-4 w-full max-w-sm animate-in slide-in-from-bottom-5 duration-300 font-arabic">
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#fbbf24]/10 text-[#fbbf24] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <p className="text-xs font-bold text-white leading-relaxed truncate">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-white/40 hover:text-white p-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {showOnboarding && (
        <OnboardingOverlay onClose={() => setShowOnboarding(false)} />
      )}

      {children}

      {/* Smart App Banner - Platform Aware */}
      <AppBanner apkDownloadUrl="https://yaqeen-app.vercel.app/download/" />
    </>
  );
}
