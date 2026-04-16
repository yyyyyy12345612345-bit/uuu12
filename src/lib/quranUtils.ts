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

  // Fixed audio source paths for reciters whose server layout differs from the default everyayah pattern.
  switch (reciter.id) {
    case "menshawi_j":
      return `https://server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad/${sId}.mp3`;
    case "sudais":
      return `https://server11.mp3quran.net/sds/${sId}.mp3`;
    case "dussary":
      return `https://server11.mp3quran.net/yasser/${sId}.mp3`;
    case "ajamy":
      return `https://server10.mp3quran.net/ajm/64/${sId}.mp3`;
    case "haitham":
      return `https://server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem/${sId}.mp3`;
    case "hassan_saleh":
      return `https://server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem/${sId}.mp3`;
    default:
      break;
  }

  if (reciter.serverType === "qurancdn") {
    return `https://audio.qurancdn.com/${reciter.folder}/${sId}${aId}.mp3`;
  }

  return `https://www.everyayah.com/data/${reciter.folder}/${sId}${aId}.mp3`;
};
