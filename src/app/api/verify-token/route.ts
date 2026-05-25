import { NextResponse } from "next/server";
import { verifySignedToken } from "../otp-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const t = searchParams.get("t");
  if (!t) {
    return new Response("Missing token", { status: 400 });
  }

  const result = verifySignedToken(t);
  if (!result) {
    return new Response("Invalid or expired token", { status: 400 });
  }

  return NextResponse.redirect(
    new URL(`/?verified=${encodeURIComponent(result.email)}`, request.url)
  );
}
