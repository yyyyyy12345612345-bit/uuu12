"use client";

import React from "react";
import { Video, BookOpen, Timer, Headphones, Calendar } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEditor } from "@/store/useEditor";

export function Navigation() {
  const { state, updateState } = useEditor();
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { id: "mushaf" as const, label: "المصحف", icon: BookOpen },
    { id: "daily" as const, label: "يومياتي", icon: Calendar },
    { id: "library" as const, label: "المكتبة", icon: Headphones },
    { id: "prayers" as const, label: "المواقيت", icon: Timer },
    { id: "video" as const, label: "صانع الفيديو", icon: Video },
  ];

  const isTransparentNav = state.view === "mushaf" || state.view === "library";

  if (state.activeSettingsPrayer) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[120] w-full transition-all duration-300">
      <div className={`px-2 py-2 flex items-center justify-around transition-all bg-black/40 backdrop-blur-2xl border-t border-white/5`}>


        {tabs.map((tab) => {
          const isActive = state.view === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                 updateState({ view: tab.id });
                 router.push(tab.id === "video" ? "/" : `/${tab.id}`);
                 
                 // Analytics: تتبع التنقل بين الأقسام الرئيسية
                 // @ts-ignore
                 window.gtag?.('event', 'navigation_click', { 'target_view': tab.id, 'label': tab.label });
              }}
              className={`group flex flex-col items-center gap-1.5 transition-all duration-500 relative py-1 ${isActive ? 'text-primary' : 'text-white/30 hover:text-white/60'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-primary/10 scale-110 shadow-lg shadow-primary/5' : 'bg-transparent group-hover:bg-white/5'}`}>
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]' : ''}`} />
              </div>


              <span className={`text-[9px] font-bold font-arabic transition-all tracking-wider ${isActive ? 'opacity-100' : 'opacity-0 scale-90 translate-y-1'}`}>
                {tab.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_15px_rgba(212,175,55,1)]" />
              )}

            </button>
          );
        })}
      </div>
    </nav>
  );
}
