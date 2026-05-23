"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldCheck, Users, Trophy, Trash2, 
  Search, RefreshCw, AlertTriangle, 
  MapPin, Star, TrendingUp, CheckCircle, Ban, PlusCircle, Calendar,
  Mail, Phone, ArrowUpRight, UserCheck, Loader2, Bell, Image as ImageIcon, Save
} from "lucide-react";
import surahsData from "@/data/surahs.json";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc, 
  writeBatch,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  deleteDoc,
  setDoc
} from "firebase/firestore";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

const ADMIN_EMAIL = "youssefosama@gmail.com";

export function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    topGovernorate: "...",
    totalPoints: 0,
    activeToday: 0,
    pushSubscribers: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  
  // Quest Management State
  const [questTitle, setQuestTitle] = useState("");
  const [questPoints, setQuestPoints] = useState(50);
  const [questTarget, setQuestTarget] = useState("mushaf");
  const [questSurahId, setQuestSurahId] = useState("1");
  const [isAddingQuest, setIsAddingQuest] = useState(false);
  const [activeQuests, setActiveQuests] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [isSettingAnnouncement, setIsSettingAnnouncement] = useState(false);
  
  // Push Notification State
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [isSendingPush, setIsSendingPush] = useState(false);
  
  // Login Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Subscription Requests State
  const [subRequests, setSubRequests] = useState<any[]>([]);
  const [isSubsLoading, setIsSubsLoading] = useState(false);
  
  // Showcase State
  const [showcaseItems, setShowcaseItems] = useState<any[]>([]);
  const [isAddingToShowcase, setIsAddingToShowcase] = useState(false);
  
  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    vodafoneCash: "",
    instapay: "",
    priceStarter: 100,
    priceSupporter: 200,
    pricePremium: 250
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "quests" | "subs" | "settings" | "showcase">("stats");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ["stats", "users", "quests", "subs", "settings", "showcase"].includes(tab)) {
      setActiveTab(tab as any);
    }

    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        fetchStats();
        fetchQuests();
        fetchAnnouncement();
        fetchPaymentSettings();
        fetchSubRequests();
        fetchShowcaseItems();
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState(null, '', url.toString());
    }
  }, [activeTab, isAdmin]);

  const fetchAnnouncement = async () => {
    if (!db) return;
    try {
      const docRef = doc(db, "settings", "global");
      const s = await getDoc(docRef);
      if (s.exists()) setAnnouncement(s.data().announcement || "");
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPaymentSettings = async () => {
    if (!db) return;
    try {
      const docRef = doc(db, "settings", "pricing");
      const s = await getDoc(docRef);
      if (s.exists()) {
        const data = s.data();
        setPaymentSettings({
          vodafoneCash: data.vodafoneCash || "",
          instapay: data.instapay || "",
          priceStarter: data.priceStarter || 100,
          priceSupporter: data.priceSupporter || 200,
          pricePremium: data.pricePremium || 250
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleSavePaymentSettings = async () => {
    if (!db) return;
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "pricing"), {
        ...paymentSettings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("تم حفظ إعدادات الدفع والأسعار بنجاح!");
    } catch (e) {
      console.error(e);
      alert("فشل حفظ الإعدادات");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchSubRequests = async () => {
    if (!db) return;
    setIsSubsLoading(true);
    try {
      const q = query(collection(db, "subscription_requests"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setSubRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
    finally { setIsSubsLoading(false); }
  };

  const fetchShowcaseItems = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, "showcase"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setShowcaseItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const handleAddToShowcase = async (videoUrl: string, userName: string, surahName: string) => {
    if (!db || !videoUrl) return;
    setIsAddingToShowcase(true);
    try {
      await addDoc(collection(db, "showcase"), {
        videoUrl,
        userName,
        surahName,
        createdAt: serverTimestamp()
      });
      alert("تمت الإضافة للمعرض بنجاح!");
      fetchShowcaseItems();
    } catch (e) { console.error(e); }
    finally { setIsAddingToShowcase(false); }
  };

  const handleDeleteShowcaseItem = async (id: string) => {
    if (!db || !window.confirm("حذف من المعرض؟")) return;
    try {
      await deleteDoc(doc(db, "showcase", id));
      fetchShowcaseItems();
    } catch (e) { console.error(e); }
  };

  const handleActionSubscription = async (requestId: string, userId: string, plan: string, action: 'approve' | 'reject') => {
    if (!db || !window.confirm(`هل أنت متأكد من ${action === 'approve' ? 'تفعيل' : 'رفض'} هذا الاشتراك؟`)) return;
    
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "subscription_requests", requestId), {
        status: action === 'approve' ? 'approved' : 'rejected',
        processedAt: serverTimestamp()
      });
      if (action === 'approve') {
        console.log("[Auth]: Writing profile to Firestore for UID:", userId);
        batch.update(doc(db, "users", userId), {
          plan: plan,
          isPremium: true,
          subscriptionActive: true,
          subscriptionType: plan,
          subscriptionDate: serverTimestamp()
        });
        console.log("[Auth]: Profile written successfully!");
      }
      await batch.commit();
      alert(action === 'approve' ? "تم تفعيل الاشتراك بنجاح!" : "تم رفض الطلب.");
      fetchSubRequests();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء تنفيذ الإجراء");
    }
  };

  const fetchStats = async () => {
    if (!db) return;
    try {
      console.log("[Admin]: Fetching users...");
      const snapshot = await getDocs(collection(db, "users"));
      console.log(`[Admin]: Found ${snapshot.docs.length} users.`);
      
      const usersData = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
      const totalPoints = usersData.reduce((acc, curr: any) => acc + (curr.totalPoints || 0), 0);
      const today = new Date().toISOString().split('T')[0];
      const activeTodayCount = usersData.filter((u: any) => {
        if (!u.lastActive) return false;
        // Handle both string ISO dates and Firebase Timestamps
        const lastActiveStr = typeof u.lastActive === 'string' ? u.lastActive : 
                             (u.lastActive.toDate ? u.lastActive.toDate().toISOString() : String(u.lastActive));
        return lastActiveStr.startsWith(today);
      }).length;
      const govCounts: any = {};
      usersData.forEach((u: any) => {
        if (u.governorate) govCounts[u.governorate] = (govCounts[u.governorate] || 0) + 1;
      });
      const govKeys = Object.keys(govCounts);
      const topGov = govKeys.length > 0 ? govKeys.reduce((a, b) => govCounts[a] > govCounts[b] ? a : b) : "لا توجد بيانات";
      const pushSubscribers = usersData.filter((u: any) => u.fcmToken).length;

      setStats({
        totalUsers: snapshot.size,
        topGovernorate: topGov,
        totalPoints: totalPoints,
        activeToday: activeTodayCount,
        pushSubscribers: pushSubscribers
      });
      
      const sortedUsers = usersData.sort((a: any, b: any) => (b.totalPoints || 0) - (a.totalPoints || 0));
      setUsers(sortedUsers);

      // Top 3 Reward Logic
      const top3 = sortedUsers.slice(0, 3);
      for (const topUser of top3) {
        const plan = (topUser as { uid: string; plan?: string }).plan;
        if (plan === "free" || !plan) {
           await updateDoc(doc(db, "users", (topUser as { uid: string }).uid), {
             plan: "starter",
             rewardedPlan: true,
             updatedAt: serverTimestamp()
           });
        }
      }
    } catch (e) {
      console.error("Error fetching admin stats:", e);
    }
  };

  const handleSetAnnouncement = async () => {
    if (!db) return;
    setIsSettingAnnouncement(true);
    try {
      await setDoc(doc(db, "settings", "global"), {
        announcement,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("تم تحديث الإعلان العام بنجاح!");
    } catch (e) { console.error(e); }
    finally { setIsSettingAnnouncement(false); }
  };

  const handleBanUser = async (uid: string, currentStatus: boolean) => {
    if (!db || !window.confirm(`هل أنت متأكد من ${currentStatus ? 'إلغاء حظر' : 'حظر'} هذا المستخدم؟`)) return;
    try {
      await updateDoc(doc(db, "users", uid), { isBanned: !currentStatus });
      fetchStats();
    } catch (e) { console.error(e); }
  };

  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !questTitle) return;
    setIsAddingQuest(true);
    try {
      await addDoc(collection(db, "global_quests"), {
        title: questTitle,
        points: questPoints,
        target: questTarget,
        surahId: questTarget === 'surah' ? questSurahId : null,
        createdAt: serverTimestamp(),
        active: true
      });
      setQuestTitle("");
      fetchQuests();
    } catch (e) { console.error(e); }
    finally { setIsAddingQuest(false); }
  };

  const fetchQuests = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, "global_quests"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setActiveQuests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const handleDeleteQuest = async (id: string) => {
    if (!db || !window.confirm("حذف هذه المهمة؟")) return;
    try {
      await deleteDoc(doc(db, "global_quests", id));
      fetchQuests();
    } catch (e) { console.error(e); }
  };

  const handleResetLeaderboard = async () => {
    if (!db || !window.confirm("هل أنت متأكد من تصفير جميع نقاط المستخدمين؟")) return;
    setIsResetting(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const batch = writeBatch(db);
      snapshot.docs.forEach((userDoc) => {
        batch.update(userDoc.ref, { totalPoints: 0, quranPoints: 0, athkarPoints: 0, listenPoints: 0, streakDays: 0 });
      });
      await batch.commit();
      alert("تم التصفير!");
      fetchStats();
    } catch (e) { console.error(e); }
    finally { setIsResetting(false); }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setLoginError("فشل تسجيل الدخول.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => 
        (u.displayName || u.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  }, [users, searchQuery]);

  const topUsers = users.slice(0, 5);

  if (loading) return null;

  if (!isAdmin) return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl">
       <form onSubmit={handleAdminLogin} className="w-full max-w-md space-y-6 rounded-[2.5rem] border border-white/10 bg-slate-900/95 p-8 shadow-2xl text-right">
          <div className="space-y-3">
             <h2 className="text-4xl font-black tracking-tight">مرحبا بك في مركز التحكم</h2>
             <p className="text-sm text-slate-400">سجل دخولك باستخدام حساب الإدارة للوصول إلى لوحة البيانات الكاملة وتجربة التحكم الاحترافية.</p>
          </div>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-white/10 p-4 rounded-3xl outline-none text-right" placeholder="الإيميل" />
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-white/10 p-4 rounded-3xl outline-none text-right" placeholder="كلمة المرور" />
          <button type="submit" disabled={isLoggingIn} className="w-full py-4 bg-gradient-to-r from-sky-400 to-violet-500 text-black rounded-3xl font-black shadow-xl shadow-sky-500/20">دخول لوحة الإدارة</button>
          {loginError && <p className="text-sm text-rose-400">{loginError}</p>}
       </form>
    </div>
  );

  return (
    <div className="h-full w-full bg-slate-950 text-white font-arabic p-4 md:p-8 pb-20 overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="text-sm text-slate-400 uppercase tracking-[0.22em]">لوحة الإدارة الرئيسية</p>
                <h1 className="text-4xl font-black tracking-tight">مرحباً يوسف أسامة</h1>
                <p className="max-w-2xl text-sm text-slate-400">تحكم في المستخدمين، الاشتراكات، المحتوى، والإعدادات من لوحة واحدة مصممة للتركيز على الأداء والبيانات الحقيقية.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-3xl bg-slate-950/90 p-4 text-center border border-white/10">
                  <p className="text-xs uppercase text-slate-400">الإجمالي</p>
                  <p className="mt-3 text-3xl font-black text-primary">{stats.totalUsers || 0}</p>
                  <p className="text-[11px] text-slate-500">مستخدم</p>
                </div>
                <div className="rounded-3xl bg-slate-950/90 p-4 text-center border border-white/10">
                  <p className="text-xs uppercase text-slate-400">اليوم</p>
                  <p className="mt-3 text-3xl font-black text-emerald-400">{stats.activeToday || 0}</p>
                  <p className="text-[11px] text-slate-500">نشط الآن</p>
                </div>
                <div className="rounded-3xl bg-slate-950/90 p-4 text-center border border-white/10">
                  <p className="text-xs uppercase text-slate-400">النقاط</p>
                  <p className="mt-3 text-3xl font-black text-violet-400">{stats.totalPoints.toLocaleString()}</p>
                  <p className="text-[11px] text-slate-500">كل الوقت</p>
                </div>
                <div className="rounded-3xl bg-slate-950/90 p-4 text-center border border-white/10">
                  <p className="text-xs uppercase text-slate-400">الجلسات</p>
                  <p className="mt-3 text-3xl font-black text-sky-400">{users.length || 0}</p>
                  <p className="text-[11px] text-slate-500">عدد المستخدمين</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">التحكم السريع</p>
                  <h2 className="text-2xl font-black">أبرز الإجراءات</h2>
                </div>
                <div className="rounded-3xl bg-white/5 px-4 py-3 text-sm text-slate-300">الوضع الحالي</div>
              </div>
              <div className="mt-6 grid gap-4">
                <button onClick={() => setActiveTab('users')} className="w-full rounded-3xl bg-slate-950/90 border border-white/10 px-5 py-4 text-right font-black hover:bg-slate-900 transition">عرض جدول المستخدمين</button>
                <button onClick={() => setActiveTab('subs')} className="w-full rounded-3xl bg-slate-950/90 border border-white/10 px-5 py-4 text-right font-black hover:bg-slate-900 transition">مراجعة الاشتراكات</button>
                <button onClick={() => setActiveTab('quests')} className="w-full rounded-3xl bg-slate-950/90 border border-white/10 px-5 py-4 text-right font-black hover:bg-slate-900 transition">إدارة المهام</button>
              </div>
            </div>
            <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">أهم المستخدمين</p>
              <div className="mt-4 space-y-3">
                {topUsers.map((user, index) => (
                  <div key={user.uid} className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/90 p-4">
                    <div>
                      <p className="font-black">{index + 1}. {user.displayName || 'مستخدم مجهول'}</p>
                      <p className="text-xs text-slate-500">@{user.username || 'غير محدد'}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-black text-primary">{user.totalPoints || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="rounded-[3rem] border border-white/10 bg-slate-900/70 p-2 backdrop-blur-xl overflow-x-auto no-scrollbar">
          <div className="flex gap-2 p-2">
            {[
              { id: 'stats', label: 'الإحصائيات', icon: TrendingUp },
              { id: 'users', label: 'المستخدمين', icon: Users },
              { id: 'subs', label: 'الاشتراكات', icon: ShieldCheck },
              { id: 'showcase', label: 'المعرض', icon: Star },
              { id: 'quests', label: 'المهام', icon: Bell },
              { id: 'settings', label: 'الإعدادات', icon: Phone }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex min-w-[10rem] items-center justify-center gap-2 rounded-3xl px-5 py-4 text-sm font-bold transition ${activeTab === tab.id ? 'bg-gradient-to-r from-sky-400 to-violet-500 text-black shadow-xl shadow-sky-500/20' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'stats' && (
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  { label: 'المستخدمين', value: stats.totalUsers, icon: Users },
                  { label: 'النشط اليوم', value: stats.activeToday, icon: UserCheck },
                  { label: 'إجمالي النقاط', value: stats.totalPoints.toLocaleString(), icon: Trophy }
                ].map((card) => (
                  <div key={card.label} className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 text-center">
                    <card.icon className="mx-auto mb-4 h-8 w-8 text-primary" />
                    <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">{card.label}</p>
                    <p className="mt-4 text-4xl font-black text-white">{card.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6">
                  <p className="text-sm text-slate-400 uppercase">تنبيه عام</p>
                  <textarea
                    value={announcement}
                    onChange={e => setAnnouncement(e.target.value)}
                    rows={4}
                    className="mt-4 w-full resize-none rounded-3xl border border-white/10 bg-slate-900/90 p-4 text-right text-sm outline-none placeholder:text-slate-500"
                    placeholder="اكتب نص التنبيه هنا"
                  />
                  <button
                    onClick={handleSetAnnouncement}
                    disabled={isSettingAnnouncement}
                    className="mt-5 w-full rounded-3xl bg-gradient-to-r from-sky-400 to-violet-500 px-5 py-4 text-black font-black transition hover:scale-[1.01]"
                  >
                    {isSettingAnnouncement ? <Loader2 className="inline-block h-5 w-5 animate-spin" /> : 'تحديث الإعلان'}
                  </button>
                </div>
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6">
                  <p className="text-sm text-slate-400 uppercase">تبريد سريع</p>
                  <p className="mt-4 text-sm text-slate-300">إعادة ضبط نقاط المتصدرين وتهيئة الجدول من جديد لجميع المستخدمين.</p>
                  <button
                    onClick={handleResetLeaderboard}
                    disabled={isResetting}
                    className="mt-6 w-full rounded-3xl bg-red-500 px-5 py-4 text-white font-black transition hover:shadow-lg hover:shadow-red-500/30"
                  >
                    {isResetting ? <Loader2 className="inline-block h-5 w-5 animate-spin" /> : 'تصفير نقاط المتصدرين'}
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">أفضل المستخدمين</h2>
                  <p className="text-sm text-slate-400">أعلى 5 مستخدمين من حيث النقاط.</p>
                </div>
                <span className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300">{topUsers.length} مستخدم</span>
              </div>
              <div className="mt-6 space-y-4">
                {topUsers.map((user, index) => (
                  <div key={user.uid} className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/90 p-4">
                    <div>
                      <p className="font-black">#{index + 1} {user.displayName || 'مستخدم مجهول'}</p>
                      <p className="text-xs text-slate-500">@{user.username || 'غير محدد'}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-black text-primary">{user.totalPoints || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'showcase' && (
          <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-2xl font-black">معرض المجتمع</h2>
                <p className="text-sm text-slate-400">تحكم في محتوى العرض، أضف أو احذف العناصر بسرعة.</p>
              </div>
              <button onClick={fetchShowcaseItems} className="rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-100 hover:bg-white/10 transition">تحديث العرض</button>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {showcaseItems.length === 0 ? (
                <div className="col-span-full rounded-[2rem] border border-dashed border-white/10 bg-slate-950/90 p-16 text-center text-slate-500">لا يوجد عناصر في المعرض حالياً.</div>
              ) : (
                showcaseItems.map(item => (
                  <div key={item.id} className="rounded-[2rem] border border-white/10 bg-slate-950/90 overflow-hidden shadow-lg shadow-black/20">
                    <div className="aspect-video bg-black p-4 flex items-center justify-center">
                      <a href={item.videoUrl} target="_blank" rel="noreferrer" className="text-primary font-black hover:underline">{item.surahName}</a>
                    </div>
                    <div className="p-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-black">{item.userName}</p>
                        <p className="text-xs text-slate-500">{item.surahName}</p>
                      </div>
                      <button onClick={() => handleDeleteShowcaseItem(item.id)} className="rounded-2xl bg-red-500/10 px-3 py-2 text-red-400 transition hover:bg-red-500/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-black">إعدادات الدفع</h2>
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-6 grid gap-5">
                <div className="space-y-2 text-right">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">رقم فودافون كاش</label>
                  <input
                    value={paymentSettings.vodafoneCash}
                    onChange={e => setPaymentSettings({ ...paymentSettings, vodafoneCash: e.target.value })}
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right text-sm outline-none focus:border-primary/40"
                    placeholder="010XXXXXXXX"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">يوزر إنستا باي</label>
                  <input
                    value={paymentSettings.instapay}
                    onChange={e => setPaymentSettings({ ...paymentSettings, instapay: e.target.value })}
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right text-sm outline-none focus:border-primary/40"
                    placeholder="username@instapay"
                  />
                </div>
              </div>
            </div>
            <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <h2 className="text-2xl font-black">إدارة الأسعار</h2>
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="space-y-2 text-right">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">خطة الهواة</label>
                  <input
                    type="number"
                    value={paymentSettings.priceStarter}
                    onChange={e => setPaymentSettings({ ...paymentSettings, priceStarter: parseInt(e.target.value) })}
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-center text-sm outline-none focus:border-primary/40"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">ادعم المشروع</label>
                  <input
                    type="number"
                    value={paymentSettings.priceSupporter}
                    onChange={e => setPaymentSettings({ ...paymentSettings, priceSupporter: parseInt(e.target.value) })}
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-center text-sm outline-none focus:border-primary/40"
                  />
                </div>
                <div className="space-y-2 text-right">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">البريميوم</label>
                  <input
                    type="number"
                    value={paymentSettings.pricePremium}
                    onChange={e => setPaymentSettings({ ...paymentSettings, pricePremium: parseInt(e.target.value) })}
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-center text-sm outline-none focus:border-primary/40"
                  />
                </div>
              </div>
              <button
                onClick={handleSavePaymentSettings}
                disabled={isSavingSettings}
                className="mt-8 w-full rounded-3xl bg-gradient-to-r from-sky-400 to-violet-500 px-5 py-4 text-black font-black transition hover:shadow-xl hover:shadow-sky-500/20"
              >
                {isSavingSettings ? <Loader2 className="inline-block h-5 w-5 animate-spin" /> : 'حفظ الإعدادات'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'subs' && (
          <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_35px_120px_rgba(15,23,42,0.18)] overflow-x-auto">
            <h2 className="text-2xl font-black">طلبات الاشتراك</h2>
            <div className="mt-6 min-w-[900px]">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.18em] text-slate-400 border-b border-white/10">
                    <th className="p-5">المستخدم</th>
                    <th className="p-5">الخطة</th>
                    <th className="p-5">المبلغ</th>
                    <th className="p-5">رابط المنصة</th>
                    <th className="p-5">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {subRequests.map(r => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-5">
                        <div className="space-y-1 text-right">
                          <p className="font-black">{r.userName}</p>
                          <p className="text-xs text-slate-500">{r.senderInfo}</p>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">{r.plan}</span>
                      </td>
                      <td className="p-5 font-black text-emerald-400">{r.amount || '---'} ج.م</td>
                      <td className="p-5">
                        {r.platformLink ? (
                          <a href={r.platformLink} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">فتح</a>
                        ) : '---'}
                      </td>
                      <td className="p-5">
                        <div className="flex flex-wrap gap-2 justify-end">
                          {r.status === 'pending' ? (
                            <button onClick={() => handleActionSubscription(r.id, r.userId, r.plan, 'approve')} className="rounded-3xl bg-emerald-500 px-4 py-2 text-[11px] font-black text-black transition hover:opacity-90">تفعيل</button>
                          ) : (
                            <button onClick={() => handleAddToShowcase(r.platformLink, r.userName, r.surahName || 'سورة')} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black text-slate-100 transition hover:bg-white/10">إضافة معرض</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'quests' && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
              <h2 className="text-2xl font-black mb-6">إنشاء مهمة جديدة</h2>
              <form onSubmit={handleAddQuest} className="space-y-5">
                <input value={questTitle} onChange={e => setQuestTitle(e.target.value)} className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right outline-none" placeholder="عنوان المهمة" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.18em] text-slate-400">نوع المهمة</label>
                    <select value={questTarget} onChange={e => setQuestTarget(e.target.value)} className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 outline-none text-right">
                      <option value="mushaf">📖 قراءة (الآية اليومية)</option>
                      <option value="mushaf-full">📱 المصحف الرقمي الكامل</option>
                      <option value="daily">📿 الأذكار والورد اليومي</option>
                      <option value="video">🎬 استوديو تصميم الفيديو</option>
                      <option value="surah">🎧 استماع لسورة معينة</option>
                      <option value="rank">🏆 لوحة المتصدرين</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.18em] text-slate-400">النقاط</label>
                    <input type="number" value={questPoints} onChange={e => setQuestPoints(parseInt(e.target.value))} className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-center outline-none" />
                  </div>
                </div>
                {questTarget === 'surah' && (
                  <div className="space-y-3 rounded-3xl border border-white/10 bg-slate-950/90 p-4">
                    <label className="text-xs uppercase tracking-[0.18em] text-slate-400">رقم السورة</label>
                    <div className="flex gap-3">
                      <input type="number" min="1" max="114" value={questSurahId} onChange={e => setQuestSurahId(e.target.value)} className="w-28 rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-center outline-none" />
                      <div className="flex-1 rounded-3xl bg-slate-900/80 p-4">
                        <span className="text-sm text-slate-400">{surahsData.find(s => s.id === parseInt(questSurahId))?.name ? `سورة ${surahsData.find(s => s.id === parseInt(questSurahId))?.name}` : 'رقم غير صحيح'}</span>
                      </div>
                    </div>
                  </div>
                )}
                <button type="submit" disabled={isAddingQuest} className="w-full rounded-3xl bg-gradient-to-r from-sky-400 to-violet-500 px-5 py-4 text-black font-black transition hover:shadow-xl hover:shadow-sky-500/30">
                  {isAddingQuest ? <Loader2 className="inline-block h-5 w-5 animate-spin" /> : 'نشر المهمة'}
                </button>
              </form>
            </div>
            <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
              <h2 className="text-2xl font-black mb-6">المهام الحالية</h2>
              <div className="space-y-4">
                {activeQuests.map(q => (
                  <div key={q.id} className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/90 p-4">
                    <div>
                      <p className="font-black">{q.title}</p>
                      <p className="text-xs text-slate-500">{q.target}</p>
                    </div>
                    <button onClick={() => handleDeleteQuest(q.id)} className="rounded-3xl border border-red-500/20 px-4 py-2 text-red-400 transition hover:bg-red-500/10">حذف</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_35px_120px_rgba(15,23,42,0.18)] overflow-x-auto">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-black">قائمة المستخدمين</h2>
                <p className="text-sm text-slate-400">ابحث وتابع حالة المستخدمين بسرعة.</p>
              </div>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right outline-none" placeholder="ابحث عن مستخدم..." />
            </div>
            <div className="mt-6 min-w-[900px]">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.18em] text-slate-400 border-b border-white/10">
                    <th className="p-5">المستخدم</th>
                    <th className="p-5">الهاتف</th>
                    <th className="p-5">الدولة</th>
                    <th className="p-5">النقاط</th>
                    <th className="p-5">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredUsers.map(u => (
                    <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                      <td className="p-5">
                        <div className="space-y-1 text-right">
                          <p className="font-black">{u.displayName || 'بدون اسم'}</p>
                          <p className="text-xs text-slate-500">@{u.username || 'no_username'}</p>
                        </div>
                      </td>
                      <td className="p-5"><span className="text-xs text-slate-300">{u.phoneNumber || '---'}</span></td>
                      <td className="p-5"><span className="text-xs text-slate-300">{u.governorate || '---'}</span></td>
                      <td className="p-5">
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm font-black text-primary">{u.totalPoints || 0}</span>
                      </td>
                      <td className="p-5">
                        <button onClick={() => handleBanUser(u.uid, u.isBanned)} className={`rounded-3xl px-4 py-2 text-[11px] font-black transition ${u.isBanned ? 'bg-emerald-500 text-black' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}>
                          {u.isBanned ? <><CheckCircle className="inline h-4 w-4" /> فك الحظر</> : <><Ban className="inline h-4 w-4" /> حظر</>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
