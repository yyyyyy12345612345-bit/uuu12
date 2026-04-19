import express from "express";
import cors from "cors";
import { renderMedia, getCompositions, ensureBrowser } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";
import path from "path";
import fs from "fs";
import os from "os";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { execSync } from "child_process";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// تقديم الملفات المؤقتة محلياً لمتصفح الرندر عن طريق سيرفر Express 
app.use("/assets", express.static(os.tmpdir()));

// ─── تخزين الـ Bundle مرة واحدة (أهم تحسين للسرعة) ────────
let cachedBundleLocation = null;

async function getBundle() {
  if (cachedBundleLocation) {
    console.log(">> Using cached bundle ✓ (سريع)");
    return cachedBundleLocation;
  }
  const entry = path.resolve("src/remotion/Root.tsx");
  console.log(">> Bundling project for the first time...");
  cachedBundleLocation = await bundle({ entryPoint: entry, sourceMaps: false });
  console.log(">> Bundle cached ✓");
  return cachedBundleLocation;
}

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

// ─── حماية من الطلبات المزدوجة ────────────────────────────
let isRendering = false;

// ─── Routes ────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({ 
    status: "Quran Render Space is Active! 🚀",
    busy: isRendering,
    bundleReady: !!cachedBundleLocation
  });
});

app.post("/render", async (req, res) => {
  // حماية من الطلبات المزدوجة التي تجمّد السيرفر
  if (isRendering) {
    return res.status(429).json({ 
      error: "السيرفر مشغول حالياً بعملية رندرة أخرى. انتظر قليلاً ثم حاول مجدداً." 
    });
  }

  isRendering = true;
  const startTime = Date.now();

  const data = req.body;
  const { surahName, verses, backgroundUrl, textColor, fontSize, fontWeight } = data;
  const outputName = `quran-video-${Date.now()}.mp4`;

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
      localBgFileName = `http://localhost:7860/assets/${folderName}/${bgFile}`; 
      filesToCleanup.push(bgPath);
      console.log(">> Background downloaded ✓");
    }

    // 2. Download Audios (تحميل متوازي لتسريع العملية)
    const processedVerses = [];
    let cumulativeFrames = 0;
    const fps = 30;

    const audioPromises = verses.map(async (verse) => {
      let audioFileName = verse.audio;
      let verseDurationSeconds = 8;
      
      if (verse.audio && verse.audio.startsWith("http")) {
        const audioFile = `audio-${verse.id}-${Date.now()}-${Math.random().toString(36).slice(2,6)}.mp3`;
        const audioPath = path.resolve(tempDir, audioFile);
        try {
          await downloadFile(verse.audio, audioPath);
          const dur = getAudioDuration(audioPath);
          audioFileName = `http://localhost:7860/assets/${folderName}/${audioFile}`;
          verseDurationSeconds = Math.max(dur + 0.5, 3);
        } catch (e) {
          console.warn(`  ⚠ Audio error for verse ${verse.id}: ${e.message}`);
          audioFileName = "";
        }
      }
      return { verse, audioFileName, verseDurationSeconds };
    });

    const audioResults = await Promise.all(audioPromises);

    for (const { verse, audioFileName, verseDurationSeconds } of audioResults) {
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

    // 3. استخدام الـ Bundle المحفوظ (بدل إعادة البناء كل مرة)
    const bundleLocation = await getBundle();

    const inputProps = { surahName, verses: processedVerses, backgroundUrl: localBgFileName, textColor, fontSize, fontWeight, totalFrames };

    console.log(">> Locating Composition...");
    const comps = await getCompositions(bundleLocation, { inputProps }); 
    const composition = comps.find((c) => c.id === "QuranVideo");
    if (!composition) throw new Error("QuranVideo composition not found!");

    composition.durationInFrames = totalFrames;
    composition.fps = fps;

    // 4. Render (مع تحسينات الأداء)
    console.log(">> Rendering video...");
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      outputLocation,
      codec: "h264",
      inputProps,
      crf: 28,          // جودة أخف = سرعة أعلى (مع الحفاظ على جودة ممتازة للموبايل)
      concurrency: 2,   // استغلال الـ 2 Cores بالكامل
      chromiumOptions: {
        disableWebSecurity: true,
      },
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100);
        if (pct % 10 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          process.stdout.write(`\r>> Progress: ${pct}% (${elapsed}s elapsed)`);
        }
      },
    });

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n>> ✅ Render Complete! (${totalTime}s total)`);

    // Send the video back to the client!
    res.download(outputLocation, outputName, () => {
       try { if (fs.existsSync(outputLocation)) fs.unlinkSync(outputLocation); } catch(e){}
    });

  } catch (err) {
    console.error("\nRender Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    isRendering = false;
    console.log(">> Cleaning up temp files...");
    for (const f of filesToCleanup) { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} }
    try { fs.rmdirSync(tempDir); } catch {}
  }
});

// ─── تجهيز الـ Bundle والمتصفح مسبقاً عند بدء التشغيل ─────
async function warmup() {
  console.log(">> ⏳ Warming up (تحضير مسبق)...");
  try {
    await getBundle();
    await ensureBrowser();
    console.log(">> 🔥 Server is warmed up and ready!");
  } catch (e) {
    console.warn(">> Warmup partial fail (will retry on first request):", e.message);
  }
}

app.listen(7860, () => {
  console.log("🚀 HuggingFace Render Server running on port 7860");
  warmup();
});
