import { NextResponse } from "next/server";
import { verifyOtp, verifySignedToken } from "../otp-store";

// ✅ CORS headers to allow requests from Capacitor APK
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle CORS preflight from Capacitor APK
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const { email, code, token, uid } = await request.json();

    if (token) {
      const result = verifySignedToken(token);
      if (result) {
        return NextResponse.json({ success: true, message: "تم التحقق بنجاح", email: result.email }, { headers: CORS_HEADERS });
      }
      return NextResponse.json({ success: false, error: "الرابط غير صحيح أو منتهي الصلاحية" }, { status: 400, headers: CORS_HEADERS });
    }

    if (!email || !code) {
      return NextResponse.json({ success: false, error: "بيانات ناقصة" }, { status: 400, headers: CORS_HEADERS });
    }

    if (verifyOtp(email.trim().toLowerCase(), code)) {
      const responseData: any = { success: true, message: "تم التحقق بنجاح" };
      if (uid) {
        responseData.token = Buffer.from(`reset:${uid}:${process.env.OTP_SECRET || "quran-app-otp-secret-key-2026"}`).toString("base64");
      }
      return NextResponse.json(responseData, { headers: CORS_HEADERS });
    }

    return NextResponse.json({ success: false, error: "الكود غير صحيح أو منتهي الصلاحية" }, { status: 400, headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("verify-otp Error:", error);
    return NextResponse.json({ success: false, error: "خطأ في التحقق" }, { status: 500, headers: CORS_HEADERS });
  }
}

