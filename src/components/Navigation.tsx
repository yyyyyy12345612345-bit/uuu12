"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Calendar, 
  MessageCircle, 
  Trophy, 
  Headphones, 
  Timer, 
  Video, 
  Sun, 
  Moon, 
  User, 
  Menu
} from "lucide-react";
import { useInstantPathname, navigateInstantly } from "@/lib/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { YaqeenLogo } from "@/components/YaqeenLogo";

export function Navigation() {
  const pathname = useInstantPathname();
  const { theme, toggleTheme } = useTheme();
  const currentPath = pathname === "/" ? "/" : `/${pathname.split('/').filter(Boolean)[0]}`;

  const [points, setPoints] = useState<number>(0);
  const [userName, setUserName] = useState<string>("");
  const [userPhoto, setUserPhoto] = useState<string>("");

  useEffect(() => {
    // Load local cached points first
    try {
      const cached = localStorage.getItem("cached_total_points");
      if (cached) setPoints(parseInt(cached, 10));
    } catch {}

    const unsubAuth = auth?.onAuthStateChanged((user: any) => {
      if (user && db) {
        setUserName(user.displayName || "المستخدم");
        setUserPhoto(user.photoURL || "");
        const userRef = doc(db, "users", user.uid);
        const unsubDoc = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const total = data.totalPoints || 0;
            setPoints(total);
            if (data.name) setUserName(data.name);
            if (data.photoURL) setUserPhoto(data.photoURL);
          }
        }, (err) => console.error("Nav user snapshot error:", err));
        return () => unsubDoc();
      }
    });

    const handlePointsUpdate = (e: any) => {
      const added = e.detail?.amount || 0;
      setPoints((prev) => prev + added);
    };
    window.addEventListener("pointsUpdated", handlePointsUpdate);

    return () => {
      if (unsubAuth) unsubAuth();
      window.removeEventListener("pointsUpdated", handlePointsUpdate);
    };
  }, []);

  const tabs = [
    { id: "mushaf", label: "المصحف", icon: BookOpen, path: "/mushaf-choice" },
    { id: "daily", label: "الأذكار والورد", icon: Calendar, path: "/daily" },
    { id: "rank", label: "المتصدرين", icon: Trophy, path: "/rank" },
    { id: "library", label: "المكتبة الصوتية", icon: Headphones, path: "/library" },
    { id: "prayers", label: "مواقيت الصلاة", icon: Timer, path: "/prayers" },
    { id: "video", label: "استوديو الفيديو", icon: Video, path: "/video" },
  ];

  const isMushafActive = (currentPath === "/" || currentPath === "/mushaf-full" || currentPath === "/mushaf-choice" || currentPath === "/mushaf" || currentPath === "/mushaf-tafseer");

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          🖥️ DESKTOP TOP HEADER (Fixed at the Top for Laptop & Desktop)
          ══════════════════════════════════════════════════════════════════════ */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-[300] h-16 bg-card/90 dark:bg-black/90 backdrop-blur-xl border-b border-border/70 px-6 lg:px-10 items-center justify-between shadow-xs transition-colors duration-300">
        
        {/* Right: Brand Typographic Identity */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigateInstantly('/')} 
            className="hover:opacity-90 active:scale-95 transition-all text-right group flex items-center"
            title="يقين القرآن - الصفحة الرئيسية"
          >
            <YaqeenLogo size="md" variant="full" />
          </button>
        </div>

        {/* Center: Desktop Navigation Bar with Floating Fluid Indicator */}
        <nav className="flex items-center bg-foreground/[0.03] dark:bg-white/[0.04] p-1 rounded-2xl border border-border/60">
          {tabs.map((tab) => {
            const isTabActive = (tab.id === "mushaf" && isMushafActive) || currentPath === tab.path;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.id}
                href={tab.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigateInstantly(tab.path);
                }}
                className={`relative px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all duration-200 select-none ${
                  isTabActive
                    ? "text-primary-foreground font-black shadow-xs"
                    : "text-foreground/70 hover:text-foreground hover:bg-foreground/[0.04]"
                }`}
              >
                {isTabActive && (
                  <motion.div
                    layoutId="desktop-active-nav-indicator"
                    className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className={`w-4 h-4 transition-transform duration-200 ${isTabActive ? "scale-110" : ""}`} />
                <span className="font-arabic tracking-tight whitespace-nowrap">{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Left: Interactive Controls & User Info */}
        <div className="flex items-center gap-2.5">
          {/* Dark / Light Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-border/60 text-foreground transition-all active:scale-95"
            title={theme === "dark" ? "تفعيل الوضع النهاري الأبيض" : "تفعيل الوضع الليلي"}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-primary hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* User Profile Trigger */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open_profile_settings'))}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-border/60 text-foreground transition-all active:scale-95 group"
            title="الملف الشخصي"
          >
            <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/30">
              {userPhoto ? (
                <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            <span className="text-xs font-bold font-arabic max-w-[80px] truncate hidden lg:inline-block">
              {userName || "حسابي"}
            </span>
          </button>

          {/* Global Menu Trigger */}
          <button
            onClick={() => {
              window.location.hash = "menu";
            }}
            className="p-2 rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-border/60 text-foreground transition-all active:scale-95"
            title="القائمة الشاملة"
          >
            <Menu className="w-4 h-4 text-primary" />
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          📱 MOBILE BOTTOM DOCK (Clean, Thumb-Friendly for Smartphones)
          ══════════════════════════════════════════════════════════════════════ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[1000] w-full px-2 pb-2 pt-1 pointer-events-none font-arabic">
        <div className="max-w-md mx-auto w-full h-[62px] bg-card/95 dark:bg-black/95 backdrop-blur-xl border border-border/80 rounded-2xl flex items-center justify-around px-1 shadow-lg pointer-events-auto relative overflow-hidden group gpu-layer">
          
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
          
          {tabs.map((tab) => {
            const isTabActive = (tab.id === "mushaf" && isMushafActive) || currentPath === tab.path;
            const Icon = tab.icon;
            
            return (
              <Link
                key={tab.id}
                href={tab.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigateInstantly(tab.path);
                }}
                className={`relative flex flex-col items-center justify-center gap-0.5 transition-all duration-200 flex-1 py-1 group/nav min-w-0 ${
                  isTabActive ? "scale-105" : "opacity-65 hover:opacity-100"
                }`}
              >
                {/* Active Indicator Pulse */}
                {isTabActive && (
                  <div className="absolute -top-1 w-4 h-4 bg-primary/25 rounded-full blur-md animate-pulse" />
                )}
                
                <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isTabActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-foreground"
                }`}>
                  <Icon className={`w-3.5 h-3.5 stroke-[2.2px] transition-transform duration-200 ${isTabActive ? "scale-110" : "group-hover/nav:scale-115"}`} />
                </div>

                <span className={`text-[8px] font-bold tracking-tight transition-all duration-200 leading-none ${
                  isTabActive ? "text-primary font-black" : "text-muted-foreground"
                }`}>
                  {tab.label}
                </span>

                {isTabActive && (
                  <div className="absolute -bottom-0.5 w-2 h-0.5 bg-primary rounded-full shadow-sm" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
