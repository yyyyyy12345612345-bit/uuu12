import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { URL } from "url";
import { ALLOWED_DOMAINS } from "../config.js";
import { logger } from "./logger.js";

export function validateUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (!["http:", "https:"].includes(u.protocol)) return false;
    const hostname = u.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export function safePath(base, filename) {
  const resolved = path.resolve(base, filename);
  const baseResolved = path.resolve(base);
  if (resolved !== baseResolved && !resolved.startsWith(baseResolved + path.sep)) {
    throw new Error("Path traversal detected!");
  }
  return resolved;
}

export function hashKey(str) {
  return crypto.createHash("sha256").update(str).digest("hex").slice(0, 24);
}

function normalizeUrl(rawUrl) {
  let decodedUrl = rawUrl;
  try {
    decodedUrl = decodeURIComponent(rawUrl);
  } catch {
    try {
      decodedUrl = decodeURI(rawUrl);
    } catch {
      // نسيب decodedUrl زي ما هو لو فشل الفك
    }
  }

  if (decodedUrl.startsWith("https://verses.quran.com///")) {
    decodedUrl = "https://" + decodedUrl.substring("https://verses.quran.com///".length);
  } else if (decodedUrl.includes("verses.quran.com//")) {
    decodedUrl = decodedUrl.replace("verses.quran.com//", "verses.quran.com/");
  }
  return decodedUrl;
}

// تحميل ملف مع: تحقق أمني + timeout + إعادة محاولة واحدة عند فشل الشبكة المؤقت
export async function downloadFile(url, dest, { timeoutMs = 30000, retries = 1 } = {}) {
  const decodedUrl = normalizeUrl(url);
  if (!validateUrl(decodedUrl)) {
    throw new Error(`URL غير مسموح به أمنياً: ${decodedUrl}`);
  }
  const parsedUrl = new URL(decodedUrl);

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(parsedUrl.href, { signal: controller.signal });
      if (!res.ok) throw new Error(`Download failed (${res.status}): ${parsedUrl.href}`);
      const ws = fs.createWriteStream(dest);
      await finished(Readable.fromWeb(res.body).pipe(ws));
      clearTimeout(timer);
      return;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      logger.warn("download_retry", { url: parsedUrl.href, attempt, error: e.message });
    }
  }
  throw lastErr;
}
