"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Share, PlusSquare, MoreVertical, Smartphone, Monitor } from "lucide-react";

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    setIsStandalone(standalone);
    if (standalone) setIsInstalled(true);

    // Platform detection for iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log("PWA install prompt deferred");
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log("PWA was installed");
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowInstructions(true);
    }
  };

  if (isInstalled || isStandalone) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="group relative flex items-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/20 hover:border-primary px-5 py-2.5 rounded-2xl transition-all duration-500 shadow-xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
        <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="font-bold text-xs font-arabic">تثبيت التطبيق</span>
      </button>

      {/* Instructions Overlay */}
      {showInstructions && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowInstructions(false)} />
            
            <div className="relative bg-[#0a0a0a] border border-white/10 p-8 md:p-12 rounded-[3.5rem] max-w-lg w-full shadow-2xl text-right animate-in zoom-in-95 duration-500">
                <button 
                  onClick={() => setShowInstructions(false)}
                  className="absolute top-6 left-6 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-2xl">
                        <Smartphone className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-3xl font-bold text-white font-arabic">تثبيت قرآن</h3>
                    <p className="text-white/40 text-sm mt-3 font-medium">استخدم التطبيق بشكل أسرع وأفضل</p>
                </div>
                
                <div className="space-y-8">
                    {isIOS ? (
                        <>
                            <div className="flex items-center gap-6 justify-end group">
                                <div className="flex-1">
                                    <p className="text-white font-bold text-lg mb-1">زر المشاركة</p>
                                    <p className="text-white/40 text-sm">اضغط على أيقونة المشاركة في شريط السفاري السفلي</p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-xl group-hover:bg-primary/10 transition-colors">
                                    <Share className="w-7 h-7" />
                                </div>
                            </div>
                            <div className="flex items-center gap-6 justify-end group">
                                <div className="flex-1">
                                    <p className="text-white font-bold text-lg mb-1">الإضافة للشاشة</p>
                                    <p className="text-white/40 text-sm">ابحث عن خيار "Add to Home Screen" أو "إضافة إلى الشاشة الرئيسية"</p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-xl group-hover:bg-primary/10 transition-colors">
                                    <PlusSquare className="w-7 h-7" />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-6 justify-end group">
                                <div className="flex-1">
                                    <p className="text-white font-bold text-lg mb-1">قائمة الخيارات</p>
                                    <p className="text-white/40 text-sm">اضغط على زر الخيارات (الثلاث نقاط) في المتصفح</p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-xl group-hover:bg-primary/10 transition-colors">
                                    <MoreVertical className="w-7 h-7" />
                                </div>
                            </div>
                            <div className="flex items-center gap-6 justify-end group">
                                <div className="flex-1">
                                    <p className="text-white font-bold text-lg mb-1">تثبيت التطبيق</p>
                                    <p className="text-white/40 text-sm">اضغط على "Install App" أو "تثبيت التطبيق" من القائمة</p>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-xl group-hover:bg-primary/10 transition-colors">
                                    <Download className="w-7 h-7" />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-12 flex flex-col gap-4">
                    <button 
                        onClick={() => setShowInstructions(false)}
                        className="w-full py-5 bg-primary text-black rounded-3xl font-bold text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        فهمت، شكراً
                    </button>
                    <div className="flex items-center justify-center gap-2 py-4 opacity-40">
                         <div className="w-1 h-1 rounded-full bg-white" />
                         <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Certified PWA Experience</span>
                         <div className="w-1 h-1 rounded-full bg-white" />
                    </div>
                </div>
            </div>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
}
