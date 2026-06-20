import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { messages, userData } = await req.json();

    // بدون أي API خارجي، البوت بيرد رد ثابت تجنباً لأي مشاكل في الاتصال أو الحصص
    const userName = userData?.name || "يا غالي";
    
    return NextResponse.json({ 
      reply: `أهلاً بك ${userName} 🌸! الشات الذكي مغلق حالياً، لكن يمكنك تصفح أقسام التطبيق بسهولة من خلال القائمة السفلية (المصحف، اليوميات، القبلة، وغيرها).` 
    });

  } catch (error: any) {
    console.error("[Chat API Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
