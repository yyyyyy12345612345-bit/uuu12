import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ===== CONFIG =====
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const SYSTEM_PROMPT = `
أنت "مُساعِد القرآن" - مساعد ذكي متخصص في القرآن الكريم والعلوم الإسلامية.
أسلوبك: ودود، عميق، مستند للدليل، بالعربية الفصحى المبسطة.

قواعدك:
1. استند دائماً للقرآن الكريم والسنة الصحيحة
2. اذكر المصدر (سورة/آية، حديث/راوي) عند الإجابة
3. إذا لم تعرف، قل "الله أعلم" ولا تخمن
4. كن مختصراً لكن مفيداً
5. راعِ آداب الحديث عن الدين

بياناتك المتاحة:
- القرآن الكريم كامل (نص، ترجمة، تفسير)
- الأحاديث الصحيحة (البخاري، مسلم، السنن)
- تفسير ابن كثير، السعدي، الجلالين
- مواقيت الصلاة، القبلة، الأذكار
`;

// ===== QURAN DATA HELPER =====
const SURAH_NAMES = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف",
  "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر",
  "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون",
  "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر",
  "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد",
  "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن",
  "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة",
  "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة",
  "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات",
  "النبأ", "النازعات", "عبس", "التكوير", "الإنفطار", "المطففين", "الإنشقاق",
  "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل",
  "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر",
  "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"
];

function getSurahName(number) {
  return SURAH_NAMES[number - 1] || `سورة ${number}`;
}

function buildQuranContext(query) {
  // يمكن تطوير هذا للبحث الحقيقي في قاعدة بيانات القرآن
  return `
مرجع سريع:
- السور: ${SURAH_NAMES.length} سورة
- للآيات: اذكر رقم السورة والآية (مثال: 2:255 لآية الكرسي)
- للتفسير: اذكر اسم المفسر (ابن كثير، السعدي، الجلالين)
- للأحاديث: اذكر المصدر (البخاري، مسلم، الترمذي، إلخ)
`;
}

// ===== CHAT ENDPOINT =====
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], context } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'الرسالة مطلوبة' });
    }

    // Build conversation history for Gemini
    const contents = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'فهمت، أنا مساعد القرآن. كيف أساعدك اليوم؟' }] }
    ];

    // Add previous messages (keep last 10 for context)
    const recentHistory = history.slice(-10);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    // Add current message with Quran context
    const enrichedMessage = `${message}\n\n---\nسياق القرآن:\n${buildQuranContext(message)}`;
    contents.push({ role: 'user', parts: [{ text: enrichedMessage }] });

    // Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents,
      config: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1500,
        systemInstruction: SYSTEM_PROMPT,
      },
    });

    const reply = response.text;

    // Extract Quran references if mentioned
    const ayahMatches = reply.match(/(\d+:\d+)/g);
    const surahMatches = reply.match(/سورة\s+(\w+)/g);

    res.json({
      success: true,
      reply,
      meta: {
        quranRefs: ayahMatches || [],
        surahRefs: surahMatches || [],
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في المعالجة',
      detail: error.message 
    });
  }
});

// ===== QURAN SEARCH ENDPOINT =====
app.get('/api/quran/search', async (req, res) => {
  try {
    const { q, type = 'ayah' } = req.query;
    
    if (!q) return res.status(400).json({ error: 'معامل البحث مطلوب' });

    // هنا يمكن ربط قاعدة بيانات قرآن حقيقية
    // للتبسيط: نرجع رد من Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `ابحث في القرآن عن: "${q}". 
          أرجع النتائج بصيغة JSON:
          {
            "results": [
              {"surah": رقم السورة, "ayah": رقم الآية, "text": "نص الآية", "surahName": "اسم السورة"}
            ]
          }
          ابحث في النص العربي والترجمة والمعنى.`
        }]
      }],
      config: {
        temperature: 0.3,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json'
      }
    });

    let results = [];
    try {
      results = JSON.parse(response.text).results || [];
    } catch (e) {
      results = [];
    }

    res.json({ success: true, query: q, results });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'خطأ في البحث' });
  }
});

// ===== TAFAIR ENDPOINT =====
app.get('/api/quran/tafsir', async (req, res) => {
  try {
    const { surah, ayah, tafsir = 'saadi' } = req.query;
    
    if (!surah || !ayah) {
      return res.status(400).json({ error: 'رقم السورة والآية مطلوبان' });
    }

    const tafsirNames = {
      saadi: 'تفسير السعدي',
      kathir: 'تفسير ابن كثير',
      jalalayn: 'تفسير الجلالين',
      tabari: 'تفسير الطبري'
    };

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{
        role: 'user',
        parts: [{
          text: `اكتب تفسير الآية ${surah}:${ayah} بـ ${tafsirNames[tafsir] || tafsirNames.saadi}.
          اجعل التفسير واضحاً، مختصراً، ومفيداً للمسلم العادي.
          اذكر الفوائد والعبر إن وجدت.`
        }]
      }],
      config: { temperature: 0.5, maxOutputTokens: 1500 }
    });

    res.json({
      success: true,
      surah: parseInt(surah),
      ayah: parseInt(ayah),
      tafsir: tafsirNames[tafsir] || tafsirNames.saadi,
      text: response.text
    });

  } catch (error) {
    console.error('Tafsir error:', error);
    res.status(500).json({ error: 'خطأ في جلب التفسير' });
  }
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Quran Chatbot API',
    timestamp: Date.now(),
    gemini: !!GEMINI_API_KEY
  });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Quran Chatbot API running on port ${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/health`);
  console.log(`💬 Chat: POST http://localhost:${PORT}/api/chat`);
  console.log(`🔍 Search: GET http://localhost:${PORT}/api/quran/search?q=...`);
  console.log(`📖 Tafsir: GET http://localhost:${PORT}/api/quran/tafsir?surah=2&ayah=255`);
});

export default app;