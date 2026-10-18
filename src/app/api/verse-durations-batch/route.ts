import { NextResponse } from "next/server";
import { RECITERS } from "@/data/reciters";

export const runtime = "nodejs";

const pad = (n: number) => n.toString().padStart(3, "0");

// ═══════════════════════════════════════════════════
// 🔊 MP3 Duration Parser — Exact MPEG Frame Analysis
// (Same parser as single endpoint, duplicated for independence)
// ═══════════════════════════════════════════════════

const BITRATE_TABLE: Record<string, number[]> = {
  "3_3": [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 0],
  "3_2": [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 0],
  "3_1": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0],
  "2_3": [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, 0],
  "0_3": [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, 0],
  "2_2": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
  "0_2": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
  "2_1": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
  "0_1": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
};

const SAMPLE_RATE_TABLE: Record<number, number[]> = {
  3: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  0: [11025, 12000, 8000],
};

const SAMPLES_PER_FRAME: Record<string, number> = {
  "3_3": 384,  "3_2": 1152, "3_1": 1152,
  "2_3": 384,  "2_2": 1152, "2_1": 576,
  "0_3": 384,  "0_2": 1152, "0_1": 576,
};

function parseMp3Duration(buffer: ArrayBuffer): number | null {
  const data = new Uint8Array(buffer);
  let offset = 0;

  if (data.length > 10 && data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33) {
    const size = ((data[6] & 0x7F) << 21) | ((data[7] & 0x7F) << 14) |
                 ((data[8] & 0x7F) << 7) | (data[9] & 0x7F);
    offset = 10 + size;
    if (data[5] & 0x10) offset += 10;
  }

  let frameStart = -1;
  for (let i = offset; i < Math.min(data.length - 4, offset + 8192); i++) {
    if (data[i] === 0xFF && (data[i + 1] & 0xE0) === 0xE0) {
      frameStart = i;
      break;
    }
  }
  if (frameStart < 0 || frameStart + 4 >= data.length) return null;

  const b1 = data[frameStart + 1];
  const b2 = data[frameStart + 2];
  const mpegVersion = (b1 >> 3) & 3;
  const layer = (b1 >> 1) & 3;
  const bitrateIndex = (b2 >> 4) & 0xF;
  const sampleRateIndex = (b2 >> 2) & 3;
  const channelMode = (data[frameStart + 3] >> 6) & 3;

  if (mpegVersion === 1 || layer === 0 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
    return null;
  }

  const bitrateKey = `${mpegVersion}_${layer}`;
  const bitrate = (BITRATE_TABLE[bitrateKey] || BITRATE_TABLE["3_1"])[bitrateIndex];
  const sampleRate = (SAMPLE_RATE_TABLE[mpegVersion] || SAMPLE_RATE_TABLE[3])[sampleRateIndex];
  const samplesPerFrame = SAMPLES_PER_FRAME[bitrateKey] || 1152;

  if (!bitrate || !sampleRate) return null;

  // Check Xing/Info header
  let xingSearchOffset: number;
  if (mpegVersion === 3) {
    xingSearchOffset = frameStart + (channelMode === 3 ? 21 : 36);
  } else {
    xingSearchOffset = frameStart + (channelMode === 3 ? 13 : 21);
  }

  if (xingSearchOffset + 16 < data.length) {
    const tag = String.fromCharCode(
      data[xingSearchOffset], data[xingSearchOffset + 1],
      data[xingSearchOffset + 2], data[xingSearchOffset + 3]
    );
    if (tag === "Xing" || tag === "Info") {
      const flags = (data[xingSearchOffset + 4] << 24) | (data[xingSearchOffset + 5] << 16) |
                    (data[xingSearchOffset + 6] << 8) | data[xingSearchOffset + 7];
      if (flags & 0x01) {
        const totalFrames = (data[xingSearchOffset + 8] << 24) | (data[xingSearchOffset + 9] << 16) |
                            (data[xingSearchOffset + 10] << 8) | data[xingSearchOffset + 11];
        return Math.round((totalFrames * samplesPerFrame) / sampleRate * 100) / 100;
      }
    }
  }

  // Check VBRI header
  const vbriOffset = frameStart + 36;
  if (vbriOffset + 26 < data.length) {
    const vbriTag = String.fromCharCode(
      data[vbriOffset], data[vbriOffset + 1], data[vbriOffset + 2], data[vbriOffset + 3]
    );
    if (vbriTag === "VBRI") {
      const totalFrames = (data[vbriOffset + 14] << 24) | (data[vbriOffset + 15] << 16) |
                          (data[vbriOffset + 16] << 8) | data[vbriOffset + 17];
      return Math.round((totalFrames * samplesPerFrame) / sampleRate * 100) / 100;
    }
  }

  // CBR: count frames for small files
  const audioDataSize = data.length - frameStart;
  if (audioDataSize < 2 * 1024 * 1024) {
    let frameCount = 0;
    let pos = frameStart;
    const frameSize = Math.floor((samplesPerFrame / 8) * (bitrate * 1000) / sampleRate);
    while (pos + 4 < data.length) {
      if (data[pos] === 0xFF && (data[pos + 1] & 0xE0) === 0xE0) {
        frameCount++;
        const padding = (data[pos + 2] >> 1) & 1;
        const thisFrameSize = frameSize + (padding ? (layer === 3 ? 4 : 1) : 0);
        pos += thisFrameSize;
      } else {
        pos++;
      }
      if (frameCount > 100000) break;
    }
    if (frameCount > 0) {
      return Math.round((frameCount * samplesPerFrame) / sampleRate * 100) / 100;
    }
  }

  return Math.round((audioDataSize * 8) / (bitrate * 1000) * 100) / 100;
}

