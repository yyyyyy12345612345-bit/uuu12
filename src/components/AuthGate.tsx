"use client";

import React, { useState, useEffect } from "react";
import { LogIn, Loader2, Star, BookOpen, Trophy, Users, Sparkles } from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { auth, db } from "@/lib/firebase";
import { 
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthGateProps {
  children: React.ReactNode;
}

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "الشرقية", "الأقصر", "أسوان", "أسيوط", "بني سويف", "بورسعيد", "دمياط", "جنوب سيناء", "كفر الشيخ", "مطروح", "قنا", "شمال سيناء", "سوهاج"
];

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupData, setSetupData] = useState({
    username: "",
    displayName: "",
    phone: "",
    governorate: GOVERNORATES[0]
  });
  const [isSkipped, setIsSkipped] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('auth_skipped') === 'true';
    }
    return false;
  });

  const handleSkip = () => {
    setIsSkipped(true);
    sessionStorage.setItem('auth_skipped', 'true');
  };

  useEffect(() => {
    if (!auth) return;

    // 2. Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u && db) {
        try {
          // Use a shorter timeout for profile check when potentially offline
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) {
            setHasProfile(true);
            setShowSetup(false);
          } else {
            setHasProfile(false);
            setShowSetup(true);
          }
        } catch (e) {
          console.error("Firestore error (likely offline):", e);
          // If offline and we have a user, assume profile exists for now to let them in
          setHasProfile(true);
        }
      } else {
        setHasProfile(null);
      }
      setUser(u);
      
      // If we have a user, ensure we don't get stuck in a 'null' profile state
      if (u) {
        const profileTimeout = setTimeout(() => {
           if (hasProfile === null) setHasProfile(true); 
        }, 3000);
        return () => clearTimeout(profileTimeout);
      }
    });

    // 3. Ultra-fast safety timeout: If auth doesn't respond in 1s, default to Guest
    const authTimeout = setTimeout(() => {
      if (user === undefined) {
        setUser(null);
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearTimeout(authTimeout);
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setIsLoggingIn(true);
    
    // Safety timeout
    const timeout = setTimeout(() => setIsLoggingIn(false), 30000);

    try {
      // 1. Try Native Google Login (Shows Google accounts INSIDE the app)
      if (Capacitor.isNativePlatform()) {
        try {
          const { GoogleSignIn } = await import('@capawesome/capacitor-google-sign-in');
          console.log('[Auth] Attempting native Google Sign-In...');
          
          // 1. Initialize the plugin (REQUIRED)
          await GoogleSignIn.initialize({
            clientId: "194649785258-818jpl0c7it5dsmn7a7mufu8jc1i1uud.apps.googleusercontent.com",
          });
          
          // 2. Ensure we are signed out first to force account picker
          try { await GoogleSignIn.signOut(); } catch (e) {}
          
          // Use serverClientId in signIn to get idToken for Firebase
          const result = await GoogleSignIn.signIn();
          console.log('[Auth] Native Sign-In result received');
          
          if (result && result.idToken) {
             const credential = GoogleAuthProvider.credential(result.idToken);
             await signInWithCredential(auth, credential);
             console.log('[Auth] Firebase Native Login SUCCESS');
             clearTimeout(timeout);
             setIsLoggingIn(false);
             return;
          } else {
            throw new Error("لم يتم العثور على idToken. تأكد من إعدادات SHA-1 في Firebase.");
          }
        } catch (nativeErr: any) {
          console.error('[Auth] Native Google Sign-In failed:', nativeErr);
          let errorMsg = "فشل تسجيل الدخول التلقائي.";
          
          const rawError = typeof nativeErr === 'string' ? nativeErr : (nativeErr.message || JSON.stringify(nativeErr));
          
          if (rawError.includes('10') || nativeErr.code === '10') {
            errorMsg = "خطأ (10): بصمة SHA-1 غير متطابقة. تأكد من إضافة بصمة الـ APK في Firebase.";
          } else {
            errorMsg += `\n(Error: ${rawError.substring(0, 50)}...)`;
          }
          
          alert(errorMsg);
          setIsLoggingIn(false);
          clearTimeout(timeout);
          return;
        }
      }

      // 2. Web Only (or local dev): Web Popup Login
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      console.log('[Auth] Web environment detected, using signInWithPopup...');
      await signInWithPopup(auth, provider);
      console.log('[Auth] Web Login SUCCESS');
    } catch (e: any) {
      console.error('[Auth] Login Error:', e);
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        alert("حدث خطأ: " + (e.message || "فشل الاتصال"));
      }
    } finally {
      setIsLoggingIn(false);
      clearTimeout(timeout);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setSetupError("");

    const username = setupData.username.trim().toLowerCase();
    const displayName = setupData.displayName.trim();

    if (username.length < 3 || username.length > 15) {
      setSetupError("يجب أن يكون الاسم المميز بين 3 و 15 حرفاً");
      return;
    }
    if (displayName.length < 2) {
      setSetupError("يرجى إدخال اسمك بشكل صحيح");
      return;
    }
    const strictUsernameRegex = /^[a-z0-9_]+$/;
    if (!strictUsernameRegex.test(username)) {
      setSetupError("الاسم المميز يجب أن يحتوي على حروف إنجليزية وأرقام فقط");
      return;
    }

    try {
      const { collection, query, where, getDocs } = await import("firebase/firestore");
      const q = query(collection(db, "users"), where("username", "==", username));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setSetupError("هذا الاسم محجوز بالفعل، اختر اسماً آخر");
        return;
      }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username,
        displayName,
        email: user.email || "",
        photoURL: user.photoURL || "",
        phoneNumber: setupData.phone,
        governorate: setupData.governorate,
        totalPoints: 0,
        quranPoints: 0,
        athkarPoints: 0,
        listenPoints: 0,
        streakDays: 0,
        badges: [],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isBanned: false
      });
      setHasProfile(true);
      setShowSetup(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      setSetupError("حدث خطأ أثناء حفظ البيانات، حاول مرة أخرى");
    }
  };

  // Loading state
  if (user === undefined) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[9999]">
        <div className="w-10 h-10 border-2 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin" />
      </div>
    );
  }

  // Authenticated and has profile OR skipped - render children
  if (isSkipped || (user && hasProfile === true)) {
    return <>{children}</>;
  }

  // Not logged in - show login screen
  if (!user) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 font-arabic overflow-hidden">
        {/* Cinematic Background */}
        <div className="absolute inset-0 bg-[#050505]">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37]/10 via-transparent to-[#d4af37]/5" />
          <div className="absolute inset-0 islamic-pattern opacity-[0.04] scale-150 rotate-12" />
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#d4af37]/10 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-[#d4af37]/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative w-full max-w-lg">
          {/* Decorative Corner Borders */}
          <div className="absolute -top-8 -left-8 w-20 h-20 border-t-2 border-l-2 border-[#d4af37]/30 rounded-tl-[2rem] pointer-events-none" />
          <div className="absolute -bottom-8 -right-8 w-20 h-20 border-b-2 border-r-2 border-[#d4af37]/30 rounded-br-[2rem] pointer-events-none" />

          <div className="relative bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-10 md:p-14 rounded-[3rem] flex flex-col items-center gap-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-700">
            
            {/* Logo */}
            <div className="relative">
              <div className="absolute inset-0 bg-[#d4af37]/30 blur-3xl rounded-full" />
              <div className="relative w-28 h-28 rounded-[2.5rem] bg-gradient-to-b from-[#d4af37]/20 to-[#d4af37]/5 border-2 border-[#d4af37]/20 flex items-center justify-center shadow-2xl">
                <img src="/logo/logo.png?v=10" alt="Logo" className="w-20 h-20 object-contain" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-black text-white tracking-tight">قرآن كريم</h1>
              <div className="flex items-center justify-center gap-3">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#d4af37]/40" />
                <p className="text-[#d4af37]/60 text-[10px] font-black uppercase tracking-[0.4em]">Welcome to the Holy Quran</p>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#d4af37]/40" />
              </div>
            </div>

            {/* Features Preview */}
            <div className="grid grid-cols-3 gap-4 w-full">
              {[
                { icon: BookOpen, label: "المصحف الكامل", color: "text-blue-400" },
                { icon: Trophy, label: "مسابقات ورانك", color: "text-amber-400" },
                { icon: Users, label: "مجتمع القرآن", color: "text-emerald-400" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-[9px] text-white/40 font-bold text-center leading-tight">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full group relative overflow-hidden py-5 bg-white text-black rounded-[2rem] font-black text-lg shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] hover:shadow-[0_25px_50px_-12px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              {isLoggingIn ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span>تسجيل الدخول بحساب جوجل</span>
                </>
              )}
            </button>

            <button
              onClick={handleSkip}
              className="w-full py-4 text-white/30 hover:text-[#d4af37] text-sm font-bold transition-all"
            >
              تخطي وتسجيل الدخول لاحقاً
            </button>

            <p className="text-[9px] text-white/15 font-bold text-center leading-relaxed">
              بتسجيل الدخول أنت توافق على شروط الاستخدام وسياسة الخصوصية
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Logged in but no profile - show profile setup
  if (showSetup || hasProfile === false) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-arabic overflow-y-auto">
        <div className="absolute inset-0 bg-black" />
        <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-[#d4af37]/30 rounded-[3rem] shadow-[0_0_50px_rgba(212,175,55,0.1)] p-10 flex flex-col items-center animate-in zoom-in-95 duration-500 my-8">
          
          {/* User Photo from Google */}
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-[2rem] border-4 border-[#d4af37]/20 p-1 bg-black overflow-hidden shadow-2xl">
              <img src={user.photoURL || "/logo/logo.png"} alt="Profile" className="w-full h-full object-cover rounded-[1.5rem]" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg border-2 border-black">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <h3 className="text-2xl font-black text-white mb-2">أهلاً بك يا {user.displayName?.split(' ')[0]}! 👋</h3>
          <p className="text-white/50 text-sm font-bold mb-8 text-center">أكمل بياناتك لتبدأ المنافسة وتجمع النقاط</p>

          <form onSubmit={handleProfileSubmit} className="w-full space-y-6">
            {setupError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold p-4 rounded-xl text-center animate-shake">{setupError}</div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                الاسم المستعار (يظهر للجميع)
              </label>
              <input 
                required maxLength={20}
                value={setupData.displayName}
                onChange={e => setSetupData({...setupData, displayName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all text-white placeholder-white/20"
                placeholder="مثلاً: خادم القرآن ✨"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                الاسم المميز (إنجليزي فقط)
              </label>
              <input 
                required maxLength={15}
                value={setupData.username}
                onChange={e => setSetupData({...setupData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all font-mono text-white placeholder-white/20"
                placeholder="مثلاً: youssef123"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                رقم الهاتف (للتواصل عند الفوز)
              </label>
              <input 
                required type="tel"
                value={setupData.phone}
                onChange={e => setSetupData({...setupData, phone: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all font-mono text-white placeholder-white/20"
                placeholder="01XXXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                المحافظة
              </label>
              <select 
                value={setupData.governorate}
                onChange={e => setSetupData({...setupData, governorate: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all appearance-none text-white"
              >
                {GOVERNORATES.map(gov => <option key={gov} value={gov} className="bg-[#111] text-white">{gov}</option>)}
              </select>
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-[#d4af37] text-black rounded-[2rem] font-black text-lg shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-95 transition-all mt-4"
            >
              🚀 بدء الاستخدام
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Profile loading
  if (hasProfile === null) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[9999]">
         <div className="w-10 h-10 border-2 border-[#d4af37]/20 border-t-[#d4af37] rounded-full animate-spin" />
      </div>
    );
  }

  return null;
}
