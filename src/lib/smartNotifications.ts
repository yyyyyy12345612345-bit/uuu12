/**
 * 🔔 Smart Personalized Notification System - v22
 *
 * Features:
 * 1. Per-user intelligence: Reads user's actual points & activity from Firestore
 * 2. Personalized messages based on yesterday's points vs today's
 * 3. Streak tracking - encourage users who haven't opened the app
 * 4. Friday Al-Kahf reminder
 * 5. Custom notification sound (public/audio/notification.mp3)
 * 6. Salawat audio reminder (public/audio/salawat.mp3) with custom interval
 */

import { db, auth } from './firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// ─── Storage Keys ────────────────────────────────────────────────────────────
const DAILY_REMINDER_KEY = 'smart_notif_daily_last';
const KAHF_REMINDER_KEY = 'smart_notif_kahf_last';
const NOTIF_SETTINGS_KEY = 'user_notif_settings';
const USER_DAILY_POINTS_KEY = 'user_daily_points_cache';
const ATHKAR_REMINDER_KEY = 'smart_notif_athkar_last';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface NotifSettings {
  allowNotifications: boolean;
  dailyReminder: boolean;
  fridayKahf: boolean;
  reminderHour: number; // 0–23
  // Salawat (صلي على النبي) settings
  salawatEnabled: boolean;
  salawatIntervalMinutes: number; // every X minutes
  // Athkar reminders
  athkarReminders: boolean;
}

interface UserPointsCache {
  date: string;
  points: number;
  lastOpenDate: string;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
export function defaultSettings(): NotifSettings {
  return {
    allowNotifications: true,
    dailyReminder: true,
    fridayKahf: true,
    reminderHour: 9,
    salawatEnabled: false,
    salawatIntervalMinutes: 60,
    athkarReminders: true,
  };
}

export function getNotifSettings(): NotifSettings {
  if (typeof localStorage === 'undefined') return defaultSettings();
  try {
    const stored = localStorage.getItem(NOTIF_SETTINGS_KEY);
    if (stored) return { ...defaultSettings(), ...JSON.parse(stored) };
  } catch {}
  return defaultSettings();
}

export function saveNotifSettings(settings: NotifSettings): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(settings));
}

// ─── Audio System ─────────────────────────────────────────────────────────────
let notifAudio: HTMLAudioElement | null = null;
let salawatAudio: HTMLAudioElement | null = null;

function playNotificationSound(): void {
  try {
    if (!notifAudio) {
      // Pre-load audio to ensure it's ready
      notifAudio = new Audio('/audio/notification.mp3');
      notifAudio.load();
      notifAudio.volume = 0.7;
    }
    notifAudio.currentTime = 0;
    notifAudio.play().catch(() => {
      // Silently fail if autoplay blocked
    });
  } catch {}
}

function playSalawatSound(): void {
  try {
    if (!salawatAudio) {
      salawatAudio = new Audio('/audio/salawat.mp3');
      salawatAudio.volume = 0.8;
    }
    salawatAudio.currentTime = 0;
    salawatAudio.play().catch(() => {});
  } catch {}
}

