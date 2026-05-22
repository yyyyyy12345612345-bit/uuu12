export interface Reciter {
  id: string;
  name: string;
  folder: string;
  mp3quranServer: string;
  everyAyahFolder?: string; // Standard EveryAyah folder name
}

export const RECITERS: Reciter[] = [
  {
    "id": "maher",
    "name": "ماهر المعيقلي",
    "folder": "maher",
    "mp3quranServer": "server12.mp3quran.net/maher",
    "everyAyahFolder": "Maher_AlMuaiqly_64kbps"
  },
  {
    "id": "sds",
    "name": "عبد الرحمن السديس",
    "folder": "sds",
    "mp3quranServer": "server11.mp3quran.net/sds",
    "everyAyahFolder": "Abdurrahmaan_As-Sudais_192kbps"
  },
  {
    "id": "shur",
    "name": "سعود الشريم",
    "folder": "shur",
    "mp3quranServer": "server7.mp3quran.net/shur",
    "everyAyahFolder": "Saood_ash-Shuraym_128kbps"
  },
  {
    "id": "juhani",
    "name": "عبد الله عواد الجهني",
    "folder": "juhani",
    "mp3quranServer": "server13.mp3quran.net/juhani",
    "everyAyahFolder": "Abdullaah_3awwaad_Al-Juhaynee_128kbps"
  },
  {
    "id": "afasy",
    "name": "مشاري العفاسي",
    "folder": "afs",
    "mp3quranServer": "server8.mp3quran.net/afs",
    "everyAyahFolder": "Alafasy_128kbps"
  },
  {
    "id": "qtm",
    "name": "ناصر القطامي",
    "folder": "qtm",
    "mp3quranServer": "server6.mp3quran.net/qtm",
    "everyAyahFolder": "Nasser_Alqatami_128kbps"
  },
  {
    "id": "s_gmd",
    "name": "سعد الغامدي",
    "folder": "s_gmd",
    "mp3quranServer": "server7.mp3quran.net/s_gmd",
    "everyAyahFolder": "Ghamadi_40kbps"
  },
  {
    "id": "ajm",
    "name": "أحمد بن علي العجمي",
    "folder": "ajm",
    "mp3quranServer": "server10.mp3quran.net/ajm"
  },
  {
    "id": "yasser",
    "name": "ياسر الدوسري",
    "folder": "yasser",
    "mp3quranServer": "server11.mp3quran.net/yasser",
    "everyAyahFolder": "Yasser_Ad-Dussary_128kbps"
  },
  {
    "id": "abkr",
    "name": "إدريس أبكر",
    "folder": "abkr",
    "mp3quranServer": "server6.mp3quran.net/abkr"
  },
  {
    "id": "basit",
    "name": "عبد الباسط عبد الصمد (مرتل)",
    "folder": "basit",
    "mp3quranServer": "server7.mp3quran.net/basit",
    "everyAyahFolder": "Abdul_Basit_Murattal_192kbps"
  },
  {
    "id": "minsh",
    "name": "محمد صديق المنشاوي (مرتل)",
    "folder": "minsh",
    "mp3quranServer": "server10.mp3quran.net/minsh",
    "everyAyahFolder": "Minshawy_Murattal_128kbps"
  },
  {
    "id": "husr",
    "name": "محمود خليل الحصري",
    "folder": "husr",
    "mp3quranServer": "server13.mp3quran.net/husr",
    "everyAyahFolder": "Husary_128kbps"
  },
  {
    "id": "husr_m",
    "name": "محمود خليل الحصري (مجود)",
    "folder": "husr_m",
    "mp3quranServer": "server13.mp3quran.net/husr_m",
    "everyAyahFolder": "Husary_Mujawwad_64kbps"
  },
  {
    "id": "shatree",
    "name": "أبو بكر الشاطري",
    "folder": "shatree",
    "mp3quranServer": "server11.mp3quran.net/shatree",
    "everyAyahFolder": "Abu_Bakr_Ash-Shaatree_128kbps"
  },
  {
    "id": "ayyub",
    "name": "محمد أيوب",
    "folder": "ayyub",
    "mp3quranServer": "server8.mp3quran.net/ayyub",
    "everyAyahFolder": "Muhammad_Ayyoub_128kbps"
  },
  {
    "id": "jbrl",
    "name": "محمد جبريل",
    "folder": "jbrl",
    "mp3quranServer": "server8.mp3quran.net/jbrl",
    "everyAyahFolder": "Muhammad_Jibreel_128kbps"
  },
  {
    "id": "akdr",
    "name": "إبراهيم الأخضر",
    "folder": "akdr",
    "mp3quranServer": "server6.mp3quran.net/akdr"
  },
  {
    "id": "jleel",
    "name": "خالد الجليل",
    "folder": "jleel",
    "mp3quranServer": "server10.mp3quran.net/jleel"
  },
  {
    "id": "hazza",
    "name": "هزاع البلوشي",
    "folder": "hazza",
    "mp3quranServer": "server11.mp3quran.net/hazza"
  },
  {
    "id": "mansor",
    "name": "منصور السالمي",
    "folder": "mansor",
    "mp3quranServer": "server14.mp3quran.net/mansor"
  },
  {
    "id": "balilah",
    "name": "بندر بليلة",
    "folder": "balilah",
    "mp3quranServer": "server6.mp3quran.net/balilah"
  },
  {
    "id": "albana",
    "name": "البنا",
    "folder": "bna",
    "mp3quranServer": "server8.mp3quran.net/bna"
  },
  {
    "id": "basfar",
    "name": "عبد الله بصفر",
    "folder": "basfar",
    "mp3quranServer": "server6.mp3quran.net/basfar",
    "everyAyahFolder": "Abdullah_Basfar_64kbps"
  },
  {
    "id": "mohammad_rifaat",
    "name": "محمد رفعت",
    "folder": "mohammad_rifaat",
    "mp3quranServer": "server14.mp3quran.net/mohammad_rifaat"
  },
  {
    "id": "sayed_nakashibandi",
    "name": "سيد النقشبندي",
    "folder": "sayed_nakashibandi",
    "mp3quranServer": "server11.mp3quran.net/sayed_nakashibandi"
  },
  {
    "id": "waleed_shamsan",
    "name": "الوليد الشمسان",
    "folder": "waleed_shamsan",
    "mp3quranServer": "server11.mp3quran.net/waleed_shamsan"
  },
  {
    "id": "badr_turki",
    "name": "بدر التركي",
    "folder": "badr_turki",
    "mp3quranServer": "server11.mp3quran.net/badr_turki"
  },
  {
    "id": "ali_abdullah_jaber",
    "name": "علي عبد الله جابر",
    "folder": "ali_abdullah_jaber",
    "mp3quranServer": "server11.mp3quran.net/ali_abdullah_jaber"
  },
  {
    "id": "ahmed_ibn_taleb_hameed",
    "name": "أحمد ابن طالب حميد",
    "folder": "ahmed_ibn_taleb_hameed",
    "mp3quranServer": "server11.mp3quran.net/ahmed_ibn_taleb_hameed"
  },
  {
    "id": "islam_sobhi",
    "name": "إسلام صبحي",
    "folder": "islam_sobhi",
    "mp3quranServer": "server11.mp3quran.net/islam_sobhi"
  },
  {
    "id": "abdurrahman_musaab",
    "name": "عبد الرحمن مصعب",
    "folder": "abdurrahman_musaab",
    "mp3quranServer": "server11.mp3quran.net/abdurrahman_musaab"
  },
  {
    "id": "ahmed_kasab",
    "name": "أحمد كاسب",
    "folder": "ahmed_kasab",
    "mp3quranServer": "server16.mp3quran.net/ahmed_kasab"
  },
  {
    "id": "mohammad_ahmad_hassan",
    "name": "محمد أحمد حسن",
    "folder": "mohammad_ahmad_hassan",
    "mp3quranServer": "server16.mp3quran.net/mohammad_ahmad_hassan"
  },
  {
    "id": "mustafa_ismail",
    "name": "مصطفى إسماعيل",
    "folder": "mustafa_ismail",
    "mp3quranServer": "server10.mp3quran.net/mustafa_ismail"
  },
  {
    "id": "ahmed_naeen",
    "name": "أحمد نعينع",
    "folder": "ahmed_naeen",
    "mp3quranServer": "server8.mp3quran.net/ahmed_naeen"
  },
  {
    "id": "kamel_yousef_albahtimi",
    "name": "كامل يوسف البهتيمي",
    "folder": "kamel_yousef_albahtimi",
    "mp3quranServer": "server6.mp3quran.net/kamel_yousef_albahtimi"
  },
  {
    "id": "taha_alfashny",
    "name": "طه الفشني",
    "folder": "taha_alfashny",
    "mp3quranServer": "server14.mp3quran.net/taha_alfashny"
  },
  {
    "id": "abu_alaneen_shaishaa",
    "name": "أبو العنين شعيشع",
    "folder": "abu_alaneen_shaishaa",
    "mp3quranServer": "server14.mp3quran.net/abu_alaneen_shaishaa"
  },
  {
    "id": "alhuthaify",
    "name": "علي الحذيفي",
    "folder": "alhuthaify",
    "mp3quranServer": "server11.mp3quran.net/alhuthaify"
  },
  {
    "id": "alqasim",
    "name": "عبد المحسن القاسم",
    "folder": "alqasim",
    "mp3quranServer": "server11.mp3quran.net/alqasim"
  },
  {
    "id": "ath_thubaity",
    "name": "عبد الباري الثبيتي",
    "folder": "ath_thubaity",
    "mp3quranServer": "server8.mp3quran.net/ath_thubaity"
  },
  {
    "id": "adel_kalbani",
    "name": "عادل كلباني",
    "folder": "adel_kalbani",
    "mp3quranServer": "server8.mp3quran.net/adel_kalbani"
  },
  {
    "id": "khalid_alqahtani",
    "name": "خالد القحطاني",
    "folder": "khalid_alqahtani",
    "mp3quranServer": "server11.mp3quran.net/khalid_alqahtani"
  },
  {
    "id": "salah_bukhatir",
    "name": "صلاح بختير",
    "folder": "salah_bukhatir",
    "mp3quranServer": "server6.mp3quran.net/salah_bukhatir"
  },
  {
    "id": "salah_albudair",
    "name": "صلاح البدير",
    "folder": "salah_albudair",
    "mp3quranServer": "server6.mp3quran.net/salah_albudair"
  },
  {
    "id": "abdulkarim_alhazmi",
    "name": "عبد الكريم الحازمي",
    "folder": "abdulkarim_alhazmi",
    "mp3quranServer": "server14.mp3quran.net/abdulkarim_alhazmi"
  },
  {
    "id": "ibrahim_aljibrin",
    "name": "إبراهيم الجبرين",
    "folder": "ibrahim_aljibrin",
    "mp3quranServer": "server11.mp3quran.net/ibrahim_aljibrin"
  },
  {
    "id": "ayman_suwaid",
    "name": "أيمن سويد",
    "folder": "ayman_suwaid",
    "mp3quranServer": "server8.mp3quran.net/ayman_suwaid"
  },
  {
    "id": "abdullah_almatrouk",
    "name": "عبد الله المطروق",
    "folder": "abdullah_almatrouk",
    "mp3quranServer": "server13.mp3quran.net/abdullah_almatrouk"
  },
  {
    "id": "nabil_rafat",
    "name": "نبيل رفعت",
    "folder": "nabil_rafat",
    "mp3quranServer": "server14.mp3quran.net/nabil_rafat"
  },
  {
    "id": "yassin_pasha",
    "name": "ياسين باشا",
    "folder": "yassin_pasha",
    "mp3quranServer": "server10.mp3quran.net/yassin_pasha"
  },
  {
    "id": "mohamed_jassem",
    "name": "محمد جاسم",
    "folder": "mohamed_jassem",
    "mp3quranServer": "server13.mp3quran.net/mohamed_jassem"
  },
  {
    "id": "mohammed_mabrouk",
    "name": "محمد مبروك",
    "folder": "mohammed_mabrouk",
    "mp3quranServer": "server6.mp3quran.net/mohammed_mabrouk"
  },
  {
    "id": "ahmed_pas",
    "name": "أحمد باس",
    "folder": "ahmed_pas",
    "mp3quranServer": "server11.mp3quran.net/ahmed_pas"
  },
  {
    "id": "ahmed_soliman",
    "name": "أحمد سليمان",
    "folder": "ahmed_soliman",
    "mp3quranServer": "server7.mp3quran.net/ahmed_soliman"
  },
  {
    "id": "mohamed_saeed",
    "name": "محمد سعيد",
    "folder": "mohamed_saeed",
    "mp3quranServer": "server13.mp3quran.net/mohamed_saeed"
  },
  {
    "id": "mohammed_fahad",
    "name": "محمد فهد",
    "folder": "mohammed_fahad",
    "mp3quranServer": "server8.mp3quran.net/mohammed_fahad"
  },
  {
    "id": "mohammed_ghassan",
    "name": "محمد غسان",
    "folder": "mohammed_ghassan",
    "mp3quranServer": "server14.mp3quran.net/mohammed_ghassan"
  },
  {
    "id": "mohammed_ismail",
    "name": "محمد إسماعيل",
    "folder": "mohammed_ismail",
    "mp3quranServer": "server14.mp3quran.net/mohammed_ismail"
  },
  {
    "id": "hamza_alhassan",
    "name": "حمزة الحسن",
    "folder": "hamza_alhassan",
    "mp3quranServer": "server11.mp3quran.net/hamza_alhassan"
  },
  {
    "id": "abdulkareem_alshehri",
    "name": "عبد الكريم الشهري",
    "folder": "abdulkareem_alshehri",
    "mp3quranServer": "server10.mp3quran.net/abdulkareem_alshehri"
  },
  {
    "id": "rashid_alhur",
    "name": "راشد الحور",
    "folder": "rashid_alhur",
    "mp3quranServer": "server8.mp3quran.net/rashid_alhur"
  },
  {
    "id": "saud_alfarisi",
    "name": "سعود الفارسي",
    "folder": "saud_alfarisi",
    "mp3quranServer": "server7.mp3quran.net/saud_alfarisi"
  },
  {
    "id": "abdullah_albahili",
    "name": "عبد الله البهيلي",
    "folder": "abdullah_albahili",
    "mp3quranServer": "server14.mp3quran.net/abdullah_albahili"
  },
  {
    "id": "mohammed_alquraishi",
    "name": "محمد القرشي",
    "folder": "mohammed_alquraishi",
    "mp3quranServer": "server14.mp3quran.net/mohammed_alquraishi"
  },
  {
    "id": "nadir_almaghribi",
    "name": "نادر المغربي",
    "folder": "nadir_almaghribi",
    "mp3quranServer": "server8.mp3quran.net/nadir_almaghribi"
  },
  {
    "id": "mohamed_gaber",
    "name": "محمد جابر",
    "folder": "mohamed_gaber",
    "mp3quranServer": "server11.mp3quran.net/mohamed_gaber"
  },
  {
    "id": "saleh_alorman",
    "name": "صالح العرمان",
    "folder": "saleh_alorman",
    "mp3quranServer": "server13.mp3quran.net/saleh_alorman"
  },
  {
    "id": "fadhel_alqahtani",
    "name": "فاضل القحطاني",
    "folder": "fadhel_alqahtani",
    "mp3quranServer": "server10.mp3quran.net/fadhel_alqahtani"
  },
  {
    "id": "muath_alqeeq",
    "name": "معاذ القيق",
    "folder": "muath_alqeeq",
    "mp3quranServer": "server7.mp3quran.net/muath_alqeeq"
  },
  {
    "id": "abdullah_alshehri",
    "name": "عبد الله الشهري",
    "folder": "abdullah_alshehri",
    "mp3quranServer": "server14.mp3quran.net/abdullah_alshehri"
  },
  {
    "id": "mohamed_aldurai",
    "name": "محمد الدوري",
    "folder": "mohamed_aldurai",
    "mp3quranServer": "server8.mp3quran.net/mohamed_aldurai"
  },
  {
    "id": "mohammad_moneer",
    "name": "محمد منير",
    "folder": "mohammad_moneer",
    "mp3quranServer": "server10.mp3quran.net/mohammad_moneer"
  },
  {
    "id": "rashid_alsharif",
    "name": "راشد الشريف",
    "folder": "rashid_alsharif",
    "mp3quranServer": "server11.mp3quran.net/rashid_alsharif"
  },
  {
    "id": "amin_salman",
    "name": "أمين سلمان",
    "folder": "amin_salman",
    "mp3quranServer": "server11.mp3quran.net/amin_salman"
  },
  {
    "id": "ibrahim_zaid",
    "name": "إبراهيم زايد",
    "folder": "ibrahim_zaid",
    "mp3quranServer": "server6.mp3quran.net/ibrahim_zaid"
  },
  {
    "id": "abdullah_mahmoud",
    "name": "عبد الله محمود",
    "folder": "abdullah_mahmoud",
    "mp3quranServer": "server14.mp3quran.net/abdullah_mahmoud"
  },
  {
    "id": "mohammed_yahya",
    "name": "محمد يحيى",
    "folder": "mohammed_yahya",
    "mp3quranServer": "server16.mp3quran.net/mohammed_yahya"
  },
  {
    "id": "mohamed_baraka",
    "name": "محمد بركة",
    "folder": "mohamed_baraka",
    "mp3quranServer": "server13.mp3quran.net/mohamed_baraka"
  },
  {
    "id": "sulaiman_alrajhi",
    "name": "سليمان الراجحي",
    "folder": "sulaiman_alrajhi",
    "mp3quranServer": "server10.mp3quran.net/sulaiman_alrajhi"
  },
  {
    "id": "abdullah_alsulayti",
    "name": "عبد الله السليطي",
    "folder": "abdullah_alsulayti",
    "mp3quranServer": "server8.mp3quran.net/abdullah_alsulayti"
  },
  {
    "id": "mohammed_alzaidi",
    "name": "محمد الزيدي",
    "folder": "mohammed_alzaidi",
    "mp3quranServer": "server7.mp3quran.net/mohammed_alzaidi"
  },
  {
    "id": "mohammad_melhem",
    "name": "محمد ملحم",
    "folder": "mohammad_melhem",
    "mp3quranServer": "server11.mp3quran.net/mohammad_melhem"
  },
  {
    "id": "abdulrahman_almadani",
    "name": "عبد الرحمن المدني",
    "folder": "abdulrahman_almadani",
    "mp3quranServer": "server14.mp3quran.net/abdulrahman_almadani"
  },
  {
    "id": "mohammed_mahdi",
    "name": "محمد مهدي",
    "folder": "mohammed_mahdi",
    "mp3quranServer": "server13.mp3quran.net/mohammed_mahdi"
  },
  {
    "id": "mohammed_hasan",
    "name": "محمد حسن",
    "folder": "mohammed_hasan",
    "mp3quranServer": "server6.mp3quran.net/mohammed_hasan"
  },
  {
    "id": "abdullah_edded",
    "name": "عبد الله الأدب",
    "folder": "abdullah_edded",
    "mp3quranServer": "server8.mp3quran.net/abdullah_edded"
  },
  {
    "id": "abdullah_alqattan",
    "name": "عبد الله القطّان",
    "folder": "abdullah_alqattan",
    "mp3quranServer": "server7.mp3quran.net/abdullah_alqattan"
  },
  {
    "id": "salah_khalid",
    "name": "صلاح خالد",
    "folder": "salah_khalid",
    "mp3quranServer": "server11.mp3quran.net/salah_khalid"
  },
  {
    "id": "hamad_alfarisi",
    "name": "حمد الفارسي",
    "folder": "hamad_alfarisi",
    "mp3quranServer": "server10.mp3quran.net/hamad_alfarisi"
  },
  {
    "id": "abdullah_alhamad",
    "name": "عبد الله الحمّاد",
    "folder": "abdullah_alhamad",
    "mp3quranServer": "server14.mp3quran.net/abdullah_alhamad"
  },
  {
    "id": "mohamed_algezawi",
    "name": "محمد القزاوي",
    "folder": "mohamed_algezawi",
    "mp3quranServer": "server16.mp3quran.net/mohamed_algezawi"
  },
  {
    "id": "mohammed_hussain",
    "name": "محمد حسين",
    "folder": "mohammed_hussain",
    "mp3quranServer": "server13.mp3quran.net/mohammed_hussain"
  },
  {
    "id": "mohamed_almansour",
    "name": "محمد المنصور",
    "folder": "mohamed_almansour",
    "mp3quranServer": "server8.mp3quran.net/mohamed_almansour"
  },
  {
    "id": "salman_alshareef",
    "name": "سلمان الشريف",
    "folder": "salman_alshareef",
    "mp3quranServer": "server7.mp3quran.net/salman_alshareef"
  },
  {
    "id": "ahmed_rifai",
    "name": "أحمد الرفاعي",
    "folder": "ahmed_rifai",
    "mp3quranServer": "server11.mp3quran.net/ahmed_rifai"
  },
  {
    "id": "nasser_alharbi",
    "name": "ناصر الحربي",
    "folder": "nasser_alharbi",
    "mp3quranServer": "server14.mp3quran.net/nasser_alharbi"
  },
  {
    "id": "mohamed_mansour",
    "name": "محمد منصور",
    "folder": "mohamed_mansour",
    "mp3quranServer": "server8.mp3quran.net/mohamed_mansour"
  },
  {
    "id": "mohammad_ramadan",
    "name": "محمد رمضان",
    "folder": "mohammad_ramadan",
    "mp3quranServer": "server11.mp3quran.net/mohammad_ramadan"
  },
  {
    "id": "mohamed_elmaghraby",
    "name": "محمد المغراوي",
    "folder": "mohamed_elmaghraby",
    "mp3quranServer": "server16.mp3quran.net/mohamed_elmaghraby"
  },
  {
    "id": "taha_almadani",
    "name": "طه المدني",
    "folder": "taha_almadani",
    "mp3quranServer": "server14.mp3quran.net/taha_almadani"
  },
  {
    "id": "omar_tayeb",
    "name": "عمر طيب",
    "folder": "omar_tayeb",
    "mp3quranServer": "server8.mp3quran.net/omar_tayeb"
  },
  {
    "id": "mohammed_akram",
    "name": "محمد أكرم",
    "folder": "mohammed_akram",
    "mp3quranServer": "server11.mp3quran.net/mohammed_akram"
  },
  {
    "id": "mohammad_said",
    "name": "محمد سعيد",
    "folder": "mohammad_said",
    "mp3quranServer": "server7.mp3quran.net/mohammad_said"
  },
  {
    "id": "mohammed_newe",
    "name": "محمد نوي",
    "folder": "mohammed_newe",
    "mp3quranServer": "server13.mp3quran.net/mohammed_newe"
  },
  {
    "id": "mahmoud_ahmed",
    "name": "محمود أحمد",
    "folder": "mahmoud_ahmed",
    "mp3quranServer": "server16.mp3quran.net/mahmoud_ahmed"
  },
  {
    "id": "abdulaziz_ash_shabuni",
    "name": "عبد العزيز الشابوني",
    "folder": "abdulaziz_ash_shabuni",
    "mp3quranServer": "server14.mp3quran.net/abdulaziz_ash_shabuni"
  },
  {
    "id": "omar_alquraishi",
    "name": "عمر القرشي",
    "folder": "omar_alquraishi",
    "mp3quranServer": "server8.mp3quran.net/omar_alquraishi"
  },
  {
    "id": "mohamed_bassam",
    "name": "محمد بسام",
    "folder": "mohamed_bassam",
    "mp3quranServer": "server11.mp3quran.net/mohamed_bassam"
  },
  {
    "id": "saad_almohammedi",
    "name": "سعد المحمودي",
    "folder": "saad_almohammedi",
    "mp3quranServer": "server14.mp3quran.net/saad_almohammedi"
  },
  {
    "id": "mohammed_almuhandis",
    "name": "محمد المهندس",
    "folder": "mohammed_almuhandis",
    "mp3quranServer": "server10.mp3quran.net/mohammed_almuhandis"
  },
  {
    "id": "mustafa_albalushi",
    "name": "مصطفى البلوشي",
    "folder": "mustafa_albalushi",
    "mp3quranServer": "server7.mp3quran.net/mustafa_albalushi"
  },
  {
    "id": "mohammed_saber",
    "name": "محمد صابر",
    "folder": "mohammed_saber",
    "mp3quranServer": "server8.mp3quran.net/mohammed_saber"
  },
  {
    "id": "fahd_alqadi",
    "name": "فهد القاضي",
    "folder": "fahd_alqadi",
    "mp3quranServer": "server11.mp3quran.net/fahd_alqadi"
  },
  {
    "id": "mohammed_alsharif",
    "name": "محمد الشريف",
    "folder": "mohammed_alsharif",
    "mp3quranServer": "server13.mp3quran.net/mohammed_alsharif"
  },
  {
    "id": "nasser_alqurashi",
    "name": "ناصر القرشي",
    "folder": "nasser_alqurashi",
    "mp3quranServer": "server6.mp3quran.net/nasser_alqurashi"
  },
  {
    "id": "mohammed_alzahrani",
    "name": "محمد الزهراني",
    "folder": "mohammed_alzahrani",
    "mp3quranServer": "server14.mp3quran.net/mohammed_alzahrani"
  },
  {
    "id": "mohammed_almansoori",
    "name": "محمد المنصوري",
    "folder": "mohammed_almansoori",
    "mp3quranServer": "server8.mp3quran.net/mohammed_almansoori"
  },
  {
    "id": "abdullah_almuhairi",
    "name": "عبد الله المحيري",
    "folder": "abdullah_almuhairi",
    "mp3quranServer": "server11.mp3quran.net/abdullah_almuhairi"
  },
  {
    "id": "ahmed_alboghdadi",
    "name": "أحمد البغدادي",
    "folder": "ahmed_alboghdadi",
    "mp3quranServer": "server6.mp3quran.net/ahmed_alboghdadi"
  },
  {
    "id": "mohamed_alhaj",
    "name": "محمد الحاج",
    "folder": "mohamed_alhaj",
    "mp3quranServer": "server7.mp3quran.net/mohamed_alhaj"
  },
  {
    "id": "ali_alqarni",
    "name": "علي القرني",
    "folder": "ali_alqarni",
    "mp3quranServer": "server8.mp3quran.net/ali_alqarni"
  },
  {
    "id": "ahmed_alhameidi",
    "name": "أحمد الحميدي",
    "folder": "ahmed_alhameidi",
    "mp3quranServer": "server10.mp3quran.net/ahmed_alhameidi"
  },
  {
    "id": "mohammad_alhamami",
    "name": "محمد الحمامي",
    "folder": "mohammad_alhamami",
    "mp3quranServer": "server11.mp3quran.net/mohammad_alhamami"
  },
  {
    "id": "hassan_mansour",
    "name": "حسن منصور",
    "folder": "hassan_mansour",
    "mp3quranServer": "server13.mp3quran.net/hassan_mansour"
  },
  {
    "id": "mohammed_alfaisal",
    "name": "محمد الفيصل",
    "folder": "mohammed_alfaisal",
    "mp3quranServer": "server14.mp3quran.net/mohammed_alfaisal"
  },
  {
    "id": "abdullah_alkahtani",
    "name": "عبد الله القحطاني",
    "folder": "abdullah_alkahtani",
    "mp3quranServer": "server16.mp3quran.net/abdullah_alkahtani"
  },
  {
    "id": "yaser_almalki",
    "name": "ياسر المالكي",
    "folder": "yaser_almalki",
    "mp3quranServer": "server6.mp3quran.net/yaser_almalki"
  },
  {
    "id": "abdulrahman_alhabeeb",
    "name": "عبد الرحمن الحبيب",
    "folder": "abdulrahman_alhabeeb",
    "mp3quranServer": "server7.mp3quran.net/abdulrahman_alhabeeb"
  },
  {
    "id": "mohamed_alsaif",
    "name": "محمد السيف",
    "folder": "mohamed_alsaif",
    "mp3quranServer": "server8.mp3quran.net/mohamed_alsaif"
  },
  {
    "id": "abdulrahman_alkhalidi",
    "name": "عبد الرحمن الخالدي",
    "folder": "abdulrahman_alkhalidi",
    "mp3quranServer": "server10.mp3quran.net/abdulrahman_alkhalidi"
  },
  {
    "id": "ahmad_alsaeed",
    "name": "أحمد السعيد",
    "folder": "ahmad_alsaeed",
    "mp3quranServer": "server11.mp3quran.net/ahmad_alsaeed"
  },
  {
    "id": "majid_alqadi",
    "name": "ماجد القاضي",
    "folder": "majid_alqadi",
    "mp3quranServer": "server13.mp3quran.net/majid_alqadi"
  },
  {
    "id": "tariq_alzafiri",
    "name": "طارق الظفيري",
    "folder": "tariq_alzafiri",
    "mp3quranServer": "server14.mp3quran.net/tariq_alzafiri"
  },
  {
    "id": "islam_alfahad",
    "name": "إسلام الفهد",
    "folder": "islam_alfahad",
    "mp3quranServer": "server16.mp3quran.net/islam_alfahad"
  },
  {
    "id": "sami_almutairi",
    "name": "سامي المطيري",
    "folder": "sami_almutairi",
    "mp3quranServer": "server6.mp3quran.net/sami_almutairi"
  },
  {
    "id": "mohammad_rafat",
    "name": "محمد رفعت",
    "folder": "mohammad_rafat",
    "mp3quranServer": "server7.mp3quran.net/mohammad_rafat"
  },
  {
    "id": "abdulrahman_alabd",
    "name": "عبد الرحمن العبد",
    "folder": "abdulrahman_alabd",
    "mp3quranServer": "server8.mp3quran.net/abdulrahman_alabd"
  },
  {
    "id": "wakil_alharthy",
    "name": "وكيل الحارثي",
    "folder": "wakil_alharthy",
    "mp3quranServer": "server10.mp3quran.net/wakil_alharthy"
  },
  {
    "id": "mohammed_alsharqawi",
    "name": "محمد الشرقاوي",
    "folder": "mohammed_alsharqawi",
    "mp3quranServer": "server11.mp3quran.net/mohammed_alsharqawi"
  },
  {
    "id": "abdulaziz_alamer",
    "name": "عبد العزيز العامر",
    "folder": "abdulaziz_alamer",
    "mp3quranServer": "server13.mp3quran.net/abdulaziz_alamer"
  },
  {
    "id": "haytham_alsharif",
    "name": "هيثم الشريف",
    "folder": "haytham_alsharif",
    "mp3quranServer": "server14.mp3quran.net/haytham_alsharif"
  },
  {
    "id": "omar_alkhamis",
    "name": "عمر الخميس",
    "folder": "omar_alkhamis",
    "mp3quranServer": "server16.mp3quran.net/omar_alkhamis"
  },
  {
    "id": "faisal_alwati",
    "name": "فيصل الوطي",
    "folder": "faisal_alwati",
    "mp3quranServer": "server6.mp3quran.net/faisal_alwati"
  },
  {
    "id": "abdullah_alkhuzayem",
    "name": "عبد الله الخزيم",
    "folder": "abdullah_alkhuzayem",
    "mp3quranServer": "server7.mp3quran.net/abdullah_alkhuzayem"
  },
  {
    "id": "ibrahim_alhabashy",
    "name": "إبراهيم الحبشي",
    "folder": "ibrahim_alhabashy",
    "mp3quranServer": "server8.mp3quran.net/ibrahim_alhabashy"
  },
  {
    "id": "mohammad_alsayed",
    "name": "محمد السيد",
    "folder": "mohammad_alsayed",
    "mp3quranServer": "server10.mp3quran.net/mohammad_alsayed"
  },
  {
    "id": "mohammed_alsulaiman",
    "name": "محمد السليمان",
    "folder": "mohammed_alsulaiman",
    "mp3quranServer": "server11.mp3quran.net/mohammed_alsulaiman"
  },
  {
    "id": "hasan_alsayed",
    "name": "حسن السيد",
    "folder": "hasan_alsayed",
    "mp3quranServer": "server13.mp3quran.net/hasan_alsayed"
  },
  {
    "id": "taqi_alhaki",
    "name": "تقي الحقي",
    "folder": "taqi_alhaki",
    "mp3quranServer": "server14.mp3quran.net/taqi_alhaki"
  },
  {
    "id": "mohammed_almaani",
    "name": "محمد الماني",
    "folder": "mohammed_almaani",
    "mp3quranServer": "server16.mp3quran.net/mohammed_almaani"
  },
  {
    "id": "abdulrahman_ajar",
    "name": "عبد الرحمن عجر",
    "folder": "abdulrahman_ajar",
    "mp3quranServer": "server6.mp3quran.net/abdulrahman_ajar"
  },
  {
    "id": "mohammed_aljamal",
    "name": "محمد الجمل",
    "folder": "mohammed_aljamal",
    "mp3quranServer": "server7.mp3quran.net/mohammed_aljamal"
  },
  {
    "id": "noman_alsudais",
    "name": "نعمان السديس",
    "folder": "noman_alsudais",
    "mp3quranServer": "server8.mp3quran.net/noman_alsudais"
  },
  {
    "id": "mohammed_aljubair",
    "name": "محمد الجبير",
    "folder": "mohammed_aljubair",
    "mp3quranServer": "server10.mp3quran.net/mohammed_aljubair"
  },
  {
    "id": "abdulrahman_alnasser",
    "name": "عبد الرحمن الناصر",
    "folder": "abdulrahman_alnasser",
    "mp3quranServer": "server11.mp3quran.net/abdulrahman_alnasser"
  },
  {
    "id": "mohammad_albanna",
    "name": "محمد البنا",
    "folder": "mohammad_albanna",
    "mp3quranServer": "server13.mp3quran.net/mohammad_albanna"
  },
  {
    "id": "abdullah_alsuhail",
    "name": "عبد الله السهيل",
    "folder": "abdullah_alsuhail",
    "mp3quranServer": "server14.mp3quran.net/abdullah_alsuhail"
  },
  {
    "id": "fahd_aljadani",
    "name": "فهد الجدعاني",
    "folder": "fahd_aljadani",
    "mp3quranServer": "server16.mp3quran.net/fahd_aljadani"
  },
  {
    "id": "mohamed_alqaisi",
    "name": "محمد القيسي",
    "folder": "mohamed_alqaisi",
    "mp3quranServer": "server6.mp3quran.net/mohamed_alqaisi"
  },
  {
    "id": "abdulaziz_alsuwaidi",
    "name": "عبد العزيز السويدي",
    "folder": "abdulaziz_alsuwaidi",
    "mp3quranServer": "server7.mp3quran.net/abdulaziz_alsuwaidi"
  },
  {
    "id": "mohammed_alsalmi",
    "name": "محمد السالمي",
    "folder": "mohammed_alsalmi",
    "mp3quranServer": "server8.mp3quran.net/mohammed_alsalmi"
  },
  {
    "id": "akram_alraisi",
    "name": "أكرم الرايسي",
    "folder": "akram_alraisi",
    "mp3quranServer": "server10.mp3quran.net/akram_alraisi"
  },
  {
    "id": "mohammed_alrabeah",
    "name": "محمد الربيع",
    "folder": "mohammed_alrabeah",
    "mp3quranServer": "server11.mp3quran.net/mohammed_alrabeah"
  },
  {
    "id": "omar_alnasser",
    "name": "عمر الناصر",
    "folder": "omar_alnasser",
    "mp3quranServer": "server13.mp3quran.net/omar_alnasser"
  },
  {
    "id": "mohamed_alensani",
    "name": "محمد الإنصاني",
    "folder": "mohamed_alensani",
    "mp3quranServer": "server14.mp3quran.net/mohamed_alensani"
  },
  {
    "id": "abdullah_alshrief",
    "name": "عبد الله الشريف",
    "folder": "abdullah_alshrief",
    "mp3quranServer": "server16.mp3quran.net/abdullah_alshrief"
  },
  {
    "id": "abdulrahman_alkhatib",
    "name": "عبد الرحمن الخطيب",
    "folder": "abdulrahman_alkhatib",
    "mp3quranServer": "server6.mp3quran.net/abdulrahman_alkhatib"
  },
  {
    "id": "mohammed_alsaleh",
    "name": "محمد الصالح",
    "folder": "mohammed_alsaleh",
    "mp3quranServer": "server7.mp3quran.net/mohammed_alsaleh"
  },
  {
    "id": "yakub_alshamri",
    "name": "يعقوب الشمري",
    "folder": "yakub_alshamri",
    "mp3quranServer": "server8.mp3quran.net/yakub_alshamri"
  },
  {
    "id": "mohammed_aljawhar",
    "name": "محمد الجوهرة",
    "folder": "mohammed_aljawhar",
    "mp3quranServer": "server10.mp3quran.net/mohammed_aljawhar"
  },
  {
    "id": "mohamed_alshamri",
    "name": "محمد الشمري",
    "folder": "mohamed_alshamri",
    "mp3quranServer": "server11.mp3quran.net/mohamed_alshamri"
  },
  {
    "id": "abdulrahman_alsalama",
    "name": "عبد الرحمن السلامة",
    "folder": "abdulrahman_alsalama",
    "mp3quranServer": "server13.mp3quran.net/abdulrahman_alsalama"
  },
  {
    "id": "badr_alzahrani",
    "name": "بدر الزهراني",
    "folder": "badr_alzahrani",
    "mp3quranServer": "server14.mp3quran.net/badr_alzahrani"
  },
  {
    "id": "mohammed_alqarny",
    "name": "محمد القرني",
    "folder": "mohammed_alqarny",
    "mp3quranServer": "server16.mp3quran.net/mohammed_alqarny"
  },
  {
    "id": "abdullah_aljohani",
    "name": "عبد الله الجهني",
    "folder": "abdullah_aljohani",
    "mp3quranServer": "server6.mp3quran.net/abdullah_aljohani"
  },
  {
    "id": "ahmed_almuhajir",
    "name": "أحمد المهاجر",
    "folder": "ahmed_almuhajir",
    "mp3quranServer": "server7.mp3quran.net/ahmed_almuhajir"
  },
  {
    "id": "mohammed_albannai",
    "name": "محمد البناني",
    "folder": "mohammed_albannai",
    "mp3quranServer": "server8.mp3quran.net/mohammed_albannai"
  },
  {
    "id": "mohamed_alsalman",
    "name": "محمد السلمان",
    "folder": "mohamed_alsalman",
    "mp3quranServer": "server10.mp3quran.net/mohamed_alsalman"
  },
  {
    "id": "ibrahim_alsaleh",
    "name": "إبراهيم الصالح",
    "folder": "ibrahim_alsaleh",
    "mp3quranServer": "server11.mp3quran.net/ibrahim_alsaleh"
  },
  {
    "id": "mohammed_alshehri",
    "name": "محمد الشهري",
    "folder": "mohammed_alshehri",
    "mp3quranServer": "server13.mp3quran.net/mohammed_alshehri"
  },
  {
    "id": "abdullah_aldaqaq",
    "name": "عبد الله الدقاق",
    "folder": "abdullah_aldaqaq",
    "mp3quranServer": "server14.mp3quran.net/abdullah_aldaqaq"
  },
  {
    "id": "mohammed_alqattan",
    "name": "محمد القطان",
    "folder": "mohammed_alqattan",
    "mp3quranServer": "server16.mp3quran.net/mohammed_alqattan"
  },
  {
    "id": "muhammad_alfarsi",
    "name": "محمد الفارسي",
    "folder": "muhammad_alfarsi",
    "mp3quranServer": "server6.mp3quran.net/muhammad_alfarsi"
  },
  {
    "id": "thamer_alshehri",
    "name": "ثامر الشهري",
    "folder": "thamer_alshehri",
    "mp3quranServer": "server7.mp3quran.net/thamer_alshehri"
  },
  {
    "id": "mohamed_alahmadi",
    "name": "محمد الأحمدي",
    "folder": "mohamed_alahmadi",
    "mp3quranServer": "server8.mp3quran.net/mohamed_alahmadi"
  },
  {
    "id": "abdulaziz_alsharif",
    "name": "عبد العزيز الشريف",
    "folder": "abdulaziz_alsharif",
    "mp3quranServer": "server10.mp3quran.net/abdulaziz_alsharif"
  },
  {
    "id": "mohammad_alghamdi",
    "name": "محمد الغامدي",
    "folder": "mohammad_alghamdi",
    "mp3quranServer": "server11.mp3quran.net/mohammad_alghamdi"
  },
  {
    "id": "wali_alsharif",
    "name": "ولي الشريف",
    "folder": "wali_alsharif",
    "mp3quranServer": "server13.mp3quran.net/wali_alsharif"
  },
  {
    "id": "yousef_alharbi",
    "name": "يوسف الحربي",
    "folder": "yousef_alharbi",
    "mp3quranServer": "server14.mp3quran.net/yousef_alharbi"
  },
  {
    "id": "mohammad_almuhanna",
    "name": "محمد المهنا",
    "folder": "mohammad_almuhanna",
    "mp3quranServer": "server16.mp3quran.net/mohammad_almuhanna"
  },
  {
    "id": "omar_alsaud",
    "name": "عمر السعود",
    "folder": "omar_alsaud",
    "mp3quranServer": "server6.mp3quran.net/omar_alsaud"
  },
  {
    "id": "abdullah_alfarraj",
    "name": "عبد الله الفراج",
    "folder": "abdullah_alfarraj",
    "mp3quranServer": "server7.mp3quran.net/abdullah_alfarraj"
  },
  {
    "id": "mohamed_alsaeed",
    "name": "محمد السعيد",
    "folder": "mohamed_alsaeed",
    "mp3quranServer": "server8.mp3quran.net/mohamed_alsaeed"
  },
  {
    "id": "saleh_almalki",
    "name": "صالح المالكي",
    "folder": "saleh_almalki",
    "mp3quranServer": "server10.mp3quran.net/saleh_almalki"
  },
  {
    "id": "abdullah_alhazmi2",
    "name": "عبد الله الحازمي",
    "folder": "abdullah_alhazmi2",
    "mp3quranServer": "server11.mp3quran.net/abdullah_alhazmi2"
  },
  {
    "id": "mohammed_alqasim",
    "name": "محمد القاسم",
    "folder": "mohammed_alqasim",
    "mp3quranServer": "server13.mp3quran.net/mohammed_alqasim"
  },
  {
    "id": "hassan_alshehri",
    "name": "حسن الشهري",
    "folder": "hassan_alshehri",
    "mp3quranServer": "server14.mp3quran.net/hassan_alshehri"
  },
  {
    "id": "abdulrahim_alrasheed",
    "name": "عبد الرحيم الرشيد",
    "folder": "abdulrahim_alrasheed",
    "mp3quranServer": "server16.mp3quran.net/abdulrahim_alrasheed"
  }
];
