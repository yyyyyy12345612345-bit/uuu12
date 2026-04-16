export interface Reciter {
  id: string;
  name: string;
  serverType: "everyayah" | "mp3quran_verse" | "qurancdn"; 
  folder: string;         // Folder name or ID on the selected server
  mp3quranServer: string;  // Used for Audio Library (Full Surah)
}

export const RECITERS: Reciter[] = [
  { 
    id: "afasy", 
    name: "مشاري العفاسي", 
    serverType: "everyayah",
    folder: "Alafasy_128kbps", 
    mp3quranServer: "server8.mp3quran.net/afs"
  },
  { 
    id: "abdulbasit_m", 
    name: "عبد الباسط (مرتل)", 
    serverType: "everyayah",
    folder: "Abdul_Basit_Murattal_64kbps", 
    mp3quranServer: "server7.mp3quran.net/basit"
  },
  { 
    id: "abdulbasit_j", 
    name: "عبد الباسط (مجود)", 
    serverType: "everyayah",
    folder: "Abdul_Basit_Mujawwad_128kbps", 
    mp3quranServer: "server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad"
  },
  { 
    id: "maher", 
    name: "ماهر المعيقلي", 
    serverType: "everyayah",
    folder: "Maher_AlMuaiqly_64kbps", 
    mp3quranServer: "server12.mp3quran.net/maher"
  },
  { 
    id: "menshawi_m", 
    name: "المنشاوي (مرتل)", 
    serverType: "everyayah",
    folder: "Minshawy_Murattal_128kbps", 
    mp3quranServer: "server10.mp3quran.net/minsh"
  },
  { 
    id: "menshawi_j", 
    name: "المنشاوي (مجود)", 
    serverType: "everyayah",
    folder: "Minshawy_Mujawwad_128kbps", 
    mp3quranServer: "server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad"
  },
  { 
    id: "haitham", 
    name: "هيثم الدخين", 
    serverType: "qurancdn", // Using Quran.com CDN (Stable)
    folder: "176", 
    mp3quranServer: "server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem"
  },
  { 
    id: "husr", 
    name: "محمود خليل الحصري", 
    serverType: "everyayah",
    folder: "Husary_128kbps", 
    mp3quranServer: "server13.mp3quran.net/husr"
  },
  { 
    id: "mustafa_ismail", 
    name: "مصطفي إسماعيل", 
    serverType: "everyayah",
    folder: "Mustafa_Ismail_48kbps", 
    mp3quranServer: "server8.mp3quran.net/mustafa"
  },
  { 
    id: "sudais", 
    name: "عبد الرحمن السديس", 
    serverType: "everyayah",
    folder: "Sudais_64kbps", 
    mp3quranServer: "server11.mp3quran.net/sds"
  },
  { 
    id: "ghamadi", 
    name: "سعد الغامدي", 
    serverType: "everyayah",
    folder: "Ghamadi_40kbps", 
    mp3quranServer: "server7.mp3quran.net/s_gmd"
  },
  { 
    id: "qatami", 
    name: "ناصر القطامي", 
    serverType: "everyayah",
    folder: "Nasser_Alqatami_128kbps", 
    mp3quranServer: "server6.mp3quran.net/qtm"
  },
  { 
    id: "dussary", 
    name: "ياسر الدوسري", 
    serverType: "everyayah",
    folder: "Dussary_128kbps", 
    mp3quranServer: "server11.mp3quran.net/yasser"
  },
  { 
    id: "ajamy", 
    name: "أحمد العجمي", 
    serverType: "everyayah",
    folder: "Ahmed_ibn_Ali_al-Ajamy_64kbps", 
    mp3quranServer: "server10.mp3quran.net/ajm"
  },
  { 
    id: "abbad", 
    name: "فارس عباد", 
    serverType: "everyayah",
    folder: "Fares_Abbad_64kbps", 
    mp3quranServer: "server8.mp3quran.net/frs_a"
  },
  { 
    id: "hassan_saleh", 
    name: "حسن صالح", 
    serverType: "qurancdn", // Using Quran.com CDN (Stable)
    folder: "177", 
    mp3quranServer: "server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem"
  },
];
