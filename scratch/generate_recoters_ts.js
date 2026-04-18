const fs = require('fs');

const rawData = fs.readFileSync('C:\\Users\\youse\\.gemini\\antigravity\\brain\\e77cce32-a4a3-4e05-8699-e9282e77d367\\.system_generated\\steps\\37\\content.md', 'utf8');
const data = JSON.parse(rawData.split('---')[1]);

const reciters = data.reciters;

const outputReciters = reciters.map(r => {
    // Priority: Hafs Murattal
    const hafs = r.moshaf.find(m => m.name.includes('حفص') && m.name.includes('مرتل')) || r.moshaf[0];
    if (!hafs) return null;
    
    let server = hafs.server.replace('https://', '').replace(/\/$/, '');
    
    return {
        id: server.split('/').pop() || r.id.toString(),
        name: r.name,
        folder: server.split('/').pop() || '',
        mp3quranServer: server
    };
}).filter(Boolean);

// Manual fixes/additions for requested ones not in API or needing better names
const manualRequested = [
    { id: "sds", name: "عبد الرحمن السديس", folder: "sds", mp3quranServer: "server11.mp3quran.net/sds" },
    { id: "shur", name: "سعود الشريم", folder: "shur", mp3quranServer: "server7.mp3quran.net/shur" },
    { id: "juhani", name: "عبد الله عواد الجهني", folder: "juhani", mp3quranServer: "server13.mp3quran.net/juhani" },
    { id: "jbr", name: "علي جابر", folder: "jbr", mp3quranServer: "server11.mp3quran.net/jbr" },
    { id: "maher", name: "ماهر المعيقلي", folder: "maher", mp3quranServer: "server12.mp3quran.net/maher" },
    { id: "balilah", name: "بندر بليلة", folder: "balilah", mp3quranServer: "server6.mp3quran.net/balilah" },
    { id: "a_mossad", name: "عبد الرحمن مسعد (مكتبة)", folder: "a_mossad", mp3quranServer: "server16.mp3quran.net/a_mossad" },
    { id: "mustafa", name: "مصطفى إسماعيل", folder: "mustafa", mp3quranServer: "server8.mp3quran.net/mustafa" },
    { id: "naena", name: "أحمد نعينع", folder: "naena", mp3quranServer: "server8.mp3quran.net/naena" },
    { id: "bahtimi", name: "كامل يوسف البهتيمي", folder: "bahtimi", mp3quranServer: "server6.mp3quran.net/bahtimi" },
    { id: "refat", name: "محمد رفعت", folder: "refat", mp3quranServer: "server14.mp3quran.net/refat" },
    { id: "taha_fashni", name: "طه الفشني", folder: "taha_fashni", mp3quranServer: "server14.mp3quran.net/taha_fashni" },
    { id: "shuaisha", name: "أبو العينين شعيشع", folder: "shuaisha", mp3quranServer: "server14.mp3quran.net/shuaisha" },
    { id: "bna", name: "محمود علي البنا", folder: "bna", mp3quranServer: "server8.mp3quran.net/bna" },
    { id: "kaseb", name: "أحمد كاسب", folder: "kaseb", mp3quranServer: "server16.mp3quran.net/kaseb/Rewayat-Hafs-A-n-Assem" },
    { id: "m_ahmad_hassan", name: "محمد أحمد حسن", folder: "m_ahmad_hassan", mp3quranServer: "server16.mp3quran.net/m_ahmad_hassan/Rewayat-Hafs-A-n-Assem" }
];

// Merge and remove duplicates by name
const finalMap = new Map();
manualRequested.forEach(r => finalMap.set(r.name, r));
outputReciters.forEach(r => {
    if (!finalMap.has(r.name)) {
        finalMap.set(r.name, r);
    }
});

const finalList = Array.from(finalMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'ar'));

let tsContent = `export interface Reciter {
  id: string;
  name: string;
  folder: string;
  mp3quranServer: string;
  serverType?: "everyayah" | "qurancdn" | "islamic_network";
}

export const RECITERS: Reciter[] = ${JSON.stringify(finalList, null, 2)};
`;

fs.writeFileSync('c:\\Users\\youse\\OneDrive\\Desktop\\New folder (2)\\Quran-main\\src\\data\\reciters.ts', tsContent);
console.log("Successfully updated reciters.ts with " + finalList.length + " reciters.");
