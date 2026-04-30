# 💎 الدليل التقني المطلق لمشروع القرآن الكريم (v3.0 Ultra)

هذا هو المرجع النهائي والشامل لكل تفصيلة تقنية وبرمجية في المشروع. تم إعداده ليكون المرجع الأول للمطور والمدير.

---

## 🚀 1. دليل النشر والتشغيل (Deployment Guide)

### أ- استضافة الموقع (Vercel)
- **الموقع:** يتم رفعه على Vercel لضمان سرعة الـ Next.js.
- **الأوامر:** `npm run build` ثم `npm run start`.
- **ملاحظة:** تأكد من إعداد `vercel.json` للسماح بالـ CORS.

### ب- سيرفر الرندرة (Hugging Face)
- **النوع:** Docker أو Node.js Space.
- **المتطلبات:** يحتاج لـ FFmpeg مثبت في النظام.
- **التشغيل:** يتم تشغيل `node render-server.mjs`.

### ج- روابط التحميل (Netlify)
- تُستخدم لاستضافة ملفات الـ APK الكبيرة والـ `version.json` لضمان سرعة التحميل للمستخدمين.

---

## 🖥️ 2. محرك الرندرة السينمائي (Deep Dive)

### دالة توليد الـ SVG (تصميم الآية)
هذا هو الكود الذي يصنع الجمالية التي تراها في الفيديو:
```javascript
// الموقع: render-server.mjs
function createVerseSvg(verse) {
  return `
    <svg ...>
      <style>
        .v { font-family: 'Amiri'; font-size: 72px; fill: #ffffff; }
        .t { font-size: 40px; fill: #cccccc; }
      </style>
      <text class="v">${verse.text}</text>
      <text class="t">${verse.translation}</text>
    </svg>
  `;
}
```

### معالجة الـ FFmpeg (الدمج النهائي)
الأمر الذي يجمع الصوت والصورة والخلفية:
```bash
ffmpeg -loop 1 -t [duration] -i background.jpg \
       -f concat -safe 0 -i frames.txt \
       -i audio.mp3 \
       -filter_complex "[0:v][1:v]overlay=format=auto[v]" \
       -map "[v]" -map 2:a -c:v libx264 -preset ultrafast -y output.mp4
```

---

## 🔐 3. المتغيرات والبيانات الحساسة (Environment)

| المفتاح | الوظيفة | الموقع |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | الاتصال بـ Firebase | `.env.local` |
| `RENDER_SERVER_URL` | رابط سيرفر Hugging Face | `src/app/api/render/route.ts` |
| `MAX_CONCURRENT_RENDERS` | أقصى عدد فيديوهات في نفس الوقت | `render-server.mjs` |

---

## 🏆 4. نظام النقاط والتحفيز (Gamification Logic)

### توزيع النقاط (Points Allocation):
- **قراءة آية:** 10 نقاط.
- **قراءة صفحة كاملة:** 100 نقطة.
- **الاستماع لمدة دقيقة:** 20 نقطة.
- **التسبيح (دورة كاملة):** 50 نقطة.

### كود حساب الرتبة (Ranking System):
```typescript
// الموقع: src/lib/points.ts
export function getRankInfo(points) {
  if (points >= 10000) return { title: "خاتم", color: "#FFD700" };
  if (points >= 5000) return { title: "حافظ", color: "#C0C0C0" };
  return { title: "قارئ", color: "#CD7F32" };
}
```

---

## 🔔 5. نظام التنبيهات والإعلانات (Global UI)

### الإعلان الإجباري (Forced Overlay):
يتم التحكم به عبر Firestore. الـ `AppInitializer` يقوم بعمل `onSnapshot` للاستماع للتغييرات لحظياً.
- **الحقول:**
  - `mandatoryAnnouncement`: نص الرسالة.
  - `mandatoryDuration`: المدة بالثواني (Default: 60).
  - `announcementId`: لتغيير الرسالة وإظهارها مجدداً لمن رأى القديمة.

---

## 🛠️ 6. صيانة أندرويد (Android Maintenance)

### تغيير الأيقونات:
يتم وضع الأيقونات الجديدة في `android/app/src/main/res` في مجلدات `mipmap`.
استخدم سكريبت `copy-icons.js` لأتمتة هذه العملية.

### تحديث النسخة (Bumping Version):
1. غير `versionName` في `build.gradle`.
2. غير `version` في `package.json`.
3. غير `version` في `public/version.json`.

---

## 🔍 7. حل المشكلات (Troubleshooting)

1. **السيرفر لا يعمل؟** 
   - تأكد من تثبيت `sharp` و `ffmpeg`.
2. **الفيديو يظهر أسود؟**
   - تأكد من أن رابط الخلفية (Background URL) يعمل ولا يعطي 404.
3. **النقاط لا تزيد؟**
   - تأكد من أن المستخدم مسجل دخوله (Auth Check) وأن الـ Firestore Rules تسمح بالكتابة.

---
*تم إنشاء هذا الدليل ليكون المرجع النهائي لمشروع القرآن الكريم v3.0 - Ultra*
*بواسطة: يوسف أسامة & Antigravity AI*
