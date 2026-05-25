import { NextResponse } from "next/server";
import { createSignedToken } from "../otp-store";
import crypto from "crypto";
import nodemailer from "nodemailer";

const SECRET = process.env.OTP_SECRET || "quran-app-otp-secret-key-2026";
const GMAIL_USER = "yo1685081@gmail.com";
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });
}

function generateCode(email: string): string {
  const slot = Math.floor(Date.now() / 300000);
  const hash = crypto.createHmac("sha256", SECRET).update(`${email.toLowerCase()}:${slot}`).digest("hex");
  const num = parseInt(hash.slice(0, 8), 16) % 1000000;
  return num.toString().padStart(6, "0");
}

export async function POST(request: Request) {
  try {
    const { email, reason, type } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "البريد الإلكتروني مطلوب" }, { status: 400 });
    }
    if (!GMAIL_PASS) {
      return NextResponse.json({ success: false, error: "Gmail غير مهيأ" }, { status: 500 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpCode = generateCode(cleanEmail);
    const token = createSignedToken(cleanEmail, otpCode);
    const origin = request.headers.get("origin") || "https://quran1-mu.vercel.app";

    let sent = true;
    try {
      let html = `
        <div style="direction:rtl;font-family:Tahoma,sans-serif;text-align:center;padding:20px;max-width:480px;margin:auto;">
          <h2 style="color:#1a1a2e;">مرحباً بك</h2>
          <p style="color:#666;">${reason || "كود التحقق الخاص بك"}</p>
          <div style="background:#f4f4f4;padding:20px;border-radius:8px;margin:16px 0;font-size:36px;letter-spacing:6px;color:#22c55e;font-weight:bold;">${otpCode}</div>`;

      if (type === "signup") {
        const verifyLink = `${origin}/api/verify-token?t=${encodeURIComponent(token)}`;
        html += `
          <p style="color:#999;font-size:13px;">أو اضغط على الرابط للتحقق مباشرة:</p>
          <a href="${verifyLink}" style="display:inline-block;background:#22c55e;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin:8px 0;">تأكيد الحساب</a>`;
      }

      html += `<p style="color:#aaa;font-size:12px;margin-top:16px;">هذا الكود صالح لمدة 5 دقائق.</p></div>`;

      await getTransporter().sendMail({
        from: `"القرآن الكريم" <${GMAIL_USER}>`,
        to: cleanEmail,
        subject: "كود التحقق",
        html,
      });
    } catch (mailErr: any) {
      console.error("[send-otp] Mail send failed:", mailErr.message);
      sent = false;
    }

    return NextResponse.json({
      success: true,
      emailSent: sent,
      message: sent ? "تم إرسال الكود" : "تم تجاوز التحقق (حد الإيميلات اليومي)",
    });
  } catch (error: any) {
    console.error("[send-otp] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
