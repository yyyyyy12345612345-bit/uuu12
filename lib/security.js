import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { URL } from "url";
import { isDomainAllowed, MAX_DOWNLOAD_MB } from "../config.js";
import { logger } from "./logger.js";

export function validateUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (!["http:", "https:"].includes(u.protocol)) return false;
    const hostname = u.hostname.toLowerCase();
    return isDomainAllowed(hostname);
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

// هدف إعادة توجيه (redirect) آمن: https فقط، مش IP مباشر، مش localhost/شبكة داخلية.
// (الرابط الأول لازم يكون في الـ allowlist، لكن الـ CDN ممكن يحوّل لدومين تاني شرعي.)
function isSafeRedirectTarget(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return false;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h) || h.includes(":")) return false; // IPv4/IPv6 literal
    return true;
  } catch {
    return false;
  }
}

const MAX_BYTES = MAX_DOWNLOAD_MB * 1024 * 1024;

// تحميل ملف مع: تحقق أمني + timeout + إعادة محاولة + تتبّع redirects يدوياً (بحد أقصى 4)
// + سقف لحجم الملف عشان رابط ضخم ما يملاش الديسك.
export async function downloadFile(url, dest, { timeoutMs = 30000, retries = 1 } = {}) {
  const decodedUrl = normalizeUrl(url);
  if (!validateUrl(decodedUrl)) {
    throw new Error(`URL غير مسموح به أمنياً: ${decodedUrl}`);
  }

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let current = new URL(decodedUrl).href;
      let res;
      for (let hop = 0; hop <= 4; hop++) {
        res = await fetch(current, {
          headers: { "x-render-server": "true", "User-Agent": "HyperRender-Node/v24" },
          redirect: "manual",
          signal: controller.signal,
        });
        if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
          const next = new URL(res.headers.get("location"), current).href;
          if (!validateUrl(next) && !isSafeRedirectTarget(next)) {
            throw new Error(`Redirect to disallowed target blocked: ${next}`);
          }
          current = next;
          continue;
        }
        break;
      }
      if (!res.ok) throw new Error(`Download failed (${res.status}): ${current}`);

      const declared = parseInt(res.headers.get("content-length") || "0", 10);
      if (declared > MAX_BYTES) throw new Error(`File too large (${Math.round(declared / 1048576)}MB > ${MAX_DOWNLOAD_MB}MB)`);

      let received = 0;
      const limiter = new (await import("stream")).Transform({
        transform(chunk, _enc, cb) {
          received += chunk.length;
          if (received > MAX_BYTES) return cb(new Error(`File exceeded ${MAX_DOWNLOAD_MB}MB limit`));
          cb(null, chunk);
        },
      });
      const ws = fs.createWriteStream(dest);
      await finished(Readable.fromWeb(res.body).pipe(limiter).pipe(ws));
      clearTimeout(timer);
      return;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      try { fs.rmSync(dest, { force: true }); } catch {}
      logger.warn("download_retry", { url: decodedUrl, attempt, error: e.message });
    }
  }
  throw lastErr;
}
