"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowLeft, ArrowRight, BookOpen, Video, Trophy, Headphones,
  Sparkles, ShieldCheck, UserCheck, Users, HelpCircle, CheckCircle, Info,
  MapPin, Bell, Star, MessageCircle, Heart, Share2, Compass, AlertCircle, Timer
} from "lucide-react";
import { navigateInstantly } from "@/lib/navigation";

interface OnboardingOverlayProps {
  onClose: () => void;
}

type ManualTab = "mushaf" | "video" | "daily" | "library" | "prayers" | "chatbot" | "leaderboard" | "subscriptions";

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
    localStorage.setItem("has_seen_onboarding", "true");
    onClose();
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
      x: direction > 0 ? 30 : -30,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 30 : -30,
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

  // Detailed 9-tab manual content in premium Arabic
  const MANUAL_CONTENTS = {
    mushaf: {
      title: "المصحف والختمات",
      icon: BookOpen,
      color: "#b8860b", // Dark Goldenrod
      bgColor: "rgba(184,134,11,0.06)",
      desc: "تجربة قراءة وتدبر متكاملة ومريحة لكلام الله عز وجل مع ٣ أوضاع قراءة تناسب كافة الاحتياجات.",
      steps: [
        "افتح صفحة المصحف واقرأ بالوضع الأنسب لك: وضع (آية بآية) للتلاوة والاستماع الفردي، وضع (المصحف الكامل) لتصفح صفحات كالمصحف الورقي، أو وضع (مصحف التفسير) لعرض التفسير الجانبي والآيات معاً.",
        "اضغط على أي آية أثناء القراءة لتشغيل صوت القارئ المفضل لديك فوراً وتكرارها لتسهيل الحفظ والمراجعة.",
        "اضغط على زر الفهرس للذهاب السريع لأي سورة أو جزء، أو استخدم شريط البحث المطور للبحث عن أي كلمة في المصحف.",
        "اسحب شريط التفسير الجانبي (Tafseer Drawer) لعرض تفسير السعدي والميسر وأسباب النزول فورياً."
      ],
      features: [
        "التلوين التجويدي التلقائي للحروف: المد (أحمر)، الغنة (أخضر)، القلقلة (أزرق)، الإقلاب (بنفسجي).",
        "مزامنة سحابية تلقائية لموضع قراءتك الأخير وعلامات القراءة والختمات النشطة فور تسجيل حسابك."
      ],
      rules: "تجميع نقاط القراءة: (+5 نقاط) لكل صفحة كاملة تقرأها (بشرط بقائك 10 ثوانٍ) و (+0.2 نقطة) لكل آية تقرأها.",
      path: "/mushaf-choice",
      btnLabel: "ابدأ القراءة والتدبر 📖"
    },
    video: {
      title: "استوديو المونتاج",
      icon: Video,
      color: "#0284c7", // Sky blue
      bgColor: "rgba(2,132,199,0.06)",
      desc: "استوديو متطور ومجاني بالكامل لصناعة فيديوهات قرآنية احترافية لنشر كتاب الله على وسائل التواصل (TikTok, Instagram, YouTube).",
      steps: [
        "اختر السورة والآيات المراد تصميمها (تحديد رقم آية البداية والنهاية) من خلال قائمة اختيار الآيات السهلة.",
        "اختر صوت القارئ المفضل من بين أكثر من 50 قارئاً عذباً بجودة استوديو عالية.",
        "اختر قالب التصميم المناسب لنشرك (طولي للموبايل والريلز، أو عرضي للشاشات واليوتيوب).",
        "خصص النصوص: اختر بين ٦ خطوط عربية عثمانية وحديثة، و١٦ لوناً، وتعديل حجم وموضع النص والترجمات.",
        "اختر فلتراً سينمائياً (٢٤ فلتر) وتأثير تراكب (١٢ تأثير) وتأثيرات حركة النصوص (١٥+ أنيميشن).",
        "قم بتفعيل معزز الصوت (Audio Visualizer) والجسيمات المتحركة كالثلج وأوراق الشجر وبتلات الورد ثم اضغط تصدير الفيديو."
      ],
      features: [
        "تزامن تلقائي ودقيق للغاية بين كلمات الآية المسموعة والصوت المرتل.",
        "رندر سحابي فائق السرعة (Hyper Render) يعمل بلا مشاكل Chromium وخالٍ تماماً من تسريب الذاكرة.",
        "إمكانية إضافة حسابك الشخصي كعلامة مائية (@handle) لحفظ حقوق تصميمك للآخرين."
      ],
      rules: "الرندر مجاني للجميع. الخطة الافتراضية تتيح 5 فيديوهات، ويمكن زيادة الحد عبر المساهمة ودعم الموقع لتغطية تكاليف الرندر بمساهمة بسيطة.",
      path: "/video",
      btnLabel: "اصنع فيديو قرآني الآن 🎬"
    },
    daily: {
      title: "يوميات المسلم والذكر",
      icon: Compass,
      color: "#16a34a", // Emerald green
      bgColor: "rgba(22,163,74,0.06)",
      desc: "ركنك الروحاني للمحافظة على الأذكار اليومية والتسبيح والورد اليومي مع عدادات ذكية وبوصلة تفاعلية.",
      steps: [
        "تصفح أذكار الصباح والمساء والمسجد والنوم التفاعلية واضغط على الذكر لزيادة العداد تلقائياً مع اهتزاز تفاعلي خفيف للهاتف.",
        "استخدم السبحة الإلكترونية لزيادة رصيدك بمعدل +3 نقاط لكل 99 تسبيحة.",
        "تابع عداد الاستغفار والصلاة على النبي اليومي للوصول للهدف اليومي (1000 مرة لكل عداد).",
        "افتح قسم القبلة لتحديد اتجاه الكعبة المشرفة بدقة متناهية عبر البوصلة التفاعلية ثلاثية الأبعاد."
      ],
      features: [
        "حماية ضد النقرات السريعة جداً والعشوائية في السبحة لضمان الطمأنينة والتدبر أثناء الذكر والتسبيح.",
        "مكتبة أذكار كاملة مأخوذة من كتاب حصن المسلم مع إمكانية البحث السريع فيها."
      ],
      rules: "نقاط الذكر: تمنحك (+1 نقطة) لكل ذكر تقرأه في أذكار الصباح والمساء والنوم، و (+3 نقاط) مكافأة كل 99 تسبيحة.",
      path: "/daily",
      btnLabel: "افتح ورد الأذكار والسبحة 📿"
    },
    library: {
      title: "المكتبة الصوتية",
      icon: Headphones,
      color: "#d946ef", // Magenta
      bgColor: "rgba(217,70,239,0.06)",
      desc: "قاعدة بيانات صوتية ضخمة للاستماع إلى تلاوات القرآن الكريم بجودة عالية لأكثر من 50 قارئاً من كبار شيوخ العالم الإسلامي.",
      steps: [
        "ابحث عن القارئ المفضل لديك (مثل ماهر المعيقلي، عبد الباسط، المنشاوي) واضغط لتصفح السور المرتلة بصوته.",
        "استمع للتلاوات المباشرة، واستخدم شريط التحكم بالصوت والتشغيل العشوائي أو التكرار المستمر.",
        "أضف القراء والسور إلى قائمتك المفضلة لتصل إليها بنقرة واحدة لاحقاً.",
        "شغل الصوت بالخلفية وتحكم به من شاشة القفل بفضل ربط التطبيق بـ MediaSession API."
      ],
      features: [
        "مخطط معزز الصوت (Audio Visualizer) لتجربة بصرية هادئة تفاعلية مع التلاوة.",
        "تخزين تلقائي لآخر 5 سور قمت بالاستماع إليها للرجوع الفوري إليها."
      ],
      rules: "نقاط الاستماع: تجميع نقاط تلقائي بمعدل (+1 نقطة) لكل 30 ثانية استماع، و (+10 نقاط) كمكافأة ختم الاستماع لسورة كاملة.",
      path: "/library",
      btnLabel: "تصفح المكتبة الصوتية 🎧"
    },
    prayers: {
      title: "مواقيت الصلاة والأذان",
      icon: Timer,
      color: "#8b5cf6", // Purple
      bgColor: "rgba(139,92,246,0.06)",
      desc: "حساب أوقات الصلاة الخمس بدقة متناهية مع نظام إشعارات الأذان التلقائي أوفلاين وتحديد اتجاه القبلة.",
      steps: [
        "اسمح للتطبيق بالوصول لموقعك الجغرافي (GPS) لحساب مواقيت الصلاة تلقائياً بدقة لمدينتك، أو حدد دولتك ومدينتك يدوياً.",
        "فعل إشعارات الأذان واختر المؤذن المفضل لديك (الحرم المكي، الشيخ رفعت، أو الشيخ سيد النقشبندي).",
        "تصفح التقويم السنوي والشهري لمعرفة مواعيد الصلوات للأيام القادمة.",
        "اتبع إرشادات تحسين البطارية لضمان إطلاق الأذان في وقته الدقيق بدون أي تأخير من نظام الهاتف."
      ],
      features: [
        "يعمل نظام الأذان بالخلفية وبدون إنترنت بالكامل (Offline native notification scheduling).",
        "بوصلة القبلة التفاعلية لتحديد اتجاه الكعبة بدقة بالاعتماد على الحساسات الداخلية للجهاز."
      ],
      rules: "مواقيت دقيقة محدثة محلياً، مع تنبيهات صوتية كاملة لكل صلاة من الصلوات الخمس.",
      path: "/prayers",
      btnLabel: "اضبط مواقيت الصلاة والأذان 🕋"
    },
    chatbot: {
      title: "المساعد الذكي يقين",
      icon: Sparkles,
      color: "#e11d48", // Rose red
      bgColor: "rgba(225,29,72,0.06)",
      desc: "مساعدك الشخصي المبتكر المدعوم بالذكاء الاصطناعي للإجابة على الأسئلة الدينية وتوليد الخطط والاختبارات.",
      steps: [
        "اضغط واسحب الزر العائم للمساعد الذكي في أسفل الشاشة لفتح نافذة المحادثة المباشرة.",
        "اكتب أسئلتك في التفسير، السير، الفقه، أو اسأله عن صفحات وميزات التطبيق ليرشدك فورياً.",
        "اطلب منه توليد خطة حفظ قرآنية مخصصة (مثال: 'اعملي خطة لحفظ جزء عم في أسبوع').",
        "اطلب منه بدء مسابقة إيمانية (اكتب: 'ابدأ مسابقة' أو 'سؤال ديني') لتحدي معلوماتك وكسب نقاط للإجابة الصحيحة."
      ],
      features: [
        "يعمل بموديلات متطورة (Gemini 2.0 و GPT-4o-mini) مع موديل تعلم آلة (ML) محلي فائق السرعة لحالات انقطاع الشبكة.",
        "يتعرف على هويتك وإحصائياتك ونقاطك ويدعم تغيير بيانات ملفك الشخصي بالدردشة تلقائياً."
      ],
      rules: "الإجابة الصحيحة في المسابقة الدينية تمنحك (+15 نقطة) مكافأة فورية تضاف لرصيدك.",
      path: "/",
      btnLabel: "تحدث مع المساعد الذكي 💬"
    },
    leaderboard: {
      title: "النقاط لوحة الشرف",
      icon: Trophy,
      color: "#ca8a04", // Yellow/Gold
      bgColor: "rgba(202,138,4,0.06)",
      desc: "نظام تحفيزي تنافسي بالنقاط والأوسمة لتشجيعك على المواظبة ومنافسة الأصدقاء في الطاعات ومشاركتها.",
      steps: [
        "اجمع النقاط تلقائياً من خلال القيام بالعبادات والمهام اليومية مثل القراءة، الاستماع، الأذكار، التسبيح، والمسابقات.",
        "افتح لوحة الشرف لتشاهد ترتيبك العالمي والمحلي بين جميع المستخدمين وتنافس الأصدقاء.",
        "ابحث عن أي مستخدم لمشاهدة إحصائياته ومستواه ونقاطه.",
        "افتح التحديات اليومية (Quests) وأكمل المهام المطلوبة لكسب كمية هائلة من النقاط الإضافية."
      ],
      features: [
        "ترتيب مقسم لأربع فئات منفصلة (القرآن، الأذكار، الاستماع، الاستغفار) لضمان عدالة المنافسة.",
        "أوسمة وإنجازات تفتح تلقائياً عند تحقيق أهداف معينة (مثل قراءة 7 أيام متتالية)."
      ],
      rules: "نظام حماية ذكي ضد التكرار العشوائي والسبام للحفاظ على مصداقية المنافسة وقوة لوحة المتصدرين.",
      path: "/rank",
      btnLabel: "شاهد لوحة الشرف والترتيب 🏆"
    },

    subscriptions: {
      title: "التبرع ودعم الموقع",
      icon: ShieldCheck,
      color: "#ea580c", // Orange
      bgColor: "rgba(234,88,12,0.06)",
      desc: "مساهمة اختيارية لدعم استمرارية التطبيق وتغطية تكاليف السيرفرات السحابية والرندر.",
      steps: [
        "اختر مستوى الدعم المناسب لك: (بدون تبرع) يمنحك ٥ رندرز سحابي، (دعم أساسي) يمنحك ٥٠ رندرز، (دعم مميز) يمنحك رندرز غير محدود.",
        "اختر طريقة تحويل التبرع، واملأ التفاصيل من خلال فودافون كاش أو إنستاباي بسهولة.",
        "أرسل طلب التأكيد لمراجعة التحويل وتنشيط الميزات تقديراً لمساهمتك النبيلة."
      ],
      features: [
        "فتح الميزات الذهبية تلقائياً ومجاناً مدى الحياة فور وصول نقاطك إلى 10,000 نقطة تقديراً لمواظبتك وطاعتك دون الحاجة لأي تبرع مالي!"
      ],
      rules: "المساهمة هي تبرع لدعم الموقع وليست اشتراكاً تجارياً. تفتح الميزات المميزة فور تأكيد التبرع لدعم الاستمرارية وتغطية التكاليف.",
      path: "/rank",
      btnLabel: "مساهمة ودعم الموقع 💳"
    }
  };

  return (
    <div className="fixed inset-0 z-[10005] bg-black/40 backdrop-blur-md flex items-center justify-center font-arabic p-3 md:p-6" dir="rtl">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.04),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.04),transparent_50%)]">
        <div className="absolute inset-0 islamic-pattern opacity-[0.02] scale-110" />
      </div>

      {/* Main Container - PREMIUM LIGHT THEME (ويت مود) */}
      <div className="relative w-full max-w-4xl bg-white border border-zinc-200 rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col">
        {/* Top gold bar */}
        <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 z-10 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#b8860b] uppercase tracking-[0.2em] bg-[#d4af37]/10 px-3 py-1 rounded-full">
              دليل منصة يقين الشامل v22
            </span>
          </div>

          <button
            onClick={handleFinish}
            className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200 transition-all active:scale-95 cursor-pointer"
            title="إغلاق الدليل"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Content Area */}
        <div className="flex-1 p-5 md:p-8 overflow-y-auto no-scrollbar max-h-[65vh] min-h-[50vh] relative bg-white">
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
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ willChange: "transform, opacity" }}
                className="flex flex-col items-center text-center gap-5 py-4"
              >
                <div className="relative w-18 h-18 bg-gradient-to-br from-[#d4af37]/10 to-transparent p-4 rounded-2xl border border-[#d4af37]/25 shadow-md flex items-center justify-center">
                  <Sparkles className="w-9 h-9 text-[#b8860b] animate-pulse" />
                  <div className="absolute inset-0 rounded-2xl border border-zinc-200 animate-ping opacity-25" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl md:text-3xl font-black text-zinc-950 leading-tight">مرحباً بك في يَقِين 📖</h2>
                  <p className="text-[#b8860b] text-[10px] font-black uppercase tracking-[0.25em] font-mono">تطبيق المصحف الإلكتروني واستوديو المونتاج القرآني</p>
                </div>

                <p className="text-zinc-600 text-sm leading-loose max-w-xl font-bold">
                  منصة إسلامية متكاملة لخدمة كتاب الله وتسهيل الطاعات. تصفح المصحف بالرسم العثماني الملون، أنشئ فيديوهات قرآنية لصفحاتك مجاناً وبأعلى جودة، تابع أذكارك وتسابيحك اليومية، واكسب النقاط لتنافس الأصدقاء في لوحة الشرف الإيمانية.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-2xl mt-4">
                  <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex flex-col items-center text-center">
                    <span className="text-base font-black text-[#b8860b]">٣ أوضاع للمصحف</span>
                    <span className="text-[10px] text-zinc-400 mt-1 font-bold">قراءة وتفسير واستماع وتجويد ملون</span>
                  </div>
                  <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex flex-col items-center text-center">
                    <span className="text-base font-black text-sky-600">رندر سحابي مجاني</span>
                    <span className="text-[10px] text-zinc-400 mt-1 font-bold">تصميم فيديوهات لصفحاتك بدون علامات</span>
                  </div>
                  <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex flex-col items-center text-center">
                    <span className="text-base font-black text-emerald-600">أذكار وتنبيهات ذكية</span>
                    <span className="text-[10px] text-zinc-400 mt-1 font-bold">أذان تلقائي بدون نت وعدادات تدبر</span>
                  </div>
                </div>
              </motion.div>
            )}

            {currentSlide === 1 && (
              <motion.div
                key="slide1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ willChange: "transform, opacity" }}
                className="flex flex-col md:flex-row gap-6 h-full text-right"
              >
                {/* Vertical Tabs Sidebar - Grid style on mobile, Sidebar on desktop */}
                <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible shrink-0 pb-2 md:pb-0 md:w-52 border-b md:border-b-0 md:border-l border-zinc-100 no-scrollbar">
                  {(Object.keys(MANUAL_CONTENTS) as ManualTab[]).map((tabKey) => {
                    const item = MANUAL_CONTENTS[tabKey];
                    const isActive = activeManualTab === tabKey;
                    return (
                      <button
                        key={tabKey}
                        onClick={() => setActiveManualTab(tabKey)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl transition-all font-black text-xs text-right whitespace-nowrap md:w-full select-none cursor-pointer ${
                          isActive 
                            ? "text-white shadow-md shadow-black/5" 
                            : "bg-zinc-50 border border-zinc-100 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
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
                      <div key={activeManualTab} className="space-y-4 animate-in fade-in duration-300">
                        {/* Header Details */}
                        <div className="flex items-center gap-3 justify-start">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                            style={{ backgroundColor: item.bgColor, borderColor: `${item.color}30`, color: item.color }}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-zinc-950 text-base font-black">{item.title}</h4>
                            <p className="text-[10px] uppercase font-mono font-black" style={{ color: item.color }}>طريقة العمل والمميزات</p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-zinc-700 text-xs leading-relaxed font-bold">{item.desc}</p>

                        {/* Steps */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-zinc-400 block">طريقة الاستخدام بالتفصيل:</span>
                          <ol className="space-y-2 text-xs text-zinc-600 list-decimal pr-4 leading-relaxed font-bold">
                            {item.steps.map((step, idx) => (
                              <li key={idx} className="marker:text-[#b8860b]">{step}</li>
                            ))}
                          </ol>
                        </div>

                        {/* Features List */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-zinc-400 block">المميزات الحصرية:</span>
                          <ul className="space-y-1.5 text-xs text-zinc-600 list-disc pr-4 leading-relaxed font-bold">
                            {item.features.map((feature, idx) => (
                              <li key={idx} className="marker:text-primary">{feature}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Rules and Points Box */}
                        {item.rules && (
                          <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-[#b8860b] shrink-0 mt-0.5" />
                            <div className="text-[11px] text-zinc-500 font-bold leading-normal">
                              <span className="font-black text-zinc-800">قواعد ونقاط: </span>
                              {item.rules}
                            </div>
                          </div>
                        )}

                        {/* CTA button */}
                        <div className="pt-2">
                          <button
                            onClick={() => handleFeatureClick(item.path)}
                            className="px-5 py-2.5 rounded-xl text-white font-black text-xs transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
                            style={{ background: `linear-gradient(135deg, ${item.color}, #333333)` }}
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
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{ willChange: "transform, opacity" }}
                className="space-y-5"
              >
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-black text-zinc-950">انضم لعائلة يقين الآن 🏆</h3>
                  <p className="text-zinc-400 text-xs mt-1 font-bold">اختر نوع التسجيل لحفظ بياناتك ونقاطك</p>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-1 text-right">
                  
                  {/* Direct Card */}
                  <div className="p-5 bg-blue-500/[0.01] border border-blue-500/15 rounded-3xl flex flex-col justify-between gap-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 justify-start">
                        <span className="p-1 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/10">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                        <h4 className="text-zinc-900 text-xs font-black">تسجيل مباشر (مستحسن)</h4>
                      </div>
                      <p className="text-zinc-500 text-[11px] leading-relaxed font-bold">
                        يتطلب تفعيل الكود OTP عبر بريدك الإلكتروني. يحافظ على أمان حسابك الكامل وحصيلة نقاطك وتحدياتك اليومية في لوحة المتصدرين مع إمكانية استعادة كلمة المرور في أي وقت.
                      </p>
                    </div>
                    <button
                      onClick={() => triggerAuth("signupInfo", "direct")}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[11px] rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      حساب مباشر وآمن 🔐
                    </button>
                  </div>

                  {/* Indirect Card */}
                  <div className="p-5 bg-amber-500/[0.01] border border-amber-500/15 rounded-3xl flex flex-col justify-between gap-4 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 justify-start">
                        <span className="p-1 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/10">
                          <UserCheck className="w-4.5 h-4.5" />
                        </span>
                        <h4 className="text-zinc-900 text-xs font-black">تسجيل غير مباشر فوري</h4>
                      </div>
                      <p className="text-zinc-500 text-[11px] leading-relaxed font-bold">
                        إنشاء حساب فوري بدون تفعيل البريد. يمكنك من التفاعل في مجتمع يقين ونشر الفيديوهات فوراً. تنبيه: لا يمكن استرجاع هذا الحساب مطلقاً إذا فقدت كلمة المرور.
                      </p>
                    </div>
                    <button
                      onClick={() => triggerAuth("signupInfo", "indirect")}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-[#d4af37] text-white font-black text-[11px] rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      حساب سريع غير مباشر 👤
                    </button>
                  </div>

                </div>

                {/* Footer Controls for Auth Slide */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-100">
                  <button
                    onClick={() => triggerAuth("login")}
                    className="text-xs text-zinc-500 hover:text-zinc-900 font-bold transition-all cursor-pointer"
                  >
                    لديك حساب بالفعل؟ <span className="text-[#b8860b] font-black">تسجيل الدخول</span>
                  </button>

                  <button
                    onClick={handleSkipAuth}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-black transition-all border border-zinc-200 active:scale-95 cursor-pointer"
                  >
                    تخطي والتصفح كزائر 🌍
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer & Navigation Controls */}
        <div className="p-5 border-t border-zinc-100 flex items-center justify-between z-10 bg-zinc-50/50">
          {/* Progress dots */}
          <div className="flex gap-2">
            {[...Array(totalSlides)].map((_, i) => (
              <button
                key={i}
                onClick={() => changeSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentSlide === i ? "w-5 bg-[#b8860b]" : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
                }`}
              />
            ))}
          </div>

          {/* Nav Buttons */}
          <div className="flex gap-2">
            {currentSlide > 0 && (
              <button
                onClick={() => changeSlide(currentSlide - 1)}
                className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>السابق</span>
              </button>
            )}

            {currentSlide < totalSlides - 1 ? (
              <button
                onClick={() => changeSlide(currentSlide + 1)}
                className="px-4 py-2 rounded-xl bg-[#b8860b] hover:brightness-110 text-white transition-all flex items-center gap-1.5 text-xs font-black active:scale-95 shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                <span>التالي</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-white font-black text-xs transition-all flex items-center gap-1.5 active:scale-95 shadow-lg shadow-emerald-500/10 cursor-pointer"
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
