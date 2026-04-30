"use client";

import React, { useState, useEffect } from "react";
import { Capacitor } from '@capacitor/core';
import { X, Download, Info, ShieldCheck, Bell, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Geolocation } from '@capacitor/geolocation';

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [globalAnnouncement, setGlobalAnnouncement] = useState<string | null>(null);
  const [mandatoryAnnouncement, setMandatoryAnnouncement] = useState<string | null>(null);
  const [announcementTimer, setAnnouncementTimer] = useState<number>(0);

  useEffect(() => {
    // Only show splash once per session to avoid annoying re-loads during navigation
    const hasSeenSplash = sessionStorage.getItem("has_seen_splash");
    if (hasSeenSplash) {
      setShowSplash(false);
      checkFirstRun();
      return;
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem("has_seen_splash", "true");
      checkFirstRun();
    }, 1500); // Reduced to 1.5s for better feel
    return () => clearTimeout(timer);
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
      // 1. Notifications
      await LocalNotifications.requestPermissions();
      
      // 2. Location
      await Geolocation.requestPermissions();

      // 3. Android Specific: Battery & Exact Alarms
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
         // We can use a custom native call or just alert the user for now
         // For production, a Capacitor plugin like 'capacitor-community/background-process' would be better
         // But we can use the 'Device' plugin to check info or just guide them.
      }
    } catch (e) {
      console.error("Permission request failed", e);
    } finally {
      localStorage.setItem("has_prompted_permissions", "true");
      setShowPermissionModal(false);
    }
  };

  const isNewerVersion = (serverVer: string, localVer: string) => {
    const s = serverVer.split('.').map(Number);
    const l = localVer.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (s[i] > l[i]) return true;
      if (s[i] < l[i]) return false;
    }
    return false;
  };

  const checkForUpdates = async (isManual = false) => {
    try {
      const response = await fetch('/version.json?t=' + Date.now());
      const data = await response.json();
      const LOCAL_VERSION = "v3.0";
      
      if (isNewerVersion(data.version, LOCAL_VERSION)) {
        setUpdateInfo(data);
        setShowUpdateModal(true);
      } else if (isManual) {
        alert("أنت تستخدم أحدث نسخة بالفعل!");
      }
    } catch (e) {
      console.error("Update check failed", e);
    }
  };

  useEffect(() => {
    // Check for updates on mount
    setTimeout(() => checkForUpdates(false), 5000);

    // Listen for manual update trigger
    const handleManualUpdate = () => checkForUpdates(true);
    window.addEventListener('check-for-updates', handleManualUpdate);

    // Listen for Global Announcements from Firestore
    let unsubscribeSettings: any = null;
    const fetchGlobalSettings = async () => {
      const { db } = await import("@/lib/firebase");
      const { doc, onSnapshot } = await import("firebase/firestore");
      
      unsubscribeSettings = onSnapshot(doc(db, "settings", "global"), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          
          // إذا وجد أي نوع من الإعلانات، سنعامله كإعلان مؤقت
          const message = data.mandatoryAnnouncement || data.announcement;
          if (message) {
            setMandatoryAnnouncement(message);
            // إذا لم يحدد مدة، نفترض 60 ثانية
            setAnnouncementTimer(data.mandatoryDuration || 60);
          } else {
            setMandatoryAnnouncement(null);
            setGlobalAnnouncement(null);
          }
        }
      });
    };
    fetchGlobalSettings();

    return () => {
      window.removeEventListener('check-for-updates', handleManualUpdate);
      if (unsubscribeSettings) unsubscribeSettings();
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
        <div className="fixed top-0 left-0 right-0 z-[10000] p-4 animate-in slide-in-from-top duration-700">
           <div className="max-w-xl mx-auto bg-[#0a0a0a]/90 backdrop-blur-xl border border-[#d4af37]/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden relative group">
              {/* Progress Bar (Background) */}
              <div 
                className="absolute bottom-0 left-0 h-[2px] bg-[#d4af37] transition-all duration-1000 ease-linear shadow-[0_0_10px_#d4af37]"
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
                    <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/10">
                       <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Mandatory</span>
                    </div>
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
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black font-arabic overflow-hidden">
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
                    <span className="text-white/20 text-[10px] font-mono tracking-widest mt-4">VERSION 3.0 (HYPER BUILD 15)</span>
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
      {globalAnnouncement && (
        <div className="fixed top-0 inset-x-0 z-[4000] p-4 md:p-6 animate-in slide-in-from-top duration-500">
           <div className="max-w-4xl mx-auto bg-primary/10 backdrop-blur-2xl border border-primary/20 p-4 md:p-5 rounded-[2rem] shadow-2xl flex items-center justify-between gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                 <Bell className="w-6 h-6 text-black" />
              </div>
              <div className="flex-1 text-center overflow-hidden">
                 <p className="text-foreground font-black font-arabic text-sm md:text-base leading-snug">{globalAnnouncement}</p>
              </div>
              <button 
                onClick={() => setGlobalAnnouncement(null)}
                className="p-3 hover:bg-foreground/5 rounded-xl text-foreground/20 hover:text-foreground transition-all"
              >
                <X className="w-5 h-5" />
              </button>
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
        <div className="fixed inset-0 z-[5000] bg-background flex flex-col items-center justify-center font-arabic animate-out fade-out duration-1000 fill-mode-forwards">
           <div className="absolute inset-0 islamic-pattern opacity-[0.03]" />
           <div className="relative">
              <div className="w-32 h-32 rounded-[2.5rem] bg-primary/10 flex items-center justify-center p-6 border border-primary/20 animate-pulse relative z-10 shadow-2xl shadow-primary/20">
                 <img src="/logo/logo.png?v=10" alt="Logo" className="w-full h-full object-contain" />
              </div>
              {/* Outer Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-primary/10 rounded-full animate-ping duration-[3000ms]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-primary/5 rounded-full animate-ping duration-[4000ms]" />
           </div>
           
           <div className="mt-12 text-center animate-in slide-in-from-bottom-10 duration-1000">
              <h1 className="text-3xl font-black text-foreground tracking-tighter mb-2">قرآن كريم</h1>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.5em]">الإصدار v3.0 (HYPER)</p>
           </div>
           
           <div className="absolute bottom-12 flex flex-col items-center gap-4">
              <div className="w-1 h-12 bg-gradient-to-b from-primary to-transparent rounded-full animate-bounce" />
              <p className="text-[9px] text-foreground/20 font-bold uppercase tracking-widest italic">بواسطة يوسف أسامة</p>
           </div>
        </div>
      )}

      {children}
    </>
  );
}
