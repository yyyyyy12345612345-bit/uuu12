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
export async function addPoints(type: string, amount: number = 1): Promise<PointUpdateResult> {
  const user = auth?.currentUser;
  const pointsToAdd = Math.max(0, Number(amount));
  
  if (isNaN(pointsToAdd) || pointsToAdd <= 0) return { success: false };

  console.log(`[Points] Attempting to add ${pointsToAdd} for ${type}`);

  // 1. Instant Local Update (for UI snappiness)
  try {
    const localKey = "cached_total_points";
    const current = parseInt(localStorage.getItem(localKey) || "0");
    localStorage.setItem(localKey, (current + pointsToAdd).toString());
  } catch (e) {}

  // 2. Persistent Firestore Update
  if (user && db) {
    try {
      const userRef = doc(db, "users", user.uid);
      const today = new Date().toISOString().split("T")[0];
      const dailyRef = doc(db, "users", user.uid, "stats", today);

      const fieldMap: any = {
        quran: "quranPoints",
        athkar: "athkarPoints",
        listen: "listenPoints",
        video: "videoPoints"
      };

      const updateData: any = {
        totalPoints: increment(pointsToAdd),
        lastActive: serverTimestamp()
      };

      if (fieldMap[type]) {
        updateData[fieldMap[type]] = increment(pointsToAdd);
      }

      await updateDoc(userRef, updateData);
      
      // Update Daily Stats Collection
      await setDoc(dailyRef, {
        points: increment(pointsToAdd),
        lastUpdate: serverTimestamp()
      }, { merge: true });

      // Dispatch global event for UI sync
      window.dispatchEvent(new CustomEvent('pointsUpdated', { 
        detail: { type, amount: pointsToAdd } 
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
