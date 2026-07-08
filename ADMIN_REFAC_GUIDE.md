# 🕌 دليل توثيق وإعادة هيكلة لوحة التحكم (Admin Panel Guide)

تم تنظيم وتبسيط لوحة التحكم الرئيسية [AdminPanel.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/AdminPanel.tsx) التي كانت تحتوي على ما يزيد عن **5800 سطر** من الأكواد المتداخلة، وذلك بفصل الأقسام والمسؤوليات الكبيرة إلى مجلدات فرعية مخصصة تحت مسار `src/components/admin/`.

هذا الدليل يشرح البنية الجديدة، تفاصيل كل ملف، والفوائد التقنية المحققة.

---

## 📂 الهيكل البرمجي المعتمد (Directory Structure)

```text
src/components/admin/
├── AdminPanel.types.ts            # جميع واجهات البيانات والأنواع (Types & Interfaces)
└── tasks/                         # قسم إدارة المهام والتنبيهات
    ├── useTasksAdmin.ts           # الخطاف البرمجي لإدارة الحالات والاتصال بـ Firestore
    ├── TasksManagerPanel.tsx      # المكون الحاوي للقسم وإدارة المهام
    ├── DailyChallengeForm.tsx     # نموذج إضافة وتصميم تحدي جديد
    └── PushNotificationSender.tsx # مصمم ومرسل الإشعارات الفورية وسجلها
```

---

## 📄 تفاصيل الملفات والمسؤوليات (File Reference)

### 1️⃣ [AdminPanel.types.ts](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/admin/AdminPanel.types.ts)
*   **النوع**: ملف أنواع البيانات (TypeScript Types).
*   **الوظيفة**: يحتوي على تعريفات الواجهات المشتركة (Interfaces) لبيانات الإحصائيات (`DailyStats`)، نظام الصيانة (`MaintenanceMode`)، التحديات اليومية (`Quest`)، سجل الإشعارات الفورية (`PushNotification`)، وتذاكر الدعم الفني (`Ticket`).
*   **الفائدة**: يمنع التكرار ويضمن أمان كتابة وتمرير البيانات بين المكونات المختلفة.

### 2️⃣ [tasks/useTasksAdmin.ts](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/admin/tasks/useTasksAdmin.ts)
*   **النوع**: خطاف مخصص (Custom React Hook).
*   **الوظيفة**:
    *   إدارة حالات (State) حقول نموذج التحديات ونموذج الإشعارات.
    *   جلب وتحديث التحديات النشطة من Firestore في مجموعة `global_quests`.
    *   جلب وسجل تاريخ الإشعارات من Firestore من مجموعة `admin_push_notifications`.
    *   حذف المهام وإضافة السجلات إلى `admin_logs` عند إرسال الإشعارات.
*   **الفائدة**: عزل المنطق البرمجي (Business Logic) تمامًا عن واجهة العرض، مما يتيح اختبار العمليات بشكل منفصل عن الواجهات.

### 3️⃣ [tasks/DailyChallengeForm.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/admin/tasks/DailyChallengeForm.tsx)
*   **النوع**: مكون عرض فرعي (UI Component).
*   **الوظيفة**:
    *   يعرض نموذجًا مخصصًا باللغة العربية لإنشاء مهمة جديدة للمستخدمين.
    *   يتيح اختيار نوع التحدي (📖 قراءة آية، 🎧 استماع لسورة معينة، 🏆 لوحة المتصدرين، إلخ).
    *   يرتبط بقائمة سور القرآن لتأكيد رقم واسم السورة المطلوبة عند اختيار نوع تحدي السورة.
*   **الفائدة**: خفيف الوزن ومقاوم لعمليات إعادة التجميع (Re-rendering) لبقية لوحة التحكم.

### 5️⃣ [tasks/TasksManagerPanel.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/admin/tasks/TasksManagerPanel.tsx)
*   **النوع**: مكون حاوٍ رئيسي (Parent Component).
*   **الوظيفة**: يدمج خطاف الـ State الخاص بـ `useTasksAdmin` مع نموذج `DailyChallengeForm` وقائمة التحديات النشطة مع إمكانية حذفها الفوري.

---

## ⚡ فوائد وميزات إعادة الهيكلة (Architectural Benefits)

1.  **تسريع تحميل الصفحة (Lazy Loading)**:
    تم استدعاء المكونات الجديدة داخل [AdminPanel.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/AdminPanel.tsx) عبر الاستدعاء الديناميكي لـ Next.js:
    ```typescript
    const TasksManagerPanel = dynamic(() => import("./admin/tasks/TasksManagerPanel"), { ssr: false });
    const PushNotificationSender = dynamic(() => import("./admin/tasks/PushNotificationSender").then(mod => mod.PushNotificationSender), { ssr: false });
    ```
    مما يعني أن متصفح الأدمن لن يقوم بتحميل أو معالجة هذه الأكواد والوظائف إلا عند نقره الفعلي على زر تبويب "المهام" أو "الإشعارات"، مما يوفر استهلاك الذاكرة والإنترنت.
2.  **تحسين الأداء (Re-renders Prevention)**:
    عندما يكتب الأدمن عنوانًا للمهمة أو يكتب نصًا للإشعار، لن تتأثر بقية لوحة التحكم (مثل لوحة التحكم المالية أو الشات بوت أو إحصائيات الأداء) بعمليات إعادة الرسم (Re-render)، لأن الحالة (State) معزولة تمامًا داخل المكون الفرعي.
3.  **تقليل حجم الملف الرئيسي**:
    تخلص [AdminPanel.tsx](file:///c:/Users/youse/OneDrive/Desktop/New%20folder%20(2)/Quran-main/src/components/AdminPanel.tsx) من **175 سطرًا** مدمجًا، مما يجعله أكثر قابلية للقراءة والصيانة.
