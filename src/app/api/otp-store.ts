// Shared OTP store for server-side verification
// Uses a global Map that persists across requests within the same instance

const otpStore = new Map<string, { code: string; expiresAt: number }>();

export function setOtp(phone: string, code: string) {
  otpStore.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
}

export function verifyOtp(phone: string, code: string): boolean {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    otpStore.delete(phone);
    return false;
  }
  if (entry.code !== code) return false;
  otpStore.delete(phone);
  return true;
}

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore) {
    if (val.expiresAt < now) otpStore.delete(key);
  }
}, 60_000);
