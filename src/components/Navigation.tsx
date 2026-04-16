"use client";

import React from "react";
import Link from "next/link";
import { Video, BookOpen, Timer, Headphones, Calendar, ScrollText } from "lucide-react";
import { useEditor } from "@/store/useEditor";

export function Navigation() {
  const { state, updateState } = useEditor();

  const tabs = [
    { id: "video" as const, label: "صانع الفيديو", icon: Video },
    { id: "prayers" as const, label: "المواقيت", icon: Timer },
    { id: "library" as const, label: "المكتبة", icon: Headphones },
    { id: "daily" as const, label: "يومياتي", icon: Calendar },
    { id: "shamrely" as const, label: "مصحف شمرلي", icon: ScrollText },
    { id: "mushaf" as const, label: "المصحف", icon: BookOpen },
  ];

  if (state.activeSettingsPrayer) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[120] w-full transition-all duration-300">
      <div className="px-2 py-2 flex items-center justify-around bg-black/40 backdrop-blur-2xl border-t border-white/5">
        {tabs.map((tab) => {
          const isActive = state.view === tab.id;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.id}
              href={tab.id === "video" ? "/" : `/${tab.id}`}
              onClick={() => {
                 updateState({ view: tab.id });
                 // @ts-ignore
                 window.gtag?.('event', 'navigation_click', { 'target_view': tab.id, 'label': tab.label });
              }}
              className={`group flex flex-col items-center gap-1 transition-all duration-300 relative py-1 ${isActive ? 'text-primary' : 'text-white/30 hover:text-white/60'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary/10 scale-110' : 'bg-transparent'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]' : ''}`} />
              </div>

              <span className={`text-[8px] font-bold font-arabic transition-all ${isActive ? 'opacity-100' : 'opacity-0 scale-90'}`}>
                {tab.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(212,175,55,1)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
