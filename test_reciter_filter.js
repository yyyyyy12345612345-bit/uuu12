const { RECITERS } = require('./src/data/reciters.ts'); // Wait, this is TS, we cannot require it directly in Node without ts-node.
// Let's copy the normalizeArabic function and write a small mock RECITERS list.

const normalizeArabic = (text) => {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const RECITERS = [
  { id: "maher", name: "ماهر المعيقلي" },
  { id: "minsh", name: "محمد صديق المنشاوي" },
  { id: "Rewayat-Hafs-A-n-Assem", name: "مفتاح السلطني" },
  { id: "Rewayat-Hafs-A-n-Assem", name: "عبدالإله بن عون" }
];

const reciterSearch = "محمد صديق ا";
const queryNormalized = normalizeArabic(reciterSearch);
const queryWords = queryNormalized.split(" ").filter(Boolean);

console.log("queryWords:", queryWords);

const filtered = RECITERS.filter(r => {
  const reciterNameNormalized = normalizeArabic(r.name);
  
  return queryWords.every(word => {
    if (reciterNameNormalized.includes(word)) return true;
    
    const reciterNoSpaces = reciterNameNormalized.replace(/\s/g, "");
    const wordNoSpaces = word.replace(/\s/g, "");
    return reciterNoSpaces.includes(wordNoSpaces);
  });
});

console.log("Filtered list:", filtered.map(r => r.name));
