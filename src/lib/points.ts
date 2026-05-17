import { db, auth } from "./firebase";
import { 
  doc, 
  updateDoc, 
  increment, 
  getDoc, 
  setDoc,
  serverTimestamp
} from "firebase/firestore";

/**
 * Universal Points System v4.0 (Global & Reliable)
 * Handles all point logic for Quran, Athkar, and Audio.
 */

export interface PointUpdateResult {
  success: boolean;
  message?: string;
}

// Internal state to track active timers
let activeTimers: Record<string, number> = {};
let lastAwardedAt: Record<string, number> = {};

/**
 * Universal addPoints - The heart of the system.
 * This is what actually hits Firestore and local storage.
 */
const DAILY_LIMITS: Record<string, number> = {
  quran: 100,   // Doubled from 50
  athkar: 200,  // Doubled from 100
  listen: 200,  // Doubled from 100
  video: 100,   // Doubled from 50
  bonus: 1000   
};

/**
 * Universal addPoints - The heart of the system.
 * This is what actually hits Firestore and local storage.
 */
export async function addPoints(type: string, amount: number = 1): Promise<PointUpdateResult> {
  const user = auth?.currentUser;
  if (!user) return { success: false, message: "يجب تسجيل الدخول لتجميع النقاط" };
  
  const pointsToAdd = Math.max(0, Number(amount));
  
  if (isNaN(pointsToAdd) || pointsToAdd <= 0) return { success: false };

  // --- Anti-Spam Cooldown ---
  const now = Date.now();
  if (lastAwardedAt[type] && now - lastAwardedAt[type] < 1000) {
    console.warn(`[Points] Cooldown active for ${type}`);
    return { success: false, message: "انتظر قليلاً قبل المحاولة مرة أخرى" };
  }
  // --------------------------

  // --- Daily Limit Logic ---
  const today = new Date().toDateString();
  const limitDateKey = "points_limit_date";
  const earnedTodayKey = `points_earned_today_${type}`;
  
  const savedDate = localStorage.getItem(limitDateKey);
  if (savedDate !== today) {
    // Reset all limits for a new day
    localStorage.setItem(limitDateKey, today);
    Object.keys(DAILY_LIMITS).forEach(k => localStorage.setItem(`points_earned_today_${k}`, "0"));
  }

  const currentEarned = parseInt(localStorage.getItem(earnedTodayKey) || "0");
  const limit = DAILY_LIMITS[type] || 100;

  if (currentEarned >= limit) {
    console.warn(`[Points] Daily limit reached for ${type}`);
    return { success: false, message: "لقد وصلت للحد الأقصى للنقاط لهذا النشاط اليوم" };
  }

  // Adjust points if they would exceed the limit
  const finalPointsToAdd = Math.min(pointsToAdd, limit - currentEarned);
  localStorage.setItem(earnedTodayKey, (currentEarned + finalPointsToAdd).toString());
  lastAwardedAt[type] = now; // Update cooldown timer
  // --------------------------

  console.log(`[Points] Adding ${finalPointsToAdd} for ${type} (Limit: ${currentEarned + finalPointsToAdd}/${limit})`);

  // 1. Instant Local Update
  try {
    const localKey = "cached_total_points";
    const current = parseInt(localStorage.getItem(localKey) || "0");
    localStorage.setItem(localKey, (current + finalPointsToAdd).toString());
  } catch (e) {}

  // 2. Persistent Firestore Update
  if (user && db) {
    try {
      const userRef = doc(db, "users", user.uid);
      const todayISO = new Date().toISOString().split("T")[0];
      const dailyRef = doc(db, "users", user.uid, "stats", todayISO);

      const fieldMap: any = {
        quran: "quranPoints",
        athkar: "athkarPoints",
        listen: "listenPoints",
        video: "videoPoints"
      };

      const updateData: any = {
        totalPoints: increment(finalPointsToAdd),
        lastActive: serverTimestamp()
      };

      if (fieldMap[type]) {
        updateData[fieldMap[type]] = increment(finalPointsToAdd);
      }

      await updateDoc(userRef, updateData);
      
      await setDoc(dailyRef, {
        points: increment(finalPointsToAdd),
        lastUpdate: serverTimestamp()
      }, { merge: true });

      window.dispatchEvent(new CustomEvent('pointsUpdated', { 
        detail: { type, amount: finalPointsToAdd } 
      }));

      return { success: true };
    } catch (err) {
      console.error("[Points] Firestore update error:", err);
      return { success: false };
    }
  }

  return { success: true, message: "Local update successful" };
}

