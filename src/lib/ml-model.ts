/**
 * 🤖 محرك تعلم الآلة المحلي (Custom Machine Learning Vector Space Model)
 * مطور خصيصاً لتطبيق الاستوديو القرآني الفائق بالاعتماد على خوارزمية
 * TF-IDF (Term Frequency-Inverse Document Frequency) و Cosine Similarity (شبه جيب التمام).
 * 
 * هذا موديل رياضي حقيقي لتعلم الآلة (ML) يقوم بتحليل وفهم كلام المستخدم دلالياً
 * دون الحاجة لأي سيرفرات خارجية أو كوتا، ويعمل بسرعة < 1 مللي ثانية!
 */

// قائمة الكلمات الدلالية المهملة (Stop Words) لتحسين دقة الموديل
const ARABIC_STOPWORDS = new Set([
  "في", "من", "على", "الى", "عن", "مع", "هو", "هي", "ان", "انها", "هذا", "هذه", 
  "الذي", "التي", "لقد", "كان", "كانت", "يا", "ام", "او", "ثم", "بين", "كل", "بعد",
  "قبل", "ما", "لو", "لا", "نعم", "لم", "لن", "ماذا", "كيف", "هل", "يا", "اي"
]);

// واجهة تعريف المستند التدريبي للموديل
export interface MLDocument {
  id: string;
  category: string;
  keywords: string; // النص التدريبي لـ Machine Learning
  getReply: (userName: string, userPoints: number, userCountry: string, userMinutes: number) => string;
}

