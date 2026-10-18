import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { FONTS_DIR, FONT_MAP, FONT_ALIASES } from "../config.js";
import { safePath } from "./security.js";
import { logger } from "./logger.js";

const execFileAsync = promisify(execFile);

if (!fs.existsSync(FONTS_DIR)) fs.mkdirSync(FONTS_DIR, { recursive: true });

// fontconfig: librsvg (اللي sharp بيرسم بيها الـ SVG) بتدوّر على الخطوط بالاسم.
// بنكتب fonts.conf مخصص فيه مجلد الخطوط + قواعد alias (Impact -> Anton ... إلخ)
// عشان القوالب تفضل شغالة زي ما هي من غير ما نضمّن الخط base64 في كل فريم.
function setupFontconfigFile() {
  const aliasRules = Object.entries(FONT_ALIASES)
    .map(([from, to]) => `
  <match target="pattern">
    <test qual="any" name="family"><string>${from}</string></test>
    <edit name="family" mode="assign" binding="same"><string>${to}</string></edit>
  </match>`)
    .join("");
  const confPath = path.resolve(os.tmpdir(), "hyper_render_fonts.conf");
  const conf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONTS_DIR}</dir>
  <dir>/usr/share/fonts</dir>
  <dir>/usr/local/share/fonts</dir>
  <cachedir>${path.resolve(os.tmpdir(), "fontconfig_cache")}</cachedir>${aliasRules}
</fontconfig>`;
  fs.writeFileSync(confPath, conf);
  process.env.FONTCONFIG_FILE = confPath;
  return confPath;
}
setupFontconfigFile();

async function downloadFontFile(url, dest) {
  // روابط الخطوط ثابتة من FONT_MAP (مش مدخلات مستخدم). بنحمّل لملف .part ثم rename
  // عشان ملف ناقص ما يتحسبش خط سليم لو العملية اتقطعت.
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`Font download failed (${res.status}): ${url}`);
  const tmp = `${dest}.part`;
  await finished(Readable.fromWeb(res.body).pipe(fs.createWriteStream(tmp)));
  fs.renameSync(tmp, dest);
}

let fontconfigAvailable = null;
async function checkFontconfig() {
  if (fontconfigAvailable !== null) return fontconfigAvailable;
  try {
    await execFileAsync("fc-cache", ["--version"]);
    fontconfigAvailable = true;
  } catch {
    fontconfigAvailable = false;
    logger.warn("fontconfig_unavailable_fallback_to_base64_embedding");
  }
  return fontconfigAvailable;
}

const safeName = (k) => k.replace(/[^a-zA-Z0-9-]/g, "_");
const fontPathFor = (key) => safePath(FONTS_DIR, `${safeName(key)}.ttf`);

/** أي اسم خط مش موجود في FONT_MAP بيتحوّل لـ Amiri */
export function normalizeFontFamily(name) {
  return name && Object.prototype.hasOwnProperty.call(FONT_MAP, name) ? name : "Amiri";
}

// تحميل كل الخطوط مرة واحدة وقت الإقلاع + fc-cache مرة واحدة. ده مهم لأن
// fontconfig جوه sharp بيقرأ قايمة الخطوط مرة واحدة، فمينفعش نضيف خط وسط التشغيل.
async function initFonts() {
  const keys = Object.keys(FONT_MAP);
  const results = await Promise.allSettled(
    keys.map(async (key) => {
      const p = fontPathFor(key);
      if (fs.existsSync(p) && fs.statSync(p).size > 1024) return;
      await downloadFontFile(FONT_MAP[key], p);
    })
  );
  const failed = results.map((r, i) => (r.status === "rejected" ? keys[i] : null)).filter(Boolean);
  if (failed.length) logger.warn("fonts_prewarm_partial", { failed });

  if (await checkFontconfig()) {
    try {
      await execFileAsync("fc-cache", ["-f", FONTS_DIR]);
      logger.info("fontconfig_cache_refreshed", { dir: FONTS_DIR, fonts: keys.length - failed.length });
    } catch (e) {
      logger.warn("fontconfig_refresh_failed", { error: e.message });
    }
  }
}

export const fontsReady = initFonts().catch((e) => {
  logger.error("fonts_init_failed", { error: e.message });
});

const fontDataCache = new Map();

/**
 * بيرجّع { path, family, base64 }.
 * base64 = null لما fontconfig شغال (الأسرع)، وبيتملى بس كـ fallback لو fontconfig مش موجود.
 */
export async function ensureFont(fontFamily) {
  await fontsReady;
  const key = normalizeFontFamily(fontFamily);
  if (fontDataCache.has(key)) return fontDataCache.get(key);

  const p = fontPathFor(key);
  if (!fs.existsSync(p)) {
    if (key === "Amiri") throw new Error("Amiri font is unavailable");
    logger.warn("font_missing_fallback_amiri", { key });
    return ensureFont("Amiri");
  }
  const hasFc = await checkFontconfig();
  const result = { path: p, family: key, base64: hasFc ? null : fs.readFileSync(p).toString("base64") };
  fontDataCache.set(key, result);
  return result;
}

// متحفوظة للتوافق مع الكود القديم — الـ cache بقى بيتعمل مرة واحدة في initFonts
export async function refreshFontCache() { await fontsReady; }
export async function isUsingSystemFonts() { return checkFontconfig(); }
