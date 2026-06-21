const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/api/chat/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

const targetText = "شخصيتك: إسلامي، دافئ، مختصر، محفز. استخدم إيموجيز مناسبة باعتدال 🌸📖🕋✨";
const replaceText = "شخصيتك: إسلامي، دافئ، مختصر، محفز. استخدم إيموجيز مناسبة باعتدال 🌸📖🕋✨`;";

if (content.includes(targetText)) {
  content = content.replace(targetText, replaceText);
}

const startIndex = content.indexOf("بيانات المستخدم الحالي");
const endIndex = content.indexOf("async function callAIDirectly");

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + "\n\n" + content.substring(endIndex);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Cleanup successful!");
} else {
  console.error("Could not find start or end index:", { startIndex, endIndex });
}
