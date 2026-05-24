"use client";

import React, { useState, useEffect } from "react";
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
      <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-[9999]">
         <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#d4af37] border-r-[#d4af37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-arabic bg-[#0a0a0a] overflow-hidden">
      {/* Clean subtle background glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(212,175,55,0.2)_0%,transparent_70%)] rounded-full"
        />
      </div>

      {/* --- MAIN CARD --- */}
      <div className="relative w-full max-w-md z-10">
        <div className="relative w-full rounded-3xl p-8 md:p-10 shadow-2xl bg-[#111] border border-white/[0.06]">
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
                {/* Logo */}
                <div className="w-24 h-24 mb-4 relative mx-auto">
                  <div className="absolute inset-0 bg-[#d4af37]/15 blur-xl rounded-full" />
                  <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-contain relative" />
                </div>

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
            {/* SELECT ACCOUNT VIEW */}
            {/* ======================================= */}
            {view === "selectAccount" && (
              <motion.div 
                key="selectAccount"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -10 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="flex flex-col items-center w-full"
              >
                <div className="text-center mb-6 w-full">
                  <h2 className="text-3xl font-black text-white">اختر الحساب</h2>
                  <p className="text-[#d4af37] text-xs mt-2 leading-relaxed">وجدنا أكثر من حساب مرتبط بهذا الرقم<br/>يرجى اختيار الحساب المطلوب</p>
                </div>
                
                <div className="w-full space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {matchingAccounts.map((acc, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectAccount(acc)}
                      className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#d4af37]/50 rounded-2xl p-4 flex items-center justify-between transition-all group text-right"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black overflow-hidden border border-white/10 group-hover:border-[#d4af37]/50 transition-colors">
                          <img src={acc.photoURL || AVATARS.male[0]} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white group-hover:text-[#d4af37] transition-colors">{acc.displayName}</span>
                          <span className="text-[10px] text-white/40">@{acc.username}</span>
                        </div>
                      </div>
                      <ArrowLeft className="w-4 h-4 text-white/20 group-hover:text-[#d4af37] group-hover:-translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>

                {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg mt-4 w-full">{error}</motion.p>}
                
                <button type="button" onClick={() => { setView("login"); setError(""); }} className="w-full mt-6 text-xs font-bold text-white/30 hover:text-white transition-colors">
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
                  
                  <InputField icon={<KeyRound />} type="password" value={formData.password} onChange={(v) => {
                    setFormData({...formData, password: v});
                    setShowWeakPasswordWarning(false);
                    if (error.includes("ضعيفة")) setError("");
                  }} placeholder="كلمة المرور" />
                  
                  {/* Password Strength Indicator */}
                  <div className="flex justify-between text-[10px] w-full px-1 pt-1">
                    <span className={`flex items-center gap-1 transition-colors duration-300 ${/[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-white/30'}`}>
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-colors ${/[A-Z]/.test(formData.password) ? 'bg-green-400/20' : 'bg-white/10'}`}>
                        {/[A-Z]/.test(formData.password) ? <Check className="w-2 h-2" /> : <div className="w-1 h-1 rounded-full bg-white/30" />}
                      </div>
                      حرف كبير
                    </span>
                    <span className={`flex items-center gap-1 transition-colors duration-300 ${/[a-z]/.test(formData.password) ? 'text-green-400' : 'text-white/30'}`}>
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-colors ${/[a-z]/.test(formData.password) ? 'bg-green-400/20' : 'bg-white/10'}`}>
                        {/[a-z]/.test(formData.password) ? <Check className="w-2 h-2" /> : <div className="w-1 h-1 rounded-full bg-white/30" />}
                      </div>
                      حرف صغير
                    </span>
                    <span className={`flex items-center gap-1 transition-colors duration-300 ${/[0-9]/.test(formData.password) ? 'text-green-400' : 'text-white/30'}`}>
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-colors ${/[0-9]/.test(formData.password) ? 'bg-green-400/20' : 'bg-white/10'}`}>
                        {/[0-9]/.test(formData.password) ? <Check className="w-2 h-2" /> : <div className="w-1 h-1 rounded-full bg-white/30" />}
                      </div>
                      رقم
                    </span>
                    <span className={`flex items-center gap-1 transition-colors duration-300 ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-400' : 'text-white/30'}`}>
                      <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-colors ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'bg-green-400/20' : 'bg-white/10'}`}>
                        {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? <Check className="w-2 h-2" /> : <div className="w-1 h-1 rounded-full bg-white/30" />}
                      </div>
                      رمز
                    </span>
                  </div>
                  
                  <div className="relative z-50">
                    <CountrySelect value={formData.country} onChange={(val) => setFormData({...formData, country: val})} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button type="button" onClick={() => setFormData({...formData, gender: "male"})} className={`py-3 rounded-2xl border-2 transition-all ${formData.gender === "male" ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]" : "border-white/5 text-white/40 hover:bg-white/5"}`}>👨 ذكر</button>
                    <button type="button" onClick={() => setFormData({...formData, gender: "female"})} className={`py-3 rounded-2xl border-2 transition-all ${formData.gender === "female" ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.2)]" : "border-white/5 text-white/40 hover:bg-white/5"}`}>👩 أنثى</button>
                  </div>

                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg">{error}</motion.p>}
                  
                  <div className="pt-4 space-y-3">
                    <InteractiveButton type="submit" loading={isLoggingIn} text="التالي" />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, phone: "" }));
                        setView("signupAvatar");
                      }}
                      className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-white/30 hover:text-white/60 hover:border-white/20 text-xs font-bold transition-all"
                    >
                      تخطي تسجيل رقم الهاتف مؤقتاً ↩️
                    </button>
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
      </div>

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

    </div>
  );
}

// ---------------------------------------------------------
// Sub-Components for UI
// ---------------------------------------------------------

function InputField({ icon, type, value, onChange, placeholder, dir = "rtl", showEye = false, showPassword, setShowPassword }: any) {
  return (
    <div className="relative">
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 [&>svg]:w-5 [&>svg]:h-5">
        {icon}
      </div>
      <input
        required
        type={showEye && !showPassword ? "password" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pr-11 pl-4 text-sm text-white outline-none focus:border-[#d4af37]/50 transition-colors placeholder:text-white/25"
      />
      {showEye && (
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
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
      className="w-full py-4 bg-[#d4af37] text-black rounded-2xl font-black text-lg hover:bg-[#c49f2e] active:scale-[0.98] transition-all disabled:opacity-50"
    >
      <div className="flex items-center justify-center gap-2">
        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : text}
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
        className={`w-full bg-white/5 border ${isOpen ? 'border-[#d4af37]/50' : 'border-white/10'} rounded-xl py-3.5 pr-11 pl-4 text-sm text-white cursor-pointer flex items-center justify-between transition-colors`}
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">{selected.flag}</span>
          <span className="text-white/80">{selected.name}</span>
        </span>
        <span className={`text-white/30 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto z-[999]">
          {ARAB_COUNTRIES.map(country => (
            <button
              key={country.name}
              type="button"
              onClick={() => { onChange(country.name); setIsOpen(false); }}
              className={`w-full flex items-center justify-between p-3 text-sm transition-colors ${value === country.name ? 'text-[#d4af37] bg-[#d4af37]/10' : 'text-white/70 hover:bg-white/5'}`}
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

