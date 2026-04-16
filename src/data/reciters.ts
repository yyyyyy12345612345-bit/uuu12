export interface Reciter {
  id: string;
  name: string;
  verseFolder: string;    // Used for mp3quran Verse API (Video Maker)
  mp3quranServer: string;  // Used for Audio Library (Full Surah)
  fullSurahPath: string;    // Fallback/Metadata
}


export const RECITERS: Reciter[] = [
  { 
    id: "afasy", 
    name: "مشاري العفاسي", 
    verseFolder: "alafasy", 
    mp3quranServer: "server8.mp3quran.net/afs",
    fullSurahPath: "mishari_rashid_al_afasy" 
  },
  { 
    id: "abdulbasit_m", 
    name: "عبد الباسط (مرتل)", 
    verseFolder: "abdul_basit_murattal", 
    mp3quranServer: "server7.mp3quran.net/basit",
    fullSurahPath: "abdul_basit_murattal" 
  },
  { 
    id: "abdulbasit_j", 
    name: "عبد الباسط (مجود)", 
    verseFolder: "abdul_basit_mujawwad", 
    mp3quranServer: "server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad",
    fullSurahPath: "abdul_basit_mujawwad" 
  },
  { 
    id: "maher", 
    name: "ماهر المعيقلي", 
    verseFolder: "maher_almuaiqly", 
    mp3quranServer: "server12.mp3quran.net/maher",
    fullSurahPath: "maher_256" 
  },
  { 
    id: "menshawi_m", 
    name: "المنشاوي (مرتل)", 
    verseFolder: "minshawi_murattal", 
    mp3quranServer: "server10.mp3quran.net/minsh",
    fullSurahPath: "muhammad_siddeeq_al-minshaawee" 
  },
  { 
    id: "menshawi_j", 
    name: "المنشاوي (مجود)", 
    verseFolder: "minshawi_mujawwad", 
    mp3quranServer: "server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad",
    fullSurahPath: "muhammad_siddeeq_al-minshaawee_mujawwad" 
  },
  { 
    id: "haitham", 
    name: "هيثم الدخين", 
    verseFolder: "haitham_aldukhin", 
    mp3quranServer: "server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem",
    fullSurahPath: "haitham_al-dukhin" 
  },
  { 
    id: "husr", 
    name: "محمود خليل الحصري", 
    verseFolder: "husary", 
    mp3quranServer: "server13.mp3quran.net/husr",
    fullSurahPath: "mahmood_khaleel_al-husaree" 
  },
  { 
    id: "mustafa_ismail", 
    name: "مصطفي إسماعيل", 
    verseFolder: "mustafa_ismail", 
    mp3quranServer: "server8.mp3quran.net/mustafa",
    fullSurahPath: "mustafa_ismail" 
  },
  { 
    id: "sudais", 
    name: "عبد الرحمن السديس", 
    verseFolder: "sudais", 
    mp3quranServer: "server11.mp3quran.net/sds",
    fullSurahPath: "sudais" 
  },
  { 
    id: "ghamadi", 
    name: "سعد الغامدي", 
    verseFolder: "saad_al_ghamidi", 
    mp3quranServer: "server7.mp3quran.net/s_gmd",
    fullSurahPath: "sa3d_al_ghamidi/complete" 
  },
  { 
    id: "qatami", 
    name: "ناصر القطامي", 
    verseFolder: "nasser_alqatami", 
    mp3quranServer: "server6.mp3quran.net/qtm",
    fullSurahPath: "nasser_alqatami" 
  },
  { 
    id: "dussary", 
    name: "ياسر الدوسري", 
    verseFolder: "yasser_aldosari", 
    mp3quranServer: "server11.mp3quran.net/yasser",
    fullSurahPath: "yasser_ad-dussary" 
  },
  { 
    id: "ajamy", 
    name: "أحمد العجمي", 
    verseFolder: "ahmed_al_ajamy", 
    mp3quranServer: "server10.mp3quran.net/ajm",
    fullSurahPath: "ahmed_ibn_3ali_al-3ajamy" 
  },
  { 
    id: "abbad", 
    name: "فارس عباد", 
    verseFolder: "fares_abbad", 
    mp3quranServer: "server8.mp3quran.net/frs_a",
    fullSurahPath: "fares_abbad" 
  },
  { 
    id: "hassan_saleh", 
    name: "حسن صالح", 
    verseFolder: "hassan_saleh", 
    mp3quranServer: "server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem",
    fullSurahPath: "h_saleh/Rewayat-Hafs-A-n-Assem" 
  },
];
