const https = require('https');

https.get('https://www.mp3quran.net/api/v3/reciters?language=ar', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const targets = ["عبد الباسط عبد الصمد", "محمد صديق المنشاوي", "محمود خليل الحصري"];
      
      json.reciters.forEach(r => {
        targets.forEach(t => {
          if (r.name.includes(t)) {
            console.log(`Name: ${r.name}`);
            r.moshaf.forEach(m => {
              console.log(`  Plan: ${m.name} | Server: ${m.server} | Surah List: ${m.surah_list.slice(0, 10)}...`);
            });
            console.log('-----------------------------------');
          }
        });
      });
    } catch (e) {
      console.error("Parse error:", e.message);
    }
  });
}).on('error', (e) => {
  console.error("Fetch error:", e.message);
});
