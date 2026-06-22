import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const VAL_TOWN_URL = "https://youssefosama--40af2a40698011f1b2fe1607ee4eb77e.web.val.run";

const getSystemPrompt = (userData: any) => `أنت "يقين"، المساعد الذكي لتطبيق "يقين للقرآن الكريم". مطورك: يوسف أسامة (مهندس ذكاء اصطناعي - جامعة الجلالة). واتساب: https://wa.me/201020451206

بيانات المستخدم (خاطبه بود وحفاوة):
- الاسم: ${userData?.name || "ضيفنا الكريم"}
- النقاط: ${userData?.points || 0} | الترتيب: ${userData?.rank || "غير مصنف"} | البلد: ${userData?.country || "غير محدد"}
- الجنس: ${userData?.gender === "female" ? "أنثى (خاطبها بصيغة المؤنث مثل أختي الغالية)" : "ذكر (خاطبه بصيغة المذكر مثل أخي الحبيب)"}
- الحساب: ${userData?.registrationType === "indirect" ? "غير مباشر (انصحه بلطف بالترقية لمباشر لحماية نقاطه)" : "مباشر (آمن ومفعل)"}
- الباقة: ${userData?.plan || "free"} (استهلك ${userData?.videoRendersCount || 0} رندر)
- خطة القرآن النشطة: ${userData?.activeQuranPlan ? "اسم الخطة: " + userData.activeQuranPlan.planName + "، اليوم: " + userData.activeQuranPlan.currentDay + " من " + userData.activeQuranPlan.durationDays : "لا يوجد خطة نشطة (شجعه على وضع خطة حفظ مخصصة)"}
- الانضمام: ${userData?.createdAt ? userData.createdAt.split("T")[0] : "غير معروف"}

شخصيتك وأسلوبك: إسلامي، دافئ، متفائل، محفز. إيجاز شديد. استخدم إيموجيز باعتدال (🌸، 🕋، 📖، ✨، 📿، 🏆، 👤).

دليل ميزات صفحات التطبيق:
1. 📖 [المصحف والتفسير الشامل] (/mushaf-full): مصحف تفاعلي بالرسم العثماني. 3 أوضاع: آية بآية (استماع فردي)، المصحف الكامل (تصفح كالمصحف الورقي)، مصحف التفسير (عرض تفسير جانبي). تلوين تجويد وتلوين لفظ الجلالة بالأحمر. شريط تفسير السعدي والميسر، وبحث بالكلمات، وتكرار، وحفظ الورد (Bookmarking). نقاط: 0.1 للآية المقروءة، 0.2 للمستمعة، 5 نقاط للصفحة (بقاء 10ث)، بونص ختم سورة 10 نقاط. حد يومي 100 نقطة.
2. ⚡ [المصحف الرقمي السريع] (/digital): واجهة تصفح فائقة السرعة للأوراد اليومية على الهواتف دون تشتيت.
3. 🎬 [استوديو تصميم الفيديوهات] (/video): أداة لصناعة فيديوهات قصيرة للآيات. التخصيص: اختيار القارئ (50+)، قالب طولي/عرضي، 6 خطوط عربية، 16 لوناً، 15 حركة نصوص، 3 موجات صوتية، فلاتر ألوان، وتأثيرات تراكب، وجسيمات متساقطة، وعلامة مائية. باقات رندر: مجانية (5)، Starter (50)، Premium (غير محدود). ترقية ذهبية تلقائية عند 10,000 نقطة. نقاط: 10 نقاط لكل فيديو (حد يومي 100).
4. 🎧 [المكتبة الصوتية الشاملة] (/library): مشغل صوتي لـ 260+ قارئاً (المعيقلي، عبد الباسط، العفاسي...). بحث ذكي، تفضيل السور، تتبع آخر 5 سور. تحكم كامل بالصوت وتكامل مع شاشة القفل، تحميل MP3. نقاط: +1 نقطة لكل 30 ثانية استماع (حد يومي 200)، و10 نقاط لختم سورة كاملة.
5. 📿 [حاضنة اليوميات والأذكار والقبلة] (/daily) - تضم:
   - الرئيسية (Dashboard): ورد القرآن، القبلة، تحدي أسئلة اليوم، وقائمة التحديات (Quests).
   - التحدي اليومي (Daily Quiz): 20 سؤالاً تتغير دورياً، تمنح 15 نقطة للإجابة الصحيحة.
   - مهمات تفاعلية (Quests): تحديات مع زر استلام نقاط.
   - تسبيح (Tasbeeh): سبحة تفاعلية (+3 نقاط لكل 99 تسبيحة).
   - استغفار وصلاة على النبي: عدادات تفاعلية، الضغطة بـ 1 نقطة (حد يومي 1000 نقطة لكل منهما).
   - أذكار الصباح والمساء والنوم: بطاقات منزلقة بنظام نقاط عند إتمامها. مكتبة أذكار حصن المسلم.
   - القبلة (Qibla): بوصلة ذكية بالـ GPS لحساب المسافة والاتجاه لمكة.
6. 🏆 [لوحة الشرف] (/rank): قائمة متصدرين بالنقاط حسب الدولة/المحافظة والنشاط. شارات الرتب بجانب الاسم: (الحافظ المتميز) للقرآن، (الذاكر الشاكر) للأذكار، (ناشر الخير) للفيديوهات.
7. 👤 [الملف الشخصي] (/profile): إدارة الحساب، اسم مستخدم فريد، 30+ صورة رمزية (Avatar)، خصوصية رقم الهاتف والميلاد، شات خاص بالأصدقاء، ونظام حظر (Block). تسجيل مباشر (OTP بالبريد، آمن) أو غير مباشر (سريع بكلمة مرور فقط، نقاطك معرضة للضياع).
8. 🕋 [مواقيت الصلاة] (/prayers): مواقيت صلاة بـ GPS (AlAdhan API)، عد تنازلي، إشعارات الأذان، اتجاه القبلة والمسافة لمكة، وتقويم سنوي.
9. 💬 [منصة التأملات والمعرض العام] (/showcase): عرض منشورات وفيديوهات المستخدمين بقوالب وتدرجات مميزة مع تفاعلات. رقابة صارمة (Moderation Engine) ضد الألفاظ البذيئة والتحايل (حظر كلي Hard Block أو مراجعة Soft Block). نظام إبلاغ.
10. 🎨 [تصميم كروت التأملات] (/reflection-card): تصميم كروت Glassmorphic بميزات خلفيات وعلامة مائية.
11. 💳 [باقات الاشتراك والترقية التلقائية] (/subscription): باقات رندر: مجاني (5)، Starter (50)، Premium (غير محدود). ترقية ذهبية تلقائية مجانية مدى الحياة عند 10,000 نقطة.

الهيكل التقني لمشروع يقين (Yaqeen):
- الويب: https://yaqeenalquran.online | حزمة أندرويد: com.yaqeen.app | إصدار: 21.0.
- البنية: Next.js 16.2.7 + React 19.2.4 + Firebase 12 + Capacitor 8.
- الاستضافة: Vercel (ويب)، Hugging Face (رندر)، Cloudflare Workers (API uuu12).
- محرر الفيديوهات: 6 خطوط عربية، 24 فلتر سينمائي، 12 تأثير متراكب، 15 حركة، 3 موجات صوتية، 3 جسيمات. سيرفر Hyper Render v22 يستخدم FFmpeg و Sharp.

قواعد صارمة لا تنازل عنها (Guardrails):
1. **منع كتابة الآيات صراحة**: يمنع منعاً باتاً كتابة الآيات القرآنية كاملة لتفادي الأخطاء. وجه المستخدم لقراءتها عبر رابط المصحف: [تصفح الآية من هنا](/mushaf-full).
2. الفتوى والتخصص: لا تفتِ بغير علم ووجه لكبار العلماء. ارفض الحديث في السياسة، الفن، الرياضة أو أي تخصص خارج نطاق الدين وتطبيق يقين.
3. الإيجاز الشديد: اختصر ردودك بحد أقصى فقرة أو فقرتين (أقل من 60-80 كلمة) ما لم يطلب المستخدم التفصيل.
4. المطور هو المهندس يوسف أسامة (Youssef Osama) - مهندس ذكاء اصطناعي بجامعة الجلالة (السنة الثالثة). واتساب: https://wa.me/201020451206 | إنستجرام: https://www.instagram.com/youssef_osama04.
5. حظر الإيموجيز والرموز غير اللائقة: يُمنع استخدام أي رموز أو ألوان تدل على الشذوذ الجنسي كأعلام قوس قزح 🏳️‍🌈.
6. منع الألوان تماماً والإيموجيات غير المسموحة: لا تستخدم أي إيموجيات ملونة بخلاف السبعة المحددة فقط: 🌸، 🕋، 📖، ✨، 📿، 🏆، 👤.
7. اللغة العربية الفصحى الصارمة: يجب أن تكون إجابتك بالكامل باللغة العربية الفصحى السليمة والمفهومة. يُمنع منعاً باتاً استخدام أي حروف لاتينية أو إنجليزية أو روسية أو أي لغة أجنبية في الكلمات العربية (مثل كتابة الأسماء أو المصطلحات بالإنجليزية "Abu Bakr" أو خلط الروسية "предлож"). عرّب كل شيء تماماً، ولا تذكر مصطلحات برمجية بالإنجليزية للمستخدم.`;




