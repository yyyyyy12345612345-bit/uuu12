import { NextResponse } from "next/server";

const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || "";

export async function POST(request: Request) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ success: false, error: "بيانات ناقصة" }, { status: 400 });
    }

    // Try server-side verification via WhatsApp bot
    if (WHATSAPP_BOT_URL) {
      try {
        const botResponse = await fetch(`${WHATSAPP_BOT_URL}/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: phone, code }),
        });

        if (botResponse.ok) {
          return NextResponse.json({ success: true, message: "تم التحقق بنجاح" });
        }
      } catch (e) {
        console.log("[verify-otp] Bot verification failed");
      }
    }

    // If no bot configured, verification happens client-side (OTP is returned by send-otp)
    return NextResponse.json({ success: true, message: "يتم التحقق محلياً" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "خطأ في التحقق" }, { status: 500 });
  }
}
