/**
 * 💎 HYPER RENDER v3.2 - CINEMATIC SVG ENGINE
 * =============================================
 * الجودة: سينمائية (4K Ready)
 * السرعة: فائقة جداً (Hyper Speed)
 * التقنية: Sharp + SVG Compositing
 * التوافق: 100% مع كل الأنظمة
 */

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import os from "os";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { spawn, exec } from "child_process";
import { promisify } from "util";
import crypto from "crypto";
import sharp from "sharp";

const execAsync = promisify(exec);
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const RENDERS_DIR = path.resolve(os.tmpdir(), "renders_output");
const FONT_PATH   = path.resolve(os.tmpdir(), "amiri_font.ttf");
const FPS         = 24;
const RESOLUTION  = { w: 720, h: 1280 };
const ARABIC_FONT_URL = "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf";

if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });

const jobs = new Map();

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${url}`);
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function ensureFont() {
  if (fs.existsSync(FONT_PATH)) return FONT_PATH;
  try { await downloadFile(ARABIC_FONT_URL, FONT_PATH); return FONT_PATH; }
  catch (e) { return "Arial"; }
}

async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`);
    return parseFloat(stdout.trim()) || 5;
  } catch { return 5; }
}

// دالة ذكية لتقسيم النص لخطوط SVG
function wrapToSvgLines(text, maxChars = 25) {
  if (!text) return [];
  const words = text.split(" ");
  let lines = [];
  let currentLine = "";
  for (const word of words) {
    if ((currentLine + word).length > maxChars) {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else { currentLine += word + " "; }
  }
  lines.push(currentLine.trim());
  return lines;
}

async function generateVerseLayer(verse, outputPath) {
  const vLines = wrapToSvgLines(verse.text || "", 22);
  const tLines = wrapToSvgLines(verse.translation || "", 35);
  
  // استخراج معلومات السورة والآية (لو موجودة)
  const headerText = verse.surahName ? `${verse.surahName} : ${verse.verseNumber}` : "";

  const vLineHeight = 85;
  const tLineHeight = 50;
  
  const vTSpan = vLines.map((l, i) => `<tspan x="360" dy="${i === 0 ? 0 : vLineHeight}">${l}</tspan>`).join("");
  const tTSpan = tLines.map((l, i) => `<tspan x="360" dy="${i === 0 ? 0 : tLineHeight}">${l}</tspan>`).join("");

  const svg = `
    <svg width="720" height="1280" viewBox="0 0 720 1280" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
          <feOffset dx="4" dy="4" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.8"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#BF953F;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#FCF6BA;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#AA771C;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <style>
        .v { font-family: 'Amiri', serif; font-weight: bold; font-size: 72px; fill: white; filter: url(#shadow); text-anchor: middle; direction: rtl; }
        .t { font-family: 'Amiri', serif; font-size: 40px; fill: rgba(255,255,255,0.8); filter: url(#shadow); text-anchor: middle; direction: ltr; }
        .h { font-family: 'Amiri', serif; font-size: 28px; font-weight: bold; fill: #BF953F; text-anchor: middle; }
      </style>

      <!-- طبقة تعتيم خفيفة جداً لتحسين وضوح النص -->
      <rect width="720" height="1280" fill="rgba(0,0,0,0.2)" />

      ${headerText ? `
        <!-- البادج العلوي -->
        <rect x="260" y="480" width="200" height="40" rx="20" fill="rgba(0,0,0,0.5)" stroke="url(#badgeGrad)" stroke-width="1" />
        <text x="360" y="508" class="h">${headerText}</text>
      ` : ""}

      <!-- الآية والترجمة -->
      <text x="360" y="${640 - (vLines.length * 30)}" class="v">${vTSpan}</text>
      ${verse.translation ? `<text x="360" y="${760 + (vLines.length * 15)}" class="t">${tTSpan}</text>` : ""}
    </svg>
  `;

  await sharp(Buffer.from(svg)).png().toFile(outputPath);
}

async function renderHyperFast(jobId, data) {
  const { verses, backgroundUrl } = data;
  const tempDir = path.resolve(os.tmpdir(), `work-${jobId}`);
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
  const finalOutputPath = path.resolve(RENDERS_DIR, `${jobId}.mp4`);

  try {
    jobs.set(jobId, { status: "processing", progress: 5, message: "💎 جاري معالجة الجودة الفائقة..." });
    const fontPath = await ensureFont();
    
    const audioPaths = verses.map((_, i) => path.resolve(tempDir, `a-${i}.mp3`));
    const [bgPath] = await Promise.all([
      (async () => {
        if (!backgroundUrl) return null;
        const hash = crypto.createHash("md5").update(backgroundUrl).digest("hex").slice(0, 8);
        const ext = /\.(mp4|webm|mov|m4v)/i.test(backgroundUrl) ? "mp4" : "jpg";
        const dest = path.resolve(os.tmpdir(), `bg-${hash}.${ext}`);
        if (!fs.existsSync(dest)) await downloadFile(backgroundUrl, dest);
        return dest;
      })(),
      ...verses.map((v, i) => downloadFile(v.audio, audioPaths[i]))
    ]);

    jobs.set(jobId, { status: "processing", progress: 25, message: "🎨 رسم الآيات باحترافية..." });
    const durations = await Promise.all(audioPaths.map(getAudioDuration));
    const verseImages = verses.map((_, i) => path.resolve(tempDir, `v-${i}.png`));
    await Promise.all(verses.map((v, i) => generateVerseLayer(v, verseImages[i])));

    const processedVerses = verses.map((v, i) => {
      const durFrames = Math.ceil((durations[i] + 0.05) * FPS);
      return { ...v, durationInFrames: durFrames, imagePath: verseImages[i] };
    });
    const totalDuration = processedVerses.reduce((acc, v) => acc + (v.durationInFrames / FPS), 0);

    jobs.set(jobId, { status: "processing", progress: 45, message: "🔊 معالجة الصوت..." });
    const mergedAudioPath = path.resolve(tempDir, "merged.mp3");
    const audioListPath = path.resolve(tempDir, "alist.txt");
    fs.writeFileSync(audioListPath, audioPaths.map(p => `file '${p.replace(/\\/g, "/")}'`).join("\n"));
    await execAsync(`ffmpeg -f concat -safe 0 -i "${audioListPath}" -c copy "${mergedAudioPath}" -y`);

    const frameListPath = path.resolve(tempDir, "flist.txt");
    const frameContent = processedVerses.map(v => 
      `file '${v.imagePath.replace(/\\/g, "/")}'\nduration ${(v.durationInFrames / FPS).toFixed(4)}`
    ).join("\n") + `\nfile '${processedVerses[processedVerses.length-1].imagePath.replace(/\\/g, "/")}'`;
    fs.writeFileSync(frameListPath, frameContent);

    jobs.set(jobId, { status: "processing", progress: 65, message: "🎬 تجميع الفيديو السينمائي..." });
    
    const isVideoBg = bgPath && /\.mp4$/i.test(bgPath);
    let ffmpegArgs;

    if (bgPath) {
      const bgInput = isVideoBg ? ["-stream_loop", "-1", "-t", String(totalDuration), "-i", bgPath] : ["-loop", "1", "-t", String(totalDuration), "-i", bgPath];
      const filter = `[0:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1[bg];[1:v]scale=720:1280[fg];[bg][fg]overlay=format=auto`;
      ffmpegArgs = [...bgInput, "-f", "concat", "-safe", "0", "-i", frameListPath, "-i", mergedAudioPath, "-filter_complex", filter, "-map", "2:a", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "24", "-pix_fmt", "yuv420p", "-t", String(totalDuration), "-y", finalOutputPath];
    } else {
      ffmpegArgs = ["-f", "concat", "-safe", "0", "-i", frameListPath, "-i", mergedAudioPath, "-c:v", "libx264", "-preset", "ultrafast", "-crf", "24", "-pix_fmt", "yuv420p", "-t", String(totalDuration), "-y", finalOutputPath];
    }

    const ffmpeg = spawn("ffmpeg", [...ffmpegArgs, "-progress", "pipe:2", "-nostats"]);
    ffmpeg.stderr.on("data", (chunk) => {
      const timeMatch = chunk.toString().match(/out_time_ms=(\d+)/);
      if (timeMatch) {
        const currentTime = parseInt(timeMatch[1]) / 1_000_000;
        const p = Math.min(99, Math.round(65 + (currentTime / totalDuration) * 34));
        jobs.set(jobId, { status: "processing", progress: p, message: `🎬 تصدير سينمائي: ${p}%` });
      }
    });

    await new Promise((resolve, reject) => {
      ffmpeg.on("close", (code) => code === 0 ? resolve() : reject(new Error("FFmpeg Exit")));
      ffmpeg.on("error", reject);
    });

    jobs.set(jobId, { status: "completed", progress: 100, url: `https://yousef891238-render-server.hf.space/download/${jobId}.mp4`, message: "✅ تم الرندرة بجودة سينمائية!" });
    setTimeout(() => { try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e){} }, 30000);
  } catch (err) {
    console.error(err);
    jobs.set(jobId, { status: "failed", error: err.message });
  }
}

app.use("/download", express.static(RENDERS_DIR));
app.post("/render", async (req, res) => {
  const jobId = `job-${Date.now()}`;
  res.json({ jobId });
  renderHyperFast(jobId, req.body).catch(console.error);
});
app.get("/status/:jobId", (req, res) => res.json(jobs.get(req.params.jobId) || { error: "not found" }));

app.listen(7860, async () => { 
  await ensureFont(); 
  console.log("💎 HYPER RENDER v3.2 CINEMATIC READY"); 
});
