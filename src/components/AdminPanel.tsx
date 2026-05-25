"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { LayoutDashboard, BellRing, Activity, UserCircle, CreditCard, Swords, Settings, GalleryHorizontalEnd, BarChart3, History, HeadphonesIcon, Megaphone, AlertCircle, BookOpen, FlaskConical, Package, ShieldCheck, Loader2, X, MenuIcon, Users, UserCheck, Mail, TrendingUp, RefreshCw, Bell, Trophy, Ban, CheckCircle, Phone, AlertTriangle, Trash2 } from "lucide-react";
import surahsData from "@/data/surahs.json";
import { auth, db } from "@/lib/firebase";
import {
  collection, getDocs, doc, getDoc, updateDoc, writeBatch,
  query, orderBy, addDoc, serverTimestamp, deleteDoc, setDoc
} from "firebase/firestore";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

const ADMIN_EMAIL = "youssefosama@gmail.com";

const NAV_ITEMS = [
  { id: 'stats', label: 'الإحصائيات', icon: LayoutDashboard },
  { id: 'push', label: 'الإشعارات', icon: BellRing },
  { id: 'performance', label: 'الأداء', icon: Activity },
  { id: 'users', label: 'المستخدمين', icon: UserCircle },
  { id: 'subs', label: 'الاشتراكات', icon: CreditCard },
  { id: 'quests', label: 'المهام', icon: Swords },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
  { id: 'showcase', label: 'المعرض', icon: GalleryHorizontalEnd },
  { id: 'reports', label: 'التقارير', icon: BarChart3 },
  { id: 'activity', label: 'النشاط', icon: History },
  { id: 'support', label: 'الدعم', icon: HeadphonesIcon },
  { id: 'campaigns', label: 'الحملات', icon: Megaphone },
  { id: 'alerts', label: 'التنبيهات', icon: AlertCircle },
  { id: 'content', label: 'المحتوى', icon: BookOpen },
  { id: 'flags', label: 'التجارب', icon: FlaskConical },
  { id: 'versions', label: 'الإصدار', icon: Package },
];

interface DailyStats {
  emailCount: number;
  regCount: number;
}

interface MaintenanceMode {
  enabled: boolean;
  message: string;
  reason: string;
  duration: string;
}

const STAT_CARD_CLASS = "rounded-2xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)] p-5 text-center hover:border-white/[0.12] transition cursor-default";
const CARD_CLASS = "rounded-2xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)] p-5";
const INPUT_CLASS = "w-full bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5 text-sm text-white outline-none resize-none placeholder:text-white/20 text-right focus:border-[#fbbf24]/40 transition";
const BTN_GOLD = "w-full py-3 bg-[#fbbf24] text-black rounded-xl font-black text-sm hover:brightness-110 transition disabled:opacity-50";
const BTN_GRADIENT = "rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 px-5 py-3.5 text-black font-black transition hover:shadow-xl hover:shadow-sky-500/20 text-sm";
const BTN_GHOST = "rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 transition font-bold";
const LABEL = "text-xs font-black uppercase tracking-[0.18em] text-white/30";
const GOLD = "#fbbf24";

