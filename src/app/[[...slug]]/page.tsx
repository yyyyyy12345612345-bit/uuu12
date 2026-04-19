"use client";

import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { useEditor } from "@/store/useEditor";
import { usePathname } from "next/navigation";
import { Settings, X, MessageCircle, Download } from "lucide-react";

// Pre-load components with ssr: false for all to ensure stability in Next.js 16
const SurahSelector = dynamic(() => import("@/components/SurahSelector").then(mod => mod.SurahSelector), { ssr: false });
const VideoPreview = dynamic(() => import("@/components/VideoPreview").then(mod => mod.VideoPreview), { ssr: false });
const Controls = dynamic(() => import("@/components/Controls").then(mod => mod.Controls), { ssr: false });
const RenderModal = dynamic(() => import("@/components/RenderModal").then(mod => mod.RenderModal), { ssr: false });
const Mushaf = dynamic(() => import("@/components/Mushaf").then(mod => mod.Mushaf), { ssr: false });
const PrayerTimes = dynamic(() => import("@/components/PrayerTimes").then(mod => mod.PrayerTimes), { ssr: false });
const AudioLibrary = dynamic(() => import("@/components/AudioLibrary").then(mod => mod.AudioLibrary), { ssr: false });
const DailyHub = dynamic(() => import("@/components/DailyHub").then(mod => mod.DailyHub), { ssr: false });
const Navigation = dynamic(() => import("@/components/Navigation").then(mod => mod.Navigation), { ssr: false });
const DigitalMushaf = dynamic(() => import("@/components/DigitalMushaf").then(mod => mod.DigitalMushaf), { ssr: false });
const FeedbackModal = dynamic(() => import("@/components/FeedbackModal").then(mod => mod.FeedbackModal), { ssr: false });
const PWAInstallButton = dynamic(() => import("@/components/PWAInstallButton").then(mod => mod.PWAInstallButton), { ssr: false });

export default function CatchAllPage() {
  return (
    <React.Suspense fallback={<LoadingShell />}>
      <CatchAllContent />
    </React.Suspense>
  );
}

function CatchAllContent() {
  const { state } = useEditor();
  const pathname = usePathname();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isRenderOpen, setIsRenderOpen] = useState(false);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);

  // Derived active view from pathname - the safest way in Next.js 15/16 Client Components
  const activeView = useMemo(() => {
    if (!pathname || pathname === "/") return "mushaf";
    return pathname.split('/').filter(Boolean)[0] || "mushaf";
  }, [pathname]);

  const [visited, setVisited] = useState<Record<string, boolean>>({ mushaf: true });

  useEffect(() => {
    if (activeView && !visited[activeView]) {
      setVisited(prev => ({ ...prev, [activeView]: true }));
    }
  }, [activeView, visited]);

  // Prevent any rendering until hydration is complete to stop Next.js 16 mismatch
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !state.isHydrated) return <LoadingShell />;

  return (
    <div className="fixed inset-0 bg-[#050505] text-white flex flex-col w-full font-arabic overflow-hidden transition-opacity duration-1000">
      
      {/* Global Top Bar - Logo + Install + Feedback */}
      <header className="h-14 shrink-0 bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 flex items-center justify-between z-[200]">
        <div className="flex items-center gap-3">
          <img src="/logo/logo.png" alt="قرآن" className="w-8 h-8 rounded-xl" />
          <span className="text-sm font-bold font-arabic text-primary hidden sm:block">قرآن</span>
        </div>
        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <button 
            onClick={() => setIsFeedbackOpen(true)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-2xl transition-all text-white/40 hover:text-white"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-bold text-[11px] font-arabic hidden sm:block">رسالة</span>
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {visited.mushaf && <div className={`h-full w-full mb-20 ${activeView === 'mushaf' ? 'block' : 'hidden'}`}><Mushaf /></div>}
        {visited['mushaf-full'] && <div className={`h-full w-full mb-20 ${activeView === 'mushaf-full' ? 'block' : 'hidden'}`}><DigitalMushaf /></div>}
        {visited.daily && <div className={`h-full w-full pb-32 ${activeView === 'daily' ? 'block' : 'hidden'}`}><DailyHub /></div>}
        {visited.library && <div className={`h-full w-full pb-32 ${activeView === 'library' ? 'block' : 'hidden'}`}><AudioLibrary /></div>}
        {visited.prayers && <div className={`h-full w-full pb-32 ${activeView === 'prayers' ? 'block' : 'hidden'}`}><PrayerTimes /></div>}
        
        {visited.video && (
          <div className={`h-full w-full ${activeView === 'video' ? 'block' : 'hidden'}`}>
             <div className="flex h-full w-full overflow-hidden">
                <aside className="hidden lg:flex w-[350px] h-full border-r border-white/5 flex-col p-6 overflow-y-auto no-scrollbar gap-6 pb-40">
                   <SurahSelector /><Controls />
                </aside>
                <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar">
                   {/* Top Buttons - Always Visible */}
                   <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
                      <button 
                         onClick={() => setIsMobileControlsOpen(true)}
                         className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-2xl active:scale-95 transition-all"
                      >
                         <Settings className="w-4 h-4 text-primary" />
                         <span className="text-xs font-bold font-arabic text-primary">الإعدادات</span>
                      </button>
                      
                      <button 
                         onClick={() => setIsRenderOpen(true)}
                         className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black rounded-2xl font-bold text-xs active:scale-95 transition-all shadow-lg shadow-primary/20"
                      >
                         <Download className="w-4 h-4" />
                         <span className="font-arabic">تصدير الفيديو</span>
                      </button>
                   </div>
                   
                   {/* Video Preview Container - Height reduced by another 15% */}
                   <div className="flex-1 flex items-center justify-center p-2 min-h-0 bg-black/20">
                      <div className="scale-[0.85] h-full flex items-center justify-center">
                        <VideoPreview key={state.reciterId} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      <Navigation />

      {isMobileControlsOpen && (
        <div className="fixed inset-0 z-[300] lg:hidden">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsMobileControlsOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 h-[85vh] bg-[#0a0a0a] rounded-t-[3rem] border-t border-white/10 flex flex-col p-6 overflow-hidden animate-in slide-in-from-bottom duration-300 text-right">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setIsMobileControlsOpen(false)} className="p-3 bg-white/5 rounded-full"><X className="w-6 h-6 text-white/40" /></button>
                    <h2 className="text-xl font-bold font-arabic">إعدادات الفيديو</h2>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar pb-10 px-2">
                    <SurahSelector />
                    <div className="h-8" />
                    <Controls />
                </div>
            </div>
        </div>
      )}

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <RenderModal isOpen={isRenderOpen} onClose={() => setIsRenderOpen(false)} />
    </div>
  );
}

function LoadingShell() {
    return (
        <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">جارٍ التهيئة...</span>
            </div>
        </div>
    );
}