// ─── Core Notification Sender ─────────────────────────────────────────────────
function showNotification(
  title: string,
  body: string,
  icon = '/logo/logo.png',
  tag = 'yaqeen-notif',
  playSound = true
): void {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;

  try {
    const notif = new Notification(title, {
      body,
      icon,
      badge: '/icon-192.png',
      tag,
      dir: 'rtl',
      lang: 'ar',
      silent: true, // We handle sound ourselves
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    if (playSound) playNotificationSound();
  } catch (e) {
    console.warn('[SmartNotif] Failed to show notification:', e);
  }
}

// ─── Permission ───────────────────────────────────────────────────────────────
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ─── User Intelligence Engine ─────────────────────────────────────────────────
interface SmartContext {
  userName: string;
  yesterdayPoints: number;
  totalPoints: number;
  lastOpenDate: string;
  daysMissed: number;
  rank?: number;
}

async function fetchUserSmartContext(): Promise<SmartContext | null> {
  const user = auth?.currentUser;
  if (!user || !db) return null;

  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) return null;

    const data = snap.data();
    const today = new Date().toDateString();
    const lastOpen = data.lastActive
      ? (typeof data.lastActive === 'string'
          ? new Date(data.lastActive)
          : data.lastActive.toDate?.() ?? new Date(data.lastActive))
      : null;

    const lastOpenDate = lastOpen ? lastOpen.toDateString() : '';
    let daysMissed = 0;

    if (lastOpenDate) {
      const diff = Date.now() - (lastOpen?.getTime() ?? Date.now());
      daysMissed = Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    // Cache today's points
    const cached: UserPointsCache = JSON.parse(
      localStorage.getItem(USER_DAILY_POINTS_KEY) || '{}'
    );
    const yesterdayPoints = cached.date === today ? 0 : (cached.points ?? 0);

    // Update cache with today's points
    localStorage.setItem(
      USER_DAILY_POINTS_KEY,
      JSON.stringify({
        date: today,
        points: data.totalPoints ?? 0,
        lastOpenDate,
      })
    );

    return {
      userName: data.displayName || data.username || 'أخي الكريم',
      yesterdayPoints,
      totalPoints: data.totalPoints ?? 0,
      lastOpenDate,
      daysMissed,
    };
  } catch (e) {
    console.warn('[SmartNotif] Failed to fetch user context:', e);
    return null;
  }
}

// ─── Personalized Message Generator ──────────────────────────────────────────
function generateSmartMessage(ctx: SmartContext): { title: string; body: string } {
  const name = ctx.userName.split(' ')[0]; // First name only

  // 1. User hasn't opened for multiple days
  if (ctx.daysMissed >= 3) {
    const missedDays = ctx.daysMissed;
    return {
      title: `🌙 نشتاق إليك ${name}!`,
      body: `${missedDays} أيام بدون قرآن! عودتك بحسنة واحدة أحسن من الغياب. افتح سكينة الآن 💚`,
    };
  }

  if (ctx.daysMissed === 2) {
    return {
      title: `📿 ${name}، عد إلينا!`,
      body: `أمس والأمس قبله بدون قراءة. لا تكسر سلسلة حسناتك، آية واحدة تكفي ✨`,
    };
  }

  if (ctx.daysMissed === 1) {
    return {
      title: `⚡ ${name}، أمس غبت!`,
      body: `أمس لم تفتح سكينة. اليوم عوّض وابدأ من حيث توقفت 📖`,
    };
  }

  // 2. User has points from yesterday - personalized comparison
  if (ctx.yesterdayPoints > 0) {
    const yp = ctx.yesterdayPoints;

    if (yp >= 500) {
      return {
        title: `🏆 بطل! امس جبت ${yp} نقطة`,
        body: `رقم مميز! هل تقدر تكرره اليوم؟ تحداك تجيب أكتر 💪 افتح سكينة الآن`,
      };
    }

    if (yp >= 200) {
      return {
        title: `⭐ ${name}، امس ${yp} نقطة!`,
        body: `أداء ممتاز! اليوم ارفع السقف واجعله ${Math.round(yp * 1.3)} نقطة 🚀`,
      };
    }

    if (yp >= 50) {
      return {
        title: `📈 ${name}، امس ${yp} نقطة`,
        body: `بداية جيدة! اليوم استهدف ${yp * 2} نقطة واكسب ضعف الأجر 📖`,
      };
    }

    if (yp > 0 && yp < 50) {
      return {
        title: `💡 ${name}، امس ${yp} نقطة فقط`,
        body: `ما شاء الله حتى ولو قليل! اليوم قرأ سورتين واكسب أضعافها 🌟`,
      };
    }
  }

  // 3. Total points milestone messages
  const tp = ctx.totalPoints;
  if (tp >= 10000) {
    return {
      title: `👑 ${name}، ${tp.toLocaleString()} نقطة!`,
      body: `أنت من النخبة! حافظ على تقدمك واقرأ القرآن اليوم 🌟`,
    };
  }

  if (tp >= 1000) {
    return {
      title: `💎 ${name}، ${tp.toLocaleString()} نقطة`,
      body: `رحلة ممتازة! استمر واقرأ القرآن يومياً لتحقق المزيد 📿`,
    };
  }

  // 4. Default motivational messages (varied)
  const defaults = [
    {
      title: '📖 وقت القرآن',
      body: 'لم تقرأ القرآن اليوم بعد. ابدأ بسورة واحدة على الأقل 🌙',
    },
    {
      title: '✨ ذكر الله',
      body: 'اقرأ القرآن واكسب النقاط! كل حرف بعشر حسنات 📿',
    },
    {
      title: '🌙 سكينة تنتظرك',
      body: 'خُذ دقيقة مع كلام الله. قلبك يحتاجها 💚',
    },
    {
      title: '📿 لا تنسَ القرآن',
      body: 'تلاوة يومية = قلب مطمئن. افتح سكينة الآن ✨',
    },
  ];

  return defaults[Math.floor(Math.random() * defaults.length)];
}

// ─── Daily Smart Reminder ─────────────────────────────────────────────────────
export async function checkDailyReminder(): Promise<void> {
  const settings = getNotifSettings();
  if (!settings.allowNotifications || !settings.dailyReminder) return;

  const today = new Date().toDateString();
  const lastShown = localStorage.getItem(DAILY_REMINDER_KEY);
  if (lastShown === today) return;

  const currentHour = new Date().getHours();
  if (currentHour < settings.reminderHour) return;

  // Fetch personalized user context
  const ctx = await fetchUserSmartContext();

  let title: string;
  let body: string;

  if (ctx) {
    const msg = generateSmartMessage(ctx);
    title = msg.title;
    body = msg.body;
  } else {
    // Fallback for non-logged-in users
    const defaults = [
      { title: '📖 وقت القرآن', body: 'ابدأ يومك بآيات من القرآن الكريم 🌙' },
      { title: '✨ سكينة تنتظرك', body: 'قراءة القرآن تجلب السكينة والراحة 💚' },
    ];
    const msg = defaults[Math.floor(Math.random() * defaults.length)];
    title = msg.title;
    body = msg.body;
  }

  showNotification(title, body, '/logo/logo.png', 'daily-reminder', true);
  localStorage.setItem(DAILY_REMINDER_KEY, today);
}

// ─── Friday Al-Kahf Reminder ──────────────────────────────────────────────────
export function checkFridayKahfReminder(): void {
  const settings = getNotifSettings();
  if (!settings.allowNotifications || !settings.fridayKahf) return;

  const now = new Date();
  const isFriday = now.getDay() === 5;
  if (!isFriday) return;

  const today = now.toDateString();
  const lastShown = localStorage.getItem(KAHF_REMINDER_KEY);
  if (lastShown === today) return;

  showNotification(
    '🌿 يوم الجمعة المبارك',
    'لا تنسَ قراءة سورة الكهف اليوم! من قرأها أضاءت له نور بين الجمعتين 🤍',
    '/logo/logo.png',
    'friday-kahf',
    true
  );

  localStorage.setItem(KAHF_REMINDER_KEY, today);
}

// ─── Forgotten Athkar Reminders ───────────────────────────────────────────────
const ATHKAR_REMINDERS = [
  {
    id: 'morning',
    title: '🌅 أذكار الصباح',
    body: 'لم تقرأ أذكار الصباح بعد! ابدأ يومك بذكر الله 💚',
    timeRange: { start: 5, end: 10 }, // 5 AM - 10 AM
  },
  {
    id: 'evening',
    title: '🌇 أذكار المساء',
    body: 'وقت أذكار المساء! حصّن نفسك بالذكر قبل الغروب 🌙',
    timeRange: { start: 15, end: 19 }, // 3 PM - 7 PM
  },
  {
    id: 'sleep',
    title: '😴 أذكار النوم',
    body: 'قبل ما تنام، لا تنس أذكار النوم. تحميك طول الليل ✨',
    timeRange: { start: 21, end: 24 }, // 9 PM - 12 AM
  },
  {
    id: 'wakeup',
    title: '☀️ أذكار الاستيقاظ',
    body: 'صباح الخير! ابدأ يومك بأذكار الاستيقاظ والحمد لله 🌟',
    timeRange: { start: 5, end: 9 }, // 5 AM - 9 AM
  },
  {
    id: 'home_exit',
    title: '🚪 أذكار الخروج من المنزل',
    body: 'خارج البيت؟ لا تنس دعاء الخروج: "بسم الله، توكلت على الله" 🤲',
    timeRange: { start: 6, end: 22 }, // 6 AM - 10 PM (all day)
  },
  {
    id: 'home_enter',
    title: '🏠 أذكار دخول المنزل',
    body: 'داخل البيت؟ قل: "بسم الله ولجنا وبسم الله خرجنا" 🏡',
    timeRange: { start: 6, end: 24 }, // All day
  },
];

export function checkAthkarReminders(): void {
  const settings = getNotifSettings();
  if (!settings.allowNotifications || !settings.athkarReminders) return;

  const now = new Date();
  const currentHour = now.getHours();
  const today = now.toDateString();

  // Check which athkar reminders should be shown
  ATHKAR_REMINDERS.forEach((reminder) => {
    const { start, end } = reminder.timeRange;
    
    // Check if current time is within the reminder's time range
    if (currentHour >= start && currentHour < end) {
      const reminderKey = `${ATHKAR_REMINDER_KEY}_${reminder.id}_${today}`;
      const lastShown = localStorage.getItem(reminderKey);
      
      // Only show once per day per reminder type
      if (lastShown !== today) {
        showNotification(
          reminder.title,
          reminder.body,
          '/logo/logo.png',
          `athkar-${reminder.id}`,
          true
        );
        localStorage.setItem(reminderKey, today);
      }
    }
  });
}

// ─── Salawat Reminder ─────────────────────────────────────────────────────────
let salawatInterval: ReturnType<typeof setInterval> | null = null;

export function startSalawatReminder(intervalMinutes: number): void {
  if (salawatInterval) clearInterval(salawatInterval);
  if (intervalMinutes <= 0) return;

  const ms = intervalMinutes * 60 * 1000;

  salawatInterval = setInterval(() => {
    playSalawatSound();
    // Also show a silent notification card
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('🌸 اللهم صلِّ على محمد', {
          body: 'صلَّى الله عليه وسلَّم ♡',
          icon: '/logo/logo.png',
          tag: 'salawat',
          silent: true,
          dir: 'rtl',
        });
      } catch {}
    }
  }, ms);

  console.log(`[SmartNotif] Salawat reminder started: every ${intervalMinutes} min`);
}

