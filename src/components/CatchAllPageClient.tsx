"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useEditor } from "@/store/useEditor";
import { useRouter } from "next/navigation";
import { useInstantPathname, getViewFromPathname, navigateInstantly } from "@/lib/navigation";
import { Settings, X, Download, Menu } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { SurahSelector } from "@/components/SurahSelector";
import { VideoPreview } from "@/components/VideoPreview";
import { Controls } from "@/components/Controls";
import { RenderModal } from "@/components/RenderModal";
import { Mushaf } from "@/components/Mushaf";
import { PrayerTimes } from "@/components/PrayerTimes";
import { AudioLibrary } from "@/components/AudioLibrary";
import { DailyHub } from "@/components/DailyHub";
import { Navigation } from "@/components/Navigation";
import { DigitalMushaf } from "@/components/DigitalMushaf";
import { FeedbackModal } from "@/components/FeedbackModal";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { GlobalMenu } from "@/components/GlobalMenu";
import { Leaderboard } from "@/components/Leaderboard";
import { AdminPanel } from "@/components/AdminPanel";
import { ProfileModal } from "@/components/ProfileModal";
import { AuthGate } from "@/components/AuthGate";
import { MushafChoice } from "@/components/MushafChoice";
import { SubscriptionModal } from "@/components/SubscriptionModal";
import { CommunityShowcase } from "@/components/CommunityShowcase";
import { PointsGuideModal } from "@/components/PointsGuideModal";
import { ChatBot } from "@/components/ChatBot";
import { SettingsModal } from "@/components/SettingsModal";
import { AppSettingsModal } from "@/components/AppSettingsModal";

