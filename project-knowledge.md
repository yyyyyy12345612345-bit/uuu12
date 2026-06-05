# يقين القرآن | Yaqeen AlQuran - التوثيق الكامل

## 🕌 نظرة عامة
"يقين القرآن" تطبيق إسلامي شامل (PWA + Android) يقدم:
- **مصحف رقمي** (بالصفحات + الآيات + التجويد)
- **مكتبة صوتية** (50+ قارئ، استماع حسب الآية)
- **صناعة فيديوهات قرآنية** (Remotion + فلاتر + تأثيرات)
- **مواقيت الصلاة** (دقيقة + إشعارات + تقويم سنوي)
- **بوصلة القبلة** (الموقع + البوصلة)
- **الأذكار** (صباح/مساء + سبحة + استغفار + صلاة على النبي)
- **نظام نقاط ولوحة شرف** (تحديات يومية + مكافآت)
- **شات بوت ذكي** (TF-IDF محلي + Gemini API)
- **لوحة تحكم مشرف** (15+ قسم)
- **نظام اشتراكات** (مجاني/مبتدئ/ممتاز)

---

## 🛠 التقنيات المستخدمة

| التقنية | الإصدار | الاستخدام |
|---|---|---|
| **Next.js** | 16.2.7 | Framework رئيسي (App Router) |
| **React** | 19.2.4 | UI Library |
| **TypeScript** | ^5 | لغة البرمجة |
| **Tailwind CSS** | v4 | التنسيق والتصميم |
| **Framer Motion** | 11.18.2 | الحركات والأنيميشن |
| **GSAP** | 3.15.0 | الحركات المتقدمة |
| **Firebase** | 12.12.1 | قاعدة بيانات + مصادقة + تخزين |
| **Firebase Admin** | 13.10.0 | إدارة السيرفر |
| **Remotion** | 4.0.448 | تصيير الفيديو |
| **Capacitor** | 8.3.1 | تطبيق أندرويد أصلي |
| **lucide-react** | ^1.8.0 | أيقونات |
| **sharp** | ^0.33.5 | معالجة الصور |
| **@napi-rs/canvas** | ^0.1.100 | رسم سيرفر |
| **nodemailer** | ^8.0.8 | إيميلات (OTP) |
| **jose** | ^5.10.0 | JWT tokens |

---

## 📁 هيكل المشروع

```
Quran-main/
├── public/                    # ملفات ثابتة (صور، أيقونات، صوت)
├── android/                   # مشروع أندرويد (Capacitor)
├── api/                       # API سيرفر منفصل
│   ├── chatbot-server.js      # شات بوت Gemini
│   ├── server.js              # API عام (مواقيت، أذكار)
│   └── package.json           # dependencies
├── src/
│   ├── app/
│   │   └── [[...slug]]/page.tsx  # الصفحة الرئيسية (SPA)
│   ├── api/
│   │   ├── chat/route.ts      # POST - AI Chat (✅ فعال)
│   │   ├── render/route.ts    # POST - تصيير فيديو (✅ فعال)
│   │   ├── prayer-calendar/route.ts  # GET - مواقيت الصلاة (✅ فعال)
│   │   └── pexels/route.ts    # GET/POST - صور Pexels (✅ فعال)
│   ├── components/
│   │   ├── CatchAllPageClient.tsx    # المكون الرئيسي
│   │   ├── Navigation.tsx            # شريط التنقل السفلي
│   │   ├── AuthGate.tsx              # تسجيل الدخول
│   │   ├── AdminPanel.tsx            # لوحة المشرف
│   │   ├── DigitalMushaf.tsx         # المصحف (صفحات)
│   │   ├── Mushaf.tsx                # المصحف (آيات)
│   │   ├── AudioLibrary.tsx          # المكتبة الصوتية
│   │   ├── DailyHub.tsx              # الأذكار والسبحة
│   │   ├── PrayerTimes.tsx           # مواقيت الصلاة
│   │   ├── QiblaCompass.tsx          # بوصلة القبلة
│   │   ├── VideoPreview.tsx          # معاينة الفيديو
│   │   ├── Controls.tsx              # تحكمات الفيديو
│   │   ├── RenderModal.tsx           # تصدير الفيديو
│   │   ├── Leaderboard.tsx           # لوحة الشرف
│   │   ├── ChatBot.tsx               # الشات بوت
│   │   ├── GlobalMenu.tsx            # القائمة الجانبية
│   │   ├── ProfileModal.tsx          # الملف الشخصي
│   │   ├── SubscriptionModal.tsx     # الاشتراكات
│   │   └── ... (مكونات أخرى)
│   ├── lib/
│   │   ├── firebase.ts          # Firebase Client
│   │   ├── firebaseAdmin.ts     # Firebase Admin
│   │   ├── navigation.ts        # نظام التنقل
│   │   ├── points.ts            # نظام النقاط
│   │   ├── ml-model.ts          # AI محلي (TF-IDF)
│   │   └── quranUtils.ts        # أدوات القرآن
│   ├── data/
│   │   ├── surahs.json          # 114 سورة
│   │   ├── reciters.ts          # 50+ قارئ
│   │   ├── backgrounds.ts       # خلفيات الفيديو
│   │   ├── athkar.ts            # الأذكار
│   │   └── pexels*.ts           # خلفيات مولدة
│   ├── store/
│   │   └── useEditor.tsx        # حالة التطبيق
│   └── remotion/
│       └── VideoComposition.tsx # تأثيرات الفيديو
├── open-next.config.ts          # إعدادات Cloudflare
├── wrangler.jsonc               # إعدادات Cloudflare Worker
└── project-knowledge.md         # هذا الملف
```

