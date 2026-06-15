"use client";

import { ATHKAR } from "@/data/athkar";
import { AthkarLibrary } from "./AthkarLibrary";
import { QiblaCompass } from "./QiblaCompass";
import { addPoints, addSebhaPoints, startThikrTimer, endThikrTimer, claimQuestPoints, addIstighfarPoints, addSalawatPoints } from "@/lib/points";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useRef, useState, useEffect, useCallback } from "react";
import { 
  CheckCircle2, RotateCcw, Target, Fingerprint, 
  ArrowUpRight, ChevronRight, ChevronLeft, 
  Sun, Moon, Bed, BookOpen, Compass, MapPin, Search, Clock, Star, Video, Crown,
  Sparkles, Heart, HandHeart
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export function DailyHub() {
  const [athkarProgress, setAthkarProgress] = useState<Record<string, number>>({});
  const [globalQuests, setGlobalQuests] = useState<any[]>([]);
  const [completedQuestIds, setCompletedQuestIds] = useState<Set<string>>(new Set());
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();
  
  // Daily Goal state
  const [dailyGoal, setDailyGoal] = useState<number>(10); // Target from Stitch screen
  const [pagesRead, setPagesRead] = useState<number>(3); // Initial value from Stitch screen

  // Sibha state
  const [sibhaCount, setSibhaCount] = useState<number>(0);

  // Istighfar state
  const [istighfarCount, setIstighfarCount] = useState<number>(0);
  const ISTIGHFAR_DAILY_LIMIT = 1000;

  // Salawat state
  const [salawatCount, setSalawatCount] = useState<number>(0);
  const SALAWAT_DAILY_LIMIT = 1000;

  // Floating text states
  const [sibhaFloatingTexts, setSibhaFloatingTexts] = useState<{ id: number; text: string; x: number; y: number }[]>([]);
  const [istighfarFloatingTexts, setIstighfarFloatingTexts] = useState<{ id: number; text: string; x: number; y: number }[]>([]);
  const [salawatFloatingTexts, setSalawatFloatingTexts] = useState<{ id: number; text: string; x: number; y: number }[]>([]);

  // Qibla state
  const [qibla, setQibla] = useState<{
    heading: number | null;
    angle: number | null;
    distance: number | null;
    error: string | null;
    loading: boolean;
  }>({ heading: null, angle: null, distance: null, error: null, loading: false });
  const [scrollState, setScrollState] = useState({ left: false, right: false });
  const [activeTab, setActiveTab] = useState<"dashboard" | "tasbeeh" | "istighfar" | "salawat" | "morning" | "evening" | "sleep" | "library" | "qibla">("dashboard");
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const isRTL = getComputedStyle(scrollRef.current).direction === 'rtl';
      if (isRTL) {
        setScrollState({
          left: Math.abs(scrollLeft) < scrollWidth - clientWidth - 5,
          right: Math.abs(scrollLeft) > 5
        });
      } else {
        setScrollState({
          left: scrollLeft > 5,
          right: scrollLeft < scrollWidth - clientWidth - 5
        });
      }
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const scrollBy = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const user = auth?.currentUser;
    let unsubscribeUser: (() => void) | undefined;
    if (user && db) {
      unsubscribeUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
        if (snap.exists()) {
          setUserData(snap.data());
        }
      });
    }

    const savedProgress = localStorage.getItem("athkar_progress");
    const savedGoalDate = localStorage.getItem("daily_goal_date");
    const today = new Date().toDateString();

    if (savedProgress) setAthkarProgress(JSON.parse(savedProgress));

    if (savedGoalDate === today) {
      const savedPages = localStorage.getItem("pages_read");
      if (savedPages) setPagesRead(parseInt(savedPages, 10));
      
      const savedSibha = localStorage.getItem("sibha_count");
      if (savedSibha) setSibhaCount(parseInt(savedSibha, 10));
      
      const savedIstighfar = localStorage.getItem("istighfar_count");
      if (savedIstighfar) setIstighfarCount(parseInt(savedIstighfar, 10));
      
      const savedSalawat = localStorage.getItem("salawat_count");
      if (savedSalawat) setSalawatCount(parseInt(savedSalawat, 10));
      
      
    } else {
      localStorage.setItem("daily_goal_date", today);
      localStorage.setItem("pages_read", "3");
      localStorage.setItem("sibha_count", "0");
      localStorage.setItem("istighfar_count", "0");
      localStorage.setItem("salawat_count", "0");
      
      setPagesRead(3);
      setSibhaCount(0);
      setIstighfarCount(0);
      setSalawatCount(0);
      setAthkarProgress({});
    }

    fetchGlobalQuests();
    fetchCompletedQuests();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  useEffect(() => {
    if (activeTab === "morning" || activeTab === "evening" || activeTab === "sleep") {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const thikrId = entry.target.getAttribute("data-thikr-id");
              if (thikrId) {
                endThikrTimer(1).then((res) => {
                  if (res?.success) console.log("Earned point for Daily Thikr");
                });
                startThikrTimer(thikrId);
              }
            }
          });
        },
        { threshold: 0.6 }
      );

      const elements = document.querySelectorAll("[data-thikr-id]");
      elements.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }
  }, [activeTab, athkarProgress]);

  const handleClaimQuest = async (e: React.MouseEvent, quest: any) => {
    e.stopPropagation();
    const res = await claimQuestPoints(quest.id, quest.points);
    if (res.success) {
        alert(res.message);
        fetchCompletedQuests();
    }
  };

  const fetchCompletedQuests = async () => {
    const user = auth?.currentUser;
    if (!user || !db) return;
    try {
      const q = query(collection(db, "users", user.uid, "completed_quests"));
      const snap = await getDocs(q);
      setCompletedQuestIds(new Set(snap.docs.map(d => d.id)));
    } catch (e) { console.error(e); }
  };

  const fetchGlobalQuests = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, "global_quests"), where("active", "==", true), limit(5));
      const snapshot = await getDocs(q);
      setGlobalQuests(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const handleQuestClick = (quest: any) => {
    console.log("Quest clicked:", quest);
    if (!quest.target) {
      console.warn("Quest has no target:", quest);
      return;
    }
    
    const target = quest.target.toLowerCase();
    let url = "";

    switch (target) {
      case 'mushaf': url = '/mushaf'; break;
      case 'mushaf-full': 
      case 'digital': url = '/mushaf-full'; break;
      case 'daily': 
        setActiveTab('dashboard'); 
        return; // Internal state change
      case 'video': url = '/video'; break;
      case 'surah': 
        url = quest.surahId ? `/audio?surahId=${quest.surahId}` : '/audio';
        break;
      case 'rank': 
      case 'leaderboard': url = '/rank'; break;
      default: 
        console.warn("Unknown target:", target);
        return;
    }

    if (url) {
      console.log("Navigating to URL:", url);
      // Use direct navigation to bypass any SPA routing issues
      window.location.href = url;
    }
  };

  const lastClickTime = useRef<number>(0);

  const handleThikrClick = (thikrId: number, maxCount: number, type: any) => {
    const now = Date.now();
    if (now - lastClickTime.current < 250) return;
    lastClickTime.current = now;
    const key = `${type}_${thikrId}`;
    const current = athkarProgress[key] || 0;
    if (current < maxCount) {
      const newProgress = { ...athkarProgress, [key]: current + 1 };
      setAthkarProgress(newProgress);
      localStorage.setItem("athkar_progress", JSON.stringify(newProgress));
    }
  };

  const spawnFloatingText = (
    text: string,
    setter: React.Dispatch<React.SetStateAction<{ id: number; text: string; x: number; y: number }[]>>,
    e?: React.MouseEvent
  ) => {
    let x = 50;
    let y = 50;
    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      x = ((e.clientX - rect.left) / rect.width) * 100;
      y = ((e.clientY - rect.top) / rect.height) * 100;
    } else {
      x = 40 + Math.random() * 20;
      y = 40 + Math.random() * 20;
    }

    const id = Date.now() + Math.random();
    setter(prev => [...prev, { id, text, x, y }]);

    setTimeout(() => {
      setter(prev => prev.filter(t => t.id !== id));
    }, 1000);
  };

  const handleSibhaClick = (e?: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastClickTime.current < 200) return;
    lastClickTime.current = now;
    const newCount = sibhaCount + 1;
    setSibhaCount(newCount);
    localStorage.setItem("sibha_count", newCount.toString());
    
    // Spawn floating text based on current phase
    const text = sibhaCount % 100 < 33 ? "سُبْحَانَ اللَّهِ" : sibhaCount % 100 < 66 ? "الْحَمْدُ لِلَّهِ" : "اللَّهُ أَكْبَرُ";
    spawnFloatingText(text, setSibhaFloatingTexts, e);

    if (newCount % 99 === 0 && newCount > 0) {
       addSebhaPoints(3);
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50); 
    }
  };

  const handleIstighfarClick = (e?: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastClickTime.current < 150) return;
    if (istighfarCount >= ISTIGHFAR_DAILY_LIMIT) {
      alert("لقد وصلت للحد اليومي (1000 استغفار)");
      return;
    }
    lastClickTime.current = now;
    const newCount = istighfarCount + 1;
    setIstighfarCount(newCount);
    localStorage.setItem("istighfar_count", newCount.toString());
    addIstighfarPoints(1);
    
    // Spawn floating text
    spawnFloatingText("أَسْتَغْفِرُ اللَّهَ", setIstighfarFloatingTexts, e);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30); 
    }
  };

  const handleSalawatClick = (e?: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastClickTime.current < 150) return;
    if (salawatCount >= SALAWAT_DAILY_LIMIT) {
      alert("لقد وصلت للحد اليومي (1000 صلاة على النبي)");
      return;
    }
    lastClickTime.current = now;
    const newCount = salawatCount + 1;
    setSalawatCount(newCount);
    localStorage.setItem("salawat_count", newCount.toString());
    addSalawatPoints(1);
    
    // Spawn floating text
    spawnFloatingText("عَلَيْهِ أَفْضَلُ الصَّلَاةِ وَالسَّلَامِ", setSalawatFloatingTexts, e);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30); 
    }
  };



  const handlePageRead = async () => {
    const res = await addPoints("quran", 2); // Reduced from 5 to 2 points
    if (res.success) {
      const newCount = pagesRead + 1;
      setPagesRead(newCount);
      localStorage.setItem("pages_read", newCount.toString());
    } else if (res.message) {
      alert(res.message); // Show "Daily limit reached"
    }
  };

  const handleCompletePlanDay = async (plan: any) => {
    const user = auth?.currentUser;
    if (!user || !db || !plan) return;

    const dayToComplete = plan.currentDay;
    const isLastDay = dayToComplete >= plan.durationDays;
    
    const pointsRes = await addPoints("quran", 15);
    if (!pointsRes.success) {
      alert("⚠️ عذراً، حدث خطأ أثناء إضافة النقاط.");
      return;
    }

    const updatedCompletedDays = [...(plan.completedDays || []), dayToComplete];
    let nextDay = dayToComplete;
    let showCongrats = false;

    if (isLastDay) {
      showCongrats = true;
    } else {
      nextDay = dayToComplete + 1;
    }

    const updatedPlan = {
      ...plan,
      completedDays: updatedCompletedDays,
      currentDay: nextDay,
      isFinished: isLastDay
    };

    try {
      await updateDoc(doc(db, "users", user.uid), {
        activeQuranPlan: updatedPlan
      });

      if (showCongrats) {
        alert(`🎉 مبارك مبارك! لقد أتممت خطتك القرآنية المخصصة كاملاً بنجاح! 📖✨\nحصدت مكافآت التزامك الإيماني ونقاطاً إضافية في لوحة الشرف!`);
      } else {
        alert(`✅ تم إنجاز ورد اليوم ${dayToComplete} بنجاح! 🌟\nربحت +15 نقطة جديدة في رصيدك.`);
      }
    } catch (err) {
      console.error("Error updating plan day completion:", err);
    }
  };

  const handleDeleteCustomPlan = async () => {
    const user = auth?.currentUser;
    if (!user || !db) return;
    if (!window.confirm("هل أنت متأكد من حذف هذه الخطة القرآنية والبدء من جديد مع الذكاء الاصطناعي؟")) return;

    try {
      const { deleteField } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", user.uid), {
        activeQuranPlan: deleteField()
      });
      alert("🗑️ تم حذف الخطة بنجاح. يمكنك الآن التحدث مع الشات بوت لبرمجة خطة جديدة!");
    } catch (err) {
      console.error("Error deleting custom plan:", err);
    }
  };

  const requestQibla = useCallback(async () => {
    setQibla(prev => ({ ...prev, loading: true, error: null }));
    try {
      let lat = 0;
      let lng = 0;
      if (Capacitor.isNativePlatform()) {
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted') {
          const req = await Geolocation.requestPermissions();
          if (req.location !== 'granted') {
            throw new Error("صلاحية الموقع غير مفعّلة");
          }
        }
        const position = await Geolocation.getCurrentPosition();
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } else {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      }

      const meccaLat = 21.422487;
      const meccaLng = 39.826206;
      const phi1 = lat * Math.PI / 180;
      const phi2 = meccaLat * Math.PI / 180;
      const dlng = (meccaLng - lng) * Math.PI / 180;
      const y = Math.sin(dlng) * Math.cos(phi2);
      const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dlng);
      let bearing = Math.atan2(y, x) * 180 / Math.PI;
      bearing = (bearing + 360) % 360;

      // Calculate exact distance using Haversine formula
      const R = 6371; // Earth radius in km
      const dLat = (meccaLat - lat) * Math.PI / 180;
      const dLon = (meccaLng - lng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(phi1) * Math.cos(phi2) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = Math.round(R * c);

      setQibla(prev => ({ ...prev, angle: bearing, distance: distanceKm, loading: false }));
    } catch (err: any) {
      setQibla(prev => ({ ...prev, loading: false, error: err.message || "فشل تحديد الموقع" }));
    }
  }, []);

  const renderAthkarList = (type: any) => {
    return ATHKAR[type].map((thikr) => {
      const key = `${type}_${thikr.id}`;
      const current = athkarProgress[key] || 0;
      const isComplete = current >= thikr.count;
      return (
        <div 
          key={thikr.id} 
          data-thikr-id={`${type}_${thikr.id}`}
          onClick={() => handleThikrClick(thikr.id, thikr.count, type)}
          className={`p-6 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden active:scale-[0.97] duration-300 select-none ${
             isComplete ? 'bg-primary/5 border-primary/20 opacity-70' : 'bg-card border-border hover:border-primary/20 shadow-lg'
          }`}
        >
          <p className="text-xl md:text-2xl font-arabic leading-[1.8] text-foreground text-center mb-6">{thikr.text}</p>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-foreground/40 font-black tracking-widest uppercase">تكرار</span>
            <div className="flex items-center gap-3 font-bold" style={{ direction: 'ltr' }}>
               <span className="text-2xl text-foreground">{current}</span>
               <span className="text-foreground/30">/</span>
               <span className="text-xl text-primary">{thikr.count}</span>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="w-full h-full flex flex-col p-4 md:p-10 overflow-y-auto font-arabic no-scrollbar relative daily-hub-container">
      {/* Background Aesthetics */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-transparent" />
          <div className="absolute inset-0 mushaf-pattern opacity-[0.1]" />
      </div>

      {/* Header Section */}
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mb-10 animate-in fade-in duration-700">
          <div className="text-center md:text-right">
              <h2 className="text-3xl md:text-6xl font-black mb-1 tracking-tight">مرحباً، {userData?.displayName || "زائرنا الكريم"}</h2>
              <p className="text-foreground/40 font-bold text-base">السلام عليكم ورحمة الله وبركاته</p>
          </div>
          <div className="flex flex-row md:flex-col items-center gap-3 bg-card border border-border p-4 md:p-6 rounded-[2rem] shadow-xl">
              <Star className="w-6 h-6 text-primary" />
              <div className="flex flex-col items-center">
                  <span className="text-xl md:text-2xl font-black leading-none">{Number((userData?.totalPoints || 0).toFixed(1))}</span>
                  <span className="text-[8px] font-black text-foreground/30 uppercase tracking-widest">نقطة</span>
              </div>
          </div>
      </div>

      {/* Tabs Navigation */}
      <div className="relative w-full max-w-4xl mx-auto mb-10 z-10 group">
        <div ref={scrollRef} onScroll={checkScroll} className="flex w-full rounded-[2.5rem] p-2 bg-card border border-border overflow-x-auto horizontal-scroll no-scrollbar snap-x">
          {[
            { id: "dashboard", icon: Star, label: "الرئيسية" },
            { id: "tasbeeh", icon: Sparkles, label: "التسبيح" },
            { id: "istighfar", icon: Heart, label: "الاستغفار" },
            { id: "salawat", icon: HandHeart, label: "الصلاة على النبي" },
            
            { id: "morning", icon: Sun, label: "الصباح" },
            { id: "evening", icon: Moon, label: "المساء" },
            { id: "sleep", icon: Bed, label: "النوم" },
            { id: "library", icon: BookOpen, label: "المكتبة" },
            { id: "qibla", icon: Compass, label: "القبلة" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-[2rem] transition-all whitespace-nowrap snap-center min-w-[120px] ${
                activeTab === t.id ? 'bg-primary text-primary-foreground shadow-xl' : 'text-foreground/40 hover:text-foreground'
              }`}
            >
              <t.icon className="w-5 h-5" />
              <span className="text-sm font-black tracking-wide">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto z-10 space-y-8 flex-1">
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* AI Custom Quran Plan Widget */}
                {userData?.activeQuranPlan && (
                  <div className="md:col-span-2 bg-[#0c0d10] border border-primary/30 rounded-[3rem] p-8 relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.4)] group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                      <Star className="w-24 h-24 text-primary animate-pulse" />
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                      <div>
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary border border-primary/20 rounded-xl text-[10px] font-black tracking-widest uppercase mb-2">
                          <Crown className="w-3 h-3 text-primary" /> خطة الورد المخصصة بالذكاء الاصطناعي
                        </span>
                        <h3 className="text-2xl font-black text-white">{userData.activeQuranPlan.planName}</h3>
                        <p className="text-white/40 text-sm mt-1">الهدف اليومي: <span className="text-primary font-black">{userData.activeQuranPlan.dailyTarget}</span></p>
                      </div>
                      <button 
                        onClick={handleDeleteCustomPlan} 
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-2xl text-[10px] transition-all flex items-center gap-2 border border-red-500/20"
                      >
                        إلغاء الخطة
                      </button>
                    </div>

                    {/* Progress tracking */}
                    <div className="bg-black/20 rounded-[2rem] p-6 border border-white/5 mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-white/50">تقدم الخطة الكلي:</span>
                        <span className="text-xs font-black text-primary" style={{ direction: 'ltr' }}>
                          {userData.activeQuranPlan.completedDays?.length || 0} / {userData.activeQuranPlan.durationDays} يوم
                        </span>
                      </div>
                      <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000" 
                          style={{ width: `${Math.round(((userData.activeQuranPlan.completedDays?.length || 0) / userData.activeQuranPlan.durationDays) * 100)}%` }} 
                        />
                      </div>
                    </div>

                    {/* Day-by-Day step checklist */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] px-2 mb-2">جدول الأيام والمهام:</h4>
                      <div className="grid grid-cols-1 gap-3 max-h-[250px] overflow-y-auto pr-1 no-scrollbar">
                        {userData.activeQuranPlan.dayByDayBreakdown?.map((task: string, index: number) => {
                          const dayNum = index + 1;
                          const isDayCompleted = userData.activeQuranPlan.completedDays?.includes(dayNum);
                          const isCurrentActiveDay = userData.activeQuranPlan.currentDay === dayNum;
                          const isLocked = dayNum > userData.activeQuranPlan.currentDay;

                          return (
                            <div 
                              key={index} 
                              className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                                isDayCompleted 
                                  ? 'bg-primary/5 border-primary/20 opacity-60' 
                                  : isCurrentActiveDay 
                                    ? 'bg-white/5 border-primary shadow-[0_10px_30px_rgba(212,175,55,0.05)]' 
                                    : 'bg-black/10 border-white/5 opacity-40'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                                  isDayCompleted 
                                    ? 'bg-primary/20 text-primary' 
                                    : isCurrentActiveDay 
                                      ? 'bg-primary text-black' 
                                      : 'bg-white/5 text-white/40'
                                }`}>
                                  يوم {dayNum}
                                </span>
                                <span className={`text-xs md:text-sm font-bold ${
                                  isDayCompleted ? 'text-white/40 line-through' : 'text-white'
                                }`}>
                                  {task}
                                </span>
                              </div>

                              {/* Interactive check button */}
                              {isCurrentActiveDay && !isDayCompleted ? (
                                <button 
                                  onClick={() => handleCompletePlanDay(userData.activeQuranPlan)}
                                  className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary/90 text-black font-black rounded-xl text-[10px] transition-all shadow-md"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3px]" /> إنجاز
                                </button>
                              ) : isDayCompleted ? (
                                <span className="text-primary font-black text-[10px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> تم بنجاح
                                </span>
                              ) : (
                                <span className="text-white/20 font-black text-[10px]">مغلق</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quran Ward Card */}
                <div className="bg-card border border-border rounded-3xl p-5 md:p-6 relative overflow-hidden shadow-2xl group">
                    <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 transition-transform">
                        <BookOpen className="w-16 h-16 text-primary" />
                    </div>
                    <h3 className="text-xl font-black mb-1.5 relative z-10">ورد القرآن اليومي</h3>
                    <p className="text-foreground/40 text-xs mb-6 relative z-10">أتممت {pagesRead} صفحات من أصل {dailyGoal}</p>
                    <div className="relative w-full h-3 bg-foreground/5 rounded-full overflow-hidden mb-3">
                        <div className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000" style={{ width: `${(pagesRead/dailyGoal)*100}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-primary font-black text-xs">{Math.round((pagesRead/dailyGoal)*100)}% من الهدف</span>
                        <button onClick={handlePageRead} className="px-5 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-black rounded-xl text-xs transition-all">سجل صفحة +</button>
                    </div>
                </div>

                {/* Qibla Card */}
                <div className="bg-card text-foreground border border-border rounded-3xl p-5 md:p-6 relative overflow-hidden shadow-2xl group cursor-pointer" onClick={() => setActiveTab('qibla')}>
                    <div className="absolute top-0 right-0 p-5 opacity-10 group-hover:scale-110 transition-transform">
                        <Compass className="w-16 h-16 text-primary" />
                    </div>
                    <h3 className="text-xl font-black mb-1.5 relative z-10">اتجاه القبلة</h3>
                    <p className="text-foreground/40 text-xs mb-6 relative z-10">145° جنوب شرق</p>
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-bold text-xs">مكة المكرمة</span>
                    </div>
                </div>

                {/* Quests Section - Rebuilt for maximum reliability */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                            <Target className="w-6 h-6 text-primary animate-pulse" />
                            <h3 className="text-2xl font-black">تحديات اليوم</h3>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {globalQuests.length > 0 ? (
                            globalQuests.map((q) => {
                                const isCompleted = completedQuestIds.has(q.id);
                                
                                // Map target to UI assets
                                const questConfig: any = {
                                    'mushaf': { icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10', label: 'قراءة' },
                                    'mushaf-full': { icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'المصحف' },
                                    'daily': { icon: Sun, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'أذكار' },
                                    'video': { icon: Video, color: 'text-indigo-500', bg: 'bg-indigo-500/10', label: 'فيديو' },
                                    'surah': { icon: Clock, color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'استماع' },
                                    'rank': { icon: Target, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'ترتيب' }
                                };
                                
                                const config = questConfig[q.target?.toLowerCase()] || questConfig['mushaf'];
                                const Icon = config.icon;

                                return (
                                    <div 
                                        key={q.id} 
                                        onClick={() => handleQuestClick(q)}
                                        className={`flex items-center justify-between p-5 rounded-[2.5rem] border transition-all duration-300 cursor-pointer group active:scale-[0.98] ${
                                            isCompleted 
                                            ? 'bg-foreground/[0.02] border-border/40 opacity-60 grayscale' 
                                            : 'bg-card border-border hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5'
                                        }`}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all group-hover:scale-110 ${config.bg} ${config.color}`}>
                                                <Icon className="w-8 h-8" />
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                    {isCompleted && <span className="text-[8px] font-black text-emerald-500 uppercase">تم الإنجاز</span>}
                                                </div>
                                                <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">{q.title}</h4>
                                                <p className="text-[10px] text-foreground/40 font-bold uppercase">المكافأة: <span className="text-primary">{q.points} نقطة</span></p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {isCompleted ? (
                                                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button 
                                                        onClick={(e) => handleClaimQuest(e, q)}
                                                        className="px-6 py-3 bg-primary text-black rounded-2xl text-[10px] font-black hover:scale-105 active:scale-90 transition-all shadow-lg shadow-primary/20"
                                                    >
                                                        استلام الجائزة
                                                    </button>
                                                    <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                        <ChevronRight className="w-5 h-5 rotate-180" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-16 bg-card border border-border border-dashed rounded-[3.5rem] flex flex-col items-center justify-center gap-4 group">
                                <Clock className="w-12 h-12 text-foreground/10 group-hover:text-primary/20 transition-colors" />
                                <p className="text-foreground/20 font-black text-sm uppercase tracking-widest italic">جميع المهام مكتملة أو غير متوفرة</p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-center pt-4">
                        {/* System version removed per request */}
                    </div>
                </div>
            </div>
          )}

          {activeTab === "tasbeeh" && (
            <div className="glass-effect p-12 rounded-[3rem] border border-border animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col items-center text-center relative overflow-hidden shadow-2xl select-none">
                <button onClick={() => setSibhaCount(0)} className="absolute top-8 left-8 w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 hover:text-primary transition-all"><RotateCcw className="w-6 h-6" /></button>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 select-none">Tasbeeh Engine</span>
                <div className="h-24 mb-12 flex items-center justify-center select-none">
                    <p className="text-3xl md:text-4xl font-black text-foreground drop-shadow-md select-none">
                        {sibhaCount % 100 < 33 ? "سُبْحَانَ اللَّهِ" : sibhaCount % 100 < 66 ? "الْحَمْدُ لِلَّهِ" : "اللَّهُ أَكْبَرُ"}
                    </p>
                </div>
                <button type="button" className="relative group cursor-pointer active:scale-95 transition-all duration-300 select-none outline-none focus:outline-none" onClick={(e) => handleSibhaClick(e)}>
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-[60px] animate-pulse pointer-events-none" />
                    <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-card border-2 border-primary/20 flex flex-col items-center justify-center relative z-10 shadow-inner select-none">
                        <span className="text-8xl font-black text-foreground mb-2 select-none" style={{ direction: 'ltr' }}>{sibhaCount}</span>
                        <Fingerprint className="w-10 h-10 text-primary/40 select-none pointer-events-none" />
                    </div>
                    {/* Floating texts container */}
                    <div className="absolute inset-0 pointer-events-none overflow-visible z-30">
                        {sibhaFloatingTexts.map((item) => (
                            <span
                                key={item.id}
                                className="absolute text-xl md:text-3xl font-black font-arabic text-primary select-none animate-float-up-fade whitespace-nowrap drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                                style={{
                                    left: `${item.x}%`,
                                    top: `${item.y}%`,
                                }}
                            >
                                {item.text}
                            </span>
                        ))}
                    </div>
                </button>
                <p className="mt-12 text-foreground/30 font-black uppercase tracking-widest text-xs select-none">اضغط للتسبيح • الاهتزاز مفعل</p>
            </div>
          )}

          {activeTab === "istighfar" && (
            <div className="glass-effect p-12 rounded-[3rem] border border-border animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col items-center text-center relative overflow-hidden shadow-2xl select-none">
                <button onClick={() => setIstighfarCount(0)} className="absolute top-8 left-8 w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 hover:text-rose-500 transition-all"><RotateCcw className="w-6 h-6" /></button>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4 select-none">Istighfar Counter</span>
                <div className="h-24 mb-12 flex items-center justify-center select-none">
                    <p className="text-3xl md:text-4xl font-black text-foreground drop-shadow-md select-none">أَسْتَغْفِرُ اللَّهَ</p>
                </div>
                <button type="button" className="relative group cursor-pointer active:scale-95 transition-all duration-300 select-none outline-none focus:outline-none" onClick={(e) => handleIstighfarClick(e)}>
                    <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-[60px] animate-pulse pointer-events-none" />
                    <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-card border-2 border-rose-500/20 flex flex-col items-center justify-center relative z-10 shadow-inner select-none">
                        <span className="text-8xl font-black text-foreground mb-2 select-none" style={{ direction: 'ltr' }}>{istighfarCount}</span>
                        <span className="text-sm font-bold text-rose-500 select-none">/ {ISTIGHFAR_DAILY_LIMIT}</span>
                        <Heart className="w-10 h-10 text-rose-500/40 mt-2 select-none pointer-events-none" />
                    </div>
                    {/* Floating texts container */}
                    <div className="absolute inset-0 pointer-events-none overflow-visible z-30">
                        {istighfarFloatingTexts.map((item) => (
                            <span
                                key={item.id}
                                className="absolute text-xl md:text-3xl font-black font-arabic text-rose-400 select-none animate-float-up-fade whitespace-nowrap drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                                style={{
                                    left: `${item.x}%`,
                                    top: `${item.y}%`,
                                }}
                            >
                                {item.text}
                            </span>
                        ))}
                    </div>
                </button>
                <p className="mt-12 text-foreground/30 font-black uppercase tracking-widest text-xs select-none">اضغط للاستغفار • الحد اليومي: 1000</p>
            </div>
          )}

          {activeTab === "salawat" && (
            <div className="glass-effect p-12 rounded-[3rem] border border-border animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col items-center text-center relative overflow-hidden shadow-2xl select-none">
                <button onClick={() => setSalawatCount(0)} className="absolute top-8 left-8 w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40 hover:text-blue-500 transition-all"><RotateCcw className="w-6 h-6" /></button>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4 select-none">Salawat Counter</span>
                <div className="h-24 mb-12 flex items-center justify-center select-none">
                    <p className="text-3xl md:text-4xl font-black text-foreground drop-shadow-md select-none">اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ</p>
                </div>
                <button type="button" className="relative group cursor-pointer active:scale-95 transition-all duration-300 select-none outline-none focus:outline-none" onClick={(e) => handleSalawatClick(e)}>
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-[60px] animate-pulse pointer-events-none" />
                    <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-card border-2 border-blue-500/20 flex flex-col items-center justify-center relative z-10 shadow-inner select-none">
                        <span className="text-8xl font-black text-foreground mb-2 select-none" style={{ direction: 'ltr' }}>{salawatCount}</span>
                        <span className="text-sm font-bold text-blue-500 select-none">/ {SALAWAT_DAILY_LIMIT}</span>
                        <HandHeart className="w-10 h-10 text-blue-500/40 mt-2 select-none pointer-events-none" />
                    </div>
                    {/* Floating texts container */}
                    <div className="absolute inset-0 pointer-events-none overflow-visible z-30">
                        {salawatFloatingTexts.map((item) => (
                            <span
                                key={item.id}
                                className="absolute text-xl md:text-3xl font-black font-arabic text-blue-400 select-none animate-float-up-fade whitespace-nowrap drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                                style={{
                                    left: `${item.x}%`,
                                    top: `${item.y}%`,
                                }}
                            >
                                {item.text}
                            </span>
                        ))}
                    </div>
                </button>
                <p className="mt-12 text-foreground/30 font-black uppercase tracking-widest text-xs select-none">اضغط للصلاة على النبي • الحد اليومي: 1000</p>
            </div>
          )}



          {(activeTab === "morning" || activeTab === "evening" || activeTab === "sleep") && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {renderAthkarList(activeTab as any)}
            </div>
          )}

          {activeTab === "library" && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <AthkarLibrary />
            </div>
          )}

          {activeTab === "qibla" && (
            <div className="glass-effect p-8 md:p-12 rounded-[3rem] border border-border animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col items-center min-h-[600px] shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 islamic-pattern opacity-[0.03] pointer-events-none" />
                <div className="relative z-10 w-full flex flex-col items-center">
                    <div className="text-center mb-10">
                        <h3 className="text-4xl md:text-5xl font-black mb-3">اتجاه القبلة</h3>
                        <p className="text-foreground/40 font-bold max-w-xs mx-auto">بوصلة ذكية دقيقة لتحديد اتجاه مكة المكرمة من موقعك الحالي</p>
                    </div>

                    <QiblaCompass 
                        qiblaAngle={qibla.angle}
                        distance={qibla.distance}
                        onRequestLocation={requestQibla}
                        isLoading={qibla.loading}
                        error={qibla.error}
                    />
                </div>
            </div>
          )}
      </div>
      

    </div>
  );
}
