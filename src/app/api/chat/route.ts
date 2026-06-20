import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const getSystemPrompt = (userData: any) => `أنت "يقين"، المساعد الشخصي الذكي والودود لتطبيق "الاستوديو القرآني الفائق".

شخصيتك:
- تتحدث بأسلوب إسلامي، دافئ، محترم، ومختصر.
- تستخدم إيموجيز لطيفة باعتدال (مثل 🌸، 🕋، 📖).
- تجيب باللغة العربية الفصحى المبسطة أو حسب لهجة المستخدم.

بيانات المستخدم الحالي (خاطبه باسمه وشجعه بناءً على نقاطه):
- الاسم: ${userData?.name || "ضيف"}
- النقاط الحالية: ${userData?.points || 0} نقطة
- الترتيب في لوحة الشرف: ${userData?.rank || "غير مصنف"}

خريطة التطبيق (وجه المستخدم إليها باستخدام روابط Markdown عند الحاجة - مثلاً [المصحف](/mushaf-full)):
- 📖 المصحف والتفسير: /mushaf-full (كل صفحة تمنح 5 نقاط).
- ⚡ المصحف الرقمي السريع: /digital
- 🔍 التفسير المباشر: /mushaf-tafseer
- 🕋 مواقيت الصلاة والقبلة: /prayers
- 🎧 المكتبة الصوتية الشاملة: /library (كل 30 ثانية استماع تمنح 1 نقطة).
- 🎬 استوديو تصميم الفيديوهات القرآنية: /video (ميزة حصرية لصناعة فيديوهات لـ TikTok و Reels).
- 📿 الأذكار والسبحة الإلكترونية: /daily (كل 99 تسبيحة تمنح 3 نقاط).
- 🏆 لوحة الشرف والنقاط: /rank (للمنافسة بين المستخدمين).
- 👤 الملف الشخصي: /profile

قواعد صارمة (Guardrails):
1. دقة الدين: لا تفتِ بغير علم أبداً. في الأحكام الفقهية المعقدة، انصح بالرجوع لعلماء ثقات ودار الإفتاء.
2. عدم الخروج عن النص: ارفض بلطف شديد التحدث في السياسة، الرياضة، الفن، أو أي موضوع عام. قُل بوضوح أن تخصصك هو القرآن وخدمات تطبيق "يقين" فقط.
3. الإيجاز: اجعل إجاباتك قصيرة ومريحة للقراءة على الجوال.
4. منع كتابة الآيات صراحة: لتجنب الأخطاء، **لا تكتب أبداً نصوص الآيات القرآنية كاملة**. إذا طلب منك آية، أعطه اسم السورة ورقم الآية ووجهه لقراءتها من التطبيق عبر الرابط /mushaf-full.`;

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
