const fs = require('fs');
const path = require('path');

function walk(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (file !== '.bin' && file !== '.cache' && file !== '.git') {
          walk(fullPath);
        }
      } else if (file.endsWith('.js') || file.endsWith('.mjs') || file.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('euro') && content.includes('dollar') && content.includes('yen')) {
          console.log(`\n🔍 Found match in: ${fullPath}`);
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.includes('euro') && line.includes('dollar')) {
              console.log(`Line ${idx + 1}: ${line.substring(0, 300)}...`);
            }
          });
        }
      }
    }
  } catch (err) {
    // Ignore read errors
  }
}

console.log('Searching node_modules for duplicate keys...');
walk(path.resolve(__dirname, '../node_modules'));
console.log('Search complete.');
