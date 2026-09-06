"use client";

import React, { useState, useEffect } from "react";
import nextDynamic from "next/dynamic";
import { useEditor } from "@/store/useEditor";
import { Settings, Download, X } from "lucide-react";
import { YaqeenLogo } from "@/components/YaqeenLogo";

const ComponentLoader = () => (
  <div className="flex h-full w-full items-center justify-center p-8">
    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const SurahSelector = nextDynamic(
  () => import("@/components/SurahSelector").then((mod) => mod.SurahSelector),
  { loading: () => <ComponentLoader />, ssr: false }
);
const VideoPreview = nextDynamic(
  () => import("@/components/VideoPreview").then((mod) => mod.VideoPreview),
  { loading: () => <ComponentLoader />, ssr: false }
);
const Controls = nextDynamic(
  () => import("@/components/Controls").then((mod) => mod.Controls),
  { loading: () => <ComponentLoader />, ssr: false }
);
const RenderModal = nextDynamic(
  () => import("@/components/RenderModal").then((mod) => mod.RenderModal),
  { ssr: false }
);
const SubscriptionModal = nextDynamic(
  () => import("@/components/SubscriptionModal").then((mod) => mod.SubscriptionModal),
  { ssr: false }
);

export default function WideStudioFullPage() {
  const { state, updateState } = useEditor();
  const [isRenderOpen, setIsRenderOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    updateState({ aspectRatio: "16:9" });
  }, []);

  if (!isClient) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 text-foreground flex flex-col w-full h-[100dvh] font-arabic overflow-hidden bg-background" dir="rtl">
      {/* ── Studio Header Bar ── */}
      <header className="h-16 shrink-0 bg-card/90 dark:bg-black/90 backdrop-blur-xl border-b border-border/70 px-4 md:px-8 flex items-center justify-between z-[100]">
        <div className="flex items-center gap-3">
          <YaqeenLogo size="md" variant="full" />
          <div className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-black">
            <span>استوديو يوتيوب وتيك توك</span>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
        </div>

        {/* Aspect Ratio Switcher (طولي / عرضي) */}
        <div className="flex items-center gap-1 bg-foreground/5 dark:bg-white/5 p-1 rounded-2xl border border-border/60">
          <button
            onClick={() => updateState({ aspectRatio: "9:16" })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              state.aspectRatio !== "16:9"
                ? "bg-[#fbbf24] text-black font-black shadow-sm"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <span>📱</span>
            <span className="hidden sm:inline">طولي (9:16)</span>
            <span className="sm:hidden">9:16</span>
          </button>
          <button
            onClick={() => updateState({ aspectRatio: "16:9" })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              state.aspectRatio === "16:9"
                ? "bg-red-600 text-white font-black shadow-sm shadow-red-600/30"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            <span>🖥️</span>
            <span className="hidden sm:inline">عرضي (16:9)</span>
            <span className="sm:hidden">16:9</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRenderOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-xs active:scale-95 transition-all shadow-lg shadow-red-600/30"
          >
            <Download className="w-4 h-4" />
            <span>رندرة وتصدير الفيديو</span>
          </button>
        </div>
      </header>

      {/* ── Main Studio Work Area ── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Desktop View: 3-column Studio (Surah Selector + Preview + Controls) */}
        <div className="hidden lg:grid grid-cols-[380px_1fr_420px] h-full w-full overflow-hidden">
          {/* Right Column: Surahs & Verses */}
          <div className="border-l border-border bg-card/20 backdrop-blur-md overflow-y-auto no-scrollbar p-6">
            <SurahSelector />
          </div>

          {/* Middle Column: Interactive Video Preview */}
          <div className="flex flex-col items-center justify-center p-6 bg-[#0c0d10] force-dark relative overflow-hidden">
            <div className="scale-[0.88] xl:scale-[0.98] transition-all duration-300 gpu-layer flex items-center justify-center h-full">
              <VideoPreview />
            </div>
          </div>

          {/* Left Column: Backgrounds, Reciters & Styling */}
          <div className="border-r border-border bg-card/20 backdrop-blur-md overflow-y-auto no-scrollbar p-6">
            <Controls onOpenSubscription={() => setIsSubscriptionOpen(true)} />
          </div>
        </div>

        {/* Mobile / Tablet View */}
        <div className="lg:hidden flex flex-col h-full w-full bg-[#0c0d10] force-dark overflow-hidden">
          {/* Mobile Header Controls */}
          <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0 relative z-50">
            <button
              onClick={() => setIsMobileControlsOpen(true)}
              className="flex items-center gap-2.5 px-5 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl active:scale-95 transition-all text-xs font-black text-primary"
            >
              <Settings className="w-4 h-4" />
              <span>إعدادات التصميم والقارئ</span>
            </button>

            <button
              onClick={() => setIsRenderOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-2xl font-black text-xs active:scale-95 transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>تصدير ونشر</span>
            </button>
          </div>

          {/* Mobile Preview Area */}
          <div className="flex-1 flex items-center justify-center p-2 relative z-10 min-h-0">
            <div className="scale-[0.72] md:scale-[0.85] h-full flex items-center justify-center transition-all duration-300 gpu-layer">
              <VideoPreview />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Controls Drawer */}
      {isMobileControlsOpen && (
        <div className="fixed inset-0 z-[300] lg:hidden">
          <div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            onClick={() => setIsMobileControlsOpen(false)}
          />
          <div className="absolute inset-0 bg-background flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <button
                onClick={() => setIsMobileControlsOpen(false)}
                className="p-2.5 bg-foreground/5 rounded-full"
              >
                <X className="w-5 h-5 text-foreground/50" />
              </button>
              <h2 className="text-base font-black font-arabic">إعدادات الفيديو</h2>
              <div className="w-10" />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 pt-2">
              <SurahSelector />
              <div className="h-4" />
              <Controls onOpenSubscription={() => setIsSubscriptionOpen(true)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Render & Publishing Modal (TikTok + YouTube Full Tabs) ── */}
      <RenderModal
        isOpen={isRenderOpen}
        onClose={() => setIsRenderOpen(false)}
        onOpenSubscription={() => setIsSubscriptionOpen(true)}
      />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />
    </div>
  );
}
