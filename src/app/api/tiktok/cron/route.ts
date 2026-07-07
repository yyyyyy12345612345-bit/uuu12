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
    // 1. Optional: Verify cron secret if defined in env
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminApp = getAdminApp();
    const db = admin.firestore(adminApp);

    // 2. Fetch pending jobs scheduled for now or in the past
    const now = admin.firestore.Timestamp.now();
    const querySnap = await db.collection("tiktok_logs")
      .where("status", "==", "pending")
      .where("scheduledFor", "<=", now)
      .limit(10) // Process max 10 jobs per cron run to avoid timeout
      .get();

    if (querySnap.empty) {
      return NextResponse.json({ success: true, message: "No pending scheduled posts found." });
    }

    console.log(`[TikTok Cron] Found ${querySnap.size} pending posts to publish.`);
    const results = [];

    for (const docSnap of querySnap.docs) {
      const jobData = docSnap.data();
      const jobRef = docSnap.ref;
      
      try {
        // Update status to uploading first to prevent duplicate processing
        await jobRef.update({ status: "uploading" });

        const accessToken = await getValidAccessToken(jobData.accountId, db);

        // Call TikTok publish init
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
            source: "PULL_FROM_URL",
            video_url: jobData.videoUrl,
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
          throw new Error(`TikTok API publish init failed: ${resText}`);
        }

        const publishData = JSON.parse(resText);
        const publishId = publishData.data?.publish_id;

        await jobRef.update({
          status: "completed",
          publishId: publishId || "direct_pull",
          publishedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        results.push({ id: docSnap.id, success: true, publishId });
      } catch (err: any) {
        console.error(`[TikTok Cron] Error processing job ${docSnap.id}:`, err.message);
        await jobRef.update({
          status: "failed",
          error: err.message || "Unknown error",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        results.push({ id: docSnap.id, success: false, error: err.message });
      }
    }

    return NextResponse.json({ success: true, processed: results });

  } catch (error: any) {
    console.error("[TikTok Cron Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
