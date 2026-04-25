import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

// هذه البيانات يجب ملؤها من Firebase Console الخاص بك
const firebaseConfig = {
  apiKey: "AIzaSyB8NHUTR6Uzqh1YZAoPXzRy8aMgle9x7gU",
  authDomain: "yy10-ba274.firebaseapp.com",
  projectId: "yy10-ba274",
  storageBucket: "yy10-ba274.firebasestorage.app",
  messagingSenderId: "194649785258",
  appId: "1:194649785258:web:eeb335318731b1b2f7a1d3",
  measurementId: "G-13TSYVLG6G"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);

// Initialize Firestore with modern persistent cache
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export { app, auth, db, analytics };

export const logAppEvent = (eventName: string, params?: object) => {
  if (analytics) {
    logEvent(analytics, eventName, params);
    console.log(`[Firebase Log]: ${eventName}`, params);
  }
};
