import PQueue from "p-queue";
import { RENDER_CONCURRENCY, LIMITS } from "../config.js";
import { logger } from "./logger.js";

// طابور بيحدد عدد الرندرات الشغالة في نفس الوقت. أي طلب زيادة عن السقف
// يستنى في الطابور بدل ما يشتغل فورًا ويحمّل السيرفر فوق طاقته.
export const renderQueue = new PQueue({ concurrency: RENDER_CONCURRENCY });

export const jobs = new Map();

export function createJob(jobId) {
  jobs.set(jobId, {
    status: "queued",
    progress: 0,
    message: "الطلب في الطابور، هيبدأ قريب...",
    createdAt: Date.now(),
    queuePosition: renderQueue.size + renderQueue.pending,
  });
}

export function setProgress(jobId, pct, msg) {
  const prev = jobs.get(jobId);
  jobs.set(jobId, { status: "processing", progress: pct, message: msg, createdAt: prev?.createdAt });
}

export function setCompleted(jobId, url) {
  jobs.set(jobId, {
    status: "completed",
    progress: 100,
    url,
    message: "✅ تم رندرة وتصدير الفيديو بنجاح فائق!",
  });
}

// مهم: منسربش e.stack ولا تفاصيل داخلية للمستخدم. بيتسجلوا في اللوج بس
// والمستخدم بياخد رسالة عامة + رمز مرجعي (jobId) يقدر يبعتهولنا لو محتاج دعم.
export function setFailed(jobId, error) {
  logger.error("render_job_failed", { jobId, error: error.message, stack: error.stack });
  jobs.set(jobId, {
    status: "failed",
    message: "فشلت عملية الرندرة. جرّب تاني، ولو المشكلة استمرت ابعتلنا رقم الطلب.",
    errorRef: jobId,
  });
}

export function getJob(jobId) {
  return jobs.get(jobId) || null;
}

// تنظيف دوري للـ jobs القديمة من الذاكرة
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt && now - job.createdAt > LIMITS.JOB_TTL_MS) jobs.delete(id);
  }
}, 15 * 60 * 1000);
