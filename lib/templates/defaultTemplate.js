import { escapeXml, wrapText, getAyahDecoration } from "../svgUtils.js";
import { WIDTH, HEIGHT } from "../../config.js";

// بيرجع كل القياسات المحسوبة + الـ SVG الداخلي، عشان نعرف الأبعاد الكلية
// المستخدمة برضو في حساب مكان بداية النص (startY) في المُنادي.
export function buildDefaultLayout({ verse, settings, activeWordIdx, opacity, verticalOffset, scale }) {
  const {
    fontSize = 50, fontWeight = 700, fontFamily = "Amiri", textColor = "#ffffff",
    textPosition = "center", textVerticalOffset = 0, surahName = "", ayahDecoration = "bracket1",
  } = settings;

  const scaledFontSize = Math.min(Math.max(fontSize * 1.6, 40), 110);
  const translationFontSize = Math.min(Math.max(fontSize * 0.65, 28), 40);
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
  const transformOrigin = `${centerX}px ${startY + totalH / 2}px`;

  const inner = `
    <g opacity="${opacity}" transform="scale(${scale})" style="transform-origin: ${transformOrigin}">
      ${badgeSVG}
      <text x="${centerX}" y="${verseY}" font-family="'${escapeXml(fontFamily)}', 'Amiri', serif" font-size="${scaledFontSize}" font-weight="${svgWeight}" fill="${escapeXml(textColor)}" text-anchor="middle" direction="rtl" filter="url(#textGlow)">${verseTSpans}</text>
      <rect x="${(WIDTH - 100) / 2}" y="${sepY}" width="100" height="1.5" rx="1" fill="rgba(212,175,55,0.5)"/>
      <circle cx="${centerX}" cy="${sepY + 0.75}" r="3" fill="rgba(212,175,55,0.6)"/>
      ${tLines.length > 0 ? `<text x="${centerX}" y="${transY}" font-family="'${escapeXml(fontFamily)}', 'Amiri', serif" font-size="${translationFontSize}" font-weight="400" fill="rgba(255,255,255,0.88)" text-anchor="middle" font-style="italic" filter="url(#softShadow)">${transTSpans}</text>` : ""}
      <text x="${centerX}" y="${ornamentY}" font-family="Amiri" font-size="34" font-weight="bold" fill="url(#goldGrad)" text-anchor="middle">${escapeXml(getAyahDecoration(verse.id, ayahDecoration))}</text>
    </g>
  `;

  return { inner };
}
