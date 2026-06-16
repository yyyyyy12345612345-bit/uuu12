import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "logo", "logo.png");
    if (!fs.existsSync(filePath)) {
      return new Response("Favicon Not Found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("Error serving favicon:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
