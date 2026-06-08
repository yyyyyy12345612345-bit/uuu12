const firebaseConfig = {
  apiKey: "AIzaSyB8NHUTR6Uzqh1YZAoPXzRy8aMgle9x7gU",
  authDomain: "yy10-ba274.firebaseapp.com",
  projectId: "yy10-ba274",
  storageBucket: "yy10-ba274.firebasestorage.app",
  messagingSenderId: "194649785258",
  appId: "1:194649785258:web:a4b07585298349ecf7a1d3",
  measurementId: "G-L4SD78B7GH"
};

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let analytics: any = null;
let initPromise: Promise<void> | null = null;

export async function initFirebase(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const { initializeApp, getApps, getApp } = await import("firebase/app");
    const { getAuth } = await import("firebase/auth");
    const { initializeFirestore } = await import("firebase/firestore");
    const { getStorage } = await import("firebase/storage");
    try {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      db = initializeFirestore(app, { experimentalForceLongPolling: false });
      storage = getStorage(app);
      if (typeof window !== "undefined") {
        try {
          const { getAnalytics } = await import("firebase/analytics");
          analytics = getAnalytics(app);
        } catch (e) {
          console.warn("[Firebase] Analytics not available:", e);
        }
      }
    } catch (error) {
      console.error("[Firebase] Initialization error:", error);
    }
  })();
  return initPromise;
}

export { app, auth, db, analytics, storage };

export async function fetchFirestoreDoc(collection: string, document: string) {
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collection}/${document}?key=${firebaseConfig.apiKey}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch { return null; }
}

export const logAppEvent = async (eventName: string, params?: object) => {
  if (!initPromise) return;
  await initPromise;
  if (analytics) {
    try {
      const { logEvent } = await import("firebase/analytics");
      logEvent(analytics, eventName, params);
    } catch (e) {
      console.warn("[Firebase] Event logging failed:", e);
    }
  }
};
