"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldCheck, Users, Trophy, Trash2, 
  Search, RefreshCw, AlertTriangle, 
  MapPin, Star, TrendingUp, CheckCircle, Ban, PlusCircle, Calendar,
  Mail, Phone, ArrowUpRight, UserCheck, Loader2, Bell, Image as ImageIcon, Save
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
        batch.update(doc(db, "users", userId), {
          plan: plan,
          isPremium: true,
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

  const fetchStats = async () => {
    if (!db) return;
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const usersData = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
      const totalPoints = usersData.reduce((acc, curr: any) => acc + (curr.totalPoints || 0), 0);
      const today = new Date().toISOString().split('T')[0];
      const activeTodayCount = usersData.filter((u: any) => u.lastActive?.startsWith(today)).length;
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
        if (topUser.plan === "free" || !topUser.plan) {
           await updateDoc(doc(db, "users", topUser.uid), {
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
    return users.filter(u => 
      (u.displayName || u.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  if (loading) return null;

  if (!isAdmin) return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-background">
       <form onSubmit={handleAdminLogin} className="w-full max-w-md space-y-6 text-right">
          <h2 className="text-3xl font-black">لوحة الإدارة</h2>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-card border border-border p-4 rounded-2xl outline-none" placeholder="الإيميل" />
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-card border border-border p-4 rounded-2xl outline-none" placeholder="كلمة المرور" />
          <button type="submit" disabled={isLoggingIn} className="w-full py-4 bg-primary text-black rounded-2xl font-black">دخول</button>
       </form>
    </div>
  );

  return (
    <div className="h-full w-full bg-background text-foreground font-arabic p-4 md:p-8 pt-6 pb-40 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex bg-card border border-border p-1.5 rounded-3xl w-full max-w-2xl mx-auto overflow-x-auto no-scrollbar">
            {[
                { id: "stats", label: "الإحصائيات", icon: TrendingUp },
                { id: "users", label: "المستخدمين", icon: Users },
                { id: "subs", label: "الاشتراكات", icon: ShieldCheck },
                { id: "showcase", label: "المعرض", icon: Star },
                { id: "quests", label: "المهام", icon: Bell },
                { id: "settings", label: "الإعدادات", icon: Phone }
            ].map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-primary text-black font-bold' : 'text-foreground/40'}`}>
                    <t.icon className="w-4 h-4" />
                    <span className="text-sm">{t.label}</span>
                </button>
            ))}
        </div>

        {activeTab === "stats" && (
          <>
            <div className="bg-card border border-border p-8 rounded-[3rem] flex items-center justify-between">
               <h1 className="text-3xl font-black">مرحباً يوسف أسامة</h1>
               <ShieldCheck className="w-16 h-16 text-primary" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { label: "المستخدمين", value: stats.totalUsers, icon: Users },
                 { label: "نشط اليوم", value: stats.activeToday, icon: UserCheck },
                 { label: "إجمالي النقاط", value: stats.totalPoints.toLocaleString(), icon: Trophy },
               ].map((s, i) => (
                 <div key={i} className="bg-card border border-border p-8 rounded-[2.5rem] flex flex-col items-center gap-3">
                    <s.icon className="w-7 h-7 text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest">{s.label}</p>
                    <p className="text-3xl font-black">{s.value}</p>
                 </div>
               ))}
             </div>

             {/* Global Announcement Banner Management */}
             <div className="bg-card border border-border p-8 rounded-[3rem] shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black flex items-center gap-3">شريط التنبيهات العلوي <Bell className="w-6 h-6 text-primary" /></h3>
                    <span className="text-[10px] font-bold text-foreground/30 uppercase">يظهر لجميع المستخدمين في أعلى الشاشة</span>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                        value={announcement} 
                        onChange={e => setAnnouncement(e.target.value)}
                        className="flex-1 bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 font-bold"
                        placeholder="اكتب نص التنبيه هنا (مثال: تم تحديث التطبيق للإصدار 3.2)"
                    />
                    <button 
                        onClick={handleSetAnnouncement}
                        disabled={isSettingAnnouncement}
                        className="px-10 py-4 bg-primary text-black rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                        {isSettingAnnouncement ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        تحديث الإعلان
                    </button>
                </div>
             </div>
          </>
        )}

        {activeTab === "showcase" && (
          <div className="bg-card border border-border rounded-[3.5rem] shadow-2xl overflow-hidden">
             <div className="p-8 border-b border-border flex items-center justify-between">
                <h3 className="text-2xl font-black flex items-center gap-3">معرض المجتمع <Star className="w-6 h-6 text-primary" /></h3>
                <button onClick={fetchShowcaseItems} className="p-4 bg-foreground/5 rounded-2xl">
                    <RefreshCw className="w-5 h-5" />
                </button>
             </div>
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {showcaseItems.length === 0 ? (
                  <div className="col-span-full p-20 text-center text-foreground/10 font-black text-3xl italic uppercase">Showcase is Empty</div>
                ) : (
                  showcaseItems.map(item => (
                    <div key={item.id} className="bg-foreground/[0.02] border border-border rounded-[2.5rem] overflow-hidden group hover:border-primary/20 transition-all flex flex-col">
                       <div className="aspect-video relative bg-black flex items-center justify-center p-4">
                          <a href={item.videoUrl} target="_blank" rel="noreferrer" className="text-primary font-black hover:underline text-center">{item.surahName}</a>
                       </div>
                       <div className="p-6 flex items-center justify-between">
                          <div className="flex flex-col">
                             <span className="font-black text-sm">{item.userName}</span>
                             <span className="text-[10px] text-foreground/30">{item.surahName}</span>
                          </div>
                          <button onClick={() => handleDeleteShowcaseItem(item.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
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
            </div>
        )}

        {activeTab === "subs" && (
            <div className="bg-card border border-border rounded-[3rem] overflow-hidden">
                <table className="w-full text-right">
                    <thead>
                        <tr className="bg-foreground/5 text-[10px] font-black uppercase border-b border-border">
                            <th className="p-6">المستخدم</th>
                            <th className="p-6">الخطة</th>
                            <th className="p-6">الإجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subRequests.map(r => (
                            <tr key={r.id} className="border-b border-border/50">
                                <td className="p-6 font-bold">{r.userName}</td>
                                <td className="p-6">{r.plan}</td>
                                <td className="p-6">
                                    <div className="flex gap-2">
                                        {r.status === 'pending' && (
                                           <div className="flex flex-col gap-2">
                                              {r.proofUrl && (
                                                 <button 
                                                   onClick={() => window.open(r.proofUrl, '_blank')}
                                                   className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-[9px] font-black flex items-center justify-center gap-1"
                                                 >
                                                    <ImageIcon className="w-3 h-3" /> عرض الإيصال
                                                 </button>
                                              )}
                                              <button onClick={() => handleActionSubscription(r.id, r.userId, r.plan, 'approve')} className="bg-emerald-500 text-black px-4 py-2 rounded-xl text-[10px] font-black">تفعيل</button>
                                           </div>
                                        )}
                                        {r.status === 'approved' && (
                                           <button onClick={() => handleAddToShowcase(r.platformLink, r.userName, r.surahName || "سورة")} className="bg-primary/20 text-primary px-4 py-2 rounded-xl text-[10px] font-black">إضافة للمعرض</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === "quests" && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-card border border-border p-8 rounded-[3rem]">
                 <h3 className="text-xl font-bold mb-6">إضافة مهمة</h3>
                 <form onSubmit={handleAddQuest} className="space-y-4">
                    <input value={questTitle} onChange={e => setQuestTitle(e.target.value)} className="w-full bg-foreground/5 p-4 rounded-2xl outline-none" placeholder="عنوان المهمة" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-foreground/30 mr-2 uppercase">الوجهة (Target)</label>
                          <select 
                             value={questTarget} onChange={e => setQuestTarget(e.target.value)}
                             className="w-full bg-foreground/5 border border-border rounded-xl p-3 text-right font-bold text-xs"
                          >
                             <option value="mushaf">الآية اليومية</option>
                             <option value="mushaf-full">المصحف الرقمي</option>
                             <option value="daily">الأذكار والورد</option>
                             <option value="video">استوديو الفيديو</option>
                             <option value="surah">سورة محددة</option>
                             <option value="rank">لوحة المتصدرين</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-foreground/30 mr-2 uppercase">النقاط</label>
                          <input 
                             type="number" value={questPoints} onChange={e => setQuestPoints(parseInt(e.target.value))}
                             className="w-full bg-foreground/5 border border-border rounded-xl p-3 text-center font-black"
                          />
                       </div>
                    </div>
                    {questTarget === 'surah' && (
                       <div className="space-y-1">
                          <label className="text-[10px] font-black text-foreground/30 mr-2 uppercase">رقم السورة</label>
                          <input 
                             type="number" value={questSurahId} onChange={e => setQuestSurahId(e.target.value)}
                             className="w-full bg-foreground/5 border border-border rounded-xl p-4 text-center font-bold"
                             placeholder="مثلاً 18 لسورة الكهف"
                          />
                       </div>
                    )}
                    <button type="submit" disabled={isAddingQuest} className="w-full py-4 bg-primary text-black rounded-2xl font-black">
                       {isAddingQuest ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "نشر المهمة"}
                    </button>
                 </form>
              </div>
              <div className="bg-card border border-border p-8 rounded-[3rem] space-y-4">
                 {activeQuests.map(q => (
                    <div key={q.id} className="flex items-center justify-between p-4 bg-foreground/5 rounded-2xl">
                       <p className="font-bold">{q.title}</p>
                       <button onClick={() => handleDeleteQuest(q.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === "users" && (
           <div className="bg-card border border-border rounded-[3rem] overflow-hidden">
              <div className="p-6 border-b border-border">
                 <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-foreground/5 p-4 rounded-2xl outline-none" placeholder="ابحث عن مستخدم..." />
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-right">
                    <tbody className="divide-y divide-border">
                       {filteredUsers.map(u => (
                          <tr key={u.uid} className="hover:bg-foreground/5">
                             <td className="p-6 font-bold">{u.displayName || u.username}</td>
                             <td className="p-6 text-primary font-black">{u.totalPoints} نقطة</td>
                             <td className="p-6">
                                <button onClick={() => handleBanUser(u.uid, u.isBanned)} className={`p-3 rounded-xl ${u.isBanned ? 'bg-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                   {u.isBanned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
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
