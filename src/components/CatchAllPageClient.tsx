"use client";

import React, { useState, useMemo, useEffect } from "react";
import nextDynamic from "next/dynamic";
import { useEditor } from "@/store/useEditor";
import { usePathname } from "next/navigation";
import { Settings, X, Download, Menu } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Pre-load components with ssr: false for all to ensure stability in Next.js 16
const SurahSelector = nextDynamic(() => import("@/components/SurahSelector").then(mod => mod.SurahSelector), { ssr: false });
const VideoPreview = nextDynamic(() => import("@/components/VideoPreview").then(mod => mod.VideoPreview), { ssr: false });
const Controls = nextDynamic(() => import("@/components/Controls").then(mod => mod.Controls), { ssr: false });
const RenderModal = nextDynamic(() => import("@/components/RenderModal").then(mod => mod.RenderModal), { ssr: false });
const Mushaf = nextDynamic(() => import("@/components/Mushaf").then(mod => mod.Mushaf), { ssr: false });
const PrayerTimes = nextDynamic(() => import("@/components/PrayerTimes").then(mod => mod.PrayerTimes), { ssr: false });
const AudioLibrary = nextDynamic(() => import("@/components/AudioLibrary").then(mod => mod.AudioLibrary), { ssr: false });
const DailyHub = nextDynamic(() => import("@/components/DailyHub").then(mod => mod.DailyHub), { ssr: false });
const Navigation = nextDynamic(() => import("@/components/Navigation").then(mod => mod.Navigation), { ssr: false });
const DigitalMushaf = nextDynamic(() => import("@/components/DigitalMushaf").then(mod => mod.DigitalMushaf), { ssr: false });
const FeedbackModal = nextDynamic(() => import("@/components/FeedbackModal").then(mod => mod.FeedbackModal), { ssr: false });
const PWAInstallButton = nextDynamic(() => import("@/components/PWAInstallButton").then(mod => mod.PWAInstallButton), { ssr: false });
const GlobalMenu = nextDynamic(() => import("@/components/GlobalMenu").then(mod => mod.GlobalMenu), { ssr: false });
const Leaderboard = nextDynamic(() => import("@/components/Leaderboard").then(mod => mod.Leaderboard), { ssr: false });
const AdminPanel = nextDynamic(() => import("@/components/AdminPanel").then(mod => mod.AdminPanel), { ssr: false });
const ProfileModal = nextDynamic(() => import("@/components/ProfileModal").then(mod => mod.ProfileModal), { ssr: false });
const AuthGate = nextDynamic(() => import("@/components/AuthGate").then(mod => mod.AuthGate), { ssr: false });
const MushafChoice = nextDynamic(() => import("@/components/MushafChoice").then(mod => mod.MushafChoice), { ssr: false });
const SubscriptionModal = nextDynamic(() => import("@/components/SubscriptionModal").then(mod => mod.SubscriptionModal), { ssr: false });
const CommunityShowcase = nextDynamic(() => import("@/components/CommunityShowcase").then(mod => mod.CommunityShowcase), { ssr: false });

export function CatchAllPageClient() {
  return (
    <React.Suspense fallback={<LoadingShell />}>
      <AuthGate>
        <CatchAllContent />
      </AuthGate>
    </React.Suspense>
  );
}

