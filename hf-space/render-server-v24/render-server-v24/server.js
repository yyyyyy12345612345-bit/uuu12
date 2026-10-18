/**
 * ⚡ HYPER RENDER v24
 * ==================================================
 * التحسينات عن v23 (أهمها):
 * 🔒 إزالة توكن تليجرام المكتوب في الكود (لازم يتغيّر من BotFather لأنه كان ظاهر في ريبو عام)
 * 🔒 مسارات /debug/* مقفولة افتراضياً (ENABLE_DEBUG=1 + API key)
 * 🔒 حماية path traversal في /download، وتحقق من fileId في /telegram-proxy
 * 🔒 تحقق من redirects وسقف حجم التحميل (SSRF / امتلاء الديسك)
 * ⚡ الصور (صورة الشيخ/الخلفية) بتتصغّر مرة واحدة بدل كل فريم — القوالب أسرع ~2.5x
 * ⚡ FFmpeg بدون shell (execFile) + preset/crf قابلين للضبط + -tune stillimage + 30fps ثابت
 * 🐛 إصلاح: رابط /download كان يرجّع 404 بعد النجاح لأن الملف كان بيتمسح بعد رفعه لتليجرام
 * 🧹 مسح الملفات المؤقتة فوراً بعد النجاح، وطابور له حد أقصى (503 بدل التراكم)
 */

import express from "express";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import rateLimit from "express-rate-limit";

import {
  PORT, RENDERS_DIR, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS,
  MAX_QUEUE_SIZE, ENABLE_DEBUG,
} from "./config.js";
import { logger } from "./lib/logger.js";
import { requireApiKey } from "./lib/auth.js";
import { validateRenderRequest } from "./lib/validation.js";
import { renderQueue, createJob, getJob, jobs } from "./lib/jobs.js";
import { startRender } from "./lib/render.js";
import { startOutputCleanup } from "./lib/cleanup.js";
import { fontsReady } from "./lib/fonts.js";

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

const ALLOWED_ORIGINS = [
  "https://yaqeenalquran.online",
  "https://yaqeen-app.vercel.app",
  "capacitor://localhost",
  "http://localhost",
  "http://localhost:3000",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app") || origin.endsWith(".yaqeenalquran.online")) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));

// Hugging Face Space probe & root endpoints
app.all(["/", "/api/predict"], (req, res) => {
  res.json({ status: "ok", service: "hyper-render-v24" });
});

app.use(express.json({ limit: "5mb" }));

const renderLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "طلبات كتير أوي، حاول تاني بعد شوية" },
});

// اسم الملف لازم يكون job-<رقم>-<6 hex>.mp4 بالظبط — أي حاجة تانية مرفوضة (path traversal)
const FILENAME_RE = /^job-\d{10,16}-[a-f0-9]{6}\.mp4$/;

// تحميل/بث الفيديو. res.sendFile بيتولى Range / HEAD / ETag / If-Modified-Since صح
// (تيك توك وإنستجرام وZernio بيعتمدوا على Range + HEAD).
app.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  if (!FILENAME_RE.test(filename)) return res.status(400).json({ error: "اسم ملف غير صالح" });

  const filePath = path.resolve(RENDERS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    // لو الملف المحلي اتمسح (TTL) لكن عندنا نسخة على تليجرام، نحوّل لها
    const job = getJob(filename.replace(/\.mp4$/, ""));
    if (job?.telegramUrl) return res.redirect(302, job.telegramUrl);
    return res.status(404).json({ error: "الفيديو غير موجود أو انتهت صلاحيته" });
  }

  const isAttachment = req.query.download === "true" || req.query.dl === "1";
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", `${isAttachment ? "attachment" : "inline"}; filename="${filename}"`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.sendFile(filePath, { acceptRanges: true, maxAge: "1d", immutable: true, dotfiles: "deny" }, (err) => {
    if (err && !res.headersSent) res.status(err.status || 500).end();
  });
});

