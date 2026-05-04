/**
 * 🚀 FINAL STABLE SERVER — V5.0 (GAPLESS CINEMATIC)
 * ===================================================
 * الجودة: سينمائية عبر Remotion (Chromium Rendering)
 * الصوت: بدون أي تقطيع (Gapless via filter_complex)
 * النص: مطابق 100% للموقع (React Components)
 * الأداء: محسّن مع تتبع دقيق للتقدم
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
import { exec, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const RENDERS_DIR = path.resolve(os.tmpdir(), "renders_output");
if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });

app.use("/assets", express.static(os.tmpdir()));
app.use("/download", express.static(RENDERS_DIR));

let cachedBundleLocation = null;
const jobs = new Map();

// ═══════════════════════════════════════
// 📦 Bundling
// ═══════════════════════════════════════
async function getBundle() {
  if (cachedBundleLocation) return cachedBundleLocation;
  console.log("📦 >> Bundling Remotion project (Warmup)...");
  const entry = path.resolve("src/remotion/Root.tsx");
  cachedBundleLocation = await bundle({ entryPoint: entry, sourceMaps: false });
  console.log("✅ >> Bundle ready!");
  return cachedBundleLocation;
}

// ═══════════════════════════════════════
// 📥 تحميل الملفات
// ═══════════════════════════════════════
async function downloadFile(url, dest) {
  console.log(`📥 >> Downloading: ${path.basename(dest)}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${url}`);
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

// ═══════════════════════════════════════
// 🔊 مدة الصوت
// ═══════════════════════════════════════
async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`);
    return parseFloat(stdout.trim()) || 5;
  } catch { return 5; }
}

// ═══════════════════════════════════════
// 🌐 API Routes
// ═══════════════════════════════════════
app.get("/", (req, res) => {
  res.json({
    engine: "FINAL STABLE v5.0 — Remotion Cinematic (Gapless Audio)",
    status: "ready",
  });
});

app.post("/render", async (req, res) => {
  const jobId = `job-${Date.now()}`;
  console.log(`\n🚀 [${jobId}] STARTING REMOTION CINEMATIC RENDER...`);
  console.log(`   Surah: ${req.body.surahName}, Verses: ${req.body.verses?.length}, Font: ${req.body.fontFamily}/${req.body.fontSize}px`);
  jobs.set(jobId, { status: "processing", progress: 0, message: "جاري التحضير..." });
  res.json({ jobId });
  renderFinalStable(jobId, req.body).catch(err => {
    console.error(`❌ [${jobId}] FATAL ERROR:`, err);
    jobs.set(jobId, { status: "failed", error: err.message });
  });
});

app.get("/status/:jobId", (req, res) => {
  res.json(jobs.get(req.params.jobId) || { error: "not found" });
});

// ═══════════════════════════════════════
// 🎬 محرك الرندرة — v5.0
// ═══════════════════════════════════════
async function renderFinalStable(jobId, data) {
  const { verses, backgroundUrl } = data;
  const requestId = jobId.split("-")[1];
  const tempDir = path.resolve(os.tmpdir(), `work-${requestId}`);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const finalOutputName = `${jobId}.mp4`;
  const finalOutputPath = path.resolve(RENDERS_DIR, finalOutputName);

  try {
    jobs.set(jobId, { status: "processing", progress: 5, message: "📥 تحميل الملفات الصوتية والخلفية..." });

    // 1. تحميل الخلفية
    const isVideoBg = /\.(mp4|webm|mov|m4v)/i.test(backgroundUrl || "");
    const bgPath = path.resolve(tempDir, isVideoBg ? "bg.mp4" : "bg.jpg");
    if (backgroundUrl) await downloadFile(backgroundUrl, bgPath);

    // 2. تحميل الصوتيات بالتوازي
    console.log(`🎵 [${jobId}] Downloading ${verses.length} audio files...`);
    const audioPaths = [];
    const audioResults = await Promise.all(verses.map(async (v, i) => {
      const aPath = path.resolve(tempDir, `audio-${i}.mp3`);
      await downloadFile(v.audio, aPath);
      audioPaths.push(aPath);
      return { v, aPath, duration: await getAudioDuration(aPath) };
    }));

    jobs.set(jobId, { status: "processing", progress: 20, message: "🔊 دمج الصوت بدون تقطيع..." });

    // ═══════════════════════════════════════
    // 3. 🔊 دمج الصوت بـ filter_complex — بدون أي فجوات
    // ═══════════════════════════════════════
    const mergedAudioPath = path.resolve(tempDir, "merged-gapless.aac");
    
    const audioInputs = audioPaths.map((p, i) => `-i "${p.replace(/\\/g, "/")}"`).join(" ");
    const filterParts = audioPaths.map((_, i) => 
      `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`
    ).join(";");
    const concatInputs = audioPaths.map((_, i) => `[a${i}]`).join("");
    const concatFilter = `${filterParts};${concatInputs}concat=n=${audioPaths.length}:v=0:a=1[aout]`;
    
    await execAsync(
      `ffmpeg ${audioInputs} -filter_complex "${concatFilter}" -map "[aout]" -c:a aac -b:a 192k -ar 44100 "${mergedAudioPath}" -y`,
      { maxBuffer: 50 * 1024 * 1024 }
    );

    // حساب مدة الصوت المدمج النهائية
    const mergedDuration = await getAudioDuration(mergedAudioPath);
    console.log(`🔊 [${jobId}] Merged audio duration: ${mergedDuration.toFixed(2)}s`);

    jobs.set(jobId, { status: "processing", progress: 30, message: "⚙️ تجهيز الإطارات..." });

    // 4. حساب الإطارات لكل آية
    const FPS = 30;
    let cumulativeFrames = 0;
    const processedVerses = audioResults.map(({ v, aPath, duration }) => {
      // إضافة 1 frame إضافي لضمان تغطية كاملة بدون فجوات
      const durFrames = Math.ceil(duration * FPS) + 1;
      const res = {
        ...v,
        audio: `http://localhost:7860/assets/work-${requestId}/${path.basename(aPath)}`,
        durationInFrames: durFrames,
        startFrame: cumulativeFrames
      };
      cumulativeFrames += durFrames;
      return res;
    });

    // ضمان أن إجمالي الإطارات يغطي مدة الصوت المدمج تماماً
    const totalFrames = Math.max(Math.ceil(mergedDuration * FPS), cumulativeFrames);

    jobs.set(jobId, { status: "processing", progress: 35, message: "📦 تجهيز Bundle..." });

    // 5. Remotion Rendering
    const bundleLocation = await getBundle();
    const comps = await getCompositions(bundleLocation, {
      inputProps: {
        ...data,
        verses: processedVerses,
        backgroundUrl: "", // سنضيف الخلفية في FFmpeg لاحقاً
        totalFrames
      }
    });
    const composition = comps.find(c => c.id === "QuranVideo");

    // إعدادات الفيديو
    composition.width = 720;
    composition.height = 1280;
    composition.fps = FPS;
    composition.durationInFrames = totalFrames;

    const overlayVideoPath = path.resolve(tempDir, "overlay-remotion.mp4");

    console.log(`🖥️ [${jobId}] Remotion rendering at ${FPS}fps, ${totalFrames} frames (~${(totalFrames/FPS).toFixed(1)}s)...`);
    jobs.set(jobId, { status: "processing", progress: 40, message: "🎬 رندرة الفيديو عبر Chromium..." });

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      outputLocation: overlayVideoPath,
      inputProps: {
        ...data,
        verses: processedVerses,
        backgroundUrl: "", // الخلفية في FFmpeg
        totalFrames
      },
      codec: "h264",
      concurrency: 1,
      chromiumOptions: {
        args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
      },
      onProgress: ({ progress }) => {
        const pct = Math.round(40 + progress * 40); // 40% → 80%
        if (pct % 10 === 0) console.log(`⏳ [${jobId}] Remotion progress: ${pct}%`);
        jobs.set(jobId, { status: "processing", progress: pct, message: `🎬 رندرة: ${pct}%` });
      }
    });

    console.log(`🛠️ [${jobId}] FFmpeg final merge — background + gapless audio...`);
    jobs.set(jobId, { status: "merging", progress: 85, message: "🛠️ دمج الخلفية والصوت النهائي..." });

    // ═══════════════════════════════════════
    // 6. 🛠️ الدمج النهائي — الخلفية + الفيديو + الصوت المدمج
    // ═══════════════════════════════════════
    // استخدام الصوت المدمج (gapless) بدلاً من صوت Remotion
    const bgInputArg = isVideoBg
      ? `-stream_loop -1 -i "${bgPath}"`
      : `-loop 1 -i "${bgPath}"`;

    // blend + overlay لدمج النص فوق الخلفية مع الحفاظ على الشفافية
    const filterComplex = [
      `[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1[bg]`,
      `[1:v]scale=720:1280[txt]`,
      `[bg][txt]blend=all_mode=screen:all_opacity=1,format=yuv420p[out]`
    ].join(";");

    const ffmpegMergeCmd = `ffmpeg ${bgInputArg} -i "${overlayVideoPath}" -i "${mergedAudioPath}" -filter_complex "${filterComplex}" -map "[out]" -map 2:a -c:v libx264 -preset medium -crf 20 -c:a copy -shortest -movflags +faststart "${finalOutputPath}" -y`;

    await execAsync(ffmpegMergeCmd, { maxBuffer: 100 * 1024 * 1024 });

    // ✅ نجاح
    const host = "yousef891238-render-server.hf.space";
    jobs.set(jobId, {
      status: "completed",
      progress: 100,
      url: `https://${host}/download/${finalOutputName}`,
      message: "✅ تم تصدير الفيديو بجودة سينمائية بدون تقطيع!"
    });
    console.log(`✨ [${jobId}] COMPLETED SUCCESSFULLY!`);

    // تنظيف بعد 60 ثانية
    setTimeout(() => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e) {}
    }, 60000);

  } catch (err) {
    console.error(`❌ [${jobId}] ERROR:`, err);
    jobs.set(jobId, { status: "failed", error: err.message });
    setTimeout(() => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e) {}
    }, 5000);
  }
}

// ═══════════════════════════════════════
// 🚀 Start
// ═══════════════════════════════════════
app.listen(7860, () => {
  console.log("🚀 FINAL STABLE v5.0 — Remotion Cinematic (Gapless Audio) — READY ON :7860");
  getBundle(); // Pre-warm
});
