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
    keywords: "يوسف اسامه مهندس ذكاء اصطناعي مبرمج مطور موقع انستقرام تطبيق كود تصميم برمجه شخص حساب مين عمل صاحب موقع اسم الموقع مالك الموقع من صنع الموقع من عمل الموقع",
    getReply: (userName) => 
      `التطبيق تم تصميمه وبرمجته بالكامل بواسطة المهندس المبدع **يوسف أسامة** 🧑‍💻، وهو مهندس ذكاء اصطناعي (AIE - Artificial Intelligence Engineer). تم بناء هذا النظام الفائق باستخدام تقنيات متطورة مثل Next.js 16 و React 19 وقواعد بيانات Firebase السحابية. يمكنك متابعة أعماله والتواصل معه مباشرة عبر حسابه على إنستقرام: [aie_youssef](https://instagram.com/aie_youssef) 🌟.`
  },
  {
    id: "site",
    category: "موقع التطبيق",
    keywords: "موقع التطبيق اقسام الموقع فروع التطبيق صفحة التفسير صفحة المصحف صفحة الفيديو صفحة الصلاة صفحة المكتبة صفحة اليوميات لوحة الشرف الملف الشخصي تسجيل دخول رابط التطبيق",
    getReply: (userName) =>
      `مرحباً يا ${userName}! 🌟 هذا التطبيق هو استوديو قرآني شامل:
• **المصحف المكتوب والتفسير** في /mushaf-full
• **التفسير المباشر** في /mushaf-tafseer
• **المصحف الرقمي** في /digital
• **مواقيت الصلاة والقبلة** في /prayers
• **المكتبة الصوتية** في /library
• **إنشاء فيديوهات قرآنية** في /video
• **الأذكار اليومية والسبحة** في /daily
• **لوحة الشرف** في /rank
• **الملف الشخصي** في /profile

إذا كنت تريد تفسير أي آية، فقط اذهب إلى /mushaf-tafseer وابحث عن السورة والآية المطلوبة. إذا كنت تسأل عن وقت الصلاة في مدينة محددة، استخدم /prayers لمعرفة التوقيت الدقيق حسب موقعك أو المدينة التي تختارها.`
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
    keywords: "فيديو فيديوهات تصميم مونتاج رندر تصدير استوديو صناعه ايات سور خلفيات تاثيرات تيك توك انستجرام يوتيوب انتاج مونتاج كتابه ترجمه صوت قراء حركيه تيك توك ريلز reels tiktok طريقه طريقة كيفية كيفية عمل فديو فديو قران شرح عمل فيديو قرآن",
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
function normalizeArabicText(text: string): string {
  return text
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ئه/g, "يه")
    .replace(/ڤ/g, "ف")
    .replace(/فديو/g, "فيديو")
    .replace(/[\u064B-\u065F]/g, "") // إزالة الحركات
    .replace(/[.,!?()\[\]{}«»؛:،؟…"']/g, " ")
    .toLowerCase();
}

function getTokens(text: string): string[] {
  const normalized = normalizeArabicText(text);

  // تقسيم النص لكلمات وتصفية الكلمات المهملة
  return normalized
    .split(/[\s\-]+/)
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

// 📚 بنك الأسئلة والمسابقات الدينية العامة التفاعلية (Islamic General Trivia Question Bank)
export const ISLAMIC_QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "ما هي السورة التي تسمى عروس القرآن؟",
    options: "أ) الرحمن\nب) يس\nج) الملك\nد) الواقعة",
    correctOption: "أ",
    explanation: "سورة الرحمن تسمى عروس القرآن لما فيها من جمال الأسلوب وعظيم نعم الله المذكورة فيها."
  },
  {
    id: 2,
    question: "كم عدد سور القرآن الكريم؟",
    options: "أ) 112 سورة\nب) 114 سورة\nج) 116 سورة\nد) 110 سورة",
    correctOption: "ب",
    explanation: "القرآن الكريم يتكون من 114 سورة شريفة."
  },
  {
    id: 3,
    question: "من هو الصحابي الذي لُقب بأمين هذه الأمة؟",
    options: "أ) أبو عبيدة بن الجراح\nب) عمر بن الخطاب\nج) خالد بن الوليد\nد) أبو بكر الصديق",
    correctOption: "أ",
    explanation: "أبو عبيدة بن الجراح رضي الله عنه هو أمين هذه الأمة كما سماه النبي ﷺ."
  },
  {
    id: 4,
    question: "ما هي أطول سورة في القرآن الكريم؟",
    options: "أ) آل عمران\nب) البقرة\nج) النساء\nد) المائدة",
    correctOption: "ب",
    explanation: "سورة البقرة هي أطول سور القرآن الكريم بعدد 286 آية."
  },
  {
    id: 5,
    question: "كم عدد الأنبياء والرسل الذين ذُكروا في القرآن الكريم؟",
    options: "أ) 20 نبي ورسول\nب) 25 نبي ورسول\nج) 30 نبي ورسول\nد) 15 نبي ورسول",
    correctOption: "ب",
    explanation: "ذكر الله تعالى في القرآن الكريم 25 نبياً ورسولاً بأسمائهم."
  },
  {
    id: 6,
    question: "من هو أول مؤذن في الإسلام؟",
    options: "أ) بلال بن رباح\nب) عبد الله بن أم مكتوم\nج) سعد القرظ\nد) عمار بن ياسر",
    correctOption: "أ",
    explanation: "بلال بن رباح رضي الله عنه هو أول مؤذن صدح بالأذان في الإسلام."
  },
  {
    id: 7,
    question: "ما هي أقصر سورة في القرآن الكريم؟",
    options: "أ) الإخلاص\nب) الكوثر\nج) النصر\nد) العصر",
    correctOption: "ب",
    explanation: "سورة الكوثر هي أقصر سورة وتتكون من 3 آيات."
  },
  {
    id: 8,
    question: "ما هي السورة التي تعدل ثلث القرآن الكريم؟",
    options: "أ) الفاتحة\nب) الإخلاص\nج) الكافرون\nد) يس",
    correctOption: "ب",
    explanation: "سورة الإخلاص تعدل ثلث القرآن الكريم في الأجر والتوحيد."
  },
  {
    id: 9,
    question: "من هو أول من كتب بالقلم من الأنبياء؟",
    options: "أ) آدم عليه السلام\nب) إدريس عليه السلام\nج) نوح عليه السلام\nد) إبراهيم عليه السلام",
    correctOption: "ب",
    explanation: "نبي الله إدريس عليه السلام هو أول من خط بالقلم."
  },
  {
    id: 10,
    question: "ما هي السورة التي لا تبدأ بالبسملة؟",
    options: "أ) التوبة\nب) النمل\nج) يونس\nد) هود",
    correctOption: "أ",
    explanation: "سورة التوبة (براءة) هي السورة الوحيدة التي لا تبدأ بالبسملة."
  }
];

// 4. تصنيف وحساب درجة التشابه الجيبي مع الفحص المباشر للأوامر والمسابقات (Cosine Similarity & Command Interceptor)
export function classifyQueryWithML(
  queryText: string,
  userData: any
): { 
  reply: string; 
  score: number; 
  category: string; 
  updateProfile?: any; 
  createPlan?: any; 
  quiz?: any;
} {
  const textClean = queryText.trim();
  const userName = userData?.name || userData?.displayName || "أخي الكريم";
  const userPoints = userData?.points || userData?.totalPoints || 0;
  const userCountry = userData?.country || "غير محدد";
  const userMinutes = userData?.stats?.audioMinutes || 0;

  // 1. فحص أسئلة المسابقة الدينية (Islamic Quiz Request Interception)
  const isQuizReq = /(?:سؤال|اسالني|مسابقه|مسابقة|اختبار|تحدي|مسابقات|اسئله|أسئلة|اختبرني|امتحان|امتحن|كويز)/i.test(textClean);
  if (isQuizReq) {
    const randomIndex = Math.floor(Math.random() * ISLAMIC_QUIZ_QUESTIONS.length);
    const quiz = ISLAMIC_QUIZ_QUESTIONS[randomIndex];
    return {
      reply: `🤔✨ **تحدي المسابقة الدينية!** إليك هذا السؤال الممتع:
      
**السؤال:** ${quiz.question}

${quiz.options}

اكتب لي خيارك الآن **(أ، ب، ج، د)** للإجابة وحصاد الحسنات والنقاط! 🏆`,
      score: 1.0,
      category: "مسابقة دينية",
      quiz: {
        questionId: quiz.id,
        correctOption: quiz.correctOption,
        explanation: quiz.explanation
      }
    };
  }

  // 2. فحص حالة API أو خادم المحادثة
  const apiStatusMatch = /(?:api|سيرفر|خادم|استضافة|مفتاح|openai|gemini|endpoint|interface|واجهة\s+المحادثة|نظام\s+المحادثة)/i.test(textClean);
  if (apiStatusMatch) {
    return {
      reply: `نعم، واجهة المحادثة تستخدم API خاص بالتطبيق. إذا كان لديك اتصال بالإنترنت وظهرت لك ردودي فهذا يعني أن النظام يعمل. لإثبات ذلك، يمكنك إرسال سؤال عن أي ميزة في التطبيق مثل "كيف أعمل فيديو" أو "كيف أجد مواقيت الصلاة" وسأجيبك مباشرةً.`,
      score: 1.0,
      category: "حالة النظام"
    };
  }

  // 3. فحص أسئلة المعلومات الدينية المباشرة (Direct Quran / Islamic QA)
  const quranFactMatch = /(?:كم|عدد|ما\s+هي|ما\s+هو|ايه|ما\s+معنى|ما\s+تفسير|تفسير|شرح)\s+(?:عدد\s+)?(?:سور|سورة|القرآن|القران|آية|اية|تفسير|شرح)/i.test(textClean);
  if (quranFactMatch) {
    if (/(?:كم|عدد)\s+(?:عدد\s+)?سور(?:\s+في\s+القرآن|\s+في\s+القران)?/i.test(textClean)) {
      return {
        reply: `القرآن الكريم يتكون من **114 سورة** شريفة.`,
        score: 1.0,
        category: "معلومة دينية"
      };
    }

    if (/(?:ما\s+هي|ايه)\s+أطول\s+سورة|(?:أطول\s+سورة)/i.test(textClean)) {
      return {
        reply: `أطول سورة في القرآن الكريم هي سورة **البقرة** وعدد آياتها 286 آية.`,
        score: 1.0,
        category: "معلومة دينية"
      };
    }

    if (/(?:ما\s+هي|ايه)\s+أقصر\s+سورة|(?:أقصر\s+سورة)/i.test(textClean)) {
      return {
        reply: `أقصر سورة في القرآن الكريم هي سورة **الكوثر** وتتكون من 3 آيات.`,
        score: 1.0,
        category: "معلومة دينية"
      };
    }

    if (/(?:ما\s+هي|ايه)\s+سورة\s+عروس\s+القرآن|(?:عروس\s+القرآن)/i.test(textClean)) {
      return {
        reply: `سورة **الرحمن** تسمى عروس القرآن لما جاء فيها من نعم الله سبحانه وتعالى وجمال السياق.`,
        score: 1.0,
        category: "معلومة دينية"
      };
    }

    if (/(?:ما\s+هي|ايه)\s+سورة\s+لا\s+تبدأ\s+بالبسملة|(?:لا\s+تبدأ\s+بالبسملة)/i.test(textClean)) {
      return {
        reply: `السورة التي لا تبدأ بالبسملة هي سورة **التوبة** (براءة).`,
        score: 1.0,
        category: "معلومة دينية"
      };
    }

    if (/(?:تفسير|شرح|ما\s+معنى|ما\s+تفهم|ما\s+معاني)/i.test(textClean)) {
      return {
        reply: `إذا كنت تسأل عن تفسير آية أو معنى آية، فإن التطبيق يحتوي على قسم التفسير المباشر في /mushaf-tafseer. ابحث عن السورة والآية هناك للحصول على الشرح الكامل والدقيق.`,
        score: 1.0,
        category: "تفسير"
      };
    }
  }

  // 3. فحص طلبات تغيير الاسم (Change Name Interception)
  const changeNameMatch = textClean.match(/^(?:غير|عدل|تغيير|تعديل|تحديث)\s+(?:اسمي|الاسم|اسم)\s+(?:الى|لـ|ل|يكون)?\s*(.+)/i);
  if (changeNameMatch) {
    const newName = changeNameMatch[1].trim();
    return {
      reply: `👤✨ **تم تعديل اسمك بنجاح!**
      
لقد قمت بتغيير اسمك المسجل في النظام من **${userName}** إلى **${newName}**. تم الحفظ بنجاح في قاعدة البيانات وتحديث الملف الشخصي فوراً! 💾`,
      score: 1.0,
      category: "تعديل البيانات",
      updateProfile: { displayName: newName }
    };
  }

  // 3. فحص طلبات تغيير الدولة (Change Country Interception)
  const changeCountryMatch = textClean.match(/^(?:غير|عدل|تغيير|تعديل|تحديث)\s+(?:بلد|دوله|الدوله|الدولة|البلد|محافظه|محافظتي)\s+(?:الى|لـ|ل|يكون)?\s*(.+)/i);
  if (changeCountryMatch) {
    const newCountry = changeCountryMatch[1].trim();
    return {
      reply: `🌍✨ **تم تعديل دولتك بنجاح!**
      
لقد قمت بتغيير بلدك المسجل في النظام من **${userCountry}** إلى **${newCountry}**. تم الحفظ بنجاح وتحديث كافة تفاصيل ملفك الشخصي فوراً! 💾`,
      score: 1.0,
      category: "تعديل البيانات",
      updateProfile: { country: newCountry }
    };
  }

  // 4. فحص طلبات تغيير الهاتف (Change Phone Interception)
  const changePhoneMatch = textClean.match(/^(?:غير|عدل|تغيير|تعديل|تحديث)\s+(?:رقم|رقمي|تليفون|الهاتف|رقم الهاتف)\s+(?:الى|لـ|ل|يكون)?\s*([\d+\-\s]+)/i);
  if (changePhoneMatch) {
    const newPhone = changePhoneMatch[1].trim();
    return {
      reply: `📱✨ **تم تحديث رقم هاتفك بنجاح!**
      
لقد قمت بتحديث رقم هاتفك المسجل إلى **${newPhone}**. تم الحفظ بنجاح في ملفك الشخصي! 💾`,
      score: 1.0,
      category: "تعديل البيانات",
      updateProfile: { phoneNumber: newPhone }
    };
  }

  // 5. فحص أسئلة صاحب الموقع أو المطور
  const askOwnerQuery = /(?:اسم\s+(?:صاحب|مالك|مؤسس|مطور)\s+(?:الموقع|التطبيق|البرنامج)|(?:من|مين|منو|ال)\s+(?:عمل|صنع|طور)\s+(?:الموقع|التطبيق|البرنامج)|(?:عمل|صنع|طور)\s+(?:الموقع|التطبيق|البرنامج)|(?:الموقع|التطبيق|البرنامج)\s+(?:اسمه|اسمها)|اسم\s+الموقع|اسم\s+صاحب\s+الموقع|اسم\s+مالك\s+الموقع)/i.test(textClean);
  if (askOwnerQuery) {
    return {
      reply: `التطبيق تم تصميمه وبرمجته بالكامل بواسطة المهندس المبدع **يوسف أسامة** 🧑‍💻، وهو مهندس ذكاء اصطناعي (AIE - Artificial Intelligence Engineer). تم بناء هذا النظام الفائق باستخدام تقنيات متطورة مثل Next.js 16 و React 19 وقواعد بيانات Firebase السحابية. يمكنك متابعة أعماله والتواصل معه مباشرة عبر حسابه على إنستقرام: [aie_youssef](https://instagram.com/aie_youssef) 🌟.`,
      score: 1.0,
      category: "المطور"
    };
  }

  // 5. فحص الأسئلة الاستفسارية العامة عن تغيير البيانات
  const askChangeName = /(?:ازاي|كيف|طريقة|طريقه|تغيير|تعديل|اغير|اعدل|بدل|ابدل)\s+(?:اغير|اعدل|تغيير|تعديل|اسم|اسمي|الاسم)|^(?:تغيير الاسم|تعديل الاسم)$/i.test(textClean);
  if (askChangeName) {
    return {
      reply: `بالتأكيد! يمكنك تغيير اسمك بسهولة وبضغطة زر. 👤✏️
      
فقط اكتب لي في الرسالة القادمة:
**"غير اسمي إلى [الاسم الجديد]"**
وسأقوم بتحديثه لك في قاعدة البيانات وملفك الشخصي فوراً!`,
      score: 1.0,
      category: "استفسار تعديل"
    };
  }

  const askChangeCountry = /(?:ازاي|كيف|طريقة|طريقه|تغيير|تعديل|اغير|اعدل|بدل|ابدل)\s+(?:بلد|بلدي|دوله|دولة|البلد|الدولة|الدوله)|^(?:تغيير البلد|تعديل البلد)$/i.test(textClean);
  if (askChangeCountry) {
    return {
      reply: `بالتأكيد! يمكنك تغيير بلدك أو دولتك بسهولة تامة. 🌍✏️
      
فقط اكتب لي في الرسالة القادمة:
**"غير بلدي إلى [الدولة الجديدة]"**
وسأقوم بتعديلها وحفظها في قاعدة البيانات فوراً!`,
      score: 1.0,
      category: "استفسار تعديل"
    };
  }

  // 6. فحص الاستفسار عن رصيد النقاط (Points Check)
  const isPointsCheck = /(?:نقط|نقطه|نقطة|رصيد|نقاطي|رصيدي).*(?:كام|كم|معي|معايا|معيايا)|(?:كام|كم|معي|معايا|معيايا).*(?:نقط|نقطه|نقطة|رصيد|نقاطي|رصيدي)/i.test(textClean);
  if (isPointsCheck) {
    return {
      reply: `مرحباً بك يا ${userName}! 🏆
      
رصيدك الحالي في تطبيق الاستوديو القرآني هو: **${userPoints} نقطة**.

💡 **كيف تجمع المزيد من النقاط للتنافس في لوحة الشرف؟**
• 📖 [المصحف المكتوب بالتفسير](/mushaf-full): تحصل على **+5 نقاط** لكل صفحة تقرأها بالكامل.
• 🎧 [المكتبة الصوتية لأكثر من 100 قارئ](/library): تمنحك **+1 نقطة** لكل 30 ثانية استماع، و **+10 نقاط** مكافأة لختم استماع سورة كاملة!
• 📿 [السبحة الإلكترونية](/daily): تمنحك **+3 نقاط** مكافأة كل 99 تسبيحة.
• 🌸 أذكار اليوميات: تمنحك **+1 نقطة** لكل ذكر في أذكار الصباح والمساء والنوم.`,
      score: 1.0,
      category: "النقاط والترتيب"
    };
  }

  // 7. فحص الاستفسار عن الاسم أو اليوزرنيم (Name/Username Check)
  const userUsername = userData?.username || "غير مسجل";
  const isNameCheck = /(?:اسمي|اسم\s*(?:بتاعي|حسابي|يوزر|يوزرنيم)?|يوزر(?:نيم)?\s*(?:بتاعي|حسابي)?|username).*(?:ايه|إيه|ما|شو|شنو|مين|ايش)|(?:ايه|إيه|ما|شو|شنو|مين|ايش).*(?:اسمي|اسم\s*(?:بتاعي|حسابي|يوزر)?|يوزر(?:نيم)?\s*(?:بتاعي|حسابي)?)|^(?:اسمي|يوزري|يوزرنيم|يوزر بتاعي)$/i.test(textClean);
  if (isNameCheck) {
    return {
      reply: `أهلاً بك يا أخي الحبيب! 👤
      
بياناتك المسجلة حالياً في ملفك الشخصي بالتطبيق:
• **الاسم الكامل:** ${userName}
• **اسم المستخدم (Username):** ${userUsername}

إذا كنت ترغب في تعديل اسمك في أي وقت، فقط اكتب لي: **"غير اسمي إلى [الاسم الجديد]"** وسأقوم بحفظه وتعديله لك فوراً! ✏️✨`,
      score: 1.0,
      category: "الاسم"
    };
  }

  // 8. فحص الاستفسار عن الدولة (Country Check)
  const isCountryCheck = /(?:بلد|دوله|دولتي|محافظتي|محافظه).*ايه|انا منين|بلدي ايه/i.test(textClean);
  if (isCountryCheck) {
    return {
      reply: `أهلاً بك! 🌍
      
دولتك/بلدك المسجل حالياً في تطبيق الاستوديو القرآني هو: **${userCountry}**.

إذا كنت ترغب في تعديل بلدك، اكتب لي ببساطة: **"غير بلدي إلى [الدولة الجديدة]"** وسأقوم بحفظها لك فوراً! ✏️✨`,
      score: 1.0,
      category: "الدولة"
    };
  }

  // ── الفحص التقليدي (Cosine Similarity Fallback) ──
  const queryTokens = getTokens(queryText);
  if (queryTokens.length === 0) {
    return {
      reply: `مرحباً بك يا ${userName}! 🌙 أنا مساعدك الذكي الخاص بالاستوديو القرآني الفائق. اكتب أي سؤال وسأجيبك فوراً!`,
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

  // ز. تحديد عتبة قبول النتيجة (Threshold) لضمان دقة التصنيف
  const SIMILARITY_THRESHOLD = 0.06; 

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
