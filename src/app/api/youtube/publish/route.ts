import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

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
      scheduledFor,
      adminToken,
      retryLogId,
    } = body;

    if (!videoUrl || !title) {
      return NextResponse.json(
        { error: "Missing required fields: videoUrl, title" },
        { status: 400 }
      );
    }

    // Auth check
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isCronBypass = cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!adminToken && !isCronBypass) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const adminApp = getAdminApp();
    const adminDb = admin.firestore(adminApp);

    if (!isCronBypass) {
      const adminAuth = admin.auth(adminApp);
      try {
        const decoded = await adminAuth.verifyIdToken(adminToken);
        const emailLower = decoded.email?.toLowerCase() || "";
        if (
          emailLower !== "youssefosama@gmail.com" &&
          emailLower !== "youssef@yaqeen.app" &&
          !emailLower.includes("youssef")
        ) {
          return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
        }
      } catch (e: any) {
        return NextResponse.json({ error: `Unauthorized session: ${e.message}` }, { status: 401 });
      }
    }

    // Scheduled post — save to queue
    if (scheduledFor) {
      const scheduledTime = new Date(scheduledFor);
      if (isNaN(scheduledTime.getTime()) || scheduledTime.getTime() <= Date.now()) {
        return NextResponse.json(
          { error: "Invalid scheduled date/time. Must be in the future." },
          { status: 400 }
        );
      }

      let logRef;
      if (retryLogId) {
        logRef = adminDb.collection("youtube_logs").doc(retryLogId);
        await logRef.update({
          status: "pending",
          scheduledFor: admin.firestore.Timestamp.fromDate(scheduledTime),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: admin.firestore.FieldValue.delete(),
        });
      } else {
        logRef = await adminDb.collection("youtube_logs").add({
          channelId: YOUTUBE_CHANNEL_ID,
          videoUrl,
          title,
          description: description || "",
          tags: tags || [],
          status: "pending",
          progress: 0,
          scheduledFor: admin.firestore.Timestamp.fromDate(scheduledTime),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          publishedAt: null,
        });
      }

      return NextResponse.json({
        success: true,
        message: "YouTube video scheduled successfully",
        jobId: logRef.id,
      });
    }

    // Immediate publish — create log first
    let logRef;
    if (retryLogId) {
      logRef = adminDb.collection("youtube_logs").doc(retryLogId);
      await logRef.update({
        status: "uploading",
        progress: 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: admin.firestore.FieldValue.delete(),
      });
    } else {
      logRef = await adminDb.collection("youtube_logs").add({
        channelId: YOUTUBE_CHANNEL_ID,
        videoUrl,
        title,
        description: description || "",
        tags: tags || [],
        status: "uploading",
        progress: 0,
        scheduledFor: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        publishedAt: null,
      });
    }

    // Forward to Make.com Webhook — Make.com posts to YouTube
    const makeWebhookUrl =
      process.env.MAKE_YOUTUBE_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL || "";

    if (!makeWebhookUrl) {
      const errText = "Missing MAKE_YOUTUBE_WEBHOOK_URL environment variable";
      await logRef.update({ status: "failed", error: errText });
      return NextResponse.json({ error: errText }, { status: 500 });
    }

    console.log(`[YouTube Publish] Forwarding to Make.com: ${makeWebhookUrl}`);

    await logRef.update({
      status: "uploading",
      progress: 50,
      uploadSpeed: "Make.com Flow",
    });

    const makeRes = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: "youtube",
        channelId: YOUTUBE_CHANNEL_ID,
        zernioAccountId: ZERNIO_YOUTUBE_ACCOUNT_ID,
        zernioApiKey: ZERNIO_API_KEY,
        videoUrl,
        title,
        description: description || "",
        tags: tags || [],
        jobId: logRef.id,
      }),
    });

    if (!makeRes.ok) {
      const errText = await makeRes.text();
      await logRef.update({ status: "failed", error: `Make.com Webhook failed: ${errText}` });
      return NextResponse.json(
        { error: `Make.com Webhook failed: ${errText}` },
        { status: makeRes.status }
      );
    }

    await logRef.update({
      status: "completed",
      progress: 100,
      publishId: "make_com_youtube",
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "YouTube video published via Make.com successfully",
      jobId: logRef.id,
    });

  } catch (error: any) {
    console.error("[YouTube Publish API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
