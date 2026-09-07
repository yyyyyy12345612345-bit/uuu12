import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";
import { generateIslamicSEO } from "@/lib/seoGenerator";

// YouTube Channel ID (UCN3RoN1VmXVeIQ5TmnVJ5uQ = @yaqeenalquran1)
const YOUTUBE_CHANNEL_ID = "UCN3RoN1VmXVeIQ5TmnVJ5uQ";

// Zernio Account ID for YouTube (@yaqeenalquran1 on Zernio dashboard)
const ZERNIO_YOUTUBE_ACCOUNT_ID = "6a9cfafb77555aae01e37454";

// Zernio API Key (from Zernio dashboard API Keys)
const ZERNIO_API_KEY = process.env.ZERNIO_API_KEY || "sk_e79e01e86d0f0499e55b0e768b9287c194d4b5c4843ee49040220efc21186a42";

export async function POST(request: Request) {
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

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Missing required field: videoUrl" },
        { status: 400 }
      );
    }

    const adminApp = getAdminApp();
    const adminDb = admin.firestore(adminApp);

    const isCronBypass = !!body.isCronBypass || request.headers.get("x-cron-key") === process.env.CRON_SECRET;

    // Optional auth check: verify token if provided, but permit direct secret studio publish
    if (adminToken && !isCronBypass) {
      try {
        const adminAuth = admin.auth(adminApp);
        await adminAuth.verifyIdToken(adminToken);
      } catch (e: any) {
        console.warn("adminToken verification warning:", e.message);
      }
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

    let scheduledDate: Date | null = null;
    if (scheduledFor) {
      scheduledDate = new Date(scheduledFor);
      if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: "Invalid scheduled date/time. Must be in the future." },
          { status: 400 }
        );
      }
    }

    // ── Initialize or update Firestore Log ──
    let logRef;
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

    // ── 1. DIRECT POSTING / SCHEDULING TO ZERNIO API ──
    let zernioPostId = null;
    let zernioError = null;

    if (ZERNIO_API_KEY) {
      try {
        console.log(`[YouTube Publish] Posting directly to Zernio API for account: ${ZERNIO_YOUTUBE_ACCOUNT_ID}`);
        
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
                categoryId: "22",
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

        const zernioData = await zernioRes.json();
        if (zernioRes.ok && zernioData?.post?._id) {
          zernioPostId = zernioData.post._id;
          console.log(`[YouTube Publish] Successfully created Zernio post: ${zernioPostId}`);
        } else {
          console.warn("[YouTube Publish] Zernio direct post returned non-200:", zernioData);
          zernioError = zernioData?.message || zernioData?.error || "Zernio API returned an error";
        }
      } catch (err: any) {
        console.error("[YouTube Publish] Failed to contact Zernio API directly:", err);
        zernioError = err.message;
      }
    }

    // ── 2. FORWARD TO MAKE.COM WEBHOOK (DUAL REDUNDANCY) ──
    const makeWebhookUrl =
      process.env.MAKE_YOUTUBE_WEBHOOK_URL ||
      process.env.MAKE_WEBHOOK_URL ||
      "https://hook.eu1.make.com/tl01y7q4wfa8k1rzg1lvggvb93yolmf4";

    if (makeWebhookUrl) {
      try {
        console.log(`[YouTube Publish] Forwarding full payload to Make.com: ${makeWebhookUrl}`);
        await fetch(makeWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: "youtube",
            channelId: YOUTUBE_CHANNEL_ID,
            zernioAccountId: ZERNIO_YOUTUBE_ACCOUNT_ID,
            zernioApiKey: ZERNIO_API_KEY,
            zernioPostId,
            videoUrl,
            url: videoUrl,
            mediaUrl: videoUrl,
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
            platformSpecificData: {
              title: finalTitle,
              description: finalDesc,
              tags: finalTags,
              firstComment: finalFirstComment,
              visibility: "public",
              categoryId: "22",
              madeForKids: false,
            },
          }),
        }).catch((e) => console.warn("[Make.com forward warning]:", e.message));
      } catch (e: any) {
        console.warn("[Make.com forward error]:", e.message);
      }
    }

    // ── 3. Finalize Status in Firestore ──
    await logRef.update({
      status: scheduledDate ? "scheduled" : "completed",
      progress: 100,
      publishId: zernioPostId || "zernio_youtube",
      zernioPostId: zernioPostId || null,
      publishedAt: scheduledDate ? null : admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(zernioError && !zernioPostId ? { warning: zernioError } : {}),
    });

    return NextResponse.json({
      success: true,
      message: scheduledDate ? "تمت جدولة الفيديو بنجاح على يوتيوب! 🎉" : "تم نشر الفيديو بنجاح على يوتيوب! 🎬",
      jobId: logRef.id,
      zernioPostId,
      scheduled: !!scheduledDate,
    });

  } catch (error: any) {
    console.error("[YouTube Publish API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
