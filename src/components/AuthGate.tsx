"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  LogIn, Loader2, User, KeyRound, Eye, EyeOff, ShieldCheck, Compass, Check, ArrowLeft, Phone
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

interface AuthGateProps {
  children: React.ReactNode;
}

const AVATARS = {
  male: [
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Ahmed&top=shortFlat&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Omar&top=shortRound&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Ali&top=shortCurly&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Hassan&top=shortWaved&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Zaid&top=theCaesar&facialHairProbability=100&accessoriesProbability=0"
  ],
  female: [
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Aisha&top=hijab&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Fatima&top=hijab&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Mariam&top=hijab&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Khadija&top=hijab&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Zaynab&top=hijab&accessoriesProbability=0"
  ]
};

const ARAB_COUNTRIES = [
  { name: "مصر", flag: "🇪🇬" },
  { name: "السعودية", flag: "🇸🇦" },
  { name: "الإمارات", flag: "🇦🇪" },
  { name: "الكويت", flag: "🇰🇼" },
  { name: "المغرب", flag: "🇲🇦" },
  { name: "الجزائر", flag: "🇩🇿" },
  { name: "تونس", flag: "🇹🇳" },
  { name: "الأردن", flag: "🇯🇴" },
  { name: "فلسطين", flag: "🇵🇸" },
  { name: "قطر", flag: "🇶🇦" },
  { name: "عمان", flag: "🇴🇲" },
  { name: "البحرين", flag: "🇧🇭" },
  { name: "العراق", flag: "🇮🇶" },
  { name: "سوريا", flag: "🇸🇾" },
  { name: "لبنان", flag: "🇱🇧" },
  { name: "اليمن", flag: "🇾🇪" },
  { name: "ليبيا", flag: "🇱🇾" },
  { name: "السودان", flag: "🇸🇩" },
  { name: "موريتانيا", flag: "🇲🇷" },
  { name: "الصومال", flag: "🇸🇴" },
  { name: "جيبوتي", flag: "🇩🇯" },
  { name: "جزر القمر", flag: "🇰🇲" },
  { name: "أخرى", flag: "🌍" }
];

