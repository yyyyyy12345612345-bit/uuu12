import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { BG_CACHE_DIR, LIMITS, WIDTH, HEIGHT } from "../config.js";
import { hashKey, downloadFile } from "./security.js";
import { logger } from "./logger.js";

const execAsync = promisify(exec);

if (!fs.existsSync(BG_CACHE_DIR)) fs.mkdirSync(BG_CACHE_DIR, { recursive: true });

// ─── كاش مدة الصوتيات ────────────────────────────────────────────
// المفتاح هنا رابط الصوت نفسه (مش مسار مؤقت خاص بكل job)، عشان الكاش
// يفيد فعلاً عبر الطلبات المختلفة اللي بتستخدم نفس تلاوة الآية.
const durationCache = new Map();

export async function getDurationCached(url, filePath) {
  const key = url;
  if (durationCache.has(key)) return durationCache.get(key);
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath.replace(/"/g, '\\"')}"`,
      { timeout: 15000 }
    );
    const d = parseFloat(stdout.trim());
    const finalDur = isNaN(d) || d <= 0 ? 5 : d;
    durationCache.set(key, finalDur);
    return finalDur;
  } catch {
    return 5;
  }
}

// ─── كاش خلفيات الفيديو المُعاد تحجيمها لمقاس الموبايل ──────────────
// إعادة تحجيم فيديو الخلفية بـ ffmpeg عملية مكلفة؛ لو نفس رابط الخلفية
// اتطلب قبل كده، بنرجّع النسخة المخزّنة فورًا بدل ما نعيد المعالجة.
function bgCachePath(backgroundUrl, fit) {
  const key = hashKey(`${backgroundUrl}|${WIDTH}x${HEIGHT}|${fit || "cover"}`);
  return path.resolve(BG_CACHE_DIR, `${key}.mp4`);
}

export async function getResizedBackground(backgroundUrl, rawBgPath, fit) {
  const cached = bgCachePath(backgroundUrl, fit);
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
    const filter = fit === "contain"
      ? `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,setsar=1`
      : `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase:force_divisible_by=2,crop=${WIDTH}:${HEIGHT},setsar=1`;

    await execAsync(
      `ffmpeg -loglevel error -i "${rawBgPath}" -vf "${filter}" -an -c:v libx264 -preset ultrafast -crf 20 "${cached}" -y`,
      { timeout: 75000 } // زيادة المهلة لتجنب الفشل على خوادم الاستضافة الضعيفة
    );
  } catch (err) {
    // في حال فشل ffmpeg، نحذف أي ملف جزئي تالف تم إنشاؤه
    try {
      if (fs.existsSync(cached)) {
        fs.unlinkSync(cached);
      }
    } catch {}
    throw err;
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
