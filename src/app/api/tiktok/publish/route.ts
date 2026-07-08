import { NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

async function getValidAccessToken(accountId: string, db: admin.firestore.Firestore): Promise<string> {
  const accountRef = db.collection("tiktok_accounts").doc(accountId);
  const accountDoc = await accountRef.get();

  if (!accountDoc.exists) {
    throw new Error("TikTok account not found in database.");
  }

  const data = accountDoc.data()!;
  const now = Date.now();
  const expiresAt = data.expiresAt.toDate().getTime();
  
  if (expiresAt - now > 5 * 60 * 1000) {
    return data.accessToken;
  }

  console.log(`[TikTok Token] Refreshing access token for account: ${data.username}`);
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    throw new Error("Server Configuration Error: Missing TikTok credentials");
  }

  const tokenUrl = "https://open.tiktokapis.com/v2/oauth/token/";
  const details: Record<string, string> = {
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: data.refreshToken,
  };

  const formBody = Object.keys(details)
    .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(details[key]!))
    .join("&");

  const refreshRes = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: formBody,
  });

  if (!refreshRes.ok) {
    const errText = await refreshRes.text();
    console.error("[TikTok Token] Refresh failed:", errText);
    throw new Error(`TikTok refresh token failed: ${errText}`);
  }

  const tokenData = await refreshRes.json();
  const { access_token, refresh_token, expires_in, refresh_expires_in } = tokenData;

  if (!access_token) {
    throw new Error("Invalid refresh token response from TikTok");
  }

  const updateData: Record<string, any> = {
    accessToken: access_token,
    expiresAt: admin.firestore.Timestamp.fromMillis(now + expires_in * 1000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (refresh_token) {
    updateData.refreshToken = refresh_token;
    updateData.refreshTokenExpiresAt = admin.firestore.Timestamp.fromMillis(now + refresh_expires_in * 1000);
  }

  await accountRef.update(updateData);
  return access_token;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, videoUrl, caption, scheduledFor, adminToken, retryLogId } = body;

    if (!accountId || !videoUrl || !caption) {
      return NextResponse.json({ error: "Missing required fields: accountId, videoUrl, caption" }, { status: 400 });
    }
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
        const decodedToken = await adminAuth.verifyIdToken(adminToken);
        const emailLower = decodedToken.email?.toLowerCase() || "";
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
    // 1. If it's a scheduled post, save to Firestore queue
    if (scheduledFor) {
      const scheduledTime = new Date(scheduledFor);
      if (isNaN(scheduledTime.getTime()) || scheduledTime.getTime() <= Date.now()) {
        return NextResponse.json({ error: "Invalid scheduled date/time. Must be in the future." }, { status: 400 });
      }

      let logRef;
      if (retryLogId) {
        logRef = adminDb.collection("tiktok_logs").doc(retryLogId);
        await logRef.update({
          status: "pending",
          scheduledFor: admin.firestore.Timestamp.fromDate(scheduledTime),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          error: admin.firestore.FieldValue.delete(),
        });
      } else {
        logRef = await adminDb.collection("tiktok_logs").add({
          videoUrl,
          accountId,
          caption,
          status: "pending",
          progress: 0,
          uploadSpeed: "0 MB/s",
          scheduledFor: admin.firestore.Timestamp.fromDate(scheduledTime),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          publishedAt: null,
        });
      }

      return NextResponse.json({ success: true, message: "Video scheduled successfully", jobId: logRef.id });
    }

    // 2. Initialize/Update log document first with status 'uploading'
    let logRef;
    if (retryLogId) {
      logRef = adminDb.collection("tiktok_logs").doc(retryLogId);
      await logRef.update({
        status: "uploading",
        progress: 0,
        uploadSpeed: "0 MB/s",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        error: admin.firestore.FieldValue.delete(),
      });
    } else {
      logRef = await adminDb.collection("tiktok_logs").add({
        videoUrl,
        accountId,
        caption,
        status: "uploading",
        progress: 0,
        uploadSpeed: "0 MB/s",
        scheduledFor: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        publishedAt: null,
      });
    }

    // ==========================================
    // OPTION A: FORWARD TO MAKE.COM WEBHOOK (IF CHOSEN)
    // ==========================================
    if (accountId === "make_com") {
      const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
      if (!makeWebhookUrl) {
        const errText = "عذراً، لم يتم إعداد رابط الويب هوك (MAKE_WEBHOOK_URL) في السيرفر بعد.";
        await logRef.update({ status: "failed", error: errText });
        return NextResponse.json({ error: errText }, { status: 400 });
      }

      console.log(`[TikTok Publish] Forwarding payload to Make.com Webhook: ${makeWebhookUrl}`);
      
      await logRef.update({
        status: "uploading",
        progress: 50,
        uploadSpeed: "Make.com Flow",
      });

      const makeRes = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl,
          caption,
          accountId,
          jobId: logRef.id,
        }),
      });

      if (!makeRes.ok) {
        const errText = await makeRes.text();
        await logRef.update({ status: "failed", error: `Make.com Webhook failed: ${errText}` });
        return NextResponse.json({ error: `Make.com Webhook failed: ${errText}` }, { status: makeRes.status });
      }

      await logRef.update({
        status: "completed",
        progress: 100,
        publishId: "make_com",
        publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        message: "Video published via Make.com successfully",
        jobId: logRef.id,
      });
    }


    // ==========================================
    // OPTION B: NATIVE TIKTOK API CHUNK UPLOADER
    // ==========================================
    console.log(`[TikTok Publish] Downloading video: ${videoUrl}`);
    const videoRes = await fetch(videoUrl);
    if (!videoRes.ok) {
      const errText = `Failed to download video file: ${videoRes.statusText}`;
      await logRef.update({ status: "failed", error: errText });
      return NextResponse.json({ error: errText }, { status: 400 });
    }
    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    const fileSize = videoBuffer.length;

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

    const accessToken = await getValidAccessToken(accountId, adminDb);

    const publishInitUrl = "https://open.tiktokapis.com/v2/post/publish/video/init/";
    const publishBody = {
      post_info: {
        title: caption,
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1500, // Cover at 1.5 seconds mark (1080x1920)
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: fileSize,
        chunk_size: totalChunks > 1 ? CHUNK_SIZE : fileSize,
        total_chunk_count: totalChunks,
      },
    };

    const publishRes = await fetch(publishInitUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify(publishBody),
    });

    const resText = await publishRes.text();
    if (!publishRes.ok) {
      console.error("[TikTok API] Video publish init failed:", resText);
      await logRef.update({ status: "failed", error: `TikTok Init failed: ${resText}` });
      return NextResponse.json({ error: `TikTok API failed: ${resText}` }, { status: publishRes.status });
    }

    const publishData = JSON.parse(resText);
    const { upload_url, publish_id } = publishData.data;

    if (!upload_url || !publish_id) {
      await logRef.update({ status: "failed", error: "TikTok response missing upload details" });
      return NextResponse.json({ error: "Missing upload details in TikTok response" }, { status: 500 });
    }

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min((i + 1) * CHUNK_SIZE - 1, fileSize - 1);
      const chunkBuffer = videoBuffer.slice(start, end + 1);

      const chunkStartTime = Date.now();
      const uploadChunkRes = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": chunkBuffer.length.toString(),
          "Content-Type": "video/mp4",
        },
        body: chunkBuffer,
      });

      if (!uploadChunkRes.ok) {
        const err = await uploadChunkRes.text();
        console.error(`[TikTok API] Failed to upload chunk ${i+1}/${totalChunks}:`, err);
        await logRef.update({ status: "failed", error: `Failed chunk ${i+1}: ${err}` });
        return NextResponse.json({ error: `Failed to upload chunk ${i+1}/${totalChunks}: ${err}` }, { status: 400 });
      }

      const durationSec = (Date.now() - chunkStartTime) / 1000;
      const speedMbps = durationSec > 0 ? (chunkBuffer.length / (1024 * 1024)) / durationSec : 0;
      const progress = Math.round(((end + 1) / fileSize) * 100);

      await logRef.update({
        progress,
        uploadSpeed: `${speedMbps.toFixed(1)} MB/s`,
      });
    }

    await logRef.update({
      status: "completed",
      publishId: publish_id,
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Video published successfully to TikTok",
      jobId: logRef.id,
      publishId: publish_id,
    });

  } catch (error: any) {
    console.error("[TikTok Publish API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
