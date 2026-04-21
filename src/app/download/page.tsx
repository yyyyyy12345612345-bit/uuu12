"use client";

import React from "react";
import { 
  Download, ShieldCheck, Zap, Smartphone, 
  BarChart3, RefreshCcw, Bell, CheckCircle2 
} from "lucide-react";
import Link from "next/link";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-arabic overflow-x-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] opacity-50" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 lg:py-32">
        {/* Header Section */}
        <div className="text-center space-y-6 mb-20 animate-in fade-in slide-in-from-top duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-4">
            <Smartphone className="w-4 h-4" />
            <span>نظام التشغيل: أندرويد (تثبيت مباشر)</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent leading-tight">
            حمل تطبيق القرآن <br /> 
            <span className="text-primary italic">بنسخته الكاملة</span>
          </h1>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto leading-relaxed px-4">
            استمتع بجميع ميزات الموقع بالإضافة إلى تشغيل الصوت في الخلفية، الإحصائيات الشخصية، 
            والتنبيهات الذكية في تطبيق واجد صمم لراحتك.
          </p>
        </div>

        {/* Action Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-32">
          {/* Card left */}
          <div className="lg:col-span-7 bg-foreground/5 border border-border p-8 lg:p-12 rounded-[40px] shadow-2xl space-y-8 animate-in slide-in-from-right duration-1000">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Download className="w-8 h-8 text-primary" />
                تثبيت الإصدار v1.0.0
              </h2>
              <p className="text-foreground/50">ملف APK آمن ومحصن ومرفوع مباشرة من مستودع المشروع.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-3xl bg-background/50 border border-border">
                <div className="text-xs text-foreground/40 mb-1">حجم الملف</div>
                <div className="text-xl font-bold italic">~ 15 MB</div>
              </div>
              <div className="p-4 rounded-3xl bg-background/50 border border-border">
                <div className="text-xs text-foreground/40 mb-1">المستخدمين</div>
                <div className="text-xl font-bold italic">+1,000</div>
              </div>
            </div>

            <a 
              href="https://github.com" 
              target="_blank"
              className="group relative flex items-center justify-center w-full py-6 bg-primary text-primary-foreground rounded-3xl font-black text-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              تنزيل ملف APK الآن
            </a>

            <div className="flex items-center gap-4 text-sm text-foreground/40 justify-center">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> آمن 100%</span>
              <span className="w-1 h-1 rounded-full bg-foreground/20" />
              <span className="flex items-center gap-1"><RefreshCcw className="w-4 h-4" /> تحديثات تلقائية</span>
            </div>
          </div>

          {/* Features right */}
          <div className="lg:col-span-5 space-y-6 animate-in slide-in-from-left duration-1000">
            <FeatureItem 
              icon={<BarChart3 className="w-6 h-6" />}
              title="إحصائيات كاملة"
              desc="تابع وردك اليومي، عدد الساعات التي استمعت فيها للقرآن."
            />
            <FeatureItem 
              icon={<Bell className="w-6 h-6" />}
              title="تنبيهات ذكية"
              desc="احصل على إشعارات لمواقيت الصلاة وأذكار الصباح والمساء."
            />
            <FeatureItem 
              icon={<Zap className="w-6 h-6" />}
              title="خفيف وسريع"
              desc="مصمم ليعمل على جميع الأجهزة الضعيفة والقوية بكفاءة عالية."
            />
          </div>
        </div>

        {/* Steps Section */}
        <div className="p-12 rounded-[50px] bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 relative overflow-hidden">
          <div className="relative z-10 text-center space-y-12">
            <h3 className="text-3xl font-black">كيف تقوم بتثبيت التطبيق؟</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Step number="١" text="قم بتحميل ملف الـ APK من الزر أعلاه." />
              <Step number="٢" text="افتح الملف؛ سيطلب منك السماح بالتثبيت من مصادر غير معروفة." />
              <Step number="٣" text="اضغط تثبيت (Install) واستمتع بالتجربة الكاملة." />
            </div>
          </div>
          {/* Decorative element */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[100px] bg-primary/5 rotate-12 blur-3xl" />
        </div>
        
        {/* Footer Link */}
        <div className="mt-20 text-center">
           <Link href="/" className="text-foreground/40 hover:text-primary transition-colors flex items-center justify-center gap-2">
             <Smartphone className="w-4 h-4" />
             العودة للموقع الرئيسي
           </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-6 p-6 rounded-3xl bg-foreground/5 border border-border/50 hover:border-primary/20 transition-all group">
      <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="text-xl font-bold mb-1">{title}</h4>
        <p className="text-foreground/50 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Step({ number, text }: { number: string, text: string }) {
  return (
    <div className="space-y-4">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-black mx-auto shadow-lg shadow-primary/20">
        {number}
      </div>
      <p className="text-foreground/70 font-bold">{text}</p>
    </div>
  );
}
