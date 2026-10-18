import { NextResponse } from "next/server";
import { RECITERS } from "@/data/reciters";

export const runtime = "edge";

const pad = (n: number) => n.toString().padStart(3, "0");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const surahId = parseInt(searchParams.get("surah") || "1", 10);
    const ayahId = parseInt(searchParams.get("ayah") || "1", 10);
    const reciterId = searchParams.get("reciter") || "afasy";

    const reciter = RECITERS.find((r) => r.id === reciterId);
    const ayahSlug = `${pad(surahId)}${pad(ayahId)}`;
    const folder = reciter?.everyAyahFolder || "Alafasy_128kbps";
    const audioUrl = `https://everyayah.com/data/${folder}/${ayahSlug}.mp3`;

    const kbps = folder.includes("192kbps") ? 192 : folder.includes("64kbps") ? 64 : 128;
    const bytesPerSec = (kbps * 1000) / 8;

    try {
      const headRes = await fetch(audioUrl, { method: "HEAD" });
      if (headRes.ok) {
        const len = headRes.headers.get("content-length");
        if (len && Number(len) > 0) {
          const duration = Math.max(3, Math.round(Number(len) / bytesPerSec));
          return NextResponse.json(
            { duration, exact: true },
            {
              headers: {
                "Cache-Control": "public, s-maxage=86400, max-age=86400",
              },
            }
          );
        }
      }
    } catch {
      // Fallback below
    }

    // Realistic duration fallback
    const isMujawwad = reciterId.includes("mjwd") || reciterId.includes("mujawwad") || Boolean(reciter?.name?.includes("مجود"));
    const secPerWord = isMujawwad ? 3.8 : 1.75;
    const words = parseInt(searchParams.get("words") || "8", 10);
    const estimated = Math.max(isMujawwad ? 16 : 4, Math.round(words * secPerWord + (isMujawwad ? 3 : 1.5)));

    return NextResponse.json({ duration: estimated, exact: false });
  } catch (error: any) {
    return NextResponse.json({ duration: 6, error: error.message }, { status: 500 });
  }
}
