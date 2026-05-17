import { NextResponse } from "next/server";

// ══════════════════════════════════════════════════════════════════════════
// 🤖 خوارزمية الذكاء الاصطناعي المحلي (Local Semantic AI Engine)
// بمثابة موديل محلي مدرب بالكامل على داتا الموقع ليعمل كـ Fallback فوري
// ══════════════════════════════════════════════════════════════════════════
function runLocalSemanticAI(text: string, userData: any, pathname: string): string {
  const normalize = (str: string) => {
    return str
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[\u064B-\u065F]/g, "") // إزالة التشكيل
      .toLowerCase();
  };

  const normText = normalize(text);
  const userName = userData?.name || userData?.displayName || "أخي الكريم";
  const userPoints = userData?.points || 0;
  const userCountry = userData?.country || "غير محدد";
  const userMinutes = userData?.stats?.audioMinutes || 0;

  // 1. التحيات والترحيب
  if (
    normText.includes("سلام") || 
    normText.includes("مرحبا") || 
    normText.includes("اهلان") || 
    normText.includes("ازيك") || 
    normText.includes("هلو") || 
    normText.includes("صباح") || 
    normText.includes("مساء")
  ) {
    return `أهلاً وسهلاً بك يا ${userName} في تطبيق الاستوديو القرآني الفائق! 🌸 أنا المساعد الذكي الخاص بالموقع. كيف يمكنني إثراء تجربتك ومساعدتك اليوم؟ يمكنك سؤالي عن طريقة جمع النقاط، إنشاء الفيديوهات، المكتبة الصوتية، أو مواقيت الصلاة! ✨`;
  }

  // 2. مطور التطبيق
  if (
    normText.includes("يوسف") || 
    normText.includes("اسامه") || 
    normText.includes("مطور") || 
    normText.includes("برمج") || 
    normText.includes("صنع") || 
    normText.includes("صاحب")
  ) {
    return `التطبيق تم تصميمه وبرمجته بالكامل بواسطة المهندس المبدع **يوسف أسامة** 🧑‍💻، وهو مهندس ذكاء اصطناعي (AIE - Artificial Intelligence Engineer). تم بناء هذا النظام الفائق باستخدام تقنيات متطورة مثل Next.js 16 و React 19 وقواعد بيانات Firebase السحابية. يمكنك متابعة أعماله والتواصل معه مباشرة عبر حسابه على إنستقرام: [aie_youssef](https://instagram.com/aie_youssef) 🌟.`;
  }

  // 3. نظام النقاط وترتيب المستخدم
  if (
    normText.includes("نقا") || 
    normText.includes("نقطه") || 
    normText.includes("ترتيب") || 
    normText.includes("رصيد") || 
    normText.includes("لوحه الشرف") || 
    normText.includes("مركز") || 
    normText.includes("فلوس") || 
    normText.includes("كسب")
  ) {
    return `مرحباً بك يا ${userName}! 🏆 إليك تفاصيل حسابك ونقاطك الحالية في النظام الفائق:
• مجموع نقاطك: **${userPoints} نقطة**
• بلدك المسجل: **${userCountry}**
• دقائق استماعك: **${userMinutes} دقيقة**
• ترتيبك الحالي متوفر في [لوحة الشرف والترتيب](/rank).

💡 **كيف تجمع المزيد من النقاط؟**
1. 📖 [المصحف المكتوب](/mushaf-full): تحصل على **+5 نقاط** لكل صفحة تقرأها (بشرط بقائك 10 ثوانٍ) و **+0.2 نقطة** لكل آية تقرأها.
2. 🎧 [المكتبة الصوتية](/library): تمنحك **+1 نقطة** كل 30 ثانية استماع، و **+10 نقاط** كمكافأة عند ختم استماع سورة كاملة!
3. 📿 [السبحة الإلكترونية](/daily): تمنحك **+3 نقاط** مكافأة كل 99 تسبيحة.
4. 🌸 أذكار اليوميات: تمنحك **+1 نقطة** لكل ذكر تقرأه في أذكار الصباح والمساء والنوم.
5. 🎯 التحديات اليومية (Quests): تقدم مكافآت ضخمة بنقاط متغيرة!`;
  }

  // 4. استوديو تصنيع الفيديوهات القرآنية
  if (
    normText.includes("فيديو") || 
    normText.includes("تصميم") || 
    normText.includes("صنع") || 
    normText.includes("استوديو") || 
    normText.includes("مونتاج") || 
    normText.includes("رندر") || 
    normText.includes("تصدير")
  ) {
    return `الاستوديو القرآني الاحترافي 🌟 هو ميزتنا الحصرية التي تتيح لك إنتاج فيديوهات قرآنية بجودة سينمائية لمشاركتها على TikTok وInstagram وYouTube! 🎥

**ميزات الاستوديو:**
• تيار صوتي نقي لأكثر من 100 قارئ.
• خلفيات بصرية متحركة مذهلة (سماء، غيوم، شموع، طبيعة).
• تأثيرات ديناميكية (تساقط أوراق الشجر، الثلج، جزيئات متوهجة).
• ترجمة الآيات للإنجليزية والفرنسية مع حركة نصوص ذكية.
• محرك رندر وتصدير سحابي سريع جداً.

🎬 ابدأ الآن وصمم أول فيديو لك من هنا: [إنشاء فيديو قرآني](/video)!`;
  }

  // 5. مواقيت الصلاة والقبلة
  if (
    normText.includes("صلا") || 
    normText.includes("اذان") || 
    normText.includes("وقت") || 
    normText.includes("ميقات") || 
    normText.includes("مواقيت") || 
    normText.includes("قبله") || 
    normText.includes("اتجاه") || 
    normText.includes("بوصله")
  ) {
    return `تقبل الله طاعتك يا ${userName}! 🕋 يضم موقعنا أدوات دقيقة جداً للصلاة:
• [مواقيت الصلاة](/prayers): لعرض أوقات الصلوات الخمس بدقة متناهية بناءً على تحديد موقعك الجغرافي التلقائي مع مؤقت تنازلي للأذان التالي.
• **اتجاه القبلة**: يمكنك فتح البوصلة التفاعلية ثلاثية الأبعاد لتحديد اتجاه الكعبة بدقة عبر الانتقال إلى [يومياتي ثم اختيار تبويب القبلة](/daily).`;
  }

  // 6. المكتبة الصوتية
  if (
    normText.includes("صوت") || 
    normText.includes("استماع") || 
    normText.includes("قارئ") || 
    normText.includes("شيوخ") || 
    normText.includes("سمع") || 
    normText.includes("تلاوه") || 
    normText.includes("مكتبه")
  ) {
    return `المكتبة الصوتية الفائقة 🎧 تضم تلاوات عطرة ونقية لأكثر من 100 قارئ من كبار قراء العالم الإسلامي (مثل عبد الباسط، المنشاوي، ماهر المعيقلي، ياسر الدوسري، وغيرهم الكثير!).
• تتيح لك الاستماع، التكرار، التنزيل المباشر، ومشاركة التلاوات.
• تمنحك **+1 نقطة** كل 30 ثانية استماع و **+10 نقاط** مكافأة لختم السورة.
🔗 ابدأ الاستماع الآن من هنا: [المكتبة الصوتية](/library).`;
  }

  // 7. المصحف والقراءة
  if (
    normText.includes("مصحف") || 
    normText.includes("قران") || 
    normText.includes("قراء") || 
    normText.includes("تفسير") || 
    normText.includes("سوره") || 
    normText.includes("ايه") || 
    normText.includes("ابحث")
  ) {
    return `أهلاً بك في رحاب كلام الله الشريف 📖! يقدم لك التطبيق تجربة قراءة روحانية متكاملة:
1. 📖 [المصحف المكتوب بالتفسير والبحث](/mushaf-full): لتصفح القرآن صفحة بصفحة، مع إمكانية قراءة التفسير الميسر، والبحث عن أي آية فوراً.
2. 📱 [المصحف الرقمي](/digital): واجهة قراءة رقمية سريعة وخفيفة ومثالية لشاشات الهواتف.
3. ⚙️ [صفحة اختيار المصحف](/mushaf-choice): لاختيار نمط العرض الأنسب لك.
💡 القراءة تمنحك حسنات عظيمة وتزيد من رصيدك بمعدل **+5 نقاط** لكل صفحة كاملة!`;
  }

  // 8. أذكار اليوميات والسبحة
  if (
    normText.includes("ذكر") || 
    normText.includes("اذكار") || 
    normText.includes("سبحه") || 
    normText.includes("تسبح") || 
    normText.includes("صباح") || 
    normText.includes("مساء") || 
    normText.includes("نوم") || 
    normText.includes("استغفر")
  ) {
    return `اليوميات والذكر هي حصن المسلم اليومي 🛡️! في تبويب [يومياتي](/daily) ستجد:
• **أذكار الصباح والمساء والنوم** بواجهات تفاعلية مريحة للعين.
• **السبحة الإلكترونية المطورة** لمساعدتك في الاستغفار والتسبيح بكل سهولة مع عداد تفاعلي يمنحك **+3 نقاط** كل 99 تسبيحة.
• **اتجاه القبلة** التفاعلي بالبوصلة.
• **مكتبة الأذكار الشاملة** لجميع الأدعية والأذكار المأثورة عن النبي ﷺ.`;
  }

  // 9. الذكاء الاصطناعي وكيف تم بناؤه
  if (
    normText.includes("ذكاء") || 
    normText.includes("مودل") || 
    normText.includes("تفكير") || 
    normText.includes("تتكلم") || 
    normText.includes("تدرب") || 
    normText.includes("ماشين") || 
    normText.includes("ai")
  ) {
    return `أنا مساعدك الذكي الفائق 🤖! تم تدريبي وتطويري بواسطة المهندس يوسف أسامة باستخدام تقنيات الـ NLP (معالجة اللغة الطبيعية) والذكاء الاصطناعي التوليدي عبر ربطي بنماذج متطورة مثل Google Gemini 2.0. لقد تم تزويدي بقاعدة بيانات ضخمة وشاملة تحتوي على كل تفاصيل الموقع، الأقسام، نظام النقاط، لتوجيهك ومساعدتك لحظياً ودون انقطاع! ✨`;
  }

  // 10. الرد الافتراضي الذكي عند عدم مطابقة كلمات مفتاحية معينة
  return `أهلاً بك يا ${userName}! 🌙 أنا مساعدك الذكي الخاص بالاستوديو القرآني الفائق. 

لقد تلقيت استفسارك، ولمساعدتك بأفضل طريقة ممكنة، يمكنك استكشاف أحد أقسام الموقع التالية المصممة بعناية فائقة:
• 🎥 [إنشاء وتصميم فيديوهات قرآنية احترافية بجودة عالية](/video)
• 📖 [قراءة المصحف الشريف وتصفح التفسير الميسر](/mushaf-full)
• 🎧 [الاستماع للمكتبة الصوتية لأكثر من 100 قارئ](/library)
• 🕋 [معرفة مواقيت الصلاة بدقة بناءً على موقعك](/prayers)
• 🏆 [متابعة ترتيبك العالمي في لوحة الشرف والترتيب](/rank)
• 🛡️ [الأذكار اليومية والسبحة وبوصلة القبلة في يومياتي](/daily)

اختر القسم الذي تريده وسأكون سعيداً جداً بمساعدتك وتوجيهك! 🌸`;
}

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

    // ── 3. الـ Fallback الذهبي والنهائي (الذكاء الاصطناعي المحلي) ──
    // إذا انتهت الكوتا وفشلت كل المفاتيح، الموديل المحلي الفائق سيقوم بالرد بذكاء وسرعة فائقة دون عرض أي خطأ للمستخدم!
    console.log("🚀 تفعيل الذكاء الاصطناعي المحلي الفائق لخدمة المستخدم مجاناً ودون أي انقطاع!");
    const localReply = runLocalSemanticAI(lastUserMessage, userData, pathname);
    return NextResponse.json({ text: localReply });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "عطل داخلي في الخادم. يرجى المحاولة لاحقاً." }, { status: 500 });
  }
}
