"use client";

import React, { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { BookOpen, Save, Sparkles, Loader2, PenTool, CheckCircle } from "lucide-react";
import { ReflectionCardGenerator } from "./ReflectionCardGenerator";

interface ReflectionTabProps {
  verseText: string;
  verseKey: string;
  surahName: string;
}

export function ReflectionTab({ verseText, verseKey, surahName }: ReflectionTabProps) {
  const [reflectionText, setReflectionText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const user = auth?.currentUser;

  // Load existing reflection for this verse if any
  useEffect(() => {
    async function loadReflection() {
      if (!user || !db) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const docId = verseKey.replace(":", "_");
        const docSnap = await getDoc(doc(db, "users", user.uid, "reflections", docId));
        if (docSnap.exists()) {
          setReflectionText(docSnap.data().text || "");
        }
      } catch (e) {
        console.error("Failed to load reflection:", e);
      } finally {
        setLoading(false);
      }
    }
    loadReflection();
  }, [verseKey, user]);

  // Save reflection
  const handleSaveReflection = async () => {
    if (!user || !db) {
      alert("يجب تسجيل الدخول لحفظ خواطرك");
      return;
    }
    if (!reflectionText.trim()) {
      alert("يرجى كتابة نص الخاطرة أولاً");
      return;
    }

    setSaving(true);
    try {
      const docId = verseKey.replace(":", "_");
      await setDoc(doc(db, "users", user.uid, "reflections", docId), {
        verseKey,
        surahName,
        text: reflectionText.trim(),
        updatedAt: serverTimestamp()
      });
      
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {
      console.error("Failed to save reflection:", e);
      alert("حدث خطأ أثناء الحفظ، يرجى المحاولة لاحقاً");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs text-foreground/20 font-bold tracking-widest uppercase">جاري تحميل مذكرتك...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-6 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center border border-border">
          <BookOpen className="w-6 h-6 text-foreground/20" />
        </div>
        <div>
          <h4 className="text-lg font-black text-foreground">تحتاج لتسجيل الدخول</h4>
          <p className="text-xs text-foreground/45 font-bold mt-2 leading-relaxed">
            مذكرات التدبر والخواطر تُحفظ سحابياً في حسابك. يرجى تسجيل الدخول لتتمكن من تدوين أورادك وصناعة بطاقاتك الخاصة.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-right font-['Tajawal']" dir="rtl">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
          <PenTool className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-foreground">تدبر ومشاركة</h3>
          <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">مذكرتك الشخصية في آيات القرآن الكريم</p>
        </div>
      </div>

      <div className="bg-foreground/[0.02] border border-border p-6 rounded-[2.5rem] space-y-6">
        <div>
          <label className="text-[10px] font-black text-foreground/35 uppercase tracking-widest block mb-3">ماذا فهمت أو تدبرت من هذه الآية؟</label>
          <textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value.slice(0, 350))}
            placeholder="اكتب خاطرتك، تدبرك، أو الأثر الذي تركته هذه الآية في قلبك هنا..."
            className="w-full min-h-[140px] bg-foreground/[0.03] dark:bg-black/35 border border-border rounded-2xl p-5 text-base md:text-lg text-foreground placeholder:text-foreground/20 outline-none focus:border-primary/50 transition-all font-bold resize-none leading-relaxed"
          />
          <div className="flex justify-between items-center mt-2 text-[10px] text-foreground/35 font-bold px-2">
            <span>الحد الأقصى الموصى به: 350 حرفاً (للبطاقة الدعوية)</span>
            <span className={reflectionText.length >= 350 ? "text-primary" : ""}>
              {reflectionText.length} / 350 حرف
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Save Reflection Button */}
          <button
            onClick={handleSaveReflection}
            disabled={saving || !reflectionText.trim()}
            className={`flex-1 py-4 rounded-xl font-black text-sm flex items-center justify-center gap-3 transition-all border ${
              savedSuccess
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-foreground/5 border-border text-foreground/75 hover:bg-foreground/10 hover:text-foreground disabled:opacity-40 disabled:hover:bg-foreground/[0.02]"
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : savedSuccess ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{savedSuccess ? "تم الحفظ بنجاح!" : "حفظ في مذكرتي"}</span>
          </button>

          {/* Design Card Button */}
          <button
            onClick={() => setShowGenerator(true)}
            disabled={!reflectionText.trim()}
            className="flex-1 py-4 rounded-xl bg-primary text-black font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/10 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:hover:scale-100"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>صناعة بطاقة دعوية</span>
          </button>
        </div>
      </div>

      {/* Card Generator Overlay */}
      {showGenerator && (
        <ReflectionCardGenerator
          verseText={verseText}
          verseKey={verseKey}
          surahName={surahName}
          reflectionText={reflectionText}
          onClose={() => setShowGenerator(false)}
          onShareSuccess={() => {
            setShowGenerator(false);
          }}
        />
      )}
    </div>
  );
}
