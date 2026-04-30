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

  // Fallback: Use mp3quran.net if available (most reliable)
  if (reciter?.mp3quranServer) {
    return `https://${reciter.mp3quranServer}/${pad(surahId)}.mp3`;
  }

  // Final Fallback to Alafasy (Most reliable)
  return `https://everyayah.com/data/Alafasy_128kbps/${ayahSlug}.mp3`;
};

const API_ROOT = "https://api.quran.com/api/v4";

/**
 * Fetch Tafsir for a specific verse
 * @param verseKey e.g. "1:1"
 * @param tafsirId Default is 169 (Ibn Kathir Arabic)
 */
export async function fetchVerseTafsir(verseKey: string, tafsirId: number = 169) {
  try {
    const response = await fetch(`${API_ROOT}/tafsirs/${tafsirId}/by_ayah/${verseKey}`);
    const data = await response.json();
    return data.tafsir;
  } catch (error) {
    console.error("Error fetching tafsir:", error);
    return null;
  }
}

/**
 * Fetch multiple translations for a specific verse
 * @param verseKey e.g. "1:1"
 * @param translationIds e.g. [131, 161]
 */
export async function fetchVerseTranslations(verseKey: string, translationIds: number[] = [131]) {
  try {
    const ids = translationIds.join(',');
    const response = await fetch(`${API_ROOT}/verses/by_key/${verseKey}?translations=${ids}&fields=text_uthmani&words=true`);
    const data = await response.json();
    return data.verse;
  } catch (error) {
    console.error("Error fetching translations:", error);
    return null;
  }
}

/**
 * List available Tafsirs
 */
export async function listTafsirs(language: string = 'ar') {
  try {
    const response = await fetch(`${API_ROOT}/resources/tafsirs?language=${language}`);
    const data = await response.json();
    return data.tafsirs;
  } catch (error) {
    console.error("Error listing tafsirs:", error);
    return [];
  }
}

