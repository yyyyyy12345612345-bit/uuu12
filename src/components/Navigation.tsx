"use client";

import React from "react";
import Link from "next/link";
import { Video, BookOpen, Timer, Headphones, Calendar, Trophy, Shield } from "lucide-react";
import { useInstantPathname, navigateInstantly } from "@/lib/navigation";

export function Navigation() {
  const pathname = useInstantPathname();
  const currentPath = pathname === "/" ? "/" : `/${pathname.split('/').filter(Boolean)[0]}`;

  const tabs = [
    { id: "mushaf", label: "المصحف", icon: BookOpen, path: "/mushaf-choice" },
    { id: "daily", label: "يومياتي", icon: Calendar, path: "/daily" },
    { id: "rank", label: "الترتيب", icon: Trophy, path: "/rank" },
    { id: "library", label: "صوتيات", icon: Headphones, path: "/library" },
    { id: "prayers", label: "مواقيت", icon: Timer, path: "/prayers" },
    { id: "security", label: "الأمن", icon: Shield, path: "/security" },
    { id: "video", label: "فيديو", icon: Video, path: "/video" },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-[1000] w-full px-0 pb-0 pt-2 pointer-events-none font-['Tajawal']`}>
      <div className="max-w-md mx-auto w-full h-[72px] bg-[#0a0a0d] backdrop-blur-3xl border-t border-white/5 rounded-t-[2rem] flex items-center justify-around px-2 shadow-[0_-20px_60px_rgba(0,0,0,0.6)] pointer-events-auto relative overflow-hidden group" style={{ willChange: "transform, opacity" }}>
        
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
              onClick={(e) => {
                e.preventDefault();
                navigateInstantly(tab.path);
              }}
              className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 flex-1 py-1 group/nav ${isActive ? 'scale-105' : 'opacity-70 grayscale hover:opacity-100 hover:grayscale-0'}`}
            >
              {/* Active Aura */}
              {isActive && (
                <div className="absolute -top-1 w-6 h-6 bg-primary/20 rounded-full blur-lg animate-pulse" />
              )}
              
              <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-primary text-black shadow-[0_10px_20px_rgba(212,175,55,0.3)]' : 'text-white'}`}>
                <Icon className={`w-4 h-4 stroke-[2.5px] transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover/nav:scale-125 group-hover/nav:rotate-12'}`} />
              </div>

              <span className={`text-[10px] font-bold tracking-tight transition-all duration-200 ${isActive ? 'text-primary' : 'text-white'}`}>
                {tab.label}
              </span>

              {/* Indicator Bar */}
              {isActive && (
                <div className="absolute -bottom-0.5 w-3 h-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
