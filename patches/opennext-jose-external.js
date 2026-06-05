const fs = require("fs");
const path = require("path");

const bundleServerPath = path.join(
  process.cwd(),
  "node_modules",
  "@opennextjs",
  "cloudflare",
  "dist",
  "cli",
  "build",
  "bundle-server.js"
);

// These packages are too large for Workers (10MB limit) or require Node.js native modules
const externals = [
  "./middleware/handler.mjs",
  "jose",
  "firebase-admin",
  "@google-cloud/storage",
  "nodemailer",
  "sharp",
  "@napi-rs/canvas",
  "remotion",
  "@remotion/bundler",
  "@remotion/renderer",
  "puppeteer",
  "puppeteer-core",
  "chrome-aws-lambda",
];

try {
  let content = fs.readFileSync(bundleServerPath, "utf8");
  const alreadyPatched = content.includes('"firebase-admin"');
  if (!alreadyPatched) {
    const externalsStr = externals.map((e) => `"${e}"`).join(", ");
    content = content.replace(
      'external: ["./middleware/handler.mjs", "jose"]',
      `external: [${externalsStr}]`
    );
    fs.writeFileSync(bundleServerPath, content);
    console.log("[patch] Added large packages as externals in bundle-server.js");
  } else {
    console.log("[patch] Already patched");
  }
} catch (e) {
  console.log("[patch] Skipped:", e.message);
}
