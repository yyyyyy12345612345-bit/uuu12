"use client";

import { useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { X, Download, Info } from 'lucide-react';

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
    for (let i = 0; i < Math.max(s.length, l.length); i++) {
      const sv = s[i] || 0;
      const lv = l[i] || 0;
      if (sv > lv) return true;
      if (sv < lv) return false;
    }
    return false;
  };

  const checkForUpdates = async (manual = false) => {
    if (!Capacitor.isNativePlatform()) {
      if (manual) alert("التحديثات متاحة فقط لنسخة التطبيق (APK)");
      return;
    }

    try {
      const info = await App.getInfo();
      const currentNativeVersion = info.version.trim(); 

      const response = await fetch('/version.json?t=' + Date.now());
      const data = await response.json();
      const serverVersion = data.version.trim();
      
      console.log(`[UpdateCheck] Local: ${currentNativeVersion}, Server: ${serverVersion}`);

      if (isNewerVersion(serverVersion, currentNativeVersion)) {
        setUpdateInfo(data);
        setShowUpdateModal(true);
      } else if (manual) {
        alert("أنت تستخدم أحدث نسخة بالفعل ✅");
      }
    } catch (error) {
      if (manual) alert("فشل الاتصال بخادم التحديثات");
    }
  };

  useEffect(() => {
    // Permissions check on start
    const initializePermissions = async () => {
      console.log('[App] Starting permission requests...');
      
      try {
        // 1. Notification Permission (Critical for Adhan)
        if (Capacitor.isNativePlatform()) {
          const notifStatus = await LocalNotifications.checkPermissions();
          if (notifStatus.display !== 'granted') {
            await LocalNotifications.requestPermissions();
          }
        } else if ("Notification" in window && Notification.permission === "default") {
          await Notification.requestPermission();
        }

        // 2. Location Permission (Critical for Prayer Times)
        if (Capacitor.isNativePlatform()) {
          const locStatus = await Geolocation.checkPermissions();
          if (locStatus.location !== 'granted') {
            await Geolocation.requestPermissions();
          }
        } else if (navigator.geolocation) {
          // Just a dummy call to trigger browser prompt
          navigator.geolocation.getCurrentPosition(() => {}, () => {}, { timeout: 100 });
        }

        // 2. Check for Updates
        const checkUpdate = async () => {
          try {
            const response = await fetch("/version.json?t=" + Date.now());
            const data = await response.json();
            const CURRENT_VERSION = "1.1.6";
            
            if (data.version && data.version !== CURRENT_VERSION) {
              if (window.confirm(`هناك تحديث جديد متاح (V${data.version}). هل تريد تنزيل النسخة الجديدة الآن؟`)) {
                window.location.href = "https://github.com/yyyyyy12345612345-bit/uuu12/releases/latest/download/app-debug.apk";
              }
            }
          } catch (e) {
            console.error("Update check failed", e);
          }
        };
        
        // Check after 5 seconds to not block startup
        setTimeout(checkUpdate, 5000);

        // 3. Hide splash screen after prompts
        if (Capacitor.isNativePlatform()) {
          await SplashScreen.hide();
        }
      } catch (error) {
        console.error('❌ Permissions Error:', error);
        // Ensure splash screen is hidden even if error occurs
        if (Capacitor.isNativePlatform()) await SplashScreen.hide();
      }
    };

    initializePermissions();

    // Listen for manual update trigger
    const handleManualUpdate = () => checkForUpdates(true);
    window.addEventListener('check-for-updates', handleManualUpdate);

    return () => {
      window.removeEventListener('check-for-updates', handleManualUpdate);
    };
  }, []);

  if (!showUpdateModal) return null;

  return (
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