/**
 * Universal Timer Start
 */
export function startTimer(id: string) {
  activeTimers[id] = Date.now();
  console.log(`[Points] Timer started for: ${id}`);
}

/**
 * Universal Timer End & Award
 */
export async function endTimer(id: string, minSeconds: number, type: string, amount: number) {
  const startTime = activeTimers[id];
  if (!startTime) return { success: false };

  const elapsed = (Date.now() - startTime) / 1000;
  
  // Prevent double awarding for same ID in a short window (5s)
  const lastAwarded = lastAwardedAt[id] || 0;
  if (Date.now() - lastAwarded < 5000) return { success: false };

  if (elapsed >= minSeconds) {
    const result = await addPoints(type, amount);
    if (result.success) {
      lastAwardedAt[id] = Date.now();
      delete activeTimers[id];
    }
    return result;
  }

  return { success: false, message: "Time threshold not met" };
}

/* ─── Standard Legacy Wrappers ─── */

export const startPageTimer = (pageId: string) => startTimer(`page_${pageId}`);
export const endPageTimer = async (amount: number) => {
    // Very flexible: just find any active page timer and end it
    const activePageKey = Object.keys(activeTimers).find(k => k.startsWith("page_"));
    if (activePageKey) return await endTimer(activePageKey, 10, "quran", amount);
    return { success: false };
};

export const startAyahTimer = (ayahId: string) => startTimer(`ayah_${ayahId}`);
export const endAyahTimer = async (amount: number) => {
    const activeAyahKey = Object.keys(activeTimers).find(k => k.startsWith("ayah_"));
    if (activeAyahKey) return await endTimer(activeAyahKey, 2, "quran", amount);
    return { success: false };
};

export const startThikrTimer = (thikrId: string) => startTimer(`thikr_${thikrId}`);
export const endThikrTimer = async (amount: number) => {
    const activeThikrKey = Object.keys(activeTimers).find(k => k.startsWith("thikr_"));
    if (activeThikrKey) return await endTimer(activeThikrKey, 2, "athkar", amount);
    return { success: false };
};

export const addSebhaPoints = async (amount: number = 3) => await addPoints("athkar", amount);

export async function claimQuestPoints(questId: string, amount: number) {
  const user = auth?.currentUser;
  if (!user || !db) return { success: false };
  
  try {
    const questRef = doc(db, "users", user.uid, "completed_quests", questId);
    const snap = await getDoc(questRef);
    if (snap.exists()) return { success: false, message: "تم الاستلام" };
    
    const res = await addPoints("bonus", amount);
    if (res.success) {
      await setDoc(questRef, { completedAt: serverTimestamp(), points: amount });
    }
    return res;
  } catch (e) {
    return { success: false };
  }
}

/**
 * Award points for completing a surah, but only ONCE per surah.
 */
export async function claimSurahCompletionPoints(surahId: number, amount: number = 10) {
  const user = auth?.currentUser;
  if (!user || !db) return { success: false };

  try {
    const completionRef = doc(db, "users", user.uid, "completed_surahs", surahId.toString());
    const snap = await getDoc(completionRef);
    
    if (snap.exists()) {
      console.log(`[Points] Surah ${surahId} already claimed.`);
      return { success: false, message: "تم الحصول على نقاط هذه السورة مسبقاً" };
    }

    const res = await addPoints("listen", amount);
    if (res.success) {
      await setDoc(completionRef, {
        surahId,
        completedAt: serverTimestamp(),
        points: amount
      });
    }
    return res;
  } catch (e) {
    console.error("[Points] claimSurahCompletionPoints error:", e);
    return { success: false };
  }
}

export async function incrementVideoRenderCount() {
  const user = auth?.currentUser;
  if (user && db) {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        videoRendersCount: increment(1)
      });
      return { success: true };
    } catch (e) { return { success: false }; }
  }
  return { success: false };
}
