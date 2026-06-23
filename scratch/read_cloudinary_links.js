const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\youse\\.gemini\\antigravity-ide\\brain\\a584da28-e64e-41a7-82ad-43dd7dbc86bb\\.system_generated\\logs\\transcript.jsonl';

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  const urls = new Set();
  
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      // Search recursively for URLs in parsed JSON
      const searchUrls = (obj) => {
        if (typeof obj === 'string') {
          const found = obj.match(/https:\/\/res\.cloudinary\.com[^\s"'<>\\]+/g);
          if (found) {
            found.forEach(url => urls.add(url));
          }
        } else if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            searchUrls(obj[key]);
          }
        }
      };
      searchUrls(parsed);
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  console.log('--- FOUND CLOUDINARY URLS ---');
  urls.forEach(url => console.log(url));
} else {
  console.log('Log file does not exist');
}
