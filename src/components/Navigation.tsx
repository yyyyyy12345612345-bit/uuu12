"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Video, BookOpen, Timer, Headphones, Calendar, Trophy } from "lucide-react";

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
    <nav className="fixed bottom-0 left-0 right-0 z-[250] w-full bg-background/80 backdrop-blur-3xl border-t border-border pb-safe">
      <div className="px-2 py-3 flex items-center justify-around relative max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isMushafGroup = tab.id === "mushaf" && (currentPath === "/" || currentPath === "/mushaf-full" || currentPath === "/mushaf-choice" || currentPath === "/mushaf" || currentPath === "/mushaf-tafseer");
          const isActive = currentPath === tab.path || isMushafGroup;
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={`group flex flex-col items-center gap-1.5 transition-all duration-300 relative py-1 flex-1 min-w-0 ${isActive ? 'text-primary' : 'text-foreground/30 hover:text-foreground/50'}`}
            >
              <div className={`w-12 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 relative ${isActive ? 'bg-primary/10 shadow-lg shadow-primary/5' : 'hover:bg-foreground/5'}`}>
                <Icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                {isActive && (
                  <span className="absolute -top-1 right-2 w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] font-bold font-arabic transition-all duration-300 truncate px-1 ${isActive ? 'opacity-100 transform translate-y-0' : 'opacity-60 transform translate-y-0.5'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
