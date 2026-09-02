"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, BookOpen, Layers, FileText, Compass } from "lucide-react";
import { navigateInstantly } from "@/lib/navigation";
import { useTheme } from "@/components/ThemeProvider";

interface ChoiceMode {
  href: string;
  title: string;
  badge: string;
  desc: string;
  colorClass: string;
  bgGradientClass: string;
  borderClass: string;
  hoverBorderClass: string;
  shadowClass: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconTextColor: string;
}

const MODES: ChoiceMode[] = [
  {
    href: "/mushaf",
    title: "تلاوة آية بآية",
    badge: "تلاوة وتفسير تفاعلي",
    desc: "استمع لكل آية على حدة مع تظليل النص والوصول الفوري للتفسير والترجمة مع أكثر من 50 قارئاً.",
    colorClass: "text-foreground",
    bgGradientClass: "from-foreground/[0.04] via-transparent to-transparent bg-card",
    borderClass: "border-border",
    hoverBorderClass: "hover:border-foreground/40 hover:shadow-lg",
    shadowClass: "shadow-xs",
    icon: BookOpen,
    iconBgColor: "bg-foreground/5 dark:bg-foreground/10",
    iconTextColor: "text-foreground",
  },
  {
    href: "/mushaf-full",
    title: "المصحف الورقي (604 صفحة)",
    badge: "مصحف المدينة المنورة",
    desc: "تصفح المصحف الشريف بالصفحات الكاملة بالرسم العثماني الدقيق مع تقليب سلس للصفحات.",
    colorClass: "text-foreground",
    bgGradientClass: "from-foreground/[0.04] via-transparent to-transparent bg-card",
    borderClass: "border-border",
    hoverBorderClass: "hover:border-foreground/40 hover:shadow-lg",
    shadowClass: "shadow-xs",
    icon: Layers,
    iconBgColor: "bg-foreground/5 dark:bg-foreground/10",
    iconTextColor: "text-foreground",
  },
  {
    href: "/mushaf-tafseer",
    title: "المصحف مع التفسير",
    badge: "دراسة وتدبر",
    desc: "عرض صفحة المصحف وبجانبها تفسير الآيات وكلماتها الغريبة، مثالي للتدبر والتعلم اليومي.",
    colorClass: "text-foreground",
    bgGradientClass: "from-foreground/[0.04] via-transparent to-transparent bg-card",
    borderClass: "border-border",
    hoverBorderClass: "hover:border-foreground/40 hover:shadow-lg",
    shadowClass: "shadow-xs",
    icon: FileText,
    iconBgColor: "bg-foreground/5 dark:bg-foreground/10",
    iconTextColor: "text-foreground",
  },
];

export function MushafChoice() {
  const { theme } = useTheme();

  return (
    <div className="relative w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center justify-start px-4 md:px-8 py-6 md:py-10">
      
      {/* ── Main Responsive Container ── */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center gap-8 text-center my-auto">
        
        {/* ── Title Header ── */}
        <div className="space-y-3 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-arabic text-xs font-bold shadow-2xs"
          >
            <span>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl md:text-4xl font-black font-arabic tracking-tight text-foreground"
          >
            اختر طريقة القراءة والتلاوة
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-muted-foreground text-xs md:text-sm font-arabic font-medium"
          >
            صُممت لك ثلاثة أوضاع متكاملة لرحلتك مع القرآن الكريم لتناسب القراءة، الحفظ، والتدبر
          </motion.p>
        </div>

        {/* ── Three Reading Mode Cards: 3 Columns on Desktop, 1 Column on Mobile ── */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {MODES.map((mode, idx) => {
            const Icon = mode.icon;
            
            return (
              <motion.div
                key={mode.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + idx * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => navigateInstantly(mode.href)}
                className={`relative rounded-3xl overflow-hidden ${mode.bgGradientClass} border-2 ${mode.borderClass} ${mode.hoverBorderClass} ${mode.shadowClass} p-6 md:p-8 flex flex-col justify-between text-right cursor-pointer transition-all duration-300 group`}
              >
                {/* Top Section: Badge & Icon */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${mode.iconBgColor} flex items-center justify-center border border-border/50 group-hover:scale-110 transition-transform duration-300 shadow-2xs`}>
                    <Icon className={`w-7 h-7 ${mode.iconTextColor}`} />
                  </div>
                  <span className="text-[11px] font-bold font-arabic px-3 py-1 rounded-full bg-foreground/[0.04] text-muted-foreground border border-border/60">
                    {mode.badge}
                  </span>
                </div>

                {/* Middle Section: Title & Description */}
                <div className="space-y-2 mb-6">
                  <h3 className={`text-lg md:text-xl font-black font-arabic ${mode.colorClass}`}>
                    {mode.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-arabic leading-relaxed">
                    {mode.desc}
                  </p>
                </div>

                {/* Bottom Action: Clickable Pill */}
                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs font-bold font-arabic text-foreground/80 group-hover:text-primary transition-colors">
                    ابدأ القراءة الآن
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-foreground/[0.04] group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Quranic Verse Footer Card (Centered) ── */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-2xl bg-card/60 dark:bg-card/40 backdrop-blur-md border border-border/70 rounded-2xl px-6 py-4 shadow-2xs flex flex-col items-center justify-center gap-1.5 text-center mx-auto"
        >
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
            <p className="text-xs md:text-sm font-arabic font-bold text-foreground text-center leading-relaxed">
              «كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ وَلِيَتَذَكَّرَ أُولُو الْأَلْبَابِ»
            </p>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
          </div>
          <span className="text-[10px] text-muted-foreground font-bold font-arabic">
            سورة ص · آية ٢٩
          </span>
        </motion.div>

      </div>
    </div>
  );
}
