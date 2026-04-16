export interface Reciter {
  id: string;
  name: string;
  everyAyahServer: string; // Used for Video Generator (everyayah.com)
  mp3quranServer: string;  // Used for Audio Library (server8.mp3quran.net/...)
  fullSurahPath: string;    // Fallback/Metadata
}


export const RECITERS: Reciter[] = [
  { 
    id: "afasy", 
    name: "مشاري العفاسي", 
    everyAyahServer: "Alafasy_128kbps", 
    mp3quranServer: "server8.mp3quran.net/afs",
    fullSurahPath: "mishari_rashid_al_afasy" 
  },
  { 
    id: "abdulbasit_m", 
    name: "عبد الباسط (مرتل)", 
    everyAyahServer: "Abdul_Basit_Murattal_192kbps", 
    mp3quranServer: "server7.mp3quran.net/basit",
    fullSurahPath: "abdul_basit_murattal" 
  },
  { 
    id: "abdulbasit_j", 
    name: "عبد الباسط (مجود)", 
    everyAyahServer: "Abdul_Basit_Mujawwad_128kbps", 
    mp3quranServer: "server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad",
    fullSurahPath: "abdul_basit_mujawwad" 
  },
  { 
    id: "maher", 
    name: "ماهر المعيقلي", 
    everyAyahServer: "Maher_AlMuaiqly_64kbps", 
    mp3quranServer: "server12.mp3quran.net/maher",
    fullSurahPath: "maher_256" 
  },
  { 
    id: "menshawi_m", 
    name: "المنشاوي (مرتل)", 
    everyAyahServer: "Minshawy_Murattal_128kbps", 
    mp3quranServer: "server10.mp3quran.net/minsh",
    fullSurahPath: "muhammad_siddeeq_al-minshaawee" 
  },
  { 
    id: "menshawi_j", 
    name: "المنشاوي (مجود)", 
    everyAyahServer: "Minshawy_Mujawwad_64kbps", 
    mp3quranServer: "server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad",
    fullSurahPath: "muhammad_siddeeq_al-minshaawee_mujawwad" 
  },
  { 
    id: "haitham", 
    name: "هيثم الدخين", 
    everyAyahServer: "Haitham_Al-Dukhin_64kbps", 
    mp3quranServer: "server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem",
    fullSurahPath: "haitham_al-dukhin" 
  },
  { 
    id: "husr", 
    name: "محمود خليل الحصري", 
    everyAyahServer: "Husary_128kbps", 
    mp3quranServer: "server13.mp3quran.net/husr",
    fullSurahPath: "mahmood_khaleel_al-husaree" 
  },
  { 
    id: "mustafa_ismail", 
    name: "مصطفي إسماعيل", 
    everyAyahServer: "Mustafa_Ismail_48kbps", 
    mp3quranServer: "server8.mp3quran.net/mustafa",
    fullSurahPath: "mustafa_ismail" 
  },
  { 
    id: "sudais", 
    name: "عبد الرحمن السديس", 
    everyAyahServer: "Sudais_64kbps", 
    mp3quranServer: "server11.mp3quran.net/sds",
    fullSurahPath: "sudais" 
  },
  { 
    id: "ghamadi", 
    name: "سعد الغامدي", 
    everyAyahServer: "Ghamadi_40kbps", 
    mp3quranServer: "server7.mp3quran.net/s_gmd",
    fullSurahPath: "sa3d_al_ghamidi/complete" 
  },
  { 
    id: "qatami", 
    name: "ناصر القطامي", 
    everyAyahServer: "Nasser_Alqatami_128kbps", 
    mp3quranServer: "server6.mp3quran.net/qtm",
    fullSurahPath: "nasser_alqatami" 
  },
  { 
    id: "dussary", 
    name: "ياسر الدوسري", 
    everyAyahServer: "Dussary_128kbps", 
    mp3quranServer: "server11.mp3quran.net/yasser",
    fullSurahPath: "yasser_ad-dussary" 
  },
  { 
    id: "ajamy", 
    name: "أحمد العجمي", 
    everyAyahServer: "Ahmed_ibn_Ali_al-Ajamy_64kbps", 
    mp3quranServer: "server10.mp3quran.net/ajm",
    fullSurahPath: "ahmed_ibn_3ali_al-3ajamy" 
  },
  { 
    id: "abbad", 
    name: "فارس عباد", 
    everyAyahServer: "Fares_Abbad_64kbps", 
    mp3quranServer: "server8.mp3quran.net/frs_a",
    fullSurahPath: "fares_abbad" 
  },
  { 
    id: "hassan_saleh", 
    name: "حسن صالح", 
    everyAyahServer: "Hassan_Saleh_128kbps", 
    mp3quranServer: "server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem",
    fullSurahPath: "h_saleh/Rewayat-Hafs-A-n-Assem" 
  },
];