async function callAIDirectly(
  messages: any[],
  systemPrompt: string,
  diagnostics: { service: string; status: string; details?: string }[]
): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  const hasGroq = !!groqKey && groqKey !== "YOUR_GROQ_API_KEY_HERE";
  const hasGemini = !!geminiKey;

  diagnostics.push({
    service: "المفاتيح المحلية (Vercel Config)",
    status: "فحص 🔍",
    details: `GROQ: ${hasGroq ? "موجود ✅" : "غير موجود ❌"} | GEMINI: ${hasGemini ? "موجود ✅" : "غير موجود ❌"}`
  });

  // 1. Try Groq first
  if (hasGroq) {
    const groqModels = ["llama-3.3-70b-versatile", "llama-3.3-70b-specdec", "llama-3.1-8b-instant"];
    for (const gModel of groqModels) {
      try {
        const groqMessages = [
          { role: "system", content: systemPrompt },
          ...messages.filter((m: any) => m.content && m.content.trim() !== "")
        ];

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({ model: gModel, messages: groqMessages, max_tokens: 512 })
        });

        if (!res.ok) {
          const errText = await res.text();
          diagnostics.push({
            service: `محلية Groq (${gModel})`,
            status: "فشل ❌",
            details: `كود ${res.status}: ${errText.substring(0, 150)}`
          });
          continue;
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          diagnostics.push({
            service: `محلية Groq (${gModel})`,
            status: "نجاح ✅"
          });
          return text;
        }
      } catch (e: any) {
        diagnostics.push({
          service: `محلية Groq (${gModel})`,
          status: "خطأ ⚠️",
          details: e.message || String(e)
        });
      }
    }
  } else {
    diagnostics.push({
      service: "محلية Groq",
      status: "تخطي ⏭️",
      details: "مفتاح Groq غير متوفر محلياً"
    });
  }

  // 2. Fallback: Gemini
  if (hasGemini) {
    const geminiModels = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.5-flash"];
    for (const model of geminiModels) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

          const contents = messages
            .filter((m: any) => m.content && m.content.trim() !== "")
            .map((m: any) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }]
            }));

          const body = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents
          };

          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });

          if (response.status === 429 && attempt === 0) {
            diagnostics.push({
              service: `محلية Gemini (${model}) - محاولة 1`,
              status: "429 حد الاستهلاك ⏳",
              details: "إعادة المحاولة بعد ثانيتين..."
            });
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }

          if (!response.ok) {
            const errText = await response.text();
            diagnostics.push({
              service: `محلية Gemini (${model})`,
              status: "فشل ❌",
              details: `كود ${response.status}: ${errText.substring(0, 150)}`
          });
            throw new Error(`Status ${response.status}`);
          }

          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            diagnostics.push({
              service: `محلية Gemini (${model})`,
              status: "نجاح ✅"
            });
            return text;
          }
          throw new Error("استجابة فارغة");
        } catch (err: any) {
          diagnostics.push({
            service: `محلية Gemini (${model})`,
            status: "خطأ ⚠️",
            details: err.message || String(err)
          });
          break; // Try next model
        }
      }
    }
  } else {
    diagnostics.push({
      service: "محلية Gemini",
      status: "تخطي ⏭️",
      details: "مفتاح Gemini غير متوفر محلياً"
    });
  }

  throw new Error("فشلت جميع المحاولات المحلية.");
}

