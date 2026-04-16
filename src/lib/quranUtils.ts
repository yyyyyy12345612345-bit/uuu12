import { RECITERS } from "@/data/reciters";

export const getAudioUrls = (surahId: number, ayahId: number, reciterId: string) => {
  const pad = (num: number, size: number) => {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  };

  const reciter = RECITERS.find(r => r.id === reciterId) || RECITERS[0];
  const sId = pad(surahId, 3);
  const aId = pad(ayahId, 3);
  
  // Absolute Ayah number for Islamic.Network
  const SURAH_VERSES = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  let absId = 0;
  for (let i = 0; i < surahId - 1; i++) absId += SURAH_VERSES[i];
  absId += ayahId;

  // Final Solution: Return an array of potential sources to try
  return [
    `https://audio.qurancdn.com/${reciter.quranCdnId || '7'}/${sId}${aId}.mp3`,
    `https://www.everyayah.com/data/${reciter.everyAyahServer || 'Alafasy_128kbps'}/${sId}${aId}.mp3`,
    `https://mirrors.quranicaudio.com/everyayah/data/${reciter.everyAyahServer || 'Alafasy_128kbps'}/${sId}${aId}.mp3`,
    `https://cdn.islamic.network/quran/audio/128/${reciter.identifier || 'ar.alafasy'}/${absId}.mp3`
  ];
};
