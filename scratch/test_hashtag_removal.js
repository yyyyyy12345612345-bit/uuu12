// Test category and title extraction without hashtags
const CATEGORY_KEYWORDS = {
  "مساجد": ["مسجد", "مساجد", "مكة", "كعبة", "المدينة", "الحرم", "حرم", "اذان", "أذان", "صلاة", "اسلام", "إسلام", "islamic", "mosque", "mecca", "kaaba", "quran", "قرآن", "جامع"],
  "بحار": ["بحر", "بحار", "شاطئ", "شواطئ", "محيط", "محيطات", "أمواج", "موج", "ماء", "مياه", "نهر", "أنهار", "شلال", "شلالات", "sea", "ocean", "beach", "waves", "water", "lake", "بحيرة"],
  "جبال": ["جبل", "جبال", "قمة", "قمم", "صخر", "صخور", "هضاب", "تلال", "mountain", "mountains", "rocks", "hills"],
  "غابات": ["غابة", "غابات", "شجر", "أشجار", "أخضر", "خضار", "حديقة", "حدائق", "نبات", "نباتات", "ورود", "زهور", "forest", "trees", "nature", "green", "jungle"],
  "الثلج": ["ثلج", "ثلوج", "جليد", "شتاء", "صقيع", "برد", "snow", "ice", "winter", "cold", "frost"],
  "غروب": ["غروب", "شروق", "مغيب", "شمس", "أصيل", "شفق", "صباح", "sunset", "sunrise", "sun", "dawn", "dusk"],
  "سماء": ["سماء", "سحب", "سحاب", "غيم", "غيوم", "مطر", "أمطار", "نجوم", "قمر", "فضاء", "ليل", "sky", "clouds", "rain", "stars", "moon", "night"],
  "طبيعة": ["طبيعة", "طبيعي", "مناظر", "landscape", "nature"],
};

const normalizeArabic = (text) => {
  return text
    .toLowerCase()
    .replace(/#/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .trim();
};

function processCaption(caption = "") {
  const normalizedCaption = normalizeArabic(caption);

  let category = "طبيعة";
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => normalizedCaption.includes(normalizeArabic(kw)))) {
      category = catName;
      break;
    }
  }

  let title = caption
    .replace(/#/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!title) {
    title = `فيديو سحابي ${new Date().toLocaleDateString("ar-EG")}`;
  }

  const tags = [category, "فيديو"];

  const cleanWords = caption
    .replace(/[#،,.\-_:;!؟?()\[\]{}"'\\/]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !["هذا", "هذه", "التي", "الذي", "على", "إلى", "الى", "منه", "معها", "في", "من", "عن", "مع"].includes(w));

  for (const word of cleanWords) {
    if (!tags.includes(word)) {
      tags.push(word);
    }
  }

  return { title, category, tags };
}

console.log("Test 1 (No hashtags - Sea):", processCaption("أمواج البحر الأزرق الرائعة"));
console.log("Test 2 (No hashtags - Mosque):", processCaption("المسجد النبوي الشريف وقت الصلاة"));
console.log("Test 3 (With accidental hashtag):", processCaption("منظر جميل #غروب للشمس"));
console.log("Test 4 (Empty caption):", processCaption(""));
console.log("Test 5 (Mountains):", processCaption("قمم جبال الألب المغطاة"));
