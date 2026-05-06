"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Video, BookOpen, Timer, Headphones, Calendar, Trophy, Sparkles } from "lucide-react";
import { Tajawal } from "next/font/google";

const tajawal = Tajawal({
  weight: ["400", "500", "700", "800", "900"],
  subsets: ["arabic"],
});

export function Navigation() {
  const pathname = usePathname();
  const currentPath = pathname === "/" ? "/" : `/${pathname.split('/').filter(Boolean)[0]}`;

  const tabs = [
    { id: "mushaf", label: "المصحف", icon: BookOpen, path: "/mushaf-choice" },
    { id: "daily", label: "يومياتي", icon: Calendar, path: "/daily" },
    { id: "rank", label: "الترتيب", icon: Trophy, path: "/rank" },
    { id: "library", label: "صوتيات", icon: Headphones, path: "/library" },
    { id: "prayers", label: "مواقيت", icon: Timer, path: "/prayers" },
    { id: "video", label: "فيديو", icon: Video, path: "/video" },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-[1000] w-full px-4 pb-6 pt-2 pointer-events-none ${tajawal.className}`}>
      <div className="max-w-2xl mx-auto w-full h-[84px] bg-[#064E3B]/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex items-center justify-around px-4 shadow-[0_30px_100px_rgba(0,0,0,0.6)] pointer-events-auto relative overflow-hidden group">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
        
        {tabs.map((tab) => {
          const isMushafGroup = tab.id === "mushaf" && (currentPath === "/" || currentPath === "/mushaf-full" || currentPath === "/mushaf-choice" || currentPath === "/mushaf" || currentPath === "/mushaf-tafseer");
          const isActive = currentPath === tab.path || isMushafGroup;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={`relative flex flex-col items-center justify-center gap-1.5 transition-all duration-700 flex-1 py-2 group/nav ${isActive ? 'scale-110' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'}`}
            >
              {/* Active Aura */}
              {isActive && (
                <div className="absolute -top-1 w-8 h-8 bg-primary/20 rounded-full blur-xl animate-pulse" />
              )}
              
              <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 ${isActive ? 'bg-primary text-black shadow-[0_15px_30px_rgba(212,175,55,0.3)] rotate-[360deg]' : 'text-white'}`}>
                <Icon className={`w-5 h-5 stroke-[2.5px] transition-transform duration-700 ${isActive ? 'scale-110' : 'group-hover/nav:scale-125 group-hover/nav:rotate-12'}`} />
                
                {isActive && (
                  <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-black animate-spin-slow" />
                )}
              </div>

              <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-700 ${isActive ? 'text-primary opacity-100' : 'text-white/40 opacity-0 group-hover/nav:opacity-100'}`}>
                {tab.label}
              </span>

              {/* Indicator Bar */}
              {isActive && (
                <div className="absolute -bottom-1 w-4 h-1 bg-primary rounded-full shadow-[0_0_15px_rgba(212,175,55,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
