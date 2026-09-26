import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { verifyResetToken } from "../otp-store";
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
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ success: false, error: "البيانات غير مكتملة" }, { status: 400, headers: CORS_HEADERS });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ success: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400, headers: CORS_HEADERS });
    }

    // 🔒 التحقق المشفر والموقّع رقمياً من التوكن وصلاحيته الزمنية (15 دقيقة)
    const uid = verifyResetToken(token);
    if (!uid) {
      return NextResponse.json({ success: false, error: "رمز الاستعادة منتهي الصلاحية أو غير صالح" }, { status: 400, headers: CORS_HEADERS });
    }

    // Initialize admin auth and update user password
    const adminAuth = getAdminAuth();
    await adminAuth.updateUser(uid, { password: newPassword });

    // Update the Firestore users collection (encP field)
    const db = admin.firestore();
    const userRef = db.collection("users").doc(uid);
    await userRef.update({
      encP: btoa(newPassword),
      lastActive: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("[reset-password] Error:", error);
    return NextResponse.json({ success: false, error: error.message || "فشل إعادة تعيين كلمة المرور" }, { status: 500, headers: CORS_HEADERS });
  }
}
