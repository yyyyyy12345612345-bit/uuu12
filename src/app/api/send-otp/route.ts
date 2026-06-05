import { NextResponse } from "next/server";
import { createSignedToken } from "../otp-store";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { getAdminApp } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

const SECRET = process.env.OTP_SECRET || "quran-app-otp-secret-key-2026";

// الدعم لعدة إيميلات لإرسال الأكواد لضمان عدم توقف الخدمة عند انتهاء الحد اليومي للـ SMTP
const SENDER_ACCOUNTS = [
  { user: process.env.GMAIL_USER || "yo1685081@gmail.com", pass: process.env.GMAIL_APP_PASSWORD },
  { user: process.env.GMAIL_USER_2, pass: process.env.GMAIL_APP_PASSWORD_2 },
  { user: process.env.GMAIL_USER_3, pass: process.env.GMAIL_APP_PASSWORD_3 },
].filter(acc => acc.user && acc.pass);

function generateCode(email: string): string {
  const slot = Math.floor(Date.now() / 300000);
  const hash = crypto.createHmac("sha256", SECRET).update(`${email.toLowerCase()}:${slot}`).digest("hex");
  const num = parseInt(hash.slice(0, 8), 16) % 1000000;
  return num.toString().padStart(6, "0");
}

// ✅ CORS headers to allow requests from Capacitor APK
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle CORS preflight from Capacitor APK
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const { email, reason, type, username } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "البريد الإلكتروني مطلوب" }, { status: 400, headers: CORS_HEADERS });
    }
    if (SENDER_ACCOUNTS.length === 0) {
      return NextResponse.json({ success: false, error: "لا توجد حسابات بريد إلكتروني مهيأة للإرسال" }, { status: 500, headers: CORS_HEADERS });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpCode = generateCode(cleanEmail);
    const token = createSignedToken(cleanEmail, otpCode);
    const origin = request.headers.get("origin") || "https://yaqeen-app.vercel.app";

    let html = `
      <div style="direction:rtl;font-family:Tahoma,sans-serif;text-align:center;padding:30px;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:16px;background-color:#ffffff;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color:#1e293b;font-size:22px;margin-bottom:8px;">مرحباً بك في الاستوديو القرآني</h2>
        <p style="color:#4b5563;font-size:15px;margin-bottom:20px;">${reason || "كود التحقق الخاص بك لإنشاء الحساب"}</p>
    `;

    if (username) {
      html += `
        <div style="background-color:#f8fafc;padding:12px;border-radius:10px;margin-bottom:20px;border:1px dashed #cbd5e1;">
          <span style="color:#64748b;font-size:14px;">اسم المستخدم الذي سجلت به:</span>
          <strong style="color:#0f172a;font-size:16px;display:block;margin-top:4px;">${username}</strong>
        </div>
      `;
    }

    html += `
        <div style="background:#f0fdf4;padding:20px;border-radius:12px;margin:20px 0;font-size:36px;letter-spacing:6px;color:#16a34a;font-weight:bold;border:1px solid #bbf7d0;">${otpCode}</div>
    `;

    if (type === "signup") {
      const verifyLink = `${origin}/api/verify-token?t=${encodeURIComponent(token)}`;
      html += `
        <p style="color:#64748b;font-size:13px;margin-top:20px;">أو يمكنك الضغط على الزر التالي لتأكيد الحساب مباشرة:</p>
        <a href="${verifyLink}" style="display:inline-block;background:#16a34a;color:#ffffff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin:10px 0;box-shadow:0 2px 4px rgba(22,163,74,0.2);">تأكيد الحساب</a>
      `;
    }

    html += `<p style="color:#94a3b8;font-size:12px;margin-top:24px;border-top:1px solid #f1f5f9;padding-top:16px;">هذا الكود صالح لمدة 5 دقائق.</p></div>`;

    let sent = false;
    let usedSender = "";

    for (let i = 0; i < SENDER_ACCOUNTS.length; i++) {
      const account = SENDER_ACCOUNTS[i];
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: account.user, pass: account.pass },
        });

        await transporter.sendMail({
          from: account.user,
          to: cleanEmail,
          subject: "كود التحقق",
          html,
        });

        sent = true;
        usedSender = account.user;
        console.log(`[send-otp] Email successfully sent using: ${account.user}`);
        break; // نجح الإرسال، اخرج من التكرار
      } catch (mailErr: any) {
        console.warn(`[send-otp] Failed sending using ${account.user}:`, mailErr.message);
      }
    }

    if (!sent) {
      return NextResponse.json({
        success: false,
        error: "تم تخطي حد التسجيل اليومي، يرجى التسجيل لاحقاً",
      }, { status: 429, headers: CORS_HEADERS });
    }

    try {
      getAdminApp();
      const db = admin.firestore();
      const today = new Date().toISOString().split("T")[0];
      await db.collection("emailLogs").add({
        email: cleanEmail,
        sender: usedSender,
        sentAt: new Date().toISOString(),
        date: today,
        type: type || "signup",
        username: username || ""
      });
    } catch (dbErr) {
      console.error("[send-otp] Firestore logging failed:", dbErr);
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      message: "تم إرسال الكود",
    }, { headers: CORS_HEADERS });
  } catch (error: any) {
    console.error("[send-otp] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }
}
