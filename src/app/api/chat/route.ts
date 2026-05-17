import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userData, pathname } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "صيغة الرسائل غير صحيحة" }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.Value || process.env.VALUE;

    if (!openAiKey && !geminiKey) {
      return NextResponse.json(
        { error: "المفتاح غير موجود. يرجى إضافة GEMINI_API_KEY في إعدادات البيئة." },
        { status: 500 }
      );
    }

    const userPoints = userData?.points || 0;
    const userCountry = userData?.country || "غير محدد";
    const userAudioMinutes = userData?.stats?.audioMinutes || 0;
    const isGuest = userData?.isGuest ? "نعم (حساب زائر)" : "لا";

    // تعليمات النظام - هذا هو "كتاب التعليمات" الخاص بموقعك
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
- دقائق الاستماع: ${userAudioMinutes}
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

    if (geminiKey) {
      // رسائل المحادثة
      const geminiContents = messages.map((m: any) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      // قائمة الموديلات للتجربة (الأحدث أولاً)
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

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              },
              contents: geminiContents,
              generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
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

          // لو المشكلة حصة الاستخدام، لا تكمل
          if (responseData.error?.message?.includes("quota")) {
            console.error("⚠️ الحصة انتهت! راجع حساب جوجل.");
            break;
          }
          continue;
        }
      }

      if (!lastResponse?.ok) {
        const errorMsg = data?.error?.message || "";
        let arabicError = "فشل في الاتصال بالذكاء الاصطناعي.";
        if (errorMsg.includes("quota")) {
          arabicError = "عذراً، انتهت حصة الاستخدام المجانية. يرجى الانتظار دقيقة والمحاولة مجدداً أو مراجعة حسابك في جوجل.";
        } else if (errorMsg.includes("not found")) {
          arabicError = "الموديل غير متاح حالياً. يرجى المحاولة لاحقاً.";
        }
        return NextResponse.json({ error: arabicError }, { status: lastResponse?.status || 500 });
      }

      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من الرد.";
      return NextResponse.json({ text: botText });

    } else if (openAiKey) {
      const openAIMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text
        }))
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: openAIMessages,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json({ error: "فشل في الاتصال بخوادم الذكاء الاصطناعي." }, { status: response.status });
      }

      return NextResponse.json({ text: data.choices[0].message.content });
    }

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "عطل داخلي في الخادم. يرجى المحاولة لاحقاً." }, { status: 500 });
  }
}
