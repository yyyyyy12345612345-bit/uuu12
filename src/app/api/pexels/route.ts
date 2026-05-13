import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function fetchPexelsImages(apiKey: string, query: string, perPage: number) {
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`,
    {
      headers: {
        Authorization: apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.photos?.map((photo: any) => ({
    type: "image",
    src: photo.src.large2x || photo.src.large || photo.src.original,
    poster: photo.src.medium,
  })) ?? [];
}

async function fetchPexelsVideos(apiKey: string, query: string, perPage: number) {
  const response = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`,
    {
      headers: {
        Authorization: apiKey,
      },
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.videos?.map((video: any) => {
    const file = Array.isArray(video.video_files)
      ? video.video_files.find((item: any) => item.quality === "sd") || video.video_files[0]
      : null;

    return file
      ? {
          type: "video",
          src: file.link,
          poster: video.image,
        }
      : null;
  }).filter(Boolean) ?? [];
}

export async function GET(req: Request) {
  const apiKey = process.env.PEXELS_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Pexels is not configured.",
        details: "Set PEXELS_API_KEY in the server environment (e.g. .env.local for local dev).",
      },
      { status: 503 }
    );
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("query") || "islamic nature";
    const perPage = Number(url.searchParams.get("per_page") || "12");
    const type = url.searchParams.get("type") || "both";

    const items = [] as Array<{ type: "image" | "video"; src: string; poster?: string }>;

    if (type === "image" || type === "images") {
      items.push(...(await fetchPexelsImages(apiKey, query, perPage)));
    } else if (type === "video" || type === "videos") {
      items.push(...(await fetchPexelsVideos(apiKey, query, perPage)));
    } else {
      const [images, videos] = await Promise.all([
        fetchPexelsImages(apiKey, query, Math.ceil(perPage / 2)),
        fetchPexelsVideos(apiKey, query, Math.floor(perPage / 2)),
      ]);
      items.push(...images, ...videos);
    }

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: "Pexels API request failed.", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
