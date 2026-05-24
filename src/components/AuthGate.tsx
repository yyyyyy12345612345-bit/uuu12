"use client";

import React, { useState, useEffect } from "react";
import { 
  LogIn, Loader2, User, KeyRound, Eye, EyeOff, ShieldCheck, Check, ArrowLeft, Phone, Sparkles
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

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

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [view, setView] = useState<"login" | "signupInfo" | "signupAvatar" | "forgotPassword" | "verifyOtp" | "resetPassword" | "verifySignupOtp" | "selectAccount">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  // Multi-Account States
  const [matchingAccounts, setMatchingAccounts] = useState<any[]>([]);
  const [multiAccountAction, setMultiAccountAction] = useState<"login" | "forgotPassword">("login");

  // Login States
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Forgot Password & Signup Verification States
  const [resetPhone, setResetPhone] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [signupOtp, setSignupOtp] = useState("");
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
  const [showWeakPasswordWarning, setShowWeakPasswordWarning] = useState(false);

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
      const trimmedId = loginIdentifier.trim();
      let email = "";

      // 1. Check if the user entered a real email directly (with @ symbol, but not @quran.app)
      if (trimmedId.includes("@") && !trimmedId.toLowerCase().endsWith("@quran.app")) {
        // We can search if there is a username matching the part before @
        const searchUsername = trimmedId.split("@")[0].toLowerCase();
        const usernameQuery = query(collection(db, "users"), where("username", "==", searchUsername));
        const usernameSnap = await getDocs(usernameQuery);
        
        if (!usernameSnap.empty) {
          email = `${usernameSnap.docs[0].data().username}@quran.app`;
        } else {
          // If no custom username found, fall back to trying direct email login (e.g. standard email accounts like admin)
          email = trimmedId;
        }
      } else {
        // 2. Standard username/phone translation
        let username = "";
        const searchId = trimmedId.replace("@quran.app", "");
        
        const usernameQuery = query(collection(db, "users"), where("username", "==", searchId.toLowerCase()));
        const usernameSnap = await getDocs(usernameQuery);
        
        if (!usernameSnap.empty) {
          username = usernameSnap.docs[0].data().username;
        } else {
          const phoneQuery = query(collection(db, "users"), where("phoneNumber", "==", trimmedId));
          const phoneSnap = await getDocs(phoneQuery);
          if (!phoneSnap.empty) {
            if (phoneSnap.docs.length > 1) {
              setMatchingAccounts(phoneSnap.docs.map(doc => doc.data()));
              setMultiAccountAction("login");
              setView("selectAccount");
              setIsLoggingIn(false);
              return;
            } else {
              username = phoneSnap.docs[0].data().username;
            }
          }
        }

        if (username) {
          email = `${username.toLowerCase()}@quran.app`;
        } else {
          email = trimmedId; // Fallback to raw input
        }
      }

      await signInWithEmailAndPassword(auth, email, loginPassword);
      // Sync password for recovery if missing
      if (auth.currentUser) {
         await setDoc(doc(db, "users", auth.currentUser.uid), { encP: btoa(loginPassword) }, { merge: true });
      }
    } catch (err: any) {
      setError("بيانات الدخول غير صحيحة أو الحساب غير موجود");
      setIsLoggingIn(false);
    }
  };

  const handleRegisterNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.displayName.trim().length < 2) return setError("يرجى إدخال اسمك بشكل صحيح");
    if (formData.username.trim().length < 3) return setError("الاسم المميز يجب أن يكون 3 أحرف على الأقل");
    if (formData.password.length < 6) return setError("كلمة المرور 6 أحرف على الأقل");

    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
    const isPasswordStrong = hasUpperCase && hasLowerCase && hasNumber && hasSymbol;

    if (!isPasswordStrong && !showWeakPasswordWarning) {
      setError("كلمة المرور ضعيفة. يفضل احتوائها على حرف كبير وصغير ورقم ورمز. اضغط 'التالي' مجدداً للمتابعة على أي حال.");
      setShowWeakPasswordWarning(true);
      return;
    }

    setIsLoggingIn(true);
    try {
      const qUser = query(collection(db, "users"), where("username", "==", formData.username.trim().toLowerCase()));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) { setError("الاسم المميز محجوز"); setIsLoggingIn(false); return; }

      const hasPhone = formData.phone.trim().length >= 10;

      if (hasPhone) {
        const apiResponse = await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: formData.phone.trim(), reason: "تأكيد رقم الهاتف للتسجيل" })
        });

        const apiData = await apiResponse.json();

        if (apiData.success) {
          setView("verifySignupOtp");
          setIsLoggingIn(false);
          return;
        } else {
          setError(apiData.error || "فشل إرسال كود التحقق");
          setIsLoggingIn(false);
          return;
        }
      }

      setView("signupAvatar");
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone.trim(), code: signupOtp })
      });
      const data = await res.json();
      if (data.success) {
        setView("signupAvatar");
      } else {
        setError(data.error || "الكود غير صحيح");
      }
    } catch {
      setError("فشل التحقق من الكود");
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

      if (phoneSnap.docs.length > 1) {
        setMatchingAccounts(phoneSnap.docs.map(doc => doc.data()));
        setMultiAccountAction("forgotPassword");
        setView("selectAccount");
        setIsLoggingIn(false);
        return;
      }

      const userData = phoneSnap.docs[0].data();
      setResetUserId(userData.uid);
      setResetUsername(userData.username);
      setRecoveredPassword(userData.encP ? atob(userData.encP) : null);
      
      // Call API to send OTP via WhatsApp
      const apiResponse = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: resetPhone.trim(), reason: "استعادة كلمة المرور" })
      });
      
      const apiData = await apiResponse.json();

      if (apiData.success) {
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

  const handleSelectAccount = async (accountData: any) => {
    setError("");
    setIsLoggingIn(true);
    if (multiAccountAction === "login") {
      try {
        const email = `${accountData.username}@quran.app`;
        await signInWithEmailAndPassword(auth, email, loginPassword);
        if (auth.currentUser) {
           await setDoc(doc(db, "users", auth.currentUser.uid), { encP: btoa(loginPassword) }, { merge: true });
        }
      } catch (err) {
        setError("كلمة المرور غير صحيحة لهذا الحساب");
        setIsLoggingIn(false);
      }
    } else {
      setResetUserId(accountData.uid);
      setResetUsername(accountData.username);
      setRecoveredPassword(accountData.encP ? atob(accountData.encP) : null);

      try {
        const apiResponse = await fetch("/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: resetPhone.trim(), reason: "استعادة كلمة المرور" })
        });
        
        const apiData = await apiResponse.json();

        if (apiData.success) {
          setIsLoggingIn(false);
          setView("verifyOtp");
        } else {
          setError(apiData.error || "فشل إرسال رسالة الواتساب");
          setIsLoggingIn(false);
        }
      } catch (err: any) {
        setError(err.message || "حدث خطأ في النظام");
        setIsLoggingIn(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: resetPhone.trim(), code: resetOtp })
      });
      const data = await res.json();
      if (data.success) {
        setView("resetPassword");
      } else {
        setError(data.error || "الكود غير صحيح");
      }
    } catch {
      setError("فشل التحقق من الكود");
    } finally {
      setIsLoggingIn(false);
    }
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
      <div className="fixed inset-0 bg-gradient-to-br from-[#0b0f1a] via-[#0f0a1a] to-[#0a0f0f] flex items-center justify-center z-[9999]">
         <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#fbbf24] border-r-[#f59e0b] animate-spin shadow-[0_0_15px_rgba(251,191,36,0.3)]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-arabic bg-gradient-to-br from-[#0b0f1a] via-[#0f0a1a] to-[#0a0f0f] overflow-hidden">
      {/* Warm ambient glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(245,158,11,0.08)_0%,transparent_70%)] rounded-full" />
        <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(20,184,166,0.06)_0%,transparent_70%)] rounded-full" />
      </div>

      {/* Subtle dot grid overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* --- MAIN CARD --- */}
      <div className="relative w-full max-w-md z-10">
        <div className="relative w-full rounded-[2rem] p-6 md:p-9 shadow-2xl backdrop-blur-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
          <AnimatePresence mode="wait">
            {/* ======================================= */}
            {/* LOGIN VIEW */}
            {/* ======================================= */}
            {view === "login" && (
              <motion.div 
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                {/* Logo */}
                <div className="w-20 h-20 mb-5 relative mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#fbbf24]/20 to-[#f59e0b]/5 blur-2xl rounded-full" />
                  <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#fbbf24]/10 to-transparent p-3 border border-[#fbbf24]/20">
                    <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="text-center space-y-1.5 w-full mb-2">
                  <h1 className="text-[28px] font-black text-white/90 tracking-tight">تسجيل الدخول</h1>
                  <p className="text-white/25 text-[11px] font-bold tracking-wider">الاستوديو القرآني</p>
                </div>

                <form onSubmit={handleLogin} className="w-full space-y-3.5 mt-5">
                  <InputField icon={<User />} type="text" value={loginIdentifier} onChange={setLoginIdentifier} placeholder="اسم المستخدم أو الهاتف" />
                  <InputField icon={<KeyRound />} type="password" value={loginPassword} onChange={setLoginPassword} placeholder="••••••••" showEye={true} showPassword={showPassword} setShowPassword={setShowPassword} />
                  
                  {error && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2.5 rounded-2xl border border-red-500/15">
                      {error}
                    </motion.p>
                  )}
                  
                  <div className="pt-1">
                    <InteractiveButton type="submit" loading={isLoggingIn} text="تسجيل الدخول" />
                  </div>
                  
                  {/* Footer Links */}
                  <div className="flex justify-between items-center w-full px-1 mt-5">
                    <button type="button" onClick={() => { setView("forgotPassword"); setError(""); }} className="text-[11px] font-bold text-white/25 hover:text-[#fbbf24] transition-colors">
                      نسيت كلمة المرور؟
                    </button>
                    
                    <button type="button" onClick={() => setView("signupInfo")} className="text-[11px] font-black text-[#fbbf24] flex items-center gap-1.5 hover:gap-2.5 transition-all">
                      إنشاء حساب <ArrowLeft className="w-3 h-3" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ======================================= */}
            {/* SELECT ACCOUNT VIEW */}
            {/* ======================================= */}
            {view === "selectAccount" && (
              <motion.div 
                key="selectAccount"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center w-full"
              >
                <div className="text-center mb-5 w-full">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[#fbbf24]/20 to-transparent rounded-2xl flex items-center justify-center mb-4 border border-[#fbbf24]/20">
                    <ShieldCheck className="w-6 h-6 text-[#fbbf24]" />
                  </div>
                  <h2 className="text-2xl font-black text-white/90">اختر الحساب</h2>
                  <p className="text-[#fbbf24]/60 text-xs mt-1.5 leading-relaxed">وجدنا أكثر من حساب مرتبط بهذا الرقم</p>
                </div>
                
                <div className="w-full space-y-2.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                  {matchingAccounts.map((acc, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectAccount(acc)}
                      className="w-full bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] hover:border-[#fbbf24]/40 rounded-2xl p-3.5 flex items-center justify-between transition-all group text-right"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 group-hover:border-[#fbbf24]/30 transition-colors bg-gradient-to-br from-[#fbbf24]/5 to-transparent">
                          <img src={acc.photoURL || AVATARS.male[0]} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white/80 group-hover:text-[#fbbf24] transition-colors">{acc.displayName}</span>
                          <span className="text-[10px] text-white/30">@{acc.username}</span>
                        </div>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-white/20 group-hover:text-[#fbbf24] group-hover:-translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>

                {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2.5 rounded-2xl mt-4 w-full border border-red-500/15">{error}</motion.p>}
                
                <button type="button" onClick={() => { setView("login"); setError(""); }} className="w-full mt-5 text-xs font-bold text-white/25 hover:text-white/60 transition-colors">
                  إلغاء والعودة
                </button>
              </motion.div>
            )}

            {/* ======================================= */}
            {/* FORGOT PASSWORD VIEW */}
            {/* ======================================= */}
            {view === "forgotPassword" && (
              <motion.div 
                key="forgotPassword"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <div className="text-center mb-5 w-full">
                  <div className="w-14 h-14 mx-auto bg-gradient-to-br from-[#fbbf24]/15 to-transparent rounded-2xl flex items-center justify-center mb-4 border border-[#fbbf24]/20">
                    <ShieldCheck className="w-7 h-7 text-[#fbbf24]" />
                  </div>
                  <h2 className="text-2xl font-black text-white/90">استعادة الحساب</h2>
                  <p className="text-white/30 text-xs mt-1.5 leading-relaxed">أدخل رقم هاتفك المسجل وسنرسل رمز التحقق عبر واتساب</p>
                </div>
                
                <form onSubmit={handleSendWhatsAppOtp} className="w-full space-y-3.5">
                  <InputField icon={<Phone />} type="tel" value={resetPhone} onChange={setResetPhone} placeholder="رقم الهاتف (010XXXXXXX)" dir="ltr" />
                  
                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2.5 rounded-2xl border border-red-500/15">{error}</motion.p>}
                  
                  <div className="pt-3">
                    <InteractiveButton type="submit" loading={isLoggingIn} text="إرسال الكود عبر واتساب" />
                  </div>
                  
                  <button type="button" onClick={() => setView("login")} className="w-full mt-1 text-xs font-bold text-white/25 hover:text-white/60 transition-colors">
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <div className="text-center mb-5 w-full">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[#fbbf24]/15 to-transparent rounded-2xl flex items-center justify-center mb-4 border border-[#fbbf24]/20">
                    <ShieldCheck className="w-6 h-6 text-[#fbbf24]" />
                  </div>
                  <h2 className="text-2xl font-black text-white/90">رمز التحقق</h2>
                  <p className="text-[#fbbf24]/60 text-xs mt-1.5">أدخل الرمز المكون من 4 أرقام المرسل إلى رقمك</p>
                </div>
                
                <form onSubmit={handleVerifyOtp} className="w-full space-y-3.5">
                  <InputField icon={<KeyRound />} type="number" value={resetOtp} onChange={setResetOtp} placeholder="----" dir="ltr" />
                  
                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2.5 rounded-2xl border border-red-500/15">{error}</motion.p>}
                  
                  <div className="pt-3">
                    <InteractiveButton type="submit" text="تأكيد الرمز" />
                  </div>
                  
                  <button type="button" onClick={() => setView("forgotPassword")} className="w-full mt-1 text-xs font-bold text-white/25 hover:text-white/60 transition-colors">
                    إعادة إرسال الرمز
                  </button>
                </form>
              </motion.div>
            )}

            {view === "verifySignupOtp" && (
              <motion.div 
                key="verifySignupOtp"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <div className="text-center mb-5 w-full">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[#fbbf24]/15 to-transparent rounded-2xl flex items-center justify-center mb-4 border border-[#fbbf24]/20">
                    <ShieldCheck className="w-6 h-6 text-[#fbbf24]" />
                  </div>
                  <h2 className="text-2xl font-black text-white/90">تأكيد رقم الهاتف</h2>
                  <p className="text-[#fbbf24]/60 text-xs mt-1.5">أدخل الرمز المكون من 6 أرقام المرسل إلى رقمك</p>
                </div>
                
                <form onSubmit={handleVerifySignupOtp} className="w-full space-y-3.5">
                  <InputField icon={<KeyRound />} type="number" value={signupOtp} onChange={setSignupOtp} placeholder="----" dir="ltr" />
                  
                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2.5 rounded-2xl border border-red-500/15">{error}</motion.p>}
                  
                  <div className="pt-3">
                    <InteractiveButton type="submit" text="تأكيد ومتابعة" />
                  </div>
                  
                  <button type="button" onClick={() => setView("signupInfo")} className="w-full mt-1 text-xs font-bold text-white/25 hover:text-white/60 transition-colors">
                    العودة
                  </button>
                </form>
              </motion.div>
            )}

            {view === "resetPassword" && (
              <motion.div 
                key="resetPassword"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <div className="text-center mb-5 w-full">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[#fbbf24]/15 to-transparent rounded-2xl flex items-center justify-center mb-4 border border-[#fbbf24]/20">
                    <KeyRound className="w-6 h-6 text-[#fbbf24]" />
                  </div>
                  <h2 className="text-2xl font-black text-white/90">كلمة مرور جديدة</h2>
                  <p className="text-white/30 text-xs mt-1.5">أدخل كلمة المرور الجديدة لحسابك</p>
                </div>
                
                <div className="w-full space-y-4">
                  {recoveredPassword ? (
                    <form onSubmit={handleResetPassword} className="w-full space-y-3.5">
                      <InputField icon={<KeyRound />} type="password" value={newPassword} onChange={setNewPassword} placeholder="كلمة المرور الجديدة" showEye={true} showPassword={showPassword} setShowPassword={setShowPassword} />
                      
                      {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2.5 rounded-2xl border border-red-500/15">{error}</motion.p>}
                      
                      <div className="pt-3">
                        <InteractiveButton type="submit" loading={isLoggingIn} text="تأكيد وحفظ" />
                      </div>
                    </form>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 text-center">
                       <p className="text-xs text-white/70 font-bold leading-relaxed">
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
            {/* VERIFY SIGNUP OTP VIEW */}
            {/* ======================================= */}
            {view === "verifySignupOtp" && (
              <motion.div 
                key="verifySignupOtp"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -10 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="text-center mb-6 w-full">
                  <h2 className="text-3xl font-black text-white">تأكيد رقم الهاتف</h2>
                  <p className="text-[#d4af37] text-xs mt-2">أدخل الرمز المكون من 6 أرقام<br/>المرسل إلى رقمك عبر واتساب</p>
                </div>
                
                <form onSubmit={handleVerifySignupOtp} className="w-full space-y-4">
                  <InputField icon={<KeyRound />} type="number" value={signupOtp} onChange={setSignupOtp} placeholder="----" dir="ltr" />
                  
                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg">{error}</motion.p>}
                  
                  <div className="pt-4">
                    <InteractiveButton type="submit" text="تأكيد ومتابعة" />
                  </div>
                  
                  <button type="button" onClick={() => setView("signupInfo")} className="w-full mt-2 text-xs font-bold text-white/30 hover:text-white transition-colors">
                    العودة
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                <div className="text-center mb-4 w-full">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[#fbbf24]/15 to-transparent rounded-2xl flex items-center justify-center mb-3 border border-[#fbbf24]/20">
                    <Sparkles className="w-6 h-6 text-[#fbbf24]" />
                  </div>
                  <h2 className="text-2xl font-black text-white/90">حساب جديد</h2>
                  <p className="text-white/30 text-[11px] mt-1">المعلومات الأساسية</p>
                </div>
                
                <form onSubmit={handleRegisterNext} className="w-full space-y-3.5">
                  <InputField icon={<User />} type="text" value={formData.displayName} onChange={(v) => setFormData({...formData, displayName: v})} placeholder="الاسم الحقيقي" />
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <InputField icon={<User />} type="text" value={formData.username} onChange={(v) => setFormData({...formData, username: v.toLowerCase().replace(/[^a-z0-9_]/g, '')})} placeholder="youssef_1" dir="ltr" />
                    <InputField icon={<Phone />} type="tel" value={formData.phone} onChange={(v) => setFormData({...formData, phone: v})} placeholder="رقم الهاتف" dir="ltr" />
                  </div>
                  
                  <InputField icon={<KeyRound />} type="password" value={formData.password} onChange={(v) => {
                    setFormData({...formData, password: v});
                    setShowWeakPasswordWarning(false);
                    if (error.includes("ضعيفة")) setError("");
                  }} placeholder="كلمة المرور" />
                  
                  {/* Password Strength Indicator */}
                  <div className="flex justify-between text-[10px] w-full px-0.5 pt-0.5">
                    <span className={`flex items-center gap-1 transition-colors ${/[A-Z]/.test(formData.password) ? 'text-emerald-400' : 'text-white/25'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-colors ${/[A-Z]/.test(formData.password) ? 'bg-emerald-400/20' : 'bg-white/10'}`}>
                        {/[A-Z]/.test(formData.password) ? <Check className="w-1.5 h-1.5" /> : <div className="w-0.5 h-0.5 rounded-full bg-white/30" />}
                      </div>
                      حرف كبير
                    </span>
                    <span className={`flex items-center gap-1 transition-colors ${/[a-z]/.test(formData.password) ? 'text-emerald-400' : 'text-white/25'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-colors ${/[a-z]/.test(formData.password) ? 'bg-emerald-400/20' : 'bg-white/10'}`}>
                        {/[a-z]/.test(formData.password) ? <Check className="w-1.5 h-1.5" /> : <div className="w-0.5 h-0.5 rounded-full bg-white/30" />}
                      </div>
                      حرف صغير
                    </span>
                    <span className={`flex items-center gap-1 transition-colors ${/[0-9]/.test(formData.password) ? 'text-emerald-400' : 'text-white/25'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-colors ${/[0-9]/.test(formData.password) ? 'bg-emerald-400/20' : 'bg-white/10'}`}>
                        {/[0-9]/.test(formData.password) ? <Check className="w-1.5 h-1.5" /> : <div className="w-0.5 h-0.5 rounded-full bg-white/30" />}
                      </div>
                      رقم
                    </span>
                    <span className={`flex items-center gap-1 transition-colors ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-emerald-400' : 'text-white/25'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-colors ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'bg-emerald-400/20' : 'bg-white/10'}`}>
                        {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? <Check className="w-1.5 h-1.5" /> : <div className="w-0.5 h-0.5 rounded-full bg-white/30" />}
                      </div>
                      رمز
                    </span>
                  </div>
                  
                  <div className="relative z-50">
                    <CountrySelect value={formData.country} onChange={(val) => setFormData({...formData, country: val})} />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button type="button" onClick={() => setFormData({...formData, gender: "male"})} className={`py-3.5 rounded-2xl border-2 transition-all text-sm ${formData.gender === "male" ? "border-[#fbbf24]/70 bg-[#fbbf24]/10 text-[#fbbf24]" : "border-white/[0.06] text-white/35 hover:bg-white/[0.04]"}`}>👨 ذكر</button>
                    <button type="button" onClick={() => setFormData({...formData, gender: "female"})} className={`py-3.5 rounded-2xl border-2 transition-all text-sm ${formData.gender === "female" ? "border-[#fbbf24]/70 bg-[#fbbf24]/10 text-[#fbbf24]" : "border-white/[0.06] text-white/35 hover:bg-white/[0.04]"}`}>👩 أنثى</button>
                  </div>

                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2.5 rounded-2xl border border-red-500/15">{error}</motion.p>}
                  
                  <div className="pt-3 space-y-2.5">
                    <InteractiveButton type="submit" loading={isLoggingIn} text="التالي" />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, phone: "" }));
                        setView("signupAvatar");
                      }}
                      className="w-full py-3.5 rounded-2xl border border-dashed border-white/10 text-white/25 hover:text-white/50 hover:border-white/20 text-xs font-bold transition-all"
                    >
                      تخطي تسجيل رقم الهاتف مؤقتاً
                    </button>
                  </div>
                  
                  <button type="button" onClick={() => setView("login")} className="w-full mt-1 text-xs font-bold text-white/25 hover:text-white/60 transition-colors">
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center w-full"
              >
                <div className="text-center mb-5 w-full">
                  <div className="w-12 h-12 mx-auto bg-gradient-to-br from-[#fbbf24]/15 to-transparent rounded-2xl flex items-center justify-center mb-3 border border-[#fbbf24]/20">
                    <User className="w-6 h-6 text-[#fbbf24]" />
                  </div>
                  <h2 className="text-2xl font-black text-white/90">الصورة الرمزية</h2>
                  <p className="text-white/30 text-[11px] mt-1">اختر ما يعبر عنك</p>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-5 w-full justify-items-center">
                  {AVATARS[formData.gender].slice(0, 6).map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setFormData({ ...formData, avatar: url })}
                      className={`relative w-[76px] h-[76px] md:w-20 md:h-20 rounded-2xl p-0.5 transition-all duration-300 ${formData.avatar === url ? "bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] shadow-[0_0_20px_rgba(251,191,36,0.3)]" : "bg-white/10 grayscale opacity-40 hover:grayscale-0 hover:opacity-80"}`}
                    >
                      <div className="w-full h-full rounded-[calc(1rem-1px)] bg-[#0b0f1a] overflow-hidden">
                        <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      {formData.avatar === url && (
                        <div className="absolute -top-1.5 -right-1.5 bg-[#0b0f1a] rounded-full p-0.5 border border-[#fbbf24] shadow-lg">
                          <Check className="w-3.5 h-3.5 text-[#fbbf24]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-2.5 w-full mt-1">
                  <button onClick={() => setView("signupInfo")} className="w-1/3 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] text-white/60 hover:text-white/80 font-bold transition-all text-sm">رجوع</button>
                  <div className="w-2/3"><InteractiveButton type="button" onClick={handleFinalSignup} loading={isLoggingIn} text="انطلق 🚀" /></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Skip Button */}
      <div className="fixed bottom-6 w-full flex justify-center z-20">
        <button 
          onClick={() => {
            setIsSkipped(true);
            localStorage.setItem('auth_skipped', 'true');
          }} 
          className="group text-white/15 hover:text-white/40 text-[10px] font-black tracking-[0.2em] transition-colors relative pb-0.5"
        >
          الدخول كزائر مؤقتاً
          <span className="absolute bottom-0 right-0 w-0 h-[1px] bg-white/30 transition-all group-hover:w-full" />
        </button>
      </div>

    </div>
  );
}

// ---------------------------------------------------------
// Sub-Components for UI
// ---------------------------------------------------------

function InputField({ icon, type, value, onChange, placeholder, dir = "rtl", showEye = false, showPassword, setShowPassword }: any) {
  return (
    <div className="relative">
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 [&>svg]:w-4 [&>svg]:h-4 pointer-events-none">
        {icon}
      </div>
      <input
        required
        type={showEye && !showPassword ? "password" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full bg-white/[0.04] border border-white/[0.07] rounded-2xl py-3.5 pr-10 pl-10 text-sm text-white/90 outline-none focus:border-[#fbbf24]/40 focus:bg-white/[0.06] transition-all placeholder:text-white/20 [direction:inherit]"
      />
      {showEye && (
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

function InteractiveButton({ type, onClick, loading, text }: any) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className="w-full py-3.5 bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] text-[#0b0f1a] rounded-2xl font-black text-base hover:from-[#fcd34d] hover:to-[#fbbf24] active:scale-[0.97] transition-all disabled:opacity-50 shadow-[0_4px_20px_rgba(251,191,36,0.2)]"
    >
      <div className="flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : text}
      </div>
    </button>
  );
}

function CountrySelect({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = ARAB_COUNTRIES.find(c => c.name === value) || ARAB_COUNTRIES[0];

  return (
    <div className="relative w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white/[0.04] border ${isOpen ? 'border-[#fbbf24]/40' : 'border-white/[0.07]'} rounded-2xl py-3.5 px-3.5 text-sm text-white/90 cursor-pointer flex items-center justify-between transition-all`}
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">{selected.flag}</span>
          <span className="text-white/70">{selected.name}</span>
        </span>
        <span className={`text-white/25 text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#14131a] border border-white/[0.08] rounded-2xl shadow-xl shadow-black/50 max-h-48 overflow-y-auto z-[999] backdrop-blur-xl">
          {ARAB_COUNTRIES.map(country => (
            <button
              key={country.name}
              type="button"
              onClick={() => { onChange(country.name); setIsOpen(false); }}
              className={`w-full flex items-center justify-between p-3 text-sm transition-all ${value === country.name ? 'text-[#fbbf24] bg-[#fbbf24]/8' : 'text-white/60 hover:bg-white/[0.04] hover:text-white/80'}`}
            >
              <span>{country.name}</span>
              <span className="text-lg">{country.flag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

