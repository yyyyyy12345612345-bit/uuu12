export interface Reciter {
  id: string;
  name: string;
  folder: string;
  mp3quranServer: string;
  everyAyahFolder?: string; // Standard EveryAyah folder name
  quranComId?: number;
  isPremiumSync?: boolean;
}

export const RECITERS: Reciter[] = [
  {
    "id": "afasy",
    "name": "مشاري العفاسي",
    "folder": "afs",
    "mp3quranServer": "server8.mp3quran.net/afs",
    "everyAyahFolder": "Alafasy_128kbps",
    "quranComId": 7,
    "isPremiumSync": true
  },
  {
    "id": "basit_murattal",
    "name": "عبدالباسط عبدالصمد (مرتل)",
    "folder": "basit",
    "mp3quranServer": "server7.mp3quran.net/basit",
    "everyAyahFolder": "Abdul_Basit_Murattal_192kbps",
    "quranComId": 2,
    "isPremiumSync": true
  },
  {
    "id": "basit_mujawwad",
    "name": "عبدالباسط عبدالصمد (مجود)",
    "folder": "basit_mjwd",
    "mp3quranServer": "server7.mp3quran.net/basit/Almusshaf-Al-Mojawwad",
    "everyAyahFolder": "Abdul_Basit_Mujawwad_128kbps",
    "quranComId": 1,
    "isPremiumSync": true
  },
  {
    "id": "sds",
    "name": "عبدالرحمن السديس",
    "folder": "sds",
    "mp3quranServer": "server11.mp3quran.net/sds",
    "everyAyahFolder": "Abdurrahmaan_As-Sudais_192kbps",
    "quranComId": 3,
    "isPremiumSync": true
  },
  {
    "id": "shur",
    "name": "سعود الشريم",
    "folder": "shur",
    "mp3quranServer": "server7.mp3quran.net/shur",
    "everyAyahFolder": "Saood_ash-Shuraym_128kbps",
    "quranComId": 10,
    "isPremiumSync": true
  },
  {
    "id": "hani_rifai",
    "name": "هاني الرفاعي",
    "folder": "hani",
    "mp3quranServer": "server8.mp3quran.net/hani",
    "everyAyahFolder": "Hani_Rifai_192kbps",
    "quranComId": 5,
    "isPremiumSync": true
  },
  {
    "id": "shatree",
    "name": "شيخ أبو بكر الشاطري",
    "folder": "shatree",
    "mp3quranServer": "server11.mp3quran.net/shatri",
    "everyAyahFolder": "Abu_Bakr_Ash-Shaatree_128kbps",
    "quranComId": 4,
    "isPremiumSync": true
  },
  {
    "id": "minsh_murattal",
    "name": "محمد صديق المنشاوي (مرتل)",
    "folder": "minsh",
    "mp3quranServer": "server10.mp3quran.net/minsh",
    "everyAyahFolder": "Minshawy_Murattal_128kbps",
    "quranComId": 9,
    "isPremiumSync": true
  },
  {
    "id": "minsh_mujawwad",
    "name": "محمد صديق المنشاوي (مجود)",
    "folder": "minsh_mjwd",
    "mp3quranServer": "server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad",
    "everyAyahFolder": "Minshawy_Mujawwad_192kbps",
    "quranComId": 8,
    "isPremiumSync": true
  },
  {
    "id": "husr_murattal",
    "name": "محمود خليل الحصري (مرتل)",
    "folder": "husr",
    "mp3quranServer": "server13.mp3quran.net/husr",
    "everyAyahFolder": "Husary_128kbps",
    "quranComId": 6,
    "isPremiumSync": true
  },
  {
    "id": "husr_mujawwad",
    "name": "محمود خليل الحصري (مجود)",
    "folder": "husr_mjwd",
    "mp3quranServer": "server13.mp3quran.net/husr/Almusshaf-Al-Mojawwad",
    "everyAyahFolder": "Husary_Mujawwad_64kbps",
    "quranComId": 12,
    "isPremiumSync": true
  },
  {
    "id": "maher",
    "name": "ماهر المعيقلي",
    "folder": "maher",
    "mp3quranServer": "server12.mp3quran.net/maher",
    "everyAyahFolder": "Maher_AlMuaiqly_64kbps"
  },
  {
    "id": "juhani",
    "name": "عبدالله عواد الجهني",
    "folder": "jhn",
    "mp3quranServer": "server13.mp3quran.net/jhn",
    "everyAyahFolder": "Abdullaah_3awwaad_Al-Juhaynee_128kbps"
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
    "mp3quranServer": "server10.mp3quran.net/ajm",
    "everyAyahFolder": "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net"
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
    "id": "ayyub",
    "name": "محمد أيوب",
    "folder": "ayyub",
    "mp3quranServer": "server16.mp3quran.net/ayyoub2/Rewayat-Hafs-A-n-Assem",
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
    "mp3quranServer": "server6.mp3quran.net/akdr",
    "everyAyahFolder": "Ibrahim_Akhdar_64kbps"
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
    "name": "بندر بليله",
    "folder": "balilah",
    "mp3quranServer": "server6.mp3quran.net/balilah"
  },
  {
    "id": "albana",
    "name": "محمود علي البنا",
    "folder": "bna",
    "mp3quranServer": "server8.mp3quran.net/bna",
    "everyAyahFolder": "mahmoud_ali_al_banna_32kbps"
  },
  {
    "id": "basfar",
    "name": "عبدالله بصفر",
    "folder": "basfar",
    "mp3quranServer": "server6.mp3quran.net/bsfr",
    "everyAyahFolder": "Abdullah_Basfar_64kbps"
  },
  {
    "id": "hamad_daghriri",
    "name": "حمد الدغريري",
    "folder": "mohammad_rifaat",
    "mp3quranServer": "server6.mp3quran.net/hamad"
  },
  {
    "id": "salah_hashim",
    "name": "صلاح الهاشم",
    "folder": "sayed_nakashibandi",
    "mp3quranServer": "server12.mp3quran.net/salah_hashim_m"
  },
  {
    "id": "waleed_shamsan",
    "name": "الوليد الشمسان",
    "folder": "waleed_shamsan",
    "mp3quranServer": "server14.mp3quran.net/shamsan/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "badr_turki",
    "name": "بدر التركي",
    "folder": "badr_turki",
    "mp3quranServer": "server10.mp3quran.net/bader/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "ali_abdullah_jaber",
    "name": "علي عبد الله جابر",
    "folder": "ali_abdullah_jaber",
    "mp3quranServer": "server9.mp3quran.net/abdullah",
    "everyAyahFolder": "Ali_Jaber_64kbps"
  },
  {
    "id": "ahmed_ibn_taleb_hameed",
    "name": "أحمد الحذيفي",
    "folder": "ahmed_ibn_taleb_hameed",
    "mp3quranServer": "server8.mp3quran.net/ahmad_huth"
  },
  {
    "id": "islam_sobhi",
    "name": "إسلام صبحي",
    "folder": "islam_sobhi",
    "mp3quranServer": "server14.mp3quran.net/islam/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "ahmed_naina",
    "name": "أحمد نعينع",
    "folder": "abdurrahman_musaab",
    "mp3quranServer": "server11.mp3quran.net/ahmad_nu",
    "everyAyahFolder": "Ahmed_Neana_128kbps"
  },
  {
    "id": "abdulaziz_alahmed",
    "name": "عبدالعزيز الأحمد",
    "folder": "ahmed_kasab",
    "mp3quranServer": "server11.mp3quran.net/a_ahmed"
  },
  {
    "id": "mustafa_ismail",
    "name": "مصطفى إسماعيل",
    "folder": "mustafa_ismail",
    "mp3quranServer": "server8.mp3quran.net/mustafa",
    "everyAyahFolder": "Mustafa_Ismail_48kbps"
  },
  {
    "id": "yousef_shohaee",
    "name": "يوسف الشويعي",
    "folder": "kamel_yousef_albahtimi",
    "mp3quranServer": "server9.mp3quran.net/yousef"
  },
  {
    "id": "ahmed_hawashi",
    "name": "أحمد الحواشي",
    "folder": "taha_alfashny",
    "mp3quranServer": "server11.mp3quran.net/hawashi"
  },
  {
    "id": "ahmed_trabulsi",
    "name": "أحمد الطرابلسي",
    "folder": "abu_alaneen_shaishaa",
    "mp3quranServer": "server10.mp3quran.net/trabulsi"
  },
  {
    "id": "alqasim",
    "name": "عبدالمحسن القاسم",
    "folder": "alqasim",
    "mp3quranServer": "server8.mp3quran.net/qasm",
    "everyAyahFolder": "Muhsin_Al_Qasim_192kbps"
  },
  {
    "id": "ath_thubaity",
    "name": "عبدالبارئ الثبيتي",
    "folder": "ath_thubaity",
    "mp3quranServer": "server6.mp3quran.net/thubti"
  },
  {
    "id": "abdulwali_arkani",
    "name": "عبدالولي الأركاني",
    "folder": "adel_kalbani",
    "mp3quranServer": "server6.mp3quran.net/arkani"
  },
  {
    "id": "khalid_alqahtani",
    "name": "خالد القحطاني",
    "folder": "khalid_alqahtani",
    "mp3quranServer": "server10.mp3quran.net/qht",
    "everyAyahFolder": "Khaalid_Abdullaah_al-Qahtaanee_192kbps"
  },
  {
    "id": "salah_albudair",
    "name": "صلاح البدير",
    "folder": "salah_albudair",
    "mp3quranServer": "server6.mp3quran.net/s_bud",
    "everyAyahFolder": "Salah_Al_Budair_128kbps"
  },
  {
    "id": "ibrahim_aljibrin",
    "name": "إبراهيم الجبرين",
    "folder": "ibrahim_aljibrin",
    "mp3quranServer": "server6.mp3quran.net/jbreen"
  },
  {
    "id": "abdullah_kandari",
    "name": "عبدالله الكندري",
    "folder": "abdullah_almatrouk",
    "mp3quranServer": "server10.mp3quran.net/Abdullahk"
  },
  {
    "id": "nabil_rafat",
    "name": "نبيل الرفاعي",
    "folder": "nabil_rafat",
    "mp3quranServer": "server9.mp3quran.net/nabil",
    "everyAyahFolder": "Nabil_Rifa3i_48kbps"
  },
  {
    "id": "mohamed_jassem",
    "name": "محمد المنشد",
    "folder": "mohamed_jassem",
    "mp3quranServer": "server10.mp3quran.net/monshed"
  },
  {
    "id": "mohammed_ghassan",
    "name": "محمد غسان",
    "folder": "mohammed_ghassan",
    "mp3quranServer": "server16.mp3quran.net/hasan"
  },
  {
    "id": "khalid_ghamdi",
    "name": "خالد الغامدي",
    "folder": "mohammed_ismail",
    "mp3quranServer": "server6.mp3quran.net/ghamdi"
  },
  {
    "id": "rashid_alhur",
    "name": "محمد رشاد الشريف",
    "folder": "rashid_alhur",
    "mp3quranServer": "server10.mp3quran.net/rashad"
  },
  {
    "id": "mohammed_alquraishi",
    "name": "ياسر القرشي",
    "folder": "mohammed_alquraishi",
    "mp3quranServer": "server9.mp3quran.net/qurashi"
  },
  {
    "id": "nadir_almaghribi",
    "name": "ناصر الماجد",
    "folder": "nadir_almaghribi",
    "mp3quranServer": "server14.mp3quran.net/nasser_almajed"
  },
  {
    "id": "salman_alotaibi",
    "name": "سلمان العتيبي",
    "folder": "saleh_alorman",
    "mp3quranServer": "server11.mp3quran.net/salman"
  },
  {
    "id": "mustafa_lahoni",
    "name": "مصطفى اللاهوني",
    "folder": "fadhel_alqahtani",
    "mp3quranServer": "server6.mp3quran.net/lahoni"
  },
  {
    "id": "ibrahim_zaid",
    "name": "إبراهيم السعدان",
    "folder": "ibrahim_zaid",
    "mp3quranServer": "server10.mp3quran.net/IbrahemSadan"
  },
  {
    "id": "mohammed_yahya",
    "name": "يحيى حوا",
    "folder": "mohammed_yahya",
    "mp3quranServer": "server12.mp3quran.net/yahya"
  },
  {
    "id": "dawood_hamza",
    "name": "داود حمزة",
    "folder": "mohammed_alzaidi",
    "mp3quranServer": "server9.mp3quran.net/hamza"
  },
  {
    "id": "ahmed_rifai",
    "name": "محمود الرفاعي",
    "folder": "ahmed_rifai",
    "mp3quranServer": "server11.mp3quran.net/mrifai"
  },
  {
    "id": "omar_tayeb",
    "name": "عمر طيب",
    "folder": "omar_tayeb",
    "mp3quranServer": "server9.mp3quran.net/omar_warsh"
  },
  {
    "id": "mohammed_saber",
    "name": "أحمد صابر",
    "folder": "mohammed_saber",
    "mp3quranServer": "server8.mp3quran.net/saber"
  },
  {
    "id": "alzain_mohammad",
    "name": "الزين محمد أحمد",
    "folder": "fahd_alqadi",
    "mp3quranServer": "server9.mp3quran.net/alzain"
  },
  {
    "id": "abdulmohsen_harthi",
    "name": "عبدالمحسن الحارثي",
    "folder": "mohammed_alsharif",
    "mp3quranServer": "server6.mp3quran.net/mohsin_harthi"
  },
  {
    "id": "mohammed_alzahrani",
    "name": "عبدالعزيز الزهراني",
    "folder": "mohammed_alzahrani",
    "mp3quranServer": "server9.mp3quran.net/zahrani"
  },
  {
    "id": "ali_alqarni",
    "name": "علي القرني",
    "folder": "ali_alqarni",
    "mp3quranServer": "server11.mp3quran.net/qari"
  },
  {
    "id": "waleed_dulyami",
    "name": "وليد الدليمي",
    "folder": "ahmed_alhameidi",
    "mp3quranServer": "server8.mp3quran.net/dlami"
  },
  {
    "id": "abdurrahman_majed",
    "name": "عبدالرحمن الماجد",
    "folder": "ahmad_alsaeed",
    "mp3quranServer": "server10.mp3quran.net/a_majed"
  },
  {
    "id": "mohammad_khalil_qari",
    "name": "محمد خليل القارئ",
    "folder": "majid_alqadi",
    "mp3quranServer": "server8.mp3quran.net/m_qari"
  },
  {
    "id": "wakil_alharthy",
    "name": "معيض الحارثي",
    "folder": "wakil_alharthy",
    "mp3quranServer": "server8.mp3quran.net/harthi"
  },
  {
    "id": "mohammad_alsayed",
    "name": "سيد رمضان",
    "folder": "mohammad_alsayed",
    "mp3quranServer": "server12.mp3quran.net/sayed"
  },
  {
    "id": "mohammed_aljamal",
    "name": "جمال شاكر عبدالله",
    "folder": "mohammed_aljamal",
    "mp3quranServer": "server6.mp3quran.net/jamal"
  },
  {
    "id": "khalid_mohna",
    "name": "خالد المهنا",
    "folder": "mohammad_albanna",
    "mp3quranServer": "server11.mp3quran.net/mohna"
  },
  {
    "id": "akram_raisi",
    "name": "أكرم الرايسي",
    "folder": "akram_alraisi",
    "mp3quranServer": "server10.mp3quran.net/trablsi"
  },
  {
    "id": "alashri_omran",
    "name": "العشري عمران",
    "folder": "omar_alnasser",
    "mp3quranServer": "server9.mp3quran.net/omran"
  },
  {
    "id": "saleh_habdan",
    "name": "صالح الهبدان",
    "folder": "mohammed_alqarny",
    "mp3quranServer": "server6.mp3quran.net/habdan"
  },
  {
    "id": "mohammed_alsaeed",
    "name": "محمد السعيد",
    "folder": "mohamed_alsaeed",
    "mp3quranServer": "server9.mp3quran.net/waleed"
  },
  {
    "id": "akrm",
    "name": "أكرم العلاقمي",
    "folder": "akrm",
    "mp3quranServer": "server9.mp3quran.net/akrm",
    "everyAyahFolder": "Akram_AlAlaqimy_128kbps"
  },
  {
    "id": "majd_onazi",
    "name": "ماجد العنزي",
    "folder": "majd_onazi",
    "mp3quranServer": "server8.mp3quran.net/majd_onazi"
  },
  {
    "id": "braak",
    "name": "محمد البراك",
    "folder": "braak",
    "mp3quranServer": "server13.mp3quran.net/braak"
  },
  {
    "id": "tblawi",
    "name": "محمد الطبلاوي",
    "folder": "tblawi",
    "mp3quranServer": "server12.mp3quran.net/tblawi",
    "everyAyahFolder": "Mohammad_al_Tablaway_128kbps"
  },
  {
    "id": "lhdan",
    "name": "محمد اللحيدان",
    "folder": "lhdan",
    "mp3quranServer": "server8.mp3quran.net/lhdan"
  },
  {
    "id": "mhsny",
    "name": "محمد المحيسني",
    "folder": "mhsny",
    "mp3quranServer": "server11.mp3quran.net/mhsny"
  },
  {
    "id": "shah",
    "name": "محمد صالح عالم شاه",
    "folder": "shah",
    "mp3quranServer": "server12.mp3quran.net/shah"
  },
  {
    "id": "m_krm",
    "name": "محمد عبدالكريم",
    "folder": "m_krm",
    "mp3quranServer": "server12.mp3quran.net/m_krm",
    "everyAyahFolder": "Muhammad_AbdulKareem_128kbps"
  },
  {
    "id": "ra3ad",
    "name": "مصطفى رعد العزاوي",
    "folder": "ra3ad",
    "mp3quranServer": "server8.mp3quran.net/ra3ad"
  },
  {
    "id": "zaml",
    "name": "ماجد الزامل",
    "folder": "zaml",
    "mp3quranServer": "server9.mp3quran.net/zaml"
  },
  {
    "id": "shaksh",
    "name": "ماهر شخاشيرو",
    "folder": "shaksh",
    "mp3quranServer": "server10.mp3quran.net/shaksh"
  },
  {
    "id": "a_klb",
    "name": "عادل الكلباني",
    "folder": "a_klb",
    "mp3quranServer": "server8.mp3quran.net/a_klb"
  },
  {
    "id": "bilal",
    "name": "موسى بلال",
    "folder": "bilal",
    "mp3quranServer": "server11.mp3quran.net/bilal"
  },
  {
    "id": "hatem",
    "name": "حاتم فريد الواعر",
    "folder": "hatem",
    "mp3quranServer": "server11.mp3quran.net/hatem"
  },
  {
    "id": "jormy",
    "name": "إبراهيم الجرمي",
    "folder": "jormy",
    "mp3quranServer": "server11.mp3quran.net/jormy"
  },
  {
    "id": "twfeeq",
    "name": "توفيق الصايغ",
    "folder": "twfeeq",
    "mp3quranServer": "server6.mp3quran.net/twfeeq"
  },
  {
    "id": "jaman",
    "name": "جمعان العصيمي",
    "folder": "jaman",
    "mp3quranServer": "server6.mp3quran.net/jaman"
  },
  {
    "id": "abdulgani",
    "name": "عبدالغني عبدالله",
    "folder": "abdulgani",
    "mp3quranServer": "server12.mp3quran.net/malaysia/abdulgani"
  },
  {
    "id": "fhmi",
    "name": "عبدالله فهمي",
    "folder": "fhmi",
    "mp3quranServer": "server12.mp3quran.net/malaysia/fhmi"
  },
  {
    "id": "hafz",
    "name": "محمد الحافظ",
    "folder": "hafz",
    "mp3quranServer": "server12.mp3quran.net/malaysia/hafz"
  },
  {
    "id": "hfs",
    "name": "محمد حفص علي",
    "folder": "hfs",
    "mp3quranServer": "server12.mp3quran.net/malaysia/hfs"
  },
  {
    "id": "nor",
    "name": "محمد خير النور",
    "folder": "nor",
    "mp3quranServer": "server12.mp3quran.net/malaysia/nor"
  },
  {
    "id": "noah",
    "name": "يوسف بن نوح أحمد",
    "folder": "noah",
    "mp3quranServer": "server8.mp3quran.net/noah"
  },
  {
    "id": "zilaie",
    "name": "جمال الدين الزيلعي",
    "folder": "zilaie",
    "mp3quranServer": "server11.mp3quran.net/zilaie"
  },
  {
    "id": "Aamer",
    "name": "أحمد عامر",
    "folder": "Aamer",
    "mp3quranServer": "server10.mp3quran.net/Aamer"
  },
  {
    "id": "khan",
    "name": "محمد عثمان خان",
    "folder": "khan",
    "mp3quranServer": "server6.mp3quran.net/khan"
  },
  {
    "id": "dgsh",
    "name": "يوسف الدغوش",
    "folder": "dgsh",
    "mp3quranServer": "server7.mp3quran.net/dgsh"
  },
  {
    "id": "Othmn",
    "name": "عثمان الأنصاري",
    "folder": "Othmn",
    "mp3quranServer": "server11.mp3quran.net/Othmn"
  },
  {
    "id": "shoraimy",
    "name": "خالد الشريمي",
    "folder": "shoraimy",
    "mp3quranServer": "server12.mp3quran.net/shoraimy"
  },
  {
    "id": "wdee3",
    "name": "وديع اليمني",
    "folder": "wdee3",
    "mp3quranServer": "server6.mp3quran.net/wdee3"
  },
  {
    "id": "kafi",
    "name": "خالد عبدالكافي",
    "folder": "kafi",
    "mp3quranServer": "server11.mp3quran.net/kafi"
  },
  {
    "id": "kurdi",
    "name": "رعد محمد الكردي",
    "folder": "kurdi",
    "mp3quranServer": "server6.mp3quran.net/kurdi"
  },
  {
    "id": "aloosi",
    "name": "عبدالرحمن العوسي",
    "folder": "aloosi",
    "mp3quranServer": "server6.mp3quran.net/aloosi"
  },
  {
    "id": "shakoor",
    "name": "رمضان شكور",
    "folder": "shakoor",
    "mp3quranServer": "server6.mp3quran.net/shakoor"
  },
  {
    "id": "m_arkani",
    "name": "عبدالمجيد الأركاني",
    "folder": "m_arkani",
    "mp3quranServer": "server7.mp3quran.net/m_arkani"
  },
  {
    "id": "whabi",
    "name": "خالد الوهيبي",
    "folder": "whabi",
    "mp3quranServer": "server11.mp3quran.net/whabi"
  },
  {
    "id": "rami",
    "name": "رامي الدعيس",
    "folder": "rami",
    "mp3quranServer": "server6.mp3quran.net/rami"
  },
  {
    "id": "tnjy",
    "name": "خليفة الطنيجي",
    "folder": "tnjy",
    "mp3quranServer": "server12.mp3quran.net/tnjy",
    "everyAyahFolder": "khalefa_al_tunaiji_64kbps"
  },
  {
    "id": "refat",
    "name": "محمد رفعت",
    "folder": "refat",
    "mp3quranServer": "server14.mp3quran.net/refat"
  },
  {
    "id": "khalf",
    "name": "عبدالله الخلف",
    "folder": "khalf",
    "mp3quranServer": "server14.mp3quran.net/khalf"
  },
  {
    "id": "alosfor",
    "name": "ناصر العصفور",
    "folder": "alosfor",
    "mp3quranServer": "server14.mp3quran.net/alosfor"
  },
  {
    "id": "bukheet",
    "name": "محمد البخيت",
    "folder": "bukheet",
    "mp3quranServer": "server14.mp3quran.net/bukheet"
  },
  {
    "id": "shl",
    "name": "سهل ياسين",
    "folder": "shl",
    "mp3quranServer": "server6.mp3quran.net/shl",
    "everyAyahFolder": "Sahl_Yassin_128kbps"
  },
  {
    "id": "zaki",
    "name": "زكي داغستاني",
    "folder": "zaki",
    "mp3quranServer": "server9.mp3quran.net/zaki"
  },
  {
    "id": "sami_hsn",
    "name": "سامي الحسن",
    "folder": "sami_hsn",
    "mp3quranServer": "server8.mp3quran.net/sami_hsn"
  },
  {
    "id": "taher",
    "name": "شيرزاد عبدالرحمن طاهر",
    "folder": "taher",
    "mp3quranServer": "server12.mp3quran.net/taher"
  },
  {
    "id": "hkm",
    "name": "صابر عبدالحكم",
    "folder": "hkm",
    "mp3quranServer": "server12.mp3quran.net/hkm"
  },
  {
    "id": "sahood",
    "name": "صالح الصاهود",
    "folder": "sahood",
    "mp3quranServer": "server8.mp3quran.net/sahood"
  },
  {
    "id": "tlb",
    "name": "صالح آل طالب",
    "folder": "tlb",
    "mp3quranServer": "server9.mp3quran.net/tlb"
  },
  {
    "id": "bu_khtr",
    "name": "صلاح بو خاطر",
    "folder": "bu_khtr",
    "mp3quranServer": "server8.mp3quran.net/bu_khtr",
    "everyAyahFolder": "Salaah_AbdulRahman_Bukhatir_128kbps"
  },
  {
    "id": "ryan",
    "name": "عادل ريان",
    "folder": "ryan",
    "mp3quranServer": "server8.mp3quran.net/ryan"
  },
  {
    "id": "bari",
    "name": "عبدالبارئ محمد",
    "folder": "bari",
    "mp3quranServer": "server12.mp3quran.net/bari"
  },
  {
    "id": "brmi",
    "name": "عبدالله البريمي",
    "folder": "brmi",
    "mp3quranServer": "server8.mp3quran.net/brmi"
  },
  {
    "id": "buajan",
    "name": "عبدالله البعيجان",
    "folder": "buajan",
    "mp3quranServer": "server8.mp3quran.net/buajan"
  },
  {
    "id": "mtrod",
    "name": "عبدالله المطرود",
    "folder": "mtrod",
    "mp3quranServer": "server8.mp3quran.net/mtrod",
    "everyAyahFolder": "Abdullah_Matroud_128kbps"
  },
  {
    "id": "kyat",
    "name": "عبدالله خياط",
    "folder": "kyat",
    "mp3quranServer": "server12.mp3quran.net/kyat"
  },
  {
    "id": "gulan",
    "name": "عبدالله غيلان",
    "folder": "gulan",
    "mp3quranServer": "server8.mp3quran.net/gulan"
  },
  {
    "id": "askr",
    "name": "عبدالمحسن العسكر",
    "folder": "askr",
    "mp3quranServer": "server6.mp3quran.net/askr"
  },
  {
    "id": "obk",
    "name": "عبدالمحسن العبيكان",
    "folder": "obk",
    "mp3quranServer": "server12.mp3quran.net/obk"
  },
  {
    "id": "kanakeri",
    "name": "عبدالهادي أحمد كناكري",
    "folder": "kanakeri",
    "mp3quranServer": "server6.mp3quran.net/kanakeri"
  },
  {
    "id": "wdod",
    "name": "عبدالودود حنيف",
    "folder": "wdod",
    "mp3quranServer": "server8.mp3quran.net/wdod"
  },
  {
    "id": "hthfi",
    "name": "علي بن عبدالرحمن الحذيفي",
    "folder": "hthfi",
    "mp3quranServer": "server9.mp3quran.net/hthfi",
    "everyAyahFolder": "Hudhaify_128kbps"
  },
  {
    "id": "a_jbr",
    "name": "علي جابر",
    "folder": "a_jbr",
    "mp3quranServer": "server11.mp3quran.net/a_jbr",
    "everyAyahFolder": "Ali_Jaber_64kbps"
  },
  {
    "id": "hajjaj",
    "name": "علي حجاج السويسي",
    "folder": "hajjaj",
    "mp3quranServer": "server9.mp3quran.net/hajjaj",
    "everyAyahFolder": "Ali_Hajjaj_AlSuesy_128kbps"
  },
  {
    "id": "hafz_emad",
    "name": "عماد زهير حافظ",
    "folder": "hafz",
    "mp3quranServer": "server6.mp3quran.net/hafz"
  },
  {
    "id": "frs_a",
    "name": "فارس عباد",
    "folder": "frs_a",
    "mp3quranServer": "server8.mp3quran.net/frs_a",
    "everyAyahFolder": "Fares_Abbad_64kbps"
  },
  {
    "id": "kndri",
    "name": "فهد الكندري",
    "folder": "kndri",
    "mp3quranServer": "server11.mp3quran.net/kndri"
  },
  {
    "id": "fawaz",
    "name": "فواز الكعبي",
    "folder": "fawaz",
    "mp3quranServer": "server8.mp3quran.net/fawaz"
  },
  {
    "id": "namh",
    "name": "نعمة الحسان",
    "folder": "namh",
    "mp3quranServer": "server8.mp3quran.net/namh"
  },
  {
    "id": "fyl",
    "name": "ياسر الفيلكاوي",
    "folder": "fyl",
    "mp3quranServer": "server6.mp3quran.net/fyl"
  },
  {
    "id": "ahmed_swlim",
    "name": "أحمد السويلم",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server14.mp3quran.net/swlim/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "hitham_jadani",
    "name": "هيثم الجدعاني",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/hitham/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "shaheen",
    "name": "أحمد خليل شاهين",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/shaheen/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "saad_muqrin",
    "name": "سعد المقرن",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/saad/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "nufais",
    "name": "أحمد النفيس",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/nufais/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "darweez",
    "name": "عمر الدريويز",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/darweez/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "abdulazizasiri",
    "name": "عبدالعزيز العسيري",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/abdulazizasiri/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "deban",
    "name": "أحمد ديبان",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/deban/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "kamel",
    "name": "عبدالله كامل",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/kamel/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "peshawa",
    "name": "بيشه وا قادر الكردي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/peshawa/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "nathier",
    "name": "نذير المالكي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net//nathier/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "h_dukhain",
    "name": "هيثم الدخين",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "m_abdelhakam",
    "name": "محمود عبدالحكم",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/m_abdelhakam/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "a_maasaraawi",
    "name": "أحمد عيسى المعصراوي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_maasaraawi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "h_abudalal",
    "name": "هاشم أبو دلال",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/h_abudalal/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "f_khamery",
    "name": "فؤاد الخامري",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/f_khamery/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "s_hashemi",
    "name": "سيد أحمد هاشمي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/s_hashemi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "kh_mohammadi",
    "name": "خالد كريم محمدي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/kh_mohammadi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "mal_allah_jaber",
    "name": "مال الله عبدالرحمن الجابر",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/mal-allah_jaber/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "s_sadeiq",
    "name": "سلمان الصديق",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/s_sadeiq/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "h_saleh",
    "name": "حسن صالح",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "a_alshahhat",
    "name": "عبدالرحمن الشحات",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_alshahhat/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "i_sanankoua",
    "name": "عيسى عمر سناكو",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/i_sanankoua/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "h_baqai",
    "name": "هارون بقائي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/h_baqai/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "a_bukhari",
    "name": "عبدالله بخاري",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_bukhari/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "s_alquraishi",
    "name": "صالح القريشي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/s_alquraishi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "shamrani",
    "name": "صالح الشمراني",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/shamrani/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "f_hajry",
    "name": "فيصل الهاجري",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/f_hajry/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "a_alemadi",
    "name": "أناس العمادي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_alemadi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "a_alhazmi",
    "name": "عبدالكريم الحازمي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_alhazmi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "mukhtar_haj",
    "name": "مختار الحاج",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/mukhtar_haj/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "salamah",
    "name": "ياسر سلامة",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server12.mp3quran.net/salamah/Rewayat-Hafs-A-n-Assem",
    "everyAyahFolder": "Yaser_Salamah_128kbps"
  },

  {
    "id": "minsh_teacher",
    "name": "محمد صديق المنشاوي (المعلم)",
    "folder": "minsh_teacher",
    "mp3quranServer": "server10.mp3quran.net/minsh/Almusshaf-Al-Mo-lim",
    "everyAyahFolder": "Minshawy_Teacher_128kbps"
  },
  {
    "id": "husr_teacher",
    "name": "محمود خليل الحصري (المعلم)",
    "folder": "husr_teacher",
    "mp3quranServer": "server13.mp3quran.net/husr",
    "everyAyahFolder": "Husary_Muallim_128kbps"
  },
  // --- Extra Bitrates & Versions ---
  {
    "id": "basit_murattal_64kbps",
    "name": "عبدالباسط عبدالصمد (مرتل - 64kbps)",
    "folder": "basit",
    "mp3quranServer": "server7.mp3quran.net/basit",
    "everyAyahFolder": "Abdul_Basit_Murattal_64kbps"
  },
  {
    "id": "basit_64kbps_explorer",
    "name": "عبدالباسط عبدالصمد (مرتل - 64kbps - QuranExplorer)",
    "folder": "basit",
    "mp3quranServer": "server7.mp3quran.net/basit",
    "everyAyahFolder": "AbdulSamad_64kbps_QuranExplorer.Com"
  },
  {
    "id": "basfar_32kbps",
    "name": "عبدالله بصفر (مرتل - 32kbps)",
    "folder": "bsfr",
    "mp3quranServer": "server6.mp3quran.net/bsfr",
    "everyAyahFolder": "Abdullah_Basfar_32kbps"
  },
  {
    "id": "basfar_192kbps",
    "name": "عبدالله بصفر (مرتل - 192kbps)",
    "folder": "bsfr",
    "mp3quranServer": "server6.mp3quran.net/bsfr",
    "everyAyahFolder": "Abdullah_Basfar_192kbps"
  },
  {
    "id": "sds_64kbps",
    "name": "عبدالرحمن السديس (مرتل - 64kbps)",
    "folder": "sds",
    "mp3quranServer": "server11.mp3quran.net/sds",
    "everyAyahFolder": "Abdurrahmaan_As-Sudais_64kbps"
  },
  {
    "id": "shatri_64kbps",
    "name": "أبو بكر الشاطري (مرتل - 64kbps)",
    "folder": "shatri",
    "mp3quranServer": "server11.mp3quran.net/shatri",
    "everyAyahFolder": "Abu_Bakr_Ash-Shaatree_64kbps"
  },
  {
    "id": "shatri_128kbps_space",
    "name": "أبو بكر الشاطري (مرتل - 128kbps - مسافات)",
    "folder": "shatri",
    "mp3quranServer": "server11.mp3quran.net/shatri",
    "everyAyahFolder": "Abu Bakr Ash-Shaatree_128kbps"
  },
  {
    "id": "ajm_64kbps_explorer",
    "name": "أحمد بن علي العجمي (مرتل - 64kbps - QuranExplorer)",
    "folder": "ajm",
    "mp3quranServer": "server10.mp3quran.net/ajm",
    "everyAyahFolder": "Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com"
  },
  {
    "id": "afasy_64kbps",
    "name": "مشاري العفاسي (مرتل - 64kbps)",
    "folder": "afs",
    "mp3quranServer": "server8.mp3quran.net/afs",
    "everyAyahFolder": "Alafasy_64kbps"
  },
  {
    "id": "hani_rifai_64kbps",
    "name": "هاني الرفاعي (مرتل - 64kbps)",
    "folder": "hani",
    "mp3quranServer": "server8.mp3quran.net/hani",
    "everyAyahFolder": "Hani_Rifai_64kbps"
  },
  {
    "id": "husr_murattal_64kbps",
    "name": "محمود خليل الحصري (مرتل - 64kbps)",
    "folder": "husr",
    "mp3quranServer": "server13.mp3quran.net/husr",
    "everyAyahFolder": "Husary_64kbps"
  },
  {
    "id": "husr_mujawwad_128kbps",
    "name": "محمود خليل الحصري (مجود - 128kbps)",
    "folder": "husr_mjwd",
    "mp3quranServer": "server13.mp3quran.net/husr/Almusshaf-Al-Mojawwad",
    "everyAyahFolder": "Husary_128kbps_Mujawwad"
  },
  {
    "id": "hudhaify_32kbps",
    "name": "علي بن عبدالرحمن الحذيفي (مرتل - 32kbps)",
    "folder": "hthfi",
    "mp3quranServer": "server9.mp3quran.net/hthfi",
    "everyAyahFolder": "Hudhaify_32kbps"
  },
  {
    "id": "hudhaify_64kbps",
    "name": "علي بن عبدالرحمن الحذيفي (مرتل - 64kbps)",
    "folder": "hthfi",
    "mp3quranServer": "server9.mp3quran.net/hthfi",
    "everyAyahFolder": "Hudhaify_64kbps"
  },
  {
    "id": "akdr_32kbps",
    "name": "إبراهيم الأخضر (مرتل - 32kbps)",
    "folder": "akdr",
    "mp3quranServer": "server6.mp3quran.net/akdr",
    "everyAyahFolder": "Ibrahim_Akhdar_32kbps"
  },
  {
    "id": "maher_128kbps",
    "name": "ماهر المعيقلي (مرتل - 128kbps)",
    "folder": "maher",
    "mp3quranServer": "server12.mp3quran.net/maher",
    "everyAyahFolder": "MaherAlMuaiqly128kbps"
  },
  {
    "id": "minsh_murattal_16kbps",
    "name": "محمد صديق المنشاوي (مرتل - 16kbps)",
    "folder": "minsh",
    "mp3quranServer": "server10.mp3quran.net/minsh",
    "everyAyahFolder": "Menshawi_16kbps"
  },
  {
    "id": "minsh_murattal_32kbps",
    "name": "محمد صديق المنشاوي (مرتل - 32kbps)",
    "folder": "minsh",
    "mp3quranServer": "server10.mp3quran.net/minsh",
    "everyAyahFolder": "Menshawi_32kbps"
  },
  {
    "id": "minsh_mujawwad_64kbps",
    "name": "محمد صديق المنشاوي (مجود - 64kbps)",
    "folder": "minsh_mjwd",
    "mp3quranServer": "server10.mp3quran.net/minsh/Almusshaf-Al-Mojawwad",
    "everyAyahFolder": "Minshawy_Mujawwad_64kbps"
  },
  {
    "id": "tblawi_64kbps",
    "name": "محمد الطبلاوي (مرتل - 64kbps)",
    "folder": "tblawi",
    "mp3quranServer": "server12.mp3quran.net/tblawi",
    "everyAyahFolder": "Mohammad_al_Tablaway_64kbps"
  },
  {
    "id": "ayyoub_64kbps",
    "name": "محمد أيوب (مرتل - 64kbps)",
    "folder": "ayyub",
    "mp3quranServer": "server16.mp3quran.net/ayyoub2/Rewayat-Hafs-A-n-Assem",
    "everyAyahFolder": "Muhammad_Ayyoub_64kbps"
  },
  {
    "id": "ayyoub_32kbps",
    "name": "محمد أيوب (مرتل - 32kbps)",
    "folder": "ayyub",
    "mp3quranServer": "server16.mp3quran.net/ayyoub2/Rewayat-Hafs-A-n-Assem",
    "everyAyahFolder": "Muhammad_Ayyoub_32kbps"
  },
  {
    "id": "jbrl_64kbps",
    "name": "محمد جبريل (مرتل - 64kbps)",
    "folder": "jbrl",
    "mp3quranServer": "server8.mp3quran.net/jbrl",
    "everyAyahFolder": "Muhammad_Jibreel_64kbps"
  },
  {
    "id": "shuraim_128kbps_space",
    "name": "سعود الشريم (مرتل - 128kbps - مسافات)",
    "folder": "shur",
    "mp3quranServer": "server7.mp3quran.net/shur",
    "everyAyahFolder": "Saood bin Ibraaheem Ash-Shuraym_128kbps"
  },
  {
    "id": "shur_64kbps",
    "name": "سعود الشريم (مرتل - 64kbps)",
    "folder": "shur",
    "mp3quranServer": "server7.mp3quran.net/shur",
    "everyAyahFolder": "Saood_ash-Shuraym_64kbps"
  },
  {
    "id": "ajm_128kbps_clean",
    "name": "أحمد بن علي العجمي (مرتل - 128kbps)",
    "folder": "ajm",
    "mp3quranServer": "server10.mp3quran.net/ajm",
    "everyAyahFolder": "ahmed_ibn_ali_al_ajamy_128kbps"
  },
  // --- Translations & روايات ---
  {
    "id": "warsh_ibrahim_aldosary",
    "name": "إبراهيم الدوسري (رواية ورش عن نافع)",
    "folder": "warsh_aldosary",
    "mp3quranServer": "server10.mp3quran.net/ibrahim_dosri/Rewayat-Warsh-A-n-Nafi",
    "everyAyahFolder": "warsh/warsh_ibrahim_aldosary_128kbps"
  },
  {
    "id": "warsh_basit",
    "name": "عبدالباسط عبدالصمد (رواية ورش عن نافع)",
    "folder": "warsh_basit",
    "mp3quranServer": "server7.mp3quran.net/basit/Rewayat-Warsh-A-n-Nafi",
    "everyAyahFolder": "warsh/warsh_Abdul_Basit_128kbps"
  }
];

