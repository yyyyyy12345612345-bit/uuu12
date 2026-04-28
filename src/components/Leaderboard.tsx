"use client";

import React, { useState, useEffect } from "react";
import { 
  Trophy, Medal, Users, MapPin, Star, 
  Search, ShieldCheck, ChevronRight, LogIn,
  TrendingUp, Award, Crown, Phone, User, X,
  BookOpen, Headphones, Fingerprint, Calendar
} from "lucide-react";
import { Capacitor } from '@capacitor/core';
import { auth, db } from "@/lib/firebase";
import { 
  signInWithPopup, 
  signInWithCredential,
  GoogleAuthProvider, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
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

interface LeaderboardProps {
  onEditProfile?: () => void;
}

export function Leaderboard({ onEditProfile }: LeaderboardProps) {
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
            const data = userDoc.data();
            
            // Silently backfill email if it's missing
            if (u.email && !data.email) {
              await updateDoc(doc(db, "users", u.uid), { email: u.email });
              data.email = u.email;
            }

            setUserData(data);
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
      // Fetch top 50 users who are NOT banned (Requires Firestore Index)
      const q = query(
        collection(db, "users"), 
        where("isBanned", "==", false),
        orderBy("totalPoints", "desc"), 
        limit(50)
      );
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeaderboardData(data);
    } catch (e) {
      console.warn("Index missing, using fallback query:", e);
      // Fallback query that doesn't need a composite index
      try {
        const fallbackQ = query(collection(db, "users"), orderBy("totalPoints", "desc"), limit(100));
        const fallbackSnapshot = await getDocs(fallbackQ);
        let data = fallbackSnapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter((u: any) => !u.isBanned).slice(0, 50);
        setLeaderboardData(data);
      } catch (fallbackError) {
        console.error("Error fetching fallback leaderboard:", fallbackError);
      }
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    try {
      if (Capacitor.isNativePlatform()) {
        const { GoogleSignIn } = await import('@capawesome/capacitor-google-sign-in');
        try { await GoogleSignIn.signOut(); } catch (e) {}
        const result = await GoogleSignIn.signIn();
        if (result && result.idToken) {
          const credential = GoogleAuthProvider.credential(result.idToken);
          await signInWithCredential(auth, credential);
          return;
        }
      }
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error("Login Error:", e);
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        alert("حدث خطأ أثناء تسجيل الدخول: " + (e.message || "فشل الاتصال بجوجل"));
      }
    }
  };

  const [setupError, setSetupError] = useState("");

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setSetupError("");

    const username = setupData.username.trim().toLowerCase();
    const displayName = setupData.displayName.trim();

    if (username.length < 3 || username.length > 15) {
      setSetupError("يجب أن يكون الاسم المميز بين 3 و 15 حرفاً");
      return;
    }

    if (displayName.length < 2) {
      setSetupError("يرجى إدخال اسمك بشكل صحيح");
      return;
    }

    // Strict validation for Unique Username: English letters, numbers, underscores only. No spaces.
    const strictUsernameRegex = /^[a-z0-9_]+$/;
    if (!strictUsernameRegex.test(username)) {
      setSetupError("الاسم المميز يجب أن يحتوي على حروف إنجليزية وأرقام فقط (بدون مسافات أو رموز)");
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
        displayName: displayName,
        email: user.email || "",
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
    displayName: "",
    phone: "",
    governorate: GOVERNORATES[0]
  });

  if (loading || user === undefined) return (
    <div className="flex h-full items-center justify-center p-20">
       <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full p-6 md:p-10 pt-16 md:pt-8 animate-in fade-in duration-1000 overflow-y-auto relative">
      
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
             <div className="premium-card px-5 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-[1rem] overflow-hidden border border-primary/20 shadow-lg">
                      <img src={userData.photoURL || "/logo/logo.png"} alt="User" className="w-full h-full object-cover" />
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] text-primary font-black uppercase tracking-widest mb-0.5">المتسابق الحالي</p>
                      <p className="text-lg font-black text-foreground font-arabic leading-none">
                        {userData.displayName || userData.username}
                      </p>
                   </div>
                </div>
                <button 
                  onClick={onEditProfile}
                  className="w-full md:w-auto px-4 py-2 bg-foreground/5 hover:bg-primary/10 border border-border hover:border-primary/30 rounded-xl text-[10px] font-black text-foreground/80 hover:text-primary transition-all font-arabic"
                >
                  تعديل بيانات الحساب
                </button>
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
              leaderboardData
                .filter((entry: any) => activeTab === "global" || (activeTab === "governorate" && userData && entry.governorate === userData.governorate))
                .sort((a: any, b: any) => (b.totalPoints || 0) - (a.totalPoints || 0))
                .map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between p-5 md:p-6 hover:bg-foreground/[0.02] transition-colors group">
                      <div className="flex items-center gap-3 md:gap-6">
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
                               <span className="font-bold font-arabic text-base md:text-lg group-hover:text-primary transition-colors leading-tight">
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

                      <div className="text-left flex flex-col items-end gap-1">
                         {/* النقاط الإجمالية - كبيرة وواضحة */}
                         <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl">
                            <Star className="w-4 h-4 text-primary fill-primary" />
                            <span className="text-xl font-black text-primary">{entry.totalPoints || 0}</span>
                            <span className="text-[8px] text-primary/60 font-bold">نقطة</span>
                         </div>
                         {/* تفاصيل النقاط */}
                         <div className="flex items-center gap-3 opacity-60">
                            <div className="flex items-center gap-1 text-[9px] font-bold" title="نقاط القرآن">
                               <BookOpen className="w-2.5 h-2.5 text-blue-400" />
                               <span>{entry.quranPoints || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-bold" title="نقاط الأذكار">
                               <Fingerprint className="w-2.5 h-2.5 text-emerald-400" />
                               <span>{entry.athkarPoints || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-bold" title="نقاط الاستماع">
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
           <div className="absolute inset-0 bg-black backdrop-blur-md" />
           <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-[#d4af37]/30 rounded-[3rem] shadow-[0_0_50px_rgba(212,175,55,0.1)] p-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 rounded-[2rem] bg-[#d4af37]/10 flex items-center justify-center mb-6 border border-[#d4af37]/20">
                 <ShieldCheck className="w-10 h-10 text-[#d4af37]" />
              </div>
              <h3 className="text-2xl font-black text-white font-arabic mb-2">إكمال الملف الشخصي</h3>
              <p className="text-white/50 text-sm font-bold font-arabic mb-8 text-center">أهلاً بك! يرجى إدخال بياناتك للمشاركة في المسابقات</p>

              <form onSubmit={handleProfileSubmit} className="w-full space-y-6">
                 {setupError && (
                   <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold p-4 rounded-xl text-center font-arabic animate-shake">
                     {setupError}
                   </div>
                 )}
                 
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                       الاسم المستعار / الذي يظهر للناس (عادي بأي لغة)
                       <User className="w-3 h-3" />
                    </label>
                    <input 
                      required
                      maxLength={20}
                      value={setupData.displayName}
                      onChange={e => setSetupData({...setupData, displayName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all font-arabic text-white placeholder-white/20"
                      placeholder="مثلاً: خادم القرآن ✨"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                       الاسم المميز (حروف إنجليزية وأرقام فقط، بدون مسافات)
                       <User className="w-3 h-3" />
                    </label>
                    <input 
                      required
                      maxLength={15}
                      value={setupData.username}
                      onChange={e => setSetupData({...setupData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all font-mono text-white placeholder-white/20"
                      placeholder="مثلاً: youssef123"
                      dir="ltr"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                       رقم الهاتف (للتواصل عند الفوز)
                       <Phone className="w-3 h-3" />
                    </label>
                    <input 
                      required
                      type="tel"
                      value={setupData.phone}
                      onChange={e => setSetupData({...setupData, phone: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all font-mono text-white placeholder-white/20"
                      placeholder="01XXXXXXXXX"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest mr-2 flex items-center gap-2 justify-end">
                       المحافظة
                       <MapPin className="w-3 h-3" />
                    </label>
                    <select 
                      value={setupData.governorate}
                      onChange={e => setSetupData({...setupData, governorate: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-right outline-none focus:border-[#d4af37]/50 focus:bg-white/10 transition-all font-arabic appearance-none text-white"
                    >
                       {GOVERNORATES.map(gov => <option key={gov} value={gov} className="bg-[#111] text-white">{gov}</option>)}
                    </select>
                 </div>

                 <button 
                   type="submit"
                   className="w-full py-5 bg-[#d4af37] text-black rounded-[2rem] font-black text-lg shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-95 transition-all mt-4"
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
