import { renderMedia, getCompositions } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";
import path from "path";
import fs from "fs";
import os from "os";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { execSync } from "child_process";

// ─── Helpers ────────────────────────────────────────────────
async function downloadFile(url, dest) {
  console.log(`  ↓ Downloading: ${url.substring(0, 80)}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

function getAudioDuration(filePath) {
  // Use ffprobe to get exact duration of an audio file
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: "utf-8", timeout: 10000 }
    ).trim();
    return parseFloat(result) || 8; // fallback 8 seconds per verse
  } catch {
    return 8; // fallback if ffprobe not available
  }
}

// ─── Main Render Logic ──────────────────────────────────────
async function start() {
  const configPath = process.argv[2];
  if (!configPath) throw new Error("No config path provided");

  const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const { surahName, verses, backgroundUrl, textColor, fontSize, outputName } = data;

  const publicDir = path.resolve("public");
  const tempDir = path.resolve(publicDir, "temp-render");
  const outputLocation = path.resolve("public/renders", outputName);

  // Ensure directories exist
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  if (!fs.existsSync(path.dirname(outputLocation)))
    fs.mkdirSync(path.dirname(outputLocation), { recursive: true });

  const filesToCleanup = [];

  try {
    // ── Step 1: Download background locally ──
    let localBgFileName = backgroundUrl;
    if (backgroundUrl && (backgroundUrl.startsWith("http") || backgroundUrl.startsWith("//"))) {
      const bgExt = backgroundUrl.match(/\.(mp4|webm|mov|jpg|jpeg|png|gif)/i)?.[1] || "mp4";
      const bgFile = `bg-${Date.now()}.${bgExt}`;
      const bgPath = path.resolve(tempDir, bgFile);
      await downloadFile(backgroundUrl, bgPath);
      localBgFileName = `temp-render/${bgFile}`; // relative to public/
      filesToCleanup.push(bgPath);
      console.log(">> Background downloaded ✓");
    }

    // ── Step 2: Download ALL audio files locally ──
    const processedVerses = [];
    let cumulativeFrames = 0;
    const fps = 30;

    for (const verse of verses) {
      let audioFileName = verse.audio;
      let verseDurationSeconds = 8; // default
      
      if (verse.audio && verse.audio.startsWith("http")) {
        const audioFile = `audio-${verse.id}-${Date.now()}.mp3`;
        const audioPath = path.resolve(tempDir, audioFile);
        
        try {
          await downloadFile(verse.audio, audioPath);
          audioFileName = `temp-render/${audioFile}`;
          filesToCleanup.push(audioPath);
          
          const dur = getAudioDuration(audioPath);
          verseDurationSeconds = dur + 0.5; // add small padding
        } catch (e) {
          console.warn(`  ⚠ Could not download/probe audio for verse ${verse.id}: ${e.message}`);
        }
      }

      const durationInFrames = Math.ceil(verseDurationSeconds * fps);
      processedVerses.push({
        ...verse,
        audio: audioFileName,
        durationInFrames,
        startFrame: cumulativeFrames,
      });
      cumulativeFrames += durationInFrames;
    }

    const totalFrames = Math.max(150, cumulativeFrames);
    const totalDurationSeconds = totalFrames / fps;

    console.log(`>> Total Duration: ${totalDurationSeconds.toFixed(1)}s (${totalFrames} frames)`);
    console.log(`>> All ${processedVerses.length} audio files processed ✓`);

    // ── Step 3: Bundle the project ──
    const entry = path.resolve("src/remotion/Root.tsx");
    console.log(">> Bundling project...");
    const bundleLocation = await bundle({
      entryPoint: entry,
      sourceMaps: false,
    });

    // ── Step 4: Get compositions with staticDir ──
    const inputProps = {
      surahName,
      verses: processedVerses,
      backgroundUrl: localBgFileName,
      textColor,
      fontSize,
      totalFrames, // Pass global total
    };

    console.log(">> Locating Composition...");
    const comps = await getCompositions(bundleLocation, {
      inputProps,
      staticDir: publicDir,
    });

    const composition = comps.find((c) => c.id === "QuranVideo");
    if (!composition) throw new Error("QuranVideo composition not found!");

    // Override the duration with our calculated one
    composition.durationInFrames = totalFrames;
    composition.fps = fps;

    // ── Step 5: Render the video ──
    console.log(">> Rendering video...");
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      outputLocation,
      codec: "h264",
      concurrency: Math.max(1, Math.floor(os.cpus().length / 2)),
      staticDir: publicDir,
      inputProps,
      crf: 23,
      onProgress: ({ progress }) => {
        if (Math.round(progress * 100) % 5 === 0) {
          process.stdout.write(`\r>> Progress: ${Math.round(progress * 100)}%`);
        }
      },
    });


    console.log("\n>> ✅ Render Complete! Output:", outputLocation);
  } finally {
    // ── Cleanup all temp files ──
    console.log(">> Cleaning up temp files...");
    for (const f of filesToCleanup) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {}
    }
    // Try to remove the temp directory if empty
    try {
      const remaining = fs.readdirSync(tempDir);
      if (remaining.length === 0) fs.rmdirSync(tempDir);
    } catch {}
  }
}

start().catch((err) => {
  console.error("❌ ENGINE ERROR:", err);
  process.exit(1);
});