// بث فيديو تليجرام بدون كشف التوكن للعميل
const TG_FILE_ID_RE = /^[A-Za-z0-9_-]{10,250}$/;
app.get("/telegram-proxy/:fileId", async (req, res) => {
  const fileId = req.params.fileId.replace(/\.mp4$/, "");
  if (!TG_FILE_ID_RE.test(fileId)) return res.status(400).json({ error: "fileId غير صالح" });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(503).json({ error: "TELEGRAM_BOT_TOKEN not configured" });

  try {
    const getFileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`, {
      signal: AbortSignal.timeout(15000),
    });
    const getFileData = await getFileRes.json();
    if (!getFileRes.ok || !getFileData.ok || !getFileData.result?.file_path) {
      return res.status(404).json({ error: "Telegram video not found" });
    }

    const tgDirectUrl = `https://api.telegram.org/file/bot${token}/${getFileData.result.file_path}`;
    const headers = {};
    if (req.headers.range) headers["Range"] = req.headers.range;

    const videoRes = await fetch(tgDirectUrl, { headers });
    res.status(videoRes.status);
    for (const [key, value] of videoRes.headers.entries()) {
      if (["content-type", "content-length", "content-range", "accept-ranges"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (!videoRes.body) return res.end();
    const stream = Readable.fromWeb(videoRes.body);
    stream.on("error", (e) => logger.error("stream_pipe_error", { error: e.message }));
    res.on("close", () => stream.destroy()); // العميل قفل الاتصال → وقّف التحميل
    stream.pipe(res);
  } catch (error) {
    logger.error("telegram_proxy_error", { fileId, error: error.message });
    if (!res.headersSent) res.status(500).json({ error: "Failed to stream telegram video" });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    queue: { pending: renderQueue.pending, size: renderQueue.size, max: MAX_QUEUE_SIZE },
    jobsTracked: jobs.size,
    uptimeSec: Math.floor(process.uptime()),
  });
});

app.post("/render", renderLimiter, requireApiKey, (req, res) => {
  const errors = validateRenderRequest(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "طلب غير صالح", details: errors });
  }

  // حد أقصى للطابور: بدل ما الطلبات تتراكم لحد ما السيرفر يقع، نرد 503 والعميل يعيد المحاولة
  if (renderQueue.size >= MAX_QUEUE_SIZE) {
    res.setHeader("Retry-After", "60");
    return res.status(503).json({ error: "السيرفر مشغول حالياً، حاول بعد دقيقة", queueSize: renderQueue.size });
  }

  const jobId = `job-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  createJob(jobId);
  res.json({ jobId, queuePosition: renderQueue.size + renderQueue.pending });

  renderQueue.add(() => startRender(jobId, req.body)).catch(e => {
    logger.error("queue_task_failed", { jobId, error: e.message });
  });
});

app.get("/status/:jobId", requireApiKey, (req, res) => {
  const job = getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: "الطلب غير موجود (ممكن السيرفر اتعمله إعادة تشغيل — ابعت الطلب تاني)" });
  res.json(job);
});

// ─── مسارات التشخيص: مقفولة افتراضياً ───────────────────────────────
if (ENABLE_DEBUG) {
  app.get("/debug/last-errors", requireApiKey, (req, res) => {
    const failedJobs = [];
    for (const [id, job] of jobs.entries()) {
      if (job.status === "failed") failedJobs.push({ jobId: id, ...job });
    }
    failedJobs.sort((a, b) => (b.failedAt || 0) - (a.failedAt || 0));
    res.json({ count: failedJobs.length, errors: failedJobs.slice(0, 15) });
  });

  app.get("/debug/network-test", requireApiKey, async (req, res) => {
    const report = {};
    try {
      const r = await fetch("https://api.telegram.org", { signal: AbortSignal.timeout(6000) });
      report.telegramStatus = r.status;
    } catch (e) {
      report.telegramError = { message: e.message, code: e.cause?.code || e.code };
    }
    res.json(report);
  });
}

app.use((err, req, res, next) => {
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "JSON غير صالح" });
  if (err?.type === "entity.too.large") return res.status(413).json({ error: "الطلب كبير جداً" });
  logger.error("unhandled_error", { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: "خطأ داخلي في السيرفر" });
});

startOutputCleanup();

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info("server_started", { port: PORT });
  console.log(`🚀 Hyper Render v24 Online on Port ${PORT}`);
});
fontsReady.then(() => logger.info("fonts_ready"));

function shutdown(signal) {
  logger.info("shutdown_signal", { signal });
  server.close(() => {
    logger.info("server_closed");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (e) => logger.error("unhandled_rejection", { error: e?.message || String(e) }));
