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

    // التحقق من وجود فيديو في المنشور
    const video = post.video;
    if (!video || !video.file_id) {
      return NextResponse.json({ success: true, message: "Post does not contain a video" });
    }

    const fileId = video.file_id;
    const caption = post.caption || "";
    
    // استخراج الكلمات الدلالية (الهاشتاجات) من الكابشن
    const tags: string[] = [];
    const hashtagRegex = /#(\S+)/g;
    let match;
    while ((match = hashtagRegex.exec(caption)) !== null) {
      tags.push(match[1]);
    }

    // استخراج العنوان (تنظيف النص من الهاشتاجات)
    let title = caption.replace(hashtagRegex, "").trim();
    if (!title) {
      title = `فيديو سحابي ${new Date().toLocaleDateString("ar-EG")}`;
    }

    // تحديد القسم المناسب من الهاشتاجات، الافتراضي "طبيعة"
    let category = "طبيعة";
    for (const tag of tags) {
      if (ALLOWED_CATEGORIES.includes(tag)) {
        category = tag;
        break;
      }
    }

    // إدراج القسم ونوع الملف تلقائياً ضمن الكلمات الدلالية
    if (!tags.includes(category)) {
      tags.push(category);
    }
    if (!tags.includes("فيديو")) {
      tags.push("فيديو");
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
      return NextResponse.json({ success: true, action: "updated", id: existingDoc.id });
    } else {
      // إضافة خلفية جديدة
      const newDocRef = await backgroundsCol.add({
        ...itemData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[Telegram Webhook] Added new background: ${newDocRef.id}`);
      return NextResponse.json({ success: true, action: "added", id: newDocRef.id });
    }
  } catch (error: any) {
    console.error("[Telegram Webhook] Error processing webhook:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
