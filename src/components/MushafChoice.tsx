import React from 'react';
import Link from 'next/link';
import { BookOpen, Scroll, Compass, Sparkles, ChevronLeft } from 'lucide-react';

export function MushafChoice() {
  return (
    <div className="relative w-full min-h-full flex flex-col items-center justify-center p-6 pb-32 overflow-hidden bg-transparent">
      {/* ─── Premium Ambient Backgrounds ─── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#05060d]/95 via-background/40 to-[#05060d]" />
        {/* Soft, pulsating golden-emerald blur orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-primary/10 blur-[130px] rounded-full animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-1/3 left-1/3 w-[300px] h-[300px] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse duration-[8000ms]" />
        {/* Islamic pattern overlay */}
        <div className="absolute inset-0 islamic-pattern opacity-[0.04] mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-xl flex flex-col items-center py-8">
        
        {/* ─── Top Spiritual Badge ─── */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-in fade-in slide-in-from-top-4 duration-1000">
          <Sparkles className="w-3.5 h-3.5 text-primary fill-primary animate-pulse" />
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] font-arabic">رحلتك الإيمانية اليوم</span>
        </div>

        {/* ─── Sakeenah Title ─── */}
        <div className="flex items-center justify-center gap-4 mb-4 animate-in fade-in duration-1000 delay-100">
          <div className="w-8 h-[2px] bg-gradient-to-r from-transparent to-primary/40 rounded-full" />
          <h2 className="text-4xl md:text-5xl font-black font-arabic bg-gradient-to-r from-white via-amber-200 to-white bg-clip-text text-transparent drop-shadow-lg tracking-wide">
            سَـكِـيـنَـة
          </h2>
          <div className="w-8 h-[2px] bg-gradient-to-l from-transparent to-primary/40 rounded-full" />
        </div>
        
        {/* ─── Description Header ─── */}
        <h3 className="text-xl md:text-2xl font-black font-arabic text-white mb-2 tracking-wide text-center animate-in fade-in duration-1000 delay-200">
          اختر طريقة التلاوة
        </h3>
        <p className="text-white/45 font-arabic text-xs md:text-sm mb-10 text-center max-w-sm font-bold leading-relaxed animate-in fade-in duration-1000 delay-300">
          صممنا لك خيارات متنوعة تتناسب مع رغبتك اليوم، اختر ما يريح قلبك ويزيد من تدبرك للقرآن الكريم.
        </p>
        
        {/* ─── Reading Modes Selection Cards ─── */}
        <div className="flex flex-col gap-5 w-full">
          {[
            {
              href: "/mushaf",
              title: "آية بآية",
              desc: "تجربة تلاوة مركزة تتيح لك الاستماع لكل آية على حدة مع عرض التفسير والترجمة الفورية.",
              badge: "التلاوة المركزة",
              icon: <BookOpen className="w-7 h-7 text-primary group-hover:text-black group-hover:scale-110 transition-all duration-500" />,
              delayClass: "delay-400",
              glowColor: "group-hover:shadow-[0_0_30px_rgba(212,175,55,0.12)]",
              borderColor: "group-hover:border-primary/40"
            },
            {
              href: "/mushaf-full",
              title: "المصحف الرقمي",
              desc: "تصفح المصحف بالرسم العثماني التقليدي كما في النسخ الورقية، مع إمكانية التنقل السريع بين الصفحات.",
              badge: "الرسم العثماني",
              icon: <Scroll className="w-7 h-7 text-primary group-hover:text-black group-hover:scale-110 transition-all duration-500" />,
              delayClass: "delay-500",
              glowColor: "group-hover:shadow-[0_0_30px_rgba(212,175,55,0.12)]",
              borderColor: "group-hover:border-primary/40"
            },
            {
              href: "/mushaf-tafseer",
              title: "مصحف بالتفسير",
              desc: "القراءة المعمقة مع عرض التفسير الميسر بجانب كل صفحة، مثالي لطلبة العلم والباحثين عن التدبر واليقين.",
              badge: "التدبر والمعرفة",
              icon: <Compass className="w-7 h-7 text-primary group-hover:text-black group-hover:scale-110 transition-all duration-500" />,
              delayClass: "delay-600",
              glowColor: "group-hover:shadow-[0_0_30px_rgba(212,175,55,0.12)]",
              borderColor: "group-hover:border-primary/40"
            }
          ].map((mode) => (
            <Link 
              key={mode.href}
              href={mode.href} 
              className={`flex items-center gap-5 p-6 md:p-7 bg-[#0c0e18]/60 backdrop-blur-xl border border-white/[0.04] rounded-[2.5rem] transition-all duration-500 group hover:-translate-y-1 active:scale-[0.98] shadow-lg relative overflow-hidden ${mode.glowColor} ${mode.borderColor} animate-in fade-in slide-in-from-bottom-6 duration-1000 ${mode.delayClass}`}
            >
              {/* Card glowing gradient aura on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/[0.02] to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              
              {/* Right subtle golden highlight bar */}
              <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center rounded-r-full" />

              {/* Premium Icon Badge */}
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.25rem] bg-gradient-to-br from-primary/10 to-yellow-600/[0.02] border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-black transition-all duration-500 shadow-inner shrink-0 relative overflow-hidden">
                {/* Embedded decorative concentric ring */}
                <div className="absolute inset-1.5 border border-dashed border-primary/20 group-hover:border-black/20 rounded-[0.9rem] animate-spin duration-[15000ms] pointer-events-none" />
                {mode.icon}
              </div>

              {/* Content area */}
              <div className="text-right flex-1 min-w-0 z-10">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h3 className="text-xl md:text-2xl font-black font-arabic text-white group-hover:text-primary transition-colors duration-300">
                    {mode.title}
                  </h3>
                  <span className="text-[9px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
                    {mode.badge}
                  </span>
                </div>
                <p className="text-[11px] md:text-xs font-arabic text-white/40 group-hover:text-white/60 transition-colors duration-500 font-bold leading-relaxed">
                  {mode.desc}
                </p>
              </div>

              {/* Click Proceed Indicator (arrow) */}
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5 transition-all duration-500 shrink-0">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
