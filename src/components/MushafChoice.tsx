import React from 'react';
import Link from 'next/link';
import { BookOpen, ScrollText } from 'lucide-react';

export function MushafChoice() {
  return (
    <div className="absolute inset-0 overflow-y-auto no-scrollbar flex flex-col items-center p-6 animate-in zoom-in-95 duration-500">
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/40 to-background" />
          <div className="absolute inset-0 islamic-pattern opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center py-10">
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 border border-primary/20">
            <BookOpen className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-black font-arabic mb-2 text-foreground text-center">نوع المصحف</h2>
        <p className="text-foreground/50 font-arabic text-sm md:text-base mb-12 text-center font-bold">الرجاء اختيار طريقة العرض المفضلة لك للقراءة</p>
        
        <div className="flex flex-col gap-4 w-full pb-20">
          <Link 
            href="/mushaf" 
            className="flex items-center gap-4 p-6 glass-effect hover:bg-primary/5 border border-primary/20 hover:border-primary/50 rounded-3xl transition-all group active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <div className="text-right flex-1">
              <h3 className="text-xl font-black font-arabic mb-1 text-foreground group-hover:text-primary transition-colors">مصحف آية بآية</h3>
              <p className="text-[11px] md:text-xs font-arabic text-foreground/50 font-bold">قراءة وتفسير واستماع لكل آية بشكل منفصل ومفصل</p>
            </div>
          </Link>

          <Link 
            href="/mushaf-full" 
            className="flex items-center gap-4 p-6 glass-effect hover:bg-primary/5 border border-primary/20 hover:border-primary/50 rounded-3xl transition-all group active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all">
              <ScrollText className="w-7 h-7 text-primary" />
            </div>
            <div className="text-right flex-1">
              <h3 className="text-xl font-black font-arabic mb-1 text-foreground group-hover:text-primary transition-colors">مصحف كامل</h3>
              <p className="text-[11px] md:text-xs font-arabic text-foreground/50 font-bold">تصفح المصحف بالصفحات التقليدية مثل المصحف الورقي</p>
            </div>
          </Link>

          <Link 
            href="/mushaf-tafseer" 
            className="flex items-center gap-4 p-6 glass-effect hover:bg-primary/10 border border-primary/30 hover:border-primary/60 rounded-3xl transition-all group active:scale-[0.98]"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-all">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <div className="text-right flex-1">
              <h3 className="text-xl font-black font-arabic mb-1 text-foreground group-hover:text-primary transition-colors">مصحف بالتفسير</h3>
              <p className="text-[11px] md:text-xs font-arabic text-foreground/50 font-bold">قراءة المصحف مع معاني الكلمات والتفسير الميسر</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
