import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// هذه البيانات يجب ملؤها من Firebase Console الخاص بك
const firebaseConfig = {
  apiKey: "AIzaSyB8NHUTR6Uzqh1YZAoPXzRy8aMgle9x7gU",
  authDomain: "yy10-ba274.firebaseapp.com",
  projectId: "yy10-ba274",
  storageBucket: "yy10-ba274.firebasestorage.app",
  messagingSenderId: "194649785258",
  appId: "1:194649785258:web:a4b07585298349ecf7a1d3",
  measurementId: "G-L4SD78B7GH"
};

// Initialize Firebase safely
let app;
let auth;
let db;
let storage;
let analytics = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  if (typeof window !== "undefined") {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn("[Firebase] Analytics not available:", e);
    }
  }
} catch (error) {
  console.error("[Firebase] Initialization error:", error);
}

export { app, auth, db, analytics, storage };

export const logAppEvent = (eventName: string, params?: object) => {
  if (analytics) {
    try {
      logEvent(analytics, eventName, params);
      console.log(`[Firebase Log]: ${eventName}`, params);
    } catch (e) {
      console.warn("[Firebase] Event logging failed:", e);
    }
  }
};
