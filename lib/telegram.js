import fs from "fs";
import path from "path";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, TELEGRAM_MAX_MB } from "../config.js";
import { logger } from "./logger.js";

const TELEGRAM_UPLOAD_TIMEOUT_MS = parseInt(process.env.TELEGRAM_UPLOAD_TIMEOUT_MS || "180000", 10);

/**
 * 🚀 رفع الفيديو مباشرة إلى تليجرام واستخراج رابط التحميل السحابي الدائم
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

  // v24: ملف أكبر من حد البوت (50MB) هيترفض في الآخر، فبنتخطاه من الأول بدل ما نضيّع دقايق رفع.
  const sizeMB = fs.statSync(filePath).size / 1048576;
  if (sizeMB > TELEGRAM_MAX_MB) {
    logger.info("telegram_upload_skipped_too_large", { sizeMB: Math.round(sizeMB), limitMB: TELEGRAM_MAX_MB });
    return null;
  }

  try {
    logger.info("telegram_upload_start", { filePath, caption });

    const fileName = path.basename(filePath);
    
    // إنشاء Blob للملف بشكل خفيف على الذاكرة
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
      signal: AbortSignal.timeout(TELEGRAM_UPLOAD_TIMEOUT_MS),
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

    // (v24) شلنا getFile: مش محتاجينه، وبيفشل للملفات الأكبر من 20MB فكان بيرجّع null حتى لو الرفع نجح.
    // التوكن عمره ما بيتسجّل في اللوج.
    logger.info("telegram_upload_success", { fileId });

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
