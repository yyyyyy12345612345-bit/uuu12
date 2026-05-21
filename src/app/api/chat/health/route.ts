import { NextResponse } from "next/server";

export function GET() {
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);

  return NextResponse.json({
    status: "ok",
    message: "Chat API health check passed.",
    openAiConfigured,
    geminiConfigured,
    note: "إذا كان أحد المفاتيح غير مكوّن، فقد يعمل الـ API محلياً فقط بذكاء التعلم الآلي المحلي (fallback)."
  });
}
