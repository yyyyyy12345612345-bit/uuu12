import { NextResponse } from "next/server";
import { verifyOtp } from "../otp-store";

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();
    if (!phone || !code) {
      return NextResponse.json({ success: false, error: "بيانات ناقصة" }, { status: 400 });
    }

    if (verifyOtp(phone.trim(), code)) {
      return NextResponse.json({ success: true, message: "تم التحقق بنجاح" });
    }

    return NextResponse.json({ success: false, error: "الكود غير صحيح أو منتهي الصلاحية" }, { status: 400 });
  } catch (error: any) {
    console.error("verify-otp Error:", error);
    return NextResponse.json({ success: false, error: "خطأ في التحقق" }, { status: 500 });
  }
}
