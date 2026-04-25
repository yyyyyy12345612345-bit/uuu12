"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Video, BookOpen, Timer, Headphones, Calendar, ScrollText, Trophy } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const tabs = [
    { id: "mushaf", label: "المصحف", icon: BookOpen, path: "/" },
    { id: "daily", label: "يومياتي", icon: Calendar, path: "/daily" },
    { id: "library", label: "المكتبة", icon: Headphones, path: "/library" },
    { id: "prayers", label: "المواقيت", icon: Timer, path: "/prayers" },
    { id: "video", label: "الفيديوهات", icon: Video, path: "/video" },
  ];

  const currentPath = pathname === "/" ? "/" : `/${pathname.split('/').filter(Boolean)[0]}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[250] w-full bg-background/95 backdrop-blur-3xl border-t border-border">
      <div className="px-1 py-3 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentPath === tab.path || (tab.id === "mushaf" && currentPath === "/");
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={`group flex flex-col items-center gap-1 transition-all duration-75 relative py-1 flex-1 min-w-0 ${isActive ? 'text-primary' : 'text-foreground/20 hover:text-foreground/40'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[9px] font-bold font-arabic transition-all truncate px-1 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
