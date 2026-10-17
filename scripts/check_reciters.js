const fs = require('fs');

async function check() {
  const res = await fetch('https://mp3quran.net/api/v3/reciters?language=ar');
  const data = await res.json();
  const searchKeywords = [
    'عبادة', 'محمد عبادة',
    'سمرين', 'غيث',
    'عزام', 'حسين العزام',
    'عقل', 'علاء عقل',
    'عبد الحي', 'احمد عبد الحي',
    'الحنبلي', 'يوسف الحنبلي',
    'الواعظ', 'اسامة الواعظ',
    'حسن صالح',
    'نامق',
    'العدني', 'حسن فهمي',
    'طارق محمد', 'طارق'
  ];

  const matched = [];
  for (const r of data.reciters) {
    const moshafList = r.moshaf || r.moshafs || [];
    for (const kw of searchKeywords) {
      if (r.name.includes(kw)) {
        matched.push({
          id: r.id,
          name: r.name,
          moshafs: moshafList.map(m => ({
            id: m.id,
            name: m.name,
            server: m.server,
            surah_total: m.surah_total
          }))
        });
        break;
      }
    }
  }

  fs.writeFileSync('matched_reciters.json', JSON.stringify(matched, null, 2), 'utf8');
  console.log(`Matched ${matched.length} reciters:`);
  matched.forEach(m => console.log(`- ${m.name} (id: ${m.id})`));
}

check().catch(console.error);
