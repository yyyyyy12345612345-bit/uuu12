import { API_KEY } from "../config.js";

export function requireApiKey(req, res, next) {
  if (!API_KEY) return next(); // مفتاح مش مفعّل -> السيرفر مفتوح (بيئة تطوير فقط)
  const provided = req.headers["x-api-key"];
  if (provided && provided === API_KEY) return next();
  return res.status(401).json({ error: "مفتاح API مفقود أو غير صحيح" });
}
