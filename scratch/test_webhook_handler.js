const admin = require("firebase-admin");

// تهيئة Firebase Admin محلياً بنفس الطريقة
const serviceAccount = require("../yy10-ba274-firebase-adminsdk-fbsvc-77f9c6958a.json");

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const EXPECTED_CHANNEL_ID = -1004363174660;
const ALLOWED_CATEGORIES = ["مساجد", "بحار", "جبال", "غابات", "الثلج", "غروب", "سماء", "طبيعة"];

async function mockPostHandler(body) {
  try {
    const post = body.channel_post || body.edited_channel_post;
    if (!post) {
      return { success: true, message: "No channel post found in update" };
    }

    const chatId = post.chat?.id;
    if (chatId !== EXPECTED_CHANNEL_ID) {
      return { success: true, message: "Ignored unauthorized channel" };
    }

    const video = post.video;
    if (!video || !video.file_id) {
      return { success: true, message: "Post does not contain a video" };
    }

    const fileId = video.file_id;
    const caption = post.caption || "";
    
    const tags = [];
    const hashtagRegex = /#(\S+)/g;
    let match;
    while ((match = hashtagRegex.exec(caption)) !== null) {
      tags.push(match[1]);
    }

    let title = caption.replace(hashtagRegex, "").trim();
    if (!title) {
      title = `فيديو سحابي ${new Date().toLocaleDateString("ar-EG")}`;
    }

    let category = "طبيعة";
    for (const tag of tags) {
      if (ALLOWED_CATEGORIES.includes(tag)) {
        category = tag;
        break;
      }
    }

    if (!tags.includes(category)) {
      tags.push(category);
    }
    if (!tags.includes("فيديو")) {
      tags.push("فيديو");
    }

    const adminDb = admin.firestore();
    const backgroundsCol = adminDb.collection("backgrounds");

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
      const existingDoc = querySnap.docs[0];
      await existingDoc.ref.update(itemData);
      return { success: true, action: "updated", id: existingDoc.id };
    } else {
      const newDocRef = await backgroundsCol.add({
        ...itemData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { success: true, action: "added", id: newDocRef.id };
    }
  } catch (error) {
    console.error("Handler Error:", error);
    return { success: false, error: error.message };
  }
}

// تشغيل الفحص ببيانات المنشور الفعلي
const mockPayload = {
  update_id: 536818804,
  channel_post: {
    message_id: 4,
    chat: {
      id: -1004363174660,
      title: "مخزن فيديوهات يقين",
      type: "channel"
    },
    video: {
      file_id: "BAACAgQAAxkBAAMEakmUBs5bKMDk400Hf2E9mRN910EAAqwyAAIBRVFSNvw4VmO40uQ8BA",
      file_unique_id: "AgADrDIAAgFFUVI"
    },
    caption: "فيديو البحر الهادئ #بحار #طبيعة"
  }
};

mockPostHandler(mockPayload).then(res => {
  console.log("Mock Execution Result:", res);
});
