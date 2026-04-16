import { RECITERS } from "@/data/reciters";

export const getAudioUrl = (surahId: number, ayahId: number, reciterId: string) => {
  const pad = (num: number, size: number) => {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  };

  const reciter = RECITERS.find(r => r.id === reciterId) || RECITERS[0];
  
  // Using the robust mp3quran Verse API (Arabic folders)
  const folder = reciter.verseFolder || "alafasy";
  
  const sId = pad(surahId, 3);
  const aId = pad(ayahId, 3);

  return `https://verse.mp3quran.net/arabic/${folder}/${sId}${aId}.mp3`;
};
