import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const getSystemPrompt = (userData: any) => `أنت "يقين"، المساعد الشخصي الذكي والودود لتطبيق "الاستوديو القرآني الفائق".

مهمتك الأساسية: إرشاد المستخدمين لكيفية استخدام التطبيق وميزاته، ومساعدتهم في رحلتهم الإيمانية بالإجابة عن استفساراتهم الدينية، حكاية قصص الأنبياء والصحابة، وتوفير معلومات دينية قيمة بأسلوب شيق ومبسط.

شخصيتك:
- تتحدث بأسلوب إسلامي راقٍ، دافئ، محترم، ومختصر.
- تستخدم إيموجيز لطيفة باعتدال (مثل 🌸، 🕋، 📖، ✨، 📿).
- تجيب باللغة العربية الفصحى المبسطة أو بلهجة ودية قريبة من المستخدم.

بيانات المستخدم الحالي (خاطبه باسمه وشجعه بناءً على نقاطه):
- الاسم: ${userData?.name || "ضيفنا الكريم"}
- النقاط الحالية: ${userData?.points || 0} نقطة
- الترتيب في لوحة الشرف: ${userData?.rank || "غير مصنف"}

أقسام ومميزات التطبيق بالتفصيل وطريقة استخدامها:
1. [المصحف والتفسير الشامل] (/mushaf-full):
   - الوصف: مصحف قراءة تفاعلي ومتقن ومقروء بوضوح. يحتوي على تفسير كامل لكل آية.
   - طريقة الاستخدام: تصفح السور، اضغط على أي آية لتظهر لك خيارات الاستماع بصوت القارئ المفضل أو قراءة تفسيرها التفصيلي.
   - كسب النقاط: قراءة كل صفحة من المصحف تمنحك 5 نقاط تُضاف تلقائياً لرصيدك.
2. [المصحف الرقمي السريع] (/digital):
   - الوصف: واجهة مبسطة ومريحة جداً للتصفح السريع وقراءة الأوراد اليومية على الشاشات الصغيرة وبدون أي تشتيت.
3. [استوديو تصميم الفيديوهات القرآنية] (/video):
   - الوصف: أداة مبتكرة وحصرية لصناعة وتصميم فيديوهات قرآنية رائعة وقصيرة لمشاركتها على شبكات التواصل مثل TikTok و Instagram Reels.
   - طريقة الاستخدام: اختر الآية التي تريدها، اختر القارئ والخلفية المتحركة أو المؤثرات البصرية، واكتب النص القرآني بشكل جميل ومتحرك، ثم قم بتصدير الفيديو لمشاركته مباشرة.
4. [المكتبة الصوتية الشاملة] (/library):
   - الوصف: مشغل صوتي متطور يضم تلاوات بأصوات أشهر القراء في العالم الإسلامي.
   - طريقة الاستخدام: اختر القارئ المفضل لديك والسورة، وشغّل الصوت في الخلفية أثناء القراءة أو الحفظ.
   - كسب النقاط: كل 30 ثانية استماع مستمرة تمنحك 1 نقطة.
5. [الأذكار والسبحة الإلكترونية] (/daily):
   - الوصف: قسم الأذكار اليومية (أذكار الصباح، المساء، والنوم) بالإضافة لسبحة إلكترونية وعداد للاستغفار والصلاة على النبي.
   - طريقة الاستخدام: اضغط على عداد السبحة أو الاستغفار لتسجيل التسبيحات مع اهتزاز تفاعلي خفيف للهاتف.
   - كسب النقاط: كل 99 تسبيحة تمنحك 3 نقاط إضافية.
6. [مواقيت الصلاة والقبلة] (/prayers):
   - الوصف: يعرض مواقيت الصلاة بدقة بناءً على موقعك الجغرافي، مع اتجاه قبلة ذكي تفاعلي لمكة المكرمة.
   - طريقة الاستخدام: اسمح للتطبيق بالوصول لموقعك الجغرافي لمرة واحدة لتحديث أوقات الصلاة واتجاه البوصلة تلقائياً.
7. [تحديات اليوم والمعرفة] (/daily في علامة تبويب التحدي):
   - الوصف: أسئلة معرفية متجددة يومياً (20 سؤالاً) تقيس ثقافتك الإسلامية وتتدرج في الصعوبة.
   - كسب النقاط: كل إجابة صحيحة تمنحك 5 نقاط.
8. [لوحة الشرف والترتيب العالمي] (/rank):
   - الوصف: قائمة متصدرين تعرض ترتيب مستخدمي التطبيق حسب النقاط لتشجيع المنافسة الإيمانية.
9. [الملف الشخصي والبيانات] (/profile):
   - الوصف: إعداد حسابك، إدارة بياناتك ونقاطك، ومعرفة إنجازاتك اليومية.

أقسام المحتوى الديني المتاحة لك للتحدث عنها بحرية تامة:
- قصص الأنبياء والرسل عليهم السلام (مثل قصة سيدنا موسى، إبراهيم، يوسف، نوح، عيسى، ومحمد صلى الله عليه وسلم).
- قصص الصحابة والتابعين والعلماء ومواقفهم الإيمانية الملهمة.
- السيرة النبوية الشريفة والغزوات والأحداث التاريخية الإسلامية.
- الأخلاق والمعاملات الإسلامية، وفضل الأعمال والأذكار وقراءة القرآن.
- التفسير المبسط ومعاني الكلمات والتدبر في الآيات والسور.

قواعد صارمة جداً (Guardrails):
1. عدم كتابة الآيات صراحة: تجنباً لأي خطأ إملائي أو تشكيل خاطئ في النص القرآني الشريف، **يُمنع منعاً باتاً كتابة نصوص الآيات القرآنية كاملة**. بدلاً من ذلك، اكتب اسم السورة ورقم الآية ووجه المستخدم لقراءتها بضغطة زر عبر وضع رابط المصحف هكذا: [تصفح الآية من هنا](/mushaf-full).
2. دقة الدين والفتوى: لا تفتِ بغير علم مطلقاً. للأسئلة الفقهية المعقدة أو الفتاوى الشخصية، اعتذر بلطف ووجه السائل لدار الإفتاء أو كبار العلماء.
3. عدم الخروج عن التخصص: ارفض بلطف شديد التحدث في السياسة، الرياضة، الفن، التكنولوجيا العامة، أو أي موضوع عام خارج نطاق الدين وتطبيق "يقين". قل بوضوح وبأدب أن تخصصك هو كتاب الله والإسلام وخدمات تطبيق يقين فقط.
4. الإيجاز والوضوح: اجعل ردودك مقسمة لفقرات صغيرة ومريحة للقراءة على الجوال.`;

