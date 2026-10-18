import fs from "fs";
import path from "path";
import sharp from "sharp";
import { ffmpeg, ffprobe, threadArgs } from "./ffmpeg.js";
import { BG_CACHE_DIR, LIMITS, WIDTH, HEIGHT, X264_PRESET } from "../config.js";
import { hashKey, downloadFile } from "./security.js";
import { logger } from "./logger.js";
import { RENDER_PHASES, RenderError } from "./errors.js";

if (!fs.existsSync(BG_CACHE_DIR)) fs.mkdirSync(BG_CACHE_DIR, { recursive: true });

// ─── كاش مدة الصوتيات ────────────────────────────────────────────
// المفتاح هنا رابط الصوت نفسه (مش مسار مؤقت خاص بكل job)، عشان الكاش
// يفيد فعلاً عبر الطلبات المختلفة اللي بتستخدم نفس تلاوة الآية.
const durationCache = new Map();

export async function getDurationCached(url, filePath) {
  const key = url;
  if (durationCache.has(key)) return durationCache.get(key);
  try {
    const { stdout } = await ffprobe(
      ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
      { timeout: 15000 }
    );
    const d = parseFloat(stdout.trim());
    const finalDur = isNaN(d) || d <= 0 ? 5 : d;
    durationCache.set(key, finalDur);
    return finalDur;
  } catch (err) {
    throw new RenderError(
      RENDER_PHASES.AUDIO_PROBE,
      "فشل قراءة مدة ملف الصوت (الملف تالف أو ليس صوتاً)",
      { url, stderr: (err.stderr || err.message || "").substring(0, 300) },
      err
    );
  }
}

// ─── كاش خلفيات الفيديو المُعاد تحجيمها لمقاس الموبايل ──────────────
// إعادة تحجيم فيديو الخلفية بـ ffmpeg عملية مكلفة؛ لو نفس رابط الخلفية
// اتطلب قبل كده، بنرجّع النسخة المخزّنة فورًا بدل ما نعيد المعالجة.
function bgCachePath(backgroundUrl, fit, targetW = WIDTH, targetH = HEIGHT) {
  const key = hashKey(`${backgroundUrl}|${targetW}x${targetH}|${fit || "cover"}`);
  return path.resolve(BG_CACHE_DIR, `${key}.mp4`);
}

const parseRate = (r) => { const [a, b] = String(r || "0/1").split("/").map(Number); return b ? a / b : a || 0; };

// الفيديو يصلح ينسخ بدون إعادة تشفير (stream copy): h264 + yuv420p + بنفس مقاس الفريم + نسبة 1:1 + <=60fps
function isCopyCompatible(info, w, h) {
  if (!info) return false;
  const sarOk = !info.sar || ["1:1", "0:1", "N/A"].includes(info.sar);
  const fps = parseRate(info.rate);
  return info.codec === "h264" && info.pixFmt === "yuv420p" && info.width === w && info.height === h && sarOk && fps > 0 && fps <= 60;
}

