"use client";

import React, { useState, use, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEditor } from "@/store/useEditor";
import { usePathname } from "next/navigation";
import { MessageSquare, Download, Settings, X } from "lucide-react";

// Pre-load components
const SurahSelector = dynamic(() => import("@/components/SurahSelector").then(mod => mod.SurahSelector), { ssr: false });
const VideoPreview = dynamic(() => import("@/components/VideoPreview").then(mod => mod.VideoPreview), { ssr: false });
const Controls = dynamic(() => import("@/components/Controls").then(mod => mod.Controls), { ssr: false });
const RenderModal = dynamic(() => import("@/components/RenderModal").then(mod => mod.RenderModal), { ssr: false });
const Mushaf = dynamic(() => import("@/components/Mushaf").then(mod => mod.Mushaf), { ssr: false });
const PrayerTimes = dynamic(() => import("@/components/PrayerTimes").then(mod => mod.PrayerTimes), { ssr: false });
const AudioLibrary = dynamic(() => import("@/components/AudioLibrary").then(mod => mod.AudioLibrary), { ssr: false });
const DailyHub = dynamic(() => import("@/components/DailyHub").then(mod => mod.DailyHub), { ssr: false });
const Navigation = dynamic(() => import("@/components/Navigation").then(mod => mod.Navigation), { ssr: false });
const PWAInstallButton = dynamic(() => import("@/components/PWAInstallButton").then(mod => mod.PWAInstallButton), { ssr: false });
const FeedbackModal = dynamic(() => import("@/components/FeedbackModal").then(mod => mod.FeedbackModal), { ssr: false });
const DigitalMushaf = dynamic(() => import("@/components/DigitalMushaf").then(mod => mod.DigitalMushaf), { ssr: false });

export default function CatchAllPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  return (
    <React.Suspense fallback={<LoadingShell />}>
      <CatchAllContent params={params} />
    </React.Suspense>
  );
}

function CatchAllContent({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { state } = useEditor();
  const pathname = usePathname();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isRenderOpen, setIsRenderOpen] = useState(false);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  
  // Unwrap params using React.use()
  use(params);

  const activeView = useMemo(() => {
    if (pathname === "/") return "mushaf";
    return pathname.split('/').filter(Boolean)[0] || "mushaf";
  }, [pathname]);

  const [visited, setVisited] = useState<Record<string, boolean>>({ mushaf: true });

  React.useEffect(() => {
    if (!visited[activeView]) {
      setVisited(prev => ({ ...prev, [activeView]: true }));
    }
  }, [activeView, visited]);

  // Handle Hydration with a Shell instead of null to prevent SSR crash
  if (!state.isHydrated) return <LoadingShell />;

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col w-full font-arabic overflow-hidden transition-opacity duration-1000">
      <header className="h-20 shrink-0 bg-black/40 border-b border-white/5 px-4 md:px-10 flex items-center justify-between z-[110]">
        <Link href="/" className="flex items-center gap-3">
          <img src="/logo/logo.png?v=4" alt="Logo" className="w-10 h-10" />
          <h1 className="text-xl font-bold hidden sm:block">قرآن</h1>
        </Link>
        <div className="flex items-center gap-3">
          {activeView === 'video' && (
            <button 
                onClick={() => setIsRenderOpen(true)} 
                className="p-3 bg-primary text-black rounded-xl font-bold shadow-lg flex items-center gap-2"
            >
                <Download className="w-4 h-4" />
                <span className="text-sm">تصدير</span>
            </button>
          )}
          <PWAInstallButton />
          <button onClick={() => setIsFeedbackOpen(true)} className="p-3 bg-white/5 rounded-xl"><MessageSquare className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden bg-[#050505]">
        {visited.mushaf && <div className={`h-full w-full ${activeView === 'mushaf' ? 'block' : 'hidden'}`}><Mushaf /></div>}
        {visited.shamrely && <div className={`h-full w-full ${activeView === 'shamrely' ? 'block' : 'hidden'}`}><DigitalMushaf /></div>}
        {visited.daily && <div className={`h-full w-full ${activeView === 'daily' ? 'block' : 'hidden'}`}><DailyHub /></div>}
        {visited.library && <div className={`h-full w-full ${activeView === 'library' ? 'block' : 'hidden'}`}><AudioLibrary /></div>}
        {visited.prayers && <div className={`h-full w-full ${activeView === 'prayers' ? 'block' : 'hidden'}`}><PrayerTimes /></div>}
        
        {visited.video && (
          <div className={`h-full w-full ${activeView === 'video' ? 'block' : 'hidden'}`}>
             <div className="flex h-full w-full overflow-hidden">
                <aside className="hidden lg:flex w-[350px] h-full border-r border-white/5 flex-col p-6 overflow-y-auto no-scrollbar gap-6">
                   <SurahSelector /><Controls />
                </aside>
                <div className="flex-1 flex items-center justify-center p-4 relative capitalize">
                   <button 
                      onClick={() => setIsMobileControlsOpen(true)}
                      className="lg:hidden absolute top-10 right-8 z-50 flex flex-col items-center gap-1 active:scale-95 transition-all"
                   >
                      <div className="p-4 bg-primary/25 backdrop-blur-2xl border border-primary/40 rounded-full shadow-2xl ring-4 ring-primary/5">
                        <Settings className="w-7 h-7 text-primary animate-spin-slow" />
                      </div>
                      <span className="text-[10px] font-bold text-primary bg-black/60 px-2 py-0.5 rounded-full shadow-lg">إعدادات الفيديو</span>
                   </button>
                   <VideoPreview key={state.reciterId} />
                </div>
             </div>
          </div>
        )}
      </main>

      <Navigation />

      {isMobileControlsOpen && (
        <div className="fixed inset-0 z-[300] lg:hidden">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsMobileControlsOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 h-[85vh] bg-[#0a0a0a] rounded-t-[3rem] border-t border-white/10 flex flex-col p-6 overflow-hidden animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold">تعديل الفيديو</h2>
                    <button onClick={() => setIsMobileControlsOpen(false)} className="p-3 bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
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
        <div className="fixed inset-0 bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em]">جارٍ التهيئة...</span>
            </div>
        </div>
    );
}
