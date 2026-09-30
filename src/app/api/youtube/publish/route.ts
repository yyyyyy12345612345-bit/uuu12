import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";
import { generateIslamicSEO } from "@/lib/seoGenerator";
import { PublishLogger, validateVideoUrl } from "@/lib/publishLogger";

// YouTube Channel ID (UCN3RoN1VmXVeIQ5TmnVJ5uQ = @yaqeenalquran1)
const YOUTUBE_CHANNEL_ID = "UCN3RoN1VmXVeIQ5TmnVJ5uQ";

// Zernio Account ID for YouTube (@yaqeenalquran1 on Zernio dashboard)
const ZERNIO_YOUTUBE_ACCOUNT_ID = "6a9cfafb77555aae01e37454";

// Zernio Account ID for TikTok (@yaqeenalquran on Zernio dashboard)
const ZERNIO_TIKTOK_ACCOUNT_ID = "6a4c75f09d9472faaea0b774";

// Zernio API Key (from environment)
const ZERNIO_API_KEY = process.env.ZERNIO_API_KEY || "";

export async function POST(request: Request) {
  const plog = new PublishLogger("youtube", "", "");
  
  try {
    const body = await request.json();
    const {
      videoUrl,
      title,
      description,
      tags,
      firstComment,
      scheduledFor,
      adminToken,
      retryLogId,
      surahName,
      surahNumber,
      reciterName,
      startAyah,
      endAyah,
    } = body;

    // تحديث الـ logger بالمعلومات الفعلية
    (plog as any).videoUrl = videoUrl || "";

    if (!videoUrl) {
      plog.error("video_url_validate", "videoUrl مفقود من الـ request body");
      return NextResponse.json(
        { error: "Missing required field: videoUrl", diagnostics: plog.getSteps() },
        { status: 400 }
      );
    }

    const adminApp = getAdminApp();
    const adminDb = admin.firestore(adminApp);

    const cronSecret = process.env.CRON_SECRET;
    const isCronBypass = !!cronSecret && request.headers.get("x-cron-key") === cronSecret;

    // 🔒 التحقق الصارم من صلاحيات الأدمن للنشر على يوتيوب
    if (!adminToken && !isCronBypass) {
      plog.error("auth_check", "مفيش admin token أو cron bypass");
      return NextResponse.json({ error: "Unauthorized: Missing admin token", diagnostics: plog.getSteps() }, { status: 401 });
    }

    if (!isCronBypass) {
      const adminAuth = admin.auth(adminApp);
      try {
        const decodedToken = await adminAuth.verifyIdToken(adminToken);
        const emailLower = decodedToken.email?.toLowerCase() || "";
        if (
          emailLower !== "youssefosama@gmail.com" &&
          emailLower !== "youssef@yaqeen.app" &&
          !emailLower.includes("youssef")
        ) {
          plog.error("auth_check", `المستخدم ${emailLower} مش admin`);
          return NextResponse.json({ error: "Forbidden: Admin access only", diagnostics: plog.getSteps() }, { status: 403 });
        }
        plog.ok("auth_check", `تم التحقق: ${emailLower}`);
      } catch (e: any) {
        plog.error("auth_check", `فشل التحقق من التوكن: ${e.message}`);
        return NextResponse.json({ error: `Unauthorized session: ${e.message}`, diagnostics: plog.getSteps() }, { status: 401 });
      }
    } else {
      plog.ok("auth_check", "Cron bypass مفعّل");
    }

    // ── تحقق من رابط الفيديو ──
    const videoCheck = await validateVideoUrl(videoUrl);
    if (!videoCheck.ok) {
      plog.error("video_url_validate", videoCheck.error || "رابط الفيديو مش شغال", videoCheck.status);
      console.error(`[YouTube Publish] ❌ Video URL validation FAILED: ${videoCheck.error} | URL: ${videoUrl}`);
      // نكمل بدل ما نوقف — ممكن HEAD مش مدعوم بس GET شغال
      console.warn("[YouTube Publish] ⚠️ Continuing despite video validation failure...");
    } else {
      plog.ok("video_url_validate", `✅ Video OK — ${videoCheck.contentType} (${Math.round((videoCheck.contentLength || 0) / 1024 / 1024)}MB)`);
    }

    // ── Build Full, Rich Metadata for YouTube & Zernio via Dynamic SEO Generator ──
    const seoFallback = generateIslamicSEO({
      surahName,
      surahNumber,
      reciterName,
      startAyah,
      endAyah,
    });

    const finalTitle = (title?.trim() || seoFallback.title).substring(0, 100);
    const finalDesc = (description && description.trim().length > 50) ? description.trim() : seoFallback.description;

    let finalTags: string[] = [];
    if (Array.isArray(tags) && tags.length > 0) {
      finalTags = tags.map((t: string) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === "string" && tags.trim()) {
      finalTags = tags.split(",").map((t: string) => t.trim()).filter(Boolean);
    } else {
      finalTags = seoFallback.tags;
    }

    const finalFirstComment = firstComment?.trim() || seoFallback.firstComment;
    plog.ok("metadata_build", `Title: "${finalTitle.substring(0, 40)}..." | Tags: ${finalTags.length}`);

    let scheduledDate: Date | null = null;
    if (scheduledFor) {
      scheduledDate = new Date(scheduledFor);
      if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        plog.error("metadata_build", "تاريخ الجدولة مش صالح أو في الماضي");
        return NextResponse.json(
          { error: "Invalid scheduled date/time. Must be in the future.", diagnostics: plog.getSteps() },
          { status: 400 }
        );
      }
    }

    // ── Initialize or update Firestore Log ──
    let logRef;
    try {
      if (retryLogId) {
        logRef = adminDb.collection("youtube_logs").doc(retryLogId);
        await logRef.update({
          status: scheduledDate ? "scheduled" : "uploading",
          progress: 10,
          title: finalTitle,
          description: finalDesc,
          tags: finalTags,
          scheduledFor: scheduledDate ? admin.firestore.Timestamp.fromDate(scheduledDate) : null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: admin.firestore.FieldValue.delete(),
        });
      } else {
        logRef = await adminDb.collection("youtube_logs").add({
          channelId: YOUTUBE_CHANNEL_ID,
          videoUrl,
          title: finalTitle,
          description: finalDesc,
          tags: finalTags,
          status: scheduledDate ? "scheduled" : "uploading",
          progress: 10,
          scheduledFor: scheduledDate ? admin.firestore.Timestamp.fromDate(scheduledDate) : null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          publishedAt: null,
        });
      }
      (plog as any).jobId = logRef.id;
      plog.ok("firestore_log_init", `Log ID: ${logRef.id}`);
    } catch (fsErr: any) {
      plog.error("firestore_log_init", `فشل إنشاء السجل: ${fsErr.message}`);
      await plog.saveToFirestore(adminDb).catch(() => {});
      return NextResponse.json({ error: `Firestore log failed: ${fsErr.message}`, diagnostics: plog.getSteps() }, { status: 500 });
    }

    // ── 1. DIRECT POSTING / SCHEDULING TO ZERNIO API ──
    let zernioPostId = null;
    let zernioError = null;

    if (ZERNIO_API_KEY) {
      try {
        console.log(`[YouTube Publish] 📡 Posting to Zernio API | Account: ${ZERNIO_YOUTUBE_ACCOUNT_ID} | Video: ${videoUrl.substring(0, 80)}...`);
        
        const zernioPayload: any = {
          title: finalTitle,
          content: finalDesc,
          tags: finalTags,
          mediaItems: [
            {
              type: "video",
              url: videoUrl,
            },
          ],
          platforms: [
            {
              platform: "youtube",
              accountId: ZERNIO_YOUTUBE_ACCOUNT_ID,
              platformSpecificData: {
                title: finalTitle,
                description: finalDesc,
                tags: finalTags,
                firstComment: finalFirstComment,
                visibility: "public",
                categoryId: "27",
                madeForKids: false,
              },
            },
          ],
        };

        if (scheduledDate) {
          zernioPayload.scheduledFor = scheduledDate.toISOString();
          zernioPayload.publishNow = false;
          zernioPayload.isDraft = false;
        } else {
          zernioPayload.publishNow = true;
          zernioPayload.isDraft = false;
        }

        const zernioRes = await fetch("https://zernio.com/api/v1/posts", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${ZERNIO_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(zernioPayload),
        });

        const zernioBody = await zernioRes.text();
        let zernioData: any = null;
        try { zernioData = JSON.parse(zernioBody); } catch {}

        if (zernioRes.ok && zernioData?.post?._id) {
          zernioPostId = zernioData.post._id;
          plog.ok("zernio_youtube_post", `✅ Zernio Post ID: ${zernioPostId}`);
          console.log(`[YouTube Publish] ✅ Zernio post created: ${zernioPostId}`);
        } else {
          zernioError = zernioData?.message || zernioData?.error || `HTTP ${zernioRes.status}`;
          plog.error("zernio_youtube_post", `Zernio رفض الطلب: ${zernioError}`, zernioRes.status, zernioBody.substring(0, 500));
          console.error(`[YouTube Publish] ❌ Zernio failed (${zernioRes.status}): ${zernioBody.substring(0, 300)}`);
        }
      } catch (err: any) {
        zernioError = err.message;
        plog.error("zernio_youtube_post", `فشل الاتصال بـ Zernio: ${err.message}`);
        console.error("[YouTube Publish] ❌ Zernio API connection failed:", err.message);
      }
    } else {
      plog.skip("zernio_youtube_post", "ZERNIO_API_KEY مش معرّف — تم التخطي");
      console.log("[YouTube Publish] ⏭️ No ZERNIO_API_KEY — skipping direct Zernio");
    }

    // ── 2. FORWARD TO MAKE.COM WEBHOOK ──
    const makeWebhookUrl = process.env.MAKE_YOUTUBE_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL || "https://hook.eu1.make.com/tl01y7q4wfa8k1rzg1lvggvb93yolmf4";
    let makeSuccess = false;

    if (makeWebhookUrl && !zernioPostId) {
      try {
        console.log(`[YouTube Publish] 📡 Forwarding to Make.com: ${makeWebhookUrl}`);
        plog.ok("make_webhook_send", `إرسال webhook لـ ${makeWebhookUrl.substring(0, 50)}...`);
        
        const makePayload = {
          // General identifiers
          platform: "youtube",
          channelId: YOUTUBE_CHANNEL_ID,
          accountId: ZERNIO_TIKTOK_ACCOUNT_ID, // Default accountId for generic TikTok modules
          zernioAccountId: ZERNIO_YOUTUBE_ACCOUNT_ID,
          zernioYouTubeAccountId: ZERNIO_YOUTUBE_ACCOUNT_ID,
          zernioTikTokAccountId: ZERNIO_TIKTOK_ACCOUNT_ID,
          youtubeAccountId: ZERNIO_YOUTUBE_ACCOUNT_ID,
          tiktokAccountId: ZERNIO_TIKTOK_ACCOUNT_ID,
          zernioApiKey: ZERNIO_API_KEY,
          zernioPostId,

          // Video URLs (all common variations)
          videoUrl,
          url: videoUrl,
          mediaUrl: videoUrl,
          mediaItems: [{ type: "video", url: videoUrl }],

          // Text & Content (all common variations)
          title: finalTitle,
          videoTitle: finalTitle,
          description: finalDesc,
          content: finalDesc,
          caption: finalDesc,
          text: finalDesc,
          summary: finalDesc,
          tags: finalTags,
          tagsString: finalTags.join(", "),
          firstComment: finalFirstComment,
          jobId: logRef.id,
          scheduledFor: scheduledDate ? scheduledDate.toISOString() : null,
          publishNow: !scheduledDate,

          // TikTok specific compatibility
          privacy_level: "PUBLIC_TO_EVERYONE",
          privacyLevel: "PUBLIC_TO_EVERYONE",
          allow_comment: true,
          allow_duet: true,
          allow_stitch: true,
          disableComment: false,
          disableDuet: false,
          disableStitch: false,

          // Platform-specific blocks
          youtube: {
            accountId: ZERNIO_YOUTUBE_ACCOUNT_ID,
            title: finalTitle,
            description: finalDesc,
            tags: finalTags,
            tagsString: finalTags.join(", "),
            firstComment: finalFirstComment,
            visibility: "public",
            categoryId: "27",
            madeForKids: false,
          },
          tiktok: {
            accountId: ZERNIO_TIKTOK_ACCOUNT_ID,
            caption: finalDesc,
            title: finalTitle,
            tags: finalTags,
            privacyLevel: "PUBLIC_TO_EVERYONE",
          },
          platformSpecificData: {
            title: finalTitle,
            description: finalDesc,
            tags: finalTags,
            firstComment: finalFirstComment,
            visibility: "public",
            categoryId: "27",
            madeForKids: false,
            privacy_level: "PUBLIC_TO_EVERYONE",
            privacyLevel: "PUBLIC_TO_EVERYONE",
          },
        };

        const makeRes = await fetch(makeWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(makePayload),
        });

        const makeBody = await makeRes.text();
        
        if (makeRes.ok) {
          makeSuccess = true;
          plog.ok("make_webhook_response", `✅ Make.com accepted (${makeRes.status})`);
          console.log(`[YouTube Publish] ✅ Make.com webhook accepted (${makeRes.status})`);
        } else {
          plog.error("make_webhook_response", `Make.com رفض (${makeRes.status})`, makeRes.status, makeBody.substring(0, 500));
          console.error(`[YouTube Publish] ❌ Make.com rejected (${makeRes.status}): ${makeBody.substring(0, 300)}`);
        }
      } catch (e: any) {
        plog.error("make_webhook_send", `فشل الاتصال بـ Make.com: ${e.message}`);
        console.error("[YouTube Publish] ❌ Make.com connection failed:", e.message);
      }
    } else if (zernioPostId) {
      plog.skip("make_webhook_send", "Zernio نجح — Make.com مش محتاج");
    } else {
      plog.error("make_webhook_send", "لا Zernio ولا Make.com اشتغلوا — الفيديو مش هيتنشر!");
    }

    // ── 3. Finalize Status in Firestore ──
    const finalStatus = (zernioPostId || makeSuccess)
      ? (scheduledDate ? "scheduled" : "completed")
      : "warning";

    try {
      await logRef.update({
        status: finalStatus,
        progress: 100,
        publishId: zernioPostId || (makeSuccess ? "make_com" : "none"),
        zernioPostId: zernioPostId || null,
        makeWebhookSent: makeSuccess,
        publishedAt: scheduledDate ? null : admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...(zernioError && !zernioPostId ? { warning: zernioError } : {}),
        diagnostics: {
          steps: plog.getSteps(),
          hasErrors: plog.hasErrors(),
          errorSummary: plog.hasErrors() ? plog.getErrorSummary() : null,
        },
      });
      plog.ok("firestore_log_finalize", `Status: ${finalStatus}`);
    } catch (fsErr: any) {
      plog.error("firestore_log_finalize", `فشل تحديث السجل: ${fsErr.message}`);
    }

    // حفظ التشخيصات الكاملة
    plog.ok("complete", `Pipeline اكتمل — Zernio: ${zernioPostId ? "✅" : "❌"} | Make: ${makeSuccess ? "✅" : "❌"}`);
    await plog.saveToFirestore(adminDb).catch(() => {});

    return NextResponse.json({
      success: !!(zernioPostId || makeSuccess),
      message: scheduledDate 
        ? "تمت جدولة الفيديو بنجاح على يوتيوب! 🎉" 
        : (zernioPostId || makeSuccess) 
          ? "تم نشر الفيديو بنجاح على يوتيوب! 🎬"
          : "⚠️ تم إرسال الطلب لكن في مشاكل — راجع التشخيصات",
      jobId: logRef.id,
      zernioPostId,
      makeWebhookSent: makeSuccess,
      scheduled: !!scheduledDate,
      diagnostics: plog.getSteps(),
      ...(plog.hasErrors() ? { warnings: plog.getErrorSummary() } : {}),
    });

  } catch (error: any) {
    console.error("[YouTube Publish API Error]:", error);
    plog.error("complete", `خطأ عام: ${error.message}`);
    
    // حاول نحفظ التشخيصات حتى لو حصل خطأ عام
    try {
      const adminApp = getAdminApp();
      const adminDb = admin.firestore(adminApp);
      await plog.saveToFirestore(adminDb);
    } catch {}

    return NextResponse.json({ 
      error: error.message || "Internal server error",
      diagnostics: plog.getSteps(),
    }, { status: 500 });
  }
}
