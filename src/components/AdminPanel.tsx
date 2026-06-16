"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { LayoutDashboard, BellRing, Activity, UserCircle, CreditCard, Swords, Settings, GalleryHorizontalEnd, BarChart3, History, HeadphonesIcon, Megaphone, AlertCircle, BookOpen, FlaskConical, Package, ShieldCheck, Loader2, X, MenuIcon, Users, UserCheck, Mail, TrendingUp, RefreshCw, Bell, Trophy, Ban, CheckCircle, Phone, AlertTriangle, Trash2, Copy, KeyRound, MessageSquare, Sparkles } from "lucide-react";
import surahsData from "@/data/surahs.json";
import { auth, db, initFirebase } from "@/lib/firebase";
import {
  collection, getDocs, doc, getDoc, updateDoc, writeBatch,
  query, orderBy, addDoc, serverTimestamp, deleteDoc, setDoc, deleteField
} from "firebase/firestore";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { checkAndAwardBadges } from "@/lib/badges";

const ADMIN_EMAIL = "youssefosama@gmail.com";

const NAV_ITEMS = [
  { id: 'stats', label: 'الإحصائيات', icon: LayoutDashboard },
  { id: 'push', label: 'الإشعارات', icon: BellRing },
  { id: 'performance', label: 'الأداء', icon: Activity },
  { id: 'users', label: 'المستخدمين', icon: UserCircle },
  { id: 'subs', label: 'الاشتراكات', icon: CreditCard },
  { id: 'chatbot', label: 'تحليلات الشات بوت', icon: MessageSquare },
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
  { id: 'analytics', label: 'التحليلات المتقدمة', icon: BarChart3 },
  { id: 'moderation', label: 'رقابة المنشورات', icon: AlertTriangle },
];

