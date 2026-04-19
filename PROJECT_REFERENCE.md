# 📚 الدليل المعماري والهندسي الشامل لمشروع (Quran-main)
**الإصدار: 3.0 - The Ultimate Cinematic Update (2026)**

هذا الملف هو المرجع المركزي النهائي للمشروع. تم تحديثه ليشمل جميع التعديلات الحديثة في محرك الفيديو (Remotion) ونظام المصحف الرقمي (Digital Mushaf) وخوارزميات الرندرة السحابية.

---

## ⚙️ 1. فلسفة المشروع (Project Philosophy & Stack)

المشروع هو **"استوديو إنتاج قرآني متكامل"** يجمع بين تجربة القراءة الفاخرة وأدوات صناعة المحتوى.

### 🛠️ **الحزمة التقنية المحدثة (Modern Tech Stack):**
1. **Next.js 16 (App Router):** الهيكل الأساسي مع دعم React 19.
2. **Tailwind CSS 4:** نظام التصميم المبني على المتغيرات CSS Variables لسرعة استجابة مذهلة.
3. **Zustand (Global State):** إدارة حالة المحرر في `useEditor.tsx` مع دعم الـ Persistence (تخزين الإعدادات تلقائياً).
4. **Remotion 4.0:** محرك الفيديو الأساسي. تم تحويله من نظام الرندرة المتسلسل إلى نظام **"التجميع الذكي للفريمات"**.
5. **Express & FFmpeg (Still-plus-FFmpeg Architecture):** ابتكار تقني يسمح برندرة فيديوهات 1080p في ثوانٍ معدودة عبر دمج صور ثابتة مع ملفات الصوت برمجياً بدلاً من رندرة آلاف الإطارات.

---

## 📂 2. تفاصيل المكونات والمنطق (Deep Component Logic)

### 🔵 2.1. محرك الفيديو (`src/remotion/VideoComposition.tsx`)
تم تطوير هذا الجزء ليكون "مرن العضلات" (Fluid Motion Engine):
- **نظام الطبقات (Layering):**
    - **الخلفية:** دعم الفيديوهات والصور مع فلاتر CSS (Dynamic Gradients, Blur, Sepia).
    - **Overlays:** نظام ذرات الغبار (Dust Particles)، أشعة الضوء (Light Rays)، والبوكيه (Bokeh) وكلها "Animated via CSS Keyframes".
    - **تأثير الجليتش (Glitch):** حركة عشوائية للإحداثيات والشفافية لإضفاء طابع سينمائي.
- **منطق الـ VerseComponent:**
    - يستخدم `interpolate` و `Easing` لخلق حركات دخول ناعمة (Bounce, Flip, Scale, Blur, Slide).
    - **التمركز الرباعي:** يضمن ثبات النص في المنتصف مهما كان حجم الفريم (`box-sizing: border-box`).
    - **Vertical Offset:** منزلق تحكم دقيق يسمح بتحريك النص رأسياً لتجنب تغطية أجزاء هامة من الخلفية.

### 🟠 2.2. المصحف الرقمي الفاخر (`src/components/DigitalMushaf.tsx`)
تحول من مجرد عارض نصوص إلى تجربة "Premium Library":
- **التحجيم الديناميكي (Dynamic Scaling):** التحكم في `mushafFontSize` يسمح بتكبير الخط (الآيات، البسملة، والزخارف) في وقت واحد دون كسر التصميم.
- **الهوية البصرية:**
    - **رمز الآية الثماني (Octagonal Symbol):** تصميم SVG دقيق يتمركز خلف رقم الآية.
    - **الأسماء الإلهية:** تلوين لفظ الجلالة (اللَّه) باللون الأحمر الياقوتي (`#cd4d4d`) تلقائياً.
    - **الصندوق الزخرفي للسورة:** شريط علوي فاخر يظهر عند بداية كل سورة.
- **نظام التصفح:** "Index Sidebar" مع بحث ذكي و "Fetch-on-scroll" (Lazy Loading) لضمان سلاسة التنقل بين 604 صفحة.

---

## 🌩️ 3. السيرفر السحابي (Still-plus-FFmpeg Mastermind)
ملف `render-server.mjs` يعمل الآن بمنطق "سرعة البرق":
1. **Initial Bundle:** يقوم بعمل Bundle للمشروع مرة واحدة فقط عند التشغيل لتسريع الطلبات اللاحقة.
2. **Verse Still Capture:** يقوم برندرة **إطار واحد فقط** لكل آية (المنتصف).
3. **FFmpeg Loop & Merge:** يقوم بصنع مقطع فيديو من الصورة الثابتة والصوت الخاص بالآية باستخدام FFmpeg (Ultrafast Preset)، ثم دمج المقاطع.
4. **Resiliency:** معالجة أخطاء الـ `Failed to fetch` وتنبيه المستخدم بوضع السيرفر (Sleeping Status).

---

## 📜 4. سجل التعديلات الملحمية (Chronicle of Major Modifications)

| التاريخ | الميزة / التعديل | التفاصيل التقنية |
| :--- | :--- | :--- |
| **2026-04-19** | **Logic Fix (state error)** | إصلاح خطأ `state is not defined` في المصحف عبر استدعاء صحيح لـ `useEditor`. |
| **2026-04-19** | **Visual Overlays** | إضافة Dust, Light Rays, Bokeh كطبقات CSS Animation فوق الفيديو. |
| **2026-04-19** | **Centered Rendering** | إعادة بناء `VerseComponent` لضمان التوسيط المطلق (Absolute Centering) ومنع انحراف النص. |
| **2026-04-18** | **Reciter Mapping** | بناء نظام مطابقة آلي بين كود الشيخ في التطبيق و IDs موقع Quran.com لضمان روابط صوتية سليمة. |
| **2026-04-18** | **Hyper-Render** | إطلاق معمارية Capture-Still-to-FFmpeg التي قللت وقت الحرق (Render Time) بنسبة 80%. |
| **2026-04-17** | **Font Mastery** | إضافة نظام السُمك الوصفي ونظام الخطوط المتعددة (Amiri, Noto, Cairo, Tajawal). |

---

## 🛡️ 5. ميثاق التطوير (Developer & AI Commandments)

**يجب اتباع هذه القواعد بصرامة عند إجراء أي تعديل مستقبلي:**

1. **لا تكسر التوسيط:** أي تغيير في هوامش (Padding) أو (Gap) في `VideoComposition.tsx` يجب أن يختبر على شاشات الموبايل والديسكتوب لضمان بقاء النص "Dead Center".
2. **سيرفر الرندرة مقدس:** أي تعديل في `src/remotion/` يجب أن يكون متوافقاً مع `render-server.mjs`. تذكر أن السيرفر السحابي لا يقرأ مجلد الـ `public` المحلي بنفس الطريقة؛ استخدم `resolveMedia` دائماً.
3. **أكواد المشايخ:** إذا توقف صوت قارئ معين، ابحث أولاً في `quranUtils.ts` عن نمط الروابط. لا تعدل الواجهة (UI) لحل مشكلة "404 Audio Error".
4. **تجنب Tailwind في Remotion:** استخدم دائماً `Style Objects` داخل مكونات الفيديو لضمان أن محرك الرندرة في الخادم (Chromium/Puppeteer) يراها بوضوح.
5. **نظام الزجاج (Glassmorphism):** حافظ على `bg-white/10 backdrop-blur-2xl border-white/20` عند إضافة أي مودال أو واجهة جديدة.

---
**تم تحديث هذا المرجع بواسطة Antigravity (Advanced Coding Agent) لضمان استمرارية الإبداع البرمجي.**