// Error Boundary for CatchAll
class CatchAllErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error("[CatchAllErrorBoundary] Error caught:", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[CatchAllErrorBoundary] Component stack:", errorInfo.componentStack);
    console.error("[CatchAllErrorBoundary] Full error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-[9999] p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-black text-white mb-3">خطأ في التحميل</h1>
            <p className="text-white/50 font-bold text-sm mb-6">
              {this.state.error?.message || "حدث خطأ أثناء تحميل الصفحة"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary text-black rounded-xl font-black text-sm hover:brightness-110 transition"
            >
              إعادة التحميل
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function CatchAllPageClient() {
  return (
    <React.Suspense fallback={<LoadingShell />}>
      <CatchAllErrorBoundary>
        <AuthGate>
          <CatchAllContent />
        </AuthGate>
      </CatchAllErrorBoundary>
    </React.Suspense>
  );
}

function CatchAllContent() {
  const { state } = useEditor();
  const pathname = useInstantPathname();
  const router = useRouter();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isRenderOpen, setIsRenderOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isPointsGuideOpen, setIsPointsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);


  // Derived active view from pathname - the safest way in Next.js 15/16 Client Components
  const activeView = useMemo(() => {
    return getViewFromPathname(pathname);
  }, [pathname]);

  useEffect(() => {
    const segment = pathname?.split('/').filter(Boolean)[0];
    if (segment === "profile") {
      setIsProfileOpen(true);
    }
  }, [pathname]);

  const [visited, setVisited] = useState<Record<string, boolean>>({ 'mushaf-choice': true });

  useEffect(() => {
    if (activeView && !visited[activeView]) {
      setVisited(prev => ({ ...prev, [activeView]: true }));
    }
  }, [activeView, visited]);

  // Handle URL Hash for Menu State
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#menu') {
        setIsMenuOpen(true);
      } else {
        setIsMenuOpen(false);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Prevent any rendering until hydration is complete to stop Next.js 16 mismatch
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || !state.isHydrated) return <LoadingShell />;

  return (
    <div className={`fixed inset-0 text-foreground flex flex-col w-full h-[100dvh] font-arabic overflow-hidden transition-opacity duration-1000 ${(activeView?.includes('mushaf') || activeView === 'daily' || activeView === 'prayers' || activeView === 'rank' || activeView === 'library') ? 'mushaf-full-bg' : 'bg-background'}`}>
      
      {/* Background Overlay */}
      {(activeView?.includes('mushaf') || activeView === 'daily' || activeView === 'prayers' || activeView === 'rank' || activeView === 'library') && (
        <div className="absolute inset-0 bg-black/70 z-0 pointer-events-none" />
      )}
      
      {/* Global Top Bar - Logo + Install + Feedback */}
      <header className="h-14 shrink-0 bg-transparent px-4 md:px-8 flex items-center justify-between z-[200]">
        <div className="flex items-center gap-2">
          <img src="/logo/logo.png?v=25" alt="قرآن" className="w-7 h-7 rounded-full border border-primary/20 p-0.5" />
          <span className="text-xs font-bold font-arabic text-primary hidden sm:block">قرآن</span>
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
            onClick={() => {
              window.location.hash = 'menu';
              setIsMenuOpen(true);
            }}
            className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 border border-border px-4 py-2 rounded-2xl transition-all text-foreground/40 hover:text-foreground group"
          >
            <Menu className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[11px] font-arabic hidden sm:block">القائمة</span>
          </button>
        </div>
      </header>



      <main className="flex-1 relative overflow-hidden bg-transparent">
        {visited.mushaf && (
          <div key="mushaf" className={`h-full w-full pb-20 overflow-y-auto no-scrollbar bg-transparent ${activeView === 'mushaf' ? 'block view-transition' : 'hidden'}`}>
            <Mushaf />
          </div>
        )}
        {visited['mushaf-full'] && (
          <div key="mushaf-full" className={`h-full w-full pb-20 bg-transparent ${activeView === 'mushaf-full' ? 'block view-transition' : 'hidden'}`}>
            <DigitalMushaf />
          </div>
        )}
        {visited['mushaf-tafseer'] && (
          <div key="mushaf-tafseer" className={`h-full w-full pb-20 bg-transparent ${activeView === 'mushaf-tafseer' ? 'block view-transition' : 'hidden'}`}>
            <DigitalMushaf isTafseerMode={true} />
          </div>
        )}
        {visited['mushaf-choice'] && (
          <div key="mushaf-choice" className={`h-full w-full relative pb-20 overflow-y-auto no-scrollbar bg-transparent ${activeView === 'mushaf-choice' ? 'block view-transition' : 'hidden'}`}>
            <MushafChoice />
            <CommunityShowcase />
          </div>
        )}
        {visited.daily && (
          <div key="daily" className={`h-full w-full pb-20 overflow-y-auto no-scrollbar bg-transparent ${activeView === 'daily' ? 'block view-transition' : 'hidden'}`}>
            <DailyHub />
          </div>
        )}
        {visited.library && (
          <div key="library" className={`h-full w-full pb-20 bg-transparent ${activeView === 'library' ? 'block view-transition' : 'hidden'}`}>
            <AudioLibrary />
          </div>
        )}
        {visited.prayers && (
          <div key="prayers" className={`h-full w-full pb-20 bg-transparent ${activeView === 'prayers' ? 'block view-transition' : 'hidden'}`}>
            <PrayerTimes />
          </div>
        )}
        {visited.rank && (
          <div key="rank" className={`h-full w-full pb-20 bg-transparent ${activeView === 'rank' ? 'block view-transition' : 'hidden'}`}>
            <Leaderboard onEditProfile={() => setIsProfileOpen(true)} />
          </div>
        )}
        {visited.admin && (
          <div key="admin" className={`h-full w-full pb-20 bg-transparent ${activeView === 'admin' ? 'block view-transition' : 'hidden'}`}>
            <AdminPanel />
          </div>
        )}
        {visited.showcase && (
          <div key="showcase" className={`h-full w-full pb-20 overflow-y-auto no-scrollbar bg-transparent ${activeView === 'showcase' ? 'block view-transition' : 'hidden'}`}>
            <CommunityShowcase />
          </div>
        )}
        {visited.video && (
          <div key="video" className={`h-full w-full ${activeView === 'video' ? 'block view-transition' : 'hidden'}`}>
             <div className="flex h-full w-full overflow-hidden bg-[#0c0d10]">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex w-[400px] h-full border-r border-border flex-col p-8 overflow-y-auto no-scrollbar gap-10 pb-40 relative z-50 bg-background/50 backdrop-blur-3xl">
                   <div className="absolute inset-0 islamic-pattern opacity-[0.02] pointer-events-none" />
                   <div className="relative z-10 flex flex-col gap-10">
                      <SurahSelector />
                      <div className="h-px bg-white/5 w-full" />
                      <Controls onOpenSubscription={() => setIsSubscriptionOpen(true)} />
                   </div>
                </aside>

                <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar relative">
                   <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05)_0%,transparent_70%)] pointer-events-none" />
                   
                   {/* Mobile Header Controls */}
                   <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 lg:hidden relative z-50">
                      <button 
                         onClick={() => setIsMobileControlsOpen(true)}
                         className="flex items-center gap-3 px-6 py-3.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-[1.5rem] active:scale-95 transition-all group"
                      >
                         <Settings className="w-5 h-5 text-primary group-hover:rotate-90 transition-transform duration-500" />
                         <span className="text-[10px] font-black font-arabic text-primary uppercase tracking-widest">إعدادات التصميم</span>
                      </button>
                      
                      <button 
                         onClick={() => setIsRenderOpen(true)}
                         className="flex items-center gap-3 px-6 py-3.5 bg-primary text-black rounded-[1.5rem] font-black text-[10px] active:scale-95 transition-all shadow-[0_20px_50px_rgba(212,175,55,0.2)] uppercase tracking-widest"
                      >
                         <Download className="w-5 h-5" />
                         <span className="font-arabic">تصدير الفيديو</span>
                      </button>
                   </div>
                   
                   {/* Main Preview Area */}
                   <div className="flex-1 flex items-center justify-center p-4 md:p-12 min-h-0 relative z-10">
                      <div className="scale-[0.8] md:scale-[0.95] lg:scale-100 h-full flex items-center justify-center transition-all duration-1000">
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
        onClose={() => {
          window.history.pushState(null, '', window.location.pathname + window.location.search);
          setIsMenuOpen(false);
        }} 
        onOpenFeedback={() => {
          setIsMenuOpen(false);
          setIsFeedbackOpen(true);
        }}
        onOpenProfile={() => {
          setIsMenuOpen(false);
          setIsProfileOpen(true);
        }}
        onOpenPointsGuide={() => {
          setIsMenuOpen(false);
          setIsPointsGuideOpen(true);
        }}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
        }}
        onOpenAppSettings={() => {
          setIsAppSettingsOpen(true);
        }}
      />
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => {
          setIsProfileOpen(false);
          const segment = pathname?.split('/').filter(Boolean)[0];
          if (segment === "profile") {
            navigateInstantly("/");
          }
        }} 
      />
      <PointsGuideModal isOpen={isPointsGuideOpen} onClose={() => setIsPointsGuideOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AppSettingsModal isOpen={isAppSettingsOpen} onClose={() => setIsAppSettingsOpen(false)} />
      
      {/* Global AI ChatBot */}
      <ChatBot />
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
