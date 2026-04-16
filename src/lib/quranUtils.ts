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

  // Smart Routing based on the Sheikh
  if (reciter.serverType === "mp3quran_verse") {
    // Sources like Haitham Al-Dukhin & Hassan Saleh from mp3quran server
    return `https://verse.mp3quran.net/arabic/${reciter.folder}/${sId}${aId}.mp3`;
  } else {
    // Famous reciters from the stable EveryAyah server
    return `https://www.everyayah.com/data/${reciter.folder}/${sId}${aId}.mp3`;
  }
};