// Helper to create a subtle 3D hover effect (safe and clean)
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { ref, rotateX, rotateY, handleMouseMove, handleMouseLeave };
}

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [view, setView] = useState<"login" | "signupInfo" | "signupAvatar" | "forgotPassword" | "verifyOtp" | "resetPassword">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  // Login States
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Forgot Password States
  const [resetPhone, setResetPhone] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetUserId, setResetUserId] = useState("");
  const [resetUsername, setResetUsername] = useState("");
  const [recoveredPassword, setRecoveredPassword] = useState<string | null>(null);

  // Signup States
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    phone: "",
    password: "",
    gender: "male" as "male" | "female",
    avatar: AVATARS.male[0],
    country: "مصر"
  });

  const [isSkipped, setIsSkipped] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_skipped') === 'true';
    }
    return false;
  });

  useEffect(() => {
    const handleShowAuth = () => {
      setIsSkipped(false);
      localStorage.removeItem('auth_skipped');
    };
    window.addEventListener("show_auth_gate", handleShowAuth);
    return () => window.removeEventListener("show_auth_gate", handleShowAuth);
  }, []);

  const tilt = useTilt();

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u && db) {
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) setHasProfile(true);
          else setHasProfile(false);
        } catch (e) {
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
    if (!loginIdentifier || !loginPassword) return setError("يرجى ملء جميع الحقول");
    setIsLoggingIn(true);
    try {
      let username = "";
      const trimmedId = loginIdentifier.trim();
      const usernameQuery = query(collection(db, "users"), where("username", "==", trimmedId.toLowerCase()));
      const usernameSnap = await getDocs(usernameQuery);
      
      if (!usernameSnap.empty) username = usernameSnap.docs[0].data().username;
      else {
        const phoneQuery = query(collection(db, "users"), where("phoneNumber", "==", trimmedId));
        const phoneSnap = await getDocs(phoneQuery);
        if (!phoneSnap.empty) username = phoneSnap.docs[0].data().username;
      }
      if (!username) {
        setError("بيانات الدخول غير صحيحة");
        setIsLoggingIn(false);
        return;
      }
      await signInWithEmailAndPassword(auth, email, loginPassword);
      // Sync password for recovery if missing
      if (auth.currentUser) {
         await setDoc(doc(db, "users", auth.currentUser.uid), { encP: btoa(loginPassword) }, { merge: true });
      }
    } catch (err: any) {
      setError("كلمة المرور غير صحيحة أو الحساب غير موجود");
      setIsLoggingIn(false);
    }
  };

  const handleRegisterNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.displayName.trim().length < 2) return setError("يرجى إدخال اسمك بشكل صحيح");
    if (formData.username.trim().length < 3) return setError("الاسم المميز يجب أن يكون 3 أحرف على الأقل");
    if (formData.phone.trim().length < 10) return setError("يرجى إدخال رقم هاتف صحيح");
    if (formData.password.length < 6) return setError("كلمة المرور 6 أحرف على الأقل");

    setIsLoggingIn(true);
    try {
      const qUser = query(collection(db, "users"), where("username", "==", formData.username.trim().toLowerCase()));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) { setError("الاسم المميز محجوز"); setIsLoggingIn(false); return; }
      
      const qPhone = query(collection(db, "users"), where("phoneNumber", "==", formData.phone.trim()));
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty) { setError("رقم الهاتف مسجل مسبقاً"); setIsLoggingIn(false); return; }
      
      setView("signupAvatar");
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFinalSignup = async () => {
    setIsLoggingIn(true);
    try {
      const email = `${formData.username.trim().toLowerCase()}@quran.app`;
      const res = await createUserWithEmailAndPassword(auth, email, formData.password);
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        username: formData.username.trim().toLowerCase(),
        displayName: formData.displayName.trim(),
        phoneNumber: formData.phone.trim(),
        gender: formData.gender,
        country: formData.country,
        photoURL: formData.avatar,
        totalPoints: 0,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isBanned: false,
        encP: btoa(formData.password)
      });
      window.location.reload();
    } catch (err: any) {
      setError("حدث خطأ أثناء إنشاء الحساب");
      setIsLoggingIn(false);
    }
  };

  // --- FORGOT PASSWORD FLOW ---
  const handleSendWhatsAppOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (resetPhone.trim().length < 10) return setError("يرجى إدخال رقم هاتف صحيح");
    
    setIsLoggingIn(true);
    try {
      const phoneQuery = query(collection(db, "users"), where("phoneNumber", "==", resetPhone.trim()));
      const phoneSnap = await getDocs(phoneQuery);
      
      if (phoneSnap.empty) {
        setError("رقم الهاتف هذا غير مسجل لدينا");
        setIsLoggingIn(false);
        return;
      }

      const userData = phoneSnap.docs[0].data();
      setResetUserId(userData.uid);
      setResetUsername(userData.username);
      setRecoveredPassword(userData.encP ? atob(userData.encP) : null);
      
      // Generate 4 digit OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(otp);
      
      // Store OTP only in local state to bypass Firestore write permission rules for unauthenticated users
      setGeneratedOtp(otp);

      // Call our API endpoint to send the WhatsApp message
      const apiResponse = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: resetPhone.trim(), otp })
      });
      
      const apiData = await apiResponse.json();

      if (apiData.success) {
        if (apiData.mock) {
          alert(`[وضع التجربة للمطورين]\nتم توليد كود التحقق: ${otp}\n\nيرجى ربط حساب UltraMsg لإرسال رسائل حقيقية للمستخدمين.`);
        } else {
          alert("تم إرسال كود التحقق بنجاح إلى رقمك على واتساب ✅");
        }
        setIsLoggingIn(false);
        setView("verifyOtp");
      } else {
        setError(apiData.error || "فشل إرسال رسالة الواتساب");
        setIsLoggingIn(false);
      }
    } catch (err: any) {
      console.error("WhatsApp Send OTP Error Details:", err);
      setError(err.message || "حدث خطأ في النظام");
      setIsLoggingIn(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (resetOtp !== generatedOtp) {
      return setError("الكود غير صحيح، حاول مرة أخرى");
    }
    setView("resetPassword"); // We reuse the view name but change its UI to show the recovered password
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) return setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    if (!recoveredPassword) return setError("لا يمكن إعادة تعيين كلمة المرور لهذا الحساب القديم، تواصل مع الإدارة.");
    
    setIsLoggingIn(true);
    try {
      // 1. Sign in behind the scenes using the old password we recovered
      const email = `${resetUsername}@quran.app`;
      await signInWithEmailAndPassword(auth, email, recoveredPassword);
      
      // 2. Now that we are authenticated, we can actually change the Firebase password!
      if (auth.currentUser) {
         const { updatePassword } = await import("firebase/auth");
         await updatePassword(auth.currentUser, newPassword);
         
         // 3. Update the stored password in Firestore
         await setDoc(doc(db, "users", resetUserId), { 
           encP: btoa(newPassword)
         }, { merge: true });

         alert("تم تغيير كلمة المرور بنجاح! يمكنك الآن الدخول بكلمة المرور الجديدة.");
         setView("login");
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(err.message || "حدث خطأ أثناء تغيير كلمة المرور");
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isSkipped || (user && hasProfile === true)) {
    return <>{children}</>;
  }

  if (user === undefined) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[9999]">
         <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-2 border-transparent border-t-[#d4af37] border-r-[#d4af37] shadow-[0_0_30px_#d4af37]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-arabic bg-[#050505] overflow-hidden">
      {/* --- RICH GRAPHICS & ANIMATIONS BACKGROUND --- */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
         {/* 1. Pulsing Core Glow */}
         <motion.div 
           animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
           transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
           className="absolute w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] bg-[radial-gradient(circle,rgba(212,175,55,0.25)_0%,rgba(0,0,0,1)_70%)] rounded-full blur-[80px]"
         />
         
         {/* 2. Slow Spinning Islamic Geometric SVG */}
         <motion.svg
            className="absolute w-[150vw] md:w-[100vw] h-auto text-[#d4af37] opacity-[0.03]"
            viewBox="0 0 100 100"
            animate={{ rotate: 360 }}
            transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          >
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.1" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.1" strokeDasharray="1,1" />
            {Array.from({ length: 12 }).map((_, idx) => {
              const rotation = idx * 30;
              return (
                <g key={idx} transform={`rotate(${rotation} 50 50)`}>
                  <path d="M50 2 L58 40 L98 50 L58 60 L50 98 L42 60 L2 50 L42 40 Z" fill="none" stroke="currentColor" strokeWidth="0.15" />
                  <path d="M50 15 L55 42 L85 50 L55 58 L50 85 L45 58 L15 50 L45 42 Z" fill="none" stroke="currentColor" strokeWidth="0.08" />
                </g>
              );
            })}
          </motion.svg>

         {/* 3. Floating Dust Particles */}
         {Array.from({ length: 20 }).map((_, i) => (
           <motion.div
             key={`dust-${i}`}
             className="absolute w-1 h-1 bg-[#d4af37] rounded-full blur-[1px]"
             initial={{ 
               x: (Math.random() - 0.5) * window.innerWidth, 
               y: (Math.random() - 0.5) * window.innerHeight,
               opacity: Math.random() * 0.5 + 0.1
             }}
             animate={{ 
               y: [null, (Math.random() - 0.5) * window.innerHeight - 100],
               opacity: [null, 0.8, 0]
             }}
             transition={{ 
               duration: Math.random() * 10 + 10, 
               repeat: Infinity, 
               ease: "linear" 
             }}
           />
         ))}
      </div>

      {/* --- MAIN INTERACTIVE CARD --- */}
      <motion.div
        ref={tilt.ref}
        onMouseMove={tilt.handleMouseMove}
        onMouseLeave={tilt.handleMouseLeave}
        style={{ rotateX: tilt.rotateX, rotateY: tilt.rotateY, perspective: 1200 }}
        className="relative w-full max-w-md z-10"
      >
        <div className="relative w-full rounded-[2.5rem] p-8 md:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.9)] overflow-hidden bg-gradient-to-br from-[#121212]/90 to-[#0a0a0a]/95 backdrop-blur-3xl border border-white/[0.08]">
          {/* Edge Glow effect */}
          <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none border border-[#d4af37]/10" />
          
          <AnimatePresence mode="wait">
            {/* ======================================= */}
            {/* LOGIN VIEW */}
            {/* ======================================= */}
            {view === "login" && (
              <motion.div 
                key="login"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -10 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="flex flex-col items-center"
              >
                {/* Animated Logo */}
                <motion.div 
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-28 h-28 mb-6 relative flex items-center justify-center group"
                >
                  <div className="absolute inset-0 bg-[#d4af37]/20 blur-2xl rounded-full group-hover:scale-110 transition-transform duration-700" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-2 border border-dashed border-[#d4af37]/30 rounded-full"
                  />
                  <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.4)] mix-blend-lighten z-10 relative" />
                </motion.div>

                <div className="text-center space-y-2 w-full">
                  <h1 className="text-3xl font-black bg-gradient-to-r from-white via-[#ffe8a3] to-[#d4af37] bg-clip-text text-transparent">تسجيل الدخول</h1>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">الاستوديو القرآني الفاخر</p>
                </div>

                <form onSubmit={handleLogin} className="w-full space-y-4 mt-8">
                  <InputField icon={<User />} type="text" value={loginIdentifier} onChange={setLoginIdentifier} placeholder="اسم المستخدم أو الهاتف" />
                  <InputField icon={<KeyRound />} type="password" value={loginPassword} onChange={setLoginPassword} placeholder="••••••••" showEye={true} showPassword={showPassword} setShowPassword={setShowPassword} />
                  
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                      {error}
                    </motion.p>
                  )}
                  
                  <div className="pt-2">
                    <InteractiveButton type="submit" loading={isLoggingIn} text="تسجيل الدخول" />
                  </div>
                  
                  {/* Footer Links with Forgot Password */}
                  <div className="flex justify-between items-center w-full px-2 mt-6">
                    <button type="button" onClick={() => { setView("forgotPassword"); setError(""); }} className="text-[11px] font-bold text-white/30 hover:text-[#d4af37] transition-colors relative group">
                      نسيت كلمة المرور؟
                      <span className="absolute -bottom-1 right-0 w-0 h-[1px] bg-[#d4af37] transition-all group-hover:w-full" />
                    </button>
                    
                    <button type="button" onClick={() => setView("signupInfo")} className="text-[11px] font-black text-[#d4af37] flex items-center gap-1 hover:gap-2 transition-all">
                      إنشاء حساب <ArrowLeft className="w-3 h-3" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ======================================= */}
            {/* FORGOT PASSWORD VIEW */}
            {/* ======================================= */}
            {view === "forgotPassword" && (
              <motion.div 
                key="forgotPassword"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -10 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="text-center mb-6 w-full">
                  <div className="w-16 h-16 mx-auto bg-[#d4af37]/10 rounded-full flex items-center justify-center mb-4 border border-[#d4af37]/20">
                    <ShieldCheck className="w-8 h-8 text-[#d4af37]" />
                  </div>
                  <h2 className="text-3xl font-black text-white">استعادة الحساب</h2>
                  <p className="text-white/40 text-xs mt-2 leading-relaxed">أدخل رقم هاتفك المسجل وسنرسل لك<br/>رمز التحقق عبر واتساب</p>
                </div>
                
                <form onSubmit={handleSendWhatsAppOtp} className="w-full space-y-4">
                  <InputField icon={<Phone />} type="tel" value={resetPhone} onChange={setResetPhone} placeholder="رقم الهاتف (010XXXXXXX)" dir="ltr" />
                  
                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg">{error}</motion.p>}
                  
                  <div className="pt-4">
                    <InteractiveButton type="submit" loading={isLoggingIn} text="إرسال الكود عبر واتساب" />
                  </div>
                  
                  <button type="button" onClick={() => setView("login")} className="w-full mt-2 text-xs font-bold text-white/30 hover:text-white transition-colors">
                    إلغاء والعودة
                  </button>
                </form>
              </motion.div>
            )}

            {/* ======================================= */}
            {/* VERIFY OTP VIEW */}
            {/* ======================================= */}
            {view === "verifyOtp" && (
              <motion.div 
                key="verifyOtp"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -10 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="text-center mb-6 w-full">
                  <h2 className="text-3xl font-black text-white">رمز التحقق</h2>
                  <p className="text-[#d4af37] text-xs mt-2">أدخل الرمز المكون من 4 أرقام<br/>المرسل إلى رقمك عبر واتساب</p>
                </div>
                
                <form onSubmit={handleVerifyOtp} className="w-full space-y-4">
                  <InputField icon={<KeyRound />} type="number" value={resetOtp} onChange={setResetOtp} placeholder="----" dir="ltr" />
                  
                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg">{error}</motion.p>}
                  
                  <div className="pt-4">
                    <InteractiveButton type="submit" text="تأكيد الرمز" />
                  </div>
                  
                  <button type="button" onClick={() => setView("forgotPassword")} className="w-full mt-2 text-xs font-bold text-white/30 hover:text-white transition-colors">
                    إعادة إرسال الرمز
                  </button>
                </form>
              </motion.div>
            )}

            {/* ======================================= */}
            {/* RESET PASSWORD VIEW */}
            {/* ======================================= */}
            {view === "resetPassword" && (
              <motion.div 
                key="resetPassword"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -10 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="text-center mb-6 w-full">
                  <h2 className="text-3xl font-black text-[#d4af37]">كلمة مرور جديدة</h2>
                  <p className="text-white/40 text-xs mt-2">أدخل كلمة المرور الجديدة لحسابك<br/>({resetUsername})</p>
                </div>
                
                <div className="w-full space-y-4">
                  {recoveredPassword ? (
                    <form onSubmit={handleResetPassword} className="w-full space-y-4">
                      <InputField icon={<KeyRound />} type="password" value={newPassword} onChange={setNewPassword} placeholder="كلمة المرور الجديدة" showEye={true} showPassword={showPassword} setShowPassword={setShowPassword} />
                      
                      {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg">{error}</motion.p>}
                      
                      <div className="pt-4">
                        <InteractiveButton type="submit" loading={isLoggingIn} text="تأكيد وحفظ" />
                      </div>
                    </form>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
                       <p className="text-xs text-white/80 font-bold leading-relaxed">
                          عذراً، هذا الحساب قديم ولم نتمكن من استعادة كلمة المرور تلقائياً.<br/>
                          يرجى التواصل مع الدعم الفني على الواتساب للمساعدة.
                       </p>
                       <div className="pt-4">
                         <InteractiveButton type="button" onClick={() => setView("login")} text="العودة لتسجيل الدخول" />
                       </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}


            {/* ======================================= */}
            {/* SIGNUP INFO VIEW */}
            {/* ======================================= */}
            {view === "signupInfo" && (
              <motion.div 
                key="signupInfo"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -10 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="text-center mb-6 w-full">
                  <h2 className="text-3xl font-black text-white">حساب جديد</h2>
                  <p className="text-[#d4af37] text-xs mt-1">المعلومات الأساسية</p>
                </div>
                
                <form onSubmit={handleRegisterNext} className="w-full space-y-4">
                  <InputField icon={<User />} type="text" value={formData.displayName} onChange={(v) => setFormData({...formData, displayName: v})} placeholder="الاسم الحقيقي" />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <InputField icon={<User />} type="text" value={formData.username} onChange={(v) => setFormData({...formData, username: v.toLowerCase().replace(/[^a-z0-9_]/g, '')})} placeholder="youssef_1" dir="ltr" />
                    <InputField icon={<Phone />} type="tel" value={formData.phone} onChange={(v) => setFormData({...formData, phone: v})} placeholder="رقم الهاتف" dir="ltr" />
                  </div>
                  
                  <InputField icon={<KeyRound />} type="password" value={formData.password} onChange={(v) => setFormData({...formData, password: v})} placeholder="كلمة المرور" />
                  
                  <div className="relative z-50">
                    <CountrySelect value={formData.country} onChange={(val) => setFormData({...formData, country: val})} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button type="button" onClick={() => setFormData({...formData, gender: "male"})} className={`py-3 rounded-2xl border-2 transition-all ${formData.gender === "male" ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]" : "border-white/5 text-white/40 hover:bg-white/5"}`}>👨 ذكر</button>
                    <button type="button" onClick={() => setFormData({...formData, gender: "female"})} className={`py-3 rounded-2xl border-2 transition-all ${formData.gender === "female" ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]" : "border-white/5 text-white/40 hover:bg-white/5"}`}>👩 أنثى</button>
                  </div>

                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg">{error}</motion.p>}
                  
                  <div className="pt-4">
                    <InteractiveButton type="submit" loading={isLoggingIn} text="التالي" />
                  </div>
                  
                  <button type="button" onClick={() => setView("login")} className="w-full mt-2 text-xs font-bold text-white/30 hover:text-white transition-colors">
                    العودة لتسجيل الدخول
                  </button>
                </form>
              </motion.div>
            )}

            {/* ======================================= */}
            {/* SIGNUP AVATAR VIEW */}
            {/* ======================================= */}
            {view === "signupAvatar" && (
              <motion.div 
                key="signupAvatar"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -10 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="flex flex-col items-center w-full"
              >
                <div className="text-center mb-6 w-full">
                  <h2 className="text-3xl font-black text-white">الصورة الرمزية</h2>
                  <p className="text-[#d4af37] text-xs mt-1">اختر ما يعبر عنك</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6 w-full justify-items-center">
                  {AVATARS[formData.gender].slice(0, 6).map((url, i) => (
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      key={i}
                      onClick={() => setFormData({ ...formData, avatar: url })}
                      className={`relative w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] p-1 transition-all duration-300 ${formData.avatar === url ? "bg-gradient-to-br from-[#f5d76e] to-[#b38f24] shadow-[0_0_20px_rgba(212,175,55,0.4)]" : "bg-white/5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100"}`}
                    >
                      <img src={url} alt="Avatar" className="w-full h-full object-cover rounded-[1.3rem] bg-[#111]" />
                      {formData.avatar === url && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-black rounded-full p-1 border border-[#d4af37] shadow-lg z-20">
                          <Check className="w-4 h-4 text-[#d4af37]" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
                
                <div className="flex gap-3 w-full mt-2">
                  <button onClick={() => setView("signupInfo")} className="w-1/3 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all text-sm">رجوع</button>
                  <div className="w-2/3"><InteractiveButton type="button" onClick={handleFinalSignup} loading={isLoggingIn} text="انطلق 🚀" /></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Skip Button */}
      <div className="fixed bottom-6 w-full flex justify-center z-20">
        <button 
          onClick={() => {
            setIsSkipped(true);
            localStorage.setItem('auth_skipped', 'true');
          }} 
          className="group text-white/20 hover:text-white/60 text-[10px] font-black tracking-[0.3em] transition-colors relative pb-1"
        >
          الدخول كزائر مؤقتاً
          <span className="absolute bottom-0 right-0 w-0 h-[1px] bg-white/40 transition-all group-hover:w-full" />
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shine {
          100% { transform: translateX(200%); }
        }
        .animate-shine {
          animation: shine 2s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}} />
    </div>
  );
}

// ---------------------------------------------------------
// Sub-Components for UI
// ---------------------------------------------------------

function InputField({ icon, type, value, onChange, placeholder, dir = "rtl", showEye = false, showPassword, setShowPassword }: any) {
  return (
    <div className="relative group">
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#d4af37] transition-all [&>svg]:w-5 [&>svg]:h-5 group-focus-within:scale-110">
        {icon}
      </div>
      <input
        required
        type={showEye && !showPassword ? "password" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pr-12 pl-4 text-sm text-white outline-none focus:border-[#d4af37]/60 focus:bg-white/[0.04] focus:shadow-[0_0_15px_rgba(212,175,55,0.1)] transition-all placeholder:text-white/20 font-bold"
      />
      {showEye && (
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-[#d4af37] hover:scale-110 transition-all">
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

function InteractiveButton({ type, onClick, loading, text }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={loading}
      className="relative w-full py-4.5 bg-gradient-to-r from-[#b38f24] via-[#f5d76e] to-[#b38f24] text-black rounded-2xl font-black text-lg overflow-hidden shadow-[0_10px_30px_rgba(212,175,55,0.25)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.4)] transition-shadow group"
      style={{ backgroundSize: '200% auto' }}
      animate={{ backgroundPosition: ['0% center', '200% center'] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    >
      <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -translate-x-full group-hover:animate-shine" />
      <div className="relative flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : text}
      </div>
    </motion.button>
  );
}

function CountrySelect({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = ARAB_COUNTRIES.find(c => c.name === value) || ARAB_COUNTRIES[0];

  return (
    <div className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/[0.02] border ${isOpen ? 'border-[#d4af37]/60' : 'border-white/5'} rounded-2xl py-4 pr-12 pl-4 text-sm text-white outline-none hover:border-[#d4af37]/60 hover:bg-white/[0.04] transition-all cursor-pointer font-bold flex items-center justify-between group`}
      >
        <div className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all ${isOpen ? 'text-[#d4af37]' : 'text-white/20 group-hover:text-[#d4af37]'}`}>
          <Compass className="w-5 h-5" />
        </div>
        <span className="flex items-center gap-2 text-[#d4af37]">
          <span>{selected.name}</span>
          <span className="text-xl">{selected.flag}</span>
        </span>
        <span className={`text-white/40 text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-xl border border-[#d4af37]/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-h-56 overflow-y-auto no-scrollbar z-[999] p-2 flex flex-col gap-1"
          >
            {ARAB_COUNTRIES.map(country => (
              <button
                key={country.name}
                type="button"
                onClick={() => {
                  onChange(country.name);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${value === country.name ? 'bg-gradient-to-r from-[#d4af37]/20 to-transparent text-[#d4af37] border border-[#d4af37]/20' : 'text-white hover:bg-white/5 hover:pr-4'}`}
              >
                <span className="font-bold text-sm">{country.name}</span>
                <span className="text-lg">{country.flag}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

