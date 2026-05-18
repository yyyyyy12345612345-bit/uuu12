"use client";

import React from "react";
import { 
  X, Star, BookOpen, Headphones, Calendar, 
  Fingerprint, Target, Trophy, 
  Map as MapIcon, ChevronLeft, Award, Zap, Heart, Image
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PointsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PointsGuideModal({ isOpen, onClose }: PointsGuideModalProps) {
  const pointsMap = [
    {
      category: "قراءة القرآن",
      icon: BookOpen,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      items: [
        { label: "قراءة صفحة كاملة", points: "+5 نقاط", detail: "بشرط القراءة لمدة 10 ثوانٍ" },
        { label: "قراءة آية واحدة", points: "+0.2 نقطة", detail: "بشرط القراءة لمدة ثانيتين" }
      ]
    },
    {
      category: "الاستماع للقرآن",
      icon: Headphones,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      items: [
        { label: "الاستماع (كل 30 ثانية)", points: "+1 نقطة", detail: "مكافأة دورية مستمرة" },
        { label: "إكمال سورة كاملة", points: "+10 نقاط", detail: "مكافأة ختم السورة" }
      ]
    },
    {
      category: "الأذكار واليوميات",
      icon: Calendar,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      items: [
        { label: "قراءة ذكر (يومياتي)", points: "+1 نقطة", detail: "أذكار الصباح، المساء، والنوم" },
        { label: "قراءة ذكر (المكتبة)", points: "+0.5 نقطة", detail: "كنوز الأذكار النبوية" }
      ]
    },
    {
      category: "السبحة الإلكترونية",
      icon: Fingerprint,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      items: [
        { label: "كل 99 تسبيحة", points: "+3 نقاط", detail: "تشجيعاً على كثرة الذكر" }
      ]
    },
    {
      category: "التحديات (Quests)",
      icon: Target,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      items: [
        { label: "المهام اليومية", points: "نقاط متغيرة", detail: "تظهر في لوحة المتصدرين" }
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 md:p-8 font-arabic">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-[#064E3B] border border-primary/20 rounded-[3rem] shadow-[0_0_100px_rgba(212,175,55,0.15)] overflow-hidden flex flex-col h-[85vh] md:h-auto md:max-h-[90vh]"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 islamic-pattern opacity-[0.05] pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />

            {/* Header */}
            <div className="relative z-10 p-8 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <MapIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">دليل النقاط</h2>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">خارطة الطريق لجمع الحسنات والجوائز</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar p-6 md:p-10 space-y-8">
              {pointsMap.map((group, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-3 px-2">
                    <div className={`w-8 h-8 rounded-lg ${group.bg} ${group.color} flex items-center justify-center`}>
                      <group.icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-black text-white/90">{group.category}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {group.items.map((item, i) => (
                      <div 
                        key={i}
                        className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-white/10 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-black text-white group-hover:text-primary transition-colors">{item.label}</span>
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/20 text-primary rounded-full">
                            <Zap className="w-3 h-3 fill-current" />
                            <span className="text-[10px] font-black">{item.points}</span>
                          </div>
                        </div>
                        <p className="text-[10px] font-bold text-white/30 leading-relaxed">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Reward Tiers Info */}
              <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 mt-12 text-center relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                    <Award className="w-24 h-24 text-primary" />
                 </div>
                 <div className="relative z-10">
                    <Trophy className="w-8 h-8 text-primary mx-auto mb-4 animate-pulse" />
                    <h4 className="text-xl font-black text-white mb-2">لماذا نجمع النقاط؟</h4>
                    <p className="text-sm text-white/60 font-bold leading-relaxed max-w-md mx-auto">
                       النقاط هي وسيلة تحفيزية لتشجيعك على وردك اليومي. يتم استخدامها في ترتيب المتصدرين (Leaderboard) لإضفاء روح المنافسة الشريفة.
                    </p>
                 </div>
              </div>

              {/* Acknowledgments & Credits */}
              <div className="space-y-6 mt-12 border-t border-white/10 pt-12">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Heart className="w-4 h-4 text-primary fill-primary" />
                  </div>
                  <h3 className="text-lg font-black text-white/90">مصادر البيانات والشكر والتقدير</h3>
                </div>

                <p className="text-xs text-white/50 leading-relaxed font-bold px-2">
                  نود أن نتقدم بخالص الشكر والتقدير للخدمات والمنصات العالمية المفتوحة التي ساهمت في توفير مصادر البيانات الإسلامية والتقنية لتشغيل هذا التطبيق المبارك:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      title: "بوابة القرآن والتفسير (Quran.com)",
                      desc: "مصدر النص القرآني الموثق، مع التفاسير المتنوعة والترجمات لتسهيل الفهم والتدبر.",
                      icon: BookOpen,
                      color: "text-amber-500",
                      bg: "bg-amber-500/10"
                    },
                    {
                      title: "المكتبة الصوتية (EveryAyah)",
                      desc: "مصدر التلاوات الصوتية العطرة للآيات بأصوات مشاهير القراء بجودة عالية.",
                      icon: Headphones,
                      color: "text-blue-500",
                      bg: "bg-blue-500/10"
                    },
                    {
                      title: "أوقات الصلاة والقبلة (AlAdhan)",
                      desc: "الخدمة الذكية لحساب مواقيت الصلاة بدقة وتحديد اتجاه القبلة حسب موقعك الجغرافي.",
                      icon: MapIcon,
                      color: "text-emerald-500",
                      bg: "bg-emerald-500/10"
                    },
                    {
                      title: "مكتبة الخلفيات المرئية (Pexels)",
                      desc: "مصدر الصور والفيديوهات الطبيعية والجمالية فائقة الدقة لتصميم خلفيات المقاطع.",
                      icon: Image,
                      color: "text-purple-500",
                      bg: "bg-purple-500/10"
                    },
                    {
                      title: "محرك المونتاج (Remotion Engine)",
                      desc: "التقنية المستخدمة لدمج الصوت مع النص وتوليد مقاطع الفيديو الإسلامية الاحترافية.",
                      icon: Zap,
                      color: "text-yellow-500",
                      bg: "bg-yellow-500/10"
                    }
                  ].map((service, index) => (
                    <div 
                      key={index}
                      className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 hover:bg-white/[0.06] transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-xl ${service.bg} ${service.color} flex items-center justify-center shrink-0`}>
                            <service.icon className="w-4 h-4" />
                          </div>
                          <h4 className="text-xs font-black text-white group-hover:text-primary transition-colors">{service.title}</h4>
                        </div>
                        <p className="text-[10px] font-bold text-white/40 leading-relaxed">{service.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 p-8 border-t border-white/10 bg-black/20 text-center">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">نظام النقاط العالمي V 7 - سكينة</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
