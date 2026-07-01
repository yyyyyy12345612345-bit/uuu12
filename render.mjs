/**
 * ⚡ HYPER RENDER v22 — THE ULTIMATE SPEED DEMON
 * ==================================================
 * ✅ Sharp Composite: الدمج في الذاكرة (أسرع 100 مرة)
 * ✅ Fast Portrait Crop: قص الخلفية تلقائياً لتناسب الموبايل
 * ✅ Video & Image Support: دعم كامل للفيديوهات والصور كخلفية
 * ✅ Custom Fonts & Overlays: دعم كامل لجميع الخطوط والتأثيرات البصرية
 * ✅ Watermarks & Social Handles: دعم الحسابات المخصصة والعلامة المائية
 * ✅ Concat Engine: تجميع الفيديو في ثوانٍ معدودة بدون استهلاك معالج
 * ✅ Zero Chromium Memory Leak: لا يحتاج لمتصفح كروم نهائياً
 */

import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import os from "os";
import { Readable } from "stream";
import { finished } from "stream/promises";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import crypto from "crypto";
import sharp from "sharp";
import { URL } from "url";

const execAsync = promisify(exec);
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const SHEIKH_ASSETS = {
  minsh: {
    id: "minsh",
    nameAr: "الشيخ محمد صديق المنشاوي",
    nameEn: "Mohammad Siddiq Al-Minshawi",
    photoUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782848606/%D9%85%D9%86%D8%B4%D8%A7%D9%88%D9%8A_filgf2.jpg",
    calligraphyUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782885918/%D8%AA%D9%88%D9%82%D9%8A%D8%B9_%D8%A7%D9%84%D9%85%D9%86%D8%B4%D8%A7%D9%88%D9%8Side_u3ytsf.png"
  },
  yasser: {
    id: "yasser",
    nameAr: "الشيخ ياسر الدوسري",
    nameEn: "Yasser Al-Dossary",
    photoUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782863138/Sheikh_Yasser_Al_Dosari_qm0gsf.jpg",
    calligraphyUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782887640/%D8%AA%D9%88%D9%82%D9%8A%D8%B9_%D9%8A%D8%A7%D8%B3%D8%B1_%D8%A7%D9%84%D8%AF%D9%88%D8%B3%D8%B1%D9%8A_pt1fbe.png"
  },
  husr: {
    id: "husr",
    nameAr: "الشيخ محمود خليل الحصري",
    nameEn: "Mahmoud Khalil Al-Husary",
    photoUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782885361/%D8%A7%D9%84%D8%B4%D9%8A%D8%AE_%D8%A7%D9%84%D8%AD%D8%B5%D8%B1%D9%8A_vhdgba.jpg",
    calligraphyUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782887638/%D8%AA%D9%88%D9%82%D9%8A%D8%B9_%D8%A7%D9%84%D8%AD%D8%B5%D8%B1%D9%8A_uaymqw.png"
  },
  basit: {
    id: "basit",
    nameAr: "الشيخ عبدالباسط عبدالصمد",
    nameEn: "Abdul Basit Abdul Samad",
    photoUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782885144/%D8%B9%D8%A8%D8%AF_%D8%A7%D9%84%D8%A8%D8%A7%D8%B3%D8%B7_ykv3aw.jpg",
    calligraphyUrl: "https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782885233/%D8%AA%D9%88%D9%82%D9%8A%D8%B9_%D8%B9%D8%A8%D8%AF_%D8%A7%D9%84%D8%A8%D8%A7%D8%B3%D8%B7_m05p8o.png"
  }
};

function getSheikhAsset(reciterId) {
  const cleanId = reciterId || "";
  if (cleanId.includes("minsh")) return SHEIKH_ASSETS.minsh;
  if (cleanId.includes("yasser")) return SHEIKH_ASSETS.yasser;
  if (cleanId.includes("husr")) return SHEIKH_ASSETS.husr;
  if (cleanId.includes("basit")) return SHEIKH_ASSETS.basit;
  return SHEIKH_ASSETS.minsh;
}

const RENDERS_DIR = path.resolve(os.tmpdir(), "renders_output");
const FONTS_DIR = path.resolve(os.tmpdir(), "fonts_cache");
const WIDTH = 720, HEIGHT = 1280;
const HOST = process.env.RENDER_HOST || "yousef891238-render-server.hf.space";

[RENDERS_DIR, FONTS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const FONT_MAP = {
  "Amiri": "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Regular.ttf",
  "Amiri-Bold": "https://github.com/google/fonts/raw/main/ofl/amiri/Amiri-Bold.ttf",
  "Noto Naskh Arabic": "https://github.com/google/fonts/raw/main/ofl/notonaskharabic/NotoNaskhArabic%5Bwght%5D.ttf",
  "Scheherazade New": "https://github.com/google/fonts/raw/main/ofl/scheherazadenew/ScheherazadeNew-Regular.ttf",
  "Lateef": "https://github.com/google/fonts/raw/main/ofl/lateef/Lateef-Regular.ttf",
  "Cairo": "https://github.com/google/fonts/raw/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf",
  "Tajawal": "https://github.com/google/fonts/raw/main/ofl/tajawal/Tajawal-Regular.ttf",
  "Reem Kufi": "https://github.com/google/fonts/raw/main/ofl/reemkufi/static/ReemKufi-Regular.ttf",
  "Lalezar": "https://github.com/google/fonts/raw/main/ofl/lalezar/Lalezar-Regular.ttf",
  "El Messiri": "https://github.com/google/fonts/raw/main/ofl/elmessiri/static/ElMessiri-Regular.ttf",
  "Almarai": "https://github.com/google/fonts/raw/main/ofl/almarai/Almarai-Regular.ttf",
  "Aref Ruqaa": "https://github.com/google/fonts/raw/main/ofl/arefruqaa/ArefRuqaa-Regular.ttf",
  "Alexandria": "https://github.com/google/fonts/raw/main/ofl/alexandria/static/Alexandria-Regular.ttf",
};

const ALLOWED_DOMAINS = [
  "everyayah.com", "quran.com", "cdn.islamic.network", "verses.quran.com",
  "quranicaudio.com", "mirrors.quranicaudio.com",
  "raw.githubusercontent.com", "github.com", "mp3quran.net",
  "server8.mp3quran.net", "server7.mp3quran.net", "server6.mp3quran.net",
  "server10.mp3quran.net", "server11.mp3quran.net", "server12.mp3quran.net",
  "ia800601.us.archive.org", "archive.org",
  "images.pexels.com", "videos.pexels.com", "images.unsplash.com",
  "pexels.com", "pixabay.com", "cdn.pixabay.com",
  "player.vimeo.com", "vimeo.com", "res.cloudinary.com", "cloudinary.com",
];

const jobs = new Map();
const durationCache = new Map();

// ═══ الحماية الأمنية ═══
function validateUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (!["http:", "https:"].includes(u.protocol)) return false;
    const hostname = u.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith(`.${d}`));
  } catch { return false; }
}

function safePath(base, filename) {
  const resolved = path.resolve(base, filename);
  if (!resolved.startsWith(path.resolve(base))) throw new Error("Path traversal detected!");
  return resolved;
}

// تنظيف دوري للملفات القديمة
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt && now - job.createdAt > 2 * 60 * 60 * 1000) jobs.delete(id);
  }
}, 15 * 60 * 1000);

async function downloadFile(url, dest) {
  let decodedUrl = url;
  try {
    decodedUrl = decodeURIComponent(url);
  } catch (e) {
    try {
      decodedUrl = decodeURI(url);
    } catch (err) {}
  }
  
  if (!validateUrl(decodedUrl)) throw new Error(`URL غير مسموح به أمنياً: ${url}`);
  
  const parsedUrl = new URL(decodedUrl);
  const res = await fetch(parsedUrl.href);
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${parsedUrl.href}`);
  const ws = fs.createWriteStream(dest);
  await finished(Readable.fromWeb(res.body).pipe(ws));
}

async function getDuration(filePath) {
  if (durationCache.has(filePath)) return durationCache.get(filePath);
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath.replace(/"/g, '\\"')}"`,
      { timeout: 15000 }
    );
    const d = parseFloat(stdout.trim());
    const finalDur = isNaN(d) || d <= 0 ? 5 : d;
    durationCache.set(filePath, finalDur);
    return finalDur;
  } catch { return 5; }
}

