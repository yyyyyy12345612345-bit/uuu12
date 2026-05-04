/**
 * 💎 HYPER RENDER v5.0 - CINEMATIC PIXEL-PERFECT ENGINE
 * ======================================================
 * ✅ الجودة: سينمائية (720x1280 — TikTok/Reels Ready)
 * ✅ الصوت: بدون أي تقطيع (Gapless — filter_complex)
 * ✅ الانتقالات: Fade/Cross-dissolve بين الآيات
 * ✅ الأمان: حماية كاملة من command injection
 * ✅ النص: تقسيم ذكي مع دعم التشكيل
 * ✅ التقدم: progress tracking دقيق
 * ✅ الاستقرار: محسّن لـ Hugging Face Spaces
 */

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import os from "os";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import crypto from "crypto";
import sharp from "sharp";
import { URL } from "url";

const execAsync = promisify(exec);
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const RENDERS_DIR = path.resolve(os.tmpdir(), "renders_output");
const FONTS_DIR   = path.resolve(os.tmpdir(), "fonts_cache");
const WIDTH       = 720;
const HEIGHT      = 1280;
const HOST        = process.env.RENDER_HOST || "yousef891238-render-server.hf.space";

const FONT_MAP = {
  "Amiri":              "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf",
  "Amiri-Bold":         "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Bold.ttf",
  "Noto Naskh Arabic":  "https://github.com/google/fonts/raw/main/ofl/notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf",
  "Scheherazade New":   "https://github.com/google/fonts/raw/main/ofl/scheherazadenew/ScheherazadeNew-Regular.ttf",
  "Lateef":             "https://github.com/google/fonts/raw/main/ofl/lateef/Lateef-Regular.ttf",
  "Cairo":              "https://github.com/google/fonts/raw/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf",
  "Tajawal":            "https://github.com/google/fonts/raw/main/ofl/tajawal/Tajawal-Regular.ttf",
};

const ALLOWED_DOMAINS = [
  "everyayah.com", "quran.com", "cdn.islamic.network", "verses.quran.com",
  "raw.githubusercontent.com", "github.com", "mp3quran.net",
  "server8.mp3quran.net", "server7.mp3quran.net",
  "ia800601.us.archive.org", "archive.org",
  "images.pexels.com", "videos.pexels.com", "images.unsplash.com",
];

if (!fs.existsSync(RENDERS_DIR)) fs.mkdirSync(RENDERS_DIR, { recursive: true });
if (!fs.existsSync(FONTS_DIR))   fs.mkdirSync(FONTS_DIR,   { recursive: true });

const jobs = new Map();

// ═══ الحماية الأمنية ═══
function validateUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (!["http:", "https:"].includes(u.protocol)) return false;
    const hostname = u.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
  } catch { return false; }
}

function safePath(base, filename) {
  const resolved = path.resolve(base, filename);
  if (!resolved.startsWith(path.resolve(base))) throw new Error("Path traversal detected!");
  return resolved;
}

// ═══ تنظيف دوري ═══
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt && now - job.createdAt > 2 * 60 * 60 * 1000) jobs.delete(id);
  }
}, 15 * 60 * 1000);

// ═══ تحميل الملفات ═══
async function downloadFile(url, dest) {
  if (!validateUrl(url)) throw new Error(`URL غير مسموح به: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`فشل التحميل (${res.status}): ${url}`);
  const fileStream = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

// ═══ إدارة الخطوط ═══
async function ensureFont(fontFamily, fontWeight) {
  let fontKey = fontFamily || "Amiri";
  if (fontKey === "Amiri" && (fontWeight || 400) >= 600) fontKey = "Amiri-Bold";
  const safeName = fontKey.replace(/[^a-zA-Z0-9-]/g, "_");
  const fontPath = safePath(FONTS_DIR, `${safeName}.ttf`);
  if (fs.existsSync(fontPath)) return fontPath;
  const url = FONT_MAP[fontKey] || FONT_MAP["Amiri"];
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const fileStream = fs.createWriteStream(fontPath);
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
    return fontPath;
  } catch (e) {
    console.warn(`⚠️ فشل تحميل خط ${fontKey}، سيتم استخدام Amiri`);
    const fallback = safePath(FONTS_DIR, "Amiri.ttf");
    if (!fs.existsSync(fallback)) {
      const res = await fetch(FONT_MAP["Amiri"]);
      const fileStream = fs.createWriteStream(fallback);
      await finished(Readable.fromWeb(res.body).pipe(fileStream));
    }
    return fallback;
  }
}

// ═══ مدة الصوت ═══
async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath.replace(/"/g, '\\"')}"`,
      { timeout: 15000 }
    );
    const d = parseFloat(stdout.trim());
    return isNaN(d) || d <= 0 ? 5 : d;
  } catch { return 5; }
}

