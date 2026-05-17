import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, userData, pathname } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.Value || process.env.VALUE;

    if (!openAiKey && !geminiKey) {
      return NextResponse.json(
        { error: "API key is missing. Please set OPENAI_API_KEY or GEMINI_API_KEY in .env" },
        { status: 500 }
      );
    }

    const userPoints = userData?.points || 0;
    const userCountry = userData?.country || "غير محدد";
    const userAudioMinutes = userData?.stats?.audioMinutes || 0;
    const isGuest = userData?.isGuest ? "نعم (حساب زائر)" : "لا";

    const systemPrompt = `أنت المساعد الذكي، مساعد ذكاء اصطناعي ودود ومحترف داخل تطبيق "الاستوديو القرآني الفائق". 
مهمتك الأساسية هي مساعدة المستخدمين وتوجيههم داخل الموقع، والإجابة عن أسئلتهم حول القرآن، الصلاة، الأذكار، أو عن كيفية استخدام التطبيق.

معلومات عن مطور التطبيق:
- الاسم: يوسف اسامه
- التخصص: AIE (مهندس ذكاء اصطناعي - Artificial Intelligence Engineer)
- للتواصل: (واتساب: متاح للرسائل الخاصة) و (إنستقرام: aie_youssef - يمكنك افتراض اسم الحساب أو إخبارهم بالتواصل معه عبر حساباته الرسمية).

معلومات عن المستخدم الحالي الذي تتحدث معه:
- النقاط التي جمعها: ${userPoints}
- البلد: ${userCountry}
- دقائق الاستماع للقرآن: ${userAudioMinutes}
- هل هو زائر؟ ${isGuest}
- الصفحة التي يقف عليها الآن: ${pathname || "غير معروف"}
- البيانات الكاملة المخزنة: ${JSON.stringify(userData)}

أدوات التنقل في الموقع (كيف توجه المستخدم):
التطبيق يحتوي على عدة أقسام. إذا سأل المستخدم عن شيء، يجب أن توجهه برابط يمكنه الضغط عليه باستخدام صيغة الماركدون: [اسم الرابط](/المسار).
أمثلة للمسارات:
- لإنشاء فيديو أو الاستوديو: [اضغط هنا لإنشاء فيديو](/video)
- للمصحف الشريف والقراءة: [المصحف المكتوب](/mushaf-full) أو [المصحف الرقمي](/digital)
- لأوقات الصلاة: [مواقيت الصلاة](/prayers)
- للمكتبة الصوتية: [المكتبة الصوتية](/library) أو [المكتبة](/audio)
- للأوراد والأذكار اليومية: [الأوراد اليومية](/daily)
- للوحة الشرف والترتيب: [لوحة الشرف](/rank)
- للملف الشخصي والتقدم: [الملف الشخصي](/profile)

تعليمات إضافية:
1. تحدث دائماً باللغة العربية بأسلوب محترم جداً وراقي يناسب تطبيق قرآني.
2. إذا سأل عن معلوماته (مثلاً من أي بلد أنا؟ أو كم نقطة عندي؟)، أجب باستخدام المعلومات المتاحة لك أعلاه.
3. إذا سأل عن من برمج الموقع أو من مطوره، اذكر "يوسف اسامه" مهندس الذكاء الاصطناعي (AIE).
4. استخدم إيموجي بشكل مناسب وجميل.
5. كن مختصراً ومفيداً ولا تذكر معلومات برمجية معقدة بل تحدث كمساعد شخصي فائق الذكاء.`;

    if (geminiKey) {
      // Use Gemini API
      const geminiMessages = messages.map((m: any) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: geminiMessages,
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Gemini Error:", data);
        return NextResponse.json({ error: data.error?.message || "Failed to fetch response from Gemini" }, { status: response.status });
      }

      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من الرد.";
      return NextResponse.json({ text: botText });

    } else if (openAiKey) {
      // Use OpenAI API
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
        console.error("OpenAI Error:", data);
        return NextResponse.json({ error: data.error?.message || "Failed to fetch response from OpenAI" }, { status: response.status });
      }

      return NextResponse.json({ text: data.choices[0].message.content });
    }

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
