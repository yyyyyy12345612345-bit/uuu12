"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Loader2, User, KeyRound, Eye, EyeOff, Check, ArrowLeft,
  Phone, Wrench, Mail, RefreshCw, ShieldCheck, Sparkles
} from "lucide-react";
import { auth, db, initFirebase, fetchFirestoreDoc } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc, getDoc, setDoc, collection, query, where,
  getDocs, addDoc, onSnapshot,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

const VERCEL_BASE = process.env.NEXT_PUBLIC_APP_URL || "https://yaqeenalquran.online";

function getApiUrl(path: string): string {
  if (typeof window !== "undefined" && (window as any).Capacitor) {
    return `${VERCEL_BASE}${path}`;
  }
  return path;
}

interface AuthGateProps { children: React.ReactNode; }

type View = "login" | "forgotPassword" | "forgotChooseAccount" | "forgotOtp" | "forgotReset" | "forgotSent" | "signupInfo" | "signupOtp" | "signupAvatar";

const AVATARS = {
  male: [
    // أطفال
    "https://api.dicebear.com/9.x/avataaars/svg?seed=AnasChild&top=shortRound&facialHairProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=HamzaChild&top=shortFlat&facialHairProbability=0",
    // شباب
    "https://api.dicebear.com/9.x/avataaars/svg?seed=OmarYouth&top=shortCurly&facialHairProbability=100&facialHair=beardLight",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=AliYouth&top=theCaesar&facialHairProbability=100&facialHair=beardMedium",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=KarimYouth&top=shortWaved&facialHairProbability=100&facialHair=beardLight",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=YoussefYouth&top=shortFlat&facialHairProbability=100&facialHair=moustaches",
    // كبار السن وشيوخ
    "https://api.dicebear.com/9.x/avataaars/svg?seed=IbrahimElder&top=shortRound&hairColor=e8e1e1&facialHairProbability=100&facialHair=beardMajestic&facialHairColor=e8e1e1",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=HassanElder&top=shortFlat&hairColor=ffffff&facialHairProbability=100&facialHair=beardMajestic&facialHairColor=ffffff",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=MustafaElder&top=shortWaved&hairColor=e8e1e1&facialHairProbability=100&facialHair=beardMedium&facialHairColor=e8e1e1",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=ZaidElder&top=theCaesar&hairColor=ffffff&facialHairProbability=100&facialHair=beardMajestic&facialHairColor=ffffff",
  ],
  female: [
    // أطفال
    "https://api.dicebear.com/9.x/avataaars/svg?seed=SaraChild&top=longHair&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=LinaChild&top=shortHair&accessoriesProbability=0",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=JanaChild&top=longHair&hairColor=724124&accessoriesProbability=0",
    // شابات
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Aisha&top=hijab&accessoriesProbability=0&hatColor=3b82f6",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Fatima&top=hijab&accessoriesProbability=0&hatColor=10b981",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Mariam&top=hijab&accessoriesProbability=0&hatColor=8b5cf6",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Zaynab&top=hijab&accessoriesProbability=0&hatColor=ec4899",
    // سيدات كبار السن
    "https://api.dicebear.com/9.x/avataaars/svg?seed=KhadijaElder&top=hijab&accessoriesProbability=0&hatColor=374151",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=FatimaElder&top=hijab&accessoriesProbability=0&hatColor=4b5563",
    "https://api.dicebear.com/9.x/avataaars/svg?seed=AminaElder&top=hijab&accessoriesProbability=0&hatColor=111827",
  ],
};