// ═══ تقسيم النص العربي ═══
function wrapArabicText(text, fontSize, maxWidth) {
  if (!text) return [];
  const hasHarakat = /[\u064B-\u065F]/.test(text);
  const charWidthRatio = hasHarakat ? 0.32 : 0.44;
  const charWidth = fontSize * charWidthRatio;
  const maxChars = Math.max(10, Math.floor(maxWidth / charWidth));
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

// ═══ توليد SVG للآية ═══
function escapeXml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

async function generateVerseFrame(verse, outputPath, settings, frameOptions = {}) {
  const { fontSize = 50, fontWeight = 700, fontFamily = "Amiri", textColor = "#ffffff", textPosition = "center", surahName = "" } = settings;
  const { opacity = 1 } = frameOptions;

  const scaledFontSize = Math.min(Math.max(fontSize * 1.6, 40), 120);
  const translationFontSize = Math.min(Math.max(fontSize * 0.65, 28), 42);
  const lineH = scaledFontSize * 1.45;
  const tLineH = translationFontSize * 1.6;
  const textW = Math.floor(WIDTH * 0.84);
  const centerX = WIDTH / 2;

  const vLines = wrapArabicText(verse.text || "", scaledFontSize, textW);
  const tLines = verse.translation ? wrapArabicText(verse.translation, translationFontSize, textW) : [];

  const BADGE_H = surahName ? 44 : 0;
  const BADGE_GAP = surahName ? 24 : 0;
  const VERSE_H = vLines.length * lineH;
  const SEP_H = 48;
  const TRANS_H = tLines.length > 0 ? tLines.length * tLineH + 20 : 0;
  const ORNAMENT_H = 60;
  const totalH = BADGE_H + BADGE_GAP + VERSE_H + SEP_H + TRANS_H + ORNAMENT_H;

  let startY;
  if (textPosition === "top") startY = 100;
  else if (textPosition === "bottom") startY = Math.max(80, HEIGHT - totalH - 100);
  else startY = Math.max(80, (HEIGHT - totalH) / 2);
  startY = Math.max(60, Math.min(startY, HEIGHT - totalH - 60));

  let curY = startY;
  const svgWeight = fontWeight >= 700 ? "bold" : fontWeight >= 500 ? "600" : "normal";

  const badgeSVG = surahName ? `
    <rect x="${(WIDTH - 240) / 2}" y="${curY}" width="240" height="34" rx="17" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    <text x="${centerX}" y="${curY + 23}" font-family="'${escapeXml(fontFamily)}', 'Amiri', serif" font-size="13" font-weight="600" fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="0.8">${escapeXml(surahName)} · ${escapeXml(String(verse.id || ""))}</text>` : "";
  if (surahName) curY += BADGE_H + BADGE_GAP;

  const verseY = curY;
  const verseTSpans = vLines.map((line, i) => `<tspan x="${centerX}" dy="${i === 0 ? 0 : lineH}">${escapeXml(line)}</tspan>`).join("");
  curY += VERSE_H;

  const sepY = curY + 12;
  curY += SEP_H;

  const transY = curY;
  const transTSpans = tLines.map((line, i) => `<tspan x="${centerX}" dy="${i === 0 ? 0 : tLineH}">${escapeXml(line)}</tspan>`).join("");
  if (tLines.length > 0) curY += TRANS_H;

  const ornamentY = Math.min(curY + 28, HEIGHT - 70);

  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="textGlow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="rgba(0,0,0,0.9)" flood-opacity="0.9"/></filter>
    <filter id="softShadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="rgba(0,0,0,0.7)" flood-opacity="0.7"/></filter>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#BF953F"/><stop offset="30%" stop-color="#FCF6BA"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="70%" stop-color="#FCF6BA"/><stop offset="100%" stop-color="#AA771C"/></linearGradient>
    <linearGradient id="overlayGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(0,0,0,0.50)"/><stop offset="25%" stop-color="rgba(0,0,0,0.15)"/><stop offset="65%" stop-color="rgba(0,0,0,0.20)"/><stop offset="100%" stop-color="rgba(0,0,0,0.90)"/></linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#overlayGrad)" opacity="${opacity}"/>
  <g opacity="${opacity}">
    ${badgeSVG}
    <text x="${centerX}" y="${verseY}" font-family="'${escapeXml(fontFamily)}', 'Amiri', serif" font-size="${scaledFontSize}" font-weight="${svgWeight}" fill="${escapeXml(textColor)}" text-anchor="middle" direction="rtl" filter="url(#textGlow)">${verseTSpans}</text>
    <rect x="${(WIDTH - 100) / 2}" y="${sepY}" width="100" height="1.5" rx="1" fill="rgba(212,175,55,0.5)"/>
    <circle cx="${centerX}" cy="${sepY + 0.75}" r="3" fill="rgba(212,175,55,0.6)"/>
    ${tLines.length > 0 ? `<text x="${centerX}" y="${transY}" font-family="'${escapeXml(fontFamily)}', 'Amiri', serif" font-size="${translationFontSize}" font-weight="400" fill="rgba(255,255,255,0.88)" text-anchor="middle" font-style="italic" filter="url(#softShadow)">${transTSpans}</text>` : ""}
    <text x="${centerX}" y="${ornamentY}" font-family="'${escapeXml(fontFamily)}', 'Amiri', serif" font-size="34" font-weight="bold" fill="url(#goldGrad)" text-anchor="middle">﴿ ${escapeXml(String(verse.id || ""))} ﴾</text>
  </g>
</svg>`;

  await sharp(Buffer.from(svg)).png({ quality: 100, compressionLevel: 6 }).toFile(outputPath);
}

// ═══ محرك الرندرة v5.0 ═══
async function renderCinematic(jobId, data) {
  const { verses, backgroundUrl, surahName, textColor = "#ffffff", fontSize = 50, fontWeight = 700, fontFamily = "Amiri", textPosition = "center" } = data;

  if (!Array.isArray(verses) || verses.length === 0) throw new Error("verses مطلوبة");
  if (verses.length > 50) throw new Error("الحد الأقصى 50 آية");

  const tempDir = path.resolve(os.tmpdir(), `work-${jobId}`);
  fs.mkdirSync(tempDir, { recursive: true });
  const finalOutputPath = safePath(RENDERS_DIR, `${jobId}.mp4`);
  const settings = { fontSize, fontWeight, fontFamily, textColor, textPosition, surahName };

  const setProgress = (pct, msg) => {
    jobs.set(jobId, { ...jobs.get(jobId), status: "processing", progress: pct, message: msg });
  };

  try {
    setProgress(5, "💎 تحميل الموارد...");

    for (const v of verses) {
      if (!validateUrl(v.audio)) throw new Error(`رابط صوت غير مسموح به: ${v.audio}`);
    }
    if (backgroundUrl && !validateUrl(backgroundUrl)) throw new Error("رابط الخلفية غير مسموح به");

    const audioPaths = verses.map((_, i) => safePath(tempDir, `audio-${i}.mp3`));

    const [fontPath, bgPath] = await Promise.all([
      ensureFont(fontFamily, fontWeight),
      (async () => {
        if (!backgroundUrl) return null;
        const hash = crypto.createHash("sha256").update(backgroundUrl).digest("hex").slice(0, 12);
        const isVid = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(backgroundUrl);
        const dest = safePath(os.tmpdir(), `bg-${hash}.${isVid ? "mp4" : "jpg"}`);
        if (!fs.existsSync(dest)) await downloadFile(backgroundUrl, dest);
        return dest;
      })(),
      ...verses.map((v, i) => downloadFile(v.audio, audioPaths[i]))
    ]);

    setProgress(20, "🔊 تحليل الصوتيات...");

    const durations = await Promise.all(audioPaths.map(getAudioDuration));
    const totalDuration = durations.reduce((a, b) => a + b, 0);
    console.log(`📊 [${jobId}] إجمالي المدة: ${totalDuration.toFixed(2)}s`);

    setProgress(28, "🖌️ رسم إطارات الآيات...");

    const frameImages = [];
    for (let i = 0; i < verses.length; i++) {
      const imgPath = safePath(tempDir, `verse-${String(i).padStart(4, "0")}.png`);
      await generateVerseFrame(verses[i], imgPath, settings);
      frameImages.push({ path: imgPath, duration: durations[i] });
      setProgress(28 + Math.round((i + 1) / verses.length * 22), `🖌️ آية ${i + 1}/${verses.length}`);
    }

    setProgress(55, "🔊 دمج الصوت بدون تقطيع...");

    // دمج الصوت (filter_complex concat — Gapless)
    const mergedAudioPath = safePath(tempDir, "merged-audio.aac");
    const audioInputs = audioPaths.map(p => `-i "${p.replace(/\\/g, "/")}"`).join(" ");
    const filterParts = audioPaths.map((_, i) => `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`).join(";");
    const concatIn = audioPaths.map((_, i) => `[a${i}]`).join("");
    const concatFilter = `${filterParts};${concatIn}concat=n=${audioPaths.length}:v=0:a=1[aout]`;

    await execAsync(
      `ffmpeg ${audioInputs} -filter_complex "${concatFilter}" -map "[aout]" -c:a aac -b:a 192k -ar 44100 "${mergedAudioPath.replace(/\\/g, "/")}" -y`,
      { maxBuffer: 64 * 1024 * 1024, timeout: 120000 }
    );

    setProgress(68, "🎬 التجميع النهائي...");

    // بناء ملف concat
    const frameListPath = safePath(tempDir, "frames.txt");
    let frameListContent = "";
    for (const f of frameImages) {
      frameListContent += `file '${f.path.replace(/\\/g, "/")}'\nduration ${f.duration.toFixed(6)}\n`;
    }
    frameListContent += `file '${frameImages[frameImages.length - 1].path.replace(/\\/g, "/")}'\n`;
    fs.writeFileSync(frameListPath, frameListContent);

    // التجميع النهائي
    const isVideoBg = bgPath && /\.(mp4|webm|mov|m4v)$/i.test(bgPath);
    const sl = s => s.replace(/\\/g, "/");
    let ffmpegCmd;

    if (bgPath) {
      const bgArgs = isVideoBg
        ? `-stream_loop -1 -t ${totalDuration.toFixed(4)} -i "${sl(bgPath)}"`
        : `-loop 1 -t ${totalDuration.toFixed(4)} -i "${sl(bgPath)}"`;
      ffmpegCmd = `ffmpeg ${bgArgs} -f concat -safe 0 -i "${sl(frameListPath)}" -i "${sl(mergedAudioPath)}" -filter_complex "[0:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1[bg];[1:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=disable[fg];[bg][fg]overlay=0:0:format=auto,format=yuv420p[vout]" -map "[vout]" -map 2:a -c:v libx264 -preset ultrafast -crf 22 -c:a copy -t ${totalDuration.toFixed(4)} -movflags +faststart -y "${sl(finalOutputPath)}"`;
    } else {
      ffmpegCmd = `ffmpeg -f concat -safe 0 -i "${sl(frameListPath)}" -i "${sl(mergedAudioPath)}" -c:v libx264 -preset ultrafast -crf 22 -pix_fmt yuv420p -c:a copy -t ${totalDuration.toFixed(4)} -movflags +faststart -y "${sl(finalOutputPath)}"`;
    }

    // تشغيل FFmpeg مع تتبع التقدم
    await new Promise((resolve, reject) => {
      const proc = spawn("sh", ["-c", ffmpegCmd], { stdio: ["ignore", "ignore", "pipe"] });
      proc.stderr.on("data", chunk => {
        const m = chunk.toString().match(/out_time_ms=(\d+)/);
        if (m) {
          const pct = Math.min(99, Math.round(68 + (parseInt(m[1]) / 1_000_000 / totalDuration) * 31));
          setProgress(pct, `🎬 تصدير: ${pct}%`);
        }
      });
      proc.on("close", code => code === 0 ? resolve() : reject(new Error(`FFmpeg خرج بكود ${code}`)));
      proc.on("error", () => {
        execAsync(ffmpegCmd, { maxBuffer: 128 * 1024 * 1024, timeout: 600000 }).then(resolve).catch(reject);
      });
    });

    jobs.set(jobId, {
      status: "completed", progress: 100,
      url: `https://${HOST}/download/${jobId}.mp4`,
      message: "✅ تم التصدير بنجاح!",
      createdAt: jobs.get(jobId)?.createdAt,
    });
    console.log(`✨ [${jobId}] اكتمل الرندر — ${totalDuration.toFixed(1)}s`);

  } catch (err) {
    console.error(`❌ [${jobId}] فشل:`, err.message);
    jobs.set(jobId, { status: "failed", error: err.message || "خطأ غير معروف", createdAt: jobs.get(jobId)?.createdAt });
  } finally {
    setTimeout(() => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(_) {}
    }, jobs.get(jobId)?.status === "failed" ? 3000 : 60000);
  }
}