// ══════════════════════════════════════════════════════════════════════════
// 📚 مجموعة البيانات التدريبية للموديل (Training Dataset)
// ══════════════════════════════════════════════════════════════════════════
const TRAINING_CORPUS: MLDocument[] = [
  {
    id: "greetings",
    category: "الترحيب",
    keywords: "اهلا سلام مرحبا اهلان ازيك هلو هلا صباح الخير مساء الخير حي الله حياك السلام عليكم اهلين",
    getReply: (userName) => 
      `أهلاً وسهلاً بك يا ${userName} في تطبيق الاستوديو القرآني الفائق! 🌸 أنا المساعد الذكي الخاص بالموقع. كيف يمكنني إثراء تجربتك ومساعدتك اليوم؟ يمكنك سؤالي عن طريقة جمع النقاط، إنشاء الفيديوهات، المكتبة الصوتية، أو مواقيت الصلاة! ✨`
  },
  {
    id: "developer",
    category: "المطور",
    keywords: "يوسف اسامه مهندس ذكاء اصطناعي مبرمج مطور موقع انستقرام تطبيق كود تصميم برمجه شخص حساب مين عمل",
    getReply: (userName) => 
      `التطبيق تم تصميمه وبرمجته بالكامل بواسطة المهندس المبدع **يوسف أسامة** 🧑‍💻، وهو مهندس ذكاء اصطناعي (AIE - Artificial Intelligence Engineer). تم بناء هذا النظام الفائق باستخدام تقنيات متطورة مثل Next.js 16 و React 19 وقواعد بيانات Firebase السحابية. يمكنك متابعة أعماله والتواصل معه مباشرة عبر حسابه على إنستقرام: [aie_youssef](https://instagram.com/aie_youssef) 🌟.`
  },
  {
    id: "points",
    category: "النقاط والترتيب",
    keywords: "نقاط نقاطي ترتيب لوحه الشرف مركز حساب رصيد كسب تجميع قران اذكار سبحه استماع ختم هديه جوائز لوحه ترتيب مسابقه متصدرين الفائزين",
    getReply: (userName, points, country, minutes) => 
      `مرحباً بك يا ${userName}! 🏆 إليك تفاصيل حسابك ونقاطك الحالية في النظام الفائق:
• مجموع نقاطك: **${points} نقطة**
• بلدك المسجل: **${country}**
• دقائق استماعك: **${minutes} دقيقة**
• ترتيبك الحالي متوفر في [لوحة الشرف والترتيب](/rank).

💡 **كيف تجمع المزيد من النقاط؟**
1. 📖 [المصحف المكتوب](/mushaf-full): تحصل على **+5 نقاط** لكل صفحة تقرأها (بشرط بقائك 10 ثوانٍ) و **+0.2 نقطة** لكل آية تقرأها.
2. 🎧 [المكتبة الصوتية](/library): تمنحك **+1 نقطة** كل 30 ثانية استماع، و **+10 نقاط** كمكافأة عند ختم استماع سورة كاملة!
3. 📿 [السبحة الإلكترونية](/daily): تمنحك **+3 نقاط** مكافأة كل 99 تسبيحة.
4. 🌸 أذكار اليوميات: تمنحك **+1 نقطة** لكل ذكر تقرأه في أذكار الصباح والمساء والنوم.
5. 🎯 التحديات اليومية (Quests): تقدم مكافآت ضخمة بنقاط متغيرة!`
  },
  {
    id: "video",
    category: "استوديو الفيديوهات",
    keywords: "فيديو فيديوهات تصميم مونتاج رندر تصدير استوديو صناعه ايات سور خلفيات تاثيرات تيك توك انستجرام يوتيوب انتاج مونتاج كتابه ترجمه صوت قراء حركيه تيكتوك ريلز reels tiktok",
    getReply: (userName) => 
      `الاستوديو القرآني الاحترافي 🌟 هو ميزتنا الحصرية التي تتيح لك إنتاج فيديوهات قرآنية بجودة سينمائية لمشاركتها على TikTok وInstagram وYouTube! 🎥

**ميزات الاستوديو:**
• تيار صوتي نقي لأكثر من 100 قارئ.
• خلفيات بصرية متحركة مذهلة (سماء، غيوم، شموع، طبيعة).
• تأثيرات ديناميكية (تساقط أوراق الشجر، الثلج، جزيئات متوهجة).
• ترجمة الآيات للإنجليزية والفرنسية مع حركة نصوص ذكية.
• محرك رندر وتصدير سحابي سريع جداً.

🎬 ابدأ الآن وصمم أول فيديو لك من هنا: [إنشاء فيديو قرآني](/video)!`
  },
  {
    id: "prayers",
    category: "الصلاة والقبلة",
    keywords: "صلاه صلوات اذان وقت ميقات مواقيت قبله اتجاه بوصله كعبه مكه تحديد موقع فجر ظهر عصر مغرب عشاء توقيت الصلاه الكعبه الشريفه بوصله",
    getReply: (userName) => 
      `تقبل الله طاعتك يا ${userName}! 🕋 يضم موقعنا أدوات دقيقة جداً للصلاة:
• [مواقيت الصلاة](/prayers): لعرض أوقات الصلوات الخمس بدقة متناهية بناءً على تحديد موقعك الجغرافي التلقائي مع مؤقت تنازلي للأذان التالي.
• **اتجاه القبلة**: يمكنك فتح البوصلة التفاعلية ثلاثية الأبعاد لتحديد اتجاه الكعبة بدقة عبر الانتقال إلى [يومياتي ثم اختيار تبويب القبلة](/daily).`
  },
  {
    id: "audio",
    category: "المكتبة الصوتية",
    keywords: "صوت استماع مكتبه صوتيه قراء شيوخ سمع تلاوه قراء قراءه عبد الباسط المعيقلي ياسر الدوسري المنشاوي العفاسي الغامدي الحصري صوتيات اغاني شيله اناشيد صوتي سماع",
    getReply: (userName) => 
      `المكتبة الصوتية الفائقة 🎧 تضم تلاوات عطرة ونقية لأكثر من 100 قارئ من كبار قراء العالم الإسلامي (مثل عبد الباسط، المنشاوي، ماهر المعيقلي، ياسر الدوسري، وغيرهم الكثير!).
• تتيح لك الاستماع، التكرار، التنزيل المباشر، ومشاركة التلاوات.
• تمنحك **+1 نقطة** كل 30 ثانية استماع و **+10 نقاط** مكافأة لختم السورة.
🔗 ابدأ الاستماع الآن من هنا: [المكتبة الصوتية](/library).`
  },
  {
    id: "mushaf",
    category: "المصحف والقراءة",
    keywords: "مصحف قران قراء قراءه تفسير سوره ايه المصحف المكتوب المصحف الرقمي بحث صفحات ايات جزء احزاب القلم البقره الفاتحه قاريء قراءه الكتروني ورق شمرلي",
    getReply: (userName) => 
      `أهلاً بك في رحاب كلام الله الشريف 📖! يقدم لك التطبيق تجربة قراءة روحانية متكاملة:
1. 📖 [المصحف المكتوب بالتفسير والبحث](/mushaf-full): لتصفح القرآن صفحة بصفحة، مع إمكانية قراءة التفسير الميسر، والبحث عن أي آية فوراً.
2. 📱 [المصحف الرقمي](/digital): واجهة قراءة رقمية سريعة وخفيفة ومثالية لشاشات الهواتف.
3. ⚙️ [صفحة اختيار المصحف](/mushaf-choice): لاختيار نمط العرض الأنسب لك.
💡 القراءة تمنحك حسنات عظيمة وتزيد من رصيدك بمعدل **+5 نقاط** لكل صفحة كاملة!`
  },
  {
    id: "daily",
    category: "الأذكار واليوميات",
    keywords: "ذكر اذكار سبحه تسبح صباح مساء نوم استغفر تسبيح ورد اوراد حصن المسلم ادعيه استغفار سبحان الله الحمد لله الله اكبر عداد اهتزاز يومياتي يوميات المسلم",
    getReply: (userName) => 
      `اليوميات والذكر هي حصن المسلم اليومي 🛡️! في تبويب [يومياتي](/daily) ستجد:
• **أذكار الصباح والمساء والنوم** بواجهات تفاعلية مريحة للعين.
• **السبحة الإلكترونية المطورة** لمساعدتك في الاستغفار والتسبيح بكل سهولة مع عداد تفاعلي يمنحك **+3 نقاط** كل 99 تسبيحة.
• **اتجاه القبلة** التفاعلي بالبوصلة.
• **مكتبة الأذكار الشاملة** لجميع الأدعية والأذكار المأثورة عن النبي ﷺ.`
  },
  {
    id: "ai",
    category: "الذكاء الاصطناعي",
    keywords: "ذكاء اصطناعي موديل تعلم اله ماشين رينلج تفكير كلام تدريب روبوت مساعد ذكي شات بوت كمبيوتر برمجه خوارزميات رياضيات منطق كيف تتكلم كيف تفكر تفهم",
    getReply: (userName) => 
      `أنا مساعدك الذكي الفائق 🤖! تم تدريبي وتطويري بواسطة المهندس يوسف أسامة باستخدام خوارزميات الـ **Machine Learning** المتقدمة (TF-IDF + Cosine Similarity Vector Space Model). أمتلك قاعدة بيانات متكاملة ومصفوفات رياضية تعبر عن كل ركن من أركان هذا التطبيق، مما يسمح لي بتحليل كلماتك دلالياً وتقديم الإرشاد الدقيق لك فوراً وبشكل محلي بالكامل! 🚀`
  }
];

