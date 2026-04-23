/**
 * 🚀 FINAL STABLE OBSERVER SERVER - V4 (FINAL SOLUTION)
 * ---------------------------------------------------
 * تم تحديث هذا الكود ليكون الحل النهائي والأكثر استقراراً وسرعة.
 * هذا الكود يلغي تماماً نظام الصور المفقودة ويستخدم الرندرة المباشرة الذكية.
 */

import express from "express";
import cors from "cors";
import { renderMedia, getCompositions } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";
import path from "path";
import fs from "fs";
import os from "os";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

const RENDERS_DIR = path.resolve(os.tmpdir(), "renders_output");
if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });

app.use("/assets", express.static(os.tmpdir()));
app.use("/download", express.static(RENDERS_DIR));

let cachedBundleLocation = null;
const jobs = new Map();

async function getBundle() {
  if (cachedBundleLocation) return cachedBundleLocation;
  console.log("📦 >> Bundling project (Warmup)...");
  const entry = path.resolve("src/remotion/Root.tsx");
  cachedBundleLocation = await bundle({ entryPoint: entry, sourceMaps: false });
  console.log("✅ >> Bundle ready!");
  return cachedBundleLocation;
}

async function downloadFile(url, dest) {
  console.log(`📥 >> Downloading: ${path.basename(dest)}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${url}`);
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`);
    return parseFloat(stdout.trim()) || 8;
  } catch { return 8; }
}

app.post("/render", async (req, res) => {
  const jobId = `job-${Date.now()}`;
  console.log(`\n🚀 [${jobId}] STARTING FINAL STABLE RENDER...`);
  jobs.set(jobId, { status: "processing", progress: 0, message: "جاري التحضير النهائي..." });
  res.json({ jobId });
  renderFinalStable(jobId, req.body).catch(err => {
    console.error(`❌ [${jobId}] FATAL ERROR:`, err);
    jobs.set(jobId, { status: "failed", error: err.message });
  });
});

app.get("/status/:jobId", (req, res) => {
  res.json(jobs.get(req.params.jobId) || { error: "not found" });
});

async function renderFinalStable(jobId, data) {
  const { verses, backgroundUrl } = data;
  const requestId = jobId.split("-")[1];
  const tempDir = path.resolve(os.tmpdir(), `work-${requestId}`);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const finalOutputName = `${jobId}.mp4`;
  const finalOutputPath = path.resolve(RENDERS_DIR, finalOutputName);

  try {
    const isVideoBg = /\.(mp4|webm|mov|m4v)/i.test(backgroundUrl);
    const bgPath = path.resolve(tempDir, isVideoBg ? "bg.mp4" : "bg.jpg");
    if (backgroundUrl) await downloadFile(backgroundUrl, bgPath);

    console.log(`🎵 [${jobId}] Downloading audios...`);
    const audioResults = await Promise.all(verses.map(async (v, i) => {
      const aPath = path.resolve(tempDir, `a-${i}.mp3`);
      await downloadFile(v.audio, aPath);
      return { v, aPath, duration: await getAudioDuration(aPath) };
    }));

    const FPS = 20;
    let cumulativeFrames = 0;
    const processedVerses = audioResults.map(({ v, aPath, duration }) => {
      const durFrames = Math.ceil((duration + 0.05) * FPS);
      const res = { ...v, audio: `http://localhost:7860/assets/work-${requestId}/${path.basename(aPath)}`, durationInFrames: durFrames, startFrame: cumulativeFrames };
      cumulativeFrames += durFrames;
      return res;
    });

    const totalFrames = Math.max(FPS * 5, cumulativeFrames);
    const bundleLocation = await getBundle();
    const comps = await getCompositions(bundleLocation, { inputProps: { ...data, verses: processedVerses, backgroundUrl: "", totalFrames } });
    const composition = comps.find(c => c.id === "QuranVideo");
    
    // إعدادات السرعة الاستراتيجية
    composition.width = 720;
    composition.height = 1280;
    composition.fps = FPS;
    composition.durationInFrames = totalFrames;

    const overlayVideoPath = path.resolve(tempDir, "overlay.mp4");

    console.log(`🖥️ [${jobId}] Browser Rendering at ${FPS}fps...`);
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      outputLocation: overlayVideoPath,
      inputProps: { ...data, verses: processedVerses, backgroundUrl: "", totalFrames },
      codec: "h264",
      concurrency: 1,
      chromiumOptions: { args: ["--no-sandbox", "--disable-dev-shm-usage"] },
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100);
        if (pct % 20 === 0) console.log(`⏳ [${jobId}] Progress: ${pct}%`);
        jobs.set(jobId, { status: "processing", progress: pct, message: "جاري المعالجة الذكية..." });
      }
    });

    console.log(`🛠️ [${jobId}] Final FFmpeg Merge & Upscale to 1080p...`);
    jobs.set(jobId, { status: "merging", progress: 100, message: "جاري دمج الخلفية..." });

    const filter = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[bg];[1:v]scale=1080:1920[txt];[bg][txt]blend=all_mode=screen:all_opacity=1,format=yuv420p[out]`;
    const bgInput = isVideoBg ? `-stream_loop -1 -i "${bgPath}"` : `-loop 1 -i "${bgPath}"`;
    
    await execAsync(`ffmpeg ${bgInput} -i "${overlayVideoPath}" -filter_complex "${filter}" -map "[out]" -map 1:a -c:v libx264 -preset ultrafast -crf 23 -c:a aac -shortest "${finalOutputPath}" -y`);
    
    const host = "yousef891238-render-server.hf.space";
    jobs.set(jobId, { status: "completed", progress: 100, url: `https://${host}/download/${finalOutputName}`, message: "تم بنجاح!" });
    console.log(`✨ [${jobId}] COMPLETED!`);

    setTimeout(() => { try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e){} }, 30000);

  } catch (err) {
    console.error(`❌ [${jobId}] ERROR:`, err);
    jobs.set(jobId, { status: "failed", error: err.message });
  }
}

app.listen(7860, () => {
  console.log("🚀 FINAL STABLE OBSERVER ACTIVE");
  getBundle();
});
