"use client";

import React, { useState, useEffect } from "react";
import { 
  Trophy, Medal, Users, MapPin, Star, 
  Search, ShieldCheck, ChevronRight, LogIn,
  TrendingUp, Award, Crown, Phone, User, X,
  BookOpen, Headphones, Fingerprint, Calendar,
  ArrowLeft, LayoutDashboard, ChevronLeft
} from "lucide-react";
import { useEditor } from "@/store/useEditor";
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
  const [activeTab, setActiveTab] = useState<"global" | "governorate" | "quran" | "athkar" | "listen">("global");
  const [activeQuests, setActiveQuests] = useState<any[]>([]);
  const [completedQuests, setCompletedQuests] = useState<string[]>([]);
  const { updateState } = useEditor();

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, "users", u.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
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
      if (u) fetchCompletedQuests(u.uid);
    });

    const authTimeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    const handlePointsUpdate = () => {
      if (auth.currentUser) {
        getDoc(doc(db, "users", auth.currentUser.uid)).then(s => {
          if (s.exists()) setUserData(s.data());
        });
      }
    };

    window.addEventListener('pointsUpdated', handlePointsUpdate);

    return () => {
      unsubscribe();
      clearTimeout(authTimeout);
      window.removeEventListener('pointsUpdated', handlePointsUpdate);
    };
  }, []);

  const fetchQuests = async () => {
    if (!db) return;
    const q = query(collection(db, "global_quests"), orderBy("createdAt", "desc"), limit(5));
    const snapshot = await getDocs(q);
    setActiveQuests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchCompletedQuests = async (uid: string) => {
    if (!db) return;
    const snapshot = await getDocs(collection(db, "users", uid, "completed_quests"));
    setCompletedQuests(snapshot.docs.map(d => d.id));
  };

  const handleQuestClick = (quest: any) => {
    if (!quest.type || !quest.target) return;
    if (quest.type === "quran" || quest.type === "surah") {
       updateState({ view: "mushaf", surahId: String(quest.target), startAyah: 1 });
       onEditProfile?.(); 
    } else if (quest.type === "athkar" || quest.type === "daily") {
       updateState({ view: "daily" });
       onEditProfile?.();
    }
    handleClaimPoints(quest);
  };

  const handleClaimPoints = async (quest: any) => {
    if (completedQuests.includes(quest.id)) return;
    const { claimQuestPoints } = await import("@/lib/points");
    const result = await claimQuestPoints(quest.id, quest.points || 10);
    if (result.success) {
      setCompletedQuests(prev => [...prev, quest.id]);
      fetchLeaderboard();
    }
  };

  const fetchLeaderboard = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, "users"), orderBy("totalPoints", "desc"), limit(100));
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter((u: any) => !u.isBanned).slice(0, 50);
      setLeaderboardData(data);
    } catch (e) {
      console.error("Error fetching leaderboard:", e);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    try {
      if (Capacitor.isNativePlatform()) {
        const { GoogleSignIn } = await import('@capawesome/capacitor-google-sign-in');
        await GoogleSignIn.initialize({ clientId: "194649785258-818jpl0c7it5dsmn7a7mufu8jc1i1uud.apps.googleusercontent.com" });
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
    }
  };

  const [setupError, setSetupError] = useState("");
  const [setupData, setSetupData] = useState({
    username: "",
    displayName: "",
    phone: "",
    governorate: GOVERNORATES[0]
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setSetupError("");
    const username = setupData.username.trim().toLowerCase();
    const displayName = setupData.displayName.trim();

    if (username.length < 3 || username.length > 15) { setSetupError("يجب أن يكون الاسم المميز بين 3 و 15 حرفاً"); return; }
    if (displayName.length < 2) { setSetupError("يرجى إدخال اسمك بشكل صحيح"); return; }
    if (!/^[a-z0-9_]+$/.test(username)) { setSetupError("الاسم المميز يجب أن يحتوي على حروف إنجليزية وأرقام فقط"); return; }

    try {
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) { setSetupError("هذا الاسم محجوز بالفعل، اختر اسماً آخر"); return; }

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
      setSetupError("حدث خطأ أثناء حفظ البيانات");
    }
  };

  const sortedLeaderboard = leaderboardData
    .filter((entry: any) => activeTab === "governorate" ? (userData && entry.governorate === userData.governorate) : true)
    .sort((a: any, b: any) => {
      if (activeTab === "quran") return (b.quranPoints || 0) - (a.quranPoints || 0);
      if (activeTab === "athkar") return (b.athkarPoints || 0) - (a.athkarPoints || 0);
      if (activeTab === "listen") return (b.listenPoints || 0) - (a.listenPoints || 0);
      return (b.totalPoints || 0) - (a.totalPoints || 0);
    });

  const topThree = sortedLeaderboard.slice(0, 3);
  const others = sortedLeaderboard.slice(3);

  if (loading || user === undefined) return (
    <div className="flex h-full items-center justify-center"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
  );

  return (
    <div className="w-full h-full font-arabic overflow-y-auto no-scrollbar pb-32">
      
      {/* Premium Header Backdrop */}
      <div className="relative bg-transparent pt-16 pb-28 md:pt-24 md:pb-36 px-6 overflow-hidden">
          <div className="absolute inset-0 islamic-pattern opacity-10" />
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2" />
          
          <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-primary mb-2">
                  <Trophy className="w-8 h-8 animate-bounce" />
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-2xl">لوحة الشرف</h1>
              <p className="text-white/60 font-bold text-lg md:text-xl max-w-xl">سابقوا إلى مغفرة من ربكم وجنة عرضها السموات والأرض</p>
          </div>
      </div>

      {/* Main Content Overlay */}
      <div className="max-w-5xl mx-auto w-full px-6 -mt-16 md:-mt-20 relative z-20 space-y-12">
          
          {/* User Status Card */}
          {user && userData ? (
              <div className="bg-card border border-border rounded-[3rem] p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 group">
                  <div className="flex flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
                      <div className="relative shrink-0">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-primary p-1 bg-card shadow-xl overflow-hidden group-hover:scale-105 transition-transform">
                              <img src={userData.photoURL || "/logo/logo.png"} alt="User" className="w-full h-full object-cover rounded-full" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-7 md:h-7 bg-primary rounded-lg flex items-center justify-center border-2 border-primary text-black shadow-lg">
                              <Star className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary fill-primary" />
                          </div>
                      </div>
                      <div className="text-right">
                          <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">الرتبة: الحافظ المتميز</p>
                          <h2 className="text-xl md:text-3xl font-black text-foreground truncate max-w-[200px] md:max-w-none">{userData.displayName || userData.username}</h2>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 bg-foreground/5 p-4 rounded-3xl border border-border w-full md:w-auto justify-between md:justify-start">
                      <div className="text-center px-4">
                          <p className="text-[9px] font-black text-foreground/30 uppercase">النقاط</p>
                          <p className="text-2xl font-black text-primary">{Math.round(userData.totalPoints)}</p>
                      </div>
                      <div className="w-[1px] h-10 bg-border" />
                      <button onClick={onEditProfile} className="px-6 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-black text-xs transition-all">تعديل الملف</button>
                  </div>
              </div>
          ) : (
              <div className="bg-gradient-to-br from-[#121212]/90 to-[#0a0a0a]/95 border border-primary/20 rounded-[3rem] p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 group relative overflow-hidden">
                  <div className="absolute inset-0 islamic-pattern opacity-5 pointer-events-none" />
                  <div className="flex flex-row items-center gap-4 md:gap-6 w-full md:w-auto">
                      <div className="relative shrink-0">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-dashed border-primary/40 p-1 bg-card shadow-xl overflow-hidden flex items-center justify-center">
                              <User className="w-8 h-8 md:w-10 md:h-10 text-primary/40" />
                          </div>
                      </div>
                      <div className="text-right flex-1 min-w-0">
                          <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">حساب زائر</p>
                          <h2 className="text-xl md:text-2xl font-black text-foreground truncate">لم تقم بتسجيل الدخول بعد</h2>
                          <p className="text-[11px] md:text-xs text-white/40 mt-1 font-bold leading-relaxed">سجل حساباً الآن لتجميع النقاط والظهور في لوحة الشرف ومنافسة القراء.</p>
                      </div>
                  </div>
                  <div className="relative z-10 shrink-0 w-full md:w-auto">
                      <button 
                        onClick={() => window.dispatchEvent(new CustomEvent("show_auth_gate"))} 
                        className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-[#b38f24] via-[#f5d76e] to-[#b38f24] text-black rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_10px_20px_rgba(212,175,55,0.2)]"
                      >
                        سجل دخولك الآن 🏆
                      </button>
                  </div>
              </div>
          )}

          {/* Top 3 Podium */}
          {topThree.length > 0 && (
              <div className="flex flex-col items-center gap-10">
                  <div className="flex items-end justify-center gap-4 md:gap-12 w-full">
                      {/* Rank 2 */}
                      {topThree[1] && (
                          <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-1000 delay-200">
                              <div className="relative group">
                                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-[6px] border-slate-300 p-1.5 bg-card shadow-2xl relative z-10 overflow-hidden">
                                      <img src={topThree[1].photoURL || "/logo/logo.png"} alt="2" className="w-full h-full object-cover rounded-full" />
                                  </div>
                                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-slate-300 rounded-2xl flex items-center justify-center text-black font-black z-20 shadow-xl border-4 border-card">2</div>
                              </div>
                              <div className="text-center">
                                  <h3 className="font-black text-foreground text-lg truncate max-w-[120px]">{topThree[1].displayName?.split(' ')[0]}</h3>
                                  <p className="text-primary font-black text-xs">{Math.round(topThree[1].totalPoints)} نقطة</p>
                              </div>
                          </div>
                      )}

                      {/* Rank 1 */}
                      {topThree[0] && (
                          <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-12 duration-1000">
                              <div className="relative group scale-110">
                                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-primary animate-pulse"><Crown className="w-12 h-12 fill-current" /></div>
                                  <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-[8px] border-primary p-2 bg-card shadow-[0_20px_50px_rgba(212,175,55,0.3)] relative z-10 overflow-hidden">
                                      <img src={topThree[0].photoURL || "/logo/logo.png"} alt="1" className="w-full h-full object-cover rounded-full" />
                                  </div>
                                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary rounded-[1.2rem] flex items-center justify-center text-black font-black z-20 shadow-2xl border-4 border-card text-xl">1</div>
                              </div>
                              <div className="text-center">
                                  <h3 className="font-black text-foreground text-2xl truncate max-w-[160px]">{topThree[0].displayName?.split(' ')[0]}</h3>
                                  <p className="text-primary font-black text-lg">{Math.round(topThree[0].totalPoints)} نقطة</p>
                              </div>
                          </div>
                      )}

                      {/* Rank 3 */}
                      {topThree[2] && (
                          <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-10 duration-1000 delay-500">
                              <div className="relative group">
                                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-[6px] border-amber-700 p-1.5 bg-card shadow-2xl relative z-10 overflow-hidden">
                                      <img src={topThree[2].photoURL || "/logo/logo.png"} alt="3" className="w-full h-full object-cover rounded-full" />
                                  </div>
                                  <div className="absolute -top-3 -right-3 w-10 h-10 bg-amber-700 rounded-2xl flex items-center justify-center text-white font-black z-20 shadow-xl border-4 border-card">3</div>
                              </div>
                              <div className="text-center">
                                  <h3 className="font-black text-foreground text-lg truncate max-w-[120px]">{topThree[2].displayName?.split(' ')[0]}</h3>
                                  <p className="text-primary font-black text-xs">{Math.round(topThree[2].totalPoints)} نقطة</p>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* Quests */}
          {activeQuests.length > 0 && (
              <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                      <h3 className="text-2xl font-black text-foreground">المهام والمنافسات</h3>
                      <LayoutDashboard className="w-6 h-6 text-primary/40" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeQuests.map(q => {
                          const isDone = completedQuests.includes(q.id);
                          return (
                              <button 
                                key={q.id} 
                                disabled={isDone}
                                onClick={() => handleQuestClick(q)}
                                className={`flex items-center justify-between p-6 rounded-[2.5rem] bg-card border transition-all text-right group ${isDone ? 'opacity-50 grayscale border-border' : 'border-primary/20 hover:border-primary hover:shadow-2xl active:scale-95'}`}
                              >
                                  <div className="flex items-center gap-4">
                                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black transition-all'}`}>
                                          {isDone ? <ShieldCheck className="w-7 h-7" /> : <Star className="w-7 h-7 fill-current" />}
                                      </div>
                                      <div className="text-right">
                                          <p className="text-lg font-black text-foreground mb-0.5">{q.title}</p>
                                          <p className="text-xs font-bold text-foreground/40">{isDone ? "تم إكمال المهمة بنجاح ✅" : "ابدأ الآن واجمع النقاط"}</p>
                                      </div>
                                  </div>
                                  <div className={`px-5 py-2 rounded-2xl font-black ${isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/20 text-primary'}`}>
                                      {isDone ? "تم" : `+${q.points}`}
                                  </div>
                              </button>
                          );
                      })}
                  </div>
              </div>
          )}

          {/* Leaderboard List */}
          <div className="space-y-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <h3 className="text-3xl font-black text-foreground">ترتيب المتسابقين</h3>
                  <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-foreground/5 rounded-[2rem] border border-border">
                      {[
                          { id: "global", label: "العام" },
                          { id: "governorate", label: "المحافظة" },
                          { id: "quran", label: "القرآن" },
                          { id: "athkar", label: "الأذكار" },
                          { id: "listen", label: "الاستماع" }
                      ].map(tab => (
                          <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2 rounded-2xl font-black text-xs transition-all ${activeTab === tab.id ? 'bg-primary text-[#064E3B] shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
                          >
                              {tab.label}
                          </button>
                      ))}
                  </div>
              </div>

              <div className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-border bg-foreground/[0.02] hidden md:flex items-center text-xs font-black text-foreground/20 uppercase tracking-[0.3em]">
                      <div className="w-16">المركز</div>
                      <div className="flex-1">المتسابق</div>
                      <div className="w-40 text-center">الإحصائيات</div>
                      <div className="w-32 text-left">النقاط</div>
                  </div>
                  <div className="divide-y divide-border">
                      {others.length === 0 && topThree.length === 0 ? (
                          <div className="p-20 text-center text-foreground/20 font-black">لا توجد بيانات حالياً.. كن أول المنافسين!</div>
                      ) : (
                          sortedLeaderboard.map((entry, index) => (
                              <div key={entry.id} className={`flex items-center p-6 md:p-8 hover:bg-foreground/[0.02] transition-colors group gap-6 ${userData?.uid === entry.uid ? 'bg-primary/5' : ''}`}>
                                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 ${index === 0 ? 'bg-primary text-black' : index === 1 ? 'bg-slate-300 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-foreground/5 text-foreground/30'}`}>
                                      {index + 1}
                                  </div>
                                  
                                  <div className="flex items-center gap-5 flex-1 min-w-0">
                                      <div className="w-16 h-16 rounded-[1.5rem] border-2 border-border p-1 bg-card shrink-0 overflow-hidden relative group-hover:border-primary transition-colors">
                                          <img src={entry.photoURL || "/logo/logo.png"} alt={entry.username} className="w-full h-full object-cover rounded-xl" />
                                      </div>
                                      <div className="text-right min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                              <span className="font-black text-lg md:text-xl text-foreground truncate">{entry.displayName || entry.username}</span>
                                              {index < 3 && <Trophy className="w-4 h-4 text-primary" />}
                                          </div>
                                          <div className="flex items-center gap-3">
                                              <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">@{entry.username}</span>
                                              <div className="flex items-center gap-1 text-[10px] text-primary font-black bg-primary/10 px-2 py-0.5 rounded-lg">
                                                  <MapPin className="w-2.5 h-2.5" />
                                                  <span>{entry.governorate}</span>
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="hidden lg:flex items-center gap-4 w-40 justify-center">
                                      <div className="flex flex-col items-center gap-1 opacity-20 hover:opacity-100 transition-opacity" title="نقاط القرآن">
                                          <BookOpen className="w-4 h-4" />
                                          <span className="text-[9px] font-black">{Math.round(entry.quranPoints || 0)}</span>
                                      </div>
                                      <div className="flex flex-col items-center gap-1 opacity-20 hover:opacity-100 transition-opacity" title="نقاط الأذكار">
                                          <Fingerprint className="w-4 h-4" />
                                          <span className="text-[9px] font-black">{Math.round(entry.athkarPoints || 0)}</span>
                                      </div>
                                      <div className="flex flex-col items-center gap-1 opacity-20 hover:opacity-100 transition-opacity" title="نقاط الاستماع">
                                          <Headphones className="w-4 h-4" />
                                          <span className="text-[9px] font-black">{Math.round(entry.listenPoints || 0)}</span>
                                      </div>
                                  </div>

                                  <div className="text-left shrink-0">
                                      <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-5 py-2 rounded-2xl">
                                          <Star className="w-4 h-4 text-primary fill-primary" />
                                          <span className="text-2xl font-black text-primary">{Math.round(entry.totalPoints)}</span>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
           <div className="relative w-full max-w-lg bg-[#064E3B] border border-primary/30 rounded-[3rem] shadow-[0_0_100px_rgba(212,175,55,0.2)] p-12 flex flex-col items-center animate-in zoom-in-95 duration-500 overflow-hidden">
              <div className="absolute inset-0 islamic-pattern opacity-10" />
              
              <div className="relative z-10 w-full flex flex-col items-center">
                  <div className="w-24 h-24 rounded-[2rem] bg-white/10 flex items-center justify-center mb-8 border border-white/20 text-primary">
                      <ShieldCheck className="w-12 h-12" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2">إكمال الملف الشخصي</h3>
                  <p className="text-white/50 text-sm font-bold mb-10 text-center">أهلاً بك في رحاب القرآن! يرجى إدخال بياناتك للمشاركة في المنافسات</p>

                  <form onSubmit={handleProfileSubmit} className="w-full space-y-6">
                      {setupError && <div className="bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold p-5 rounded-2xl text-center">{setupError}</div>}
                      
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pr-4">الاسم الذي سيظهر للناس</label>
                          <input 
                            required
                            maxLength={20}
                            value={setupData.displayName}
                            onChange={e => setSetupData({...setupData, displayName: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-white font-black"
                            placeholder="مثلاً: خادم القرآن ✨"
                          />
                      </div>

                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pr-4">الاسم المميز (إنجليزي فقط)</label>
                          <input 
                            required
                            maxLength={15}
                            value={setupData.username}
                            onChange={e => setSetupData({...setupData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')})}
                            className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-8 text-left outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-white font-mono"
                            placeholder="username123"
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pr-4">المحافظة</label>
                              <select 
                                value={setupData.governorate}
                                onChange={e => setSetupData({...setupData, governorate: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-6 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-white font-black appearance-none"
                              >
                                {GOVERNORATES.map(gov => <option key={gov} value={gov} className="bg-[#064E3B]">{gov}</option>)}
                              </select>
                          </div>
                          <div className="space-y-3">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pr-4">رقم الهاتف</label>
                              <input 
                                required
                                type="tel"
                                value={setupData.phone}
                                onChange={e => setSetupData({...setupData, phone: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-6 text-center outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-white font-mono"
                                placeholder="01XXXXXXXX"
                              />
                          </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-6 bg-primary text-[#064E3B] rounded-[2.5rem] font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all mt-6"
                      >
                          بدء المنافسة الآن
                      </button>
                  </form>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
