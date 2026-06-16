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

    const geminiKey = process.env.GEMINI_API_KEY || process.env.Value || process.env.VALUE;
    const groqKey = process.env.GROQ_API_KEY;

    const systemPrompt = `أنت مراقب محتوى ذكي وصارم لتطبيق إسلامي دعوي يسمى "يقين".
مهمتك هي مراجعة النص التالي (سواء كان منشورًا أو تعليقًا) وتحديد ما إذا كان مخالفًا للشروط.
الشروط:
1. يجب أن يكون النص متعلقًا بالإسلام، القرآن، السنة، الأدعية، الذكر، السيرة النبوية، الأخلاق الإسلامية، الكلمة الطيبة، أو مواضيع دينية دعوية مفيدة ومحترمة.
2. يُمنع منعًا باتًا أي محتوى خارج عن السياق الإسلامي والدعوي (مثل المناقشات السياسية، الرياضية، الأغاني غير الإسلامية، أو الكلام العشوائي الذي لا فائدة منه).
3. يُمنع السب، الشتم، الاستهزاء، أو استخدام أي ألفاظ بذيئة أو مسيئة (مثل "طز"، "قرف"، "غبي"، إلخ).

أجب بصيغة JSON فقط كالتالي:
{
  "isOffTopic": true/false (إذا كان غير متعلق بالمواضيع الإسلامية والدعوية والمفيدة),
  "isProfane": true/false (إذا كان يحتوي على أي شتيمة أو لفظ بذيء أو استهزاء),
  "reason": "سبب الحجب باختصار باللغة العربية"
}

النص المراد مراجعته:
"${trimmed}"`;

    // Try Gemini API first
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
              generationConfig: { 
                temperature: 0.1, 
                responseMimeType: "application/json" 
              }
            })
          }
        );

        if (response.ok) {
          const resData = await response.json();
          const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (rawText) {
            const parsed = JSON.parse(rawText.trim());
            return NextResponse.json({
              isOffTopic: !!parsed.isOffTopic,
              isProfane: !!parsed.isProfane,
              reason: parsed.reason || ""
            });
          }
        }
      } catch (geminiErr) {
        console.error("Gemini moderation API error:", geminiErr);
      }
    }

    // Fallback to Groq API
    if (groqKey) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "You always output JSON only." },
              { role: "user", content: systemPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
          })
        });

        if (response.ok) {
          const resData = await response.json();
          const rawText = resData.choices?.[0]?.message?.content || "";
          if (rawText) {
            const parsed = JSON.parse(rawText.trim());
            return NextResponse.json({
              isOffTopic: !!parsed.isOffTopic,
              isProfane: !!parsed.isProfane,
              reason: parsed.reason || ""
            });
          }
        }
      } catch (groqErr) {
        console.error("Groq moderation API error:", groqErr);
      }
    }

    // If both fail, let it pass or apply local basic filter (already done above)
    return NextResponse.json({ isOffTopic: false, isProfane: false, reason: "تعذر التحقق من خوادم الذكاء الاصطناعي" });
  } catch (e: any) {
    console.error("Moderation route error:", e);
    return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
