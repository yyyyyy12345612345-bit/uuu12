import express from "express";
import cors from "cors";
import { renderMedia, getCompositions } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";
import path from "path";
import fs from "fs";
import os from "os";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { execSync } from "child_process";

const app = express();
app.use(cors());
app.use(express.json());

// تقديم الملفات المؤقتة محلياً لمتصفح الرندر عن طريق سيرفر Express 
app.use("/assets", express.static(os.tmpdir()));

// ─── Helpers ────────────────────────────────────────────────
async function downloadFile(url, dest) {
  console.log(`  ↓ Downloading: ${url.substring(0, 80)}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

function getAudioDuration(filePath) {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: "utf-8", timeout: 10000 }
    ).trim();
    const dur = parseFloat(result);
    if (!dur || isNaN(dur)) throw new Error("Invalid audio");
    return dur;
  } catch {
    throw new Error("ffprobe failed - likely invalid media format");
  }
}

// ─── Routes ────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({ status: "Quran Render Space is Active! 🚀" });
});

app.post("/render", async (req, res) => {
  const data = req.body;
  const { surahName, verses, backgroundUrl, textColor, fontSize, fontWeight } = data;
  const outputName = `quran-video-${Date.now()}.mp4`;

  // HuggingFace Spaces saves files locally
  const baseDir = os.tmpdir();
  const folderName = `temp-${Date.now()}`;
  const tempDir = path.resolve(baseDir, folderName);
  const outputLocation = path.resolve(baseDir, outputName);

  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const filesToCleanup = [];

  try {
    // 1. Download Background
    let localBgFileName = backgroundUrl;
    if (backgroundUrl && (backgroundUrl.startsWith("http") || backgroundUrl.startsWith("//"))) {
      const bgExt = backgroundUrl.match(/\.(mp4|webm|mov|jpg|jpeg|png|gif)/i)?.[1] || "mp4";
      const bgFile = `bg-${Date.now()}.${bgExt}`;
      const bgPath = path.resolve(tempDir, bgFile);
      await downloadFile(backgroundUrl, bgPath);
      // التمرير عبر السيرفر الداخلي
      localBgFileName = `http://localhost:7860/assets/${folderName}/${bgFile}`; 
      filesToCleanup.push(bgPath);
      console.log(">> Background downloaded ✓");
    }

    // 2. Download Audios
    const processedVerses = [];
    let cumulativeFrames = 0;
    const fps = 30;

    for (const verse of verses) {
      let audioFileName = verse.audio;
      let verseDurationSeconds = 8;
      
      if (verse.audio && verse.audio.startsWith("http")) {
        const audioFile = `audio-${verse.id}-${Date.now()}.mp3`;
        const audioPath = path.resolve(tempDir, audioFile);
        try {
          await downloadFile(verse.audio, audioPath);
          const dur = getAudioDuration(audioPath);
          audioFileName = `http://localhost:7860/assets/${folderName}/${audioFile}`;
          verseDurationSeconds = Math.max(dur + 0.5, 3);
        } catch (e) {
          console.warn(`  ⚠ Audio error for verse ${verse.id}: ${e.message}`);
          audioFileName = ""; // No audio if broken
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
    console.log(`>> Total Duration: ${totalFrames/fps}s (${totalFrames} frames)`);

    // 3. Bundle our react code
    const entry = path.resolve("src/remotion/Root.tsx");
    console.log(">> Bundling project...");
    const bundleLocation = await bundle({ entryPoint: entry, sourceMaps: false });

    const inputProps = { surahName, verses: processedVerses, backgroundUrl: localBgFileName, textColor, fontSize, fontWeight, totalFrames };

    console.log(">> Locating Composition...");
    const comps = await getCompositions(bundleLocation, { inputProps }); 
    const composition = comps.find((c) => c.id === "QuranVideo");
    if (!composition) throw new Error("QuranVideo composition not found!");

    composition.durationInFrames = totalFrames;
    composition.fps = fps;

    // 4. Render
    console.log(">> Rendering video...");
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      outputLocation,
      codec: "h264",
      inputProps,
      crf: 23,
      chromiumOptions: {
        disableWebSecurity: true,
      },
      onProgress: ({ progress }) => {
        if (Math.round(progress * 100) % 5 === 0) {
          process.stdout.write(`\r>> Progress: ${Math.round(progress * 100)}%`);
        }
      },
    });

    console.log("\n>> ✅ Render Complete!");

    // Send the video back to the client!
    res.download(outputLocation, outputName, () => {
       // Callback runs after the browser finishes downloading the stream
       try { if (fs.existsSync(outputLocation)) fs.unlinkSync(outputLocation); } catch(e){}
    });

  } catch (err) {
    console.error("\nRender Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    console.log(">> Cleaning up temp files...");
    for (const f of filesToCleanup) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }
    try { fs.rmdirSync(tempDir); } catch {}
  }
});

app.listen(7860, () => {
  console.log("🚀 HuggingFace Render Server running on port 7860");
});
