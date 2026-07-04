import path from "path";
import os from "os";

// ═══════════════════════════════════════════════════════════
// كل الإعدادات القابلة للتغيير عبر متغيرات البيئة في مكان واحد
// ═══════════════════════════════════════════════════════════

export const PORT = parseInt(process.env.PORT || "7860", 10);
export const HOST = process.env.RENDER_HOST || "yousef891238-render-server.hf.space";

// مفتاح API — لو موجود، لازم أي طلب لـ /render أو /status يبعته في هيدر x-api-key
// لو فاضي، السيرفر يفضل مفتوح (مفيد للتطوير المحلي فقط، لازم يتحدد في الإنتاج)
export const API_KEY = process.env.RENDER_API_KEY || "";

// عدد الرندرات اللي تشتغل في نفس الوقت. رندرة الفيديو مكلفة (CPU/RAM)،
// لازم نحدد سقف عشان السيرفر مايقعش تحت ضغط طلبات متزامنة كتير.
export const RENDER_CONCURRENCY = parseInt(process.env.RENDER_CONCURRENCY || "2", 10);

// أقصى عدد طلبات رندرة يقدر نفس الـ IP يبعتها كل 15 دقيقة
export const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "20", 10);
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export const WIDTH = 720;
export const HEIGHT = 1280;

export const RENDERS_DIR = path.resolve(os.tmpdir(), "renders_output");
export const FONTS_DIR = path.resolve(os.tmpdir(), "fonts_cache");
export const BG_CACHE_DIR = path.resolve(os.tmpdir(), "bg_cache");

// حدود صحة الطلب — تحمي السيرفر من طلبات ضخمة تعلّقه أو تستهلك الديسك
export const LIMITS = {
  MAX_VERSES: 60,
  MAX_VERSE_TEXT_LEN: 2000,
  MAX_TRANSLATION_LEN: 2000,
  MAX_HANDLE_LEN: 60,
  JOB_TTL_MS: 2 * 60 * 60 * 1000, // مدة بقاء الـ job في الذاكرة بعد اكتماله
  OUTPUT_TTL_MS: 2 * 60 * 60 * 1000, // مدة بقاء ملف الفيديو الناتج على الديسك
  BG_CACHE_MAX_FILES: 40, // أقصى عدد فيديوهات خلفية مخزّنة (LRU بسيط)
};

export const FONT_MAP = {
  "Amiri": "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf",
  "Amiri-Bold": "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Bold.ttf",
  "Noto Naskh Arabic": "https://raw.githubusercontent.com/google/fonts/main/ofl/notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf",
  "Scheherazade New": "https://raw.githubusercontent.com/google/fonts/main/ofl/scheherazadenew/ScheherazadeNew-Regular.ttf",
  "SurahNameV2": "https://raw.githubusercontent.com/yyyyyy12345612345-bit/uuu12/main/public/fonts/SurahNameV2.ttf",
  "BasmalahVer01": "https://raw.githubusercontent.com/yyyyyy12345612345-bit/uuu12/main/public/fonts/BasmalahVer01.ttf",
  "Lateef": "https://raw.githubusercontent.com/google/fonts/main/ofl/lateef/Lateef-Regular.ttf",
  "Cairo": "https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf",
  "Tajawal": "https://raw.githubusercontent.com/google/fonts/main/ofl/tajawal/Tajawal-Regular.ttf",
  "Reem Kufi": "https://raw.githubusercontent.com/google/fonts/main/ofl/reemkufi/ReemKufi%5Bwght%5D.ttf",
  "Lalezar": "https://raw.githubusercontent.com/google/fonts/main/ofl/lalezar/Lalezar-Regular.ttf",
  "El Messiri": "https://raw.githubusercontent.com/google/fonts/main/ofl/elmessiri/ElMessiri%5Bwght%5D.ttf",
  "Almarai": "https://raw.githubusercontent.com/google/fonts/main/ofl/almarai/Almarai-Regular.ttf",
  "Aref Ruqaa": "https://raw.githubusercontent.com/google/fonts/main/ofl/arefruqaa/ArefRuqaa-Regular.ttf",
  "Reem Kufi Fun": "https://raw.githubusercontent.com/google/fonts/main/ofl/reemkufifun/ReemKufiFun%5Bwght%5D.ttf",
  "Alexandria": "https://raw.githubusercontent.com/google/fonts/main/ofl/alexandria/Alexandria%5Bwght%5D.ttf",
};

