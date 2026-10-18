// تقسيم النصوص العربية — مساحة أوسع لتقليل عدد الأسطر
export function wrapText(text, fontSize, maxWidth) {
  if (!text) return [];
  const hasHarakat = /[\u064B-\u065F]/.test(text);
  const ratio = hasHarakat ? 0.45 : 0.40;
  const charWidth = fontSize * ratio;
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

export function escapeXml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function getAyahDecoration(verseId, style) {
  switch (style) {
    case "none": return String(verseId);
    case "bracket2": return `﴾ ${verseId} ﴿`;
    case "star": return `✧ ${verseId} ✧`;
    case "diamond": return `✥ ${verseId} ✥`;
    case "ornament": return `۞ ${verseId} ۞`;
    default: return `﴿ ${verseId} ﴾`;
  }
}

export function applyFilterToSVG(svg, filterName) {
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

export function applyOverlayToSVG(svg, overlayName) {
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
      overlaySVG = `<g opacity="0.35">${Array.from({ length: 40 }, () => `<line x1="${Math.random() * 720}" y1="${-20 + Math.random() * 100}" x2="${6 + Math.random() * 8 - 8 + Math.random() * 720}" y2="${1300 + Math.random() * 200}" stroke="rgba(174,194,224,0.5)" stroke-width="1.5"/>`).join('')}</g>`;
      break;
    case "snow":
      overlaySVG = `<g opacity="0.6">${Array.from({ length: 30 }, () => `<circle cx="${Math.random() * 720}" cy="${Math.random() * 1280}" r="${1 + Math.random() * 3}" fill="white" opacity="${0.3 + Math.random() * 0.5}"><animate attributeName="cy" values="${-20};${1300}" dur="${5 + Math.random() * 8}s" repeatCount="indefinite"/><animate attributeName="cx" values="${Math.random() * 720};${Math.random() * 720}" dur="${5 + Math.random() * 8}s" repeatCount="indefinite"/></circle>`).join('')}</g>`;
      break;
    case "fireflies":
      overlaySVG = `<g>${Array.from({ length: 15 }, () => `<circle cx="${Math.random() * 720}" cy="${Math.random() * 1280}" r="${1.5 + Math.random() * 2.5}" fill="#D4AF37" opacity="0.4"><animate attributeName="opacity" values="0.1;0.9;0.1" dur="${2 + Math.random() * 3}s" repeatCount="indefinite"/></circle>`).join('')}</g>`;
      break;
    case "smoke":
      overlaySVG = `<g opacity="0.12">${Array.from({ length: 6 }, () => `<circle cx="${100 + Math.random() * 520}" cy="${1100 + Math.random() * 200}" r="${100 + Math.random() * 150}" fill="rgba(255,255,255,0.06)"><animate attributeName="cy" values="${1100 + Math.random() * 100};${-100}" dur="${10 + Math.random() * 15}s" repeatCount="indefinite"/><animate attributeName="r" values="${50 + Math.random() * 50};${150 + Math.random() * 150}" dur="${10 + Math.random() * 15}s" repeatCount="indefinite"/></circle>`).join('')}</g>`;
      break;
    case "sparkle":
      overlaySVG = `<g>${Array.from({ length: 12 }, () => `<text x="${Math.random() * 660 + 30}" y="${Math.random() * 1180 + 50}" font-size="${10 + Math.random() * 14}" fill="#FFD700" opacity="${0.3 + Math.random() * 0.5}" text-anchor="middle">✦</text>`).join('')}</g>`;
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
