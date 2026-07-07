import { NextResponse } from "next/server";
import { getAdminApp, getAdminAuth } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // This is the Firebase ID token of the admin
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      return NextResponse.json({ error: errorDescription || "Auth failed" }, { status: 400 });
    }

    if (!code || !state) {
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    // 1. Verify that the state is a valid Firebase ID Token and belongs to the admin
    const adminAuth = getAdminAuth();
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(state);
    } catch (e: any) {
      return NextResponse.json({ error: `Unauthorized state token: ${e.message}` }, { status: 401 });
    }

    const email = decodedToken.email;
    const ADMIN_EMAIL = "youssefosama@gmail.com";
    if (email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Access Denied: Only General Admin can link TikTok" }, { status: 403 });
    }

    // 2. Exchange code for access token and refresh token
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    
    // Auto-detect redirect URI from origin or use env
    const requestUrl = new URL(request.url);
    const redirectUri = `${requestUrl.origin}/api/auth/tiktok/callback`;

    if (!clientKey || !clientSecret) {
      return NextResponse.json({ error: "Server Configuration Error: Missing TikTok credentials" }, { status: 500 });
    }

    const tokenUrl = "https://open.tiktokapis.com/v2/oauth/token/";
    const details: Record<string, string> = {
      client_key: clientKey,
      client_secret: clientSecret,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    };

    const formBody = Object.keys(details)
      .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(details[key]!))
      .join("&");

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: formBody,
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("[TikTok API] Token exchange failed:", errText);
      return NextResponse.json({ error: `Failed to fetch tokens from TikTok: ${errText}` }, { status: tokenRes.status });
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token, expires_in, refresh_expires_in, open_id } = tokenData;

    if (!access_token || !open_id) {
      return NextResponse.json({ error: "Invalid token response from TikTok", data: tokenData }, { status: 400 });
    }

    // 3. Fetch Creator Profile Information
    const userInfoUrl = "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username";
    const userInfoRes = await fetch(userInfoUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${access_token}`,
      },
    });

    let profile = {
      username: `user_${open_id.slice(0, 8)}`,
      display_name: "منشئ محتوى تيك توك",
      avatar_url: "",
    };

    if (userInfoRes.ok) {
      const userData = await userInfoRes.json();
      if (userData.data?.user) {
        profile = {
          username: userData.data.user.username || profile.username,
          display_name: userData.data.user.display_name || profile.display_name,
          avatar_url: userData.data.user.avatar_url || profile.avatar_url,
        };
      }
    } else {
      console.warn("[TikTok API] Failed to fetch user info:", await userInfoRes.text());
    }

    // 4. Save account to Firestore securely using Admin SDK
    const adminDb = admin.firestore(getAdminApp());
    const accountRef = adminDb.collection("tiktok_accounts").doc(open_id);

    const now = Date.now();
    const accountData = {
      id: open_id,
      username: profile.username,
      displayName: profile.display_name,
      avatar: profile.avatar_url,
      accessToken: access_token, // Encrypted/Secured in DB
      refreshToken: refresh_token,
      expiresAt: admin.firestore.Timestamp.fromMillis(now + expires_in * 1000),
      refreshTokenExpiresAt: admin.firestore.Timestamp.fromMillis(now + refresh_expires_in * 1000),
      addedBy: decodedToken.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await accountRef.set(accountData, { merge: true });

    // 5. Render success page and auto-close popup window
    const html = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تم الربط بنجاح</title>
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
            max-width: 400px;
          }
          .icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          h1 {
            font-size: 1.5rem;
            margin: 0 0 0.5rem 0;
            color: #38bdf8;
          }
          p {
            font-size: 0.875rem;
            color: #94a3b8;
            margin-bottom: 2rem;
          }
          button {
            background: #38bdf8;
            color: #0f172a;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: 0.2s;
          }
          button:hover {
            background: #0ea5e9;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✨</div>
          <h1>تم ربط الحساب بنجاح!</h1>
          <p>تم ربط حساب تيك توك <strong>@${profile.username}</strong> بمدير منصة يقين بنجاح.</p>
          <button onclick="window.close()">إغلاق النافذة</button>
        </div>
        <script>
          // Send message to parent window if opener is present
          if (window.opener) {
            window.opener.postMessage({ type: "TIKTOK_LINKED", success: true }, "*");
          }
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });

  } catch (error: any) {
    console.error("[TikTok API Error] Callback handling failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
