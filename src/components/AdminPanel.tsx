"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Users, Trophy, Trash2, 
  Search, RefreshCw, AlertTriangle, 
  MapPin, Star, TrendingUp, CheckCircle, Ban, PlusCircle, Calendar
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  writeBatch,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  deleteDoc,
  setDoc
} from "firebase/firestore";

const ADMIN_EMAIL = "youssefosama@gmail.com";

export function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    topGovernorate: "...",
    totalPoints: 0
  });
  const [users, setUsers] = useState<any[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  
  // Quest Management State
  const [questTitle, setQuestTitle] = useState("");
  const [questPoints, setQuestPoints] = useState(50);
  const [isAddingQuest, setIsAddingQuest] = useState(false);
  const [activeQuests, setActiveQuests] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [isSettingAnnouncement, setIsSettingAnnouncement] = useState(false);

  useEffect(() => {
    const checkAdmin = () => {
      const user = auth?.currentUser;
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        fetchStats();
        fetchQuests();
        fetchAnnouncement();
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    checkAdmin();
  }, []);

  const fetchAnnouncement = async () => {
    if (!db) return;
    const docRef = doc(db, "settings", "global");
    const s = await getDoc(docRef);
    if (s.exists()) setAnnouncement(s.data().announcement || "");
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
    const q = query(collection(db, "global_quests"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setActiveQuests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchStats = async () => {
    if (!db) return;
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const usersData = snapshot.docs.map(d => d.data());
      
      const totalPoints = usersData.reduce((acc, curr) => acc + (curr.totalPoints || 0), 0);
      
      // Calculate top governorate
      const govCounts: any = {};
      usersData.forEach((u: any) => {
        if (u.governorate) {
          govCounts[u.governorate] = (govCounts[u.governorate] || 0) + 1;
        }
      });
      const topGov = Object.keys(govCounts).reduce((a, b) => govCounts[a] > govCounts[b] ? a : b, "...");

      setStats({
        totalUsers: snapshot.size,
        topGovernorate: topGov,
        totalPoints: totalPoints
      });
      
      setUsers(usersData.sort((a: any, b: any) => b.totalPoints - a.totalPoints).slice(0, 50));
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
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((userDoc) => {
        batch.update(userDoc.ref, {
          totalPoints: 0,
          quranPoints: 0,
          athkarPoints: 0,
          streakDays: 0
        });
      });

      await batch.commit();
      alert("تم تصفير لوحة المتصدرين بنجاح! مسابقة جديدة بدأت الآن.");
      fetchStats();
    } catch (e) {
      console.error("Error resetting leaderboard:", e);
      alert("حدث خطأ أثناء التصفير");
    } finally {
      setIsResetting(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold">جاري التحقق من صلاحيات الإدارة...</div>;

  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-full p-10 text-center gap-6 animate-in fade-in duration-700">
       <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <AlertTriangle className="w-12 h-12 text-red-500" />
       </div>
       <h2 className="text-3xl font-black text-foreground font-arabic">دخول غير مصرح به</h2>
       <p className="text-foreground/40 font-bold font-arabic max-w-sm">عذراً، هذه الصفحة مخصصة لمدير التطبيق فقط. يرجى تسجيل الدخول بالحساب الصحيح.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full p-6 md:p-12 pt-24 md:pt-16 animate-in fade-in duration-1000 overflow-y-auto no-scrollbar pb-40">
      
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-10">
        
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-primary/10 border border-primary/20 p-8 rounded-[2.5rem]">
           <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-2">
                 <span className="bg-primary text-black text-[10px] font-black px-2 py-0.5 rounded-full">مدير النظام</span>
                 <h1 className="text-3xl font-black text-foreground font-arabic">لوحة التحكم الإدارية</h1>
              </div>
              <p className="text-foreground/40 text-sm font-bold font-arabic">أهلاً بك يا أستاذ يوسف. يمكنك التحكم في المنافسات من هنا.</p>
           </div>
           <ShieldCheck className="w-16 h-16 text-primary opacity-50" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="premium-card p-8 flex flex-col items-center text-center gap-4">
              <Users className="w-8 h-8 text-blue-400" />
              <p className="text-xs font-bold text-foreground/30 uppercase tracking-widest">إجمالي المستخدمين</p>
              <p className="text-4xl font-black text-foreground">{stats.totalUsers}</p>
           </div>
           <div className="premium-card p-8 flex flex-col items-center text-center gap-4">
              <MapPin className="w-8 h-8 text-emerald-400" />
              <p className="text-xs font-bold text-foreground/30 uppercase tracking-widest">أكثر محافظة نشاطاً</p>
              <p className="text-3xl font-black text-foreground font-arabic">{stats.topGovernorate}</p>
           </div>
           <div className="premium-card p-8 flex flex-col items-center text-center gap-4">
              <Trophy className="w-8 h-8 text-amber-400" />
              <p className="text-xs font-bold text-foreground/30 uppercase tracking-widest">إجمالي النقاط المجمعة</p>
              <p className="text-4xl font-black text-foreground">{stats.totalPoints}</p>
           </div>
        </div>

        {/* Global Announcement */}
        <div className="premium-card p-8 bg-primary/5 border-primary/20 flex flex-col gap-6">
           <div className="flex items-center justify-between mb-2">
              <span className="bg-primary text-black text-[10px] font-black px-2 py-0.5 rounded-full">رسالة عامة</span>
              <h3 className="font-bold font-arabic flex items-center gap-2">
                 بث تنبيه لجميع المستخدمين
                 <TrendingUp className="w-5 h-5 text-primary" />
              </h3>
           </div>
           <div className="flex flex-col md:flex-row gap-4">
              <input 
                 value={announcement}
                 onChange={e => setAnnouncement(e.target.value)}
                 className="flex-1 bg-background border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 font-arabic"
                 placeholder="اكتب رسالة ستظهر لكل مستخدم في أعلى الصفحة..."
              />
              <button 
                 onClick={handleSetAnnouncement}
                 disabled={isSettingAnnouncement}
                 className="px-8 py-4 bg-primary text-black rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                 {isSettingAnnouncement ? <RefreshCw className="w-5 h-5 animate-spin" /> : "نشر التنبيه"}
              </button>
           </div>
        </div>

        {/* Quest Manager */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="premium-card p-8 flex flex-col gap-6">
              <div className="flex items-center gap-3 mb-2">
                 <PlusCircle className="w-6 h-6 text-primary" />
                 <h3 className="font-bold font-arabic">إضافة مهمة أسبوعية</h3>
              </div>
              <form onSubmit={handleAddQuest} className="space-y-4">
                 <input 
                    value={questTitle}
                    onChange={e => setQuestTitle(e.target.value)}
                    className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 font-arabic"
                    placeholder="عنوان المهمة (مثلاً: قراءة سورة الكهف)"
                 />
                 <div className="flex items-center gap-4">
                    <input 
                       type="number"
                       value={questPoints}
                       onChange={e => setQuestPoints(parseInt(e.target.value))}
                       className="w-1/3 bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-center outline-none focus:border-primary/40 font-mono"
                       placeholder="النقاط"
                    />
                    <button 
                       type="submit"
                       disabled={isAddingQuest}
                       className="flex-1 py-4 bg-primary text-black rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                       نشر المهمة الآن
                    </button>
                 </div>
              </form>
           </div>

           <div className="premium-card p-8 flex flex-col gap-4 overflow-hidden">
              <div className="flex items-center gap-3 mb-2">
                 <Calendar className="w-6 h-6 text-primary" />
                 <h3 className="font-bold font-arabic">المهام النشطة</h3>
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[300px] no-scrollbar">
                 {activeQuests.length === 0 ? (
                   <p className="p-10 text-center text-foreground/20 font-bold">لا توجد مهام حالية</p>
                 ) : (
                   activeQuests.map(q => (
                     <div key={q.id} className="flex items-center justify-between p-4 bg-foreground/5 rounded-2xl border border-border">
                        <button onClick={() => handleDeleteQuest(q.id)} className="text-red-500/40 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                        <div className="text-right">
                           <p className="font-bold text-sm font-arabic">{q.title}</p>
                           <p className="text-[10px] text-primary font-black">{q.points} نقطة</p>
                        </div>
                     </div>
                   ))
                 )}
              </div>
           </div>
        </div>

        {/* Admin Actions */}
        <div className="premium-card p-10 bg-red-500/[0.02] border-red-500/10 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="text-right">
              <h3 className="text-xl font-bold text-foreground font-arabic mb-2 flex items-center gap-2 justify-end">
                 منطقة العمليات الخطرة
                 <AlertTriangle className="w-5 h-5 text-red-500" />
              </h3>
              <p className="text-foreground/40 text-sm font-bold font-arabic">تصفير لوحة المتصدرين سيؤدي لمسح نقاط جميع المستخدمين لبدء دورة مسابقات جديدة (شهرياً مثلاً).</p>
           </div>
           <button 
             onClick={handleResetLeaderboard}
             disabled={isResetting}
             className="flex items-center gap-3 px-10 py-5 bg-red-500 text-white rounded-[2rem] font-black hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50"
           >
              {isResetting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              تصفير المسابقة الآن
           </button>
        </div>

        {/* Users Table */}
        <div className="premium-card overflow-hidden">
           <div className="p-8 border-b border-border bg-foreground/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Users className="w-5 h-5 text-primary" />
                 <h3 className="font-bold font-arabic">قائمة أفضل 50 مستخدم</h3>
              </div>
              <button onClick={fetchStats} className="p-2 hover:bg-foreground/5 rounded-full transition-all text-foreground/40">
                 <RefreshCw className="w-4 h-4" />
              </button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-right font-arabic">
                 <thead>
                    <tr className="bg-foreground/[0.01] text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] border-b border-border">
                       <th className="p-6 text-right">المركز</th>
                       <th className="p-6 text-right">المستخدم</th>
                       <th className="p-6 text-right">بيانات التواصل</th>
                       <th className="p-6 text-right">الميلاد/المحافظة</th>
                       <th className="p-6 text-right">إحصائيات النقاط</th>
                       <th className="p-6 text-right">الإجراءات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                    {users.map((u, i) => (
                      <tr key={u.uid} className={`hover:bg-foreground/[0.01] transition-colors ${u.isBanned ? 'bg-red-500/[0.05] opacity-60' : ''}`}>
                         <td className="p-6 font-mono font-bold text-foreground/20">{i + 1}</td>
                         <td className="p-6">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl overflow-hidden border border-border shrink-0">
                                  <img src={u.photoURL || "/logo/logo.png"} alt="" className="w-full h-full object-cover" />
                               </div>
                               <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                     <span className="font-bold text-foreground leading-tight">{u.displayName || u.username}</span>
                                     {u.isBanned && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">محظور</span>}
                                  </div>
                                  <span className="text-[10px] text-foreground/20 font-mono">@{u.username}</span>
                               </div>
                            </div>
                         </td>
                         <td className="p-6">
                            <div className="flex flex-col">
                               <span className="font-bold text-foreground text-sm">{u.phoneNumber || "بدون هاتف"}</span>
                               <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider">UID: {u.uid.slice(0, 8)}...</span>
                            </div>
                         </td>
                         <td className="p-6">
                            <div className="flex flex-col">
                               <span className="font-bold text-foreground/60 text-sm">{u.governorate}</span>
                               <span className="text-[10px] text-foreground/20 font-bold">{u.birthday || "لم يحدد"}</span>
                            </div>
                         </td>
                         <td className="p-6">
                            <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                  <span className="font-black text-primary text-lg leading-none">{u.totalPoints}</span>
                                  <button 
                                     onClick={() => handleEditUserPoints(u.uid, u.totalPoints)}
                                     className="p-1 hover:bg-primary/10 rounded-md transition-all opacity-40 hover:opacity-100"
                                  >
                                     <Star className="w-3 h-3 text-primary" />
                                  </button>
                               </div>
                               <div className="flex gap-2 opacity-40 text-[9px] font-bold">
                                  <span>📖 {u.quranPoints || 0}</span>
                                  <span>📿 {u.athkarPoints || 0}</span>
                                  <span>🎧 {u.listenPoints || 0}</span>
                               </div>
                            </div>
                         </td>
                         <td className="p-6">
                            <button 
                               onClick={() => handleBanUser(u.uid, u.isBanned)}
                               className={`p-3 rounded-xl transition-all ${u.isBanned ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                               title={u.isBanned ? "إلغاء الحظر" : "حظر المستخدم"}
                            >
                               {u.isBanned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

      </div>
    </div>
  );
}
