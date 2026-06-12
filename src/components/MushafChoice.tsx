"use client";

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

// GSAP - ensure you've run: npm install gsap
let gsap: any;
let ScrollTrigger: any;

const MushafIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Open Mushaf - left page */}
    <path d="M40 20 Q26 18 12 22 L12 62 Q26 58 40 60 Z"
      fill={`${color}10`} stroke={color} strokeWidth="1.2" strokeOpacity="0.45"/>
    {/* Open Mushaf - right page */}
    <path d="M40 20 Q54 18 68 22 L68 62 Q54 58 40 60 Z"
      fill={`${color}10`} stroke={color} strokeWidth="1.2" strokeOpacity="0.45"/>
    {/* Spine */}
    <line x1="40" y1="20" x2="40" y2="60" stroke={color} strokeWidth="2" strokeOpacity="0.6"/>
    {/* Left page lines */}
    <rect x="16" y="30" width="18" height="1.4" rx="0.7" fill={color} fillOpacity="0.55"/>
    <rect x="16" y="35" width="20" height="1.4" rx="0.7" fill={color} fillOpacity="0.4"/>
    <rect x="16" y="40" width="14" height="1.4" rx="0.7" fill={color} fillOpacity="0.4"/>
    <rect x="16" y="45" width="19" height="1.4" rx="0.7" fill={color} fillOpacity="0.3"/>
    <rect x="16" y="50" width="16" height="1.4" rx="0.7" fill={color} fillOpacity="0.25"/>
    {/* Right page lines */}
    <rect x="46" y="30" width="18" height="1.4" rx="0.7" fill={color} fillOpacity="0.55"/>
    <rect x="46" y="35" width="20" height="1.4" rx="0.7" fill={color} fillOpacity="0.4"/>
    <rect x="46" y="40" width="14" height="1.4" rx="0.7" fill={color} fillOpacity="0.4"/>
    <rect x="46" y="45" width="19" height="1.4" rx="0.7" fill={color} fillOpacity="0.3"/>
    <rect x="46" y="50" width="16" height="1.4" rx="0.7" fill={color} fillOpacity="0.25"/>
    {/* Top ornament dots */}
    <circle cx="24" cy="25" r="1.5" fill={color} fillOpacity="0.5"/>
    <circle cx="40" cy="22" r="1.5" fill={color} fillOpacity="0.7"/>
    <circle cx="56" cy="25" r="1.5" fill={color} fillOpacity="0.5"/>
  </svg>
);

const MODES = [
  {
    href: "/mushaf",
    title: "آية بآية",
    desc: "تجربة تلاوة مركزة تتيح لك الاستماع لكل آية على حدة مع عرض التفسير والترجمة الفورية.",
    color: "#d4af37",
    glow: "rgba(212,175,55,0.35)",
    dimGlow: "rgba(212,175,55,0.08)",
    gradient: "linear-gradient(135deg, #1a1300 0%, #0c0e18 60%, #050810 100%)",
    borderGrad: "linear-gradient(135deg, rgba(212,175,55,0.6), rgba(212,175,55,0.05))",
    num: "01",
  },
  {
    href: "/mushaf-full",
    title: "المصحف الرقمي",
    desc: "تصفح المصحف بالرسم العثماني التقليدي كما في النسخ الورقية مع إمكانية التنقل السريع بين الصفحات.",
    color: "#7dd3fc",
    glow: "rgba(125,211,252,0.35)",
    dimGlow: "rgba(125,211,252,0.07)",
    gradient: "linear-gradient(135deg, #001320 0%, #050e1a 60%, #050810 100%)",
    borderGrad: "linear-gradient(135deg, rgba(125,211,252,0.5), rgba(125,211,252,0.05))",
    num: "02",
  },
  {
    href: "/mushaf-tafseer",
    title: "مصحف بالتفسير",
    desc: "القراءة المعمقة مع عرض التفسير الميسر بجانب كل صفحة، مثالي لطلبة العلم والباحثين.",
    color: "#86efac",
    glow: "rgba(134,239,172,0.3)",
    dimGlow: "rgba(134,239,172,0.07)",
    gradient: "linear-gradient(135deg, #001306 0%, #050e0a 60%, #050810 100%)",
    borderGrad: "linear-gradient(135deg, rgba(134,239,172,0.5), rgba(134,239,172,0.05))",
    num: "03",
  }
];

