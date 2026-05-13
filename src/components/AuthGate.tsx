"use client";

import React, { useState, useEffect } from "react";
import { LogIn, Loader2, Star, BookOpen, Trophy, Users, Sparkles, User, Phone, Check, ArrowRight, ArrowLeft, MapPin } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  signInAnonymously,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";

interface AuthGateProps {
  children: React.ReactNode;
}

const AVATARS = {
  male: [
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Ahmed&top=shortFlat&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Omar&top=shortRound&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Ali&top=shortCurly&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Hassan&top=shortWaved&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Zaid&top=theCaesar&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Mustafa&top=shortFlat&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Youssef&top=shortRound&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Ibrahim&top=shortCurly&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Karim&top=shortWaved&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Amr&top=theCaesar&facialHairProbability=100&accessoriesProbability=0"
  ],
  female: [
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Aisha&top=hijab&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Fatima&top=hijab&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Mariam&top=hijab&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Khadija&top=hijab&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Zaynab&top=hijab&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Sara&top=hijab&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Layla&top=hijab&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Hana&top=hijab&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Nour&top=hijab&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Amira&top=hijab&accessoriesProbability=0"
  ]
};

const EGYPT_GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", 
  "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية", 
  "جنوب سيناء", "شمال سيناء", "بني سويف", "بورسعيد", "دمياط", "سوهاج", "قنا", "كفر الشيخ", 
  "مطروح", "الأقصر", "أسوان", "أسيوط"
];

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [step, setStep] = useState(1); // 1: Login/Register, 2: Avatar Selection
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    phone: "",
    gender: "male" as "male" | "female",
    avatar: AVATARS.male[0],
    governorate: "القاهرة"
  });

  const [isSkipped, setIsSkipped] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_skipped') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u && db) {
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) {
            setHasProfile(true);
          } else {
            setHasProfile(false);
          }
        } catch (e) {
          console.error("Firestore error:", e);
          setHasProfile(true); 
        }
      } else {
        setHasProfile(null);
      }
      setUser(u);
    });

    return () => unsubscribe();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.displayName.length < 2) {
      setError("يرجى إدخال اسمك بشكل صحيح");
      return;
    }
    if (formData.username.length < 3) {
      setError("الاسم المميز يجب أن يكون 3 أحرف على الأقل");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(formData.username)) {
      setError("الاسم المميز يجب أن يحتوي على حروف إنجليزية وأرقام فقط");
      return;
    }
    if (formData.phone.length < 10) {
      setError("يرجى إدخال رقم هاتف صحيح");
      return;
    }

    setIsLoggingIn(true);
    try {
      // Check if username exists
      const q = query(collection(db, "users"), where("username", "==", formData.username));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setError("هذا الاسم المميز محجوز بالفعل");
        setIsLoggingIn(false);
        return;
      }
      
      setStep(2);
      // Set default avatar based on gender if none selected
      if (!formData.avatar) {
        setFormData(prev => ({ ...prev, avatar: AVATARS[formData.gender][0] }));
      }
    } catch (err) {
      setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!auth || !db) return;
    setIsLoggingIn(true);
    try {
      // Sign in anonymously if not already signed in
      let currentUser = auth.currentUser;
      if (!currentUser) {
        const res = await signInAnonymously(auth);
        currentUser = res.user;
      }

      console.log("[Auth]: Writing profile to Firestore for UID:", currentUser.uid);
      await setDoc(doc(db, "users", currentUser.uid), {
        uid: currentUser.uid,
        username: formData.username,
        displayName: formData.displayName,
        phoneNumber: formData.phone,
        gender: formData.gender,
        governorate: formData.governorate,
        photoURL: formData.avatar,
        totalPoints: 0,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isBanned: false
      });
      console.log("[Auth]: Profile written successfully!");
      alert("تم إنشاء الحساب بنجاح! سيتم توجيهك الآن.");
      window.location.reload();

      setHasProfile(true);
    } catch (err: any) {
      console.error("AuthGate Submit Error:", err);
      let msg = "حدث خطأ أثناء حفظ البيانات";
      if (err.code === "auth/admin-restricted-operation") {
        msg = "خطأ: يجب تفعيل 'Anonymous Auth' في لوحة تحكم Firebase";
      }
      setError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSkip = () => {
    setIsSkipped(true);
    localStorage.setItem('auth_skipped', 'true');
  };

  if (isSkipped || (user && hasProfile === true)) {
    return (
      <div 
        onClickCapture={(e) => {
          if (isSkipped) {
            const target = e.target as HTMLElement;
            // Check if the click is on a button, link, or an interactive-looking element
            if (
              target.tagName === 'BUTTON' || 
              target.tagName === 'A' || 
              target.closest('button') || 
              target.closest('a') ||
              target.classList.contains('cursor-pointer')
            ) {
              e.preventDefault();
              e.stopPropagation();
              setIsSkipped(false);
              localStorage.removeItem('auth_skipped');
            }
          }
        }}
        className={isSkipped ? "pointer-events-auto" : ""}
      >
        {children}
      </div>
    );
  }

  if (user === undefined) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[9999]">
        <div className="w-10 h-10 border-2 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-arabic overflow-y-auto bg-[#050505]">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d4af37]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#d4af37]/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 islamic-pattern opacity-[0.03] scale-150" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-zinc-900/50 backdrop-blur-3xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 fade-in duration-500">
          
          {/* Header */}
          <div className="flex flex-col items-center gap-4 mb-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-b from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 flex items-center justify-center shadow-2xl mb-2">
              <img src="/logo/logo.png" alt="Logo" className="w-14 h-14 object-contain" />
            </div>
            <h1 className="text-2xl font-black text-white">مرحباً بك في قرآن كريم</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
              {step === 1 ? "سجل بياناتك للبدء" : "اختر صورتك الرمزية"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs text-center font-bold animate-shake">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="space-y-1.5 text-right">
                <label className="text-[10px] font-bold text-white/30 mr-2">الاسم</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    required
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-sm text-white outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all"
                    placeholder="اسمك الحقيقي"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-[10px] font-bold text-white/30 mr-2">الاسم المميز (Username)</label>
                <div className="relative">
                  <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-sm text-white font-mono outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all"
                    placeholder="youssef_123"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-[10px] font-bold text-white/30 mr-2">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-sm text-white font-mono outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all"
                    placeholder="010XXXXXXXX"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-[10px] font-bold text-white/30 mr-2">المحافظة</label>
                <div className="relative">
                  <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <select
                    required
                    value={formData.governorate}
                    onChange={e => setFormData({ ...formData, governorate: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-sm text-white outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all appearance-none"
                  >
                    {EGYPT_GOVERNORATES.map(gov => (
                      <option key={gov} value={gov} className="bg-[#050505] text-white">{gov}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: "male", avatar: AVATARS.male[0] })}
                  className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.gender === "male" ? "border-[#d4af37] bg-[#d4af37]/10 text-white" : "border-white/5 bg-white/5 text-white/40"}`}
                >
                  <span className="text-xl">👨</span>
                  <span className="text-xs font-bold">ذكر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: "female", avatar: AVATARS.female[0] })}
                  className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.gender === "female" ? "border-[#d4af37] bg-[#d4af37]/10 text-white" : "border-white/5 bg-white/5 text-white/40"}`}
                >
                  <span className="text-xl">👩</span>
                  <span className="text-xs font-bold">أنثى</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-4 bg-[#d4af37] text-black rounded-2xl font-black text-sm mt-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#d4af37]/20 flex items-center justify-center gap-2"
              >
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <>التالي <ArrowLeft className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 max-h-[280px] overflow-y-auto p-4 scrollbar-hide">
                {AVATARS[formData.gender as "male" | "female"].map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setFormData({ ...formData, avatar: url })}
                    className={`relative aspect-square rounded-2xl overflow-hidden transition-all border-2 ${
                      formData.avatar === url ? "border-[#d4af37] scale-110 shadow-lg shadow-[#d4af37]/20" : "border-white/5 grayscale opacity-40 hover:opacity-100 hover:grayscale-0"
                    }`}
                  >
                    <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                    {formData.avatar === url && (
                      <div className="absolute inset-0 bg-[#d4af37]/20 flex items-center justify-center">
                        <Check className="w-6 h-6 text-[#d4af37]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold text-sm border border-white/10"
                >
                  رجوع
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={isLoggingIn}
                  className="flex-[2] py-4 bg-[#d4af37] text-black rounded-2xl font-black text-sm shadow-xl shadow-[#d4af37]/20 flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "ابدأ الآن 🚀"}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleSkip}
            className="w-full mt-6 text-white/20 hover:text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] transition-all"
          >
            استخدم كزائر فقط
          </button>
        </div>
      </div>
    </div>
  );
}
