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
