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

try {
  let content = fs.readFileSync(bundleServerPath, "utf8");
  if (content.includes('external: ["./middleware/handler.mjs"]')) {
    content = content.replace(
      'external: ["./middleware/handler.mjs"]',
      'external: ["./middleware/handler.mjs", "jose"]'
    );
    fs.writeFileSync(bundleServerPath, content);
    console.log("[patch] Added jose to externals in bundle-server.js");
  } else {
    console.log("[patch] Already patched or format changed");
  }
} catch (e) {
  console.log("[patch] Skipped:", e.message);
}
