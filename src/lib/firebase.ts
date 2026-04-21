import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

// هذه البيانات ستحصل عليها من Firebase Console بعد إنشاء المشروع
// سأضع لك الهيكل وتستطيع استبدال القيم لاحقاً
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-quran-app.firebaseapp.com",
  projectId: "your-quran-app",
  storageBucket: "your-quran-app.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_G_ID"
};

// Initialize Firebase
let analytics: any;
if (typeof window !== "undefined") {
  const app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
}

export const logAppEvent = (eventName: string, params?: object) => {
  if (analytics) {
    logEvent(analytics, eventName, params);
    console.log(`[Firebase Log]: ${eventName}`, params);
  }
};