// تقسيم النصوص العربية — مساحة أوسع لتقليل عدد الأسطر
function wrapText(text, fontSize, maxWidth) {
  if (!text) return [];
  // النص العربي المشكّل: كل حرف يأخذ مساحة أكبر بسبب التشكيل
  const hasHarakat = /[\u064B-\u065F]/.test(text);
  // تقليل النسبة لزيادة المساحة المسموحة للكلمات
  const ratio = hasHarakat ? 0.45 : 0.40;
  const charWidth = fontSize * ratio;
  // مضاعفة عدد الأحرف المسموحة بنسبة كبيرة
  const maxChars = Math.max(20, Math.floor((maxWidth * 1.6) / charWidth));
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

function escapeXml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// ═══ إدارة الخطوط ═══
async function ensureFont(fontFamily) {
  const fontKey = fontFamily || "Amiri";
  const safeName = fontKey.replace(/[^a-zA-Z0-9-]/g, "_");
  const fontPath = safePath(FONTS_DIR, `${safeName}.ttf`);
  if (fs.existsSync(fontPath)) return fontPath;
  const url = FONT_MAP[fontKey] || FONT_MAP["Amiri"];
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const fileStream = fs.createWriteStream(fontPath);
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
    return fontPath;
  } catch (e) {
    console.warn(`⚠️ فشل تحميل خط ${fontKey}، سيتم استخدام Amiri`);
    const fallback = safePath(FONTS_DIR, "Amiri.ttf");
    if (!fs.existsSync(fallback)) {
      const res = await fetch(FONT_MAP["Amiri"]);
      const fileStream = fs.createWriteStream(fallback);
      await finished(Readable.fromWeb(res.body).pipe(fileStream));
    }
    return fallback;
  }
}

// تزيين رقم الآية حسب الاختيار
function getAyahDecoration(verseId, style) {
  switch (style) {
    case "none": return String(verseId);
    case "bracket2": return `﴾ ${verseId} ﴿`;
    case "star": return `✧ ${verseId} ✧`;
    case "diamond": return `✥ ${verseId} ✥`;
    case "ornament": return `۞ ${verseId} ۞`;
    default: return `﴿ ${verseId} ﴾`;
  }
}

function applyFilterToSVG(svg, filterName) {
  if (filterName === "none" || filterName === "original") return svg;
  const filterId = "cf";
  const flt = makeFilter(filterName, filterId);
  if (!flt) return svg;
  const defsEnd = svg.indexOf("</defs>");
  const svgEnd = svg.lastIndexOf("</svg>");
  if (defsEnd === -1 || svgEnd === -1) return svg;
  return svg.slice(0, defsEnd + 7) + flt + `<g filter="url(#${filterId})">` + svg.slice(defsEnd + 7, svgEnd) + `</g>` + svg.slice(svgEnd);
}

function makeFilter(name, id) {
  const bc = (bright, contrast) =>
    `<feComponentTransfer><feFuncR type="linear" slope="${(bright * contrast).toFixed(4)}" intercept="${(0.5 * bright * (1 - contrast)).toFixed(4)}"/><feFuncG type="linear" slope="${(bright * contrast).toFixed(4)}" intercept="${(0.5 * bright * (1 - contrast)).toFixed(4)}"/><feFuncB type="linear" slope="${(bright * contrast).toFixed(4)}" intercept="${(0.5 * bright * (1 - contrast)).toFixed(4)}"/></feComponentTransfer>`;
  const sat = (s) => { const a = (1 - s) / 3; return `<feColorMatrix type="matrix" values="${a + s} ${a} ${a} 0 0  ${a} ${a + s} ${a} 0 0  ${a} ${a} ${a + s} 0 0  0 0 0 1 0"/>`; };
  const sep = (s) => { const a = 1 - s; return `<feColorMatrix type="matrix" values="${a + s * 0.393} ${s * 0.769} ${s * 0.189} 0 0  ${s * 0.349} ${a + s * 0.686} ${s * 0.168} 0 0  ${s * 0.272} ${s * 0.534} ${a + s * 0.131} 0 0  0 0 0 1 0"/>`; };
  const gray = () => `<feColorMatrix type="matrix" values="0.333 0.333 0.333 0 0  0.333 0.333 0.333 0 0  0.333 0.333 0.333 0 0  0 0 0 1 0"/>`;
  const hue = (deg) => `<feColorMatrix type="hueRotate" values="${deg}"/>`;
  const bri = (b) => `<feComponentTransfer><feFuncR type="linear" slope="${b}"/><feFuncG type="linear" slope="${b}"/><feFuncB type="linear" slope="${b}"/></feComponentTransfer>`;
  const con = (c) => `<feComponentTransfer><feFuncR type="linear" slope="${c}" intercept="${0.5 * (1 - c)}"/><feFuncG type="linear" slope="${c}" intercept="${0.5 * (1 - c)}"/><feFuncB type="linear" slope="${c}" intercept="${0.5 * (1 - c)}"/></feComponentTransfer>`;

  const defs = {
    vintage: [sep(0.5), bc(0.8, 1.1)],
    cool: [sat(0.8), hue(20), bri(1.1)],
    warm: [sat(1.4), hue(-10), bri(1.1)],
    bw: [gray(), bc(0.9, 1.3)],
    dramatic: [con(1.5), bri(0.6), sat(1.3)],
    blur: [bri(0.7), `<feGaussianBlur stdDeviation="30"/>`],
    sepia: [sep(1), bc(1.2, 0.8)],
    midnight: [bri(0.5), con(1.3), sat(0.7), hue(20)],
    oceanic: [hue(170), bri(1.2), sat(1.3), con(1.1)],
    saturated: [sat(3), con(1.2)],
    cinematic: [con(1.4), sat(1.6), bri(0.85), sep(0.1)],
    golden: [bri(1.1), sat(1.3), sep(0.35), hue(-5)],
    teal_orange: [con(1.2), sat(1.1), sep(0.15), hue(5), bri(1.05)],
    noir: [gray(), con(1.5), bri(0.85)],
    dreamy: [bri(1.15), sat(0.7), con(0.9), sep(0.15)],
    neon: [sat(2.5), con(1.3), hue(300), bri(1.2)],
    pastel: [sat(0.5), bri(1.2), con(0.85), sep(0.2)],
    lut_autumn: [sep(0.6), sat(1.4), hue(-20), bri(1.0)],
    lut_forest: [sep(0.3), sat(1.2), hue(80), bri(0.9)],
    high_contrast: [con(2), bri(0.8), sat(1.5)],
    faded: [bri(1.1), con(0.7), sat(0.4), sep(0.3)],
    vignette: [bri(0.9), con(1.3), sat(1.1)],
    cross_process: [con(1.3), sat(0.7), sep(0.4), hue(20), bri(0.9)],
  };
  const parts = defs[name];
  if (!parts) return "";
  return `<filter id="${id}">${parts.join("")}</filter>`;
}

