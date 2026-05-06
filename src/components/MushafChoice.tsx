import React from 'react';
import Link from 'next/link';
import { BookOpen, ScrollText, Sparkles, History } from 'lucide-react';

export function MushafChoice() {
  return (
    <div className="relative w-full h-full flex flex-col items-center p-6 animate-in zoom-in-95 duration-700">
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/40 to-background" />
          <div className="absolute inset-0 islamic-pattern opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center py-10">
        <div className="flex items-center justify-center gap-3 mb-6">
           <div className="w-12 h-1 bg-primary/30 rounded-full" />
           <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Sakinah</span>
              <h2 className="text-4xl md:text-5xl font-black font-arabic text-foreground text-center tracking-tight">سـكـيـنـة</h2>
           </div>
           <div className="w-12 h-1 bg-primary/30 rounded-full" />
        </div>
        
        <div className="flex items-center gap-2 mb-4">
           <Sparkles className="w-5 h-5 text-primary" />
           <h3 className="text-2xl font-bold font-arabic text-foreground">اختر طريقة التلاوة</h3>
           <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <p className="text-foreground/50 font-arabic text-sm md:text-base mb-12 text-center max-w-sm font-bold leading-relaxed">
          صممنا لك خيارات متنوعة تتناسب مع رحلتك الإيمانية، اختر ما يريح قلبك اليوم.
        </p>
        
        <div className="flex flex-col gap-5 w-full">
          <Link 
            href="/mushaf" 
            className="flex items-center gap-5 p-7 bg-card/40 backdrop-blur-xl border border-border hover:border-primary/40 rounded-[2.5rem] transition-all group hover:-translate-y-1 active:scale-[0.98] shadow-sm hover:shadow-xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all shadow-inner">
              <BookOpen className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
            <div className="text-right flex-1">
              <h3 className="text-2xl font-black font-arabic mb-1 text-foreground">آية بآية</h3>
              <p className="text-xs font-arabic text-foreground/40 font-bold leading-relaxed">تجربة تلاوة مركزة تتيح لك الاستماع لكل آية على حدة مع عرض التفسير والترجمة الفورية.</p>
            </div>
          </Link>

          <Link 
            href="/mushaf-full" 
            className="flex items-center gap-5 p-7 bg-card/40 backdrop-blur-xl border border-border hover:border-primary/40 rounded-[2.5rem] transition-all group hover:-translate-y-1 active:scale-[0.98] shadow-sm hover:shadow-xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all shadow-inner">
              <ScrollText className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
            <div className="text-right flex-1">
              <h3 className="text-2xl font-black font-arabic mb-1 text-foreground">المصحف الرقمي</h3>
              <p className="text-xs font-arabic text-foreground/40 font-bold leading-relaxed">تصفح المصحف بالرسم العثماني التقليدي كما في النسخ الورقية، مع إمكانية التنقل السريع بين الصفحات.</p>
            </div>
          </Link>

          <Link 
            href="/mushaf-tafseer" 
            className="flex items-center gap-5 p-7 bg-card/40 backdrop-blur-xl border border-border hover:border-primary/40 rounded-[2.5rem] transition-all group hover:-translate-y-1 active:scale-[0.98] shadow-sm hover:shadow-xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-all shadow-inner">
              <BookOpen className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
            <div className="text-right flex-1">
              <h3 className="text-2xl font-black font-arabic mb-1 text-foreground">مصحف بالتفسير</h3>
              <p className="text-xs font-arabic text-foreground/40 font-bold leading-relaxed">القراءة المعمقة مع عرض التفسير الميسر بجانب كل صفحة، مثالي لطلبة العلم والباحثين عن التدبر.</p>
            </div>
          </Link>
        </div>

        {/* History Section from Stitch */}
        <div className="w-full mt-12 p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center justify-between group cursor-pointer hover:bg-primary/10 transition-all">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                 <History className="w-6 h-6 text-primary" />
              </div>
              <div className="text-right">
                 <span className="block text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">آخر القراءات</span>
                 <h4 className="text-lg font-black text-foreground font-arabic">سورة البقرة</h4>
              </div>
           </div>
           <div className="text-left">
              <p className="text-[10px] font-bold text-foreground/40 font-arabic">آخر وصول: آية ١٤٢</p>
              <p className="text-[9px] font-black text-primary/60 uppercase">منذ ساعتين</p>
           </div>
        </div>
      </div>
    </div>
  );
}

