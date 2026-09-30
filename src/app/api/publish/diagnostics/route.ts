import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";
import { validateVideoUrl } from "@/lib/publishLogger";

export const dynamic = "force-dynamic";

/**
 * 📊 GET /api/publish/diagnostics
 * يجلب آخر عمليات النشر وسجلات التشخيص والأخطاء
 */
export async function GET(request: Request) {
  try {
    const adminApp = getAdminApp();
    const db = admin.firestore(adminApp);

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "15", 10);
    const platform = url.searchParams.get("platform"); // "youtube" | "tiktok" | all

    let query: admin.firestore.Query = db
      .collection("publish_diagnostics")
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (platform) {
      query = query.where("platform", "==", platform);
    }

    const [diagSnap, alertsSnap] = await Promise.all([
      query.get(),
      db.collection("error_alerts").orderBy("createdAt", "desc").limit(10).get(),
    ]);

    const diagnostics = diagSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    const alerts = alertsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    return NextResponse.json({
      success: true,
      totalLogs: diagnostics.length,
      unresolvedAlerts: alerts.filter((a: any) => !a.read).length,
      diagnostics,
      alerts,
    });
  } catch (error: any) {
    console.error("[Diagnostics API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 🛠️ POST /api/publish/diagnostics
 * أدوات تشخيص فورية:
 * 1. action: "test_url" -> يفحص رابط الفيديو (HEAD + Content-Type + Size + Speed)
 * 2. action: "test_webhook" -> يرسل payload تجريبي لـ Make.com ويقيس زمن الاستجابة والنتيجة
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, videoUrl, webhookUrl } = body;

    if (action === "test_url") {
      if (!videoUrl) {
        return NextResponse.json({ error: "videoUrl مطلوب للفحص" }, { status: 400 });
      }

      const startTime = Date.now();
      const validation = await validateVideoUrl(videoUrl);
      const pingMs = Date.now() - startTime;

      return NextResponse.json({
        success: true,
        action: "test_url",
        videoUrl,
        pingMs,
        result: validation,
        analysis: validation.ok
          ? "✅ الرابط صالح ومتاح للتنزيل المباشر من Zernio / Make.com / YouTube."
          : `❌ الرابط به مشكلة: ${validation.error}`,
      });
    }

    if (action === "test_webhook") {
      const targetUrl =
        webhookUrl ||
        process.env.MAKE_WEBHOOK_URL ||
        process.env.MAKE_YOUTUBE_WEBHOOK_URL ||
        "https://hook.eu1.make.com/tl01y7q4wfa8k1rzg1lvggvb93yolmf4";

      const startTime = Date.now();
      try {
        const testPayload = {
          test: true,
          source: "Yaqeen Quran Diagnostics System",
          timestamp: new Date().toISOString(),
          message: "فحص اتصال تجريبي لنظام الويب هوك",
        };

        const res = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testPayload),
        });

        const responseTimeMs = Date.now() - startTime;
        const responseText = await res.text();

        return NextResponse.json({
          success: true,
          action: "test_webhook",
          webhookUrl: targetUrl,
          statusCode: res.status,
          statusText: res.statusText,
          responseTimeMs,
          responseBody: responseText.substring(0, 500),
          analysis: res.ok
            ? "✅ الويب هوك رد بنجاح (Accepted / OK)."
            : `❌ الويب هوك رفض الطلب بكود HTTP ${res.status}: ${responseText.substring(0, 200)}`,
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          action: "test_webhook",
          webhookUrl: targetUrl,
          responseTimeMs: Date.now() - startTime,
          error: err.message,
          analysis: `❌ فشل الاتصال برابط الويب هوك: ${err.message}`,
        });
      }
    }

    return NextResponse.json(
      { error: "action غير مدعوم. استخدم test_url أو test_webhook." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
