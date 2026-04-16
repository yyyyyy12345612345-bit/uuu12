export interface Reciter {
  id: string;
  name: string;
  identifier: string;    // Used for Islamic.network API (Video Maker)
  mp3quranServer: string;  // Used for Audio Library (Full Surah)
  fullSurahPath: string;    // Fallback/Metadata
}


export const RECITERS: Reciter[] = [
  { 
    id: "afasy", 
    name: "مشاري العفاسي", 
    identifier: "ar.alafasy", 
    mp3quranServer: "server8.mp3quran.net/afs",
    fullSurahPath: "mishari_rashid_al_afasy" 
  },
  { 
    id: "abdulbasit_m", 
    name: "عبد الباسط (مرتل)", 
    identifier: "ar.abdulbasitmurattal", 
    mp3quranServer: "server7.mp3quran.net/basit",
    fullSurahPath: "abdul_basit_murattal" 
  },
  { 
    id: "abdulbasit_j", 
    name: "عبد الباسط (مجود)", 
    identifier: "ar.abdulbasitmujawwad", 
    mp3quranServer: "server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad",
    fullSurahPath: "abdul_basit_mujawwad" 
  },
  { 
    id: "maher", 
    name: "ماهر المعيقلي", 
    identifier: "ar.mahermuaiqly", 
    mp3quranServer: "server12.mp3quran.net/maher",
    fullSurahPath: "maher_256" 
  },
  { 
    id: "menshawi_m", 
    name: "المنشاوي (مرتل)", 
    identifier: "ar.minshawi", 
    mp3quranServer: "server10.mp3quran.net/minsh",
    fullSurahPath: "muhammad_siddeeq_al-minshaawee" 
  },
  { 
    id: "menshawi_j", 
    name: "المنشاوي (مجود)", 
    identifier: "ar.minshawimujawwad", 
    mp3quranServer: "server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad",
    fullSurahPath: "muhammad_siddeeq_al-minshaawee_mujawwad" 
  },
  { 
    id: "haitham", 
    name: "هيثم الدخين", 
    identifier: "ar.haithamdukhin", 
    mp3quranServer: "server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem",
    fullSurahPath: "haitham_al-dukhin" 
  },
  { 
    id: "husr", 
    name: "محمود خليل الحصري", 
    identifier: "ar.husary", 
    mp3quranServer: "server13.mp3quran.net/husr",
    fullSurahPath: "mahmood_khaleel_al-husaree" 
  },
  { 
    id: "mustafa_ismail", 
    name: "مصطفي إسماعيل", 
    identifier: "ar.mustafaismail", 
    mp3quranServer: "server8.mp3quran.net/mustafa",
    fullSurahPath: "mustafa_ismail" 
  },
  { 
    id: "sudais", 
    name: "عبد الرحمن السديس", 
    identifier: "ar.sudais", 
    mp3quranServer: "server11.mp3quran.net/sds",
    fullSurahPath: "sudais" 
  },
  { 
    id: "ghamadi", 
    name: "سعد الغامدي", 
    identifier: "ar.saadalghamidi", 
    mp3quranServer: "server7.mp3quran.net/s_gmd",
    fullSurahPath: "sa3d_al_ghamidi/complete" 
  },
  { 
    id: "qatami", 
    name: "ناصر القطامي", 
    identifier: "ar.nasserqatami", 
    mp3quranServer: "server6.mp3quran.net/qtm",
    fullSurahPath: "nasser_alqatami" 
  },
  { 
    id: "dussary", 
    name: "ياسر الدوسري", 
    identifier: "ar.yasserad-dussary", 
    mp3quranServer: "server11.mp3quran.net/yasser",
    fullSurahPath: "yasser_ad-dussary" 
  },
  { 
    id: "ajamy", 
    name: "أحمد العجمي", 
    identifier: "ar.ahmedajamy", 
    mp3quranServer: "server10.mp3quran.net/ajm",
    fullSurahPath: "ahmed_ibn_3ali_al-3ajamy" 
  },
  { 
    id: "abbad", 
    name: "فارس عباد", 
    identifier: "ar.faresabbad", 
    mp3quranServer: "server8.mp3quran.net/frs_a",
    fullSurahPath: "fares_abbad" 
  },
  { 
    id: "hassan_saleh", 
    name: "حسن صالح", 
    identifier: "ar.hassansaleh", 
    mp3quranServer: "server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem",
    fullSurahPath: "h_saleh/Rewayat-Hafs-A-n-Assem" 
  },
];
