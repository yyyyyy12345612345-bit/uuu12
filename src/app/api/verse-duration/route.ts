import { NextResponse } from "next/server";
import { RECITERS } from "@/data/reciters";

export const runtime = "nodejs";

const pad = (n: number) => n.toString().padStart(3, "0");

// ═══════════════════════════════════════════════════
// 🔊 MP3 Duration Parser — Exact MPEG Frame Analysis
// ═══════════════════════════════════════════════════

// MPEG bitrate tables [version][layer][index]
const BITRATE_TABLE: Record<string, number[]> = {
  // MPEG1, Layer I
  "3_3": [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 0],
  // MPEG1, Layer II
  "3_2": [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 0],
  // MPEG1, Layer III
  "3_1": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0],
  // MPEG2/2.5, Layer I
  "2_3": [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, 0],
  "0_3": [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, 0],
  // MPEG2/2.5, Layer II
  "2_2": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
  "0_2": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
  // MPEG2/2.5, Layer III
  "2_1": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
  "0_1": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0],
};

const SAMPLE_RATE_TABLE: Record<number, number[]> = {
  3: [44100, 48000, 32000], // MPEG1
  2: [22050, 24000, 16000], // MPEG2
  0: [11025, 12000, 8000],  // MPEG2.5
};

// Samples per frame: [version][layer]
const SAMPLES_PER_FRAME: Record<string, number> = {
  "3_3": 384,  "3_2": 1152, "3_1": 1152,  // MPEG1
  "2_3": 384,  "2_2": 1152, "2_1": 576,   // MPEG2
  "0_3": 384,  "0_2": 1152, "0_1": 576,   // MPEG2.5
};

function parseMp3Duration(buffer: ArrayBuffer): number | null {
  const data = new Uint8Array(buffer);
  let offset = 0;

  // ── Skip ID3v2 tag ──
  if (data.length > 10 && data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33) {
    // ID3v2 size is stored as synchsafe integer (4 bytes, 7 bits each)
    const size = ((data[6] & 0x7F) << 21) | ((data[7] & 0x7F) << 14) |
                 ((data[8] & 0x7F) << 7) | (data[9] & 0x7F);
    offset = 10 + size;
    // Check for footer flag (bit 4 of flags byte)
    if (data[5] & 0x10) offset += 10;
  }

  // ── Find first MPEG frame sync (0xFFE0+) ──
  let frameStart = -1;
  for (let i = offset; i < Math.min(data.length - 4, offset + 8192); i++) {
    if (data[i] === 0xFF && (data[i + 1] & 0xE0) === 0xE0) {
      frameStart = i;
      break;
    }
  }
  if (frameStart < 0 || frameStart + 4 >= data.length) return null;

  // ── Parse first frame header ──
  const b1 = data[frameStart + 1];
  const b2 = data[frameStart + 2];

  const mpegVersion = (b1 >> 3) & 3;  // 0=2.5, 1=reserved, 2=2, 3=1
  const layer = (b1 >> 1) & 3;        // 0=reserved, 1=III, 2=II, 3=I
  const bitrateIndex = (b2 >> 4) & 0xF;
  const sampleRateIndex = (b2 >> 2) & 3;
  const channelMode = (data[frameStart + 3] >> 6) & 3; // 0=stereo, 1=joint, 2=dual, 3=mono

  if (mpegVersion === 1 || layer === 0 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
    return null; // Invalid frame
  }

  const bitrateKey = `${mpegVersion}_${layer}`;
  const bitrate = (BITRATE_TABLE[bitrateKey] || BITRATE_TABLE["3_1"])[bitrateIndex];
  const sampleRate = (SAMPLE_RATE_TABLE[mpegVersion] || SAMPLE_RATE_TABLE[3])[sampleRateIndex];
  const samplesPerFrame = SAMPLES_PER_FRAME[bitrateKey] || 1152;

  if (!bitrate || !sampleRate) return null;

  // ── Check for Xing/Info VBR header ──
  // Xing header offset depends on MPEG version and channel mode
  let xingSearchOffset: number;
  if (mpegVersion === 3) {
    // MPEG1
    xingSearchOffset = frameStart + (channelMode === 3 ? 21 : 36);
  } else {
    // MPEG2/2.5
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
        // Frame count present
        const totalFrames = (data[xingSearchOffset + 8] << 24) | (data[xingSearchOffset + 9] << 16) |
                            (data[xingSearchOffset + 10] << 8) | data[xingSearchOffset + 11];
        const duration = (totalFrames * samplesPerFrame) / sampleRate;
        return Math.round(duration * 100) / 100; // Round to 0.01s precision
      }
    }
  }

  // ── Check for VBRI header ──
  const vbriOffset = frameStart + 36;
  if (vbriOffset + 26 < data.length) {
    const vbriTag = String.fromCharCode(
      data[vbriOffset], data[vbriOffset + 1], data[vbriOffset + 2], data[vbriOffset + 3]
    );
    if (vbriTag === "VBRI") {
      const totalFrames = (data[vbriOffset + 14] << 24) | (data[vbriOffset + 15] << 16) |
                          (data[vbriOffset + 16] << 8) | data[vbriOffset + 17];
      const duration = (totalFrames * samplesPerFrame) / sampleRate;
      return Math.round(duration * 100) / 100;
    }
  }

  // ── CBR fallback: count actual frames for maximum accuracy ──
  // For small files (<2MB), count all frames. For larger, estimate from first frame + file size.
  const audioDataSize = data.length - frameStart;

  if (audioDataSize < 2 * 1024 * 1024) {
    // Count actual frames for small files (Quran ayah files are typically <500KB)
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

      // Safety: don't loop forever
      if (frameCount > 100000) break;
    }

    if (frameCount > 0) {
      const duration = (frameCount * samplesPerFrame) / sampleRate;
      return Math.round(duration * 100) / 100;
    }
  }

  // Final CBR estimate from file size
  const duration = (audioDataSize * 8) / (bitrate * 1000);
  return Math.round(duration * 100) / 100;
}

