"use client";

import React from "react";
import Link from "next/link";
import { Video, BookOpen, Timer, Headphones, Calendar, Trophy, MessageCircle } from "lucide-react";
import { useInstantPathname, navigateInstantly } from "@/lib/navigation";

export function Navigation() {
  const pathname = useInstantPathname();
  const currentPath = pathname === "/" ? "/" : `/${pathname.split('/').filter(Boolean)[0]}`;

  const tabs = [
    { id: "mushaf", label: "المصحف", icon: BookOpen, path: "/mushaf-choice" },
    { id: "daily", label: "يومياتي", icon: Calendar, path: "/daily" },
    { id: "feed", label: "مجتمع", icon: MessageCircle, path: "/feed" },
    { id: "rank", label: "الترتيب", icon: Trophy, path: "/rank" },
    { id: "library", label: "صوتيات", icon: Headphones, path: "/library" },
    { id: "prayers", label: "مواقيت", icon: Timer, path: "/prayers" },
    { id: "video", label: "فيديو", icon: Video, path: "/video" },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-[1000] w-full px-0 pb-0 pt-1.5 pointer-events-none font-['Tajawal']`}>
      <div className="max-w-lg mx-auto w-full h-[64px] bg-card/95 backdrop-blur-md border-t border-border rounded-t-[1.5rem] flex items-center justify-around px-1 shadow-lg pointer-events-auto relative overflow-hidden group gpu-layer">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
        
        {tabs.map((tab) => {
          const isMushafGroup = tab.id === "mushaf" && (currentPath === "/" || currentPath === "/mushaf-full" || currentPath === "/mushaf-choice" || currentPath === "/mushaf" || currentPath === "/mushaf-tafseer");
          const isFeedGroup = tab.id === "feed" && currentPath === "/feed";
          const isActive = currentPath === tab.path || isMushafGroup || isFeedGroup;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.id}
              href={tab.path}
              onClick={(e) => {
                e.preventDefault();
                navigateInstantly(tab.path);
              }}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-all duration-200 flex-1 py-1 group/nav min-w-0 ${isActive ? 'scale-105' : 'opacity-70 grayscale hover:opacity-100 hover:grayscale-0'}`}
            >
              {/* Active Aura */}
              {isActive && (
                <div className="absolute -top-1 w-5 h-5 bg-primary/20 rounded-full blur-lg animate-pulse" />
              )}
              
              <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-primary text-primary-foreground shadow-[0_8px_16px_rgba(212,175,55,0.3)]' : 'text-black dark:text-foreground'}`}>
                <Icon className={`w-3.5 h-3.5 stroke-[2.5px] transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover/nav:scale-125 group-hover/nav:rotate-12'}`} />
              </div>

              <span className={`text-[8px] font-bold tracking-tight transition-all duration-200 leading-none ${isActive ? 'text-primary' : 'text-black dark:text-foreground'}`}>
                {tab.label}
              </span>

              {/* Indicator Bar */}
              {isActive && (
                <div className="absolute -bottom-0.5 w-2.5 h-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
