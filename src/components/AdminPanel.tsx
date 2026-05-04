"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldCheck, Users, Trophy, Trash2, 
  Search, RefreshCw, AlertTriangle, 
  MapPin, Star, TrendingUp, CheckCircle, Ban, PlusCircle, Calendar,
  Mail, Phone, ArrowUpRight, UserCheck, Loader2, Bell
} from "lucide-react";
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
  
  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    vodafoneCash: "",
    instapay: "",
    priceStarter: 100,
    priceSupporter: 200,
    pricePremium: 250
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "quests" | "subs" | "settings">("stats");

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        fetchStats();
        fetchQuests();
        fetchAnnouncement();
        fetchPaymentSettings();
        fetchSubRequests();
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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

  const handleActionSubscription = async (requestId: string, userId: string, plan: string, action: 'approve' | 'reject') => {
    if (!db || !window.confirm(`هل أنت متأكد من ${action === 'approve' ? 'تفعيل' : 'رفض'} هذا الاشتراك؟`)) return;
    
    try {
      const batch = writeBatch(db);
      
      // 1. Update Request Status
      batch.update(doc(db, "subscription_requests", requestId), {
        status: action === 'approve' ? 'approved' : 'rejected',
        processedAt: serverTimestamp()
      });
      
      // 2. Update User Plan if approved
      if (action === 'approve') {
        batch.update(doc(db, "users", userId), {
          plan: plan,
          isPremium: true, // Legacy support for older components
          subscriptionActive: true,
          subscriptionType: plan,
          subscriptionDate: serverTimestamp()
        });
      }
      
      await batch.commit();
      alert(action === 'approve' ? "تم تفعيل الاشتراك بنجاح!" : "تم رفض الطلب.");
      fetchSubRequests();
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء تنفيذ الإجراء");
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
      alert("تم نشر التنبيه العام لجميع المستخدمين!");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSettingAnnouncement(false);
    }
  };

  const handleEditUserPoints = async (uid: string, currentPoints: number) => {
    const newPoints = window.prompt("أدخل عدد النقاط الجديد لهذا المستخدم:", currentPoints.toString());
    if (newPoints === null || !db) return;
    const pointsNum = parseInt(newPoints);
    if (isNaN(pointsNum)) return;

    try {
      await updateDoc(doc(db, "users", uid), {
        totalPoints: pointsNum
      });
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQuests = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, "global_quests"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setActiveQuests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStats = async () => {
    if (!db) return;
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const usersData = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
      
      const totalPoints = usersData.reduce((acc, curr: any) => acc + (curr.totalPoints || 0), 0);
      
      // Calculate active today (roughly based on lastActive)
      const today = new Date().toISOString().split('T')[0];
      const activeTodayCount = usersData.filter((u: any) => u.lastActive?.startsWith(today)).length;

      // Calculate top governorate
      const govCounts: any = {};
      usersData.forEach((u: any) => {
        if (u.governorate) {
          govCounts[u.governorate] = (govCounts[u.governorate] || 0) + 1;
        }
      });
      const govKeys = Object.keys(govCounts);
      const topGov = govKeys.length > 0 
        ? govKeys.reduce((a, b) => govCounts[a] > govCounts[b] ? a : b) 
        : "لا توجد بيانات";

      const pushSubscribers = usersData.filter((u: any) => u.fcmToken).length;

      setStats({
        totalUsers: snapshot.size,
        topGovernorate: topGov,
        totalPoints: totalPoints,
        activeToday: activeTodayCount,
        pushSubscribers: pushSubscribers
      });
      
      setUsers(usersData.sort((a: any, b: any) => (b.totalPoints || 0) - (a.totalPoints || 0)));
    } catch (e) {
      console.error("Error fetching admin stats:", e);
    }
  };

  const handleBanUser = async (uid: string, currentStatus: boolean) => {
    if (!db || !window.confirm(`هل أنت متأكد من ${currentStatus ? 'إلغاء حظر' : 'حظر'} هذا المستخدم؟`)) return;
    try {
      await updateDoc(doc(db, "users", uid), {
        isBanned: !currentStatus
      });
      fetchStats();
    } catch (e) {
      console.error("Error banning user:", e);
    }
  };

  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !questTitle) return;
    setIsAddingQuest(true);
    try {
      await addDoc(collection(db, "global_quests"), {
        title: questTitle,
        points: questPoints,
        createdAt: serverTimestamp(),
        active: true
      });
      setQuestTitle("");
      fetchQuests();
      alert("تمت إضافة المهمة بنجاح!");
    } catch (e) {
      console.error("Error adding quest:", e);
    } finally {
      setIsAddingQuest(false);
    }
  };

  const handleDeleteQuest = async (id: string) => {
    if (!db || !window.confirm("حذف هذه المهمة؟")) return;
    try {
      await deleteDoc(doc(db, "global_quests", id));
      fetchQuests();
    } catch (e) {
      console.error("Error deleting quest:", e);
    }
  };

  const handleResetLeaderboard = async () => {
    if (!db || !window.confirm("هل أنت متأكد من تصفير جميع نقاط المستخدمين؟ سيتم مسح النقاط لتبدأ مسابقة جديدة!")) return;
    
    setIsResetting(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const docs = snapshot.docs;
      
      // Firestore batch limits is 500 operations. We'll use a loop to handle any number of users.
      for (let i = 0; i < docs.length; i += 500) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + 500);
        
        chunk.forEach((userDoc) => {
          batch.update(userDoc.ref, {
            totalPoints: 0,
            quranPoints: 0,
            athkarPoints: 0,
            listenPoints: 0,
            streakDays: 0
          });
        });
        
        await batch.commit();
        console.log(`[Admin] Reset chunk ${i/500 + 1} committed`);
      }

      alert("تم تصفير لوحة المتصدرين بنجاح! مسابقة جديدة بدأت الآن.");
      fetchStats();
    } catch (e) {
      console.error("Error resetting leaderboard:", e);
      alert("حدث خطأ أثناء التصفير");
    } finally {
      setIsResetting(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      console.error(e);
      setLoginError("فشل تسجيل الدخول. تأكد من البريد وكلمة المرور.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.displayName || u.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phoneNumber || "").includes(searchQuery)
    );
  }, [users, searchQuery]);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-[1000]">
      <div className="flex flex-col items-center gap-4 text-center p-10">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-sm font-bold text-foreground/40 font-arabic">جاري التحقق من صلاحيات الإدارة...</p>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 font-arabic overflow-y-auto">
       <div className="absolute inset-0 bg-[#050505]">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-primary/5 animate-pulse" />
          <div className="absolute inset-0 islamic-pattern opacity-[0.05] scale-150 rotate-12" />
       </div>

       <div className="relative w-full max-w-md">
          <div className="relative bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-10 md:p-12 rounded-[3rem] flex flex-col items-center gap-8 shadow-2xl animate-in zoom-in-95 duration-700">
             
             <div className="relative group">
                <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full" />
                <div className="relative w-24 h-24 rounded-[2.5rem] bg-gradient-to-b from-primary to-amber-600 flex items-center justify-center shadow-2xl">
                   <ShieldCheck className="w-12 h-12 text-black" />
                </div>
             </div>
             
             <div className="text-center">
                <h2 className="text-4xl font-black text-white tracking-tight">لوحة الإدارة</h2>
                <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Secure Access Only</p>
             </div>

             <form onSubmit={handleAdminLogin} className="w-full space-y-6">
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold p-4 rounded-2xl text-center">
                    {loginError}
                  </div>
                )}
                
                <div className="space-y-2">
                   <input 
                     type="email" required value={email} onChange={e => setEmail(e.target.value)}
                     className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 text-white"
                     placeholder="admin@quran.com"
                   />
                   <input 
                     type="password" required value={password} onChange={e => setPassword(e.target.value)}
                     className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/50 text-white"
                     placeholder="••••••••••••"
                   />
                </div>

                <button 
                  type="submit" disabled={isLoggingIn}
                  className="w-full py-5 bg-gradient-to-r from-primary to-amber-500 text-black rounded-[1.8rem] font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                   {isLoggingIn ? <RefreshCw className="w-6 h-6 animate-spin" /> : "فتح لوحة التحكم"}
                </button>
             </form>
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-full w-full bg-background text-foreground font-arabic p-4 md:p-8 pt-6 pb-40 overflow-y-auto scroll-smooth">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Tab Switcher */}
        <div className="flex bg-card border border-border p-1.5 rounded-3xl w-full max-w-2xl mx-auto overflow-x-auto no-scrollbar">
            {[
                { id: "stats", label: "الإحصائيات", icon: TrendingUp },
                { id: "users", label: "المستخدمين", icon: Users },
                { id: "subs", label: "طلبات الاشتراكات", icon: ShieldCheck },
                { id: "quests", label: "المهام", icon: Star },
                { id: "settings", label: "الإعدادات والأسعار", icon: Bell }
            ].map((t) => (
                <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl transition-all whitespace-nowrap ${
                        activeTab === t.id ? 'bg-primary text-black font-bold shadow-lg' : 'text-foreground/40 hover:text-foreground'
                    }`}
                >
                    <t.icon className="w-4 h-4" />
                    <span className="text-sm">{t.label}</span>
                </button>
            ))}
        </div>

        {activeTab === "stats" && (
          <>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-card border border-border p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
           <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
           <div className="relative z-10 text-right">
              <div className="flex items-center gap-3 justify-end mb-2">
                 <span className="bg-primary/20 text-primary text-[10px] font-black px-3 py-1 rounded-full border border-primary/20 uppercase tracking-widest">System Overlord</span>
                 <h1 className="text-3xl font-black">مرحباً يا أستاذ يوسف أسامة</h1>
              </div>
              <p className="text-foreground/40 font-bold text-sm">لديك السيطرة الكاملة على تطبيق القرآن والمنافسات.</p>
           </div>
           <div className="flex items-center gap-4 relative z-10">
              <button onClick={fetchStats} className="p-4 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-2xl transition-all">
                <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <ShieldCheck className="w-16 h-16 text-primary" />
           </div>
        </div>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: "المستخدمين", value: stats.totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
             { label: "نشط اليوم", value: stats.activeToday, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" },
             { label: "أكثر محافظة", value: stats.topGovernorate, icon: MapPin, color: "text-amber-400", bg: "bg-amber-400/10" },
             { label: "إجمالي النقاط", value: stats.totalPoints.toLocaleString(), icon: Trophy, color: "text-primary", bg: "bg-primary/10" },
           ].map((s, i) => (
             <div key={i} className="bg-card border border-border p-8 rounded-[2.5rem] flex flex-col items-center text-center gap-3 shadow-lg hover:border-primary/20 transition-all group">
                <div className={`w-14 h-14 ${s.bg} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <s.icon className={`w-7 h-7 ${s.color}`} />
                </div>
                <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em]">{s.label}</p>
                <p className="text-3xl font-black">{s.value}</p>
             </div>
           ))}
        </div>
          </>
        )}

        {activeTab === "settings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-card border border-border p-8 rounded-[3rem] shadow-lg space-y-8">
                    <h3 className="text-xl font-bold flex items-center gap-3">إعدادات الدفع <Phone className="w-5 h-5 text-primary" /></h3>
                    <div className="space-y-4">
                        <div className="space-y-2 text-right">
                            <label className="text-[10px] font-black text-foreground/30 uppercase mr-4">رقم فودافون كاش</label>
                            <input 
                                value={paymentSettings.vodafoneCash} 
                                onChange={e => setPaymentSettings({...paymentSettings, vodafoneCash: e.target.value})}
                                className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 font-bold"
                                placeholder="010XXXXXXXX"
                            />
                        </div>
                        <div className="space-y-2 text-right">
                            <label className="text-[10px] font-black text-foreground/30 uppercase mr-4">يوزر انستا باي (Instapay ID)</label>
                            <input 
                                value={paymentSettings.instapay} 
                                onChange={e => setPaymentSettings({...paymentSettings, instapay: e.target.value})}
                                className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 font-bold"
                                placeholder="username@instapay"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border p-8 rounded-[3rem] shadow-lg space-y-8">
                    <h3 className="text-xl font-bold flex items-center gap-3">إدارة الأسعار (ج.م) <Trophy className="w-5 h-5 text-primary" /></h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2 text-right">
                            <label className="text-[10px] font-black text-foreground/30 uppercase">خطة الهواة</label>
                            <input 
                                type="number"
                                value={paymentSettings.priceStarter} 
                                onChange={e => setPaymentSettings({...paymentSettings, priceStarter: parseInt(e.target.value)})}
                                className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-4 text-center outline-none focus:border-primary/40 font-black text-xl"
                            />
                        </div>
                        <div className="space-y-2 text-right">
                            <label className="text-[10px] font-black text-foreground/30 uppercase">ادعم المشروع</label>
                            <input 
                                type="number"
                                value={paymentSettings.priceSupporter} 
                                onChange={e => setPaymentSettings({...paymentSettings, priceSupporter: parseInt(e.target.value)})}
                                className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-4 text-center outline-none focus:border-primary/40 font-black text-xl"
                            />
                        </div>
                        <div className="space-y-2 text-right">
                            <label className="text-[10px] font-black text-foreground/30 uppercase">البريميوم</label>
                            <input 
                                type="number"
                                value={paymentSettings.pricePremium} 
                                onChange={e => setPaymentSettings({...paymentSettings, pricePremium: parseInt(e.target.value)})}
                                className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-4 text-center outline-none focus:border-primary/40 font-black text-xl"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={handleSavePaymentSettings}
                        disabled={isSavingSettings}
                        className="w-full py-5 bg-primary text-black rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all"
                    >
                        {isSavingSettings ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "حفظ جميع الإعدادات والأسعار"}
                    </button>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-card border border-border p-8 rounded-[3rem] shadow-lg flex flex-col gap-6">
                        <h3 className="text-xl font-bold">تنبيه عام للمستخدمين</h3>
                        <textarea 
                            value={announcement} onChange={e => setAnnouncement(e.target.value)}
                            className="w-full bg-foreground/5 border border-border rounded-2xl p-6 text-right outline-none focus:border-primary/40 min-h-[120px] font-bold"
                            placeholder="اكتب التنبيه الذي سيظهر في شاشة الرئيسية..."
                        />
                        <button 
                            onClick={handleSetAnnouncement} disabled={isSettingAnnouncement}
                            className="w-full py-5 bg-foreground text-background rounded-2xl font-black transition-all hover:bg-foreground/90"
                        >
                            {isSettingAnnouncement ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "نشر التنبيه لجميع المستخدمين"}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {activeTab === "subs" && (
            <div className="bg-card border border-border rounded-[3.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 md:p-12 border-b border-border bg-foreground/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-right">
                            <h3 className="text-2xl font-black">طلبات الاشتراكات المعلقة</h3>
                            <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest mt-1">Review Payment Proofs & Activate Plans</p>
                        </div>
                    </div>
                    <button onClick={fetchSubRequests} className="p-4 bg-foreground/5 rounded-2xl hover:bg-foreground/10 transition-all">
                        <RefreshCw className={`w-5 h-5 ${isSubsLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-foreground/[0.02] text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] border-b border-border text-right">
                                <th className="p-8">المستخدم / المنصة</th>
                                <th className="p-8">نوع الخطة</th>
                                <th className="p-8">بيانات التحويل</th>
                                <th className="p-8">صورة الإثبات</th>
                                <th className="p-8 text-center">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {subRequests.filter(r => r.status === 'pending').length === 0 ? (
                                <tr><td colSpan={5} className="p-20 text-center text-foreground/10 font-black text-3xl italic uppercase">No Pending Requests</td></tr>
                            ) : (
                                subRequests.filter(r => r.status === 'pending').map((r) => (
                                    <tr key={r.id} className="hover:bg-foreground/[0.01] transition-colors">
                                        <td className="p-8">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-black text-lg">{r.userName}</span>
                                                <a href={r.platformLink} target="_blank" rel="noreferrer" className="text-primary text-[10px] font-bold flex items-center gap-1 hover:underline">
                                                    رابط منصته <ArrowUpRight className="w-3 h-3" />
                                                </a>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <span className="bg-primary/10 text-primary px-4 py-2 rounded-full font-black text-xs">
                                                {r.plan === 'starter' ? 'هواة (100ج)' : r.plan === 'supporter' ? 'داعم (200ج)' : 'بريميوم (250ج)'}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-sm text-foreground/70">{r.senderInfo}</span>
                                                <span className="text-[10px] text-foreground/30 uppercase">Method: {r.paymentMethod}</span>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            <a href={r.proofUrl} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-xl overflow-hidden border border-border flex items-center justify-center hover:scale-105 transition-all block">
                                                <img src={r.proofUrl} alt="إثبات الدفع" className="w-full h-full object-cover" />
                                            </a>
                                        </td>
                                        <td className="p-8">
                                            <div className="flex items-center justify-center gap-3">
                                                <button 
                                                    onClick={() => handleActionSubscription(r.id, r.userId, r.plan, 'approve')}
                                                    className="bg-emerald-500 text-black px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                                                >
                                                    تفعيل الحساب
                                                </button>
                                                <button 
                                                    onClick={() => handleActionSubscription(r.id, r.userId, r.plan, 'reject')}
                                                    className="bg-red-500/10 text-red-500 px-6 py-3 rounded-2xl font-black text-xs border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    رفض
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === "quests" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Push Notification Manager */}
          <div className="bg-card border border-border p-8 rounded-[3rem] shadow-lg flex flex-col gap-6">
             <div className="flex items-center justify-between">
                <div className="flex flex-col text-right">
                    <h3 className="text-xl font-bold flex items-center gap-2">إرسال إشعار Push للموبايل <Bell className="w-5 h-5 text-primary" /></h3>
                    <p className="text-[10px] text-primary/60 font-black">{stats.pushSubscribers} مستخدم مسجل حالياً</p>
                </div>
                <button 
                  onClick={async () => {
                    if (!db || !window.confirm("هل تريد إرسال إشعار 'صلّ على النبي' لجميع المستخدمين الآن؟")) return;
                    setIsSendingPush(true);
                    try {
                      await addDoc(collection(db, "push_queue"), {
                        title: "❤️ ذكرى",
                        body: "اللهم صلِّ وسلم وبارك على نبينا محمد ﷺ",
                        status: "pending",
                        scheduledFor: serverTimestamp(),
                        createdAt: serverTimestamp(),
                      });
                      alert("تم الإرسال بنجاح!");
                    } catch (e) { console.error(e); }
                    finally { setIsSendingPush(false); }
                  }}
                  className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[10px] font-black hover:bg-emerald-500 hover:text-white transition-all"
                >
                  إرسال صلّ على النبي ﷺ
                </button>
             </div>
             
             <form onSubmit={async (e) => {
                e.preventDefault();
                if (!db || !pushTitle || !pushBody) return;
                setIsSendingPush(true);
                try {
                  await addDoc(collection(db, "push_queue"), {
                    title: pushTitle,
                    body: pushBody,
                    status: "pending",
                    scheduledFor: serverTimestamp(),
                    createdAt: serverTimestamp(),
                    recipientCount: stats.pushSubscribers || 0
                  });
                  setPushTitle("");
                  setPushBody("");
                  alert("تم إدراج الإشعار في قائمة الإرسال! ستقوم خوادم Firebase بإرساله للجميع فوراً.");
                } catch (e) {
                  console.error(e);
                  alert("فشل إرسال الإشعار");
                } finally {
                  setIsSendingPush(false);
                }
             }} className="flex flex-col gap-4">
                <input 
                  value={pushTitle}
                  onChange={e => setPushTitle(e.target.value)}
                  className="w-full bg-foreground/5 border border-border rounded-2xl p-4 text-right outline-none focus:border-primary/40 font-bold"
                  placeholder="عنوان الإشعار (مثلاً: تنبيه هام)"
                />
                <textarea 
                  value={pushBody}
                  onChange={e => setPushBody(e.target.value)}
                  className="w-full bg-foreground/5 border border-border rounded-2xl p-4 text-right outline-none focus:border-primary/40 min-h-[80px] font-bold"
                  placeholder="نص الرسالة التي ستظهر في شاشة القفل..."
                />
                <button 
                  type="submit" disabled={isSendingPush}
                  className="w-full py-4 bg-primary text-black rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isSendingPush ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
                  إرسال الإشعار لجميع الهواتف
                </button>
                <p className="text-[9px] text-foreground/20 text-center font-bold">ملاحظة: الإرسال يتم عبر Firebase Cloud Messaging وتحتاج لتفعيل الـ Functions.</p>
             </form>
          </div>

          {/* Reset & Dangerous Actions */}
          <div className="bg-red-500/[0.02] border border-red-500/20 p-8 rounded-[3rem] shadow-lg flex flex-col gap-6">
             <div className="flex items-center justify-between">
                <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Danger Zone</span>
                <h3 className="text-xl font-bold text-red-500">إدارة المسابقات الكبرى</h3>
             </div>
             <div className="flex-1 flex flex-col justify-center gap-6">
                <p className="text-foreground/50 text-sm font-bold text-center leading-relaxed">
                  تصفير المسابقة سيقوم بمسح نقاط جميع المستخدمين (القرآن، الأذكار، الاستماع) ليبدأ الجميع من الصفر في دورة جديدة.
                </p>
                <button 
                  onClick={handleResetLeaderboard} disabled={isResetting}
                  className="w-full py-6 bg-red-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  {isResetting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Trash2 className="w-6 h-6" />}
                  تصفير المسابقة وبدء دورة جديدة
                </button>
             </div>
          </div>
        </div>

        {/* Quest Manager */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="bg-card border border-border p-8 rounded-[3rem] shadow-lg">
              <div className="flex items-center gap-3 mb-8">
                 <PlusCircle className="w-6 h-6 text-primary" />
                 <h3 className="text-xl font-bold">إضافة مهمة أسبوعية جديدة</h3>
              </div>
              <form onSubmit={handleAddQuest} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-foreground/30 uppercase mr-4">عنوان المهمة</label>
                    <input 
                       value={questTitle} onChange={e => setQuestTitle(e.target.value)}
                       className="w-full bg-foreground/5 border border-border rounded-2xl py-5 px-6 text-right outline-none focus:border-primary/40 font-bold"
                       placeholder="مثلاً: ختم سورة البقرة، أو استماع 10 ساعات"
                    />
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-1/3 space-y-2">
                       <label className="text-[10px] font-black text-foreground/30 uppercase mr-4">النقاط</label>
                       <input 
                          type="number" value={questPoints} onChange={e => setQuestPoints(parseInt(e.target.value))}
                          className="w-full bg-foreground/5 border border-border rounded-2xl py-5 px-6 text-center outline-none focus:border-primary/40 font-mono text-xl font-black"
                       />
                    </div>
                    <button 
                       type="submit" disabled={isAddingQuest}
                       className="flex-1 mt-6 py-5 bg-primary text-black rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                       نشر المهمة الآن
                    </button>
                 </div>
              </form>
           </div>

           <div className="bg-card border border-border p-8 rounded-[3rem] shadow-lg flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                 <Calendar className="w-6 h-6 text-primary" />
                 <h3 className="text-xl font-bold">المهام الحالية</h3>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[350px] no-scrollbar space-y-3">
                 {activeQuests.length === 0 ? (
                   <div className="h-full flex items-center justify-center text-foreground/10 font-black text-2xl uppercase italic">No Active Quests</div>
                 ) : (
                   activeQuests.map(q => (
                     <div key={q.id} className="flex items-center justify-between p-6 bg-foreground/[0.02] rounded-3xl border border-border group hover:border-primary/20 transition-all">
                        <button onClick={() => handleDeleteQuest(q.id)} className="text-red-500/20 hover:text-red-500 p-2 transition-all"><Trash2 className="w-5 h-5" /></button>
                        <div className="text-right">
                           <p className="font-black text-lg">{q.title}</p>
                           <p className="text-primary font-black text-sm">+{q.points} نقطة</p>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-card border border-border rounded-[3.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="p-8 md:p-12 border-b border-border flex flex-col md:flex-row items-center justify-between gap-8 bg-foreground/[0.01]">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                 </div>
                 <div className="text-right">
                    <h3 className="text-2xl font-black">قاعدة بيانات المتسابقين</h3>
                    <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest mt-1">Full User Details & Controls</p>
                 </div>
              </div>
              
              <div className="relative w-full md:w-[400px] group">
                 <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20 group-focus-within:text-primary transition-colors" />
                 <input 
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="ابحث بالاسم، الإيميل، أو رقم الهاتف..."
                    className="w-full bg-foreground/5 border border-border rounded-full py-5 pr-14 pl-8 text-sm outline-none focus:border-primary/30 transition-all font-bold"
                 />
              </div>
           </div>

           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-right">
                 <thead>
                    <tr className="bg-foreground/[0.02] text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] border-b border-border">
                       <th className="p-8">المتسابق</th>
                       <th className="p-8">معلومات التواصل</th>
                       <th className="p-8">الموقع</th>
                       <th className="p-8">توزيع النقاط</th>
                       <th className="p-8 text-center">الإجراءات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={5} className="p-20 text-center text-foreground/10 font-black text-3xl italic uppercase">No Users Found</td></tr>
                    ) : (
                      filteredUsers.map((u, i) => (
                        <tr key={u.uid} className={`group hover:bg-foreground/[0.01] transition-colors ${u.isBanned ? 'bg-red-500/[0.03] opacity-60' : ''}`}>
                           <td className="p-8">
                              <div className="flex items-center gap-4">
                                 <span className="text-[10px] font-mono font-bold text-foreground/10">{i + 1}</span>
                                 <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-border bg-background shadow-md">
                                       <img src={u.photoURL || "/logo/logo.png"} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    {u.isBanned && <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"><Ban className="w-3 h-3" /></div>}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="font-black text-lg text-foreground leading-tight">{u.displayName || u.username}</span>
                                    <span className="text-[11px] text-primary/60 font-mono">@{u.username}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="p-8">
                              <div className="flex flex-col gap-1.5">
                                 <div className="flex items-center gap-2 text-foreground/60 font-bold text-sm">
                                    <Phone className="w-3.5 h-3.5 text-primary/40" />
                                    {u.phoneNumber || "N/A"}
                                 </div>
                                 <div className="flex items-center gap-2 text-[11px] text-foreground/30 font-medium">
                                    <Mail className="w-3.5 h-3.5" />
                                    {u.email || "N/A"}
                                 </div>
                              </div>
                           </td>
                           <td className="p-8">
                              <div className="flex flex-col gap-1">
                                 <div className="flex items-center gap-2 text-foreground/80 font-black text-sm">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                    {u.governorate}
                                 </div>
                                 <span className="text-[10px] text-foreground/20 font-bold uppercase">UID: {u.uid.slice(0, 8)}</span>
                              </div>
                           </td>
                           <td className="p-8">
                              <div className="flex flex-col gap-2">
                                 <div className="flex items-center gap-3">
                                    <span className="text-2xl font-black text-primary leading-none">{u.totalPoints?.toLocaleString()}</span>
                                    <button 
                                       onClick={() => handleEditUserPoints(u.uid, u.totalPoints)}
                                       className="p-1.5 bg-primary/10 rounded-lg text-primary hover:bg-primary text-black transition-all opacity-0 group-hover:opacity-100"
                                    >
                                       <PlusCircle className="w-3.5 h-3.5" />
                                    </button>
                                 </div>
                                 <div className="flex gap-4 text-[9px] font-black uppercase text-foreground/20">
                                    <span className="flex items-center gap-1">📖 {u.quranPoints || 0}</span>
                                    <span className="flex items-center gap-1">📿 {u.athkarPoints || 0}</span>
                                    <span className="flex items-center gap-1">🎧 {u.listenPoints || 0}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="p-8">
                              <div className="flex items-center justify-center gap-2">
                                 <button 
                                    onClick={() => handleBanUser(u.uid, u.isBanned)}
                                    className={`p-4 rounded-2xl transition-all shadow-md active:scale-90 ${u.isBanned ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white'}`}
                                    title={u.isBanned ? "فك الحظر" : "حظر المتسابق"}
                                 >
                                    {u.isBanned ? <CheckCircle className="w-5 h-5" /> : <Ban className="w-5 h-5" />}
                                 </button>
                                 <button className="p-4 bg-foreground/5 text-foreground/30 rounded-2xl border border-border hover:text-primary hover:border-primary/20 transition-all shadow-md">
                                    <ArrowUpRight className="w-5 h-5" />
                                 </button>
                              </div>
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  );
}
