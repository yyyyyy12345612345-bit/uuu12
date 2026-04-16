export interface Reciter {
  id: string;
  name: string;
  quranCdnId: string;     // Used for Quran.com Audio CDN (Video Maker)
  mp3quranServer: string;  // Used for Audio Library
  fullSurahPath: string;
}


export const RECITERS: Reciter[] = [
  {
    id: "afasy",
    name: "مشاري العفاسي",
    quranCdnId: "7",
    mp3quranServer: "server8.mp3quran.net/afs",
    fullSurahPath: "mishari_rashid_al_afasy"
  },
  {
    id: "abdulbasit_m",
    name: "عبد الباسط (مرتل)",
    quranCdnId: "2",
    mp3quranServer: "server7.mp3quran.net/basit",
    fullSurahPath: "abdul_basit_murattal"
  },
  {
    id: "abdulbasit_j",
    name: "عبد الباسط (مجود)",
    quranCdnId: "10",
    mp3quranServer: "server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad",
    fullSurahPath: "abdul_basit_mujawwad"
  },
  {
    id: "maher",
    name: "ماهر المعيقلي",
    quranCdnId: "8",
    mp3quranServer: "server12.mp3quran.net/maher",
    fullSurahPath: "maher_256"
  },
  {
    id: "menshawi_m",
    name: "المنشاوي (مرتل)",
    quranCdnId: "12",
    mp3quranServer: "server10.mp3quran.net/minsh",
    fullSurahPath: "muhammad_siddeeq_al-minshaawee"
  },
  {
    id: "menshawi_j",
    name: "المنشاوي (مجود)",
    quranCdnId: "1",
    mp3quranServer: "server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad",
    fullSurahPath: "muhammad_siddeeq_al-minshaawee_mujawwad"
  },
  {
    id: "haitham",
    name: "هيثم الدخين",
    quranCdnId: "7", // Fallback (to be updated with exact ID if available)
    mp3quranServer: "server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem",
    fullSurahPath: "haitham_al-dukhin"
  },
  {
    id: "husr",
    name: "محمود خليل الحصري",
    quranCdnId: "5",
    mp3quranServer: "server13.mp3quran.net/husr",
    fullSurahPath: "mahmood_khaleel_al-husaree"
  },
  {
    id: "mustafa_ismail",
    name: "مصطفي إسماعيل",
    quranCdnId: "1", // Mirror selection
    mp3quranServer: "server8.mp3quran.net/mustafa",
    fullSurahPath: "mustafa_ismail"
  },
  {
    id: "sudais",
    name: "عبد الرحمن السديس",
    quranCdnId: "3",
    mp3quranServer: "server11.mp3quran.net/sds",
    fullSurahPath: "sudais"
  },
  {
    id: "ghamadi",
    name: "سعد الغامدي",
    quranCdnId: "4",
    mp3quranServer: "server7.mp3quran.net/s_gmd",
    fullSurahPath: "sa3d_al_ghamidi/complete"
  },
  {
    id: "qatami",
    name: "ناصر القطامي",
    quranCdnId: "6", // Stable mirror
    mp3quranServer: "server6.mp3quran.net/qtm",
    fullSurahPath: "nasser_alqatami"
  },
  {
    id: "dussary",
    name: "ياسر الدوسري",
    quranCdnId: "11",
    mp3quranServer: "server11.mp3quran.net/yasser",
    fullSurahPath: "yasser_ad-dussary"
  },
  {
    id: "ajamy",
    name: "أحمد العجمي",
    quranCdnId: "9",
    mp3quranServer: "server10.mp3quran.net/ajm",
    fullSurahPath: "ahmed_ibn_3ali_al-3ajamy"
  },
  {
    id: "abbad",
    name: "فارس عباد",
    quranCdnId: "6",
    mp3quranServer: "server8.mp3quran.net/frs_a",
    fullSurahPath: "fares_abbad"
  },
  {
    id: "hassan_saleh",
    name: "حسن صالح",
    quranCdnId: "7", // Fallback
    mp3quranServer: "server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem",
    fullSurahPath: "h_saleh/Rewayat-Hafs-A-n-Assem"
  },
];
