import { NextResponse } from "next/server";
import { setOtp } from "../otp-store";
import nodemailer from "nodemailer";

const GMAIL_USER = "yo1685081@gmail.com";
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });
}

export async function POST(request: Request) {
  try {
    const { email, reason } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "البريد الإلكتروني مطلوب" }, { status: 400 });
    }
    if (!GMAIL_PASS) {
      console.error("[send-otp] GMAIL_APP_PASSWORD not set");
      return NextResponse.json({ success: false, error: "Gmail غير مهيأ" }, { status: 500 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(cleanEmail, otpCode);

    await getTransporter().sendMail({
      from: `"موقع القرآن الكريم" <${GMAIL_USER}>`,
      to: cleanEmail,
      subject: "كود تفعيل حسابك - موقع القرآن الكريم",
      html: `
        <div style="direction:rtl;text-align:center;font-family:sans-serif;padding:20px;border:1px solid #eee;border-radius:10px;max-width:500px;margin:auto;">
          <h2 style="color:#2c3e50;">مرحباً بك في موقع القرآن الكريم</h2>
          <p style="font-size:16px;color:#7f8c8d;">${reason || "كود التفعيل الخاص بك"}</p>
          <div style="background-color:#f8f9fa;padding:15px;border-radius:5px;margin:20px 0;">
            <h1 style="color:#2ecc71;letter-spacing:5px;margin:0;font-size:36px;">${otpCode}</h1>
          </div>
          <p style="font-size:14px;color:#95a5a6;">هذا الكود صالح للاستخدام لمرة واحدة فقط.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "تم إرسال الكود إلى بريدك الإلكتروني" });
  } catch (error: any) {
    console.error("[send-otp] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
