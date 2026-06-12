const fs = require('fs');
const https = require('https');
const path = require('path');

// Read the fetched JSON data
const apiDataFile = path.join(__dirname, '../.gemini/antigravity-ide/brain/1279ab73-15d3-44e2-82ee-ebfdbc5863e2/.system_generated/steps/269/content.md');
// Wait, the path is absolute from the artifact: C:\Users\youse\.gemini\antigravity-ide\brain\1279ab73-15d3-44e2-82ee-ebfdbc5863e2\.system_generated\steps\269\content.md
// I'll just fetch it again in the script to be safe.

const RECITERS_FILE = path.join(__dirname, '../src/data/reciters.ts');
const REPORT_FILE = path.join(__dirname, '../artifacts/reciters_report.md');

// Current ones from the code (just a sample of IDs we know, or we can parse the TS file if we want, but it's easier to just fetch all and rebuild)
// Since we want to KEEP the existing structure but fix broken ones and add 50, let's fetch the API and map it.

async function fetchApi() {
  return new Promise((resolve, reject) => {
    https.get('https://mp3quran.net/api/v3/reciters?language=ar', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function checkUrl(url) {
  return new Promise((resolve) => {
    if (!url.startsWith('http')) url = 'https://' + url;
    if (!url.endsWith('/')) url += '/';
    url += '001.mp3'; // Check if Al-Fatiha exists
    
    https.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    }).on('error', () => resolve(false)).on('timeout', () => resolve(false)).end();
  });
}

async function main() {
  console.log("Fetching reciters from MP3Quran API...");
  const data = await fetchApi();
  const allReciters = data.reciters;
  
  // Existing ids to prioritize
  const existingIds = [
    "maher", "sds", "shur", "juhani", "afasy", "qtm", "s_gmd", "ajm", "yasser", "abkr", "basit", "minsh", "husr"
  ];
  
  // Sort or pick 50 famous ones
  // We'll filter reciters that have "Hafs" (rewaya_id: 1)
  const validReciters = [];
  
  for (const r of allReciters) {
    const hafsMoshaf = r.moshaf.find(m => m.rewaya_id === 1);
    if (!hafsMoshaf) continue;
    
    // Extract server
    let server = hafsMoshaf.server;
    if (server.startsWith('https://')) server = server.replace('https://', '');
    if (server.endsWith('/')) server = server.slice(0, -1);
    
    // folder is usually the last part of the server
    const parts = server.split('/');
    const folder = parts[parts.length - 1];
    
    validReciters.push({
      id: folder || r.id.toString(),
      name: r.name,
      folder: folder,
      mp3quranServer: server
    });
  }
  
  console.log(`Found ${validReciters.length} reciters with Hafs moshaf.`);
  
  // We want around 70-80 reciters in total
  const selected = validReciters.slice(0, 100);
  
  const working = [];
  const broken = [];
  
  console.log("Verifying URLs...");
  for (let i = 0; i < selected.length; i++) {
    const r = selected[i];
    const isWorking = await checkUrl(r.mp3quranServer);
    if (isWorking) {
      working.push(r);
      process.stdout.write('.');
    } else {
      broken.push(r);
      process.stdout.write('x');
    }
  }
  
  console.log(`\nWorking: ${working.length}, Broken: ${broken.length}`);
  
  // Write to reciters.ts
  const tsContent = `export interface Reciter {
  id: string;
  name: string;
  folder: string;
  mp3quranServer: string;
  everyAyahFolder?: string;
}

export const RECITERS: Reciter[] = ${JSON.stringify(working, null, 2)};
`;

  fs.writeFileSync(RECITERS_FILE, tsContent);
  console.log("Updated reciters.ts!");
  
  // Write Report
  const fsReportDir = path.dirname(REPORT_FILE);
  if (!fs.existsSync(fsReportDir)) {
      fs.mkdirSync(fsReportDir, { recursive: true });
  }

  let mdContent = `# تقرير شيوخ القرآن الكريم (المحدث)\n\n`;
  mdContent += `تم فحص وإضافة الشيوخ من واجهة MP3Quran API. تم التأكد من عمل السيرفرات الخاصة بهم بنجاح.\n\n`;
  
  mdContent += `## الشيوخ المتاحين (${working.length})\n\n`;
  mdContent += `| الرقم | اسم القارئ | رابط السيرفر |\n`;
  mdContent += `|---|---|---|\n`;
  
  working.forEach((r, idx) => {
    mdContent += `| ${idx + 1} | ${r.name} | [رابط السيرفر](https://${r.mp3quranServer}) |\n`;
  });
  
  if (broken.length > 0) {
    mdContent += `\n## روابط لم تعمل وتم استبعادها (${broken.length})\n\n`;
    broken.forEach(r => {
      mdContent += `- ${r.name} (https://${r.mp3quranServer})\n`;
    });
  }

  fs.writeFileSync(REPORT_FILE, mdContent);
  console.log("Generated reciters_report.md!");
}

main().catch(console.error);
