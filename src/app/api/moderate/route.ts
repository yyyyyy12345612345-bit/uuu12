import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ isOffTopic: false, isProfane: false, reason: "محتوى فارغ" });
    }

    const trimmed = content.trim();

    // 1. Local basic profanity check (including mild things like "طز" and "قرف")
    const lower = trimmed.toLowerCase();
    const severeWordMatch = /(كسم|خول|عرص|ديوث|قحبة|قحبه|زبي|طيز|نيك|قواد|عاهرة|عاهره|عاهر|احا|منيوك|منيوكة|منيوكه|كسخت|كس امك|شرموط|شرموطة|طز فيك|طز|قرف|يا عرص|يا خول|يا ديوث)/i.test(lower);
    if (severeWordMatch) {
      return NextResponse.json({
        isOffTopic: false,
        isProfane: true,
        reason: "يحتوي على لفظ غير لائق أو بذيء"
      });
    }

    const VAL_TOWN_URL = "https://youssefosama--40af2a40698011f1b2fe1607ee4eb77e.web.val.run";

    try {
      const response = await fetch(VAL_TOWN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "moderate_post",
          content: trimmed
        })
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          isOffTopic: !!data.isOffTopic,
          isProfane: !!data.isProfane,
          reason: data.reason || ""
        });
      } else {
        console.error("Val Town moderation API failed with status:", response.status);
      }
    } catch (valErr) {
      console.error("Val Town moderation fetch failed:", valErr);
    }

    // If Val Town fails, let it pass or apply local basic filter (already done above)
    return NextResponse.json({ isOffTopic: false, isProfane: false, reason: "تعذر التحقق من خوادم الذكاء الاصطناعي" });
  } catch (e: any) {
    console.error("Moderation route error:", e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