---

## 🎯 الصفحات والمسارات

| المسار | المكون | الوصف |
|---|---|---|
| `/` | MushafChoice | شاشة اختيار المصحف |
| `/mushaf` | Mushaf | قراءة القرآن بالآيات |
| `/mushaf-full` | DigitalMushaf | المصحف كامل بالصفحات |
| `/mushaf-tafseer` | DigitalMushaf | المصحف مع التفسير |
| `/daily` | DailyHub | الأذكار والسبحة والتحديات |
| `/library` | AudioLibrary | المكتبة الصوتية |
| `/prayers` | PrayerTimes | مواقيت الصلاة والقبلة |
| `/video` | VideoPreview + Controls | استوديو الفيديو |
| `/rank` | Leaderboard | لوحة الشرف |
| `/admin` | AdminPanel | لوحة تحكم المشرف |
| `/showcase` | CommunityShowcase | أعمال المستخدمين |
| `/profile` | ProfileModal | الملف الشخصي |

---

## 🔐 نظام المصادقة (AuthGate.tsx)
- **تسجيل الدخول**: إيميل/كلمة سر + Google Sign-In
- **نسيان كلمة السر**: رقم هاتف → OTP → تعيين كلمة سر جديدة
- **حساب جديد**: إيميل + اسم + هاتف + دولة + جنس + صورة → OTP → حساب في Firestore
- **Firebase Auth**: يدير الجلسات
- **Firestore**: `users/{uid}` يحتوي: الاسم، النقاط، الخطة، الإعدادات

---

## ⭐ نظام النقاط (src/lib/points.ts)

| النشاط | الحد اليومي | الشرح |
|---|---|---|
| قراءة قرآن | 100 نقطة | كل آية = 1 نقطة مع مؤقت |
| أذكار | 200 نقطة | كل ذكر = 0.5 نقطة |
| استماع | 200 نقطة | كل آية = 1 نقطة |
| فيديو | 100 نقطة | كل فيديو = 5 نقاط |
| استغفار | 1000 نقطة | كل استغفارة = 0.1 نقطة |
| صلاة على النبي | 1000 نقطة | كل صلاة = 0.1 نقطة |
| بونص | 1000 نقطة | مكافأة عامة |

**مكافحة الغش**: حد 1 ثانية بين كل نشاط + حد يومي في localStorage + مؤقت لقياس وقت القراءة الحقيقي

### حساب النقاط (تقريبي):
- **ختمة قرآن كاملة** (604 صفحات × ~15 آية = 9,060 آية): **15,000 - 25,000 نقطة**
- **ختمة DailyHub (أذكار + استغفار + صلاة)** يومياً: **1,500 - 2,500 نقطة/يوم**
- **شهر كامل من DailyHub**: 45,000 - 75,000 نقطة
- **سنة كاملة من DailyHub + قرآن**: 200,000 - 400,000+ نقطة

---

## 🎬 استوديو الفيديو (Remotion)
- **دقة**: 1080×1920 عمودي (30 إطار/ثانية)
- **مصادر الخلفيات**:
  1. مكتبة داخلية (100+ صورة/فيديو من Pexels)
  2. بحث Pexels (API Proxy)
  3. تدرجات وألوان صلبة
