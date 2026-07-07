import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing admin token" }, { status: 400 });
    }

    // 1. Verify the Admin Token
    const adminAuth = getAdminAuth();
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (e: any) {
      return NextResponse.json({ error: `Invalid session token: ${e.message}` }, { status: 401 });
    }

    const emailLower = decodedToken.email?.toLowerCase() || "";
    if (
      emailLower !== "youssefosama@gmail.com" &&
      emailLower !== "youssef@yaqeen.app" &&
      !emailLower.includes("youssef")
    ) {
      return NextResponse.json({ error: "Forbidden: Admin access only" }, { status: 403 });
    }

    // 2. Generate TikTok Auth URL
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const requestUrl = new URL(request.url);
    const redirectUri = `${requestUrl.origin}/api/auth/tiktok/callback`;

    if (!clientKey) {
      return NextResponse.json({ error: "Server Configuration Error: Missing TikTok Client Key" }, { status: 500 });
    }

    // scopes: user.info.basic (to get username/avatar) and video.upload (to publish videos)
    const scope = "user.info.basic,video.upload";
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${encodeURIComponent(scope)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(token)}`;

    // 3. Redirect user to TikTok
    return NextResponse.redirect(authUrl);

  } catch (error: any) {
    console.error("[TikTok API Auth Init Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
