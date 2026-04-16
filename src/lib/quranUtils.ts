import { RECITERS } from "@/data/reciters";
import surahsData from "@/data/surahs.json";

export const getAudioUrl = (surahId: number, ayahId: number, reciterId: string) => {
  const reciter = RECITERS.find(r => r.id === reciterId) || RECITERS[0];
  
  // Calculate absolute Ayah Number (1 to 6236) for Islamic.network API
  let absoluteAyahNumber = 0;
  for (let i = 0; i < surahId - 1; i++) {
    const s = surahsData.find(item => item.id === (i + 1));
    if (s) {
      absoluteAyahNumber += s.total_verses;
    }
  }
  absoluteAyahNumber += ayahId;

  // Use the professional Islamic.network API for Ayah-by-Ayah audio
  return `https://cdn.islamic.network/quran/audio/128/${reciter.identifier}/${absoluteAyahNumber}.mp3`;
};