const ARAB_COUNTRIES = [
  { name: "مصر", flag: "🇪🇬" }, { name: "السعودية", flag: "🇸🇦" },
  { name: "الإمارات", flag: "🇦🇪" }, { name: "الكويت", flag: "🇰🇼" },
  { name: "المغرب", flag: "🇲🇦" }, { name: "الجزائر", flag: "🇩🇿" },
  { name: "تونس", flag: "🇹🇳" }, { name: "الأردن", flag: "🇯🇴" },
  { name: "فلسطين", flag: "🇵🇸" }, { name: "قطر", flag: "🇶🇦" },
  { name: "عمان", flag: "🇴🇲" }, { name: "البحرين", flag: "🇧🇭" },
  { name: "العراق", flag: "🇮🇶" }, { name: "سوريا", flag: "🇸🇾" },
  { name: "لبنان", flag: "🇱🇧" }, { name: "اليمن", flag: "🇾🇪" },
  { name: "ليبيا", flag: "🇱🇾" }, { name: "السودان", flag: "🇸🇩" },
  { name: "موريتانيا", flag: "🇲🇷" }, { name: "الصومال", flag: "🇸🇴" },
  { name: "أخرى", flag: "🌍" },
];

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();

  const [user, setUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [view, setView] = useState<View>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSkipped, setIsSkipped] = useState<boolean>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("auth_skipped") === "true";
    return false;
  });
  const [maintenance, setMaintenance] = useState<{ enabled: boolean; message: string; reason: string; duration: string } | null>(null);
  const [loginId, setLoginId] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [signupForm, setSignupForm] = useState({
    displayName: "", username: "", email: "", phone: "",
    password: "", gender: "male" as "male" | "female", country: "مصر", avatar: AVATARS.male[0],
    registrationType: "direct" as "direct" | "indirect",
    privacyPhone: "public" as "public" | "friends" | "private",
  });
  const [otpCode, setOtpCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [showWeakPwWarn, setShowWeakPwWarn] = useState(false);
  const [forgotAccounts, setForgotAccounts] = useState<{ uid: string; username: string; displayName: string; photoURL: string; registrationType?: string }[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<{ uid: string; username: string; displayName: string; photoURL: string; registrationType?: string } | null>(null);
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");

  useEffect(() => {
    let isMounted = true;
    let interval: any = null;
    initFirebase().then(() => {
      if (!isMounted) return;
      const poll = async () => {
        if (!isMounted) return;
        try {
          const data = await fetchFirestoreDoc("admin", "config");
          if (data?.fields?.maintenance) {
            const m = data.fields.maintenance.mapValue?.fields;
            if (m) {
              setMaintenance({ enabled: m.enabled?.booleanValue === true, message: m.message?.stringValue || "", reason: m.reason?.stringValue || "", duration: m.duration?.stringValue || "" });
            }
          }
        } catch { setMaintenance({ enabled: false, message: "", reason: "", duration: "" }); }
      };
      poll();
      interval = setInterval(poll, 30000);
    });
    return () => { isMounted = false; if (interval) clearInterval(interval); };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsub: (() => void) | null = null;
    (async () => {
      await initFirebase();
      if (!isMounted) return;
      unsub = onAuthStateChanged(auth, async (u) => {
        if (!isMounted) return;
        if (u && db) {
          try { const snap = await getDoc(doc(db, "users", u.uid)); setHasProfile(snap.exists()); }
          catch { setHasProfile(true); }
        } else { setHasProfile(null); }
        setUser(u);
      });
    })();
    return () => { isMounted = false; unsub?.(); };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifiedEmail = params.get("verified");
    if (verifiedEmail) {
      setSignupForm((p) => ({ ...p, email: verifiedEmail }));
      setEmailVerified(true); setView("signupAvatar");
      window.history.replaceState({}, "", "/");
    }
    const onShowAuth = (e: Event) => {
      setIsSkipped(false);
      localStorage.removeItem("auth_skipped");
      const detail = (e as CustomEvent)?.detail;
      if (detail?.view) {
        setView(detail.view);
      }
      if (detail?.registrationType) {
        setSignupForm(prev => ({ ...prev, registrationType: detail.registrationType }));
      }
    };
    window.addEventListener("show_auth_gate", onShowAuth);
    return () => window.removeEventListener("show_auth_gate", onShowAuth);
  }, []);

  function clearError() { setError(""); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); clearError();
    if (!loginId.trim() || !loginPass) return setError("يرجى ملء جميع الحقول");
    setIsLoading(true);
    try {
      await initFirebase();
      const id = loginId.trim();
      const isEmail = id.includes("@") && !id.toLowerCase().endsWith("@yaqeen.app");
      let resolvedEmail: string = id;
      let docUsername: string | null = null;

      try {
        if (isEmail) {
          const q = query(collection(db, "users"), where("email", "==", id.toLowerCase()));
          const snap = await getDocs(q);
          if (!snap.empty) {
            if (snap.docs.length > 1) {
              await initFirebase();
              for (const d of snap.docs) {
                const ae = d.data().authEmail;
                if (ae) try { await signInWithEmailAndPassword(auth, ae, loginPass); window.location.reload(); return; } catch {}
              }
              setError("هذا البريد مرتبط بأكثر من حساب، يرجى تسجيل الدخول باستخدام اسم المستخدم.");
              setIsLoading(false);
              return;
            }
            resolvedEmail = snap.docs[0].data().authEmail || snap.docs[0].data().email || id;
            docUsername = snap.docs[0].data().username || null;
          }
        } else {
          const username = id.replace("@yaqeen.app", "").toLowerCase();
          const q = query(collection(db, "users"), where("username", "==", username));
          const snap = await getDocs(q);
          if (!snap.empty) {
            resolvedEmail = snap.docs[0].data().authEmail || snap.docs[0].data().email || `${username}@yaqeen.app`;
            docUsername = snap.docs[0].data().username || username;
          } else {
            resolvedEmail = `${username}@yaqeen.app`;
            docUsername = username;
          }
        }
      } catch {
        resolvedEmail = isEmail ? id : `${id.replace("@yaqeen.app", "").toLowerCase()}@yaqeen.app`;
      }

      try {
        await signInWithEmailAndPassword(auth, resolvedEmail, loginPass);
      } catch (firstErr: any) {
        if (docUsername) {
          const fallbackEmail = `${docUsername.toLowerCase()}@yaqeen.app`;
          if (fallbackEmail !== resolvedEmail) {
            await signInWithEmailAndPassword(auth, fallbackEmail, loginPass);
            return;
          }
        } else if (!isEmail) {
          const legacy = `${id.replace("@yaqeen.app", "").toLowerCase()}@yaqeen.app`;
          if (legacy !== resolvedEmail) {
            await signInWithEmailAndPassword(auth, legacy, loginPass);
            return;
          }
        }
        throw firstErr;
      }
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") setError("كلمة المرور غير صحيحة");
      else if (code === "auth/user-not-found") setError("الحساب غير موجود");
      else if (code === "auth/too-many-requests") setError("محاولات كثيرة، حاول لاحقاً");
      else setError("بيانات الدخول غير صحيحة");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault(); clearError();
    const email = forgotEmail.trim().toLowerCase();
    if (!email.includes("@")) return setError("يرجى إدخال بريد إلكتروني صحيح");
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/forgot-password/"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "لا يوجد حساب مرتبط بهذا البريد");
        setIsLoading(false);
        return;
      }
      setForgotAccounts(data.accounts);
      if (data.accounts.length === 1) {
        const acc = data.accounts[0];
        if (acc.registrationType === "indirect") {
          setError(`عذراً، هذا الحساب (@${acc.username}) تم إنشاؤه كحساب غير مباشر ولا يدعم استعادة كلمة المرور.`);
          setIsLoading(false);
          return;
        }
        setSelectedAccount(acc);
        await triggerSendForgotOtp(email, acc);
      } else {
        setView("forgotChooseAccount");
        setIsLoading(false);
      }
    } catch (err) {
      setError("حدث خطأ، يرجى المحاولة مجدداً");
      setIsLoading(false);
    }
  }

  async function triggerSendForgotOtp(email: string, account: { uid: string; username: string; displayName: string }) {
    try {
      const res = await fetch(getApiUrl("/api/send-otp/"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          reason: "كود التحقق لإعادة تعيين كلمة المرور لحسابك",
          type: "reset",
          username: account.username
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "فشل إرسال كود التحقق");
        setView("forgotPassword");
      } else {
        setView("forgotOtp");
      }
    } catch {
      setError("فشل الاتصال بالخادم لإرسال الكود");
      setView("forgotPassword");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectAccount(account: { uid: string; username: string; displayName: string; photoURL: string; registrationType?: string }) {
    clearError();
    if (account.registrationType === "indirect") {
      setError(`عذراً، هذا الحساب (@${account.username}) تم إنشاؤه كحساب غير مباشر ولا يدعم استعادة كلمة المرور.`);
      return;
    }
    setIsLoading(true);
    setSelectedAccount(account);
    await triggerSendForgotOtp(forgotEmail.trim().toLowerCase(), account);
  }

  async function handleVerifyForgotOtp(e: React.FormEvent) {
    e.preventDefault(); clearError();
    if (!forgotOtp.trim()) return setError("يرجى إدخال الكود");
    if (!selectedAccount) return setError("لم يتم تحديد حساب");
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/verify-otp/"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          code: forgotOtp.trim(),
          uid: selectedAccount.uid
        }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setResetToken(data.token);
        setView("forgotReset");
      } else {
        setError(data.error || "الكود غير صحيح أو منتهي الصلاحية");
      }
    } catch {
      setError("فشل التحقق من الكود");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault(); clearError();
    if (forgotNewPassword.length < 6) return setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/reset-password/"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetToken,
          newPassword: forgotNewPassword
        }),
      });
      const data = await res.json();
      if (data.success) {
        setView("forgotSent");
      } else {
        setError(data.error || "فشل إعادة تعيين كلمة المرور");
      }
    } catch {
      setError("فشل الاتصال بالخادم لتحديث كلمة المرور");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSignupNext(e: React.FormEvent) {
    e.preventDefault(); clearError(); setShowWeakPwWarn(false);
    const { displayName, username, email, password, phone, registrationType } = signupForm;
    if (displayName.trim().length < 2) return setError("الاسم يجب أن يكون حرفين على الأقل");
    if (username.trim().length < 3) return setError("اسم المستخدم 3 أحرف على الأقل");
    if (!email.trim().includes("@")) return setError("يرجى إدخال بريد إلكتروني صحيح");
    if (password.length < 6) return setError("كلمة المرور 6 أحرف على الأقل");
    if (!phone.trim()) return setError("يرجى إدخال رقم الهاتف");

    const strongPw = /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!strongPw && !showWeakPwWarn) {
      setError("كلمة المرور ضعيفة. اضغط 'التالي' مرة أخرى للمتابعة.");
      setShowWeakPwWarn(true); return;
    }
    setIsLoading(true);
    try {
      await initFirebase();
      try {
        const uq = query(collection(db, "users"), where("username", "==", username.trim().toLowerCase()));
        const uSnap = await getDocs(uq);
        if (!uSnap.empty) { setError("اسم المستخدم محجوز، جرب اسماً آخر"); setIsLoading(false); return; }
      } catch { /* skip if firestore rules block */ }

      if (registrationType === "indirect") {
        setEmailVerified(false);
        setView("signupAvatar");
        setIsLoading(false);
        return;
      }

      const res = await fetch(getApiUrl("/api/send-otp/"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), reason: "تأكيد البريد الإلكتروني للتسجيل", type: "signup", username: username.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "فشل إرسال كود التحقق، حاول لاحقاً"); setIsLoading(false); return; }
      try {
        const today = new Date().toISOString().split("T")[0];
        addDoc(collection(db, "emailLogs"), { email: email.trim().toLowerCase(), sentAt: new Date().toISOString(), date: today });
      } catch { /* ignore */ }
      setView("signupOtp");
    } catch { setError("حدث خطأ أثناء الاتصال"); } finally { setIsLoading(false); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault(); clearError();
    if (!otpCode.trim()) return setError("يرجى إدخال الكود");
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/verify-otp/"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupForm.email.trim(), code: otpCode.trim() }),
      });
      const data = await res.json();
      if (data.success) { setEmailVerified(true); setView("signupAvatar"); }
      else setError(data.error || "الكود غير صحيح أو منتهي الصلاحية");
    } catch { setError("فشل التحقق من الكود"); } finally { setIsLoading(false); }
  }

  async function handleCreateAccount() {
    setIsLoading(true); clearError();
    const origEmail = signupForm.email.trim().toLowerCase();
    try {
      await initFirebase();
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      const rnd = Math.random().toString(36).slice(2,6);
      const authEmail = origEmail.replace("@", `+${rnd}@`);
      const cred = await createUserWithEmailAndPassword(auth, authEmail, signupForm.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid, username: signupForm.username.trim().toLowerCase(),
        displayName: signupForm.displayName.trim(), email: origEmail, authEmail, emailVerified,
        phoneNumber: signupForm.phone.trim(), gender: signupForm.gender,
        country: signupForm.country, photoURL: signupForm.avatar,
        privacySettings: { phone: signupForm.privacyPhone, birthDate: "public" },
        totalPoints: 0, createdAt: new Date().toISOString(), lastActive: new Date().toISOString(),
        isBanned: false, encP: btoa(signupForm.password),
        registrationType: signupForm.registrationType || "direct",
      });
      window.location.reload();
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") {
        const rnd2 = Math.random().toString(36).slice(2, 8);
        const authEmail2 = origEmail.replace("@", `+${rnd2}@`);
        try {
          const cred2 = await createUserWithEmailAndPassword(auth, authEmail2, signupForm.password);
          await setDoc(doc(db, "users", cred2.user.uid), {
            uid: cred2.user.uid, username: signupForm.username.trim().toLowerCase(),
            displayName: signupForm.displayName.trim(), email: origEmail, authEmail: authEmail2, emailVerified,
            phoneNumber: signupForm.phone.trim(), gender: signupForm.gender,
            country: signupForm.country, photoURL: signupForm.avatar,
            privacySettings: { phone: signupForm.privacyPhone, birthDate: "public" },
            totalPoints: 0, createdAt: new Date().toISOString(), lastActive: new Date().toISOString(),
            isBanned: false, encP: btoa(signupForm.password),
            registrationType: signupForm.registrationType || "direct",
          });
          window.location.reload();
          return;
        } catch { setError("هذا البريد مسجل بالفعل. يرجى تسجيل الدخول."); }
      }
      else if (code === "auth/weak-password") setError("كلمة المرور ضعيفة جداً");
      else setError(err.message || "حدث خطأ أثناء إنشاء الحساب");
      setIsLoading(false);
    }
  }

  // ── Guards ──
  const isAdminRoute = pathname?.includes("admin");

  if (maintenance?.enabled && !isAdminRoute) {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6 z-[9999]" style={{ background: "linear-gradient(135deg,#f8fafc,#f1f5f9,#e2e8f0)" }}>
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center border border-blue-500/20" style={{ background: "rgba(59,130,246,0.08)" }}>
            <Wrench className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">وضع الصيانة</h1>
          <p className="text-blue-600 font-bold">{maintenance.reason || "نعمل على تحسين التطبيق"}</p>
          {maintenance.message && <p className="text-slate-500 text-sm leading-relaxed">{maintenance.message}</p>}
          {maintenance.duration && <p className="text-slate-400 text-xs">المدة المتوقعة: {maintenance.duration}</p>}
          <a href="/admin" className="inline-block mt-6 px-5 py-2.5 text-slate-500 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 transition">دخول الإدارة</a>
        </div>
      </div>
    );
  }

  if (isAdminRoute || isSkipped || (user && hasProfile === true)) return <>{children}</>;

  if (user === undefined) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-[9999]" style={{ background: "linear-gradient(135deg,#f8fafc,#f1f5f9,#e2e8f0)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#3b82f6]/15 animate-ping" />
            <div className="absolute inset-1 rounded-full border-2 border-t-[#3b82f6] border-r-[#4f46e5] border-b-transparent border-l-transparent animate-spin" />
          </div>
          <p className="text-slate-400 text-[11px] tracking-[0.3em] font-bold">جاري التحميل</p>
        </div>
      </div>
    );
  }

  const signupSteps: View[] = ["signupInfo", "signupOtp", "signupAvatar"];
  const signupStepIdx = signupSteps.indexOf(view);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg,#f8fafc 0%,#f1f5f9 50%,#e2e8f0 100%)" }}>

      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ x: [0, 25, 0], y: [0, -18, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-[550px] h-[550px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)" }} />
        <motion.div animate={{ x: [0, -20, 0], y: [0, 22, 0] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute -bottom-48 -right-40 w-[650px] h-[650px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)" }} />
        <motion.div animate={{ opacity: [0.3, 0.55, 0.3] }} transition={{ duration: 9, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)" }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "linear-gradient(rgba(15,23,42,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,0.5) 1px,transparent 1px)", backgroundSize: "44px 44px" }} />
      </div>

      {/* Card */}
      <motion.div initial={{ opacity: 0, scale: 0.93, y: 28 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full z-10" style={{ maxWidth: 400, padding: "0 16px" }}>

        {/* Outer glow ring */}
        <div className="absolute -inset-px rounded-[2rem] pointer-events-none"
          style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.15),transparent 45%,rgba(99,102,241,0.1))", borderRadius: "2rem" }} />

        <div className="relative overflow-hidden" style={{
          borderRadius: "2rem",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 40px 100px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 0 rgba(15,23,42,0.04)",
        }}>

          {/* Top accent line */}
          <div className="absolute top-0 left-10 right-10 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.5),transparent)" }} />

          {/* Signup progress bar */}
          {signupStepIdx >= 0 && (
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "rgba(15,23,42,0.04)" }}>
              <motion.div className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg,#3b82f6,#6366f1,#818cf8)" }}
                animate={{ width: `${((signupStepIdx + 1) / signupSteps.length) * 100}%` }}
                transition={{ duration: 0.45, ease: "easeOut" }} />
            </div>
          )}

          <div className="p-6 sm:p-7" style={{ maxHeight: "88vh", overflowY: "auto", scrollbarWidth: "none" }}>
            <AnimatePresence mode="wait">

              {/* ── LOGIN ── */}
              {view === "login" && (
                <Slide key="login">
                  <div className="flex justify-center mb-6">
                    <motion.div className="relative" animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                      <div className="absolute -inset-4 rounded-2xl opacity-50"
                        style={{ background: "radial-gradient(circle,rgba(59,130,246,0.18),transparent 70%)" }} />
                      <div className="relative w-16 h-16 rounded-2xl p-3 border border-[#3b82f6]/20"
                        style={{ background: "linear-gradient(135deg,rgba(59,130,246,0.1),rgba(99,102,241,0.03))" }}>
                        <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    </motion.div>
                  </div>
                  <div className="text-center mb-6">
                    <h1 className="text-[22px] font-black text-slate-900 tracking-tight">أهلاً بك</h1>
                    <p className="text-slate-400 text-[11px] mt-0.5 tracking-[0.25em] font-medium">الاستوديو القرآني</p>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-3">
                    <FancyInput icon={<User />} type="text" value={loginId} onChange={setLoginId} placeholder="اسم المستخدم أو البريد الإلكتروني" />
                    <FancyInput icon={<KeyRound />} type="password" value={loginPass} onChange={setLoginPass} placeholder="كلمة المرور" showEye showPassword={showPassword} setShowPassword={setShowPassword} />
                    <ErrorBox text={error} />
                    <GoldBtn type="submit" loading={isLoading} label="تسجيل الدخول" />
                  </form>
                  <div className="flex items-center justify-between mt-5 px-1">
                    <button type="button" onClick={() => { setView("forgotPassword"); clearError(); }}
                      className="text-[11px] text-slate-500 hover:text-[#3b82f6] transition-colors font-medium">نسيت كلمة المرور؟</button>
                    <button type="button" onClick={() => { setView("signupInfo"); clearError(); }}
                      className="text-[11px] font-black text-[#3b82f6] flex items-center gap-1 hover:gap-2 transition-all">
                      حساب جديد <ArrowLeft className="w-3 h-3" />
                    </button>
                  </div>
                  <button type="button" onClick={() => { setIsSkipped(true); localStorage.setItem("auth_skipped", "true"); }}
                    className="w-full mt-4 py-2.5 text-[11px] text-slate-400 hover:text-slate-700 hover:bg-slate-50/50 transition-colors border border-slate-200/80 rounded-xl font-medium">
                    تخطي لاحقاً ←
                  </button>
                </Slide>
              )}

              {/* ── FORGOT PASSWORD ── */}
              {view === "forgotPassword" && (
                <Slide key="forgotPw">
                  <CircleIcon color="#3b82f6"><KeyRound className="w-6 h-6" /></CircleIcon>
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-black text-slate-900 font-bold">نسيت كلمة المرور؟</h2>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">أدخل بريدك الإلكتروني وسنرسل كود تحقق لاستعادة حسابك</p>
                  </div>
                  <form onSubmit={handleForgotPassword} className="space-y-3">
                    <FancyInput icon={<Mail />} type="email" value={forgotEmail} onChange={setForgotEmail} placeholder="البريد الإلكتروني" dir="ltr" />
                    <ErrorBox text={error} />
                    <GoldBtn type="submit" loading={isLoading} label="البحث عن الحسابات" />
                    <SubBtn onClick={() => { setView("login"); clearError(); }} label="العودة لتسجيل الدخول" />
                  </form>
                </Slide>
              )}

              {/* ── FORGOT CHOOSE ACCOUNT ── */}
              {view === "forgotChooseAccount" && (
                <Slide key="forgotChoose">
                  <CircleIcon color="#3b82f6"><User className="w-6 h-6" /></CircleIcon>
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-black text-slate-900">اختر الحساب</h2>
                    <p className="text-slate-500 text-[11px] mt-1">هذا البريد الإلكتروني مرتبط بأكثر من حساب، اختر الحساب الذي تود استعادة كلمة المرور له:</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 mb-4 custom-scrollbar">
                    {forgotAccounts.map((acc) => (
                      <button key={acc.uid} type="button" onClick={() => handleSelectAccount(acc)}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-300/80 transition-all text-right">
                        <div className="flex items-center gap-3">
                          <img src={acc.photoURL || AVATARS.male[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-200" />
                          <div>
                            <div className="text-sm font-bold text-slate-900">{acc.displayName}</div>
                            <div className="text-xs text-slate-400">@{acc.username}</div>
                          </div>
                        </div>
                        {acc.registrationType === "indirect" && (
                          <span className="text-[9px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-lg border border-red-200/60 font-bold">غير مباشر</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <ErrorBox text={error} />
                  <SubBtn onClick={() => { setView("forgotPassword"); clearError(); }} label="تراجع" />
                </Slide>
              )}

              {/* ── FORGOT OTP ── */}
              {view === "forgotOtp" && (
                <Slide key="forgotOtp">
                  <CircleIcon color="#3b82f6"><Mail className="w-6 h-6" /></CircleIcon>
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-black text-slate-900 font-bold">كود التحقق</h2>
                    <p className="text-slate-500 text-xs mt-2 leading-relaxed">أدخل كود التحقق المرسل إلى بريدك الإلكتروني<br />لحساب <span className="text-[#3b82f6] font-bold">@{selectedAccount?.username}</span></p>
                  </div>
                  <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                    <OtpBoxes value={forgotOtp} onChange={setForgotOtp} />
                    <ErrorBox text={error} />
                    <GoldBtn type="submit" loading={isLoading} label="تأكيد الكود" />
                    <SubBtn onClick={() => { 
                      if (forgotAccounts.length > 1) {
                        setView("forgotChooseAccount");
                      } else {
                        setView("forgotPassword");
                      }
                      clearError(); 
                      setForgotOtp(""); 
                    }} label="تراجع" />
                  </form>
                </Slide>
              )}

              {/* ── FORGOT RESET ── */}
              {view === "forgotReset" && (
                <Slide key="forgotReset">
                  <CircleIcon color="#3b82f6"><KeyRound className="w-6 h-6" /></CircleIcon>
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-black text-slate-900 font-bold">كلمة مرور جديدة</h2>
                    <p className="text-slate-500 text-xs mt-2">قم بتعيين كلمة مرور جديدة لحسابك</p>
                  </div>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <FancyInput icon={<KeyRound />} type="password" value={forgotNewPassword} onChange={setForgotNewPassword} placeholder="كلمة المرور الجديدة" showEye showPassword={showPassword} setShowPassword={setShowPassword} />
                    <ErrorBox text={error} />
                    <GoldBtn type="submit" loading={isLoading} label="حفظ كلمة المرور" />
                  </form>
                </Slide>
              )}

              {/* ── FORGOT SENT (SUCCESS) ── */}
              {view === "forgotSent" && (
                <Slide key="forgotSent">
                  <div className="flex flex-col items-center py-4 text-center">
                    <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      className="w-20 h-20 rounded-[2rem] flex items-center justify-center mb-5 border border-emerald-200"
                      style={{ background: "rgba(16,185,129,0.06)" }}>
                      <Check className="w-10 h-10 text-emerald-500" />
                    </motion.div>
                    <h2 className="text-xl font-black text-slate-900 mb-2 font-bold">تم التغيير ✓</h2>
                    <p className="text-slate-500 text-sm mb-5">تمت إعادة تعيين كلمة المرور لحسابك بنجاح</p>
                    <button onClick={() => { setView("login"); clearError(); setForgotEmail(""); setForgotOtp(""); setForgotNewPassword(""); setResetToken(""); setSelectedAccount(null); }}
                      className="text-[#3b82f6] font-bold text-sm hover:underline">العودة لتسجيل الدخول</button>
                  </div>
                </Slide>
              )}

              {/* ── SIGNUP STEP 1 ── */}
              {view === "signupInfo" && (
                <Slide key="signupInfo">
                  <Dots total={3} current={0} />
                  <div className="text-center mb-5">
                    <div className="inline-flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-4 h-4 text-[#3b82f6]" />
                      <h2 className="text-lg font-black text-slate-900 font-bold">إنشاء حساب جديد</h2>
                    </div>
                    <p className="text-slate-400 text-[11px]">المعلومات الأساسية · الخطوة 1 من 3</p>
                  </div>
                  <form onSubmit={handleSignupNext} className="space-y-2.5">
                    {/* نوع التسجيل: مباشر أم غير مباشر */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => setSignupForm({ ...signupForm, registrationType: "direct" })}
                        className="py-2.5 px-1.5 rounded-xl text-xs font-black transition-all border flex flex-col items-center justify-center gap-1"
                        style={signupForm.registrationType === "direct"
                          ? { borderColor: "rgba(59,130,246,0.45)", color: "#2563eb", background: "rgba(59,130,246,0.08)" }
                          : { borderColor: "rgba(15,23,42,0.08)", color: "rgba(15,23,42,0.4)", background: "rgba(15,23,42,0.02)" }}
                      >
                        <span className="text-[11px] font-black">✨ تسجيل مباشر</span>
                        <span className="text-[8px] opacity-75 font-bold">كود تحقق (استرجاع متاح)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupForm({ ...signupForm, registrationType: "indirect" })}
                        className="py-2.5 px-1.5 rounded-xl text-xs font-black transition-all border flex flex-col items-center justify-center gap-1"
                        style={signupForm.registrationType === "indirect"
                          ? { borderColor: "rgba(59,130,246,0.45)", color: "#2563eb", background: "rgba(59,130,246,0.08)" }
                          : { borderColor: "rgba(15,23,42,0.08)", color: "rgba(15,23,42,0.4)", background: "rgba(15,23,42,0.02)" }}
                      >
                        <span className="text-[11px] font-black">👤 تسجيل غير مباشر</span>
                        <span className="text-[8px] opacity-75 font-bold">بيانات عادية (بدون استرجاع)</span>
                      </button>
                    </div>

                    <FancyInput icon={<User />} type="text" value={signupForm.displayName} onChange={(v: string) => setSignupForm({ ...signupForm, displayName: v })} placeholder="الاسم الكامل" />
                    <div className="grid grid-cols-2 gap-2">
                      <FancyInput icon={<User />} type="text" value={signupForm.username} onChange={(v: string) => setSignupForm({ ...signupForm, username: v.toLowerCase().replace(/[^a-z0-9_]/g, "") })} placeholder="اسم_المستخدم" dir="ltr" />
                      <div className="flex flex-col gap-1.5 relative">
                        <FancyInput icon={<Phone />} type="text" value={signupForm.phone} onChange={(v: string) => setSignupForm({ ...signupForm, phone: v })} placeholder="الهاتف" dir="ltr" />
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 shadow-inner">
                          <button type="button" onClick={() => setSignupForm({ ...signupForm, privacyPhone: "private" })} title="أنا فقط" className={`p-1.5 rounded-lg transition-all ${signupForm.privacyPhone === "private" ? "bg-red-100 text-red-500 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}><EyeOff className="w-3 h-3" /></button>
                          <button type="button" onClick={() => setSignupForm({ ...signupForm, privacyPhone: "friends" })} title="الأصدقاء" className={`p-1.5 rounded-lg transition-all ${signupForm.privacyPhone === "friends" ? "bg-amber-100 text-amber-500 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}><User className="w-3 h-3" /></button>
                          <button type="button" onClick={() => setSignupForm({ ...signupForm, privacyPhone: "public" })} title="الجميع" className={`p-1.5 rounded-lg transition-all ${signupForm.privacyPhone === "public" ? "bg-emerald-100 text-emerald-500 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}><Eye className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                    <FancyInput icon={<Mail />} type="email" value={signupForm.email} onChange={(v: string) => { setSignupForm({ ...signupForm, email: v }); setShowWeakPwWarn(false); }} placeholder="البريد الإلكتروني" dir="ltr" />
                    <FancyInput icon={<KeyRound />} type="password" value={signupForm.password} onChange={(v: string) => { setSignupForm({ ...signupForm, password: v }); setShowWeakPwWarn(false); if (error.includes("ضعيف")) clearError(); }} placeholder="كلمة المرور" showEye showPassword={showPassword} setShowPassword={setShowPassword} />
                    <StrengthBar pw={signupForm.password} />
                    
                    {signupForm.registrationType === "direct" ? (
                      <div className="rounded-xl border border-blue-500/15 p-3 text-right" style={{ background: "rgba(59,130,246,0.04)" }}>
                        <p className="text-[10px] text-blue-600 leading-relaxed font-bold">⚠️ احفظ كلمة المرور — يمكنك استعادتها في أي وقت عبر بريدك الإلكتروني المفعل.</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-red-500/15 p-3 text-right" style={{ background: "rgba(239,68,68,0.04)" }}>
                        <p className="text-[10px] text-red-600 leading-relaxed font-bold">🚫 تنبيه: هذا الحساب غير مباشر ولا يدعم استعادة كلمة المرور إذا فقدتها.</p>
                      </div>
                    )}

                    <div className="relative z-50"><CountryPicker value={signupForm.country} onChange={(v) => setSignupForm({ ...signupForm, country: v })} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["male", "female"] as const).map((g) => (
                        <button key={g} type="button" onClick={() => setSignupForm({ ...signupForm, gender: g, avatar: AVATARS[g][0] })}
                          className="py-3 rounded-xl text-sm font-bold transition-all border"
                          style={signupForm.gender === g
                            ? { borderColor: "rgba(59,130,246,0.45)", color: "#2563eb", background: "rgba(59,130,246,0.08)" }
                            : { borderColor: "rgba(15,23,42,0.08)", color: "rgba(15,23,42,0.4)", background: "transparent" }}>
                          {g === "male" ? "👨 ذكر" : "👩 أنثى"}
                        </button>
                      ))}
                    </div>
                    <ErrorBox text={error} />
                    <GoldBtn type="submit" loading={isLoading} label={signupForm.registrationType === "direct" ? "التالي — إرسال كود التحقق" : "التالي — اختيار الصورة الرمزية"} />
                    <SubBtn onClick={() => { setView("login"); clearError(); }} label="العودة لتسجيل الدخول" />
                  </form>
                </Slide>
              )}

              {/* ── SIGNUP STEP 2 (OTP) ── */}
              {view === "signupOtp" && (
                <Slide key="signupOtp">
                  <Dots total={3} current={1} />
                  <CircleIcon color="#3b82f6"><ShieldCheck className="w-6 h-6" /></CircleIcon>
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-black text-slate-900 font-bold">تأكيد البريد الإلكتروني</h2>
                    <p className="text-slate-500 text-xs mt-2">أدخل الرمز المكوّن من 6 أرقام</p>
                    <p className="text-[#3b82f6] text-xs font-bold mt-1">{signupForm.email}</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-2">💡 لم يصلك الكود؟ تحقق من <span className="text-slate-600 font-bold">البريد غير المرغوب فيه (Spam)</span> — قد يظهر هناك. ارجع واضغط على النقاط الثلاث ⋮ واختر "ليس بريداً عشوائياً"</p>
                  </div>
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <OtpBoxes value={otpCode} onChange={setOtpCode} />
                    <ErrorBox text={error} />
                    <GoldBtn type="submit" loading={isLoading} label="تأكيد ومتابعة" />
                    <button type="button" onClick={async () => {
                      clearError(); setIsLoading(true);
                      try {
                        const res = await fetch(getApiUrl("/api/send-otp/"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: signupForm.email.trim(), reason: "إعادة إرسال كود التحقق", type: "signup", username: signupForm.username }) });
                        const data = await res.json();
                        if (!res.ok || !data.success) setError(data.error || "فشل إعادة الإرسال");
                      } catch { setError("فشل الاتصال"); } finally { setIsLoading(false); }
                    }} className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors py-1">
                      <RefreshCw className="w-3 h-3" /> إعادة إرسال الكود
                    </button>
                    <SubBtn onClick={() => { setView("signupInfo"); clearError(); setOtpCode(""); }} />
                  </form>
                </Slide>
              )}

              {/* ── SIGNUP STEP 3 (AVATAR) ── */}
              {view === "signupAvatar" && (
                <Slide key="signupAvatar">
                  <Dots total={3} current={2} />
                  <div className="text-center mb-5">
                    <h2 className="text-xl font-black text-slate-900 font-bold">الصورة الرمزية</h2>
                    <p className="text-slate-400 text-[11px] mt-1">الخطوة الأخيرة — اختر ما يعبر عنك</p>
                  </div>
                  <div className="grid grid-cols-5 gap-2 mb-5">
                    {AVATARS[signupForm.gender].map((url, i) => (
                      <motion.button key={i} type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
                        onClick={() => setSignupForm({ ...signupForm, avatar: url })}
                        className="relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200"
                        style={signupForm.avatar === url
                          ? { borderColor: "#3b82f6", boxShadow: "0 0 18px rgba(59,130,246,0.3)" }
                          : { borderColor: "rgba(15,23,42,0.08)", filter: "grayscale(55%)", opacity: 0.5 }}>
                        <img src={url} alt="" className="w-full h-full object-cover" style={{ background: "#f8fafc" }} />
                        {signupForm.avatar === url && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full border border-[#3b82f6] flex items-center justify-center"
                            style={{ background: "#ffffff" }}>
                            <Check className="w-2.5 h-2.5 text-[#3b82f6]" />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                  <ErrorBox text={error} />
                  <div className="flex gap-2.5">
                    <button onClick={() => { setView(emailVerified ? "signupInfo" : (signupForm.registrationType === "indirect" ? "signupInfo" : "signupOtp")); clearError(); }}
                      className="w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0 transition-colors"
                      style={{ background: "rgba(15,23,42,0.03)", borderColor: "rgba(15,23,42,0.07)", color: "rgba(15,23,42,0.5)" }}>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                    <div className="flex-1"><GoldBtn type="button" loading={isLoading} label="انطلق 🚀" onClick={handleCreateAccount} /></div>
                  </div>
                </Slide>
              )}

            </AnimatePresence>
          </div>

          {/* Bottom shimmer */}
          <div className="absolute bottom-0 left-10 right-10 h-px"
            style={{ background: "linear-gradient(90deg,transparent,rgba(15,23,42,0.035),transparent)" }} />
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════
// UI Primitives
// ════════════════════════════════════════════

function Slide({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

function CircleIcon({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 18 }}
      className="flex justify-center mb-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center border"
        style={{ background: `${color}12`, borderColor: `${color}28`, color }}>
        {children}
      </div>
    </motion.div>
  );
}

function Dots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div key={i} className="h-1.5 rounded-full"
          animate={{ width: i === current ? 22 : 6, opacity: i <= current ? 1 : 0.2 }}
          transition={{ duration: 0.3 }}
          style={{ background: i <= current ? "linear-gradient(90deg,#3b82f6,#4f46e5)" : "rgba(15,23,42,0.15)" }} />
      ))}
    </div>
  );
}

function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");
  return (
    <div className="relative" onClick={() => inputRef.current?.focus()}>
      <input ref={inputRef} required autoFocus type="number" value={value}
        onChange={(e) => { if (e.target.value.length <= 6) onChange(e.target.value); }}
        className="absolute inset-0 opacity-0 w-full cursor-text" style={{ zIndex: 1 }} />
      <div className="flex gap-2 justify-center">
        {digits.map((d, i) => (
          <motion.div key={i}
            animate={{ borderColor: d ? "#3b82f6" : value.length === i ? "rgba(59,130,246,0.5)" : "rgba(15,23,42,0.08)" }}
            transition={{ duration: 0.15 }}
            className="flex-1 h-12 rounded-xl flex items-center justify-center text-xl font-black text-slate-900 border-2 relative select-none"
            style={{ background: d ? "rgba(59,130,246,0.05)" : "rgba(15,23,42,0.02)", maxWidth: 48 }}>
            {d || <span className="text-slate-300 text-base font-light">·</span>}
            {value.length === i && (
              <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.85, repeat: Infinity }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 w-0.5 h-4 rounded-full bg-[#3b82f6]" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FancyInput({ icon, type, value, onChange, placeholder, dir = "rtl", showEye = false, showPassword, setShowPassword }: any) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div className="relative group">
      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-colors duration-200"
        style={{ color: focused ? "rgba(59,130,246,0.85)" : "rgba(15,23,42,0.3)" }}>
        <div className="[&>svg]:w-4 [&>svg]:h-4">{icon}</div>
      </div>
      <input required
        type={showEye ? (showPassword ? "text" : "password") : type}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={dir}
        className="w-full py-3.5 pr-10 pl-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 rounded-xl [direction:inherit] transition-all duration-200"
        style={{
          background: focused ? "rgba(0,0,0,0.01)" : "#ffffff",
          border: `1.5px solid ${focused ? "rgba(59,130,246,0.5)" : "rgba(15,23,42,0.08)"}`,
          boxShadow: focused ? "0 0 0 3px rgba(59,130,246,0.05)" : "none",
        }}
      />
      {showEye && (
        <button type="button" onClick={() => setShowPassword(!showPassword)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-slate-400 hover:text-slate-700 transition-colors">
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

function GoldBtn({ type, onClick, loading, label }: { type: "submit" | "button"; onClick?: () => void; loading: boolean; label: string }) {
  return (
    <motion.button type={type} onClick={onClick} disabled={loading}
      whileHover={{ scale: loading ? 1 : 1.016 }} whileTap={{ scale: loading ? 1 : 0.97 }}
      className="w-full py-3.5 rounded-xl font-black text-[13px] text-white flex items-center justify-center gap-2 disabled:opacity-50"
      style={{ background: "linear-gradient(135deg,#3b82f6,#4f46e5,#3b82f6)", backgroundSize: "200%", boxShadow: "0 4px 22px rgba(59,130,246,0.2)" }}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : label}
    </motion.button>
  );
}

function SubBtn({ onClick, label = "العودة" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium">
      {label}
    </button>
  );
}

function ErrorBox({ text }: { text: string }) {
  if (!text) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex items-start gap-2.5 rounded-xl p-3 border border-red-200"
      style={{ background: "rgba(239,68,68,0.04)" }}>
      <span className="mt-0.5 w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
        <span className="text-red-500 text-[10px] font-black leading-none">!</span>
      </span>
      <p className="text-red-500 text-xs font-bold leading-relaxed">{text}</p>
    </motion.div>
  );
}

function StrengthBar({ pw }: { pw: string }) {
  const checks = [
    { ok: /[A-Z]/.test(pw), label: "A-Z" },
    { ok: /[a-z]/.test(pw), label: "a-z" },
    { ok: /[0-9]/.test(pw), label: "123" },
    { ok: /[!@#$%^&*(),.?":{}|<>]/.test(pw), label: "!@#" },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"];
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((s) => (
          <motion.div key={s} className="flex-1 h-1 rounded-full"
            animate={{ background: score >= s ? colors[score] : "rgba(15,23,42,0.06)" }}
            transition={{ duration: 0.3 }} />
        ))}
      </div>
      <div className="flex justify-between px-0.5">
        {checks.map(({ ok, label }) => (
          <span key={label} className="text-[10px] flex items-center gap-0.5 font-mono transition-colors"
            style={{ color: ok ? "#10b981" : "rgba(15,23,42,0.25)" }}>
            {ok && <Check className="w-2.5 h-2.5" />}{label}
          </span>
        ))}
      </div>
    </div>
  );
}

function CountryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = ARAB_COUNTRIES.find((c) => c.name === value) || ARAB_COUNTRIES[0];
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3.5 px-3.5 rounded-xl text-sm border transition-all duration-200"
        style={{
          background: open ? "rgba(0,0,0,0.01)" : "#ffffff",
          borderColor: open ? "rgba(59,130,246,0.5)" : "rgba(15,23,42,0.08)",
        }}>
        <span className="flex items-center gap-2 font-medium" style={{ color: "rgba(15,23,42,0.8)" }}>
          <span className="text-lg">{selected.flag}</span>{selected.name}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          className="text-[10px]" style={{ color: "rgba(15,23,42,0.3)" }}>▼</motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.18 }}
            className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden border border-slate-200 z-[999]"
            style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(24px)", maxHeight: 176, overflowY: "auto", scrollbarWidth: "none" }}>
            {ARAB_COUNTRIES.map((c) => (
              <button key={c.name} type="button" onClick={() => { onChange(c.name); setOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left"
                style={{ color: value === c.name ? "#3b82f6" : "rgba(15,23,42,0.7)", background: "transparent" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.04)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <span className="font-medium">{c.name}</span>
                <span className="text-base">{c.flag}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
