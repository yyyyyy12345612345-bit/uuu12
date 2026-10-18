// لوجر بسيط بيطبع JSON منظم (سهل تجميعه في أي نظام مراقبة لاحقًا)
// ومفيش أي بيانات حساسة (زي الـ stack trace) بتتسرب للمستخدم — بس بتتسجل هنا فقط.

function line(level, msg, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta || {}),
  };
  const out = JSON.stringify(entry);
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
}

export const logger = {
  info: (msg, meta) => line("info", msg, meta),
  warn: (msg, meta) => line("warn", msg, meta),
  error: (msg, meta) => line("error", msg, meta),
};
