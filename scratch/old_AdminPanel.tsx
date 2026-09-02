"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { LayoutDashboard, BellRing, Activity, UserCircle, CreditCard, Swords, Settings, GalleryHorizontalEnd, BarChart3, History, HeadphonesIcon, Megaphone, AlertCircle, BookOpen, FlaskConical, Package, ShieldCheck, Loader2, X, MenuIcon, Users, UserCheck, Mail, TrendingUp, RefreshCw, Bell, Trophy, Ban, CheckCircle, Phone, AlertTriangle, Trash2, Copy, KeyRound, MessageSquare, Sparkles, Volume2, Play, Pause, Database, SkipForward, Image as ImageIcon, Video, Plus } from "lucide-react";
import { gsap } from "gsap";
import dynamic from "next/dynamic";
import Link from "next/link";
import surahsData from "@/data/surahs.json";
import { auth, db, initFirebase } from "@/lib/firebase";
import {
  collection, getDocs, doc, getDoc, updateDoc, writeBatch,
  query, orderBy, addDoc, serverTimestamp, deleteDoc, setDoc, deleteField, limit, increment
} from "firebase/firestore";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { checkAndAwardBadges } from "@/lib/badges";
import { RECITERS } from "@/data/reciters";
import TasksManagerPanel from "./admin/tasks/TasksManagerPanel";
import { PushNotificationSender } from "./admin/tasks/PushNotificationSender";

const SocialManagerPanel = dynamic(() => import("./admin/social/SocialManagerPanel"), { ssr: false });


const ADMIN_EMAIL = "youssefosama@gmail.com";