// Server-side cache
const batchCache = new Map<string, number>();

/**
 * POST /api/verse-durations-batch
 * Body: { surahId: number, startAyah: number, endAyah: number, reciterId: string }
 * Returns: { durations: { [ayahId]: number }, totalDuration: number, exact: boolean }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { surahId, startAyah, endAyah, reciterId } = body;

    if (!surahId || !startAyah || !endAyah || !reciterId) {
      return NextResponse.json({ error: "Missing required fields: surahId, startAyah, endAyah, reciterId" }, { status: 400 });
    }

    const reciter = RECITERS.find((r) => r.id === reciterId);
    const folder = reciter?.everyAyahFolder || "Alafasy_128kbps";

    const durations: Record<number, number> = {};
    let totalDuration = 0;
    let allExact = true;

    // Process in parallel batches of 10 to avoid overwhelming the CDN
    const ayahIds = [];
    for (let i = startAyah; i <= endAyah; i++) {
      ayahIds.push(i);
    }

    const BATCH_SIZE = 10;
    for (let batchStart = 0; batchStart < ayahIds.length; batchStart += BATCH_SIZE) {
      const batch = ayahIds.slice(batchStart, batchStart + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (ayahId) => {
          const cacheKey = `${reciterId}:${surahId}:${ayahId}`;

          // Check cache
          if (batchCache.has(cacheKey)) {
            return { ayahId, duration: batchCache.get(cacheKey)!, exact: true };
          }

          const ayahSlug = `${pad(surahId)}${pad(ayahId)}`;
          const audioUrl = `https://everyayah.com/data/${folder}/${ayahSlug}.mp3`;

          try {
            const audioRes = await fetch(audioUrl, {
              signal: AbortSignal.timeout(8000),
            });

            if (audioRes.ok) {
              const buffer = await audioRes.arrayBuffer();
              const duration = parseMp3Duration(buffer);

              if (duration && duration > 0) {
                batchCache.set(cacheKey, duration);
                return { ayahId, duration, exact: true };
              }
            }
          } catch (e) {
            console.warn(`[batch] Failed to parse ${cacheKey}:`, e);
          }

          // Fallback estimation
          return { ayahId, duration: 5, exact: false };
        })
      );

      for (const result of results) {
        durations[result.ayahId] = result.duration;
        totalDuration += result.duration;
        if (!result.exact) allExact = false;
      }
    }

    return NextResponse.json(
      {
        durations,
        totalDuration: Math.round(totalDuration * 100) / 100,
        count: ayahIds.length,
        exact: allExact,
      },
      {
        headers: { "Cache-Control": "public, s-maxage=86400, max-age=86400" },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
