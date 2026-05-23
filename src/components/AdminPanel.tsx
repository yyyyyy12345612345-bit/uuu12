"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ShieldCheck, Users, Trophy, Trash2, 
  Search, RefreshCw, AlertTriangle, 
  MapPin, Star, TrendingUp, CheckCircle, Ban, PlusCircle, Calendar,
  Mail, Phone, ArrowUpRight, UserCheck, Loader2, Bell, Image as ImageIcon, Save, Info
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
  const [campaignSettings, setCampaignSettings] = useState({
    active: false,
    label: "حملة رمضان",
    discountRate: 15,
    referralBonus: 5,
    link: ""
  });
  const [contentSettings, setContentSettings] = useState({
    featuredSurah: "الفاتحة",
    featuredText: "أفضل سورة اليوم",
    newsHeadline: "تحديث جديد متاح الآن"
  });
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    newDashboard: true,
    betaUsers: false,
    fastLogin: false,
    videoStudio: true
  });
  const [versionSettings, setVersionSettings] = useState({
    version: "v3.2",
    releaseNotes: "تحسين استقرار التطبيق، تحديث واجهة المستخدم، وإضافة دعم الدفع الجديد.",
    downloadUrl: "https://quran-henna-one.vercel.app/download",
    mandatoryUpdate: false,
    displayOnDownloadPage: false
  });
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    dailyActive: 0,
    avgSessionMinutes: 0,
    conversionRate: 0,
    alertCount: 0
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reports, setReports] = useState({
    revenueToday: 0,
    revenueWeek: 0,
    revenueMonth: 0,
    topPlan: ""
  });
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingCampaigns, setIsSavingCampaigns] = useState(false);
  const [isSavingFlags, setIsSavingFlags] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);
  const [userPlanSelection, setUserPlanSelection] = useState<Record<string, string>>({});
  const [showBannedOnly, setShowBannedOnly] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "quests" | "subs" | "settings" | "showcase" | "performance" | "alerts" | "campaigns" | "reports" | "activity" | "content" | "support" | "flags" | "versions" | "push">("stats");

  // Push notification state  
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushTarget, setPushTarget] = useState<"all" | "subscribers" | "free">("all");
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushHistory, setPushHistory] = useState<any[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ["stats", "users", "quests", "subs", "settings", "showcase", "performance", "alerts", "campaigns", "reports", "activity", "content", "support", "flags", "versions", "push"].includes(tab)) {
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
        fetchCampaignSettings();
        fetchContentSettings();
        fetchFeatureFlags();
        fetchVersionSettings();
        fetchSubRequests();
        fetchShowcaseItems();
        fetchAlerts();
        fetchSupportTickets();
        fetchActivityLog();
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

  useEffect(() => {
    calculateReports();
  }, [subRequests]);

  useEffect(() => {
    if (isAdmin) {
      fetchPerformanceMetrics();
    }
  }, [alerts, isAdmin]);

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

  const fetchCampaignSettings = async () => {
    if (!db) return;
    try {
      const docRef = doc(db, "settings", "campaigns");
      const s = await getDoc(docRef);
      if (s.exists()) {
        setCampaignSettings({
          ...campaignSettings,
          ...(s.data() || {})
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveCampaignSettings = async () => {
    if (!db) return;
    setIsSavingCampaigns(true);
    try {
      await setDoc(doc(db, "settings", "campaigns"), {
        ...campaignSettings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("تم حفظ إعدادات الحملة بنجاح!");
    } catch (e) {
      console.error(e);
      alert("فشل حفظ إعدادات الحملة");
    } finally { setIsSavingCampaigns(false); }
  };

  const fetchContentSettings = async () => {
    if (!db) return;
    try {
      const docRef = doc(db, "settings", "content");
      const s = await getDoc(docRef);
      if (s.exists()) {
        setContentSettings({
          ...contentSettings,
          ...(s.data() || {})
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveContentSettings = async () => {
    if (!db) return;
    setIsSavingContent(true);
    try {
      await setDoc(doc(db, "settings", "content"), {
        ...contentSettings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("تم حفظ إعدادات المحتوى بنجاح!");
    } catch (e) {
      console.error(e);
      alert("فشل حفظ إعدادات المحتوى");
    } finally { setIsSavingContent(false); }
  };

  const fetchFeatureFlags = async () => {
    if (!db) return;
    try {
      const docRef = doc(db, "settings", "features");
      const s = await getDoc(docRef);
      if (s.exists()) {
        setFeatureFlags({
          ...featureFlags,
          ...(s.data() || {})
        });
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveFeatureFlags = async () => {
    if (!db) return;
    setIsSavingFlags(true);
    try {
      await setDoc(doc(db, "settings", "features"), {
        ...featureFlags,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("تم حفظ إعدادات الميزات بنجاح!");
    } catch (e) {
      console.error(e);
      alert("فشل حفظ إعدادات الميزات");
    } finally { setIsSavingFlags(false); }
  };

  const fetchVersionSettings = async () => {
    if (!db) return;
    try {
      const docRef = doc(db, "settings", "version");
      const s = await getDoc(docRef);
      if (s.exists()) {
        const data = s.data();
        setVersionSettings({
          version: data.version || versionSettings.version,
          releaseNotes: data.releaseNotes || "",
          downloadUrl: data.downloadUrl || "",
          mandatoryUpdate: data.mandatoryUpdate || false,
          displayOnDownloadPage: data.displayOnDownloadPage || false
        });
        setVersionHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveVersionSettings = async () => {
    if (!db) return;
    setIsSavingVersion(true);
    try {
      const entry = {
        version: versionSettings.version,
        releaseNotes: versionSettings.releaseNotes,
        downloadUrl: versionSettings.downloadUrl,
        mandatoryUpdate: versionSettings.mandatoryUpdate,
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, "settings", "version"), {
        ...versionSettings,
        history: [entry, ...(versionHistory || [])].slice(0, 10),
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("تم حفظ معلومات الإصدار بنجاح!");
      fetchVersionSettings();
    } catch (e) {
      console.error(e);
      alert("فشل حفظ معلومات الإصدار");
    } finally { setIsSavingVersion(false); }
  };

  const fetchAlerts = async () => {
    if (!db) return;
    try {
      const docRef = doc(db, "settings", "alerts");
      const s = await getDoc(docRef);
      if (s.exists()) {
        setAlerts(s.data().items || []);
      }
    } catch (e) { console.error(e); }
  };

  const handleAcknowledgeAlert = async (index: number) => {
    const updatedAlerts = [...alerts];
    updatedAlerts[index] = { ...updatedAlerts[index], acknowledged: true };
    setAlerts(updatedAlerts);
    if (!db) return;
    try {
      await setDoc(doc(db, "settings", "alerts"), { items: updatedAlerts }, { merge: true });
    } catch (e) { console.error(e); }
  };

  const fetchSupportTickets = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, "support_tickets"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setSupportTickets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const handleUpdateTicketStatus = async (id: string, status: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "support_tickets", id), { status });
      fetchSupportTickets();
    } catch (e) { console.error(e); }
  };

  const fetchActivityLog = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, "admin_logs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setActivityLog(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const fetchPerformanceMetrics = async () => {
    if (!db) return;
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersData = usersSnapshot.docs.map(d => d.data());
      const active = usersData.filter((u: any) => u.lastActive && String(u.lastActive).startsWith(new Date().toISOString().split('T')[0])).length;
      const sessionLengths = usersData.map((u: any) => u.sessionMinutes || 0);
      const avgSession = sessionLengths.length ? Math.round(sessionLengths.reduce((sum, v) => sum + v, 0) / sessionLengths.length) : 0;
      const conversions = usersData.filter((u: any) => u.plan && u.plan !== 'free').length;
      const rate = usersData.length ? Math.round((conversions / usersData.length) * 100) : 0;
      setPerformanceMetrics({
        dailyActive: active,
        avgSessionMinutes: avgSession,
        conversionRate: rate,
        alertCount: alerts.filter(a => !a.acknowledged).length
      });
    } catch (e) { console.error(e); }
  };

  function calculateReports() {
    const daily = subRequests.filter(r => new Date(r.createdAt?.toDate ? r.createdAt.toDate() : r.createdAt || 0).toDateString() === new Date().toDateString());
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const weekly = subRequests.filter(r => (r.createdAt?.toDate ? r.createdAt.toDate().getTime() : r.createdAt || 0) >= oneWeekAgo);
    const monthly = subRequests.filter(r => (r.createdAt?.toDate ? r.createdAt.toDate().getTime() : r.createdAt || 0) >= Date.now() - 30 * 24 * 60 * 60 * 1000);
    const planCounts: any = {};
    subRequests.forEach((r) => { planCounts[r.plan] = (planCounts[r.plan] || 0) + 1; });
    setReports({
      revenueToday: daily.reduce((sum, r) => sum + (r.amount || 0), 0),
      revenueWeek: weekly.reduce((sum, r) => sum + (r.amount || 0), 0),
      revenueMonth: monthly.reduce((sum, r) => sum + (r.amount || 0), 0),
      topPlan: Object.keys(planCounts).sort((a, b) => (planCounts[b] || 0) - (planCounts[a] || 0))[0] || "لا يوجد"
    });
  }

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
          subscriptionDate: serverTimestamp(),
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        console.log("[Auth]: Profile written successfully!");
      }
      await batch.commit();
      alert(action === 'approve' ? "تم تفعيل الاشتراك بنجاح!" : "تم رفض الطلب.");
      fetchSubRequests();
      if (action === 'approve') fetchStats();
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
      setBlockedUsers(sortedUsers.filter((u: any) => u.isBanned));

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

  const handleAssignSubscription = async (uid: string, plan: string) => {
    if (!db || !window.confirm(`هل أنت متأكد من تعيين اشتراك ${plan} لهذا المستخدم؟`)) return;
    setIsUpdatingSubscription(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        plan,
        isPremium: plan !== 'free',
        subscriptionActive: plan !== 'free',
        subscriptionType: plan,
        subscriptionDate: serverTimestamp(),
        subscriptionExpiry: plan !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        updatedAt: serverTimestamp()
      });
      alert(`تم تعيين اشتراك ${plan} للمستخدم بنجاح.`);
      fetchStats();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء تعيين الاشتراك.');
    } finally {
      setIsUpdatingSubscription(false);
    }
  };

  const handleCancelSubscription = async (uid: string) => {
    if (!db || !window.confirm('هل أنت متأكد من إلغاء اشتراك هذا المستخدم؟')) return;
    setIsUpdatingSubscription(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        plan: 'free',
        isPremium: false,
        subscriptionActive: false,
        subscriptionType: 'free',
        subscriptionCancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      alert('تم إلغاء الاشتراك بنجاح.');
      fetchStats();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء إلغاء الاشتراك.');
    } finally {
      setIsUpdatingSubscription(false);
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

  const handleSendPushNotification = async () => {
    if (!db || !pushTitle || !pushBody) {
      alert('يرجى كتابة العنوان والرسالة أولاً');
      return;
    }
    setIsSendingPush(true);
    try {
      // Save notification to Firestore for delivery via Cloud Function or manual distribution
      const notifDoc = await addDoc(collection(db, 'admin_push_notifications'), {
        title: pushTitle,
        body: pushBody,
        icon: pushIcon,
        target: pushTarget,
        sentAt: serverTimestamp(),
        sentBy: auth?.currentUser?.email || 'admin',
        status: 'pending'
      });

      // Log to admin activity
      await addDoc(collection(db, 'admin_logs'), {
        action: 'send_push',
        details: `إشعار: "${pushTitle}" → ${pushTarget}`,
        createdAt: serverTimestamp()
      });

      // Refresh history
      const historySnap = await getDocs(query(collection(db, 'admin_push_notifications'), orderBy('sentAt', 'desc')));
      setPushHistory(historySnap.docs.map(d => ({ id: d.id, ...d.data() })));

      alert(`✅ تم إرسال الإشعار بنجاح! سيتم التوزيع عبر Firebase Cloud Messaging.`);
      setPushTitle('');
      setPushBody('');
    } catch (e) {
      console.error(e);
      alert('فشل إرسال الإشعار. تأكد من إعداد Firebase Functions.');
    } finally {
      setIsSendingPush(false);
    }
  };

  const fetchPushHistory = async () => {
    if (!db) return;
    try {
      const historySnap = await getDocs(query(collection(db, 'admin_push_notifications'), orderBy('sentAt', 'desc')));
      setPushHistory(historySnap.docs.slice(0, 20).map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter(u => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (u.displayName || u.username || "").toLowerCase().includes(query) ||
          (u.email || "").toLowerCase().includes(query) ||
          (u.phoneNumber || "").toString().toLowerCase().includes(query) ||
          (u.plan || "").toLowerCase().includes(query) ||
          (u.subscriptionType || "").toLowerCase().includes(query) ||
          (u.subscriptionActive ? "مشترك" : "مجاني").includes(query) ||
          (u.subscriptionActive ? "active" : "free").includes(query);
        const matchesBanFilter = showBannedOnly ? u.isBanned : true;
        return matchesSearch && matchesBanFilter;
      })
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  }, [users, searchQuery, showBannedOnly]);

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
              { id: 'push', label: '🔔 الإشعارات', icon: Bell },
              { id: 'performance', label: 'الأداء', icon: Calendar },
              { id: 'reports', label: 'التقارير', icon: ArrowUpRight },
              { id: 'activity', label: 'النشاط', icon: MapPin },
              { id: 'support', label: 'الدعم', icon: Mail },
              { id: 'campaigns', label: 'الحملات', icon: Trophy },
              { id: 'alerts', label: 'التنبيهات', icon: Bell },
              { id: 'content', label: 'المحتوى', icon: ImageIcon },
              { id: 'flags', label: 'التجارب', icon: PlusCircle },
              { id: 'versions', label: 'الإصدار', icon: Info },
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

        {activeTab === 'push' && (
          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 text-center">
                <Bell className="mx-auto mb-3 h-7 w-7 text-violet-400" />
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">المشتركين</p>
                <p className="mt-3 text-3xl font-black text-violet-400">{stats.pushSubscribers}</p>
                <p className="text-[11px] text-slate-500 mt-1">لديهم FCM Token</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 text-center">
                <Users className="mx-auto mb-3 h-7 w-7 text-emerald-400" />
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">إجمالي المستخدمين</p>
                <p className="mt-3 text-3xl font-black text-emerald-400">{stats.totalUsers}</p>
                <p className="text-[11px] text-slate-500 mt-1">جميع الحسابات</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 text-center">
                <TrendingUp className="mx-auto mb-3 h-7 w-7 text-sky-400" />
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">نسبة الوصول</p>
                <p className="mt-3 text-3xl font-black text-sky-400">
                  {stats.totalUsers > 0 ? Math.round((stats.pushSubscribers / stats.totalUsers) * 100) : 0}%
                </p>
                <p className="text-[11px] text-slate-500 mt-1">من إجمالي المستخدمين</p>
              </div>
            </div>

            {/* Compose Notification */}
            <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={fetchPushHistory}
                    className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 transition"
                  >
                    سجل الإشعارات
                  </button>
                </div>
                <div>
                  <h2 className="text-2xl font-black text-right">إرسال إشعار فوري</h2>
                  <p className="text-sm text-slate-400 text-right mt-1">ابعت إشعار لجميع المستخدمين أو فئة منهم</p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                {/* Quick Templates */}
                <div className="space-y-3 text-right">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">قوالب سريعة</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '📖 تذكير يومي', title: '📖 وقت القرآن', body: 'لم تقرأ القرآن اليوم بعد. ابدأ بسورة واحدة على الأقل 🌙' },
                      { label: '🌿 سورة الكهف', title: '🌿 يوم الجمعة المبارك', body: 'لا تنسَ قراءة سورة الكهف اليوم! من قرأها أضاءت له نور بين الجمعتين 🤍' },
                      { label: '✨ تحديث جديد', title: '✨ تحديث سكينة', body: 'ميزات جديدة رائعة متاحة الآن! اكتشفها الآن 🚀' },
                      { label: '🎯 تحدي', title: '🎯 تحدي اليوم', body: 'اقرأ 10 آيات وافوز بـ 100 نقطة! هل أنت مستعد؟ 💪' },
                    ].map(t => (
                      <button
                        key={t.label}
                        onClick={() => { setPushTitle(t.title); setPushBody(t.body); }}
                        className="rounded-2xl bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-primary/10 hover:text-primary border border-white/5 transition"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2 text-right">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">عنوان الإشعار</label>
                  <input
                    value={pushTitle}
                    onChange={e => setPushTitle(e.target.value)}
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right text-sm outline-none focus:border-primary/40"
                    placeholder="مثال: 📖 وقت القرآن"
                    maxLength={60}
                  />
                  <p className="text-xs text-slate-500 text-left">{pushTitle.length}/60</p>
                </div>

                {/* Body */}
                <div className="space-y-2 text-right">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">نص الرسالة</label>
                  <textarea
                    value={pushBody}
                    onChange={e => setPushBody(e.target.value)}
                    rows={4}
                    className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right text-sm outline-none resize-none focus:border-primary/40"
                    placeholder="اكتب رسالتك هنا..."
                    maxLength={200}
                  />
                  <p className="text-xs text-slate-500 text-left">{pushBody.length}/200</p>
                </div>

                {/* Target */}
                <div className="space-y-2 text-right">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">الفئة المستهدفة</label>
                  <div className="flex gap-3">
                    {[
                      { id: 'all', label: 'الكل', count: stats.totalUsers },
                      { id: 'subscribers', label: 'المشتركون فقط', count: stats.pushSubscribers },
                      { id: 'free', label: 'المجانيون', count: stats.totalUsers - stats.pushSubscribers },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setPushTarget(t.id as any)}
                        className={`flex-1 rounded-3xl p-4 text-center font-black text-sm transition border ${
                          pushTarget === t.id
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <p>{t.label}</p>
                        <p className="text-[11px] mt-1 opacity-60">{t.count} مستخدم</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {(pushTitle || pushBody) && (
                  <div className="rounded-3xl border border-violet-500/20 bg-slate-950/90 p-5 text-right">
                    <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-3">معاينة الإشعار</p>
                    <div className="flex items-start gap-3">
                      <img src="/logo/logo.png" className="w-10 h-10 rounded-xl" alt="" />
                      <div>
                        <p className="font-black text-white text-sm">{pushTitle || 'العنوان'}</p>
                        <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">{pushBody || 'الرسالة...'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Send Button */}
                <button
                  onClick={handleSendPushNotification}
                  disabled={isSendingPush || !pushTitle || !pushBody}
                  className="w-full rounded-3xl bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-5 text-white font-black text-base transition hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-violet-500/20"
                >
                  {isSendingPush ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> جاري الإرسال...</>
                  ) : (
                    <><Bell className="w-5 h-5" /> إرسال الإشعار الآن</>  
                  )}
                </button>
              </div>
            </div>

            {/* Push History */}
            {pushHistory.length > 0 && (
              <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8">
                <h3 className="text-xl font-black mb-5">سجل الإشعارات المُرسلة</h3>
                <div className="space-y-3">
                  {pushHistory.map(p => (
                    <div key={p.id} className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 flex items-start justify-between gap-4">
                      <div className="text-left">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                          p.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>{p.status === 'pending' ? 'في الانتظار' : 'مُرسل'}</span>
                        <p className="text-[10px] text-slate-500 mt-1">{p.target}</p>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-black text-sm">{p.title}</p>
                        <p className="text-slate-400 text-[11px] mt-1">{p.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { label: 'نشاط اليوم', value: performanceMetrics.dailyActive, color: 'text-emerald-400' },
                { label: 'متوسط الجلسة', value: `${performanceMetrics.avgSessionMinutes} د`, color: 'text-sky-400' },
                { label: 'معدل التحويل', value: `${performanceMetrics.conversionRate}%`, color: 'text-violet-400' },
                { label: 'تنبيهات لم تُعالج', value: performanceMetrics.alertCount, color: 'text-rose-400' }
              ].map((card) => (
                <div key={card.label} className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
                  <p className={`mt-4 text-4xl font-black ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-2xl font-black">لوحة أداء النظام</h2>
                  <p className="text-sm text-slate-400">مراقبة سريعة لمعدل الاستخدام والتحويلات.</p>
                </div>
                <button onClick={fetchPerformanceMetrics} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:bg-white/10">تحديث الأداء</button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6">
                  <p className="text-sm text-slate-400">أهم الفرص لتحسين التحويل</p>
                  <p className="mt-4 text-lg font-black text-white">زيادة الاشتراكات إلى الفرق الرئيسي خلال 7 أيام.</p>
                </div>
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6">
                  <p className="text-sm text-slate-400">آخر تنبيه أداء</p>
                  <p className="mt-4 text-lg font-black text-white">جاري تتبع أداء الحملة الترويجية الحالية.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { label: 'مبيعات اليوم', value: reports.revenueToday, note: 'ج.م' },
                { label: 'أسبوعياً', value: reports.revenueWeek, note: 'ج.م' },
                { label: 'شهرياً', value: reports.revenueMonth, note: 'ج.م' }
              ].map((item) => (
                <div key={item.label} className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                  <p className="mt-4 text-4xl font-black text-white">{item.value.toLocaleString()}</p>
                  <p className="text-sm text-slate-500">{item.note}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-2xl font-black">تقرير المبيعات</h2>
                  <p className="text-sm text-slate-400">ملخص الإيرادات والخطة الأكثر طلبًا.</p>
                </div>
                <span className="rounded-full bg-white/5 px-4 py-2 text-sm text-slate-300">الخطة الأفضل: {reports.topPlan}</span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6">
                  <p className="text-sm text-slate-400">مجموع الطلبات</p>
                  <p className="mt-4 text-3xl font-black text-white">{subRequests.length}</p>
                </div>
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6">
                  <p className="text-sm text-slate-400">أعلى خطة بناءً على الطلبات</p>
                  <p className="mt-4 text-3xl font-black text-primary">{reports.topPlan || 'لا يوجد'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-2xl font-black">سجل النشاط الإداري</h2>
                <p className="text-sm text-slate-400">تتبع التغييرات والإجراءات في لوحة الإدارة.</p>
              </div>
              <button onClick={fetchActivityLog} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:bg-white/10">تحديث السجل</button>
            </div>
            <div className="mt-6 space-y-3">
              {activityLog.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-950/90 p-8 text-center text-slate-500">لا يوجد نشاط حديث.</div>
              ) : (
                activityLog.map(log => (
                  <div key={log.id} className="rounded-3xl border border-white/10 bg-slate-950/90 p-4">
                    <p className="font-black">{log.action || 'حدث إداري'}</p>
                    <p className="text-xs text-slate-500">{new Date(log.createdAt?.toDate ? log.createdAt.toDate() : log.createdAt || Date.now()).toLocaleString()}</p>
                    <p className="mt-2 text-sm text-slate-300">{log.details || 'لا يوجد تفاصيل إضافية.'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-6 shadow-[0_35px_120px_rgba(15,23,42,0.18)] overflow-x-auto">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-2xl font-black">طلبات الدعم</h2>
                <p className="text-sm text-slate-400">تابع شكاوى المستخدمين وحلها بسرعة.</p>
              </div>
              <button onClick={fetchSupportTickets} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:bg-white/10">تحديث الطلبات</button>
            </div>
            <div className="mt-6 min-w-[900px]">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.18em] text-slate-400 border-b border-white/10">
                    <th className="p-4">المستخدم</th>
                    <th className="p-4">الموضوع</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {supportTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm">{ticket.userName || 'مستخدم مجهول'}</td>
                      <td className="p-4 text-sm">{ticket.subject || 'بدون موضوع'}</td>
                      <td className="p-4 text-sm"><span className="rounded-full bg-white/5 px-3 py-1 text-xs font-black text-slate-200">{ticket.status || 'جديد'}</span></td>
                      <td className="p-4 flex flex-wrap gap-2 justify-end">
                        <button onClick={() => handleUpdateTicketStatus(ticket.id, 'in_progress')} className="rounded-3xl bg-sky-500 px-3 py-2 text-[11px] font-black text-black">قيد المعالجة</button>
                        <button onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')} className="rounded-3xl bg-emerald-500 px-3 py-2 text-[11px] font-black text-black">تم الحل</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-2xl font-black">إدارة الحملات</h2>
                <p className="text-sm text-slate-400">قم بتشغيل الحملات الترويجية أو إيقافها وتعديل الخصومات.</p>
              </div>
              <button onClick={handleSaveCampaignSettings} className="rounded-3xl bg-gradient-to-r from-sky-400 to-violet-500 px-4 py-2 text-sm font-black text-black">حفظ الحملة</button>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="space-y-3 text-right">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">اسم الحملة</label>
                <input value={campaignSettings.label} onChange={e => setCampaignSettings({ ...campaignSettings, label: e.target.value })} className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right outline-none" />
              </div>
              <div className="space-y-3 text-right">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">رابط الحملة</label>
                <input value={campaignSettings.link} onChange={e => setCampaignSettings({ ...campaignSettings, link: e.target.value })} className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right outline-none" />
              </div>
              <div className="space-y-3 text-right">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">نسبة الخصم</label>
                <input type="number" value={campaignSettings.discountRate} onChange={e => setCampaignSettings({ ...campaignSettings, discountRate: parseInt(e.target.value) })} className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-center outline-none" />
              </div>
              <div className="space-y-3 text-right">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">مكافأة الإحالة</label>
                <input type="number" value={campaignSettings.referralBonus} onChange={e => setCampaignSettings({ ...campaignSettings, referralBonus: parseInt(e.target.value) })} className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-center outline-none" />
              </div>
              <div className="col-span-full flex items-center gap-3">
                <label className="inline-flex items-center gap-3 rounded-3xl bg-slate-950/90 px-4 py-4 border border-white/10">
                  <input type="checkbox" checked={campaignSettings.active} onChange={e => setCampaignSettings({ ...campaignSettings, active: e.target.checked })} className="h-4 w-4 accent-primary" />
                  <span className="text-sm text-slate-300">الحملة مفعلة</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-2xl font-black">تنبيهات النظام</h2>
                <p className="text-sm text-slate-400">معاينة تنبيهات الحالة السريعة وتقارير التحذير.</p>
              </div>
              <button onClick={fetchAlerts} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:bg-white/10">تحديث</button>
            </div>
            <div className="mt-6 space-y-4">
              {alerts.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-white/10 bg-slate-950/90 p-10 text-center text-slate-500">لا توجد تنبيهات حالياً.</div>
              ) : (
                alerts.map((alert, index) => (
                  <div key={index} className="rounded-3xl border border-white/10 bg-slate-950/90 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black">{alert.title || 'تنبيه نظام'}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(alert.createdAt?.toDate ? alert.createdAt.toDate() : alert.createdAt || Date.now()).toLocaleString()}</p>
                      </div>
                      <button onClick={() => handleAcknowledgeAlert(index)} className="rounded-3xl bg-emerald-500 px-4 py-2 text-[11px] font-black text-black">تمت القراءة</button>
                    </div>
                    <p className="mt-4 text-sm text-slate-300">{alert.message || 'لا توجد رسالة.'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-2xl font-black">إدارة المحتوى</h2>
                <p className="text-sm text-slate-400">تحكم في المحتوى المميز داخل التطبيق والواجهة الرئيسية.</p>
              </div>
              <button onClick={handleSaveContentSettings} className="rounded-3xl bg-gradient-to-r from-sky-400 to-violet-500 px-4 py-2 text-sm font-black text-black">حفظ المحتوى</button>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <div className="space-y-3 text-right">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">السورة المميزة</label>
                <input value={contentSettings.featuredSurah} onChange={e => setContentSettings({ ...contentSettings, featuredSurah: e.target.value })} className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right outline-none" />
              </div>
              <div className="space-y-3 text-right">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">النص المميز</label>
                <input value={contentSettings.featuredText} onChange={e => setContentSettings({ ...contentSettings, featuredText: e.target.value })} className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right outline-none" />
              </div>
              <div className="space-y-3 text-right">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">عنوان الأخبار</label>
                <input value={contentSettings.newsHeadline} onChange={e => setContentSettings({ ...contentSettings, newsHeadline: e.target.value })} className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right outline-none" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'flags' && (
          <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-2xl font-black">إعدادات التجارب</h2>
                <p className="text-sm text-slate-400">تفعيل أو تعطيل خصائص جديدة لتجربتها قبل تشغيلها للجميع.</p>
              </div>
              <button onClick={handleSaveFeatureFlags} className="rounded-3xl bg-gradient-to-r from-sky-400 to-violet-500 px-4 py-2 text-sm font-black text-black">حفظ التجارب</button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {Object.entries(featureFlags).map(([key, value]) => (
                <label key={key} className="inline-flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/90 p-5 text-sm text-slate-200">
                  <span className="font-black uppercase tracking-[0.12em]">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <input type="checkbox" checked={Boolean(value)} onChange={e => setFeatureFlags({ ...featureFlags, [key]: e.target.checked })} className="h-4 w-4 accent-primary" />
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="rounded-[3rem] border border-white/10 bg-slate-900/80 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.18)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-2xl font-black">إدارة الإصدارات</h2>
                <p className="text-sm text-slate-400">سجل الإصدار الأخير وأرسل إشعار تحديث جديد للتطبيق.</p>
              </div>
              <button onClick={handleSaveVersionSettings} disabled={isSavingVersion} className="rounded-3xl bg-gradient-to-r from-sky-400 to-violet-500 px-4 py-2 text-sm font-black text-black">
                {isSavingVersion ? 'حفظ...' : 'نشر التحديث'}
              </button>
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="space-y-3 text-right">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">رقم الإصدار</label>
                <input value={versionSettings.version} onChange={e => setVersionSettings({ ...versionSettings, version: e.target.value })} className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right outline-none" />
              </div>
              <div className="space-y-3 text-right">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">رابط التحميل</label>
                <input value={versionSettings.downloadUrl} onChange={e => setVersionSettings({ ...versionSettings, downloadUrl: e.target.value })} className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right outline-none" />
              </div>
              <div className="space-y-3 text-right lg:col-span-2">
                <label className="text-xs uppercase tracking-[0.18em] text-slate-400">ملاحظات التحديث</label>
                <textarea value={versionSettings.releaseNotes} onChange={e => setVersionSettings({ ...versionSettings, releaseNotes: e.target.value })} rows={5} className="w-full rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right outline-none" placeholder="اكتب ملاحظات الإصدار هنا" />
              </div>
              <label className="inline-flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/90 p-5 text-sm text-slate-200">
                <span className="font-black uppercase tracking-[0.12em]">تحديث إجباري</span>
                <input type="checkbox" checked={versionSettings.mandatoryUpdate} onChange={e => setVersionSettings({ ...versionSettings, mandatoryUpdate: e.target.checked })} className="h-4 w-4 accent-primary" />
              </label>
              <label className="inline-flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/90 p-5 text-sm text-slate-200">
                <span className="font-black uppercase tracking-[0.12em]">إظهار على صفحة التحميل</span>
                <input type="checkbox" checked={versionSettings.displayOnDownloadPage} onChange={e => setVersionSettings({ ...versionSettings, displayOnDownloadPage: e.target.checked })} className="h-4 w-4 accent-primary" />
              </label>
            </div>
            {versionHistory.length > 0 && (
              <div className="mt-8 rounded-[2rem] border border-white/10 bg-slate-950/90 p-6">
                <h3 className="text-xl font-black mb-4">سجل الإصدارات</h3>
                <div className="space-y-3">
                  {versionHistory.map((item, index) => (
                    <div key={`${item.version}-${index}`} className="rounded-3xl border border-white/10 bg-slate-900/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black">{item.version}</p>
                        <span className="text-[11px] text-slate-400">{item.mandatoryUpdate ? 'إجباري' : 'اختياري'}</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-3">{item.releaseNotes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                <p className="text-sm text-slate-400">ابحث وتابع حالة المستخدمين بسرعة. يمكنك أيضاً عرض المحظورين فقط أو إدارة اشتراكات المستخدمين مباشرة.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button onClick={() => setShowBannedOnly(prev => !prev)} className={`rounded-3xl px-4 py-3 text-sm font-black transition ${showBannedOnly ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}>
                  {showBannedOnly ? `عرض الكل (${users.length})` : `عرض المحظورين (${blockedUsers.length})`}
                </button>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-right outline-none" placeholder="ابحث عن مستخدم، خطة، أو حالة اشتراك..." />
              </div>
            </div>
            <div className="mt-6 min-w-[1100px]">
              <table className="w-full text-right">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.18em] text-slate-400 border-b border-white/10">
                    <th className="p-5">المستخدم</th>
                    <th className="p-5">الهاتف</th>
                    <th className="p-5">الدولة</th>
                    <th className="p-5">النقاط</th>
                    <th className="p-5">الاشتراك</th>
                    <th className="p-5">الانتهاء</th>
                    <th className="p-5">الإجراءات</th>
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
                        <span className={`inline-flex rounded-full px-3 py-2 text-[11px] font-black ${u.subscriptionActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-200'}`}>
                          {u.subscriptionType || u.plan || 'free'}
                        </span>
                      </td>
                      <td className="p-5 text-xs text-slate-300">
                        {u.subscriptionExpiry ? new Date(u.subscriptionExpiry?.toDate ? u.subscriptionExpiry.toDate() : u.subscriptionExpiry).toLocaleDateString() : '---'}
                      </td>
                      <td className="p-5 space-y-2 text-right">
                        <div className="flex flex-wrap gap-2 justify-end">
                          <button onClick={() => handleBanUser(u.uid, u.isBanned)} className={`rounded-3xl px-4 py-2 text-[11px] font-black transition ${u.isBanned ? 'bg-emerald-500 text-black' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}>
                            {u.isBanned ? <><CheckCircle className="inline h-4 w-4" /> فك الحظر</> : <><Ban className="inline h-4 w-4" /> حظر</>}
                          </button>
                          {u.subscriptionActive ? (
                            <button onClick={() => handleCancelSubscription(u.uid)} disabled={isUpdatingSubscription} className="rounded-3xl bg-white/5 px-4 py-2 text-[11px] font-black text-slate-100 transition hover:bg-white/10">
                              إلغاء الاشتراك
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <select value={userPlanSelection[u.uid] || 'starter'} onChange={e => setUserPlanSelection({ ...userPlanSelection, [u.uid]: e.target.value })} className="rounded-3xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs outline-none text-right">
                                <option value="starter">starter</option>
                                <option value="supporter">supporter</option>
                                <option value="premium">premium</option>
                              </select>
                              <button onClick={() => handleAssignSubscription(u.uid, userPlanSelection[u.uid] || 'starter')} disabled={isUpdatingSubscription} className="rounded-3xl bg-sky-500 px-4 py-2 text-[11px] font-black text-black transition hover:opacity-90">
                                تعيين
                              </button>
                            </div>
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
      </div>
    </div>
  );
}
