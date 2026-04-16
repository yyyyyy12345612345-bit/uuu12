export interface Reciter {
  id: string;
  name: string;
  folder: string;         
  mp3quranServer: string; 
  serverType?: "everyayah" | "qurancdn"; // Optional type for special cases
}

export const RECITERS: Reciter[] = [
  { id: "afasy", name: "مشاري العفاسي", folder: "Alafasy_128kbps", mp3quranServer: "server8.mp3quran.net/afs" },
  { id: "abdulbasit_m", name: "عبد الباسط (مرتل)", folder: "Abdul_Basit_Murattal_64kbps", mp3quranServer: "server7.mp3quran.net/basit" },
  { id: "abdulbasit_j", name: "عبد الباسط (مجود)", folder: "Abdul_Basit_Mujawwad_128kbps", mp3quranServer: "server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad" },
  { id: "maher", name: "ماهر المعيقلي", folder: "Maher_AlMuaiqly_64kbps", mp3quranServer: "server12.mp3quran.net/maher" },
  { id: "menshawi_m", name: "المنشاوي (مرتل)", folder: "Minshawy_Murattal_128kbps", mp3quranServer: "server10.mp3quran.net/minsh" },
  { id: "menshawi_j", name: "المنشاوي (مجود)", folder: "Minshawy_Mujawwad_128kbps", mp3quranServer: "server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad" },
  { id: "husr", name: "محمود خليل الحصري", folder: "Husary_128kbps", mp3quranServer: "server13.mp3quran.net/husr" },
  { id: "sudais", name: "عبد الرحمن السديس", folder: "Sudais_64kbps", mp3quranServer: "server11.mp3quran.net/sds" },
  { id: "ghamadi", name: "سعد الغامدي", folder: "Ghamadi_40kbps", mp3quranServer: "server7.mp3quran.net/s_gmd" },
  { id: "qatami", name: "ناصر القطامي", folder: "Nasser_Alqatami_128kbps", mp3quranServer: "server6.mp3quran.net/qtm" },
  { id: "dussary", name: "ياسر الدوسري", folder: "Dussary_128kbps", mp3quranServer: "server11.mp3quran.net/yasser" },
  { id: "ajamy", name: "أحمد العجمي", folder: "Ahmed_ibn_Ali_al-Ajamy_64kbps", mp3quranServer: "server10.mp3quran.net/ajm" },
  { id: "haitham", name: "هيثم الدخين", folder: "176", serverType: "qurancdn", mp3quranServer: "server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem" },
  { id: "hassan_saleh", name: "حسن صالح", folder: "177", serverType: "qurancdn", mp3quranServer: "server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem" },
];
