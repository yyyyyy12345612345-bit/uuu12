import { NextResponse } from "next/server";

// To make this work in production:
// 1. Create an account on UltraMsg.com (or Twilio / FoneApi)
// 2. Get your Instance ID and Token
// 3. Put them in these constants (or in your .env file)
const ULTRAMSG_INSTANCE = process.env.NEXT_PUBLIC_ULTRAMSG_INSTANCE || "instance175795";
const ULTRAMSG_TOKEN = process.env.NEXT_PUBLIC_ULTRAMSG_TOKEN || "6d16nhrhh3qk1oqo";

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, error: "بيانات ناقصة" }, { status: 400 });
    }

    // Format phone number to international standard (Egypt: +20...)
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith("01")) {
      formattedPhone = "+2" + formattedPhone; // Convert 01012345678 to +201012345678
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+" + formattedPhone;
    }

    // If you haven't set up UltraMsg yet, we will log it and return success for testing
    if (ULTRAMSG_INSTANCE === "YOUR_INSTANCE_ID" || ULTRAMSG_TOKEN === "YOUR_TOKEN") {
      console.log(`[WhatsApp API Mock] Sending OTP ${otp} to ${formattedPhone}`);
      return NextResponse.json({ 
        success: true, 
        mock: true, 
        message: "تم المحاكاة بنجاح. أضف بيانات UltraMsg لإرسال رسائل حقيقية." 
      });
    }

    // Call UltraMsg API
    const response = await fetch(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/messages/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        token: ULTRAMSG_TOKEN,
        to: formattedPhone,
        body: `رمز التحقق الخاص بك لاستعادة حسابك في الاستوديو القرآني هو: *${otp}*\n\nالرجاء عدم مشاركة هذا الكود مع أي شخص.`
      })
    });

    const data = await response.json();

    if (data.sent === "true" || data.success) {
      return NextResponse.json({ success: true, message: "تم إرسال الكود بنجاح" });
    } else {
      return NextResponse.json({ success: false, error: "فشل إرسال الرسالة عبر المزود" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("WhatsApp API Error:", error);
    return NextResponse.json({ success: false, error: "خطأ داخلي في الخادم" }, { status: 500 });
  }
}
