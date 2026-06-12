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
    "name": "عبدالرحمن السديس",
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
    "name": "هاني الرفاعي",
    "folder": "juhani",
    "mp3quranServer": "server8.mp3quran.net/hani",
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
    "name": "عبدالباسط عبدالصمد",
    "folder": "basit",
    "mp3quranServer": "server7.mp3quran.net/basit",
    "everyAyahFolder": "Abdul_Basit_Murattal_192kbps"
  },
  {
    "id": "minsh",
    "name": "محمد صديق المنشاوي",
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
    "id": "shatree",
    "name": "شيخ أبو بكر الشاطري",
    "folder": "shatree",
    "mp3quranServer": "server11.mp3quran.net/shatri",
    "everyAyahFolder": "Abu_Bakr_Ash-Shaatree_128kbps"
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
    "name": "بندر بليله",
    "folder": "balilah",
    "mp3quranServer": "server6.mp3quran.net/balilah"
  },
  {
    "id": "albana",
    "name": "محمود علي البنا",
    "folder": "bna",
    "mp3quranServer": "server8.mp3quran.net/bna"
  },
  {
    "id": "basfar",
    "name": "عبدالله بصفر",
    "folder": "basfar",
    "mp3quranServer": "server6.mp3quran.net/bsfr",
    "everyAyahFolder": "Abdullah_Basfar_64kbps"
  },
  {
    "id": "mohammad_rifaat",
    "name": "حمد الدغريري",
    "folder": "mohammad_rifaat",
    "mp3quranServer": "server6.mp3quran.net/hamad"
  },
  {
    "id": "sayed_nakashibandi",
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
    "mp3quranServer": "server9.mp3quran.net/abdullah"
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
    "id": "abdurrahman_musaab",
    "name": "أحمد نعينع",
    "folder": "abdurrahman_musaab",
    "mp3quranServer": "server11.mp3quran.net/ahmad_nu"
  },
  {
    "id": "ahmed_kasab",
    "name": "عبدالعزيز الأحمد",
    "folder": "ahmed_kasab",
    "mp3quranServer": "server11.mp3quran.net/a_ahmed"
  },
  {
    "id": "mustafa_ismail",
    "name": "مصطفى إسماعيل",
    "folder": "mustafa_ismail",
    "mp3quranServer": "server8.mp3quran.net/mustafa"
  },
  {
    "id": "kamel_yousef_albahtimi",
    "name": "يوسف الشويعي",
    "folder": "kamel_yousef_albahtimi",
    "mp3quranServer": "server9.mp3quran.net/yousef"
  },
  {
    "id": "taha_alfashny",
    "name": "أحمد الحواشي",
    "folder": "taha_alfashny",
    "mp3quranServer": "server11.mp3quran.net/hawashi"
  },
  {
    "id": "abu_alaneen_shaishaa",
    "name": "أحمد الطرابلسي",
    "folder": "abu_alaneen_shaishaa",
    "mp3quranServer": "server10.mp3quran.net/trabulsi"
  },
  {
    "id": "alqasim",
    "name": "عبدالمحسن القاسم",
    "folder": "alqasim",
    "mp3quranServer": "server8.mp3quran.net/qasm"
  },
  {
    "id": "ath_thubaity",
    "name": "عبدالبارئ الثبيتي",
    "folder": "ath_thubaity",
    "mp3quranServer": "server6.mp3quran.net/thubti"
  },
  {
    "id": "adel_kalbani",
    "name": "عبدالولي الأركاني",
    "folder": "adel_kalbani",
    "mp3quranServer": "server6.mp3quran.net/arkani"
  },
  {
    "id": "khalid_alqahtani",
    "name": "خالد القحطاني",
    "folder": "khalid_alqahtani",
    "mp3quranServer": "server10.mp3quran.net/qht"
  },
  {
    "id": "salah_albudair",
    "name": "صلاح البدير",
    "folder": "salah_albudair",
    "mp3quranServer": "server6.mp3quran.net/s_bud"
  },
  {
    "id": "ibrahim_aljibrin",
    "name": "إبراهيم الجبرين",
    "folder": "ibrahim_aljibrin",
    "mp3quranServer": "server6.mp3quran.net/jbreen"
  },
  {
    "id": "abdullah_almatrouk",
    "name": "عبدالله الكندري",
    "folder": "abdullah_almatrouk",
    "mp3quranServer": "server10.mp3quran.net/Abdullahk"
  },
  {
    "id": "nabil_rafat",
    "name": "نبيل الرفاعي",
    "folder": "nabil_rafat",
    "mp3quranServer": "server9.mp3quran.net/nabil"
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
    "id": "mohammed_ismail",
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
    "id": "saleh_alorman",
    "name": "سلمان العتيبي",
    "folder": "saleh_alorman",
    "mp3quranServer": "server11.mp3quran.net/salman"
  },
  {
    "id": "fadhel_alqahtani",
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
    "id": "mohammed_alzaidi",
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
    "id": "fahd_alqadi",
    "name": "الزين محمد أحمد",
    "folder": "fahd_alqadi",
    "mp3quranServer": "server9.mp3quran.net/alzain"
  },
  {
    "id": "mohammed_alsharif",
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
    "id": "ahmed_alhameidi",
    "name": "وليد الدليمي",
    "folder": "ahmed_alhameidi",
    "mp3quranServer": "server8.mp3quran.net/dlami"
  },
  {
    "id": "ahmad_alsaeed",
    "name": "عبدالرحمن الماجد",
    "folder": "ahmad_alsaeed",
    "mp3quranServer": "server10.mp3quran.net/a_majed"
  },
  {
    "id": "majid_alqadi",
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
    "id": "mohammad_albanna",
    "name": "خالد المهنا",
    "folder": "mohammad_albanna",
    "mp3quranServer": "server11.mp3quran.net/mohna"
  },
  {
    "id": "akram_alraisi",
    "name": "أكرم الرايسي",
    "folder": "akram_alraisi",
    "mp3quranServer": "server10.mp3quran.net/trablsi"
  },
  {
    "id": "omar_alnasser",
    "name": "العشري عمران",
    "folder": "omar_alnasser",
    "mp3quranServer": "server9.mp3quran.net/omran"
  },
  {
    "id": "mohammed_alqarny",
    "name": "صالح الهبدان",
    "folder": "mohammed_alqarny",
    "mp3quranServer": "server6.mp3quran.net/habdan"
  },
  {
    "id": "mohamed_alsaeed",
    "name": "محمد السعيد",
    "folder": "mohamed_alsaeed",
    "mp3quranServer": "server9.mp3quran.net/waleed"
  },
  {
    "id": "akrm",
    "name": "أكرم العلاقمي",
    "folder": "akrm",
    "mp3quranServer": "server9.mp3quran.net/akrm"
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
    "mp3quranServer": "server12.mp3quran.net/tblawi"
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
    "mp3quranServer": "server12.mp3quran.net/m_krm"
  },
  {
    "id": "ra3ad",
    "name": "مصطفى رعد العزاوي",
    "folder": "ra3ad",
    "mp3quranServer": "server8.mp3quran.net/ra3ad"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "مفتاح السلطني",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server14.mp3quran.net/muftah_sultany/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عبدالإله بن عون",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_binaoun/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "أحمد طالب بن حميد",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_binhameed/Rewayat-Hafs-A-n-Assem"
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
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "ياسر سلامة",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server12.mp3quran.net/salamah/Rewayat-Hafs-A-n-Assem"
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
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "إبراهيم الدوسري",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server10.mp3quran.net/ibrahim_dosri/Rewayat-Hafs-A-n-Assem"
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
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عبدالله القرافي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_alqrafi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عبدالبديع غيلان",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/A-Ghailan/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "محمد برهجي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/M_Burhaji/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "يوسف العيدروس",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/Y_ALaidroos/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "حسن الدغريري",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/H-Aldaghriri/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "محمد الفقيه",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/M_Alfaqih/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "جنيد آدم عبدالله",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/J-Abdullah/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "خالد الزيادي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/K-Alzadi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "إبراهيم الشهري",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/Ibrahim-Al-Shahri/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عبدالرحمن بن عبدالرزاق البدر",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/A-AlBadr/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عليجان قوري حمدان",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/Alijon/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "محمد الزبيدي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/M-AlZubaidi/Rewayat-Hafs-A-n-Assem"
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
    "mp3quranServer": "server12.mp3quran.net/tnjy"
  },
  {
    "id": "refat",
    "name": "محمد رفعت",
    "folder": "refat",
    "mp3quranServer": "server14.mp3quran.net/refat"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عبدالله الموسى",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server14.mp3quran.net/mousa/Rewayat-Hafs-A-n-Assem"
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
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "أحمد السويلم",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server14.mp3quran.net/swlim/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "هيثم الجدعاني",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/hitham/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "أحمد خليل شاهين",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/shaheen/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "سعد المقرن",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/saad/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "أحمد النفيس",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/nufais/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عمر الدريويز",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/darweez/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عبدالعزيز العسيري",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/abdulazizasiri/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "أحمد ديبان",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/deban/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عبدالله كامل",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/kamel/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "بيشه وا قادر الكردي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/peshawa/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "نذير المالكي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net//nathier/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "هيثم الدخين",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "محمود عبدالحكم",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/m_abdelhakam/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "أحمد عيسى المعصراوي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_maasaraawi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "هاشم أبو دلال",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/h_abudalal/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "فؤاد الخامري",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/f_khamery/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "سيد أحمد هاشمي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/s_hashemi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "خالد كريم محمدي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/kh_mohammadi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "مال الله عبدالرحمن الجابر",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/mal-allah_jaber/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "سلمان الصديق",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/s_sadeiq/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "حسن صالح",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عبدالرحمن الشحات",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_alshahhat/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عيسى عمر سناكو",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/i_sanankoua/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "هارون بقائي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/h_baqai/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عبدالله بخاري",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_bukhari/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "صالح القريشي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/s_alquraishi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "3siri",
    "name": "إبراهيم العسيري",
    "folder": "3siri",
    "mp3quranServer": "server6.mp3quran.net/3siri"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "صالح الشمراني",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/shamrani/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "فيصل الهاجري",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/f_hajry/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "أنس العمادي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_alemadi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عبدالكريم الحازمي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_alhazmi/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "shl",
    "name": "سهل ياسين",
    "folder": "shl",
    "mp3quranServer": "server6.mp3quran.net/shl"
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
    "mp3quranServer": "server8.mp3quran.net/bu_khtr"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "مختار الحاج",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/mukhtar_haj/Rewayat-Hafs-A-n-Assem"
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
    "mp3quranServer": "server8.mp3quran.net/mtrod"
  },
  {
    "id": "kyat",
    "name": "عبدالله خياط",
    "folder": "kyat",
    "mp3quranServer": "server12.mp3quran.net/kyat"
  },
  {
    "id": "jhn",
    "name": "عبدالله عواد الجهني",
    "folder": "jhn",
    "mp3quranServer": "server13.mp3quran.net/jhn"
  },
  {
    "id": "gulan",
    "name": "عبدالله غيلان",
    "folder": "gulan",
    "mp3quranServer": "server8.mp3quran.net/gulan"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عبدالرشيد صوفي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/soufi/Rewayat-Hafs-A-n-Assem"
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
    "mp3quranServer": "server9.mp3quran.net/hthfi"
  },
  {
    "id": "a_jbr",
    "name": "علي جابر",
    "folder": "a_jbr",
    "mp3quranServer": "server11.mp3quran.net/a_jbr"
  },
  {
    "id": "hajjaj",
    "name": "علي حجاج السويسي",
    "folder": "hajjaj",
    "mp3quranServer": "server9.mp3quran.net/hajjaj"
  },
  {
    "id": "hafz",
    "name": "عماد زهير حافظ",
    "folder": "hafz",
    "mp3quranServer": "server6.mp3quran.net/hafz"
  },
  {
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عبدالعزيز التركي",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_turki/Rewayat-Hafs-A-n-Assem"
  },
  {
    "id": "frs_a",
    "name": "فارس عباد",
    "folder": "frs_a",
    "mp3quranServer": "server8.mp3quran.net/frs_a"
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
    "id": "Rewayat-Hafs-A-n-Assem",
    "name": "عبدالله عبدل",
    "folder": "Rewayat-Hafs-A-n-Assem",
    "mp3quranServer": "server16.mp3quran.net/a_abdl/Rewayat-Hafs-A-n-Assem"
  }
];
