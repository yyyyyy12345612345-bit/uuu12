# خريطة وهيكلية مشروع يقين القرآن | Yaqeen AlQuran - Project Map & Architecture

يحتوي هذا الملف على تفصيل كامل لهيكلية ملفات المشروع، وظيفة كل ملف، وأهم الدوال (Functions) المدمجة فيه، لتكون دليلاً ومرجعاً شاملاً للمطور.

---

## 📁 شجرة مجلدات وملفات المشروع (Folder Tree)

```text
Quran-main/
├── firestore.rules                     # قواعد الحماية والأمان الخاصة بقاعدة بيانات Firestore
├── reports/                            # مجلد تقارير الإنجازات اليومية والتعديلات
│   └── 2026-07-08.md                   # تقرير إنجازات وتعديلات اليوم
├── src/
│   ├── app/                            # مجلد التطبيق الرئيسي (Next.js App Router)
│   │   ├── admin/
│   │   │   └── page.tsx                # صفحة لوحة تحكم المشرف الفرعية
│   │   ├── api/                        # مسارات واجهة الخلفية (Backend API Routes)
│   │   │   ├── auth/tiktok/            # مسارات ربط حساب تيك توك ومصادقة الـ OAuth
│   │   │   │   ├── callback/route.ts
│   │   │   │   └── route.ts
│   │   │   ├── chat/route.ts           # مسار الذكاء الاصطناعي شات بوت Gemini
│   │   │   ├── pexels/route.ts         # جلب خلفيات وصور Pexels
│   │   │   ├── prayer-calendar/route.ts # مواقيت الصلاة والتقويم
│   │   │   ├── render/route.ts         # مسار رندرة وتصيير فيديوهات Remotion
│   │   │   ├── send-otp/route.ts       # إرسال أكواد التحقق (OTP) عبر SMTP
│   │   │   ├── tiktok/                 # النشر التلقائي ومجدول التيك توك
│   │   │   │   ├── accounts/route.ts
│   │   │   │   ├── cron/route.ts
│   │   │   │   └── publish/route.ts
│   │   │   └── verify-token/route.ts   # التحقق من كود الـ OTP
│   │   ├── layout.tsx                  # الهيكل البنائي العام للموقع (Root Layout)
│   │   └── page.tsx                    # الصفحة الرئيسية (CatchAll Route)
│   ├── components/                     # المكونات الرسومية للواجهة (UI Components)
│   │   ├── AdminPanel.tsx              # اللوحة الرئيسية لإدارة الموقع
│   │   ├── admin/                      # المكونات المعزولة والخطافات للوحة التحكم
│   │   │   ├── AdminPanel.types.ts     # الواجهات والأنواع البرمجية المشتركة للأدمن
│   │   │   ├── social/                 # وحدة إدارة السوشيال ميديا وتيك توك
│   │   │   │   ├── ScheduledJobsList.tsx
│   │   │   │   ├── SocialManagerPanel.tsx
│   │   │   │   ├── TikTokAccountList.tsx
│   │   │   │   └── useSocialAdmin.ts
│   │   │   └── tasks/                  # وحدة التحديات اليومية والإعلانات
│   │   │       ├── DailyChallengeForm.tsx
│   │   │       ├── PushNotificationSender.tsx
│   │   │       ├── TasksManagerPanel.tsx
│   │   │       └── useTasksAdmin.ts
│   │   ├── AppSettingsModal.tsx        # نافذة إعدادات التطبيق
│   │   ├── AudioLibrary.tsx            # شاشة الاستماع والمكتبة الصوتية
│   │   ├── AuthGate.tsx                # بوابة التسجيل وتأكيد الحساب (OTP)
│   │   ├── CatchAllPageClient.tsx      # الموجه والموزع الرئيسي للصفحات (SPA Controller)
│   │   ├── ChatBot.tsx                 # نافذة الشات بوت الذكي
│   │   ├── CommunityShowcase.tsx       # معرض المبدعين لعرض فيديوهات المستخدمين
│   │   ├── Controls.tsx                # لوحة تعديل وتصميم فيديو تلاوة القرآن
│   │   ├── DailyHub.tsx                # شاشة الأذكار، السبحة الإلكترونية والتحديات
│   │   ├── DigitalMushaf.tsx           # شاشة المصحف الورقي (صفحات كاملة مع التفسير)
│   │   ├── FeedbackModal.tsx           # نافذة إرسال الآراء والمقترحات
│   │   ├── GlobalMenu.tsx              # القائمة الجانبية للتطبيق
│   │   ├── Leaderboard.tsx             # لوحة شرف المتصدرين والتحديات الودية
│   │   ├── Mushaf.tsx                  # شاشة قراءة القرآن التفاعلية (آية بآية)
│   │   ├── Navigation.tsx              # شريط التنقل السفلي المخصص للموبايل والويب
│   │   ├── OnboardingOverlay.tsx       # الشرح الترحيبي والتعليمي للمستخدم الجديد
│   │   ├── ProfileModal.tsx            # الملف الشخصي وإدارة الأصدقاء وحظر المستخدمين
│   │   ├── QiblaCompass.tsx            # شاشة بوصلة تحديد اتجاه القبلة
│   │   ├── ReflectionCardGenerator.tsx # مولد بطاقات التأملات والآيات للنشر كصور
│   │   ├── RenderModal.tsx             # نافذة رندرة وتنزيل ونشر الفيديو التلقائي
│   │   ├── SubscriptionModal.tsx       # نافذة ترقية الاشتراكات وتأكيد الإيصالات
│   │   ├── TimelineVideoEditor.tsx     # محرر التوقيت والآيات لصناعة الفيديوهات
│   │   └── VideoPreview.tsx            # نافذة العرض المتفاعل لمونتاج الفيديو
│   ├── lib/                            # مكتبات الدوال المساعدة والمشتركة
│   │   ├── firebase.ts                 # إعداد واتصال فايربيس للعميل
│   │   ├── firebaseAdmin.ts            # إعداد واتصال فايربيس للخدمات الخلفية
│   │   ├── navigation.ts               # خطاف إدارة صفحات الـ SPA
│   │   ├── points.ts                   # محرك حساب النقاط ومكافحة التلاعب والغش
│   │   ├── ml-model.ts                 # نموذج الذكاء الاصطناعي المحلي (TF-IDF)
│   │   └── quranUtils.ts               # أدوات مساعدة للقرآن (أرقام الآيات، الروابط)
│   ├── store/                          # مستودعات إدارة الحالة (State Management)
│   │   └── useEditor.tsx               # مستودع حفظ إعدادات وتهيئة محرر الفيديو
│   └── remotion/                       # خادم تصيير Remotion
│       └── VideoComposition.tsx        # مكون تركيب طبقات الفيديو والنصوص والتأثيرات
```

