/**
 * 🛠️ محرك تشخيص وإدارة الأخطاء الاحترافي لسيرفر الرندر
 * Professional Error Diagnostic Engine for Render Server
 */

export const RENDER_PHASES = {
  VALIDATION: "VALIDATION",                 // فحص المدخلات والبيانات
  FONTS: "FONTS",                           // تحميل وتثبيت خطوط النصوص
  BACKGROUND_DOWNLOAD: "BACKGROUND_DOWNLOAD", // تحميل فيديو أو صورة الخلفية
  BACKGROUND_PROCESS: "BACKGROUND_PROCESS",   // تحجيم ومعالجة فيديو الخلفية بـ FFmpeg
  AUDIO_DOWNLOAD: "AUDIO_DOWNLOAD",         // تحميل تلاوات الآيات الصوتية
  AUDIO_PROBE: "AUDIO_PROBE",               // فحص وتحليل مدد الصوتيات عبر ffprobe
  FRAME_RENDER: "FRAME_RENDER",             // رسم وتوليد إطارات الآيات (Canvas/SVG)
  AUDIO_MERGE: "AUDIO_MERGE",               // دمج ومعالجة الصوتيات وتطبيق الفلاتر
  FFMPEG_RENDER: "FFMPEG_RENDER",           // دمج الطبقات وإنتاج الفيديو النهائي
  TELEGRAM_UPLOAD: "TELEGRAM_UPLOAD",       // رفع الفيديو سحابياً إلى تليجرام
  UNKNOWN: "UNKNOWN",                       // خطأ غير متوقع
};

export const PHASE_NAMES_AR = {
  VALIDATION: "التحقق من البيانات",
  FONTS: "تحميل الخطوط",
  BACKGROUND_DOWNLOAD: "تحميل الخلفية",
  BACKGROUND_PROCESS: "معالجة أبعاد الخلفية",
  AUDIO_DOWNLOAD: "تحميل صوتيات التلاوة",
  AUDIO_PROBE: "تحليل مدة الصوت",
  FRAME_RENDER: "تصميم ورسم الآيات",
  AUDIO_MERGE: "دمج هندسة الصوت",
  FFMPEG_RENDER: "إنتاج وتصدير الفيديو",
  TELEGRAM_UPLOAD: "الرفع السحابي",
  UNKNOWN: "معالجة غير محددة",
};

export class RenderError extends Error {
  constructor(phase, message, details = {}, originalError = null) {
    super(message);
    this.name = "RenderError";
    this.phase = phase || RENDER_PHASES.UNKNOWN;
    this.phaseAr = PHASE_NAMES_AR[this.phase] || PHASE_NAMES_AR.UNKNOWN;
    this.details = details || {};
    this.originalError = originalError;
    this.timestamp = Date.now();

    if (originalError?.stack) {
      this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }

  toJSON() {
    return {
      name: this.name,
      phase: this.phase,
      phaseAr: this.phaseAr,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
    };
  }
}
