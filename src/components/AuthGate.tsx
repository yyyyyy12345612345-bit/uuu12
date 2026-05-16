"use client";

import React, { useState, useEffect } from "react";
import { LogIn, Loader2, Star, BookOpen, Trophy, Users, Sparkles, User, Phone, Check, ArrowRight, ArrowLeft, MapPin, KeyRound, Eye, EyeOff } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // For Signup: 1: Info, 2: Avatar
  const [error, setError] = useState("");
  
  // Login States
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup States
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    phone: "",
    password: "",
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
            // User exists in Auth but not in Firestore - show setup
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginIdentifier || !loginPassword) {
      setError("يرجى ملء جميع الحقول");
      return;
    }

    setIsLoggingIn(true);
    try {
      let username = "";
      const trimmedId = loginIdentifier.trim();
      
      // 1. Try to find user by username in Firestore
      const usernameQuery = query(collection(db, "users"), where("username", "==", trimmedId.toLowerCase()));
      const usernameSnap = await getDocs(usernameQuery);
      
      if (!usernameSnap.empty) {
        username = usernameSnap.docs[0].data().username;
      } else {
        // 2. Try to find user by phone in Firestore
        const phoneQuery = query(collection(db, "users"), where("phoneNumber", "==", trimmedId));
        const phoneSnap = await getDocs(phoneQuery);
        if (!phoneSnap.empty) {
          username = phoneSnap.docs[0].data().username;
        }
      }

      if (!username) {
        setError("اسم المستخدم أو رقم الهاتف غير مسجل لدينا");
        setIsLoggingIn(false);
        return;
      }

      // 3. Construct email and sign in
      const email = `${username}@quran.app`;
      await signInWithEmailAndPassword(auth, email, loginPassword);
      
      // Success will be handled by onAuthStateChanged
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setError("كلمة المرور غير صحيحة أو الحساب غير موجود");
      } else {
        setError("حدث خطأ: " + (err.code === "auth/too-many-requests" ? "محاولات كثيرة خاطئة، انتظر قليلاً" : "خطأ في تسجيل الدخول"));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegisterNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.displayName.trim().length < 2) {
      setError("يرجى إدخال اسمك بشكل صحيح");
      return;
    }
    if (formData.username.trim().length < 3) {
      setError("الاسم المميز يجب أن يكون 3 أحرف على الأقل");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(formData.username.trim().toLowerCase())) {
      setError("الاسم المميز يجب أن يحتوي على حروف إنجليزية صغيرة وأرقام فقط");
      return;
    }
    if (formData.phone.trim().length < 10) {
      setError("يرجى إدخال رقم هاتف صحيح");
      return;
    }
    if (formData.password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setIsLoggingIn(true);
    try {
      // Check username uniqueness
      const qUser = query(collection(db, "users"), where("username", "==", formData.username.trim().toLowerCase()));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        setError("هذا الاسم المميز محجوز بالفعل");
        setIsLoggingIn(false);
        return;
      }
      
      // Check phone uniqueness
      const qPhone = query(collection(db, "users"), where("phoneNumber", "==", formData.phone.trim()));
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty) {
        setError("رقم الهاتف هذا مسجل بحساب آخر");
        setIsLoggingIn(false);
        return;
      }

      setStep(2);
    } catch (err) {
      setError("حدث خطأ أثناء فحص البيانات");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFinalSignup = async () => {
    if (!auth || !db) return;
    setIsLoggingIn(true);
    setError("");
    try {
      const email = `${formData.username.trim().toLowerCase()}@quran.app`;
      const res = await createUserWithEmailAndPassword(auth, email, formData.password);
      
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        username: formData.username.trim().toLowerCase(),
        displayName: formData.displayName.trim(),
        phoneNumber: formData.phone.trim(),
        gender: formData.gender,
        governorate: formData.governorate,
        photoURL: formData.avatar,
        totalPoints: 0,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isBanned: false
      });
      
      alert("تم إنشاء الحساب بنجاح!");
      window.location.reload();
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.code === "auth/email-already-in-use" ? "هذا الحساب موجود بالفعل" : "حدث خطأ أثناء إنشاء الحساب");
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
            if (target.closest('button') || target.closest('a') || target.classList.contains('cursor-pointer')) {
              e.preventDefault();
              e.stopPropagation();
              setIsSkipped(false);
              localStorage.removeItem('auth_skipped');
            }
          }
        }}
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#d4af37]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#d4af37]/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 islamic-pattern opacity-[0.03] scale-150" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-zinc-900/50 backdrop-blur-3xl border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 fade-in duration-500">
          
          <div className="flex flex-col items-center gap-4 mb-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-b from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 flex items-center justify-center shadow-2xl mb-2">
              <img src="/logo/logo.png" alt="Logo" className="w-14 h-14 object-contain" />
            </div>
            <h1 className="text-2xl font-black text-white">
              {isLoginMode ? "تسجيل الدخول" : (step === 1 ? "إنشاء حساب جديد" : "اختر صورتك الرمزية")}
            </h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
              {isLoginMode ? "ادخل إلى حسابك للمتابعة" : (step === 1 ? "سجل بياناتك للبدء" : "اختر صورة تعبر عنك")}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs text-center font-bold">
              {error}
            </div>
          )}

          {isLoginMode ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5 text-right">
                <label className="text-[10px] font-bold text-white/30 mr-2">اسم المستخدم أو رقم الهاتف</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    required
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-sm text-white outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all"
                    placeholder="youssef_123 أو 010XXXXXXXX"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-[10px] font-bold text-white/30 mr-2">كلمة المرور</label>
                <div className="relative">
                  <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-12 text-sm text-white outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-4 bg-[#d4af37] text-black rounded-2xl font-black text-sm mt-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-[#d4af37]/20 flex items-center justify-center gap-2"
              >
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "تسجيل الدخول"}
              </button>

              <div className="flex items-center justify-between px-2 pt-2">
                <button
                  type="button"
                  onClick={() => alert("سيتم تفعيل هذه الميزة قريباً")}
                  className="text-[10px] font-bold text-white/20 hover:text-[#d4af37] transition-colors"
                >
                  نسيت كلمة المرور؟
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLoginMode(false); setStep(1); setError(""); }}
                  className="text-[10px] font-bold text-[#d4af37] hover:underline"
                >
                  إنشاء حساب جديد
                </button>
              </div>
            </form>
          ) : (
            <>
              {step === 1 ? (
                <form onSubmit={handleRegisterNext} className="space-y-4">
                  <div className="space-y-1 text-right">
                    <label className="text-[10px] font-bold text-white/30 mr-2">الاسم</label>
                    <div className="relative">
                      <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        required
                        value={formData.displayName}
                        onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 text-sm text-white outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all"
                        placeholder="اسمك الحقيقي"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 text-right">
                      <label className="text-[10px] font-bold text-white/30 mr-2">الاسم المميز (Username)</label>
                      <input
                        required
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white font-mono outline-none focus:border-[#d4af37]/50"
                        placeholder="youssef_1"
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-1 text-right">
                      <label className="text-[10px] font-bold text-white/30 mr-2">رقم الهاتف</label>
                      <input
                        required
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white font-mono outline-none focus:border-[#d4af37]/50"
                        placeholder="010XXXXXXXX"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-right">
                    <label className="text-[10px] font-bold text-white/30 mr-2">كلمة المرور</label>
                    <div className="relative">
                      <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      <input
                        required
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-12 text-sm text-white outline-none focus:border-[#d4af37]/50"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-right">
                    <label className="text-[10px] font-bold text-white/30 mr-2">المحافظة</label>
                    <select
                      value={formData.governorate}
                      onChange={e => setFormData({ ...formData, governorate: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-[#d4af37]/50"
                    >
                      {EGYPT_GOVERNORATES.map(gov => <option key={gov} value={gov} className="bg-zinc-900">{gov}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: "male", avatar: AVATARS.male[0] })}
                      className={`py-3 rounded-xl border transition-all ${formData.gender === "male" ? "border-[#d4af37] bg-[#d4af37]/10" : "border-white/5 bg-white/5 opacity-40"}`}
                    >
                      👨 ذكر
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: "female", avatar: AVATARS.female[0] })}
                      className={`py-3 rounded-xl border transition-all ${formData.gender === "female" ? "border-[#d4af37] bg-[#d4af37]/10" : "border-white/5 bg-white/5 opacity-40"}`}
                    >
                      👩 أنثى
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-4 bg-[#d4af37] text-black rounded-xl font-black text-sm mt-2 flex items-center justify-center gap-2"
                  >
                    {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "التالي"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => { setIsLoginMode(true); setError(""); }}
                    className="w-full text-[10px] font-bold text-white/20 hover:text-[#d4af37]"
                  >
                    لديك حساب بالفعل؟ تسجيل الدخول
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-3 max-h-[250px] overflow-y-auto p-2 scrollbar-hide">
                    {AVATARS[formData.gender].map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setFormData({ ...formData, avatar: url })}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${formData.avatar === url ? "border-[#d4af37] scale-110 shadow-lg shadow-[#d4af37]/20" : "border-white/5 grayscale opacity-40"}`}
                      >
                        <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                        {formData.avatar === url && <div className="absolute inset-0 bg-[#d4af37]/20 flex items-center justify-center"><Check className="w-5 h-5 text-[#d4af37]" /></div>}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="flex-1 py-4 bg-white/5 text-white rounded-xl font-bold text-sm">رجوع</button>
                    <button
                      onClick={handleFinalSignup}
                      disabled={isLoggingIn}
                      className="flex-[2] py-4 bg-[#d4af37] text-black rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#d4af37]/20"
                    >
                      {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "ابدأ الآن 🚀"}
                    </button>
                  </div>
                </div>
              )}
            </>
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
