import { NextResponse } from "next/server";
import { verifyOtp, verifySignedToken } from "../otp-store";

export async function POST(request: Request) {
  try {
    const { email, code, token } = await request.json();

    if (token) {
      const result = verifySignedToken(token);
      if (result) {
        return NextResponse.json({ success: true, message: "تم التحقق بنجاح", email: result.email });
      }
      return NextResponse.json({ success: false, error: "الرابط غير صحيح أو منتهي الصلاحية" }, { status: 400 });
    }

    if (!email || !code) {
      return NextResponse.json({ success: false, error: "بيانات ناقصة" }, { status: 400 });
    }

    if (verifyOtp(email.trim().toLowerCase(), code)) {
      return NextResponse.json({ success: true, message: "تم التحقق بنجاح" });
    }

    return NextResponse.json({ success: false, error: "الكود غير صحيح أو منتهي الصلاحية" }, { status: 400 });
  } catch (error: any) {
    console.error("verify-otp Error:", error);
    return NextResponse.json({ success: false, error: "خطأ في التحقق" }, { status: 500 });
  }
}