---

## ⚙️ تفصيل وظائف الملفات وأهم الدوال البرمجية (File Details & Functions)

### 📂 المكونات الرئيسية والتحكم بالصفحات

#### 1. [CatchAllPageClient.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/CatchAllPageClient.tsx)
* **الوظيفة**: المكون الرئيسي المسؤول عن قراءة المسار (URL) ورندرة الصفحة المقابلة في نظام الـ SPA (تجنب إعادة تحميل الصفحة بالكامل).
* **أهم الدوال**:
  * رندرة مشروطة للمكونات بناءً على `activeTab` المخزن بالـ State.

#### 2. [AuthGate.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/AuthGate.tsx)
* **الوظيفة**: إدارة شاشات تسجيل الدخول، إنشاء حساب جديد، وإصلاح وتأكيد الجلسات عبر البريد الإلكتروني ورموز OTP.
* **أهم الدوال**:
  * `handleSendOTP()`: استدعاء API إرسال رمز التحقق للبريد.
  * `handleVerifyOTP()`: التحقق من صحة الكود وفتح الجلسة وتسجيل بيانات العميل.
  * `signInWithGoogle()`: تسجيل الدخول السريع عبر قوقل.

---

### 🎬 محرك صناعة الفيديو وتصييره (Video Composition & Editor)

#### 1. [TimelineVideoEditor.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/TimelineVideoEditor.tsx)
* **الوظيفة**: محرر زمني يسمح بتحديد الآية وضبط توقيت الكلمات وتحديد الخطوط واختيار القوالب.
* **أهم الدوال**:
  * `adjustWordTiming()`: ضبط توقيت نطق كلمة محددة مع صوت القارئ.
  * `handleTemplateChange()`: تبديل قالب تصميم مشغل الفيديو بالكامل.

#### 2. [VideoPreview.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/VideoPreview.tsx)
* **الوظيفة**: عرض معاينة فورية وحية لشكل الفيديو النهائي مع معالجة تأثيرات الرسوم المتحركة والفلاتر (الضباب، الثلج، المطر، تسريب الإضاءة).
* **أهم الدوال**:
  * `getFilterCSS()`: توليد قيم فلاتر CSS بشكل موحد ومطابق لمخرجات رندرة السيرفر.
  * `renderOverlayEffects()`: تشغيل تأثيرات الجو الحركية كـ Canvas أو طبقات إضافية.

#### 3. [RenderModal.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/RenderModal.tsx)
* **الوظيفة**: إطلاق عملية الرندرة على السيرفر ومتابعة التقدم (Progress)، ومنح رابط التحميل ونشر الفيديو لـ TikTok و Instagram.
* **أهم الدوال**:
  * `handleStartRender()`: إرسال الطلب لـ API الرندرة والبدء في استقصاء الحالة (Polling).
  * `handlePublishToTikTok()`: نشر الفيديو المنتهى فوراً إلى تيك توك وسيناريو Make.com.
  * *تحديث تلقائي*: يتم قيد الفيديو المنتهى في معرض `showcase` مباشرة بعد النشر.

#### 4. [VideoComposition.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/remotion/VideoComposition.tsx)
* **الوظيفة**: كود التركيب والدمج الخاص بمكتبة Remotion الذي يعمل على خادم تصيير السيرفر لتركيب الفلاتر والنصوص والصوتيات وتصدير ملف الـ MP4 النهائي.