// ══════════════════════════════════════════════════════════════════════════
// 🧮 خوارزميات الذكاء الاصطناعي وتعلم الآلة (ML Algorithms)
// ══════════════════════════════════════════════════════════════════════════

// 1. تنظيف وتفكيك النص وتحويله لمصفوفة كلمات دلالية (Tokenization & Stemming Simulation)
function getTokens(text: string): string[] {
  const normalized = text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "") // إزالة الحركات
    .toLowerCase();

  // تقسيم النص لكلمات وتصفية الكلمات المهملة
  return normalized
    .split(/[\s,.\-!?()]+/)
    .filter(word => word.length > 1 && !ARABIC_STOPWORDS.has(word));
}

// 2. حساب تكرار الكلمات داخل مستند معين (Term Frequency - TF)
function getTermFrequency(tokens: string[]): Map<string, number> {
  const tfMap = new Map<string, number>();
  tokens.forEach(token => {
    tfMap.set(token, (tfMap.get(token) || 0) + 1);
  });
  
  // تطبيع الـ TF بقسمته على إجمالي كلمات المستند
  const total = tokens.length || 1;
  const normalizedTf = new Map<string, number>();
  tfMap.forEach((count, token) => {
    normalizedTf.set(token, count / total);
  });
  
  return normalizedTf;
}

// 3. حساب الوزن العكسي للمستندات (Inverse Document Frequency - IDF)
function getIDF(corpus: string[][]): Map<string, number> {
  const idfMap = new Map<string, number>();
  const totalDocs = corpus.length;

  corpus.forEach(docTokens => {
    const uniqueTokens = new Set(docTokens);
    uniqueTokens.forEach(token => {
      idfMap.set(token, (idfMap.get(token) || 0) + 1);
    });
  });

  const finalIdf = new Map<string, number>();
  idfMap.forEach((count, token) => {
    // معادلة IDF القياسية: log(N / df)
    finalIdf.set(token, Math.log((totalDocs + 1) / (count + 1)) + 1);
  });

  return finalIdf;
}