export function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0, topGovernorate: "...", totalPoints: 0,
    activeToday: 0, pushSubscribers: 0
  });
  const [dailyStats, setDailyStats] = useState<DailyStats>({ emailCount: 0, regCount: 0 });
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode>({
    enabled: false, message: "", reason: "", duration: ""
  });
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [usersLimit, setUsersLimit] = useState(200);
  const [totalUserCount, setTotalUserCount] = useState(0);

  const [questTitle, setQuestTitle] = useState("");
  const [questPoints, setQuestPoints] = useState(50);
  const [questTarget, setQuestTarget] = useState("mushaf");
  const [questSurahId, setQuestSurahId] = useState("1");
  const [isAddingQuest, setIsAddingQuest] = useState(false);
  const [activeQuests, setActiveQuests] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [isSettingAnnouncement, setIsSettingAnnouncement] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [subRequests, setSubRequests] = useState<any[]>([]);
  const [isSubsLoading, setIsSubsLoading] = useState(false);

  const [showcaseItems, setShowcaseItems] = useState<any[]>([]);
  const [isAddingToShowcase, setIsAddingToShowcase] = useState(false);

  const [paymentSettings, setPaymentSettings] = useState({
    vodafoneCash: "", instapay: "",
    priceStarter: 100, priceSupporter: 200, pricePremium: 250
  });
  const [campaignSettings, setCampaignSettings] = useState({
    active: false, label: "حملة رمضان", discountRate: 15, referralBonus: 5, link: ""
  });
  const [contentSettings, setContentSettings] = useState({
    featuredSurah: "الفاتحة", featuredText: "أفضل سورة اليوم", newsHeadline: "تحديث جديد متاح الآن"
  });
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    newDashboard: true, betaUsers: false, fastLogin: false, videoStudio: true
  });
  const [versionSettings, setVersionSettings] = useState({
    version: "v3.2",
    releaseNotes: "تحسين استقرار التطبيق، تحديث واجهة المستخدم، وإضافة دعم الدفع الجديد.",
    downloadUrl: "https://quran-henna-one.vercel.app/download",
    mandatoryUpdate: false, displayOnDownloadPage: false
  });
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [isSavingVersion, setIsSavingVersion] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    dailyActive: 0, avgSessionMinutes: 0, conversionRate: 0, alertCount: 0
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [reports, setReports] = useState({
    revenueToday: 0, revenueWeek: 0, revenueMonth: 0, topPlan: ""
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
  const [activeTab, setActiveTab] = useState<string>("stats");

  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushTarget, setPushTarget] = useState<"all" | "subscribers" | "free">("all");
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushHistory, setPushHistory] = useState<any[]>([]);

  // Lazy loading: track which tabs have been visited
  const visitedTabsRef = useRef<Set<string>>(new Set(['stats']));
  const [tabLoading, setTabLoading] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && NAV_ITEMS.some(n => n.id === tab)) setActiveTab(tab);

    // Guard: ensure Firebase auth is initialized
    if (!auth || typeof auth === 'undefined') {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user && user.email === ADMIN_EMAIL) {
          setIsAdmin(true);
          // Only fetch stats on mount (other tabs lazy-load when activated)
          try {
            if (!db) {
              setLoading(false);
              return;
            }
            const snapshot = await getDocs(collection(db, "users"));
            const usersData = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
            setTotalUserCount(snapshot.size);
            const totalPoints = usersData.reduce((acc, curr: any) => acc + (curr.totalPoints || 0), 0);
            const today = new Date().toISOString().split('T')[0];
            const activeTodayCount = usersData.filter((u: any) => {
              if (!u.lastActive) return false;
              const lastActiveStr = typeof u.lastActive === 'string' ? u.lastActive : (u.lastActive.toDate ? u.lastActive.toDate().toISOString() : String(u.lastActive));
              return lastActiveStr.startsWith(today);
            }).length;
            const govCounts: any = {}; 
            usersData.forEach((u: any) => { if (u.governorate) govCounts[u.governorate] = (govCounts[u.governorate] || 0) + 1; });
            const govKeys = Object.keys(govCounts);
            const topGov = govKeys.length > 0 ? govKeys.reduce((a, b) => govCounts[a] > govCounts[b] ? a : b) : "لا توجد بيانات";
            const pushSubscribers = usersData.filter((u: any) => u.fcmToken).length;
            setStats({ totalUsers: snapshot.size, topGovernorate: topGov, totalPoints, activeToday: activeTodayCount, pushSubscribers });
            const sortedUsers = usersData.sort((a: any, b: any) => (b.totalPoints || 0) - (a.totalPoints || 0));
            setUsers(sortedUsers.slice(0, 200));
            setBlockedUsers(sortedUsers.filter((u: any) => u.isBanned).slice(0, 200));
          } catch (statsError) {
            console.error("[AdminPanel] Stats fetch error:", statsError);
          }
        } else setIsAdmin(false);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("[AdminPanel] Auth error:", error);
      setLoading(false);
    }
  }, []);

  // Lazy load tab data: fire when activeTab changes
  useEffect(() => {
    if (!isAdmin) return;
    const tab = activeTab;
    if (visitedTabsRef.current.has(tab)) return;
    visitedTabsRef.current.add(tab);
    setTabLoading(tab);

    const loaders: Record<string, () => Promise<void>> = {
      stats: async () => { await fetchDailyStats(); },
      push: async () => { await fetchPushHistory(); },
      performance: async () => { await fetchPerformanceMetrics(); },
      users: async () => {},
      subs: async () => { await fetchSubRequests(); },
      quests: async () => { await fetchQuests(); },
      settings: async () => { await fetchPaymentSettings(); await fetchMaintenanceMode(); },
      showcase: async () => { await fetchShowcaseItems(); },
      reports: async () => { await fetchSubRequests(); },
      activity: async () => { await fetchActivityLog(); },
      support: async () => { await fetchSupportTickets(); },
      campaigns: async () => { await fetchCampaignSettings(); },
      alerts: async () => { await fetchAlerts(); },
      content: async () => { await fetchContentSettings(); },
      flags: async () => { await fetchFeatureFlags(); },
      versions: async () => { await fetchVersionSettings(); },
    };

    if (loaders[tab]) {
      loaders[tab]().finally(() => setTabLoading(null));
    } else {
      setTabLoading(null);
    }
  }, [activeTab, isAdmin]);

  // Fetch announcement + content + feature flags + version early (lightweight single-doc reads)
  useEffect(() => {
    if (!isAdmin || !db || typeof db === 'undefined') return;
    
    try {
      fetchAnnouncement();
      fetchContentSettings();
      fetchFeatureFlags();
      fetchVersionSettings();
      fetchCampaignSettings();
    } catch (error) {
      console.error("[AdminPanel] Early fetch error:", error);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState(null, '', url.toString());
    }
  }, [activeTab, isAdmin]);

  useEffect(() => { calculateReports(); }, [subRequests]);

  useEffect(() => { if (isAdmin) fetchPerformanceMetrics(); }, [alerts, isAdmin]);

  // --- Data Fetching ---
  const fetchDailyStats = async () => {
    if (!db) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const emailSnap = await getDocs(collection(db, "emailLogs"));
      const emailCount = emailSnap.docs.filter(d => d.data().date === today).length;

      const usersSnap = await getDocs(collection(db, "users"));
      const regCount = usersSnap.docs.filter(d => {
        const created = d.data().createdAt;
        return created && typeof created === 'string' && created.startsWith(today);
      }).length;

      setDailyStats({ emailCount, regCount });
    } catch (e) { console.error(e); }
  };

  const fetchMaintenanceMode = async () => {
    if (!db) return;
    try {
      const s = await getDoc(doc(db, "admin", "config"));
      if (s.exists()) {
        const m = s.data().maintenance;
        if (m) setMaintenanceMode({ enabled: m.enabled || false, message: m.message || "", reason: m.reason || "", duration: m.duration || "" });
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveMaintenance = async () => {
    if (!db) return;
    try {
      await setDoc(doc(db, "admin", "config"), { maintenance: maintenanceMode }, { merge: true });
      alert("✅ تم حفظ وضع الصيانة بنجاح!");
    } catch (e) { console.error(e); alert("فشل الحفظ"); }
  };

  const fetchAnnouncement = async () => {
    if (!db) return;
    try { const s = await getDoc(doc(db, "settings", "global")); if (s.exists()) setAnnouncement(s.data().announcement || ""); }
    catch (e) { console.error(e); }
  };

  const fetchPaymentSettings = async () => {
    if (!db) return;
    try {
      const s = await getDoc(doc(db, "settings", "pricing"));
      if (s.exists()) {
        const d = s.data();
        setPaymentSettings({ vodafoneCash: d.vodafoneCash || "", instapay: d.instapay || "", priceStarter: d.priceStarter || 100, priceSupporter: d.priceSupporter || 200, pricePremium: d.pricePremium || 250 });
      }
    } catch (e) { console.error(e); }
  };

  const handleSavePaymentSettings = async () => {
    if (!db) return; setIsSavingSettings(true);
    try { await setDoc(doc(db, "settings", "pricing"), { ...paymentSettings, updatedAt: serverTimestamp() }, { merge: true }); alert("✅ تم حفظ إعدادات الدفع!"); }
    catch (e) { console.error(e); alert("فشل الحفظ"); } finally { setIsSavingSettings(false); }
  };

  const fetchCampaignSettings = async () => {
    if (!db) return;
    try { const s = await getDoc(doc(db, "settings", "campaigns")); if (s.exists()) setCampaignSettings({ ...campaignSettings, ...(s.data() || {}) }); }
    catch (e) { console.error(e); }
  };

  const handleSaveCampaignSettings = async () => {
    if (!db) return; setIsSavingCampaigns(true);
    try { await setDoc(doc(db, "settings", "campaigns"), { ...campaignSettings, updatedAt: serverTimestamp() }, { merge: true }); alert("✅ تم حفظ الحملة!"); }
    catch (e) { console.error(e); alert("فشل الحفظ"); } finally { setIsSavingCampaigns(false); }
  };

  const fetchContentSettings = async () => {
    if (!db) return;
    try { const s = await getDoc(doc(db, "settings", "content")); if (s.exists()) setContentSettings({ ...contentSettings, ...(s.data() || {}) }); }
    catch (e) { console.error(e); }
  };

  const handleSaveContentSettings = async () => {
    if (!db) return; setIsSavingContent(true);
    try { await setDoc(doc(db, "settings", "content"), { ...contentSettings, updatedAt: serverTimestamp() }, { merge: true }); alert("✅ تم حفظ المحتوى!"); }
    catch (e) { console.error(e); alert("فشل الحفظ"); } finally { setIsSavingContent(false); }
  };

  const fetchFeatureFlags = async () => {
    if (!db) return;
    try { const s = await getDoc(doc(db, "settings", "features")); if (s.exists()) setFeatureFlags({ ...featureFlags, ...(s.data() || {}) }); }
    catch (e) { console.error(e); }
  };

  const handleSaveFeatureFlags = async () => {
    if (!db) return; setIsSavingFlags(true);
    try { await setDoc(doc(db, "settings", "features"), { ...featureFlags, updatedAt: serverTimestamp() }, { merge: true }); alert("✅ تم حفظ التجارب!"); }
    catch (e) { console.error(e); alert("فشل الحفظ"); } finally { setIsSavingFlags(false); }
  };

  const fetchVersionSettings = async () => {
    if (!db) return;
    try {
      const s = await getDoc(doc(db, "settings", "version"));
      if (s.exists()) {
        const d = s.data();
        setVersionSettings({ version: d.version || "v3.2", releaseNotes: d.releaseNotes || "", downloadUrl: d.downloadUrl || "", mandatoryUpdate: d.mandatoryUpdate || false, displayOnDownloadPage: d.displayOnDownloadPage || false });
        setVersionHistory(d.history || []);
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveVersionSettings = async () => {
    if (!db) return; setIsSavingVersion(true);
    try {
      const entry = { version: versionSettings.version, releaseNotes: versionSettings.releaseNotes, downloadUrl: versionSettings.downloadUrl, mandatoryUpdate: versionSettings.mandatoryUpdate, createdAt: serverTimestamp() };
      await setDoc(doc(db, "settings", "version"), { ...versionSettings, history: [entry, ...(versionHistory || [])].slice(0, 10), updatedAt: serverTimestamp() }, { merge: true });
      alert("✅ تم نشر التحديث!"); fetchVersionSettings();
    } catch (e) { console.error(e); alert("فشل الحفظ"); } finally { setIsSavingVersion(false); }
  };

  const fetchAlerts = async () => {
    if (!db) return;
    try { const s = await getDoc(doc(db, "settings", "alerts")); if (s.exists()) setAlerts(s.data().items || []); }
    catch (e) { console.error(e); }
  };

  const handleAcknowledgeAlert = async (index: number) => {
    const updatedAlerts = [...alerts]; updatedAlerts[index] = { ...updatedAlerts[index], acknowledged: true }; setAlerts(updatedAlerts);
    if (!db) return; try { await setDoc(doc(db, "settings", "alerts"), { items: updatedAlerts }, { merge: true }); } catch (e) { console.error(e); }
  };

  const fetchSupportTickets = async () => {
    if (!db) return;
    try { const q = query(collection(db, "support_tickets"), orderBy("createdAt", "desc")); const snapshot = await getDocs(q); setSupportTickets(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); }
    catch (e) { console.error(e); }
  };

  const handleUpdateTicketStatus = async (id: string, status: string) => {
    if (!db) return; try { await updateDoc(doc(db, "support_tickets", id), { status }); fetchSupportTickets(); } catch (e) { console.error(e); }
  };

  const fetchActivityLog = async () => {
    if (!db) return;
    try { const q = query(collection(db, "admin_logs"), orderBy("createdAt", "desc")); const snapshot = await getDocs(q); setActivityLog(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); }
    catch (e) { console.error(e); }
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
      setPerformanceMetrics({ dailyActive: active, avgSessionMinutes: avgSession, conversionRate: rate, alertCount: alerts.filter(a => !a.acknowledged).length });
    } catch (e) { console.error(e); }
  };

  function calculateReports() {
    const daily = subRequests.filter(r => new Date(r.createdAt?.toDate ? r.createdAt.toDate() : r.createdAt || 0).toDateString() === new Date().toDateString());
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekly = subRequests.filter(r => (r.createdAt?.toDate ? r.createdAt.toDate().getTime() : r.createdAt || 0) >= oneWeekAgo);
    const monthly = subRequests.filter(r => (r.createdAt?.toDate ? r.createdAt.toDate().getTime() : r.createdAt || 0) >= Date.now() - 30 * 24 * 60 * 60 * 1000);
    const planCounts: any = {}; subRequests.forEach(r => { planCounts[r.plan] = (planCounts[r.plan] || 0) + 1; });
    setReports({
      revenueToday: daily.reduce((sum, r) => sum + (r.amount || 0), 0),
      revenueWeek: weekly.reduce((sum, r) => sum + (r.amount || 0), 0),
      revenueMonth: monthly.reduce((sum, r) => sum + (r.amount || 0), 0),
      topPlan: Object.keys(planCounts).sort((a, b) => (planCounts[b] || 0) - (planCounts[a] || 0))[0] || "لا يوجد"
    });
  }

  const fetchSubRequests = async () => {
    if (!db) return; setIsSubsLoading(true);
    try { const q = query(collection(db, "subscription_requests"), orderBy("createdAt", "desc")); const snapshot = await getDocs(q); setSubRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); }
    catch (e) { console.error(e); } finally { setIsSubsLoading(false); }
  };

  const fetchShowcaseItems = async () => {
    if (!db) return;
    try { const q = query(collection(db, "showcase"), orderBy("createdAt", "desc")); const snapshot = await getDocs(q); setShowcaseItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); }
    catch (e) { console.error(e); }
  };

  const handleAddToShowcase = async (videoUrl: string, userName: string, surahName: string) => {
    if (!db || !videoUrl) return; setIsAddingToShowcase(true);
    try { await addDoc(collection(db, "showcase"), { videoUrl, userName, surahName, createdAt: serverTimestamp() }); alert("✅ تمت الإضافة!"); fetchShowcaseItems(); }
    catch (e) { console.error(e); } finally { setIsAddingToShowcase(false); }
  };

  const handleDeleteShowcaseItem = async (id: string) => {
    if (!db || !window.confirm("حذف من المعرض؟")) return; try { await deleteDoc(doc(db, "showcase", id)); fetchShowcaseItems(); } catch (e) { console.error(e); }
  };

  const handleActionSubscription = async (requestId: string, userId: string, plan: string, action: 'approve' | 'reject') => {
    if (!db || !window.confirm(`تأكيد ${action === 'approve' ? 'تفعيل' : 'رفض'} الاشتراك؟`)) return;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "subscription_requests", requestId), { status: action === 'approve' ? 'approved' : 'rejected', processedAt: serverTimestamp() });
      if (action === 'approve') {
        batch.update(doc(db, "users", userId), { plan, isPremium: true, subscriptionActive: true, subscriptionType: plan, subscriptionDate: serverTimestamp(), subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
      }
      await batch.commit();
      alert(action === 'approve' ? "✅ تم تفعيل الاشتراك!" : "تم الرفض");
      fetchSubRequests(); if (action === 'approve') fetchStats();
    } catch (e) { console.error(e); alert("حدث خطأ"); }
  };

  const loadAllUsers = useCallback(async () => {
    setUsersLimit(Infinity);
    if (!db) return;
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const allUsers = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }))
        .sort((a: any, b: any) => (b.totalPoints || 0) - (a.totalPoints || 0));
      setUsers(allUsers);
      setBlockedUsers(allUsers.filter((u: any) => u.isBanned));
    } catch (e) { console.error(e); }
  }, []);

  const fetchStats = useCallback(async () => {
    if (!db) return;
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const usersData = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
      setTotalUserCount(snapshot.size);
      const totalPoints = usersData.reduce((acc, curr: any) => acc + (curr.totalPoints || 0), 0);
      const today = new Date().toISOString().split('T')[0];
      const activeTodayCount = usersData.filter((u: any) => {
        if (!u.lastActive) return false;
        const lastActiveStr = typeof u.lastActive === 'string' ? u.lastActive : (u.lastActive.toDate ? u.lastActive.toDate().toISOString() : String(u.lastActive));
        return lastActiveStr.startsWith(today);
      }).length;
      const govCounts: any = {}; usersData.forEach((u: any) => { if (u.governorate) govCounts[u.governorate] = (govCounts[u.governorate] || 0) + 1; });
      const govKeys = Object.keys(govCounts);
      const topGov = govKeys.length > 0 ? govKeys.reduce((a, b) => govCounts[a] > govCounts[b] ? a : b) : "لا توجد بيانات";
      const pushSubscribers = usersData.filter((u: any) => u.fcmToken).length;
      setStats({ totalUsers: snapshot.size, topGovernorate: topGov, totalPoints, activeToday: activeTodayCount, pushSubscribers });
      // Only keep first 200 users sorted by points
      const sortedUsers = usersData.sort((a: any, b: any) => (b.totalPoints || 0) - (a.totalPoints || 0));
      setUsers(sortedUsers.slice(0, 200));
      setBlockedUsers(sortedUsers.filter((u: any) => u.isBanned).slice(0, 200));
      const top3 = sortedUsers.slice(0, 3);
      for (const topUser of top3) {
        const plan = (topUser as { uid: string; plan?: string }).plan;
        if (plan === "free" || !plan) await updateDoc(doc(db, "users", (topUser as { uid: string }).uid), { plan: "starter", rewardedPlan: true, updatedAt: serverTimestamp() });
      }
    } catch (e) { console.error("Error fetching admin stats:", e); }
  }, []);

  const handleSetAnnouncement = async () => {
    if (!db) return; setIsSettingAnnouncement(true);
    try { await setDoc(doc(db, "settings", "global"), { announcement, updatedAt: serverTimestamp() }, { merge: true }); alert("✅ تم نشر الإعلان!"); }
    catch (e) { console.error(e); } finally { setIsSettingAnnouncement(false); }
  };

  const handleBanUser = async (uid: string, currentStatus: boolean) => {
    if (!db || !window.confirm(`تأكيد ${currentStatus ? 'إلغاء حظر' : 'حظر'} المستخدم؟`)) return;
    try { await updateDoc(doc(db, "users", uid), { isBanned: !currentStatus }); fetchStats(); } catch (e) { console.error(e); }
  };

  const handleAssignSubscription = async (uid: string, plan: string) => {
    if (!db || !window.confirm(`تعيين اشتراك ${plan} للمستخدم؟`)) return; setIsUpdatingSubscription(true);
    try {
      await updateDoc(doc(db, "users", uid), { plan, isPremium: plan !== 'free', subscriptionActive: plan !== 'free', subscriptionType: plan, subscriptionDate: serverTimestamp(), subscriptionExpiry: plan !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null, updatedAt: serverTimestamp() });
      alert(`✅ تم تعيين ${plan}`); fetchStats();
    } catch (e) { console.error(e); alert('حدث خطأ'); } finally { setIsUpdatingSubscription(false); }
  };

  const handleCancelSubscription = async (uid: string) => {
    if (!db || !window.confirm('إلغاء اشتراك المستخدم؟')) return; setIsUpdatingSubscription(true);
    try { await updateDoc(doc(db, "users", uid), { plan: 'free', isPremium: false, subscriptionActive: false, subscriptionType: 'free', subscriptionCancelledAt: serverTimestamp(), updatedAt: serverTimestamp() }); alert('✅ تم الإلغاء'); fetchStats(); }
    catch (e) { console.error(e); alert('حدث خطأ'); } finally { setIsUpdatingSubscription(false); }
  };

  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault(); if (!db || !questTitle) return; setIsAddingQuest(true);
    try { await addDoc(collection(db, "global_quests"), { title: questTitle, points: questPoints, target: questTarget, surahId: questTarget === 'surah' ? questSurahId : null, createdAt: serverTimestamp(), active: true }); setQuestTitle(""); fetchQuests(); }
    catch (e) { console.error(e); } finally { setIsAddingQuest(false); }
  };

  const fetchQuests = async () => {
    if (!db) return;
    try { const q = query(collection(db, "global_quests"), orderBy("createdAt", "desc")); const snapshot = await getDocs(q); setActiveQuests(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); }
    catch (e) { console.error(e); }
  };

  const handleDeleteQuest = async (id: string) => {
    if (!db || !window.confirm("حذف المهمة؟")) return; try { await deleteDoc(doc(db, "global_quests", id)); fetchQuests(); } catch (e) { console.error(e); }
  };

  const handleResetLeaderboard = async () => {
    if (!db || !window.confirm("تصفير جميع نقاط المستخدمين؟")) return; setIsResetting(true);
    try {
      const snapshot = await getDocs(collection(db, "users")); const batch = writeBatch(db);
      snapshot.docs.forEach(userDoc => batch.update(userDoc.ref, { totalPoints: 0, quranPoints: 0, athkarPoints: 0, listenPoints: 0, streakDays: 0 }));
      await batch.commit(); alert("✅ تم التصفير!"); fetchStats();
    } catch (e) { console.error(e); } finally { setIsResetting(false); }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoginError(""); setIsLoggingIn(true);
    try { await signInWithEmailAndPassword(auth, email, password); } catch { setLoginError("فشل تسجيل الدخول"); } finally { setIsLoggingIn(false); }
  };

  const handleSendPushNotification = async () => {
    if (!db || !pushTitle || !pushBody) { alert('يرجى كتابة العنوان والرسالة'); return; }
    setIsSendingPush(true);
    try {
      await addDoc(collection(db, 'admin_push_notifications'), { title: pushTitle, body: pushBody, target: pushTarget, sentAt: serverTimestamp(), sentBy: auth?.currentUser?.email || 'admin', status: 'pending' });
      await addDoc(collection(db, 'admin_logs'), { action: 'send_push', details: `إشعار: "${pushTitle}" → ${pushTarget}`, createdAt: serverTimestamp() });
      const historySnap = await getDocs(query(collection(db, 'admin_push_notifications'), orderBy('sentAt', 'desc')));
      setPushHistory(historySnap.docs.map(d => ({ id: d.id, ...d.data() })));
      alert("✅ تم إرسال الإشعار بنجاح!");
      setPushTitle(''); setPushBody('');
    } catch (e) { console.error(e); alert('فشل إرسال الإشعار'); } finally { setIsSendingPush(false); }
  };

  const fetchPushHistory = async () => {
    if (!db) return;
    try { const historySnap = await getDocs(query(collection(db, 'admin_push_notifications'), orderBy('sentAt', 'desc'))); setPushHistory(historySnap.docs.slice(0, 20).map(d => ({ id: d.id, ...d.data() }))); }
    catch (e) { console.error(e); }
  };

  const filteredUsers = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return users.filter(u => {
      return (q === '' || (u.displayName || u.username || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.phoneNumber || "").toString().toLowerCase().includes(q) || (u.plan || "").toLowerCase().includes(q) || (u.subscriptionType || "").toLowerCase().includes(q)) && (showBannedOnly ? u.isBanned : true);
    }).sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  }, [users, debouncedSearch, showBannedOnly]);

  // Debounced search: only start filtering after 300ms of no typing
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const topUsers = users.slice(0, 5);

  if (loading) return null;

  // ==============================
  // LOGIN SCREEN
  // ==============================
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-[#0b0f1a]">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(245,158,11,0.06)_0%,transparent_70%)] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(20,184,166,0.04)_0%,transparent_70%)] rounded-full pointer-events-none" />
        <form onSubmit={handleAdminLogin} className="relative w-full max-w-sm space-y-5 rounded-3xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)] backdrop-blur-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#fbbf24]/10 flex items-center justify-center border border-[#fbbf24]/20">
            <ShieldCheck className="w-8 h-8 text-[#fbbf24]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white/90">مركز التحكم</h2>
            <p className="text-xs text-white/30 font-bold">سجل دخول بحساب الإدارة</p>
          </div>
          <div className="space-y-3 text-right">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl outline-none text-sm text-white placeholder:text-white/20 text-right" placeholder="البريد الإلكتروني" />
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl outline-none text-sm text-white placeholder:text-white/20 text-right" placeholder="كلمة المرور" />
          </div>
          <button type="submit" disabled={isLoggingIn} className="w-full py-3.5 bg-[#fbbf24] text-black rounded-2xl font-black text-sm hover:brightness-110 transition shadow-lg shadow-[#fbbf24]/20 disabled:opacity-50">
            {isLoggingIn ? <Loader2 className="inline-block w-5 h-5 animate-spin" /> : 'دخول'}
          </button>
          {loginError && <p className="text-xs text-red-400 font-bold">{loginError}</p>}
        </form>
      </div>
    );
  }

  // ==============================
  // MAIN LAYOUT
  // ==============================
  return (
    <div className="h-full w-full bg-[#0b0f1a] text-white font-arabic flex overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 right-0 h-full z-50 w-64 shrink-0 border-l border-white/[0.06] bg-[#0a0d16] overflow-y-auto no-scrollbar transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo/logo.png" className="w-8 h-8 rounded-lg" alt="" />
            <div>
              <p className="text-sm font-black text-white/90">التحكم</p>
              <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/30 hover:text-white/70">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20 shadow-[0_0_20px_rgba(251,191,36,0.05)]'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.03]">
            <div className="w-7 h-7 rounded-lg bg-[#fbbf24]/10 flex items-center justify-center text-[#fbbf24] text-xs font-black">
              {stats.totalUsers}
            </div>
            <div>
              <p className="text-[10px] font-bold text-white/30">الإجمالي</p>
              <p className="text-xs font-black text-white/70">مستخدم</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-[#0b0f1a]/95 backdrop-blur-xl border-b border-white/[0.06] p-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="text-white/40 hover:text-white/70">
              <MenuIcon className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo/logo.png" className="w-7 h-7 rounded-lg" alt="" />
              <span className="text-sm font-black">التحكم</span>
            </div>
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {NAV_ITEMS.slice(0, 4).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${activeTab === tab.id ? 'bg-[#fbbf24]/10 text-[#fbbf24]' : 'text-white/30'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 pb-24 space-y-6 max-w-6xl mx-auto">
          {/* ========== STATS TAB ========== */}
          {/* Tab loading indicator */}
          {tabLoading === activeTab && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#fbbf24]" />
              <span className="mr-3 text-sm text-white/40 font-bold">جاري تحميل البيانات...</span>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-black text-white/90">لوحة البيانات</h1>
                  <p className="text-sm text-white/30 font-bold mt-1">نظرة عامة على أداء التطبيق</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <RefreshCw className="w-3 h-3" />
                  {new Date().toLocaleDateString("ar-EG")}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: 'text-[#fbbf24]' },
                  { label: 'نشط اليوم', value: stats.activeToday, icon: UserCheck, color: 'text-emerald-400' },
                  { label: 'إيميلات اليوم', value: dailyStats.emailCount, icon: Mail, color: 'text-sky-400' },
                  { label: 'تسجيلات اليوم', value: dailyStats.regCount, icon: TrendingUp, color: 'text-violet-400' },
                ].map(card => (
                  <div key={card.label} className={STAT_CARD_CLASS}>
                    <card.icon className={`mx-auto mb-3 w-6 h-6 ${card.color}`} />
                    <p className="text-2xl font-black text-white">{card.value.toLocaleString()}</p>
                    <p className="text-[11px] text-white/30 font-bold mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
                <div className="space-y-4">
                  <div className={CARD_CLASS}>
                    <p className="text-sm font-black text-white/70 mb-4">إجراءات سريعة</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'users', label: 'المستخدمين', emoji: '👥' },
                        { id: 'subs', label: 'الاشتراكات', emoji: '📦' },
                        { id: 'push', label: 'إشعارات', emoji: '🔔' },
                        { id: 'quests', label: 'المهام', emoji: '🏆' },
                      ].map(b => (
                        <button key={b.id} onClick={() => setActiveTab(b.id)} className="px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm font-bold text-white/60 hover:bg-white/[0.08] hover:text-white/90 transition text-right">
                          {b.emoji} {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={CARD_CLASS}>
                    <p className="text-sm font-black text-white/70 mb-3">إعلان عام</p>
                    <textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} rows={3} className={INPUT_CLASS} placeholder="اكتب نص الإعلان..." />
                    <button onClick={handleSetAnnouncement} disabled={isSettingAnnouncement} className={`${BTN_GOLD} mt-3`}>
                      {isSettingAnnouncement ? <Loader2 className="inline-block w-4 h-4 animate-spin" /> : 'نشر الإعلان'}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-5">
                    <p className="text-sm font-black text-red-400/70 mb-2">⚠️ تصفير المتصدرين</p>
                    <p className="text-xs text-white/30 mb-3">إعادة ضبط جميع نقاط المستخدمين إلى الصفر</p>
                    <button onClick={handleResetLeaderboard} disabled={isResetting} className="px-5 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/20 transition">
                      {isResetting ? 'جاري...' : 'تصفير الآن'}
                    </button>
                  </div>
                </div>

                <div className={CARD_CLASS}>
                  <p className="text-sm font-black text-white/70 mb-4">🏅 أفضل المستخدمين</p>
                  <div className="space-y-2">
                    {topUsers.map((user, index) => (
                      <div key={user.uid} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${index === 0 ? 'bg-[#fbbf24]/20 text-[#fbbf24]' : index === 1 ? 'bg-white/10 text-white/50' : 'bg-white/5 text-white/30'}`}>{index + 1}</span>
                          <div>
                            <p className="text-sm font-black text-white/80">{user.displayName || 'مستخدم'}</p>
                            <p className="text-[10px] text-white/30">@{user.username || '---'}</p>
                          </div>
                        </div>
                        <span className="text-sm font-black text-[#fbbf24]">{user.totalPoints || 0}</span>
                      </div>
                    ))}
                    {topUsers.length === 0 && <p className="text-sm text-white/20 text-center py-6">لا يوجد مستخدمين بعد</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== PUSH TAB ========== */}
          {activeTab === 'push' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { icon: Bell, label: 'المشتركين', value: stats.pushSubscribers, note: 'لديهم FCM Token', color: 'text-violet-400' },
                  { icon: Users, label: 'إجمالي المستخدمين', value: stats.totalUsers, note: 'جميع الحسابات', color: 'text-emerald-400' },
                  { icon: TrendingUp, label: 'نسبة الوصول', value: stats.totalUsers > 0 ? `${Math.round((stats.pushSubscribers / stats.totalUsers) * 100)}%` : '0%', note: 'من إجمالي المستخدمين', color: 'text-sky-400' },
                ].map(item => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 text-center">
                    <item.icon className={`mx-auto mb-3 h-7 w-7 ${item.color}`} />
                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">{item.label}</p>
                    <p className={`mt-3 text-3xl font-black ${item.color}`}>{item.value}</p>
                    <p className="text-[11px] text-white/20 mt-1">{item.note}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 md:p-8">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <button onClick={fetchPushHistory} className={BTN_GHOST}>سجل الإشعارات</button>
                  <div className="text-right">
                    <h2 className="text-xl font-black">إرسال إشعار فوري</h2>
                    <p className="text-sm text-white/30 mt-1">ابعت إشعار لجميع المستخدمين أو فئة منهم</p>
                  </div>
                </div>
                <div className="mt-6 space-y-5">
                  <div className="space-y-3 text-right">
                    <label className={LABEL}>قوالب سريعة</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: '📖 تذكير يومي', title: '📖 وقت القرآن', body: 'لم تقرأ القرآن اليوم بعد. ابدأ بسورة واحدة على الأقل 🌙' },
                        { label: '🌿 سورة الكهف', title: '🌿 يوم الجمعة المبارك', body: 'لا تنسَ قراءة سورة الكهف اليوم! من قرأها أضاءت له نور بين الجمعتين 🤍' },
                        { label: '✨ تحديث جديد', title: '✨ تحديث سكينة', body: 'ميزات جديدة رائعة متاحة الآن! اكتشفها الآن 🚀' },
                        { label: '🎯 تحدي', title: '🎯 تحدي اليوم', body: 'اقرأ 10 آيات وافوز بـ 100 نقطة! هل أنت مستعد؟ 💪' },
                      ].map(t => (
                        <button key={t.label} onClick={() => { setPushTitle(t.title); setPushBody(t.body); }} className="rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-white/60 hover:bg-[#fbbf24]/10 hover:text-[#fbbf24] border border-white/5 transition">
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 text-right">
                    <label className={LABEL}>عنوان الإشعار</label>
                    <input value={pushTitle} onChange={e => setPushTitle(e.target.value)} className={INPUT_CLASS} placeholder="مثال: 📖 وقت القرآن" maxLength={60} />
                    <p className="text-xs text-white/20 text-left">{pushTitle.length}/60</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <label className={LABEL}>نص الرسالة</label>
                    <textarea value={pushBody} onChange={e => setPushBody(e.target.value)} rows={4} className={INPUT_CLASS} placeholder="اكتب رسالتك هنا..." maxLength={200} />
                    <p className="text-xs text-white/20 text-left">{pushBody.length}/200</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <label className={LABEL}>الفئة المستهدفة</label>
                    <div className="flex gap-3">
                      {[
                        { id: 'all', label: 'الكل', count: stats.totalUsers },
                        { id: 'subscribers', label: 'المشتركون فقط', count: stats.pushSubscribers },
                        { id: 'free', label: 'المجانيون', count: stats.totalUsers - stats.pushSubscribers },
                      ].map(t => (
                        <button key={t.id} onClick={() => setPushTarget(t.id as any)} className={`flex-1 rounded-xl p-4 text-center font-black text-sm transition border ${pushTarget === t.id ? 'bg-[#fbbf24]/10 border-[#fbbf24]/30 text-[#fbbf24]' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}>
                          <p>{t.label}</p>
                          <p className="text-[11px] mt-1 opacity-60">{t.count} مستخدم</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {(pushTitle || pushBody) && (
                    <div className="rounded-xl border border-violet-500/20 bg-white/[0.03] p-5 text-right">
                      <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-3">معاينة الإشعار</p>
                      <div className="flex items-start gap-3">
                        <img src="/logo/logo.png" className="w-10 h-10 rounded-xl" alt="" />
                        <div>
                          <p className="font-black text-white text-sm">{pushTitle || 'العنوان'}</p>
                          <p className="text-white/40 text-[11px] mt-1 leading-relaxed">{pushBody || 'الرسالة...'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <button onClick={handleSendPushNotification} disabled={isSendingPush || !pushTitle || !pushBody} className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-sky-500 px-5 py-5 text-white font-black text-base transition hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-violet-500/20">
                    {isSendingPush ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري الإرسال...</> : <><Bell className="w-5 h-5" /> إرسال الإشعار الآن</>}
                  </button>
                </div>
              </div>

              {pushHistory.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
                  <h3 className="text-lg font-black mb-5">سجل الإشعارات المُرسلة</h3>
                  <div className="space-y-3">
                    {pushHistory.map(p => (
                      <div key={p.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-start justify-between gap-4">
                        <div className="text-left">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${p.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {p.status === 'pending' ? 'في الانتظار' : 'مُرسل'}
                          </span>
                          <p className="text-[10px] text-white/30 mt-1">{p.target}</p>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="font-black text-sm">{p.title}</p>
                          <p className="text-white/40 text-[11px] mt-1">{p.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== PERFORMANCE TAB ========== */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: 'نشاط اليوم', value: performanceMetrics.dailyActive, color: 'text-emerald-400' },
                  { label: 'متوسط الجلسة', value: `${performanceMetrics.avgSessionMinutes} د`, color: 'text-sky-400' },
                  { label: 'معدل التحويل', value: `${performanceMetrics.conversionRate}%`, color: 'text-violet-400' },
                  { label: 'تنبيهات', value: performanceMetrics.alertCount, color: 'text-rose-400' }
                ].map(card => (
                  <div key={card.label} className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">{card.label}</p>
                    <p className={`mt-4 text-3xl font-black ${card.color}`}>{card.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-xl font-black">لوحة أداء النظام</h2>
                    <p className="text-sm text-white/30">مراقبة سريعة لمعدل الاستخدام والتحويلات.</p>
                  </div>
                  <button onClick={fetchPerformanceMetrics} className={BTN_GHOST}>تحديث</button>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                    <p className="text-sm text-white/30">أهم الفرص لتحسين التحويل</p>
                    <p className="mt-4 text-lg font-black text-white">زيادة الاشتراكات إلى الفرق الرئيسي خلال 7 أيام.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                    <p className="text-sm text-white/30">آخر تنبيه أداء</p>
                    <p className="mt-4 text-lg font-black text-white">جاري تتبع أداء الحملة الترويجية الحالية.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== REPORTS TAB ========== */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'مبيعات اليوم', value: reports.revenueToday, note: 'ج.م' },
                  { label: 'أسبوعياً', value: reports.revenueWeek, note: 'ج.م' },
                  { label: 'شهرياً', value: reports.revenueMonth, note: 'ج.م' }
                ].map(item => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">{item.label}</p>
                    <p className="mt-4 text-3xl font-black text-white">{item.value.toLocaleString()}</p>
                    <p className="text-sm text-white/30">{item.note}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-xl font-black">تقرير المبيعات</h2>
                    <p className="text-sm text-white/30">ملخص الإيرادات والخطة الأكثر طلبًا.</p>
                  </div>
                  <span className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/50">الخطة الأفضل: {reports.topPlan}</span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                    <p className="text-sm text-white/30">مجموع الطلبات</p>
                    <p className="mt-4 text-3xl font-black text-white">{subRequests.length}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
                    <p className="text-sm text-white/30">أعلى خطة</p>
                    <p className="mt-4 text-3xl font-black text-[#fbbf24]">{reports.topPlan || 'لا يوجد'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== ACTIVITY TAB ========== */}
          {activeTab === 'activity' && (
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black">سجل النشاط الإداري</h2>
                  <p className="text-sm text-white/30">تتبع التغييرات والإجراءات في لوحة الإدارة.</p>
                </div>
                <button onClick={fetchActivityLog} className={BTN_GHOST}>تحديث</button>
              </div>
              <div className="mt-6 space-y-3">
                {activityLog.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-white/30">لا يوجد نشاط حديث.</div>
                ) : (
                  activityLog.map(log => (
                    <div key={log.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <p className="font-black">{log.action || 'حدث إداري'}</p>
                      <p className="text-xs text-white/30">{new Date(log.createdAt?.toDate ? log.createdAt.toDate() : log.createdAt || Date.now()).toLocaleString()}</p>
                      <p className="mt-2 text-sm text-white/60">{log.details || 'لا يوجد تفاصيل إضافية.'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========== SUPPORT TAB ========== */}
          {activeTab === 'support' && (
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 overflow-x-auto">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <h2 className="text-xl font-black">طلبات الدعم</h2>
                  <p className="text-sm text-white/30">تابع شكاوى المستخدمين وحلها بسرعة.</p>
                </div>
                <button onClick={fetchSupportTickets} className={BTN_GHOST}>تحديث</button>
              </div>
              <div className="mt-6 min-w-[700px]">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.18em] text-white/30 border-b border-white/10">
                      <th className="p-4">المستخدم</th>
                      <th className="p-4">الموضوع</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {supportTickets.map(ticket => (
                      <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-sm">{ticket.userName || 'مجهول'}</td>
                        <td className="p-4 text-sm">{ticket.subject || 'بدون موضوع'}</td>
                        <td className="p-4 text-sm"><span className="rounded-full bg-white/5 px-3 py-1 text-xs font-black text-white/60">{ticket.status || 'جديد'}</span></td>
                        <td className="p-4 flex flex-wrap gap-2 justify-end">
                          <button onClick={() => handleUpdateTicketStatus(ticket.id, 'in_progress')} className="rounded-xl bg-sky-500 px-3 py-2 text-[11px] font-black text-black">قيد المعالجة</button>
                          <button onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')} className="rounded-xl bg-emerald-500 px-3 py-2 text-[11px] font-black text-black">تم الحل</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========== CAMPAIGNS TAB ========== */}
          {activeTab === 'campaigns' && (
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black">إدارة الحملات</h2>
                  <p className="text-sm text-white/30">تشغيل/إيقاف الحملات الترويجية وتعديل الخصومات.</p>
                </div>
                <button onClick={handleSaveCampaignSettings} className={BTN_GRADIENT}>حفظ الحملة</button>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div className="space-y-3 text-right">
                  <label className={LABEL}>اسم الحملة</label>
                  <input value={campaignSettings.label} onChange={e => setCampaignSettings({ ...campaignSettings, label: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div className="space-y-3 text-right">
                  <label className={LABEL}>رابط الحملة</label>
                  <input value={campaignSettings.link} onChange={e => setCampaignSettings({ ...campaignSettings, link: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div className="space-y-3 text-right">
                  <label className={LABEL}>نسبة الخصم %</label>
                  <input type="number" value={campaignSettings.discountRate} onChange={e => setCampaignSettings({ ...campaignSettings, discountRate: parseInt(e.target.value) })} className={INPUT_CLASS + " text-center"} />
                </div>
                <div className="space-y-3 text-right">
                  <label className={LABEL}>مكافأة الإحالة %</label>
                  <input type="number" value={campaignSettings.referralBonus} onChange={e => setCampaignSettings({ ...campaignSettings, referralBonus: parseInt(e.target.value) })} className={INPUT_CLASS + " text-center"} />
                </div>
                <div className="col-span-full flex items-center gap-3">
                  <label className="inline-flex items-center gap-3 rounded-xl bg-white/[0.02] px-4 py-4 border border-white/10">
                    <input type="checkbox" checked={campaignSettings.active} onChange={e => setCampaignSettings({ ...campaignSettings, active: e.target.checked })} className="h-4 w-4 accent-[#fbbf24]" />
                    <span className="text-sm text-white/60">الحملة مفعلة</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ========== ALERTS TAB ========== */}
          {activeTab === 'alerts' && (
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black">تنبيهات النظام</h2>
                  <p className="text-sm text-white/30">معاينة التنبيهات وتقارير التحذير.</p>
                </div>
                <button onClick={fetchAlerts} className={BTN_GHOST}>تحديث</button>
              </div>
              <div className="mt-6 space-y-4">
                {alerts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-white/30">لا توجد تنبيهات حالياً.</div>
                ) : (
                  alerts.map((alert, index) => (
                    <div key={index} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-black">{alert.title || 'تنبيه نظام'}</p>
                          <p className="text-xs text-white/30 mt-1">{new Date(alert.createdAt?.toDate ? alert.createdAt.toDate() : alert.createdAt || Date.now()).toLocaleString()}</p>
                        </div>
                        <button onClick={() => handleAcknowledgeAlert(index)} className="rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-black text-black">تمت القراءة</button>
                      </div>
                      <p className="mt-4 text-sm text-white/60">{alert.message || 'لا توجد رسالة.'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========== CONTENT TAB ========== */}
          {activeTab === 'content' && (
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black">إدارة المحتوى</h2>
                  <p className="text-sm text-white/30">تحكم في المحتوى المميز داخل التطبيق.</p>
                </div>
                <button onClick={handleSaveContentSettings} className={BTN_GRADIENT}>حفظ المحتوى</button>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <div className="space-y-3 text-right">
                  <label className={LABEL}>السورة المميزة</label>
                  <input value={contentSettings.featuredSurah} onChange={e => setContentSettings({ ...contentSettings, featuredSurah: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div className="space-y-3 text-right">
                  <label className={LABEL}>النص المميز</label>
                  <input value={contentSettings.featuredText} onChange={e => setContentSettings({ ...contentSettings, featuredText: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div className="space-y-3 text-right">
                  <label className={LABEL}>عنوان الأخبار</label>
                  <input value={contentSettings.newsHeadline} onChange={e => setContentSettings({ ...contentSettings, newsHeadline: e.target.value })} className={INPUT_CLASS} />
                </div>
              </div>
            </div>
          )}

          {/* ========== FLAGS TAB ========== */}
          {activeTab === 'flags' && (
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black">إعدادات التجارب</h2>
                  <p className="text-sm text-white/30">تفعيل أو تعطيل خصائص جديدة.</p>
                </div>
                <button onClick={handleSaveFeatureFlags} className={BTN_GRADIENT}>حفظ التجارب</button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {Object.entries(featureFlags).map(([key, value]) => (
                  <label key={key} className="inline-flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/60">
                    <span className="font-black uppercase tracking-[0.12em]">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <input type="checkbox" checked={Boolean(value)} onChange={e => setFeatureFlags({ ...featureFlags, [key]: e.target.checked })} className="h-4 w-4 accent-[#fbbf24]" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ========== VERSIONS TAB ========== */}
          {activeTab === 'versions' && (
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black">إدارة الإصدارات</h2>
                  <p className="text-sm text-white/30">سجل الإصدار الأخير وأرسل إشعار تحديث.</p>
                </div>
                <button onClick={handleSaveVersionSettings} disabled={isSavingVersion} className={BTN_GRADIENT}>{isSavingVersion ? 'حفظ...' : 'نشر التحديث'}</button>
              </div>
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div className="space-y-3 text-right">
                  <label className={LABEL}>رقم الإصدار</label>
                  <input value={versionSettings.version} onChange={e => setVersionSettings({ ...versionSettings, version: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div className="space-y-3 text-right">
                  <label className={LABEL}>رابط التحميل</label>
                  <input value={versionSettings.downloadUrl} onChange={e => setVersionSettings({ ...versionSettings, downloadUrl: e.target.value })} className={INPUT_CLASS} />
                </div>
                <div className="space-y-3 text-right lg:col-span-2">
                  <label className={LABEL}>ملاحظات التحديث</label>
                  <textarea value={versionSettings.releaseNotes} onChange={e => setVersionSettings({ ...versionSettings, releaseNotes: e.target.value })} rows={5} className={INPUT_CLASS} placeholder="اكتب ملاحظات الإصدار هنا" />
                </div>
                <label className="inline-flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/60">
                  <span className="font-black uppercase tracking-[0.12em]">تحديث إجباري</span>
                  <input type="checkbox" checked={versionSettings.mandatoryUpdate} onChange={e => setVersionSettings({ ...versionSettings, mandatoryUpdate: e.target.checked })} className="h-4 w-4 accent-[#fbbf24]" />
                </label>
                <label className="inline-flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/60">
                  <span className="font-black uppercase tracking-[0.12em]">عرض على صفحة التحميل</span>
                  <input type="checkbox" checked={versionSettings.displayOnDownloadPage} onChange={e => setVersionSettings({ ...versionSettings, displayOnDownloadPage: e.target.checked })} className="h-4 w-4 accent-[#fbbf24]" />
                </label>
              </div>
              {versionHistory.length > 0 && (
                <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-6">
                  <h3 className="text-lg font-black mb-4">سجل الإصدارات</h3>
                  <div className="space-y-3">
                    {versionHistory.map((item, index) => (
                      <div key={`${item.version}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-black">{item.version}</p>
                          <span className="text-[11px] text-white/40">{item.mandatoryUpdate ? 'إجباري' : 'اختياري'}</span>
                        </div>
                        <p className="text-sm text-white/40 mt-3">{item.releaseNotes}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== SHOWCASE TAB ========== */}
          {activeTab === 'showcase' && (
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <h2 className="text-xl font-black">معرض المجتمع</h2>
                  <p className="text-sm text-white/30">تحكم في محتوى العرض، أضف أو احذف العناصر.</p>
                </div>
                <button onClick={fetchShowcaseItems} className={BTN_GHOST}>تحديث</button>
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {showcaseItems.length === 0 ? (
                  <div className="col-span-full rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-16 text-center text-white/30">لا يوجد عناصر في المعرض.</div>
                ) : (
                  showcaseItems.map(item => (
                    <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                      <div className="aspect-video bg-black/50 p-4 flex items-center justify-center">
                        <a href={item.videoUrl} target="_blank" rel="noreferrer" className="text-[#fbbf24] font-black hover:underline">{item.surahName}</a>
                      </div>
                      <div className="p-5 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-black">{item.userName}</p>
                          <p className="text-xs text-white/30">{item.surahName}</p>
                        </div>
                        <button onClick={() => handleDeleteShowcaseItem(item.id)} className="rounded-xl bg-red-500/10 px-3 py-2 text-red-400 transition hover:bg-red-500/20">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========== SETTINGS TAB ========== */}
          {activeTab === 'settings' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Payment Settings */}
              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <h2 className="text-xl font-black">إعدادات الدفع</h2>
                  <Phone className="h-6 w-6 text-[#fbbf24]" />
                </div>
                <div className="mt-6 grid gap-5">
                  <div className="space-y-2 text-right">
                    <label className={LABEL}>رقم فودافون كاش</label>
                    <input value={paymentSettings.vodafoneCash} onChange={e => setPaymentSettings({ ...paymentSettings, vodafoneCash: e.target.value })} className={INPUT_CLASS} placeholder="010XXXXXXXX" />
                  </div>
                  <div className="space-y-2 text-right">
                    <label className={LABEL}>يوزر إنستا باي</label>
                    <input value={paymentSettings.instapay} onChange={e => setPaymentSettings({ ...paymentSettings, instapay: e.target.value })} className={INPUT_CLASS} placeholder="username@instapay" />
                  </div>
                </div>
              </div>
              {/* Pricing */}
              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <h2 className="text-xl font-black">إدارة الأسعار</h2>
                  <Trophy className="h-6 w-6 text-[#fbbf24]" />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="space-y-2 text-right">
                    <label className={LABEL}>خطة الهواة</label>
                    <input type="number" value={paymentSettings.priceStarter} onChange={e => setPaymentSettings({ ...paymentSettings, priceStarter: parseInt(e.target.value) })} className={INPUT_CLASS + " text-center"} />
                  </div>
                  <div className="space-y-2 text-right">
                    <label className={LABEL}>ادعم المشروع</label>
                    <input type="number" value={paymentSettings.priceSupporter} onChange={e => setPaymentSettings({ ...paymentSettings, priceSupporter: parseInt(e.target.value) })} className={INPUT_CLASS + " text-center"} />
                  </div>
                  <div className="space-y-2 text-right">
                    <label className={LABEL}>البريميوم</label>
                    <input type="number" value={paymentSettings.pricePremium} onChange={e => setPaymentSettings({ ...paymentSettings, pricePremium: parseInt(e.target.value) })} className={INPUT_CLASS + " text-center"} />
                  </div>
                </div>
                <button onClick={handleSavePaymentSettings} disabled={isSavingSettings} className="mt-8 w-full rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 px-5 py-4 text-black font-black transition hover:shadow-xl hover:shadow-sky-500/20">
                  {isSavingSettings ? <Loader2 className="inline-block h-5 w-5 animate-spin" /> : 'حفظ الإعدادات'}
                </button>
              </div>
              {/* Maintenance Mode */}
              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <h2 className="text-xl font-black">وضع الصيانة</h2>
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                </div>
                <div className="mt-6 grid gap-5">
                  <label className="inline-flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/60">
                    <span className="font-black">تفعيل وضع الصيانة</span>
                    <input type="checkbox" checked={maintenanceMode.enabled} onChange={e => setMaintenanceMode({ ...maintenanceMode, enabled: e.target.checked })} className="h-5 w-5 accent-amber-500" />
                  </label>
                  <div className="space-y-2 text-right">
                    <label className={LABEL}>سبب الصيانة</label>
                    <input value={maintenanceMode.reason} onChange={e => setMaintenanceMode({ ...maintenanceMode, reason: e.target.value })} className={INPUT_CLASS} placeholder="مثال: تحديث قاعدة البيانات" />
                  </div>
                  <div className="space-y-2 text-right">
                    <label className={LABEL}>رسالة للمستخدمين</label>
                    <textarea value={maintenanceMode.message} onChange={e => setMaintenanceMode({ ...maintenanceMode, message: e.target.value })} rows={3} className={INPUT_CLASS} placeholder="نعمل على تحسين التطبيق..." />
                  </div>
                  <div className="space-y-2 text-right">
                    <label className={LABEL}>المدة المتوقعة</label>
                    <input value={maintenanceMode.duration} onChange={e => setMaintenanceMode({ ...maintenanceMode, duration: e.target.value })} className={INPUT_CLASS} placeholder="مثال: ساعتين" />
                  </div>
                  <button onClick={handleSaveMaintenance} className="mt-2 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-4 text-black font-black transition hover:shadow-xl hover:shadow-amber-500/20">
                    حفظ وضع الصيانة
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========== SUBS TAB ========== */}
          {activeTab === 'subs' && (
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 overflow-x-auto">
              <h2 className="text-xl font-black mb-6">طلبات الاشتراك</h2>
              <div className="min-w-[700px]">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.18em] text-white/30 border-b border-white/10">
                      <th className="p-5">المستخدم</th>
                      <th className="p-5">الخطة</th>
                      <th className="p-5">المبلغ</th>
                      <th className="p-5">الرابط</th>
                      <th className="p-5">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {subRequests.map(r => (
                      <tr key={r.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-5">
                          <div className="space-y-1 text-right">
                            <p className="font-black">{r.userName}</p>
                            <p className="text-xs text-white/30">{r.senderInfo}</p>
                          </div>
                        </td>
                        <td className="p-5"><span className="inline-flex rounded-full bg-[#fbbf24]/10 px-3 py-1 text-[11px] font-black text-[#fbbf24]">{r.plan}</span></td>
                        <td className="p-5 font-black text-emerald-400">{r.amount || '---'} ج.م</td>
                        <td className="p-5">{r.platformLink ? <a href={r.platformLink} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">فتح</a> : '---'}</td>
                        <td className="p-5">
                          <div className="flex flex-wrap gap-2 justify-end">
                            {r.status === 'pending' ? (
                              <button onClick={() => handleActionSubscription(r.id, r.userId, r.plan, 'approve')} className="rounded-xl bg-emerald-500 px-4 py-2 text-[11px] font-black text-black transition hover:opacity-90">تفعيل</button>
                            ) : (
                              <button onClick={() => handleAddToShowcase(r.platformLink, r.userName, r.surahName || 'سورة')} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black text-white/60 transition hover:bg-white/10">إضافة معرض</button>
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

          {/* ========== QUESTS TAB ========== */}
          {activeTab === 'quests' && (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
                <h2 className="text-xl font-black mb-6">إنشاء مهمة جديدة</h2>
                <form onSubmit={handleAddQuest} className="space-y-5">
                  <input value={questTitle} onChange={e => setQuestTitle(e.target.value)} className={INPUT_CLASS} placeholder="عنوان المهمة" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className={LABEL}>نوع المهمة</label>
                      <select value={questTarget} onChange={e => setQuestTarget(e.target.value)} className={INPUT_CLASS}>
                        <option value="mushaf">📖 قراءة (الآية اليومية)</option>
                        <option value="mushaf-full">📱 المصحف الرقمي الكامل</option>
                        <option value="daily">📿 الأذكار والورد اليومي</option>
                        <option value="video">🎬 استوديو تصميم الفيديو</option>
                        <option value="surah">🎧 استماع لسورة معينة</option>
                        <option value="rank">🏆 لوحة المتصدرين</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL}>النقاط</label>
                      <input type="number" value={questPoints} onChange={e => setQuestPoints(parseInt(e.target.value))} className={INPUT_CLASS + " text-center"} />
                    </div>
                  </div>
                  {questTarget === 'surah' && (
                    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <label className={LABEL}>رقم السورة</label>
                      <div className="flex gap-3">
                        <input type="number" min="1" max="114" value={questSurahId} onChange={e => setQuestSurahId(e.target.value)} className="w-28 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center outline-none text-sm text-white" />
                        <div className="flex-1 rounded-xl bg-white/[0.02] p-4">
                          <span className="text-sm text-white/40">{surahsData.find(s => s.id === parseInt(questSurahId))?.name ? `سورة ${surahsData.find(s => s.id === parseInt(questSurahId))?.name}` : 'رقم غير صحيح'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <button type="submit" disabled={isAddingQuest} className={BTN_GRADIENT}>
                    {isAddingQuest ? <Loader2 className="inline-block h-5 w-5 animate-spin" /> : 'نشر المهمة'}
                  </button>
                </form>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
                <h2 className="text-xl font-black mb-6">المهام الحالية</h2>
                <div className="space-y-4">
                  {activeQuests.map(q => (
                    <div key={q.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div>
                        <p className="font-black">{q.title}</p>
                        <p className="text-xs text-white/30">{q.target}</p>
                      </div>
                      <button onClick={() => handleDeleteQuest(q.id)} className="rounded-xl border border-red-500/20 px-4 py-2 text-red-400 transition hover:bg-red-500/10">حذف</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========== USERS TAB ========== */}
          {activeTab === 'users' && (
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 overflow-x-auto">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">قائمة المستخدمين</h2>
                  <p className="text-sm text-white/30">ابحث وتابع حالة المستخدمين.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {usersLimit < Infinity && totalUserCount > users.length && (
                    <button onClick={loadAllUsers} className="rounded-xl bg-white/5 px-4 py-3 text-sm font-black text-white/60 hover:bg-white/10 transition">
                      تحميل الكل ({totalUserCount})
                    </button>
                  )}
                  <button onClick={() => setShowBannedOnly(prev => !prev)} className={`rounded-xl px-4 py-3 text-sm font-black transition ${showBannedOnly ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
                    {showBannedOnly ? `عرض الكل` : `المحظورين (${blockedUsers.length})`}
                  </button>
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-right outline-none text-sm text-white placeholder:text-white/20 w-48" placeholder="ابحث عن مستخدم..." />
                </div>
              </div>
              <div className="mt-6 min-w-[900px]">
                <table className="w-full text-right">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.18em] text-white/30 border-b border-white/10">
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
                            <p className="text-xs text-white/30">@{u.username || '---'}</p>
                          </div>
                        </td>
                        <td className="p-5 text-xs text-white/40">{u.phoneNumber || '---'}</td>
                        <td className="p-5 text-xs text-white/40">{u.governorate || '---'}</td>
                        <td className="p-5"><span className="inline-flex items-center gap-2 rounded-full bg-[#fbbf24]/10 px-3 py-2 text-sm font-black text-[#fbbf24]">{u.totalPoints || 0}</span></td>
                        <td className="p-5">
                          <span className={`inline-flex rounded-full px-3 py-2 text-[11px] font-black ${u.subscriptionActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-white/40'}`}>{u.subscriptionType || u.plan || 'free'}</span>
                        </td>
                        <td className="p-5 text-xs text-white/40">{u.subscriptionExpiry ? new Date(u.subscriptionExpiry?.toDate ? u.subscriptionExpiry.toDate() : u.subscriptionExpiry).toLocaleDateString() : '---'}</td>
                        <td className="p-5 space-y-2 text-right">
                          <div className="flex flex-wrap gap-2 justify-end">
                            <button onClick={() => handleBanUser(u.uid, u.isBanned)} className={`rounded-xl px-4 py-2 text-[11px] font-black transition ${u.isBanned ? 'bg-emerald-500 text-black' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}>
                              {u.isBanned ? <><CheckCircle className="inline h-4 w-4" /> فك الحظر</> : <><Ban className="inline h-4 w-4" /> حظر</>}
                            </button>
                            {u.subscriptionActive ? (
                              <button onClick={() => handleCancelSubscription(u.uid)} disabled={isUpdatingSubscription} className="rounded-xl bg-white/5 px-4 py-2 text-[11px] font-black text-white/60 transition hover:bg-white/10">إلغاء</button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <select value={userPlanSelection[u.uid] || 'starter'} onChange={e => setUserPlanSelection({ ...userPlanSelection, [u.uid]: e.target.value })} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs outline-none text-right text-white">
                                  <option value="starter">starter</option>
                                  <option value="supporter">supporter</option>
                                  <option value="premium">premium</option>
                                </select>
                                <button onClick={() => handleAssignSubscription(u.uid, userPlanSelection[u.uid] || 'starter')} disabled={isUpdatingSubscription} className="rounded-xl bg-sky-500 px-4 py-2 text-[11px] font-black text-black transition hover:opacity-90">تعيين</button>
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
    </div>
  );
}
