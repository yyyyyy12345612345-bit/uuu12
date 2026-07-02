import fs from "fs";
import path from "path";
import { RENDERS_DIR, LIMITS } from "../config.js";
import { logger } from "./logger.js";

export function startOutputCleanup() {
  setInterval(() => {
    try {
      if (!fs.existsSync(RENDERS_DIR)) return;
      const now = Date.now();
      const files = fs.readdirSync(RENDERS_DIR);
      let removed = 0;
      for (const f of files) {
        const p = path.resolve(RENDERS_DIR, f);
        const stat = fs.statSync(p);
        if (now - stat.mtimeMs > LIMITS.OUTPUT_TTL_MS) {
          fs.rmSync(p, { force: true });
          removed++;
        }
      }
      if (removed > 0) logger.info("output_cleanup", { removed });
    } catch (e) {
      logger.warn("output_cleanup_failed", { error: e.message });
    }
  }, 30 * 60 * 1000);
}
