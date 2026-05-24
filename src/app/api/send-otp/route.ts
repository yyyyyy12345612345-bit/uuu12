import { NextResponse } from "next/server";
import { setOtp } from "../otp-store";

const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || "https://Yousseef213-ISAOIAS.hf.space";
const ULTRAMSG_INSTANCE = process.env.NEXT_PUBLIC_ULTRAMSG_INSTANCE || "";
const ULTRAMSG_TOKEN = process.env.NEXT_PUBLIC_ULTRAMSG_TOKEN || "";

export async function POST(request: Request) {
  try {
    const { phone, reason } = await request.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: "بيانات ناقصة" }, { status: 400 });
    }

    let clean = phone.trim().replace(/[^0-9]/g, "");
    if (clean.startsWith("05")) clean = "966" + clean.slice(1);
    else if (clean.startsWith("5")) clean = "966" + clean;
    else if (!clean.startsWith("966")) clean = "966" + clean;

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(phone.trim(), otpCode);

    // 1) Try WhatsApp bot on HF Space
    try {
      const botRes = await fetch(`${WHATSAPP_BOT_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: clean,
          otp_code: otpCode,
          reason: reason || "التحقق من الحساب",
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (botRes.ok) {
        return NextResponse.json({ success: true, message: "تم إرسال الكود عبر البوت" });
      }
      const botData = await botRes.json().catch(() => ({}));
      console.log("[send-otp] Bot response:", botData);
    } catch (e) {
      console.log("[send-otp] Bot error:", e);
    }

    // 2) Fallback to UltraMsg
    if (ULTRAMSG_INSTANCE && ULTRAMSG_TOKEN) {
      try {
        const res = await fetch(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            token: ULTRAMSG_TOKEN,
            to: clean,
            body: `رمز التحقق: *${otpCode}*\n${reason || "التحقق من الحساب"}\n\nرمز لمرة واحدة - لا تشاركه.`,
          }),
        });

        const data = await res.json();
        if (data.sent === "true" || data.success) {
          return NextResponse.json({ success: true, message: "تم إرسال الكود" });
        }
        console.log("[send-otp] UltraMsg response:", data);
      } catch (e) {
        console.log("[send-otp] UltraMsg error:", e);
      }
    }

    return NextResponse.json({
      success: false,
      error: "تعذر إرسال الرسالة. تأكد من أن البوت مسجل الدخول في واتساب."
    }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "خطأ داخلي" }, { status: 500 });
  }
}
