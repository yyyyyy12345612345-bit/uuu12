"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEditor } from "@/store/useEditor";
import { usePathname, useRouter } from "next/navigation";
import { Download, Menu, X, MessageSquare } from "lucide-react";

// Dynamic Imports
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

export default function CatchAllPage({ params }: { params: { slug?: string[] } }) {
  const { state, updateState } = useEditor();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isRenderOpen, setIsRenderOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);

  // Sync URL to State
  useEffect(() => {
    const view = params.slug?.[0] || "video";
    const subId = params.slug?.[1]; // e.g., surah ID or reciter ID

    if (["mushaf", "library", "daily", "prayers", "video"].includes(view)) {
      const updates: any = { view: view as any };
      if (subId) {
        if (view === "mushaf" || view === "library") {
           updates.surahId = subId;
        }
      }
      updateState(updates);
    }
  }, [params.slug, updateState]);

  // Prevent flash until hydrated
  if (!state.isHydrated) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-[200]">
        <div className="w-24 h-24 rounded-3xl overflow-hidden border border-primary/20 bg-primary/5 flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(212,175,55,0.1)]">
          <img src="/logo/logo.png?v=4" alt="Logo" className="w-16 h-16 object-contain" />
        </div>
        <div className="mt-8 flex flex-col items-center">
            <h1 className="text-2xl font-bold text-white mb-2">قرآن كريم</h1>
            <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-primary animate-bounce delay-75" />
                <div className="w-1 h-1 rounded-full bg-primary animate-bounce delay-150" />
                <div className="w-1 h-1 rounded-full bg-primary animate-bounce delay-300" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#050505] text-white overflow-x-hidden overflow-y-hidden islamic-pattern font-arabic select-none flex flex-col w-full max-w-full">
      <header className="h-20 shrink-0 glass-effect border-b border-white/5 px-4 md:px-14 flex items-center justify-between z-[110] relative">
<Link href="/" className="flex items-center gap-3 md:gap-5 group">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl overflow-hidden border border-primary/20 bg-primary/10 flex items-center justify-center transition-all group-hover:scale-110 shadow-lg shrink-0">
            <img src="/logo/logo.png?v=4" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white leading-none">قرآن</h1>
            <span className="hidden xs:block text-[10px] text-primary/60 font-bold uppercase tracking-[0.2em] mt-1">Premium PWA</span>
          </div>
        </Link>

        <div className="flex items-center gap-3 md:gap-4">
          <PWAInstallButton />
          <div className="h-6 w-px bg-white/10 mx-1 hidden xs:block" />
          <button 
            onClick={() => setIsFeedbackOpen(true)}
            className="p-3 bg-white/5 rounded-xl border border-white/5 text-white/40 hover:text-primary hover:bg-primary/10 transition-all flex items-center gap-2 group"
          >
             <MessageSquare className="w-4 h-4 md:w-5 h-5 group-hover:scale-110 transition-transform" />
             <span className="hidden sm:block text-[10px] font-bold font-arabic uppercase tracking-tighter">تواصل</span>
          </button>
          <div className="h-6 w-px bg-white/10 mx-1 hidden xs:block" />
          <div className="flex flex-col items-end shrink-0 hidden xs:flex">
             <p className="text-[8px] md:text-[9px] text-white/30 uppercase tracking-widest font-bold">Developed By</p>
             <a href="https://www.instagram.com/youssef_osama04?igsh=MXV2Y2o5MzE0d2c1dA==" target="_blank" className="text-[10px] md:text-xs font-bold text-primary/80 hover:text-primary transition-all">Youssef Osama</a>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        <div className="h-full w-full min-h-0 relative">
          {state.view === "video" && (
            <div className="flex h-full w-full animate-premium-in overflow-hidden items-center justify-center">
              <aside className="hidden lg:flex w-[420px] h-full glass-effect border-r border-white/5 flex-col p-8 pb-28 overflow-y-auto no-scrollbar gap-8 shrink-0">
                 <div className="flex items-center gap-4 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-widest text-primary/80">صانع الفيديوهات</h2>
                 </div>
                 <div className="space-y-10">
                    <section><SurahSelector /></section>
                    <section><Controls /></section>
                 </div>
                 <div className="mt-auto pt-8 border-t border-white/5">
                    <button onClick={() => setIsRenderOpen(true)} className="w-full bg-primary text-black py-5 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02] shadow-2xl shadow-primary/20 transition-all">
                       <Download className="w-5 h-5" />
                       <span>تصدير الفيديو النهائي</span>
                    </button>
                 </div>
              </aside>
              <div className="flex-1 relative flex items-center justify-center p-4 min-h-[500px] w-full">
                <div className="relative w-full max-w-[320px] aspect-[9/16] h-auto max-h-[80vh] shadow-[0_0_150px_rgba(0,0,0,0.8)] z-10 rounded-[2.5rem] overflow-hidden backdrop-blur-sm lg:translate-y-[-2%] flex items-center justify-center">
                   <VideoPreview key={state.reciterId} />
                </div>
                <div className="lg:hidden absolute bottom-44 right-6 flex flex-col gap-6 z-50">
                  <button onClick={() => setIsMobileControlsOpen(true)} className="w-16 h-16 rounded-full bg-white/10 border border-white/10 text-white backdrop-blur-3xl flex items-center justify-center shadow-2xl hover:bg-white/20 transition-all">
                    <Menu className="w-7 h-7" />
                  </button>
                  <button onClick={() => setIsRenderOpen(true)} className="w-16 h-16 rounded-full bg-primary text-black shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-primary/20">
                    <Download className="w-7 h-7" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {state.view === "mushaf" && <div className="h-full w-full animate-premium-in"><Mushaf /></div>}
          {state.view === "library" && <div className="h-full w-full animate-premium-in"><AudioLibrary /></div>}
          {state.view === "prayers" && <div className="h-full w-full animate-premium-in"><PrayerTimes /></div>}
          {state.view === "daily" && <div className="h-full w-full animate-premium-in"><DailyHub /></div>}
        </div>
      </main>

      <Navigation />

      {isMobileControlsOpen && (
        <div className="fixed inset-0 z-[120] animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setIsMobileControlsOpen(false)} />
           <div className="absolute bottom-0 left-0 right-0 h-[85vh] bg-[#0a0a0a] border-t border-white/10 rounded-t-[3.5rem] p-8 overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-5 duration-500">
              <div className="flex items-center justify-between mb-10">
                 <h2 className="text-2xl font-bold font-arabic text-primary">إعدادات الفيديو</h2>
                 <button onClick={() => setIsMobileControlsOpen(false)} className="p-3 bg-white/5 rounded-2xl"><X /></button>
              </div>
              <div className="space-y-12 pb-20"><SurahSelector /><Controls /></div>
           </div>
        </div>
      )}

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <RenderModal isOpen={isRenderOpen} onClose={() => setIsRenderOpen(false)} />
    </div>
  );
}
