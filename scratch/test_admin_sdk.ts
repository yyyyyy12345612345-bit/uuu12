import { getAdminApp } from "../src/lib/firebaseAdmin";
import admin from "firebase-admin";

try {
  const app = getAdminApp();
  console.log("SUCCESS IN CORE TS INITIALIZATION!");
} catch (e: any) {
  console.error("FAILED:", e.message);
}