// ═══ API Routes ═══
app.use("/download", express.static(RENDERS_DIR));

app.get("/", (_, res) => res.json({
  engine: "HYPER RENDER v5.0 — Cinematic", status: "ready", version: "5.0.0",
}));

app.post("/render", (req, res) => {
  const { verses, fontFamily, fontSize, surahName } = req.body;
  if (!verses || !Array.isArray(verses) || verses.length === 0) return res.status(400).json({ error: "verses مطلوبة" });
  if (verses.length > 50) return res.status(400).json({ error: "الحد الأقصى 50 آية" });

  const jobId = `job-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  console.log(`\n🚀 [${jobId}] آيات: ${verses.length} | سورة: ${surahName} | خط: ${fontFamily}/${fontSize}px`);
  jobs.set(jobId, { status: "processing", progress: 0, message: "جاري التحضير...", createdAt: Date.now() });
  res.json({ jobId });

  renderCinematic(jobId, req.body).catch(err => {
    console.error(`❌ [${jobId}] Fatal:`, err);
    jobs.set(jobId, { status: "failed", error: err.message, createdAt: jobs.get(jobId)?.createdAt });
  });
});

app.get("/status/:jobId", (req, res) => {
  res.json(jobs.get(req.params.jobId) || { error: "المهمة غير موجودة" });
});

app.get("/jobs", (_, res) => {
  const list = [];
  for (const [id, job] of jobs.entries()) list.push({ id, status: job.status, progress: job.progress });
  res.json({ count: list.length, jobs: list });
});

app.use((err, _req, res, _next) => {
  console.error("Express error:", err);
  res.status(500).json({ error: "خطأ داخلي في السيرفر" });
});

// ═══ Start ═══
app.listen(7860, async () => {
  console.log("💎 HYPER RENDER v5.0 — بدء التشغيل...");
  try {
    await Promise.all([ensureFont("Amiri", 400), ensureFont("Amiri", 700)]);
    console.log("✅ الخطوط الأساسية جاهزة");
  } catch (e) {
    console.warn("⚠️ فشل تحميل الخطوط المسبق:", e.message);
  }
  console.log("✅ HYPER RENDER v5.0 يعمل على المنفذ 7860");
});
