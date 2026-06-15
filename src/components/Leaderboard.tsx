"use client";

import React, { useState, useEffect } from "react";
import { 
  Trophy, Medal, Users, MapPin, Star, 
  Search, ShieldCheck, ChevronRight, LogIn,
  TrendingUp, Award, Crown, Phone, User, X,
  BookOpen, Headphones, Fingerprint, Calendar,
  ArrowLeft, LayoutDashboard, ChevronLeft,
  Heart, HandHeart, Swords, Plus, Clock, Timer
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
  where,
  onSnapshot,
  increment,
  addDoc,
  serverTimestamp
} from "firebase/firestore";

const COUNTRIES = [
  "مصر", "السعودية", "الإمارات", "الكويت", "المغرب", "الجزائر", "تونس", "الأردن", "فلسطين",
  "قطر", "عمان", "البحرين", "العراق", "سوريا", "لبنان", "اليمن", "ليبيا", "السودان",
  "موريتانيا", "الصومال", "جيبوتي", "جزر القمر"
];

const getCleanCountry = (entry: any) => {
  const country = entry.country || entry.governorate;
  if (!country) return "مصر";
  if (
    country.toLowerCase() === entry.username?.toLowerCase() ||
    /^[A-Za-z0-9_@.-]+$/.test(country)
  ) {
    return "مصر";
  }
  return country;
};

interface LeaderboardProps {
  onEditProfile?: () => void;
}

