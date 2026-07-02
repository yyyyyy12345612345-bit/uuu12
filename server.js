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
import rateLimit from "express-rate-limit";

import { PORT, RENDERS_DIR, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "./config.js";
import { logger } from "./lib/logger.js";
import { requireApiKey } from "./lib/auth.js";
import { validateRenderRequest } from "./lib/validation.js";
import { renderQueue, createJob, getJob, jobs } from "./lib/jobs.js";
import { startRender } from "./lib/render.js";
import { startOutputCleanup } from "./lib/cleanup.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const renderLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "طلبات كتير أوي، حاول تاني بعد شوية" },
});

app.use("/download", express.static(RENDERS_DIR, { maxAge: "1h" }));

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
