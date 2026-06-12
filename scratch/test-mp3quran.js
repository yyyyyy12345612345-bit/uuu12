const fs = require('fs');
const https = require('https');

async function testApi() {
  return new Promise((resolve, reject) => {
    https.get('https://mp3quran.net/api/v3/reciters?language=ar', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

testApi().then(data => {
  console.log("Reciters found:", data.reciters.length);
  const first5 = data.reciters.slice(0, 5);
  console.log("Sample:", JSON.stringify(first5, null, 2));
}).catch(console.error);
