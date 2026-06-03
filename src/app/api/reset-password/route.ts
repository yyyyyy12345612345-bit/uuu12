import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
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

    // Decode and verify reset token
    let uid = "";
    try {
      const decoded = Buffer.from(token, "base64").toString("utf-8");
      const parts = decoded.split(":");
      if (parts[0] !== "reset" || parts.length < 3) {
        return NextResponse.json({ success: false, error: "رمز الاستعادة غير صالح" }, { status: 400, headers: CORS_HEADERS });
      }
      uid = parts[1];
      const tokenSecret = parts[2];
      const systemSecret = process.env.OTP_SECRET || "quran-app-otp-secret-key-2026";

      if (tokenSecret !== systemSecret) {
        return NextResponse.json({ success: false, error: "رمز الاستعادة منتهي الصلاحية أو غير صالح" }, { status: 400, headers: CORS_HEADERS });
      }
    } catch (e) {
      return NextResponse.json({ success: false, error: "رمز الاستعادة تالف" }, { status: 400, headers: CORS_HEADERS });
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
