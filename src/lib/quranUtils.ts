import { RECITERS } from "@/data/reciters";

export const getAudioUrl = (surahId: number, ayahId: number, reciterId: string, globalVerseId?: number) => {
  const reciter = RECITERS.find(r => r.id === reciterId);
  const pad = (n: number) => n.toString().padStart(3, '0');
  
  // EveryAyah Format: SSSAAA.mp3 (e.g. 001001.mp3)
  const ayahSlug = `${pad(surahId)}${pad(ayahId)}`;
  
  // Primary: Try EveryAyah if available
  if (reciter?.everyAyahFolder) {
    return `https://everyayah.com/data/${reciter.everyAyahFolder}/${ayahSlug}.mp3`;
  }

  // Support Direct Server / Archive.org / MP3Quran surah audio
  if (reciter?.audioDirectUrl) {
    return reciter.audioDirectUrl;
  }

  if (reciter?.mp3quranServer) {
    const srv = reciter.mp3quranServer.replace(/^https?:\/\//, "");
    return `https://${srv}/${pad(surahId)}.mp3`;
  }

  // Fallback to Alafasy for Ayah-by-Ayah rendering
  return `https://everyayah.com/data/Alafasy_128kbps/${ayahSlug}.mp3`;
};

// Global in-memory cache for verse durations by reciter
const durationCache = new Map<string, number>();

export function getReciterSpeedFactor(reciterId: string): { isMujawwad: boolean; secPerWord: number; pauseSec: number } {
  const reciter = RECITERS.find(r => r.id === reciterId);
  const isMujawwad = reciterId.includes("mjwd") || 
                     reciterId.includes("mujawwad") || 
                     Boolean(reciter?.name && reciter.name.includes("مجود"));
  let secPerWord = isMujawwad ? 3.8 : 1.75;
  if (reciterId.includes("minsh")) secPerWord = isMujawwad ? 4.2 : 1.85;
  if (reciterId.includes("basit")) secPerWord = isMujawwad ? 4.5 : 1.8;
  if (reciterId.includes("husr")) secPerWord = isMujawwad ? 4.0 : 1.95;
  if (reciterId.includes("dossary")) secPerWord = 1.65;
  if (reciterId.includes("afasy")) secPerWord = 1.6;
  return {
    isMujawwad,
    secPerWord,
    pauseSec: isMujawwad ? 3.0 : 1.5,
  };
}

export function estimateVerseDurationFallback(text: string, reciterId: string): number {
  const { isMujawwad, secPerWord, pauseSec } = getReciterSpeedFactor(reciterId);
  const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 5;
  return Math.max(isMujawwad ? 16 : 4, Math.round(words * secPerWord + pauseSec));
}

export async function fetchExactVerseDuration(surahId: number, ayahId: number, reciterId: string, verseText?: string): Promise<number> {
  const cacheKey = `${reciterId}:${surahId}:${ayahId}`;
  if (durationCache.has(cacheKey)) {
    return durationCache.get(cacheKey)!;
  }

  const reciter = RECITERS.find(r => r.id === reciterId);
  const isSurahLevel = !reciter?.everyAyahFolder && (reciter?.mp3quranServer || reciter?.audioDirectUrl);
  if (isSurahLevel) {
    const dur = estimateVerseDurationFallback(verseText || "", reciterId);
    durationCache.set(cacheKey, dur);
    return dur;
  }

  // 1. Try real Audio element in browser (highest precision via EveryAyah CORS)
  const audioUrl = getAudioUrl(surahId, ayahId, reciterId);
  if (typeof window !== "undefined") {
    try {
      const dur = await new Promise<number>((resolve) => {
        const audio = new Audio();
        audio.preload = "metadata";
        audio.crossOrigin = "anonymous";
        audio.src = audioUrl;
        const timer = setTimeout(() => {
          resolve(0);
        }, 2500);
        audio.onloadedmetadata = () => {
          clearTimeout(timer);
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
            resolve(Math.round(audio.duration * 10) / 10);
          } else {
            resolve(0);
          }
        };
        audio.onerror = () => {
          clearTimeout(timer);
          resolve(0);
        };
        audio.load();
      });

      if (dur > 0) {
        durationCache.set(cacheKey, dur);
        return dur;
      }
    } catch {}
  }

  // 2. Try Server-Side API endpoint fallback
  const words = verseText ? verseText.trim().split(/\s+/).filter(Boolean).length : 5;
  if (typeof window !== "undefined") {
    try {
      const res = await fetch(`/api/verse-duration?surah=${surahId}&ayah=${ayahId}&reciter=${reciterId}&words=${words}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.duration && typeof data.duration === "number") {
          durationCache.set(cacheKey, data.duration);
          return data.duration;
        }
      }
    } catch {}
  }

  const fallback = estimateVerseDurationFallback(verseText || "", reciterId);
  durationCache.set(cacheKey, fallback);
  return fallback;
}

/**
 * حساب حالة مدة الفيديو وتوافقه مع شورتس يوتيوب (الحد الأقصى 3 دقائق = 180 ثانية)
 * نستخدم 179 ثانية كحد أمان فني لمنع يوتيوب من تصنيف الفيديو كـ 3:01 بسبب تقريب الإطارات
 */
export function getShortsDurationInfo(totalSeconds: number) {
  const roundedSec = Math.round(totalSeconds);
  const minutes = Math.floor(roundedSec / 60);
  const seconds = roundedSec % 60;
  const isShort = roundedSec <= 180;
  const isSafeShort = roundedSec <= 179;
  const isOverThreeMinutes = roundedSec > 180;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  const formattedArabic = minutes > 0 
    ? `${minutes} دقيقة و ${seconds} ثانية` 
    : `${seconds} ثانية`;

  return {
    totalSeconds: roundedSec,
    exactSeconds: totalSeconds,
    minutes,
    seconds,
    isShort,
    isSafeShort,
    isOverThreeMinutes,
    formattedTime,
    formattedArabic,
  };
}

/**
 * إيجاد أفضل آية نهاية (endAyah) لتظل التلاوة أقل من 179 ثانية (ضمن شورتس يوتيوب بدقة تامة)
 */
export function findShortsOptimalEndAyah(
  verses: Array<{ id: number; text?: string }>,
  startAyah: number,
  reciterId: string,
  durationsCache: Record<string, number> = {},
  maxTargetSec = 179
): { optimalEndAyah: number; calculatedDuration: number } {
  let runningSec = 0;
  let optimalEndAyah = startAyah;

  for (const v of verses) {
    if (v.id < startAyah) continue;
    const cacheKey = `${reciterId}_${v.id}`;
    const dur = durationsCache[cacheKey] || estimateVerseDurationFallback(v.text || "", reciterId);
    if (runningSec + dur <= maxTargetSec) {
      runningSec += dur;
      optimalEndAyah = v.id;
    } else {
      break;
    }
  }

  return {
    optimalEndAyah: Math.max(startAyah, optimalEndAyah),
    calculatedDuration: Math.round(runningSec),
  };
}

const API_ROOT = "https://api.quran.com/api/v4";

export const ARABIC_TAFSIRS = [
  { id: 16, name: "تفسير السعدي", author: "عبد الرحمن بن ناصر السعدي" },
  { id: 14, name: "التفسير الميسر", author: "مجمع الملك فهد" },
  { id: 164, name: "تفسير ابن كثير", author: "ابن كثير الدمشقي" },
  { id: 15, name: "تفسير القرطبي", author: "أبو عبد الله القرطبي" },
  { id: 9, name: "تفسير البغوي", author: "الحسين بن مسعود البغوي" },
];

/**
 * Fetch Tafsir for a specific verse in pure Arabic
 * @param verseKey e.g. "1:1"
 * @param tafsirId Default is 16 (تفسير السعدي باللغة العربية)
 */
export async function fetchVerseTafsir(verseKey: string, tafsirId: number = 16) {
  try {
    const response = await fetch(`${API_ROOT}/tafsirs/${tafsirId}/by_ayah/${verseKey}`);
    if (response.ok) {
      const data = await response.json();
      if (data?.tafsir?.text) {
        return data.tafsir;
      }
    }
  } catch (error) {
    console.warn("Quran.com Tafsir fetch fallback:", error);
  }

  // Robust Fallback: AlQuran Cloud Arabic Muyassar
  try {
    const fallbackRes = await fetch(`https://api.alquran.cloud/v1/ayah/${verseKey}/ar.muyassar`);
    if (fallbackRes.ok) {
      const fbData = await fallbackRes.json();
      if (fbData?.data?.text) {
        return {
          id: tafsirId,
          text: fbData.data.text,
          resource_name: "التفسير الميسر"
        };
      }
    }
  } catch (fbErr) {
    console.error("All Tafsir endpoints failed:", fbErr);
  }

  return null;
}

/**
 * Fetch accurate verse text in Uthmani script
 * @param verseKey e.g. "1:1"
 */
export async function fetchVerseDetails(verseKey: string) {
  try {
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${verseKey}/quran-uthmani`);
    if (response.ok) {
      const data = await response.json();
      if (data?.data) {
        return {
          text_uthmani: data.data.text,
          verse_number: data.data.numberInSurah,
          surah_number: data.data.surah?.number,
          surah_name: data.data.surah?.name
        };
      }
    }
  } catch (e) {
    console.warn("AlQuran Cloud Ayah text fallback", e);
  }

  try {
    const response = await fetch(`${API_ROOT}/verses/by_key/${verseKey}?fields=text_uthmani`);
    const data = await response.json();
    return data.verse;
  } catch (error) {
    console.error("Error fetching verse text:", error);
    return null;
  }
}

/**
 * Fetch multiple translations for a specific verse
 * @param verseKey e.g. "1:1"
 * @param translationIds e.g. [136] (Arabic Muyassar)
 */
export async function fetchVerseTranslations(verseKey: string, translationIds: number[] = [14]) {
  return fetchVerseTafsir(verseKey, translationIds[0] || 14);
}

/**
 * List available Tafsirs
 */
export async function listTafsirs(language: string = 'ar') {
  return ARABIC_TAFSIRS;
}

