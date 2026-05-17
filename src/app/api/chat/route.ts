import { NextResponse } from "next/server";
import { classifyQueryWithML } from "@/lib/ml-model";

export async function POST(req: Request) {
  try {
    const { messages, userData, pathname } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "صيغة الرسائل غير صحيحة" }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.Value || process.env.VALUE;

    const userPoints = userData?.points || 0;
    const userCountry = userData?.country || "غير محدد";
    const userMinutes = userData?.stats?.audioMinutes || 0;
    const isGuest = userData?.isGuest ? "نعم (حساب زائر)" : "لا";
    const userName = userData?.name || userData?.displayName || "أخي الكريم";

    // الحصول على آخر رسالة كتبها المستخدم
    const lastUserMessage = messages[messages.length - 1]?.text || "";

    // ── نظام تعليمات النظام ──
    const systemPrompt = `أنت المساعد الذكي الخاص بتطبيق "الاستوديو القرآني الفائق" فقط.
ممنوع تماماً الإجابة على أي سؤال خارج نطاق هذا التطبيق أو الإسلام والقرآن.
إذا سألك المستخدم عن أي شيء خارج هذا النطاق، قل له: "عذراً، أنا مساعدك الخاص بالاستوديو القرآني فقط 🌙"

معلومات عن مطور التطبيق:
- الاسم: يوسف اسامه
- التخصص: AIE (مهندس ذكاء اصطناعي)
- للتواصل: إنستقرام: aie_youssef

معلومات عن المستخدم الحالي:
- النقاط: ${userPoints}
- البلد: ${userCountry}
- دقائق الاستماع: ${userMinutes}
- زائر: ${isGuest}
- الصفحة الحالية: ${pathname || "غير معروف"}

أقسام التطبيق (وجّه المستخدم بروابط ماركدون):
- إنشاء فيديو: [اضغط هنا لإنشاء فيديو](/video)
- المصحف المكتوب: [المصحف المكتوب](/mushaf-full)
- المصحف الرقمي: [المصحف الرقمي](/digital)
- مواقيت الصلاة: [مواقيت الصلاة](/prayers)
- المكتبة الصوتية: [المكتبة الصوتية](/library)
- الأوراد اليومية: [الأوراد اليومية](/daily)
- لوحة الشرف: [لوحة الشرف](/rank)
- الملف الشخصي: [الملف الشخصي](/profile)

تعليمات:
1. تحدث دائماً بالعربية بأسلوب راقي ومحترم.
2. إذا سأل عن معلوماته، أجب من البيانات أعلاه.
3. إذا سأل عن المطور، اذكر "يوسف اسامه" مهندس الذكاء الاصطناعي.
4. استخدم إيموجي بشكل جميل.
5. كن مختصراً ومفيداً كمساعد شخصي فائق الذكاء.`;

    // ── 1. محاولة استدعاء Gemini API ──
    if (geminiKey) {
      const geminiContents = messages.map((m: any) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const modelsToTry = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-pro"
      ];

      let data: any = null;
      let lastResponse: Response | null = null;

      for (const model of modelsToTry) {
        console.log("🔄 جاري تجربة الموديل:", model);

        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: systemPrompt }]
                },
                contents: geminiContents,
                generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
              })
            }
          );

          const responseData = await response.json();

          if (response.ok) {
            console.log(`✅ نجح الموديل: ${model}`);
            data = responseData;
            lastResponse = response;
            break;
          } else {
            console.warn(`❌ فشل ${model}:`, responseData.error?.message);
            lastResponse = response;
            data = responseData;

            if (responseData.error?.message?.includes("quota")) {
              console.error("⚠️ الحصة انتهت! راجع حساب جوجل.");
              break; // كسر الدوران لتفعيل الـ Fallback المحلي فوراً
            }
          }
        } catch (fetchErr) {
          console.error(`💥 خطأ أثناء طلب الموديل ${model}:`, fetchErr);
        }
      }

      // لو نجح الاتصال الفعلي بـ Gemini ورجع رد سليم
      if (lastResponse?.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const botText = data.candidates[0].content.parts[0].text;
        return NextResponse.json({ text: botText });
      }
    }

    // ── 2. محاولة استدعاء OpenAI API (Fallback أول) ──
    if (openAiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map((m: any) => ({
                role: m.sender === "user" ? "user" : "assistant",
                content: m.text
              }))
            ],
            temperature: 0.7,
            max_tokens: 600
          })
        });

        const data = await response.json();
        if (response.ok && data.choices?.[0]?.message?.content) {
          return NextResponse.json({ text: data.choices[0].message.content });
        }
      } catch (openAiErr) {
        console.error("💥 خطأ في خوادم OpenAI:", openAiErr);
      }
    }

    // ── 3. الـ Fallback النهائي بذكاء الآلة المحلي (Machine Learning TF-IDF) ──
    console.log("🚀 تفعيل محرك الذكاء الاصطناعي وتعلم الآلة المحلي (ML Cosine Similarity)...");
    const mlClassification = classifyQueryWithML(lastUserMessage, userData);
    console.log(`🎯 تم تصنيف السؤال إلى قسم [${mlClassification.category}] بدرجة ثقة: ${mlClassification.score}`);
    
    return NextResponse.json({ text: mlClassification.reply });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "عطل داخلي في الخادم. يرجى المحاولة لاحقاً." }, { status: 500 });
  }
}
