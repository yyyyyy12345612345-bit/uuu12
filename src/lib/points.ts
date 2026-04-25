import { db, auth } from "./firebase";
import { 
  doc, 
  updateDoc, 
  increment, 
  getDoc, 
  setDoc, 
  Timestamp 
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
  if (!user || !db) return { success: false, message: "User not logged in" };

  const userRef = doc(db, "users", user.uid);
  const dailyRef = doc(db, "users", user.uid, "stats", "daily");

  try {
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};
    
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
    let pointsToAdd = amount;
    
    const fieldMap: any = {
      quran: "quranPoints",
      athkar: "athkarPoints",
      listen: "listenPoints"
    };

    await updateDoc(userRef, {
      totalPoints: increment(pointsToAdd),
      [fieldMap[type]]: increment(pointsToAdd),
      lastActive: new Date().toISOString()
    });

    // Update daily stats
    await setDoc(dailyRef, {
      date: today,
      points: increment(pointsToAdd)
    }, { merge: true });

    return { success: true };
  } catch (e) {
    console.error("Error adding points:", e);
    return { success: false, message: "حدث خطأ أثناء تحديث النقاط" };
  }
}

/**
 * Handles Full Mushaf page reading with time validation
 */
let pageStartTime: number | null = null;
let lastPageId: string | null = null;

export function startPageTimer(pageId: string) {
  pageStartTime = Date.now();
  lastPageId = pageId;
}

export async function endPageTimer(pageId: string, amount: number = 3) {
  if (!pageStartTime || lastPageId !== pageId) return { success: false };

  const elapsedSeconds = (Date.now() - pageStartTime) / 1000;
  
  // Reset timer
  pageStartTime = null;
  lastPageId = null;

  // Anti-cheat: Check if user stayed long enough (90 seconds)
  if (elapsedSeconds >= MIN_PAGE_READ_TIME) {
    return await addPoints("quran", amount);
  } else {
    return { success: false, message: "يجب قراءة الصفحة بتمهل (دقيقة ونصف على الأقل) لاحتساب النقاط" };
  }
}

/**
 * Handles Ayah reading in Normal Mushaf (5 seconds = 10 points, or 20 if audio)
 */
const MIN_AYAH_READ_TIME = 5;
let ayahStartTime: number | null = null;
let lastAyahId: string | null = null;

export function startAyahTimer(ayahId: string) {
  ayahStartTime = Date.now();
  lastAyahId = ayahId;
}

export async function endAyahTimer(ayahId: string, amount: number = 10) {
  if (!ayahStartTime || lastAyahId !== ayahId) return { success: false };

  const elapsedSeconds = (Date.now() - ayahStartTime) / 1000;
  
  ayahStartTime = null;
  lastAyahId = null;

  if (elapsedSeconds >= MIN_AYAH_READ_TIME) {
    return await addPoints("quran", amount);
  } else {
    return { success: false };
  }
}

/**
 * Handles Thikr reading in Athkar Library (5 seconds = 0.5 points)
 */
const MIN_THIKR_READ_TIME = 5;
let thikrStartTime: number | null = null;
let lastThikrId: string | null = null;

export function startThikrTimer(thikrId: string) {
  thikrStartTime = Date.now();
  lastThikrId = thikrId;
}

export async function endThikrTimer(thikrId: string, amount: number = 0.5) {
  if (!thikrStartTime || lastThikrId !== thikrId) return { success: false };

  const elapsedSeconds = (Date.now() - thikrStartTime) / 1000;
  
  thikrStartTime = null;
  lastThikrId = null;

  if (elapsedSeconds >= MIN_THIKR_READ_TIME) {
    return await addPoints("athkar", amount);
  } else {
    return { success: false };
  }
}

/**
 * Handles Sebha (Electronic Rosary) points
 * Call this every 99 clicks to award 3 points
 */
export async function addSebhaPoints(amount: number = 3) {
   return await addPoints("athkar", amount);
}
