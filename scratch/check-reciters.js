const fs = require('fs');
const https = require('https');
const path = require('path');

const RECITERS_FILE = path.join(__dirname, '../src/data/reciters.ts');
const REPORT_FILE = path.join(__dirname, '../reciters_report.md');

async function fetchApi() {
  return new Promise((resolve, reject) => {
    function doGet(url) {
      const lib = url.startsWith('https') ? https : require('http');
      lib.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
      }, (res) => {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return doGet(res.headers.location);
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch(e) {
            reject(new Error('Failed to parse JSON: ' + data.slice(0, 200)));
          }
        });
      }).on('error', reject);
    }
    doGet('https://mp3quran.net/api/v3/reciters?language=ar');
  });
}

async function checkUrl(url) {
  return new Promise((resolve) => {
    let fullUrl = url;
    if (!fullUrl.startsWith('http')) fullUrl = 'https://' + fullUrl;
    if (!fullUrl.endsWith('/')) fullUrl += '/';
    fullUrl += '001.mp3';
    
    const req = https.request(fullUrl, { method: 'HEAD', timeout: 5000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

function parseOldReciters(content) {
  const startIndex = content.indexOf('export const RECITERS: Reciter[] = [');
  if (startIndex === -1) throw new Error("Could not find RECITERS array in file");
  
  const arrayStart = content.indexOf('[', startIndex);
  const arrayEnd = content.lastIndexOf('];');
  
  const arrayString = content.substring(arrayStart, arrayEnd + 1);
  return new Function('return ' + arrayString)();
}

async function main() {
  console.log("Reading existing reciters.ts...");
  const tsContent = fs.readFileSync(RECITERS_FILE, 'utf-8');
  const oldReciters = parseOldReciters(tsContent);
  console.log(`Found ${oldReciters.length} existing reciters.`);

  console.log("Fetching live MP3Quran API...");
  const liveData = await fetchApi();
  const liveReciters = liveData.reciters;

  // Extract Hafs servers from live data
  const apiHafsServers = [];
  for (const r of liveReciters) {
    const hafs = r.moshaf.find(m => m.rewaya_id === 1);
    if (hafs) {
      let srv = hafs.server.replace('https://', '').replace('http://', '');
      if (srv.endsWith('/')) srv = srv.slice(0, -1);
      
      const parts = srv.split('/');
      const folder = parts[parts.length - 1];
      
      apiHafsServers.push({
        id: folder || r.id.toString(),
        name: r.name,
        folder: folder,
        mp3quranServer: srv,
        apiObj: r
      });
    }
  }

  const working = [];
  const broken = [];
  const existingNames = new Set();

  console.log("Verifying existing reciters...");
  // Batch processing
  for (let i = 0; i < oldReciters.length; i++) {
    const r = oldReciters[i];
    // Check if it's in the API
    const apiMatch = apiHafsServers.find(a => a.name === r.name || a.mp3quranServer.includes(r.mp3quranServer) || r.mp3quranServer.includes(a.mp3quranServer));
    
    if (apiMatch) {
      // It's in the live API! Just update the server to be sure it's correct.
      r.mp3quranServer = apiMatch.mp3quranServer;
      r.name = apiMatch.name; // normalize name
      working.push(r);
      existingNames.add(r.name);
      process.stdout.write('O'); // Online API match
    } else {
      // Not in API, do a manual HTTP check
      const isWorking = await checkUrl(r.mp3quranServer);
      if (isWorking) {
        working.push(r);
        existingNames.add(r.name);
        process.stdout.write('W'); // Manual Working
      } else {
        broken.push(r);
        process.stdout.write('X'); // Broken
      }
    }
  }
  
  console.log(`\nVerified existing: ${working.length} working, ${broken.length} broken.`);

  // Test ALL API reciters and add working ones
  console.log(`\nTesting ALL ${apiHafsServers.length} reciters from API (this may take a while)...`);
  let added = 0;
  const newBroken = [];
  
  for (const a of apiHafsServers) {
    if (!existingNames.has(a.name)) {
      const isWorking = await checkUrl(a.mp3quranServer);
      if (isWorking) {
        working.push({
          id: a.id,
          name: a.name,
          folder: a.folder,
          mp3quranServer: a.mp3quranServer
        });
        existingNames.add(a.name);
        added++;
        process.stdout.write('+');
      } else {
        newBroken.push(a);
        process.stdout.write('-');
      }
    }
  }
  
  broken.push(...newBroken);
  console.log(`\nAdded ${added} new working reciters. ${newBroken.length} from API were broken. Total is now ${working.length}.`);

  // Write new reciters.ts
  const newTsContent = `export interface Reciter {
  id: string;
  name: string;
  folder: string;
  mp3quranServer: string;
  everyAyahFolder?: string; // Standard EveryAyah folder name
}

export const RECITERS: Reciter[] = ${JSON.stringify(working, null, 2)};
`;

  fs.writeFileSync(RECITERS_FILE, newTsContent, 'utf-8');
  console.log("Updated reciters.ts successfully.");

  // Write Markdown Report
  let mdContent = `# تقرير التحقق من الشيوخ وإضافتهم\n\n`;
  mdContent += `تم فحص جميع الشيوخ الموجودين في الملف الأصلي، وتم استبعاد الروابط المعطلة، وتم إضافة ${added} شيخاً جديداً من المصدر الرسمي MP3Quran.\n\n`;
  
  if (broken.length > 0) {
    mdContent += `## ❌ الشيوخ الذين تم مسحهم لأن سيرفراتهم معطلة (${broken.length}):\n`;
    broken.forEach(r => {
      mdContent += `- **${r.name}** (السيرفر المعطل: \`${r.mp3quranServer}\`)\n`;
    });
    mdContent += `\n`;
  }
  
  mdContent += `## ✅ قائمة الشيوخ المعتمدين والذين يعملون بكفاءة (${working.length}):\n\n`;
  mdContent += `| الرقم | اسم الشيخ | الرابط المستخدم |\n`;
  mdContent += `|---|---|---|\n`;
  
  working.forEach((r, idx) => {
    mdContent += `| ${idx + 1} | ${r.name} | [رابط السيرفر](https://${r.mp3quranServer}) |\n`;
  });

  fs.writeFileSync(REPORT_FILE, mdContent, 'utf-8');
  console.log("Generated reciters_report.md successfully.");
  console.log("All done!");
}

main().catch(console.error);
