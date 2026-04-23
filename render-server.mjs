import express from "express";
import cors from "cors";
import { renderMedia, getCompositions, ensureBrowser } from "@remotion/renderer";
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

// مجلد لتخزين الفيديوهات الجاهزة للتحميل
const RENDERS_DIR = path.resolve(os.tmpdir(), "renders_output");
if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });

app.use("/assets", express.static(os.tmpdir()));
app.use("/download", express.static(RENDERS_DIR));

let cachedBundleLocation = null;
const jobs = new Map(); // لتتبع حالة الطلبات

async function getBundle() {
  if (cachedBundleLocation) return cachedBundleLocation;
  const entry = path.resolve("src/remotion/Root.tsx");
  cachedBundleLocation = await bundle({ entryPoint: entry, sourceMaps: false });
  return cachedBundleLocation;
}

async function downloadFile(url, dest) {
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

app.get("/", (req, res) => {
  res.json({ status: "Turbo Server Active 🚀", activeJobs: jobs.size });
});

// 1. نقطة التحقق من حالة الطلب
app.get("/status/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "الطلب غير موجود" });
  res.json(job);
});

// 2. نقطة بدء الرندرة (ترد فوراً بـ Job ID)
app.post("/render", async (req, res) => {
  const { verses, backgroundUrl } = req.body;
  if (!verses?.length) return res.status(400).json({ error: "verses required" });

  const jobId = `job-${Date.now()}`;
  jobs.set(jobId, { status: "processing", progress: 0, url: null });

  // نرد على المستخدم فوراً
  res.json({ jobId, message: "بدأت عملية الرندرة في الخلفية..." });

  // تشغيل عملية الرندرة في الخلفية
  renderInBackground(jobId, req.body).catch(err => {
    console.error(`>> Job ${jobId} Failed:`, err);
    jobs.set(jobId, { status: "failed", error: err.message });
  });
});

async function renderInBackground(jobId, data) {
  const { verses, surahName, backgroundUrl } = data;
  const requestId = jobId.split("-")[1];
  const tempDir = path.resolve(os.tmpdir(), `render-${requestId}`);
  const finalOutputName = `quran-${requestId}.mp4`;
  const finalOutputPath = path.resolve(RENDERS_DIR, finalOutputName);

  try {
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const isVideoBg = /\.(mp4|webm|mov|m4v)/i.test(backgroundUrl);
    let localBgPath = null;
    if (isVideoBg) {
      localBgPath = path.resolve(tempDir, "bg.mp4");
      await downloadFile(backgroundUrl, localBgPath);
    }

    const audioResults = await Promise.all(verses.map(async (v) => {
      let audioPath = null;
      if (v.audio?.startsWith("http")) {
        audioPath = path.resolve(tempDir, `a-${v.id}.mp3`);
        await downloadFile(v.audio, audioPath);
      }
      return { v, audioPath, duration: audioPath ? await getAudioDuration(audioPath) : 8 };
    }));

    let cumulativeFrames = 0;
    const processedVerses = audioResults.map(({ v, audioPath, duration }) => {
      const durFrames = Math.ceil((duration + 0.3) * 30);
      const res = { ...v, audio: audioPath ? `http://localhost:7860/assets/render-${requestId}/${path.basename(audioPath)}` : "", durationInFrames: durFrames, startFrame: cumulativeFrames };
      cumulativeFrames += durFrames;
      return res;
    });

    const bundleLocation = await getBundle();
    const remotionOutputPath = path.resolve(tempDir, "out.mp4");
    const totalFrames = Math.max(150, cumulativeFrames);

    const comps = await getCompositions(bundleLocation, { inputProps: { ...data, verses: processedVerses, backgroundUrl: isVideoBg ? "" : backgroundUrl, totalFrames } });
    const composition = comps.find(c => c.id === "QuranVideo");
    composition.durationInFrames = totalFrames;

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      outputLocation: remotionOutputPath,
      inputProps: { ...data, verses: processedVerses, backgroundUrl: isVideoBg ? "" : backgroundUrl, totalFrames },
      codec: "h264",
      imageFormat: "jpeg",
      concurrency: 1, // العودة لـ 1 لتقليل الضغط على المعالج الضعيف وضمان عدم التعليق
      chromiumOptions: { args: ["--no-sandbox"] },
      onProgress: ({ progress }) => {
        jobs.set(jobId, { status: "processing", progress: Math.round(progress * 100) });
      }
    });

    if (isVideoBg && localBgPath) {
      await execAsync(`ffmpeg -stream_loop -1 -i "${localBgPath}" -i "${remotionOutputPath}" -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[bg];[bg][1:v]blend=all_mode=screen:all_opacity=1[out]" -map "[out]" -map 1:a -c:v libx264 -preset superfast -crf 23 -c:a aac -shortest "${finalOutputPath}" -y`);
    } else {
      fs.copyFileSync(remotionOutputPath, finalOutputPath);
    }

    // تحديث الحالة بنجاح
    jobs.set(jobId, { 
      status: "completed", 
      progress: 100, 
      url: `https://${process.env.SPACE_ID || "yousef891238-render-server"}.hf.space/download/${finalOutputName}` 
    });

    // تنظيف المجلد المؤقت
    setTimeout(() => {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e){}
    }, 5000);

  } catch (err) {
    jobs.set(jobId, { status: "failed", error: err.message });
    throw err;
  }
}

app.listen(7860, () => {
  console.log("🚀 Background Job Server running on 7860");
  getBundle();
});
