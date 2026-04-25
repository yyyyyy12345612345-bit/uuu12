"use client";

import React, { useState, useEffect } from "react";
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { X, Download, Info, Camera, Loader2 } from 'lucide-react';
import { useEditor } from "@/store/useEditor";
import { auth, db } from "@/lib/firebase";

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  useEffect(() => {
    // Hide splash after 2 seconds
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

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
      const LOCAL_VERSION = "1.1.6";
      
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
    setTimeout(() => checkForUpdates(false), 3000);

    // Listen for manual update trigger
    const handleManualUpdate = () => checkForUpdates(true);
    window.addEventListener('check-for-updates', handleManualUpdate);

    return () => {
      window.removeEventListener('check-for-updates', handleManualUpdate);
    };
  }, []);

  return (
    <>
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
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.5em]">الإصدار 1.1.6</p>
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
