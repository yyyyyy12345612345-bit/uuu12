import { db } from "./firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

export interface Badge {
  id: string;
  name: string;
  description: string;
  requirement: string;
  iconType: "quran" | "streak" | "video" | "surah";
}

export const BADGES: Badge[] = [
  {
    id: "streak_7",
    name: "الحافظ المواظب",
    description: "تلاوة القرآن والورد اليومي لـ 7 أيام متتالية",
    requirement: "نشاط متتالي 7 أيام",
    iconType: "streak"
  },
  {
    id: "streak_30",
    name: "حليف القرآن",
    description: "الاستمرار في تلاوة القرآن والورد لـ 30 يوماً متواصلاً",
    requirement: "نشاط متتالي 30 يوماً",
    iconType: "streak"
  },
  {
    id: "ayahs_100",
    name: "ورتّل القرآن",
    description: "قراءة وتدبر أكثر من 100 آية مباركة",
    requirement: "قراءة 100 آية",
    iconType: "quran"
  },
  {
    id: "ayahs_500",
    name: "نور الآيات",
    description: "قراءة وتدبر أكثر من 500 آية من كتاب الله",
    requirement: "قراءة 500 آية",
    iconType: "quran"
  },
  {
    id: "surahs_5",
    name: "متقن السور",
    description: "الاستماع لتلاوة 5 سور كاملة بتدبر وخشوع",
    requirement: "إتمام 5 سور",
    iconType: "surah"
  },
  {
    id: "videos_5",
    name: "تأثير الخير",
    description: "صناعة ورندر 5 فيديوهات دعوية لنشر آيات القرآن الكريم",
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
    const readAyahs = data.readAyahs || 0;
    const completedSurahsCount = data.completedSurahsCount || 0;
    const videoRendersCount = data.videoRendersCount || 0;

    const newBadges: string[] = [];

    // Check Streak 7
    if (streak >= 7 && !currentBadges.includes("streak_7")) {
      newBadges.push("streak_7");
    }

    // Check Streak 30
    if (streak >= 30 && !currentBadges.includes("streak_30")) {
      newBadges.push("streak_30");
    }

    // Check 100 Ayahs
    if (readAyahs >= 100 && !currentBadges.includes("ayahs_100")) {
      newBadges.push("ayahs_100");
    }

    // Check 500 Ayahs
    if (readAyahs >= 500 && !currentBadges.includes("ayahs_500")) {
      newBadges.push("ayahs_500");
    }

    // Check 5 Surahs
    if (completedSurahsCount >= 5 && !currentBadges.includes("surahs_5")) {
      newBadges.push("surahs_5");
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