export function getReciterEnglishName(id: string): string {
  const mapping: Record<string, string> = {
    "afasy": "Sheikh Mishary Al-Afasy",
    "basit_murattal": "Sheikh Abdul Basit",
    "basit_mujawwad": "Sheikh Abdul Basit (Mujawwad)",
    "sds": "Sheikh Abdul Rahman Al-Sudais",
    "shur": "Sheikh Saud Al-Shuraim",
    "shur_64kbps": "Sheikh Saud Al-Shuraim",
    "hani_rifai": "Sheikh Hani Al-Rifai",
    "shatree": "Sheikh Abu Bakr Al-Shatri",
    "minsh_murattal": "Sheikh Muhammad Siddiq Al-Minshawi",
    "minsh_mujawwad": "Sheikh Muhammad Siddiq Al-Minshawi (Mujawwad)",
    "husr_murattal": "Sheikh Mahmoud Khalil Al-Husary",
    "husr_mujawwad": "Sheikh Mahmoud Khalil Al-Husary (Mujawwad)",
    "maher": "Sheikh Maher Al-Muaiqly",
    "juhani": "Sheikh Abdullah Al-Juhani",
    "qtm": "Sheikh Nasser Al-Katami",
    "s_gmd": "Sheikh Saad Al-Ghamdi",
    "ajm": "Sheikh Ahmad Al-Ajmy",
    "ajm_128kbps_clean": "Sheikh Ahmad Al-Ajmy",
    "yasser": "Sheikh Yasser Al-Dosari",
    "abkr": "Sheikh Idrees Abkar",
    "ayyub": "Sheikh Muhammad Ayyub",
    "jbrl": "Sheikh Muhammad Jebril",
    "akdr": "Sheikh Ibrahim Al-Akhdar",
    "jleel": "Sheikh Khalid Al-Jaleel",
    "hazza": "Sheikh Hazza Al-Balushi",
    "mansor": "Sheikh Mansour Al-Salimi",
    "balilah": "Sheikh Bandar Balilah",
    "albana": "Sheikh Mahmoud Ali Al-Banna",
    "basfar": "Sheikh Abdullah Basfar",
    "islam_sobhi": "Sheikh Islam Sobhi",
  };

  if (mapping[id]) return mapping[id];

  const reciter = RECITERS.find(r => r.id === id);
  if (reciter) {
    if (reciter.everyAyahFolder) {
      let clean = reciter.everyAyahFolder
        .replace(/.*\//, "") // remove parent directories (like warsh/)
        .replace(/_\d+kbps.*/i, "")
        .replace(/_/g, " ")
        .trim();
      return "Sheikh " + clean;
    }
    return reciter.name;
  }
  
  return "Sheikh Muhammad Siddiq Al-Minshawi";
}

