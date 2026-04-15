import { NextResponse } from "next/server";

const DEFAULT_KEY = process.env.PEXELS_API_KEY ?? "h9PtPcgv4BjjJXhvHWqrUqiNT4JKh7kQ9DcqBucOHOker00sXHkpy7QC";

async function fetchPexelsImages(query: string, perPage: number) {
  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    {
      headers: {
        Authorization: DEFAULT_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = await response.json();
  return data.photos?.map((photo: any) => ({
    type: "image",
    src: photo.src.landscape || photo.src.large,
    poster: photo.src.medium,
  })) ?? [];
}

async function fetchPexelsVideos(query: string, perPage: number) {
  const response = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    {
      headers: {
        Authorization: DEFAULT_KEY,
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
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("query") || "islamic nature";
    const perPage = Number(url.searchParams.get("per_page") || "12");
    const type = url.searchParams.get("type") || "both";

    const items = [] as Array<{ type: "image" | "video"; src: string; poster?: string }>;

    if (type === "image") {
      items.push(...(await fetchPexelsImages(query, perPage)));
    } else if (type === "video") {
      items.push(...(await fetchPexelsVideos(query, perPage)));
    } else {
      const [images, videos] = await Promise.all([
        fetchPexelsImages(query, Math.ceil(perPage / 2)),
        fetchPexelsVideos(query, Math.floor(perPage / 2)),
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
