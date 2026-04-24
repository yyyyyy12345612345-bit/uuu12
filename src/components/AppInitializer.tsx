"use client";

import { useEffect, useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { X, Download, Info } from 'lucide-react';

export default function AppInitializer() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);

  useEffect(() => {
    // 1. Check for Permissions
    const initializePermissions = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        const locStatus = await Geolocation.checkPermissions();
        if (locStatus.location === 'prompt' || locStatus.location === 'prompt-with-description') {
          await Geolocation.requestPermissions();
        }
        const notifStatus = await LocalNotifications.checkPermissions();
        if (notifStatus.display === 'prompt') {
          await LocalNotifications.requestPermissions();
        }
      } catch (error) {
        console.error('❌ Permissions Error:', error);
      }
    };

    // 2. Check for Updates from Server
    const checkForUpdates = async () => {
      try {
        // Fetch the current native version
        let currentNativeVersion = "1.0.0";
        if (Capacitor.isNativePlatform()) {
          const info = await App.getInfo();
          currentNativeVersion = info.version; // This reads from build.gradle versionName
        }

        const response = await fetch('/version.json?t=' + Date.now());
        const data = await response.json();
        
        // Compare versions (Simple string comparison or can be more complex)
        if (data.version !== currentNativeVersion) {
          setUpdateInfo(data);
          setShowUpdateModal(true);
        }
      } catch (error) {
        console.log('Update check skipped (web or offline)');
      }
    };

    initializePermissions();
    checkForUpdates();

    if (Capacitor.isNativePlatform()) {
      const handleAppState = App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) checkForUpdates();
      });
      return () => { handleAppState.remove(); };
    }
  }, []);

  if (!showUpdateModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#FDFBF7] rounded-[2.5rem] p-8 shadow-2xl border-2 border-primary/20 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        <button 
          onClick={() => setShowUpdateModal(false)}
          className="absolute top-6 left-6 text-black/20 hover:text-black transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-6">
          <Download className="w-10 h-10 text-primary animate-bounce" />
        </div>

        <h3 className="text-2xl font-black text-black font-arabic mb-2">تحديث جديد متاح!</h3>
        <p className="text-black/60 text-sm mb-6 leading-relaxed px-4">
          نسخة جديدة من التطبيق متوفرة الآن ({updateInfo?.version}). يرجى التحميل للحصول على آخر المميزات والتحسينات.
        </p>

        {updateInfo?.releaseNotes && (
          <div className="w-full bg-primary/5 rounded-2xl p-4 mb-8 flex items-start gap-3 text-right">
             <Info className="w-4 h-4 text-primary shrink-0 mt-1" />
             <p className="text-[11px] text-primary/80 font-bold leading-normal">{updateInfo.releaseNotes}</p>
          </div>
        )}

        <button 
          onClick={() => window.open(updateInfo?.downloadUrl, '_blank')}
          className="w-full py-5 bg-primary text-black rounded-[1.5rem] font-bold text-lg shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Download className="w-5 h-5" />
          تحديث الآن
        </button>
      </div>
    </div>
  );
}
