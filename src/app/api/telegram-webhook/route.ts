import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

const EXPECTED_CHANNEL_ID = -1004363174660; // معرف قناة مخزن فيديوهات يقين
const ALLOWED_CATEGORIES = ["مساجد", "بحار", "جبال", "غابات", "الثلج", "غروب", "سماء", "طبيعة"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[Telegram Webhook] Received update:", JSON.stringify(body));

    // استخراج منشور القناة (سواء جديد أو معدل)
    const post = body.channel_post || body.edited_channel_post;
    if (!post) {
      return NextResponse.json({ success: true, message: "No channel post found in update" });
    }

    // التحقق من أن المنشور قادم من القناة المحددة فقط لحماية البيانات
    const chatId = post.chat?.id;
    if (chatId !== EXPECTED_CHANNEL_ID) {
      console.warn(`[Telegram Webhook] Ignored post from chat ID: ${chatId}`);
      return NextResponse.json({ success: true, message: "Ignored unauthorized channel" });
    }

    // التحقق من وجود فيديو في المنشور (سواء فيديو عادي أو ملف فيديو document)
    const video = post.video || (post.document && post.document.mime_type?.startsWith("video/") ? post.document : null);
    if (!video || !video.file_id) {
      return NextResponse.json({ success: true, message: "Post does not contain a video" });
    }

    const fileId = video.file_id;
    const caption = post.caption || "";
    
    // قاموس الكلمات الدلالية لكل تصنيف للتعرف التلقائي بدون أي هاشتاج
    const CATEGORY_KEYWORDS: Record<string, string[]> = {
      "مساجد": ["مسجد", "مساجد", "مكة", "كعبة", "المدينة", "الحرم", "حرم", "اذان", "أذان", "صلاة", "اسلام", "إسلام", "islamic", "mosque", "mecca", "kaaba", "quran", "قرآن", "جامع"],
      "بحار": ["بحر", "بحار", "شاطئ", "شواطئ", "محيط", "محيطات", "أمواج", "موج", "ماء", "مياه", "نهر", "أنهار", "شلال", "شلالات", "sea", "ocean", "beach", "waves", "water", "lake", "بحيرة"],
      "جبال": ["جبل", "جبال", "قمة", "قمم", "صخر", "صخور", "هضاب", "تلال", "mountain", "mountains", "rocks", "hills"],
      "غابات": ["غابة", "غابات", "شجر", "أشجار", "أخضر", "خضار", "حديقة", "حدائق", "نبات", "نباتات", "ورود", "زهور", "forest", "trees", "nature", "green", "jungle"],
      "الثلج": ["ثلج", "ثلوج", "جليد", "شتاء", "صقيع", "برد", "snow", "ice", "winter", "cold", "frost"],
      "غروب": ["غروب", "شروق", "مغيب", "شمس", "أصيل", "شفق", "صباح", "sunset", "sunrise", "sun", "dawn", "dusk"],
      "سماء": ["سماء", "سحب", "سحاب", "غيم", "غيوم", "مطر", "أمطار", "نجوم", "قمر", "فضاء", "ليل", "sky", "clouds", "rain", "stars", "moon", "night"],
      "طبيعة": ["طبيعة", "طبيعي", "مناظر", "landscape", "nature"],
    };

    // دالة تنظيف وتوحيد الحروف للبحث
    const normalizeArabic = (text: string) => {
      return text
        .toLowerCase()
        .replace(/#/g, "") // إزالة علامة # نهائياً
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .replace(/[ًٌٍَُِّْ]/g, "")
        .trim();
    };

    const normalizedCaption = normalizeArabic(caption);

    // تحديد القسم المناسب من كلمات النص تلقائياً بدون الحاجة لأي هاشتاج
    let category = "طبيعة";
    for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => normalizedCaption.includes(normalizeArabic(kw)))) {
        category = catName;
        break;
      }
    }

    // استخراج العنوان وتنظيفه نهائياً من أي علامات هاشتاج
    let title = caption
      .replace(/#/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!title) {
      title = `فيديو سحابي ${new Date().toLocaleDateString("ar-EG")}`;
    }

    // إنشاء الكلمات الدلالية كتاغات صافية بدون أي هاشتاجات
    const tags: string[] = [category, "فيديو"];

    // استخراج الكلمات المفيدة من الوصف وإضافتها كتاغات
    const cleanWords = caption
      .replace(/[#،,.\-_:;!؟?()\[\]{}"'\\/]/g, " ")
      .split(/\s+/)
      .map((w: string) => w.trim())
      .filter((w: string) => w.length > 2 && !["هذا", "هذه", "التي", "الذي", "على", "إلى", "الى", "منه", "معها", "في", "من", "عن", "مع"].includes(w));

    for (const word of cleanWords) {
      if (!tags.includes(word)) {
        tags.push(word);
      }
    }

    // تهيئة Firebase Admin والاتصال بـ Firestore
    const adminDb = admin.firestore(getAdminApp());
    const backgroundsCol = adminDb.collection("backgrounds");

    // البحث عن خلفية سابقة بنفس معرّف الملف لتحديثها بدلاً من التكرار
    const querySnap = await backgroundsCol.where("fileId", "==", fileId).limit(1).get();

    const itemData = {
      title,
      type: "video",
      src: `/api/background/${fileId}.mp4`,
      fileId,
      category,
      tags,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!querySnap.empty) {
      // تحديث الخلفية الموجودة
      const existingDoc = querySnap.docs[0];
      await existingDoc.ref.update(itemData);
      console.log(`[Telegram Webhook] Updated existing background: ${existingDoc.id}`);
      return NextResponse.json({ success: true, message: "Background updated successfully", action: "updated", id: existingDoc.id });
    } else {
      // إضافة خلفية جديدة
      const newDocRef = await backgroundsCol.add({
        ...itemData,
        fit: "cover",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[Telegram Webhook] Added new background: ${newDocRef.id}`);
      return NextResponse.json({ success: true, message: "Background added successfully", action: "added", id: newDocRef.id });
    }
  } catch (error: any) {
    console.error("[Telegram Webhook] Error processing webhook:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
