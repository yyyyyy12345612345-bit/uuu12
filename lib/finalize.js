import fs from "fs";
import { HOST, KEEP_LOCAL_AFTER_TELEGRAM } from "../config.js";
import { uploadVideoToTelegram } from "./telegram.js";
import { setCompleted } from "./jobs.js";
import { logger } from "./logger.js";

/** آخر خطوة مشتركة: رفع نسخة لتليجرام (لو مناسب) + تسجيل النجاح في الـ job. */
export async function publishResult({ jobId, outPath, surahName, reciterName, durationSec }) {
  const finalVideoUrl = `https://${HOST}/download/${jobId}.mp4`;
  const caption = `📖 ${surahName || "تلاوة قرآنية"} | بصوت ${reciterName || "قارئ"}`;

  const extra = {};
  let publicUrl = finalVideoUrl;
  try {
    const tgResult = await uploadVideoToTelegram(outPath, caption);
    if (tgResult && tgResult.fileId) {
      logger.info("render_uploaded_to_telegram", { jobId, fileId: tgResult.fileId });
      extra.telegramFileId = tgResult.fileId;
      extra.telegramUrl = `https://${HOST}/telegram-proxy/${tgResult.fileId}.mp4`;
      // لو مش عايز نسخة محلية: نمسحها ونخلّي الرابط الأساسي هو رابط تليجرام (يفضل شغال)
      if (!KEEP_LOCAL_AFTER_TELEGRAM) {
        try { fs.rmSync(outPath, { force: true }); } catch {}
        publicUrl = extra.telegramUrl;
      }
    }
  } catch (uploadErr) {
    logger.warn("telegram_upload_skip", { error: uploadErr.message });
  }

  setCompleted(jobId, publicUrl, extra);
  logger.info("render_completed", { jobId, durationSec: Number(durationSec).toFixed(2), finalVideoUrl: publicUrl });
}
