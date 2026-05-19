/**
 * ⚡ HYPER RENDER v10.0 — THE ULTIMATE SPEED DEMON
 * ==================================================
 * ✅ Sharp Composite: الدمج في الذاكرة (أسرع 100 مرة)
 * ✅ Fast Portrait Crop: قص الخلفية تلقائياً لتناسب الموبايل
 * ✅ Video & Image Support: دعم كامل للفيديوهات والصور كخلفية
 * ✅ Custom Fonts & Overlays: دعم كامل لجميع الخطوط والتأثيرات البصرية
 * ✅ Watermarks & Social Handles: دعم الحسابات المخصصة والعلامة المائية
 * ✅ Concat Engine: تجميع الفيديو في ثوانٍ معدودة بدون استهلاك معالج
 * ✅ Zero Chromium Memory Leak: لا يحتاج لمتصفح كروم نهائياً
 */

import express  from "express";
import cors     from "cors";
import path     from "path";
import fs       from "fs";
import os       from "os";
import { Readable }      from "stream";
import { finished }      from "stream/promises";
import { exec, spawn }   from "child_process";
import { promisify }     from "util";
import crypto   from "crypto";
import sharp    from "sharp";
import { URL }  from "url";

const execAsync = promisify(exec);
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const RENDERS_DIR = path.resolve(os.tmpdir(), "renders_output");
const FONTS_DIR   = path.resolve(os.tmpdir(), "fonts_cache");
const WIDTH = 720, HEIGHT = 1280;
const HOST = process.env.RENDER_HOST || "yousef891238-render-server.hf.space";

[RENDERS_DIR, FONTS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

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
  "server8.mp3quran.net", "server7.mp3quran.net", "server6.mp3quran.net",
  "server10.mp3quran.net", "server11.mp3quran.net", "server12.mp3quran.net",
  "ia800601.us.archive.org", "archive.org",
  "images.pexels.com", "videos.pexels.com", "images.unsplash.com",
  "pexels.com", "pixabay.com", "cdn.pixabay.com",
  "player.vimeo.com", "vimeo.com",
];

const jobs = new Map();
const durationCache = new Map();

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

// تنظيف دوري للملفات القديمة
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt && now - job.createdAt > 2 * 60 * 60 * 1000) jobs.delete(id);
  }
}, 15 * 60 * 1000);

async function downloadFile(url, dest) {
  if (!validateUrl(url)) throw new Error(`URL غير مسموح به أمنياً: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
  const ws = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(ws));
}

async function getDuration(filePath) {
  if (durationCache.has(filePath)) return durationCache.get(filePath);
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath.replace(/"/g, '\\"')}"`,
      { timeout: 15000 }
    );
    const d = parseFloat(stdout.trim());
    const finalDur = isNaN(d) || d <= 0 ? 5 : d;
    durationCache.set(filePath, finalDur);
    return finalDur;
  } catch { return 5; }
}

