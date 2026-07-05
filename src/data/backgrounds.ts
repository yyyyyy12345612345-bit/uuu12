import { PEXELS_PORTRAIT_NATURE_BACKGROUNDS } from "./pexelsPortraitNature.generated";
import { VARIED_CATEGORIES_BACKGROUNDS } from "./variedBackgrounds.generated";

export type BackgroundItem = {
  type: "image" | "video";
  src: string;
  poster?: string;
  tags?: string[];
  fit?: "cover" | "contain";
};

const STATIC_CORE: BackgroundItem[] = [
  // صورة المصحف الشريف الخلفية الأساسية



  // البحار والمحيطات (Sea/Ocean) - Portrait
  { type: "image", src: "https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg", poster: "", tags: ["جبل", "سماء", "طبيعة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg", poster: "", tags: ["جبل", "ثلج", "قمة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg", poster: "", tags: ["بحر", "شاطئ", "أزرق", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg", poster: "", tags: ["طبيعة", "غابة", "نهر", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg", poster: "", tags: ["طبيعة", "نبات", "أخضر", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/2559941/pexels-photo-2559941.jpeg", poster: "", tags: ["بحر", "محيط", "حوت", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg", poster: "", tags: ["قطب", "جليد", "شتاء", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1670187/pexels-photo-1670187.jpeg", poster: "", tags: ["جبل", "ثلج", "شتاء", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg", poster: "", tags: ["مدينة", "ليل", "أضواء", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg", poster: "", tags: ["بحر", "غروب", "ماء", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1533720/pexels-photo-1533720.jpeg", poster: "", tags: ["بحر", "صخور", "ماء", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg", poster: "", tags: ["بحر", "أزرق", "محيط", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/189349/pexels-photo-189349.jpeg", poster: "", tags: ["بحر", "رمل", "شاطئ", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg", poster: "", tags: ["بحر", "شاطئ", "شمس", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/753626/pexels-photo-753626.jpeg", poster: "", tags: ["بحر", "محيط", "أزرق", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/994605/pexels-photo-994605.jpeg", poster: "", tags: ["بحر", "أزرق", "عميق", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/635279/pexels-photo-635279.jpeg", poster: "", tags: ["بحر", "شاطئ", "نخيل", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/2088205/pexels-photo-2088205.jpeg", poster: "", tags: ["سماء", "نجوم", "ليل", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/2114014/pexels-photo-2114014.jpeg", poster: "", tags: ["سماء", "غروب", "ألوان", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg", poster: "", tags: ["سماء", "غيوم", "رعد", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/531756/pexels-photo-531756.jpeg", poster: "", tags: ["سماء", "صافية", "أزرق", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/53594/blue-clouds-day-fluffy-53594.jpeg", poster: "", tags: ["سماء", "غيوم", "أزرق", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/417173/pexels-photo-417173.jpeg", poster: "", tags: ["جبال", "بحيرة", "طبيعة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/933054/pexels-photo-933054.jpeg", poster: "", tags: ["جبال", "خضراء", "طبيعة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/406014/pexels-photo-406014.jpeg", poster: "", tags: ["غابة", "ضباب", "طبيعة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg", poster: "", tags: ["شلال", "ماء", "طبيعة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/772803/pexels-photo-772803.jpeg", poster: "", tags: ["حقل", "ورد", "طبيعة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/247599/pexels-photo-247599.jpeg", poster: "", tags: ["نهر", "غابة", "طبيعة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/624015/pexels-photo-624015.jpeg", poster: "", tags: ["قطب", "ثلج", "شتاء", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/2365457/pexels-photo-2365457.jpeg", poster: "", tags: ["بطريق", "قطب", "حيوان", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/355241/pexels-photo-355241.jpeg", poster: "", tags: ["تزلج", "ثلج", "رياضة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/547115/pexels-photo-547115.jpeg", poster: "", tags: ["ثلج", "أبيض", "شتاء", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/3639540/pexels-photo-3639540.jpeg", poster: "", tags: ["برد", "ثلج", "قطب", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1537086/pexels-photo-1537086.jpeg", poster: "", tags: ["مكة", "كعبة", "إسلامي", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/2826415/pexels-photo-2826415.jpeg", poster: "", tags: ["مسجد", "إسلامي", "منارة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1252869/pexels-photo-1252869.jpeg", poster: "", tags: ["صلاة", "إسلامي", "مسجد", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/3214995/pexels-photo-3214995.jpeg", poster: "", tags: ["زخرفة", "إسلامي", "فن", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/6633920/pexels-photo-6633920.jpeg", poster: "", tags: ["صحراء", "جمال", "رمل", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/3408354/pexels-photo-3408354.jpeg", poster: "", tags: ["خريف", "شجر", "طبيعة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg", poster: "", tags: ["جبل", "قمر", "ليل", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/998641/pexels-photo-998641.jpeg", poster: "", tags: ["نبات", "أخضر", "طبيعة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1146134/pexels-photo-1146134.jpeg", poster: "", tags: ["صحراء", "شمس", "حرارة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/2832034/pexels-photo-2832034.jpeg", poster: "", tags: ["ليل", "نجوم", "تأمل", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/847402/pexels-photo-847402.jpeg", poster: "", tags: ["بحر", "شاطئ", "راحة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1295036/pexels-photo-1295036.jpeg", poster: "", tags: ["بحيرة", "قارب", "هدوء", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/3680219/pexels-photo-3680219.jpeg", poster: "", tags: ["غابة", "شمس", "نور", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/3876401/pexels-photo-3876401.jpeg", poster: "", tags: ["نهر", "أخضر", "طبيعة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1040499/pexels-photo-1040499.jpeg", poster: "", tags: ["فضاء", "نجوم", "مجرة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/462118/pexels-photo-462118.jpeg", poster: "", tags: ["ورد", "حديقة", "طبيعة", "طولي"] },


  // تكرار للأقسام لزيادة العدد لخدمة البحث الذكي
  { type: "image", src: "https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg", poster: "", tags: ["ريف", "هدوء", "طبيعة", "سلام", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/911738/pexels-photo-911738.jpeg", poster: "", tags: ["طريق", "سفر", "مغامرة", "أفق", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/459225/pexels-photo-459225.jpeg", poster: "", tags: ["حيوان", "برية", "نمر", "قوة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/355242/pexels-photo-355242.jpeg", poster: "", tags: ["شمس", "أفق", "بحر", "غروب", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg", poster: "", tags: ["جبال_الألب", "إيطاليا", "شروق", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1433052/pexels-photo-1433052.jpeg", poster: "", tags: ["شلال", "منظر_خلاب", "ماء", "نقاء", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg", poster: "", tags: ["كلب", "أليف", "لطيف", "طبيعة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg", poster: "", tags: ["جبال_صخرية", "عظمة", "طبيعة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg", poster: "", tags: ["شاطئ_منعزل", "استجمام", "بحر", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/326055/pexels-photo-326055.jpeg", poster: "", tags: ["فراشة", "طبيعة", "ألوان", "حياة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1133957/pexels-photo-1133957.jpeg", poster: "", tags: ["بحر", "أزرق", "عمق", "محيط", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg", poster: "", tags: ["غابة_صنوبر", "رائحة_المنظر", "أخضر", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/302804/pexels-photo-302804.jpeg", poster: "", tags: ["رمل", "بحر", "أقدام", "ذكرى", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/459203/pexels-photo-459203.jpeg", poster: "", tags: ["جبال_ثلجية", "برد", "شتاء", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg", poster: "", tags: ["ماء", "نقاء", "طبيعة", "هدوء", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1072179/pexels-photo-1072179.jpeg", poster: "", tags: ["طبيعة", "أخضر", "غابة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1102915/pexels-photo-1102915.jpeg", poster: "", tags: ["ماء", "بحر", "طبيعة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg", poster: "", tags: ["جبل", "ثلج", "منظر", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/132037/pexels-photo-132037.jpeg", poster: "", tags: ["شاطئ", "بحر", "رمال", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/371633/pexels-photo-371633.jpeg", poster: "", tags: ["جبال", "طبيعة", "جمال", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/358457/pexels-photo-358457.jpeg", poster: "", tags: ["بحيرة", "جبل", "انعكاس", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/248159/pexels-photo-248159.jpeg", poster: "", tags: ["طبيعة", "أخضر", "حديقة", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1563355/pexels-photo-1563355.jpeg", poster: "", tags: ["غابة", "أشجار", "شروق", "طولي"] },
  { type: "image", src: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg", poster: "", tags: ["كلب", "أليف", "لطيف", "طبيعة"] },
  { type: "image", src: "https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg", poster: "", tags: ["جبال_صخرية", "عظمة", "طبيعة"] },
  { type: "image", src: "https://images.pexels.com/photos/247502/pexels-photo-247502.jpeg", poster: "", tags: ["شاطئ_منعزل", "استجمام", "بحر"] },
  { type: "image", src: "https://images.pexels.com/photos/326055/pexels-photo-326055.jpeg", poster: "", tags: ["فراشة", "طبيعة", "ألوان", "حياة"] },
  { type: "image", src: "https://images.pexels.com/photos/1133957/pexels-photo-1133957.jpeg", poster: "", tags: ["بحر", "أزرق", "عمق", "محيط"] },
  { type: "image", src: "https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg", poster: "", tags: ["غابة_صنوبر", "رائحة_المنظر", "أخضر"] },
  { type: "image", src: "https://images.pexels.com/photos/302804/pexels-photo-302804.jpeg", poster: "", tags: ["رمل", "بحر", "أقدام", "ذكرى"] },
  { type: "image", src: "https://images.pexels.com/photos/459203/pexels-photo-459203.jpeg", poster: "", tags: ["جبال_ثلجية", "برد", "شتاء"] },
  { type: "image", src: "https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg", poster: "", tags: ["ماء", "نقاء", "طبيعة", "هدوء"] },
];

/** مكتبة ثابتة: التحرير اليدوي + ~2950 صورة طبيعية طولية من Pexels (ملف مُولَّد) */
export const STATIC_BACKGROUNDS: BackgroundItem[] = [
  ...STATIC_CORE,
  ...PEXELS_PORTRAIT_NATURE_BACKGROUNDS,
  ...VARIED_CATEGORIES_BACKGROUNDS,
];

export const STATIC_VIDEOS: BackgroundItem[] = [
  {
    type: "video",
    src: "https://res.cloudinary.com/dtuyo4gqm/video/upload/v1782881189/5920292944983629707_g77wkb.mp4",
    poster: "",
    tags: ["سماء", "ليل", "نجوم", "طبيعة", "غيوم"]
  },
  {
    type: "video",
    src: "https://res.cloudinary.com/dtuyo4gqm/video/upload/v1782881185/1_zvcyor.mp4",
    poster: "",
    tags: ["جبال", "جبل", "طبيعة", "ضباب", "غيوم"]
  },
  {
    type: "video",
    src: "https://res.cloudinary.com/dtuyo4gqm/video/upload/v1782881182/2_lceeb7.mp4",
    poster: "",
    tags: ["غابات", "غابة", "شجر", "طبيعة", "أخضر"]
  },
  {
    type: "video",
    src: "https://res.cloudinary.com/dtuyo4gqm/video/upload/v1782881179/4_qwjfw4.mp4",
    poster: "",
    tags: ["غروب", "شمس", "سماء", "طبيعة"]
  },
  {
    type: "video",
    src: "https://res.cloudinary.com/dtuyo4gqm/video/upload/v1782881177/5_nxtzqz.mp4",
    poster: "",
    tags: ["بحار", "بحر", "محيط", "أمواج", "شاطئ", "طبيعة"]
  },
  {
    type: "video",
    src: "https://res.cloudinary.com/dtuyo4gqm/video/upload/v1782883479/00_vhysba.mp4",
    poster: "",
    tags: ["سماء", "ليل", "نجوم", "طبيعة", "غيوم"]
  },
  {
    type: "video",
    src: "https://res.cloudinary.com/dtuyo4gqm/video/upload/v1782883230/111_bsrzqy.mp4",
    poster: "",
    tags: ["جبال", "جبل", "طبيعة", "ثلج", "شتاء"]
  },
  {
    type: "video",
    src: "https://res.cloudinary.com/dtuyo4gqm/video/upload/v1782883549/1122%D9%81%D8%AE%D8%A7%D9%84%D8%A8%D9%8A%D9%86%D9%84%D8%A8%D8%B1%D8%A8%D9%8A%D8%B1_grcvqz.mp4",
    poster: "",
    tags: ["غابات", "غابة", "شجر", "طبيعة", "أخضر"]
  },
  {
    type: "video",
    src: "https://res.cloudinary.com/dtuyo4gqm/video/upload/v1782883496/1122%D9%81%D8%AE_a8dz7p.mp4",
    poster: "",
    tags: ["غروب", "شمس", "سماء", "طبيعة"]
  },
  {
    type: "video",
    src: "https://res.cloudinary.com/dtuyo4gqm/video/upload/v1782883643/1122%D9%81%D8%AE%D8%A7%D9%84%D8%A8%D9%8A%D9%86%D9%84%D8%A8%D8%B1_y7hc0k.mp4",
    poster: "",
    tags: ["بحار", "بحر", "محيط", "أمواج", "شاطئ", "طبيعة"]
  },
  {
    type: "video",
    src: "https://res.cloudinary.com/dtuyo4gqm/video/upload/v1782883604/1122_dcoj9o.mp4",
    poster: "",
    tags: ["مساجد", "مسجد", "إسلامي", "هدوء"]
  },
  {
    type: "video",
    src: "https://res.cloudinary.com/dtuyo4gqm/video/upload/v1782883685/1122%D9%81%D8%AE%D8%A7%D9%84_zqltaa.mp4",
    poster: "",
    tags: ["طبيعة", "مطر", "ماء", "غابات"]
  },
  {
    type: "video",
    src: "https://res.cloudinary.com/dtuyo4gqm/video/upload/v1782883657/1122%D9%81%D8%AE%D8%A7%D9%84%D8%A8%D9%8A_ljrmka.mp4",
    poster: "",
    tags: ["جبال", "جبل", "طبيعة", "ضباب"]
  }
];
