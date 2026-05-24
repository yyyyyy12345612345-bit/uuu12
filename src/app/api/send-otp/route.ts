import { NextResponse } from "next/server";
import { setOtp } from "../otp-store";

const ULTRAMSG_INSTANCE = process.env.NEXT_PUBLIC_ULTRAMSG_INSTANCE || "";
const ULTRAMSG_TOKEN = process.env.NEXT_PUBLIC_ULTRAMSG_TOKEN || "";

export async function POST(request: Request) {
  try {
    const { phone, reason } = await request.json();
    if (!phone) {
      return NextResponse.json({ success: false, error: "بيانات ناقصة" }, { status: 400 });
    }

    // Format: remove any non-digit characters, add country code if needed
    let clean = phone.trim().replace(/[^0-9]/g, "");
    if (clean.startsWith("05")) clean = "966" + clean.slice(1);
    else if (clean.startsWith("5")) clean = "966" + clean;
    else if (!clean.startsWith("966")) clean = "966" + clean;

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(phone.trim(), otpCode);

    // UltraMsg
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
      error: "تعذر إرسال الرسالة. تأكد من ضبط بيانات UltraMsg في الإعدادات."
    }, { status: 500 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "خطأ داخلي" }, { status: 500 });
  }
}
