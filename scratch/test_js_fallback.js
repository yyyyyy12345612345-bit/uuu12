const fs = require("fs");
const admin = require("firebase-admin");

const tsContent = fs.readFileSync("./src/lib/firebaseAdmin.ts", "utf8");

// let's match the privateKey value inside buildFallback
// starts with const privateKey = and ends with E + K + "\n";
const startIdx = tsContent.indexOf("const privateKey =");
const endIdx = tsContent.indexOf("E + K + \"\\n\";");

if (startIdx === -1 || endIdx === -1) {
  console.error("Indices not found");
  process.exit(1);
}

const keyExpression = tsContent.substring(startIdx + "const privateKey =".length, endIdx + "E + K + \"\\n\";".length).trim();
console.log("Expression extracted:", keyExpression);

const B = "-----BEGIN ";
const E = "-----END ";
const K = "PRIVATE KEY-----";

const evalCode = `(function() {
  const B = "${B}";
  const E = "${E}";
  const K = "${K}";
  return ${keyExpression};
})()`;

const privateKey = eval(evalCode);
console.log("Evaluated key type:", typeof privateKey);
console.log("Evaluated key length:", privateKey ? privateKey.length : "null");
console.log("Evaluated key starts with BEGIN?", privateKey ? privateKey.startsWith("-----BEGIN") : false);

const serviceAccount = {
  projectId: "yy10-ba274",
  clientEmail: "firebase-adminsdk-fbsvc@yy10-ba274.iam.gserviceaccount.com",
  privateKey,
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("SUCCESS! The fallback private key in firebaseAdmin.ts parsed and initialized perfectly.");
} catch (e) {
  console.error("FAILED to parse key from firebaseAdmin.ts:", e.message);
}
