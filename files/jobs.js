import PQueue from "p-queue";
import { RENDER_CONCURRENCY, LIMITS } from "../config.js";
import { logger } from "./logger.js";
import { RENDER_PHASES, PHASE_NAMES_AR, RenderError } from "./errors.js";

// طابور بيحدد عدد الرندرات الشغالة في نفس الوقت.
export const renderQueue = new PQueue({ concurrency: RENDER_CONCURRENCY });

export const jobs = new Map();

export function createJob(jobId) {
  jobs.set(jobId, {
    status: "queued",
    progress: 0,
    phase: RENDER_PHASES.VALIDATION,
    phaseAr: PHASE_NAMES_AR.VALIDATION,
    message: "الطلب في الطابور، سيبدأ التجهيز فور توفر الموارد...",
    createdAt: Date.now(),
    queuePosition: renderQueue.size + renderQueue.pending,
  });
}

export function setProgress(jobId, pct, msg, phase = null) {
  const prev = jobs.get(jobId);
  const currentPhase = phase || prev?.phase || "PROCESSING";
  const phaseAr = PHASE_NAMES_AR[currentPhase] || "";
  jobs.set(jobId, {
    status: "processing",
    progress: pct,
    message: msg,
    phase: currentPhase,
    phaseAr,
    createdAt: prev?.createdAt || Date.now(),
  });
}

export function setCompleted(jobId, url) {
  const prev = jobs.get(jobId);
  jobs.set(jobId, {
    status: "completed",
    progress: 100,
    phase: "COMPLETED",
    phaseAr: "مكتمل",
    url,
    message: "✅ تم رندرة وتصدير الفيديو بنجاح فائق!",
    createdAt: prev?.createdAt,
    completedAt: Date.now(),
    renderTimeSec: prev?.createdAt ? Math.round((Date.now() - prev.createdAt) / 1000) : 0,
  });
}

/**
 * تسجيل فشل مع تشخيص دقيق يوضح المرحلة، سبب المشكلة، والتفاصيل التقنية
 */
export function setFailed(jobId, error, phaseOverride = null, detailsOverride = null) {
  const isRenderError = error instanceof RenderError || error?.name === "RenderError";
  const phase = phaseOverride || (isRenderError ? error.phase : RENDER_PHASES.UNKNOWN);
  const phaseAr = PHASE_NAMES_AR[phase] || PHASE_NAMES_AR.UNKNOWN;
  const userMessage = error?.message || "فشلت عملية الرندرة لسبب غير متوقع";
  const details = detailsOverride || (isRenderError ? error.details : {}) || {};
  const prev = jobs.get(jobId);

  // تسجيل تقرير استقصائي شامل في اللوج
  logger.error("render_job_failed", {
    jobId,
    phase,
    phaseAr,
    userMessage,
    details,
    rawError: error?.message,
    stack: error?.stack,
  });

  jobs.set(jobId, {
    status: "failed",
    progress: prev?.progress || 0,
    phase,
    phaseAr,
    message: `[${phaseAr}] ${userMessage}`,
    error: userMessage,
    details: {
      ...details,
      errorMessage: error?.message || "",
      lastKnownProgress: prev?.progress || 0,
    },
    errorRef: jobId,
    createdAt: prev?.createdAt,
    failedAt: Date.now(),
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
