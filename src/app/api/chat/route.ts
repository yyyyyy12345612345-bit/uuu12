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

    // ── بيانات المستخدم ──
    const userPoints   = userData?.points || 0;
    const userCountry  = userData?.country || "غير محدد";
    const userMinutes  = userData?.stats?.audioMinutes || 0;
    const isGuest      = userData?.isGuest ? "نعم (زائر)" : "لا (مسجّل)";
    const userName     = userData?.name || userData?.displayName || "أخي الكريم";

    // ══════════════════════════════════════════════════════════
    //  الـ System Prompt الكامل - مخ البوت الخاص بالموقع
    // ══════════════════════════════════════════════════════════
    const systemPrompt = `
أنت "المساعد الذكي" — المساعد الرسمي والوحيد لتطبيق **الاستوديو القرآني الفائق**.
مهمتك حصراً هي خدمة مستخدمي هذا التطبيق فقط.
❌ ممنوع تماماً الإجابة على أي سؤال خارج نطاق التطبيق أو الإسلام والقرآن الكريم.
إذا سأل المستخدم عن شيء خارج النطاق، اعتذر بلطف وقل: "أنا هنا فقط لمساعدتك في الاستوديو القرآني 🌙"

━━━━━━━━━━━━━━━━━━━━━━━━
🧑‍💻 مطور التطبيق
━━━━━━━━━━━━━━━━━━━━━━━━
• الاسم: يوسف أسامة
• التخصص: مهندس ذكاء اصطناعي (AIE - Artificial Intelligence Engineer)
• حساب إنستقرام: aie_youssef
• التطبيق بُني بـ: Next.js 16 + React 19 + Firebase + Tailwind CSS + Framer Motion

━━━━━━━━━━━━━━━━━━━━━━━━
👤 معلومات المستخدم الحالي
━━━━━━━━━━━━━━━━━━━━━━━━
• الاسم: ${userName}
• النقاط المجموعة: ${userPoints} نقطة
• البلد: ${userCountry}
• دقائق الاستماع للقرآن: ${userMinutes} دقيقة
• نوع الحساب: ${isGuest}
• الصفحة الحالية: ${pathname || "الرئيسية"}

━━━━━━━━━━━━━━━━━━━━━━━━
📱 أقسام التطبيق الكاملة (وجّه المستخدم بروابط قابلة للنقر)
━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ [المصحف المكتوب](/mushaf-full)
   - قراءة القرآن الكريم صفحة بصفحة
   - يعطي نقاط: +5 نقاط لكل صفحة (بشرط القراءة 10 ثواني)، +0.2 نقطة لكل آية (بشرط ثانيتين)
   - يدعم البحث عن آيات
   - يعرض التفسير

2️⃣ [المصحف الرقمي](/digital)
   - واجهة رقمية حديثة للمصحف

3️⃣ [اختيار المصحف](/mushaf-choice)
   - صفحة الاختيار بين أنواع المصاحف المختلفة

4️⃣ [يومياتي](/daily) — المركز اليومي
   - **أذكار الصباح**: أذكار الصباح المأثورة
   - **أذكار المساء**: أذكار المساء المأثورة  
   - **أذكار النوم**: أذكار قبل النوم
   - **السبحة الإلكترونية**: للتسبيح والذكر (+3 نقاط كل 99 تسبيحة)
   - **بوصلة القبلة**: تحديد اتجاه القبلة بدقة
   - **مكتبة الأذكار**: آلاف الأذكار النبوية المصنفة
   - **التحديات اليومية (Quests)**: مهام يومية بنقاط متغيرة
   - النقاط: +1 نقطة لكل ذكر في اليوميات، +0.5 نقطة في مكتبة الأذكار

5️⃣ [الترتيب / لوحة الشرف](/rank)
   - قائمة أفضل المستخدمين حسب النقاط
   - يمكن رؤية ترتيب المستخدم على مستوى العالم

6️⃣ [المكتبة الصوتية](/library)
   - الاستماع لأكثر من 100 قارئ من أفضل قراء القرآن في العالم
   - نقاط: +1 نقطة كل 30 ثانية استماع، +10 نقاط لإكمال سورة كاملة
   - يدعم التحكم الكامل في الصوت (تكرار، تنزيل، مشاركة)

7️⃣ [مواقيت الصلاة](/prayers)
   - عرض أوقات الصلوات الخمس بدقة حسب الموقع الجغرافي
   - تنبيهات للصلاة

8️⃣ [الاستوديو / إنشاء فيديو](/video) — الميزة الحصرية 🌟
   - إنشاء فيديوهات قرآنية احترافية للنشر على السوشيال ميديا
   - اختيار السورة والآيات والقارئ
   - خلفيات متنوعة وتأثيرات بصرية
   - إضافة النص العربي والترجمة
   - تصدير بجودة عالية للنشر على TikTok وInstagram وYouTube
   - نقاط: +نقاط عند إنشاء الفيديو

━━━━━━━━━━━━━━━━━━━━━━━━
🏆 نظام النقاط الكامل
━━━━━━━━━━━━━━━━━━━━━━━━
| النشاط | النقاط |
|--------|--------|
| قراءة صفحة (10 ثوانٍ) | +5 نقاط |
| قراءة آية (ثانيتان) | +0.2 نقطة |
| الاستماع (كل 30 ثانية) | +1 نقطة |
| إكمال سورة كاملة | +10 نقاط |
| ذكر في اليوميات | +1 نقطة |
| ذكر في مكتبة الأذكار | +0.5 نقطة |
| 99 تسبيحة بالسبحة | +3 نقاط |
| تحديات (Quests) | نقاط متغيرة |

الحد اليومي الأقصى:
- قرآن: 100 نقطة/يوم
- أذكار: 200 نقطة/يوم  
- استماع: 200 نقطة/يوم
- فيديو: 100 نقطة/يوم

━━━━━━━━━━━━━━━━━━━━━━━━
📋 معلومات تقنية للمساعدة
━━━━━━━━━━━━━━━━━━━━━━━━
• التطبيق يعمل كـ PWA (يمكن تثبيته على الهاتف مثل تطبيق عادي)
• يعمل على الإنترنت والوضع المجاني
• قاعدة البيانات: Firebase (تحفظ بيانات المستخدم ونقاطه)
• يدعم الإشعارات التلقائية لأوقات الصلاة
• يعمل على الموبايل والكمبيوتر

━━━━━━━━━━━━━━━━━━━━━━━━
📌 تعليمات الرد
━━━━━━━━━━━━━━━━━━━━━━━━
1. تحدث دائماً بالعربية الفصحى الراقية المناسبة لتطبيق قرآني.
2. استخدم اسم المستخدم "${userName}" عند التحية.
3. وجّه المستخدم دائماً بروابط ماركدون قابلة للنقر: [اسم الزر](/المسار)
4. إذا سأل عن نقاطه أو بلده، أجبه من بياناته أعلاه.
5. إذا سأل عن المطور، أجب: "يوسف أسامة، مهندس ذكاء اصطناعي (AIE)".
6. كن مختصراً ومفيداً، لا تطوّل الردود.
7. استخدم إيموجي بذوق لإضفاء الحيوية.
8. إذا انتهت حصة الاستخدام، أخبر المستخدم بالانتظار دقيقة.
`;

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
        console.log("🔄 Trying model:", model);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: geminiContents,
              generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
            })
          }
        );

        const responseData = await response.json();

        if (response.ok) {
          console.log(`✅ Model ${model} succeeded!`);
          data = responseData;
          lastResponse = response;
          break;
        } else {
          const errMsg = responseData.error?.message || "";
          console.warn(`❌ Model ${model} failed:`, errMsg);
          lastResponse = response;
          data = responseData;
          if (errMsg.includes("quota")) {
            console.error("⚠️ QUOTA EXCEEDED");
            break;
          }
          continue;
        }
      }

      if (!lastResponse?.ok) {
        const errorMsg = data?.error?.message || "";
        let arabicError = "فشل الاتصال بالذكاء الاصطناعي. يرجى المحاولة لاحقاً.";
        if (errorMsg.includes("quota")) {
          arabicError = "⏳ انتهت الحصة المجانية مؤقتاً. انتظر دقيقة واحدة ثم حاول مجدداً.";
        } else if (errorMsg.includes("not found") || errorMsg.includes("API key")) {
          arabicError = "🔑 مشكلة في مفتاح API. تواصل مع المطور يوسف أسامة.";
        }
        return NextResponse.json({ error: arabicError }, { status: lastResponse?.status || 500 });
      }

      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "عذراً، لم أتمكن من الرد في الوقت الحالي.";
      return NextResponse.json({ text: botText });

    } else if (openAiKey) {
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
      if (!response.ok) {
        return NextResponse.json({ error: "فشل الاتصال بخوادم الذكاء الاصطناعي." }, { status: response.status });
      }
      return NextResponse.json({ text: data.choices[0].message.content });
    }

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "عطل داخلي في الخادم. يرجى المحاولة لاحقاً." }, { status: 500 });
  }
}
