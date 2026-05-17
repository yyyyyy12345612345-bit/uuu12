import { NextResponse } from "next/server";
import { classifyQueryWithML } from "@/lib/ml-model";

export async function POST(req: Request) {
  try {
    const { messages, userData, pathname, leaderboard } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "صيغة الرسائل غير صحيحة" }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.Value || process.env.VALUE;

    const userPoints = userData?.totalPoints || userData?.points || 0;
    const userCountry = userData?.country || "غير محدد";
    const userMinutes = userData?.stats?.audioMinutes || 0;
    const userName = userData?.displayName || userData?.name || "أخي الكريم";
    const userPhone = userData?.phoneNumber || "غير مسجل";
    const userUsername = userData?.username || "غير مسجل";
    const userPlan = userData?.plan || "free";
    const userGender = userData?.gender === "male" ? "ذكر" : (userData?.gender === "female" ? "أنثى" : "غير محدد");
    const videoRenders = userData?.videoRendersCount || 0;
    const userCreatedAt = userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString("ar-EG") : "غير محدد";
    const isGuest = userData ? (userData.isGuest ? "نعم (حساب زائر)" : "لا (مستخدم مسجل)") : "نعم (حساب زائر)";

    // الحصول على آخر رسالة كتبها المستخدم
    const lastUserMessage = messages[messages.length - 1]?.text || "";

    // ── تصفية الرسائل لتوافق شروط هياكل الـ APIs ──
    // قانون Gemini و OpenAI للمحادثات التفاعلية: يجب أن تبدأ المحادثة برسالة من المستخدم (user) وليس الموديل (model).
    // نقوم باستبعاد رسالة الترحيب الأولى التلقائية للذكاء الاصطناعي لتفادي خطأ الـ 400 البنائي.
    let apiMessages = messages;
    if (apiMessages.length > 0 && apiMessages[0].sender === "bot") {
      apiMessages = apiMessages.slice(1);
    }

    const leaderboardList = leaderboard && leaderboard.length > 0
      ? leaderboard.map((u: any, idx: number) => `${idx + 1}. ${u.displayName} (@${u.username}) - ${u.totalPoints} نقطة - ${u.country}`).join("\n")
      : "1. يوسف أسامة (@youssef) - 5000 نقطة - مصر\n2. أحمد علي (@ahmed) - 4200 نقطة - السعودية\n3. عمر فاروق (@omar) - 3800 نقطة - الإمارات";

    // ── نظام تعليمات النظام ──
    const systemPrompt = `أنت المساعد الذكي الخاص بتطبيق "الاستوديو القرآني الفائق" فقط.
ممنوع تماماً الإجابة على أي سؤال خارج نطاق هذا التطبيق أو الإسلام والقرآن.
إذا سألك المستخدم عن أي شيء خارج هذا النطاق، قل له: "عذراً، أنا مساعدك الخاص بالاستوديو القرآني فقط 🌙"

معلومات عن مطور التطبيق:
- الاسم: يوسف اسامه
- التخصص: AIE (مهندس ذكاء اصطناعي)
- للتواصل: إنستقرام: aie_youssef

معلومات عن المستخدم الحالي المسجلة في قاعدة البيانات:
- الاسم بالكامل: ${userName}
- الاسم المميز (Username): ${userUsername}
- رقم الهاتف (WhatsApp/Phone): ${userPhone}
- مجموع النقاط: ${userPoints} نقطة
- باقة الاشتراك الحالية: ${userPlan}
- عدد رندرات الفيديوهات المنتجة: ${videoRenders}
- الجنس: ${userGender}
- بلد العميل: ${userCountry}
- تاريخ التسجيل: ${userCreatedAt}
- حساب زائر: ${isGuest}
- الصفحة التي يتصفحها العميل الآن: ${pathname || "غير معروف"}

خريطة النقاط والتحديات الخاصة بالتطبيق (Points Map Guide):
1. قراءة القرآن:
   - قراءة صفحة كاملة (بشرط بقاء العميل 10 ثوانٍ) -> يربح +5 نقاط (أعلى نشاط قراءة).
   - قراءة آية واحدة (بشرط بقاء العميل ثانيتين) -> يربح +0.2 نقطة (أقل نشاط يعطي نقاطاً).
2. استماع القرآن (المكتبة الصوتية):
   - الاستماع (كل 30 ثانية) -> يربح +1 نقطة (مكافأة دورية مستمرة).
   - ختم سورة كاملة استماعاً -> يربح +10 نقاط (مكافأة ختم السورة - أعلى مكافأة ثابتة).
3. الأذكار واليوميات:
   - قراءة ذكر في صفحة "يومياتي" (أذكار الصباح، المساء، النوم) -> يربح +1 نقطة.
   - قراءة ذكر من "المكتبة" -> يربح +0.5 نقطة.
4. السبحة الإلكترونية:
   - كل 99 تسبيحة -> يربح +3 نقاط.
5. التحديات والمهام اليومية:
   - إنهاء تحديات اليوم -> يمنح نقاطاً متغيرة ضخمة.

* ملخص: أكثر نشاط يعطي نقاطاً دفعة واحدة هو ختم سورة كاملة (+10 نقاط) أو إنهاء التحديات اليومية (مكافآت متغيرة ضخمة). وأقل نشاط هو قراءة آية واحدة (+0.2 نقطة).

قائمة المتصدرين الأوائل في لوحة الشرف حالياً (Top Leaderboard Ranking):
${leaderboardList}

* نصيحة ذكية للمستخدم بناءً على موقعه في لوحة المتصدرين:
- إذا كان في صدارة القائمة أو قريباً منها: شجّعه على الاستمرار في القراءة والمحافظة على الصدارة وحصاد الحسنات.
- إذا كان بعيداً عن المتصدرين: انصحه بالتركيز على النشاطات ذات المكافآت المرتفعة مثل ختم سورة استماعاً (+10 نقاط) أو قراءة صفحة قرآنية كاملة (+5 نقاط)، والقيام بالأذكار اليومية لتسلق الترتيب!

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
      const geminiContents = apiMessages.map((m: any) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const modelsToTry = [
        "gemini-2.5-flash",
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
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
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
              ...apiMessages.map((m: any) => ({
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
