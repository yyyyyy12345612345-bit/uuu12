"use client";

import React from "react";
import { 
  X, MessageCircle, Moon, Sun, BookOpen, ScrollText, 
  Calendar, Headphones, Timer, Video, User, 
  Globe, Share2, Heart, ShieldCheck, Home, Info
} from "lucide-react";
import { useRouter } from "next/navigation";

interface GlobalMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
}

export function GlobalMenu({ isOpen, onClose, onOpenFeedback }: GlobalMenuProps) {
  const router = useRouter();

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
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      {/* Side Menu Drawer */}
      <div className="relative w-full max-w-[400px] h-full bg-[#0a0a0a] border-l border-white/5 shadow-[-50px_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 font-arabic">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Heart className="w-5 h-5 text-primary" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-white">القائمة</h3>
                <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Main Dashboard</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10 pb-20">
           
           {/* Appearance Quick Toggle */}
           <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
              <div>
                 <p className="text-white font-bold mb-1">المظهر الليلي</p>
                 <p className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Dark Appearance</p>
              </div>
              <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                 <button className="p-2.5 rounded-xl text-white/20 hover:text-white transition-all"><Sun className="w-4 h-4" /></button>
                 <button className="p-2.5 rounded-xl bg-primary text-black shadow-lg shadow-primary/20"><Moon className="w-4 h-4" /></button>
              </div>
           </div>

           {menuGroups.map((group, idx) => (
             <div key={idx} className="space-y-4">
                <h4 className="text-[10px] uppercase font-black text-white/20 tracking-[0.4em] px-4">{group.title}</h4>
                <div className="grid grid-cols-1 gap-2">
                   {group.items.map((item) => (
                     <button
                       key={item.id}
                       onClick={() => {
                         if (item.onClick) item.onClick();
                         else if (item.path) navigate(item.path);
                       }}
                       className="group flex items-center justify-between p-5 rounded-3xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-right"
                     >
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                              <item.icon className="w-5 h-5 text-white/20 group-hover:text-primary transition-all" />
                           </div>
                           <span className="text-lg font-bold text-white/70 group-hover:text-white transition-all">{item.label}</span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-white/5 group-hover:bg-primary transition-all" />
                     </button>
                   ))}
                </div>
             </div>
           ))}

        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-black/40">
           <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] text-white/20 font-bold tracking-widest uppercase">Version 7.0 Alpha</span>
              <div className="flex gap-4">
                 <Info className="w-4 h-4 text-white/10" />
                 <Globe className="w-4 h-4 text-white/10" />
              </div>
           </div>
           <p className="text-[10px] text-white/10 text-center leading-relaxed font-arabic">
              تم التطوير بحب لخدمة كتاب الله عز وجل.<br/>صدقة جارية لكل من ساهم.
           </p>
        </div>
      </div>
    </div>
  );
}