// ═══════════════════════════════════════
// Server-side duration cache (in-memory)
// ═══════════════════════════════════════
const serverDurationCache = new Map<string, number>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const surahId = parseInt(searchParams.get("surah") || "1", 10);
    const ayahId = parseInt(searchParams.get("ayah") || "1", 10);
    const reciterId = searchParams.get("reciter") || "afasy";

    const cacheKey = `${reciterId}:${surahId}:${ayahId}`;
    if (serverDurationCache.has(cacheKey)) {
      return NextResponse.json(
        { duration: serverDurationCache.get(cacheKey), exact: true, source: "cache" },
        { headers: { "Cache-Control": "public, s-maxage=86400, max-age=86400" } }
      );
    }

    const reciter = RECITERS.find((r) => r.id === reciterId);
    const ayahSlug = `${pad(surahId)}${pad(ayahId)}`;
    const folder = reciter?.everyAyahFolder || "Alafasy_128kbps";
    const audioUrl = `https://everyayah.com/data/${folder}/${ayahSlug}.mp3`;

    // Download the actual MP3 file and parse its MPEG frames
    try {
      const audioRes = await fetch(audioUrl, {
        signal: AbortSignal.timeout(8000),
      });

      if (audioRes.ok) {
        const buffer = await audioRes.arrayBuffer();
        const duration = parseMp3Duration(buffer);

        if (duration && duration > 0) {
          serverDurationCache.set(cacheKey, duration);
          return NextResponse.json(
            { duration, exact: true, source: "mp3-parsed", fileSize: buffer.byteLength },
            { headers: { "Cache-Control": "public, s-maxage=86400, max-age=86400" } }
          );
        }
      }
    } catch (e) {
      console.warn(`[verse-duration] MP3 parse failed for ${cacheKey}:`, e);
    }

    // Ultimate fallback: estimation (should rarely reach here)
    const isMujawwad = reciterId.includes("mjwd") || reciterId.includes("mujawwad") || Boolean(reciter?.name?.includes("مجود"));
    const secPerWord = isMujawwad ? 3.8 : 1.75;
    const words = parseInt(searchParams.get("words") || "8", 10);
    const estimated = Math.max(isMujawwad ? 16 : 4, Math.round(words * secPerWord + (isMujawwad ? 3 : 1.5)));

    return NextResponse.json(
      { duration: estimated, exact: false, source: "fallback-estimate" },
      { headers: { "Cache-Control": "public, s-maxage=3600, max-age=3600" } }
    );
  } catch (error: any) {
    return NextResponse.json({ duration: 6, error: error.message, source: "error" }, { status: 500 });
  }
}
