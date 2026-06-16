import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    // Attempt to make a HEAD request with a 5-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      clearTimeout(timeoutId);

      return NextResponse.json({
        url,
        status: response.status,
        ok: response.ok
      });

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // If HEAD is not supported or fails, try a GET request with Range header to get just the first byte
      const getController = new AbortController();
      const getTimeoutId = setTimeout(() => getController.abort(), 5000);
      
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Range": "bytes=0-0",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          },
          signal: getController.signal
        });
        
        clearTimeout(getTimeoutId);
        
        return NextResponse.json({
          url,
          status: response.status,
          ok: response.ok
        });
      } catch (e: any) {
        clearTimeout(getTimeoutId);
        return NextResponse.json({
          url,
          status: 500,
          ok: false,
          error: e.message || "Connection timed out"
        });
      }
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
