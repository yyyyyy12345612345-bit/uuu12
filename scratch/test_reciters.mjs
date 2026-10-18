import fs from 'fs';

const code = fs.readFileSync('src/data/reciters.ts', 'utf8');
const lines = code.split('\n');

const reciterIds = [];
for (const line of lines) {
  const m = line.match(/"id":\s*"([^"]+)"/);
  if (m) reciterIds.push(m[1]);
}

console.log('Total reciters:', reciterIds.length);
console.log('Sample reciters:', reciterIds.slice(0, 20));