export function stopSalawatReminder(): void {
  if (salawatInterval) {
    clearInterval(salawatInterval);
    salawatInterval = null;
  }
}

// ─── Init & Cleanup ───────────────────────────────────────────────────────────
let mainInterval: ReturnType<typeof setInterval> | null = null;

export async function initSmartNotifications(): Promise<void> {
  const settings = getNotifSettings();
  if (!settings.allowNotifications) return;

  const granted = await requestBrowserNotificationPermission();
  if (!granted) return;

  // Run immediately
  await checkDailyReminder();
  checkFridayKahfReminder();
  checkAthkarReminders();

  // Periodic checks every 30 minutes
  if (mainInterval) clearInterval(mainInterval);
  mainInterval = setInterval(async () => {
    await checkDailyReminder();
    checkFridayKahfReminder();
    checkAthkarReminders();
  }, 30 * 60 * 1000);

  // Start salawat if enabled
  if (settings.salawatEnabled && settings.salawatIntervalMinutes > 0) {
    startSalawatReminder(settings.salawatIntervalMinutes);
  }

  (window as any).__smartNotifCleanup = cleanupSmartNotifications;
}

export function cleanupSmartNotifications(): void {
  if (mainInterval) {
    clearInterval(mainInterval);
    mainInterval = null;
  }
  stopSalawatReminder();
}

/**
 * Call this when user updates notification settings, to restart with new config
 */
export async function restartSmartNotifications(): Promise<void> {
  cleanupSmartNotifications();
  await initSmartNotifications();
}
