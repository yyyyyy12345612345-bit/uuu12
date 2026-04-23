import express from "express";
import cors from "cors";
import { renderStill, getCompositions } from "@remotion/renderer";
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

app.post("/render", async (req, res) => {
  const jobId = `job-${Date.now()}`;
  jobs.set(jobId, { status: "processing", progress: 0, message: "بدء المحرك النووي..." });
  res.json({ jobId });
  renderNuclear(jobId, req.body).catch(err => {
    console.error(err);
    jobs.set(jobId, { status: "failed", error: err.message });
  });
});

app.get("/status/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  res.json(job || { error: "not found" });
});

async function renderNuclear(jobId, data) {
  const { verses, backgroundUrl } = data;
  const tempDir = path.resolve(os.tmpdir(), jobId);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  try {
    const bundleLocation = await getBundle();
    const isVideoBg = /\.(mp4|webm|mov|m4v)/i.test(backgroundUrl);
    const bgPath = path.resolve(tempDir, isVideoBg ? "bg.mp4" : "bg.jpg");
    await downloadFile(backgroundUrl, bgPath);

    // 1. رندرة صورة واحدة لكل آية (سرعة فائقة)
    const verseImages = [];
    let currentTime = 0;
    
    for (let i = 0; i < verses.length; i++) {
      const v = verses[i];
      const audioPath = path.resolve(tempDir, `a-${i}.mp3`);
      await downloadFile(v.audio, audioPath);
      const duration = await getAudioDuration(audioPath);
      
      const imgPath = path.resolve(tempDir, `v-${i}.png`);
      const inputProps = { ...data, verses: [v], backgroundUrl: "", totalFrames: 100 };
      const comps = await getCompositions(bundleLocation, { inputProps });
      const composition = comps.find(c => c.id === "QuranVideo");

      await renderStill({
        composition,
        serveUrl: bundleLocation,
        outputLocation: imgPath,
        inputProps,
        frame: 50, // نأخذ فريم من المنتصف حيث النص ظاهر تماماً
      });

      verseImages.push({ imgPath, audioPath, duration, start: currentTime });
      currentTime += duration;
      jobs.set(jobId, { status: "processing", progress: Math.round(((i+1)/verses.length)*80), message: `تجهيز الآية ${i+1}...` });
    }

    // 2. تجميع الكل باستخدام FFmpeg السحري
    jobs.set(jobId, { status: "processing", progress: 90, message: "الدمج النووي النهائي..." });
    const finalPath = path.resolve(RENDERS_DIR, `${jobId}.mp4`);
    
    // بناء فلاتر FFmpeg للدمج والتحريك
    let filterComplex = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[bg];`;
    let audioFilter = "";
    
    verseImages.forEach((v, i) => {
      filterComplex += `[${i+1}:v]scale=1080:1920,format=rgba,fade=in:st=${v.start}:d=0.5:alpha=1,fade=out:st=${v.start+v.duration-0.5}:d=0.5:alpha=1[v${i}];`;
      audioFilter += `[${i+verses.length+1}:a]atrim=0:${v.duration},adelay=${Math.round(v.start*1000)}|${Math.round(v.start*1000)}[a${i}];`;
    });
    
    const overlays = verseImages.map((_, i) => `[v${i}]`).join("");
    filterComplex += `[bg]${overlays}overlay=format=auto[outv];`;
    const audioMix = verseImages.map((_, i) => `[a${i}]`).join("");
    audioFilter += `${audioMix}amix=inputs=${verseImages.length}:dropout_transition=0[outa]`;

    const inputs = verseImages.map(v => `-i "${v.imgPath}"`).join(" ");
    const audios = verseImages.map(v => `-i "${v.audioPath}"`).join(" ");
    
    const bgInput = isVideoBg ? `-stream_loop -1 -i "${bgPath}"` : `-loop 1 -i "${bgPath}"`;
    
    await execAsync(`ffmpeg ${bgInput} ${inputs} ${audios} -filter_complex "${filterComplex}${audioFilter}" -map "[outv]" -map "[outa]" -c:v libx264 -preset ultrafast -t ${currentTime} -pix_fmt yuv420p "${finalPath}" -y`);

    const host = "yousef891238-render-server.hf.space";
    jobs.set(jobId, { status: "completed", progress: 100, url: `https://${host}/download/${jobId}.mp4` });

  } catch (err) {
    jobs.set(jobId, { status: "failed", error: err.message });
  }
}

app.listen(7860, () => console.log("🚀 NUCLEAR SERVER ACTIVE"));
