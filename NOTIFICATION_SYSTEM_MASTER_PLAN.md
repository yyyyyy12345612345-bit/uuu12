# 🕌 دليل نظام الإشعارات الشامل (Eqra Notification System)

هذا المستند يشرح الخطط التقنية والأكواد البرمجية لنظام الإشعارات المزدوج في تطبيق القرآن الكريم.

---

## 1. الأهداف التقنية
* **الأذان أوفلاين:** ضمان عمل الأذان بدون إنترنت وبدقة عالية.
* **إشعارات Push:** إرسال رسائل إدارية وتذكيرية من لوحة التحكم لجميع المستخدمين.
* **الاعتمادية:** تخطي أنظمة توفير الطاقة في الأندرويد لضمان وصول التنبيهات.

---

## 2. الهندسة البرمجية (The Code)

### أ- نظام الأذان (Local Notifications)
يتم استخدام `@capacitor/local-notifications` لجدولة الأذان محلياً.

**الملف:** `src/lib/notifications.ts`
```typescript
// وظيفة جدولة الأذان لـ 30 يوم قادم
export async function schedulePrayerNotifications(times, settings) {
  const notifications = [];
  const now = new Date();

  for (let day = 0; day < 30; day++) {
    for (const key of ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']) {
      const scheduleDate = new Date(now);
      // حساب التاريخ والوقت بدقة مع الـ Offset
      notifications.push({
        id: (day * 10) + i,
        title: `🕌 موعد أذان ${key}`,
        body: 'حيّ على الصلاة.. حيّ على الفلاح',
        schedule: { at: scheduleDate, allowWhileIdle: true },
        sound: 'adhan.mp3', // ملف محلي في android/app/src/main/res/raw
        channelId: 'prayer-notifications'
      });
    }
  }
  await LocalNotifications.schedule({ notifications });
}
```

### ب- نظام الـ Push (FCM Service)
يتم ربط التطبيق بـ Firebase Cloud Messaging.

**الملف:** `src/lib/pushNotifications.ts`
```typescript
export async function initializePushNotifications() {
  // 1. طلب الصلاحيات
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return;

  // 2. التسجيل في FCM
  await PushNotifications.register();

  // 3. حفظ الـ Token في Firestore ليتمكن الأدمن من استهدافه
  PushNotifications.addListener('registration', (token) => {
    saveTokenToFirestore(token.value);
  });
}
```

### ج- التكامل مع التطبيق (App Integration)
يتم التنسيق في `AppInitializer.tsx` لضمان التشغيل التلقائي.

```typescript
useEffect(() => {
  if (Capacitor.isNativePlatform()) {
    initializePushNotifications(); // تفعيل الـ Push
    syncPrayersFromCache();       // جدولة الأذان فورياً من الذاكرة
  }
}, []);
```

---

## 3. خطوات التشغيل (Setup Guide)

### 1. إعداد الأندرويد (Android Resources)
يجب وضع ملف الأذان في المسار التالي لكي يعمل الإشعار الصوتي:
`android/app/src/main/res/raw/adhan.mp3`

### 2. تثبيت المكتبات اللازمة
نفذ الأوامر التالية في مجلد المشروع:
```bash
npm install @capacitor/local-notifications @capacitor/push-notifications
npx cap sync
```

### 3. إعداد Firebase Cloud Functions
لإرسال الإشعارات من لوحة التحكم، يجب إضافة Function بسيطة في الـ Backend:
```javascript
exports.sendPushOnNewDoc = functions.firestore
    .document('push_queue/{docId}')
    .onCreate(async (snap) => {
        const data = snap.data();
        const message = {
            notification: { title: data.title, body: data.body },
            topic: 'all_users' // أو إرسال لجميع التوكنز المخزنة
        };
        return admin.messaging().send(message);
    });
```

---

## 4. مميزات لوحة التحكم الجديدة
* **إحصائيات حية:** رؤية عدد المستخدمين المشتركين في الإشعارات.
* **إرسال سريع:** زر "صلّ على النبي ﷺ" لإرسال تنبيه فوري للجميع.
* **جدولة الرسائل:** إمكانية كتابة أي عنوان أو نص وإرساله بضغطة زر.

---
**تم إعداد هذا النظام ليكون "مرناً" و "قوياً"، مما يضمن بقاء المستخدمين على اتصال دائم بالتطبيق.**