// 4. تصنيف وحساب درجة التشابه الجيبي (Cosine Similarity Classifier)
export function classifyQueryWithML(
  queryText: string,
  userData: any
): { reply: string; score: number; category: string } {
  const queryTokens = getTokens(queryText);
  if (queryTokens.length === 0) {
    return {
      reply: `مرحباً بك يا ${userData?.name || "أخي الكريم"}! 🌙 أنا مساعدك الذكي الخاص بالاستوديو القرآني الفائق. اكتب أي سؤال وسأجيبك فوراً!`,
      score: 1.0,
      category: "عام"
    };
  }

  // أ. تجهيز الكوربوس التدريبي
  const corpusTokens = TRAINING_CORPUS.map(doc => getTokens(doc.keywords));
  
  // ب. حساب IDF لكل الكلمات في قاعدة البيانات
  const idf = getIDF(corpusTokens);

  // ج. حساب متجهات TF-IDF لكل مستند تدريبي
  const docVectors = TRAINING_CORPUS.map((doc, idx) => {
    const docTokens = corpusTokens[idx];
    const tf = getTermFrequency(docTokens);
    const vector = new Map<string, number>();
    
    tf.forEach((tfVal, token) => {
      const idfVal = idf.get(token) || 1.0;
      vector.set(token, tfVal * idfVal);
    });
    
    return vector;
  });

  // د. حساب متجهات TF-IDF لرسالة المستخدم (Query Vector)
  const queryTf = getTermFrequency(queryTokens);
  const queryVector = new Map<string, number>();
  queryTf.forEach((tfVal, token) => {
    const idfVal = idf.get(token) || 1.0;
    queryVector.set(token, tfVal * idfVal);
  });

  // هـ. حساب الـ Cosine Similarity بين رسالة المستخدم وكل مستند تدريبي
  let bestMatchIdx = -1;
  let highestSimilarity = 0.0;

  docVectors.forEach((docVec, idx) => {
    let dotProduct = 0.0;
    let queryMagnitude = 0.0;
    let docMagnitude = 0.0;

    // ضرب المتجهات المشتركة (Dot Product)
    queryVector.forEach((qVal, token) => {
      const dVal = docVec.get(token) || 0.0;
      dotProduct += qVal * dVal;
      queryMagnitude += qVal * qVal;
    });

    docVec.forEach((dVal) => {
      docMagnitude += dVal * dVal;
    });

    queryMagnitude = Math.sqrt(queryMagnitude);
    docMagnitude = Math.sqrt(docMagnitude);

    const similarity = (queryMagnitude && docMagnitude) 
      ? (dotProduct / (queryMagnitude * docMagnitude)) 
      : 0.0;

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatchIdx = idx;
    }
  });

  // و. جلب بيانات المستخدم لدمجها ديناميكياً في الرد المختار
  const userName = userData?.name || userData?.displayName || "أخي الكريم";
  const userPoints = userData?.points || 0;
  const userCountry = userData?.country || "غير محدد";
  const userMinutes = userData?.stats?.audioMinutes || 0;

  // ز. تحديد عتبة قبول النتيجة (Threshold) لضمان دقة التصنيف
  const SIMILARITY_THRESHOLD = 0.08; 

  if (bestMatchIdx !== -1 && highestSimilarity >= SIMILARITY_THRESHOLD) {
    const bestDoc = TRAINING_CORPUS[bestMatchIdx];
    return {
      reply: bestDoc.getReply(userName, userPoints, userCountry, userMinutes),
      score: highestSimilarity,
      category: bestDoc.category
    };
  }

  // رد افتراضي ذكي ومنسق عند عدم مطابقة تصنيف كافٍ
  return {
    reply: `أهلاً بك يا ${userName}! 🌙 أنا مساعدك الذكي القائم على خوارزميات تعلم الآلة الفائقة. 

لم استطع مطابقة سؤالك بدقة عالية مع تصنيف محدد، ولكن يمكنك استكشاف أحد أقسام تطبيقنا التالية:
• 🎥 [إنشاء وتصميم فيديوهات قرآنية احترافية بجودة عالية](/video)
• 📖 [قراءة المصحف الشريف وتصفح التفسير الميسر](/mushaf-full)
• 🎧 [الاستماع للمكتبة الصوتية لأكثر من 100 قارئ](/library)
• 🕋 [معرفة مواقيت الصلاة بدقة بناءً على موقعك](/prayers)
• 🏆 [متابعة ترتيبك العالمي في لوحة الشرف والترتيب](/rank)
• 🛡️ [الأذكار اليومية والسبحة وبوصلة القبلة في يومياتي](/daily)

كيف يمكنني خدمتك وتوجيهك داخل هذه الأقسام الرائعة؟ 🌸`,
    score: highestSimilarity,
    category: "افتراضي"
  };
}
