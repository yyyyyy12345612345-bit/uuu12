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

app.use("/assets", express.static(os.tmpdir()));

let cachedBundleLocation = null;

async function getBundle() {
  if (cachedBundleLocation) return cachedBundleLocation;
  const entry = path.resolve("src/remotion/Root.tsx");
  console.log(">> Bundling project...");
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

let isRendering = false;
let renderStartTime = null;
const RENDER_TIMEOUT = 25 * 60 * 1000;

app.get("/", (req, res) => {
  if (isRendering && renderStartTime && (Date.now() - renderStartTime > RENDER_TIMEOUT)) {
      isRendering = false;
  }
  res.json({ status: "Active 🚀", busy: isRendering });
});

app.post("/render", async (req, res) => {
  const { verses, surahName, backgroundUrl } = req.body;
  
  if (!verses?.length) return res.status(400).json({ error: "verses array is required" });
  if (isRendering && (Date.now() - renderStartTime < RENDER_TIMEOUT)) {
    return res.status(429).json({ error: "Server busy" });
  }

  isRendering = true;
  renderStartTime = Date.now();
  
  const requestId = Date.now();
  const tempDir = path.resolve(os.tmpdir(), `render-${requestId}`);
  const finalOutputName = `quran-${requestId}.mp4`;
  const finalOutputPath = path.resolve(os.tmpdir(), finalOutputName);

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
    // نستخدم webm فقط في حال وجود خلفية فيديو لدمج الشفافية
    const remotionOutputPath = path.resolve(tempDir, isVideoBg ? "overlay.webm" : "final.mp4");
    
    const inputProps = { ...req.body, verses: processedVerses, backgroundUrl: isVideoBg ? "" : backgroundUrl, totalFrames: Math.max(150, cumulativeFrames) };

    const comps = await getCompositions(bundleLocation, { inputProps });
    const composition = comps.find(c => c.id === "QuranVideo");
    composition.durationInFrames = inputProps.totalFrames;

    console.log(">> Remotion Rendering...");
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      outputLocation: remotionOutputPath,
      inputProps,
      codec: isVideoBg ? "vp8" : "h264", 
      imageFormat: "png", // مطلوب للرندرة الشفافة
      pixelFormat: isVideoBg ? "yuva420p" : "yuv420p",
      concurrency: 1,
      chromiumOptions: { args: ["--no-sandbox"] },
    });

    if (isVideoBg && localBgPath) {
      console.log(">> FFmpeg Overlay (Alpha Channel Mode)...");
      await execAsync(`ffmpeg -stream_loop -1 -i "${localBgPath}" -i "${remotionOutputPath}" \
        -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[bg];[bg][1:v]overlay=shortest=1[out]" \
        -map "[out]" -map 1:a -c:v libx264 -preset superfast -crf 23 -c:a aac -shortest "${finalOutputPath}" -y`);
    } else {
      fs.renameSync(remotionOutputPath, finalOutputPath);
    }

    res.download(finalOutputPath, finalOutputName, (err) => {
      isRendering = false;
      renderStartTime = null;
      try { fs.unlinkSync(finalOutputPath); } catch(e){}
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e){}
    });

  } catch (err) {
    console.error(">> Error:", err);
    isRendering = false;
    renderStartTime = null;
    res.status(500).json({ error: err.message });
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e){}
  }
});

app.listen(7860, () => {
  console.log("🚀 Alpha-Optimized Server running on 7860");
  getBundle();
});
