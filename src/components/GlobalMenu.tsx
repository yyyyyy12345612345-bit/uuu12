"use client";

import React from "react";
import { 
  X, MessageCircle, Moon, Sun, BookOpen, ScrollText, 
  Calendar, Headphones, Timer, Video, Share2, Heart, Smartphone, Trophy, ShieldCheck, Star,
  ChevronLeft, LayoutDashboard, Settings, Info, LogOut, Map as MapIcon
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface GlobalMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
  onOpenProfile: () => void;
  onOpenPointsGuide: () => void;
}

export function GlobalMenu({ isOpen, onClose, onOpenFeedback, onOpenProfile, onOpenPointsGuide }: GlobalMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
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
    router.push(path);
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
          window.open('https://quran1-mu.vercel.app/download/', '_blank');
        }},
        { id: "points-guide", label: "دليل النقاط", icon: MapIcon, onClick: onOpenPointsGuide },
      ]
    }
  ];

  const isAdmin = auth?.currentUser?.email === "youssefosama@gmail.com";

  return (
    <div className="fixed inset-0 z-[2000] flex justify-end font-arabic">
      {/* Premium Dark Glass Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      {/* Sidebar Content */}
      <div className="relative w-full max-w-[420px] h-full bg-[#050505] text-white shadow-[-30px_0_100px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 border-l border-white/5">
        
        {/* Abstract Cinematic Background */}
        <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none mix-blend-overlay" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-900/10 blur-[150px] rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        {/* Sidebar Header */}
        <div className="p-8 pb-6 relative z-10">
          <div className="flex items-center justify-between mb-10">
            <button 
                onClick={onClose}
                className="w-12 h-12 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-500 active:scale-90 shadow-xl"
            >
                <X className="w-5 h-5" />
            </button>
            <button 
                onClick={toggleTheme}
                className="w-12 h-12 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-primary hover:bg-primary/10 transition-all duration-500 active:scale-90 shadow-xl"
            >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* Premium Profile Section */}
          <div className="relative p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 overflow-hidden group hover:border-primary/30 transition-colors duration-500 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {auth?.currentUser && userData ? (
              <div className="flex items-center gap-5 relative z-10">
                 <div className="relative shrink-0" onClick={onOpenProfile}>
                    <div className="w-16 h-16 rounded-[1.5rem] border border-white/10 bg-black shadow-2xl overflow-hidden cursor-pointer group-hover:scale-105 group-hover:border-primary/50 transition-all duration-500">
                       <img 
                         src={userData.photoURL || "/logo/logo.png"} 
                         alt="Profile" 
                         className="w-full h-full object-cover" 
                       />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-black shadow-lg shadow-primary/30 border-2 border-[#050505]">
                       <Trophy className="w-4 h-4" />
                    </div>
                 </div>
                 
                 <div className="flex-1 text-right overflow-hidden flex flex-col justify-center">
                    <h3 className="text-xl font-black truncate text-white/90 mb-1">{userData.displayName || userData.username}</h3>
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">{userData.totalPoints || 0} نقطة</span>
                      <button onClick={onOpenProfile} className="text-[10px] font-black text-white/30 hover:text-white transition-colors uppercase tracking-widest">تعديل</button>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="flex items-center gap-5 relative z-10">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center p-3 shadow-inner">
                    <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-contain opacity-80" />
                  </div>
                  <div className="text-right">
                    <h3 className="text-2xl font-black text-white/90">سكينة</h3>
                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-1">تطبيق القرآن الكريم</p>
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-2 space-y-12 relative z-10">
          {menuGroups.map((group, idx) => (
             <div key={idx} className="space-y-5 animate-in slide-in-from-right fade-in" style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}>
                 <div className="flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/5" />
                    <h4 className="text-[10px] font-black text-white/30 tracking-[0.4em] uppercase">{group.title}</h4>
                 </div>
                 <div className="space-y-3">
                    {group.items.map((item: any, itemIdx: number) => {
                       const isActive = pathname === item.path;
                       return (
                           <button
                             key={item.id}
                             onClick={() => {
                               if (item.onClick) item.onClick();
                               else if (item.url) window.open(item.url, '_blank');
                               else if (item.path) navigate(item.path);
                             }}
                             className={`relative w-full group flex items-center justify-between p-5 rounded-[2rem] transition-all duration-300 border overflow-hidden animate-in fade-in slide-in-from-right-4 ${
                               isActive 
                                 ? 'bg-primary/10 border-primary/30 shadow-[0_0_30px_rgba(212,175,55,0.15)] scale-[1.02]' 
                                 : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10'
                             }`}
                             style={{ animationDelay: `${(idx * 100) + (itemIdx * 50)}ms`, animationFillMode: 'both' }}
                           >
                              {isActive && (
                                 <div className="absolute inset-0 bg-gradient-to-l from-primary/20 via-transparent to-transparent opacity-50" />
                              )}
                              {isActive && (
                                 <div className="absolute right-0 top-1/2 -translate-y-1/2 h-1/2 w-1.5 bg-primary rounded-l-full shadow-[0_0_15px_rgba(212,175,55,1)]" />
                              )}
                              <div className="flex items-center gap-5 relative z-10 w-full justify-end flex-row-reverse">
                                 <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all duration-500 shadow-inner shrink-0 ${
                                   isActive ? 'bg-primary shadow-primary/40 text-black scale-110' : 'bg-black/40 text-white/40 group-hover:text-primary group-hover:bg-primary/10'
                                 }`}>
                                    <item.icon className={`w-5 h-5 ${isActive ? 'fill-black/10' : ''}`} />
                                 </div>
                                 <span className={`text-lg font-black truncate text-right ${isActive ? 'text-primary' : 'text-white/80 group-hover:text-white'}`}>{item.label}</span>
                              </div>
                              <ChevronLeft className={`w-5 h-5 transition-transform duration-500 relative z-10 ${isActive ? 'text-primary -translate-x-2 opacity-100' : 'text-white/10 group-hover:-translate-x-1 group-hover:text-white/40 opacity-0 group-hover:opacity-100'}`} />
                           </button>
                       );
                    })}
                 </div>
             </div>
          ))}

          {isAdmin && (
            <div className="pt-8 animate-in slide-in-from-right fade-in" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
               <button
                  onClick={() => { onClose(); navigate('/admin'); }}
                  className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)] transition-all duration-300 group"
               >
                  <div className="flex items-center gap-4 flex-row-reverse">
                     <div className="w-12 h-12 rounded-[1.2rem] bg-red-500/20 flex items-center justify-center">
                         <ShieldCheck className="w-6 h-6" />
                     </div>
                     <span className="text-xl font-black">لوحة الإدارة الحصرية</span>
                  </div>
                  <ChevronLeft className="w-5 h-5 opacity-40 group-hover:-translate-x-1 group-hover:opacity-100 transition-all" />
               </button>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 relative z-10 bg-[#020202] text-center">
            <div className="flex items-center justify-center gap-2 text-white/40">
                <Heart className="w-4 h-4 text-primary fill-primary animate-pulse" />
                <span className="text-xs font-bold font-arabic">صنع بكل حب لكل مسلم</span>
            </div>
        </div>

      </div>
    </div>
  );
}
