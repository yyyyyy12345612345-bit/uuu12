import { db, auth } from "./firebase";
import { 
  doc, 
  updateDoc, 
  increment, 
  getDoc, 
  setDoc,
  serverTimestamp,
  FirestoreError
} from "firebase/firestore";

/**
 * نتيجة عملية تحديث النقاط
 */
export interface PointUpdateResult {
  success: boolean;
  message?: string;
  error?: Error;
}

/**
 * حدود النقاط اليومية لكل نوع نشاط
 */
const DAILY_LIMITS: Record<string, number> = {
  quran: 100,
  athkar: 200,
  listen: 200,
  video: 100,
  bonus: 1000,
  istighfar: 1000,
  salawat: 1000
};

// Internal state to track active timers
let activeTimers: Record<string, number> = {};
let lastAwardedAt: Record<string, number> = {};

/**
 * إضافة نقاط للمستخدم مع التحقق من الحدود اليومية
 * @param type - نوع النشاط (quran, athkar, listen, video, bonus)
 * @param amount - عدد النقاط المراد إضافتها
 * @returns نتيجة العملية
 */
export async function addPoints(type: string, amount: number = 1): Promise<PointUpdateResult> {
  const user = auth?.currentUser;
  if (!user) return { success: false, message: "يجب تسجيل الدخول لتجميع النقاط" };
  
  const pointsToAdd = Math.max(0, Number(amount));
  
  if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
    console.warn("[Points] Invalid points amount:", amount);
    return { success: false, message: "قيمة النقاط غير صالحة" };
  }

  // --- Anti-Spam Cooldown ---
  const now = Date.now();
  if (lastAwardedAt[type] && now - lastAwardedAt[type] < 1000) {
    console.warn(`[Points] Cooldown active for ${type}`);
    return { success: false, message: "انتظر قليلاً قبل المحاولة مرة أخرى" };
  }
  // --------------------------

  // --- Daily Limit Logic ---
  let finalPointsToAdd = pointsToAdd;
  try {
    const today = new Date().toDateString();
    const limitDateKey = "points_limit_date";
    const earnedTodayKey = `points_earned_today_${type}`;
    
    const savedDate = localStorage.getItem(limitDateKey);
    if (savedDate !== today) {
      localStorage.setItem(limitDateKey, today);
      Object.keys(DAILY_LIMITS).forEach(k => localStorage.setItem(`points_earned_today_${k}`, "0"));
    }

    const currentEarned = parseInt(localStorage.getItem(earnedTodayKey) || "0");
    const limit = DAILY_LIMITS[type] || 100;

    if (currentEarned >= limit) {
      console.warn(`[Points] Daily limit reached for ${type}`);
      return { success: false, message: "لقد وصلت للحد الأقصى للنقاط لهذا النشاط اليوم" };
    }

    finalPointsToAdd = Math.min(pointsToAdd, limit - currentEarned);
    localStorage.setItem(earnedTodayKey, (currentEarned + finalPointsToAdd).toString());
    lastAwardedAt[type] = now;
  } catch (error) {
    console.error("[Points] Daily limit calculation error:", error);
    return { success: false, message: "خطأ في حساب الحدود اليومية" };
  }
  // --------------------------

  console.log(`[Points] Adding ${finalPointsToAdd} for ${type}`);

  // 1. Instant Local Update
  try {
    const localKey = "cached_total_points";
    const current = parseInt(localStorage.getItem(localKey) || "0");
    localStorage.setItem(localKey, (current + finalPointsToAdd).toString());
  } catch (error) {
    console.error("[Points] Local storage update error:", error);
  }

  // 2. Persistent Firestore Update
  if (user && db) {
    try {
      const userRef = doc(db, "users", user.uid);
      const todayISO = new Date().toISOString().split("T")[0];
      const dailyRef = doc(db, "users", user.uid, "stats", todayISO);

      const fieldMap: Record<string, string> = {
        quran: "quranPoints",
        athkar: "athkarPoints",
        listen: "listenPoints",
        video: "videoPoints",
        istighfar: "istighfarPoints",
        salawat: "salawatPoints"
      };

      const updateData: Record<string, any> = {
        totalPoints: increment(finalPointsToAdd),
        lastActive: serverTimestamp()
      };

      if (fieldMap[type]) {
        updateData[fieldMap[type]] = increment(finalPointsToAdd);
      }

      if (type === "quran") {
        updateData.readAyahs = increment(1);
      } else if (type === "listen") {
        updateData.audioSeconds = increment(finalPointsToAdd * 30);
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
      const firestoreError = err as FirestoreError;
      console.error("[Points] Firestore update error:", firestoreError);
      
      if (firestoreError.code === 'permission-denied') {
        return { 
          success: false, 
          message: "لا يوجد صلاحية لتحديث النقاط",
          error: firestoreError
        };
      }
      
      if (firestoreError.code === 'unavailable') {
        return { 
          success: false, 
          message: "خدمة Firebase غير متاحة حالياً، سيتم المحاولة لاحقاً",
          error: firestoreError
        };
      }

      return { 
        success: false, 
        message: "حدث خطأ أثناء حفظ النقاط",
        error: firestoreError instanceof Error ? firestoreError : new Error(String(err))
      };
    }
  }

  return { success: true, message: "Local update successful" };
}

