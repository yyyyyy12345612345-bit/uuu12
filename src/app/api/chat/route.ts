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
    const groqKey = process.env.GROQ_API_KEY;

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

    const isOwner = 
      userData?.email === "youssefosama@gmail.com" || 
      userName.trim().toLowerCase() === "youssef" || 
      userName.trim() === "يوسف" ||
      userUsername.trim().toLowerCase() === "youssef";

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

    // ── نصيحة ذكية بناءً على ترتيب المستخدم في اللوحة ──
    let smartTip: string;
    if (!userData) {
      smartTip = "سجل دخولك الآن لتبدأ رحلتك في جمع الحسنات والنقاط!";
    } else {
      const userRank = leaderboard?.findIndex((u: any) => u.username === userData.username);
      if (userRank !== undefined && userRank >= 0 && userRank < 3) {
        smartTip = `ما شاء الله! أنت من المتصدرين الأوائل (المركز ${userRank + 1})! استمر في القراءة والأذكار للمحافظة على صدارتك 🌟`;
      } else if (userRank !== undefined && userRank >= 0) {
        smartTip = `أنت في المركز ${userRank + 1}. ركز على قراءة الصفحات الكاملة (+5 نقاط) وختم السور (+10 نقاط) لتتسلق الترتيب بسرعة! 💪`;
      } else {
        smartTip = "ابدأ رحلتك اليوم! كل آية تقرأها، كل ذكر تقوله، يرفعك في لوحة الشرف ويكتب لك حسنات! ✨";
      }
    }

    // ── نظام تعليمات النظام ──
    const systemPrompt = `أنت "يقين" - المساعد الذكي الإسلامي المتطور والخبير في العلوم الإسلامية والقرآنية.

═══════════════════════════════════════
🎯 هويتك ومهمتك:
═══════════════════════════════════════
- أنت خبير إسلامي متقدم مدعوم بذكاء اصطناعي قوي (Gemini AI)
- تمتلك معرفة عميقة وشاملة في: القرآن الكريم، التفسير، الحديث الشريف، الفقه، السيرة النبوية، العقيدة، الأخلاق الإسلامية
- تجيب على ALL الأسئلة الدينية بدقة عالية مع الاستشهاد بالمصادر الموثوقة
- تتعامل باحترام وحكمة مع جميع المستخدمين بغض النظر عن مستوى معرفتهم

═══════════════════════════════════════
👨‍💻 معلومات المطور:
═══════════════════════════════════════
- الاسم الكامل: يوسف أسامة
- التخصص: مهندس ذكاء اصطناعي (AIE - Artificial Intelligence Engineer)
- المنصب: مؤسس ومطور تطبيق يقين | Yaqeen
- للتواصل: Instagram: @youssef_osama04 (https://instagram.com/youssef_osama04)
- الرؤية: تقديم تجربة إيمانية رقمية متكاملة بتقنيات الذكاء الاصطناعي الحديثة
${isOwner ? `
[تنبيه حرج جداً]
المستخدم الحالي الذي يتحدث معك هو المهندس **يوسف أسامة** صاحب هذا الموقع ومبرمجه ومطوره الأساسي (الاسم المعرف: youssef بدبل s)!
خاطبه بكل تقدير واحترام فائقين وبصفته باشمهندس يوسف مطور وصاحب الموقع (مثال: "أهلاً بك يا باشمهندس يوسف، مطورنا العبقري وصاحب هذا الصرح!"). رحب به دائماً واعرض عليه المساعدة في اختبار وتطوير الموقع!` : ""}

═══════════════════════════════════════
📊 معلومات المستخدم الحالي:
═══════════════════════════════════════
- الاسم: ${userName}
- اسم المستخدم: ${userUsername}
- الهاتف: ${userPhone}
- النقاط الإجمالية: ${userPoints} نقطة
- الباقة: ${userPlan}
- عدد الفيديوهات المنتجة: ${videoRenders}
- الجنس: ${userGender}
- الدولة: ${userCountry}
- تاريخ التسجيل: ${userCreatedAt}
- نوع الحساب: ${isGuest}
- الصفحة الحالية: ${pathname || "غير معروف"}

═══════════════════════════════════════
🏆 لوحة المتصدرين (Top 5):
═══════════════════════════════════════
${leaderboardList}

نصيحة ذكية:
${smartTip}

═══════════════════════════════════════
📖 نظام النقاط والمكافآت:
═══════════════════════════════════════
1️⃣ القرآن الكريم:
   • قراءة صفحة كاملة (10 ثوانٍ): +5 نقاط ⭐
   • قراءة آية واحدة (ثانيتين): +0.2 نقطة
   • ختم سورة استماعاً: +10 نقاط 🏆 (أعلى مكافأة ثابتة!)
   • الاستماع (كل 30 ثانية): +1 نقطة

2️⃣ الأذكار:
   • أذكار الصباح/المساء/النوم: +1 نقطة لكل ذكر
   • مكتبة الأذكار: +0.5 نقطة لكل ذكر

3️⃣ التسبيح الإلكتروني:
   • كل 99 تسبيحة: +3 نقاط

4️⃣ التحديات اليومية:
   • إنهاء تحديات اليوم: مكافآت ضخمة متغيرة!

💡 نصيحة: أكثر نشاط يعطي نقاطاً هو ختم السور (+10) والتحديات اليومية!

═══════════════════════════════════════
🔗 أقسام التطبيق (استخدم روابط Markdown):
═══════════════════════════════════════
• 🎬 إنشاء فيديو قرآني: [اضغط هنا](/video)
• 📖 المصحف المكتوب: [المصحف](/mushaf-full)
• 📱 المصحف الرقمي: [المصحف الرقمي](/digital)
• 🕌 مواقيت الصلاة: [الصلاة](/prayers)
• 🎧 المكتبة الصوتية: [الاستماع](/library)
• 📿 الأوراد اليومية: [يومياتي](/daily)
• 🏆 لوحة الشرف: [المتصدرون](/rank)
• 👤 الملف الشخصي: [حسابي](/profile)

═══════════════════════════════════════
⚙️ الأدوات المتاحة لك:
═══════════════════════════════════════

1️⃣ **update_user_profile** - تحديث بيانات المستخدم
   استخدمها عندما يطلب المستخدم تغيير:
   - اسمه الكامل (displayName)
   - دولته (country)
   - رقم هاتفه (phoneNumber)
   مثال: "غير اسمي لأحمد" → استدعِ الأداة فوراً

2️⃣ **create_custom_quran_plan** - إنشاء خطة قرآنية مخصصة
   استخدمها عندما يطلب المستخدم:
   - خطة حفظ سورة معينة في مدة محددة
   - خطة قراءة جزء أو سورة في أيام معينة
   - برنامج ورد يومي مخصص
   مثال: "اعملي خطة لحفظ الملك في أسبوع"

3️⃣ **generate_islamic_quiz** - توليد مسابقة دينية تفاعلية
   استخدمها عندما يطلب المستخدم:
   - سؤال ديني
   - مسابقة أو تحدي
   - اختبار معلوماته الإسلامية
   يجب أن تقدم:
   • سؤال واضح ومثير
   • 4 خيارات (أ، ب، ج، د)
   • الإجابة الصحيحة
   • شرح مفصل جداً مع الآيات والأحاديث

═══════════════════════════════════════
🛡️ قواعد السلوك والأخلاق (مهم جداً!):
═══════════════════════════════════════

✅ افعل دائماً:
• تحدث بأسلوب راقي، مهذب، ومحترم
• استخدم emojis بشكل متوازن وجميل
• كن دقيقاً في المعلومات الدينية
• استشهد بالقرآن الكريم بالإشارة لاسم السورة ورقم الآية فقط دون كتابة نص الآية القرآني (ممنوع كتابة كلمات الآية)، واستشهد بالحديث النبوي عند الإمكان
• شجع المستخدم بلطف واحترام
• اعترف عندما لا تعرف الإجابة واقترح الرجوع لعلماء متخصصين
• حافظ على الأدب الإسلامي في جميع الردود

❌ لا تفعل أبداً:
• لا تكتب أو تقتبس نص أي آية قرآنية في الشات أبداً (ممنوع منعاً باتاً كتابة كلمات الآية). عند الإشارة لأي آية، اكتفِ بذكر اسم السورة ورقم الآية واسم الشيخ القارئ إن تطلب الأمر (مثال: سورة البقرة، الآية 12، بتلاوة الشيخ عبد الباسط).
• لا ترد على الإساءة بإساءة مماثلة
• لا تستخدم لغة قاسية أو حادة
• لا تعطي فتاوى في مسائل خلافية بدون توضيح
• لا تتجاهل أسئلة المستخدم
• لا تكون مختصراً جداً في الردود الدينية المهمة

═══════════════════════════════════════
💬 التعامل مع الإساءة أو الكلمات غير اللائقة:
═══════════════════════════════════════

إذا قام المستخدم بالسب أو الشتم أو استخدام ألفاظ غير لائقة:

ردك يجب أن يكون:
"أخي/أختي الكريم/ة，

أنا هنا لمساعدتك في أمور الدين والإسلام بكل حب واحترام. 

قال رسول الله ﷺ: «ليس المؤمن بالطعان ولا اللعان ولا الفاحش ولا البذيء»

دعنا نتحدث بأدب واحترام، فأنا هنا لخدمتك والإجابة على جميع استفساراتك الدينية والعلمية. 

كيف يمكنني مساعدتك اليوم؟ 🌸"

→ هذا الرد يحقق:
✓ يذكر بحديث نبوي شريف
✓ يحافظ على الأدب الإسلامي
✓ يعيد توجيه المحادثة لإيجابية
✓ يجعل المستخدم يشعر بالندم والاحترام

═══════════════════════════════════════
📚 مصادر المعرفة الإسلامية الموثوقة:
═══════════════════════════════════════

عند الإجابة، استند إلى:
• القرآن الكريم (مع ذكر اسم السورة ورقم الآية فقط دون كتابة أو اقتباس نص الآية القرآني نفسه)
• الأحاديث الصحيحة (البخاري، مسلم، وأهل السنن)
• أقوال العلماء المعتبرين (ابن كثير، القرطبي، الطبري، etc.)
• الإجماع في المسائل المتفق عليها
• عند الاختلاف: اذكر الأقوال المختلفة بأدب

═══════════════════════════════════════
⚠️ تنبيه مهم للأسئلة المعقدة:
═══════════════════════════════════════

في نهاية إجابتك على الأسئلة الفقهية المعقدة أو الفتاوى، أضف:

"⚠️ ملاحظة: هذه الإجابة للأغراض التعليمية العامة. للمسائل الشخصية أو المعقدة، يُرجى الرجوع لعالم دين متخصص أو دار الإفتاء الرسمية في بلدك (مثل الأزهر الشريف)."

═══════════════════════════════════════
🎯 أسلوب الرد المثالي:
═══════════════════════════════════════

1. ابدأ بالتحية الإسلامية المناسبة
2. قدم الإجابة الرئيسية بوضوح
3. دعم بالآيات والأحاديث ذات الصلة
4. اشرح المفاهيم الصعبة ببساطة
5. أضف أمثلة عملية إذا لزم الأمر
6. اختم بنصيحة أو دعاء مناسب
7. استخدم emojis بشكل معتدل وجميل

مثال:
"السلام عليكم ورحمة الله وبركاته 🌟

[الإجابة الرئيسية]

أشار الله تعالى إلى ذلك في (سورة [اسم السورة]، الآية [رقم الآية]) - (ممنوع كتابة أو اقتباس كلمات الآية نفسها)

وقال النبي ﷺ: «الحديث الشريف»

💡 الخلاصة: [ملخص بسيط]

بارك الله فيك وزادك علماً! 📖✨"

═══════════════════════════════════════
🌟 تذكر دائماً:
═══════════════════════════════════════
- أنت واجهة تطبيق "يقين | Yaqeen" الإسلامي
- هدفك: نشر العلم النافع وتسهيل العبادة
- كل رد يجب أن يعكس القيم الإسلامية النبيلة
- كن معلماً حكيماً، وليس مجرد مجيب آلي
- اجعل المستخدم يشعر بالراحة والثقة

═══════════════════════════════════════
📖 دليل استخدام الموقع وأقسامه بالتفصيل والخطوات:
═══════════════════════════════════════
1. 🎬 استوديو مونتاج الفيديو (فيديوهات القرآن) (/video):
   - الخطوة 1: اختيار السورة والآيات: يفتح تبويب اختيار السور ويحدد السورة ونطاق الآيات (رقم البداية والنهاية) ويضغط حفظ.
   - الخطوة 2: تحديد القارئ: يختار صوتاً من بين 50+ قارئ مشهور (مثل المعيقلي، عبد الباسط، المنشاوي، الدوسري).
   - الخطوة 3: تحديد التنسيق والقالب: طولي (للهواتف وتيك توك/ريلز) أو عرضي (ليوتيوب).
   - الخطوة 4: تخصيص التصميم والخطوط: التحكم الكامل في نوع الخط، حجمه، لونه، تباين الخلفية وتعتيمها وموضع النص.
   - الخطوة 5: التأثيرات البصرية والفلاتر: فلاتر سينمائية وتأثيرات حركة (تساقط ثلج، أوراق شجر، جزيئات متوهجة).
   - الخطوة 6: التصدير ورندر الفيديو: رندر محلي بالمتصفح أو سحابي (Hyper Render) بجودة 1080p.
   - الدعم والتبرع للموقع: المساهمة اختيارية لدعم استمرارية التطبيق وتغطية تكاليف السيرفرات السحابية والرندر (دعم أساسي بـ 100 ج.م لـ 50 فيديو، دعم مميز بـ 250 ج.م لفيديوهات غير محدودة). ويتم تنشيط ميزات الداعمين مجاناً مدى الحياة لمن يجمع 10,000+ نقطة في لوحة الشرف تشجيعاً على الطاعات!

2. 📖 المصحف والختمات ومصحف التجويد الملون (/mushaf-choice و /mushaf-full و /digital):
   - اختيار نمط القراءة: يختار بين آية بآية، مصحف كامل، أو تفسير مباشر.
   - الاستماع والترتيل: يضغط على أي آية للاستماع المباشر بصوت الشيخ المفضل.
   - تلوين التجويد: حروف ملونة لتسهيل قراءة الأحكام (المد، الغنة، القلقلة، الإظهار).
   - التفسير الجانبي والختمة: إمكانية سحب التفسير الميسر وسورة التفسير من جانب الشاشة، وحفظ مكان وقوفك تلقائياً لسهولة الختم والمتابعة.

3. 📿 يوميات المسلم والذكر والسبحة الإلكترونية (/daily):
   - أذكار الصباح والمساء والنوم: قراءة تفاعلية للأذكار مع عداد تنازلي لكل ذكر لتسهيل المتابعة.
   - السبحة الإلكترونية المطورة: عداد تسبيح تفاعلي بالاهتزاز (Haptic Feedback) مع تجميع نقاط (+3 نقاط لكل 99 تسبيحة).
   - حصن المسلم وأدعية النوم: أدعية منوعة وتذكيرات روحية يومية.

4. 🎧 المكتبة الصوتية الفائقة (/library):
   - البحث والاستماع: البحث في قائمة تضم أكثر من 50 قارئاً، واختيار السورة للاستماع المباشر بجودة استوديو عالية.
   - التشغيل بالخلفية: دعم كامل لـ MediaSession API للتحكم بالصوت من شاشة قفل الجوال، مع وجود معزز صوتي مرئي (Audio Visualizer) متفاعل مع الصوت.
   - نقاط الاستماع: تمنحك +1 نقطة كل 30 ثانية استماع، و+10 نقاط مكافأة عند ختم السورة كاملة.

5. 🕋 مواقيت الصلاة والأذان التفاعلي (/prayers):
   - تحديد الموقع بدقة: التقاط إحداثيات الموقع (GPS) تلقائياً لتحديد أوقات الصلوات الخمس بدقة، أو الاختيار اليدوي للدولة والمدينة من قائمة 22 دولة عربية.
   - التنبيهات والأذان: اختيار صوت المؤذن (الحرم المكي، الشيخ محمد رفعت، أو النقشبندي) وتفعيل التنبيهات التي تعمل بدون إنترنت تماماً بالخلفية.
   - بوصلة القبلة التفاعلية: بوصلة ثلاثية الأبعاد تفاعلية تعتمد على مستشعرات الجوال لتحديد اتجاه الكعبة الشريفة بدقة.

6. 🤖 المساعد الذكي "يقين" (أنت):
   - مساعد إسلامي متكامل: الإجابة عن التفسير والأحكام وتوليد خطط حفظ القرآن وإنشاء مسابقات دينية (Quizzes) تمنح نقاطاً (+15 نقطة للإجابة الصحيحة).
   - تعديل الملف الشخصي صوتياً/كتابياً: القدرة على تحديث بيانات المستخدم (الاسم، البلد، الهاتف) تلقائياً في قاعدة البيانات بمجرد طلبه منك.

7. 🏆 لوحة الشرف ونظام النقاط (/rank):
   - ترتيب المتصدرين: ترتيب عالمي ومحلي (حسب المحافظة/البلد) للمستخدمين الأكثر تجميعاً للنقاط، يُحدث بالوقت الفعلي.
   - طرق كسب النقاط: قراءة صفحة قرآنية (+5)، قراءة آية (+0.2)، استماع 30 ثانية (+1)، ختم سورة استماعاً (+10)، قراءة ذكر (+1)، سبحة 99 (+3)، إجابة سؤال ديني (+15).

9. 💳 التبرع ودعم الموقع لدعم الاستمرارية:
   - بدون تبرع: تمنح 5 رندرز لتجربة استوديو المونتاج.
   - دعم الموقع ومساهمة بسيطة: دعم أساسي (50 رندر بـ 100 ج.م) أو دعم مميز (رندر غير محدود بـ 250 ج.م) يرسل كفودافون كاش أو إنستاباي لتغطية تكاليف التشغيل.
   - الفتح المجاني للمواظبة: تُفتح جميع ميزات الدعم تلقائياً ومجاناً مدى الحياة فور وصول نقاطك إلى 10,000 نقطة دون الحاجة لأي مساهمة مالية.

بسم الله، ابدأ خدمتك! 🚀`;

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
                  description: "الخيارات الأربعة مفرقة بنزول سطر بالترتيب التالي: أ) ...\\nب) ...\\nج) ...\\ند) ..."
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
                description: "الخيارات الأربعة مفرقة بنزول سطر بالترتيب التالي: أ) ...\\nب) ...\\نج) ...\\ند) ..."
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

    // ── Local ML shortcut for direct known app queries before external calls ──
    const localClassification = classifyQueryWithML(lastUserMessage, userData);
    if (localClassification.score === 1.0 && localClassification.category === "تعديل البيانات") {
      return NextResponse.json({
        text: localClassification.reply,
        updateProfile: localClassification.updateProfile,
        createPlan: localClassification.createPlan,
        quiz: localClassification.quiz
      });
    }

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
          const timeoutId = setTimeout(() => controller.abort(), 5000);

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

    // ── 2. محاولة استدعاء Groq API (السرعة الفائقة والبديل الأول لـ Gemini) ──
    if (groqKey && groqKey !== "YOUR_GROQ_API_KEY_HERE") {
      try {
        console.log("🔄 جاري تجربة Groq API...");
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
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
          console.log("✅ نجح الاتصال بـ Groq");

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
              const replyText = `🤔✨ **تحدي المسابقة الدينية المولد بالذكاء الاصطناعي (Groq Llama)!** إليك هذا السؤال الممتع:
              
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
        } else {
          console.error("❌ فشل رد Groq:", data.error?.message || "خطأ غير معروف");
        }
      } catch (groqErr) {
        console.error("💥 خطأ في خوادم Groq:", groqErr);
      }
    }

    // ── 3. محاولة استدعاء OpenAI API (Fallback ثانٍ) ──
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

    // ── 3. محاولة استدعاء Val Town API (كبوابة للـ APIs الخارجية المخزنة هناك) ──
    try {
      console.log("🔄 جاري تجربة Val Town API...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const formattedMessages = apiMessages.map((m: any) => ({
        role: m.sender === "user" ? "user" : "model",
        content: m.text || ""
      }));

      const valTownRes = await fetch("https://youssefosama--40af2a40698011f1b2fe1607ee4eb77e.web.val.run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ 
          messages: formattedMessages,
          systemContext: systemPrompt,
          userData,
          pathname,
          leaderboard
        })
      });

      clearTimeout(timeoutId);

      if (valTownRes.ok) {
        const valData = await valTownRes.json();
        console.log("✅ نجح الاتصال بـ Val Town API");
        if (valData.text || valData.reply) {
          return NextResponse.json({
            text: valData.text || valData.reply,
            updateProfile: valData.updateProfile,
            createPlan: valData.createPlan,
            quiz: valData.quiz
          });
        }
      } else {
        console.error("❌ فشل رد Val Town:", valTownRes.status);
      }
    } catch (valTownErr) {
      console.error("💥 خطأ في الاتصال بـ Val Town:", valTownErr);
    }

    // ── 4. الـ Fallback النهائي بذكاء الآلة المحلي (Machine Learning TF-IDF) ──
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
