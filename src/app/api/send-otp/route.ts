import { NextResponse } from "next/server";
import { setOtp } from "../otp-store";

const ULTRAMSG_INSTANCE = process.env.NEXT_PUBLIC_ULTRAMSG_INSTANCE || "instance175795";
const ULTRAMSG_TOKEN = process.env.NEXT_PUBLIC_ULTRAMSG_TOKEN || "6d16nhrhh3qk1oqo";

export async function POST(request: Request) {
  try {
    const { phone, reason } = await request.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: "بيانات ناقصة" }, { status: 400 });
    }

    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith("01")) {
      formattedPhone = "+2" + formattedPhone;
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+" + formattedPhone;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP server-side only (never returned to client)
    setOtp(phone.trim(), otpCode);

    // Send via UltraMsg
    try {
      const response = await fetch(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token: ULTRAMSG_TOKEN,
          to: formattedPhone,
          body: `رمز التحقق الخاص بك هو: *${otpCode}*\n\n${reason || "التحقق من الحساب"}\n\nالرجاء عدم مشاركة هذا الكود مع أي شخص.`,
        }),
      });

      const data = await response.json();
      if (data.sent === "true" || data.success) {
        console.log(`[send-otp] ✅ Sent to ${formattedPhone}`);
        return NextResponse.json({ success: true, message: "تم إرسال الكود بنجاح" });
      }
    } catch (e) {
      console.log("[send-otp] UltraMsg failed");
    }

    // Dev fallback
    console.log(`[send-otp Dev] OTP ${otpCode} for ${formattedPhone}`);
    return NextResponse.json({
      success: true,
      mock: true,
      message: "تم إرسال الكود (وضع التطوير)",
    });
  } catch (error: any) {
    console.error("send-otp Error:", error);
    return NextResponse.json({ success: false, error: "خطأ داخلي" }, { status: 500 });
  }
}