- **القراء**: 50+ قارئ مع روابط صوت حسب الآية
- **الخطوط العربية**: Amiri, Noto Naskh, Scheherazade New, Lateef, Cairo, Tajawal
- **الأنيميشن**: Fade, Slide, Zoom, Typewriter, Shine, Glow, Scale, Wave, Flip, Blur-in
- **الفلاتر**: 25+ فلتر (Vintage, Cool, Warm, B&W, Dramatic, Blur, Midnight, Oceanic, Sepia, Cinematic, Golden...)
- **تأثيرات**: صور متراكبة، جسيمات، موجة صوتية متحركة
- **التصدير**: متصفح (canvas + MediaRecorder) + سيرفر (Remotion + sharp)

---

## 🤖 الشات بوت الذكي (ChatBot.tsx + ml-model.ts)
- **محرك محلي**: TF-IDF + Cosine Similarity
  - 30+ فئة (تحيات، مطور، صفحات الموقع، نقاط، فيديو، صلاة، قرآن...)
  - سرعة التصنيف: <1ms
- **Fallback**: Gemini API أو GPT API
- **الميزات**: تحليل المشاعر، كشف الكلمات السيئة، تسجيل المحادثات في Firestore
- **الواجهة**: فقاعة عائمة، سجل محادثات، مؤشر كتابة، اقتراحات سريعة

### كيف يعمل:
1. المستخدم يكتب رسالة
2. يتم تحويل النص إلى TF-IDF Vector
3. يقارن مع المتجهات المدربة (Cosine Similarity)
4. إذا الثقة > 0.5 → رد محلي مخصص
5. إذا الثقة ≤ 0.5 → استدعاء Gemini API
6. يتم تسجيل المحادثة في Firestore (chat_logs)

### قدرات الشات بوت:
- الإجابة عن القرآن والسنة
- شرح ميزات الموقع
- المساعدة في الفيديو
- معلومات عن النقاط واللوائح
- حل مشاكل تقنية
- محادثة ودية بالعامية والفصحى
- تفسير الآيات
- مواقيت الصلاة
- معلومات عن القراء

---

## 🕌 الصلوات (PrayerTimes.tsx + prayerCalendar.ts)
- **مصدر البيانات**: AlAdhan API (api.aladhan.com)
- **طريقة الحساب**: 5 (Muslim World League)
- **التخزين المؤقت**: سنة كاملة في localStorage (prayer_year_calendar_v22)
- **الميزات**:
  - عرض الوقت الحالي
  - عد تنازلي للصلاة القادمة مع شريط تقدم
  - تقويم سنوي
  - تحديد الموقع (GPS أو يدوي)
  - إشعارات لكل صلاة (مع أذان)
  - إعدادات إشعارات مخصصة

---

## 📿 الأذكار (DailyHub.tsx + athkar.ts)

### أذكار الصباح:
- آية الكرسي
- سورة الإخلاص + الفلق + الناس (3 مرات)
- سورة الفاتحة
- اللهم بك أصبحنا...
- سبحان الله وبحمده (100 مرة)
- لا إله إلا الله وحده لا شريك له
- وغيرها (مجموعة كاملة من حصن المسلم)

### أذكار المساء:
- نفس الأذكار مع صيغة "أمسينا" بدل "أصبحنا"
- أذكار النوم والاستيقاظ

### السبحة الذكية:
- عداد استغفار (بمقاومة النقر السريع)
- عداد صلاة على النبي
- كل نقرة محسوبة بدقة (anti-spam)

---

## 🏆 لوحة الشرف (Leaderboard.tsx)
- **تصنيف عالمي** حسب النقاط
- **تصفية حسب الدولة**
- يتم تحديثها مباشرة من Firestore
- تعرض: الترتيب، الاسم، الدولة، النقاط، الإنجازات

---

## 🎵 المكتبة الصوتية (AudioLibrary.tsx)
- **عدد القراء**: 50+ قارئ
- **طريقة التشغيل**: كل آية على حدة مع مؤقت
- **ذاكرة مفضلات**: حفظ السور المفضلة
- **مصادر الصوت**:
  - EveryAyah API (everyayah.com)
  - mp3quran.net (خادع احتياطية)
- **ميزات**: تحكم في السرعة، تكرار، قائمة تشغيل، Media Session API

---

## 👨‍💼 لوحة المشرف (AdminPanel.tsx)

