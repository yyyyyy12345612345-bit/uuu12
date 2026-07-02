import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";
import { FONTS_DIR, FONT_MAP } from "../config.js";
import { safePath } from "./security.js";
import { logger } from "./logger.js";
import { Readable } from "stream";
import { finished } from "stream/promises";

// تحميل مباشر بدون أي فك ترميز للرابط: روابط الخطوط جايه من FONT_MAP الثابت
// (مش من مدخلات المستخدم)، وبعضها فيه %5B %5D (أقواس محور الخط المتغيّر)
// لازم تفضل زي ما هي وإلا GitHub بيرجع 404.
async function downloadFontFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Font download failed (${res.status}): ${url}`);
  const fs2 = await import("fs");
  const ws = fs2.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(ws));
}

const execAsync = promisify(exec);

if (!fs.existsSync(FONTS_DIR)) fs.mkdirSync(FONTS_DIR, { recursive: true });

// بنكتب فونتات.conf مخصص يضيف مجلد FONTS_DIR لمسارات البحث، ونوجّه
// fontconfig ليه عبر FONTCONFIG_FILE، عشان librsvg (اللي sharp بيستخدمها لرسم
// الـ SVG) تقدر تلاقي الخطوط بالاسم من غير ما نحتاج نضمّن base64 في كل فريم.
function setupFontconfigFile() {
  const confPath = path.resolve(os.tmpdir(), "hyper_render_fonts.conf");
  const conf = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONTS_DIR}</dir>
  <dir>/usr/share/fonts</dir>
  <dir>/usr/local/share/fonts</dir>
  <cachedir>${path.resolve(os.tmpdir(), "fontconfig_cache")}</cachedir>
</fontconfig>`;
  fs.writeFileSync(confPath, conf);
  process.env.FONTCONFIG_FILE = confPath;
  return confPath;
}
setupFontconfigFile();

// لو fontconfig متاح في الكونتينر، بنسجل مجلد الخطوط عنده مرة واحدة بدل ما نضمّن
// base64 كامل للخط جوه كل SVG لكل فريم (كان بيبطّئ الرندرة جدًا مع فيديو طويل).
// لو مش متاح (بيئة تطوير محلية بدون fontconfig)، بنرجع لطريقة base64 كـ fallback تلقائي.
let fontconfigAvailable = null;

async function checkFontconfig() {
  if (fontconfigAvailable !== null) return fontconfigAvailable;
  try {
    await execAsync("fc-cache --version");
    fontconfigAvailable = true;
  } catch {
    fontconfigAvailable = false;
    logger.warn("fontconfig_unavailable_fallback_to_base64_embedding");
  }
  return fontconfigAvailable;
}

const fontDataCache = new Map(); // fontFamily -> { path, base64 }
let fcCacheRefreshed = false;

export async function ensureFont(fontFamily) {
  const fontKey = fontFamily || "Amiri";
  if (fontDataCache.has(fontKey)) return fontDataCache.get(fontKey);

  const safeName = fontKey.replace(/[^a-zA-Z0-9-]/g, "_");
  const fontPath = safePath(FONTS_DIR, `${safeName}.ttf`);
  const url = FONT_MAP[fontKey] || FONT_MAP["Amiri"];

  if (!fs.existsSync(fontPath)) {
    try {
      await downloadFontFile(url, fontPath);
    } catch (e) {
      logger.warn("font_download_failed_fallback_amiri", { fontKey, error: e.message });
      return ensureFont("Amiri");
    }
  }

  const hasFc = await checkFontconfig();
  const result = { path: fontPath, base64: null, family: fontKey };
  if (!hasFc) {
    // fallback: نحتاج الـ base64 عشان نضمّنه كـ @font-face
    result.base64 = fs.readFileSync(fontPath).toString("base64");
  }
  fontDataCache.set(fontKey, result);
  return result;
}

// يتنادى مرة واحدة بعد ما كل الخطوط المطلوبة اتنزلت، عشان fontconfig يشوفها
export async function refreshFontCache() {
  const hasFc = await checkFontconfig();
  if (!hasFc || fcCacheRefreshed) return;
  try {
    await execAsync(`fc-cache -f "${FONTS_DIR}"`);
    fcCacheRefreshed = true;
    logger.info("fontconfig_cache_refreshed", { dir: FONTS_DIR });
  } catch (e) {
    logger.warn("fontconfig_refresh_failed", { error: e.message });
  }
}

export async function isUsingSystemFonts() {
  return checkFontconfig();
}
