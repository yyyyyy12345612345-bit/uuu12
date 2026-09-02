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

  // Final Fallback to Alafasy (most reliable ayah-by-ayah reciter, as mp3quran servers only serve full surahs)
  return `https://everyayah.com/data/Alafasy_128kbps/${ayahSlug}.mp3`;
};

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