### الأقسام:
1. **Dashboard** - إحصائيات عامة
2. **Push Notifications** - إشعارات للجميع/مستخدمين محددين
3. **User Management** - إدارة المستخدمين (بحث، حظر، تصدير)
4. **Subscriptions** - إدارة الاشتراكات والخطط
5. **Quests** - إنشاء وإدارة التحديات
6. **App Settings** - إعدادات التطبيق العامة
7. **Showcase** - إدارة أعمال المستخدمين
8. **Reports** - تقارير المستخدمين
9. **User Activity** - سجل النشاطات
10. **Support** - تذاكر الدعم
11. **Campaigns** - الحملات التسويقية
12. **Alerts** - التنبيهات داخل التطبيق
13. **Content Management** - إدارة المحتوى
14. **Chatbot Analytics** - تحليلات الشات بوت
15. **Performance** - أداء التطبيق

---

## 💳 نظام الاشتراكات

| الخطة | السعر | التصيير | الميزات |
|---|---|---|---|
| **مجاني** | 0 | 5 فيديوهات | الميزات الأساسية |
| **مبتدئ (Starter)** | - | 50 فيديو | مميزات إضافية |
| **ممتاز (Premium)** | - | غير محدود | كل الميزات |
| **Auto-Upgrade** | مجاني | غير محدود | عند 10,000 نقطة |

---

## 📡 APIs خارجية

| API | الاستخدام |
|---|---|
| **AlAdhan** (`api.aladhan.com`) | مواقيت الصلاة |
| **Pexels** (`api.pexels.com`) | صور وفيديوهات خلفية |
| **Quran.com v4** | بحث وتفسير وترجمة |
| **EveryAyah** (`everyayah.com`) | ملفات صوتية حسب الآية |
| **mp3quran.net** | ملفات صوتية احتياطية |
| **Hisn Muslim** (`www.hisnmuslim.com/api/ar/`) | الأذكار |
| **DiceBear** (`api.dicebear.com`) | صور شخصية |
| **jsDelivr CDN** | بيانات السور (JSON) |
| **Gemini API** | شات بوت (fallback) |
| **Firebase** | قاعدة بيانات + مصادقة + إشعارات |

---

## 📊 قاعدة بيانات Firestore

### المجموعات:
- `users/{uid}` - بيانات المستخدمين
- `chat_logs/{id}` - سجل المحادثات
- `subscriptions/{id}` - الاشتراكات
- `quests/{id}` - التحديات
- `settings/{id}` - إعدادات التطبيق
- `showcase/{id}` - أعمال المستخدمين
- `campaigns/{id}` - الحملات
- `alerts/{id}` - التنبيهات
- `activity_log/{id}` - سجل النشاطات
- `support_tickets/{id}` - تذاكر الدعم
- `reports/{id}` - التقارير
- `notifications/{id}` - الإشعارات

### Firebase Security Rules المطلوبة:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // المستخدمين
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
      allow delete: if request.auth != null && request.auth.token.isAdmin == true;
    }
    
    // سجل المحادثات
    match /chat_logs/{docId} {
      allow read, write: if request.auth != null;
    }
    
    // الاشتراكات
    match /subscriptions/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.token.isAdmin == true || request.auth.uid == docId);
    }
    
    // التحديات
    match /quests/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.isAdmin == true;
    }
    
    // إعدادات التطبيق
    match /settings/{docId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.isAdmin == true;
    }
    
    // أعمال المستخدمين
    match /showcase/{docId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (request.auth.token.isAdmin == true || request.resource.data.userId == request.auth.uid);
    }
    
    // الحملات والإشعارات
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.isAdmin == true;
    }
  }
}
```

---

## ⚙️ Cloudflare / OpenNext
- **Build**: `npx @opennextjs/cloudflare build`
- **Worker**: `uuu12` على Cloudflare
- **الحد**: 10MB للـ Worker Script (Free Plan)
- **الحل**: `api/` folder منفصل يستضاف على Railway/Render/VPS
- الـ Frontend (الجزء الثابت) يشتغل على Cloudflare أو Vercel

---

## 🔑 المتغيرات البيئية المطلوبة (for local development)

### `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-xxx

FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=xxx@gmail.com
SMTP_PASS=xxx
GEMINI_API_KEY=xxx
PEXELS_API_KEY=xxx
```

---

## 🚀 أوامر التشغيل

| الأمر | الوصف |
|---|---|
| `npm run dev` | تشغيل محلي (Next.js) |
| `npm run build` | بناء OpenNext لـ Cloudflare |
| `npm run build:next` | بناء Next.js عادي |
| `npm run build:app` | بناء لتطبيق أندرويد (Capacitor) |
| `npm run start` | تشغيل الإنتاج محلياً |
| `npm run lint` | فحص الأخطاء |
| `npm run test` | اختبارات (Jest) |
| `node api/chatbot-server.js` | تشغيل API منفصل (على Railway/Render) |
