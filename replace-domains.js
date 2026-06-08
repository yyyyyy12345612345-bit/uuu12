const fs = require('fs');
const path = require('path');

const dir = process.cwd();

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk(dir);
let count = 0;
files.forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.html') || file.endsWith('.md') || file.endsWith('.json') || file.endsWith('.ts') || file.endsWith('.tsx')) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('yaqeen-app.vercel.app') || content.includes('quran1-mu.vercel.app')) {
      content = content.replace(/yaqeen-app\.vercel\.app/g, 'yaqueenalquran.online');
      content = content.replace(/quran1-mu\.vercel\.app/g, 'yaqueenalquran.online');
      fs.writeFileSync(file, content);
      console.log('Updated:', file);
      count++;
    }
  }
});
console.log(`Total updated files: ${count}`);