// تطبيق overlay على SVG
function applyOverlayToSVG(svg, overlayName) {
  if (overlayName === "none" || !overlayName) return svg;
  let overlaySVG = "";
  switch (overlayName) {
    case "dust":
      overlaySVG = `<rect width="100%" height="100%" opacity="0.06" filter="url(#dustFilter)"><animate attributeName="opacity" values="0.03;0.07;0.03" dur="4s" repeatCount="indefinite"/></rect>`;
      break;
    case "rays":
      overlaySVG = `<rect width="100%" height="100%" fill="url(#raysGrad)" opacity="0.2"/>`;
      break;
    case "bokeh":
      overlaySVG = `<circle cx="100" cy="200" r="60" fill="rgba(255,255,255,0.05)"/><circle cx="600" cy="400" r="40" fill="rgba(255,255,255,0.04)"/><circle cx="300" cy="900" r="80" fill="rgba(255,255,255,0.03)"/><circle cx="500" cy="1100" r="50" fill="rgba(255,255,255,0.04)"/>`;
      break;
    case "rain":
      overlaySVG = `<g opacity="0.35">${Array.from({ length: 40 }, (_, i) => `<line x1="${Math.random() * 720}" y1="${-20 + Math.random() * 100}" x2="${6 + Math.random() * 8 - 8 + Math.random() * 720}" y2="${1300 + Math.random() * 200}" stroke="rgba(174,194,224,0.5)" stroke-width="1.5"/>`).join('')}</g>`;
      break;
    case "snow":
      overlaySVG = `<g opacity="0.6">${Array.from({ length: 30 }, (_, i) => `<circle cx="${Math.random() * 720}" cy="${Math.random() * 1280}" r="${1 + Math.random() * 3}" fill="white" opacity="${0.3 + Math.random() * 0.5}"><animate attributeName="cy" values="${-20};${1300}" dur="${5 + Math.random() * 8}s" repeatCount="indefinite"/><animate attributeName="cx" values="${Math.random() * 720};${Math.random() * 720}" dur="${5 + Math.random() * 8}s" repeatCount="indefinite"/></circle>`).join('')}</g>`;
      break;
    case "fireflies":
      overlaySVG = `<g>${Array.from({ length: 15 }, (_, i) => `<circle cx="${Math.random() * 720}" cy="${Math.random() * 1280}" r="${1.5 + Math.random() * 2.5}" fill="#D4AF37" opacity="0.4"><animate attributeName="opacity" values="0.1;0.9;0.1" dur="${2 + Math.random() * 3}s" repeatCount="indefinite"/></circle>`).join('')}</g>`;
      break;
    case "smoke":
      overlaySVG = `<g opacity="0.12">${Array.from({ length: 6 }, (_, i) => `<circle cx="${100 + Math.random() * 520}" cy="${1100 + Math.random() * 200}" r="${100 + Math.random() * 150}" fill="rgba(255,255,255,0.06)"><animate attributeName="cy" values="${1100 + Math.random() * 100};${-100}" dur="${10 + Math.random() * 15}s" repeatCount="indefinite"/><animate attributeName="r" values="${50 + Math.random() * 50};${150 + Math.random() * 150}" dur="${10 + Math.random() * 15}s" repeatCount="indefinite"/></circle>`).join('')}</g>`;
      break;
    case "sparkle":
      overlaySVG = `<g>${Array.from({ length: 12 }, (_, i) => `<text x="${Math.random() * 660 + 30}" y="${Math.random() * 1180 + 50}" font-size="${10 + Math.random() * 14}" fill="#FFD700" opacity="${0.3 + Math.random() * 0.5}" text-anchor="middle">✦</text>`).join('')}</g>`;
      break;
    case "film_grain":
      overlaySVG = `<rect width="100%" height="100%" opacity="0.08" fill="#888" filter="url(#grainFilter)" mix-blend-mode="overlay"/>`;
      break;
    case "light_leak":
      overlaySVG = `<rect width="100%" height="100%" fill="url(#leakGrad)" opacity="0.3" mix-blend-mode="screen"/>`;
      break;
    case "aurora":
      overlaySVG = `<rect width="100%" height="100%" fill="url(#auroraGrad)" opacity="0.3" mix-blend-mode="color-dodge"/>`;
      break;
  }
  if (!overlaySVG) return svg;
  let result = svg;
  if (overlayName === "film_grain") {
    result = result.replace("<defs>", `<defs><filter id="grainFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise"/><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.15 0" in="noise"/></filter>`);
  }
  if (overlayName === "light_leak") {
    result = result.replace("<defs>", `<defs><radialGradient id="leakGrad"><stop offset="0%" stop-color="rgba(255,99,71,0.4)"/><stop offset="40%" stop-color="rgba(255,165,0,0.2)"/><stop offset="100%" stop-color="transparent"/></radialGradient>`);
  }
  if (overlayName === "aurora") {
    result = result.replace("<defs>", `<defs><linearGradient id="auroraGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="rgba(0,255,136,0.3)"/><stop offset="50%" stop-color="rgba(0,136,255,0.3)"/><stop offset="100%" stop-color="rgba(200,0,255,0.3)"/></linearGradient>`);
  }
  if (overlayName === "dust") {
    result = result.replace("<defs>", `<defs><filter id="dustFilter"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4"/><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.4 0"/><feBlend mode="screen" in2="SourceGraphic"/></filter>`);
  }
  if (overlayName === "rays") {
    result = result.replace("<defs>", `<defs><linearGradient id="raysGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="rgba(255,255,255,0)"/><stop offset="30%" stop-color="rgba(255,255,255,0)"/><stop offset="50%" stop-color="rgba(255,255,255,0.03)"/><stop offset="70%" stop-color="rgba(255,255,255,0)"/><stop offset="100%" stop-color="rgba(255,255,255,0)"/></linearGradient>`);
  }
  return result.replace("</svg>", `${overlaySVG}</svg>`);
}

