import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.Value || process.env.VALUE;
    const openAiKey = process.env.OPENAI_API_KEY;

    const systemPrompt = `أنت خبير في العلوم الإسلامية والقرآنية ومسؤول عن وضع أسئلة ثقافية دينية. مهمتك توليد سؤال مسابقة دينية تفاعلية باللغة العربية.
يجب أن ترجع ردك بصيغة JSON فقط دون أي نصوص إضافية أو علامات \`\`\`json.
الهيكل المطلوب:
{
  "question": "السؤال هنا؟",
  "options": ["الخيار الأول", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"],
  "correctAnswerIndex": 0,
  "explanation": "شرح مفصل وواضح مع الاستشهاد بالقرآن أو السنة عند الإمكان"
}
تأكد من أن خياراً واحداً فقط هو الصحيح، وأن تتطابق قيم correctAnswerIndex مع فهرس الخيار الصحيح (0 للفهرس الأول، 1 للثاني، إلخ).`;

    // 1. Try Gemini
    if (geminiKey) {
      const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-pro"];
      for (const model of models) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify({
                systemInstruction: {
                  parts: [{ text: systemPrompt }]
                },
                contents: [{
                  role: "user",
                  parts: [{ text: "ولد سؤالاً إسلامياً جديداً ومتنوعاً ومحفزاً للتفكير." }]
                }],
                generationConfig: {
                  temperature: 0.9,
                  maxOutputTokens: 800,
                  responseMimeType: "application/json"
                }
              })
            }
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            const resData = await response.json();
            const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              let cleanText = text.trim();
              if (cleanText.startsWith("```")) {
                cleanText = cleanText.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
              }
              const parsed = JSON.parse(cleanText);
              if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4) {
                parsed.correctAnswerIndex = Number(parsed.correctAnswerIndex);
                return NextResponse.json(parsed);
              }
            }
          }
        } catch (e) {
          console.error(`Gemini quiz model ${model} error:`, e);
        }
      }
    }

    // 2. Try OpenAI fallback
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
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: "ولد سؤالاً إسلامياً جديداً ومتنوعاً ومحفزاً للتفكير." }
            ],
            temperature: 0.9
          })
        });

        if (response.ok) {
          const resData = await response.json();
          const content = resData.choices?.[0]?.message?.content;
          if (content) {
            let cleanContent = content.trim();
            if (cleanContent.startsWith("```")) {
              cleanContent = cleanContent.replace(/^```(?:json)?\s*/i, "").replace(/```$/, "").trim();
            }
            const parsed = JSON.parse(cleanContent);
            if (parsed.question && Array.isArray(parsed.options) && parsed.options.length === 4) {
              parsed.correctAnswerIndex = Number(parsed.correctAnswerIndex);
              return NextResponse.json(parsed);
            }
          }
        }
      } catch (e) {
        console.error("OpenAI quiz error:", e);
      }
    }

    // 3. Fallback to a static random question if API keys aren't configured or fail
    const staticQuestions = [
      {
        question: "ما هي السورة التي تسمى 'عروس القرآن'؟",
        options: ["سورة الرحمن", "سورة يس", "سورة الواقعة", "سورة الملك"],
        correctAnswerIndex: 0,
        explanation: "سورة الرحمن تسمى عروس القرآن لما ورد في بعض الأحاديث والآثار عن جمال فواصلها وعظم نعم الله المذكورة فيها."
      },
      {
        question: "ما معنى كلمة 'الأنفال' الواردة في مطلع السورة الكريمة؟",
        options: ["العهود والمواثيق", "الغنائم والأنصبة", "العبادات والسنن", "المعارك والحروب"],
        correctAnswerIndex: 1,
        explanation: "الأنفال هي الغنائم التي يغنمها المسلمون من عدوهم في الحرب."
      },
      {
        question: "من هو أول من أسلم من الصبيان؟",
        options: ["أبو بكر الصديق", "علي بن أبي طالب", "زيد بن حارثة", "عبد الله بن مسعود"],
        correctAnswerIndex: 1,
        explanation: "علي بن أبي طالب رضي الله عنه كان أول من أسلم من الصبيان وهو ابن عشر سنين."
      }
    ];
    const randomQ = staticQuestions[Math.floor(Math.random() * staticQuestions.length)];
    return NextResponse.json(randomQ);

  } catch (err: any) {
    console.error("Quiz API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