---

### 👨‍💼 لوحة المشرف ولوحات الإدارة الفرعية (Admin Dashboard)

#### 1. [AdminPanel.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/AdminPanel.tsx)
* **الوظيفة**: لوحة المراقبة والإشراف للتحكم بالصيانة، مراجعة اشتراكات الأعضاء، إدارة بيانات المستخدمين، واستعراض إحصائيات التطبيق.

#### 2. [useSocialAdmin.ts](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/admin/social/useSocialAdmin.ts)
* **الوظيفة**: الخطاف البرمجي المخصص لإدارة ربط قنوات تيك توك وسجلات وجدولة المنشورات.
* **أهم الدوال**:
  * `connectTikTokAccount()`: فتح نافذة OAuth للمصادقة وتخزين رموز الوصول بقاعدة البيانات.
  * `retryPublish()`: إعادة تشغيل طلب نشر فاشل.
  * `fetchAnalytics()`: جلب تحديثات المشاهدات والنشاط للفيديوهات المنشورة.

#### 3. [useTasksAdmin.ts](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/admin/tasks/useTasksAdmin.ts)
* **الوظيفة**: خطاف مخصص لإدارة التحديات اليومية وإرسال الإشعارات.
* **أهم الدوال**:
  * `createDailyChallenge()`: إضافة مهمة يومية جديدة بمتطلبات ونقاط معينة.
  * `sendFcmNotification()`: صياغة تنبيه فوري وإرساله عبر خادم FCM لجميع مستخدمي أندرويد والويب.

---

### 📱 ميزات التطبيق الأساسية (Core Features)

#### 1. [DigitalMushaf.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/DigitalMushaf.tsx)
* **الوظيفة**: عرض صفحات المصحف الشريف بتنسيق ورقي مع إمكانية التكبير والتصفح المتفاعل وعرض التفسير لكل آية عند الضغط عليها.

#### 2. [AudioLibrary.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/AudioLibrary.tsx)
* **الوظيفة**: مشغل صوتيات متقدم يحتوي على تلاوات لأكثر من 50 قارئاً، مع إمكانية تحديد آية معينة أو تكرار الآية أو تشغيل مستمر.

#### 3. [DailyHub.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/DailyHub.tsx)
* **الوظيفة**: واجهة الأذكار اليومية (الصباح والمساء، أذكار الصلاة) مع سبحة إلكترونية رقمية وعدادات للأذكار اليومية، واستعراض التحديات وحالتها.

#### 4. [Leaderboard.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/Leaderboard.tsx)
* **الوظيفة**: شاشة المتصدرين بناءً على مجموع النقاط الأسبوعي والشهري، وإتاحة ميزة التحديات الثنائية والمنافسات بين الأصدقاء.
* **أهم الدوال**:
  * `handleAcceptDuel()` / `handleRejectDuel()`: إدارة وحذف تحديات الأصدقاء بقاعدة البيانات.

#### 5. [QiblaCompass.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/QiblaCompass.tsx)
* **الوظيفة**: الاستعانة بمستشعرات الجهاز الجيروسكوبية و نظام الملاحة (GPS) لحساب وعرض اتجاه القبلة الدقيق بالنسبة للكعبة المشرفة.

---

### 📂 مكتبات الخلفية والـ API (Backend Routes)

* **[route.ts (Publish TikTok)](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/app/api/tiktok/publish/route.ts)**:
  * يحتوي منطق تصنيف النشر:
    * **Option A**: إذا كان الحساب المستهدف هو `"make_com"`، يقوم بتحويل الطلب لويب هوك Make.com.
    * **Option B**: إذا كان حساباً مربوطاً، يتم معالجة الرفع مجزأً (Chunk Uploader) باستخدام الـ API الرسمي لتيك توك وتجديد رموز الوصول آلياً.
* **[route.ts (Cron TikTok)](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/app/api/tiktok/cron/route.ts)**:
  * يتم استدعاؤه دورياً للتحقق من المنشورات المجدولة ورفعها وتحديث إحصائيات المشاهدات والتفاعل للحسابات المنشورة.
* **[route.ts (OTP send)](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/app/api/send-otp/route.ts)**:
  * يولد رمزاً عشوائياً (6 أرقام)، ويقوم بتدوير وتغيير حساب الإيميل SMTP لضمان عدم تخطي الحدود اليومية وتجاوز سعة الإرسال المسموحة للبريد.

---

## 🔒 قواعد وأمان Firestore (`firestore.rules`)

تدير القواعد الصلاحيات بدقة عالية:
* `/users/{userId}`: يقرأ الجميع (لمتصدرين لوحة الشرف)، ويكتب صاحب الحساب فقط أو الأدمن.
* `/settings/{document=**}`: يقرأ الجميع الإعدادات العامة للأسعار والتصيير، ويكتب المشرف فقط.
* `/tiktok_accounts/` و `/tiktok_jobs/` و `/tiktok_logs/`: صلاحية القراءة والكتابة بالكامل حصرية فقط للمشرف الحقيقي للتحكم بحسابات النشر والتتبع.
