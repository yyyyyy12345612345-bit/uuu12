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
    serverType: "qurancdn",
    folder: "7", 
    mp3quranServer: "server8.mp3quran.net/afs"
  },
  { 
    id: "abdulbasit_m", 
    name: "عبد الباسط (مرتل)", 
    serverType: "qurancdn",
    folder: "2", 
    mp3quranServer: "server7.mp3quran.net/basit"
  },
  { 
    id: "abdulbasit_j", 
    name: "عبد الباسط (مجود)", 
    serverType: "qurancdn",
    folder: "10", 
    mp3quranServer: "server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad"
  },
  { 
    id: "maher", 
    name: "ماهر المعيقلي", 
    serverType: "qurancdn",
    folder: "8", 
    mp3quranServer: "server12.mp3quran.net/maher"
  },
  { 
    id: "menshawi_m", 
    name: "المنشاوي (مرتل)", 
    serverType: "qurancdn",
    folder: "12", 
    mp3quranServer: "server10.mp3quran.net/minsh"
  },
  { 
    id: "menshawi_j", 
    name: "المنشاوي (مجود)", 
    serverType: "qurancdn",
    folder: "1", 
    mp3quranServer: "server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad"
  },
  { 
    id: "haitham", 
    name: "هيثم الدخين", 
    serverType: "qurancdn",
    folder: "176", 
    mp3quranServer: "server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem"
  },
  { 
    id: "husr", 
    name: "محمود خليل الحصري", 
    serverType: "qurancdn",
    folder: "5", 
    mp3quranServer: "server13.mp3quran.net/husr"
  },
  { 
    id: "mustafa_ismail", 
    name: "مصطفي إسماعيل", 
    serverType: "qurancdn",
    folder: "1", // Fallback to stable Minshawi if unavailable
    mp3quranServer: "server8.mp3quran.net/mustafa"
  },
  { 
    id: "sudais", 
    name: "عبد الرحمن السديس", 
    serverType: "qurancdn",
    folder: "3", 
    mp3quranServer: "server11.mp3quran.net/sds"
  },
  { 
    id: "ghamadi", 
    name: "سعد الغامدي", 
    serverType: "qurancdn",
    folder: "4", 
    mp3quranServer: "server7.mp3quran.net/s_gmd"
  },
  { 
    id: "qatami", 
    name: "ناصر القطامي", 
    serverType: "qurancdn",
    folder: "6", 
    mp3quranServer: "server6.mp3quran.net/qtm"
  },
  { 
    id: "dussary", 
    name: "ياسر الدوسري", 
    serverType: "qurancdn",
    folder: "11", 
    mp3quranServer: "server11.mp3quran.net/yasser"
  },
  { 
    id: "ajamy", 
    name: "أحمد العجمي", 
    serverType: "qurancdn",
    folder: "9", 
    mp3quranServer: "server10.mp3quran.net/ajm"
  },
  { 
    id: "abbad", 
    name: "فارس عباد", 
    serverType: "qurancdn",
    folder: "6", 
    mp3quranServer: "server8.mp3quran.net/frs_a"
  },
  { 
    id: "hassan_saleh", 
    name: "حسن صالح", 
    serverType: "qurancdn",
    folder: "177", 
    mp3quranServer: "server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem"
  },
];
