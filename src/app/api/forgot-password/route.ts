import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "البريد الإلكتروني غير صحيح" }, { status: 400, headers: CORS_HEADERS });
    }

    // Initialize Admin and query Firestore
    getAdminApp();
    const db = admin.firestore();
    const cleanEmail = email.trim().toLowerCase();
    
    const snap = await db.collection("users").where("email", "==", cleanEmail).get();
    
    if (snap.empty) {
      return NextResponse.json({ success: false, error: "لا يوجد حساب مرتبط بهذا البريد الإلكتروني" }, { status: 404, headers: CORS_HEADERS });
    }

    const accounts = snap.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        username: data.username || "",
        displayName: data.displayName || "",
        photoURL: data.photoURL || "",
        registrationType: data.registrationType || "direct"
      };
    });

    return NextResponse.json({ success: true, accounts }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("[forgot-password] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "فشل البحث عن الحسابات" }, { status: 500, headers: CORS_HEADERS });
  }
}
