const fs = require('fs');
const path = require('path');

const RECITERS_FILE = path.join(__dirname, '../src/data/reciters.ts');

function parseReciters(content) {
  const arrayStart = content.indexOf('export const RECITERS: Reciter[] = [');
  const bracketStart = content.indexOf('[', arrayStart);
  const bracketEnd = content.lastIndexOf('];');
  return new Function('return ' + content.substring(bracketStart, bracketEnd + 1))();
}

function main() {
  const content = fs.readFileSync(RECITERS_FILE, 'utf-8');
  const reciters = parseReciters(content);
  console.log(`Total reciters: ${reciters.length}\n`);

  // Group by mp3quranServer
  const byServer = {};
  for (const r of reciters) {
    const srv = r.mp3quranServer;
    if (!byServer[srv]) byServer[srv] = [];
    byServer[srv].push(r);
  }

  const duplicateServers = Object.entries(byServer).filter(([, list]) => list.length > 1);
  
  console.log(`=== سيرفرات مكررة (${duplicateServers.length} سيرفر) ===\n`);
  
  let totalDuplicates = 0;
  let reportLines = ['# تقرير التحقق من تكرار السيرفرات\n'];
  reportLines.push(`وُجد **${duplicateServers.length}** سيرفر مشترك بين أكثر من قارئ.\n`);
  reportLines.push('| السيرفر | عدد القراء | أسماء القراء |');
  reportLines.push('|---|---|---|');
  
  for (const [srv, list] of duplicateServers.sort((a, b) => b[1].length - a[1].length)) {
    const names = list.map(r => r.name).join(' / ');
    console.log(`[${list.length}] ${srv}`);
    list.forEach(r => console.log(`    - ${r.name}`));
    reportLines.push(`| \`${srv}\` | ${list.length} | ${names} |`);
    totalDuplicates += list.length - 1;
  }

  console.log(`\n❌ إجمالي القراء الوهميين (نفس السيرفر): ${totalDuplicates}`);
  console.log(`✅ قراء فريدون: ${reciters.length - totalDuplicates}`);

  // Write clean reciters - keep only one per server (the first)
  const seen = new Set();
  const cleanReciters = [];
  const removed = [];

  for (const r of reciters) {
    if (!seen.has(r.mp3quranServer)) {
      seen.add(r.mp3quranServer);
      cleanReciters.push(r);
    } else {
      removed.push(r);
    }
  }

  reportLines.push('');
  reportLines.push(`\n## القراء الذين تم حذفهم لتكرار السيرفر (${removed.length})\n`);
  reportLines.push('| اسم القارئ | السيرفر المكرر |');
  reportLines.push('|---|---|');
  removed.forEach(r => reportLines.push(`| ${r.name} | \`${r.mp3quranServer}\` |`));

  fs.writeFileSync(path.join(__dirname, '../reciters_duplicates_report.md'), reportLines.join('\n'), 'utf-8');
  console.log('\nتم حفظ التقرير في: reciters_duplicates_report.md');

  // Ask if we should clean
  console.log(`\n=== ملخص ===`);
  console.log(`قبل التنظيف: ${reciters.length} قارئ`);
  console.log(`بعد التنظيف: ${cleanReciters.length} قارئ فريد`);
  console.log(`تم اكتشاف ${removed.length} قارئ مكرر (يشيرون لنفس السيرفر)`);
  console.log('\nلتنظيف الملف وإزالة المكررات، شغل: node scratch/clean-duplicates.js');
}

main();