export const isVideoBackgroundUrl = (u) =>
  !!u && (/\.(mp4|webm|mov|m4v)(\?.*|#.*)?$/i.test(u) || /videos\.pexels\.com/i.test(u) || /\/video\//i.test(u));

export function scaleFilterFor(effectiveFit, targetW, targetH) {
  return effectiveFit === "contain"
    ? `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black,setsar=1`
    : `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase:force_divisible_by=2,crop=${targetW}:${targetH},setsar=1`;
}

const inflightResizes = new Map();

// بيرجّع { width, height, codec, pixFmt, duration } للفيديو (أو null لو فشل)
export async function probeVideo(filePath) {
  try {
    const { stdout } = await ffprobe(
      ["-v", "error", "-select_streams", "v:0", "-show_entries",
       "stream=width,height,codec_name,pix_fmt,sample_aspect_ratio,r_frame_rate:format=duration", "-of", "json", filePath],
      { timeout: 20000 }
    );
    const j = JSON.parse(stdout);
    const st = (j.streams || [])[0] || {};
    return {
      width: st.width, height: st.height, codec: st.codec_name, pixFmt: st.pix_fmt,
      sar: st.sample_aspect_ratio, rate: st.r_frame_rate,
      duration: parseFloat(j.format?.duration) || 0,
    };
  } catch {
    return null;
  }
}

/**
 * بيجهّز فيديو الخلفية بمقاس الفريم.
 * v24:
 *  - maxSeconds: لو الفيديو الناتج أقصر من الخلفية، بنقلّم الخلفية على المدة المطلوبة بس
 *    (v23 كان بيعيد تشفير الخلفية كلها، وبمهلة ثابتة 5 دقايق فخلفية طويلة كانت ممكن تفشل).
 *  - بنعيد تشفير الخلفية دايماً (حتى لو بالمقاس الصح): القياس أثبت إن نسخة ultrafast بتتفك أسرع
 *    في كل فريم بعد كده، وده أهم من توفير تشفير واحد في الفيديوهات الطويلة اللي بتكرّر الخلفية.
 *  - لو طلبين بيجهّزوا نفس الخلفية في نفس اللحظة، التاني بيستنى الأول.
 */
export function getResizedBackground(backgroundUrl, rawBgPath, fit, isWide = false, maxSeconds = 0, opts = {}) {
  const key = `${backgroundUrl}|${fit}|${isWide}|${Math.ceil((maxSeconds + 2) / 60)}|${opts.copyIfCompliant ? "c" : "e"}`;
  if (inflightResizes.has(key)) return inflightResizes.get(key);
  const p = _getResizedBackground(backgroundUrl, rawBgPath, fit, isWide, maxSeconds, opts).finally(() => inflightResizes.delete(key));
  inflightResizes.set(key, p);
  return p;
}

async function _getResizedBackground(backgroundUrl, rawBgPath, fit, isWide = false, maxSeconds = 0, opts = {}) {
  const targetW = isWide ? 1920 : WIDTH;
  const targetH = isWide ? 1080 : HEIGHT;
  // معمارية الفصل بين الوضع العريض والوضع الطولي:
  // 1. في الوضع العريض (16:9 يوتيوب): الفيديو يملأ الشاشة العريضة بالكامل 100% (cover)
  // 2. في الوضع الطولي (9:16 تيك توك): الفيديو يتوسط الشاشة في المنتصف ومساحة فوق وتحت (contain)
  const effectiveFit = isWide ? "cover" : (fit === "cover" ? "cover" : "contain");

  const info = await probeVideo(rawBgPath);
  // الطول اللي محتاجينه فعلاً من الخلفية (+ هامش ثانيتين). 0 = الخلفية كلها.
  // بنقرّب لأعلى دقيقة كاملة عشان النسخة المقلّمة المخزّنة تصلح لأي إخراج داخل نفس الشريحة.
  const bucketSecs = maxSeconds > 0 ? Math.ceil((maxSeconds + 2) / 60) * 60 : 0;
  const needSecs = bucketSecs > 0 && info?.duration > bucketSecs ? bucketSecs : 0;

  // وضع "خلفية فقط": الفيديو مش بيتفك أصلاً (stream copy)، فمفيش داعي نعيد تشفيره لو بالمقاس والكودك المناسبين.
  // بنقلّمه بالنسخ بس لو أطول من المطلوب.
  if (opts.copyIfCompliant && isCopyCompatible(info, targetW, targetH)) {
    if (!needSecs) {
      logger.info("bg_copy_compatible_no_reencode", { targetW, targetH });
      return rawBgPath;
    }
    const copyCached = bgCachePath(backgroundUrl, `copy-t${needSecs}`, targetW, targetH);
    if (fs.existsSync(copyCached) && fs.statSync(copyCached).size > 1024) return copyCached;
    try {
      await ffmpeg(["-i", rawBgPath, "-t", String(needSecs), "-map", "0:v:0", "-c", "copy", "-an", "-y", copyCached], { timeout: 600000 });
      await evictOldBackgrounds();
      return copyCached;
    } catch (e) {
      try { fs.rmSync(copyCached, { force: true }); } catch {}
      logger.warn("bg_copy_trim_failed_fallback_reencode", { error: e.message });
    }
  }

  // مفتاح الكاش بيشمل شريحة المدة لو اتقلّمت، عشان نسخة مقلّمة قصيرة ما تتستخدمش لإخراج أطول
  const cached = bgCachePath(backgroundUrl, effectiveFit + (needSecs ? `-t${needSecs}` : ""), targetW, targetH);
  if (fs.existsSync(cached)) {
    try {
      const stat = fs.statSync(cached);
      if (stat.size > 1024) {
        // نحدّث وقت آخر استخدام (لغرض الـ LRU البسيط) عبر إعادة لمس الملف
        try { fs.utimesSync(cached, new Date(), new Date()); } catch {}
        return cached;
      } else {
        // الملف تالف أو فارغ، نقوم بحذفه لإعادة إنتاجه
        try { fs.unlinkSync(cached); } catch {}
      }
    } catch (e) {
      try { fs.unlinkSync(cached); } catch {}
    }
  }

  try {
    const filter = effectiveFit === "contain"
      ? `scale=${targetW}:${targetH}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=${targetW}:${targetH}:(ow-iw)/2:(oh-ih)/2:black,setsar=1`
      : `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase:force_divisible_by=2,crop=${targetW}:${targetH},setsar=1`;

    // المهلة بتتناسب مع طول الجزء اللي بنشفّره (كانت ثابتة 5 دقايق)
    const encSecs = needSecs || info?.duration || 60;
    const timeout = Math.max(300000, Math.ceil(encSecs * 2000));
    await ffmpeg(
      ["-i", rawBgPath, ...(needSecs ? ["-t", String(needSecs)] : []), "-vf", filter, "-an", ...threadArgs(),
       "-c:v", "libx264", "-preset", X264_PRESET, "-crf", "20", "-pix_fmt", "yuv420p", "-y", cached],
      { timeout, maxBuffer: 50 * 1024 * 1024 }
    );
  } catch (err) {
    // في حال فشل ffmpeg، نحذف أي ملف جزئي تالف تم إنشاؤه
    try {
      if (fs.existsSync(cached)) {
        fs.unlinkSync(cached);
      }
    } catch {}
    throw new RenderError(
      RENDER_PHASES.BACKGROUND_PROCESS,
      `فشل تحجيم ومعالجة فيديو الخلفية (${effectiveFit} ${targetW}x${targetH}) بواسطة FFmpeg`,
      {
        backgroundUrl,
        rawBgPath,
        effectiveFit,
        targetResolution: `${targetW}x${targetH}`,
        stderr: (err.stderr || err.message || "").substring(0, 500),
      },
      err
    );
  }

  await evictOldBackgrounds();
  return cached;
}

async function evictOldBackgrounds() {
  try {
    const files = fs.readdirSync(BG_CACHE_DIR)
      .map(f => {
        const p = path.resolve(BG_CACHE_DIR, f);
        return { p, mtime: fs.statSync(p).mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
    if (files.length > LIMITS.BG_CACHE_MAX_FILES) {
      for (const f of files.slice(LIMITS.BG_CACHE_MAX_FILES)) {
        fs.rmSync(f.p, { force: true });
      }
      logger.info("bg_cache_evicted", { removed: files.length - LIMITS.BG_CACHE_MAX_FILES });
    }
  } catch (e) {
    logger.warn("bg_cache_evict_failed", { error: e.message });
  }
}

export { downloadFile };


// ─── تجهيز الصور مرة واحدة بدل ما كل فريم يفك ويصغّر الصورة الأصلية ──────────
// الصورة الأصلية (مثلاً 4000x3000 من Pexels) كانت بتتفك وتتصغّر في كل فريم.
// دلوقتي بنصغّرها مرة واحدة لمقاس الفريم ونخزّنها raw في الذاكرة.
export async function prepareBackgroundRaw(imagePath, frameW, frameH, fit = "cover") {
  const { data, info } = await sharp(imagePath)
    .resize(frameW, frameH, { fit, background: { r: 0, g: 0, b: 0 }, position: "center" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

// صور الشيخ والخلفيات المضمّنة base64 جوه كل SVG: بنصغّرها لمقاس يكفي العرض (x2 للحدة)
// بدل ما كل فريم يفك صورة 1600x1600. ده أكبر مكسب في سرعة قوالب المشغّل.
export async function downscaleToBase64(imagePath, maxSide = 640, { png = false } = {}) {
  let img = sharp(imagePath).resize(maxSide, maxSide, { fit: "inside", withoutEnlargement: true });
  img = png ? img.png({ compressionLevel: 6 }) : img.jpeg({ quality: 85 });
  return (await img.toBuffer()).toString("base64");
}