// تقسيم النصوص العربية — نسبة عرض أوسع لمنع التداخل
function wrapText(text, fontSize, maxWidth) {
  if (!text) return [];
  // النص العربي المشكّل: كل حرف يأخذ مساحة أكبر بسبب التشكيل
  const hasHarakat = /[\u064B-\u065F]/.test(text);
  const ratio = hasHarakat ? 0.55 : 0.50;
  const charWidth = fontSize * ratio;
  const maxChars = Math.max(8, Math.floor(maxWidth / charWidth));
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

function escapeXml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// ═══ إدارة الخطوط ═══
async function ensureFont(fontFamily) {
  const fontKey = fontFamily || "Amiri";
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

// رسم إطارات الآيات (SVG)
async function generateVerseFrame(verse, outputPath, settings, bgPath, isVideoBg = false) {
  const { fontSize = 50, fontWeight = 700, fontFamily = "Amiri", textColor = "#ffffff", textPosition = "center", surahName = "", userPlan = "free", instaHandle = "", tiktokHandle = "" } = settings;

  const scaledFontSize = Math.min(Math.max(fontSize * 1.6, 40), 110);
  const translationFontSize = Math.min(Math.max(fontSize * 0.65, 28), 40);
  // ارتفاع سطر كبير جداً لمنع تداخل التشكيل مع السطر التالي
  const lineH = scaledFontSize * 2.5;
  const tLineH = translationFontSize * 2.0;
  const textW = Math.floor(WIDTH * 0.82);
  const centerX = WIDTH / 2;

  const vLines = wrapText(verse.text || "", scaledFontSize, textW);
  const tLines = verse.translation ? wrapText(verse.translation, translationFontSize, textW) : [];

  const BADGE_H = surahName ? 44 : 0;
  const BADGE_GAP = surahName ? 24 : 0;
  const VERSE_H = vLines.length * lineH;
  const SEP_H = 48;
  const TRANS_H = tLines.length > 0 ? tLines.length * tLineH + 20 : 0;
  const ORNAMENT_H = 60;
  const totalH = BADGE_H + BADGE_GAP + VERSE_H + SEP_H + TRANS_H + ORNAMENT_H;

  let startY;
  if (textPosition === "top") startY = 100;
  else if (textPosition === "bottom") startY = Math.max(80, HEIGHT - totalH - 120);
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

  const ornamentY = Math.min(curY + 28, HEIGHT - 180);

  // العلامة المائية للمستخدم المجاني
  let watermarkSVG = "";
  if (userPlan === "free") {
    watermarkSVG = `<g opacity="0.06" font-family="Arial" font-size="22" font-weight="bold" fill="white" text-anchor="center">`;
    for (let y = 150; y < HEIGHT; y += 300) {
      for (let x = 100; x < WIDTH; x += 300) {
        watermarkSVG += `<text x="${x}" y="${y}" transform="rotate(-30 ${x} ${y})">QURAN PREMIUM</text>`;
      }
    }
    watermarkSVG += `</g>`;
  }

  // حسابات شبكات التواصل
  let socialSVG = "";
  if (instaHandle || tiktokHandle) {
    let yPos = HEIGHT - 60;
    if (instaHandle) {
      socialSVG += `<text x="${centerX}" y="${yPos}" font-family="Arial" font-size="20" font-weight="bold" fill="rgba(255,255,255,0.8)" text-anchor="middle">Insta: @${escapeXml(instaHandle)}</text>`;
      yPos -= 30;
    }
    if (tiktokHandle) {
      socialSVG += `<text x="${centerX}" y="${yPos}" font-family="Arial" font-size="20" font-weight="bold" fill="rgba(255,255,255,0.8)" text-anchor="middle">TikTok: @${escapeXml(tiktokHandle)}</text>`;
    }
  }

  // تعتيم الخلفية للمشاهد
  const overlayGrad = `<linearGradient id="overlayGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(0,0,0,0.55)"/><stop offset="25%" stop-color="rgba(0,0,0,0.25)"/><stop offset="70%" stop-color="rgba(0,0,0,0.30)"/><stop offset="100%" stop-color="rgba(0,0,0,0.85)"/></linearGradient>`;

  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="textGlow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="rgba(0,0,0,0.9)" flood-opacity="0.9"/></filter>
    <filter id="softShadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="rgba(0,0,0,0.7)" flood-opacity="0.7"/></filter>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#BF953F"/><stop offset="30%" stop-color="#FCF6BA"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="70%" stop-color="#FCF6BA"/><stop offset="100%" stop-color="#AA771C"/></linearGradient>
    ${overlayGrad}
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#overlayGrad)"/>
  ${watermarkSVG}
  <g>
    ${badgeSVG}
    <text x="${centerX}" y="${verseY}" font-family="'${escapeXml(fontFamily)}', 'Amiri', serif" font-size="${scaledFontSize}" font-weight="${svgWeight}" fill="${escapeXml(textColor)}" text-anchor="middle" direction="rtl" filter="url(#textGlow)">${verseTSpans}</text>
    <rect x="${(WIDTH - 100) / 2}" y="${sepY}" width="100" height="1.5" rx="1" fill="rgba(212,175,55,0.5)"/>
    <circle cx="${centerX}" cy="${sepY + 0.75}" r="3" fill="rgba(212,175,55,0.6)"/>
    ${tLines.length > 0 ? `<text x="${centerX}" y="${transY}" font-family="'${escapeXml(fontFamily)}', 'Amiri', serif" font-size="${translationFontSize}" font-weight="400" fill="rgba(255,255,255,0.88)" text-anchor="middle" font-style="italic" filter="url(#softShadow)">${transTSpans}</text>` : ""}
    <text x="${centerX}" y="${ornamentY}" font-family="'${escapeXml(fontFamily)}', 'Amiri', serif" font-size="34" font-weight="bold" fill="url(#goldGrad)" text-anchor="middle">﴿ ${escapeXml(String(verse.id || ""))} ﴾</text>
  </g>
  ${socialSVG}
</svg>`;

  const svgBuffer = Buffer.from(svg);

  if (isVideoBg) {
    // رندرة شفافة لوضعها فوق الفيديو
    await sharp({
      create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
    .composite([{ input: svgBuffer, blend: "over" }])
    .png()
    .toFile(outputPath);
  } else {
    // دمج سريع جداً ومباشر فوق الصورة
    await sharp(bgPath)
      .resize(WIDTH, HEIGHT, { fit: "cover", position: "center" })
      .composite([{ input: svgBuffer, blend: "over" }])
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  }
}

// ═══ عملية الرندرة الأساسية ═══
async function startRender(jobId, data) {
  const { verses, backgroundUrl, surahName, textColor = "#ffffff", fontSize = 50, fontWeight = 700, fontFamily = "Amiri", textPosition = "center", userPlan = "free", instaHandle = "", tiktokHandle = "" } = data;
  const tempDir = path.resolve(os.tmpdir(), jobId);
  fs.mkdirSync(tempDir, { recursive: true });

  const setProgress = (pct, msg) => {
    jobs.set(jobId, { status: "processing", progress: pct, message: msg, createdAt: jobs.get(jobId)?.createdAt });
  };

  try {
    setProgress(5, "تحميل الخطوط والموارد...");
    await ensureFont(fontFamily);

    // كشف فيديو الخلفية — يدعم Pexels و روابط بها query params
    const isVideoBg = backgroundUrl && (
      /\.(mp4|webm|mov|m4v)(\?.*|#.*)?$/i.test(backgroundUrl) ||
      /videos\.pexels\.com/i.test(backgroundUrl) ||
      /\/video\//i.test(backgroundUrl)
    );
    const bgPath = path.resolve(tempDir, isVideoBg ? "bg.mp4" : "bg.jpg");
    await downloadFile(backgroundUrl, bgPath);

    setProgress(20, "تحميل وتحليل الملفات الصوتية...");

    // ═══ نظام كاريوكي: سطر واحد في كل لحظة ═══
    // 1. تحميل كل الصوتيات أولاً
    const audioPaths = [];
    const verseDurations = [];
    for (let i = 0; i < verses.length; i++) {
      const aPath = path.resolve(tempDir, `a-${i}.mp3`);
      await downloadFile(verses[i].audio, aPath);
      const dur = await getDuration(aPath);
      audioPaths.push(aPath);
      verseDurations.push(dur);
    }

    setProgress(35, "توليد إطارات سطر بسطر...");

    // 2. تقسيم كل آية لأسطر وتوليد فريم لكل سطر
    const sf = Math.min(Math.max(fontSize * 1.6, 40), 110);
    const tw = Math.floor(WIDTH * 0.82);
    const frameEntries = []; // { fPath, dur }
    const ext = isVideoBg ? "png" : "jpg";

    for (let i = 0; i < verses.length; i++) {
      const v = verses[i];
      const dur = verseDurations[i];
      const lines = wrapText(v.text || "", sf, tw);
      const numLines = Math.max(1, lines.length);
      const durPerLine = dur / numLines;

      for (let j = 0; j < numLines; j++) {
        const fPath = path.resolve(tempDir, `f-${i}-${j}.${ext}`);
        // إرسال سطر واحد فقط + الترجمة في آخر سطر
        const lineVerse = {
          ...v,
          text: lines[j],
          translation: (j === numLines - 1) ? (v.translation || "") : ""
        };
        const settings = { fontSize, fontWeight, fontFamily, textColor, textPosition, surahName, userPlan, instaHandle, tiktokHandle };
        await generateVerseFrame(lineVerse, fPath, settings, bgPath, isVideoBg);
        frameEntries.push({ fPath, dur: durPerLine });
      }
    }

    const totalDuration = verseDurations.reduce((a, b) => a + b, 0);

    setProgress(55, "دمج الصوت بدون تقطيع...");
    const mergedAudioPath = path.resolve(tempDir, "merged-audio.aac");
    const audioInputs = audioPaths.map(p => `-i "${p.replace(/\\/g, "/")}"`).join(" ");
    
    // فلتر إعادة تهيئة الترددات (Resampling) لضمان عدم وجود أخطاء في الـ concat
    const filterParts = audioPaths.map((_, i) => `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`).join(";");
    const concatIn = audioPaths.map((_, i) => `[a${i}]`).join("");
    const concatFilter = `${filterParts};${concatIn}concat=n=${audioPaths.length}:v=0:a=1[aout]`;

    await execAsync(
      `ffmpeg ${audioInputs} -filter_complex "${concatFilter}" -map "[aout]" -c:a aac -b:a 192k -ar 44100 "${mergedAudioPath.replace(/\\/g, "/")}" -y`,
      { timeout: 90000 }
    );

    setProgress(70, "جاري دمج المقاطع وإنتاج الفيديو...");
    const frameListPath = path.resolve(tempDir, "frames.txt");
    let frameContent = frameEntries.map(f => `file '${f.fPath.replace(/\\/g, "/")}'\nduration ${f.dur.toFixed(6)}`).join("\n");
    frameContent += `\nfile '${frameEntries[frameEntries.length - 1].fPath.replace(/\\/g, "/")}'`;
    fs.writeFileSync(frameListPath, frameContent);

    const outPath = path.resolve(RENDERS_DIR, `${jobId}.mp4`);
    const sl = s => s.replace(/\\/g, "/");

    let ffmpegCmd;
    if (isVideoBg) {
      // === فيديو الخلفية ===
      // الخطوة 1: استخراج فريمات الخلفية بدقة 720x1280 ودمج النصوص فوقها
      // نستخدم overlay filter مع format=rgba لضمان الشفافية
      ffmpegCmd = [
        `ffmpeg`,
        `-stream_loop -1`,
        `-t ${totalDuration.toFixed(4)}`,
        `-i "${sl(bgPath)}"`,
        `-f concat -safe 0 -i "${sl(frameListPath)}"`,
        `-i "${sl(mergedAudioPath)}"`,
        `-filter_complex`,
        `"[0:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1[bg];`,
        `[1:v]format=rgba,scale=${WIDTH}:${HEIGHT}[fg];`,
        `[bg][fg]overlay=0:0:shortest=1,format=yuv420p[vout]"`,
        `-map "[vout]" -map 2:a`,
        `-c:v libx264 -preset ultrafast -crf 23`,
        `-c:a copy`,
        `-t ${totalDuration.toFixed(4)}`,
        `-movflags +faststart`,
        `-y "${sl(outPath)}"`
      ].join(" ");
    } else {
      // === صورة الخلفية (الصور مدموجة مسبقاً بـ sharp) ===
      ffmpegCmd = `ffmpeg -f concat -safe 0 -i "${sl(frameListPath)}" -i "${sl(mergedAudioPath)}" -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p -c:a copy -t ${totalDuration.toFixed(4)} -movflags +faststart -y "${sl(outPath)}"`;
    }

    await execAsync(ffmpegCmd, { timeout: 180000 });

    jobs.set(jobId, {
      status: "completed",
      progress: 100,
      url: `https://${HOST}/download/${jobId}.mp4`,
      message: "✅ تم رندرة وتصدير الفيديو بنجاح فائق!"
    });
    console.log(`✨ [${jobId}] Render completed successfully!`);

  } catch (e) {
    console.error(`❌ [${jobId}] Render failed:`, e.message);
    jobs.set(jobId, { status: "failed", error: e.message, message: "فشلت عملية الرندرة" });
  } finally {
    // مسح المجلد المؤقت بعد دقيقة لتجنب شغل مساحة الهارد
    setTimeout(() => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
    }, 60000);
  }
}

app.use("/download", express.static(RENDERS_DIR));

app.post("/render", (req, res) => {
  const jobId = `job-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  jobs.set(jobId, { status: "processing", progress: 0, message: "بدء معالجة طلب الرندرة...", createdAt: Date.now() });
  res.json({ jobId });
  startRender(jobId, req.body);
});

app.get("/status/:jobId", (req, res) => {
  res.json(jobs.get(req.params.jobId) || { error: "Job not found" });
});

app.listen(7860, "0.0.0.0", () => {
  console.log("🚀 Hyper Render v10.0 Online on Port 7860");
});
