"use client";

import React from "react";
import { 
  X, MessageCircle, Moon, Sun, BookOpen, ScrollText, 
  Calendar, Headphones, Timer, Video, Share2, Heart, Smartphone, Trophy, ShieldCheck, Star,
  ChevronLeft, LayoutDashboard, Settings, Info, LogOut, Map as MapIcon, Bell
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useInstantPathname, navigateInstantly } from "@/lib/navigation";

interface GlobalMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
  onOpenProfile: () => void;
  onOpenPointsGuide: () => void;
  onOpenSettings?: () => void;
  onOpenAppSettings?: () => void;
}

export function GlobalMenu({ isOpen, onClose, onOpenFeedback, onOpenProfile, onOpenPointsGuide, onOpenSettings, onOpenAppSettings }: GlobalMenuProps) {
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

  if (!isOpen) return null;

  const navigate = (path: string) => {
    navigateInstantly(path);
    onClose();
  };

  const menuGroups = [
    {
      title: "الأقسام الرئيسية",
      items: [
        { id: "mushaf", label: "المصحف الشريف", icon: BookOpen, path: "/" },
        { id: "daily", label: "يومياتي (الأذكار)", icon: Calendar, path: "/daily" },
        { id: "rank", label: "لوحة المتصدرين", icon: Trophy, path: "/rank" },
        { id: "library", label: "المكتبة الصوتية", icon: Headphones, path: "/library" },
        { id: "prayers", label: "مواقيت الصلاة", icon: Timer, path: "/prayers" },
        { id: "video", label: "استوديو الفيديو", icon: Video, path: "/video" },
      ]
    },
    {
      title: "التفاعلات",
      items: [
        { id: "showcase", label: "معرض المبدعين", icon: Star, path: "/showcase" },
        { id: "feedback", label: "أخبرنا برأيك", icon: MessageCircle, onClick: onOpenFeedback },
        { id: "share", label: "شارك التطبيق", icon: Share2, onClick: () => {
          if (navigator.share) {
            navigator.share({ title: 'سكينة', text: 'تطبيق القرآن الكريم واستوديو الفيديو الجنائزي', url: window.location.href });
          }
        }},
        { id: "install-apk", label: "تثبيت التطبيق (APK)", icon: Smartphone, onClick: () => {
          window.open('https://yaqeen-app.vercel.app/download/', '_blank');
        }},
        { id: "points-guide", label: "دليل النقاط", icon: MapIcon, onClick: onOpenPointsGuide },
        { id: "user-guide", label: "دليل استخدام المنصة 📖", icon: Info, onClick: () => {
          onClose();
          window.dispatchEvent(new CustomEvent("show_onboarding"));
        }},
      ]
    },
    {
      title: "الإعدادات",
      items: [
        { id: "settings", label: "إعدادات التطبيق", icon: Settings, onClick: () => { onOpenAppSettings?.(); } },
        { id: "notifications-settings", label: "إعدادات الإشعارات", icon: Bell, onClick: () => { onOpenSettings?.(); } },
      ]
    }
  ];

  const isAdmin = auth?.currentUser?.email === "youssefosama@gmail.com";

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
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
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
                  className="w-full p-3.5 px-4 rounded-[1.5rem] bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center justify-between group hover:border-primary/40 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] transition-all duration-300 text-right cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <Trophy className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary/70 uppercase tracking-wider">رصيد النقاط</p>
                      <p className="text-base font-black text-white">{Number((userData.totalPoints || 0).toFixed(1))} نقطة</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black text-primary/80 group-hover:text-white transition-colors">
                    <span>دليل النقاط</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-3 px-4 rounded-[1.5rem] bg-foreground/[0.03] border border-foreground/5">
                <div className="w-11 h-11 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center p-2 shadow-inner">
                  <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-contain opacity-80" />
                </div>
                <div className="text-right">
                  <h3 className="text-base font-black text-foreground/90">سكينة</h3>
                  <p className="text-[9px] text-primary font-black uppercase tracking-[0.25em] mt-0.5">تطبيق القرآن الكريم</p>
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
                     <h4 className="text-[10px] font-black text-primary/60 tracking-[0.15em] uppercase">{group.title}</h4>
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
                                  ? 'bg-primary/10 border-primary/20 shadow-[0_0_20px_rgba(212,175,55,0.1)] scale-[1.01]' 
                                  : 'bg-foreground/[0.02] border-foreground/[0.04] hover:bg-foreground/[0.04] hover:border-primary/20'
                              }`}
                            >
                              {isActive && (
                                 <div className="absolute inset-0 bg-gradient-to-l from-primary/20 via-transparent to-transparent opacity-50" />
                              )}
                              {isActive && (
                                 <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1/2 w-1.5 bg-primary rounded-l-full shadow-[0_0_15px_rgba(212,175,55,1)]" />
                              )}
                              <div className="flex items-center gap-4 relative z-10 w-full">
                                 <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner shrink-0 ${
                                   isActive ? 'bg-primary shadow-primary/30 text-primary-foreground scale-105' : 'bg-foreground/5 text-foreground/40 group-hover:text-primary group-hover:bg-primary/10'
                                 }`}>
                                    <item.icon className="w-[18px] h-[18px]" />
                                 </div>
                                 <span className={`text-base font-black truncate text-right ${isActive ? 'text-primary' : 'text-foreground/80 group-hover:text-foreground'}`}>{item.label}</span>
                              </div>
                              <ChevronLeft className={`w-4 h-4 transition-transform duration-300 relative z-10 ${isActive ? 'text-primary -translate-x-1 opacity-100' : 'text-foreground/10 group-hover:-translate-x-0.5 group-hover:text-foreground/40 opacity-0 group-hover:opacity-100'}`} />
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
