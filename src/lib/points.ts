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
const MIN_READ_TIME = 40; // Seconds required to stay on a page
const DAILY_POINTS_CAP = 1500; // Increased cap for professional rank
const POINTS_PER_PAGE = 5;
const POINTS_PER_THIKR = 1;
const POINTS_PER_LISTEN = 2; // Points for listening to a verse

interface PointUpdateResult {
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

    const dailyDoc = await getDoc(dailyRef);
    const dailyData = dailyDoc.exists() ? dailyDoc.data() : { date: today, points: 0 };

    // Reset daily points if it's a new day
    const today = new Date().toISOString().split("T")[0];
    let dailyPoints = dailyData.date === today ? dailyData.points : 0;

    // 2. Check Daily Cap
    if (dailyPoints >= DAILY_POINTS_CAP) {
      return { success: false, message: "لقد وصلت للحد الأقصى للنقاط اليومية" };
    }

    // 3. Update Firestore (Atomic)
    let pointsToAdd = 0;
    if (type === "quran") pointsToAdd = POINTS_PER_PAGE;
    else if (type === "athkar") pointsToAdd = POINTS_PER_THIKR;
    else if (type === "listen") pointsToAdd = POINTS_PER_LISTEN;
    
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
 * Handles Quran page reading with time validation
 */
let pageStartTime: number | null = null;
let lastPageId: string | null = null;

export function startPageTimer(pageId: string) {
  pageStartTime = Date.now();
  lastPageId = pageId;
}

export async function endPageTimer(pageId: string) {
  if (!pageStartTime || lastPageId !== pageId) return { success: false };

  const elapsedSeconds = (Date.now() - pageStartTime) / 1000;
  
  // Reset timer
  pageStartTime = null;
  lastPageId = null;

  // Anti-cheat: Check if user stayed long enough
  if (elapsedSeconds >= MIN_READ_TIME) {
    return await addPoints("quran");
  } else {
    return { success: false, message: "يجب قراءة الصفحة بتمهل لاحتساب النقاط" };
  }
}
