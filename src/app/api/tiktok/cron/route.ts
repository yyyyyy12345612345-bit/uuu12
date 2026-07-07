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

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminApp = getAdminApp();
    const db = admin.firestore(adminApp);

    // ==========================================
    // PHASE 1: PROCESS PENDING SCHEDULED POSTS
    // ==========================================
    const now = admin.firestore.Timestamp.now();
    const querySnap = await db.collection("tiktok_logs")
      .where("status", "==", "pending")
      .where("scheduledFor", "<=", now)
      .limit(3) // Process up to 3 posts at a time to prevent server timeouts
      .get();

    const uploadResults = [];

    for (const docSnap of querySnap.docs) {
      const jobData = docSnap.data();
      const jobRef = docSnap.ref;
      
      try {
        await jobRef.update({
          status: "uploading",
          progress: 0,
          uploadSpeed: "0 MB/s",
        });

        // 1. Download video
        const videoRes = await fetch(jobData.videoUrl);
        if (!videoRes.ok) throw new Error("Failed to download video file");
        const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
        const fileSize = videoBuffer.length;

        // 2. Initialize chunk parameters
        const CHUNK_SIZE = 5 * 1024 * 1024;
        const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

        const accessToken = await getValidAccessToken(jobData.accountId, db);

        // 3. Call TikTok publish init
        const publishInitUrl = "https://open.tiktokapis.com/v2/post/publish/video/init/";
        const publishBody = {
          post_info: {
            title: jobData.caption,
            privacy_level: "PUBLIC_TO_EVERYONE",
            disable_comment: false,
            disable_duet: false,
            disable_stitch: false,
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
          throw new Error(`TikTok API init failed: ${resText}`);
        }

        const publishData = JSON.parse(resText);
        const { upload_url, publish_id } = publishData.data;

        // 4. Upload chunks
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
            throw new Error(`Failed chunk ${i+1}: ${err}`);
          }

          const durationSec = (Date.now() - chunkStartTime) / 1000;
          const speedMbps = durationSec > 0 ? (chunkBuffer.length / (1024 * 1024)) / durationSec : 0;
          const progress = Math.round(((end + 1) / fileSize) * 100);

          await jobRef.update({
            progress,
            uploadSpeed: `${speedMbps.toFixed(1)} MB/s`,
          });
        }

        // Complete!
        await jobRef.update({
          status: "completed",
          publishId: publish_id,
          publishedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        uploadResults.push({ id: docSnap.id, success: true, publishId: publish_id });
      } catch (err: any) {
        console.error(`[TikTok Cron] Error processing job ${docSnap.id}:`, err.message);
        await jobRef.update({
          status: "failed",
          error: err.message || "Unknown error",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        uploadResults.push({ id: docSnap.id, success: false, error: err.message });
      }
    }

    // ==========================================
    // PHASE 2: SYNCHRONIZE VIDEO ANALYTICS
    // ==========================================
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Fetch recently completed videos (last 7 days) to update views, likes, shares, comments
    const completedSnap = await db.collection("tiktok_logs")
      .where("status", "==", "completed")
      .where("publishedAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
      .limit(10) // Limit to 10 analytics queries per cron run
      .get();

    const analyticsResults = [];

    for (const docSnap of completedSnap.docs) {
      const logData = docSnap.data();
      const logRef = docSnap.ref;
      let publicVideoId = logData.publicVideoId;
      let shareUrl = logData.shareUrl || "";

      try {
        const accessToken = await getValidAccessToken(logData.accountId, db);

        // 1. If we don't have publicVideoId yet, fetch publish status from TikTok
        if (!publicVideoId && logData.publishId) {
          const statusUrl = "https://open.tiktokapis.com/v2/post/publish/status/get/";
          const statusRes = await fetch(statusUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({ publish_id: logData.publishId }),
          });

          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const postStatus = statusData.data?.status;
            if (postStatus === "SUCCESS") {
              publicVideoId = statusData.data.public_video_id;
              shareUrl = statusData.data.share_url || shareUrl;
            }
          }
        }

        // 2. Fetch analytics if publicVideoId is available
        if (publicVideoId) {
          const queryUrl = "https://open.tiktokapis.com/v2/video/query/";
          const queryRes = await fetch(queryUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json; charset=UTF-8",
            },
            body: JSON.stringify({
              filters: {
                video_ids: [publicVideoId]
              }
            }),
          });

          if (queryRes.ok) {
            const queryData = await queryRes.json();
            const videoData = queryData.data?.videos?.[0];

            if (videoData) {
              await logRef.update({
                publicVideoId,
                shareUrl: videoData.share_url || shareUrl,
                views: videoData.view_count ?? 0,
                likes: videoData.like_count ?? 0,
                comments: videoData.comment_count ?? 0,
                shares: videoData.share_count ?? 0,
                favorites: videoData.favorites_count ?? videoData.bookmark_count ?? 0,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              analyticsResults.push({ id: docSnap.id, status: "updated", views: videoData.view_count });
              continue;
            }
          }
        }

        // If we didn't fetch analytics, just save publicVideoId if it was resolved
        if (publicVideoId !== logData.publicVideoId) {
          await logRef.update({ publicVideoId, shareUrl });
        }
        analyticsResults.push({ id: docSnap.id, status: "pending_status" });

      } catch (err: any) {
        console.error(`[TikTok Cron] Analytics error for job ${docSnap.id}:`, err.message);
        analyticsResults.push({ id: docSnap.id, status: "error", error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processedUploads: uploadResults,
      synchronizedAnalytics: analyticsResults,
    });

  } catch (error: any) {
    console.error("[TikTok Cron Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
