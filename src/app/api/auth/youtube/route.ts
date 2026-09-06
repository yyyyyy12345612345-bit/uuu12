import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing admin token" }, { status: 400 });
    }

    // 1. Verify Admin Token
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

    // 2. Build YouTube OAuth URL
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "Server Configuration Error: Missing YOUTUBE_CLIENT_ID" },
        { status: 500 }
      );
    }

    const requestUrl = new URL(request.url);
    const redirectUri = `${requestUrl.origin}/api/auth/youtube/callback`;

    // Scopes: YouTube upload + manage videos
    const scope = [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube",
    ].join(" ");

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", token); // Pass Firebase ID token as state

    return NextResponse.redirect(authUrl.toString());

  } catch (error: any) {
    console.error("[YouTube Auth Init Error]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