// رسم إطارات الآيات (SVG)
async function generateVerseFrame(verse, outputPath, settings, bgPath, isVideoBg = false, fontBase64 = null, amiriBase64 = null, animState = null, elapsedSeconds = 0, totalDuration = 0, templatePhotoBase64 = "", calligraphyBase64 = "") {
  const { fontSize = 50, fontWeight = 700, fontFamily = "Amiri", textColor = "#ffffff", textPosition = "center", textVerticalOffset = 0, surahName = "", userPlan = "free", instaHandle = "", tiktokHandle = "", filter = "none", overlay = "none", ayahDecoration = "bracket1", videoTemplate = "default", reciterName = "Sheikh Muhammad Siddiq Al-Minshawi", reciterId } = settings;

  const opacity = animState ? animState.opacity : 1;
  const verticalOffset = animState ? animState.offsetY : 0;
  const scale = animState ? animState.scale : 1;
  const activeWordIdx = (animState && videoTemplate !== "default") ? animState.activeWordIndex : -1;

  const scaledFontSize = Math.min(Math.max(fontSize * 1.6, 40), 110);
  const translationFontSize = Math.min(Math.max(fontSize * 0.65, 28), 40);
  // ارتفاع سطر كبير جداً لمنع تداخل التشكيل مع السطر التالي
  const lineH = scaledFontSize * 2.5;
  const tLineH = translationFontSize * 2.0;
  const textW = Math.floor(WIDTH * 0.82);
  const centerX = WIDTH / 2;

  const vLines = wrapText(verse.text || "", scaledFontSize, textW);
  const tLines = verse.translation ? wrapText(verse.translation, translationFontSize, textW) : [];

  const VERSE_H = vLines.length * lineH;
  const SEP_H = 48;
  const TRANS_H = tLines.length > 0 ? tLines.length * tLineH + 20 : 0;
  const ORNAMENT_H = 60;
  const totalH = VERSE_H + SEP_H + TRANS_H + ORNAMENT_H;

  let startY;
  if (textPosition === "top") startY = 200;
  else if (textPosition === "bottom") startY = Math.max(80, HEIGHT - totalH - 120);
  else startY = Math.max(80, (HEIGHT - totalH) / 2);
  startY = Math.max(160, Math.min(startY, HEIGHT - totalH - 60)) + (textVerticalOffset || 0) + verticalOffset;

  let curY = startY;
  const svgWeight = fontWeight >= 700 ? "bold" : fontWeight >= 500 ? "600" : "normal";

  const badgeSVG = surahName ? `
    <rect x="${(WIDTH - 240) / 2}" y="80" width="240" height="34" rx="17" fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    <text x="${centerX}" y="103" font-family="'${escapeXml(fontFamily)}', 'Amiri', serif" font-size="13" font-weight="600" fill="#FFD700" text-anchor="middle" letter-spacing="0.8">${escapeXml(surahName)} · ${escapeXml(String(verse.id || ""))}</text>` : "";

  const verseY = curY;
  const verseTSpans = vLines.map((line, i) => {
    if (activeWordIdx === -1) {
      return `<tspan x="${centerX}" dy="${i === 0 ? 0 : lineH}">${escapeXml(line)}</tspan>`;
    }
    const words = line.split(" ");
    const lineSpans = words.map((w, wIdx) => {
      const isHighlighted = wIdx === activeWordIdx;
      const color = isHighlighted ? "#FFD700" : escapeXml(textColor);
      return `<tspan fill="${color}">${escapeXml(w)} </tspan>`;
    }).join("");
    return `<tspan x="${centerX}" dy="${i === 0 ? 0 : lineH}">${lineSpans}</tspan>`;
  }).join("");
  curY += VERSE_H;

  const sepY = curY + 12;
  curY += SEP_H;

  const transY = curY;
  const transTSpans = tLines.map((line, i) => `<tspan x="${centerX}" dy="${i === 0 ? 0 : tLineH}">${escapeXml(line)}</tspan>`).join("");
  if (tLines.length > 0) curY += TRANS_H;

  const ornamentY = Math.min(curY + 28, HEIGHT - 180);

  // العلامة المائية للمستخدم المجاني (تمت إزالتها نهائياً بطلب المستخدم)
  let watermarkSVG = "";

  // حسابات شبكات التواصل
  let socialSVG = "";
  if (instaHandle || tiktokHandle) {
    let yPos = HEIGHT - 60;
    if (instaHandle) {
      socialSVG += `<text x="${centerX}" y="${yPos}" font-family="Arial" font-size="20" font-weight="bold" fill="rgba(255,255,255,0.8)" text-anchor="middle">Insta: @${escapeXml(instaHandle)}</text>`;
      yPos -= 30;
    }
    if (tiktokHandle) {
      socialSVG += `<text x="${centerX}" y="${yPos}" font-family="Arial" font-size="20" font-weight="bold" fill="rgba(255,255,255,0.8)" text-anchor="middle">TikTok: @${escapeXml(tiktokHandle)}</text>`;
    }
  }

  // تعتيم الخلفية للمشاهد
  const overlayGrad = `<linearGradient id="overlayGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(0,0,0,0.55)"/><stop offset="25%" stop-color="rgba(0,0,0,0.25)"/><stop offset="70%" stop-color="rgba(0,0,0,0.30)"/><stop offset="100%" stop-color="rgba(0,0,0,0.85)"/></linearGradient>`;

  const fontFaceDef = `
    <style>
      @font-face {
        font-family: 'Amiri';
        src: url(data:font/truetype;charset=utf-8;base64,${amiriBase64}) format('truetype');
      }
      ${fontFamily !== "Amiri" && fontBase64 ? `
      @font-face {
        font-family: '${escapeXml(fontFamily)}';
        src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
      }
      ` : ""}
      ${settings.naskhBase64 ? `
      @font-face {
        font-family: 'Noto Naskh Arabic';
        src: url(data:font/truetype;charset=utf-8;base64,${settings.naskhBase64}) format('truetype');
      }
      ` : ""}
    </style>
  `;

  // Stable bottom position for Ayah number (180px from bottom)
  const finalOrnamentY = HEIGHT - 180;

  // Transform origin for scale
  const transformOrigin = `${centerX}px ${startY + totalH / 2}px`;

  let innerContent = "";
  if (videoTemplate === "minshawi_player") {
    const elapsed = elapsedSeconds || 0;
    const total = totalDuration || 1;
    const progressPct = elapsed / total;

    // Time formatter helper
    const formatTime = (secs) => {
      if (isNaN(secs)) return "0:00";
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const barWidth = 480;
    const progressWidth = barWidth * Math.min(1, Math.max(0, progressPct));
    const handleX = 120 + progressWidth;

    innerContent = `
      <g opacity="${opacity}">
        <!-- Card Container -->
        <rect x="80" y="450" width="560" height="380" rx="95" fill="#000000" stroke="rgba(255, 255, 255, 0.05)" stroke-width="2" />
        
        <!-- Minshawi Photo Rounded -->
        <clipPath id="photoClip">
          <rect x="190" y="475" width="340" height="200" rx="45" />
        </clipPath>
        <image href="data:image/jpeg;base64,${templatePhotoBase64}" x="190" y="475" width="340" height="200" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)" />
        
        <!-- Surah Title & Reciter Name (Left aligned) -->
        <text x="190" y="707" font-family="'Noto Naskh Arabic', serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="start">${escapeXml(surahName || "سورة")}</text>
        <text x="190" y="733" font-family="'Cairo', sans-serif" font-size="15" fill="rgba(255, 255, 255, 0.5)" text-anchor="start">${escapeXml(reciterName)}</text>
        
        <!-- Progress Bar -->
        <rect x="190" y="760" width="340" height="4" rx="2" fill="rgba(255, 255, 255, 0.2)" />
        <rect x="190" y="760" width="${340 * Math.min(1, Math.max(0, progressPct))}" height="4" rx="2" fill="#ffffff" />
        <circle cx="${190 + 340 * Math.min(1, Math.max(0, progressPct))}" cy="762" r="6" fill="#ffffff" />
        
        <!-- Timestamps -->
        <text x="190" y="787" font-family="monospace" font-size="14" fill="rgba(255, 255, 255, 0.5)" text-anchor="start">${formatTime(elapsed)}</text>
        <text x="530" y="787" font-family="monospace" font-size="14" fill="rgba(255, 255, 255, 0.5)" text-anchor="end">${formatTime(total)}</text>
        
        <!-- Controls Row -->
        <!-- Heart Button (Outline) -->
        <g transform="translate(190, 793) scale(0.95)">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6"/>
        </g>
        
        <!-- Prev Button -->
        <g transform="translate(270, 793) scale(0.95)">
          <path d="M19 20L9 12l10-8v16z" fill="#ffffff" />
          <rect x="5" y="4" width="2" height="16" rx="0.5" fill="#ffffff" />
        </g>
        
        <!-- Play Button (Circle Pause) -->
        <circle cx="360" cy="805" r="22" fill="#ffffff" />
        <g transform="translate(352, 797) scale(0.8)">
          <rect x="3" y="4" width="4" height="12" rx="1" fill="#000000" />
          <rect x="11" y="4" width="4" height="12" rx="1" fill="#000000" />
        </g>
        
        <!-- Next Button -->
        <g transform="translate(426, 793) scale(0.95)">
          <path d="M5 4l10 8-10 8V4z" fill="#ffffff" />
          <rect x="17" y="4" width="2" height="16" rx="0.5" fill="#ffffff" />
        </g>
        
        <!-- Minus Circle -->
        <g transform="translate(506, 793) scale(0.95)">
          <circle cx="12" cy="12" r="10" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6" />
          <line x1="7" y1="12" x2="17" y2="12" stroke="#ffffff" stroke-width="2" opacity="0.6" />
        </g>
      </g>
    `;
  } else if (videoTemplate === "basit_player") {
    const startAyah = settings.startAyah || 1;
    const endAyah = settings.endAyah || 1;
    const elapsed = elapsedSeconds || 0;
    const total = totalDuration || 1;
    const progressPct = elapsed / total;

    const formatTime = (secs) => {
      if (isNaN(secs)) return "0:00";
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const cardW = 612;
    const cardH = 416;
    const cardX = (WIDTH - cardW) / 2;
    const cardY = (HEIGHT - cardH) / 2;

    const photoW = 257;
    const photoH = 295;
    const photoX = cardX + 24;
    const photoY = cardY + 24;

    const calligW = photoW;
    const calligH = 40;
    const calligX = photoX;
    const calligY = photoY + photoH + 12;

    const rightAreaX = photoX + photoW + 20;
    const rightAreaW = cardW - (photoW + 68);
    const textCenterX = rightAreaX + rightAreaW / 2;

    const naskhStartY = cardY + 110;

    const verseWords = (verse.text || "").split(/\s+/).filter(Boolean);
    const wordsPerLine = 4;
    const verseLines = [];
    for (let i = 0; i < verseWords.length; i += wordsPerLine) {
      verseLines.push(verseWords.slice(i, i + wordsPerLine).join(" "));
    }
    if (verseLines.length === 0 && verse.text) verseLines.push(verse.text);

    const ayahProg = settings.ayahProgress || 0;
    const activeLineIdx = Math.min(verseLines.length - 1, Math.floor(ayahProg * verseLines.length));
    const activeLineText = verseLines[activeLineIdx] || verse.text || "";

    const barWidth = rightAreaW - 20;
    const progressWidth = barWidth * progressPct;
    const barX = rightAreaX + 10;
    const barY = cardY + cardH - 120;
    const btnY = barY + 30;

    innerContent = `
      <g opacity="${opacity}">
        <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="50" fill="rgba(0, 0, 0, 0.65)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="2" filter="url(#softShadow)" />

        <clipPath id="basitPhotoClip">
          <rect x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" rx="35" />
        </clipPath>
        <rect x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" rx="35" fill="none" stroke="#ffffff" stroke-width="4" filter="url(#whiteGlow)" />
        <image href="data:image/jpeg;base64,${templatePhotoBase64}" x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#basitPhotoClip)" />

        ${calligraphyBase64 ? `
        <image href="data:image/png;base64,${calligraphyBase64}" x="${calligX}" y="${calligY}" width="${calligW}" height="${calligH}" preserveAspectRatio="xMidYMid contain" filter="invert(1) brightness(2)" />
        ` : ""}

        ${verse.text ? `
        <text x="${textCenterX}" y="${naskhStartY}" font-family="'Noto Naskh Arabic', serif" font-size="28" fill="#ffffff" text-anchor="middle" direction="rtl" filter="url(#textGlow)">
          ${escapeXml(activeLineText)}
        </text>
        ` : ""}

        <rect x="${barX}" y="${barY}" width="${barWidth}" height="4" rx="2" fill="rgba(255, 255, 255, 0.2)" />
        <rect x="${barX}" y="${barY}" width="${progressWidth}" height="4" rx="2" fill="#ffffff" />
        <circle cx="${barX + progressWidth}" cy="${barY + 2}" r="5" fill="#ffffff" />

        <text x="${barX}" y="${barY + 20}" font-family="monospace" font-size="10" fill="rgba(255, 255, 255, 0.5)" text-anchor="start">${formatTime(elapsed)}</text>
        <text x="${barX + barWidth}" y="${barY + 20}" font-family="monospace" font-size="10" fill="rgba(255, 255, 255, 0.5)" text-anchor="end">${formatTime(total)}</text>

        <g transform="translate(${barX}, ${btnY}) scale(0.8)">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6"/>
        </g>
        
        <g transform="translate(${barX + 50}, ${btnY}) scale(0.8)">
          <path d="M19 20L9 12l10-8v16z" fill="#ffffff" />
          <rect x="5" y="4" width="2" height="16" rx="0.5" fill="#ffffff" />
        </g>
        
        <circle cx="${rightAreaX + rightAreaW / 2}" cy="${btnY + 10}" r="18" fill="#ffffff" />
        <g transform="translate(${rightAreaX + rightAreaW / 2 - 9}, ${btnY - 1}) scale(0.75)">
          <rect x="3" y="4" width="5" height="16" rx="1" fill="#000000" />
          <rect x="12" y="4" width="5" height="16" rx="1" fill="#000000" />
        </g>
        
        <g transform="translate(${rightAreaX + rightAreaW - 75}, ${btnY}) scale(0.8)">
          <path d="M5 4l10 8-10 8V4z" fill="#ffffff" />
          <rect x="17" y="4" width="2" height="16" rx="0.5" fill="#ffffff" />
        </g>
        
        <g transform="translate(${rightAreaX + rightAreaW - 25}, ${btnY}) scale(0.8)">
          <circle cx="12" cy="12" r="10" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6" />
          <line x1="7" y1="12" x2="17" y2="12" stroke="#ffffff" stroke-width="2" opacity="0.6" />
        </g>
      </g>
    `;
  } else if (videoTemplate === "dossary_player") {
    const startAyah = settings.startAyah || 1;
    const endAyah = settings.endAyah || 1;
    const elapsed = elapsedSeconds || 0;
    const total = totalDuration || 1;
    const progressPct = elapsed / total;

    const formatTime = (secs) => {
      if (isNaN(secs)) return "0:00";
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const barWidth = 480;
    const progressWidth = barWidth * Math.min(1, Math.max(0, progressPct));

    const rightAreaW = 330;
    const rightAreaCenterX = 510;
    const scaledNaskhSize = 32;
    
    // Split verse into lines of 4 words each
    const verseWords = (verse.text || "").split(/\s+/).filter(Boolean);
    const wordsPerLine = 4;
    const verseLines = [];
    for (let i = 0; i < verseWords.length; i += wordsPerLine) {
      verseLines.push(verseWords.slice(i, i + wordsPerLine).join(" "));
    }
    if (verseLines.length === 0 && verse.text) verseLines.push(verse.text);
    
    // Pick active line based on per-ayah progress (not overall video progress)
    const ayahProg = settings.ayahProgress || 0;
    const activeLineIdx = Math.min(verseLines.length - 1, Math.floor(ayahProg * verseLines.length));
    const activeLineText = verseLines[activeLineIdx] || verse.text || "";
    const naskhStartY = 480 + 150 / 2 + 10;

    innerContent = `
      <g opacity="${opacity}">
        <!-- Active Verse Text (Naskh Font on the Right) - ONE LINE AT A TIME -->
        ${verse.text ? `
        <text x="${rightAreaCenterX}" y="${naskhStartY}" font-family="'Noto Naskh Arabic', serif" font-size="${scaledNaskhSize}" fill="#ffffff" text-anchor="middle" direction="rtl" filter="url(#textGlow)">
          ${escapeXml(activeLineText)}
        </text>
        ` : ""}

        <!-- Photo with border-radius rx = 35 for all 4 corners -->
        <clipPath id="photoClip">
          <rect x="70" y="480" width="240" height="320" rx="35" />
        </clipPath>
        <!-- Outer Glowing white border -->
        <rect x="70" y="480" width="240" height="320" rx="35" fill="none" stroke="#ffffff" stroke-width="4" filter="url(#whiteGlow)" />
        <image href="data:image/jpeg;base64,${templatePhotoBase64}" x="70" y="480" width="240" height="320" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)" />
        
        <!-- Progress Bar at y = 660 -->
        <rect x="360" y="660" width="300" height="4" rx="2" fill="rgba(255, 255, 255, 0.2)" />
        <rect x="360" y="660" width="${300 * Math.min(1, Math.max(0, progressPct))}" height="4" rx="2" fill="#ffffff" />
        <circle cx="${360 + 300 * Math.min(1, Math.max(0, progressPct))}" cy="662" r="5" fill="#ffffff" />
        
        <!-- Timestamps -->
        <text x="360" y="684" font-family="monospace" font-size="12" fill="rgba(255, 255, 255, 0.5)" text-anchor="start">${formatTime(elapsed)}</text>
        <text x="660" y="684" font-family="monospace" font-size="12" fill="rgba(255, 255, 255, 0.5)" text-anchor="end">${formatTime(total)}</text>
        
        <!-- Controls Row at y = 715 -->
        <!-- Heart Button (Outline) -->
        <g transform="translate(360, 715) scale(0.9)">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6"/>
        </g>
        
        <!-- Prev Button -->
        <g transform="translate(430, 715) scale(0.9)">
          <path d="M19 20L9 12l10-8v16z" fill="#ffffff" />
          <rect x="5" y="4" width="2" height="16" rx="0.5" fill="#ffffff" />
        </g>
        
        <!-- Play Button (Circle Pause) -->
        <circle cx="510" cy="726" r="20" fill="#ffffff" />
        <g transform="translate(501, 715) scale(0.8)">
          <rect x="3" y="4" width="5" height="16" rx="1" fill="#000000" />
          <rect x="12" y="4" width="5" height="16" rx="1" fill="#000000" />
        </g>
        
        <!-- Next Button -->
        <g transform="translate(590, 715) scale(0.9)">
          <path d="M5 4l10 8-10 8V4z" fill="#ffffff" />
          <rect x="17" y="4" width="2" height="16" rx="0.5" fill="#ffffff" />
        </g>
        
        <!-- Minus Circle -->
        <g transform="translate(660, 715) scale(0.9)">
          <circle cx="12" cy="12" r="10" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6" />
          <line x1="7" y1="12" x2="17" y2="12" stroke="#ffffff" stroke-width="2" opacity="0.6" />
        </g>

        <!-- Sheikh Name at bottom center (y = 1140) -->
        <text x="360" y="1140" font-family="'Inter', sans-serif" font-size="22" font-weight="500" fill="rgba(255, 255, 255, 0.6)" text-anchor="middle">
          ${escapeXml(getSheikhAsset(reciterId).nameEn)}
        </text>

        <!-- Small Ayah range/number at the very bottom center (y = 1170) -->
        <text x="360" y="1175" font-family="monospace" font-size="18" font-weight="bold" fill="rgba(255, 255, 255, 0.4)" text-anchor="middle">
          ${startAyah === endAyah ? `AYAH ${startAyah}` : `AYAH ${startAyah} - ${endAyah}`}
        </text>
      </g>
    `;
  } else {
    innerContent = `
      <g opacity="${opacity}" transform="scale(${scale})" style="transform-origin: ${transformOrigin}">
        ${badgeSVG}
        <text x="${centerX}" y="${verseY}" font-family="'${escapeXml(fontFamily)}', 'Amiri', serif" font-size="${scaledFontSize}" font-weight="${svgWeight}" fill="${escapeXml(textColor)}" text-anchor="middle" direction="rtl" filter="url(#textGlow)">${verseTSpans}</text>
        <rect x="${(WIDTH - 100) / 2}" y="${sepY}" width="100" height="1.5" rx="1" fill="rgba(212,175,55,0.5)"/>
        <circle cx="${centerX}" cy="${sepY + 0.75}" r="3" fill="rgba(212,175,55,0.6)"/>
        ${tLines.length > 0 ? `<text x="${centerX}" y="${transY}" font-family="'${escapeXml(fontFamily)}', 'Amiri', serif" font-size="${translationFontSize}" font-weight="400" fill="rgba(255,255,255,0.88)" text-anchor="middle" font-style="italic" filter="url(#softShadow)">${transTSpans}</text>` : ""}
        <text x="${centerX}" y="${ornamentY}" font-family="Amiri" font-size="34" font-weight="bold" fill="url(#goldGrad)" text-anchor="middle">${escapeXml(getAyahDecoration(verse.id, ayahDecoration))}</text>
      </g>
    `;
  }

  const isMinshawi = videoTemplate === "minshawi_player";
  const isDossary = videoTemplate === "dossary_player";
  const bgRects = isMinshawi ? `
    <rect x="0" y="0" width="${WIDTH}" height="380" fill="#000000" />
    <rect x="0" y="380" width="${WIDTH}" height="520" fill="#383838" />
    <rect x="0" y="900" width="${WIDTH}" height="380" fill="#000000" />
  ` : (isDossary ? `
    <rect x="0" y="0" width="${WIDTH}" height="380" fill="#000000" />
    <image href="data:image/png;base64,${settings.dossaryBgBase64 || ''}" x="0" y="380" width="${WIDTH}" height="520" preserveAspectRatio="xMidYMid slice" />
    <rect x="0" y="900" width="${WIDTH}" height="380" fill="#000000" />
  ` : `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#overlayGrad)"/>`);

  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${fontFaceDef}
    <filter id="textGlow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="rgba(0,0,0,0.9)" flood-opacity="0.9"/></filter>
    <filter id="softShadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="rgba(0,0,0,0.7)" flood-opacity="0.7"/></filter>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#BF953F"/><stop offset="30%" stop-color="#FCF6BA"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="70%" stop-color="#FCF6BA"/><stop offset="100%" stop-color="#AA771C"/></linearGradient>
    <filter id="whiteGlow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#ffffff" flood-opacity="0.6"/></filter>
    <linearGradient id="dossaryBgGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#050505"/><stop offset="50%" stop-color="#141414"/><stop offset="100%" stop-color="#000000"/></linearGradient>
    <linearGradient id="dossaryStripeGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#000000"/><stop offset="50%" stop-color="#222222"/><stop offset="100%" stop-color="#000000"/></linearGradient>
    ${overlayGrad}
  </defs>
  ${bgRects}
  ${watermarkSVG}
  ${innerContent}
  ${socialSVG}
</svg>`;

  let finalSvg = applyFilterToSVG(svg, filter);
  finalSvg = applyOverlayToSVG(finalSvg, overlay);
  const svgBuffer = Buffer.from(finalSvg);

  if (videoTemplate === "minshawi_player" || videoTemplate === "dossary_player") {
    // رندرة خلفية سوداء بالكامل وتوليد تفاصيل التصميم داخل الـ SVG
    await sharp({
      create: { width: WIDTH, height: HEIGHT, channels: 3, background: { r: 0, g: 0, b: 0 } }
    })
      .composite([{ input: svgBuffer, blend: "over" }])
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  } else if (isVideoBg) {
    // رندرة شفافة لوضعها فوق الفيديو
    await sharp({
      create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
      .composite([{ input: svgBuffer, blend: "over" }])
      .png({ compressionLevel: 3 })
      .toFile(outputPath);
  } else {
    // دمج سريع جداً ومباشر فوق الصورة
    await sharp(bgPath)
      .resize(WIDTH, HEIGHT, { fit: "cover", position: "center" })
      .composite([{ input: svgBuffer, blend: "over" }])
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  }
}

// ═══ عملية الرندرة الأساسية ═══
async function startRender(jobId, data) {
  const { verses, backgroundUrl, surahName, reciterName = "Sheikh Muhammad Siddiq Al-Minshawi", textColor = "#ffffff", fontSize = 50, fontWeight = 700, fontFamily = "Amiri", filter = "none", overlay = "none", animation = "fade", textPosition = "center", textVerticalOffset = 0, userPlan = "free", instaHandle = "", tiktokHandle = "", ayahDecoration = "bracket1", showVisualizer = false, visualizerColor = "#D4AF37", visualizerStyle = "bars", particles = "none", videoTemplate = "default" } = data;
  const tempDir = path.resolve(os.tmpdir(), jobId);
  fs.mkdirSync(tempDir, { recursive: true });

  const setProgress = (pct, msg) => {
    jobs.set(jobId, { status: "processing", progress: pct, message: msg, createdAt: jobs.get(jobId)?.createdAt });
  };

  try {
    setProgress(5, "تحميل الخطوط والموارد...");
    const fontPath = await ensureFont(fontFamily);
    const fontBase64 = fs.readFileSync(fontPath).toString("base64");
    const amiriPath = await ensureFont("Amiri");
    const amiriBase64 = fs.readFileSync(amiriPath).toString("base64");

    // كشف فيديو الخلفية — يدعم Pexels و روابط بها query params
    const isVideoBg = backgroundUrl && (
      /\.(mp4|webm|mov|m4v)(\?.*|#.*)?$/i.test(backgroundUrl) ||
      /videos\.pexels\.com/i.test(backgroundUrl) ||
      /\/video\//i.test(backgroundUrl)
    );
    const bgPath = path.resolve(tempDir, isVideoBg ? "bg.mp4" : "bg.jpg");
    await downloadFile(backgroundUrl, bgPath);

    // تحميل صورة الشيخ وصورة الخلفية المخصصة للقالب
    const isMinshawiPlayer = data.videoTemplate === "minshawi_player";
    const isDossaryPlayer = data.videoTemplate === "dossary_player";
    const isBasitPlayer = data.videoTemplate === "basit_player";
    const isPlayerTemplate = isMinshawiPlayer || isDossaryPlayer || isBasitPlayer;

    const photoPath = path.resolve(tempDir, "template_photo.jpg");
    const calligraphyPath = path.resolve(tempDir, "template_calligraphy.png");
    const dossaryBgPath = path.resolve(tempDir, "dossary_bg.png");

    if (isPlayerTemplate) {
      const sheikh = getSheikhAsset(data.reciterId);
      try {
        await downloadFile(sheikh.photoUrl, photoPath);
      } catch (e) {
        console.warn("Failed to download sheikh photo:", e.message);
      }
      if (isBasitPlayer && sheikh.calligraphyUrl) {
        try {
          await downloadFile(sheikh.calligraphyUrl, calligraphyPath);
        } catch (e) {
          console.warn("Failed to download sheikh calligraphy:", e.message);
        }
      }
      if (isDossaryPlayer) {
        try {
          await downloadFile("https://res.cloudinary.com/dtuyo4gqm/image/upload/v1782871516/12_gahaqi.png", dossaryBgPath);
        } catch (e) {
          console.warn("Failed to download dossary background:", e.message);
        }
      }
    }

    const templatePhotoBase64 = (isPlayerTemplate && fs.existsSync(photoPath)) ? fs.readFileSync(photoPath).toString("base64") : "";
    const calligraphyBase64 = (isBasitPlayer && fs.existsSync(calligraphyPath)) ? fs.readFileSync(calligraphyPath).toString("base64") : "";
    const dossaryBgBase64 = (isDossaryPlayer && fs.existsSync(dossaryBgPath)) ? fs.readFileSync(dossaryBgPath).toString("base64") : "";

    let naskhBase64 = null;
    if (isDossaryPlayer || isBasitPlayer) {
      const naskhPath = await ensureFont("Noto Naskh Arabic");
      naskhBase64 = fs.readFileSync(naskhPath).toString("base64");
    }

    setProgress(20, "تحميل وتحليل الملفات الصوتية...");

    // 1. تحميل كل الصوتيات أولاً
    const audioPaths = [];
    const verseDurations = [];
    for (let i = 0; i < verses.length; i++) {
      const aPath = path.resolve(tempDir, `a-${i}.mp3`);
      await downloadFile(verses[i].audio, aPath);
      const dur = await getDuration(aPath);
      audioPaths.push(aPath);
      verseDurations.push(dur);
    }

    const audioTotal = verseDurations.reduce((a, b) => a + b, 0);
    let currentElapsed = 0;

    setProgress(35, "توليد إطارات سطر بسطر مع الحركات وتتبع الكلمات...");

    const sf = Math.min(Math.max(fontSize * 1.6, 40), 110);
    const tw = Math.floor(WIDTH * 0.82);
    const frameEntries = [];
    const ext = isVideoBg ? "png" : "jpg";

    const stripTashkeel = (s) => (s || "").replace(/[\u064B-\u065F\u0670]/g, '');

    // Helper function to generate frames with animation and karaoke
    const processLineWithAnim = async (lineVerse, lineDur, fBaseName, lineIdx) => {
      const settings = { fontSize, fontWeight, fontFamily, textColor, textPosition, textVerticalOffset, surahName, userPlan, instaHandle, tiktokHandle, filter, overlay, ayahDecoration, videoTemplate, reciterName };

      const animDuration = 0.3; // 300ms for entrance transition
      const hasTransition = animation && animation !== "none" && animation !== "fade";

      let remainingDur = lineDur;

      // 1. Entrance Transition (if requested)
      if (hasTransition && remainingDur > 0.4) {
        const transitionFrames = 6; // 6 frames = ~0.2s
        const frameDur = 0.2 / transitionFrames;
        for (let f = 0; f < transitionFrames; f++) {
          const progress = f / (transitionFrames - 1); // 0 to 1
          const animState = { opacity: 1, offsetY: 0, scale: 1, activeWordIndex: -1 };

          if (animation === "fade") animState.opacity = progress;
          else if (animation === "slideUp") { animState.opacity = progress; animState.offsetY = 30 * (1 - progress); }
          else if (animation === "slideDown") { animState.opacity = progress; animState.offsetY = -30 * (1 - progress); }
          else if (animation === "zoomIn") { animState.opacity = progress; animState.scale = 0.8 + (0.2 * progress); }
          else animState.opacity = progress; // fallback to fade

          const fPath = path.resolve(tempDir, `${fBaseName}-anim-${f}.${ext}`);
          await generateVerseFrame(lineVerse, fPath, settings, bgPath, isVideoBg, fontBase64, amiriBase64, animState, currentElapsed, audioTotal, templatePhotoBase64);
          frameEntries.push({ fPath, dur: frameDur });
          currentElapsed += frameDur;
          remainingDur -= frameDur;
        }
      }

      // 2. Karaoke Tracking (Highlighting words)
      const words = lineVerse.text.split(/\s+/).filter(Boolean);
      const wordCount = words.length;

      if (wordCount > 0 && remainingDur > 0) {
        const durPerWord = remainingDur / wordCount;
        for (let w = 0; w < wordCount; w++) {
          const animState = { opacity: 1, offsetY: 0, scale: 1, activeWordIndex: w };
          const fPath = path.resolve(tempDir, `${fBaseName}-word-${w}.${ext}`);
          await generateVerseFrame(lineVerse, fPath, settings, bgPath, isVideoBg, fontBase64, amiriBase64, animState, currentElapsed, audioTotal, templatePhotoBase64);
          frameEntries.push({ fPath, dur: durPerWord });
          currentElapsed += durPerWord;
        }
      }
    };

    const isPlayer = videoTemplate && videoTemplate.endsWith("_player");

    if (isPlayer) {
      setProgress(35, "توليد إطارات مشغل الشيخ المخصص...");
      // Dossary template has no animations (1 FPS is enough). Minshawi template updates at 2 FPS (0.5s).
      const interval = videoTemplate === "dossary_player" ? 1.0 : 0.5;
      let elapsed = 0;
      let frameIndex = 0;

      while (elapsed < audioTotal) {
        const remaining = audioTotal - elapsed;
        const dur = Math.min(interval, remaining);

        const fPath = path.resolve(tempDir, `frame-${frameIndex}.${ext}`);

        // Find active verse for rendering text
        let activeVerseIndex = 0;
        let accum = 0;
        for (let i = 0; i < verses.length; i++) {
          if (elapsed >= accum && elapsed < accum + verseDurations[i]) {
            activeVerseIndex = i;
            break;
          }
          accum += verseDurations[i];
          if (i === verses.length - 1) {
            activeVerseIndex = i;
          }
        }
        const activeVerse = verses[activeVerseIndex] || { id: 1, text: "" };
        
        // Calculate per-ayah progress for line-by-line text display
        const ayahStartTime = verseDurations.slice(0, activeVerseIndex).reduce((a, b) => a + b, 0);
        const ayahDuration = verseDurations[activeVerseIndex] || 1;
        const ayahElapsed = elapsed - ayahStartTime;
        const ayahProgress = Math.min(1, Math.max(0, ayahElapsed / ayahDuration));

        const startAyah = verses && verses.length > 0 ? verses[0].id : 1;
        const endAyah = verses && verses.length > 0 ? verses[verses.length - 1].id : 1;
        const settings = { fontSize, fontWeight, fontFamily, textColor, textPosition, textVerticalOffset, surahName, userPlan, instaHandle, tiktokHandle, filter, overlay, ayahDecoration, videoTemplate, reciterName, reciterId: data.reciterId, startAyah, endAyah, dossaryBgBase64, naskhBase64, ayahProgress };
        const animState = { opacity: 1, offsetY: 0, scale: 1, activeWordIndex: -1 };

        await generateVerseFrame(activeVerse, fPath, settings, bgPath, isVideoBg, fontBase64, amiriBase64, animState, elapsed, audioTotal, templatePhotoBase64, calligraphyBase64);
        frameEntries.push({ fPath, dur });

        elapsed += dur;
        frameIndex++;
      }
    } else {
      for (let i = 0; i < verses.length; i++) {
        const v = verses[i];
        const dur = verseDurations[i];
        const lines = wrapText(v.text || "", sf, tw);
        const numLines = Math.max(1, lines.length);

        if (numLines === 1) {
          const fBaseName = `f-${i}-0`;
          const lineVerse = { ...v, text: lines[0], translation: v.translation || "" };
          await processLineWithAnim(lineVerse, Math.max(dur, 0.5), fBaseName, 0);
        } else {
          const charLengths = lines.map(l => Math.max(stripTashkeel(l).length, 1));
          const totalChars = charLengths.reduce((a, b) => a + b, 0);
          let remainingDur = dur;
          let remainingChars = totalChars;

          for (let j = 0; j < numLines; j++) {
            const fBaseName = `f-${i}-${j}`;
            const lineVerse = {
              ...v,
              text: lines[j],
              translation: (j === numLines - 1) ? (v.translation || "") : ""
            };
            let lineDur;
            if (j === numLines - 1) {
              lineDur = Math.max(remainingDur + 0.1, 0.5);
            } else {
              const ratio = charLengths[j] / remainingChars;
              lineDur = Math.max(remainingDur * ratio * 1.05, 0.4);
              remainingDur -= lineDur;
              remainingChars -= charLengths[j];
            }

            await processLineWithAnim(lineVerse, lineDur, fBaseName, j);
          }
        }
      }
    }

    // audioTotal تم تعريفها مسبقاً
    const frameTotal = frameEntries.reduce((a, f) => a + f.dur, 0);
    const diff = audioTotal - frameTotal;
    if (Math.abs(diff) > 0.01 && frameEntries.length > 0) {
      // ضبط آخر إطار ليملأ الفرق
      frameEntries[frameEntries.length - 1].dur = Math.max(0.3, frameEntries[frameEntries.length - 1].dur + diff);
    }

    const totalDuration = verseDurations.reduce((a, b) => a + b, 0);

    setProgress(55, "دمج الصوت بدون تقطيع...");
    const mergedAudioPath = path.resolve(tempDir, "merged-audio.aac");
    const audioInputs = audioPaths.map(p => `-i "${p.replace(/\\/g, "/")}"`).join(" ");

    // فلتر إعادة تهيئة الترددات (Resampling) لضمان عدم وجود أخطاء في الـ concat
    const filterParts = audioPaths.map((_, i) => `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`).join(";");
    const concatIn = audioPaths.map((_, i) => `[a${i}]`).join("");
    const concatFilter = `${filterParts};${concatIn}concat=n=${audioPaths.length}:v=0:a=1[aout]`;

    await execAsync(
      `ffmpeg ${audioInputs} -filter_complex "${concatFilter}" -map "[aout]" -c:a aac -b:a 192k -ar 44100 "${mergedAudioPath.replace(/\\/g, "/")}" -y`,
      { timeout: 90000 }
    );

    setProgress(70, "جاري دمج المقاطع وإنتاج الفيديو...");
    const frameListPath = path.resolve(tempDir, "frames.txt");
    let frameContent = frameEntries.map(f => `file '${f.fPath.replace(/\\/g, "/")}'\nduration ${f.dur.toFixed(6)}`).join("\n");
    frameContent += `\nfile '${frameEntries[frameEntries.length - 1].fPath.replace(/\\/g, "/")}'`;
    fs.writeFileSync(frameListPath, frameContent);

    const outPath = path.resolve(RENDERS_DIR, `${jobId}.mp4`);
    const sl = s => s.replace(/\\/g, "/");

    let ffmpegCmd;
    if (isVideoBg) {
      // === فيديو الخلفية ===
      let hasAudio = false;
      try {
        const { stdout } = await execAsync(`ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 "${sl(bgPath)}"`);
        if (stdout.trim().includes("audio")) {
          hasAudio = true;
        }
      } catch (e) {
        console.warn("Failed to probe video audio stream:", e.message);
      }

      const bgProcessedPath = path.resolve(tempDir, "bg_processed.mp4");
      setProgress(75, "جاري تهيئة فيديو الخلفية بمقاس الهاتف...");
      await execAsync(
        `ffmpeg -stream_loop -1 -t ${totalDuration.toFixed(4)} -i "${sl(bgPath)}" -vf "scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},setsar=1" -an -c:v libx264 -preset ultrafast -crf 23 "${sl(bgProcessedPath)}" -y`,
        { timeout: 90000 }
      );

      setProgress(85, "دمج الطبقات وإنتاج الفيديو النهائي...");
      if (hasAudio) {
        ffmpegCmd = [
          `ffmpeg`,
          `-i "${sl(bgProcessedPath)}"`,
          `-f concat -safe 0 -i "${sl(frameListPath)}"`,
          `-i "${sl(mergedAudioPath)}"`,
          `-filter_complex`,
          `"[1:v]format=rgba,scale=${WIDTH}:${HEIGHT}[fg];`,
          `[0:v][fg]overlay=0:0:shortest=1,format=yuv420p[vout];`,
          `[0:a]volume=0.25[bga];[2:a][bga]amix=inputs=2:duration=first:dropout_transition=2[aout]"`,
          `-map "[vout]" -map "[aout]"`,
          `-c:v libx264 -preset ultrafast -crf 23`,
          `-c:a aac -b:a 192k -ar 44100`,
          `-movflags +faststart`,
          `-y "${sl(outPath)}"`
        ].join(" ");
      } else {
        ffmpegCmd = [
          `ffmpeg`,
          `-i "${sl(bgProcessedPath)}"`,
          `-f concat -safe 0 -i "${sl(frameListPath)}"`,
          `-i "${sl(mergedAudioPath)}"`,
          `-filter_complex`,
          `"[1:v]format=rgba,scale=${WIDTH}:${HEIGHT}[fg];`,
          `[0:v][fg]overlay=0:0:shortest=1,format=yuv420p[vout]"`,
          `-map "[vout]" -map 2:a`,
          `-c:v libx264 -preset ultrafast -crf 23`,
          `-c:a copy`,
          `-movflags +faststart`,
          `-y "${sl(outPath)}"`
        ].join(" ");
      }
    } else {
      // === صورة الخلفية ===
      ffmpegCmd = `ffmpeg -f concat -safe 0 -i "${sl(frameListPath)}" -i "${sl(mergedAudioPath)}" -c:v libx264 -preset ultrafast -crf 23 -pix_fmt yuv420p -c:a copy -t ${totalDuration.toFixed(4)} -movflags +faststart -y "${sl(outPath)}"`;
    }

    await execAsync(ffmpegCmd, { timeout: 180000 });

    jobs.set(jobId, {
      status: "completed",
      progress: 100,
      url: `https://${HOST}/download/${jobId}.mp4`,
      message: "✅ تم رندرة وتصدير الفيديو بنجاح فائق!"
    });
    console.log(`✨ [${jobId}] Render completed successfully!`);

  } catch (e) {
    console.error(`❌ [${jobId}] Render failed:`, e.message);
    jobs.set(jobId, { status: "failed", error: e.message, message: "فشلت عملية الرندرة" });
  } finally {
    // مسح المجلد المؤقت بعد دقيقة لتجنب شغل مساحة الهارد
    setTimeout(() => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) { }
    }, 60000);
  }
}

app.use("/download", express.static(RENDERS_DIR));

app.post("/render", (req, res) => {
  const jobId = `job-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  jobs.set(jobId, { status: "processing", progress: 0, message: "بدء معالجة طلب الرندرة...", createdAt: Date.now() });
  res.json({ jobId });
  startRender(jobId, req.body);
});

app.get("/status/:jobId", (req, res) => {
  res.json(jobs.get(req.params.jobId) || { error: "Job not found" });
});

app.listen(7860, "0.0.0.0", () => {
  console.log("🚀 Hyper Render v22 Online on Port 7860");
});
