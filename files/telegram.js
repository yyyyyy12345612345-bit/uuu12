import fs from "fs";
import path from "path";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID } from "./config.js";
import { logger } from "./logger.js";

/**
 * 🚀 رفع الفيديو مباشرة إلى تليجرام واستخراج معرف الملف السحابي الدائم
 * ثم حذف الملف من السيرفر فوراً لتوفير مساحة التخزين وحماية السيرفر.
 */
export async function uploadVideoToTelegram(filePath, caption = "") {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHANNEL_ID || TELEGRAM_CHANNEL_ID;

  if (!token || !chatId) {
    logger.warn("telegram_config_missing", {
      message: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID not set. Skipping Telegram upload."
    });
    return null;
  }

  try {
    logger.info("telegram_upload_start", { filePath, caption });

    const fileName = path.basename(filePath);
    
    let fileBlob;
    if (typeof fs.openAsBlob === "function") {
      fileBlob = await fs.openAsBlob(filePath);
    } else {
      const buffer = fs.readFileSync(filePath);
      fileBlob = new Blob([buffer], { type: "video/mp4" });
    }

    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("video", fileBlob, fileName);
    if (caption) {
      formData.append("caption", caption.substring(0, 1024));
    }
    formData.append("supports_streaming", "true");

    const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
      method: "POST",
      body: formData,
    });

    const sendData = await sendRes.json();
    if (!sendRes.ok || !sendData.ok) {
      logger.error("telegram_send_video_failed", sendData);
      return null;
    }

    const videoObj = sendData.result?.video || sendData.result?.document;
    const fileId = videoObj?.file_id;

    if (!fileId) {
      logger.error("telegram_no_file_id", sendData);
      return null;
    }

    logger.info("telegram_upload_success", { fileId });

    // ✅ مسح الملف من قرص السيرفر فوراً (Zero Server Storage)
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info("telegram_local_file_cleaned", { filePath });
      }
    } catch (cleanupErr) {
      logger.warn("telegram_cleanup_failed", { error: cleanupErr.message });
    }

    return {
      success: true,
      fileId,
      messageId: sendData.result?.message_id,
    };
  } catch (error) {
    logger.error("telegram_upload_exception", { error: error.message });
    return null;
  }
}
