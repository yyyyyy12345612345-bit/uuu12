import express from "express";
import cors from "cors";
import { renderStill, getCompositions, ensureBrowser } from "@remotion/renderer";
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

app.use("/assets", express.static(os.tmpdir()));

// ─── تخزين الـ Bundle مرة واحدة ────────
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

  const filesToCleanup = [tempDir];

  try {
    // 1. تحميل الخلفية
    let localBgPath = null;
    const isVideo = /\.(mp4|webm|mov)/i.test(backgroundUrl);

    if (backgroundUrl && (backgroundUrl.startsWith("http") || backgroundUrl.startsWith("//"))) {
      const bgExt = backgroundUrl.match(/\.(mp4|webm|mov|jpg|jpeg|png|gif)/i)?.[1] || "mp4";
      const bgFile = `bg.${bgExt}`;
      localBgPath = path.resolve(tempDir, bgFile);
      await downloadFile(backgroundUrl, localBgPath);
      console.log(">> Background downloaded ✓");
    }

    // 2. تحميل الصوتيات بالتوازي
    const verseData = [];

    const audioPromises = verses.map(async (verse) => {
      let audioPath = null;
      let duration = 8;
      
      if (verse.audio && verse.audio.startsWith("http")) {
        const audioFile = `audio-${verse.id}.mp3`;
        audioPath = path.resolve(tempDir, audioFile);
        try {
          await downloadFile(verse.audio, audioPath);
          duration = getAudioDuration(audioPath);
          duration = Math.max(duration + 0.3, 3);
        } catch (e) {
          console.warn(`  ⚠ Audio error for verse ${verse.id}: ${e.message}`);
          audioPath = null;
        }
      }
      return { verse, audioPath, duration };
    });

    const audioResults = await Promise.all(audioPromises);
    for (const r of audioResults) verseData.push(r);

    const totalDuration = verseData.reduce((a, b) => a + b.duration, 0);
    console.log(`>> Total Duration: ${totalDuration.toFixed(1)}s (${verseData.length} verses)`);

    // 3. تصوير صورة واحدة لكل آية باستخدام Remotion (سريع جداً)
    const bundleLocation = await getBundle();
    const fps = 24;
    let cumulativeFrames = 0;

    const processedVerses = verseData.map(({ verse, audioPath, duration }) => {
      const durationInFrames = Math.ceil(duration * fps);
      const result = {
        ...verse,
        audio: audioPath ? `http://localhost:7860/assets/${folderName}/audio-${verse.id}.mp3` : "",
        durationInFrames,
        startFrame: cumulativeFrames,
      };
      cumulativeFrames += durationInFrames;
      return result;
    });

    const totalFrames = Math.max(150, cumulativeFrames);
    const localBgUrl = localBgPath ? `http://localhost:7860/assets/${folderName}/${path.basename(localBgPath)}` : backgroundUrl;
    const inputProps = { surahName, verses: processedVerses, backgroundUrl: localBgUrl, textColor, fontSize, fontWeight, totalFrames };

    console.log(">> Locating Composition...");
    const comps = await getCompositions(bundleLocation, { inputProps });
    const composition = comps.find((c) => c.id === "QuranVideo");
    if (!composition) throw new Error("QuranVideo composition not found!");
    composition.durationInFrames = totalFrames;
    composition.fps = fps;

    // 4. تصوير صورة واحدة لكل آية (بدل آلاف الفريمات!)
    console.log(">> 📸 Capturing verse stills (سريع جداً)...");
    const segments = [];

    for (let i = 0; i < verseData.length; i++) {
      const { verse, audioPath, duration } = verseData[i];
      const pv = processedVerses[i];
      const stillPath = path.resolve(tempDir, `still-${i}.png`);
      const segmentPath = path.resolve(tempDir, `segment-${i}.mp4`);

      // تصوير فريم واحد فقط من منتصف الآية
      const targetFrame = pv.startFrame + Math.floor(pv.durationInFrames / 2);
      
      await renderStill({
        composition,
        serveUrl: bundleLocation,
        output: stillPath,
        inputProps,
        frame: Math.min(targetFrame, totalFrames - 1),
        scale: 0.6666666667, // ضمان دقة 720x1280 بالضبط
        chromiumOptions: { disableWebSecurity: true },
      });

      console.log(`  ✓ Verse ${verse.id} still captured`);

      // 5. تجميع الصورة + الصوت في مقطع فيديو باستخدام FFmpeg (سريع جداً)
      // أضفنا فلتر scale لضمان أن الأبعاد أرقام زوجية (يقبلها كودك x264)
      if (audioPath) {
        execSync(
          `ffmpeg -y -loop 1 -i "${stillPath}" -i "${audioPath}" ` +
          `-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ` +
          `-c:v libx264 -preset ultrafast -crf 28 -pix_fmt yuv420p ` +
          `-c:a aac -b:a 128k ` +
          `-t ${duration.toFixed(2)} -shortest "${segmentPath}"`,
          { timeout: 60000 }
        );
      } else {
        // بدون صوت - 5 ثواني صامتة
        execSync(
          `ffmpeg -y -loop 1 -i "${stillPath}" ` +
          `-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ` +
          `-c:v libx264 -preset ultrafast -crf 28 -pix_fmt yuv420p ` +
          `-t 5 "${segmentPath}"`,
          { timeout: 60000 }
        );
      }

      segments.push(segmentPath);
      const pct = Math.round(((i + 1) / verseData.length) * 80);
      console.log(`  >> Progress: ${pct}%`);
    }

    // 6. دمج كل المقاطع في فيديو واحد
    console.log(">> 🔗 Merging segments...");
    const concatFile = path.resolve(tempDir, "concat.txt");
    const concatContent = segments.map(s => `file '${s}'`).join("\n");
    fs.writeFileSync(concatFile, concatContent);

    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${concatFile}" -c copy "${outputLocation}"`,
      { timeout: 120000 }
    );

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n>> ✅ Render Complete! (${totalTime}s total)`);

    res.download(outputLocation, outputName, () => {
       try { if (fs.existsSync(outputLocation)) fs.unlinkSync(outputLocation); } catch(e){}
    });

  } catch (err) {
    console.error("\nRender Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    isRendering = false;
    console.log(">> Cleaning up temp files...");
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
  }
});

// ─── Warmup ─────
async function warmup() {
  console.log(">> ⏳ Warming up...");
  try {
    await getBundle();
    await ensureBrowser();
    console.log(">> 🔥 Server is warmed up and ready!");
  } catch (e) {
    console.warn(">> Warmup partial fail:", e.message);
  }
}

app.listen(7860, () => {
  console.log("🚀 HuggingFace Render Server running on port 7860");
  warmup();
});