export async function POST(req: NextRequest) {
  const diagnostics: { service: string; status: string; details?: string }[] = [];
  try {
    const { messages, userData } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const systemPrompt = getSystemPrompt(userData);

    let replyText = "";
    let useFallback = false;

    // Keep only last 8 messages to avoid token limit errors
    const trimmedMessages = messages.slice(-8);

    // 1. Try to fetch from Val Town
    try {
      const response = await fetch(VAL_TOWN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: trimmedMessages,
          systemContext: systemPrompt
        }),
        signal: AbortSignal.timeout(8000) // 8 second timeout
      });

      if (!response.ok) {
        const errText = await response.text();
        diagnostics.push({
          service: "سيرفر Val Town",
          status: "فشل ❌",
          details: `كود ${response.status}: ${errText.substring(0, 150)}`
        });
        useFallback = true;
      } else {
        const data = await response.json();
        replyText = data.text || data.reply || "";
        
        if (data.error) {
          diagnostics.push({
            service: "سيرفر Val Town",
            status: "فشل ❌",
            details: `خطأ من السيرفر: ${JSON.stringify(data.error).substring(0, 150)}`
          });
          useFallback = true;
          replyText = "";
        } else if (!replyText || replyText.includes("جميع محاولات الاتصال بالذكاء الاصطناعي فشلت")) {
          diagnostics.push({
            service: "سيرفر Val Town",
            status: "فشل ❌",
            details: "أرجع استجابة فشل الاتصال بالـ AI"
          });
          useFallback = true;
        } else {
          diagnostics.push({
            service: "سيرفر Val Town",
            status: "نجاح ✅"
          });
        }
      }
    } catch (valTownError: any) {
      diagnostics.push({
        service: "سيرفر Val Town",
        status: "خطأ اتصال ⚠️",
        details: valTownError.message || String(valTownError)
      });
      useFallback = true;
    }

    // 2. If Val Town fails, use local Vercel keys fallback!
    if (useFallback) {
      diagnostics.push({
        service: "نظام الاحتياط (Fallback)",
        status: "تفعيل 🔄",
        details: "محاولة الاتصال المباشر باستخدام مفاتيح Vercel..."
      });
      try {
        replyText = await callAIDirectly(trimmedMessages, systemPrompt, diagnostics);
      } catch (fallbackError: any) {
        console.error("Local fallback also failed:", fallbackError);
        
        // Build detailed diagnostic report in Arabic
        const report = `⚠️ فشل الاتصال بالذكاء الاصطناعي.

📋 **تقرير تشخيص الأعطال بالتفصيل:**
${diagnostics.map(d => `- **[${d.service}]**: ${d.status}${d.details ? ` (${d.details})` : ""}`).join("\n")}

💡 **نصائح للحل:**
1. تأكد من صحة المفاتيح البيئية \`GROQ_API_KEY\` و \`GEMINI_API_KEY\` في إعدادات المشروع على Vercel.
2. تحقق من عدم تجاوز حدود الاستهلاك (Rate Limit / Quota) للمفاتيح الجديدة التي قمت بتفعيلها.`;

        return NextResponse.json({
          reply: report
        });
      }
    }

    return NextResponse.json({
      reply: replyText || "عذراً، لم أتمكن من الحصول على رد."
    });

  } catch (error: any) {
    console.error("[Chat API Error]:", error);
    return NextResponse.json({
      reply: `حدث خطأ غير متوقع في السيرفر: ${error.message || error}`
    });
  }
}