const NAV_ITEMS = [
  { id: 'stats', label: 'الإحصائيات', icon: LayoutDashboard },
  { id: 'backgrounds', label: 'الخلفيات السحابية 🖼️', icon: ImageIcon, isLink: true, href: '/admin/backgrounds' },
  { id: 'push', label: 'الإشعارات', icon: BellRing },
  { id: 'performance', label: 'الأداء', icon: Activity },
  { id: 'reciters', label: 'مراجعة القراء 🎙️', icon: Volume2 },
  { id: 'users', label: 'المستخدمين', icon: UserCircle },
  { id: 'subs', label: 'الاشتراكات', icon: CreditCard },
  { id: 'chatbot', label: 'تحليلات الشات بوت', icon: MessageSquare },
  { id: 'quests', label: 'المهام', icon: Swords },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
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
  { id: 'tiktok', label: 'إدارة تيك توك 📱', icon: Video },
  { id: 'tests', label: 'اختبارات التشخيص 🧪', icon: ShieldCheck },
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

const STAT_CARD_CLASS = "admin-stagger-card rounded-2xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)] p-5 text-center hover:border-white/[0.12] transition cursor-default";
const CARD_CLASS = "admin-stagger-card rounded-2xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)] p-5";
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
    priceStarter: 100, priceSupporter: 200, pricePremium: 250,
    cooldownFree: 30, cooldownStarter: 15, cooldownSupporter: 10, cooldownPremium: 5
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
    downloadUrl: "https://yaqeenalquran.online/download",
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
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [selectedTicketUser, setSelectedTicketUser] = useState<any | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [chatbotLogs, setChatbotLogs] = useState<any[]>([]);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);
  const [selectedUserChat, setSelectedUserChat] = useState<any[] | null>(null);
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingCampaigns, setIsSavingCampaigns] = useState(false);
  const [isSavingFlags, setIsSavingFlags] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);
  const [isSavingRenderConfig, setIsSavingRenderConfig] = useState(false);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);

  const [renderConfig, setRenderConfig] = useState<{
    enabled: boolean;
    message: string;
    reason: string;
    allowPlans: string[];
  }>({
    enabled: true,
    message: "السيرفر تحت الصيانة حالياً لترقية وتحسين خوادم المعالجة السحابية. يرجى المحاولة مرة أخرى لاحقاً.",
    reason: "maintenance",
    allowPlans: ["free", "starter", "supporter", "premium"]
  });
  const [videoRendersSearch, setVideoRendersSearch] = useState("");
  const [videoRendersStatusFilter, setVideoRendersStatusFilter] = useState("all");
  const [userPlanSelection, setUserPlanSelection] = useState<Record<string, string>>({});
  const [showBannedOnly, setShowBannedOnly] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("stats");
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsSubTab, setAnalyticsSubTab] = useState<string>("overview");


  // Reciter Diagnostic States
  const [reciterSearch, setReciterSearch] = useState("");
  const [reciterStatuses, setReciterStatuses] = useState<Record<string, { status: 'success' | 'error' | 'checking' | 'idle'; code?: number; error?: string }>>({});
  const [reciterAudioPlaying, setReciterAudioPlaying] = useState<string | null>(null);
  const [reciterFixing, setReciterFixing] = useState(false);
  const [reciterFixResult, setReciterFixResult] = useState<string | null>(null);
  const [reciterCheckingAll, setReciterCheckingAll] = useState(false);
  const reciterAudioRef = useRef<HTMLAudioElement | null>(null);

  // Diagnostics States
  const [diagRunning, setDiagRunning] = useState(false);
  const [dbStatus, setDbStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [dbMessage, setDbMessage] = useState('');
  const [authStatus, setAuthStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [authMessage, setAuthMessage] = useState('');
  const [pexelsStatus, setPexelsStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [pexelsMessage, setPexelsMessage] = useState('');
  const [renderServerStatus, setRenderServerStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [renderServerMessage, setRenderServerMessage] = useState('');
  const [envStatus, setEnvStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [envMessage, setEnvMessage] = useState('');

  const checkDbDiagnostic = async () => {
    setDbStatus('checking');
    setDbMessage('جاري الاتصال بـ Firestore...');
    try {
      if (!db) throw new Error("قاعدة بيانات Firebase غير مهيأة");
      const usersSnapshot = await getDocs(query(collection(db, "users")));
      setDbStatus('success');
      setDbMessage(`تم الاتصال بنجاح! تم العثور على ${usersSnapshot.size} مستخدم.`);
    } catch (e: any) {
      setDbStatus('error');
      setDbMessage(`فشل الاتصال: ${e.message}`);
    }
  };

  const checkAuthDiagnostic = async () => {
    setAuthStatus('checking');
    setAuthMessage('جاري التحقق من صلاحيات المشرف...');
    try {
      const user = auth?.currentUser;
      if (!user) throw new Error("لا يوجد مستخدم مسجل حالياً");
      setAuthStatus('success');
      setAuthMessage(`مسجل كـ ${user.email} (UID: ${user.uid})`);
    } catch (e: any) {
      setAuthStatus('error');
      setAuthMessage(`خطأ في التحقق: ${e.message}`);
    }
  };

  const checkPexelsDiagnostic = async () => {
    setPexelsStatus('checking');
    setPexelsMessage('جاري اختبار البحث في Pexels API...');
    try {
      const res = await fetch("/api/pexels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "islamic", per_page: 1, type: "both" })
      });
      const data = await res.json();
      if (res.ok && data.items) {
        setPexelsStatus('success');
        setPexelsMessage(`متصل بنجاح! تم استرجاع ${data.items.length} خلفية من البحث.`);
      } else {
        throw new Error(data.error || "استجابة غير صالحة من API");
      }
    } catch (e: any) {
      setPexelsStatus('error');
      setPexelsMessage(`فشل الاتصال بـ Pexels: ${e.message}`);
    }
  };

  const checkRenderServerDiagnostic = async () => {
    setRenderServerStatus('checking');
    setRenderServerMessage('جاري الاتصال بسيرفر المونتاج السحابي...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const res = await fetch("https://yousef891238-render-server.hf.space/", {
        signal: controller.signal,
        mode: "cors"
      });
      clearTimeout(timeoutId);
      setRenderServerStatus('success');
      setRenderServerMessage(`سيرفر الفيديو متصل ويعمل بشكل سليم (حالة الاستجابة: ${res.status})`);
    } catch (e: any) {
      setRenderServerStatus('error');
      setRenderServerMessage(`تعذر الاتصال بالسيرفر السحابي للفيديو: ${e.message}`);
    }
  };

  const checkEnvDiagnostic = async () => {
    setEnvStatus('checking');
    setEnvMessage('جاري فحص متغيرات البيئة والتخزين...');
    try {
      const checks = [];
      if (typeof window !== 'undefined') {
        localStorage.setItem('__diag_test__', '1');
        localStorage.removeItem('__diag_test__');
        checks.push("localStorage سليم");
      }
      const missingEnv = [];
      if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missingEnv.push("Firebase API Key");
      if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) missingEnv.push("Firebase Auth Domain");
      if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missingEnv.push("Firebase Project ID");

      setEnvStatus('success');
      if (missingEnv.length > 0) {
        setEnvMessage(`${checks.join(' | ')} - متصل باستخدام الإعدادات المدمجة بالتطبيق.`);
      } else {
        setEnvMessage(`${checks.join(' | ')} - تم التحقق من متغيرات البيئة الأساسية بنجاح.`);
      }
    } catch (e: any) {
      setEnvStatus('error');
      setEnvMessage(`خطأ في تشخيص التخزين/البيئة: ${e.message}`);
    }
  };

  const runAllDiagnostics = async () => {
    if (diagRunning) return;
    setDiagRunning(true);
    await Promise.all([
      checkDbDiagnostic(),
      checkAuthDiagnostic(),
      checkPexelsDiagnostic(),
      checkRenderServerDiagnostic(),
      checkEnvDiagnostic()
    ]);
    setDiagRunning(false);
  };

  useEffect(() => {
    return () => {
      if (reciterAudioRef.current) {
        reciterAudioRef.current.pause();
      }
    };
  }, []);

  const handleFixReciters = async () => {
    if (!window.confirm("هل أنت متأكد من تشغيل أداة إصلاح بيانات القراء؟ سيقوم هذا بحذف التكرارات وتصحيح المسميات وإضافة النسخ المجودة والمرتلة لشيوخ المنشاوي وعبدالباسط والحصري.")) return;
    setReciterFixing(true);
    setReciterFixResult(null);
    try {
      const res = await fetch("/api/admin/fix-reciters");
      const data = await res.json();
      if (data.success) {
        if (data.readOnly) {
          setReciterFixResult(`⚠️ بيئة قراءة فقط (Vercel): تم تجميع البيانات بنجاح ولكن لم يتم تعديل الملف البرمجي. يرجى تشغيل الأداة محلياً (Localhost) وتحديث الملف ثم رفعه إلى GitHub.`);
          alert("⚠️ تم تشغيل الأداة في الذاكرة بنجاح (بيئة Vercel للقراءة فقط).\n\nلتثبيت التحديثات بشكل دائم على الموقع، يرجى فتح المشروع وتشغيل الأداة محلياً على جهازك ثم عمل git push.");
        } else {
          setReciterFixResult(`✅ تم الإصلاح بنجاح! العدد الأصلي: ${data.originalCount}، العدد النهائي: ${data.fixedCount}`);
          alert("✅ تم إصلاح وتحديث بيانات القراء بنجاح! يرجى إعادة تحميل الصفحة لرؤية التحديثات.");
        }
      } else {
        setReciterFixResult(`❌ فشل الإصلاح: ${data.error || 'خطأ غير معروف'}`);
      }
    } catch (e: any) {
      setReciterFixResult(`❌ خطأ في الاتصال: ${e.message}`);
    } finally {
      setReciterFixing(false);
    }
  };

  const checkSingleReciter = async (reciter: any) => {
    let server = reciter.mp3quranServer;
    if (!server.startsWith("http://") && !server.startsWith("https://")) {
      server = `https://${server}`;
    }
    if (server.endsWith("/")) {
      server = server.slice(0, -1);
    }
    const audioUrl = `${server}/001.mp3`;

    setReciterStatuses(prev => ({ ...prev, [reciter.id]: { status: 'checking' } }));

    try {
      const res = await fetch(`/api/admin/check-audio?url=${encodeURIComponent(audioUrl)}`);
      const data = await res.json();
      if (data.ok) {
        setReciterStatuses(prev => ({ ...prev, [reciter.id]: { status: 'success', code: data.status } }));
      } else {
        setReciterStatuses(prev => ({ ...prev, [reciter.id]: { status: 'error', code: data.status, error: data.error || "خطأ في تشغيل الصوت" } }));
      }
    } catch (e: any) {
      setReciterStatuses(prev => ({ ...prev, [reciter.id]: { status: 'error', error: e.message } }));
    }
  };

  const handleCheckAllReciters = async () => {
    if (reciterCheckingAll) return;
    setReciterCheckingAll(true);
    const list = RECITERS;
    for (const r of list) {
      await checkSingleReciter(r);
    }
    setReciterCheckingAll(false);
  };

  const togglePlayReciterAudio = (reciter: any) => {
    let server = reciter.mp3quranServer;
    if (!server.startsWith("http://") && !server.startsWith("https://")) {
      server = `https://${server}`;
    }
    if (server.endsWith("/")) {
      server = server.slice(0, -1);
    }
    const audioUrl = `${server}/001.mp3`;

    if (reciterAudioPlaying === reciter.id) {
      if (reciterAudioRef.current) {
        reciterAudioRef.current.pause();
      }
      setReciterAudioPlaying(null);
    } else {
      if (reciterAudioRef.current) {
        reciterAudioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      reciterAudioRef.current = audio;
      setReciterAudioPlaying(reciter.id);
      audio.play().catch(err => {
        console.error("Playback error:", err);
        setReciterAudioPlaying(null);
        alert("فشل تشغيل الصوت: تأكد من رابط السيرفر أو اتصال الإنترنت.");
      });
      audio.onended = () => {
        setReciterAudioPlaying(null);
      };
    }
  };

  // States for adding a new reciter
  const [newReciterName, setNewReciterName] = useState("");
  const [newReciterServer, setNewReciterServer] = useState("");
  const [newReciterEveryAyah, setNewReciterEveryAyah] = useState("");
  const [newReciterCustomId, setNewReciterCustomId] = useState("");
  const [isAddingReciter, setIsAddingReciter] = useState(false);
  const [addReciterResult, setAddReciterResult] = useState<string | null>(null);

  const handleAddReciter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReciterName.trim() || !newReciterServer.trim()) {
      alert("يرجى ملء اسم القارئ ورابط خادم الصوت");
      return;
    }
    setIsAddingReciter(true);
    setAddReciterResult(null);
    try {
      const res = await fetch("/api/admin/add-reciter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newReciterName.trim(),
          mp3quranServer: newReciterServer.trim(),
          everyAyahFolder: newReciterEveryAyah.trim() || undefined,
          customId: newReciterCustomId.trim() || undefined,
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.readOnly) {
          setAddReciterResult(`⚠️ تم الإضافة في الذاكرة ولكن لم يتم الحفظ على القرص (بيئة Vercel للقراءة فقط). يرجى إجراء ذلك محلياً.`);
          alert("⚠️ تم إضافة القارئ مؤقتاً في الذاكرة!\n\nلحفظه بشكل دائم في الكود ومشاركتها مع الجميع، يرجى تشغيل المشروع محلياً وإضافته من هناك ثم عمل git push.");
        } else {
          setAddReciterResult(`✅ تم إضافة القارئ "${data.reciter.name}" بنجاح!`);
          alert("✅ تم إضافة القارئ بنجاح وتحديث ملف القراء! يرجى إعادة تحميل الصفحة لرؤية التحديثات.");
        }
        // Clear fields
        setNewReciterName("");
        setNewReciterServer("");
        setNewReciterEveryAyah("");
        setNewReciterCustomId("");
      } else {
        setAddReciterResult(`❌ فشل الإضافة: ${data.error || 'خطأ غير معروف'}`);
      }
    } catch (err: any) {
      setAddReciterResult(`❌ خطأ في الاتصال: ${err.message}`);
    } finally {
      setIsAddingReciter(false);
    }
  };

  const normalizeReciterText = (text: string) => {
    if (!text) return "";
    return text.toLowerCase()
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[ؤئ]/g, "ء")
      .replace(/[ًٌٍَُِّْ]/g, "")
      .replace(/\s+/g, "")
      .trim();
  };

  const filteredReciters = useMemo(() => {
    const s = normalizeReciterText(reciterSearch);
    if (!s) return RECITERS;
    return RECITERS.filter(r =>
      normalizeReciterText(r.name).includes(s) ||
      r.id.toLowerCase().includes(s)
    );
  }, [reciterSearch]);

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
          const email = user?.email?.toLowerCase() || "";
          // Removed displayName check
          if (user && (
            email === "youssefosama@gmail.com" ||
            email === "youssef@yaqeen.app" ||
            email.includes("youssef")
            // no-op
          )) {
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
      users: async () => { },
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
      tiktok: async () => {},
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

  // Trigger card stagger animation when admin becomes logged in
  useEffect(() => {
    if (isAdmin) {
      gsap.fromTo(
        ".admin-stagger-card",
        { y: 35, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power2.out", stagger: 0.05, clearProps: "all" }
      );
    }
  }, [isAdmin]);

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

      // Load current rendering controls config
      await fetchRenderConfig();

      const [
        usersSnap,
        emailLogsSnap,
        chatbotLogsSnap,
        subsSnap,
        ticketsSnap,
        postsSnap,
        friendshipsSnap,
        duelsSnap,
        showcaseSnap
      ] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "emailLogs")),
        getDocs(collection(db, "chatbot_logs")),
        getDocs(collection(db, "subscription_requests")),
        getDocs(collection(db, "support_tickets")),
        getDocs(collection(db, "posts")),
        getDocs(collection(db, "friendships")),
        getDocs(collection(db, "duels")),
        getDocs(collection(db, "showcase"))
      ]);

      let videoRendersList: any[] = [];
      try {
        const vrSnap = await getDocs(query(collection(db, "video_renders"), orderBy("createdAt", "desc"), limit(1000)));
        videoRendersList = vrSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      } catch (err) {
        console.warn("Index query for video_renders failed, falling back to unordered query:", err);
        try {
          const vrSnap = await getDocs(query(collection(db, "video_renders"), limit(1000)));
          videoRendersList = vrSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
          videoRendersList.sort((a, b) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0);
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0);
            return timeB - timeA;
          });
        } catch (err2) {
          console.error("Failed to load video renders:", err2);
        }
      }

      const usersList = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() as any }));
      const emailLogsList = emailLogsSnap.docs.map(d => d.data() as any);
      const chatbotLogsList = chatbotLogsSnap.docs.map(d => d.data() as any);
      const subsList = subsSnap.docs.map(d => d.data() as any);
      const ticketsList = ticketsSnap.docs.map(d => d.data() as any);
      const postsList = postsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      const friendshipsList = friendshipsSnap.docs.map(d => d.data() as any);
      const duelsList = duelsSnap.docs.map(d => d.data() as any);
      const showcaseList = showcaseSnap.docs.map(d => d.data() as any);

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

      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
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
        .sort((a, b) => {
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

      // --- 7. Quran Reading Stats ---
      const totalQuranPoints = usersList.reduce((acc, u) => acc + (u.quranPoints || 0), 0);
      const totalAyahsRead = usersList.reduce((acc, u) => acc + (u.readAyahs || 0), 0);
      const activeQuranReaders = usersList.filter(u => (u.readAyahs || 0) > 0 || (u.quranPoints || 0) > 0).length;
      const avgAyahsReadPerUser = activeQuranReaders > 0 ? (totalAyahsRead / activeQuranReaders).toFixed(1) : "0.0";
      const activeCustomPlans = usersList.filter(u => u.activeQuranPlan).length;

      // --- 8. Quran Listening Stats ---
      const totalListenPoints = usersList.reduce((acc, u) => acc + (u.listenPoints || 0), 0);
      const totalListeningSeconds = usersList.reduce((acc, u) => acc + (u.audioSeconds || 0), 0);
      const activeListeners = usersList.filter(u => (u.audioSeconds || 0) > 0 || (u.listenPoints || 0) > 0).length;
      const avgListeningMinutesPerUser = activeListeners > 0 ? Math.round(totalListeningSeconds / activeListeners / 60) : 0;

      // --- 9. Dhikr & Tasbeeh Stats ---
      const totalAthkarPoints = usersList.reduce((acc, u) => acc + (u.athkarPoints || 0), 0);
      const totalIstighfarPoints = usersList.reduce((acc, u) => acc + (u.istighfarPoints || 0), 0);
      const totalSalawatPoints = usersList.reduce((acc, u) => acc + (u.salawatPoints || 0), 0);
      const activeDhikrUsers = usersList.filter(u => (u.athkarPoints || 0) > 0 || (u.istighfarPoints || 0) > 0 || (u.salawatPoints || 0) > 0).length;
      const estimatedSebhaClicks = Math.round(totalAthkarPoints * 33);
      const grandTotalDhikrActions = totalIstighfarPoints + totalSalawatPoints + estimatedSebhaClicks;

      // --- 10. Video Studio Stats ---
      const totalVideoPoints = usersList.reduce((acc, u) => acc + (u.videoPoints || 0), 0);
      const totalVideosRendered = usersList.reduce((acc, u) => acc + (u.videoRendersCount || 0), 0);
      const activeCreators = usersList.filter(u => (u.videoRendersCount || 0) > 0 || (u.videoPoints || 0) > 0).length;
      const totalShowcaseVideos = showcaseList.length;

      // Advanced Video Renders Stats
      const vrTotal = videoRendersList.length;
      const vrSuccessful = videoRendersList.filter(j => j.status === "completed").length;
      const vrFailed = videoRendersList.filter(j => j.status === "failed").length;
      const vrActive = videoRendersList.filter(j => j.status === "rendering" || j.status === "processing" || j.status === "merging").length;
      const vrSuccessRate = vrTotal > 0 ? Math.round((vrSuccessful / vrTotal) * 100) : 100;

      const vrSuccessfulList = videoRendersList.filter(j => j.status === "completed");
      const vrAvgTime = vrSuccessfulList.length > 0
        ? Math.round(vrSuccessfulList.reduce((sum, j) => sum + (j.renderTime || 0), 0) / vrSuccessfulList.length)
        : 0;

      const vrReciters: Record<string, number> = {};
      const vrTemplates: Record<string, number> = {};
      const vrPlans: Record<string, number> = {};
      let vrVideoBg = 0;
      let vrImageBg = 0;

      videoRendersList.forEach(j => {
        const rec = j.reciterName || "غير معروف";
        vrReciters[rec] = (vrReciters[rec] || 0) + 1;

        const temp = j.videoTemplate === "minshawi_player" ? "تصميم زياد (المنشاوي)" : (j.videoTemplate === "dossary_player" ? "تصميم 2 (الدوسري)" : (j.videoTemplate === "youssef_player" ? "تصميم يوسف" : "التصميم الافتراضي"));
        vrTemplates[temp] = (vrTemplates[temp] || 0) + 1;

        const p = j.userPlan || "free";
        vrPlans[p] = (vrPlans[p] || 0) + 1;

        if (j.isVideoBg) vrVideoBg++;
        else vrImageBg++;
      });

      // --- 11. Engagement & Streaks ---
      const totalStreak = usersList.reduce((acc, u) => acc + (u.streak || 0), 0);
      const maxStreak = Math.max(...usersList.map(u => u.streak || 0), 0);
      const usersWithStreak = usersList.filter(u => (u.streak || 0) > 0).length;
      const avgStreak = usersWithStreak > 0 ? (totalStreak / usersWithStreak).toFixed(1) : "0.0";

      // --- 12. Social Feed (Community) Stats ---
      const totalPosts = postsList.length;
      const totalPostLikes = postsList.reduce((acc, p) => acc + (p.likesCount || 0), 0);
      const totalPostComments = postsList.reduce((acc, p) => acc + (p.commentsCount || 0), 0);
      const reportedPostsCount = postsList.filter(p => (p.reportsCount || 0) > 0).length;
      const blockedPostsCount = postsList.filter(p => p.isBlocked).length;

      // --- 13. Worship Duels & Friends Network ---
      const totalDuels = duelsList.length;
      const activeDuels = duelsList.filter(d => d.status === "active" || d.status === "pending").length;
      const completedDuels = duelsList.filter(d => d.status === "completed").length;
      const totalFriendships = friendshipsList.length;
      const avgFriendsPerUser = usersList.length > 0 ? ((totalFriendships * 2) / usersList.length).toFixed(1) : "0.0";

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
        },
        featuresBreakdown: {
          quran: {
            totalQuranPoints,
            totalAyahsRead,
            activeQuranReaders,
            avgAyahsReadPerUser,
            activeCustomPlans
          },
          listen: {
            totalListenPoints,
            totalListeningSeconds,
            activeListeners,
            avgListeningMinutesPerUser
          },
          dhikr: {
            totalAthkarPoints,
            totalIstighfarPoints,
            totalSalawatPoints,
            activeDhikrUsers,
            estimatedSebhaClicks,
            grandTotalDhikrActions
          },
          video: {
            totalVideoPoints,
            totalVideosRendered,
            activeCreators,
            totalShowcaseVideos,
            videoRendersList,
            vrStats: {
              total: vrTotal,
              successful: vrSuccessful,
              failed: vrFailed,
              active: vrActive,
              successRate: vrSuccessRate,
              avgTime: vrAvgTime,
              reciters: vrReciters,
              templates: vrTemplates,
              plans: vrPlans,
              videoBgCount: vrVideoBg,
              imageBgCount: vrImageBg
            }
          },
          social: {
            totalPosts,
            totalPostLikes,
            totalPostComments,
            reportedPostsCount,
            blockedPostsCount
          },
          duels: {
            totalDuels,
            activeDuels,
            completedDuels,
            totalFriendships,
            avgFriendsPerUser
          },
          engagement: {
            totalStreak,
            maxStreak,
            avgStreak
          }
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
      const snapshot = await getDocs(collection(db, "chatbot_logs"));
      const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() as any }));
      // Sort client-side to prevent Firestore query failures if timestamp index is missing
      logs.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || 0).getTime();
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
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

  const fetchRenderConfig = async () => {
    if (!db) return;
    try {
      const s = await getDoc(doc(db, "settings", "render_config"));
      if (s.exists()) {
        const cData = s.data();
        setRenderConfig({
          enabled: cData.enabled ?? true,
          message: cData.message ?? "",
          reason: cData.reason ?? "maintenance",
          allowPlans: cData.allowPlans ?? ["free", "starter", "supporter", "premium"]
        });
      }
    } catch (e) {
      console.error("Failed to fetch render config:", e);
    }
  };

  const handleSaveRenderConfig = async () => {
    if (!db) return;
    setIsSavingRenderConfig(true);
    try {
      await setDoc(doc(db, "settings", "render_config"), {
        ...renderConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("✅ تم حفظ إعدادات رندر الفيديوهات بنجاح!");
    } catch (e) {
      console.error(e);
      alert("فشل الحفظ: يرجى التحقق من اتصال الإنترنت.");
    } finally {
      setIsSavingRenderConfig(false);
    }
  };

  const togglePlanInConfig = (plan: string) => {
    setRenderConfig(prev => {
      const plans = prev.allowPlans.includes(plan)
        ? prev.allowPlans.filter(p => p !== plan)
        : [...prev.allowPlans, plan];
      return { ...prev, allowPlans: plans };
    });
  };

  const handleDeleteRenderLog = async (jobId: string) => {
    if (!db || !window.confirm("هل أنت متأكد من حذف هذا السجل نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, "video_renders", jobId));
      alert("✅ تم حذف السجل بنجاح!");
      fetchAnalyticsData();
    } catch (e) {
      console.error(e);
      alert("فشل حذف السجل.");
    }
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
        setPaymentSettings({
          vodafoneCash: d.vodafoneCash || "",
          instapay: d.instapay || "",
          priceStarter: d.priceStarter || 100,
          priceSupporter: d.priceSupporter || 200,
          pricePremium: d.pricePremium || 250,
          cooldownFree: d.cooldownFree !== undefined ? d.cooldownFree : 30,
          cooldownStarter: d.cooldownStarter !== undefined ? d.cooldownStarter : 15,
          cooldownSupporter: d.cooldownSupporter !== undefined ? d.cooldownSupporter : 10,
          cooldownPremium: d.cooldownPremium !== undefined ? d.cooldownPremium : 5
        });
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

  const handleDeleteTicket = async (id: string) => {
    if (!db || !window.confirm("هل أنت متأكد من حذف هذه الشكوى نهائياً؟")) return;
    try { await deleteDoc(doc(db, "support_tickets", id)); fetchSupportTickets(); } catch (e) { console.error(e); }
  };

  const handleOpenTicketDetails = async (ticket: any) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
    setSelectedTicketUser("loading");

    if (ticket.userId && ticket.userId !== "guest" && ticket.userId !== "guest_unknown") {
      const localUser = users.find(u => u.uid === ticket.userId || u.id === ticket.userId);
      if (localUser) {
        setSelectedTicketUser(localUser);
      } else {
        try {
          await initFirebase();
          const docSnap = await getDoc(doc(db, "users", ticket.userId));
          if (docSnap.exists()) {
            setSelectedTicketUser({ uid: ticket.userId, ...docSnap.data() });
          } else {
            setSelectedTicketUser(null);
          }
        } catch (e) {
          console.error("Error fetching ticket user:", e);
          setSelectedTicketUser(null);
        }
      }
    } else {
      setSelectedTicketUser(null);
    }
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
        totalUniqueUsers: 0, activeToday: 0, returningUsers: 0, returningPercent: 0,
        oneTimeUsers: 0, oneTimePercent: 0, politeCount: 0, insultCount: 0,
        insultPercent: 0, politePercent: 0, topQuestions: [], userSessions: {}
      };
    }

    const sessions: Record<string, any> = {};
    let politeCount = 0;
    let insultCount = 0;
    const questionCounts: Record<string, { count: number, original: string }> = {};

    chatbotLogs.forEach(log => {
      const uid = log.userId || log.uid;
      if (!uid) return;

      if (!sessions[uid]) {
        sessions[uid] = {
          userName: log.userName || log.displayName || log.name || "زائر",
          lastActive: log.timestamp,
          messages: []
        };
      }

      const uName = log.userName || log.displayName || log.name;
      if (uName && uName !== "يقين (البوت)" && uName !== "زائر") {
        sessions[uid].userName = uName;
      }

      sessions[uid].messages.push(log);

      if (log.sender === "user") {
        if (log.isInsult) insultCount++;
        else if (log.sentiment === "positive") politeCount++;

        const textVal = log.text || log.message || "";
        let qText = textVal.trim().replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[.,!?()؛؟?"'«»]/g, "").replace(/\s+/g, " ").toLowerCase();

        if (qText.length > 3) {
          if (!questionCounts[qText]) questionCounts[qText] = { count: 0, original: textVal };
          questionCounts[qText].count++;
        }
      }
    });

    Object.values(sessions).forEach(sess => {
      sess.messages.sort((a: any, b: any) => {
        const ta = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp || 0).getTime();
        const tb = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp || 0).getTime();
        return tb - ta;
      });
    });

    const totalUniqueUsers = Object.keys(sessions).length;
    const todayStr = new Date().toISOString().split('T')[0];

    let activeToday = 0;
    let returningUsers = 0;
    let oneTimeUsers = 0;

    Object.values(sessions).forEach(sess => {
      const dates = new Set<string>();
      let hasToday = false;

      sess.messages.forEach((m: any) => {
        if (!m.timestamp) return;
        const dateStr = m.timestamp.toDate ? m.timestamp.toDate().toISOString().split('T')[0] : new Date(m.timestamp).toISOString().split('T')[0];
        dates.add(dateStr);
        if (dateStr === todayStr) hasToday = true;
      });

      if (hasToday) activeToday++;
      if (dates.size > 1 || sess.messages.length > 5) returningUsers++;
      else oneTimeUsers++;
    });

    const totalClassified = politeCount + insultCount || 1;
    const topQuestions = Object.values(questionCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(q => ({ text: q.original, count: q.count }));

    return {
      totalUniqueUsers,
      activeToday,
      returningUsers,
      returningPercent: totalUniqueUsers > 0 ? Math.round((returningUsers / totalUniqueUsers) * 100) : 0,
      oneTimeUsers,
      oneTimePercent: totalUniqueUsers > 0 ? Math.round((oneTimeUsers / totalUniqueUsers) * 100) : 0,
      politeCount,
      insultCount,
      politePercent: Math.round((politeCount / totalClassified) * 100),
      insultPercent: Math.round((insultCount / totalClassified) * 100),
      topQuestions,
      userSessions: sessions
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
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-100 admin-light-mode font-['Tajawal']">
        <style>{`
          .admin-light-mode {
            background-color: #f8fafc !important;
            color: #0f172a !important;
          }
          .admin-light-mode form {
            background-color: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          }
          .admin-light-mode h2 {
            color: #0f172a !important;
          }
          .admin-light-mode p {
            color: #64748b !important;
          }
          .admin-light-mode input {
            background-color: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }
          .admin-light-mode input:focus {
            border-color: #fbbf24 !important;
          }
        `}</style>
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(245,158,11,0.06)_0%,transparent_70%)] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(20,184,166,0.04)_0%,transparent_70%)] rounded-full pointer-events-none" />
        <form onSubmit={handleAdminLogin} className="relative w-full max-w-sm space-y-5 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#fbbf24]/10 flex items-center justify-center border border-[#fbbf24]/20">
            <ShieldCheck className="w-8 h-8 text-[#fbbf24]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black">مركز التحكم</h2>
            <p className="text-xs font-bold">سجل دخول بحساب الإدارة</p>
          </div>
          <div className="space-y-3 text-right">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3.5 rounded-2xl outline-none text-sm text-right" placeholder="البريد الإلكتروني" />
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3.5 rounded-2xl outline-none text-sm text-right" placeholder="كلمة المرور" />
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
    <div className="relative min-h-screen w-full bg-slate-50 text-slate-800 font-arabic overflow-hidden admin-light-mode font-['Tajawal']">
      <style>{`
        /* --- Root Light Mode Overrides --- */
        .admin-light-mode {
          background-color: #f8fafc !important; /* bg-slate-50 */
          color: #0f172a !important; /* text-slate-900 */
        }
        
        /* Sidebar Styling */
        .admin-light-mode aside {
          background-color: #ffffff !important;
          border-left: 1px solid #e2e8f0 !important;
          box-shadow: -2px 0 10px rgba(0, 0, 0, 0.02) !important;
        }
        .admin-light-mode aside * {
          color: #334155 !important;
        }
        .admin-light-mode aside div {
          border-color: #e2e8f0 !important;
        }
        .admin-light-mode aside button:hover {
          background-color: #f1f5f9 !important;
        }
        .admin-light-mode aside button.bg-white\\/5 {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }
        /* Active nav item */
        .admin-light-mode aside button.bg-\\[\\#fbbf24\\]\\/10 {
          background-color: #fbbf24 !important;
          color: #000000 !important;
        }
        .admin-light-mode aside button.bg-\\[\\#fbbf24\\]\\/10 * {
          color: #000000 !important;
        }

        /* Cards & Container Modules */
        .admin-light-mode .admin-stagger-card,
        .admin-light-mode .rounded-2xl,
        .admin-light-mode .rounded-3xl,
        .admin-light-mode .bg-\\[rgba\\(255\\,255\\,255\\,0\\.02\\)\\] {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          color: #1e293b !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05) !important;
        }

        /* Sub-tab navigation bar */
        .admin-light-mode .bg-white\\/\\[0\\.02\\] {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
        }
        .admin-light-mode .bg-white\\/\\[0\\.02\\] button {
          color: #475569 !important;
        }
        .admin-light-mode .bg-white\\/\\[0\\.02\\] button.bg-\\[\\#fbbf24\\] {
          background-color: #fbbf24 !important;
          color: #000000 !important;
        }

        /* Typographic elements */
        .admin-light-mode h2,
        .admin-light-mode h3,
        .admin-light-mode h4,
        .admin-light-mode th {
          color: #0f172a !important;
        }
        .admin-light-mode p,
        .admin-light-mode span,
        .admin-light-mode td,
        .admin-light-mode label {
          color: #334155 !important;
        }
        .admin-light-mode .text-white,
        .admin-light-mode .text-white\\/90,
        .admin-light-mode .text-white\\/80,
        .admin-light-mode .text-white\\/70,
        .admin-light-mode .text-white\\/60 {
          color: #1e293b !important;
        }
        .admin-light-mode .text-white\\/40,
        .admin-light-mode .text-white\\/30,
        .admin-light-mode .text-white\\/20 {
          color: #64748b !important; /* Slate-500 */
        }
        .admin-light-mode .text-emerald-400 {
          color: #059669 !important; /* Emerald-600 */
        }
        .admin-light-mode .text-red-400 {
          color: #dc2626 !important; /* Red-600 */
        }
        .admin-light-mode .text-sky-400 {
          color: #0284c7 !important; /* Sky-600 */
        }
        .admin-light-mode .text-purple-400 {
          color: #7c3aed !important; /* Purple-600 */
        }

        /* Inputs, selects, and textareas */
        .admin-light-mode input,
        .admin-light-mode textarea,
        .admin-light-mode select {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
        }
        .admin-light-mode input::placeholder,
        .admin-light-mode textarea::placeholder {
          color: #94a3b8 !important;
        }
        .admin-light-mode input:focus,
        .admin-light-mode textarea:focus,
        .admin-light-mode select:focus {
          border-color: #fbbf24 !important;
        }

        /* Specialized card content */
        .admin-light-mode .bg-white\\/\\[0\\.01\\],
        .admin-light-mode .bg-white\\/5 {
          background-color: #f8fafc !important;
          border-color: #e2e8f0 !important;
        }
        .admin-light-mode .border-white\\/5,
        .admin-light-mode .border-white\\/10,
        .admin-light-mode .border-white\\/\\[0\\.06\\],
        .admin-light-mode .border-white\\/\\[0\\.04\\],
        .admin-light-mode .border-white\\/\\[0\\.03\\] {
          border-color: #e2e8f0 !important;
        }
        .admin-light-mode .divide-white\\/5 > :not([hidden]) ~ :not([hidden]) {
          border-color: #e2e8f0 !important;
        }

        /* Tables & Lists */
        .admin-light-mode table {
          background-color: #ffffff !important;
        }
        .admin-light-mode tr:hover {
          background-color: #f8fafc !important;
        }
        .admin-light-mode tr {
          border-color: #e2e8f0 !important;
        }

        /* Modals and overlay dialogs */
        .admin-light-mode .bg-\\[\\#0c0d10\\],
        .admin-light-mode .bg-\\[\\#0d111d\\],
        .admin-light-mode .bg-black\\/80,
        .admin-light-mode .bg-black\\/90 {
          background-color: rgba(255, 255, 255, 0.95) !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }

        /* Badges */
        .admin-light-mode .bg-purple-500\\/5 {
          background-color: #faf5ff !important;
          border-color: #f3e8ff !important;
        }
        .admin-light-mode .bg-\\[\\#fbbf24\\]\\/5 {
          background-color: #fffbeb !important;
          border-color: #fef3c7 !important;
        }
        .admin-light-mode .bg-sky-500\\/5 {
          background-color: #f0f9ff !important;
          border-color: #e0f2fe !important;
        }

        /* SVGs and Icons */
        .admin-light-mode svg {
          color: #64748b !important; /* slate-500 */
        }
        .admin-light-mode button svg,
        .admin-light-mode a svg,
        .admin-light-mode .bg-\\[\\#fbbf24\\] svg,
        .admin-light-mode .text-sky-400 svg,
        .admin-light-mode .text-emerald-400 svg,
        .admin-light-mode .text-red-400 svg,
        .admin-light-mode .text-[#fbbf24] svg {
          color: inherit !important;
        }
      `}</style>
      {/* Main Dashboard Layout */}
      <div className="h-screen w-full flex overflow-hidden">
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
            {NAV_ITEMS.map(tab => {
              const isSelected = activeTab === tab.id;
              const content = (
                <>
                  <tab.icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </>
              );
              const classes = `admin-stagger-card w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isSelected
                  ? 'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/20 shadow-[0_0_20px_rgba(251,191,36,0.05)]'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/[0.03] border border-transparent'
                }`;

              if ('isLink' in tab && tab.isLink) {
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    onClick={() => setSidebarOpen(false)}
                    className={classes}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  className={classes}
                >
                  {content}
                </button>
              );
            })}
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
                {NAV_ITEMS.slice(0, 5).map(tab => {
                  const isSelected = activeTab === tab.id;
                  const classes = `px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap ${isSelected ? 'bg-[#fbbf24]/10 text-[#fbbf24]' : 'text-white/30'
                    }`;

                  if ('isLink' in tab && tab.isLink) {
                    return (
                      <Link key={tab.id} href={tab.href} className={classes}>
                        {tab.label}
                      </Link>
                    );
                  }

                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={classes}>
                      {tab.label}
                    </button>
                  );
                })}
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
                        <th className="p-4">الهاتف</th>
                        <th className="p-4">الشكوى/الرسالة</th>
                        <th className="p-4">التاريخ</th>
                        <th className="p-4">الحالة</th>
                        <th className="p-4 text-left">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {supportTickets.map(ticket => {
                        const ticketDate = ticket.createdAt?.toDate
                          ? ticket.createdAt.toDate().toLocaleString("ar-EG")
                          : (ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("ar-EG") : "غير محدد");

                        const statusClass =
                          ticket.status === 'resolved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ticket.status === 'in_progress'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20';

                        const statusLabel =
                          ticket.status === 'resolved'
                            ? 'تم الحل'
                            : ticket.status === 'in_progress'
                              ? 'قيد المعالجة'
                              : 'جديد';

                        return (
                          <tr
                            key={ticket.id}
                            className="hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={(e) => {
                              if ((e.target as HTMLElement).closest('button')) return;
                              handleOpenTicketDetails(ticket);
                            }}
                          >
                            <td className="p-4 text-sm font-black text-white">{ticket.userName || 'مجهول'}</td>
                            <td className="p-4 text-sm font-mono text-white/70" dir="ltr">{ticket.phone || 'غير محدد'}</td>
                            <td className="p-4 text-xs text-white/80 max-w-sm whitespace-pre-wrap break-words leading-relaxed">{ticket.message || ticket.subject || 'بدون نص'}</td>
                            <td className="p-4 text-xs text-white/40">{ticketDate}</td>
                            <td className="p-4 text-sm">
                              <span className={`inline-block rounded-full px-3 py-1 text-xs font-black ${statusClass}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="p-4 flex flex-wrap gap-2 justify-end items-center">
                              {ticket.status !== 'in_progress' && ticket.status !== 'resolved' && (
                                <button
                                  onClick={() => handleUpdateTicketStatus(ticket.id, 'in_progress')}
                                  className="rounded-xl bg-sky-500 px-3 py-2 text-[10px] font-black text-black hover:brightness-110 active:scale-95 transition-all"
                                >
                                  قيد المعالجة
                                </button>
                              )}
                              {ticket.status !== 'resolved' && (
                                <button
                                  onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                                  className="rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-black text-black hover:brightness-110 active:scale-95 transition-all"
                                >
                                  تم الحل
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteTicket(ticket.id)}
                                className="rounded-xl bg-red-500/10 hover:bg-red-500/20 px-3 py-2 text-red-400 transition hover:scale-105 active:scale-95 flex items-center justify-center"
                                title="حذف الشكوى"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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
                      <label className={LABEL}>تبرع عادي</label>
                      <input type="number" value={paymentSettings.priceStarter} onChange={e => setPaymentSettings({ ...paymentSettings, priceStarter: parseInt(e.target.value) })} className={INPUT_CLASS + " text-center"} />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className={LABEL}>تبرع ذهبي</label>
                      <input type="number" value={paymentSettings.priceSupporter} onChange={e => setPaymentSettings({ ...paymentSettings, priceSupporter: parseInt(e.target.value) })} className={INPUT_CLASS + " text-center"} />
                    </div>
                    <div className="space-y-2 text-right">
                      <label className={LABEL}>تبرع بريميوم</label>
                      <input type="number" value={paymentSettings.pricePremium} onChange={e => setPaymentSettings({ ...paymentSettings, pricePremium: parseInt(e.target.value) })} className={INPUT_CLASS + " text-center"} />
                    </div>
                  </div>

                  <div className="mt-8 border-t border-white/5 pt-6">
                    <h3 className="text-sm font-black text-white/60 mb-4 text-right">فترة الانتظار للرندرة (بالدقائق بين كل فيديو)</h3>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2 text-right">
                        <label className={LABEL}>غير متبرع</label>
                        <input type="number" value={paymentSettings.cooldownFree || 30} onChange={e => setPaymentSettings({ ...paymentSettings, cooldownFree: parseInt(e.target.value) || 0 })} className={INPUT_CLASS + " text-center"} />
                      </div>
                      <div className="space-y-2 text-right">
                        <label className={LABEL}>تبرع عادي</label>
                        <input type="number" value={paymentSettings.cooldownStarter || 15} onChange={e => setPaymentSettings({ ...paymentSettings, cooldownStarter: parseInt(e.target.value) || 0 })} className={INPUT_CLASS + " text-center"} />
                      </div>
                      <div className="space-y-2 text-right">
                        <label className={LABEL}>تبرع ذهبي</label>
                        <input type="number" value={paymentSettings.cooldownSupporter || 10} onChange={e => setPaymentSettings({ ...paymentSettings, cooldownSupporter: parseInt(e.target.value) || 0 })} className={INPUT_CLASS + " text-center"} />
                      </div>
                      <div className="space-y-2 text-right">
                        <label className={LABEL}>تبرع بريميوم</label>
                        <input type="number" value={paymentSettings.cooldownPremium || 5} onChange={e => setPaymentSettings({ ...paymentSettings, cooldownPremium: parseInt(e.target.value) || 0 })} className={INPUT_CLASS + " text-center"} />
                      </div>
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
                      className={`px-4 py-2.5 rounded-xl text-sm font-black transition-all border ${subsFilter === f.id
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
                                    {r.proofLink && (
                                      <a href={r.proofLink} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 hover:underline block text-right truncate max-w-[140px]">📄 ملف إثبات التحويل</a>
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
                                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black whitespace-nowrap ${r.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
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
                                    <span className={`inline-flex rounded-full px-2.5 py-1.5 text-[11px] font-black ${daysLeft > 7 ? 'bg-emerald-500/15 text-emerald-300' :
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
                              <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed shadow-md ${msg.sender === "user"
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
                    <h2 className="text-2xl font-black text-white">لوحة تحليلات "الفائقة" الشاملة 📊</h2>
                    <p className="text-xs text-white/40 mt-1">النظام المتكامل لمراقبة أداء ميزات الموقع، التفاعلات، العبادات، والمبيعات بشكل تفصيلي لحظي</p>
                  </div>
                  <button
                    onClick={fetchAnalyticsData}
                    disabled={isAnalyticsLoading}
                    className="flex items-center gap-2 px-5 py-3 bg-[#fbbf24] text-black font-black rounded-2xl hover:brightness-110 active:scale-95 transition disabled:opacity-50 text-xs"
                  >
                    <RefreshCw className={`w-4 h-4 ${isAnalyticsLoading ? 'animate-spin' : ''}`} />
                    تحديث البيانات الشاملة
                  </button>
                </div>

                {isAnalyticsLoading && (
                  <div className="flex flex-col items-center justify-center py-20 text-white/50">
                    <Loader2 className="w-10 h-10 animate-spin text-[#fbbf24] mb-4" />
                    <p className="text-sm font-bold">جاري تحميل وتجميع تحليلات "الفائقة" من Firestore...</p>
                  </div>
                )}

                {!isAnalyticsLoading && !analyticsData && (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-16 text-center text-white/30">
                    <Activity className="mx-auto mb-4 h-12 w-12 text-white/10" />
                    <p className="text-sm font-bold">يرجى الضغط على زر التحديث لتحميل تحليلات "الفائقة".</p>
                  </div>
                )}

                {!isAnalyticsLoading && analyticsData && (
                  <>
                    {/* Al-Faiqa Sub-tabs navigation bar */}
                    <div className="flex flex-wrap gap-2 bg-white/[0.02] border border-white/5 p-2 rounded-2xl shrink-0 select-none">
                      {[
                        { id: 'overview', label: '📊 نظرة عامة وصحة النظام' },
                        { id: 'quran_worship', label: '📖 القرآن والعبادات' },
                        { id: 'community_duels', label: '🤝 المجتمع والتحديات' },
                        { id: 'video_studio', label: '🎬 استوديو الفيديو والمعرض' },
                        { id: 'chatbot', label: '🤖 تحليلات الذكاء الاصطناعي' },
                        { id: 'growth_sales', label: '💳 النمو والمبيعات' },
                      ].map(subTab => (
                        <button
                          key={subTab.id}
                          onClick={() => setAnalyticsSubTab(subTab.id)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${analyticsSubTab === subTab.id
                              ? 'bg-[#fbbf24] text-black shadow-lg shadow-[#fbbf24]/10 scale-102'
                              : 'text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                          {subTab.label}
                        </button>
                      ))}
                    </div>

                    {/* ────────────────────────────────────────────────────────
                      SUB-TAB: OVERVIEW
                      ──────────────────────────────────────────────────────── */}
                    {analyticsSubTab === 'overview' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'إجمالي الحسابات المسجلة', value: analyticsData.kpis.totalUsers, icon: Users, desc: `معدل نمو أسبوعي +${analyticsData.userGrowth.growthRate}%` },
                            { label: 'الأعضاء النشطين اليوم', value: analyticsData.kpis.activeToday, icon: UserCheck, desc: `بنسبة ${analyticsData.kpis.totalUsers > 0 ? ((analyticsData.kpis.activeToday / analyticsData.kpis.totalUsers) * 100).toFixed(1) : 0}% من المستخدمين` },
                            { label: 'نقاط التفاعل الكلية', value: analyticsData.kpis.totalPoints, icon: Trophy, desc: 'النقاط الموزعة عبر الأنشطة' },
                            { label: 'رسائل الدردشة الذكية', value: analyticsData.kpis.chatbotMessagesCount, icon: MessageSquare, desc: 'إجمالي المحادثات مع يقين' },
                            { label: 'معدل التحويل (البريميوم)', value: `${analyticsData.kpis.conversionRate}%`, icon: CreditCard, desc: `${analyticsData.kpis.premiumOrStarterCount} مشترك نشط حالياً` },
                            { label: 'أجهزة مفعلة للإشعارات', value: analyticsData.health.pushSubscribers, icon: BellRing, desc: `نسبة الوصول الكلي: ${analyticsData.health.pushPercentage}%` },
                            { label: 'طلبات اشتراك معلقة', value: analyticsData.kpis.pendingSubscriptions, icon: AlertCircle, desc: 'تنتظر التنشيط والمراجعة', highlight: analyticsData.kpis.pendingSubscriptions > 0 },
                            { label: 'تذاكر الدعم المفتوحة', value: analyticsData.kpis.openSupportTickets, icon: HeadphonesIcon, desc: 'تذاكر شكاوى نشطة تحتاج لرد', highlight: analyticsData.kpis.openSupportTickets > 0 },
                          ].map((card, i) => {
                            const Icon = card.icon;
                            return (
                              <div key={i} className={`rounded-2xl border p-5 transition hover:scale-[1.02] duration-300 ${card.highlight ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_10px_30px_rgba(245,158,11,0.05)]' : 'bg-white/[0.02] border-white/[0.06]'}`}>
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

                        {/* Technical Diagnostics Overview card */}
                        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4 mb-4">
                            <div>
                              <h3 className="text-lg font-black text-white">حالة الاتصال والخدمات التقنية ⚡</h3>
                              <p className="text-xs text-white/40 mt-0.5">مراقبة الأداء الفني وصحة الخوادم والـ APIs مباشرة</p>
                            </div>
                            <button
                              onClick={runAllDiagnostics}
                              disabled={diagRunning}
                              className="px-4 py-2 border border-[#fbbf24]/20 hover:bg-[#fbbf24]/5 text-[#fbbf24] rounded-xl text-xs font-bold transition flex items-center gap-2"
                            >
                              {diagRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                              تشغيل فحص التشخيص الشامل
                            </button>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            {[
                              { id: 'db', title: 'قاعدة Firestore 💾', status: dbStatus, msg: dbMessage },
                              { id: 'auth', title: 'صلاحية الأدمن 🔑', status: authStatus, msg: authMessage },
                              { id: 'pexels', title: 'خلفيات Pexels 🖼️', status: pexelsStatus, msg: pexelsMessage },
                              { id: 'render', title: 'خادم الرندر 🎬', status: renderServerStatus, msg: renderServerMessage },
                              { id: 'env', title: 'متغيرات البيئة 📦', status: envStatus, msg: envMessage },
                            ].map(sys => (
                              <div key={sys.id} className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-xl flex flex-col justify-between h-28">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-white/70">{sys.title}</span>
                                  {sys.status === 'idle' && <div className="w-2 h-2 rounded-full bg-white/20" />}
                                  {sys.status === 'checking' && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#fbbf24]" />}
                                  {sys.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                                  {sys.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                                </div>
                                <p className="text-[9px] text-white/40 truncate leading-relaxed text-right mt-2" title={sys.msg || 'بانتظار تشغيل الفحص'}>
                                  {sys.msg || 'بانتظار تشغيل الفحص...'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Engagement & Streaks Overview */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-right">
                            <h3 className="text-base font-black text-white mb-4">مواظبة والتزام المستخدمين 📅</h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                                <span className="text-[10px] text-white/30 font-bold block">متوسط السلسلة</span>
                                <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">{analyticsData.featuresBreakdown.engagement.avgStreak} يوم</p>
                              </div>
                              <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                                <span className="text-[10px] text-white/30 font-bold block">أعلى سلسلة التزام</span>
                                <p className="text-2xl font-black text-[#fbbf24] mt-2 font-mono">{analyticsData.featuresBreakdown.engagement.maxStreak} يوم</p>
                              </div>
                              <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                                <span className="text-[10px] text-white/30 font-bold block">إجمالي السلاسل النشطة</span>
                                <p className="text-2xl font-black text-sky-400 mt-2 font-mono">{analyticsData.featuresBreakdown.engagement.totalStreak}</p>
                              </div>
                            </div>
                            <p className="text-[11px] text-white/30 leading-relaxed mt-4">
                              * تحسب سلسلة الالتزام (Streak) للأعضاء الذين سجلوا قراءة ورد يومي أو ذكر متواصل دون انقطاع لأكثر من يوم.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col justify-between">
                            <div>
                              <h3 className="text-base font-black text-white">إحصائيات إضافية سريعة</h3>
                              <p className="text-xs text-white/30 mt-0.5">تفاصيل حول حجم رسائل البريد المرسلة عبر خادم التحقق</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center my-3">
                              <div className="bg-white/[0.01] border border-white/[0.03] p-3.5 rounded-xl">
                                <span className="text-[9px] text-white/40 block">إيميلات تفعيل التسجيل</span>
                                <p className="text-lg font-black text-white font-mono mt-1">{analyticsData.emails.signupCount}</p>
                              </div>
                              <div className="bg-white/[0.01] border border-white/[0.03] p-3.5 rounded-xl">
                                <span className="text-[9px] text-white/40 block">إيميلات استعادة الباسورد</span>
                                <p className="text-lg font-black text-white font-mono mt-1">{analyticsData.emails.resetCount}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ────────────────────────────────────────────────────────
                      SUB-TAB: QURAN & WORSHIP
                      ──────────────────────────────────────────────────────── */}
                    {analyticsSubTab === 'quran_worship' && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Quran Reading Card */}
                          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 relative overflow-hidden group">
                            <div className="absolute top-4 left-4 opacity-5 group-hover:scale-110 transition-transform">
                              <BookOpen className="w-16 h-16 text-[#fbbf24]" />
                            </div>

                            <div className="border-b border-white/5 pb-3">
                              <h3 className="text-lg font-black text-white">تفاعل قراءة القرآن الكريم 📖</h3>
                              <p className="text-xs text-white/40 mt-0.5">تفاصيل وإحصائيات تلاوة المصحف من قِبل الأعضاء</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 my-6 text-center">
                              <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                                <span className="text-[10px] text-white/30 font-bold block">إجمالي الآيات المقروءة</span>
                                <p className="text-2xl font-black text-white mt-2 font-mono">{analyticsData.featuresBreakdown.quran.totalAyahsRead.toLocaleString('ar-EG')}</p>
                              </div>
                              <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                                <span className="text-[10px] text-white/30 font-bold block">النقاط الإجمالية الموزعة</span>
                                <p className="text-2xl font-black text-[#fbbf24] mt-2 font-mono">+{analyticsData.featuresBreakdown.quran.totalQuranPoints.toLocaleString('ar-EG')}</p>
                              </div>
                              <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                                <span className="text-[10px] text-white/30 font-bold block">متوسط آيات القارئ الواحد</span>
                                <p className="text-2xl font-black text-sky-400 mt-2 font-mono">{analyticsData.featuresBreakdown.quran.avgAyahsReadPerUser} آية</p>
                              </div>
                              <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                                <span className="text-[10px] text-white/30 font-bold block">خطط الأوراد بالذكاء الاصطناعي</span>
                                <p className="text-2xl font-black text-violet-400 mt-2 font-mono">{analyticsData.featuresBreakdown.quran.activeCustomPlans} خطة</p>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-white/70">قراء القرآن النشطين</span>
                                <span className="text-[#fbbf24] font-mono">{analyticsData.featuresBreakdown.quran.activeQuranReaders} من أصل {analyticsData.kpis.totalUsers}</span>
                              </div>
                              <div className="w-full bg-white/[0.03] h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-l from-[#fbbf24] to-amber-500 rounded-full"
                                  style={{ width: `${analyticsData.kpis.totalUsers > 0 ? ((analyticsData.featuresBreakdown.quran.activeQuranReaders / analyticsData.kpis.totalUsers) * 100) : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Quran Listening Card */}
                          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 relative overflow-hidden group">
                            <div className="absolute top-4 left-4 opacity-5 group-hover:scale-110 transition-transform">
                              <Volume2 className="w-16 h-16 text-emerald-400" />
                            </div>

                            <div className="border-b border-white/5 pb-3">
                              <h3 className="text-lg font-black text-white">تفاعل الاستماع والصوتيات 🎧</h3>
                              <p className="text-xs text-white/40 mt-0.5">تتبع فترات وساعات الاستماع لسور وتلاوات القرآن</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 my-6 text-center">
                              <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                                <span className="text-[10px] text-white/30 font-bold block">إجمالي وقت الاستماع</span>
                                <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">
                                  {Math.floor(analyticsData.featuresBreakdown.listen.totalListeningSeconds / 3600)} ساعة
                                </p>
                              </div>
                              <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                                <span className="text-[10px] text-white/30 font-bold block">إجمالي نقاط الاستماع</span>
                                <p className="text-2xl font-black text-[#fbbf24] mt-2 font-mono">+{analyticsData.featuresBreakdown.listen.totalListenPoints.toLocaleString('ar-EG')}</p>
                              </div>
                              <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                                <span className="text-[10px] text-white/30 font-bold block">متوسط استماع العضو الواحد</span>
                                <p className="text-2xl font-black text-sky-400 mt-2 font-mono">
                                  {analyticsData.featuresBreakdown.listen.avgListeningMinutesPerUser} دقيقة
                                </p>
                              </div>
                              <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-xl">
                                <span className="text-[10px] text-white/30 font-bold block">إجمالي ثواني الاستماع الكلية</span>
                                <p className="text-lg font-black text-white mt-2.5 font-mono">{analyticsData.featuresBreakdown.listen.totalListeningSeconds.toLocaleString('ar-EG')} ثانية</p>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-white/70">المستمعون النشطون في المنصة</span>
                                <span className="text-emerald-400 font-mono">{analyticsData.featuresBreakdown.listen.activeListeners} من أصل {analyticsData.kpis.totalUsers}</span>
                              </div>
                              <div className="w-full bg-white/[0.03] h-2 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-l from-emerald-400 to-teal-500 rounded-full"
                                  style={{ width: `${analyticsData.kpis.totalUsers > 0 ? ((analyticsData.featuresBreakdown.listen.activeListeners / analyticsData.kpis.totalUsers) * 100) : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Dhikr, Tasbeeh & Counters Community Dashboard */}
                        <div className="rounded-[2rem] border border-white/[0.06] bg-gradient-to-br from-[#0c101d] to-[#080a13] p-8 relative overflow-hidden shadow-2xl">
                          <div className="absolute top-6 left-6 opacity-[0.03] pointer-events-none">
                            <Sparkles className="w-32 h-32 text-amber-400 animate-pulse" />
                          </div>

                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
                            <div className="text-right">
                              <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-[#fbbf24] border border-[#fbbf24]/20 rounded-xl text-[10px] font-black uppercase tracking-widest mb-3">
                                📿 لوحة الذكر الجماعي
                              </span>
                              <h3 className="text-2xl font-black text-white">إحصائيات الأذكار والتسبيح الإلكتروني للمجتمع</h3>
                              <p className="text-xs text-white/40 mt-1">تجميع حركات الذكر الجماعي المنجزة من قِبل جميع أعضاء التطبيق</p>
                            </div>

                            <div className="bg-white/[0.03] border border-white/[0.06] px-6 py-4 rounded-2xl text-center shrink-0">
                              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">إجمالي عمليات الذكر الجماعية</span>
                              <p className="text-3xl font-black text-[#fbbf24] mt-1 font-mono">{analyticsData.featuresBreakdown.dhikr.grandTotalDhikrActions.toLocaleString('ar-EG')}</p>
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
                            {[
                              { label: 'مرات الاستغفار', value: analyticsData.featuresBreakdown.dhikr.totalIstighfarPoints, color: 'text-rose-400', pct: 100, unit: 'مرة' },
                              { label: 'الصلوات على النبي', value: analyticsData.featuresBreakdown.dhikr.totalSalawatPoints, color: 'text-blue-400', pct: 100, unit: 'مرة' },
                              { label: 'مرات التسبيح بالسبحة (تقديري)', value: analyticsData.featuresBreakdown.dhikr.estimatedSebhaClicks, color: 'text-amber-400', pct: 100, unit: 'تسبيحة' },
                              { label: 'إجمالي نقاط الأذكار المكتسبة', value: analyticsData.featuresBreakdown.dhikr.totalAthkarPoints, color: 'text-purple-400', pct: 100, unit: 'نقطة' }
                            ].map((dhikr, idx) => (
                              <div key={idx} className="bg-black/20 border border-white/5 p-5 rounded-2xl flex flex-col justify-between h-32">
                                <span className="text-xs text-white/40 font-bold">{dhikr.label}</span>
                                <div className="mt-3">
                                  <p className={`text-2xl font-black ${dhikr.color} font-mono`}>{dhikr.value.toLocaleString('ar-EG')}</p>
                                  <p className="text-[10px] text-white/20 mt-1">{dhikr.unit}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-6 border-t border-white/5 pt-5 flex justify-between items-center text-xs font-bold text-white/30">
                            <span>عدد المشاركين الفعليين بالذكر اليوم: {analyticsData.featuresBreakdown.dhikr.activeDhikrUsers} مستخدم</span>
                            <span>المقاييس تسجل لحظة بلحظة</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ────────────────────────────────────────────────────────
                      SUB-TAB: COMMUNITY & CHALLENGES (DUELS / FRIENDS)
                      ──────────────────────────────────────────────────────── */}
                    {analyticsSubTab === 'community_duels' && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                          {/* Social feed card */}
                          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 relative overflow-hidden group">
                            <div className="border-b border-white/5 pb-3">
                              <h3 className="text-lg font-black text-white">تفاعل مجتمع التدبر والمنشورات 🤝</h3>
                              <p className="text-xs text-white/40 mt-0.5">مراقبة منشورات وتفاعلات حائط المشاركة</p>
                            </div>

                            <div className="space-y-4 my-6 text-xs font-bold">
                              <div className="flex justify-between bg-white/[0.01] p-3 rounded-xl">
                                <span className="text-white/60">إجمالي المنشورات المكتوبة</span>
                                <span className="text-white font-mono">{analyticsData.featuresBreakdown.social.totalPosts} منشور</span>
                              </div>
                              <div className="flex justify-between bg-white/[0.01] p-3 rounded-xl">
                                <span className="text-white/60">إجمالي التفاعلات (الإعجابات)</span>
                                <span className="text-[#fbbf24] font-mono">{analyticsData.featuresBreakdown.social.totalPostLikes} إعجاب</span>
                              </div>
                              <div className="flex justify-between bg-white/[0.01] p-3 rounded-xl">
                                <span className="text-white/60">إجمالي التعليقات المكتوبة</span>
                                <span className="text-sky-400 font-mono">{analyticsData.featuresBreakdown.social.totalPostComments} تعليق</span>
                              </div>
                              <div className="flex justify-between bg-white/[0.01] p-3 rounded-xl">
                                <span className="text-white/60">متوسط تفاعل المنشور الواحد</span>
                                <span className="text-violet-400 font-mono">
                                  {analyticsData.featuresBreakdown.social.totalPosts > 0
                                    ? ((analyticsData.featuresBreakdown.social.totalPostLikes + analyticsData.featuresBreakdown.social.totalPostComments) / analyticsData.featuresBreakdown.social.totalPosts).toFixed(1)
                                    : 0
                                  } تفاعل
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                              <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl text-red-400">
                                <p className="font-bold">منشورات مُبلّغ عنها</p>
                                <p className="text-lg font-black mt-1 font-mono">{analyticsData.featuresBreakdown.social.reportedPostsCount}</p>
                              </div>
                              <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-rose-400">
                                <p className="font-bold">منشورات محجوبة</p>
                                <p className="text-lg font-black mt-1 font-mono">{analyticsData.featuresBreakdown.social.blockedPostsCount}</p>
                              </div>
                            </div>
                          </div>

                          {/* Worship Duels Card */}
                          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 relative overflow-hidden group">
                            <div className="border-b border-white/5 pb-3">
                              <h3 className="text-lg font-black text-white">تحديات ومبارزات العبادات ⚔️</h3>
                              <p className="text-xs text-white/40 mt-0.5">تتبع التحديات الإيمانية والمنافسة الشريفة بين الأصدقاء</p>
                            </div>

                            <div className="space-y-4 my-6 text-xs font-bold">
                              <div className="flex justify-between bg-white/[0.01] p-3 rounded-xl">
                                <span className="text-white/60">إجمالي المبارزات المقامة</span>
                                <span className="text-white font-mono">{analyticsData.featuresBreakdown.duels.totalDuels} تحدي</span>
                              </div>
                              <div className="flex justify-between bg-white/[0.01] p-3 rounded-xl">
                                <span className="text-white/60">تحديات مكتملة ومنتهية</span>
                                <span className="text-emerald-400 font-mono">{analyticsData.featuresBreakdown.duels.completedDuels} مبارزة</span>
                              </div>
                              <div className="flex justify-between bg-white/[0.01] p-3 rounded-xl">
                                <span className="text-white/60">تحديات جارية / معلقة</span>
                                <span className="text-amber-400 font-mono">{analyticsData.featuresBreakdown.duels.activeDuels} تحدي نشط</span>
                              </div>
                            </div>

                            <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl text-center">
                              <span className="text-[10px] text-white/40 font-bold block">نسبة إكمال التحديات</span>
                              <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden mt-3">
                                <div
                                  className="absolute inset-y-0 left-0 bg-emerald-400 rounded-full"
                                  style={{ width: `${analyticsData.featuresBreakdown.duels.totalDuels > 0 ? ((analyticsData.featuresBreakdown.duels.completedDuels / analyticsData.featuresBreakdown.duels.totalDuels) * 100).toFixed(0) : 0}%` }}
                                />
                              </div>
                              <span className="text-[11px] text-emerald-400 font-mono block mt-2">
                                {analyticsData.featuresBreakdown.duels.totalDuels > 0 ? ((analyticsData.featuresBreakdown.duels.completedDuels / analyticsData.featuresBreakdown.duels.totalDuels) * 100).toFixed(0) : 0}% من التحديات تمت بنجاح
                              </span>
                            </div>
                          </div>

                          {/* Friends Network Card */}
                          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 relative overflow-hidden group">
                            <div className="border-b border-white/5 pb-3">
                              <h3 className="text-lg font-black text-white">شبكة الصداقات والترابط الاجتماعي 👥</h3>
                              <p className="text-xs text-white/40 mt-0.5">تفاصيل الترابط الاجتماعي وإضافة الأصدقاء</p>
                            </div>

                            <div className="space-y-4 my-6 text-xs font-bold">
                              <div className="flex justify-between bg-white/[0.01] p-3 rounded-xl">
                                <span className="text-white/60">إجمالي علاقات الصداقة المفعلة</span>
                                <span className="text-white font-mono">{analyticsData.featuresBreakdown.duels.totalFriendships} علاقة</span>
                              </div>
                              <div className="flex justify-between bg-white/[0.01] p-3 rounded-xl">
                                <span className="text-white/60">متوسط الأصدقاء لكل مستخدم</span>
                                <span className="text-[#fbbf24] font-mono">{analyticsData.featuresBreakdown.duels.avgFriendsPerUser} صديق</span>
                              </div>
                            </div>

                            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 text-center mt-6">
                              <p className="text-[10px] text-white/30 leading-relaxed">
                                * تعكس هذه المؤشرات مدى ترابط مستخدمي المنصة والمشاركة الجماعية للأوراد والأدعية وحث بعضهم بعضاً على العبادة.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ────────────────────────────────────────────────────────
                      SUB-TAB: VIDEO STUDIO
                      ──────────────────────────────────────────────────────── */}
                    {analyticsSubTab === 'video_studio' && (
                      <div className="space-y-6 font-arabic text-right animate-in fade-in slide-in-from-bottom-6 duration-500">
                        {/* Section 1: Render Control Settings */}
                        <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 relative overflow-hidden">
                          <div className="absolute top-4 left-4 opacity-5 pointer-events-none">
                            <Settings className="w-16 h-16 text-[#fbbf24]" />
                          </div>

                          <div className="border-b border-white/5 pb-4 mb-6">
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                              <span>أدوات التحكم في خادم الرندر السحابي 🛠️</span>
                            </h3>
                            <p className="text-xs text-white/40 mt-0.5">تعطيل أو تمكين تصدير الفيديوهات للمستخدمين وكتابة رسائل التنبيه</p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Column 1: Switch and message */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between bg-white/[0.01] border border-white/[0.03] p-4 rounded-2xl">
                                <div>
                                  <span className="text-sm font-black text-white block">حالة خدمة الرندر</span>
                                  <span className="text-[10px] text-white/40">تفعيل أو إيقاف تصدير الفيديوهات تماماً</span>
                                </div>
                                <button
                                  onClick={() => setRenderConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                                  className={`w-14 h-8 rounded-full transition-all relative ${renderConfig.enabled ? "bg-[#fbbf24]" : "bg-white/10"}`}
                                >
                                  <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-black transition-all ${renderConfig.enabled ? "translate-x-6 bg-black" : "translate-x-0 bg-white/70"}`} />
                                </button>
                              </div>

                              <div>
                                <label className="text-xs font-black text-white/50 block mb-2">رسالة تنبيه المستخدمين (عند التعطيل)</label>
                                <textarea
                                  value={renderConfig.message}
                                  onChange={(e) => setRenderConfig(prev => ({ ...prev, message: e.target.value }))}
                                  placeholder="اكتب الرسالة التي ستظهر للمستخدمين عند محاولة رندر فيديو..."
                                  className="w-full h-24 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-xs text-white outline-none focus:border-[#fbbf24]/40 transition resize-none text-right"
                                />
                              </div>
                            </div>

                            {/* Column 2: Reason and bypassed plans */}
                            <div className="space-y-4">
                              <div>
                                <label className="text-xs font-black text-white/50 block mb-2">سبب الإيقاف أو التنبيه</label>
                                <select
                                  value={renderConfig.reason}
                                  onChange={(e) => setRenderConfig(prev => ({ ...prev, reason: e.target.value }))}
                                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3.5 text-xs text-white outline-none focus:border-[#fbbf24]/40 transition text-right"
                                >
                                  <option value="maintenance" className="bg-[#12131a] text-white">صيانة مجدولة وترقية كروت الشاشة</option>
                                  <option value="server_load" className="bg-[#12131a] text-white">ضغط كبير على الخوادم السحابية</option>
                                  <option value="error" className="bg-[#12131a] text-white">عطل طارئ وجاري الفحص</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-xs font-black text-white/50 block mb-2">العضويات المستثناة من الإيقاف (Bypass)</label>
                                <div className="grid grid-cols-2 gap-2">
                                  {["free", "starter", "supporter", "premium"].map((plan) => {
                                    const isAllowed = renderConfig.allowPlans.includes(plan);
                                    const labelAr = plan === "free" ? "المجانية" : plan === "starter" ? "الفضية" : plan === "supporter" ? "الذهبية" : "الماسية/Premium";
                                    return (
                                      <button
                                        key={plan}
                                        onClick={() => togglePlanInConfig(plan)}
                                        className={`p-3 rounded-xl border text-[10px] font-black transition-all ${isAllowed
                                            ? "border-[#fbbf24]/40 bg-[#fbbf24]/10 text-[#fbbf24]"
                                            : "border-white/5 bg-white/[0.01] text-white/40 hover:bg-white/5"
                                          }`}
                                      >
                                        {labelAr} {isAllowed ? "✓" : ""}
                                      </button>
                                    );
                                  })}
                                </div>
                                <span className="text-[9px] text-white/30 block mt-2">
                                  * يستطيع الأدمن (youssefosama) دائماً تخطي إيقاف الرندر لإجراء الاختبارات.
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 flex justify-end">
                            <button
                              onClick={handleSaveRenderConfig}
                              disabled={isSavingRenderConfig}
                              className="px-6 py-3 bg-[#fbbf24] text-black font-black rounded-xl text-xs hover:brightness-110 active:scale-95 transition disabled:opacity-50 flex items-center gap-2"
                            >
                              {isSavingRenderConfig && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                              حفظ إعدادات الرندر الحالية
                            </button>
                          </div>
                        </div>

                        {/* Section 2: Render Metrics Cards */}
                        {analyticsData.featuresBreakdown.video.vrStats ? (
                          <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {/* Card 1: Success Rate */}
                              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                                <span className="text-[10px] text-white/30 font-bold block">معدل نجاح الرندر 🟢</span>
                                <p className="text-3xl font-black text-emerald-400 mt-2 font-mono">
                                  {analyticsData.featuresBreakdown.video.vrStats.successRate}%
                                </p>
                                <span className="text-[9px] text-white/40 mt-1 block">
                                  نجاح: {analyticsData.featuresBreakdown.video.vrStats.successful} | فشل: {analyticsData.featuresBreakdown.video.vrStats.failed}
                                </span>
                              </div>

                              {/* Card 2: Avg. Duration */}
                              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                                <span className="text-[10px] text-white/30 font-bold block">متوسط سرعة الرندر ⚡</span>
                                <p className="text-3xl font-black text-white mt-2 font-mono">
                                  {analyticsData.featuresBreakdown.video.vrStats.avgTime} ثانية
                                </p>
                                <span className="text-[9px] text-white/40 mt-1 block">
                                  لكل مقطع فيديو مصمم
                                </span>
                              </div>

                              {/* Card 3: Active Jobs */}
                              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center relative overflow-hidden">
                                {analyticsData.featuresBreakdown.video.vrStats.active > 0 && (
                                  <div className="absolute inset-0 bg-sky-500/5 animate-pulse" />
                                )}
                                <span className="text-[10px] text-white/30 font-bold block">رندر نشط حالياً 🎬</span>
                                <p className="text-3xl font-black text-sky-400 mt-2 font-mono">
                                  {analyticsData.featuresBreakdown.video.vrStats.active}
                                </p>
                                <span className="text-[9px] text-white/40 mt-1 block">
                                  عمليات معالجة جارية لحظية
                                </span>
                              </div>

                              {/* Card 4: Total Renders */}
                              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
                                <span className="text-[10px] text-white/30 font-bold block">إجمالي محاولات الرندر 📊</span>
                                <p className="text-3xl font-black text-[#fbbf24] mt-2 font-mono">
                                  {analyticsData.featuresBreakdown.video.vrStats.total}
                                </p>
                                <span className="text-[9px] text-white/40 mt-1 block">
                                  إجمالي السجلات المقيدة
                                </span>
                              </div>
                            </div>

                            {/* Section 3: Distribution Breakdown */}
                            <div className="grid md:grid-cols-3 gap-6">
                              {/* Col 1: Popular Reciters */}
                              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                                <h4 className="text-sm font-black text-white border-b border-white/5 pb-2 mb-4">القراء الأكثر شعبية بالفيديوهات 🎙️</h4>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                  {Object.entries(analyticsData.featuresBreakdown.video.vrStats.reciters)
                                    .sort((a: any, b: any) => b[1] - a[1])
                                    .slice(0, 5)
                                    .map(([name, count]: any) => {
                                      const pct = Math.round((count / (analyticsData.featuresBreakdown.video.vrStats.total || 1)) * 100);
                                      return (
                                        <div key={name} className="space-y-1">
                                          <div className="flex justify-between text-xs font-bold text-white/80">
                                            <span>{name}</span>
                                            <span className="font-mono">{count} فيديو ({pct}%)</span>
                                          </div>
                                          <div className="w-full bg-white/[0.03] h-1.5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-l from-amber-400 to-[#fbbf24] rounded-full" style={{ width: `${pct}%` }} />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  {Object.keys(analyticsData.featuresBreakdown.video.vrStats.reciters).length === 0 && (
                                    <p className="text-xs text-white/30 text-center py-6">لا توجد بيانات قراء كافية</p>
                                  )}
                                </div>
                              </div>

                              {/* Col 2: Popular Surahs */}
                              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                                <h4 className="text-sm font-black text-white border-b border-white/5 pb-2 mb-4">السور الأكثر تصميماً بالفيديوهات 📖</h4>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                  {Object.entries(analyticsData.featuresBreakdown.video.vrStats.surahs || {})
                                    .sort((a: any, b: any) => b[1] - a[1])
                                    .slice(0, 5)
                                    .map(([name, count]: any) => {
                                      const pct = Math.round((count / (analyticsData.featuresBreakdown.video.vrStats.total || 1)) * 100);
                                      return (
                                        <div key={name} className="space-y-1">
                                          <div className="flex justify-between text-xs font-bold text-white/80">
                                            <span>سورة {name}</span>
                                            <span className="font-mono">{count} فيديو ({pct}%)</span>
                                          </div>
                                          <div className="w-full bg-white/[0.03] h-1.5 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-l from-purple-400 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  {/* Fallback if surah counts not compiled inline, compile from render logs */}
                                  {(() => {
                                    const surahCounts: Record<string, number> = {};
                                    (analyticsData.featuresBreakdown.video.videoRendersList || []).forEach((j: any) => {
                                      if (j.surahName) surahCounts[j.surahName] = (surahCounts[j.surahName] || 0) + 1;
                                    });
                                    return Object.entries(surahCounts)
                                      .sort((a, b) => b[1] - a[1])
                                      .slice(0, 5)
                                      .map(([name, count]) => {
                                        const pct = Math.round((count / (analyticsData.featuresBreakdown.video.vrStats.total || 1)) * 100);
                                        return (
                                          <div key={name} className="space-y-1">
                                            <div className="flex justify-between text-xs font-bold text-white/80">
                                              <span>سورة {name}</span>
                                              <span className="font-mono">{count} فيديو ({pct}%)</span>
                                            </div>
                                            <div className="w-full bg-white/[0.03] h-1.5 rounded-full overflow-hidden">
                                              <div className="h-full bg-gradient-to-l from-purple-400 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                          </div>
                                        );
                                      });
                                  })()}
                                </div>
                              </div>

                              {/* Col 3: Templates & Background Type */}
                              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 flex flex-col justify-between">
                                <div>
                                  <h4 className="text-sm font-black text-white border-b border-white/5 pb-2 mb-4">توزيع القوالب والخلفيات المستعملة 🎬</h4>
                                  <div className="space-y-4">
                                    {/* Templates */}
                                    <div className="space-y-2">
                                      <span className="text-[10px] text-white/40 block">القوالب المختارة</span>
                                      {Object.entries(analyticsData.featuresBreakdown.video.vrStats.templates)
                                        .sort((a: any, b: any) => b[1] - a[1])
                                        .map(([name, count]: any) => {
                                          const pct = Math.round((count / (analyticsData.featuresBreakdown.video.vrStats.total || 1)) * 100);
                                          return (
                                            <div key={name} className="flex justify-between text-xs font-bold">
                                              <span className="text-white/60">{name}</span>
                                              <span className="text-white font-mono">{pct}%</span>
                                            </div>
                                          );
                                        })}
                                    </div>

                                    {/* Background Type */}
                                    <div className="border-t border-white/5 pt-3 space-y-2">
                                      <span className="text-[10px] text-white/40 block">نوع الخلفيات</span>
                                      <div className="flex justify-between text-xs font-bold">
                                        <span className="text-white/60">فيديو متحرك (.mp4)</span>
                                        <span className="text-sky-400 font-mono">
                                          {analyticsData.featuresBreakdown.video.vrStats.videoBgCount} مقطع ({Math.round((analyticsData.featuresBreakdown.video.vrStats.videoBgCount / (analyticsData.featuresBreakdown.video.vrStats.total || 1)) * 100)}%)
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-xs font-bold">
                                        <span className="text-white/60">صورة ثابتة</span>
                                        <span className="text-amber-400 font-mono">
                                          {analyticsData.featuresBreakdown.video.vrStats.imageBgCount} صورة ({Math.round((analyticsData.featuresBreakdown.video.vrStats.imageBgCount / (analyticsData.featuresBreakdown.video.vrStats.total || 1)) * 100)}%)
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-[9px] text-white/20 mt-4 leading-relaxed">
                                  * تعتمد الإحصائيات على آخر 1,000 محاولة رندر مسجلة في قاعدة بيانات التطبيق.
                                </div>
                              </div>
                            </div>

                            {/* Section 4: Live Render Logs Table */}
                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4 mb-6">
                                <div>
                                  <h3 className="text-lg font-black text-white">سجل عمليات رندر الفيديوهات السحابي الحي 📜</h3>
                                  <p className="text-xs text-white/40 mt-0.5">تفاصيل جميع طلبات تصميم الفيديوهات في السيرفر مع فرز وبحث لحظي</p>
                                </div>

                                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                  <input
                                    type="text"
                                    value={videoRendersSearch}
                                    onChange={(e) => setVideoRendersSearch(e.target.value)}
                                    placeholder="البحث بالبريد، القارئ أو السورة..."
                                    className="px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#fbbf24]/40 w-full sm:w-60 text-right"
                                  />

                                  <select
                                    value={videoRendersStatusFilter}
                                    onChange={(e) => setVideoRendersStatusFilter(e.target.value)}
                                    className="px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-[#fbbf24]/40 text-right"
                                  >
                                    <option value="all" className="bg-[#12131a] text-white">كل الحالات</option>
                                    <option value="completed" className="bg-[#12131a] text-white">مكتمل بنجاح</option>
                                    <option value="failed" className="bg-[#12131a] text-white">فشل / خطأ</option>
                                    <option value="rendering" className="bg-[#12131a] text-white">جاري المعالجة</option>
                                    <option value="merging" className="bg-[#12131a] text-white">دمج الطبقات</option>
                                  </select>
                                </div>
                              </div>

                              {/* Table */}
                              {(() => {
                                const list = analyticsData.featuresBreakdown.video.videoRendersList || [];
                                const filtered = list.filter((item: any) => {
                                  const matchesSearch =
                                    (item.userEmail || "").toLowerCase().includes(videoRendersSearch.toLowerCase()) ||
                                    (item.surahName || "").toLowerCase().includes(videoRendersSearch.toLowerCase()) ||
                                    (item.reciterName || "").toLowerCase().includes(videoRendersSearch.toLowerCase());

                                  if (videoRendersStatusFilter === "all") return matchesSearch;
                                  return matchesSearch && item.status === videoRendersStatusFilter;
                                });

                                return (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-right text-xs">
                                      <thead>
                                        <tr className="border-b border-white/5 text-white/40 font-bold">
                                          <th className="pb-3 pl-4">المستخدم</th>
                                          <th className="pb-3 pl-4">السورة / القارئ</th>
                                          <th className="pb-3 pl-4">القالب المستخدم</th>
                                          <th className="pb-3 pl-4">نوع الخلفية</th>
                                          <th className="pb-3 pl-4">التاريخ والمدة</th>
                                          <th className="pb-3 pl-4">الحالة</th>
                                          <th className="pb-3 text-center">الإجراء</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/5">
                                        {filtered.slice(0, 100).map((job: any) => {
                                          const dateStr = job.createdAt?.toDate
                                            ? job.createdAt.toDate().toLocaleString('ar-EG')
                                            : (job.createdAt ? new Date(job.createdAt).toLocaleString('ar-EG') : "غير معروف");

                                          const planLabel = job.userPlan === "premium" ? "Premium" : job.userPlan === "supporter" ? "Supporter" : job.userPlan === "starter" ? "Starter" : "Free";
                                          const planColor = job.userPlan === "premium" ? "text-purple-400 border-purple-500/20 bg-purple-500/5" : job.userPlan === "supporter" ? "text-[#fbbf24] border-[#fbbf24]/20 bg-[#fbbf24]/5" : job.userPlan === "starter" ? "text-sky-400 border-sky-500/20 bg-sky-500/5" : "text-white/40 border-white/5 bg-white/[0.01]";

                                          return (
                                            <tr key={job.jobId} className="hover:bg-white/[0.01] transition-colors">
                                              <td className="py-4 pl-4">
                                                <span className="font-bold text-white block truncate max-w-[150px]" title={job.userEmail}>{job.userEmail}</span>
                                                <span className={`inline-block px-2 py-0.5 rounded-full border text-[8px] font-black mt-1 ${planColor}`}>
                                                  {planLabel}
                                                </span>
                                              </td>
                                              <td className="py-4 pl-4">
                                                <span className="text-white block font-bold">سورة {job.surahName}</span>
                                                <span className="text-white/40 text-[10px]">{job.reciterName}</span>
                                              </td>
                                              <td className="py-4 pl-4 font-bold text-white/80">
                                                {job.videoTemplate === "minshawi_player" ? "تصميم زياد (المنشاوي)" : (job.videoTemplate === "dossary_player" ? "تصميم 2" : (job.videoTemplate === "youssef_player" ? "تصميم يوسف" : "التصميم الافتراضي"))}
                                              </td>
                                              <td className="py-4 pl-4">
                                                {job.isVideoBg ? (
                                                  <span className="text-sky-400 font-bold">فيديو 🎬</span>
                                                ) : (
                                                  <span className="text-amber-400 font-bold">صورة 🖼️</span>
                                                )}
                                              </td>
                                              <td className="py-4 pl-4">
                                                <span className="text-white/40 block">{dateStr}</span>
                                                <span className="text-white font-mono text-[10px]">
                                                  {job.renderTime ? `${job.renderTime} ثانية` : "—"}
                                                </span>
                                              </td>
                                              <td className="py-4 pl-4">
                                                {job.status === "completed" ? (
                                                  <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[10px]">
                                                    مكتمل بنجاح ✓
                                                  </span>
                                                ) : job.status === "failed" ? (
                                                  <span
                                                    className="px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-black text-[10px] cursor-help inline-block max-w-[120px] truncate"
                                                    title={job.error || "خطأ مجهول في الرندر"}
                                                  >
                                                    فشل: {job.error || "خطأ مجهول"}
                                                  </span>
                                                ) : (
                                                  <span className="px-2.5 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 font-black text-[10px] animate-pulse">
                                                    جاري الرندر...
                                                  </span>
                                                )}
                                              </td>
                                              <td className="py-4 text-center">
                                                <button
                                                  onClick={() => handleDeleteRenderLog(job.jobId)}
                                                  className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 hover:text-white transition"
                                                  title="حذف السجل نهائياً"
                                                >
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                        {filtered.length === 0 && (
                                          <tr>
                                            <td colSpan={7} className="text-center py-10 text-white/30 font-bold">
                                              لا توجد أي سجلات مطابقة للبحث أو الفلتر
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                );
                              })()}
                            </div>
                          </>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center text-white/30">
                            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-white/10" />
                            <p className="text-xs font-bold">لم نتمكن من تجميع إحصائيات رندر الفيديوهات. يرجى رندر أول فيديو لتفعيل السجل.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ────────────────────────────────────────────────────────
                      SUB-TAB: CHATBOT ANALYTICS (AI)
                      ──────────────────────────────────────────────────────── */}
                    {analyticsSubTab === 'chatbot' && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Sentiment donut chart */}
                          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col justify-between">
                            <div>
                              <h3 className="text-lg font-black text-white">تحليل سلوك ومشاعر الشات بوت</h3>
                              <p className="text-xs text-white/40 mt-1">توزيع ردود أفعال ومشاعر المستخدمين في حواراتهم مع يقين</p>
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
                                      <span className="text-white/70">مسيء / غضب ({insults})</span>
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
                              <p className="text-xs text-white/40 mt-1">حجم الرسائل المتبادلة يومياً (آخر 7 أيام)</p>
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

                        {/* Top 10 Repeated Questions */}
                        {(() => {
                          // Gather logs client-side to calculate repeated questions if not fetched.
                          // Since fetchChatbotLogs runs on tab activation, we might use chatbotStats calculated list if available.
                          // Let's display the top questions list.
                          return (
                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-right">
                              <h3 className="text-base font-black text-white mb-4">🔥 الأسئلة الأكثر تكراراً للدردشة الذكية</h3>
                              {chatbotStats.topQuestions.length === 0 ? (
                                <p className="text-xs text-white/30 text-center py-6">يرجى زيارة تبويب "تحليلات الشات بوت" لتجميع الأسئلة الكلية، أو لا توجد سجلات بعد.</p>
                              ) : (
                                <div className="grid gap-3 sm:grid-cols-2">
                                  {chatbotStats.topQuestions.slice(0, 10).map((q, idx) => (
                                    <div key={idx} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                                      <div className="flex items-center gap-3">
                                        <span className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-white/40 font-bold">{idx + 1}</span>
                                        <p className="text-xs text-white/80 font-bold truncate max-w-[180px] sm:max-w-[240px]" title={q.text}>{q.text}</p>
                                      </div>
                                      <span className="text-xs font-black bg-amber-400/10 text-amber-400 px-2 py-1 rounded-md">{q.count} تكرار</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* ────────────────────────────────────────────────────────
                      SUB-TAB: GROWTH & SALES (FINANCIALS)
                      ──────────────────────────────────────────────────────── */}
                    {analyticsSubTab === 'growth_sales' && (
                      <div className="space-y-6">
                        <div className="grid lg:grid-cols-3 gap-6">
                          {/* SVG Growth chart */}
                          <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col justify-between">
                            <div>
                              <h3 className="text-lg font-black text-white">تسجيلات المستخدمين الجدد (آخر 14 يوم)</h3>
                              <p className="text-xs text-white/40 mt-1">منحنى نمو الحسابات اليومية المسجلة عبر التحقق</p>
                            </div>

                            <div className="my-6 relative">
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
                                      {[0, 25, 50, 75, 100].map(val => (
                                        <line key={val} x1="0" y1={val} x2="100" y2={val} stroke="white" strokeOpacity="0.04" strokeWidth="0.5" />
                                      ))}
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
                                      <polyline
                                        fill="none"
                                        stroke="#fbbf24"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        points={points}
                                      />
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
                                    <div className="flex justify-between text-[8px] text-white/30 font-bold mt-2 font-mono" style={{ direction: 'ltr' }}>
                                      {list.map((d: any, i: number) => {
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

                          {/* Plans distribution */}
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

                          {/* Revenue stats */}
                          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col justify-between">
                            <div>
                              <h3 className="text-lg font-black text-white">إحصائيات الإيرادات والمبيعات</h3>
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
                                  <p className={`text-xs font-black mt-2 font-mono ${rev.color}`}>{rev.value} EGP</p>
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

                          {/* Last subscriptions timeline */}
                          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                            <h3 className="text-lg font-black text-white mb-4">آخر الاشتراكات المقبولة</h3>
                            <div className="overflow-y-auto max-h-[200px] no-scrollbar">
                              <table className="w-full text-right border-collapse text-xs font-bold">
                                <thead>
                                  <tr className="border-b border-white/5 text-white/30">
                                    <th className="pb-2">الباقة</th>
                                    <th className="pb-2">القيمة</th>
                                    <th className="pb-2 text-left">التاريخ</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                  {analyticsData.sales.lastSubscriptions.map((sub: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-white/[0.01]">
                                      <td className="py-2.5">
                                        <span className="inline-flex rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/20 px-2 py-0.5 text-[9px] text-[#fbbf24]">
                                          {sub.plan}
                                        </span>
                                      </td>
                                      <td className="py-2.5 font-mono text-emerald-400">+{sub.amount} EGP</td>
                                      <td className="py-2.5 text-white/40 text-left font-mono">{sub.date}</td>
                                    </tr>
                                  ))}
                                  {analyticsData.sales.lastSubscriptions.length === 0 && (
                                    <tr>
                                      <td colSpan={3} className="text-center py-6 text-white/20">لا توجد اشتراكات مفعّلة مؤخراً</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                    className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${moderationFilter === 'all'
                        ? 'bg-white text-black shadow-lg scale-102'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    الكل ({reportedPosts.length})
                  </button>
                  <button
                    onClick={() => setModerationFilter('reported')}
                    className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${moderationFilter === 'reported'
                        ? 'bg-rose-500 text-black shadow-lg scale-102'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    مبلغ عنها ({reportedPosts.filter(p => (p.reportsCount || 0) > 0).length})
                  </button>
                  <button
                    onClick={() => setModerationFilter('blocked')}
                    className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${moderationFilter === 'blocked'
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
                                className={`rounded-xl px-4 py-2 text-xs font-black transition ${post.isBlocked
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

            {/* ========== RECITERS DIAGNOSTICS TAB ========== */}
            {activeTab === 'reciters' && (
              <div className="space-y-6">
                {/* Header and Fix Action */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/[0.06] p-6 rounded-3xl">
                  <div className="text-right flex-1">
                    <h2 className="text-2xl font-black text-white">مراجعة وتدقيق قراء الصوتيات 🎙️</h2>
                    <p className="text-xs text-white/40 mt-1">تأكد من سلامة روابط سيرفرات mp3quran لجميع القراء وتشغيل عينة صوتية لكل قارئ</p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={handleCheckAllReciters}
                      disabled={reciterCheckingAll}
                      className="flex items-center gap-2 px-5 py-3 bg-[#fbbf24] text-black font-black rounded-xl hover:brightness-110 active:scale-95 transition disabled:opacity-50 text-xs"
                    >
                      {reciterCheckingAll ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري فحص الجميع...
                        </>
                      ) : (
                        <>
                          <Activity className="w-4 h-4" />
                          فحص جميع القراء تلقائياً ⚡
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleFixReciters}
                      disabled={reciterFixing}
                      className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-xl active:scale-95 transition disabled:opacity-50 text-xs border border-violet-500/30"
                    >
                      {reciterFixing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري إصلاح البيانات...
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4" />
                          إصلاح وتحديث بيانات القراء 🛠️
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {reciterFixResult && (
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-bold text-center">
                    {reciterFixResult}
                  </div>
                )}

                {/* Stats Counters */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'إجمالي القراء', value: RECITERS.length, color: 'text-[#fbbf24]', bg: 'bg-white/[0.02]' },
                    {
                      label: 'سيرفرات سليمة',
                      value: Object.values(reciterStatuses).filter(s => s.status === 'success').length,
                      color: 'text-emerald-400',
                      bg: 'bg-emerald-500/5 border border-emerald-500/10'
                    },
                    {
                      label: 'سيرفرات معطلة',
                      value: Object.values(reciterStatuses).filter(s => s.status === 'error').length,
                      color: 'text-red-400',
                      bg: 'bg-red-500/5 border border-red-500/10'
                    },
                    {
                      label: 'بانتظار الفحص',
                      value: RECITERS.length - Object.keys(reciterStatuses).length,
                      color: 'text-white/40',
                      bg: 'bg-white/[0.02]'
                    }
                  ].map(card => (
                    <div key={card.label} className={`rounded-2xl p-5 text-center ${card.bg}`}>
                      <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                      <p className="text-[11px] text-white/40 font-bold mt-1">{card.label}</p>
                    </div>
                  ))}
                </div>

                {/* Add New Reciter Form */}
                <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 text-right">
                  <h3 className="text-lg font-black text-white mb-4">إضافة قارئ جديد ➕</h3>
                  <form onSubmit={handleAddReciter} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2">
                        <label className={LABEL}>اسم القارئ</label>
                        <input
                          type="text"
                          required
                          value={newReciterName}
                          onChange={e => setNewReciterName(e.target.value)}
                          className={INPUT_CLASS}
                          placeholder="مثال: أحمد ديبان"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={LABEL}>رابط خادم الصوت (mp3quranServer)</label>
                        <input
                          type="text"
                          required
                          value={newReciterServer}
                          onChange={e => setNewReciterServer(e.target.value)}
                          className={INPUT_CLASS}
                          placeholder="مثال: server16.mp3quran.net/deban/Rewayat-Hafs-A-n-Assem"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={LABEL}>مجلد الآيات - اختياري (everyAyahFolder)</label>
                        <input
                          type="text"
                          value={newReciterEveryAyah}
                          onChange={e => setNewReciterEveryAyah(e.target.value)}
                          className={INPUT_CLASS}
                          placeholder="مثال: deban"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={LABEL}>معرف مخصص - اختياري (customId)</label>
                        <input
                          type="text"
                          value={newReciterCustomId}
                          onChange={e => setNewReciterCustomId(e.target.value)}
                          className={INPUT_CLASS}
                          placeholder="مثال: ahmed_deban"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-4 pt-2">
                      <div className="text-xs text-white/30 font-bold">
                        {addReciterResult && <span>{addReciterResult}</span>}
                      </div>
                      <button
                        type="submit"
                        disabled={isAddingReciter}
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-black font-black transition hover:shadow-xl hover:shadow-emerald-500/20 text-xs disabled:opacity-50"
                      >
                        {isAddingReciter ? <Loader2 className="inline-block h-4 w-4 animate-spin" /> : 'إضافة القارئ الجديد'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Search and Table */}
                <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-5 mb-5">
                    <div className="text-right">
                      <h3 className="text-lg font-black text-white/95">قائمة القراء المتاحة</h3>
                      <p className="text-xs text-white/40 mt-0.5">اضغط على زر الفحص للتحقق من الاتصال، أو زر التشغيل لسماع عينة الفاتحة</p>
                    </div>
                    <input
                      value={reciterSearch}
                      onChange={e => setReciterSearch(e.target.value)}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-right outline-none text-xs text-white placeholder:text-white/20 w-full sm:w-64 focus:border-[#fbbf24]/30"
                      placeholder="ابحث عن قارئ بالاسم أو المعرّف..."
                    />
                  </div>

                  <div className="overflow-x-auto font-arabic">
                    <table className="w-full text-right border-collapse text-xs font-bold min-w-[700px]">
                      <thead>
                        <tr className="border-b border-white/5 text-white/30 text-[10px] uppercase tracking-wider">
                          <th className="pb-3 text-right p-3">اسم القارئ</th>
                          <th className="pb-3 text-right p-3">رابط السيرفر</th>
                          <th className="pb-3 text-right p-3">رابط الآيات (EveryAyah)</th>
                          <th className="pb-3 text-center p-3">الحالة الفنية</th>
                          <th className="pb-3 text-center p-3">التجربة والتشغيل</th>
                          <th className="pb-3 text-left p-3">الإجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.03]">
                        {filteredReciters.map((reciter) => {
                          const statusObj = reciterStatuses[reciter.id] || { status: 'idle' };
                          const isPlaying = reciterAudioPlaying === reciter.id;

                          return (
                            <tr key={reciter.id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="py-3.5 p-3">
                                <div>
                                  <p className="font-black text-white/90 text-sm">{reciter.name}</p>
                                  <p className="text-[10px] text-white/20 font-mono mt-0.5">ID: {reciter.id}</p>
                                </div>
                              </td>
                              <td className="py-3.5 p-3 text-white/40 font-mono text-[11px] truncate max-w-[200px]" title={reciter.mp3quranServer}>
                                {reciter.mp3quranServer}
                              </td>
                              <td className="py-3.5 p-3 text-white/30 font-mono text-[11px] truncate max-w-[150px]" title={reciter.everyAyahFolder || 'لا يوجد'}>
                                {reciter.everyAyahFolder || '—'}
                              </td>
                              <td className="py-3.5 p-3 text-center">
                                {statusObj.status === 'idle' && (
                                  <span className="text-white/30 bg-white/5 px-2.5 py-1 rounded-lg">لم يفحص</span>
                                )}
                                {statusObj.status === 'checking' && (
                                  <span className="text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg flex items-center justify-center gap-1.5 w-24 mx-auto">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    جاري...
                                  </span>
                                )}
                                {statusObj.status === 'success' && (
                                  <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                                    سليم ({statusObj.code})
                                  </span>
                                )}
                                {statusObj.status === 'error' && (
                                  <span className="text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg" title={statusObj.error}>
                                    معطل ({statusObj.code || 'خطأ'})
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 p-3 text-center">
                                <button
                                  onClick={() => togglePlayReciterAudio(reciter)}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${isPlaying
                                      ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                                    }`}
                                  title={isPlaying ? "إيقاف التشغيل" : "تشغيل عينة الفاتحة"}
                                >
                                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </button>
                              </td>
                              <td className="py-3.5 p-3 text-left">
                                <button
                                  onClick={() => checkSingleReciter(reciter)}
                                  className="px-3.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 transition text-[11px]"
                                >
                                  فحص الرابط 🔄
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredReciters.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-sm text-white/20 font-bold">
                              لا يوجد قراء يطابقون البحث
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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
                              {u.phoneNumber ? (
                                <a
                                  href={(() => {
                                    let phone = u.phoneNumber.replace(/[^0-9]/g, "");
                                    if (phone.startsWith("01") && phone.length === 11) {
                                      phone = "2" + phone;
                                    } else if (phone.startsWith("1") && phone.length === 10) {
                                      phone = "20" + phone;
                                    }
                                    const name = u.displayName || "مستخدم يقين";
                                    const siteLink = typeof window !== "undefined" ? window.location.origin : "https://yaqeenalquran.online";
                                    const text = `السلام عليكم يا ${name}، منور منصة يقين للقرآن الكريم. 🌸\n\nحابب أشكرك جداً إنك بتستخدم موقعنا:\n${siteLink}\n\nكنت حابب أسألك بخصوص تجربتك للموقع: هل جربته تجربة كاملة واستخدمت ميزاته، ولا جربته مرة واحدة بس؟ وإيه هي المشاكل أو العقبات اللي قابلتك في الموقع ومحتاجنا نصلحها ونعدلها؟\n\nرأيك بيفرق معانا جداً عشان نحسن المنصة!`;
                                    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
                                  })()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-[11px] font-black transition"
                                >
                                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                  </svg>
                                  واتساب
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 text-white/20 px-4 py-2 text-[11px] font-black cursor-not-allowed">
                                  <svg className="w-3.5 h-3.5 fill-current opacity-30" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                  </svg>
                                  لا يوجد هاتف
                                </span>
                              )}
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

            {activeTab === 'tiktok' && (
              <SocialManagerPanel />
            )}

            {activeTab === 'tests' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/[0.06] p-6 rounded-3xl">
                  <div className="text-right flex-1">
                    <h2 className="text-2xl font-black text-white">لوحة تشخيص واختبارات النظام 🧪</h2>
                    <p className="text-xs text-white/40 mt-1">فحص الاتصال بقواعد البيانات، خادم الفيديوهات السحابي، ومفاتيح API لضمان عمل التطبيق بكفاءة</p>
                  </div>
                  <button
                    onClick={runAllDiagnostics}
                    disabled={diagRunning}
                    className="flex items-center gap-2 px-6 py-3.5 bg-[#fbbf24] text-black font-black rounded-xl hover:brightness-110 active:scale-95 transition disabled:opacity-50 text-xs shadow-lg shadow-[#fbbf24]/10"
                  >
                    {diagRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري تشغيل الفحص...
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />
                        تشغيل الفحص الشامل للخدمات ⚡
                      </>
                    )}
                  </button>
                </div>

                {/* Diagnostic Cards Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      id: 'database',
                      title: 'قاعدة بيانات Firestore 💾',
                      status: dbStatus,
                      message: dbMessage,
                      checkFn: checkDbDiagnostic,
                      desc: 'اختبار قراءة بيانات المستخدمين من Firestore وتأكيد نجاح الاتصال.'
                    },
                    {
                      id: 'auth',
                      title: 'صلاحيات حساب المشرف 🔑',
                      status: authStatus,
                      message: authMessage,
                      checkFn: checkAuthDiagnostic,
                      desc: 'التحقق من صلاحية الجلسة الحالية وتصاريح المسؤول الحالية.'
                    },
                    {
                      id: 'pexels',
                      title: 'مزود الخلفيات Pexels API 🖼️',
                      status: pexelsStatus,
                      message: pexelsMessage,
                      checkFn: checkPexelsDiagnostic,
                      desc: 'اختبار البحث عن الصور ومقاطع الفيديو للتأكد من عمل مفتاح API بنجاح.'
                    },
                    {
                      id: 'render',
                      title: 'سيرفر المونتاج السحابي 🎬',
                      status: renderServerStatus,
                      message: renderServerMessage,
                      checkFn: checkRenderServerDiagnostic,
                      desc: 'التحقق من حالة سيرفر رندر الفيديوهات على Hugging Face ومعدل الاستجابة.'
                    },
                    {
                      id: 'env',
                      title: 'متغيرات البيئة والتخزين 📦',
                      status: envStatus,
                      message: envMessage,
                      checkFn: checkEnvDiagnostic,
                      desc: 'فحص إعدادات التخزين المحلي (localStorage) ومتغيرات Firebase المطلوبة.'
                    }
                  ].map(card => (
                    <div key={card.id} className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.02)] p-6 flex flex-col justify-between hover:border-white/20 transition duration-300">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <span className="font-black text-sm text-white/90">{card.title}</span>
                          {card.status === 'idle' && <span className="w-2.5 h-2.5 rounded-full bg-white/20 animate-pulse" title="بانتظار الفحص" />}
                          {card.status === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-[#fbbf24]" />}
                          {card.status === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                          {card.status === 'error' && <AlertTriangle className="w-5 h-5 text-red-400" />}
                        </div>
                        <p className="text-[11px] text-white/40 leading-relaxed text-right">{card.desc}</p>

                        {card.status !== 'idle' && (
                          <div className={`p-3.5 rounded-xl text-xs font-bold text-right leading-relaxed ${card.status === 'success'
                              ? 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-300'
                              : card.status === 'error'
                                ? 'bg-red-500/5 border border-red-500/10 text-red-300'
                                : 'bg-white/5 border border-white/5 text-white/50'
                            }`}>
                            {card.message}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={card.checkFn}
                        disabled={diagRunning || card.status === 'checking'}
                        className="mt-6 w-full py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white/80 transition active:scale-98 disabled:opacity-40"
                      >
                        فحص الخدمة فردياً 🔄
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Support Ticket Details Modal */}
      {isTicketModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" dir="rtl">
          <div className="relative w-full max-w-2xl bg-[#0b0f1a] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="text-right">
                <h3 className="text-lg font-black text-white">تفاصيل الشكوى / طلب الدعم</h3>
                <p className="text-xs text-white/40 mt-1">المعرف: {selectedTicket.id}</p>
              </div>
              <button
                onClick={() => { setIsTicketModalOpen(false); setSelectedTicket(null); setSelectedTicketUser(null); }}
                className="p-2 text-white/40 hover:text-white transition-colors hover:bg-white/5 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
              {/* Left Column: Complaint details */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
                  <h4 className="text-xs font-black text-[#fbbf24] uppercase tracking-wider">محتوى الرسالة</h4>
                  <div className="text-sm text-white/90 bg-white/[0.02] border border-white/5 rounded-xl p-3.5 min-h-[120px] whitespace-pre-wrap break-words leading-relaxed select-text" dir="rtl">
                    {selectedTicket.message || 'لا يوجد نص'}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
                  <h4 className="text-xs font-black text-[#fbbf24] uppercase tracking-wider">تفاصيل التذكرة</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-white/40 block">حالة الطلب</span>
                      <span className={`inline-block mt-1.5 rounded-full px-2.5 py-0.5 font-bold ${selectedTicket.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : selectedTicket.status === 'in_progress'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                        {selectedTicket.status === 'resolved'
                          ? 'تم الحل'
                          : selectedTicket.status === 'in_progress'
                            ? 'قيد المعالجة'
                            : 'جديد'}
                      </span>
                    </div>
                    <div>
                      <span className="text-white/40 block">تاريخ الإرسال</span>
                      <span className="text-white/80 block mt-1.5 font-sans" dir="ltr">
                        {selectedTicket.createdAt?.toDate
                          ? selectedTicket.createdAt.toDate().toLocaleString("ar-EG")
                          : (selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString("ar-EG") : "غير محدد")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: User Details */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 space-y-3">
                  <h4 className="text-xs font-black text-[#fbbf24] uppercase tracking-wider">بيانات مرسل الشكوى</h4>

                  {selectedTicketUser === "loading" ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <Loader2 className="w-6 h-6 text-[#fbbf24] animate-spin" />
                      <span className="text-xs text-white/30">جاري تحميل بيانات المستخدم...</span>
                    </div>
                  ) : selectedTicketUser ? (
                    <div className="space-y-3 text-xs">
                      <div className="flex items-center gap-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                        <img
                          src={selectedTicketUser.photoURL || selectedTicketUser.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=youssef"}
                          alt=""
                          className="w-10 h-10 rounded-lg bg-white/5 object-cover"
                        />
                        <div className="text-right">
                          <div className="text-sm font-black text-white">{selectedTicketUser.displayName || selectedTicketUser.name || 'مستخدم قرآني'}</div>
                          <div className="text-white/40">@{selectedTicketUser.username || 'بدون_يوزر'}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <span className="text-white/40 block">البريد الإلكتروني</span>
                          <span className="text-white/80 block mt-0.5 select-all font-mono" dir="ltr">{selectedTicketUser.email || 'غير مسجل'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">رقم الهاتف</span>
                          <span className="text-white/80 block mt-0.5 select-all font-mono" dir="ltr">{selectedTicketUser.phoneNumber || selectedTicketUser.phone || selectedTicket.phone || 'غير مسجل'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">البلد المسجل</span>
                          <span className="text-white/80 block mt-0.5">{selectedTicketUser.country || 'غير محدد'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">نوع الحساب / الباقة</span>
                          <span className="text-white/80 block mt-0.5 font-bold text-amber-400">{selectedTicketUser.plan === 'premium' ? 'مساهم مميز 💎' : 'مجاني'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">مجموع النقاط</span>
                          <span className="text-white/80 block mt-0.5 font-bold text-emerald-400">{selectedTicketUser.totalPoints || selectedTicketUser.points || 0} نقطة</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">رقم المستخدم (UID)</span>
                          <span className="text-[10px] text-white/60 block mt-0.5 select-all font-mono truncate" dir="ltr" title={selectedTicketUser.uid || selectedTicketUser.id}>
                            {selectedTicketUser.uid || selectedTicketUser.id || 'غير معروف'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-center text-red-400 font-bold">
                        لم يتم العثور على حساب مسجل لهذا المرسل (قد يكون تم إرسالها كحساب زائر)
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                        <div>
                          <span className="text-white/40 block">الاسم المدخل</span>
                          <span className="text-white/80 block mt-0.5">{selectedTicket.userName || 'غير معروف'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block">الهاتف المدخل</span>
                          <span className="text-white/80 block mt-0.5 select-all font-mono" dir="ltr">{selectedTicket.phone || 'غير محدد'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-3 justify-end">
              {selectedTicket.status !== 'in_progress' && selectedTicket.status !== 'resolved' && (
                <button
                  onClick={async () => {
                    await handleUpdateTicketStatus(selectedTicket.id, 'in_progress');
                    setSelectedTicket((prev: any) => prev ? { ...prev, status: 'in_progress' } : null);
                  }}
                  className="rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-black text-black hover:brightness-110 active:scale-95 transition-all"
                >
                  تغيير إلى: قيد المعالجة
                </button>
              )}
              {selectedTicket.status !== 'resolved' && (
                <button
                  onClick={async () => {
                    await handleUpdateTicketStatus(selectedTicket.id, 'resolved');
                    setSelectedTicket((prev: any) => prev ? { ...prev, status: 'resolved' } : null);
                  }}
                  className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-black hover:brightness-110 active:scale-95 transition-all"
                >
                  تغيير إلى: تم الحل
                </button>
              )}
              <button
                onClick={async () => {
                  if (window.confirm("حذف هذه الشكوى نهائياً؟")) {
                    await handleDeleteTicket(selectedTicket.id);
                    setIsTicketModalOpen(false);
                    setSelectedTicket(null);
                    setSelectedTicketUser(null);
                  }
                }}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white hover:brightness-110 active:scale-95 transition-all"
              >
                حذف الشكوى
              </button>
              <button
                onClick={() => { setIsTicketModalOpen(false); setSelectedTicket(null); setSelectedTicketUser(null); }}
                className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2.5 text-xs font-black text-white active:scale-95 transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