export function Leaderboard({ onEditProfile }: LeaderboardProps) {
  const [user, setUser] = useState<FirebaseUser | null | undefined>(undefined);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"global" | "governorate" | "quran" | "athkar" | "listen" | "istighfar" | "salawat">("global");
  const [leaderboardMode, setLeaderboardMode] = useState<"rank" | "duels">("rank");
  const [duels, setDuels] = useState<any[]>([]);
  const [loadingDuels, setLoadingDuels] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
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

  // Listen to active duels
  useEffect(() => {
    if (!db) return;
    setLoadingDuels(true);
    const q = query(collection(db, "duels"), orderBy("createdAt", "desc"), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDuels(list);
      setLoadingDuels(false);
    }, (err) => {
      console.error(err);
      setLoadingDuels(false);
    });
    return () => unsub();
  }, []);

  // Sync user current points in active duels
  useEffect(() => {
    if (!auth?.currentUser || !db || duels.length === 0 || !userData) return;
    const myUid = auth.currentUser.uid;
    duels.forEach(async (duel) => {
      if (duel.status === "active" && duel.participants.includes(myUid)) {
        const myCurrentPoints = userData.totalPoints || 0;
        if (Math.round(duel.currentPoints?.[myUid] || 0) !== Math.round(myCurrentPoints)) {
          await updateDoc(doc(db, "duels", duel.id), {
            [`currentPoints.${myUid}`]: myCurrentPoints
          });
        }
      }
    });
  }, [duels, userData]);

  // Load friends for challenge modal
  const fetchFriends = async () => {
    if (!auth?.currentUser || !db) return;
    setLoadingFriends(true);
    try {
      const myUid = auth.currentUser.uid;
      const q = query(collection(db, "friendships"), where("users", "array-contains", myUid));
      const snap = await getDocs(q);
      const friendUids = snap.docs.map(doc => {
        const data = doc.data();
        return data.users.find((id: string) => id !== myUid);
      });

      if (friendUids.length === 0) {
        setFriends([]);
        setLoadingFriends(false);
        return;
      }

      const list = [];
      for (const fUid of friendUids) {
        const uDoc = await getDoc(doc(db, "users", fUid));
        if (uDoc.exists()) {
          list.push({ id: fUid, ...uDoc.data() });
        }
      }
      setFriends(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFriends(false);
    }
  };

  useEffect(() => {
    if (showChallengeModal) {
      fetchFriends();
    }
  }, [showChallengeModal]);

  const handleCheer = async (duelId: string, participantUid: string) => {
    if (!auth?.currentUser || !db) {
      alert("سجل دخولك أولاً لتشجيع المتسابقين!");
      return;
    }
    const myUid = auth.currentUser.uid;
    const duel = duels.find(d => d.id === duelId);
    if (!duel) return;

    const cheerersArray = duel.cheerers?.[participantUid] || [];
    const isCheering = cheerersArray.includes(myUid);
    const duelRef = doc(db, "duels", duelId);

    try {
      const { arrayUnion, arrayRemove } = await import("firebase/firestore");
      if (isCheering) {
        await updateDoc(duelRef, {
          [`cheerers.${participantUid}`]: arrayRemove(myUid),
          [`likes.${participantUid}`]: increment(-1)
        });
      } else {
        await updateDoc(duelRef, {
          [`cheerers.${participantUid}`]: arrayUnion(myUid),
          [`likes.${participantUid}`]: increment(1)
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartDuel = async (friendId: string) => {
    if (!auth?.currentUser || !db || actionLoading) return;
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;

    setActionLoading(true);
    try {
      const myUid = auth.currentUser.uid;
      const alreadyDueling = duels.some(d => d.status === "active" && d.participants.includes(myUid) && d.participants.includes(friendId));
      if (alreadyDueling) {
        alert("توجد مبارزة نشطة بالفعل بينكما حالياً!");
        setActionLoading(false);
        return;
      }

      const endsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const duelData = {
        participants: [myUid, friendId],
        names: {
          [myUid]: userData?.displayName || "أنا",
          [friendId]: friend.displayName || "صديقي"
        },
        avatars: {
          [myUid]: userData?.photoURL || "",
          [friendId]: friend.photoURL || ""
        },
        creatorId: myUid,
        status: "active",
        createdAt: serverTimestamp(),
        endsAt: endsAt.toISOString(),
        startPoints: {
          [myUid]: userData?.totalPoints || 0,
          [friendId]: friend.totalPoints || 0
        },
        currentPoints: {
          [myUid]: userData?.totalPoints || 0,
          [friendId]: friend.totalPoints || 0
        },
        likes: {
          [myUid]: 0,
          [friendId]: 0
        },
        cheerers: {
          [myUid]: [],
          [friendId]: []
        }
      };

      await addDoc(collection(db, "duels"), duelData);
      alert("⚔️ تم بدء المبارزة بنجاح! سابق صديقك الآن في لوحة الشرف!");
      setShowChallengeModal(false);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء بدء التحدي");
    } finally {
      setActionLoading(false);
    }
  };

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
      let orderByField = "totalPoints";
      if (activeTab === "quran") orderByField = "quranPoints";
      else if (activeTab === "athkar") orderByField = "athkarPoints";
      else if (activeTab === "listen") orderByField = "listenPoints";
      else if (activeTab === "istighfar") orderByField = "istighfarPoints";
      else if (activeTab === "salawat") orderByField = "salawatPoints";
      
      const q = query(collection(db, "users"), orderBy(orderByField, "desc"), limit(100));
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
    governorate: COUNTRIES[0]
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
        istighfarPoints: 0,
        salawatPoints: 0,
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
    .filter((entry: any) => activeTab === "governorate" ? (userData && (entry.country || entry.governorate) === (userData.country || userData.governorate)) : true)
    .sort((a: any, b: any) => {
      if (activeTab === "quran") return (b.quranPoints || 0) - (a.quranPoints || 0);
      if (activeTab === "athkar") return (b.athkarPoints || 0) - (a.athkarPoints || 0);
      if (activeTab === "listen") return (b.listenPoints || 0) - (a.listenPoints || 0);
      if (activeTab === "istighfar") return (b.istighfarPoints || 0) - (a.istighfarPoints || 0);
      if (activeTab === "salawat") return (b.salawatPoints || 0) - (a.salawatPoints || 0);
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
      <div className="relative bg-transparent pt-8 pb-16 md:pt-10 md:pb-20 px-6 overflow-hidden">
          <div className="absolute inset-0 islamic-pattern opacity-10" />
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />
          
          <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-primary">
                  <Trophy className="w-6 h-6 animate-bounce" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-2xl">لوحة الشرف</h1>
              <p className="text-white/60 font-bold text-sm md:text-base max-w-xl">سابقوا إلى مغفرة من ربكم وجنة عرضها السموات والأرض</p>
          </div>
      </div>

      {/* Main Content Overlay */}
      <div className="max-w-5xl mx-auto w-full px-6 -mt-8 md:-mt-10 relative z-20 space-y-10">
          
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
              <div className="flex flex-col items-center gap-6 md:gap-10">
                  <div className="flex items-end justify-center gap-3 md:gap-12 w-full">
                      {/* Rank 2 */}
                      {topThree[1] && (
                          <button onClick={() => window.dispatchEvent(new CustomEvent('show_user_profile', { detail: { userId: topThree[1].uid || topThree[1].id } }))} className="flex flex-col items-center gap-2 md:gap-3 animate-in slide-in-from-bottom-10 duration-1000 delay-200 cursor-pointer">
                              <div className="relative group">
                                  <div className="w-14 h-14 md:w-24 md:h-24 rounded-full border-[3px] md:border-[6px] border-slate-300 p-0.5 md:p-1.5 bg-card shadow-2xl relative z-10 overflow-hidden">
                                      <img src={topThree[1].photoURL || "/logo/logo.png"} alt="2" className="w-full h-full object-cover rounded-full" />
                                  </div>
                                  <div className="absolute -top-1.5 -right-1.5 md:-top-3 md:-right-3 w-6 h-6 md:w-10 md:h-10 bg-slate-300 rounded-lg md:rounded-2xl flex items-center justify-center text-black font-black text-xs md:text-base z-20 shadow-xl border-2 md:border-4 border-card">2</div>
                              </div>
                              <div className="text-center">
                                  <h3 className="font-black text-foreground text-xs md:text-lg truncate max-w-[70px] md:max-w-[100px]">{topThree[1].displayName?.split(' ')[0]}</h3>
                                  <p className="text-primary font-black text-[9px] md:text-xs">{Math.round(topThree[1].totalPoints)} نقطة</p>
                              </div>
                          </button>
                      )}

                      {/* Rank 1 */}
                      {topThree[0] && (
                          <button onClick={() => window.dispatchEvent(new CustomEvent('show_user_profile', { detail: { userId: topThree[0].uid || topThree[0].id } }))} className="flex flex-col items-center gap-3 md:gap-6 animate-in slide-in-from-bottom-12 duration-1000 cursor-pointer">
                              <div className="relative group scale-105 md:scale-110">
                                  <div className="absolute -top-6 md:-top-12 left-1/2 -translate-x-1/2 text-primary animate-pulse"><Crown className="w-6 h-6 md:w-12 md:h-12 fill-current" /></div>
                                  <div className="w-18 h-18 md:w-28 md:h-28 rounded-full border-[4px] md:border-[8px] border-primary p-1 md:p-2 bg-card shadow-[0_20px_50px_rgba(212,175,55,0.3)] relative z-10 overflow-hidden" style={{width: '4.5rem', height: '4.5rem'}}>
                                      <img src={topThree[0].photoURL || "/logo/logo.png"} alt="1" className="w-full h-full object-cover rounded-full" />
                                  </div>
                                  <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-7 h-7 md:w-12 md:h-12 bg-primary rounded-lg md:rounded-[1.2rem] flex items-center justify-center text-black font-black z-20 shadow-2xl border-2 md:border-4 border-card text-sm md:text-xl">1</div>
                              </div>
                              <div className="text-center mt-1 md:mt-0">
                                  <h3 className="font-black text-foreground text-sm md:text-2xl truncate max-w-[80px] md:max-w-[140px]">{topThree[0].displayName?.split(' ')[0]}</h3>
                                  <p className="text-primary font-black text-xs md:text-lg">{Math.round(topThree[0].totalPoints)} نقطة</p>
                              </div>
                          </button>
                      )}

                      {/* Rank 3 */}
                      {topThree[2] && (
                          <button onClick={() => window.dispatchEvent(new CustomEvent('show_user_profile', { detail: { userId: topThree[2].uid || topThree[2].id } }))} className="flex flex-col items-center gap-2 md:gap-3 animate-in slide-in-from-bottom-10 duration-1000 delay-500 cursor-pointer">
                              <div className="relative group">
                                  <div className="w-14 h-14 md:w-24 md:h-24 rounded-full border-[3px] md:border-[6px] border-amber-700 p-0.5 md:p-1.5 bg-card shadow-2xl relative z-10 overflow-hidden">
                                      <img src={topThree[2].photoURL || "/logo/logo.png"} alt="3" className="w-full h-full object-cover rounded-full" />
                                  </div>
                                  <div className="absolute -top-1.5 -right-1.5 md:-top-3 md:-right-3 w-6 h-6 md:w-10 md:h-10 bg-amber-700 rounded-lg md:rounded-2xl flex items-center justify-center text-white font-black text-xs md:text-base z-20 shadow-xl border-2 md:border-4 border-card">3</div>
                              </div>
                              <div className="text-center">
                                  <h3 className="font-black text-foreground text-xs md:text-lg truncate max-w-[70px] md:max-w-[100px]">{topThree[2].displayName?.split(' ')[0]}</h3>
                                  <p className="text-primary font-black text-[9px] md:text-xs">{Math.round(topThree[2].totalPoints)} نقطة</p>
                              </div>
                          </button>
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

          {/* Mode Toggle: Rank vs Duels */}
          <div className="flex items-center justify-center gap-2 p-1.5 bg-foreground/5 rounded-2xl border border-border w-fit mx-auto">
              <button
                onClick={() => setLeaderboardMode('rank')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${leaderboardMode === 'rank' ? 'bg-primary text-black shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
              >
                  <Trophy className="w-4 h-4" />
                  الترتيب العام
              </button>
              <button
                onClick={() => setLeaderboardMode('duels')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs transition-all ${leaderboardMode === 'duels' ? 'bg-primary text-black shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
              >
                  <Swords className="w-4 h-4" />
                  جولات الأصدقاء
              </button>
          </div>

          {leaderboardMode === 'rank' ? (
          <>
          {/* Leaderboard List */}
          <div className="space-y-6 md:space-y-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                  <h3 className="text-2xl md:text-3xl font-black text-foreground">ترتيب المتسابقين</h3>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 p-1.5 md:p-2 bg-foreground/5 rounded-[2rem] border border-border">
                      {[
                          { id: "global", label: "العام" },
                          { id: "governorate", label: "الدولة" },
                          { id: "quran", label: "القرآن" },
                          { id: "athkar", label: "الأذكار" },
                          { id: "listen", label: "الاستماع" },
                          { id: "istighfar", label: "الاستغفار" },
                          { id: "salawat", label: "الصلاة على النبي" }
                      ].map(tab => (
                          <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-3 md:px-6 py-1.5 md:py-2 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs transition-all ${activeTab === tab.id ? 'bg-primary text-black shadow-lg' : 'text-foreground/40 hover:text-foreground'}`}
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
                              <div 
                                key={entry.id} 
                                onClick={() => window.dispatchEvent(new CustomEvent('show_user_profile', { detail: { userId: entry.uid || entry.id } }))}
                                className={`flex items-center p-3 md:p-6 hover:bg-foreground/[0.02] transition-colors group gap-2 md:gap-6 cursor-pointer ${userData?.uid === entry.uid ? 'bg-primary/5' : ''}`}
                              >
                                  <div className={`w-7 h-7 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center font-black text-xs md:text-lg shrink-0 ${index === 0 ? 'bg-primary text-black' : index === 1 ? 'bg-slate-300 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-foreground/5 text-foreground/30'}`}>
                                      {index + 1}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 md:gap-5 flex-1 min-w-0">
                                      <div className="w-9 h-9 md:w-14 md:h-14 rounded-xl md:rounded-[1.5rem] border-2 border-border p-0.5 md:p-1 bg-card shrink-0 overflow-hidden relative group-hover:border-primary transition-colors">
                                          <img src={entry.photoURL || "/logo/logo.png"} alt={entry.username} className="w-full h-full object-cover rounded-lg md:rounded-xl" />
                                      </div>
                                      <div className="text-right min-w-0 flex-1">
                                          <div className="flex items-center gap-1 md:gap-2 mb-0.5">
                                              <span className="font-black text-xs md:text-lg text-foreground truncate">{entry.displayName || entry.username}</span>
                                              {index < 3 && <Trophy className="w-3 h-3 md:w-4 md:h-4 text-primary shrink-0" />}
                                          </div>
                                          <div className="flex items-center gap-1 mt-0.5">
                                              <div className="flex items-center gap-0.5 text-[8px] md:text-[10px] text-primary font-black bg-primary/10 px-1.5 md:px-2 py-0.5 rounded-md md:rounded-lg">
                                                  <MapPin className="w-2 h-2 md:w-2.5 md:h-2.5" />
                                                  <span>{getCleanCountry(entry)}</span>
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
                                      <div className="flex flex-col items-center gap-1 opacity-20 hover:opacity-100 transition-opacity" title="نقاط الاستغفار">
                                          <Heart className="w-4 h-4" />
                                          <span className="text-[9px] font-black">{Math.round(entry.istighfarPoints || 0)}</span>
                                      </div>
                                      <div className="flex flex-col items-center gap-1 opacity-20 hover:opacity-100 transition-opacity" title="نقاط الصلاة على النبي">
                                          <HandHeart className="w-4 h-4" />
                                          <span className="text-[9px] font-black">{Math.round(entry.salawatPoints || 0)}</span>
                                      </div>
                                  </div>

                                  <div className="text-left shrink-0">
                                      <div className="flex items-center gap-1 md:gap-2 bg-primary/10 border border-primary/20 px-2 md:px-4 py-1 md:py-2 rounded-xl md:rounded-2xl">
                                          <Star className="w-3 h-3 md:w-4 md:h-4 text-primary fill-primary" />
                                          <span className="text-sm md:text-xl font-black text-primary">{Math.round(entry.totalPoints)}</span>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
          </>
          ) : (
          /* ======= DUELS MODE ======= */
          <div className="space-y-6">
              <div className="flex items-center justify-between">
                  <h3 className="text-2xl md:text-3xl font-black text-foreground">⚔️ جولات الأصدقاء</h3>
                  {user && (
                      <button
                        onClick={() => setShowChallengeModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black rounded-2xl font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                      >
                          <Plus className="w-4 h-4" />
                          تحدي صديق
                      </button>
                  )}
              </div>

              {loadingDuels ? (
                  <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
              ) : duels.length === 0 ? (
                  <div className="bg-card border border-border rounded-[2rem] p-12 text-center">
                      <Swords className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
                      <p className="text-foreground/30 font-black text-lg mb-2">لا توجد مبارزات حالياً</p>
                      <p className="text-foreground/20 text-sm">ابدأ تحدي مع صديقك وسابقه في جمع النقاط!</p>
                  </div>
              ) : (
                  <div className="space-y-4">
                      {duels.map(duel => {
                          const isActive = duel.status === 'active';
                          const p1 = duel.participants[0];
                          const p2 = duel.participants[1];
                          const p1Gained = (duel.currentPoints?.[p1] || 0) - (duel.startPoints?.[p1] || 0);
                          const p2Gained = (duel.currentPoints?.[p2] || 0) - (duel.startPoints?.[p2] || 0);
                          const endsAt = duel.endsAt ? new Date(duel.endsAt) : null;
                          const isExpired = endsAt && endsAt < new Date();
                          const timeRemaining = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60))) : 0;
                          const winner = isExpired ? (p1Gained > p2Gained ? p1 : p2Gained > p1Gained ? p2 : null) : null;

                          return (
                              <div key={duel.id} className={`bg-card border rounded-[2rem] p-5 md:p-6 shadow-xl transition-all ${isActive && !isExpired ? 'border-primary/30 shadow-primary/5' : 'border-border opacity-80'}`}>
                                  {/* Duel Header */}
                                  <div className="flex items-center justify-between mb-4">
                                      <div className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-lg ${isActive && !isExpired ? 'bg-emerald-500/10 text-emerald-400' : 'bg-foreground/5 text-foreground/30'}`}>
                                          <div className={`w-1.5 h-1.5 rounded-full ${isActive && !isExpired ? 'bg-emerald-400 animate-pulse' : 'bg-foreground/20'}`} />
                                          {isActive && !isExpired ? 'جارية' : isExpired ? 'انتهت' : duel.status}
                                      </div>
                                      {isActive && !isExpired && timeRemaining > 0 && (
                                          <div className="flex items-center gap-1 text-[10px] text-foreground/30 font-bold">
                                              <Clock className="w-3 h-3" />
                                              باقي {timeRemaining} ساعة
                                          </div>
                                      )}
                                  </div>

                                  {/* Versus Display */}
                                  <div className="flex items-center justify-between gap-3">
                                      {/* Player 1 */}
                                      <button onClick={() => window.dispatchEvent(new CustomEvent('show_user_profile', { detail: { userId: p1 } }))} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                                          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 p-0.5 overflow-hidden ${winner === p1 ? 'border-primary shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-border'}`}>
                                              <img src={duel.avatars?.[p1] || '/logo/logo.png'} alt="" className="w-full h-full object-cover rounded-full" />
                                          </div>
                                          <p className="text-xs font-black text-foreground truncate max-w-[80px]">{duel.names?.[p1] || 'لاعب 1'}</p>
                                          <div className={`px-3 py-1 rounded-xl font-black text-sm ${p1Gained >= p2Gained ? 'bg-primary/10 text-primary' : 'bg-foreground/5 text-foreground/40'}`}>
                                              +{Math.round(p1Gained)}
                                          </div>
                                          {/* Cheer Button */}
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleCheer(duel.id, p1); }}
                                            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${duel.cheerers?.[p1]?.includes(auth?.currentUser?.uid) ? 'bg-red-500/10 text-red-400' : 'bg-foreground/5 text-foreground/30 hover:bg-red-500/10 hover:text-red-400'}`}
                                          >
                                              <Heart className={`w-3 h-3 ${duel.cheerers?.[p1]?.includes(auth?.currentUser?.uid) ? 'fill-current' : ''}`} />
                                              {duel.likes?.[p1] || 0}
                                          </button>
                                      </button>

                                      {/* VS */}
                                      <div className="flex flex-col items-center gap-1 shrink-0">
                                          <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center">
                                              <Swords className="w-5 h-5 text-primary" />
                                          </div>
                                          <span className="text-[9px] font-black text-foreground/20">VS</span>
                                      </div>

                                      {/* Player 2 */}
                                      <button onClick={() => window.dispatchEvent(new CustomEvent('show_user_profile', { detail: { userId: p2 } }))} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                                          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-2 p-0.5 overflow-hidden ${winner === p2 ? 'border-primary shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-border'}`}>
                                              <img src={duel.avatars?.[p2] || '/logo/logo.png'} alt="" className="w-full h-full object-cover rounded-full" />
                                          </div>
                                          <p className="text-xs font-black text-foreground truncate max-w-[80px]">{duel.names?.[p2] || 'لاعب 2'}</p>
                                          <div className={`px-3 py-1 rounded-xl font-black text-sm ${p2Gained >= p1Gained ? 'bg-primary/10 text-primary' : 'bg-foreground/5 text-foreground/40'}`}>
                                              +{Math.round(p2Gained)}
                                          </div>
                                          {/* Cheer Button */}
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleCheer(duel.id, p2); }}
                                            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black transition-all ${duel.cheerers?.[p2]?.includes(auth?.currentUser?.uid) ? 'bg-red-500/10 text-red-400' : 'bg-foreground/5 text-foreground/30 hover:bg-red-500/10 hover:text-red-400'}`}
                                          >
                                              <Heart className={`w-3 h-3 ${duel.cheerers?.[p2]?.includes(auth?.currentUser?.uid) ? 'fill-current' : ''}`} />
                                              {duel.likes?.[p2] || 0}
                                          </button>
                                      </button>
                                  </div>

                                  {/* Winner Banner */}
                                  {isExpired && winner && (
                                      <div className="mt-4 bg-primary/10 border border-primary/20 rounded-2xl p-3 text-center">
                                          <p className="text-xs font-black text-primary">🏆 الفائز: {duel.names?.[winner]}</p>
                                      </div>
                                  )}
                                  {isExpired && !winner && (
                                      <div className="mt-4 bg-foreground/5 border border-border rounded-2xl p-3 text-center">
                                          <p className="text-xs font-black text-foreground/30">تعادل!</p>
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
          )}
      </div>

      {/* Challenge Friend Modal */}
      {showChallengeModal && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowChallengeModal(false)} />
              <div className="relative w-full max-w-md bg-card border border-border rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
                  <button onClick={() => setShowChallengeModal(false)} className="absolute top-5 left-5 p-2 bg-foreground/5 rounded-full hover:bg-foreground/10 transition-colors">
                      <X className="w-5 h-5 text-foreground/40" />
                  </button>
                  <div className="text-center mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <Swords className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="text-xl font-black text-foreground">ابدأ تحدي مع صديق</h3>
                      <p className="text-xs text-foreground/40 mt-1">سابق صديقك في جمع النقاط لمدة 3 أيام!</p>
                  </div>
                  {loadingFriends ? (
                      <div className="flex justify-center py-8"><div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                  ) : friends.length === 0 ? (
                      <div className="text-center py-8">
                          <Users className="w-10 h-10 text-foreground/10 mx-auto mb-3" />
                          <p className="text-sm text-foreground/30 font-bold">لا يوجد أصدقاء حالياً</p>
                          <p className="text-xs text-foreground/20 mt-1">أضف أصدقاء من خلال الملفات الشخصية لبدء التحديات</p>
                      </div>
                  ) : (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                          {friends.map(friend => (
                              <button
                                key={friend.id}
                                onClick={() => handleStartDuel(friend.id)}
                                disabled={actionLoading}
                                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-foreground/5 hover:bg-primary/10 transition-all text-right group disabled:opacity-40"
                              >
                                  <div className="w-10 h-10 rounded-full border border-border overflow-hidden shrink-0">
                                      <img src={friend.photoURL || '/logo/logo.png'} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="text-sm font-black text-foreground truncate">{friend.displayName}</p>
                                      <p className="text-[10px] text-foreground/30 font-bold">{Math.round(friend.totalPoints || 0)} نقطة</p>
                                  </div>
                                  <div className="px-4 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-black group-hover:bg-primary group-hover:text-black transition-all shrink-0">
                                      ⚔️ تحدي
                                  </div>
                              </button>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
           <div className="relative w-full max-w-lg bg-[#0c0d10] border border-primary/30 rounded-[3rem] shadow-[0_0_100px_rgba(212,175,55,0.2)] p-12 flex flex-col items-center animate-in zoom-in-95 duration-500 overflow-hidden">
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
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] pr-4">الدولة</label>
                              <select 
                                value={setupData.governorate}
                                onChange={e => setSetupData({...setupData, governorate: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-6 text-right outline-none focus:border-primary/50 focus:bg-white/10 transition-all text-white font-black appearance-none"
                              >
                                {COUNTRIES.map(gov => <option key={gov} value={gov} className="bg-[#0c0d10]">{gov}</option>)}
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
                        className="w-full py-6 bg-primary text-black rounded-[2.5rem] font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all mt-6"
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
