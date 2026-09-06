import { NextResponse } from "next/server";
import { getAdminApp, getAdminAuth } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // Firebase ID token of the admin
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      return NextResponse.json({ error: errorDescription || "Auth failed" }, { status: 400 });
    }

    if (!code || !state) {
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    // 1. Verify admin token
    const adminAuth = getAdminAuth();
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(state);
    } catch (e: any) {
      return NextResponse.json({ error: `Unauthorized state token: ${e.message}` }, { status: 401 });
    }

    const emailLower = decodedToken.email?.toLowerCase() || "";
    if (
      emailLower !== "youssefosama@gmail.com" &&
      emailLower !== "youssef@yaqeen.app" &&
      !emailLower.includes("youssef")
    ) {
      return NextResponse.json({ error: "Access Denied: Only Admin can link YouTube" }, { status: 403 });
    }

    // 2. Exchange code for tokens
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const requestUrl = new URL(request.url);
    const redirectUri = `${requestUrl.origin}/api/auth/youtube/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Server Configuration Error: Missing YouTube credentials" },
        { status: 500 }
      );
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[YouTube API] Token exchange failed:", errText);
      return NextResponse.json(
        { error: `Failed to fetch tokens from Google: ${errText}` },
        { status: tokenRes.status }
      );
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    if (!access_token) {
      return NextResponse.json(
        { error: "Invalid token response from Google", data: tokenData },
        { status: 400 }
      );
    }

    // 3. Fetch YouTube channel info
    const channelRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    let channelData = {
      channelId: `yt_${Date.now()}`,
      channelTitle: "قناة يوتيوب",
      channelHandle: "",
      avatar: "",
      subscriberCount: 0,
    };

    if (channelRes.ok) {
      const ytData = await channelRes.json();
      const channel = ytData.items?.[0];
      if (channel) {
        channelData = {
          channelId: channel.id,
          channelTitle: channel.snippet?.title || channelData.channelTitle,
          channelHandle: channel.snippet?.customUrl || "",
          avatar: channel.snippet?.thumbnails?.default?.url || "",
          subscriberCount: parseInt(channel.statistics?.subscriberCount || "0"),
        };
      }
    } else {
      console.warn("[YouTube API] Failed to fetch channel info:", await channelRes.text());
    }

    // 4. Save to Firestore
    const adminDb = admin.firestore(getAdminApp());
    const accountRef = adminDb.collection("youtube_accounts").doc(channelData.channelId);

    const now = Date.now();
    await accountRef.set(
      {
        id: channelData.channelId,
        channelTitle: channelData.channelTitle,
        channelHandle: channelData.channelHandle,
        avatar: channelData.avatar,
        subscriberCount: channelData.subscriberCount,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        expiresAt: admin.firestore.Timestamp.fromMillis(now + (expires_in || 3600) * 1000),
        addedBy: decodedToken.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // 5. Success page + auto-close popup
    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تم ربط قناة يوتيوب</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .card {
            background: #1e293b;
            padding: 2.5rem;
            border-radius: 2rem;
            border: 1px solid #334155;
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5);
            max-width: 420px;
          }
          .icon { font-size: 3rem; margin-bottom: 1rem; }
          h1 { font-size: 1.5rem; margin: 0 0 0.5rem 0; color: #ff0000; }
          p { font-size: 0.875rem; color: #94a3b8; margin-bottom: 2rem; }
          strong { color: #f8fafc; }
          button {
            background: #ff0000;
            color: #fff;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: 0.2s;
          }
          button:hover { background: #cc0000; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🎬</div>
          <h1>تم ربط القناة بنجاح!</h1>
          <p>تم ربط قناة <strong>${channelData.channelTitle}</strong> بمدير منصة يقين بنجاح. يمكنك الآن نشر الفيديوهات العريضة مباشرة على يوتيوب.</p>
          <button onclick="window.close()">إغلاق النافذة</button>
        </div>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: "YOUTUBE_LINKED", success: true }, "*");
          }
          setTimeout(() => { window.close(); }, 3000);
        </script>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });

  } catch (error: any) {
    console.error("[YouTube API Error] Callback handling failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
