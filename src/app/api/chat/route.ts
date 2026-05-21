import { NextResponse } from "next/server";
import { classifyQueryWithML } from "../../../lib/ml-model";
import * as fs from "fs";
import * as path from "path";

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
    const normalizedConversation = messages
      .map((m: any) => String(m.text || "").trim().toLowerCase())
      .join(" ");

    // السماح لأي سؤال بالوصول إلى معالج الدردشة.
    // المساعد يفضل الإجابة عن الأسئلة الدينية ومحتوى التطبيق، لكنه الآن يقبل أيضاً أسئلة عامة ويستجيب لها بطريقة محترمة.

    // ── تصفية وتنظيف الرسائل لتوافق شروط هياكل الـ APIs ──
    // Gemini يتطلب: 1) أول رسالة تكون user 2) عدم وجود رسائل متتالية من نفس الـ role 3) عدم وجود رسائل فارغة
    let apiMessages = messages.filter((m: any) => m.text && m.text.trim().length > 0);
    
    // إزالة رسائل الـ bot من البداية حتى نصل لأول رسالة user
    while (apiMessages.length > 0 && apiMessages[0].sender === "bot") {
      apiMessages = apiMessages.slice(1);
    }

    // دمج الرسائل المتتالية من نفس المرسل لتجنب خطأ 400 من Gemini
    const mergedMessages: any[] = [];
    for (const msg of apiMessages) {
      if (mergedMessages.length > 0 && mergedMessages[mergedMessages.length - 1].sender === msg.sender) {
        // دمج مع الرسالة السابقة من نفس المرسل
        mergedMessages[mergedMessages.length - 1] = {
          ...mergedMessages[mergedMessages.length - 1],
          text: mergedMessages[mergedMessages.length - 1].text + "\n" + msg.text
        };
      } else {
        mergedMessages.push({ ...msg });
      }
    }
    apiMessages = mergedMessages;

    const leaderboardList = leaderboard && leaderboard.length > 0
      ? leaderboard.map((u: any, idx: number) => `${idx + 1}. ${u.displayName} (@${u.username}) - ${u.totalPoints} نقطة - ${u.country}`).join("\n")
      : "1. يوسف أسامة (@youssef) - 5000 نقطة - مصر\n2. أحمد علي (@ahmed) - 4200 نقطة - السعودية\n3. عمر فاروق (@omar) - 3800 نقطة - الإمارات";

    // ── نظام تعليمات النظام ──
    const systemPrompt = `أنت المساعد الذكي والمستشار الديني الخاص بالتطبيق.
يرحب بك العميل لطلب الإجابة على كافة الأسئلة الإسلامية والدينية العامة، الفقهية، التاريخية، السيرة النبوية، والقرآنية بشكل غني ومفصل ودقيق وموثق.
أجب عن كافة الأسئلة الدينية مثل: (كم سورة في القرآن، قصص الأنبياء، أركان الإسلام، السنن والفرائض، تفاسير الآيات، وغيرها من الثقافة الإسلامية الشاملة...).
يمكنك أيضاً الرد على الأسئلة المتعلقة مباشرة بصفحات ومحتوى موقع التطبيق، مثل: الصفحة الرئيسية، المصحف، الفيديو، المكتبة الصوتية، مواقيت الصلاة، الأذكار، لوحة الشرف، والملف الشخصي.
يمكنك أيضاً الرد على الأسئلة التقنية التي تتعلق مباشرة بحالة عمل واجهة الدردشة وAPI الخاص بموقع التطبيق، إذا كان السؤال يخص التشغيل أو فعالية النظام.
كما يُرجى أن تجيب على كل سؤال عام يطرحه المستخدم، حتى لو كان خارج نطاق الدين، وتوجهه برفق نحو الخدمة أو المحتوى المناسب داخل التطبيق.

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

تحديث بيانات الملف الشخصي للعميل:
- لديك صلاحية كاملة لتحديث بيانات العميل (الاسم الكامل، الدولة، رقم الهاتف) مباشرةً عند طلبه ذلك باستخدام أداة (update_user_profile).
- إذا قال لك العميل: "غير اسمي إلى أحمد" أو "عدل بلدي للسعودية" أو "حدث رقمي"، قم باستدعاء الأداة (update_user_profile) فوراً بالقيم المطلوبة وسيقوم النظام بحفظها تلقائياً في قاعدة البيانات وتحديث الواجهة في نفس اللحظة!

إنشاء خطة ورد وتحدي قرآني مخصص (AI Custom Quest Planner):
- يمكنك الآن إنشاء خطط حفظ أو قراءة قرآني مخصصة بناءً على المدة والهدف الذي يحدده العميل باستخدام أداة (create_custom_quran_plan).
- إذا قال لك العميل: "اعملي خطة لحفظ سورة الملك في 7 أيام" أو "عايز خطة قراءة البقرة في أسبوع"، قم باستدعاء الأداة (create_custom_quran_plan) فوراً وسيقوم النظام بتثبيتها وتفعيلها في لوحة تحكمه اليومية!

توليد أسئلة ومسابقات دينية عامة تفاعلية للعميل (AI Islamic Trivia Quiz Generator):
- يمكنك توليد أسئلة دينية تفاعلية شيقة ومثيرة للعميل مع أربعة خيارات (أ، ب، ج، د) وتحديد الخيار الصحيح والشرح الكامل والتعليمي له باستخدام أداة (generate_islamic_quiz).
- إذا طلب العميل مسابقة، أو تحدي ديني، أو قال لك: "اسألني سؤال ديني" أو "عايز سؤال ديني"، قم باستدعاء الأداة (generate_islamic_quiz) فوراً، وسيقوم النظام بتنسيق السؤال وعرضه للعميل لتحديه وكسب النقاط!

تعليمات:
1. تحدث دائماً بالعربية بأسلوب راقي ومحترم.
2. إذا سأل عن معلوماته، أجب من البيانات أعلاه.
3. إذا سأل عن المطور، اذكر "يوسف اسامه" مهندس الذكاء الاصطناعي.
4. استخدم إيموجي بشكل جميل.
5. كن مختصراً ومفيداً كمساعد شخصي فائق الذكاء.`;

    // ── نظام أدوات تعديل البيانات المتاحة للذكاء الاصطناعي ──
    const geminiTools = [
      {
        functionDeclarations: [
          {
            name: "update_user_profile",
            description: "تحديث بيانات ملفك الشخصي في قاعدة البيانات مثل الاسم الكامل (displayName)، أو الدولة (country)، أو رقم الهاتف (phoneNumber).",
            parameters: {
              type: "OBJECT",
              properties: {
                displayName: {
                  type: "STRING",
                  description: "الاسم الكامل الجديد للمستخدم باللغة العربية"
                },
                country: {
                  type: "STRING",
                  description: "اسم الدولة الجديدة للمستخدم من قائمة الدول العربية"
                },
                phoneNumber: {
                  type: "STRING",
                  description: "رقم الهاتف الجديد للمستخدم"
                }
              }
            }
          },
          {
            name: "create_custom_quran_plan",
            description: "إنشاء خطة ورد أو حفظ قرآني مخصص بناءً على المدة والهدف الذي يحدده العميل وتثبيته في لوحة تحدياته اليومية.",
            parameters: {
              type: "OBJECT",
              properties: {
                planName: {
                  type: "STRING",
                  description: "اسم الخطة باللغة العربية (مثال: حفظ سورة الملك في 7 أيام)"
                },
                durationDays: {
                  type: "INTEGER",
                  description: "مدة الخطة بالأيام كعدد صحيح"
                },
                dailyTarget: {
                  type: "STRING",
                  description: "الهدف اليومي باللغة العربية (مثال: صفحتين يومياً)"
                },
                targetPagesPerDay: {
                  type: "INTEGER",
                  description: "عدد الصفحات اليومية المطلوبة كعدد صحيح"
                },
                dayByDayBreakdown: {
                  type: "ARRAY",
                  items: {
                    type: "STRING"
                  },
                  description: "تفصيل الخطة يوماً بيوم (مثال: ['اليوم 1: حفظ الآيات 1-5'، 'اليوم 2: حفظ الآيات 6-10'])"
                }
              },
              required: ["planName", "durationDays", "dailyTarget", "targetPagesPerDay", "dayByDayBreakdown"]
            }
          },
          {
            name: "generate_islamic_quiz",
            description: "إنشاء أو توليد سؤال ديني عام تفاعلي للعميل مع خيارات متعددة (أ، ب، ج، د) وتحديد الإجابة الصحيحة والتفسير لزيادة الوعي الثقافي.",
            parameters: {
              type: "OBJECT",
              properties: {
                question: {
                  type: "STRING",
                  description: "السؤال الديني العام المثير للتحدي باللغة العربية"
                },
                options: {
                  type: "STRING",
                  description: "الخيارات الأربعة مفرقة بنزول سطر بالترتيب التالي: أ) ...\\nب) ...\\nج) ...\\nد) ..."
                },
                correctOption: {
                  type: "STRING",
                  description: "الحرف الصحيح فقط للخيار الفائز (أو ب أو ج أو د)"
                },
                explanation: {
                  type: "STRING",
                  description: "شرح وتعليم ديني غني جداً حول سبب صحة هذا الخيار مع ذكر الآيات أو الأحاديث أو السياق التاريخي لدعم التعلم"
                }
              },
              required: ["question", "options", "correctOption", "explanation"]
            }
          }
        ]
      }
    ];

    const openAiTools = [
      {
        type: "function",
        function: {
          name: "update_user_profile",
          description: "تحديث بيانات ملفك الشخصي في قاعدة البيانات مثل الاسم الكامل (displayName)، أو الدولة (country)، أو رقم الهاتف (phoneNumber).",
          parameters: {
            type: "object",
            properties: {
              displayName: {
                type: "string",
                description: "الاسم الكامل الجديد للمستخدم"
              },
              country: {
                type: "string",
                description: "اسم الدولة الجديدة للمستخدم"
              },
              phoneNumber: {
                type: "string",
                description: "رقم الهاتف الجديد للمستخدم"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "create_custom_quran_plan",
          description: "إنشاء خطة ورد أو حفظ قرآني مخصص بناءً على المدة والهدف الذي يحدده العميل وتثبيته في لوحة تحدياته اليومية.",
          parameters: {
            type: "object",
            properties: {
              planName: {
                type: "string",
                description: "اسم الخطة باللغة العربية"
              },
              durationDays: {
                type: "integer",
                description: "مدة الخطة بالأيام"
              },
              dailyTarget: {
                type: "string",
                description: "الهدف اليومي باللغة العربية"
              },
              targetPagesPerDay: {
                type: "integer",
                description: "عدد الصفحات اليومية المطلوبة"
              },
              dayByDayBreakdown: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "تفصيل الخطة يوماً بيوم"
              }
            },
            required: ["planName", "durationDays", "dailyTarget", "targetPagesPerDay", "dayByDayBreakdown"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "generate_islamic_quiz",
          description: "إنشاء أو توليد سؤال ديني عام تفاعلي للعميل مع خيارات متعددة (أ، ب، ج، د) وتحديد الإجابة الصحيحة والتفسير.",
          parameters: {
            type: "object",
            properties: {
              question: {
                type: "string",
                description: "السؤال الديني العام المثير للتحدي باللغة العربية"
              },
              options: {
                type: "string",
                description: "الخيارات الأربعة مفرقة بنزول سطر بالترتيب التالي: أ) ...\\nب) ...\\nج) ...\\nد) ..."
              },
              correctOption: {
                type: "string",
                description: "الحرف الصحيح فقط للخيار الفائز (أو ب أو ج أو د)"
              },
              explanation: {
                type: "string",
                description: "شرح وتعليم ديني غني جداً حول سبب صحة هذا الخيار مع ذكر الآيات أو الأحاديث أو السياق التاريخي لدعم التعلم"
              }
            },
            required: ["question", "options", "correctOption", "explanation"]
          }
        }
      }
    ];

    // ── 1. محاولة استدعاء Gemini API ──
    if (geminiKey) {
      let geminiContents = apiMessages.map((m: any) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      // ضمان أن أول رسالة هي من المستخدم (شرط Gemini الإلزامي)
      while (geminiContents.length > 0 && geminiContents[0].role !== "user") {
        geminiContents = geminiContents.slice(1);
      }

      // لو ما في رسائل، نضيف رسالة المستخدم الأخيرة يدوياً
      if (geminiContents.length === 0) {
        geminiContents = [{ role: "user", parts: [{ text: lastUserMessage }] }];
      }

      console.log("📤 عدد الرسائل المرسلة لـ Gemini:", geminiContents.length, "| أول role:", geminiContents[0]?.role);

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
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const requestBody = {
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: geminiContents,
            tools: geminiTools,
            generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
          };

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              signal: controller.signal,
              body: JSON.stringify(requestBody)
            }
          );

            clearTimeout(timeoutId);
          const responseData = await response.json();
 
          // كتابة سجل تفصيلي جداً لمطور التطبيق
          const logContent = `
========================================
[${new Date().toISOString()}] MODEL: ${model}
URL: https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent
STATUS: ${response.status}
OK: ${response.ok}
REQUEST PAYLOAD: ${JSON.stringify(requestBody, null, 2)}
RESPONSE PAYLOAD: ${JSON.stringify(responseData, null, 2)}
========================================
`;
          console.log(logContent);
 
          if (response.ok) {
            console.log(`✅ نجح الموديل: ${model}`);
            data = responseData;
            lastResponse = response;
            break;
          } else {
            const errMsg = responseData.error?.message || "خطأ غير معروف";
            console.warn(`❌ فشل ${model}: ${errMsg}`);
            lastResponse = response;
            data = responseData;
 
            if (errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
              console.error("⚠️ الحصة انتهت! راجع حساب جوجل.");
              break;
            }
            if (response.status === 400) {
              console.warn(`⚠️ خطأ بنيوي 400 من ${model}, جاري تجربة الموديل التالي...`);
              continue;
            }
          }
        } catch (fetchErr: any) {
          const logContent = `
========================================
[${new Date().toISOString()}] MODEL: ${model}
CRASH: ${fetchErr.message || fetchErr}
STACK: ${fetchErr.stack || ""}
========================================
`;
          console.log(logContent);
          if (fetchErr.name === 'AbortError') {
            console.error(`⏱️ الموديل ${model} تجاوز المهلة الزمنية (15 ثانية)`);
          } else {
            console.error(`💥 خطأ أثناء طلب الموديل ${model}:`, fetchErr);
          }
        }
      }

      // لو نجح الاتصال الفعلي بـ Gemini ورجع رد سليم
      if (lastResponse?.ok && data?.candidates?.[0]?.content?.parts) {
        const parts = data.candidates[0].content.parts;
        let botText = "";
        let triggerUpdate = false;
        let updateArgs: any = null;
        let triggerCreatePlan = false;
        let createPlanArgs: any = null;
        let triggerQuiz = false;
        let quizArgs: any = null;

        for (const part of parts) {
          if (part.text) {
            botText += part.text;
          }
          if (part.functionCall && part.functionCall.name === "update_user_profile") {
            triggerUpdate = true;
            updateArgs = part.functionCall.args;
          }
          if (part.functionCall && part.functionCall.name === "create_custom_quran_plan") {
            triggerCreatePlan = true;
            createPlanArgs = part.functionCall.args;
          }
          if (part.functionCall && part.functionCall.name === "generate_islamic_quiz") {
            triggerQuiz = true;
            quizArgs = part.functionCall.args;
          }
        }

        if (triggerUpdate && updateArgs) {
          const updatedFields = [];
          if (updateArgs.displayName) updatedFields.push(`الاسم إلى: ${updateArgs.displayName}`);
          if (updateArgs.country) updatedFields.push(`الدولة إلى: ${updateArgs.country}`);
          if (updateArgs.phoneNumber) updatedFields.push(`رقم الهاتف إلى: ${updateArgs.phoneNumber}`);

          const replyText = botText || `لقد قمت بتحديث بيانات ملفك الشخصي بنجاح! 💾 (${updatedFields.join("، ")})`;
          return NextResponse.json({ 
            text: replyText,
            updateProfile: updateArgs
          });
        }

        if (triggerCreatePlan && createPlanArgs) {
          const replyText = botText || `لقد قمت بإنشاء خطتك القرآنية المخصصة وتثبيتها بنجاح! 📖\nالخطة: ${createPlanArgs.planName}\nالهدف: ${createPlanArgs.dailyTarget}`;
          return NextResponse.json({
            text: replyText,
            createPlan: createPlanArgs
          });
        }

        if (triggerQuiz && quizArgs) {
          const replyText = `🤔✨ **تحدي المسابقة الدينية المولد بالذكاء الاصطناعي (Gemini AI)!** إليك هذا السؤال الممتع:
          
**السؤال:** ${quizArgs.question}

${quizArgs.options}

اكتب لي خيارك الآن **(أ، ب، ج، د)** للإجابة وحصاد الحسنات والنقاط! 🏆`;

          return NextResponse.json({
            text: replyText,
            quiz: {
              questionId: Date.now(),
              correctOption: quizArgs.correctOption,
              explanation: quizArgs.explanation
            }
          });
        }

        if (botText) {
          return NextResponse.json({ text: botText });
        }
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
            tools: openAiTools,
            tool_choice: "auto",
            temperature: 0.7,
            max_tokens: 600
          })
        });

        const data = await response.json();
        if (response.ok && data.choices?.[0]?.message) {
          const message = data.choices[0].message;

          if (message.tool_calls && message.tool_calls.length > 0) {
            const toolCall = message.tool_calls[0];
            if (toolCall.function.name === "update_user_profile") {
              const args = JSON.parse(toolCall.function.arguments);
              const updatedFields = [];
              if (args.displayName) updatedFields.push(`الاسم إلى: ${args.displayName}`);
              if (args.country) updatedFields.push(`الدولة إلى: ${args.country}`);
              if (args.phoneNumber) updatedFields.push(`رقم الهاتف إلى: ${args.phoneNumber}`);

              const replyText = message.content || `لقد قمت بتحديث بيانات ملفك الشخصي بنجاح! 💾 (${updatedFields.join("، ")})`;
              return NextResponse.json({
                text: replyText,
                updateProfile: args
              });
            }
            if (toolCall.function.name === "create_custom_quran_plan") {
              const args = JSON.parse(toolCall.function.arguments);
              const replyText = message.content || `لقد قمت بإنشاء خطتك القرآنية المخصصة وتثبيتها بنجاح! 📖\nالخطة: ${args.planName}\nالهدف: ${args.dailyTarget}`;
              return NextResponse.json({
                text: replyText,
                createPlan: args
              });
            }
            if (toolCall.function.name === "generate_islamic_quiz") {
              const args = JSON.parse(toolCall.function.arguments);
              const replyText = `🤔✨ **تحدي المسابقة الدينية المولد بالذكاء الاصطناعي (OpenAI GPT)!** إليك هذا السؤال الممتع:
              
**السؤال:** ${args.question}

${args.options}

اكتب لي خيارك الآن **(أ، ب، ج، د)** للإجابة وحصاد الحسنات والنقاط! 🏆`;

              return NextResponse.json({
                text: replyText,
                quiz: {
                  questionId: Date.now(),
                  correctOption: args.correctOption,
                  explanation: args.explanation
                }
              });
            }
          }

          if (message.content) {
            return NextResponse.json({ text: message.content });
          }
        }
      } catch (openAiErr) {
        console.error("💥 خطأ في خوادم OpenAI:", openAiErr);
      }
    }

    // ── 3. الـ Fallback النهائي بذكاء الآلة المحلي (Machine Learning TF-IDF) ──
    console.log("🚀 تفعيل محرك الذكاء الاصطناعي وتعلم الآلة المحلي (ML Cosine Similarity)...");
    const mlClassification = classifyQueryWithML(lastUserMessage, userData);
    console.log(`🎯 تم تصنيف السؤال إلى قسم [${mlClassification.category}] بدرجة ثقة: ${mlClassification.score}`);
    
    return NextResponse.json({ 
      text: mlClassification.reply,
      updateProfile: mlClassification.updateProfile,
      createPlan: mlClassification.createPlan,
      quiz: mlClassification.quiz
    });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "عطل داخلي في الخادم. يرجى المحاولة لاحقاً." }, { status: 500 });
  }
}
