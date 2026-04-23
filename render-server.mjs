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

const RENDERS_DIR = path.resolve(os.tmpdir(), "renders_output");
if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });

app.use("/assets", express.static(os.tmpdir()));
app.use("/download", express.static(RENDERS_DIR));

let cachedBundleLocation = null;
const jobs = new Map();

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

// تنظيف الملفات القديمة (أكبر من ساعة) لتوفير المساحة
function cleanupOldRenders() {
  const now = Date.now();
  fs.readdirSync(RENDERS_DIR).forEach(file => {
    const filePath = path.join(RENDERS_DIR, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > 60 * 60 * 1000) {
      try { fs.unlinkSync(filePath); } catch(e){}
    }
  });
}

app.get("/", (req, res) => {
  cleanupOldRenders();
  res.json({ status: "Smart Turbo Server Active 🚀", activeJobs: jobs.size });
});

app.get("/status/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "الطلب غير موجود" });
  res.json(job);
});

app.post("/render", async (req, res) => {
  const { verses } = req.body;
  if (!verses?.length) return res.status(400).json({ error: "verses required" });

  const jobId = `job-${Date.now()}`;
  jobs.set(jobId, { status: "processing", progress: 0, message: "بدأت الرندرة..." });

  res.json({ jobId });
  renderInBackground(jobId, req.body).catch(err => {
    console.error(`>> Job ${jobId} Failed:`, err);
    jobs.set(jobId, { status: "failed", error: err.message });
  });
});

async function renderInBackground(jobId, data) {
  const { verses, backgroundUrl } = data;
  const requestId = jobId.split("-")[1];
  const tempDir = path.resolve(os.tmpdir(), `render-${requestId}`);
  const finalOutputName = `quran-${requestId}.mp4`;
  const finalOutputPath = path.resolve(RENDERS_DIR, finalOutputName);

  try {
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const isVideoBg = /\.(mp4|webm|mov|m4v)/i.test(backgroundUrl);
    const localBgPath = path.resolve(tempDir, isVideoBg ? "bg.mp4" : "bg.jpg");
    if (backgroundUrl) await downloadFile(backgroundUrl, localBgPath);

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
      // تقليل الفاصل الزمني ليكون الصوت متصلاً وانسيابياً
      const durFrames = Math.ceil((duration + 0.05) * 30);
      const res = { ...v, audio: audioPath ? `http://localhost:7860/assets/render-${requestId}/${path.basename(audioPath)}` : "", durationInFrames: durFrames, startFrame: cumulativeFrames };
      cumulativeFrames += durFrames;
      return res;
    });

    const totalFrames = Math.max(150, cumulativeFrames);
    const bundleLocation = await getBundle();
    const remotionOutputPath = path.resolve(tempDir, "overlay.mp4");

    // رندرة النصوص (بدون خلفية)
    await renderMedia({
      composition: (await getCompositions(bundleLocation, { inputProps: { ...data, verses: processedVerses, backgroundUrl: "", totalFrames } })).find(c => c.id === "QuranVideo"),
      serveUrl: bundleLocation,
      outputLocation: remotionOutputPath,
      inputProps: { ...data, verses: processedVerses, backgroundUrl: "", totalFrames },
      codec: "h264",
      imageFormat: "jpeg",
      pixelFormat: "yuv420p",
      concurrency: 1,
      chromiumOptions: { args: ["--no-sandbox"] },
      onProgress: ({ progress }) => {
        const current = jobs.get(jobId);
        jobs.set(jobId, { ...current, progress: Math.round(progress * 100), message: "جاري رندرة النصوص..." });
      }
    });

    // تحديث الحالة للدمج
    jobs.set(jobId, { status: "merging", progress: 100, message: "جاري دمج الفيديو النهائي (لحظات من فضلك)..." });

    if (isVideoBg) {
      await execAsync(`ffmpeg -stream_loop -1 -i "${localBgPath}" -i "${remotionOutputPath}" -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[bg];[bg][1:v]blend=all_mode=screen:all_opacity=1[out]" -map "[out]" -map 1:a -c:v libx264 -preset superfast -crf 23 -pix_fmt yuv420p -c:a aac -shortest "${finalOutputPath}" -y`);
    } else {
      await execAsync(`ffmpeg -loop 1 -i "${localBgPath}" -i "${remotionOutputPath}" -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[bg];[bg][1:v]blend=all_mode=screen:all_opacity=1[out]" -map "[out]" -map 1:a -c:v libx264 -preset superfast -crf 23 -pix_fmt yuv420p -c:a aac -shortest "${finalOutputPath}" -y`);
    }

    const host = "yousef891238-render-server.hf.space";
    const finalUrl = `https://${host}/download/${finalOutputName}`;
    
    jobs.set(jobId, { status: "completed", progress: 100, url: finalUrl, message: "تم التصدير بنجاح!" });

    setTimeout(() => { try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e){} }, 10000);

  } catch (err) {
    console.error("Render Error:", err);
    jobs.set(jobId, { status: "failed", error: err.message });
  }
}

app.listen(7860, () => {
  console.log("🚀 Smart Turbo Server running on 7860");
  getBundle();
});
