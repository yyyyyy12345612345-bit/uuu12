"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  LogIn, Loader2, User, KeyRound, Eye, EyeOff, ShieldCheck, Check, ArrowLeft, Phone, Sparkles, AlertTriangle, Wrench
} from "lucide-react";
import { auth, db, initFirebase } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

// ✅ FIX: In APK (Capacitor static export), relative /api/* URLs don't exist.
// We must call the live Vercel server directly.
const VERCEL_BASE = process.env.NEXT_PUBLIC_APP_URL || "https://yaqeen-app.vercel.app";

function getApiUrl(path: string): string {
  if (typeof window !== "undefined" && (window as any).Capacitor) {
    return `${VERCEL_BASE}${path}`;
  }
  return path;
}

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
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Amr&top=theCaesar&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Khaled&top=shortFlat&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Tariq&top=shortRound&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Bilal&top=shortCurly&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Hamza&top=shortWaved&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Salem&top=theCaesar&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Nasser&top=shortFlat&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Fahad&top=shortRound&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Majed&top=shortCurly&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Waleed&top=shortWaved&facialHairProbability=100&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Rami&top=theCaesar&facialHairProbability=100&accessoriesProbability=0"
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
  const [view, setView] = useState<"login" | "signupInfo" | "signupAvatar" | "forgotPassword" | "verifyOtp" | "resetPassword" | "verifySignupOtp">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Login States
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Forgot Password & Signup Verification States
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [signupOtp, setSignupOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetUserId, setResetUserId] = useState("");
  const [resetUsername, setResetUsername] = useState("");
  const [resetVerificationToken, setResetVerificationToken] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  // Signup States
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    email: "",
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

  const pathname = usePathname();
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message: string; reason: string; duration: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const setupMaintenanceListener = async () => {
      await initFirebase();
      if (!isMounted || !db) return;

      try {
        unsubscribe = onSnapshot(doc(db, "admin", "config"), (snapshot) => {
          if (!isMounted) return;
          if (snapshot.exists()) {
            setMaintenance(snapshot.data().maintenance || { enabled: false, message: "", reason: "", duration: "" });
          } else {
            setMaintenance({ enabled: false, message: "", reason: "", duration: "" });
          }
        }, (error) => {
          console.error("Maintenance listener error:", error);
          if (isMounted) {
            setMaintenance({ enabled: false, message: "", reason: "", duration: "" });
          }
        });
      } catch (e) {
        console.error("Failed to setup maintenance listener:", e);
        if (isMounted) {
          setMaintenance({ enabled: false, message: "", reason: "", duration: "" });
        }
      }
    };

    setupMaintenanceListener();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifiedEmail = params.get("verified");
    if (verifiedEmail) {
      setFormData(prev => ({ ...prev, email: verifiedEmail }));
      setEmailVerified(true);
      setView("signupAvatar");
      window.history.replaceState({}, "", "/");
    }
    const handleShowAuth = () => {
      setIsSkipped(false);
      localStorage.removeItem('auth_skipped');
    };
    window.addEventListener("show_auth_gate", handleShowAuth);
    return () => window.removeEventListener("show_auth_gate", handleShowAuth);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const setupAuth = async () => {
      await initFirebase();
      if (!isMounted) return;

      unsubscribe = onAuthStateChanged(auth, async (u) => {
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
    };
    setupAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginIdentifier || !loginPassword) return setError("يرجى ملء جميع الحقول");
    setIsLoggingIn(true);
    try {
      await initFirebase();
      const trimmedId = loginIdentifier.trim();
      let email = "";

      // 1. Check if the user entered a real email directly (with @ symbol, but not @yaqeen.app)
      if (trimmedId.includes("@") && !trimmedId.toLowerCase().endsWith("@yaqeen.app")) {
        // Search by real email in Firestore first
        const emailQuery = query(collection(db, "users"), where("email", "==", trimmedId.toLowerCase()));
        const emailSnap = await getDocs(emailQuery);
        if (!emailSnap.empty) {
          email = `${emailSnap.docs[0].data().username}@yaqeen.app`;
        } else {
          // Fallback: search by username (part before @)
          const searchUsername = trimmedId.split("@")[0].toLowerCase();
          const usernameQuery = query(collection(db, "users"), where("username", "==", searchUsername));
          const usernameSnap = await getDocs(usernameQuery);
          if (!usernameSnap.empty) {
            email = `${usernameSnap.docs[0].data().username}@yaqeen.app`;
          } else {
            email = trimmedId;
          }
        }
      } else {
        // 2. Search by username
        const searchId = trimmedId.replace("@yaqeen.app", "");
        const usernameQuery = query(collection(db, "users"), where("username", "==", searchId.toLowerCase()));
        const usernameSnap = await getDocs(usernameQuery);
        if (!usernameSnap.empty) {
          email = `${usernameSnap.docs[0].data().username}@yaqeen.app`;
        } else {
          email = trimmedId;
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
    if (!formData.email.trim().includes("@")) return setError("يرجى إدخال بريد إلكتروني صحيح");
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
      await initFirebase();
      const qUser = query(collection(db, "users"), where("username", "==", formData.username.trim().toLowerCase()));
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) { setError("الاسم المميز محجوز"); setIsLoggingIn(false); return; }

      const hasEmail = formData.email.trim().includes("@");

      if (hasEmail) {
        const apiResponse = await fetch(getApiUrl("/api/send-otp"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email.trim(), reason: "تأكيد البريد الإلكتروني للتسجيل", type: "signup" })
        });

        const apiData = await apiResponse.json();

        if (apiData.success) {
          if (apiData.emailSent === false) {
            setEmailVerified(false);
            setView("signupAvatar");
          } else {
            setEmailVerified(false);
            setView("verifySignupOtp");
            // تسجيل إرسال الإيميل للإحصائيات
            try {
              const today = new Date().toISOString().split('T')[0];
              addDoc(collection(db, "emailLogs"), {
                email: formData.email.trim().toLowerCase(),
                sentAt: new Date().toISOString(),
                date: today
              });
            } catch (_) {}
          }
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
      const res = await fetch(getApiUrl("/api/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim(), code: signupOtp })
      });
      const data = await res.json();
      if (data.success) {
        setEmailVerified(true);
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
      const email = `${formData.username.trim().toLowerCase()}@yaqeen.app`;
      const res = await createUserWithEmailAndPassword(auth, email, formData.password);
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        username: formData.username.trim().toLowerCase(),
        displayName: formData.displayName.trim(),
        email: formData.email.trim(),
        emailVerified: emailVerified,
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
      console.error("Signup error:", err);
      let errMsg = "حدث خطأ أثناء إنشاء الحساب";
      if (err.code === "auth/email-already-in-use") {
        errMsg = "اسم المستخدم هذا مستخدم بالفعل";
      } else if (err.code === "auth/weak-password") {
        errMsg = "كلمة المرور ضعيفة جداً";
      } else if (err.message) {
        errMsg = err.message;
      }
      setError(errMsg);
      setIsLoggingIn(false);
    }
  };

  // --- FORGOT PASSWORD FLOW ---
  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!resetEmail.trim().includes("@")) return setError("يرجى إدخال بريد إلكتروني صحيح");
    
    setIsLoggingIn(true);
    try {
      await initFirebase();
      const emailQuery = query(collection(db, "users"), where("email", "==", resetEmail.trim().toLowerCase()));
      const emailSnap = await getDocs(emailQuery);
      
      if (emailSnap.empty) {
        setError("البريد الإلكتروني هذا غير مسجل لدينا");
        setIsLoggingIn(false);
        return;
      }

      const userData = emailSnap.docs[0].data();
      setResetUserId(userData.uid);
      setResetUsername(userData.username);
      
      const apiResponse = await fetch(getApiUrl("/api/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim(), reason: "استعادة كلمة المرور" })
      });
      
      const apiData = await apiResponse.json();

      if (apiData.success) {
        setIsLoggingIn(false);
        setView("verifyOtp");
      } else {
        setError(apiData.error || "فشل إرسال البريد الإلكتروني");
        setIsLoggingIn(false);
      }
    } catch (err: any) {
      console.error("Email Send OTP Error Details:", err);
      setError(err.message || "حدث خطأ في النظام");
      setIsLoggingIn(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoggingIn(true);
    try {
      const res = await fetch(getApiUrl("/api/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase(), code: resetOtp, uid: resetUserId })
      });
      const data = await res.json();
      if (data.success) {
        setResetVerificationToken(data.token);
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
    
    setIsLoggingIn(true);
    try {
      // Call the server-side API which uses Firebase Admin SDK
      // No need for the old password at all!
      const res = await fetch(getApiUrl("/api/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: resetUserId,
          newPassword,
          verificationToken: resetVerificationToken,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Also update encP in Firestore so future logins stay in sync
        try {
          await setDoc(doc(db, "users", resetUserId), { encP: btoa(newPassword) }, { merge: true });
        } catch (_) {}

        alert("✅ تم تغيير كلمة المرور بنجاح! يمكنك الآن الدخول بكلمة المرور الجديدة.");
        setView("login");
      } else {
        setError(data.error || "حدث خطأ أثناء تغيير كلمة المرور");
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError("حدث خطأ في الاتصال بالخادم");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Bypass AuthGate entirely when user navigates to /admin
  const isAdminRoute = pathname?.includes("admin");

  if (maintenance?.enabled && !isAdminRoute) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#0b0f1a] via-[#0f0a1a] to-[#0a0f0f] flex items-center justify-center p-6 z-[9999]">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center border border-amber-500/20 mb-8">
            <Wrench className="w-12 h-12 text-amber-400" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">وضع الصيانة</h1>
          <p className="text-amber-400 font-bold text-lg mb-6">
            {maintenance.reason || "نعمل على تحسين التطبيق"}
          </p>
          {maintenance.message && (
            <p className="text-white/50 font-bold mb-6 leading-relaxed">{maintenance.message}</p>
          )}
          {maintenance.duration && (
            <p className="text-white/30 text-sm font-bold">
              المدة المتوقعة: {maintenance.duration}
            </p>
          )}
          <a
            href="/admin"
            className="inline-block mt-8 px-6 py-3 bg-white/5 text-white/40 rounded-2xl border border-white/10 text-xs font-bold hover:bg-white/10 transition"
          >
            دخول الإدارة
          </a>
        </div>
      </div>
    );
  }

  if (isAdminRoute || isSkipped || (user && hasProfile === true)) {
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
                  <InputField icon={<User />} type="text" value={loginIdentifier} onChange={setLoginIdentifier} placeholder="اسم المستخدم أو البريد الإلكتروني" />
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
                  <button type="button" onClick={() => { setIsSkipped(true); localStorage.setItem('auth_skipped', 'true'); }} className="w-full mt-4 text-[11px] font-bold text-white/15 hover:text-white/40 transition-colors border border-white/[0.04] rounded-2xl py-2.5">
                    تخطي ←
                  </button>
                </form>
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
                  <p className="text-white/30 text-xs mt-1.5 leading-relaxed">أدخل بريدك الإلكتروني المسجل وسنرسل رمز التحقق</p>
                </div>
                
                <form onSubmit={handleSendEmailOtp} className="w-full space-y-3.5">
                  <InputField icon={<Phone />} type="email" value={resetEmail} onChange={setResetEmail} placeholder="البريد الإلكتروني" dir="ltr" />
                  
                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2.5 rounded-2xl border border-red-500/15">{error}</motion.p>}
                  
                  <div className="pt-3">
                    <InteractiveButton type="submit" loading={isLoggingIn} text="إرسال الكود عبر البريد الإلكتروني" />
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
                  <p className="text-[#fbbf24]/60 text-xs mt-1.5">أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك</p>
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
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -10 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="flex flex-col items-center"
              >
                <div className="text-center mb-6 w-full">
                  <h2 className="text-3xl font-black text-white">تأكيد البريد الإلكتروني</h2>
                  <p className="text-[#d4af37] text-xs mt-2">أدخل الرمز المكون من 6 أرقام<br/>المرسل إلى بريدك الإلكتروني</p>
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
                  <form onSubmit={handleResetPassword} className="w-full space-y-4">
                    <InputField icon={<KeyRound />} type="password" value={newPassword} onChange={setNewPassword} placeholder="كلمة المرور الجديدة" showEye={true} showPassword={showPassword} setShowPassword={setShowPassword} />
                    
                    {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg">{error}</motion.p>}
                    
                    <div className="pt-4">
                      <InteractiveButton type="submit" loading={isLoggingIn} text="تأكيد وحفظ" />
                    </div>
                  </form>
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
                  <InputField icon={<User />} type="text" value={formData.displayName} onChange={(v: string) => setFormData({...formData, displayName: v})} placeholder="الاسم الحقيقي" />
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <InputField icon={<User />} type="text" value={formData.username} onChange={(v: string) => setFormData({...formData, username: v.toLowerCase().replace(/[^a-z0-9_]/g, '')})} placeholder="youssef_1" dir="ltr" />
                    <InputField icon={<Phone />} type="email" value={formData.email} onChange={(v: string) => setFormData({...formData, email: v})} placeholder="البريد الإلكتروني" dir="ltr" />
                  </div>
                  
                  <InputField icon={<KeyRound />} type="password" value={formData.password} onChange={(v: string) => {
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
                  
                  <div className="pt-3">
                    <InteractiveButton type="submit" loading={isLoggingIn} text="التالي" />
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

