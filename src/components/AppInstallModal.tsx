"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Smartphone, Globe, Download, Check, Zap, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppInstallModal({ isOpen, onClose }: AppInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Listen for browser install prompt (Chrome/Android)
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handlePWAInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setDeferredPrompt(null);
          onClose();
        }
        return;
      } catch (err) {
        console.error("PWA Prompt error:", err);
      }
    }
    // Fallback if no deferred prompt: open the helper installation site directly
    window.open("https://tubular-lebkuchen-c1ed75.netlify.app", "_blank");
  };

  const handleAPKDownload = () => {
    window.open("https://yaqeenalquran.online/download/", "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 md:p-8 font-arabic">
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
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-3xl bg-[#0c0d10] border border-primary/20 rounded-[3rem] shadow-[0_0_100px_rgba(212,175,55,0.15)] overflow-hidden flex flex-col max-h-[90vh] force-dark animate-in duration-300"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 islamic-pattern opacity-[0.04] pointer-events-none" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 p-6 md:p-8 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <h2 className="text-xl md:text-2xl font-black text-white">تنزيل التطبيق</h2>
                  <p className="text-[10px] md:text-xs font-bold text-primary/80 tracking-wider">اختر طريقة التثبيت الأنسب لجهازك</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 md:p-8 overflow-y-auto no-scrollbar flex-1">
              <div className="space-y-6">
                {/* Explanation Note */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-right flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs md:text-sm text-white/60 leading-relaxed font-medium">
                    نوفر لك خيارين متميزين لتشغيل التطبيق على الهاتف. يرجى مراجعة ميزات كل خيار لاختيار الأفضل لك.
                  </p>
                </div>

                {/* Two Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Option 1: PWA */}
                  <div className="flex flex-col h-full p-6 md:p-7 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all duration-300 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
                    
                    <div className="flex items-center gap-3 justify-end mb-4">
                      <div className="text-right">
                        <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors">تطبيق الويب (PWA)</h3>
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-2.5 py-0.5 rounded-full mt-1 inline-block">
                          جميع الأجهزة والآيفون
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                    </div>

                    <p className="text-xs text-white/50 text-right leading-relaxed mb-6 flex-1">
                      تطبيق خفيف يتم إضافته مباشرة لشاشتك الرئيسية من المتصفح. لا يتطلب أي تحميل خارجي، ولا يستهلك مساحة تخزين، ويعمل على جميع الهواتف بما فيها الآيفون والآيباد والكمبيوتر.
                    </p>

                    <div className="space-y-3 mb-6 text-right">
                      {[
                        "يعمل على الآيفون والأندرويد وكل الأجهزة",
                        "سريع جداً وخفيف ولا يستهلك مساحة تخزينية",
                        "تحديثات تلقائية فورية دون الحاجة لإعادة التنزيل"
                      ].map((feat, idx) => (
                        <div key={idx} className="flex items-center justify-end gap-2 text-[11px] font-bold text-white/70">
                          <span>{feat}</span>
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handlePWAInstall}
                      className="w-full py-4 bg-white/5 hover:bg-primary hover:text-black text-white border border-white/10 hover:border-primary rounded-2xl font-black text-xs md:text-sm transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      <span>تنزيل تطبيق PWA</span>
                    </button>
                  </div>

                  {/* Option 2: APK */}
                  <div className="flex flex-col h-full p-6 md:p-7 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all duration-300 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />
                    
                    <div className="flex items-center gap-3 justify-end mb-4">
                      <div className="text-right">
                        <h3 className="text-lg font-black text-white group-hover:text-primary transition-colors">تطبيق أندرويد (APK)</h3>
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] bg-amber-500/10 px-2.5 py-0.5 rounded-full mt-1 inline-block">
                          للأندرويد فقط
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                        <Smartphone className="w-5 h-5" />
                      </div>
                    </div>

                    <p className="text-xs text-white/50 text-right leading-relaxed mb-6 flex-1">
                      تطبيق متكامل يتم تحميله كملف APK وتثبيته مباشرة على هواتف الأندرويد. يوفر أقصى حماية واستقرار لتشغيل الأذكار والصوتيات في الخلفية وتلقي إشعارات الأذان بمواعيدها دون أي قيود من النظام.
                    </p>

                    <div className="space-y-3 mb-6 text-right">
                      {[
                        "استقرار كامل وتام لتشغيل الصوتيات في الخلفية",
                        "إشعارات الأذان والنبضات الصوتية بدقة 100%",
                        "لا يتأثر بقيود المتصفح أو إغلاق التطبيقات"
                      ].map((feat, idx) => (
                        <div key={idx} className="flex items-center justify-end gap-2 text-[11px] font-bold text-white/70">
                          <span>{feat}</span>
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleAPKDownload}
                      className="w-full py-4 bg-primary hover:bg-primary/95 text-black rounded-2xl font-black text-xs md:text-sm shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل تطبيق الأندرويد (APK)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
