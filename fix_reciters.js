const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'data', 'reciters.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Find the array part
const arrayMatch = content.match(/export const RECITERS: Reciter\[\] = (\[[\s\S]*?\]);/);
if (!arrayMatch) {
  console.error("Could not find RECITERS array");
  process.exit(1);
}

const arrayStr = arrayMatch[1];
let reciters;
try {
  reciters = eval(arrayStr);
} catch (e) {
  console.error("Failed to eval array:", e);
  process.exit(1);
}

console.log(`Loaded ${reciters.length} reciters.`);

const seenIds = new Set();
const duplicateIds = new Set();

reciters.forEach(r => {
  if (seenIds.has(r.id)) {
    duplicateIds.add(r.id);
  }
  seenIds.add(r.id);
});

console.log("Duplicate IDs found:", Array.from(duplicateIds));

const newSeenIds = new Set();
let fixCount = 0;

const updatedReciters = reciters.map(r => {
  let id = r.id;
  
  // If the ID is a duplicate or known broken one, fix it
  if (duplicateIds.has(id) || id === "Rewayat-Hafs-A-n-Assem" || newSeenIds.has(id)) {
    const serverParts = r.mp3quranServer.split('/');
    const pathParts = serverParts.slice(1);
    const filteredParts = pathParts.filter(p => p && p !== "Rewayat-Hafs-A-n-Assem" && p !== "Rewayat" && p !== "Hafs" && p !== "Assem");
    
    let newId = filteredParts.join('_').replace(/[^a-zA-Z0-9_]/g, '');
    if (!newId) newId = 'reciter';
    
    // Make sure it doesn't collide
    let counter = 1;
    let finalId = newId;
    while (newSeenIds.has(finalId) || finalId === "Rewayat-Hafs-A-n-Assem") {
      finalId = `${newId}_${counter}`;
      counter++;
    }
    
    id = finalId;
    fixCount++;
  }
  
  newSeenIds.add(id);
  return {
    ...r,
    id
  };
});

console.log(`Fixed ${fixCount} reciters.`);

const newContent = `export interface Reciter {
  id: string;
  name: string;
  folder: string;
  mp3quranServer: string;
  everyAyahFolder?: string; // Standard EveryAyah folder name
}

export const RECITERS: Reciter[] = ${JSON.stringify(updatedReciters, null, 2)};
`;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log("Successfully updated src/data/reciters.ts!");