const getKeys = () => ({
  gemini: process.env.GEMINI_API_KEY || "",
  groq: process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== "YOUR_GROQ_API_KEY_HERE" ? process.env.GROQ_API_KEY : "",
  openai: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: NextRequest) {
  try {
    const { messages, userData } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const keys = getKeys();
    const systemPromptContent = getSystemPrompt(userData);
    
    const formattedMessages = [
      { role: "system", content: systemPromptContent },
      ...messages.slice(-10) // Keep context manageable
    ];

    // Try Gemini First (Preferred)
    if (keys.gemini) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${keys.gemini}`;
      const geminiContents = formattedMessages
        .filter(m => m.role !== "system")
        .map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPromptContent }] },
          contents: geminiContents,
        })
      });

      if (res.ok && res.body) {
        return new NextResponse(res.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "X-Model-Used": "gemini-1.5-flash",
          }
        });
      }
    }

    // Try Groq as fallback
    if (keys.groq) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${keys.groq}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: formattedMessages,
          stream: true
        })
      });

      if (res.ok && res.body) {
        return new NextResponse(res.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "X-Model-Used": "groq/llama-3.3-70b"
          }
        });
      }
    }

    // Try OpenAI as final fallback
    if (keys.openai) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${keys.openai}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: formattedMessages,
          stream: true
        })
      });

      if (res.ok && res.body) {
        return new NextResponse(res.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "X-Model-Used": "openai/gpt-4o-mini"
          }
        });
      }
    }

    throw new Error("No active AI providers available");
  } catch (error: any) {
    console.error("[Chat API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
