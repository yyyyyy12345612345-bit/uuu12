import { execFile } from "child_process";
import { FFMPEG_THREADS } from "../config.js";

/**
 * تشغيل أمر بدون shell (مصفوفة args) — أمان أعلى (مفيش shell injection)
 * ومفيش مشاكل escape في المسارات. بيرجّع { stdout, stderr } وعند الفشل
 * بيرمي Error فيه .stderr و .code زي exec القديم، فباقي الكود ما يتغيرش.
 */
export function run(cmd, args, { timeout = 0, maxBuffer = 50 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout, maxBuffer, windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = stderr;
        err.stdout = stdout;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });
  });
}

export const ffmpeg = (args, opts) => run("ffmpeg", ["-hide_banner", "-loglevel", "error", ...args], opts);
export const ffprobe = (args, opts) => run("ffprobe", args, opts);

export const threadArgs = () => (FFMPEG_THREADS ? ["-threads", String(FFMPEG_THREADS)] : []);
