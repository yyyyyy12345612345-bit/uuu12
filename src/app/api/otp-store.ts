import crypto from "crypto";

const SECRET = process.env.OTP_SECRET || "quran-app-otp-secret-key-2026";
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const WINDOW_MS = OTP_EXPIRY_MS;

function getTimeSlot(): number {
  return Math.floor(Date.now() / WINDOW_MS);
}

function generateCode(email: string, slot: number): string {
  const hash = crypto.createHmac("sha256", SECRET).update(`${email.toLowerCase()}:${slot}`).digest("hex");
  const num = parseInt(hash.slice(0, 8), 16) % 1000000;
  return num.toString().padStart(6, "0");
}

export function setOtp(_key: string, _code: string) {
  // noop — stateless, code is derived deterministically from email + time
}

export function verifyOtp(email: string, code: string): boolean {
  const emailLower = email.toLowerCase().trim();
  const current = getTimeSlot();
  // Check current and previous slot (5-min overlap)
  for (const slot of [current, current - 1]) {
    if (generateCode(emailLower, slot) === code) return true;
  }
  return false;
}

export function createSignedToken(email: string, code: string): string {
  const payload = `${email.toLowerCase()}:${code}:${Date.now() + OTP_EXPIRY_MS}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  const encoded = Buffer.from(payload).toString("base64url");
  return `${encoded}.${sig}`;
}

export function verifySignedToken(token: string): { email: string; code: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const payload = Buffer.from(parts[0], "base64url").toString("utf-8");
  const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  if (parts[1] !== expectedSig) return null;
  const [email, code, expiryStr] = payload.split(":");
  if (Date.now() > parseInt(expiryStr, 10)) return null;
  return { email, code };
}