// Floating particle component
function FloatingParticles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="mc-particle absolute rounded-full opacity-0"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            background: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  );
}

export function MushafChoice() {
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const bgRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: any;
    let mounted = true;

    const initGSAP = async () => {
      try {
        const gsapModule = await import('gsap');
        gsap = gsapModule.gsap || gsapModule.default;
        const STModule = await import('gsap/ScrollTrigger');
        ScrollTrigger = STModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        if (!mounted || !containerRef.current) return;

        ctx = gsap.context(() => {
          // ── Timeline master ──
          const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

          // Fade in the outer container
          tl.to(containerRef.current, { opacity: 1, duration: 0.3 });

          // Background fade-in
          tl.fromTo(bgRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.8 },
            "<"
          );

          // Ambient orbs float in
          if (orb1Ref.current) {
            gsap.to(orb1Ref.current, {
              y: -30, x: 20,
              duration: 8, repeat: -1, yoyo: true,
              ease: 'sine.inOut'
            });
          }
          if (orb2Ref.current) {
            gsap.to(orb2Ref.current, {
              y: 25, x: -15,
              duration: 10, repeat: -1, yoyo: true,
              ease: 'sine.inOut', delay: 2
            });
          }
          if (orb3Ref.current) {
            gsap.to(orb3Ref.current, {
              y: -20, x: 10,
              duration: 7, repeat: -1, yoyo: true,
              ease: 'sine.inOut', delay: 1
            });
          }

          // Particles floating animation
          const particles = document.querySelectorAll('.mc-particle');
          particles.forEach((p) => {
            gsap.to(p, {
              opacity: Math.random() * 0.6 + 0.1,
              y: -(Math.random() * 60 + 30),
              x: (Math.random() - 0.5) * 40,
              duration: Math.random() * 4 + 3,
              repeat: -1, yoyo: true,
              ease: 'sine.inOut',
              delay: Math.random() * 3
            });
          });

          // Badge entrance
          tl.fromTo(badgeRef.current,
            { opacity: 0, y: -20, scale: 0.8 },
            { opacity: 1, y: 0, scale: 1, duration: 0.7 },
            0.3
          );

          // Title dramatic entrance
          tl.fromTo(titleRef.current,
            { opacity: 0, y: 40, filter: 'blur(12px)' },
            { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1 },
            0.5
          );

          // Subtitle
          tl.fromTo(subtitleRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8 },
            0.8
          );

          // Cards staggered entrance
          cardsRef.current.forEach((card, i) => {
            if (!card) return;
            tl.fromTo(card,
              { opacity: 0, y: 60, scale: 0.95, rotateX: 5 },
              { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 0.9 },
              0.9 + i * 0.15
            );
          });

          // Continuous subtle title pulse
          gsap.to(titleRef.current, {
            textShadow: '0 0 40px rgba(212,175,55,0.6)',
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: 2
          });

        }, containerRef);

      } catch (e) {
        // GSAP not installed yet — fallback CSS animations used
        console.warn('GSAP not found. Run: npm install gsap');
        if (containerRef.current) {
          containerRef.current.style.opacity = '1';
        }
      }
    };

    initGSAP();

    return () => {
      mounted = false;
      if (ctx) ctx.revert();
    };
  }, []);

  const handleCardHover = async (index: number, entering: boolean) => {
    const card = cardsRef.current[index];
    if (!card || !gsap) return;
    const mode = MODES[index];
    const iconEl = card.querySelector('.mc-icon-container');
    const numEl = card.querySelector('.mc-num');
    const arrowEl = card.querySelector('.mc-arrow');
    const glowEl = card.querySelector('.mc-glow');

    if (entering) {
      gsap.to(card, {
        scale: 1.015,
        boxShadow: `0 0 60px ${mode.glow}, 0 20px 50px rgba(0,0,0,0.5)`,
        borderColor: mode.color + '80',
        duration: 0.4, ease: 'power2.out'
      });
      if (iconEl) gsap.to(iconEl, { scale: 1.1, rotate: 5, duration: 0.5, ease: 'back.out(2)' });
      if (numEl) gsap.to(numEl, { color: mode.color, scale: 1.1, duration: 0.3 });
      if (arrowEl) gsap.to(arrowEl, { x: -6, opacity: 1, duration: 0.4, ease: 'power2.out' });
      if (glowEl) gsap.to(glowEl, { opacity: 1, duration: 0.5 });
    } else {
      gsap.to(card, {
        scale: 1,
        boxShadow: `0 0 0px rgba(0,0,0,0), 0 8px 30px rgba(0,0,0,0.3)`,
        borderColor: 'rgba(255,255,255,0.06)',
        duration: 0.4, ease: 'power2.out'
      });
      if (iconEl) gsap.to(iconEl, { scale: 1, rotate: 0, duration: 0.4, ease: 'power2.out' });
      if (numEl) gsap.to(numEl, { color: 'rgba(255,255,255,0.1)', scale: 1, duration: 0.3 });
      if (arrowEl) gsap.to(arrowEl, { x: 0, opacity: 0.4, duration: 0.3 });
      if (glowEl) gsap.to(glowEl, { opacity: 0, duration: 0.4 });
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ opacity: 0 }}
      className="relative w-full h-full overflow-y-auto no-scrollbar pb-24 flex flex-col items-center"
    >
      {/* ── Animated Background ── */}
      <div ref={bgRef} className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#04050d]" />
        {/* Star field */}
        <div ref={starsRef} className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 20% 20%, rgba(212,175,55,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(125,211,252,0.03) 0%, transparent 50%)'
        }}/>
        {/* Ambient orbs */}
        <div ref={orb1Ref} className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}/>
        <div ref={orb2Ref} className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(125,211,252,0.05) 0%, transparent 70%)', filter: 'blur(50px)' }}/>
        <div ref={orb3Ref} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(134,239,172,0.03) 0%, transparent 60%)', filter: 'blur(60px)' }}/>
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)',
          backgroundSize: '80px 80px'
        }}/>
      </div>

      {/* ── Floating particles (gold) ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="mc-particle absolute rounded-full"
            style={{
              width: `${Math.random() * 3 + 1.5}px`,
              height: `${Math.random() * 3 + 1.5}px`,
              background: i % 3 === 0 ? '#d4af37' : i % 3 === 1 ? '#7dd3fc' : '#86efac',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0
            }}
          />
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 w-full max-w-2xl px-5 pt-12 flex flex-col items-center gap-6">

        {/* ── Badge ── */}
        <div ref={badgeRef} className="flex items-center gap-2.5 px-5 py-2 rounded-full border"
          style={{ background: 'rgba(212,175,55,0.07)', borderColor: 'rgba(212,175,55,0.2)' }}>
          {/* Geometric Islamic star icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
              fill="#d4af37" opacity="0.9"/>
          </svg>
          <span className="text-[10px] font-black text-amber-400/80 tracking-[0.25em] uppercase font-arabic">
            رحلتك الإيمانية
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-pulse"/>
        </div>

        {/* ── Title ── */}
        <div ref={titleRef} className="text-center">
          <h1 className="text-[32px] md:text-[46px] font-black font-arabic leading-none tracking-tight"
            style={{
              background: 'linear-gradient(180deg, #ffffff 20%, #d4af37 60%, #a08020 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
              filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.3))'
            }}>
            اختر طريقة التلاوة
          </h1>
          {/* Underline ornament */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6))' }}/>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(212,175,55,0.5)">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
            </svg>
            <div className="h-px w-16" style={{ background: 'linear-gradient(90deg, rgba(212,175,55,0.6), transparent)' }}/>
          </div>
        </div>

        {/* ── Subtitle ── */}
        <p ref={subtitleRef} className="text-center font-arabic text-sm font-bold leading-loose max-w-sm"
          style={{ color: 'rgba(255,255,255,0.38)' }}>
          صمّمنا لك ثلاثة أوضاع متكاملة لرحلتك مع القرآن الكريم
        </p>

        {/* ── Cards ── */}
        <div className="w-full flex flex-col gap-4 mt-2">
          {MODES.map((mode, i) => (
            <Link
              key={mode.href}
              href={mode.href}
              ref={(el) => { if (el) cardsRef.current[i] = el as any; }}
              onMouseEnter={() => handleCardHover(i, true)}
              onMouseLeave={() => handleCardHover(i, false)}
              className="block relative rounded-3xl overflow-hidden"
              style={{
                background: mode.gradient,
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                opacity: 0
              }}
            >
              {/* Glow overlay (shown on hover) */}
              <div className="mc-glow absolute inset-0 pointer-events-none rounded-3xl" style={{
                background: `radial-gradient(ellipse at 30% 50%, ${mode.dimGlow} 0%, transparent 70%)`,
                opacity: 0
              }}/>

              {/* Top highlight line */}
              <div className="absolute top-0 left-8 right-8 h-px" style={{
                background: `linear-gradient(90deg, transparent, ${mode.color}40, transparent)`
              }}/>

              <div className="relative flex items-center gap-4 p-4 md:p-5">
                {/* Number */}
                <div className="mc-num absolute top-3 right-4 text-[10px] font-black font-mono"
                  style={{ color: 'rgba(255,255,255,0.1)', letterSpacing: '0.1em' }}>
                  {mode.num}
                </div>

                {/* Icon container */}
                <div className="mc-icon-container shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${mode.color}15, ${mode.color}05)`,
                    border: `1px solid ${mode.color}25`
                  }}>
                  {/* Corner dots */}
                  <div className="absolute top-2 right-2 w-1 h-1 rounded-full" style={{ background: mode.color, opacity: 0.4 }}/>
                  <div className="absolute bottom-2 left-2 w-1 h-1 rounded-full" style={{ background: mode.color, opacity: 0.4 }}/>
                  {/* SVG icon */}
                  <div className="w-full h-full p-2"><MushafIcon color={mode.color} /></div>
                </div>

                {/* Text content */}
                <div className="flex-1 text-right min-w-0 pt-1 md:pt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black font-arabic text-lg md:text-xl text-white leading-none">
                      {mode.title}
                    </h3>
                  </div>
                  <p className="text-[11px] md:text-xs font-arabic font-bold leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {mode.desc}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="mc-arrow shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: mode.color + '15', opacity: 0.4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={mode.color} strokeWidth="2.5" strokeLinecap="round">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 right-0 w-1/3 h-px" style={{
                background: `linear-gradient(90deg, transparent, ${mode.color}50)`
              }}/>
            </Link>
          ))}
        </div>

        {/* ── Footer Verse ── */}
        <div className="mt-4 text-center">
          <p className="font-arabic text-xs" style={{ color: 'rgba(212,175,55,0.3)', lineHeight: 2 }}>
            ﴿ إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ ﴾
          </p>
          <p className="text-[10px] font-arabic" style={{ color: 'rgba(255,255,255,0.15)' }}>
            الإسراء: ٩
          </p>
        </div>

      </div>
    </div>
  );
}
