const fs = require('fs');
const path = require('path');

const RECITERS_FILE = path.join(__dirname, '../src/data/reciters.ts');

function parseReciters(content) {
  const arrayStart = content.indexOf('export const RECITERS: Reciter[] = [');
  const bracketStart = content.indexOf('[', arrayStart);
  const bracketEnd = content.lastIndexOf('];');
  return new Function('return ' + content.substring(bracketStart, bracketEnd + 1))();
}

function getHeader(content) {
  const idx = content.indexOf('export const RECITERS');
  return content.substring(0, idx);
}

function main() {
  const content = fs.readFileSync(RECITERS_FILE, 'utf-8');
  const reciters = parseReciters(content);
  const header = getHeader(content);

  console.log(`Before: ${reciters.length} reciters`);

  const seen = new Set();
  const clean = [];
  const removed = [];

  for (const r of reciters) {
    if (!seen.has(r.mp3quranServer)) {
      seen.add(r.mp3quranServer);
      clean.push(r);
    } else {
      removed.push(r);
    }
  }

  console.log(`After:  ${clean.length} reciters (removed ${removed.length} duplicates)`);

  const newContent = header + `export const RECITERS: Reciter[] = ${JSON.stringify(clean, null, 2)};\n`;
  fs.writeFileSync(RECITERS_FILE, newContent, 'utf-8');
  console.log('Done! reciters.ts updated.');
}

main();