/**
 * بدء مؤقت لحساب وقت النشاط
 * @param id - معرف المؤقت الفريد
 */
export function startTimer(id: string): void {
  try {
    activeTimers[id] = Date.now();
    console.log(`[Points] Timer started for: ${id}`);
  } catch (error) {
    console.error("[Points] Failed to start timer:", error);
  }
}

/**
 * إنهاء المؤقت ومنح النقاط بناءً على الوقت المنقضي
 * @param id - معرف المؤقت
 * @param minSeconds - الحد الأدنى بالثواني
 * @param type - نوع النشاط
 * @param amount - عدد النقاط
 * @returns نتيجة العملية
 */
export async function endTimer(
  id: string, 
  minSeconds: number, 
  type: string, 
  amount: number
): Promise<PointUpdateResult> {
  try {
    const startTime = activeTimers[id];
    if (!startTime) {
      console.warn(`[Points] Timer not found: ${id}`);
      return { success: false, message: "المؤقت غير موجود" };
    }

    const elapsed = (Date.now() - startTime) / 1000;
    
    const lastAwarded = lastAwardedAt[id] || 0;
    if (Date.now() - lastAwarded < 5000) {
      console.warn(`[Points] Double award prevention for ${id}`);
      return { success: false, message: "تم منح النقاط مسبقاً" };
    }

    if (elapsed >= minSeconds) {
      const result = await addPoints(type, amount);
      if (result.success) {
        lastAwardedAt[id] = Date.now();
        delete activeTimers[id];
      }
      return result;
    }

    return { 
      success: false, 
      message: `لم يتم استيفاء الحد الأدنى للوقت (${minSeconds} ثانية)` 
    };
  } catch (error) {
    console.error(`[Points] Error ending timer ${id}:`, error);
    return { 
      success: false, 
      message: "خطأ في إنهاء المؤقت",
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/* ─── Standard Legacy Wrappers ─── */

/**
 * بدء مؤقت قراءة صفحة
 * @param pageId - رقم الصفحة
 */
export const startPageTimer = (pageId: string): void => startTimer(`page_${pageId}`);

/**
 * إنهاء مؤقت قراءة صفحة ومنح النقاط
 * @param amount - عدد النقاط
 * @returns نتيجة العملية
 */
export const endPageTimer = async (amount: number): Promise<PointUpdateResult> => {
  try {
    const activePageKey = Object.keys(activeTimers).find(k => k.startsWith("page_"));
    if (activePageKey) {
      return await endTimer(activePageKey, 10, "quran", amount);
    }
    return { success: false, message: "لا يوجد مؤقت نشط للصفحة" };
  } catch (error) {
    console.error("[Points] endPageTimer error:", error);
    return { success: false, message: "خطأ في إنهاء مؤقت الصفحة" };
  }
};

/**
 * بدء مؤقت قراءة آية
 * @param ayahId - معرف الآية
 */
export const startAyahTimer = (ayahId: string): void => startTimer(`ayah_${ayahId}`);

/**
 * إنهاء مؤقت قراءة آية ومنح النقاط
 * @param amount - عدد النقاط
 * @returns نتيجة العملية
 */
export const endAyahTimer = async (amount: number): Promise<PointUpdateResult> => {
  try {
    const activeAyahKey = Object.keys(activeTimers).find(k => k.startsWith("ayah_"));
    if (activeAyahKey) {
      return await endTimer(activeAyahKey, 2, "quran", amount);
    }
    return { success: false, message: "لا يوجد مؤقت نشط للآية" };
  } catch (error) {
    console.error("[Points] endAyahTimer error:", error);
    return { success: false, message: "خطأ في إنهاء مؤقت الآية" };
  }
};

/**
 * بدء مؤقت ذكر
 * @param thikrId - معرف الذكر
 */
export const startThikrTimer = (thikrId: string): void => startTimer(`thikr_${thikrId}`);

/**
 * إنهاء مؤقت ذكر ومنح النقاط
 * @param amount - عدد النقاط
 * @returns نتيجة العملية
 */
export const endThikrTimer = async (amount: number): Promise<PointUpdateResult> => {
  try {
    const activeThikrKey = Object.keys(activeTimers).find(k => k.startsWith("thikr_"));
    if (activeThikrKey) {
      return await endTimer(activeThikrKey, 2, "athkar", amount);
    }
    return { success: false, message: "لا يوجد مؤقت نشط للذكر" };
  } catch (error) {
    console.error("[Points] endThikrTimer error:", error);
    return { success: false, message: "خطأ في إنهاء مؤقت الذكر" };
  }
};

/**
 * إضافة نقاط التسبيح الإلكتروني
 * @param amount - عدد النقاط (الافتراضي: 3)
 * @returns نتيجة العملية
 */
export const addSebhaPoints = async (amount: number = 3): Promise<PointUpdateResult> => {
  try {
    return await addPoints("athkar", amount);
  } catch (error) {
    console.error("[Points] addSebhaPoints error:", error);
    return { success: false, message: "خطأ في إضافة نقاط التسبيح" };
  }
};

/**
 * إضافة نقاط الاستغفار
 * @param amount - عدد النقاط (الافتراضي: 1)
 * @returns نتيجة العملية
 */
export const addIstighfarPoints = async (amount: number = 1): Promise<PointUpdateResult> => {
  try {
    return await addPoints("istighfar", amount);
  } catch (error) {
    console.error("[Points] addIstighfarPoints error:", error);
    return { success: false, message: "خطأ في إضافة نقاط الاستغفار" };
  }
};

/**
 * إضافة نقاط الصلاة على النبي
 * @param amount - عدد النقاط (الافتراضي: 1)
 * @returns نتيجة العملية
 */
export const addSalawatPoints = async (amount: number = 1): Promise<PointUpdateResult> => {
  try {
    return await addPoints("salawat", amount);
  } catch (error) {
    console.error("[Points] addSalawatPoints error:", error);
    return { success: false, message: "خطأ في إضافة نقاط الصلاة على النبي" };
  }
};

/**
 * المطالبة بنقاط المهمة
 * @param questId - معرف المهمة
 * @param amount - عدد النقاط
 * @returns نتيجة العملية
 */
export async function claimQuestPoints(questId: string, amount: number): Promise<PointUpdateResult> {
  const user = auth?.currentUser;
  if (!user || !db) {
    return { success: false, message: "يجب تسجيل الدخول أولاً" };
  }
  
  try {
    const questRef = doc(db, "users", user.uid, "completed_quests", questId);
    const snap = await getDoc(questRef);
    
    if (snap.exists()) {
      return { success: false, message: "تم الاستلام مسبقاً" };
    }
    
    const res = await addPoints("bonus", amount);
    if (res.success) {
      await setDoc(questRef, { 
        completedAt: serverTimestamp(), 
        points: amount 
      });
    }
    return res;
  } catch (error) {
    console.error("[Points] claimQuestPoints error:", error);
    return { 
      success: false, 
      message: "خطأ في المطالبة بنقاط المهمة",
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * المطالبة بنقاط إكمال سورة (مرة واحدة فقط لكل سورة)
 * @param surahId - رقم السورة
 * @param amount - عدد النقاط (الافتراضي: 10)
 * @returns نتيجة العملية
 */
export async function claimSurahCompletionPoints(
  surahId: number, 
  amount: number = 10
): Promise<PointUpdateResult> {
  const user = auth?.currentUser;
  if (!user || !db) {
    return { success: false, message: "يجب تسجيل الدخول أولاً" };
  }

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
  } catch (error) {
    console.error("[Points] claimSurahCompletionPoints error:", error);
    return { 
      success: false, 
      message: "خطأ في منح نقاط إكمال السورة",
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * زيادة عداد رندر الفيديوهات
 * @returns نتيجة العملية
 */
export async function incrementVideoRenderCount(): Promise<PointUpdateResult> {
  const user = auth?.currentUser;
  if (!user || !db) {
    return { success: false, message: "يجب تسجيل الدخول أولاً" };
  }
  
  try {
    await updateDoc(doc(db, "users", user.uid), {
      videoRendersCount: increment(1)
    });
    return { success: true };
  } catch (error) {
    console.error("[Points] incrementVideoRenderCount error:", error);
    return { 
      success: false, 
      message: "خطأ في تحديث عداد الفيديوهات",
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}