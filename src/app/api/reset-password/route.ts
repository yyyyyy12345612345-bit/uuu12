import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ success: false, error: "Deprecated endpoint" }, { status: 410 });
}
