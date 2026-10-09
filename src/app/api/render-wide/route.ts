import { NextResponse } from "next/server";

export const maxDuration = 60;

/**
 * Wide Render Route — تحويل طلبات الرندرة العريضة إلى خادم Hugging Face المخصص
 * لمنع استهلاك ذاكرة وباندويث دوال Vercel نهائياً
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.backgroundUrl && body.backgroundUrl.includes("/api/background/")) {
      body.backgroundUrl += (body.backgroundUrl.includes("?") ? "&" : "?") + "direct=true";
    }

    const renderConfig = {
      ...body,
      width: 1920,
      height: 1080,
      aspectRatio: "16:9",
      orientation: "landscape",
    };

    const hfRes = await fetch("https://yousef891238-render-server.hf.space/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(renderConfig),
    });

    const data = await hfRes.json().catch(() => ({}));
    return NextResponse.json(data, { status: hfRes.status });
  } catch (error: any) {
    console.error("Wide Render Forwarding Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
