export interface Reciter {
  id: string;
  name: string;
  folder: string;
  mp3quranServer: string;
  everyAyahFolder?: string; // Standard EveryAyah folder name
}

export const RECITERS: Reciter[] = [
  // --- الأكثر استماعاً والمطلوبة بشدة ---
  { id: "maher", name: "ماهر المعيقلي", folder: "maher", mp3quranServer: "server12.mp3quran.net/maher", everyAyahFolder: "Maher_AlMuaiqly_64kbps" },
  { id: "sds", name: "عبد الرحمن السديس", folder: "sds", mp3quranServer: "server11.mp3quran.net/sds", everyAyahFolder: "Abdurrahmaan_As-Sudais_192kbps" },
  { id: "shur", name: "سعود الشريم", folder: "shur", mp3quranServer: "server7.mp3quran.net/shur", everyAyahFolder: "Sa3ood_ash-Shuraym_128kbps" },
  { id: "juhani", name: "عبد الله عواد الجهني", folder: "juhani", mp3quranServer: "server13.mp3quran.net/juhani", everyAyahFolder: "Abdullaah_3awwaad_Al-Juhaynee_128kbps" },
  { id: "afasy", name: "مشاري العفاسي", folder: "afs", mp3quranServer: "server8.mp3quran.net/afs", everyAyahFolder: "Rashid_Al_Afasy_128kbps" },
  { id: "qtm", name: "ناصر القطامي", folder: "qtm", mp3quranServer: "server6.mp3quran.net/qtm", everyAyahFolder: "Nasser_Alqatami_128kbps" },
  { id: "s_gmd", name: "سعد الغامدي", folder: "s_gmd", mp3quranServer: "server7.mp3quran.net/s_gmd", everyAyahFolder: "Ghamadi_40kbps" },
  { id: "ajm", name: "أحمد بن علي العجمي", folder: "ajm", mp3quranServer: "server10.mp3quran.net/ajm", everyAyahFolder: "Ahmed_ibn_Ali_al-Ajamy_64kbps" },
  { id: "yasser", name: "ياسر الدوسري", folder: "yasser", mp3quranServer: "server11.mp3quran.net/yasser", everyAyahFolder: "Yasser_Ad-Dussary_128kbps" },
  { id: "abkr", name: "إدريس أبكر", folder: "abkr", mp3quranServer: "server6.mp3quran.net/abkr", everyAyahFolder: "Idrees_Abkar_128kbps" },
  
  // --- جيل العمالقة ---
  { id: "basit", name: "عبد الباسط عبد الصمد (مرتل)", folder: "basit", mp3quranServer: "server7.mp3quran.net/basit", everyAyahFolder: "Abdul_Basit_Murattal_192kbps" },
  { id: "minsh", name: "محمد صديق المنشاوي (مرتل)", folder: "minsh", mp3quranServer: "server10.mp3quran.net/minsh", everyAyahFolder: "Minshawy_Murattal_128kbps" },
  { id: "husr", name: "محمود خليل الحصري", folder: "husr", mp3quranServer: "server13.mp3quran.net/husr", everyAyahFolder: "Husary_128kbps" },
  { id: "husr_m", name: "محمود خليل الحصري (مجود)", folder: "husr_m", mp3quranServer: "server13.mp3quran.net/husr_m", everyAyahFolder: "Husary_Mujawwad_64kbps" },

  // --- قائمة شاملة إضافية ---
  { id: "shatree", name: "أبو بكر الشاطري", folder: "shatree", mp3quranServer: "server11.mp3quran.net/shatree", everyAyahFolder: "Abu_Bakr_Ash-Shaatree_128kbps" },
  { id: "ayyub", name: "محمد أيوب", folder: "ayyub", mp3quranServer: "server8.mp3quran.net/ayyub", everyAyahFolder: "Muhammad_Ayyoub_128kbps" },
  { id: "jbrl", name: "محمد جبريل", folder: "jbrl", mp3quranServer: "server8.mp3quran.net/jbrl", everyAyahFolder: "Muhammad_Jibreel_128kbps" },
  { id: "akdr", name: "إبراهيم الأخضر", folder: "akdr", mp3quranServer: "server6.mp3quran.net/akdr", everyAyahFolder: "Ibrahim_Al_Akdar_128kbps" },
  { id: "jleel", name: "خالد الجليل", folder: "jleel", mp3quranServer: "server10.mp3quran.net/jleel", everyAyahFolder: "Khalid_Al-Jaleel_128kbps" },
  { id: "hazza", name: "هزاع البلوشي", folder: "hazza", mp3quranServer: "server11.mp3quran.net/hazza", everyAyahFolder: "Hazza_Al_Blushi_128kbps" },
  { id: "mansor", name: "منصور السالمي", folder: "mansor", mp3quranServer: "server14.mp3quran.net/mansor", everyAyahFolder: "Mansour_Al_Salimi_128kbps" },
  { id: "balilah", name: "بندر بليلة", folder: "balilah", mp3quranServer: "server6.mp3quran.net/balilah", everyAyahFolder: "Bandar_Baleela_128kbps" },
];