function CatchAllContent() {
  const { state } = useEditor();
  const pathname = usePathname();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isRenderOpen, setIsRenderOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);


  // Derived active view from pathname - the safest way in Next.js 15/16 Client Components
  const activeView = useMemo(() => {
    if (!pathname || pathname === "/") return "mushaf-choice";
    return pathname.split('/').filter(Boolean)[0] || "mushaf-choice";
  }, [pathname]);

  const [visited, setVisited] = useState<Record<string, boolean>>({ 'mushaf-choice': true });

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
    <div className="fixed inset-0 bg-background text-foreground flex flex-col w-full font-arabic overflow-hidden transition-opacity duration-1000">
      
      {/* Global Top Bar - Logo + Install + Feedback */}
      <header className="h-14 shrink-0 bg-background/80 backdrop-blur-xl border-b border-border px-4 md:px-8 flex items-center justify-between z-[200]">
        <div className="flex items-center gap-3">
          <img src="/logo/logo.png?v=20" alt="قرآن" className="w-8 h-8 rounded-full border border-primary/20 p-0.5" />
          <span className="text-sm font-bold font-arabic text-primary hidden sm:block">قرآن</span>
        </div>
        <div className="flex items-center gap-2">
          <PWAInstallButton />
          {activeView === 'video' && (
            <button 
              onClick={() => setIsRenderOpen(true)}
              className="hidden lg:flex items-center gap-2 bg-primary text-black px-6 py-2.5 rounded-2xl font-bold text-[11px] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <Download className="w-4 h-4" />
              <span className="font-arabic">تصدير الفيديو</span>
            </button>
          )}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 border border-border px-4 py-2 rounded-2xl transition-all text-foreground/40 hover:text-foreground group"
          >
            <Menu className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[11px] font-arabic hidden sm:block">القائمة</span>
          </button>
        </div>
      </header>



      <main className="flex-1 relative overflow-hidden">
        {visited.mushaf && (
          <div key={`mushaf-${activeView === 'mushaf'}`} className={`h-full w-full mb-20 ${activeView === 'mushaf' ? 'block view-transition' : 'hidden'}`}>
            <Mushaf />
          </div>
        )}
        {visited['mushaf-full'] && (
          <div key={`mushaf-full-${activeView === 'mushaf-full'}`} className={`h-full w-full mb-20 ${activeView === 'mushaf-full' ? 'block view-transition' : 'hidden'}`}>
            <DigitalMushaf />
          </div>
        )}
        {visited['mushaf-tafseer'] && (
          <div key={`mushaf-tafseer-${activeView === 'mushaf-tafseer'}`} className={`h-full w-full mb-20 ${activeView === 'mushaf-tafseer' ? 'block view-transition' : 'hidden'}`}>
            <DigitalMushaf isTafseerMode={true} />
          </div>
        )}
        {visited['mushaf-choice'] && (
          <div key={`mushaf-choice-${activeView === 'mushaf-choice'}`} className={`h-full w-full relative pb-20 overflow-y-auto no-scrollbar ${activeView === 'mushaf-choice' ? 'block view-transition' : 'hidden'}`}>
            <MushafChoice />
            <CommunityShowcase />
          </div>
        )}
        {visited.daily && (
          <div key={`daily-${activeView === 'daily'}`} className={`h-full w-full pb-32 ${activeView === 'daily' ? 'block view-transition' : 'hidden'}`}>
            <DailyHub />
          </div>
        )}
        {visited.library && (
          <div key={`library-${activeView === 'library'}`} className={`h-full w-full pb-32 ${activeView === 'library' ? 'block view-transition' : 'hidden'}`}>
            <AudioLibrary />
          </div>
        )}
        {visited.prayers && (
          <div key={`prayers-${activeView === 'prayers'}`} className={`h-full w-full pb-32 ${activeView === 'prayers' ? 'block view-transition' : 'hidden'}`}>
            <PrayerTimes />
          </div>
        )}
        {visited.rank && (
          <div key={`rank-${activeView === 'rank'}`} className={`h-full w-full pb-32 ${activeView === 'rank' ? 'block view-transition' : 'hidden'}`}>
            <Leaderboard onEditProfile={() => setIsProfileOpen(true)} />
          </div>
        )}
        {visited.admin && (
          <div key={`admin-${activeView === 'admin'}`} className={`h-full w-full pb-32 ${activeView === 'admin' ? 'block view-transition' : 'hidden'}`}>
            <AdminPanel />
          </div>
        )}
        {visited.showcase && (
          <div key={`showcase-${activeView === 'showcase'}`} className={`h-full w-full pb-32 overflow-y-auto no-scrollbar ${activeView === 'showcase' ? 'block view-transition' : 'hidden'}`}>
            <CommunityShowcase />
          </div>
        )}
        
        {visited.video && (
          <div key={`video-${activeView === 'video'}`} className={`h-full w-full ${activeView === 'video' ? 'block view-transition' : 'hidden'}`}>
             <div className="flex h-full w-full overflow-hidden">
                <aside className="hidden lg:flex w-[350px] h-full border-r border-white/5 flex-col p-6 overflow-y-auto no-scrollbar gap-6 pb-40">
                   <SurahSelector /><Controls onOpenSubscription={() => setIsSubscriptionOpen(true)} />
                </aside>
                <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar">
                   <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 lg:hidden">
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
                   
                   <div className="flex-1 flex items-center justify-center p-2 min-h-0 bg-[#000000]">
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
            <div className="absolute bottom-0 left-0 right-0 h-[85vh] bg-background rounded-t-[3rem] border-t border-border flex flex-col p-6 overflow-hidden animate-in slide-in-from-bottom duration-300 text-right">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setIsMobileControlsOpen(false)} className="p-3 bg-foreground/5 rounded-full"><X className="w-6 h-6 text-foreground/40" /></button>
                    <h2 className="text-xl font-bold font-arabic">إعدادات الفيديو</h2>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar pb-10 px-2">
                    <SurahSelector />
                    <div className="h-8" />
                    <Controls onOpenSubscription={() => setIsSubscriptionOpen(true)} />
                </div>
            </div>
        </div>
      )}

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <RenderModal 
        isOpen={isRenderOpen} 
        onClose={() => setIsRenderOpen(false)} 
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
      />
      <SubscriptionModal isOpen={isSubscriptionOpen} onClose={() => setIsSubscriptionOpen(false)} />
      <GlobalMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        onOpenFeedback={() => {
          setIsMenuOpen(false);
          setIsFeedbackOpen(true);
        }}
        onOpenProfile={() => {
          setIsMenuOpen(false);
          setIsProfileOpen(true);
        }}
      />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}

function LoadingShell() {
    return (
        <div className="fixed inset-0 bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-[10px] text-foreground/20 font-bold uppercase tracking-[0.4em]">جارٍ التهيئة...</span>
            </div>
        </div>
    );
}
