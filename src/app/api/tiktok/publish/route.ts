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
  
  // If token is still valid (with a 5-minute safety buffer), return it
  const expiresAt = data.expiresAt.toDate().getTime();
  if (expiresAt - now > 5 * 60 * 1000) {
    return data.accessToken;
  }

  // Token is expired or about to expire, refresh it
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

  // Sometime TikTok returns a new refresh token, update it if present
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
    const { accountId, videoUrl, caption, scheduledFor, adminToken } = body;

    if (!accountId || !videoUrl || !caption) {
      return NextResponse.json({ error: "Missing required fields: accountId, videoUrl, caption" }, { status: 400 });
    }

    // 1. Verify that the requester is the Admin
    if (!adminToken) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const adminApp = getAdminApp();
    const adminAuth = admin.auth(adminApp);
    const adminDb = admin.firestore(adminApp);

    try {
      const decodedToken = await adminAuth.verifyIdToken(adminToken);
      const email = decodedToken.email;
      if (email !== "youssefosama@gmail.com") {
        return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
      }
    } catch (e: any) {
      return NextResponse.json({ error: `Unauthorized session: ${e.message}` }, { status: 401 });
    }

    // 2. If it's a scheduled post, just save to queue
    if (scheduledFor) {
      const scheduledTime = new Date(scheduledFor);
      if (isNaN(scheduledTime.getTime()) || scheduledTime.getTime() <= Date.now()) {
        return NextResponse.json({ error: "Invalid scheduled date/time. Must be in the future." }, { status: 400 });
      }

      const logRef = await adminDb.collection("tiktok_logs").add({
        videoUrl,
        accountId,
        caption,
        status: "pending",
        scheduledFor: admin.firestore.Timestamp.fromDate(scheduledTime),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        publishedAt: null,
      });

      return NextResponse.json({ success: true, message: "Video scheduled successfully", jobId: logRef.id });
    }

    // 3. Publish immediately
    const accessToken = await getValidAccessToken(accountId, adminDb);

    // Initialize Direct Post with TikTok
    const publishInitUrl = "https://open.tiktokapis.com/v2/post/publish/video/init/";
    const publishBody = {
      post_info: {
        title: caption,
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
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
      return NextResponse.json({ error: `TikTok API failed: ${resText}` }, { status: publishRes.status });
    }

    const publishData = JSON.parse(resText);
    const publishId = publishData.data?.publish_id;

    // Log the success in database
    const logRef = await adminDb.collection("tiktok_logs").add({
      videoUrl,
      accountId,
      caption,
      status: "completed",
      publishId: publishId || "direct_pull",
      scheduledFor: null,
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      message: "Video published successfully to TikTok",
      jobId: logRef.id,
      publishId,
    });

  } catch (error: any) {
    console.error("[TikTok Publish API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
