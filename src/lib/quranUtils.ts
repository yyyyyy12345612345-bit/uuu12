import { RECITERS } from "@/data/reciters";

export const getAudioUrl = (surahId: number, ayahId: number, reciterId: string) => {
  const pad = (num: number, size: number) => {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  };

  const reciter = RECITERS.find(r => r.id === reciterId) || RECITERS[0];
  const sId = pad(surahId, 3);
  const aId = pad(ayahId, 3);

  // Intelligent Fallback Routing
  if (reciter.serverType === "qurancdn") {
    // Top-tier server (Quran.com) for Shaikhs like Haitham & Hassan Saleh
    return `https://audio.qurancdn.com/${reciter.folder}/${sId}${aId}.mp3`;
  } else if (reciter.serverType === "mp3quran_verse") {
    // Secondary verse server
    return `https://verse.mp3quran.net/arabic/${reciter.folder}/${sId}${aId}.mp3`;
  } else {
    // Standard Stable Server (EveryAyah)
    return `https://www.everyayah.com/data/${reciter.folder}/${sId}${aId}.mp3`;
  }
};