export const ALLOWED_DOMAINS = [
  "everyayah.com", "quran.com", "cdn.islamic.network", "verses.quran.com",
  "quranicaudio.com", "mirrors.quranicaudio.com",
  "raw.githubusercontent.com", "github.com", "mp3quran.net",
  "server8.mp3quran.net", "server7.mp3quran.net", "server6.mp3quran.net",
  "server10.mp3quran.net", "server11.mp3quran.net", "server12.mp3quran.net",
  "ia800601.us.archive.org", "archive.org",
  "images.pexels.com", "videos.pexels.com", "images.unsplash.com",
  "pexels.com", "pixabay.com", "cdn.pixabay.com",
  "player.vimeo.com", "vimeo.com", "res.cloudinary.com", "cloudinary.com", "dzcdn.net"
];

export const SHEIKH_ASSETS = {
  minsh: {
    id: "minsh",
    nameAr: "الشيخ محمد صديق المنشاوي",
    nameEn: "Mohammad Siddiq Al-Minshawi",
    photoUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782848606/%D9%85%D9%86%D8%B4%D8%A7%D9%88%D9%8A_filgf2.jpg",
    calligraphyUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782885918/%D8%AA%D9%88%D9%82%D9%8A%D8%B9_%D8%A7%D9%84%D9%85%D9%86%D8%B4%D8%A7%D9%88%D9%8Side_u3ytsf.png"
  },
  yasser: {
    id: "yasser",
    nameAr: "الشيخ ياسر الدوسري",
    nameEn: "Yasser Al-Dossary",
    photoUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782863138/Sheikh_Yasser_Al_Dosari_qm0gsf.jpg",
    calligraphyUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782887640/%D8%AA%D9%88%D9%82%D9%8A%D8%B9_%D9%8A%D8%A7%D8%B3%D8%B1_%D8%A7%D9%84%D8%AF%D9%88%D8%B3%D8%B1%D9%8A_pt1fbe.png"
  },
  husr: {
    id: "husr",
    nameAr: "الشيخ محمود خليل الحصري",
    nameEn: "Mahmoud Khalil Al-Husary",
    photoUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782885361/%D8%A7%D9%84%D8%B4%D9%8A%D8%AE_%D8%A7%D9%84%D8%AD%D8%B5%D8%B1%D9%8A_vhdgba.jpg",
    calligraphyUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782887638/%D8%AA%D9%88%D9%82%D9%8A%D8%B9_%D8%A7%D9%84%D8%AD%D8%B5%D8%B1%D9%8A_uaymqw.png"
  },
  basit: {
    id: "basit",
    nameAr: "الشيخ عبدالباسط عبدالصمد",
    nameEn: "Abdul Basit Abdul Samad",
    photoUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782885144/%D8%B9%D8%A8%D8%AF_%D8%A7%D9%84%D8%A8%D8%A7%D8%B3%D8%B7_ykv3aw.jpg",
    calligraphyUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782885233/%D8%AA%D9%88%D9%82%D9%8A%D8%B9_%D8%B9%D8%A8%D8%AF_%D8%A7%D9%84%D8%A8%D8%A7%D8%B3%D8%B7_m05p8o.png"
  },
  omar_diaa: {
    id: "omar_diaa",
    nameAr: "الشيخ عمر ضياء الدين",
    nameEn: "Omar Bn DiaaAldeen",
    photoUrl: "https://cdn-images.dzcdn.net/images/artist/184f40dccb738a6352d4ddcafeab0c0a/500x500-000000-80-0-0.jpg",
    calligraphyUrl: ""
  }
};

export function getSheikhAsset(reciterId) {
  const cleanId = reciterId || "";
  if (cleanId.includes("minsh")) return SHEIKH_ASSETS.minsh;
  if (cleanId.includes("yasser")) return SHEIKH_ASSETS.yasser;
  if (cleanId.includes("husr")) return SHEIKH_ASSETS.husr;
  if (cleanId.includes("basit")) return SHEIKH_ASSETS.basit;
  if (cleanId.includes("omar")) return SHEIKH_ASSETS.omar_diaa;
  return SHEIKH_ASSETS.minsh;
}
