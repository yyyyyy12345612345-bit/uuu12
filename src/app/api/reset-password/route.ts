import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

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
    const { uid, newPassword, verificationToken } = await request.json();

    if (!uid || !newPassword || !verificationToken) {
      return NextResponse.json(
        { success: false, error: "بيانات ناقصة" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Verify the token matches what we signed during OTP verification
    const expectedToken = Buffer.from(`reset:${uid}:${process.env.OTP_SECRET || "quran-app-otp-secret-key-2026"}`).toString("base64");
    if (verificationToken !== expectedToken) {
      return NextResponse.json(
        { success: false, error: "رمز التحقق غير صحيح" },
        { status: 403, headers: CORS_HEADERS }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Use Firebase Admin to update password directly — no old password needed!
    const adminAuth = getAdminAuth();
    await adminAuth.updateUser(uid, { password: newPassword });

    return NextResponse.json(
      { success: true, message: "تم تغيير كلمة المرور بنجاح" },
      { headers: CORS_HEADERS }
    );
  } catch (error: any) {
    console.error("[reset-password] Error:", error);

    if (error.code === "auth/user-not-found") {
      return NextResponse.json(
        { success: false, error: "المستخدم غير موجود" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "حدث خطأ في تغيير كلمة المرور",
        details: error.stack || String(error)
      },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
