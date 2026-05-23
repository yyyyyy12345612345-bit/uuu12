"use client";

import React from "react";
import { ShieldCheck, Shield, Activity, Bell, Zap, Layers } from "lucide-react";

export function SecurityPage() {
  return (
    <div className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.15),transparent_25%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,transparent_65%)]" />
      <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-white/5 blur-3xl opacity-30 pointer-events-none" />
      <div className="relative z-10 px-6 py-10 md:px-14 md:py-14">
        <div className="mx-auto max-w-6xl space-y-14">
          <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-primary">
                شاشة الأمان
              </span>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white md:max-w-xl">
                تصميم أمني متطور بعناية 3D. قوة حماية، انسيابية عرض، واستجابة فورية.
              </h1>
              <p className="max-w-2xl text-sm text-slate-300 leading-8 md:text-base">
                واجهة أمان احترافية تستقبل المستخدم بترحيب حركي وتفاعلات واضحة، مع لوحة مراقبة للتهديدات، مستوى الثقة، ونقاط التحكم المخصصة.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                  <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 text-primary mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h2 className="font-semibold text-white">درع وحي</h2>
                  <p className="mt-2 text-sm text-slate-400">مستوى حماية تلقائي مع إشعارات لحظية عند أي نشاط مريب.</p>
                </div>
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                  <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h2 className="font-semibold text-white">رصد تفاعلي</h2>
                  <p className="mt-2 text-sm text-slate-400">رسوم متحركة للبيانات والأنظمة توضح حالة الأمان بشكل واضح.</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px] rounded-[3rem] border border-white/10 bg-slate-900/60 p-6 shadow-[0_50px_150px_rgba(30,41,59,0.35)] backdrop-blur-3xl overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.18),transparent_40%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.16),transparent_18%)]" />
              <div className="absolute inset-0 opacity-70 mix-blend-screen">
                <div className="absolute left-8 top-10 h-16 w-16 rounded-full border border-primary/30 blur-2xl" />
                <div className="absolute right-10 bottom-12 h-24 w-24 rounded-full border border-violet-400/20 blur-3xl" />
              </div>
              <div className="relative z-10 h-full flex items-center justify-center">
                <div className="relative flex h-[340px] w-[340px] items-center justify-center rounded-full border border-white/10 bg-slate-950/80 shadow-[0_40px_120px_rgba(79,70,229,0.16)]">
                  <div className="absolute inset-0 rounded-full border border-primary/30 blur-xl opacity-70 animate-[rotate360_20s_linear_infinite]" />
                  <div className="absolute inset-0 rounded-full border border-violet-500/15 shadow-[0_0_100px_rgba(168,85,247,0.3)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex h-36 w-36 rounded-full bg-slate-950/95 border border-primary/20 shadow-[0_20px_80px_rgba(79,70,229,0.22)]">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-transparent to-transparent opacity-80 animate-[pulseRing_3s_ease-in-out_infinite]" />
                      <div className="relative z-10 flex h-full w-full items-center justify-center">
                        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-900/90 border border-white/10 shadow-[0_0_40px_rgba(79,70,229,0.32)]">
                          <Shield className="w-12 h-12 text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute left-1/2 top-9 h-16 w-16 -translate-x-1/2 rounded-full border border-primary/40 bg-primary/10 blur-2xl" />
                  <div className="absolute right-8 bottom-14 h-12 w-12 rounded-full border border-slate-300/10 bg-white/5 blur-sm" />
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-3">
            {[
              { icon: Bell, title: "تنبيهات اختراق", description: "تنبيهات فورية عند أي نشاط غير مألوف لضمان استجابة أسرع.", color: "from-fuchsia-500 to-purple-500" },
              { icon: Zap, title: "حماية ذكية", description: "طبقات حماية متطورة مع مراقبة سلوك لحظية وقرارات أمنية تلقائية.", color: "from-cyan-400 to-blue-500" },
              { icon: Layers, title: "إدارة وصول", description: "تحكم دقيق في الصلاحيات والوصول داخل التطبيق بنهج مركزي واضح.", color: "from-emerald-400 to-teal-500" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[2rem] border border-white/10 bg-slate-900/75 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_35px_100px_rgba(79,70,229,0.22)]">
                  <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br ${item.color} bg-opacity-15 text-white shadow-[0_20px_40px_rgba(15,23,42,0.3)]`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p>
                </div>
              );
            })}
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "درجة الثقة", value: "99.9%", accent: "text-emerald-400" },
              { label: "مراقبة 24/7", value: "نشط", accent: "text-cyan-300" },
              { label: "تسجيل الأحداث", value: "أكثر من 1.2M", accent: "text-violet-300" },
              { label: "استجابة داخل", value: "< 2s", accent: "text-amber-300" },
            ].map((metric) => (
              <div key={metric.label} className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{metric.label}</p>
                <p className={`mt-4 text-3xl font-black ${metric.accent}`}>{metric.value}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
      <style>{`
        @keyframes rotate360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: 0.75; }
          50% { transform: scale(1.08); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
