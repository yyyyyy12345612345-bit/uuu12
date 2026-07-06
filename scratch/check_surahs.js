const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../src/data/surahs.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

console.log("Total entries:", data.length);
const missing = data.filter((s, idx) => !s.transliteration);
console.log("Missing transliteration count:", missing.length);
if (missing.length > 0) {
  console.log("First few missing:", missing.slice(0, 5));
}
