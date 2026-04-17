import { RECITERS } from "@/data/reciters";

export const getAudioUrl = (surahId: number, ayahId: number, reciterId: string, type: 'primary' | 'fallback' = 'primary') => {
  const pad = (num: number, size: number) => {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  };

  const aId = pad(ayahId, 3);
  const sId = pad(surahId, 3);
  const reciter = RECITERS.find(r => r.id === reciterId) || RECITERS[0];

  // Primary: Use Islamic Network for stability if it's a common reciter
  if (type === 'primary' && reciter.id === 'alafasy') {
      return `https://cdn.islamic.network/quran/audio/verses/128/ar.alafasy/${sId}${aId}.mp3`;
  }

  if (type === 'fallback') {
    return `https://cdn.islamic.network/quran/audio/verses/128/ar.alafasy/${sId}${aId}.mp3`;
  }

  const sId = pad(surahId, 3);
  
  // Handle specific reciter overrides
  switch (reciter.id) {
    case "menshawi_j":
      return `https://server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad/${sId}.mp3`;
    case "sudais":
      return `https://server11.mp3quran.net/sds/${sId}.mp3`;
  }

  if (reciter.serverType === "qurancdn") {
    return `https://audio.qurancdn.com/${reciter.folder}/${sId}${aId}.mp3`;
  }

  return `https://www.everyayah.com/data/${reciter.folder}/${sId}${aId}.mp3`;
};
