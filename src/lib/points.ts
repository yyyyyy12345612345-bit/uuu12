import { db, auth } from "./firebase";
import { 
  doc, 
  updateDoc, 
  increment, 
  getDoc, 
  setDoc, 
  Timestamp,
  serverTimestamp
} from "firebase/firestore";

// Constants for Anti-Cheat
const MIN_PAGE_READ_TIME = 90; // 1.5 minutes for a full page
const DAILY_POINTS_CAP = 5000; // Increased cap due to higher points

export interface PointUpdateResult {
  success: boolean;
  message?: string;
}

/**
 * Adds points to the user's account with anti-cheat checks
 */
export async function addPoints(type: "quran" | "athkar" | "listen", amount: number = 1): Promise<PointUpdateResult> {
  const user = auth?.currentUser;
  if (!user || !db) {
    console.warn("Points: User not logged in or DB not ready");
    return { success: false, message: "User not logged in" };
  }

  const userRef = doc(db, "users", user.uid);
  const dailyRef = doc(db, "users", user.uid, "stats", "daily");

  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
        console.warn("Points: User document does not exist");
        return { success: false };
    }
    
    const userData = userDoc.data();
    
    // 0. Check if user is banned
    if (userData.isBanned) {
      return { success: false, message: "عذراً، تم حظر حسابك لمخالفة القوانين" };
    }

    const today = new Date().toISOString().split("T")[0];
    const dailyDoc = await getDoc(dailyRef);
    const dailyData = dailyDoc.exists() ? dailyDoc.data() : { date: today, points: 0 };

    // Reset daily points if it's a new day
    let dailyPoints = dailyData.date === today ? dailyData.points : 0;

    // 2. Check Daily Cap
    if (dailyPoints >= DAILY_POINTS_CAP) {
      return { success: false, message: "لقد وصلت للحد الأقصى للنقاط اليومية" };
    }

    // 3. Update Firestore (Atomic)
    const pointsToAdd = Number(amount);
    if (isNaN(pointsToAdd) || pointsToAdd <= 0) return { success: false };
    
    const fieldMap: any = {
      quran: "quranPoints",
      athkar: "athkarPoints",
      listen: "listenPoints"
    };

    const updateData: any = {
      totalPoints: increment(pointsToAdd),
      lastActive: new Date().toISOString()
    };

    if (fieldMap[type]) {
        updateData[fieldMap[type]] = increment(pointsToAdd);
    }

    await updateDoc(userRef, updateData);

    // Update daily stats
    await setDoc(dailyRef, {
      date: today,
      points: increment(pointsToAdd)
    }, { merge: true });

    console.log(`[Points] Added ${pointsToAdd} to ${type}. New daily total: ${dailyPoints + pointsToAdd}`);
    return { success: true };
  } catch (e) {
    console.error("Error adding points:", e);
    return { success: false, message: "حدث خطأ أثناء تحديث النقاط" };
  }
}

/**
 * Claims a specific quest's points
 */
export async function claimQuestPoints(questId: string, amount: number): Promise<PointUpdateResult> {
  const user = auth?.currentUser;
  if (!user || !db) return { success: false, message: "يجب تسجيل الدخول أولاً" };

  const questClaimRef = doc(db, "users", user.uid, "completed_quests", questId);

  try {
    const claimDoc = await getDoc(questClaimRef);
    if (claimDoc.exists()) {
      return { success: false, message: "لقد حصلت على نقاط هذه المهمة بالفعل" };
    }

    // إضافة النقاط كعملية "قمر" (quran) أو حسب نوع المهمة
    const result = await addPoints("quran", amount);
    if (result.success) {
      // تسجيل المهمة كمكتملة
      await setDoc(questClaimRef, {
        completedAt: new Date().toISOString(),
        pointsEarned: amount
      });
      return { success: true, message: `مبروك! حصلت على +${amount} نقطة` };
    }
    return result;
  } catch (e) {
    console.error("Error claiming quest:", e);
    return { success: false, message: "فشل استلام النقاط" };
  }
}

/**
 * Handles Full Mushaf page reading with time validation
 */
let pageStartTime: number | null = null;
let lastPageId: string | null = null;

export function startPageTimer(pageId: string) {
  // If moving to a new page, the observer should have called endPageTimer for the old one.
  // But if not, we reset here.
  pageStartTime = Date.now();
  lastPageId = pageId;
}

export async function endPageTimer(amount: number = 3) {
  if (!pageStartTime || !lastPageId) return { success: false };

  const elapsedSeconds = (Date.now() - pageStartTime) / 1000;
  
  if (elapsedSeconds >= (MIN_PAGE_READ_TIME - 5)) {
    const result = await addPoints("quran", amount);
    pageStartTime = null;
    lastPageId = null;
    return result;
  }
  return { success: false, message: "يجب قراءة الصفحة بتمهل لاحتساب النقاط" };
}

/**
 * Handles Ayah reading in Normal Mushaf
 */
const MIN_AYAH_READ_TIME = 4;
let ayahStartTime: number | null = null;
let lastAyahId: string | null = null;

export function startAyahTimer(ayahId: string) {
  ayahStartTime = Date.now();
  lastAyahId = ayahId;
}

export async function endAyahTimer(amount: number = 10) {
  if (!ayahStartTime) return { success: false };
  const elapsedSeconds = (Date.now() - ayahStartTime) / 1000;
  
  if (elapsedSeconds >= MIN_AYAH_READ_TIME) {
    const result = await addPoints("quran", amount);
    ayahStartTime = null;
    lastAyahId = null;
    return result;
  }
  return { success: false };
}

/**
 * Handles Thikr reading in Athkar Library
 */
const MIN_THIKR_READ_TIME = 4;
let thikrStartTime: number | null = null;
let lastThikrId: string | null = null;

export function startThikrTimer(thikrId: string) {
  thikrStartTime = Date.now();
  lastThikrId = thikrId;
}

export async function endThikrTimer(amount: number = 0.5) {
  if (!thikrStartTime) return { success: false };
  const elapsedSeconds = (Date.now() - thikrStartTime) / 1000;
  
  if (elapsedSeconds >= MIN_THIKR_READ_TIME) {
    const result = await addPoints("athkar", amount);
    thikrStartTime = null;
    lastThikrId = null;
    return result;
  }
  return { success: false };
}


/**
 * Handles Sebha (Electronic Rosary) points
 */
export async function addSebhaPoints(amount: number = 3) {
   return await addPoints("athkar", amount);
}

/**
 * Increments the video render counter for a user
 */
export async function incrementVideoRenderCount() {
  const user = auth?.currentUser;
  if (!user || !db) return { success: false };

  const userRef = doc(db, "users", user.uid);
  try {
    await updateDoc(userRef, {
      videoRendersCount: increment(1),
      lastRenderAt: serverTimestamp()
    });
    return { success: true };
  } catch (e) {
    console.error("Error incrementing render count:", e);
    return { success: false };
  }
}

