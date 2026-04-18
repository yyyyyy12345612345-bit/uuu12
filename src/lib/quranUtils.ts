import { RECITERS } from "@/data/reciters";

export const getAudioUrl = (surahId: number, ayahId: number, reciterId: string, globalVerseId?: number) => {
  const reciter = RECITERS.find(r => r.id === reciterId);
  const pad = (n: number) => n.toString().padStart(3, '0');
  
  // EveryAyah Format: SSSAAA.mp3 (e.g. 001001.mp3)
  const ayahSlug = `${pad(surahId)}${pad(ayahId)}`;
  
  // EveryAyah HTTPS Mirror (The most comprehensive source)
  if (reciter?.everyAyahFolder) {
    return `https://everyayah.com/data/${reciter.everyAyahFolder}/${ayahSlug}.mp3`;
  }

  // Final Fallback to Alafasy (Always works)
  return `https://everyayah.com/data/Alafasy_128kbps/${ayahSlug}.mp3`;
};
