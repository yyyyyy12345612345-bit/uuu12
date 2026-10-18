import fs from "fs";
import path from "path";
import { ffmpeg, threadArgs } from "./ffmpeg.js";
import { RENDER_PHASES, RenderError } from "./errors.js";

const sl = (s) => s.replace(/\\/g, "/");

/**
 * دمج ملفات الصوت في ملف AAC واحد (مشترك بين الرندرة العادية ووضع "خلفية فقط").
 * فلتر الصوت (antiCopyright) محفوظ كما هو من v23 بدون أي تعديل.
 */
export async function mergeAudio({ audioPaths, workDir, outPath, totalSeconds, antiCopyright }) {
  const concatAudioFile = path.resolve(workDir, "concat_audio.txt");
  fs.writeFileSync(concatAudioFile, audioPaths.map(p => `file '${sl(p)}'`).join("\n"));

  // 🛡️ فلتر الصوت — محفوظ كما هو من v23 بدون أي تعديل
  const audioFilterChain = antiCopyright
    ? `aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo,asetrate=44629,atempo=0.988142,aresample=44100,equalizer=f=120:t=q:w=1.5:g=1.4,equalizer=f=3200:t=q:w=1.2:g=1.2,aecho=0.88:0.88:32|48:0.14|0.08,alimiter=limit=0.96`
    : `aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo`;

  const audioTimeout = Math.max(300000, Math.ceil(totalSeconds * 500));
  try {
    await ffmpeg(
      ["-f", "concat", "-safe", "0", "-i", sl(concatAudioFile), "-af", audioFilterChain, ...threadArgs(),
       "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-y", sl(outPath)],
      { timeout: audioTimeout, maxBuffer: 50 * 1024 * 1024 }
    );
  } catch (audioMergeErr) {
    throw new RenderError(
      RENDER_PHASES.AUDIO_MERGE,
      "فشل دمج وتجهيز مسارات الصوتيات عبر FFmpeg",
      {
        audioCount: audioPaths.length,
        stderr: (audioMergeErr.stderr || audioMergeErr.message || "").substring(0, 600),
        exitCode: audioMergeErr.code,
      },
      audioMergeErr
    );
  }
}
