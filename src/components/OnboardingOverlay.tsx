"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowLeft, ArrowRight, BookOpen, Video, Trophy, Headphones,
  Sparkles, ShieldCheck, UserCheck, Users, HelpCircle, CheckCircle, Info,
  MapPin, Bell, Star, MessageCircle, Heart, Share2, Compass, AlertCircle
} from "lucide-react";
import { navigateInstantly } from "@/lib/navigation";

interface OnboardingOverlayProps {
  onClose: () => void;
}

type ManualTab = "mushaf" | "video" | "daily" | "prayers" | "leaderboard";

export function OnboardingOverlay({ onClose }: OnboardingOverlayProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeManualTab, setActiveManualTab] = useState<ManualTab>("mushaf");

  const totalSlides = 3;

  const handleFinish = () => {
    localStorage.setItem("has_seen_onboarding", "true");
    onClose();
  };

  const handleSkipAuth = () => {
    localStorage.setItem("auth_skipped", "true");
    window.dispatchEvent(new CustomEvent("show_auth_gate", { detail: { view: "login" } }));
    window.location.reload();
  };

  const triggerAuth = (view: "signupInfo" | "login", registrationType?: "direct" | "indirect") => {
    localStorage.setItem("has_seen_onboarding", "true");
    onClose();
    const event = new CustomEvent("show_auth_gate", {
      detail: { view, registrationType }
    });
    window.dispatchEvent(event);
  };

  const handleFeatureClick = (path: string) => {
    localStorage.setItem("has_seen_onboarding", "true");
    localStorage.setItem("auth_skipped", "true");
    onClose();
    navigateInstantly(path);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const [direction, setDirection] = useState(0);

  const changeSlide = (newSlide: number) => {
    if (newSlide >= 0 && newSlide < totalSlides) {
      setDirection(newSlide > currentSlide ? 1 : -1);
      setCurrentSlide(newSlide);
    }
  };

  // Detailed manual content
  const MANUAL_CONTENTS = {
    mushaf: {
      title: "المصحف الإلكتروني الشامل",
      icon: BookOpen,
      color: "#d4af37",
      bgColor: "rgba(212,175,55,0.08)",
      desc: "يوفر التطبيق تجربة فريدة لقراءة وتدبر آيات الذكر الحكيم عبر ثلاثة أوضاع مختلفة تناسب كافة الاحتياجات.",
      steps: [
        "اختر الوضع المفضل: وضع (آية بآية) للتلاوة والاستماع الفردي، وضع (المصحف الرقمي) لتصفح صفحات كالمصحف الورقي، أو وضع (مصحف التفسير) لعرض التفسير والآيات معاً.",
        "اضغط على أي آية أثناء القراءة لتشغيل صوت القارئ المفضل لديك فوراً.",
        "استعرض التفسير الميسر (تفسير السعدي) والترجمة والبحث الفوري عن أي كلمة أو آية.",
        "اضبط الختمة وحدد أهدافك اليومية ليقوم التطبيق بتتبع تقدمك تلقائياً وحفظ صفحتك الأخيرة."
      ],
      features: [
        "تكرار الآيات لسهولة حفظ ومراجعة القرآن الكريم.",
        "تغيير سريع بين القراء أثناء القراءة دون توقف.",
        "مزامنة كاملة لعلامات القراءة والختمات عبر السحاب عند التسجيل."
      ],
      path: "/mushaf-choice",
      btnLabel: "ابدأ القراءة والتدبر 📖"
    },
    video: {
      title: "استوديو صناعة فيديوهات القرآن",
      icon: Video,
      color: "#0284c7",
      bgColor: "rgba(2,132,199,0.08)",
      desc: "استوديو مونتاج متكامل ومجاني لصناعة فيديوهات قرآنية مذهلة لوسائل التواصل الاجتماعي (TikTok, Instagram, YouTube).",
      steps: [
        "حدد السورة المراد تصميمها ونطاق الآيات (رقم البداية والنهاية).",
        "اختر صوت القارئ من بين أكثر من 50 صوتاً عذباً في المكتبة المدمجة.",
        "اختر قالب التصميم (طولي للموبايل والريلز، أو عرضي للشاشات واليوتيوب).",
        "قم بتخصيص الألوان، التدرجات اللونية، الخطوط، الخلفيات المتحركة، ودرجة تعتيم النص ليتوافق مع ذوقك.",
        "اضغط على زر (تصدير الفيديو) ليقوم خادم الرندر بمعالجة الفيديو وتحميله بجودة عالية وبدون علامة مائية."
      ],
      features: [
        "تزامن تلقائي دقيق للغاية بين كلمات الآية والصوت.",
        "تصدير مجاني وسريع جداً متاح للويب والجوال.",
        "تنوع كبير في أنماط الخطوط العربية العثمانية والحديثة."
      ],
      path: "/video",
      btnLabel: "ابدأ صناعة فيديو قرآني 🎬"
    },
    daily: {
      title: "يوميات المسلم (الأذكار والسبحة)",
      icon: Trophy,
      color: "#16a34a",
      bgColor: "rgba(22,163,74,0.08)",
      desc: "مساحة مخصصة للعبادات اليومية والمحافظة على وردك اليومي من الأذكار والتسبيح.",
      steps: [
        "افتح قسم (يومياتي) لتجد قائمة بأذكار الصباح والمساء والمسجد والنوم.",
        "اضغط على كل ذكر لزيادة العداد تلقائياً مع اهتزاز بسيط للجهاز (في الجوال) ليشبه السبحة الحقيقية.",
        "استخدم (السبحة الإلكترونية الذكية) التي تم تصميمها بخوارزمية تمنع النقرات السريعة جداً والعشوائية لحثك على الطمأنينة والتدبر أثناء التسبيح."
      ],
      features: [
        "نقاط مكافأة يومية تضاف لرصيدك عند إكمال الأذكار والورد اليومي.",
        "أذكار مقسمة لسهولة القراءة بلمسات بسيطة وتأثيرات بصرية مريحة للعين."
      ],
      path: "/daily",
      btnLabel: "ابدأ وردك اليومي الآن ☀️"
    },
    prayers: {
      title: "مواقيت الصلاة والأذان التلقائي",
      icon: Headphones,
      color: "#8b5cf6",
      bgColor: "rgba(139,92,246,0.08)",
      desc: "حساب دقيق لمواقيت الصلاة الخمس مع تنبيهات أذان كاملة وتحديد القبلة والمكتبة الصوتية.",
      steps: [
        "فعل إذن الموقع (GPS) ليقوم التطبيق بحساب أوقات الصلاة تلقائياً بدقة لمدينتك، أو اختر دولتك ومدينتك يدوياً.",
        "اضغط على زر (الأذان) لتفعيل تنبيهات الأذان التلقائية واختيار المؤذن المفضل (الحرم المكي، الأقصى، إلخ).",
        "استخدم بوصلة اتجاه القبلة المدمجة لتحديد الكعبة المشرفة بدقة أينما كنت.",
        "تصفح المكتبة الصوتية الشاملة للاستماع لجميع القراء وتحميل السور للتشغيل دون الحاجة لإنترنت."
      ],
      features: [
        "دعم تشغيل الأذان كاملاً بالخلفية على الهواتف الذكية بشكل تلقائي.",
        "توجيهات مدمجة لتجاوز وضع حفظ البطارية لضمان عدم تأخر الأذان ثانية واحدة."
      ],
      path: "/prayers",
      btnLabel: "اضبط مواقيت الصلاة والأذان 🔊"
    },
    leaderboard: {
      title: "نظام النقاط ولوحة المتصدرين",
      icon: Users,
      color: "#ec4899",
      bgColor: "rgba(236,72,153,0.08)",
      desc: "نظام تحفيزي تنافسي يشجعك على الاستمرار والمواظبة على طاعة الله ومشاركة الخير مع المجتمع.",
      steps: [
        "اكسب النقاط تلقائياً عند القيام بالعبادات: (قراءة آية = 0.1 نقطة)، (الاستماع دقيقة = 1 نقطة)، (تسبيح = 0.01 نقطة)، (قراءة ذكر كامل = 5 نقاط).",
        "تابع ترتيبك اليومي والأسبوعي في (لوحة الصدارة) لتنافس أصدقائك ومستخدمي التطبيق في الطاعات.",
        "تفاعل في (مجتمع يقين) لنشر الخواطر القرآنية والتدبرات مع الأعضاء، ومشاركة منشوراتك لتلقي الإعجابات."
      ],
      features: [
        "أوسمة وإنجازات تفتح تلقائياً عند تحقيق أهداف معينة (مثل قراءة 7 أيام متتالية).",
        "دردشة وتواصل مباشر مع الأصدقاء لمشاركة الحث على الخيرات والختمات المشتركة."
      ],
      path: "/rank",
      btnLabel: "شاهد لوحة الشرف 🏆"
    }
  };

  return (
    <div className="fixed inset-0 z-[10005] bg-black/85 backdrop-blur-xl flex items-center justify-center font-arabic p-3 md:p-6">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-96 h-96 rounded-full bg-[#d4af37]/5 blur-[80px]" />
        <div className="absolute bottom-10 left-10 w-[30rem] h-[30rem] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute inset-0 islamic-pattern opacity-[0.02] scale-110" />
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-3xl bg-zinc-950/80 border border-white/10 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col backdrop-blur-2xl">
        {/* Top gold bar */}
        <div className="absolute top-0 left-10 right-10 h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 z-10 bg-black/20">
          <button
            onClick={handleFinish}
            className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            title="إغلاق الدليل"
          >
            <X className="w-4.5 h-4.5" />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#d4af37] uppercase tracking-[0.2em] bg-[#d4af37]/10 px-3 py-1 rounded-full">
              دليل منصة يقين الشامل v22
            </span>
          </div>
        </div>

        {/* Slide Content Area */}
        <div className="flex-1 p-5 md:p-8 overflow-y-auto no-scrollbar max-h-[70vh] min-h-[50vh] relative">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            
            {/* Slide 1: Welcome & Concept */}
            {currentSlide === 0 && (
              <motion.div
                key="slide0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex flex-col items-center text-center gap-5 py-4"
              >
                <div className="relative w-18 h-18 bg-gradient-to-br from-[#d4af37]/20 to-transparent p-4 rounded-2xl border border-[#d4af37]/30 shadow-2xl flex items-center justify-center">
                  <Sparkles className="w-9 h-9 text-[#d4af37] animate-pulse" />
                  <div className="absolute inset-0 rounded-2xl border border-white/10 animate-ping opacity-25" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">مرحباً بك في يَقِين 📖</h2>
                  <p className="text-[#d4af37] text-[10px] font-black uppercase tracking-[0.25em] font-mono">تطبيق المصحف الإلكتروني واستوديو المونتاج القرآني</p>
                </div>

                <p className="text-white/70 text-sm leading-loose max-w-lg font-bold">
                  منصة إسلامية متكاملة لخدمة كتاب الله وتسهيل الطاعات. تصفح المصحف، أنشئ فيديوهات قرآنية لصفحاتك مجاناً، تابع أذكارك، واكسب النقاط لتنافس الأصدقاء في لوحة الشرف الإيمانية.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mt-3">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center">
                    <span className="text-base font-black text-[#d4af37]">٣ أوضاع للمصحف</span>
                    <span className="text-[9px] text-white/35 mt-1 font-bold">قراءة وتفسير واستماع</span>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center">
                    <span className="text-base font-black text-sky-400">رندر سحابي مجاني</span>
                    <span className="text-[9px] text-white/35 mt-1 font-bold">تصميم فيديوهات بجودة عالية</span>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center">
                    <span className="text-base font-black text-emerald-400">أذكار وتنبيهات ذكية</span>
                    <span className="text-[9px] text-white/35 mt-1 font-bold">تنبيه بالصلاة وأوراد يومية</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Slide 2: Interactive Feature Tour (Detailed User Manual) */}
            {currentSlide === 1 && (
              <motion.div
                key="slide1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="flex flex-col md:flex-row gap-5 h-full"
              >
                {/* Vertical Tabs Sidebar */}
                <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0 pb-2 md:pb-0 md:w-48 border-b md:border-b-0 md:border-l border-white/5 no-scrollbar">
                  {(Object.keys(MANUAL_CONTENTS) as ManualTab[]).map((tabKey) => {
                    const item = MANUAL_CONTENTS[tabKey];
                    const isActive = activeManualTab === tabKey;
                    return (
                      <button
                        key={tabKey}
                        onClick={() => setActiveManualTab(tabKey)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl transition-all font-black text-xs text-right whitespace-nowrap md:w-full select-none ${
                          isActive 
                            ? "text-black" 
                            : "bg-white/[0.02] border border-white/5 text-white/60 hover:text-white hover:bg-white/[0.04]"
                        }`}
                        style={isActive ? { background: item.color } : {}}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span>{item.title}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content Panel */}
                <div className="flex-1 text-right space-y-4">
                  {(() => {
                    const item = MANUAL_CONTENTS[activeManualTab];
                    return (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Header Details */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                            style={{ backgroundColor: item.bgColor, borderColor: `${item.color}30`, color: item.color }}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-white text-base font-black">{item.title}</h4>
                            <p className="text-[10px] uppercase font-mono font-black" style={{ color: item.color }}>ميزات طريقة العمل</p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-white/70 text-xs leading-relaxed font-bold">{item.desc}</p>

                        {/* Steps */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-white/40 block">خطوات وطريقة الاستخدام:</span>
                          <ol className="space-y-1.5 text-xs text-white/80 list-decimal pr-4 leading-relaxed font-bold">
                            {item.steps.map((step, idx) => (
                              <li key={idx} className="marker:text-primary">{step}</li>
                            ))}
                          </ol>
                        </div>

                        {/* Features List */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-white/40 block">مميزات حصرية:</span>
                          <ul className="space-y-1.5 text-xs text-white/80 list-disc pr-4 leading-relaxed font-bold">
                            {item.features.map((feature, idx) => (
                              <li key={idx} className="marker:text-primary">{feature}</li>
                            ))}
                          </ul>
                        </div>

                        {/* CTA button */}
                        <div className="pt-2">
                          <button
                            onClick={() => handleFeatureClick(item.path)}
                            className="px-5 py-2.5 rounded-xl text-black font-black text-xs transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
                            style={{ background: `linear-gradient(135deg, ${item.color}, #ffffff)` }}
                          >
                            <span>{item.btnLabel}</span>
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}

            {/* Slide 3: Registration Guide & CTAs */}
            {currentSlide === 2 && (
              <motion.div
                key="slide2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-5"
              >
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-black text-white">انضم لعائلة يقين الآن 🏆</h3>
                  <p className="text-white/40 text-xs mt-1 font-bold">اختر نوع التسجيل لحفظ بياناتك ونقاطك</p>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                  
                  {/* Direct Card */}
                  <div className="p-4 bg-blue-500/[0.02] border border-blue-500/20 rounded-3xl flex flex-col justify-between text-right gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/15">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                        <h4 className="text-white text-xs font-black">تسجيل مباشر (مستحسن)</h4>
                      </div>
                      <p className="text-white/50 text-[10px] md:text-[11px] leading-relaxed font-bold">
                        يتطلب كود تفعيل OTP عبر بريدك. يحافظ على أمان حسابك وحصيلة نقاطك وتحدياتك في لوحة المتصدرين مع إمكانية استعادة كلمة المرور في أي وقت.
                      </p>
                    </div>
                    <button
                      onClick={() => triggerAuth("signupInfo", "direct")}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] rounded-xl transition-all shadow-lg shadow-blue-500/10 active:scale-95 animate-pulse"
                    >
                      حساب مباشر وآمن 🔐
                    </button>
                  </div>

                  {/* Indirect Card */}
                  <div className="p-4 bg-[#d4af37]/[0.02] border border-[#d4af37]/20 rounded-3xl flex flex-col justify-between text-right gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/15">
                          <UserCheck className="w-4.5 h-4.5" />
                        </span>
                        <h4 className="text-white text-xs font-black">تسجيل غير مباشر فوري</h4>
                      </div>
                      <p className="text-white/50 text-[10px] md:text-[11px] leading-relaxed font-bold">
                        إنشاء حساب فوري بدون انتظار تفعيل البريد. يمكنك من التفاعل بالمجتمع فوراً. تنبيه: لا يمكن استرجاع هذا الحساب إذا فقدت كلمة المرور.
                      </p>
                    </div>
                    <button
                      onClick={() => triggerAuth("signupInfo", "indirect")}
                      className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] to-amber-500 text-black font-black text-[11px] rounded-xl transition-all shadow-lg shadow-[#d4af37]/10 active:scale-95"
                    >
                      حساب سريع غير مباشر 👤
                    </button>
                  </div>

                </div>

                {/* Footer Controls for Auth Slide */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/5">
                  <button
                    onClick={() => triggerAuth("login")}
                    className="text-xs text-white/50 hover:text-white font-bold transition-all"
                  >
                    لديك حساب بالفعل؟ <span className="text-[#d4af37] font-black">تسجيل الدخول</span>
                  </button>

                  <button
                    onClick={handleSkipAuth}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-black transition-all border border-white/5 active:scale-95"
                  >
                    تخطي والتصفح كزائر 🌍
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer & Navigation Controls */}
        <div className="p-5 border-t border-white/5 flex items-center justify-between z-10 bg-black/40">
          {/* Progress dots */}
          <div className="flex gap-2">
            {[...Array(totalSlides)].map((_, i) => (
              <button
                key={i}
                onClick={() => changeSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentSlide === i ? "w-5 bg-[#d4af37]" : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* Nav Buttons */}
          <div className="flex gap-2">
            {currentSlide > 0 && (
              <button
                onClick={() => changeSlide(currentSlide - 1)}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>
            )}

            {currentSlide < totalSlides - 1 ? (
              <button
                onClick={() => changeSlide(currentSlide + 1)}
                className="px-4 py-2 rounded-xl bg-[#d4af37] hover:brightness-110 text-black transition-all flex items-center gap-1.5 text-xs font-black active:scale-95 shadow-lg shadow-[#d4af37]/15"
              >
                <span>التالي</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-black text-xs transition-all flex items-center gap-1.5 active:scale-95 shadow-lg shadow-emerald-500/10"
              >
                <span>إنهاء واستكشاف</span>
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
