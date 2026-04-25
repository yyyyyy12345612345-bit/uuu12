"use client";

import React, { useState, useEffect } from "react";
import { 
  Trophy, Medal, Users, MapPin, Star, 
  Search, ShieldCheck, ChevronRight, LogIn,
  TrendingUp, Award, Crown, Phone, User, X,
  BookOpen, Headphones, Fingerprint, Calendar
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  where
} from "firebase/firestore";

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "الشرقية", "المنوفية", "القليوبية", "البحيرة", 
  "الغربية", "بور سعيد", "دمياط", "الإسماعيلية", "السويس", "كفر الشيخ", "الفيوم", "بني سويف", 
  "المنيا", "أسيوط", "سوهاج", "قنا", "أسوان", "الأقصر", "البحر الأحمر", "الوادي الجديد", 
  "مطروح", "شمال سيناء", "جنوب سيناء"
];

export function Leaderboard() {
  const [user, setUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"global" | "governorate">("global");
  const [activeQuests, setActiveQuests] = useState<any[]>([]);

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
            setShowProfileSetup(false);
          } else {
            setShowProfileSetup(true);
          }
        } catch (e) {
          console.error("Error checking user doc:", e);
        }
      }
      setLoading(false);
      fetchLeaderboard();
      fetchQuests();
    });
    return () => unsubscribe();
  }, []);

  const fetchQuests = async () => {
    if (!db) return;
    const q = query(collection(db, "global_quests"), orderBy("createdAt", "desc"), limit(5));
    const snapshot = await getDocs(q);
    setActiveQuests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchLeaderboard = async () => {
    if (!db) return;
    try {
      // Fetch top 50 users who are NOT banned
      const q = query(
        collection(db, "users"), 
        where("isBanned", "==", false),
        orderBy("totalPoints", "desc"), 
        limit(50)
      );
      const snapshot = await getDocs(q);
      
      let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (data.length === 0) {
        const fallbackQ = query(collection(db, "users"), orderBy("totalPoints", "desc"), limit(50));
        const fallbackSnapshot = await getDocs(fallbackQ);
        data = fallbackSnapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => !u.isBanned);
      }

      setLeaderboardData(data);
    } catch (e) {
      console.error("Error fetching leaderboard:", e);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("Login Error:", e);
    }
  };

  const [setupError, setSetupError] = useState("");

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setSetupError("");

    const username = setupData.username.trim();

    if (username.length < 3 || username.length > 15) {
      setSetupError("يجب أن يكون الاسم بين 3 و 15 حرفاً");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9\u0600-\u06FF\s]+$/;
    if (!usernameRegex.test(username)) {
      setSetupError("الاسم يجب أن يحتوي على حروف وأرقام فقط (بدون رموز أو إيموجي)");
      return;
    }

    try {
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setSetupError("هذا الاسم محجوز بالفعل، اختر اسماً آخر");
        return;
      }

      const newUserData = {
        uid: user.uid,
        username: username,
        displayName: username, // Initially same
        photoURL: user.photoURL || "",
        phoneNumber: setupData.phone,
        governorate: setupData.governorate,
        totalPoints: 0,
        quranPoints: 0,
        athkarPoints: 0,
        listenPoints: 0,
        streakDays: 0,
        badges: [],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        isBanned: false
      };

      await setDoc(doc(db, "users", user.uid), newUserData);
      setUserData(newUserData);
      setShowProfileSetup(false);
      fetchLeaderboard();
    } catch (e) {
      console.error("Error saving profile:", e);
      setSetupError("حدث خطأ أثناء حفظ البيانات، حاول مرة أخرى");
    }
  };

  const [setupData, setSetupData] = useState({
    username: "",
    phone: "",
    governorate: GOVERNORATES[0]
  });

  if (loading || user === undefined) return (
    <div className="flex h-full items-center justify-center p-20">
       <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full p-6 md:p-12 pt-24 md:pt-16 animate-in fade-in duration-1000 overflow-y-auto no-scrollbar relative">
      
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/40 to-background" />
          <div className="absolute inset-0 islamic-pattern opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col gap-8 pb-32">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="text-right">
              <h1 className="text-4xl font-black text-foreground font-arabic mb-2 flex items-center gap-3 justify-end">
                 لوحة الشرف والمنافسات
                 <Trophy className="w-8 h-8 text-primary animate-bounce" />
              </h1>
              <p className="text-foreground/40 text-sm font-bold font-arabic">سابقوا إلى مغفرة من ربكم وجنة عرضها السموات والأرض</p>
           </div>

           {!user && (
             <button 
               onClick={handleGoogleLogin}
               className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl"
             >
                <LogIn className="w-5 h-5" />
                تسجيل الدخول بجوجل للمنافسة
             </button>
           )}

           {user && userData && (
             <div className="premium-card px-6 py-4 flex items-center gap-4">
                <div className="text-right">
                   <p className="text-xs text-primary font-bold uppercase tracking-widest">رتبتك الحالية</p>
                   <p className="text-xl font-black text-foreground font-arabic leading-tight">
                     {userData.displayName || userData.username}
                   </p>
                </div>
                <div className="w-12 h-12 rounded-[1rem] overflow-hidden border-2 border-primary/20">
                   <img src={userData.photoURL || "/logo/logo.png"} alt="User" className="w-full h-full object-cover" />
                </div>
             </div>
           )}
        </div>

        {/* Stats Grid */}
        {user && userData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {[
               { label: "إجمالي النقاط", value: userData.totalPoints, icon: Star, color: "text-amber-400" },
               { label: "نقاط القرآن", value: userData.quranPoints, icon: BookOpen, color: "text-primary" },
               { label: "نقاط الأذكار", value: userData.athkarPoints, icon: Fingerprint, color: "text-emerald-400" },
               { label: "نقاط الاستماع", value: userData.listenPoints || 0, icon: Headphones, color: "text-blue-400" },
             ].map((stat, i) => (
               <div key={i} className="premium-card p-6 flex flex-col items-center justify-center gap-2 text-center group hover:border-primary/40 transition-all">
                  <stat.icon className={`w-6 h-6 ${stat.color} mb-1`} />
                  <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black text-foreground">{stat.value}</p>
               </div>
             ))}
          </div>
        )}

      {/* Quests Section */}
      {activeQuests.length > 0 && (
        <div className="w-full max-w-xl mx-auto mb-10 space-y-4 animate-in slide-in-from-top-10 duration-1000">
           <div className="flex items-center justify-between px-4">
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">مسابقات حالية</span>
              <h3 className="text-sm font-bold text-foreground font-arabic">المهام الأسبوعية</h3>
           </div>
           <div className="flex flex-col gap-3">
              {activeQuests.map(q => (
                <div key={q.id} className="p-5 glass-effect border border-primary/20 rounded-[2rem] flex items-center justify-between group hover:border-primary/40 transition-all">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-all">
                         <Star className="w-5 h-5 fill-current" />
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-bold text-foreground font-arabic">{q.title}</p>
                         <p className="text-[10px] text-foreground/40 font-bold font-arabic">أكمل المهمة للحصول على النقاط</p>
                      </div>
                   </div>
                   <div className="bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
                      <span className="text-primary font-black text-sm">+{q.points}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Category Leaders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto mb-10">
         <div className="glass-effect p-6 rounded-[2rem] border border-blue-500/20 flex flex-col items-center gap-2 text-center relative overflow-hidden group">
            <BookOpen className="w-8 h-8 text-blue-400 mb-2 opacity-50 group-hover:opacity-100 transition-all" />
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">بطل القرآن</span>
            <span className="font-bold text-foreground font-arabic text-sm truncate max-w-full">
              {leaderboardData.sort((a,b) => (b.quranPoints||0) - (a.quranPoints||0))[0]?.displayName || "..." }
            </span>
         </div>
         <div className="glass-effect p-6 rounded-[2rem] border border-emerald-500/20 flex flex-col items-center gap-2 text-center relative overflow-hidden group">
            <Fingerprint className="w-8 h-8 text-emerald-400 mb-2 opacity-50 group-hover:opacity-100 transition-all" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">بطل الأذكار</span>
            <span className="font-bold text-foreground font-arabic text-sm truncate max-w-full">
              {leaderboardData.sort((a,b) => (b.athkarPoints||0) - (a.athkarPoints||0))[0]?.displayName || "..." }
            </span>
         </div>
         <div className="glass-effect p-6 rounded-[2rem] border border-amber-500/20 flex flex-col items-center gap-2 text-center relative overflow-hidden group">
            <Headphones className="w-8 h-8 text-amber-400 mb-2 opacity-50 group-hover:opacity-100 transition-all" />
            <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">بطل الاستماع</span>
            <span className="font-bold text-foreground font-arabic text-sm truncate max-w-full">
              {leaderboardData.sort((a,b) => (b.listenPoints||0) - (a.listenPoints||0))[0]?.displayName || "..." }
            </span>
         </div>
      </div>

      {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-foreground/5 rounded-2xl w-fit mx-auto md:mx-0">
           <button 
             onClick={() => setActiveTab("global")}
             className={`px-8 py-3 rounded-xl font-bold font-arabic text-sm transition-all ${activeTab === "global" ? 'bg-primary text-black shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
           >
              الترتيب العام
           </button>
           <button 
             onClick={() => setActiveTab("governorate")}
             className={`px-8 py-3 rounded-xl font-bold font-arabic text-sm transition-all ${activeTab === "governorate" ? 'bg-primary text-black shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
           >
              ترتيب المحافظة
           </button>
        </div>

        {/* Leaderboard Table */}
        <div className="premium-card overflow-hidden">
           <div className="p-6 border-b border-border bg-foreground/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Users className="w-5 h-5 text-primary" />
                 <h3 className="font-bold font-arabic">أبطال اليوم</h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/20 uppercase tracking-widest">
                 <span>يتم التحديث كل 5 دقائق</span>
              </div>
           </div>

           <div className="divide-y divide-border">
              {leaderboardData.length === 0 ? (
                <div className="p-20 text-center text-foreground/20 font-arabic font-bold">لا توجد بيانات حالياً.. كن أول المنافسين!</div>
              ) : (
                leaderboardData.map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between p-6 hover:bg-foreground/[0.02] transition-colors group">
                      <div className="flex items-center gap-4 md:gap-6">
                         <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold font-mono relative shrink-0 ${index === 0 ? 'bg-amber-400 text-black' : index === 1 ? 'bg-slate-300 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-foreground/5 text-foreground/40'}`}>
                            {index + 1}
                            {index < 3 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background flex items-center justify-center text-[8px]"><Trophy className="w-2 h-2 text-black" /></div>}
                         </div>
                         
                         <div className="w-12 h-12 rounded-2xl border-2 border-border p-0.5 overflow-hidden bg-background shrink-0">
                            <img 
                               src={entry.photoURL || "/logo/logo.png"} 
                               alt={entry.username} 
                               className="w-full h-full object-cover rounded-xl"
                            />
                         </div>

                         <div className="flex flex-col text-right">
                            <div className="flex items-center gap-2">
                               <span className="font-bold font-arabic text-lg group-hover:text-primary transition-colors leading-tight">
                                 {entry.displayName || entry.username}
                               </span>
                               {index === 0 && <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />}
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] text-foreground/20 font-mono tracking-wider">@{entry.username}</span>
                               <div className="w-1 h-1 rounded-full bg-foreground/10" />
                               <div className="flex items-center gap-1 text-[10px] text-foreground/40 font-bold uppercase">
                                  <MapPin className="w-3 h-3" />
                                  <span>{entry.governorate}</span>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="text-left flex flex-col items-end">
                         <div className="flex items-center gap-1">
                            <span className="text-2xl font-black text-primary">{entry.totalPoints}</span>
                            <Trophy className="w-4 h-4 text-primary opacity-50" />
                         </div>
                         <div className="flex items-center gap-3 mt-1 opacity-60">
                            <div className="flex items-center gap-1 text-[9px] font-bold">
                               <BookOpen className="w-2.5 h-2.5 text-blue-400" />
                               <span>{entry.quranPoints || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-bold">
                               <Fingerprint className="w-2.5 h-2.5 text-emerald-400" />
                               <span>{entry.athkarPoints || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-bold">
                               <Headphones className="w-2.5 h-2.5 text-amber-400" />
                               <span>{entry.listenPoints || 0}</span>
                            </div>
                         </div>
                      </div>
                  </div>
                ))
              )}
           </div>
        </div>

      </div>

      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
           <div className="relative w-full max-w-lg premium-card p-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                 <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-black text-foreground font-arabic mb-2">إكمال الملف الشخصي</h3>
              <p className="text-foreground/40 text-sm font-bold font-arabic mb-8 text-center">أهلاً بك! يرجى إدخال بياناتك للمشاركة في المسابقات</p>

              <form onSubmit={handleProfileSubmit} className="w-full space-y-6">
                 {setupError && (
                   <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold p-4 rounded-xl text-center font-arabic animate-shake">
                     {setupError}
                   </div>
                 )}
                 
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                       الاسم الفريد (بدون رموز - للبحث)
                       <User className="w-3 h-3" />
                    </label>
                    <input 
                      required
                      maxLength={15}
                      value={setupData.username}
                      onChange={e => setSetupData({...setupData, username: e.target.value})}
                      className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 transition-all font-arabic"
                      placeholder="مثلاً: youssef123"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                       رقم الهاتف (للتواصل عند الفوز)
                       <Phone className="w-3 h-3" />
                    </label>
                    <input 
                      required
                      type="tel"
                      value={setupData.phone}
                      onChange={e => setSetupData({...setupData, phone: e.target.value})}
                      className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 transition-all font-mono"
                      placeholder="01XXXXXXXXX"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground/40 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                       المحافظة
                       <MapPin className="w-3 h-3" />
                    </label>
                    <select 
                      value={setupData.governorate}
                      onChange={e => setSetupData({...setupData, governorate: e.target.value})}
                      className="w-full bg-foreground/5 border border-border rounded-2xl py-4 px-6 text-right outline-none focus:border-primary/40 transition-all font-arabic appearance-none"
                    >
                       {GOVERNORATES.map(gov => <option key={gov} value={gov} className="bg-background">{gov}</option>)}
                    </select>
                 </div>

                 <button 
                   type="submit"
                   className="w-full py-5 bg-primary text-black rounded-[2rem] font-black text-lg shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                 >
                    بدء المنافسة الآن
                 </button>
              </form>
           </div>
        </div>
      )}

    </div>
  );
}
