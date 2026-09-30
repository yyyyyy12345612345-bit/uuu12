/**
 * ⚡ HYPER RENDER v23 — HARDENED & OPTIMIZED
 * ==================================================
 * التحسينات عن v22:
 * ✅ الخطوط متسجلة عبر fontconfig بدل تضمين base64 في كل فريم (أداء أعلى بكتير)
 * ✅ طابور رندرة (p-queue) بيمنع تحميل زيادة عن طاقة السيرفر
 * ✅ Rate limiting + مفتاح API اختياري لحماية /render
 * ✅ تحميل الصوتيات بالتوازي بدل التتابع
 * ✅ كاش حقيقي لمدد الصوتيات وخلفيات الفيديو المُعاد تحجيمها
 * ✅ تحقق من صحة المدخلات قبل قبول أي طلب رندرة
 * ✅ لا تسريب لتفاصيل الأخطاء الداخلية (stack traces) للمستخدم
 * ✅ تنظيف دوري للملفات المؤقتة والناتجة
 */

import express from "express";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import rateLimit from "express-rate-limit";

import { PORT, RENDERS_DIR, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "./config.js";
import { logger } from "./lib/logger.js";
import { requireApiKey } from "./lib/auth.js";
import { validateRenderRequest } from "./lib/validation.js";
import { renderQueue, createJob, getJob, jobs } from "./lib/jobs.js";
import { startRender } from "./lib/render.js";
import { startOutputCleanup } from "./lib/cleanup.js";

const app = express();
app.set("trust proxy", 1);

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

// Hugging Face Space probe & root endpoints (prevents unhandled errors from Space healthcheck probes)
app.all(["/", "/api/predict"], (req, res) => {
  res.json({ status: "ok", service: "hyper-render-v23" });
});

app.use(express.json({ limit: "5mb" }));

const renderLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "طلبات كتير أوي، حاول تاني بعد شوية" },
});

// Video Streaming & Download handler with full Range and HEAD support for TikTok/Instagram/Zernio
app.head("/download/:filename", (req, res) => {
  const filePath = path.resolve(RENDERS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    const jobId = req.params.filename.replace(/\.mp4$/, "");
    const job = getJob(jobId);
    if (job && job.url && job.url.startsWith("http") && !job.url.includes(`/download/${req.params.filename}`)) {
      return res.redirect(302, job.url);
    }
    return res.status(404).end();
  }
  const stat = fs.statSync(filePath);
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Length", stat.size);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Cache-Control", "public, max-age=86400, immutable");
  res.status(200).end();
});

app.get("/download/:filename", (req, res) => {
  const filePath = path.resolve(RENDERS_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    const jobId = req.params.filename.replace(/\.mp4$/, "");
    const job = getJob(jobId);
    if (job && job.url && job.url.startsWith("http") && !job.url.includes(`/download/${req.params.filename}`)) {
      return res.redirect(302, job.url);
    }
    return res.status(404).json({ error: "الفيديو غير موجود أو انتهت صلاحيته" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const isAttachment = req.query.download === "true" || req.query.dl === "1";
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", isAttachment ? `attachment; filename="${req.params.filename}"` : `inline; filename="${req.params.filename}"`);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Cache-Control", "public, max-age=86400, immutable");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.setHeader("Content-Range", `bytes */${fileSize}`);
      return res.status(416).end();
    }

    const chunksize = end - start + 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    });

    const fileStream = fs.createReadStream(filePath, { start, end });
    fileStream.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
    });
    fs.createReadStream(filePath).pipe(res);
  }
});
app.use("/download", express.static(RENDERS_DIR, { maxAge: "1h" }));

// Secure Telegram Video Proxy (Streams video from Telegram without exposing Bot Token to client)
app.get("/telegram-proxy/:fileId", async (req, res) => {
  const fileId = req.params.fileId.replace(/\.mp4$/, "");
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "TELEGRAM_BOT_TOKEN not configured" });
  }

  try {
    const getFileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const getFileData = await getFileRes.json();
    if (!getFileRes.ok || !getFileData.ok || !getFileData.result?.file_path) {
      return res.status(404).json({ error: "Telegram video not found" });
    }

    const tgFilePath = getFileData.result.file_path;
    const tgDirectUrl = `https://api.telegram.org/file/bot${token}/${tgFilePath}`;

    const headers = {};
    if (req.headers.range) {
      headers["Range"] = req.headers.range;
    }

    const videoRes = await fetch(tgDirectUrl, { headers });
    res.status(videoRes.status);

    for (const [key, value] of videoRes.headers.entries()) {
      if (["content-type", "content-length", "content-range", "accept-ranges"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (!videoRes.body) {
      return res.end();
    }
    Readable.fromWeb(videoRes.body).pipe(res);
  } catch (error) {
    res.status(500).json({ error: "Failed to stream telegram video" });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    queue: { pending: renderQueue.pending, size: renderQueue.size },
    jobsTracked: jobs.size,
    uptimeSec: Math.floor(process.uptime()),
  });
});

app.post("/render", renderLimiter, requireApiKey, (req, res) => {
  const errors = validateRenderRequest(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: "طلب غير صالح", details: errors });
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
  if (!job) return res.status(404).json({ error: "الطلب غير موجود" });
  res.json(job);
});

app.use((err, req, res, next) => {
  logger.error("unhandled_error", { error: err.message, stack: err.stack, path: req.path });
  res.status(500).json({ error: "خطأ داخلي في السيرفر" });
});

startOutputCleanup();

const server = app.listen(PORT, "0.0.0.0", () => {
  logger.info("server_started", { port: PORT });
  console.log(`🚀 Hyper Render v23 Online on Port ${PORT}`);
});

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
