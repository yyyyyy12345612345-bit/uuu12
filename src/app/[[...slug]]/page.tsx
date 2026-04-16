"use client";

import React, { useState, use, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEditor } from "@/store/useEditor";
import { usePathname } from "next/navigation";
import { Download, MessageSquare } from "lucide-react";

// Pre-load components with zero delay
const SurahSelector = dynamic(() => import("@/components/SurahSelector").then(mod => mod.SurahSelector), { ssr: false });
const VideoPreview = dynamic(() => import("@/components/VideoPreview").then(mod => mod.VideoPreview), { ssr: false });
const Controls = dynamic(() => import("@/components/Controls").then(mod => mod.Controls), { ssr: false });
const Mushaf = dynamic(() => import("@/components/Mushaf").then(mod => mod.Mushaf), { ssr: false });
const PrayerTimes = dynamic(() => import("@/components/PrayerTimes").then(mod => mod.PrayerTimes), { ssr: false });
const AudioLibrary = dynamic(() => import("@/components/AudioLibrary").then(mod => mod.AudioLibrary), { ssr: false });
const DailyHub = dynamic(() => import("@/components/DailyHub").then(mod => mod.DailyHub), { ssr: false });
const Navigation = dynamic(() => import("@/components/Navigation").then(mod => mod.Navigation), { ssr: false });
const PWAInstallButton = dynamic(() => import("@/components/PWAInstallButton").then(mod => mod.PWAInstallButton), { ssr: false });
const FeedbackModal = dynamic(() => import("@/components/FeedbackModal").then(mod => mod.FeedbackModal), { ssr: false });
const Shamrely = dynamic(() => import("@/components/Shamrely").then(mod => mod.Shamrely), { ssr: false });

export default function CatchAllPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { state } = useEditor();
  const pathname = usePathname();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  
  // Unwrap params using React.use for Next.js 15
  use(params);

  const activeView = useMemo(() => {
    if (pathname === "/") return "mushaf";
    return pathname.split('/').filter(Boolean)[0] || "mushaf";
  }, [pathname]);

  // Persistent visited set to keep components alive in DOM
  const [visited, setVisited] = useState<Record<string, boolean>>({ mushaf: true });

  React.useEffect(() => {
    if (!visited[activeView]) {
      setVisited(prev => ({ ...prev, [activeView]: true }));
    }
  }, [activeView, visited]);

  if (!state.isHydrated) return null;

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col w-full font-arabic overflow-hidden">
      <header className="h-20 shrink-0 bg-black/40 border-b border-white/5 px-4 flex items-center justify-between z-[110]">
<Link href="/" className="flex items-center gap-3">
          <img src="/logo/logo.png?v=4" alt="Logo" className="w-10 h-10" />
          <h1 className="text-xl font-bold">قرآن</h1>
        </Link>
        <div className="flex items-center gap-3">
          <PWAInstallButton />
          <button onClick={() => setIsFeedbackOpen(true)} className="p-3 bg-white/5 rounded-xl"><MessageSquare className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden bg-[#050505]">
        {/* Dynamic Section Visibility - NO RE-MOUNTING */}
        
        {visited.mushaf && <div className={`h-full w-full ${activeView === 'mushaf' ? 'block' : 'hidden'}`}><Mushaf /></div>}
        {visited.shamrely && <div className={`h-full w-full ${activeView === 'shamrely' ? 'block' : 'hidden'}`}><Shamrely /></div>}
        {visited.daily && <div className={`h-full w-full ${activeView === 'daily' ? 'block' : 'hidden'}`}><DailyHub /></div>}
        {visited.library && <div className={`h-full w-full ${activeView === 'library' ? 'block' : 'hidden'}`}><AudioLibrary /></div>}
        {visited.prayers && <div className={`h-full w-full ${activeView === 'prayers' ? 'block' : 'hidden'}`}><PrayerTimes /></div>}
        
        {visited.video && (
          <div className={`h-full w-full ${activeView === 'video' ? 'block' : 'hidden'}`}>
             <div className="flex h-full w-full overflow-hidden">
                <aside className="hidden lg:flex w-[350px] h-full border-r border-white/5 flex-col p-6 overflow-y-auto no-scrollbar gap-6">
                   <SurahSelector /><Controls />
                </aside>
                <div className="flex-1 flex items-center justify-center p-4">
                   <VideoPreview key={state.reciterId} />
                </div>
             </div>
          </div>
        )}
      </main>

      <Navigation />
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
}
