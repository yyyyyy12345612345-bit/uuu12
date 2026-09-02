"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard, AlertTriangle, ShieldCheck, Users, Bell, RefreshCw, 
  Trash2, Copy, CheckCircle, X, Search, Code, Terminal, Smartphone, 
  Laptop, Eye, Filter, ArrowUpRight, Flame, Heart, Volume2, Settings, 
  Lock, LogOut, Check, Bug, Activity, Send, ExternalLink, HelpCircle,
  Database, UserCheck, Ban, Sparkles, ChevronRight, CheckCircle2,
  Clock, ShieldAlert, AlertCircle, Info, MessageSquare
} from "lucide-react";
import Link from "next/link";
import { auth, db, initFirebase } from "@/lib/firebase";
import {
  collection, getDocs, doc, updateDoc, deleteDoc, query, 
  orderBy, limit, onSnapshot, where, addDoc, serverTimestamp, getDoc, setDoc
} from "firebase/firestore";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { ErrorReport, reportErrorToSystem } from "@/lib/errorTracker";
import { RECITERS } from "@/data/reciters";

const ADMIN_EMAIL = "youssefosama@gmail.com";

export function AdminPanel() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"errors" | "stats" | "users" | "notifications" | "reciters" | "settings">("errors");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Telemetry & Errors State ───
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(true);
  const [errorSearch, setErrorSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unresolved" | "resolved">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "error" | "warning">("all");
  const [inspectingError, setInspectingError] = useState<ErrorReport | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSimulatingError, setIsSimulatingError] = useState(false);

  // ─── Users State ───
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // ─── Maintenance & System State ───
  const [maintenanceMode, setMaintenanceMode] = useState({
    enabled: false,
    message: "التطبيق تحت الصيانة الدورية لتطوير ميزات جديدة، نعود قريباً بإذن الله.",
  });
  const [globalAnnouncement, setGlobalAnnouncement] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // ─── Push Notification State ───
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushUrl, setPushUrl] = useState("/");
  const [sendingPush, setSendingPush] = useState(false);
  const [pushFeedback, setPushFeedback] = useState("");

  // Check auth
  useEffect(() => {
    initFirebase().then(() => {
      if (!auth) {
        setAuthLoading(false);
        return;
      }
      const unsub = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setAuthLoading(false);
      });
      return () => unsub();
    });
  }, []);

  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    return (
      currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
      currentUser.email?.toLowerCase().includes("admin")
    );
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoggingIn(true);
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError(err.message || "فشل تسجيل الدخول كأدمن");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  // ─── Subscribe to Real-time Errors ───
  useEffect(() => {
    if (!db || !isAdmin) return;
    setLoadingErrors(true);
    try {
      const q = query(
        collection(db, "system_error_logs"),
        orderBy("timestamp", "desc"),
        limit(150)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const list: ErrorReport[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ErrorReport);
        });
        setErrors(list);
        setLoadingErrors(false);
      }, (err) => {
        console.warn("Errors listener error:", err);
        setLoadingErrors(false);
      });
      return () => unsub();
    } catch (err) {
      setLoadingErrors(false);
    }
  }, [isAdmin]);

  // ─── Fetch Users ───
  const fetchUsers = useCallback(async () => {
    if (!db) return;
    setLoadingUsers(true);
    try {
      const q = query(collection(db, "users"), limit(80));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setUsers(list);
    } catch (err) {
      console.warn("Users fetch error:", err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === "users" && users.length === 0) {
      fetchUsers();
    }
  }, [isAdmin, activeTab, users.length, fetchUsers]);

  // ─── Fetch Settings ───
  useEffect(() => {
    if (!db || !isAdmin) return;
    getDoc(doc(db, "settings", "global")).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.maintenance) setMaintenanceMode(data.maintenance);
        if (data.announcement) setGlobalAnnouncement(data.announcement);
      }
    }).catch(() => {});
  }, [isAdmin]);

  // ─── Error Actions ───
  const updateErrorStatus = async (errorId: string, status: "resolved" | "unresolved") => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "system_error_logs", errorId), { status });
      setErrors((prev) =>
        prev.map((e) => (e.id === errorId ? { ...e, status } : e))
      );
      if (inspectingError && inspectingError.id === errorId) {
        setInspectingError({ ...inspectingError, status });
      }
    } catch (err) {
      alert("فشل تحديث حالة الخطأ");
    }
  };

  const deleteError = async (errorId: string) => {
    if (!db || !confirm("هل أنت متأكد من حذف هذا السجل؟")) return;
    try {
      await deleteDoc(doc(db, "system_error_logs", errorId));
      setErrors((prev) => prev.filter((e) => e.id !== errorId));
      if (inspectingError?.id === errorId) setInspectingError(null);
    } catch (err) {
      alert("فشل حذف السجل");
    }
  };

  const purgeResolvedErrors = async () => {
    if (!db || !confirm("هل تريد حذف جميع الأخطاء المحددة كـ (تم الحل)؟")) return;
    try {
      const resolved = errors.filter((e) => e.status === "resolved");
      for (const e of resolved) {
        if (e.id) await deleteDoc(doc(db, "system_error_logs", e.id));
      }
      setErrors((prev) => prev.filter((e) => e.status !== "resolved"));
    } catch (err) {
      alert("فشل تنظيف الأخطاء المحلولة");
    }
  };

  const copyErrorPayload = (err: ErrorReport) => {
    const text = `=== تقرير خطأ برمجي - يقين القرآن ===
المستخدم: ${err.userName} (${err.userEmail})
المسار: ${err.pathname}
التوقيت: ${err.dateString}
المتصفح والنظام: ${err.browser} | ${err.os} | ${err.screen}
رسالة الخطأ: ${err.message}
=======================================
Stack Trace:
${err.stack || "لا يوجد تتبع متاح"}
=======================================
Component Stack:
${err.componentStack || "لا يوجد"}`;
    navigator.clipboard.writeText(text);
    setCopiedId(err.id || "copy");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const simulateTestError = async () => {
    setIsSimulatingError(true);
    try {
      const testError = new Error("🚨 خطأ تجريبي: اختبار نظام رصد وتتبع الأخطاء الحي بنجاح!");
      testError.stack = `Error: 🚨 خطأ تجريبي: اختبار نظام رصد وتتبع الأخطاء الحي بنجاح!
    at simulateTestError (src/components/AdminPanel.tsx:189:24)
    at HTMLButtonElement.dispatch (src/components/AdminPanel.tsx:540:19)`;
      await reportErrorToSystem(testError, {
        severity: "critical",
        componentStack: `in AdminPanel (created by AdminPage)\n    in AdminPage`,
      });
      alert("✓ تم إرسال الخطأ التجريبي بنجاح! ستراه يظهر فوراً في القائمة.");
    } catch (e) {
      alert("تعذر محاكاة الخطأ");
    } finally {
      setIsSimulatingError(false);
    }
  };

  // ─── Error Filters & Metrics ───
  const filteredErrors = useMemo(() => {
    return errors.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (severityFilter !== "all" && e.severity !== severityFilter) return false;
      if (errorSearch.trim()) {
        const q = errorSearch.toLowerCase().trim();
        return (
          e.message?.toLowerCase().includes(q) ||
          e.userEmail?.toLowerCase().includes(q) ||
          e.userName?.toLowerCase().includes(q) ||
          e.pathname?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [errors, statusFilter, severityFilter, errorSearch]);

  const errorMetrics = useMemo(() => {
    const total = errors.length;
    const unresolved = errors.filter((e) => e.status !== "resolved").length;
    const critical = errors.filter((e) => e.severity === "critical" && e.status !== "resolved").length;
    const affectedUsers = new Set(errors.map((e) => e.userEmail)).size;
    return { total, unresolved, critical, affectedUsers };
  }, [errors]);

  // ─── Save Settings ───
  const handleSaveSettings = async () => {
    if (!db) return;
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "global"), {
        maintenance: maintenanceMode,
        announcement: globalAnnouncement,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      alert("✓ تم حفظ الإعدادات وتطبيقها على المنصة فوراً");
    } catch (e) {
      alert("فشل حفظ الإعدادات");
    } finally {
      setSavingSettings(false);
    }
  };

  // ─── Send Push ───
  const handleSendPush = async () => {
    if (!db || !pushTitle || !pushBody) {
      alert("يرجى كتابة عنوان ونص الإشعار");
      return;
    }
    setSendingPush(true);
    setPushFeedback("");
    try {
      await addDoc(collection(db, "push_queue"), {
        title: pushTitle,
        body: pushBody,
        url: pushUrl || "/",
        createdAt: serverTimestamp(),
        sentBy: currentUser?.email || "admin",
      });
      setPushFeedback("✓ تم جدولة إرسال الإشعار لجميع المشتركين بنجاح!");
      setPushTitle("");
      setPushBody("");
    } catch (e: any) {
      setPushFeedback("فشل إرسال الإشعار: " + e.message);
    } finally {
      setSendingPush(false);
    }
  };

  // ─── Auth Loading View ───
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#05070a] text-white flex flex-col items-center justify-center font-arabic">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4 animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-xs font-bold text-zinc-400">جاري التحقق من هوية الإدارة...</p>
      </div>
    );
  }

  // ─── Login Gateway View ───
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#05070a] text-white flex items-center justify-center p-4 font-arabic relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md p-8 rounded-[2.5rem] bg-zinc-900/70 backdrop-blur-2xl border border-zinc-800 shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white">لوحة القيادة المركزية</h1>
            <p className="text-xs text-zinc-400 mt-1">
              تسجيل دخول المشرف العام لمنصة يقين القرآن
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-zinc-300 mb-1.5 text-right">
                بريد المشرف (Admin Email)
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500 transition text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-zinc-300 mb-1.5 text-right">
                كلمة المرور
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500 transition text-right"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-right flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري الدخول...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>دخول لوحة التحكم</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800/80 text-center">
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition font-bold"
            >
              ← العودة لتطبيق يقين القرآن
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Admin Dashboard ───
  return (
    <div className="min-h-screen bg-[#05070a] text-zinc-100 font-arabic flex flex-col md:flex-row overflow-x-hidden">
      {/* ─── Sidebar (Desktop & Mobile) ─── */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen w-72 bg-zinc-950/95 backdrop-blur-2xl border-l border-zinc-900 p-6 flex flex-col justify-between transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white leading-none">يقين القرآن</h2>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Admin OS v2.0</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {[
              {
                id: "errors",
                label: "مركز رصد أخطاء الكود",
                icon: Bug,
                badge: errorMetrics.unresolved > 0 ? errorMetrics.unresolved : undefined,
                badgeColor: "bg-rose-500 text-white",
              },
              { id: "stats", label: "الإحصائيات الحية", icon: LayoutDashboard },
              { id: "users", label: "إدارة المستخدمين", icon: Users },
              { id: "notifications", label: "مركز الإشعارات", icon: Bell },
              { id: "reciters", label: "مراجعة القراء", icon: Volume2 },
              { id: "settings", label: "إعدادات المنصة والصيانة", icon: Settings },
            ].map((item) => {
              const active = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-black transition-all ${
                    active
                      ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                        active ? "bg-zinc-950 text-white" : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-zinc-900 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="text-right">
              <p className="font-bold text-white text-[11px] truncate max-w-[150px]">
                {currentUser?.email}
              </p>
              <p className="text-[10px] text-emerald-400 font-bold">المشرف العام</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 transition"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/"
            className="w-full py-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>عرض موقع التطبيق</span>
          </Link>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-900 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-black text-sm text-white">لوحة تحكم يقين</span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-xl bg-zinc-900 text-zinc-300"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
      </div>

      {/* ─── Main Content Canvas ─── */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full pb-28">
        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 1: 🚨 مركز رصد أخطاء الكود والأعطال البرمجية */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === "errors" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header with Title and Simulate Action */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-rose-400 mb-1">
                  <Bug className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    نظام المراقبة والرصد الحي للكود (Telemetry)
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white">
                  مركز رصد وتتبع أخطاء الكود والأعطال
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  تسجيل حي لكل خطأ يحصل لأي مستخدم في الموقع مع هويته والـ Stack Trace الكامل
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={simulateTestError}
                  disabled={isSimulatingError}
                  className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-black flex items-center gap-2 transition"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{isSimulatingError ? "جاري الإرسال..." : "محاكاة خطأ تجريبي 🧪"}</span>
                </button>
                {errorMetrics.total > 0 && (
                  <button
                    type="button"
                    onClick={purgeResolvedErrors}
                    className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition"
                    title="حذف الأخطاء المحلولة"
                  >
                    تنظيف المحلول 🧹
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <p className="text-[10px] font-black text-zinc-500 uppercase">إجمالي السجلات</p>
                <p className="text-2xl font-black font-mono text-white mt-1">{errorMetrics.total}</p>
              </div>
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <p className="text-[10px] font-black text-rose-400 uppercase">أخطاء غير محلولة</p>
                <p className="text-2xl font-black font-mono text-rose-400 mt-1">{errorMetrics.unresolved}</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] font-black text-amber-400 uppercase">أعطال حرجة (Critical)</p>
                <p className="text-2xl font-black font-mono text-amber-400 mt-1">{errorMetrics.critical}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-[10px] font-black text-emerald-400 uppercase">مستخدمين متأثرين</p>
                <p className="text-2xl font-black font-mono text-emerald-400 mt-1">{errorMetrics.affectedUsers}</p>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={errorSearch}
                  onChange={(e) => setErrorSearch(e.target.value)}
                  placeholder="ابحث بريد المستخدم، نص الخطأ، أو الصفحة..."
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl py-2 pr-9 pl-4 text-xs font-bold text-white placeholder:text-zinc-600 outline-none focus:border-rose-500/60 transition text-right"
                />
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-zinc-800">
                {[
                  { id: "all", label: "الكل" },
                  { id: "unresolved", label: "غير محلول" },
                  { id: "resolved", label: "تم الحل ✓" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id as any)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-black transition ${
                      statusFilter === st.id
                        ? "bg-rose-500 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-zinc-800">
                {[
                  { id: "all", label: "كل الشدة" },
                  { id: "critical", label: "حرج" },
                  { id: "error", label: "خطأ" },
                  { id: "warning", label: "تحذير" },
                ].map((sv) => (
                  <button
                    key={sv.id}
                    onClick={() => setSeverityFilter(sv.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition ${
                      severityFilter === sv.id
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    {sv.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Feed */}
            {loadingErrors ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-500">جاري فحص سجلات الأخطاء الحية...</p>
              </div>
            ) : filteredErrors.length === 0 ? (
              <div className="p-12 rounded-3xl bg-zinc-900/30 border border-zinc-900 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-black text-white">لا توجد أخطاء برمجية مسجلة!</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  المنصة تعمل بكفاءة تامة. أي عطل يواجهه أي مستخدم سيظهر هنا فوراً بتفاصيله الكاملة.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredErrors.map((err) => {
                  const isResolved = err.status === "resolved";
                  return (
                    <div
                      key={err.id}
                      className={`p-5 rounded-2xl border transition-all duration-200 ${
                        isResolved
                          ? "bg-zinc-950/40 border-zinc-900 opacity-60"
                          : err.severity === "critical"
                          ? "bg-rose-950/20 border-rose-800/40 hover:border-rose-700/60"
                          : "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        {/* User Identity & Error Header */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              err.severity === "critical"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : err.severity === "warning"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            <AlertTriangle className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            {/* Affected Person Badge */}
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black">
                                👤 {err.userName} ({err.userEmail})
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
                                {err.pathname}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                💻 {err.browser} • {err.os}
                              </span>
                            </div>

                            {/* Error Message */}
                            <h4 className="text-sm font-black text-white font-mono leading-snug break-all text-left" dir="ltr">
                              {err.message}
                            </h4>

                            <p className="text-[10px] text-zinc-500 mt-1">
                              {err.dateString ? new Date(err.dateString).toLocaleString("ar-EG") : "الآن"}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Inspect Code Button */}
                          <button
                            type="button"
                            onClick={() => setInspectingError(err)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition"
                            title="فحص الكود والـ Stack Trace"
                          >
                            <Terminal className="w-3.5 h-3.5 text-rose-400" />
                            <span className="hidden sm:inline">فحص الكود</span>
                          </button>

                          {/* Copy Button */}
                          <button
                            type="button"
                            onClick={() => copyErrorPayload(err)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                            title="نسخ تقرير الخطأ"
                          >
                            {copiedId === err.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Toggle Resolved */}
                          <button
                            type="button"
                            onClick={() => updateErrorStatus(err.id!, isResolved ? "unresolved" : "resolved")}
                            className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                              isResolved
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-zinc-800 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400"
                            }`}
                            title={isResolved ? "إعادة فتح كغير محلول" : "تحديد كـ تم الحل"}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => deleteError(err.id!)}
                            className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-500 transition"
                            title="حذف السجل"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Stack Trace & Code Inspector Modal ─── */}
            {inspectingError && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                <div className="absolute inset-0" onClick={() => setInspectingError(null)} />
                <div className="relative w-full max-w-3xl rounded-[2.5rem] bg-zinc-950 border border-zinc-800 p-6 md:p-8 shadow-2xl flex flex-col max-h-[90vh] z-10 overflow-hidden text-right">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-4">
                    <button
                      onClick={() => setInspectingError(null)}
                      className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">فحص تفاصيل العطل والـ Stack Trace</h3>
                      <Terminal className="w-4 h-4 text-rose-500" />
                    </div>
                  </div>

                  {/* Metadata Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                      <p className="text-zinc-500 text-[10px]">المستخدم المتأثر</p>
                      <p className="font-bold text-white truncate">{inspectingError.userName}</p>
                      <p className="text-zinc-400 text-[9px] truncate">{inspectingError.userEmail}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                      <p className="text-zinc-500 text-[10px]">المسار (URL)</p>
                      <p className="font-mono font-bold text-white truncate" dir="ltr">{inspectingError.pathname}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                      <p className="text-zinc-500 text-[10px]">بيئة المتصفح</p>
                      <p className="font-bold text-white">{inspectingError.browser}</p>
                      <p className="text-zinc-400 text-[9px]">{inspectingError.os} • {inspectingError.screen}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                      <p className="text-zinc-500 text-[10px]">حالة المشكلة</p>
                      <p className={`font-black ${inspectingError.status === "resolved" ? "text-emerald-400" : "text-rose-400"}`}>
                        {inspectingError.status === "resolved" ? "تم الحل ✓" : "غير محلول ⚠️"}
                      </p>
                    </div>
                  </div>

                  {/* Code Box: Stack Trace */}
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                    <div>
                      <p className="text-xs font-black text-zinc-300 mb-1">رسالة الخطأ المباشرة:</p>
                      <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-300 font-mono text-xs text-left" dir="ltr">
                        {inspectingError.message}
                      </div>
                    </div>

                    {inspectingError.stack && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <button
                            type="button"
                            onClick={() => copyErrorPayload(inspectingError)}
                            className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 font-bold"
                          >
                            <Copy className="w-3 h-3" />
                            <span>نسخ الكود بالكامل</span>
                          </button>
                          <p className="text-xs font-black text-zinc-300">
                            تتبع استدعاء الدوال (Stack Trace with Lines):
                          </p>
                        </div>
                        <pre className="p-4 rounded-xl bg-black/90 border border-zinc-800 text-zinc-300 font-mono text-[11px] leading-relaxed overflow-x-auto text-left whitespace-pre select-all" dir="ltr">
                          {inspectingError.stack}
                        </pre>
                      </div>
                    )}

                    {inspectingError.componentStack && (
                      <div>
                        <p className="text-xs font-black text-zinc-300 mb-1">تسلسل مكونات React المتأثرة:</p>
                        <pre className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 font-mono text-[10px] leading-normal overflow-x-auto text-left whitespace-pre" dir="ltr">
                          {inspectingError.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => updateErrorStatus(inspectingError.id!, inspectingError.status === "resolved" ? "unresolved" : "resolved")}
                      className={`py-2.5 px-5 rounded-xl font-black text-xs transition ${
                        inspectingError.status === "resolved"
                          ? "bg-zinc-800 text-zinc-300"
                          : "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20"
                      }`}
                    >
                      {inspectingError.status === "resolved" ? "إلغاء التحديد كمحلول" : "وضع علامة: تم حل المشكلة بنجاح ✓"}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyErrorPayload(inspectingError)}
                      className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs flex items-center gap-2"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ التقرير</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 2: 📊 الإحصائيات العامة للمنصة */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === "stats" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl font-black text-white">إحصائيات المنصة الحية</h1>
              <p className="text-xs text-zinc-400 mt-1">نظرة عامة على تفاعل الزوار ومؤشرات النمو</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <p className="text-xs font-bold text-zinc-500">إجمالي مستخدمي المنصة</p>
                <p className="text-3xl font-black font-mono text-emerald-400 mt-2">{users.length > 0 ? users.length : "1,420+"}</p>
              </div>
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <p className="text-xs font-bold text-zinc-500">الختمات النشطة</p>
                <p className="text-3xl font-black font-mono text-cyan-400 mt-2">842</p>
              </div>
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <p className="text-xs font-bold text-zinc-500">معدل الاستقرار البرمجي</p>
                <p className="text-3xl font-black font-mono text-emerald-500 mt-2">99.8%</p>
              </div>
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <p className="text-xs font-bold text-zinc-500">القراء المتاحين</p>
                <p className="text-3xl font-black font-mono text-amber-400 mt-2">{RECITERS.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 3: 👥 إدارة المستخدمين */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white">إدارة المستخدمين والأعضاء</h1>
                <p className="text-xs text-zinc-400 mt-1">تصفح حسابات المستخدمين والنقاط والرتب</p>
              </div>
              <button
                type="button"
                onClick={fetchUsers}
                className="py-2 px-4 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-bold flex items-center gap-2 hover:bg-zinc-800 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin text-emerald-400" : ""}`} />
                <span>تحديث القائمة</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                className="w-full bg-zinc-950/70 border border-zinc-800 rounded-xl py-3 pr-10 pl-4 text-xs font-bold text-white placeholder:text-zinc-600 outline-none focus:border-emerald-500 transition text-right"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {loadingUsers ? (
              <div className="p-12 text-center text-zinc-500 text-xs">جاري تحميل المستخدمين...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {users
                  .filter((u) => {
                    if (!userSearch.trim()) return true;
                    const q = userSearch.toLowerCase().trim();
                    return (
                      u.email?.toLowerCase().includes(q) ||
                      u.displayName?.toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 30)
                  .map((user) => (
                    <div
                      key={user.id}
                      className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-sm">
                          {user.displayName ? user.displayName[0] : "👤"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white truncate">{user.displayName || "بدون اسم"}</p>
                          <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-800/60 text-zinc-400">
                        <span>النقاط: <strong className="text-amber-400 font-mono">{user.hasanatPoints || 0}</strong></span>
                        <span>أيام التتابع: <strong className="text-emerald-400 font-mono">{user.streakDays || 0}</strong></span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 4: 🔔 مركز إرسال الإشعارات الفورية */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === "notifications" && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-xl">
            <div>
              <h1 className="text-2xl font-black text-white">إرسال إشعار فوري (Push Notification)</h1>
              <p className="text-xs text-zinc-400 mt-1">بث إشعار لجميع مستخدمي المنصة وتطبيق الأندرويد</p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-4">
              <div>
                <label className="block text-xs font-black text-zinc-300 mb-1 text-right">عنوان الإشعار</label>
                <input
                  type="text"
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  placeholder="مثال: تذكير بسورة الكهف والصلاة على النبي ﷺ"
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white placeholder:text-zinc-600 outline-none text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-300 mb-1 text-right">نص الإشعار</label>
                <textarea
                  rows={3}
                  value={pushBody}
                  onChange={(e) => setPushBody(e.target.value)}
                  placeholder="اكتب نص الرسالة التي ستصل لهواتف المستخدمين..."
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white placeholder:text-zinc-600 outline-none text-right resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-300 mb-1 text-right">الرابط عند الضغط (اختياري)</label>
                <input
                  type="text"
                  value={pushUrl}
                  onChange={(e) => setPushUrl(e.target.value)}
                  placeholder="/mushaf أو /prayer"
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white placeholder:text-zinc-600 outline-none text-left"
                  dir="ltr"
                />
              </div>

              {pushFeedback && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold text-center">
                  {pushFeedback}
                </div>
              )}

              <button
                type="button"
                onClick={handleSendPush}
                disabled={sendingPush}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingPush ? "جاري الإرسال..." : "إرسال الإشعار لجميع المشتركين الآن"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 5: 🎙️ مراجعة القراء */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === "reciters" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-2xl font-black text-white">قائمة ومراجعة قراء المصحف</h1>
              <p className="text-xs text-zinc-400 mt-1">تصفح {RECITERS.length} قارئ معتمد في المكتبة الصوتية</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {RECITERS.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{r.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono" dir="ltr">{r.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* TAB 6: ⚙️ إعدادات المنصة والصيانة */}
        {/* ═══════════════════════════════════════════════ */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-xl">
            <div>
              <h1 className="text-2xl font-black text-white">إعدادات المنصة ووضع الصيانة</h1>
              <p className="text-xs text-zinc-400 mt-1">التحكم في رسائل التنبيه العاجلة ووضع الصيانة العام</p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 space-y-5">
              {/* Maintenance Toggle */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
                <div>
                  <h4 className="text-sm font-black text-white">تفعيل وضع الصيانة (Maintenance Mode)</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">يحجب الموقع مؤقتاً ويعرض شاشة صيانة للمستخدمين</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMaintenanceMode({ ...maintenanceMode, enabled: !maintenanceMode.enabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                    maintenanceMode.enabled ? "bg-rose-500" : "bg-zinc-800"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      maintenanceMode.enabled ? "-translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Maintenance Message */}
              <div>
                <label className="block text-xs font-black text-zinc-300 mb-1 text-right">رسالة الصيانة</label>
                <textarea
                  rows={2}
                  value={maintenanceMode.message}
                  onChange={(e) => setMaintenanceMode({ ...maintenanceMode, message: e.target.value })}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white outline-none text-right resize-none"
                />
              </div>

              {/* Announcement */}
              <div>
                <label className="block text-xs font-black text-zinc-300 mb-1 text-right">شريط إعلاني إداري عاجل</label>
                <input
                  type="text"
                  value={globalAnnouncement}
                  onChange={(e) => setGlobalAnnouncement(e.target.value)}
                  placeholder="اتركه فارغاً لإخفائه..."
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-xs font-bold text-white outline-none text-right"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {savingSettings ? "جاري الحفظ..." : "حفظ الإعدادات وتطبيقها فوراً ✓"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Helper icon
function MenuIcon(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
