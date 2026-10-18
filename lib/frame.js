import fs from "fs";
import sharp from "sharp";
import { WIDTH, HEIGHT, getSheikhAsset } from "../config.js";
import { escapeXml, applyFilterToSVG, applyOverlayToSVG } from "./svgUtils.js";
import { buildDefaultLayout } from "./templates/defaultTemplate.js";
import { renderMinshawiPlayer, renderBasitPlayer, renderDossaryPlayer, renderBrainrotDetox } from "./templates/playerTemplates.js";

// حصر استهلاك الذاكرة لمكتبة Sharp لمنع خروج خطأ JavaScript heap out of memory
sharp.cache({ memory: 128, files: 20, items: 100 });
sharp.concurrency(2);
sharp.simd(true);

function buildSvgBackground(backgroundUrl, frameW = WIDTH, frameH = HEIGHT) {
  if (!backgroundUrl) {
    return {
      defs: "",
      rect: `<rect width="${frameW}" height="${frameH}" fill="url(#overlayGrad)"/>`
    };
  }

  if (backgroundUrl.startsWith("color:")) {
    const color = backgroundUrl.substring(6);
    return {
      defs: "",
      rect: `<rect width="${frameW}" height="${frameH}" fill="${escapeXml(color)}"/>`
    };
  }

  if (backgroundUrl.startsWith("gradient:")) {
    const gradStr = backgroundUrl.substring(9);
    const colorMatches = gradStr.match(/#(?:[0-9a-fA-F]{3}){1,2}\b|rgba?\([^)]+\)/g);
    if (colorMatches && colorMatches.length > 0) {
      let stops = "";
      colorMatches.forEach((color, idx) => {
        const offset = Math.round((idx / (colorMatches.length - 1)) * 100);
        stops += `<stop offset="${offset}%" stop-color="${escapeXml(color)}"/>`;
      });
      const defs = `<linearGradient id="userBgGrad" x1="0%" y1="0%" x2="0%" y2="100%">${stops}</linearGradient>`;
      const rect = `<rect width="${frameW}" height="${frameH}" fill="url(#userBgGrad)"/>`;
      return { defs, rect };
    }
  }

  return {
    defs: "",
    rect: `<rect width="${frameW}" height="${frameH}" fill="url(#overlayGrad)"/>`
  };
}

// لو fontconfig شغال، مش محتاجين نضمّن @font-face أصلاً — الخط بيتلاقى بالاسم.
// لو مش شغال (fallback)، بنضمّن الـ base64 اللي جالنا من ensureFont.
function buildFontFaceBlock({ fontFamily, amiriFont, mainFont, naskhFont, rubikFont, montserratFont }) {
  let css = "<style>";
  if (amiriFont?.base64) {
    css += `@font-face{font-family:'Amiri';src:url(data:font/truetype;charset=utf-8;base64,${amiriFont.base64}) format('truetype');}`;
  }
  if (fontFamily !== "Amiri" && mainFont?.base64) {
    css += `@font-face{font-family:'${escapeXml(fontFamily)}';src:url(data:font/truetype;charset=utf-8;base64,${mainFont.base64}) format('truetype');}`;
  }
  if (naskhFont?.base64) {
    css += `@font-face{font-family:'Noto Naskh Arabic';src:url(data:font/truetype;charset=utf-8;base64,${naskhFont.base64}) format('truetype');}`;
  }
  if (rubikFont?.base64) {
    css += `@font-face{font-family:'Rubik';src:url(data:font/truetype;charset=utf-8;base64,${rubikFont.base64}) format('truetype');}`;
  }
  if (montserratFont?.base64) {
    css += `@font-face{font-family:'Montserrat';src:url(data:font/truetype;charset=utf-8;base64,${montserratFont.base64}) format('truetype');font-weight:900;}`;
    css += `@font-face{font-family:'Montserrat-Black';src:url(data:font/truetype;charset=utf-8;base64,${montserratFont.base64}) format('truetype');}`;
  }
  css += "</style>";
  return css;
}

const overlayGradDef = `<linearGradient id="overlayGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(0,0,0,0.55)"/><stop offset="25%" stop-color="rgba(0,0,0,0.25)"/><stop offset="70%" stop-color="rgba(0,0,0,0.30)"/><stop offset="100%" stop-color="rgba(0,0,0,0.85)"/></linearGradient>`;

export function buildFrameSvg(verse, settings, isVideoBg, fonts, animState, elapsedSeconds, totalDuration, templatePhotoBase64 = "", layer = "all") {
  const {
    videoTemplate = "default", instaHandle = "", tiktokHandle = "", filter = "none",
    overlay = "none", reciterName = "Sheikh Muhammad Siddiq Al-Minshawi", reciterId,
    isWide = false, showVerseText = true
  } = settings;

  const frameW = isWide ? 1920 : WIDTH;
  const frameH = isWide ? 1080 : HEIGHT;

  const opacity = animState ? animState.opacity : 1;
  const verticalOffset = animState ? animState.offsetY : 0;
  const scale = animState ? animState.scale : 1;
  const activeWordIdx = (animState && videoTemplate !== "default") ? animState.activeWordIndex : -1;

  let socialSVG = "";
  if (instaHandle || tiktokHandle) {
    let yPos = frameH - (isWide ? 40 : 60);
    if (instaHandle) {
      socialSVG += `<text x="${frameW / 2}" y="${yPos}" font-family="Arial" font-size="20" font-weight="bold" fill="rgba(255,255,255,0.8)" text-anchor="middle">Instagram: @${escapeXml(instaHandle)}</text>`;
      yPos += 24;
    }
    if (tiktokHandle) {
      socialSVG += `<text x="${frameW / 2}" y="${yPos}" font-family="Arial" font-size="20" font-weight="bold" fill="rgba(255,255,255,0.8)" text-anchor="middle">TikTok: @${escapeXml(tiktokHandle)}</text>`;
    }
  }

  const fontFaceDef = buildFontFaceBlock({
    fontFamily: settings.fontFamily || "Amiri",
    amiriFont: fonts?.amiriFont,
    mainFont: fonts?.mainFont,
    naskhFont: fonts?.naskhFont,
    rubikFont: fonts?.rubikFont,
    montserratFont: fonts?.montserratFont,
  });

  let innerContent = "";
  if (videoTemplate === "brainrot_detox") {
    innerContent = renderBrainrotDetox({
      opacity,
      elapsed: elapsedSeconds || 0,
      total: totalDuration || 300,
      showTitle: settings.showDetoxTitle !== false,
      titleText: settings.detoxTitleText || "علاج التعفن الدماغي",
      showTimer: settings.showDetoxTimer !== false,
      showProgressBar: settings.showDetoxProgressBar !== false,
    });
  } else if (videoTemplate === "minshawi_player") {
    innerContent = renderMinshawiPlayer({ surahName: settings.surahName, reciterName, opacity, elapsed: elapsedSeconds || 0, total: totalDuration || 1, templatePhotoBase64, fontFamily: settings.fontFamily });
  } else if (videoTemplate === "basit_player") {
    innerContent = renderBasitPlayer({ surahName: settings.surahName, reciterName, opacity, elapsed: elapsedSeconds || 0, total: totalDuration || 1, templatePhotoBase64, fontFamily: settings.fontFamily });
  } else if (videoTemplate === "dossary_player") {
    const startAyah = settings.startAyah || 1;
    const endAyah = settings.endAyah || 1;
    innerContent = renderDossaryPlayer({
      verse, opacity, elapsed: elapsedSeconds || 0, total: totalDuration || 1,
      templatePhotoBase64, startAyah, endAyah, reciterId, ayahProgress: settings.ayahProgress,
      fontFamily: settings.fontFamily, showVerseText
    });
  } else {
    const { inner } = buildDefaultLayout({ verse, settings: { ...settings, isWide, showVerseText }, activeWordIdx, opacity, verticalOffset, scale });
    innerContent = inner;
  }

  const isMinshawi = videoTemplate === "minshawi_player";
  const isDossary = videoTemplate === "dossary_player";
  const isBasit = videoTemplate === "basit_player";
  const isDetox = videoTemplate === "brainrot_detox";
  const bgSvg = buildSvgBackground(settings.backgroundUrl, frameW, frameH);
  const midH = isWide ? 520 : 520;
  const topH = isWide ? Math.round((frameH - midH) / 2) : 380;
  const botH = frameH - topH - midH;

  const bgRects = isMinshawi ? `
    <rect x="0" y="0" width="${frameW}" height="${topH}" fill="#000000" />
    <rect x="0" y="${topH}" width="${frameW}" height="${midH}" fill="#383838" />
    <rect x="0" y="${topH + midH}" width="${frameW}" height="${botH}" fill="#000000" />
  ` : (isDossary ? `
    <rect x="0" y="0" width="${frameW}" height="${topH}" fill="#000000" />
    <image href="data:image/png;base64,${settings.dossaryBgBase64 || ""}" x="0" y="${topH}" width="${frameW}" height="${midH}" preserveAspectRatio="xMidYMid slice" />
    <rect x="0" y="${topH + midH}" width="${frameW}" height="${botH}" fill="#000000" />
  ` : (isBasit ? `
    <rect x="0" y="0" width="${frameW}" height="${topH}" fill="#000000" />
    <rect x="0" y="${topH}" width="${frameW}" height="${midH}" fill="#c5beb8" />
    <rect x="0" y="${topH + midH}" width="${frameW}" height="${botH}" fill="#000000" />
  ` : (isDetox ? (isVideoBg ? "" : `<rect x="0" y="0" width="${frameW}" height="${frameH}" fill="rgba(0,0,0,0.3)" />`) : bgSvg.rect)));

  const svg = `<svg width="${frameW}" height="${frameH}" viewBox="0 0 ${frameW} ${frameH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${fontFaceDef}
    <filter id="textGlow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.95)" flood-opacity="0.95"/></filter>
    <filter id="softShadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="rgba(0,0,0,0.7)" flood-opacity="0.7"/></filter>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#BF953F"/><stop offset="30%" stop-color="#FCF6BA"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="70%" stop-color="#FCF6BA"/><stop offset="100%" stop-color="#AA771C"/></linearGradient>
    <filter id="whiteGlow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="#ffffff" flood-opacity="0.8"/></filter>
    ${overlayGradDef}
    ${bgSvg.defs}
  </defs>
  ${layer === "inner" ? "" : bgRects}
  ${layer === "static" ? "" : innerContent}
  ${layer === "inner" ? "" : socialSVG}
</svg>`;

  let finalSvg = applyFilterToSVG(svg, filter);
  finalSvg = applyOverlayToSVG(finalSvg, overlay);
  return { svgBuffer: Buffer.from(finalSvg), frameW, frameH };
}

export async function generateVerseFrame(verse, outputPath, settings, bgPath, isVideoBg, fonts, animState, elapsedSeconds, totalDuration, templatePhotoBase64 = "") {
  const { videoTemplate = "default", isWide = false } = settings;
  const { svgBuffer, frameW, frameH } = buildFrameSvg(verse, settings, isVideoBg, fonts, animState, elapsedSeconds, totalDuration, templatePhotoBase64);
  const hasBgFile = bgPath && fs.existsSync(bgPath);

  if (videoTemplate.endsWith("_player")) {
    await sharp({ create: { width: frameW, height: frameH, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .composite([{ input: svgBuffer, blend: "over" }])
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  } else if (isVideoBg) {
    // v24: رسم الـ SVG مباشرة (RGBA شفاف) بدل إنشاء canvas فاضي ثم composite — نفس النتيجة وأسرع
    await sharp(svgBuffer)
      .png({ compressionLevel: 1 })
      .toFile(outputPath);
  } else if (settings.preparedBg) {
    // الخلفية اتصغّرت مرة واحدة في render.js — مفيش فك/تصغير للصورة الأصلية في كل فريم
    const pb = settings.preparedBg;
    await sharp(pb.data, { raw: { width: pb.width, height: pb.height, channels: pb.channels } })
      .composite([{ input: svgBuffer, blend: "over" }])
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  } else if (hasBgFile) {
    const fit = isWide ? "cover" : (settings.backgroundFit || "cover");
    await sharp(bgPath)
      .resize(frameW, frameH, { fit, background: { r: 0, g: 0, b: 0 }, position: "center" })
      .composite([{ input: svgBuffer, blend: "over" }])
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  } else {
    await sharp({ create: { width: frameW, height: frameH, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .composite([{ input: svgBuffer, blend: "over" }])
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  }
}


// ═══════════════════════════════════════════════════════════════════════
// ⚡ المسار السريع للانتقال (fade) في القالب الافتراضي
// ───────────────────────────────────────────────────────────────────────
// فلتر الظل (textGlow) بياخد حوالي 75% من وقت رسم الفريم. فريمات الـ fade لنفس السطر
// بتختلف في شفافية مجموعة النص بس (<g opacity=p>)، والباقي (التدرج + الحسابات) ثابت.
// فبنرسم طبقة النص مرة واحدة لكل سطر (بالظل) وطبقة ثابتة مرة واحدة لكل رندرة،
// وكل فريم = ضرب قناة الألفا في p + دمج. نفس معنى opacity في SVG بالظبط.
// بيشتغل بس لو: قالب افتراضي، بدون filter/overlay، وفيه خلفية فيديو أو صورة محضّرة.
// ═══════════════════════════════════════════════════════════════════════
export function canUseLayerFastPath(settings, isVideoBg) {
  const { videoTemplate = "default", filter = "none", overlay = "none" } = settings;
  const plain = (v) => !v || v === "none";
  if (videoTemplate === "brainrot_detox" || videoTemplate.endsWith("_player")) return false;
  if (!plain(filter) || !plain(overlay)) return false;
  return Boolean(isVideoBg || settings.preparedBg);
}

async function rasterRGBA(svgBuffer) {
  const { data, info } = await sharp(svgBuffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** الطبقة الثابتة (التدرج + الحسابات الاجتماعية). بتترسم مرة واحدة لكل رندرة. */
export async function renderStaticLayer(verse, settings, isVideoBg, fonts) {
  const { svgBuffer } = buildFrameSvg(verse, settings, isVideoBg, fonts, { opacity: 1, offsetY: 0, scale: 1, activeWordIndex: -1 }, 0, 1, "", "static");
  return rasterRGBA(svgBuffer);
}

/** طبقة النص بالشفافية الكاملة (مع الظل). بتترسم مرة واحدة لكل سطر. */
export async function renderTextLayer(verse, settings, isVideoBg, fonts, elapsedSeconds, totalDuration) {
  const { svgBuffer } = buildFrameSvg(verse, settings, isVideoBg, fonts, { opacity: 1, offsetY: 0, scale: 1, activeWordIndex: -1 }, elapsedSeconds, totalDuration, "", "inner");
  return rasterRGBA(svgBuffer);
}

/** فريم = طبقة ثابتة + طبقة النص × opacity، فوق الخلفية. */
export async function composeLayerFrame(outputPath, settings, isVideoBg, staticLayer, textLayer, opacity) {
  const { width, height } = textLayer;
  let textBuf = textLayer.data;
  if (opacity < 1) {
    textBuf = Buffer.from(textLayer.data); // نسخة، الأصل بيتستخدم لفريمات تانية
    for (let i = 3; i < textBuf.length; i += 4) textBuf[i] = Math.round(textBuf[i] * opacity);
  }
  const layers = [
    { input: staticLayer.data, raw: { width, height, channels: 4 }, blend: "over" },
    { input: textBuf, raw: { width, height, channels: 4 }, blend: "over" },
  ];
  if (isVideoBg) {
    // PNG شفاف: الطبقة الثابتة هي الأساس
    await sharp(staticLayer.data, { raw: { width, height, channels: 4 } })
      .composite([layers[1]])
      .png({ compressionLevel: 1 })
      .toFile(outputPath);
  } else {
    const pb = settings.preparedBg;
    await sharp(pb.data, { raw: { width: pb.width, height: pb.height, channels: pb.channels } })
      .composite(layers)
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  }
}
