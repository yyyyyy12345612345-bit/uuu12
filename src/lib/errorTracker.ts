"use client";

import { db, auth } from "./firebase";
import { 
  collection, addDoc, serverTimestamp, query, orderBy, 
  limit, onSnapshot, doc, updateDoc, deleteDoc, getDocs, where
} from "firebase/firestore";

export interface ErrorReport {
  id?: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  pathname: string;
  timestamp: any;
  dateString: string;
  userId: string;
  userEmail: string;
  userName: string;
  userAgent: string;
  browser: string;
  os: string;
  screen: string;
  severity: "critical" | "error" | "warning";
  status: "unresolved" | "investigating" | "resolved";
  count: number;
}

// In-memory debounce cache to avoid flood of duplicate errors
const recentErrors = new Map<string, number>();

function getBrowserAndOS(ua: string): { browser: string; os: string } {
  let browser = "متصفح غير معروف";
  let os = "نظام غير معروف";

  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome")) browser = "Google Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";

  return { browser, os };
}

/**
 * Reports an error to Firestore with rich client and user metadata
 */
export async function reportErrorToSystem(
  error: Error | unknown,
  customContext: {
    componentStack?: string;
    severity?: "critical" | "error" | "warning";
    extra?: Record<string, any>;
  } = {}
) {
  if (typeof window === "undefined") return;

  const msg = error instanceof Error ? error.message : String(error || "Unknown Error");
  const stack = error instanceof Error ? error.stack || "" : "";

  // Debounce duplicate errors within 15 seconds
  const errorKey = `${msg}_${window.location.pathname}`;
  const now = Date.now();
  const lastTime = recentErrors.get(errorKey) || 0;
  if (now - lastTime < 15000) {
    return;
  }
  recentErrors.set(errorKey, now);

  const currentUser = auth?.currentUser;
  const ua = navigator.userAgent || "";
  const { browser, os } = getBrowserAndOS(ua);
  const screen = `${window.screen.width}x${window.screen.height}`;

  const report: Omit<ErrorReport, "id"> = {
    message: msg,
    stack: stack,
    componentStack: customContext.componentStack || "",
    url: window.location.href,
    pathname: window.location.pathname,
    timestamp: serverTimestamp(),
    dateString: new Date().toISOString(),
    userId: currentUser?.uid || "guest_anonymous",
    userEmail: currentUser?.email || "غير مسجل (زائر)",
    userName: currentUser?.displayName || "مستخدم مجهول",
    userAgent: ua,
    browser,
    os,
    screen,
    severity: customContext.severity || "error",
    status: "unresolved",
    count: 1,
  };

  try {
    if (db) {
      const colRef = collection(db, "system_error_logs");
      await addDoc(colRef, report);
      console.info("[Telemetry] Error logged to system monitoring:", msg);
    }
  } catch (logErr) {
    console.warn("[Telemetry] Could not save error to Firestore:", logErr);
  }
}

/**
 * Initializes global client-side error listeners
 */
let isInitialized = false;

export function initGlobalErrorTracking() {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  // Global uncaught exceptions
  window.addEventListener("error", (event: ErrorEvent) => {
    // Filter out harmless browser extension or resize observer errors
    if (
      event.message?.includes("ResizeObserver") ||
      event.message?.includes("Extension context") ||
      event.filename?.startsWith("chrome-extension://")
    ) {
      return;
    }

    reportErrorToSystem(event.error || new Error(event.message), {
      severity: "error",
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Global unhandled Promise rejections
  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const error = reason instanceof Error ? reason : new Error(String(reason));
    reportErrorToSystem(error, {
      severity: "warning",
      extra: { isUnhandledPromise: true },
    });
  });
}
