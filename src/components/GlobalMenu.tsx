"use client";

import React from "react";
import { 
  X, MessageCircle, Moon, Sun, BookOpen, ScrollText, 
  Calendar, Headphones, Timer, Video, Share2, Heart
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";

interface GlobalMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
}

export function GlobalMenu({ isOpen, onClose, onOpenFeedback }: GlobalMenuProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

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
      <div className="relative w-full max-w-[400px] h-full bg-background border-l border-border shadow-[-50px_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 font-arabic">
        
        {/* Header */}
        <div className="p-8 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Heart className="w-5 h-5 text-primary" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-foreground">القائمة</h3>
                <p className="text-[10px] text-foreground/40 tracking-widest font-bold">اللوحة الرئيسية</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all"
              title="تغيير المظهر"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-10 pb-20">

           {menuGroups.map((group, idx) => (
             <div key={idx} className="space-y-4">
                <h4 className="text-[10px] font-black text-foreground/40 tracking-[0.2em] px-4">{group.title}</h4>
                <div className="grid grid-cols-1 gap-2">
                   {group.items.map((item) => (
                     <button
                       key={item.id}
                       onClick={() => {
                         if (item.onClick) item.onClick();
                         else if (item.path) navigate(item.path);
                       }}
                       className="group flex items-center justify-between p-5 rounded-3xl hover:bg-foreground/5 border border-transparent hover:border-border transition-all text-right"
                     >
                        <div className="flex items-center gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-foreground/5 flex items-center justify-center group-hover:bg-primary/20 transition-all">
                              <item.icon className="w-5 h-5 text-foreground/40 group-hover:text-primary transition-all" />
                           </div>
                           <span className="text-lg font-bold text-foreground/70 group-hover:text-foreground transition-all">{item.label}</span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-foreground/5 group-hover:bg-primary transition-all" />
                     </button>
                   ))}
                </div>
             </div>
           ))}

        </div>

      </div>
    </div>
  );
}
