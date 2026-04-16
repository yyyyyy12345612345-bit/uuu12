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

  // Simple, Direct, One Mirror for everyone to restore logic
  return `https://www.everyayah.com/data/${reciter.folder}/${sId}${aId}.mp3`;
};
