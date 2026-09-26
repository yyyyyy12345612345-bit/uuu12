# 🛡️ تقرير الفحص الأمني الشامل والإصلاحات الفورية — منصة يقين القرآن
**تاريخ الفحص والإصلاح:** 26 سبتمبر 2026  
**النطاق المستهدف:** `https://yaqeenalquran.online` + سيرفر الرندر `https://yousef891238-render-server.hf.space` + Firebase Firestore

---

## 🔴 1. الثغرات الحرجة (تم إغلاقها بنجاح)

### 1️⃣ تسريب قاعدة بيانات المستخدمين كاملة (Firestore Users Leak)
* **المشكلة السابقة:** كانت القاعدة تسمح بالقراءة العامة:
  ```javascript
  match /users/{userId} {
    allow read: if true;
  }
  ```
  مما مكّن أي زائر عبر REST API من سحب بيانات جميع المستخدمين (إيميلات، هواتف، أسماء، وحتى كلمات المرور المشفرة بـ base64).
* **الإصلاح المطبق:**
  1. تعديل ملف [`firestore.rules`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/firestore.rules):
     ```javascript
     match /users/{userId} {
       allow read: if isOwner(userId) || isAdmin();
       allow create: if isOwner(userId);
       allow update, delete: if isOwner(userId) || isAdmin();
       match /{subCollection}/{document=**} {
         allow read: if isOwner(userId) || isAdmin();
         allow write: if isOwner(userId) || isAdmin();
       }
     }
     ```
  2. إنشاء مسار واجهة برمجة مخصصة ومفلترة [`src/app/api/leaderboard/route.ts`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/src/app/api/leaderboard/route.ts) تجلب المتصدرين للوحة الشرف عبر السيرفر مع حجب الإيميلات وأرقام الهواتف وكلمات المرور تماماً عن المتصفح.
  3. تحديث [`src/components/Leaderboard.tsx`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/src/components/Leaderboard.tsx) و [`src/components/SocialFeed.tsx`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/src/components/SocialFeed.tsx) للاعتماد على المسار الآمن.

---

### 2️⃣ خادم الرندر يعمل كـ Open Relay لـ Telegram Bot API (SSRF)
* **المشكلة السابقة:** كان النطاق `api.telegram.org` مضافاً لقائمة `ALLOWED_DOMAINS` في إعدادات السيرفر، مما يمكّن أي طرف خارجي من إرسال طلبات رندرة بروابط لبوتات تليجرام لسحب ملفات وسجلات خبيثة.
* **الإصلاح المطبق:**
  * حذف `api.telegram.org` نهائياً من `ALLOWED_DOMAINS` في كل من [`config.js`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/config.js) و [`files/config.js`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/files/config.js). السيرفر الآن يرفض أي رابط وارد من تليجرام في المدخلات.

---

### 3️⃣ اختراق أي حساب عبر استعادة كلمة المرور (Account Takeover Exploit)
* **المشكلة السابقة:** كان توكن استعادة كلمة المرور يُنشأ بـ Base64 غير مشفر وبدون تاريخ انتهاء، ويتضمن السري الداخلي `OTP_SECRET`، مما يسمح لأي شخص بإعادة تعيين كلمة مرور أي حساب فوراً دون كود OTP.
* **الإصلاح المطبق:**
  * إضافة دوال تشفير رقمي موقّعة بـ HMAC-SHA256 وتحديد صلاحية 15 دقيقة فقط في [`src/app/api/otp-store.ts`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/src/app/api/otp-store.ts) وربطها مع [`src/app/api/verify-otp/route.ts`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/src/app/api/verify-otp/route.ts) و [`src/app/api/reset-password/route.ts`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/src/app/api/reset-password/route.ts).

---

## 🟠 2. المشاكل العالية والمتوسطة (تم معالجتها)

### 4️⃣ تقييد سياسة CORS على ميكروسيرفس الرندر
* تم استبدال `app.use(cors())` المفتوح بالكامل في [`server.js`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/server.js) و [`files/server.js`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/files/server.js) بقائمة بيضاء صارمة محصورة في:
  * `https://yaqeenalquran.online`
  * `https://yaqeen-app.vercel.app`
  * `capacitor://localhost` (تطبيق الموبايل)
  * نطاقات التطوير المحلية.

### 5️⃣ إضافة رؤوس الأمان القياسية (Security Headers)
* تم إضافة الهيدرز العالمية في [`next.config.mjs`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/next.config.mjs):
  * `X-Frame-Options: SAMEORIGIN` (حماية من الـ Clickjacking).
  * `X-Content-Type-Options: nosniff` (حماية من الـ MIME Sniffing).
  * `Referrer-Policy: strict-origin-when-cross-origin`.
  * `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`.
  * `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` (إجبار HTTPS).

### 6️⃣ منع تسريب بنية السيرفر الداخلية عبر `/health`
* تم تنظيف رد مسار `/health` في [`files/server.js`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/files/server.js) ليقتصر فقط على `{ status: "ok" }` دون تسريب عدادات الذاكرة أو حالة الطوابير والـ replica.

### 7️⃣ إغلاق ثغرة الصلاحيات الإدارية `isAdmin()`
* تم إزالة التطابق العشوائي الخطير `matches("(?i).*youssef.*")` من [`firestore.rules`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/firestore.rules). أصبحت الصلاحيات الإدارية محصورة فقط بالإيميلات المعتمدة الرسمية (`youssefosama@gmail.com` و `youssef@yaqeen.app`) أو عبر الـ Custom Claims الرسمية (`token.admin == true`).

---

## 📋 الخطوة المتبقية للمشرف (مهم جداً)
الملف المحدث [`firestore.rules`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/firestore.rules) جاهز في الكود، ولتطبيقه على قاعدة البيانات الحية فوراً:
1. افتح **[Firebase Console](https://console.firebase.google.com)**.
2. اذهب إلى مشروعك: `yy10-ba274` ← **Firestore Database** ← تبويب **Rules**.
3. انسخ محتوى [`firestore.rules`](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/uuu12-main/uuu12-main/firestore.rules) وضعه هناك ثم اضغط **Publish**.
