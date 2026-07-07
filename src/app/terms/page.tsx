import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "شروط الخدمة | يقين",
  description: "Terms of Service for Yaqeen Quran and Video Studio",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-16 px-6 font-['Tajawal',sans-serif]">
      <div className="w-full max-w-3xl bg-slate-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl space-y-8 shadow-2xl">
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
          <Link href="/" className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> العودة للرئيسية
          </Link>
          <h1 className="text-2xl font-black text-white">شروط الخدمة | Terms of Service</h1>
        </div>

        <div className="space-y-6 text-right leading-relaxed text-sm text-slate-300">
          <p className="text-xs text-slate-500 font-mono">Last Updated: July 2026</p>
          
          <p>
            باستخدامك لمنصة **يقين للقرآن الكريم وصناعة الفيديو (Yaqeen Studio)**، فإنك توافق على شروط الخدمة والسياسات التالية:
          </p>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <h2 className="text-lg font-black text-white">1. طبيعة الخدمات (Services)</h2>
            <p>
              يقدم موقع يقين منصة تتيح للمستخدمين قراءة القرآن، الاستماع للقراء، وتوليد مقاطع فيديو قرآنية ودعوية مخصصة 
              للنشر الفردي أو النشر التلقائي عبر تطبيق تيك توك.
            </p>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <h2 className="text-lg font-black text-white">2. مسؤولية المستخدم (User Responsibilities)</h2>
            <ul className="list-disc list-inside space-y-2 pr-4">
              <li>المستخدم مسؤول مسؤولية كاملة عن جودة ومحتوى الفيديوهات التي يقوم بنشرها.</li>
              <li>الالتزام التام بشروط وسياسات منصة TikTok وشروط الاستخدام الخاصة بها عند استخدام خاصية النشر التلقائي.</li>
              <li>عدم استخدام الاستوديو لإنشاء محتوى مخالف للشريعة الإسلامية أو القوانين العامة.</li>
            </ul>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <h2 className="text-lg font-black text-white">3. حدود المسؤولية (Limitation of Liability)</h2>
            <p>
              يتم تقديم الخدمة "كما هي" دون ضمانات من أي نوع. نحن لا نتحمل أي مسؤولية عن أي حظر لحسابك، أو فشل في النشر،
              أو أي تبعات تنتج عن استخدام الفيديوهات المنشورة.
            </p>
          </div>

          <div className="border-t border-white/5 pt-6 space-y-4">
            <h2 className="text-lg font-black text-white">4. التواصل والدعم (Contact Us)</h2>
            <p>
              لأي استفسارات بخصوص شروط الاستخدام، يمكنك مراسلتنا على:
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
