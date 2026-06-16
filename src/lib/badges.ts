import { db } from "./firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

export interface Badge {
  id: string;
  name: string;
  description: string;
  requirement: string;
  iconType: "quran" | "community" | "video";
}

export const BADGES: Badge[] = [
  {
    id: "streak_7",
    name: "الحافظ المواظب",
    description: "تلاوة القرآن الكريم لـ 7 أيام متتالية",
    requirement: "نشاط متتالي 7 أيام",
    iconType: "quran"
  },
  {
    id: "comments_10",
    name: "خادم المجتمع",
    description: "كتابة 10 تعليقات قيمة للمساهمة في بناء البيئة الإيمانية",
    requirement: "10 تعليقات قيمة",
    iconType: "community"
  },
  {
    id: "videos_5",
    name: "تأثير الخير",
    description: "صناعة ورندر 5 فيديوهات دعوية باستخدام محرر الفيديوهات",
    requirement: "رندر 5 فيديوهات",
    iconType: "video"
  }
];

/**
 * فحص شارات المستخدم ومنح الشارات المستحقة
 * @param userId - معرف المستخدم في Firestore
 * @returns قائمة الشارات الجديدة التي تم اكتسابها
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  if (!db || !userId) return [];

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return [];

    const data = userSnap.data();
    const currentBadges = data.badges || [];
    
    // Get metrics
    const streak = data.streak || 0;
    const commentsCount = data.commentsCount || 0;
    const videoRendersCount = data.videoRendersCount || 0;

    const newBadges: string[] = [];

    // Check Streak Badge
    if (streak >= 7 && !currentBadges.includes("streak_7")) {
      newBadges.push("streak_7");
    }

    // Check Comments Badge
    if (commentsCount >= 10 && !currentBadges.includes("comments_10")) {
      newBadges.push("comments_10");
    }

    // Check Videos Badge
    if (videoRendersCount >= 5 && !currentBadges.includes("videos_5")) {
      newBadges.push("videos_5");
    }

    if (newBadges.length > 0) {
      await updateDoc(userRef, {
        badges: arrayUnion(...newBadges)
      });

      // Dispatch custom event for client-side popups/notifs
      if (typeof window !== "undefined") {
        newBadges.forEach(badgeId => {
          const badge = BADGES.find(b => b.id === badgeId);
          window.dispatchEvent(new CustomEvent("badgeUnlocked", {
            detail: badge
          }));
        });
      }
    }

    return newBadges;
  } catch (e) {
    console.error("[Badges] Error checking/awarding badges:", e);
    return [];
  }
}
