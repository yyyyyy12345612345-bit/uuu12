const fs = require('fs');
const path = require('path');

try {
  const filePath = path.join(process.cwd(), "src", "data", "reciters.ts");
  console.log("Reading file from:", filePath);
  if (!fs.existsSync(filePath)) {
    console.error("File does not exist!");
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf8");

  // Extract the array using match
  const arrayMatch = content.match(/export const RECITERS: Reciter\[\] = (\[[\s\S]*?\]);/);
  if (!arrayMatch) {
    console.error("Could not find RECITERS array in file!");
    process.exit(1);
  }

  const arrayStr = arrayMatch[1];
  console.log("Array string length:", arrayStr.length);
  
  let reciters;
  try {
    reciters = new Function(`return ${arrayStr}`)();
    console.log("Successfully parsed reciters array. Count:", reciters.length);
  } catch (parseError) {
    console.error("Failed to parse array via new Function:", parseError.message);
  }
} catch (e) {
  console.error("Error in test script:", e);
}
