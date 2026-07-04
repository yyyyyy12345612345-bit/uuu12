const fs = require("fs");
const fileKey = JSON.parse(fs.readFileSync("./yy10-ba274-firebase-adminsdk-fbsvc-77f9c6958a.json", "utf8")).private_key;

const lines = fileKey.replace("-----BEGIN PRIVATE KEY-----\n", "").replace("\n-----END PRIVATE KEY-----\n", "").split("\n");

console.log("Lines count:", lines.length);

let output = '  const privateKey =\n    B + K + "\\n" +\n';
for (const line of lines) {
  if (line.trim()) {
    output += `    "${line}\\n" +\n`;
  }
}
output += '    E + K + "\\n";';

console.log("GENERATED CODE:");
console.log(output);
