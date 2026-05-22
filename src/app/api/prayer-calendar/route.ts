import { NextResponse } from "next/server";

const PRAYER_METHOD = 5;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");
  const latitude = url.searchParams.get("latitude");
  const longitude = url.searchParams.get("longitude");
  const city = url.searchParams.get("city");
  const country = url.searchParams.get("country");

  if (!year || !month) {
    return NextResponse.json(
      { code: 400, status: "error", message: "Missing required year or month" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    year,
    month,
    method: String(PRAYER_METHOD),
  });

  if (latitude && longitude) {
    params.set("latitude", latitude);
    params.set("longitude", longitude);
  } else {
    params.set("city", city || "Cairo");
    params.set("country", country || "Egypt");
  }

  const apiUrl = `https://api.aladhan.com/v1/calendar?${params.toString()}`;

  try {
    const response = await fetch(apiUrl, { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      const message = await response.text();
      return NextResponse.json(
        {
          code: response.status,
          status: "error",
          message: "Prayer calendar service returned an error.",
          details: message,
        },
        { status: 502 }
      );
    }

    if (!contentType.includes("application/json")) {
      const body = await response.text();
      return NextResponse.json(
        {
          code: response.status,
          status: "error",
          message: "Prayer calendar service returned non-JSON content.",
          details: body.slice(0, 800),
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        code: 500,
        status: "error",
        message: "Failed to fetch prayer calendar.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