interface DailyStats {
  emailCount: number;
  regCount: number;
  forgotCount: number;
  totalEmails: number;
  totalUniqueEmails: number;
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
  const [dailyStats, setDailyStats] = useState<DailyStats>({ emailCount: 0, regCount: 0, forgotCount: 0, totalEmails: 0, totalUniqueEmails: 0 });
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
  const [newAlertTitle, setNewAlertTitle] = useState("");
  const [newAlertMessage, setNewAlertMessage] = useState("");
  const [newAlertDuration, setNewAlertDuration] = useState(24);
  const [isAddingAlert, setIsAddingAlert] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [subRequests, setSubRequests] = useState<any[]>([]);
  const [isSubsLoading, setIsSubsLoading] = useState(false);
  const [subsFilter, setSubsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

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
    version: "v22",
    releaseNotes: "تحسين استقرار التطبيق، تحديث واجهة المستخدم، وإضافة دعم الدفع الجديد.",
    downloadUrl: "https://yaqeen-app.vercel.app/download",
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
  const [chatbotLogs, setChatbotLogs] = useState<any[]>([]);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);
  const [selectedUserChat, setSelectedUserChat] = useState<any[] | null>(null);
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingCampaigns, setIsSavingCampaigns] = useState(false);
  const [isSavingFlags, setIsSavingFlags] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);
  const [userPlanSelection, setUserPlanSelection] = useState<Record<string, string>>({});
  const [showBannedOnly, setShowBannedOnly] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("stats");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushTarget, setPushTarget] = useState<"all" | "subscribers" | "free">("all");
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushHistory, setPushHistory] = useState<any[]>([]);

  // Moderation state
  const [reportedPosts, setReportedPosts] = useState<any[]>([]);
  const [isModerationLoading, setIsModerationLoading] = useState(false);
  const [moderatingComments, setModeratingComments] = useState<any[]>([]);
  const [moderatingPostId, setModeratingPostId] = useState<string | null>(null);
  const [moderationFilter, setModerationFilter] = useState<'all' | 'reported' | 'blocked'>('all');

  // Lazy loading: track which tabs have been visited
  const visitedTabsRef = useRef<Set<string>>(new Set(['stats']));
  const [tabLoading, setTabLoading] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const init = async () => {
      await initFirebase();
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
    };
    init();
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
      chatbot: async () => { await fetchChatbotLogs(); },
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
      analytics: async () => { await fetchAnalyticsData(); },
      moderation: async () => { await fetchReportedPosts(); },
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
      const todayEmails = emailSnap.docs.filter(d => d.data().date === today);
      const emailCount = todayEmails.length;
      
      const forgotCount = todayEmails.filter(d => d.data().type === "reset").length;
      const regCount = todayEmails.filter(d => d.data().type === "signup" || !d.data().type).length;
      
      const totalEmails = emailSnap.size;
      const uniqueEmails = new Set(emailSnap.docs.map(d => d.data().email)).size;

      setDailyStats({ emailCount, regCount, forgotCount, totalEmails, totalUniqueEmails: uniqueEmails });
    } catch (e) { console.error(e); }
  };

  const fetchAnalyticsData = async () => {
    if (!db) return;
    setIsAnalyticsLoading(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
      
      const [usersSnap, emailLogsSnap, chatbotLogsSnap, subsSnap, ticketsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "emailLogs")),
        getDocs(collection(db, "chatbot_logs")),
        getDocs(collection(db, "subscription_requests")),
        getDocs(collection(db, "support_tickets"))
      ]);

      const usersList = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() as any }));
      const emailLogsList = emailLogsSnap.docs.map(d => d.data() as any);
      const chatbotLogsList = chatbotLogsSnap.docs.map(d => d.data() as any);
      const subsList = subsSnap.docs.map(d => d.data() as any);
      const ticketsList = ticketsSnap.docs.map(d => d.data() as any);

      // --- 1. KPI Calculations ---
      const totalUsers = usersList.length;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const activeToday = usersList.filter(u => {
        if (!u.lastActive) return false;
        const lastActiveStr = typeof u.lastActive === 'string' ? u.lastActive : (u.lastActive.toDate ? u.lastActive.toDate().toISOString() : String(u.lastActive));
        return lastActiveStr.startsWith(todayStr);
      }).length;

      const totalPoints = usersList.reduce((acc, curr) => acc + (curr.totalPoints || 0), 0);
      const chatbotMessagesCount = chatbotLogsList.length;
      const premiumOrStarterCount = usersList.filter(u => u.plan && u.plan !== 'free').length;
      const conversionRate = totalUsers > 0 ? ((premiumOrStarterCount / totalUsers) * 100).toFixed(1) : "0.0";
      const pendingSubscriptions = subsList.filter(s => s.status === 'pending').length;
      const openSupportTickets = ticketsList.filter(t => t.status !== 'resolved' && t.status !== 'closed').length;

      // --- 2. User Growth & Plan Distribution & Governorates ---
      const signupsByDay: Record<string, number> = {};
      for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        signupsByDay[dStr] = 0;
      }
      
      emailLogsList.forEach(log => {
        if (log.type === "signup" || !log.type) {
          const logDate = log.date || (log.createdAt?.toDate ? log.createdAt.toDate().toISOString().split('T')[0] : '');
          if (logDate && signupsByDay[logDate] !== undefined) {
            signupsByDay[logDate]++;
          }
        }
      });

      const plansDistribution = { free: 0, starter: 0, premium: 0, supporter: 0 };
      usersList.forEach(u => {
        const p = u.plan || 'free';
        if (p in plansDistribution) {
          plansDistribution[p as keyof typeof plansDistribution]++;
        } else {
          plansDistribution.free++;
        }
      });

      const govCounts: Record<string, number> = {};
      usersList.forEach(u => {
        if (u.governorate) {
          govCounts[u.governorate] = (govCounts[u.governorate] || 0) + 1;
        }
      });
      const sortedGovs = Object.entries(govCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      const now = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
      
      const thisWeekUsers = usersList.filter(u => {
        const date = u.createdAt?.toDate ? u.createdAt.toDate().getTime() : (typeof u.createdAt === 'string' ? new Date(u.createdAt).getTime() : 0);
        return (now - date) <= oneWeekMs;
      }).length;
      
      const lastWeekUsers = usersList.filter(u => {
        const date = u.createdAt?.toDate ? u.createdAt.toDate().getTime() : (typeof u.createdAt === 'string' ? new Date(u.createdAt).getTime() : 0);
        const diff = now - date;
        return diff > oneWeekMs && diff <= twoWeeksMs;
      }).length;

      const growthRate = lastWeekUsers > 0 ? (((thisWeekUsers - lastWeekUsers) / lastWeekUsers) * 100).toFixed(1) : "100.0";

      // --- 3. Chatbot Deep Analytics ---
      let politeCount = 0;
      let insultCount = 0;
      chatbotLogsList.forEach(log => {
        if (log.sender === "user") {
          if (log.isInsult) insultCount++;
          else if (log.sentiment === "positive") politeCount++;
        }
      });

      const chatbotMsgsByDay: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        chatbotMsgsByDay[dStr] = 0;
      }

      chatbotLogsList.forEach(log => {
        if (log.timestamp) {
          const dStr = log.timestamp.toDate 
            ? log.timestamp.toDate().toISOString().split('T')[0]
            : new Date(log.timestamp).toISOString().split('T')[0];
          if (chatbotMsgsByDay[dStr] !== undefined) {
            chatbotMsgsByDay[dStr]++;
          }
        }
      });

      const timeOfDayActivity = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
      chatbotLogsList.forEach(log => {
        if (log.timestamp) {
          const date = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
          const hour = date.getHours();
          if (hour >= 5 && hour < 12) timeOfDayActivity.Morning++;
          else if (hour >= 12 && hour < 17) timeOfDayActivity.Afternoon++;
          else if (hour >= 17 && hour < 22) timeOfDayActivity.Evening++;
          else timeOfDayActivity.Night++;
        }
      });

      // --- 4. Sales & Revenue ---
      let revenueToday = 0;
      let revenueWeek = 0;
      let revenueMonth = 0;
      
      const subsStatusCounts = { pending: 0, approved: 0, rejected: 0 };
      const approvedSubs = subsList.filter(s => {
        const status = s.status || 'pending';
        if (status in subsStatusCounts) subsStatusCounts[status as keyof typeof subsStatusCounts]++;
        return status === 'approved';
      });

      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
      const monthStart = new Date(); monthStart.setDate(monthStart.getDate() - 30);

      approvedSubs.forEach(s => {
        const date = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt || 0);
        const amount = Number(s.amount) || 0;
        if (date >= todayStart) revenueToday += amount;
        if (date >= weekStart) revenueWeek += amount;
        if (date >= monthStart) revenueMonth += amount;
      });

      const lastSubscriptions = approvedSubs
        .sort((a,b) => {
          const da = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const db = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return db - da;
        })
        .slice(0, 5)
        .map(s => ({
          plan: s.plan,
          amount: s.amount,
          date: s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString('ar-EG') : new Date(s.createdAt || 0).toLocaleDateString('ar-EG'),
          userId: s.userId
        }));

      // --- 5. Emails Analytics ---
      const totalEmails = emailLogsList.length;
      const uniqueEmailsCount = new Set(emailLogsList.map(l => l.email)).size;
      const resetCount = emailLogsList.filter(l => l.type === 'reset').length;
      const signupCount = emailLogsList.filter(l => l.type === 'signup' || !l.type).length;

      // --- 6. System Health & Notifications ---
      const pushSubscribers = usersList.filter(u => u.fcmToken).length;
      const pushPercentage = totalUsers > 0 ? ((pushSubscribers / totalUsers) * 100).toFixed(1) : "0.0";
      const missingFcmTokenCount = usersList.filter(u => !u.fcmToken).length;

      setAnalyticsData({
        kpis: {
          totalUsers,
          activeToday,
          totalPoints,
          chatbotMessagesCount,
          premiumOrStarterCount,
          conversionRate,
          pendingSubscriptions,
          openSupportTickets
        },
        userGrowth: {
          signupsByDay: Object.entries(signupsByDay).reverse().map(([date, count]) => ({ date, count })),
          plansDistribution,
          sortedGovs,
          growthRate,
          thisWeekUsers,
          lastWeekUsers
        },
        chatbot: {
          politeCount,
          insultCount,
          chatbotMsgsByDay: Object.entries(chatbotMsgsByDay).reverse().map(([date, count]) => ({ date, count })),
          timeOfDayActivity
        },
        sales: {
          revenueToday,
          revenueWeek,
          revenueMonth,
          subsStatusCounts,
          lastSubscriptions
        },
        emails: {
          totalEmails,
          uniqueEmailsCount,
          resetCount,
          signupCount
        },
        health: {
          pushSubscribers,
          pushPercentage,
          missingFcmTokenCount
        }
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      alert("حدث خطأ أثناء تحميل التحليلات.");
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const fetchChatbotLogs = async () => {
    if (!db) return;
    setIsChatbotLoading(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
      const q = query(collection(db, "chatbot_logs"), orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setChatbotLogs(logs);
    } catch (e) {
      console.error("Failed to fetch chatbot logs:", e);
    } finally {
      setIsChatbotLoading(false);
    }
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
    setIsSavingMaintenance(true);
    try {
      await setDoc(doc(db, "admin", "config"), { maintenance: maintenanceMode }, { merge: true });
      alert("✅ تم حفظ وضع الصيانة بنجاح!");
    } catch (e) {
      console.error(e);
      alert("فشل الحفظ: يرجى التحقق من الاتصال بالإنترنت أو إيقاف مانع الإعلانات.");
    } finally {
      setIsSavingMaintenance(false);
    }
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
        setVersionSettings({ version: d.version || "v22", releaseNotes: d.releaseNotes || "", downloadUrl: d.downloadUrl || "", mandatoryUpdate: d.mandatoryUpdate || false, displayOnDownloadPage: d.displayOnDownloadPage || false });
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

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !newAlertTitle.trim() || !newAlertMessage.trim()) {
      alert("يرجى ملء جميع الحقول");
      return;
    }
    setIsAddingAlert(true);
    try {
      const newAlertItem = {
        id: Date.now().toString(),
        title: newAlertTitle.trim(),
        message: newAlertMessage.trim(),
        createdAt: new Date().toISOString(),
        active: true,
        acknowledged: false,
        durationHours: Number(newAlertDuration) || 24,
      };
      
      const updatedAlerts = [newAlertItem, ...alerts];
      await setDoc(doc(db, "settings", "alerts"), { items: updatedAlerts }, { merge: true });
      setAlerts(updatedAlerts);
      setNewAlertTitle("");
      setNewAlertMessage("");
      alert("✅ تم نشر التنبيه بنجاح!");
    } catch (e) {
      console.error(e);
      alert("فشل نشر التنبيه: يرجى التحقق من الاتصال أو إيقاف مانع الإعلانات.");
    } finally {
      setIsAddingAlert(false);
    }
  };

  const handleToggleAlertActive = async (index: number, newActive: boolean) => {
    if (!db) return;
    const updatedAlerts = [...alerts];
    updatedAlerts[index] = { 
      ...updatedAlerts[index], 
      active: newActive,
      ...(newActive ? { createdAt: new Date().toISOString(), acknowledged: false } : {})
    };
    
    setAlerts(updatedAlerts);
    try {
      await setDoc(doc(db, "settings", "alerts"), { items: updatedAlerts }, { merge: true });
      alert(newActive ? "✅ تم تجديد التنبيه للعمل مجدداً!" : "تم إيقاف التنبيه.");
    } catch (e) {
      console.error(e);
      alert("فشل تعديل حالة التنبيه");
    }
  };

  const handleDeleteAlert = async (index: number) => {
    if (!db || !window.confirm("هل أنت متأكد من حذف هذا التنبيه نهائياً؟")) return;
    const updatedAlerts = alerts.filter((_, idx) => idx !== index);
    setAlerts(updatedAlerts);
    try {
      await setDoc(doc(db, "settings", "alerts"), { items: updatedAlerts }, { merge: true });
      alert("✅ تم حذف التنبيه بنجاح.");
    } catch (e) {
      console.error(e);
      alert("فشل حذف التنبيه");
    }
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

  const fetchReportedPosts = async () => {
    if (!db) return;
    setIsModerationLoading(true);
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setReportedPosts(list);
    } catch (e) {
      console.error("Error fetching reported posts:", e);
    } finally {
      setIsModerationLoading(false);
    }
  };

  const handleAdminDeletePost = async (postId: string) => {
    if (!db || !window.confirm("هل أنت متأكد من حذف هذا المنشور نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
      setReportedPosts(prev => prev.filter(p => p.id !== postId));
      alert("✅ تم حذف المنشور بنجاح.");
    } catch (e) {
      console.error(e);
      alert("فشل الحذف");
    }
  };

  const handleAdminDismissReports = async (postId: string) => {
    if (!db || !window.confirm("تأكيد رفض البلاغات والإبقاء على المنشور؟")) return;
    try {
      const { deleteField } = await import("firebase/firestore");
      await updateDoc(doc(db, "posts", postId), {
        reportsCount: 0,
        reports: deleteField(),
        isBlocked: false
      });
      setReportedPosts(prev => prev.filter(p => p.id !== postId));
      alert("✅ تم رفض البلاغات وتثبيت المنشور.");
    } catch (e) {
      console.error(e);
      alert("فشل العملية");
    }
  };

  const handleAdminToggleBlockPost = async (postId: string, isCurrentlyBlocked: boolean) => {
    if (!db || !window.confirm(isCurrentlyBlocked ? "تأكيد فك حظر المنشور وعرضه للمستخدمين؟" : "تأكيد حظر المنشور وحجبه عن المستخدمين؟")) return;
    try {
      await updateDoc(doc(db, "posts", postId), {
        isBlocked: !isCurrentlyBlocked
      });
      setReportedPosts(prev => prev.map(p => p.id === postId ? { ...p, isBlocked: !isCurrentlyBlocked } : p));
      alert(!isCurrentlyBlocked ? "🚫 تم حظر المنشور بنجاح." : "✅ تم إلغاء حظر المنشور.");
    } catch (e) {
      console.error(e);
      alert("فشل العملية");
    }
  };

  const handleLoadCommentsForModeration = async (postId: string) => {
    if (!db) return;
    setModeratingPostId(postId);
    try {
      const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setModeratingComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminDeleteComment = async (postId: string, commentId: string) => {
    if (!db || !window.confirm("هل أنت متأكد من حذف هذا التعليق؟")) return;
    try {
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));
      await updateDoc(doc(db, "posts", postId), {
        commentsCount: increment(-1)
      });
      setModeratingComments(prev => prev.filter(c => c.id !== commentId));
      alert("✅ تم حذف التعليق.");
    } catch (e) {
      console.error(e);
      alert("فشل حذف التعليق");
    }
  };

  const handleAdminApproveComment = async (postId: string, commentId: string) => {
    if (!db || !window.confirm("تأكيد اعتماد وعرض التعليق للعامة؟")) return;
    try {
      const comment = moderatingComments.find(c => c.id === commentId);
      const commentAuthorId = comment?.userId;

      await updateDoc(doc(db, "posts", postId, "comments", commentId), {
        isBlocked: false,
        autoFlagged: false
      });

      if (commentAuthorId) {
        await updateDoc(doc(db, "users", commentAuthorId), {
          commentsCount: increment(1)
        });
        checkAndAwardBadges(commentAuthorId).catch(console.error);
      }

      setModeratingComments(prev => prev.map(c => c.id === commentId ? { ...c, isBlocked: false, autoFlagged: false } : c));
      alert("✅ تم اعتماد التعليق بنجاح.");
    } catch (e) {
      console.error(e);
      alert("فشل العملية");
    }
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
    try {
      if (!announcement.trim()) {
        await setDoc(doc(db, "settings", "global"), { announcement: deleteField(), mandatoryAnnouncement: deleteField(), updatedAt: serverTimestamp() }, { merge: true });
        alert("✅ تم حذف الإعلان من الموقع.");
      } else {
        await setDoc(doc(db, "settings", "global"), { announcement: announcement.trim(), updatedAt: serverTimestamp() }, { merge: true });
        alert("✅ تم نشر الإعلان!");
      }
    }
    catch (e) { console.error(e); alert("فشل حفظ الإعلان"); } finally { setIsSettingAnnouncement(false); }
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

  const chatbotStats = useMemo(() => {
    if (!chatbotLogs || chatbotLogs.length === 0) {
      return {
        totalUniqueUsers: 0,
        activeToday: 0,
        returningUsers: 0,
        returningPercent: 0,
        oneTimeUsers: 0,
        oneTimePercent: 0,
        politeCount: 0,
        insultCount: 0,
        insultPercent: 0,
        politePercent: 0,
        topQuestions: [],
        userSessions: {}
      };
    }

    // Group logs by userId
    const userSessions: Record<string, { userName: string, lastActive: any, messages: any[], textMessages: string[] }> = {};
    let politeCount = 0;
    let insultCount = 0;

    chatbotLogs.forEach(log => {
      const uid = log.userId;
      if (!uid) return;
      if (!userSessions[uid]) {
        userSessions[uid] = {
          userName: log.userName || "زائر",
          lastActive: log.timestamp,
          messages: [],
          textMessages: []
        };
      }
      
      // Keep track of the user's display name if it's set
      if (log.userName && log.userName !== "يقين (البوت)" && log.userName !== "زائر") {
        userSessions[uid].userName = log.userName;
      }
      
      userSessions[uid].messages.push(log);
      if (log.sender === "user") {
        userSessions[uid].textMessages.push(log.text);
        if (log.isInsult) {
          insultCount++;
        } else if (log.sentiment === "positive") {
          politeCount++;
        }
      }
    });

    const totalUniqueUsers = Object.keys(userSessions).length;

    // Today's date in local time YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    let activeToday = 0;
    Object.values(userSessions).forEach(sess => {
      const todayMsgs = sess.messages.filter(m => {
        if (!m.timestamp) return false;
        const dateStr = m.timestamp.toDate 
          ? m.timestamp.toDate().toISOString().split('T')[0]
          : new Date(m.timestamp).toISOString().split('T')[0];
        return dateStr === todayStr;
      });
      if (todayMsgs.length > 0) activeToday++;
    });

    // One-time vs Returning:
    // A user is returning if they have messages on more than one day OR sent > 5 messages in total.
    let returningUsers = 0;
    let oneTimeUsers = 0;

    Object.values(userSessions).forEach(sess => {
      const dates = new Set<string>();
      sess.messages.forEach(m => {
        if (m.timestamp) {
          const dateStr = m.timestamp.toDate 
            ? m.timestamp.toDate().toDateString()
            : new Date(m.timestamp).toDateString();
          dates.add(dateStr);
        }
      });

      if (dates.size > 1 || sess.messages.length > 5) {
        returningUsers++;
      } else {
        oneTimeUsers++;
      }
    });

    const returningPercent = totalUniqueUsers > 0 ? Math.round((returningUsers / totalUniqueUsers) * 100) : 0;
    const oneTimePercent = totalUniqueUsers > 0 ? Math.round((oneTimeUsers / totalUniqueUsers) * 100) : 0;

    const totalClassifiedSentiment = politeCount + insultCount || 1;
    const politePercent = Math.round((politeCount / totalClassifiedSentiment) * 100);
    const insultPercent = Math.round((insultCount / totalClassifiedSentiment) * 100);

    // Top 10 repeated questions
    // Normalise and count questions
    const questionCounts: Record<string, number> = {};
    chatbotLogs.forEach(log => {
      if (log.sender === "user") {
        let qText = log.text.trim()
          .replace(/[أإآ]/g, "ا")
          .replace(/ة/g, "ه")
          .replace(/ى/g, "ي")
          .replace(/[.,!?()؛؟?"'«»]/g, "")
          .replace(/\s+/g, " ")
          .toLowerCase();
        
        if (qText.length > 3) {
          questionCounts[qText] = (questionCounts[qText] || 0) + 1;
        }
      }
    });

    const topQuestions = Object.entries(questionCounts)
      .map(([text, count]) => {
        // Find original question for display
        const original = chatbotLogs.find(l => {
          if (l.sender !== "user") return false;
          let norm = l.text.trim()
            .replace(/[أإآ]/g, "ا")
            .replace(/ة/g, "ه")
            .replace(/ى/g, "ي")
            .replace(/[.,!?()؛؟?"'«»]/g, "")
            .replace(/\s+/g, " ")
            .toLowerCase();
          return norm === text;
        })?.text || text;

        return { text: original, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalUniqueUsers,
      activeToday,
      returningUsers,
      returningPercent,
      oneTimeUsers,
      oneTimePercent,
      politeCount,
      insultCount,
      insultPercent,
      politePercent,
      topQuestions,
      userSessions
    };
  }, [chatbotLogs]);

  const filteredUsers = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return users.filter(u => {
      return (q === '' || (u.displayName || u.username || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.phoneNumber || "").toString().toLowerCase().includes(q) || (u.plan || "").toLowerCase().includes(q) || (u.subscriptionType || "").toLowerCase().includes(q)) && (showBannedOnly ? u.isBanned : true);
    }).sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
  }, [users, debouncedSearch, showBannedOnly]);

  // Debounced search: only start filtering after 300ms of no typing
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
                  { label: 'أكواد التسجيل (اليوم)', value: dailyStats.regCount, icon: TrendingUp, color: 'text-violet-400' },
                  { label: 'أكواد الاستعادة (اليوم)', value: dailyStats.forgotCount, icon: KeyRound, color: 'text-orange-400' },
                  { label: 'إجمالي إيميلات اليوم', value: dailyStats.emailCount, icon: Mail, color: 'text-sky-400' },
                  { label: 'إجمالي رسائل التأكيد', value: dailyStats.totalEmails, icon: Mail, color: 'text-amber-400' },
                  { label: 'إيميلات فريدة مرسل لها', value: dailyStats.totalUniqueEmails, icon: Users, color: 'text-rose-400' },
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
            <div className="space-y-6">
              {/* Form to Create New Alert */}
              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 text-right">
                <h3 className="text-lg font-black text-white mb-4">إنشاء تنبيه نظام جديد للجمهور</h3>
                <form onSubmit={handleCreateAlert} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className={LABEL}>عنوان التنبيه</label>
                      <input 
                        type="text" 
                        required 
                        value={newAlertTitle} 
                        onChange={e => setNewAlertTitle(e.target.value)} 
                        className={INPUT_CLASS} 
                        placeholder="مثال: تنبيه هام، تحديث جديد، صيانة..." 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL}>مدة التنبيه (بالساعات)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="720" 
                        required 
                        value={newAlertDuration} 
                        onChange={e => setNewAlertDuration(parseInt(e.target.value) || 24)} 
                        className={INPUT_CLASS} 
                        placeholder="مثال: 24" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={LABEL}>نص الرسالة</label>
                    <textarea 
                      required 
                      value={newAlertMessage} 
                      onChange={e => setNewAlertMessage(e.target.value)} 
                      rows={3} 
                      className={INPUT_CLASS} 
                      placeholder="اكتب تفاصيل التنبيه التي ستظهر للمستخدمين داخل التطبيق..." 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isAddingAlert} 
                    className="rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3.5 text-black font-black transition hover:shadow-xl hover:shadow-amber-500/20 text-sm disabled:opacity-50"
                  >
                    {isAddingAlert ? <Loader2 className="inline-block h-4 w-4 animate-spin" /> : 'نشر التنبيه العام'}
                  </button>
                </form>
              </div>

              {/* Alerts List */}
              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-xl font-black">أرشيف التنبيهات المنشورة</h2>
                    <p className="text-sm text-white/30">معاينة، تجديد، أو إيقاف التنبيهات للجمهور.</p>
                  </div>
                  <button onClick={fetchAlerts} className={BTN_GHOST}>تحديث</button>
                </div>
                <div className="mt-6 space-y-4">
                  {alerts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center text-white/30">لا توجد تنبيهات حالياً.</div>
                  ) : (
                    alerts.map((alert, index) => {
                      const createdTime = new Date(alert.createdAt?.toDate ? alert.createdAt.toDate() : alert.createdAt || Date.now()).getTime();
                      const durationMs = (alert.durationHours || 24) * 60 * 60 * 1000;
                      const expiryTime = createdTime + durationMs;
                      const isExpired = !alert.active || (Date.now() > expiryTime);
                      
                      const timeLeftMs = expiryTime - Date.now();
                      const timeLeftHours = Math.max(0, Math.floor(timeLeftMs / (1000 * 60 * 60)));
                      const timeLeftMins = Math.max(0, Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60)));

                      return (
                        <div key={alert.id || index} className={`rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all ${!isExpired ? 'border-amber-500/20 bg-amber-500/[0.01]' : 'opacity-70'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-right sm:text-left">
                            {/* Alert Details */}
                            <div className="order-2 sm:order-1 flex-1 space-y-1 text-right">
                              <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                                {!isExpired ? (
                                  <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-500">نشط حالياً</span>
                                ) : (
                                  <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-black text-white/40">منتهي أو موقوف</span>
                                )}
                                <span className="text-xs text-white/40 font-bold bg-white/5 px-2.5 py-1 rounded-lg">المدة: {alert.durationHours || 24} ساعة</span>
                                <h4 className="font-black text-white text-base mr-auto">{alert.title || 'تنبيه نظام'}</h4>
                              </div>
                              
                              <p className="text-xs text-white/30 mt-1">تاريخ النشر: {new Date(createdTime).toLocaleString('ar-EG')}</p>
                              
                              {!isExpired && (
                                <p className="text-xs text-amber-400 font-bold">المتبقي: {timeLeftHours} ساعة و {timeLeftMins} دقيقة</p>
                              )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="order-1 sm:order-2 flex items-center gap-2 justify-end">
                              {!isExpired ? (
                                <button 
                                  onClick={() => handleToggleAlertActive(index, false)} 
                                  className="rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3.5 py-2 text-[11px] font-black text-rose-400 transition"
                                >
                                  إيقاف / إلغاء
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleToggleAlertActive(index, true)} 
                                  className="rounded-xl bg-amber-500 px-3.5 py-2 text-[11px] font-black text-black transition hover:brightness-110 shadow-lg shadow-amber-500/10"
                                >
                                  تجديد (تفعيل 24 ساعة)
                                </button>
                              )}
                              
                              <button 
                                onClick={() => handleDeleteAlert(index)} 
                                className="rounded-xl bg-white/5 hover:bg-white/10 text-white/40 border border-white/10 p-2 transition"
                                title="حذف نهائياً"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="mt-4 text-sm text-white/60 text-right whitespace-pre-line leading-relaxed">{alert.message || 'لا توجد رسالة.'}</p>
                        </div>
                      );
                    })
                  )}
                </div>
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
                  <button onClick={handleSaveMaintenance} disabled={isSavingMaintenance} className="mt-2 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-4 text-black font-black transition hover:shadow-xl hover:shadow-amber-500/20 disabled:opacity-50">
                    {isSavingMaintenance ? <Loader2 className="inline-block h-5 w-5 animate-spin" /> : 'حفظ وضع الصيانة'}
                  </button>
                  <p className="text-[11px] text-amber-500/80 font-bold leading-relaxed text-right mt-2">
                    ⚠️ ملحوظة: إذا كنت تستخدم مانع إعلانات (AdBlocker) أو متصفح Brave مع تشغيل الدروع، فقد يتم حظر الاتصال بقاعدة البيانات (ERR_BLOCKED_BY_CLIENT) ولا يتم حفظ التغييرات. يرجى تعطيل مانع الإعلانات في هذا الموقع لضمان عمل لوحة التحكم بشكل سليم.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========== SUBS TAB ========== */}
          {activeTab === 'subs' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

              {/* Summary Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'طلبات معلقة', value: subRequests.filter(r => r.status === 'pending').length, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                  { label: 'مفعّلة', value: subRequests.filter(r => r.status === 'approved').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                  { label: 'مرفوضة', value: subRequests.filter(r => r.status === 'rejected').length, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                  { label: 'إجمالي الإيرادات', value: `${subRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.amount || 0), 0).toLocaleString()} ج.م`, color: 'text-[#fbbf24]', bg: 'bg-[#fbbf24]/10 border-[#fbbf24]/20' },
                ].map(card => (
                  <div key={card.label} className={`rounded-2xl border p-5 text-center ${card.bg}`}>
                    <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                    <p className="text-[11px] text-white/40 font-bold mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { id: 'pending', label: '⏳ معلق', count: subRequests.filter(r => r.status === 'pending').length },
                  { id: 'approved', label: '✅ مفعّل', count: subRequests.filter(r => r.status === 'approved').length },
                  { id: 'rejected', label: '❌ مرفوض', count: subRequests.filter(r => r.status === 'rejected').length },
                  { id: 'all', label: '📋 الكل', count: subRequests.length },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setSubsFilter(f.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all border ${
                      subsFilter === f.id
                        ? 'bg-[#fbbf24]/10 border-[#fbbf24]/30 text-[#fbbf24]'
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {f.label} <span className="opacity-60">({f.count})</span>
                  </button>
                ))}
                <button
                  onClick={fetchSubRequests}
                  className="mr-auto px-4 py-2.5 rounded-xl text-sm font-black transition-all border bg-white/5 border-white/10 text-white/40 hover:bg-white/10 flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> تحديث
                </button>
              </div>

              {/* Requests Table */}
              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 overflow-x-auto">
                {isSubsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-[#fbbf24]" />
                    <span className="mr-3 text-sm text-white/40 font-bold">جاري التحميل...</span>
                  </div>
                ) : (
                  <div className="min-w-[1100px]">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-[0.18em] text-white/30 border-b border-white/10">
                          <th className="p-3">رقم الطلب</th>
                          <th className="p-3">المستخدم</th>
                          <th className="p-3">الخطة</th>
                          <th className="p-3">طريقة الدفع</th>
                          <th className="p-3">معرّف المحوّل</th>
                          <th className="p-3">رقم العملية</th>
                          <th className="p-3">المبلغ</th>
                          <th className="p-3">الحالة</th>
                          <th className="p-3">التاريخ</th>
                          {(subsFilter === 'pending' || subsFilter === 'all') && <th className="p-3 text-left">الإجراء</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {subRequests.filter(r => subsFilter === 'all' || r.status === subsFilter).length === 0 ? (
                          <tr>
                            <td colSpan={10} className="p-16 text-center text-sm text-white/20 font-bold">لا توجد طلبات</td>
                          </tr>
                        ) : (
                          subRequests.filter(r => subsFilter === 'all' || r.status === subsFilter).map(r => (
                            <tr key={r.id} className="hover:bg-white/5 transition-colors">
                              {/* Order Number */}
                              <td className="p-3">
                                <span className="font-black text-[#fbbf24] text-[11px] bg-[#fbbf24]/10 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                                  {r.orderNumber || '—'}
                                </span>
                              </td>
                              {/* User Info */}
                              <td className="p-3">
                                <div className="space-y-1 text-right min-w-[140px]">
                                  <p className="font-black text-sm">{r.fullName || r.userName || 'مستخدم'}</p>
                                  <div className="flex items-center gap-1 justify-end">
                                    <button
                                      title={r.userEmail}
                                      onClick={() => { navigator.clipboard.writeText(r.userEmail || ''); setCopiedCell(`email-${r.id}`); setTimeout(() => setCopiedCell(null), 2000); }}
                                      className="p-1 rounded-md hover:bg-white/10 text-white/20 hover:text-white/60 transition-all"
                                    >
                                      {copiedCell === `email-${r.id}` ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Mail className="w-3 h-3" />}
                                    </button>
                                    <p className="text-[10px] text-white/30 max-w-[120px] truncate">{r.userEmail || '—'}</p>
                                  </div>
                                  {r.userPhone && (
                                    <div className="flex items-center gap-1 justify-end">
                                      <button
                                        title={r.userPhone}
                                        onClick={() => { navigator.clipboard.writeText(r.userPhone); setCopiedCell(`phone-${r.id}`); setTimeout(() => setCopiedCell(null), 2000); }}
                                        className="p-1 rounded-md hover:bg-white/10 text-white/20 hover:text-white/60 transition-all"
                                      >
                                        {copiedCell === `phone-${r.id}` ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Phone className="w-3 h-3" />}
                                      </button>
                                      <p className="text-[10px] text-white/30 font-mono">{r.userPhone}</p>
                                    </div>
                                  )}
                                  {r.platformLink && (
                                    <a href={r.platformLink} target="_blank" rel="noreferrer" className="text-[10px] text-sky-400 hover:underline block text-right truncate max-w-[140px]">🔗 رابط المنصة</a>
                                  )}
                                  {r.note && (
                                    <p className="text-[10px] text-amber-400/70">📝 {r.note}</p>
                                  )}
                                </div>
                              </td>
                              {/* Plan */}
                              <td className="p-3">
                                <span className="inline-flex rounded-full bg-[#fbbf24]/10 px-2.5 py-1 text-[11px] font-black text-[#fbbf24] whitespace-nowrap">{r.plan}</span>
                              </td>
                              {/* Payment Method */}
                              <td className="p-3 text-xs font-bold text-white/60 whitespace-nowrap">{r.paymentMethod || '—'}</td>
                              {/* Sender Identifier */}
                              <td className="p-3">
                                <div className="flex items-center gap-1.5 justify-end">
                                  <button
                                    onClick={() => { navigator.clipboard.writeText(r.senderIdentifier || r.senderInfo || ''); setCopiedCell(`sender-${r.id}`); setTimeout(() => setCopiedCell(null), 2000); }}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/20 hover:text-white/60 transition-all"
                                  >
                                    {copiedCell === `sender-${r.id}` ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                  <span className="text-xs font-mono text-white/70 whitespace-nowrap">{r.senderIdentifier || r.senderInfo || '—'}</span>
                                </div>
                              </td>
                              {/* Transaction Ref */}
                              <td className="p-3">
                                {r.transactionRef ? (
                                  <div className="flex items-center gap-1.5 justify-end">
                                    <button
                                      onClick={() => { navigator.clipboard.writeText(r.transactionRef); setCopiedCell(`ref-${r.id}`); setTimeout(() => setCopiedCell(null), 2000); }}
                                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/20 hover:text-white/60 transition-all"
                                    >
                                      {copiedCell === `ref-${r.id}` ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                    <span className="text-xs font-mono text-white/70">{r.transactionRef}</span>
                                  </div>
                                ) : <span className="text-white/20 text-xs">—</span>}
                              </td>
                              {/* Amount */}
                              <td className="p-3 font-black text-emerald-400 text-sm whitespace-nowrap">{r.amount || '—'} ج.م</td>
                              {/* Status */}
                              <td className="p-3">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black whitespace-nowrap ${
                                  r.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                                  r.status === 'approved' ? 'bg-emerald-500/15 text-emerald-400' :
                                  'bg-red-500/15 text-red-400'
                                }`}>
                                  {r.status === 'pending' ? '⏳ معلق' : r.status === 'approved' ? '✅ مفعّل' : '❌ مرفوض'}
                                </span>
                              </td>
                              {/* Date */}
                              <td className="p-3 text-xs text-white/30 whitespace-nowrap">
                                {r.createdAt ? new Date(r.createdAt.toDate ? r.createdAt.toDate() : r.createdAt).toLocaleString('ar-EG') : '—'}
                              </td>
                              {/* Action */}
                              {(subsFilter === 'pending' || subsFilter === 'all') && (
                                <td className="p-3 text-left">
                                  {r.status === 'pending' && (
                                    <div className="flex gap-2 justify-end">
                                      <button onClick={() => handleActionSubscription(r.id, r.userId, r.plan, 'approve')} className="rounded-xl bg-emerald-500 px-3 py-2 text-[11px] font-black text-black transition hover:opacity-90">تفعيل</button>
                                      <button onClick={() => handleActionSubscription(r.id, r.userId, r.plan, 'reject')} className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-[11px] font-black text-red-400 transition hover:bg-red-500 hover:text-white">رفض</button>
                                    </div>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Active Subscriptions */}
              <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 overflow-x-auto">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-black">المشتركون المفعلون حالياً</h2>
                  <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-400">
                    {users.filter(u => u.plan && u.plan !== 'free' && u.subscriptionActive).length} مشترك نشط
                  </span>
                </div>
                <div className="min-w-[900px]">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-[0.18em] text-white/30 border-b border-white/10">
                        <th className="p-4">المشترك</th>
                        <th className="p-4">الهاتف</th>
                        <th className="p-4">البريد الإلكتروني</th>
                        <th className="p-4">الباقة</th>
                        <th className="p-4">باقي الأيام</th>
                        <th className="p-4">انتهاء الاشتراك</th>
                        <th className="p-4 text-left">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {users.filter(u => u.plan && u.plan !== 'free' && u.subscriptionActive).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-10 text-center text-sm text-white/20 font-bold">لا يوجد مشتركون نشطون حالياً</td>
                        </tr>
                      ) : (
                        users.filter(u => u.plan && u.plan !== 'free' && u.subscriptionActive).map(u => {
                          const expiry = u.subscriptionExpiry
                            ? new Date(u.subscriptionExpiry.toDate ? u.subscriptionExpiry.toDate() : u.subscriptionExpiry)
                            : null;
                          const daysLeft = expiry
                            ? Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                            : null;
                          return (
                            <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                              <td className="p-4">
                                <div className="space-y-1 text-right">
                                  <p className="font-black text-sm">{u.displayName || 'مستخدم'}</p>
                                  <p className="text-[11px] text-white/40">@{u.username || '—'}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5 justify-end">
                                  {u.phoneNumber && (
                                    <button
                                      onClick={() => { navigator.clipboard.writeText(u.phoneNumber); setCopiedCell(`uphone-${u.uid}`); setTimeout(() => setCopiedCell(null), 2000); }}
                                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/20 hover:text-white/60 transition-all"
                                    >
                                      {copiedCell === `uphone-${u.uid}` ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                  <span className="text-xs font-mono text-white/60">{u.phoneNumber || u.phone || '—'}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5 justify-end">
                                  {u.email && (
                                    <button
                                      onClick={() => { navigator.clipboard.writeText(u.email); setCopiedCell(`uemail-${u.uid}`); setTimeout(() => setCopiedCell(null), 2000); }}
                                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/20 hover:text-white/60 transition-all"
                                    >
                                      {copiedCell === `uemail-${u.uid}` ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                  <span className="text-xs text-white/60 truncate max-w-[140px] block">{u.email || '—'}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-black text-emerald-300">{u.plan}</span>
                              </td>
                              <td className="p-4">
                                {daysLeft !== null ? (
                                  <span className={`inline-flex rounded-full px-2.5 py-1.5 text-[11px] font-black ${
                                    daysLeft > 7 ? 'bg-emerald-500/15 text-emerald-300' :
                                    daysLeft > 0 ? 'bg-amber-500/15 text-amber-400' :
                                    'bg-red-500/15 text-red-400'
                                  }`}>
                                    {daysLeft > 0 ? `${daysLeft} يوم` : 'منتهي'}
                                  </span>
                                ) : <span className="text-white/20 text-xs">—</span>}
                              </td>
                              <td className="p-4 text-xs text-white/40">
                                {expiry ? expiry.toLocaleDateString('ar-EG') : '—'}
                              </td>
                              <td className="p-4 text-left">
                                <button
                                  onClick={() => handleCancelSubscription(u.uid)}
                                  disabled={isUpdatingSubscription}
                                  className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-[11px] font-black text-red-400 transition hover:bg-red-500 hover:text-white disabled:opacity-40"
                                >
                                  إلغاء الاشتراك
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========== CHATBOT TAB ========== */}
          {activeTab === 'chatbot' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'إجمالي من تحدث مع البوت', value: chatbotStats.totalUniqueUsers, icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                  { label: 'نشط اليوم بالشات', value: chatbotStats.activeToday, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                  { label: 'أشخاص شتموا / زهقوا', value: chatbotStats.insultCount, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
                  { label: 'أشخاص تكلموا حلو / مدحوا', value: chatbotStats.politeCount, icon: Trophy, color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
                ].map(card => (
                  <div key={card.label} className={`rounded-2xl border p-5 text-center ${card.bg}`}>
                    <card.icon className={`mx-auto mb-3 w-6 h-6 ${card.color}`} />
                    <p className="text-2xl font-black text-white">{card.value.toLocaleString()}</p>
                    <p className="text-[11px] text-white/40 font-bold mt-1">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Percentages and Analysis */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Returning vs One-Time User Analysis */}
                <div className={CARD_CLASS}>
                  <p className="text-sm font-black text-white/70 mb-4">👥 تحليل تكرار الاستخدام (Returning vs. One-Time)</p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-amber-400">مستخدمين عائدين ({chatbotStats.returningUsers})</span>
                        <span className="text-white/40">مستخدمين لمرة واحدة ({chatbotStats.oneTimeUsers})</span>
                      </div>
                      
                      {/* Interactive percentage bar */}
                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
                        <div className="bg-amber-400 h-full transition-all" style={{ width: `${chatbotStats.returningPercent}%` }} />
                        <div className="bg-white/10 h-full transition-all" style={{ width: `${chatbotStats.oneTimePercent}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center mt-2">
                      <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                        <p className="text-2xl font-black text-amber-400">{chatbotStats.returningPercent}%</p>
                        <p className="text-[10px] text-white/30 font-bold mt-0.5">نسبة العائدين</p>
                      </div>
                      <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                        <p className="text-2xl font-black text-white/50">{chatbotStats.oneTimePercent}%</p>
                        <p className="text-[10px] text-white/30 font-bold mt-0.5">نسبة المرة الواحدة</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-white/30 font-medium leading-relaxed mt-2 text-right">
                      💡 التحليل: {chatbotStats.returningPercent > 50 
                        ? "ما شاء الله! الشات بوت يحظى بنسبة ولاء عالية، حيث يعود أغلب المستخدمين للحديث معه مجدداً." 
                        : "معدل العودة منخفض، قد يحتاج البوت لتقديم اقتراحات أذكى أو تنبيهات تشجع المستخدمين على العودة."
                      }
                    </p>
                  </div>
                </div>

                {/* Sentiment & Insult Analysis */}
                <div className={CARD_CLASS}>
                  <p className="text-sm font-black text-white/70 mb-4">💬 تحليل أسلوب الكلام (المدح مقابل الإساءة)</p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-sky-400">أسلوب إيجابي / مدح ({chatbotStats.politeCount})</span>
                        <span className="text-red-400">إساءة / شتائم وزهق ({chatbotStats.insultCount})</span>
                      </div>
                      
                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
                        <div className="bg-sky-400 h-full transition-all" style={{ width: `${chatbotStats.politePercent}%` }} />
                        <div className="bg-red-400 h-full transition-all" style={{ width: `${chatbotStats.insultPercent}%` }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center mt-2">
                      <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                        <p className="text-2xl font-black text-sky-400">{chatbotStats.politePercent}%</p>
                        <p className="text-[10px] text-white/30 font-bold mt-0.5">إيجابي</p>
                      </div>
                      <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                        <p className="text-2xl font-black text-red-400">{chatbotStats.insultPercent}%</p>
                        <p className="text-[10px] text-white/30 font-bold mt-0.5">إساءات / غضب</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-white/30 font-medium leading-relaxed mt-2 text-right">
                      💡 التحليل: {chatbotStats.insultCount > chatbotStats.politeCount
                        ? "تحذير: نسبة الغضب مرتفعة! قد يكون ذلك بسبب إجابات البوت الخاطئة. ترقية Gemini ستخفف من هذا الغضب بالتأكيد."
                        : "ممتاز! المستخدمين يتفاعلون بشكل إيجابي ومحترم مع المساعد الذكي."
                      }
                    </p>
                  </div>
                </div>

              </div>

              <div className="grid lg:grid-cols-[1fr_1.3fr] gap-6">
                
                {/* Top 10 Repeated Questions */}
                <div className={CARD_CLASS}>
                  <p className="text-sm font-black text-white/70 mb-4">🔥 أكثر 10 أسئلة متكررة للشات بوت</p>
                  
                  <div className="space-y-2">
                    {chatbotStats.topQuestions.map((q, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-white/40 font-bold">{idx + 1}</span>
                          <p className="text-xs text-white/80 font-bold truncate max-w-[200px] md:max-w-[280px]" title={q.text}>{q.text}</p>
                        </div>
                        <span className="text-xs font-black bg-amber-400/10 text-amber-400 px-2 py-1 rounded-md">{q.count} تكرار</span>
                      </div>
                    ))}
                    {chatbotStats.topQuestions.length === 0 && (
                      <p className="text-sm text-white/20 text-center py-12">لا توجد أسئلة كافية للتحليل</p>
                    )}
                  </div>
                </div>

                {/* Chat Sessions / Logs viewer */}
                <div className={CARD_CLASS + " flex flex-col max-h-[500px]"}>
                  <div className="flex justify-between items-center mb-4 shrink-0">
                    <p className="text-sm font-black text-white/70">💬 سجلات المحادثات الأخيرة للجمهور</p>
                    {selectedChatUserId && (
                      <button 
                        onClick={() => { setSelectedChatUserId(null); setSelectedUserChat(null); }}
                        className="text-xs text-[#fbbf24] font-bold hover:underline"
                      >
                        رجوع للقائمة
                      </button>
                    )}
                  </div>
                  
                  {isChatbotLoading ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                      <Loader2 className="w-6 h-6 animate-spin text-[#fbbf24]" />
                      <span className="mr-3 text-sm text-white/40 font-bold">جاري تحميل المحادثات...</span>
                    </div>
                  ) : !selectedChatUserId ? (
                    /* Sessions list */
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-1">
                      {Object.entries(chatbotStats.userSessions).map(([uid, sess]: any) => {
                        const totalMsgs = sess.messages.length;
                        const lastMsg = sess.messages[0]; // ordered desc, so first is newest
                        const lastActiveDate = lastMsg?.timestamp
                          ? new Date(lastMsg.timestamp.toDate ? lastMsg.timestamp.toDate() : lastMsg.timestamp).toLocaleString('ar-EG')
                          : '—';
                          
                        return (
                          <div 
                            key={uid} 
                            onClick={() => {
                              setSelectedChatUserId(uid);
                              setSelectedUserChat(sess.messages.slice().reverse()); // Show chronological order
                            }}
                            className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] cursor-pointer transition flex items-center justify-between text-right"
                          >
                            <div className="space-y-1">
                              <p className="text-xs text-white/30">{lastActiveDate}</p>
                              <p className="text-[11px] text-white/40 truncate max-w-[200px] md:max-w-[320px]">
                                {lastMsg?.sender === "user" ? "👤 المستخدم: " : "🤖 البوت: "} {lastMsg?.text}
                              </p>
                            </div>
                            
                            <div className="text-left shrink-0">
                              <p className="font-black text-sm text-white/90">{sess.userName}</p>
                              <span className="inline-block mt-1 text-[10px] bg-white/5 text-white/50 px-2 py-0.5 rounded-md font-mono">
                                {totalMsgs} رسائل
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(chatbotStats.userSessions).length === 0 && (
                        <p className="text-sm text-white/20 text-center py-12">لا توجد محادثات مسجلة بعد</p>
                      )}
                    </div>
                  ) : (
                    /* Detailed Chat view */
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl mb-3 flex justify-between items-center shrink-0">
                        <span className="text-xs text-white/40 font-mono">معرف: {selectedChatUserId.substring(0, 10)}...</span>
                        <span className="font-black text-sm text-[#fbbf24]">
                          {chatbotStats.userSessions[selectedChatUserId]?.userName || "مستمع"}
                        </span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 p-2 bg-black/20 rounded-xl">
                        {selectedUserChat?.map((msg) => (
                          <div 
                            key={msg.id} 
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed shadow-md ${
                              msg.sender === "user"
                                ? "bg-[#fbbf24] text-black rounded-tr-sm font-bold"
                                : "bg-white/[0.05] text-white/90 border border-white/5 rounded-tl-sm"
                            }`}>
                              {msg.sender === "bot" && (
                                <div className="text-[9px] text-[#fbbf24] font-black mb-1 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" /> المساعد الذكي
                                </div>
                              )}
                              <p className="whitespace-pre-line">{msg.text}</p>
                              <span className="block text-[8px] text-right mt-1 opacity-40">
                                {msg.timestamp ? new Date(msg.timestamp.toDate ? msg.timestamp.toDate() : msg.timestamp).toLocaleTimeString('ar-EG') : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* ========== ANALYTICS TAB ========== */}
          {activeTab === 'analytics' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 font-arabic text-right">
              {/* Header section with manual refresh */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/[0.04] p-6 rounded-3xl">
                <div>
                  <h2 className="text-2xl font-black text-white">داش بورد التحليلات المتقدمة</h2>
                  <p className="text-xs text-white/40 mt-1">تتبع مؤشرات الأداء الحية، التفاعلات، والمبيعات بشكل لحظي</p>
                </div>
                <button
                  onClick={fetchAnalyticsData}
                  disabled={isAnalyticsLoading}
                  className="flex items-center gap-2 px-5 py-3 bg-[#fbbf24] text-black font-black rounded-2xl hover:brightness-110 active:scale-95 transition disabled:opacity-50 text-xs"
                >
                  <RefreshCw className={`w-4 h-4 ${isAnalyticsLoading ? 'animate-spin' : ''}`} />
                  تحديث البيانات
                </button>
              </div>

              {isAnalyticsLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-white/50">
                  <Loader2 className="w-10 h-10 animate-spin text-[#fbbf24] mb-4" />
                  <p className="text-sm font-bold">جاري تحميل وتجميع التحليلات...</p>
                </div>
              )}

              {!isAnalyticsLoading && analyticsData && (
                <>
                  {/* SECTION 1: KPI CARDS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'إجمالي المستخدمين', value: analyticsData.kpis.totalUsers, icon: Users, desc: `معدل نمو أسبوعي +${analyticsData.userGrowth.growthRate}%` },
                      { label: 'النشطين اليوم', value: analyticsData.kpis.activeToday, icon: UserCheck, desc: `بنسبة ${analyticsData.kpis.totalUsers > 0 ? ((analyticsData.kpis.activeToday / analyticsData.kpis.totalUsers) * 100).toFixed(1) : 0}% من المستخدمين` },
                      { label: 'إجمالي النقاط', value: analyticsData.kpis.totalPoints, icon: Trophy, desc: 'نقاط تفاعل الأوراد والمصحف' },
                      { label: 'رسائل الشات بوت', value: analyticsData.kpis.chatbotMessagesCount, icon: MessageSquare, desc: 'إجمالي المحادثات مع البوت' },
                      { label: 'المشتركون الفعّالون', value: analyticsData.kpis.premiumOrStarterCount, icon: CreditCard, desc: `معدل تحويل: ${analyticsData.kpis.conversionRate}%` },
                      { label: 'طلبات اشتراك معلقة', value: analyticsData.kpis.pendingSubscriptions, icon: AlertCircle, desc: 'تنتظر التفعيل والمراجعة', highlight: analyticsData.kpis.pendingSubscriptions > 0 },
                      { label: 'تذاكر الدعم المفتوحة', value: analyticsData.kpis.openSupportTickets, icon: HeadphonesIcon, desc: 'تحتاج استجابة سريعة', highlight: analyticsData.kpis.openSupportTickets > 0 },
                      { label: 'إجمالي الإيميلات المرسلة', value: analyticsData.emails.totalEmails, icon: Mail, desc: `إيميلات فريدة: ${analyticsData.emails.uniqueEmailsCount}` },
                    ].map((card, i) => {
                      const Icon = card.icon;
                      return (
                        <div key={i} className={`rounded-2xl border p-5 transition hover:scale-[1.02] duration-300 ${card.highlight ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/[0.02] border-white/[0.06]'}`}>
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-white/30 font-bold">{card.label}</span>
                            <Icon className={`w-5 h-5 ${card.highlight ? 'text-amber-400' : 'text-[#fbbf24]/75'}`} />
                          </div>
                          <p className="text-2xl font-black text-white mt-3 font-mono">{card.value.toLocaleString('ar-EG')}</p>
                          <p className="text-[10px] text-white/40 mt-1 font-bold">{card.desc}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* SECTION 2: USER GROWTH & PLANS & GEOLOCATIONS */}
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* User Growth SVG line chart */}
                    <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-black text-white">تسجيلات المستخدمين الجدد (آخر 14 يوم)</h3>
                        <p className="text-xs text-white/40 mt-1">منحنى نمو الحسابات اليومية المسجلة عبر التحقق</p>
                      </div>
                      
                      <div className="my-6 relative">
                        {/* SVG Polyline Chart */}
                        {(() => {
                          const list = analyticsData.userGrowth.signupsByDay;
                          const maxCount = Math.max(...list.map((d: any) => d.count), 2);
                          const points = list.map((d: any, idx: number) => {
                            const x = (idx / (list.length - 1)) * 100;
                            const y = 90 - (d.count / maxCount) * 80;
                            return `${x},${y}`;
                          }).join(' ');

                          return (
                            <div className="w-full">
                              <svg viewBox="0 0 100 100" className="w-full h-44 overflow-visible" preserveAspectRatio="none">
                                {/* Grid lines */}
                                {[0, 25, 50, 75, 100].map(val => (
                                  <line key={val} x1="0" y1={val} x2="100" y2={val} stroke="white" strokeOpacity="0.04" strokeWidth="0.5" />
                                ))}
                                {/* Gradient Area under curve */}
                                <defs>
                                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.15" />
                                    <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
                                  </linearGradient>
                                </defs>
                                <polygon
                                  fill="url(#chartGrad)"
                                  points={`0,90 ${points} 100,90`}
                                />
                                {/* Sparkline */}
                                <polyline
                                  fill="none"
                                  stroke="#fbbf24"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points={points}
                                />
                                {/* Render dots for active values */}
                                {list.map((d: any, idx: number) => {
                                  const x = (idx / (list.length - 1)) * 100;
                                  const y = 90 - (d.count / maxCount) * 80;
                                  return (
                                    <g key={idx} className="group/dot cursor-pointer">
                                      <circle cx={x} cy={y} r="1.5" fill="#fbbf24" stroke="#000" strokeWidth="0.5" />
                                      <circle cx={x} cy={y} r="4" fill="#fbbf24" fillOpacity="0" className="hover:fill-opacity-20 transition" />
                                    </g>
                                  );
                                })}
                              </svg>
                              {/* Date labels */}
                              <div className="flex justify-between text-[8px] text-white/30 font-bold mt-2 font-mono" style={{ direction: 'ltr' }}>
                                {list.map((d: any, i: number) => {
                                  // Show only 4 labels to avoid clutter
                                  if (i === 0 || i === 4 || i === 9 || i === 13) {
                                    return <span key={i}>{d.date.substring(5)}</span>;
                                  }
                                  return <span key={i}></span>;
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Plans Distribution & Top Governorates */}
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-black text-white">توزيع الخطط والاشتراكات</h3>
                        <p className="text-xs text-white/40 mt-1">نسبة المستخدمين حسب فئات العضوية</p>
                      </div>

                      <div className="space-y-4 my-4">
                        {(() => {
                          const dist = analyticsData.userGrowth.plansDistribution;
                          const total = dist.free + dist.starter + dist.premium + dist.supporter || 1;
                          const getPercent = (val: number) => ((val / total) * 100).toFixed(0);
                          
                          return (
                            <>
                              {[
                                { name: 'عضوية مجانية', key: 'free', color: 'bg-white/20', count: dist.free },
                                { name: 'باقة البداية (Starter)', key: 'starter', color: 'bg-blue-400', count: dist.starter },
                                { name: 'باقة التميز (Premium)', key: 'premium', color: 'bg-amber-400', count: dist.premium },
                                { name: 'باقة الداعمين (Supporter)', key: 'supporter', color: 'bg-violet-400', count: dist.supporter },
                              ].map(plan => (
                                <div key={plan.key} className="space-y-1">
                                  <div className="flex justify-between text-xs font-bold">
                                    <span className="text-white/80">{plan.name}</span>
                                    <span className="text-white/40 font-mono">{plan.count} ({getPercent(plan.count)}%)</span>
                                  </div>
                                  <div className="w-full bg-white/[0.03] h-2 rounded-full overflow-hidden">
                                    <div className={`h-full ${plan.color} rounded-full`} style={{ width: `${getPercent(plan.count)}%` }} />
                                  </div>
                                </div>
                              ))}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Top Governorates */}
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                      <h3 className="text-lg font-black text-white mb-4">أكثر 5 محافظات نشاطاً</h3>
                      <div className="space-y-4">
                        {analyticsData.userGrowth.sortedGovs.map((gov: any, idx: number) => {
                          const maxCount = analyticsData.userGrowth.sortedGovs[0]?.count || 1;
                          const widthPct = ((gov.count / maxCount) * 100).toFixed(0);
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-white/70">{gov.name}</span>
                                <span className="text-white/30 font-mono">{gov.count} مستخدم</span>
                              </div>
                              <div className="w-full bg-white/[0.02] h-2 rounded-full">
                                <div className="h-full bg-gradient-to-l from-[#fbbf24] to-[#d4af37] rounded-full" style={{ width: `${widthPct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        {analyticsData.userGrowth.sortedGovs.length === 0 && (
                          <p className="text-xs text-white/30 text-center py-6">لا توجد بيانات متاحة للمحافظات</p>
                        )}
                      </div>
                    </div>

                    {/* Chatbot behaviors */}
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-black text-white">تحليل سلوك ومشاعر الشات بوت</h3>
                        <p className="text-xs text-white/40 mt-1">توزيع ردود أفعال المستخدمين مع الذكاء الاصطناعي</p>
                      </div>

                      {/* Donut chart */}
                      {(() => {
                        const polite = analyticsData.chatbot.politeCount;
                        const insults = analyticsData.chatbot.insultCount;
                        const total = polite + insults || 1;
                        const politePct = Math.round((polite / total) * 100);
                        const insultPct = Math.round((insults / total) * 100);
                        
                        return (
                          <div className="flex items-center justify-around my-6">
                            {/* Conic-gradient Donut Chart */}
                            <div 
                              className="relative w-28 h-28 rounded-full flex items-center justify-center shadow-lg"
                              style={{
                                background: `conic-gradient(#10b981 0% ${politePct}%, #ef4444 ${politePct}% 100%)`
                              }}
                            >
                              <div className="absolute w-20 h-20 rounded-full bg-[#0d111d] flex flex-col items-center justify-center">
                                <span className="text-lg font-black text-white">{politePct}%</span>
                                <span className="text-[8px] text-white/40 font-bold">تفاعل إيجابي</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-xs font-bold">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-emerald-500 rounded" />
                                <span className="text-white/70">لطيف / إيجابي ({polite})</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded" />
                                <span className="text-white/70">مسيء / تنمر ({insults})</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Chatbot Message Volume (7 days) */}
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-black text-white">نشاط الشات بوت الأسبوعي</h3>
                        <p className="text-xs text-white/40 mt-1">حجم الرسائل المتبادلة يومياً</p>
                      </div>

                      <div className="my-4">
                        {(() => {
                          const list = analyticsData.chatbot.chatbotMsgsByDay;
                          const maxCount = Math.max(...list.map((d: any) => d.count), 2);
                          
                          return (
                            <div className="flex items-end justify-between h-28 pt-4">
                              {list.map((d: any, idx: number) => {
                                const heightPct = ((d.count / maxCount) * 100).toFixed(0);
                                return (
                                  <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                                    <div className="relative w-4 bg-white/5 rounded-t hover:bg-[#fbbf24]/20 transition-all duration-300 h-20 flex items-end">
                                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-[9px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none font-mono">
                                        {d.count}
                                      </div>
                                      <div className="w-full bg-gradient-to-t from-[#fbbf24] to-amber-400 rounded-t" style={{ height: `${heightPct}%` }} />
                                    </div>
                                    <span className="text-[8px] text-white/30 font-bold font-mono">{d.date.substring(5)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: SALES, REVENUE & SUBSCRIPTION REQUESTS */}
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Sales Metrics & Status Distribution */}
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-black text-white">إحصائيات المبيعات والإيرادات</h3>
                        <p className="text-xs text-white/40 mt-1">قيمة المبيعات التقديرية بالجنيه المصري (EGP)</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 my-4">
                        {[
                          { label: 'اليوم', value: analyticsData.sales.revenueToday, color: 'text-emerald-400' },
                          { label: 'هذا الأسبوع', value: analyticsData.sales.revenueWeek, color: 'text-amber-400' },
                          { label: 'هذا الشهر', value: analyticsData.sales.revenueMonth, color: 'text-sky-400' },
                        ].map((rev, i) => (
                          <div key={i} className="bg-white/[0.02] border border-white/[0.04] p-3.5 rounded-xl text-center">
                            <span className="text-[10px] text-white/40 font-bold">{rev.label}</span>
                            <p className={`text-sm font-black mt-2 font-mono ${rev.color}`}>{rev.value} EGP</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <span className="text-xs font-bold text-white/40">حالة طلبات الاشتراكات</span>
                        {(() => {
                          const counts = analyticsData.sales.subsStatusCounts;
                          const total = counts.approved + counts.pending + counts.rejected || 1;
                          const getPct = (val: number) => ((val / total) * 100).toFixed(0);
                          
                          return (
                            <div className="space-y-2 text-xs font-bold">
                              {[
                                { label: 'مفعّلة / مقبولة', val: counts.approved, color: 'bg-emerald-500', pct: getPct(counts.approved) },
                                { label: 'قيد الانتظار', val: counts.pending, color: 'bg-amber-500', pct: getPct(counts.pending) },
                                { label: 'مرفوضة / ملغية', val: counts.rejected, color: 'bg-red-500', pct: getPct(counts.rejected) },
                              ].map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white/[0.01] border border-white/[0.02] p-2 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 ${item.color} rounded-full`} />
                                    <span className="text-white/70">{item.label}</span>
                                  </div>
                                  <span className="text-white/40 font-mono">{item.val} ({item.pct}%)</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Subscription requests timeline (last 5) */}
                    <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                      <h3 className="text-lg font-black text-white mb-4">آخر الاشتراكات المفعّلة</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse text-xs font-bold">
                          <thead>
                            <tr className="border-b border-white/5 text-white/30">
                              <th className="pb-3">الباقة</th>
                              <th className="pb-3">القيمة المدفوعة</th>
                              <th className="pb-3">التاريخ</th>
                              <th className="pb-3">معرف المستخدم</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.03]">
                            {analyticsData.sales.lastSubscriptions.map((sub: any, idx: number) => (
                              <tr key={idx} className="hover:bg-white/[0.01]">
                                <td className="py-3">
                                  <span className="inline-flex rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/20 px-2.5 py-0.5 text-[10px] text-[#fbbf24]">
                                    {sub.plan}
                                  </span>
                                </td>
                                <td className="py-3 font-mono text-emerald-400">+{sub.amount} EGP</td>
                                <td className="py-3 text-white/50">{sub.date}</td>
                                <td className="py-3 font-mono text-white/30">{sub.userId ? sub.userId.substring(0, 12) + '...' : '—'}</td>
                              </tr>
                            ))}
                            {analyticsData.sales.lastSubscriptions.length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center py-6 text-white/20">لا توجد اشتراكات مفعّلة مؤخراً</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 5: EMAIL LOGS & SECTION 6: SYSTEM HEALTH */}
                  <div className="grid lg:grid-cols-2 gap-6">
                    {/* Emails Analytics */}
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                      <h3 className="text-lg font-black text-white mb-4">تحليلات رسائل البريد الإلكتروني (Logs)</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl">
                          <span className="text-xs text-white/30">إجمالي رسائل البريد</span>
                          <p className="text-xl font-black text-white mt-2 font-mono">{analyticsData.emails.totalEmails}</p>
                        </div>
                        <div className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-2xl">
                          <span className="text-xs text-white/30">إيميلات فريدة</span>
                          <p className="text-xl font-black text-[#fbbf24] mt-2 font-mono">{analyticsData.emails.uniqueEmailsCount}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-white/60">تفعيل حسابات (Signup Verifications)</span>
                          <span className="text-white/40 font-mono">{analyticsData.emails.signupCount} إيميل</span>
                        </div>
                        <div className="w-full bg-white/[0.02] h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-l from-blue-400 to-indigo-500" style={{ width: `${(analyticsData.emails.signupCount / (analyticsData.emails.totalEmails || 1)) * 100}%` }} />
                        </div>

                        <div className="flex justify-between items-center text-xs font-bold pt-1">
                          <span className="text-white/60">استعادة كلمة المرور (Password Reset)</span>
                          <span className="text-white/40 font-mono">{analyticsData.emails.resetCount} إيميل</span>
                        </div>
                        <div className="w-full bg-white/[0.02] h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-l from-pink-400 to-rose-500" style={{ width: `${(analyticsData.emails.resetCount / (analyticsData.emails.totalEmails || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* System Health */}
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                      <h3 className="text-lg font-black text-white mb-4">صحة النظام والأداء الفني</h3>
                      
                      <div className="space-y-4">
                        {/* Status elements */}
                        {[
                          { label: 'قاعدة بيانات Firestore Cloud', status: 'يعمل بكفاءة', color: 'text-emerald-400', dot: 'bg-emerald-500' },
                          { label: 'خادم الذكاء الاصطناعي (Chatbot API)', status: 'نشط ومتصل', color: 'text-emerald-400', dot: 'bg-emerald-500' },
                          { label: 'خدمة إشعارات Push Notifications', status: 'جاهز للإرسال', color: 'text-[#fbbf24]', dot: 'bg-[#fbbf24]' },
                        ].map((sys, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white/[0.01] border border-white/[0.02] p-3 rounded-xl">
                            <span className="text-xs font-bold text-white/80">{sys.label}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black ${sys.color}`}>{sys.status}</span>
                              <div className={`w-2 h-2 ${sys.dot} rounded-full animate-pulse`} />
                            </div>
                          </div>
                        ))}

                        <div className="border-t border-white/5 pt-4 mt-2 space-y-2 text-xs font-bold">
                          <div className="flex justify-between">
                            <span className="text-white/40">مشتركين الإشعارات (FCM Token)</span>
                            <span className="text-white/70">{analyticsData.health.pushSubscribers} مستخدم ({analyticsData.health.pushPercentage}%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/40">حسابات بدون رمز دفع إشعارات</span>
                            <span className="text-white/70">{analyticsData.health.missingFcmTokenCount} جهاز</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========== MODERATION TAB ========== */}
          {activeTab === 'moderation' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-black text-white/90">رقابة المنشورات والتعليقات</h2>
                  <p className="text-sm text-white/30 font-bold mt-1">مراجعة المنشورات التي تم الإبلاغ عنها أو حظرها تلقائياً.</p>
                </div>
                <button onClick={fetchReportedPosts} className={BTN_GHOST}>تحديث</button>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2.5 bg-white/[0.02] border border-white/5 p-2.5 rounded-2xl">
                <button
                  onClick={() => setModerationFilter('all')}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                    moderationFilter === 'all'
                      ? 'bg-white text-black shadow-lg scale-102'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  الكل ({reportedPosts.length})
                </button>
                <button
                  onClick={() => setModerationFilter('reported')}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                    moderationFilter === 'reported'
                      ? 'bg-rose-500 text-black shadow-lg scale-102'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  مبلغ عنها ({reportedPosts.filter(p => (p.reportsCount || 0) > 0).length})
                </button>
                <button
                  onClick={() => setModerationFilter('blocked')}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                    moderationFilter === 'blocked'
                      ? 'bg-[#fbbf24] text-black shadow-lg scale-102'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  محجوبة تلقائياً ({reportedPosts.filter(p => p.isBlocked).length})
                </button>
              </div>

              {isModerationLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-[#fbbf24]" />
                  <span className="mr-3 text-sm text-white/40 font-bold">جاري تحميل البلاغات...</span>
                </div>
              ) : (
                <div className="grid gap-6">
                  {(() => {
                    const filtered = reportedPosts.filter(p => {
                      if (moderationFilter === 'reported') return (p.reportsCount || 0) > 0;
                      if (moderationFilter === 'blocked') return p.isBlocked;
                      return true; // all
                    });

                    if (filtered.length === 0) {
                      return (
                        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-16 text-center text-white/30 font-bold">
                          {moderationFilter === 'reported' 
                            ? "لا توجد منشورات مبلغ عنها حالياً." 
                            : moderationFilter === 'blocked' 
                              ? "لا توجد منشورات محجوبة تلقائياً حالياً." 
                              : "لا توجد منشورات في قاعدة البيانات حالياً."}
                        </div>
                      );
                    }

                    return filtered.map(post => (
                      <div key={post.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                              {post.userAvatar ? (
                                <img src={post.userAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <UserCircle className="w-8 h-8" />
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-black text-sm">{post.userName}</p>
                              <p className="text-[10px] text-white/30">@{post.userId}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-black text-red-400">
                              البلاغات: {post.reportsCount || 0}
                            </span>
                            {post.autoFlagged && (
                              <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-black text-amber-400">
                                فلترة تلقائية ⚠️
                              </span>
                            )}
                            {post.isBlocked && !post.autoFlagged && (
                              <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-black text-rose-400">
                                محظور تلقائياً 🚫
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl text-right">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                          {post.category && (
                            <span className="inline-block mt-3 text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-md">
                              التصنيف: {post.category}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAdminDismissReports(post.id)}
                              className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-black transition hover:opacity-90"
                            >
                              إبقاء وتثبيت المنشور ✅
                            </button>
                            <button
                              onClick={() => handleAdminToggleBlockPost(post.id, post.isBlocked || false)}
                              className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                                post.isBlocked
                                  ? 'bg-[#fbbf24] text-black'
                                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white'
                              }`}
                            >
                              {post.isBlocked ? 'إلغاء الحظر 🔓' : 'حظر المنشور 🚫'}
                            </button>
                            <button
                              onClick={() => handleAdminDeletePost(post.id)}
                              className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs font-black text-red-400 transition hover:bg-red-500 hover:text-white"
                            >
                              حذف نهائي 🗑️
                            </button>
                          </div>

                          <button
                            onClick={() => handleLoadCommentsForModeration(post.id)}
                            className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-white/60 hover:bg-white/10"
                          >
                            عرض التعليقات ({post.commentsCount || 0}) 💬
                          </button>
                        </div>

                        {/* Comments moderation sub-section */}
                        {moderatingPostId === post.id && (
                          <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <span className="text-xs text-white/40">إدارة تعليقات هذا المنشور</span>
                              <button
                                onClick={() => { setModeratingPostId(null); setModeratingComments([]); }}
                                className="text-xs text-white/30 hover:text-white"
                              >
                                إغلاق ✖
                              </button>
                            </div>

                            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                              {moderatingComments.length === 0 ? (
                                <p className="text-xs text-white/20 text-center py-4">لا توجد تعليقات</p>
                              ) : (
                                moderatingComments.map(comment => (
                                  <div key={comment.id} className="flex items-start justify-between gap-3 bg-white/[0.01] p-3 rounded-lg border border-white/[0.02] animate-in fade-in slide-in-from-bottom-1 duration-200">
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        onClick={() => handleAdminDeleteComment(post.id, comment.id)}
                                        className="text-red-400 hover:text-red-500 p-1.5 rounded-md hover:bg-white/5"
                                        title="حذف التعليق"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                      {comment.isBlocked && (
                                        <button
                                          onClick={() => handleAdminApproveComment(post.id, comment.id)}
                                          className="text-emerald-400 hover:text-emerald-500 p-1.5 rounded-md hover:bg-white/5"
                                          title="اعتماد التعليق"
                                        >
                                          <CheckCircle className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                    
                                    <div className="flex-1 text-right min-w-0">
                                      <p className="text-[10px] text-white/40 flex items-center gap-2 justify-end">
                                        {comment.isBlocked && (
                                          <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-full font-bold">
                                            حظر تلقائي ⚠️
                                          </span>
                                        )}
                                        <span>{comment.isAnonymous ? 'مجهول' : comment.userName}</span>
                                      </p>
                                      <p className="text-xs mt-1 text-white/80 break-words">{comment.content}</p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              )}
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
                      <th className="p-5">تاريخ التسجيل</th>
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
                        <td className="p-5 text-xs text-white/40">{u.createdAt ? new Date(u.createdAt.toDate ? u.createdAt.toDate() : u.createdAt).toLocaleString('ar-EG') : '---'}</td>
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
