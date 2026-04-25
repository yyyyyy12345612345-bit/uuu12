"use client";

import React from "react";
import { 
  X, MessageCircle, Moon, Sun, BookOpen, ScrollText, 
  Calendar, Headphones, Timer, Video, Share2, Heart, Smartphone, Trophy, ShieldCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";


import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface GlobalMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
  onOpenProfile: () => void; // New prop
}

export function GlobalMenu({ isOpen, onClose, onOpenFeedback, onOpenProfile }: GlobalMenuProps) {
  const router = useRouter();
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
        { id: "mushaf", label: "المصحف", icon: BookOpen, path: "/" },
        { id: "rank", label: "لوحة المتصدرين (الرانك)", icon: Trophy, path: "/rank", highlight: true },
        { id: "mushaf-full", label: "مصحف كامل", icon: ScrollText, path: "/mushaf-full" },
        { id: "daily", label: "يومياتي (الأذكار)", icon: Calendar, path: "/daily" },
        { id: "library", label: "المكتبة الصوتية", icon: Headphones, path: "/library" },
        { id: "prayers", label: "مواقيت الصلاة", icon: Timer, path: "/prayers" },
        { id: "video", label: "استوديو الفيديو", icon: Video, path: "/video" },
      ]
    },
    {
      title: "التفاعلات",
      items: [
        { id: "feedback", label: "أخبرنا برأيك", icon: MessageCircle, onClick: onOpenFeedback },
        { id: "share", label: "شارك التطبيق", icon: Share2, onClick: () => {
          if (navigator.share) {
            navigator.share({ title: 'قرآن', text: 'تطبيق القرآن الكريم واستوديو الفيديو الجنائزي', url: window.location.href });
          }
        }},
        // Temporarily hidden by request: "تنزيل التطبيق (APK)"
        // { id: "download", label: "تنزيل التطبيق (APK)", icon: Smartphone, url: "https://github.com/yyyyyy12345612345-bit/uuu12/releases/latest/download/app-debug.apk", highlight: true },
      ]
    }
  ];

  const isAdmin = auth?.currentUser?.email === "youssefosama@gmail.com";
  if (isAdmin) {
    menuGroups.push({
      title: "الإدارة",
      items: [
        { id: "admin", label: "لوحة تحكم المدير", icon: ShieldCheck, path: "/admin", highlight: true }
      ]
    } as any);
  }

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      {/* Side Menu Drawer */}
      <div className="relative w-full max-w-[400px] h-full bg-background border-l border-border shadow-[-50px_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 font-arabic">
        
        {/* Header / Profile Card */}
        <div className="p-6 border-b border-border bg-foreground/[0.02] relative overflow-hidden">
          <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground/40 hover:text-foreground transition-all"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground/40 hover:text-foreground transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {auth?.currentUser && userData ? (
            <div className="flex flex-col items-center text-center gap-4 relative z-10">
               <div className="relative group cursor-pointer" onClick={onOpenProfile}>
                  <div className="w-20 h-20 rounded-[1.5rem] border-4 border-primary/20 p-1 bg-background relative overflow-hidden shadow-xl group-hover:scale-105 transition-all">
                     <img 
                       src={userData.photoURL || "/logo/logo.png"} 
                       alt="Profile" 
                       className="w-full h-full object-cover rounded-[1rem]" 
                     />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-[8px] text-white font-black uppercase">تعديل</span>
                     </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-black shadow-lg border-2 border-background">
                     <Trophy className="w-4 h-4" />
                  </div>
               </div>
               
               <div className="space-y-1">
                  <h3 className="text-2xl font-black text-foreground font-arabic leading-tight">
                    {userData.displayName || userData.username}
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">@{userData.username}</span>
                    <div className="w-1 h-1 rounded-full bg-primary/40" />
                    <span className="text-[10px] text-primary font-black uppercase tracking-widest">{userData.totalPoints || 0} نقطة</span>
                  </div>
               </div>

               <button 
                onClick={onOpenProfile}
                className="mt-2 px-6 py-2.5 bg-foreground/5 hover:bg-primary/10 border border-border hover:border-primary/20 rounded-full text-[11px] font-black text-foreground/60 hover:text-primary transition-all font-arabic"
               >
                 إدارة الملف الشخصي
               </button>
            </div>
          ) : (
            <div className="flex items-center gap-4 relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-foreground/5 p-2 flex items-center justify-center border border-border shadow-inner">
                  <img src="/logo/logo.png?v=10" alt="Logo" className="w-full h-full object-contain rounded-lg" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-foreground">قرآن كريم</h3>
                  <p className="text-[10px] text-foreground/40 tracking-widest font-bold uppercase">القائمة الرئيسية</p>
               </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10 pb-20">

           {menuGroups.map((group, idx) => (
             <div key={idx} className="space-y-4">
                <h4 className="text-[10px] font-black text-foreground/40 tracking-[0.2em] px-4">{group.title}</h4>
                   {group.items.map((item: any) => (
                     <button
                       key={item.id}
                       onClick={() => {
                         if (item.onClick) item.onClick();
                         else if (item.url) window.open(item.url, '_blank');
                         else if (item.path) navigate(item.path);
                       }}
                       className={`group flex items-center justify-between p-5 rounded-3xl transition-all text-right border ${
                         item.highlight 
                           ? 'bg-primary/10 border-primary/30 hover:bg-primary/20' 
                           : 'bg-foreground/5 border-transparent hover:border-border hover:bg-foreground/[0.08]'
                       }`}
                     >
                        <div className="flex items-center gap-5">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                             item.highlight ? 'bg-primary/20' : 'bg-foreground/5 group-hover:bg-primary/20'
                           }`}>
                              <item.icon className={`w-5 h-5 transition-all ${
                                item.highlight ? 'text-primary' : 'text-foreground/40 group-hover:text-primary'
                              }`} />
                           </div>
                           <span className={`text-lg font-bold transition-all ${
                             item.highlight ? 'text-primary' : 'text-foreground/70 group-hover:text-foreground'
                           }`}>
                             {item.label}
                           </span>
                        </div>
                        {item.highlight ? (
                          <div className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black rounded-full animate-pulse">جديد</div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-foreground/10 group-hover:bg-primary transition-all" />
                        )}
                     </button>
                   ))}
             </div>
           ))}
         </div>
         
         {/* Fixed Admin Access Footer */}
         <div className="p-4 border-t border-border bg-background/50 backdrop-blur-md">
            <button
               onClick={() => {
                  onClose();
                  navigate('/admin');
               }}
               className="w-full group flex items-center justify-between p-3 rounded-2xl transition-all text-right bg-primary/5 border border-primary/20 hover:border-primary/40 hover:bg-primary/10"
            >
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center transition-all group-hover:bg-primary/20">
                     <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-right">
                     <span className="block text-sm font-bold text-foreground">لوحة الإدارة</span>
                     <p className="text-[8px] text-primary/40 font-black uppercase tracking-widest">ADMIN CONTROL</p>
                  </div>
               </div>
               <div className="w-2 h-2 rounded-full bg-primary/20 group-hover:bg-primary transition-all" />
            </button>
         </div>

      </div>
    </div>
  );
}
