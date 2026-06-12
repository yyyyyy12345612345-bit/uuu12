const fs = require('fs');
const https = require('https');
const path = require('path');

const RECITERS_FILE = path.join(__dirname, '../src/data/reciters.ts');
const REPORT_FILE = path.join(__dirname, '../reciters_test_report.md');

function parseReciters(content) {
  const arrayStart = content.indexOf('export const RECITERS: Reciter[] = [') ;
  const bracketStart = content.indexOf('[', arrayStart);
  const bracketEnd = content.lastIndexOf('];');
  return new Function('return ' + content.substring(bracketStart, bracketEnd + 1))();
}

// Test a single reciter: downloads first 512 bytes to verify real MP3 content
async function testReciter(reciter) {
  return new Promise((resolve) => {
    let url = reciter.mp3quranServer;
    if (!url.startsWith('http')) url = 'https://' + url;
    if (!url.endsWith('/')) url += '/';
    url += '001.mp3';

    const startTime = Date.now();

    function tryUrl(targetUrl) {
      const lib = targetUrl.startsWith('https') ? https : require('http');
      const req = lib.get(targetUrl, {
        headers: { 'Range': 'bytes=0-511' },
        timeout: 8000
      }, (res) => {
        const ms = Date.now() - startTime;

        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          req.destroy();
          return tryUrl(res.headers.location);
        }

        // Not a success status
        if (res.statusCode >= 400) {
          res.destroy();
          return resolve({ reciter, status: res.statusCode, ok: false, ms, error: `HTTP ${res.statusCode}`, url: targetUrl });
        }

        // Read first bytes and check for MP3/audio signature
        let bytes = Buffer.alloc(0);
        res.on('data', chunk => {
          bytes = Buffer.concat([bytes, chunk]);
          if (bytes.length >= 64) res.destroy(); // Got enough to verify
        });
        res.on('close', () => {
          // Check for MP3 magic bytes: ID3 or 0xFF 0xFB/0xF3/0xF2 or fLaC or OGG
          const isAudio = bytes.length > 10 && (
            (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || // ID3
            (bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) || // MPEG frame
            (bytes[0] === 0x66 && bytes[1] === 0x4C && bytes[2] === 0x61 && bytes[3] === 0x43) // fLaC
          );
          resolve({ reciter, status: res.statusCode, ok: isAudio, ms, url: targetUrl,
            error: isAudio ? null : `Got ${bytes.length} bytes but not valid audio` });
        });
        res.on('error', () => resolve({ reciter, status: res.statusCode, ok: false, ms, error: 'Read error', url: targetUrl }));
      });
      req.on('error', (err) => resolve({ reciter, status: 0, ok: false, ms: Date.now() - startTime, error: err.message, url: targetUrl }));
      req.on('timeout', () => { req.destroy(); resolve({ reciter, status: 408, ok: false, ms: 8000, error: 'Timeout', url: targetUrl }); });
    }

    tryUrl(url);
  });
}

async function main() {
  console.log("Reading reciters.ts...");
  const content = fs.readFileSync(RECITERS_FILE, 'utf-8');
  const reciters = parseReciters(content);
  console.log(`Found ${reciters.length} reciters. Starting full test...\n`);

  const results = [];
  const BATCH = 15; // parallel requests

  for (let i = 0; i < reciters.length; i += BATCH) {
    const batch = reciters.slice(i, i + BATCH);
    const batchResults = await Promise.all(batch.map(testReciter));
    results.push(...batchResults);

    // Print progress
    for (const r of batchResults) {
      const icon = r.ok ? '✅' : (r.error === 'Timeout' ? '⏱️' : '❌');
      process.stdout.write(icon);
    }

    // Small delay between batches to avoid flooding
    await new Promise(res => setTimeout(res, 200));
  }

  const working = results.filter(r => r.ok);
  const broken = results.filter(r => !r.ok && r.error !== 'Timeout');
  const timeouts = results.filter(r => r.error === 'Timeout');

  console.log(`\n\n=== نتائج الاختبار ===`);
  console.log(`✅ شغالين:  ${working.length}`);
  console.log(`⏱️ بطيء/Timeout: ${timeouts.length}`);
  console.log(`❌ معطل:    ${broken.length}`);

  // Generate markdown report
  let md = `# تقرير اختبار القراء الكامل\n\n`;
  md += `| | العدد |\n|---|---|\n`;
  md += `| ✅ يعمل بكفاءة | ${working.length} |\n`;
  md += `| ⏱️ بطيء / Timeout | ${timeouts.length} |\n`;
  md += `| ❌ معطل تماماً | ${broken.length} |\n`;
  md += `| 📊 الإجمالي | ${reciters.length} |\n\n`;

  if (broken.length > 0) {
    md += `## ❌ معطل تماماً (${broken.length})\n\n`;
    md += `| اسم القارئ | السيرفر | كود الخطأ |\n|---|---|---|\n`;
    for (const r of broken) {
      md += `| ${r.reciter.name} | \`${r.reciter.mp3quranServer}\` | ${r.status} (${r.error || ''}) |\n`;
    }
    md += '\n';
  }

  if (timeouts.length > 0) {
    md += `## ⏱️ بطيء / لم يستجب (${timeouts.length})\n\n`;
    md += `| اسم القارئ | السيرفر |\n|---|---|\n`;
    for (const r of timeouts) {
      md += `| ${r.reciter.name} | \`${r.reciter.mp3quranServer}\` |\n`;
    }
    md += '\n';
  }

  md += `## ✅ يعمل بكفاءة (${working.length})\n\n`;
  md += `| الرقم | اسم القارئ | السيرفر | سرعة الاستجابة |\n|---|---|---|---|\n`;
  working.sort((a, b) => a.ms - b.ms);
  working.forEach((r, i) => {
    const speed = r.ms < 300 ? '🟢 سريع' : r.ms < 1500 ? '🟡 متوسط' : '🔴 بطيء';
    md += `| ${i + 1} | ${r.reciter.name} | \`${r.reciter.mp3quranServer}\` | ${r.ms}ms ${speed} |\n`;
  });

  fs.writeFileSync(REPORT_FILE, md, 'utf-8');
  console.log(`\nتم حفظ التقرير في: reciters_test_report.md`);
}

main().catch(console.error);
