const fs = require('fs');

const data = JSON.parse(fs.readFileSync('C:\\Users\\youse\\.gemini\\antigravity\\brain\\e77cce32-a4a3-4e05-8699-e9282e77d367\\.system_generated\\steps\\37\\content.md', 'utf8').split('---')[1]);

const reciters = data.reciters;

const outputReciters = reciters.map(r => {
    const hafs = r.moshaf.find(m => m.name.includes('حفص') && m.name.includes('مرتل')) || r.moshaf[0];
    if (!hafs) return null;
    
    // Clean server URL: remove https:// and trailing /
    let server = hafs.server.replace('https://', '').replace(/\/$/, '');
    
    return {
        id: r.id.toString(),
        name: r.name,
        // folder: '', // We might not have everyayah folder for all
        mp3quranServer: server,
        // serverType: 'mp3quran' // Default
    };
}).filter(Boolean);

console.log(JSON.stringify(outputReciters, null, 2));
