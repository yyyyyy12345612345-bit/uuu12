import { escapeXml } from "../svgUtils.js";
import { getSheikhAsset } from "../../config.js";

function formatTime(secs) {
  if (isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function renderMinshawiPlayer({ surahName, reciterName, opacity, elapsed, total, templatePhotoBase64 }) {
  const progressPct = elapsed / (total || 1);
  return `
    <g opacity="${opacity}">
      <rect x="80" y="450" width="560" height="380" rx="95" fill="#000000" stroke="rgba(255, 255, 255, 0.05)" stroke-width="2" />
      <clipPath id="photoClip">
        <rect x="190" y="475" width="340" height="200" rx="45" />
      </clipPath>
      <image href="data:image/jpeg;base64,${templatePhotoBase64}" x="190" y="475" width="340" height="200" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)" />
      <text x="190" y="707" font-family="'Noto Naskh Arabic', serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="start">${escapeXml(surahName || "سورة")}</text>
      <text x="190" y="733" font-family="'Cairo', sans-serif" font-size="15" fill="rgba(255, 255, 255, 0.5)" text-anchor="start">${escapeXml(reciterName)}</text>
      <rect x="190" y="760" width="340" height="4" rx="2" fill="rgba(255, 255, 255, 0.2)" />
      <rect x="190" y="760" width="${340 * Math.min(1, Math.max(0, progressPct))}" height="4" rx="2" fill="#ffffff" />
      <circle cx="${190 + 340 * Math.min(1, Math.max(0, progressPct))}" cy="762" r="6" fill="#ffffff" />
      <text x="190" y="787" font-family="monospace" font-size="14" fill="rgba(255, 255, 255, 0.5)" text-anchor="start">${formatTime(elapsed)}</text>
      <text x="530" y="787" font-family="monospace" font-size="14" fill="rgba(255, 255, 255, 0.5)" text-anchor="end">${formatTime(total)}</text>
      <g transform="translate(190, 793) scale(0.95)">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6"/>
      </g>
      <g transform="translate(270, 793) scale(0.95)">
        <path d="M19 20L9 12l10-8v16z" fill="#ffffff" />
        <rect x="5" y="4" width="2" height="16" rx="0.5" fill="#ffffff" />
      </g>
      <circle cx="360" cy="805" r="22" fill="#ffffff" />
      <g transform="translate(352, 797) scale(0.8)">
        <rect x="3" y="4" width="4" height="12" rx="1" fill="#000000" />
        <rect x="11" y="4" width="4" height="12" rx="1" fill="#000000" />
      </g>
      <g transform="translate(426, 793) scale(0.95)">
        <path d="M5 4l10 8-10 8V4z" fill="#ffffff" />
        <rect x="17" y="4" width="2" height="16" rx="0.5" fill="#ffffff" />
      </g>
      <g transform="translate(506, 793) scale(0.95)">
        <circle cx="12" cy="12" r="10" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6" />
        <line x1="7" y1="12" x2="17" y2="12" stroke="#ffffff" stroke-width="2" opacity="0.6" />
      </g>
    </g>
  `;
}

export function renderBasitPlayer({ surahName, reciterName, opacity, elapsed, total, templatePhotoBase64 }) {
  const progressPct = elapsed / (total || 1);
  const ovalW = 360, ovalH = 260, ovalX = 360, ovalY = 525;
  const barX = 180, barY = 690, barW = 360, ctrlY = 740;
  return `
    <g opacity="${opacity}">
      <clipPath id="basitOvalClip">
        <ellipse cx="${ovalX}" cy="${ovalY}" rx="${ovalW / 2}" ry="${ovalH / 2}" />
      </clipPath>
      <image href="data:image/jpeg;base64,${templatePhotoBase64}" x="${ovalX - ovalW / 2}" y="${ovalY - ovalH / 2}" width="${ovalW}" height="${ovalH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#basitOvalClip)" />
      <ellipse cx="${ovalX}" cy="${ovalY}" rx="${ovalW / 2}" ry="${ovalH / 2}" fill="none" stroke="rgba(0, 0, 0, 0.08)" stroke-width="2" />
      <rect x="${barX}" y="${barY}" width="${barW}" height="2.5" rx="1.25" fill="rgba(0, 0, 0, 0.18)" />
      <rect x="${barX}" y="${barY}" width="${barW * Math.min(1, Math.max(0, progressPct))}" height="2.5" rx="1.25" fill="#000000" />
      <circle cx="${barX + barW * Math.min(1, Math.max(0, progressPct))}" cy="${barY + 1.25}" r="6" fill="#000000" />
      <g transform="translate(220, ${ctrlY - 10}) scale(0.95)" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <polyline points="16 3 21 3 21 8"/>
        <line x1="4" y1="20" x2="21" y2="3"/>
        <polyline points="21 16 21 21 16 21"/>
        <line x1="15" y1="15" x2="21" y2="21"/>
        <line x1="4" y1="4" x2="9" y2="9"/>
      </g>
      <g transform="translate(280, ${ctrlY - 10}) scale(0.95)" fill="#000000">
        <path d="M19 20L9 12l10-8v16z" />
        <rect x="5" y="4" width="2.5" height="16" rx="0.5" />
      </g>
      <circle cx="360" cy="${ctrlY}" r="20" fill="#000000" />
      <g transform="translate(352, ${ctrlY - 10}) scale(0.95)">
        <rect x="1" y="3" width="4" height="14" rx="1" fill="#ffffff" />
        <rect x="11" y="3" width="4" height="14" rx="1" fill="#ffffff" />
      </g>
      <g transform="translate(420, ${ctrlY - 10}) scale(0.95)" fill="#000000">
        <path d="M5 4l10 8-10 8V4z" />
        <rect x="14" y="4" width="2.5" height="16" rx="0.5" />
      </g>
      <g transform="translate(480, ${ctrlY - 10}) scale(0.95)" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <polyline points="17 1 21 5 17 9"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </g>
      <text x="360" y="825" font-family="'Times New Roman', Georgia, serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">${escapeXml(reciterName)}</text>
      <text x="360" y="1090" font-family="'Noto Naskh Arabic', 'Amiri', sans-serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${escapeXml(surahName || "سورة")}</text>
    </g>
  `;
}

export function renderDossaryPlayer({ verse, opacity, elapsed, total, templatePhotoBase64, startAyah, endAyah, reciterId, ayahProgress }) {
  const progressPct = elapsed / (total || 1);
  const rightAreaCenterX = 510;
  const scaledNaskhSize = 32;

  const verseWords = (verse.text || "").split(/\s+/).filter(Boolean);
  const wordsPerLine = 4;
  const verseLines = [];
  for (let i = 0; i < verseWords.length; i += wordsPerLine) {
    verseLines.push(verseWords.slice(i, i + wordsPerLine).join(" "));
  }
  if (verseLines.length === 0 && verse.text) verseLines.push(verse.text);

  const ayahProg = ayahProgress || 0;
  const activeLineIdx = Math.min(verseLines.length - 1, Math.floor(ayahProg * verseLines.length));
  const activeLineText = verseLines[activeLineIdx] || verse.text || "";
  const naskhStartY = 480 + 150 / 2 + 10;

  const introDuration = 1.2;
  const t = elapsed < introDuration ? (elapsed / introDuration) : 1;
  const ease = 1 - (1 - t) * (1 - t); // easeOutQuad
  const translateX = -390 * (1 - ease);

  return `
    <g opacity="${opacity}">
      ${verse.text ? `
      <text x="${rightAreaCenterX}" y="${naskhStartY}" font-family="'Noto Naskh Arabic', serif" font-size="${scaledNaskhSize}" fill="#ffffff" text-anchor="middle" direction="rtl" filter="url(#textGlow)">
        ${escapeXml(activeLineText)}
      </text>
      ` : ""}
      <g transform="translate(${translateX.toFixed(2)}, 0)">
        <clipPath id="photoClip">
          <rect x="70" y="480" width="240" height="320" rx="35" />
        </clipPath>
        <rect x="70" y="480" width="240" height="320" rx="35" fill="none" stroke="#ffffff" stroke-width="4" filter="url(#whiteGlow)" />
        <image href="data:image/jpeg;base64,${templatePhotoBase64}" x="70" y="480" width="240" height="320" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)" />
      </g>
      <rect x="360" y="660" width="300" height="4" rx="2" fill="rgba(255, 255, 255, 0.2)" />
      <rect x="360" y="660" width="${300 * Math.min(1, Math.max(0, progressPct))}" height="4" rx="2" fill="#ffffff" />
      <circle cx="${360 + 300 * Math.min(1, Math.max(0, progressPct))}" cy="662" r="5" fill="#ffffff" />
      <text x="360" y="684" font-family="monospace" font-size="12" fill="rgba(255, 255, 255, 0.5)" text-anchor="start">${formatTime(elapsed)}</text>
      <text x="660" y="684" font-family="monospace" font-size="12" fill="rgba(255, 255, 255, 0.5)" text-anchor="end">${formatTime(total)}</text>
      <g transform="translate(360, 715) scale(0.9)">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6"/>
      </g>
      <g transform="translate(430, 715) scale(0.9)">
        <path d="M19 20L9 12l10-8v16z" fill="#ffffff" />
        <rect x="5" y="4" width="2" height="16" rx="0.5" fill="#ffffff" />
      </g>
      <circle cx="510" cy="726" r="20" fill="#ffffff" />
      <g transform="translate(501, 715) scale(0.8)">
        <rect x="3" y="4" width="5" height="16" rx="1" fill="#000000" />
        <rect x="12" y="4" width="5" height="16" rx="1" fill="#000000" />
      </g>
      <g transform="translate(590, 715) scale(0.9)">
        <path d="M5 4l10 8-10 8V4z" fill="#ffffff" />
        <rect x="17" y="4" width="2" height="16" rx="0.5" fill="#ffffff" />
      </g>
      <g transform="translate(660, 715) scale(0.9)">
        <circle cx="12" cy="12" r="10" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6" />
        <line x1="7" y1="12" x2="17" y2="12" stroke="#ffffff" stroke-width="2" opacity="0.6" />
      </g>
      <text x="360" y="1140" font-family="'Inter', sans-serif" font-size="22" font-weight="500" fill="rgba(255, 255, 255, 0.6)" text-anchor="middle">
        ${escapeXml(getSheikhAsset(reciterId).nameEn)}
      </text>
      <text x="360" y="1175" font-family="monospace" font-size="18" font-weight="bold" fill="rgba(255, 255, 255, 0.4)" text-anchor="middle">
        ${startAyah === endAyah ? `AYAH ${startAyah}` : `AYAH ${startAyah} - ${endAyah}`}
      </text>
    </g>
  `;
}
