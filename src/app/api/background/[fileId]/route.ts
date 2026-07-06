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

    if (returnJson) {
      return NextResponse.json({ url: directDownloadUrl });
    }

    // بدلاً من عمل إعادة توجيه (Redirect) قد تحجبه خوادم الرندرة أو جدران الحماية،
    // نقوم بعمل بث (Stream) محتوى الفيديو مباشرة من تليجرام ليمر عبر Vercel
    const videoRes = await fetch(directDownloadUrl);
    if (!videoRes.ok) {
      return NextResponse.json({ error: "Failed to stream video content" }, { status: videoRes.status });
    }

    return new Response(videoRes.body, {
      headers: {
        "Content-Type": videoRes.headers.get("content-type") || "video/mp4",
        "Content-Length": videoRes.headers.get("content-length") || "",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("[Telegram API] Error resolving background video:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
