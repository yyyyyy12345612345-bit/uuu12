import { NextResponse } from "next/server";

export const runtime = "edge";

// كاش بسيط في الذاكرة لتخزين الروابط المباشرة وتجنب تكرار الاتصال بتليجرام
interface CacheEntry {
  url: string;
  expiresAt: number;
}
const urlCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 50 * 60 * 1000; // 50 دقيقة (رابط تليجرام ينتهي في 60 دقيقة)

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    if (!fileId) {
      return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const returnJson = searchParams.get("json") === "true";
    const cleanFileId = fileId.replace(/\.mp4$/, "");

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("[Telegram API] TELEGRAM_BOT_TOKEN is not defined in env variables.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const now = Date.now();
    const cached = urlCache.get(cleanFileId);

    let directDownloadUrl = "";

    if (cached && cached.expiresAt > now) {
      directDownloadUrl = cached.url;
    } else {
      // طلب مسار الملف من تليجرام
      const getFileUrl = `https://api.telegram.org/bot${token}/getFile?file_id=${cleanFileId}`;
      const fileRes = await fetch(getFileUrl, { next: { revalidate: 0 } });
      
      if (!fileRes.ok) {
        const errText = await fileRes.text();
        console.error(`[Telegram API] getFile failed: status ${fileRes.status}`, errText);
        return NextResponse.json({ error: "Failed to get file from Telegram" }, { status: fileRes.status });
      }

      const fileData = await fileRes.json();
      if (!fileData.ok || !fileData.result?.file_path) {
        console.error("[Telegram API] Telegram returned error or missing path:", fileData);
        return NextResponse.json({ error: "Invalid file data from Telegram" }, { status: 400 });
      }

      const filePath = fileData.result.file_path;
      directDownloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

      // تخزين الرابط في الكاش
      urlCache.set(cleanFileId, {
        url: directDownloadUrl,
        expiresAt: now + CACHE_DURATION_MS,
      });
    }

    const isDirect = searchParams.get("direct") === "true";
    const userAgent = request.headers.get("user-agent")?.toLowerCase() || "";
    const isServerOrTool = isDirect || 
      userAgent.includes("node") || 
      userAgent.includes("undici") || 
      userAgent.includes("axios") || 
      userAgent.includes("curl") || 
      userAgent.includes("ffmpeg") || 
      userAgent.includes("python");

    if (returnJson) {
      return NextResponse.json({ url: isServerOrTool ? directDownloadUrl : proxyUrl });
    }

    // إذا كان الطلب من سيرفر الرندر أو أداة آلية، تحويل مباشر فوري إلى CDN تليجرام
    if (isServerOrTool) {
      return NextResponse.redirect(directDownloadUrl, {
        status: 302,
        headers: {
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // 🔒 تحويل آمن (302 Redirect) إلى خادم Hugging Face المجاني للمتصفحات العادية
    // 1. يمنع نهائياً تسريب توكن البوت في أدوات مطور المتصفح (DevTools)
    // 2. يمنع استهلاك باندويث Vercel نهائياً (الرد 200 بايت فقط)
    return NextResponse.redirect(proxyUrl, {
      status: 302,
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("[Telegram API] Error resolving background video:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
