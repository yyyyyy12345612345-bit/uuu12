const fs = require('fs');

async function listEveryAyah() {
  const res = await fetch('https://everyayah.com/data/');
  const html = await res.text();
  const matches = [...html.matchAll(/href="([^"]+)\/"/g)].map(m => m[1]);
  fs.writeFileSync('everyayah_folders.json', JSON.stringify(matches, null, 2));
  console.log('EveryAyah available reciter folders:', matches.length);
  console.log(matches.slice(0, 25));
}

listEveryAyah().catch(console.error);
