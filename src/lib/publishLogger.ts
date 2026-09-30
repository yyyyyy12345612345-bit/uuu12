/**
 * 📊 نظام تتبع أخطاء النشر الاحترافي
 * =====================================
 * يسجل كل خطوة في pipeline النشر مع timestamps ومدد التنفيذ
 * ويخزن التفاصيل في Firestore للمراجعة من لوحة التحكم
 */
import admin from "firebase-admin";

export type PublishStep =
  | "auth_check"
  | "metadata_build"
  | "firestore_log_init"
  | "video_url_validate"
  | "zernio_direct_post"
  | "make_webhook_send"
  | "make_webhook_response"
  | "zernio_youtube_post"
  | "zernio_tiktok_post"
  | "firestore_log_finalize"
  | "complete";

export interface StepLog {
  step: PublishStep;
  status: "ok" | "error" | "skip";
  ts: string;
  durationMs?: number;
  detail?: string;
  errorCode?: string | number;
  errorBody?: string;
}

export class PublishLogger {
  private steps: StepLog[] = [];
  private platform: "youtube" | "tiktok" | "both";
  private jobId: string;
  private videoUrl: string;
  private startTime: number;

  constructor(platform: "youtube" | "tiktok" | "both", jobId: string, videoUrl: string) {
    this.platform = platform;
    this.jobId = jobId;
    this.videoUrl = videoUrl;
    this.startTime = Date.now();
  }

  /** سجّل خطوة ناجحة */
  ok(step: PublishStep, detail?: string) {
    this.steps.push({
      step,
      status: "ok",
      ts: new Date().toISOString(),
      durationMs: Date.now() - this.startTime,
      detail,
    });
  }

  /** سجّل خطوة اتخطت */
  skip(step: PublishStep, detail?: string) {
    this.steps.push({
      step,
      status: "skip",
      ts: new Date().toISOString(),
      durationMs: Date.now() - this.startTime,
      detail,
    });
  }

  /** سجّل خطأ مع التفاصيل */
  error(step: PublishStep, detail: string, errorCode?: string | number, errorBody?: string) {
    this.steps.push({
      step,
      status: "error",
      ts: new Date().toISOString(),
      durationMs: Date.now() - this.startTime,
      detail,
      errorCode,
      errorBody: errorBody?.substring(0, 2000), // حد أقصى 2000 حرف
    });
  }

  /** هل في أي خطأ حصل؟ */
  hasErrors(): boolean {
    return this.steps.some((s) => s.status === "error");
  }

  /** أرجع ملخص الأخطاء */
  getErrorSummary(): string {
    const errors = this.steps.filter((s) => s.status === "error");
    if (errors.length === 0) return "✅ لا يوجد أخطاء";
    return errors
      .map((e) => `❌ [${e.step}] ${e.detail}${e.errorCode ? ` (${e.errorCode})` : ""}`)
      .join("\n");
  }

  /** كل الخطوات */
  getSteps(): StepLog[] {
    return [...this.steps];
  }

  /** احفظ في Firestore */
  async saveToFirestore(db: admin.firestore.Firestore) {
    try {
      const totalDuration = Date.now() - this.startTime;
      const hasErr = this.hasErrors();

      await db.collection("publish_diagnostics").add({
        platform: this.platform,
        jobId: this.jobId,
        videoUrl: this.videoUrl,
        status: hasErr ? "error" : "success",
        steps: this.steps,
        errorSummary: hasErr ? this.getErrorSummary() : null,
        totalDurationMs: totalDuration,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // لو في خطأ، سجّل في error_alerts كمان للإشعارات
      if (hasErr) {
        await db.collection("error_alerts").add({
          type: "publish_error",
          platform: this.platform,
          jobId: this.jobId,
          videoUrl: this.videoUrl,
          summary: this.getErrorSummary(),
          steps: this.steps.filter((s) => s.status === "error"),
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      console.error("[PublishLogger] Failed to save diagnostics:", e);
    }
  }
}

/**
 * تحقق إن رابط الفيديو شغال ويقدر يتحمّل
 * يرجع { ok, status, contentType, contentLength, error }
 */
export async function validateVideoUrl(videoUrl: string): Promise<{
  ok: boolean;
  status?: number;
  contentType?: string;
  contentLength?: number;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(videoUrl, {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const contentType = res.headers.get("content-type") || "";
    const contentLength = parseInt(res.headers.get("content-length") || "0", 10);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        contentType,
        error: `HTTP ${res.status} — السيرفر رفض الطلب. الفيديو ممكن يكون اتمسح أو الرابط منتهي.`,
      };
    }

    if (!contentType.includes("video") && !contentType.includes("octet-stream")) {
      return {
        ok: false,
        status: res.status,
        contentType,
        error: `الرابط رجع "${contentType}" مش فيديو. ممكن صفحة خطأ أو redirect.`,
      };
    }

    if (contentLength > 0 && contentLength < 10000) {
      return {
        ok: false,
        status: res.status,
        contentType,
        contentLength,
        error: `حجم الملف صغير جداً (${contentLength} bytes) — ممكن مش فيديو حقيقي.`,
      };
    }

    return { ok: true, status: res.status, contentType, contentLength };
  } catch (e: any) {
    if (e.name === "AbortError") {
      return { ok: false, error: "الرابط مرد خلال 15 ثانية — السيرفر بطيء أو الرابط مش شغال." };
    }
    return { ok: false, error: `فشل الاتصال: ${e.message}` };
  }
}
