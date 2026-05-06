"use client";

import React from "react";
import { 
  X, MessageCircle, Moon, Sun, BookOpen, ScrollText, 
  Calendar, Headphones, Timer, Video, Share2, Heart, Smartphone, Trophy, ShieldCheck, Star,
  ChevronLeft, LayoutDashboard, Settings, Info, LogOut
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface GlobalMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
  onOpenProfile: () => void;
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
        { id: "mushaf", label: "المصحف الشريف", icon: BookOpen, path: "/" },
        { id: "daily", label: "يومياتي (الأذكار)", icon: Calendar, path: "/daily", highlight: true },
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
      ]
    }
  ];

  const isAdmin = auth?.currentUser?.email === "youssefosama@gmail.com";

  return (
    <div className="fixed inset-0 z-[2000] flex justify-end font-arabic">
      {/* Premium Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-700" 
        onClick={onClose} 
      />
      
      {/* Sacred Sidebar */}
      <div className="relative w-full max-w-[380px] h-full bg-[#064E3B] text-white shadow-[-20px_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 islamic-pattern opacity-[0.05] pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />

        {/* Sidebar Header */}
        <div className="p-8 pb-4 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <button 
                onClick={onClose}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"
            >
                <X className="w-6 h-6" />
            </button>
            <button 
                onClick={toggleTheme}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"
            >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* Profile Section */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 mb-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {auth?.currentUser && userData ? (
              <div className="flex items-center gap-4 relative z-10">
                 <div className="relative shrink-0" onClick={onOpenProfile}>
                    <div className="w-16 h-16 rounded-full border-2 border-primary p-0.5 bg-[#064E3B] shadow-2xl overflow-hidden cursor-pointer hover:scale-105 transition-all">
                       <img 
                         src={userData.photoURL || "/logo/logo.png"} 
                         alt="Profile" 
                         className="w-full h-full object-cover rounded-full" 
                       />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-black shadow-lg">
                       <Trophy className="w-3 h-3" />
                    </div>
                 </div>
                 
                 <div className="flex-1 text-right overflow-hidden">
                    <h3 className="text-xl font-black truncate">{userData.displayName || userData.username}</h3>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">{userData.totalPoints || 0} نقطة</span>
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                      <button onClick={onOpenProfile} className="text-[10px] font-black text-white/40 hover:text-primary transition-all uppercase">تعديل الحساب</button>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-full bg-white/10 p-2 border border-white/10 flex items-center justify-center">
                    <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-black">سكينة</h3>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">تطبيق القرآن الكريم</p>
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-0 space-y-10 relative z-10">
          {menuGroups.map((group, idx) => (Group(group, idx, navigate)))}

          {isAdmin && (
            <div className="pt-4 border-t border-white/10">
               <button
                  onClick={() => { onClose(); navigate('/admin'); }}
                  className="w-full flex items-center justify-between p-6 rounded-[2rem] bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all"
               >
                  <div className="flex items-center gap-4">
                     <ShieldCheck className="w-6 h-6" />
                     <span className="text-lg font-black">لوحة الإدارة</span>
                  </div>
                  <ChevronLeft className="w-5 h-5 opacity-40" />
               </button>
            </div>
          )}
        </div>

        {/* Footer Credits */}
        <div className="p-8 border-t border-white/10 text-center relative z-10 bg-[#064E3B]/80 backdrop-blur-md">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-2">Sacred Serenity v1.9</p>
            <div className="flex items-center justify-center gap-2 text-white/40">
                <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                <span className="text-[9px] font-bold">صنع بكل حب لكل مسلم</span>
            </div>
        </div>

      </div>
    </div>
  );
}

function Group(group: any, idx: number, navigate: any) {
    return (
        <div key={idx} className="space-y-4">
           <h4 className="text-[11px] font-black text-white/20 tracking-[0.3em] uppercase pr-4 text-right">{group.title}</h4>
           <div className="space-y-3">
              {group.items.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    else if (item.url) window.open(item.url, '_blank');
                    else if (item.path) navigate(item.path);
                  }}
                  className={`w-full group flex items-center justify-between p-6 rounded-[2rem] transition-all border ${
                    item.highlight 
                      ? 'bg-primary border-transparent text-primary-foreground shadow-2xl scale-105' 
                      : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10 text-white'
                  }`}
                >
                   <div className="flex items-center gap-5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        item.highlight ? 'bg-white/20' : 'bg-white/5 group-hover:bg-primary/20'
                      }`}>
                         <item.icon className={`w-5 h-5 ${item.highlight ? 'text-white' : 'text-white/40 group-hover:text-primary'}`} />
                      </div>
                      <span className="text-lg font-black truncate">{item.label}</span>
                   </div>
                   <ChevronLeft className={`w-5 h-5 transition-transform group-hover:-translate-x-1 ${item.highlight ? 'text-white/40' : 'text-white/10'}`} />
                </button>
              ))}
           </div>
        </div>
    );
}
