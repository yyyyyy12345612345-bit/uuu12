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
  { id: "afasy", name: "مشاري العفاسي", folder: "afs", mp3quranServer: "server8.mp3quran.net/afs", everyAyahFolder: "Alafasy_128kbps" },
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
  
  // TODO: Add reciters below when verified audio sources are available:
  // - الوليد الشمسان (waleed_shamsan)
  // - بدر التركي (badr_turki)
  // - علي عبد الله جابر (ali_abdullah_jaber)
  // - احمد ابن طالب حميد (ahmed_ibn_taleb_hameed)
  // - اسلام صبحي (islam_sobhi)
  // - عبد الرحمن مصعب (abdurrahman_musaab)
  // - احمد كاسب (ahmed_kasab)
  // - محمد احمد حسن (mohammad_ahmad_hassan)
  // - مصطفي اسماعيل (mustafa_ismail)
  // - احمد نعينع (ahmed_naeen)
  // - كامل يوسف البهتيمي (kamel_yousef_albahtimi)
  // - محمد رفعت (mohammad_rifaat)
  // - طه الفشني (taha_alfashny)
  // - ابو العنين شعيشع (abu_alaneen_shaishaa)
  // - البنا (albana)
  // Added from public/adhan: files detected but sources not verified
  { id: "mohammad_rifaat", name: "محمد رفعت", folder: "mohammad_rifaat", mp3quranServer: "" },
  { id: "sayed_nakashibandi", name: "سيد النقشبندي", folder: "sayed_nakashibandi", mp3quranServer: "" },
  { id: "waleed_shamsan", name: "الوليد الشمسان", folder: "waleed_shamsan", mp3quranServer: "" },
  { id: "badr_turki", name: "بدر التركي", folder: "badr_turki", mp3quranServer: "" },
  { id: "ali_abdullah_jaber", name: "علي عبد الله جابر", folder: "ali_abdullah_jaber", mp3quranServer: "" },
  { id: "ahmed_ibn_taleb_hameed", name: "أحمد ابن طالب حميد", folder: "ahmed_ibn_taleb_hameed", mp3quranServer: "" },
  { id: "islam_sobhi", name: "إسلام صبحي", folder: "islam_sobhi", mp3quranServer: "" },
  { id: "abdurrahman_musaab", name: "عبد الرحمن مصعب", folder: "abdurrahman_musaab", mp3quranServer: "" },
  { id: "ahmed_kasab", name: "أحمد كاسب", folder: "ahmed_kasab", mp3quranServer: "" },
  { id: "mohammad_ahmad_hassan", name: "محمد أحمد حسن", folder: "mohammad_ahmad_hassan", mp3quranServer: "" },
  { id: "mustafa_ismail", name: "مصطفى إسماعيل", folder: "mustafa_ismail", mp3quranServer: "" },
  { id: "ahmed_naeen", name: "أحمد نعينع", folder: "ahmed_naeen", mp3quranServer: "" },
  { id: "kamel_yousef_albahtimi", name: "كامل يوسف البهتيمي", folder: "kamel_yousef_albahtimi", mp3quranServer: "" },
  { id: "taha_alfashny", name: "طه الفشني", folder: "taha_alfashny", mp3quranServer: "" },
  { id: "abu_alaneen_shaishaa", name: "أبو العنين شعيشع", folder: "abu_alaneen_shaishaa", mp3quranServer: "" },
  { id: "albana", name: "البنا", folder: "albana", mp3quranServer: "" },
  // Added 10 popular reciters as placeholders (verify sources later)
  { id: "basfar", name: "عبد الله بصفر", folder: "basfar", mp3quranServer: "" },
  { id: "al_huthaify", name: "علي الحذيفي", folder: "al_huthaify", mp3quranServer: "" },
  { id: "alqasim", name: "عبد المحسن القاسم", folder: "alqasim", mp3quranServer: "" },
  { id: "ath_thubaity", name: "عبدالباري الثبيتي", folder: "ath_thubaity", mp3quranServer: "" },
  { id: "adel_kalbani", name: "عادل كلباني", folder: "adel_kalbani", mp3quranServer: "" },
  { id: "khalid_alqahtani", name: "خالد القحطاني", folder: "khalid_alqahtani", mp3quranServer: "" },
  { id: "salah_bukhatir", name: "صلاح بختير", folder: "salah_bukhatir", mp3quranServer: "" },
  { id: "salah_albudair", name: "صلاح البدير", folder: "salah_albudair", mp3quranServer: "" },
  { id: "abdulkarim_alhazmi", name: "عبد الكريم الحازمي", folder: "abdulkarim_alhazmi", mp3quranServer: "" },
  { id: "ibrahim_aljibrin", name: "إبراهيم الجبرين", folder: "ibrahim_aljibrin", mp3quranServer: "" },
];
