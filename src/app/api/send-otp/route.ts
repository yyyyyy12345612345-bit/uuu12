import { NextResponse } from "next/server";

const ULTRAMSG_INSTANCE = process.env.NEXT_PUBLIC_ULTRAMSG_INSTANCE || "instance175795";
const ULTRAMSG_TOKEN = process.env.NEXT_PUBLIC_ULTRAMSG_TOKEN || "6d16nhrhh3qk1oqo";
const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || "";

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

    // 1. Try external WhatsApp bot (Playwright) first
    if (WHATSAPP_BOT_URL) {
      try {
        const botResponse = await fetch(`${WHATSAPP_BOT_URL}/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone_number: formattedPhone,
            otp_code: otpCode,
            reason: reason || "التحقق من الحساب",
          }),
        });

        if (botResponse.ok) {
          console.log(`[send-otp] ✅ Sent via bot to ${formattedPhone}`);
          return NextResponse.json({
            success: true,
            otp: otpCode,
            message: "تم إرسال الكود عبر واتساب",
          });
        }
        console.log("[send-otp] Bot failed, falling back...");
      } catch (e) {
        console.log("[send-otp] Bot error, falling back to UltraMsg");
      }
    }

    // 2. Fallback to UltraMsg API
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
      return NextResponse.json({ success: true, otp: otpCode, message: "تم إرسال الكود بنجاح" });
    }

    // 3. Dev mode fallback
    console.log(`[send-otp Mock] OTP ${otpCode} for ${formattedPhone}`);
    return NextResponse.json({
      success: true,
      otp: otpCode,
      mock: true,
      message: `⚠️ وضع التطوير: الكود ${otpCode}`,
    });
  } catch (error: any) {
    console.error("send-otp Error:", error);
    return NextResponse.json({ success: false, error: "خطأ داخلي في الخادم" }, { status: 500 });
  }
}
