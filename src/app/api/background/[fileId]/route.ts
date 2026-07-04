import { NextResponse } from "next/server";

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

    // تنظيف كود الملف من لاحقة .mp4 في حال تم إرسالها لتمويه المتصفح وكاش الفيديو
    const cleanFileId = fileId.replace(/\.mp4$/, "");

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("[Telegram API] TELEGRAM_BOT_TOKEN is not defined in env variables.");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const now = Date.now();
    const cached = urlCache.get(cleanFileId);

    // إذا كان الرابط مخزناً وصالحاً، نعمل إعادة توجيه فورية
    if (cached && cached.expiresAt > now) {
      return NextResponse.redirect(cached.url, 307);
    }

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
    const directDownloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

    // تخزين الرابط في الكاش
    urlCache.set(cleanFileId, {
      url: directDownloadUrl,
      expiresAt: now + CACHE_DURATION_MS,
    });

    return NextResponse.redirect(directDownloadUrl, 307);
  } catch (error: any) {
    console.error("[Telegram API] Error resolving background video:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
