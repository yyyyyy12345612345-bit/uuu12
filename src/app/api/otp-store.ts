const otpStore = new Map<string, { code: string; expiresAt: number }>();

export function setOtp(key: string, code: string) {
  otpStore.set(key, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
}

export function verifyOtp(key: string, code: string): boolean {
  const entry = otpStore.get(key);
  if (!entry) return false;
  if (entry.expiresAt < Date.now()) {
    otpStore.delete(key);
    return false;
  }
  if (entry.code !== code) return false;
  otpStore.delete(key);
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore) {
    if (val.expiresAt < now) otpStore.delete(key);
  }
}, 60_000);
