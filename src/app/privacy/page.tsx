import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "سياسة الخصوصية | يقين",
  description: "Privacy Policy for Yaqeen Quran and Video Studio",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-16 px-6 font-['Tajawal',sans-serif]">
      <div className="w-full max-w-3xl bg-slate-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl space-y-8 shadow-2xl">
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <Link href="/" className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> العودة للرئيسية
          </Link>
          <h1 className="text-2xl font-black text-white">سياسة الخصوصية | Privacy Policy</h1>
        </div>

        <div className="space-y-6 text-right leading-relaxed text-sm text-slate-300">
          <p className="text-xs text-slate-500 font-mono">Last Updated: July 2026</p>
          
          <p>
            مرحباً بك في منصة **يقين للقرآن الكريم وصناعة الفيديو (Yaqeen Studio)**. نحن نلتزم بحماية خصوصية بياناتك
            وتوفير تجربة آمنة وموثوقة.
          </p>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <h2 className="text-lg font-black text-white">1. البيانات التي نجمعها (Information We Collect)</h2>
            <ul className="list-disc list-inside space-y-2 pr-4">
              <li>**بيانات الحساب الشخصي:** عند تسجيل الدخول أو إنشاء حساب (الاسم، البريد الإلكتروني، أو رقم الهاتف).</li>
              <li>**رموز تيك توك الموثقة:** بعد ربط حسابك في TikTok لتمكين النشر التلقائي، نقوم بتخزين رموز الصلاحية (Access/Refresh Tokens) بشكل آمن ومشفر.</li>
              <li>**بيانات الفيديوهات المونتاجة:** الملفات والإعدادات التي ترسلها لإنشاء الفيديو القرآني.</li>
            </ul>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <h2 className="text-lg font-black text-white">2. كيف نستخدم بياناتك (How We Use Your Information)</h2>
            <ul className="list-disc list-inside space-y-2 pr-4">
              <li>توليد ومعالجة مقاطع الفيديو وتطبيق المؤثرات والخطوط المطلوبة.</li>
              <li>نشر الفيديوهات الملتئمة مباشرة على حساب TikTok الخاص بك بناءً على طلبك الصريح.</li>
              <li>تحسين وتطوير خدماتنا وحماية خوادمنا من الاستخدام العشوائي.</li>
              <li>**ملاحظة هامة:** نحن لا نقوم ببيع أو مشاركة بياناتك الشخصية مع أي طرف ثالث خارج إطار تقديم الخدمة.</li>
            </ul>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <h2 className="text-lg font-black text-white">3. أمن البيانات وحمايتها (Data Security)</h2>
            <p>
              يتم تخزين جميع رموز الوصول والتوكنز بشكل مشفر بالكامل في قواعد بياناتنا، ويتم تقييد الوصول إليها
              إلا للخدمات البرمجية المسؤولة عن النشر التلقائي.
            </p>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <h2 className="text-lg font-black text-white">4. التواصل والدعم (Contact Us)</h2>
            <p>
              إذا كان لديك أي استفسار أو لطلب حذف بياناتك تماماً من خوادمنا، يرجى التواصل معنا عبر البريد الإلكتروني:
              <br />
              <a href="mailto:support@yaqeenalquran.online" className="text-sky-400 font-mono font-bold hover:underline">
                support@yaqeenalquran.online
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
