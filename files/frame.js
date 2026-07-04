import sharp from "sharp";
import { WIDTH, HEIGHT, getSheikhAsset } from "../config.js";
import { escapeXml, applyFilterToSVG, applyOverlayToSVG } from "./svgUtils.js";
import { buildDefaultLayout } from "./templates/defaultTemplate.js";
import { renderMinshawiPlayer, renderBasitPlayer, renderDossaryPlayer } from "./templates/playerTemplates.js";

function buildSvgBackground(backgroundUrl) {
  if (!backgroundUrl) {
    return {
      defs: "",
      rect: `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#overlayGrad)"/>`
    };
  }

  if (backgroundUrl.startsWith("color:")) {
    const color = backgroundUrl.substring(6);
    return {
      defs: "",
      rect: `<rect width="${WIDTH}" height="${HEIGHT}" fill="${escapeXml(color)}"/>`
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
      const rect = `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#userBgGrad)"/>`;
      return { defs, rect };
    }
  }

  return {
    defs: "",
    rect: `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#overlayGrad)"/>`
  };
}

// لو fontconfig شغال، مش محتاجين نضمّن @font-face أصلاً — الخط بيتلاقى بالاسم.
// لو مش شغال (fallback)، بنضمّن الـ base64 اللي جالنا من ensureFont.
function buildFontFaceBlock({ fontFamily, amiriFont, mainFont, naskhFont }) {
  if (!amiriFont?.base64 && !mainFont?.base64 && !naskhFont?.base64) return "";
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
  css += "</style>";
  return css;
}

const overlayGradDef = `<linearGradient id="overlayGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(0,0,0,0.55)"/><stop offset="25%" stop-color="rgba(0,0,0,0.25)"/><stop offset="70%" stop-color="rgba(0,0,0,0.30)"/><stop offset="100%" stop-color="rgba(0,0,0,0.85)"/></linearGradient>`;

export async function generateVerseFrame(verse, outputPath, settings, bgPath, isVideoBg, fonts, animState, elapsedSeconds, totalDuration, templatePhotoBase64 = "") {
  const { videoTemplate = "default", instaHandle = "", tiktokHandle = "", filter = "none", overlay = "none", reciterName = "Sheikh Muhammad Siddiq Al-Minshawi", reciterId } = settings;
  const opacity = animState ? animState.opacity : 1;
  const verticalOffset = animState ? animState.offsetY : 0;
  const scale = animState ? animState.scale : 1;
  const activeWordIdx = (animState && videoTemplate !== "default") ? animState.activeWordIndex : -1;

  let socialSVG = "";
  if (instaHandle || tiktokHandle) {
    let yPos = HEIGHT - 60;
    if (instaHandle) {
      socialSVG += `<text x="${WIDTH / 2}" y="${yPos}" font-family="Arial" font-size="20" font-weight="bold" fill="rgba(255,255,255,0.8)" text-anchor="middle">Insta: @${escapeXml(instaHandle)}</text>`;
      yPos -= 30;
    }
    if (tiktokHandle) {
      socialSVG += `<text x="${WIDTH / 2}" y="${yPos}" font-family="Arial" font-size="20" font-weight="bold" fill="rgba(255,255,255,0.8)" text-anchor="middle">TikTok: @${escapeXml(tiktokHandle)}</text>`;
    }
  }

  const fontFaceDef = buildFontFaceBlock({
    fontFamily: settings.fontFamily || "Amiri",
    amiriFont: fonts.amiriFont,
    mainFont: fonts.mainFont,
    naskhFont: fonts.naskhFont,
  });

  let innerContent = "";
  if (videoTemplate === "minshawi_player") {
    innerContent = renderMinshawiPlayer({ surahName: settings.surahName, reciterName, opacity, elapsed: elapsedSeconds || 0, total: totalDuration || 1, templatePhotoBase64, fontFamily: settings.fontFamily });
  } else if (videoTemplate === "basit_player") {
    innerContent = renderBasitPlayer({ surahName: settings.surahName, reciterName, opacity, elapsed: elapsedSeconds || 0, total: totalDuration || 1, templatePhotoBase64, fontFamily: settings.fontFamily });
  } else if (videoTemplate === "dossary_player") {
    const startAyah = settings.startAyah || 1;
    const endAyah = settings.endAyah || 1;
    innerContent = renderDossaryPlayer({
      verse, opacity, elapsed: elapsedSeconds || 0, total: totalDuration || 1,
      templatePhotoBase64, startAyah, endAyah, reciterId, ayahProgress: settings.ayahProgress,
      fontFamily: settings.fontFamily
    });
  } else {
    const { inner } = buildDefaultLayout({ verse, settings, activeWordIdx, opacity, verticalOffset, scale });
    innerContent = inner;
  }

  const isMinshawi = videoTemplate === "minshawi_player";
  const isDossary = videoTemplate === "dossary_player";
  const isBasit = videoTemplate === "basit_player";
  const bgSvg = buildSvgBackground(settings.backgroundUrl);
  const bgRects = isMinshawi ? `
    <rect x="0" y="0" width="${WIDTH}" height="380" fill="#000000" />
    <rect x="0" y="380" width="${WIDTH}" height="520" fill="#383838" />
    <rect x="0" y="900" width="${WIDTH}" height="380" fill="#000000" />
  ` : (isDossary ? `
    <rect x="0" y="0" width="${WIDTH}" height="380" fill="#000000" />
    <image href="data:image/png;base64,${settings.dossaryBgBase64 || ""}" x="0" y="380" width="${WIDTH}" height="520" preserveAspectRatio="xMidYMid slice" />
    <rect x="0" y="900" width="${WIDTH}" height="380" fill="#000000" />
  ` : (isBasit ? `
    <rect x="0" y="0" width="${WIDTH}" height="380" fill="#000000" />
    <rect x="0" y="380" width="${WIDTH}" height="520" fill="#c5beb8" />
    <rect x="0" y="900" width="${WIDTH}" height="380" fill="#000000" />
  ` : bgSvg.rect));

  const svg = `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${fontFaceDef}
    <filter id="textGlow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="rgba(0,0,0,0.9)" flood-opacity="0.9"/></filter>
    <filter id="softShadow" x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="rgba(0,0,0,0.7)" flood-opacity="0.7"/></filter>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#BF953F"/><stop offset="30%" stop-color="#FCF6BA"/><stop offset="50%" stop-color="#D4AF37"/><stop offset="70%" stop-color="#FCF6BA"/><stop offset="100%" stop-color="#AA771C"/></linearGradient>
    <filter id="whiteGlow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#ffffff" flood-opacity="0.6"/></filter>
    ${overlayGradDef}
    ${bgSvg.defs}
  </defs>
  ${bgRects}
  ${innerContent}
  ${socialSVG}
</svg>`;

  let finalSvg = applyFilterToSVG(svg, filter);
  finalSvg = applyOverlayToSVG(finalSvg, overlay);
  const svgBuffer = Buffer.from(finalSvg);

  if (videoTemplate.endsWith("_player")) {
    await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .composite([{ input: svgBuffer, blend: "over" }])
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  } else if (isVideoBg) {
    await sharp({ create: { width: WIDTH, height: HEIGHT, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: svgBuffer, blend: "over" }])
      .png({ compressionLevel: 1 })
      .toFile(outputPath);
  } else {
    await sharp(bgPath)
      .resize(WIDTH, HEIGHT, { fit: "cover", position: "center" })
      .composite([{ input: svgBuffer, blend: "over" }])
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  }
}
