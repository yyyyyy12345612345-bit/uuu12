"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Video, BookOpen, Timer, Headphones, Calendar, Trophy, ChevronUp } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();
  const [showMushafMenu, setShowMushafMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMushafMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentPath = pathname === "/" ? "/" : `/${pathname.split('/').filter(Boolean)[0]}`;

  const tabs = [
    { id: "daily", label: "يومياتي", icon: Calendar, path: "/daily" },
    { id: "rank", label: "الترتيب", icon: Trophy, path: "/rank" },
    { id: "library", label: "صوتيات", icon: Headphones, path: "/library" },
    { id: "prayers", label: "مواقيت", icon: Timer, path: "/prayers" },
    { id: "video", label: "فيديو", icon: Video, path: "/video" },
  ];

  const isMushafActive = currentPath === "/" || currentPath === "/mushaf-full";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[250] w-full bg-background/95 backdrop-blur-3xl border-t border-border">
      <div className="px-1 py-3 flex items-center justify-around relative">
        
        {/* Mushaf Button with Submenu */}
        <div className="relative flex-1 min-w-0" ref={menuRef}>
          {showMushafMenu && (
            <div className="absolute bottom-full right-0 mb-4 w-40 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-2">
              <Link 
                href="/" 
                onClick={() => setShowMushafMenu(false)}
                className={`px-4 py-3 text-right font-bold font-arabic text-sm hover:bg-foreground/5 transition-colors ${currentPath === "/" ? "text-primary" : "text-foreground"}`}
              >
                مصحف آية بآية
              </Link>
              <div className="h-px bg-border w-full" />
              <Link 
                href="/mushaf-full" 
                onClick={() => setShowMushafMenu(false)}
                className={`px-4 py-3 text-right font-bold font-arabic text-sm hover:bg-foreground/5 transition-colors ${currentPath === "/mushaf-full" ? "text-primary" : "text-foreground"}`}
              >
                مصحف كامل
              </Link>
            </div>
          )}
          
          <button
            onClick={() => setShowMushafMenu(!showMushafMenu)}
            className={`w-full group flex flex-col items-center gap-1 transition-all duration-75 relative py-1 ${isMushafActive ? 'text-primary' : 'text-foreground/20 hover:text-foreground/40'}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isMushafActive ? 'bg-primary/10' : ''}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <span className={`text-[9px] font-bold font-arabic transition-all truncate px-1 opacity-100 flex items-center gap-0.5 justify-center`}>
              المصحف <ChevronUp className={`w-3 h-3 transition-transform ${showMushafMenu ? 'rotate-180' : ''}`} />
            </span>
          </button>
        </div>

        {/* Other Tabs */}
        {tabs.map((tab) => {
          const isActive = currentPath === tab.path;
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
              <span className={`text-[9px] font-bold font-arabic transition-all truncate px-1 opacity-100`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
