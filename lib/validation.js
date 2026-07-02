import { LIMITS } from "../config.js";
import { validateUrl } from "./security.js";

export function validateRenderRequest(body) {
  const errors = [];
  if (!body || typeof body !== "object") return ["الطلب فارغ أو غير صالح"];

  const { verses, backgroundUrl } = body;

  if (!Array.isArray(verses) || verses.length === 0) {
    errors.push("لازم تبعت مصفوفة verses بها آية واحدة على الأقل");
  } else {
    if (verses.length > LIMITS.MAX_VERSES) {
      errors.push(`أقصى عدد آيات مسموح ${LIMITS.MAX_VERSES}، إنت بعتت ${verses.length}`);
    }
    verses.forEach((v, i) => {
      if (!v || typeof v !== "object") { errors.push(`verses[${i}] غير صالحة`); return; }
      if (!v.audio || typeof v.audio !== "string" || !validateUrl(v.audio)) {
        errors.push(`verses[${i}].audio رابط غير مسموح به أو مفقود`);
      }
      if (v.text && String(v.text).length > LIMITS.MAX_VERSE_TEXT_LEN) {
        errors.push(`verses[${i}].text أطول من الحد المسموح`);
      }
      if (v.translation && String(v.translation).length > LIMITS.MAX_TRANSLATION_LEN) {
        errors.push(`verses[${i}].translation أطول من الحد المسموح`);
      }
    });
  }

  if (!backgroundUrl || typeof backgroundUrl !== "string" || !validateUrl(backgroundUrl)) {
    errors.push("backgroundUrl رابط غير مسموح به أو مفقود");
  }

  if (body.instaHandle && String(body.instaHandle).length > LIMITS.MAX_HANDLE_LEN) {
    errors.push("instaHandle أطول من اللازم");
  }
  if (body.tiktokHandle && String(body.tiktokHandle).length > LIMITS.MAX_HANDLE_LEN) {
    errors.push("tiktokHandle أطول من اللازم");
  }

  return errors;
}
