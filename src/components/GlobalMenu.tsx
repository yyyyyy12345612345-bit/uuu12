"use client";

import React from "react";
import { 
  X, MessageCircle, Moon, Sun, BookOpen, ScrollText, 
  Calendar, Headphones, Timer, Video, Share2, Heart, Smartphone, Trophy, ShieldCheck,
  ChevronLeft, LayoutDashboard, Settings, Info, LogOut, Map as MapIcon, Bell
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useInstantPathname, navigateInstantly } from "@/lib/navigation";
import { YaqeenLogo } from "@/components/YaqeenLogo";

interface GlobalMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
  onOpenProfile: () => void;
  onOpenPointsGuide: () => void;
  onOpenSettings?: () => void;
  onOpenAppSettings?: () => void;
  onOpenAppInstall?: () => void;
}

export function GlobalMenu({ isOpen, onClose, onOpenFeedback, onOpenProfile, onOpenPointsGuide, onOpenSettings, onOpenAppSettings, onOpenAppInstall }: GlobalMenuProps) {
  const router = useRouter();
  const pathname = useInstantPathname();
  const { theme, toggleTheme } = useTheme();
  const [userData, setUserData] = React.useState<any>(null);

  React.useEffect(() => {
    if (isOpen && auth?.currentUser) {
      getDoc(doc(db!, "users", auth.currentUser.uid)).then(s => {
        if (s.exists()) setUserData(s.data());
      });
    }
  }, [isOpen]);

  const isAdmin = React.useMemo(() => {
    const email = auth?.currentUser?.email?.toLowerCase() || "";
    return (
      email === "youssefosama@gmail.com" ||
      email === "youssef@yaqeen.app" ||
      email.includes("youssef")
    );
  }, [auth?.currentUser]);

  if (!isOpen) return null;

  const navigate = (path: string) => {
    navigateInstantly(path);
    onClose();
  };

  const menuGroups = [
    {
      title: "الأقسام المميزة",
      items: [
        { id: "mushaf", label: "المصحف الشريف", icon: BookOpen, path: "/" },
        { id: "daily", label: "يومياتي (الأذكار والورد)", icon: Calendar, path: "/daily" },
        { id: "rank", label: "لوحة المتصدرين والأبطال", icon: Trophy, path: "/rank" },
        { id: "library", label: "المكتبة الصوتية الشاملة", icon: Headphones, path: "/library" },
        { id: "prayers", label: "مواقيت الصلاة والأذان", icon: Timer, path: "/prayers" },
        { id: "video", label: "استوديو الفيديو القرآني", icon: Video, path: "/video" },
        { id: "points-guide", label: "دليل النقاط والأوسمة", icon: MapIcon, onClick: onOpenPointsGuide },
        { id: "install-apk", label: "تنزيل تطبيق الموبايل", icon: Smartphone, onClick: onOpenAppInstall },
      ]
    },
    {
      title: "الإعدادات والملف الشخصي",
      items: [
        { 
          id: "settings", 
          label: "الإعدادات العامة (الملف، الإشعارات، المظهر)", 
          icon: Settings, 
          onClick: () => { 
            onClose();
            if (onOpenSettings) onOpenSettings();
            else if (onOpenAppSettings) onOpenAppSettings();
          } 
        },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex justify-end font-arabic">
      {/* Premium Dark/Light Glass Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-[6px] animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Sidebar Content */}
      <div className="relative w-full max-w-[420px] h-full bg-background text-foreground shadow-[-30px_0_100px_rgba(0,0,0,0.3)] dark:shadow-[-30px_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 ease-out border-l border-foreground/5 rounded-l-[2rem] md:rounded-l-[2.5rem]">
        
        {/* Abstract Cinematic Background */}
        <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 blur-[150px] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        {/* Sidebar Header */}
        <div className="p-6 pb-4 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button 
                onClick={onClose}
                className="w-12 h-12 rounded-[1.5rem] bg-foreground/5 border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/10 hover:rotate-90 transition-all duration-500 active:scale-90 shadow-xl"
            >
                <X className="w-5 h-5" />
            </button>
            {/* Theme Toggle */}
            <button 
                onClick={toggleTheme}
                className="w-12 h-12 rounded-[1.5rem] bg-foreground/5 border border-foreground/10 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-foreground/10 hover:-rotate-12 transition-all duration-500 active:scale-90 shadow-xl"
            >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>
          </div>

          {/* Premium Profile & Points Section */}
          <div className="relative p-1 bg-transparent transition-all duration-300">
            {auth?.currentUser && userData ? (
              <div className="space-y-2.5">
                {/* Profile Card Button */}
                <button
                  onClick={onOpenProfile}
                  className="w-full flex items-center justify-between p-3 px-4 rounded-[1.5rem] bg-foreground/[0.03] border border-foreground/5 hover:border-primary/30 hover:bg-foreground/[0.05] transition-all duration-300 group text-right shadow-lg cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-xl border border-foreground/10 bg-card overflow-hidden group-hover:scale-105 transition-transform duration-300">
                        <img 
                          src={userData.photoURL || "/logo/logo.png"} 
                          alt="Profile" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="text-sm font-black text-foreground/90 group-hover:text-primary transition-colors">{userData.displayName || userData.username}</h3>
                      <p className="text-[10px] text-foreground/40 font-bold">تصفح ملفك الشخصي</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-foreground/30 group-hover:text-primary group-hover:-translate-x-1 transition-all" />
                </button>

                {/* Separate Premium Points Card */}
                <button
                  onClick={onOpenPointsGuide}
                  className="w-full p-3.5 px-4 rounded-[1.5rem] bg-foreground/[0.03] border border-border/80 flex items-center justify-between group hover:border-foreground/30 hover:bg-foreground/[0.06] transition-all duration-300 text-right cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <Trophy className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-foreground/60 uppercase tracking-wider">رصيد النقاط</p>
                      <p className="text-base font-black text-foreground">{Number((userData.totalPoints || 0).toFixed(1))} نقطة</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-foreground/80 group-hover:text-foreground transition-colors">
                    <span>دليل النقاط</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-3 px-4 rounded-[1.5rem] bg-foreground/[0.03] border border-border/60">
                <div className="w-11 h-11 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center p-2 shadow-inner">
                  <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-contain opacity-80" />
                </div>
                <div className="text-right">
                  <h3 className="text-base font-black text-foreground/90">يقين القرآن</h3>
                  <p className="text-[9px] text-foreground/50 font-black uppercase tracking-[0.25em] mt-0.5">المنصة الإسلامية الشاملة</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-2 space-y-8 relative z-10 animate-in fade-in duration-300 delay-75">
          {menuGroups.map((group, idx) => (
             <div key={idx} className="space-y-3.5">
                  <div className="flex items-center justify-between gap-3">
                     <h4 className="text-[10px] font-black text-foreground/60 tracking-[0.15em] uppercase">{group.title}</h4>
                     <div className="h-[1px] flex-1 bg-gradient-to-l from-foreground/10 to-transparent" />
                  </div>
                  <div className="space-y-2">
                     {group.items.map((item: any) => {
                        const isActive = pathname === item.path;
                        return (
                            <button
                              key={item.id}
                              onClick={() => {
                                if (item.onClick) item.onClick();
                                else if (item.url) window.open(item.url, '_blank');
                                else if (item.path) navigate(item.path);
                              }}
                              className={`relative w-full group flex items-center justify-between p-3.5 px-4 rounded-2xl transition-all duration-200 border overflow-hidden ${
                                isActive 
                                  ? 'bg-foreground text-background border-foreground shadow-md scale-[1.01]' 
                                  : 'bg-foreground/[0.02] border-border/60 hover:bg-foreground/[0.06] hover:border-foreground/30'
                              }`}
                            >
                              <div className="flex items-center gap-4 relative z-10 w-full">
                                 <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner shrink-0 ${
                                   isActive ? 'bg-background text-foreground scale-105' : 'bg-foreground/5 text-foreground/50 group-hover:text-foreground group-hover:bg-foreground/10'
                                 }`}>
                                    <item.icon className="w-[18px] h-[18px]" />
                                 </div>
                                 <span className={`text-base font-black truncate text-right ${isActive ? 'text-background' : 'text-foreground/80 group-hover:text-foreground'}`}>{item.label}</span>
                              </div>
                              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 relative z-10 ${isActive ? 'text-background -translate-x-1 opacity-100' : 'text-foreground/10 group-hover:-translate-x-0.5 group-hover:text-foreground/50 opacity-0 group-hover:opacity-100'}`} />
                            </button>
                        );
                     })}
                  </div>
             </div>
          ))}

          {isAdmin && (
            <div className="pt-4">
               <button
                  onClick={() => { onClose(); navigate('/admin'); }}
                  className="w-full flex items-center justify-between p-3.5 px-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/15 hover:border-red-500/30 transition-all duration-200 group text-right"
               >
                  <div className="flex items-center gap-4">
                     <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                     </div>
                     <span className="text-base font-black">لوحة الإدارة الحصرية</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 opacity-40 group-hover:-translate-x-1 group-hover:opacity-100 transition-all" />
               </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-foreground/5 relative z-10 bg-card text-center">
            <div className="flex items-center justify-center gap-2 text-foreground/40">
                <Heart className="w-4 h-4 text-primary fill-primary animate-pulse" />
                <span className="text-xs font-bold font-arabic">صنع بكل حب لكل مسلم</span>
            </div>
        </div>

      </div>
    </div>
  );
}
