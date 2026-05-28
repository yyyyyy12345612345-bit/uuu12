/**
 * 📱 Device Detection Utility
 * Detects platform: Android, iOS, PWA, or Browser/Emulator
 */

export type DevicePlatform = 'android' | 'ios' | 'pwa' | 'browser' | 'emulator';

/**
 * Detect if the app is running as an installed PWA
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.startsWith('android-app://')
  );
}

/**
 * Detect Android device via User Agent
 */
export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * Detect iOS device via User Agent
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPad OS 13+ reports as MacIntel but has touch
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Detect if running in an emulator or desktop browser
 */
export function isEmulatorOrDesktop(): boolean {
  if (typeof navigator === 'undefined') return true;
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = isAndroid() || isIOS();
  const isEmulator =
    ua.includes('sdk') ||
    ua.includes('emulator') ||
    ua.includes('android sdk') ||
    (isAndroid() && /avd|sdk_gphone/i.test(ua));
  return !isMobile || isEmulator;
}

/**
 * Get the current platform
 */
export function getPlatform(): DevicePlatform {
  if (typeof window === 'undefined') return 'browser';
  
  // Check if already installed as PWA
  if (isPWA()) return 'pwa';
  
  const ua = navigator.userAgent.toLowerCase();
  
  // Emulator detection (Android SDK emulator)
  if (isAndroid() && /sdk|emulator|android sdk|avd|sdk_gphone/i.test(ua)) {
    return 'emulator';
  }
  
  if (isAndroid()) return 'android';
  if (isIOS()) return 'ios';
  
  return 'browser';
}

/**
 * Check if the app APK is already installed (Android)
 * Uses Intent URL scheme detection
 */
export async function isApkInstalled(): Promise<boolean> {
  if (!isAndroid() || isPWA()) return false;
  
  // Check localStorage flag set by the APK itself on install
  const installedFlag = localStorage.getItem('yaqeen_apk_installed');
  if (installedFlag === 'true') return true;
  
  // Try to detect via custom URL scheme (the APK should register this)
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 800);
    
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = 'yaqeen://check';
      document.body.appendChild(iframe);
      
      // If the app handles the custom scheme, it will respond
      window.addEventListener('focus', () => {
        clearTimeout(timeout);
        document.body.removeChild(iframe);
        resolve(true);
      }, { once: true });
    } catch {
      clearTimeout(timeout);
      resolve(false);
    }
  });
}

/**
 * Check if iOS PWA is already installed
 */
export function isIOSPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (window.navigator as any).standalone === true;
}

/**
 * Get banner state from localStorage
 */
export function getBannerDismissed(type: 'apk' | 'pwa'): boolean {
  if (typeof localStorage === 'undefined') return false;
  const dismissed = localStorage.getItem(`banner_dismissed_${type}`);
  if (!dismissed) return false;
  // Reset after 3 days
  const dismissedAt = parseInt(dismissed);
  return Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000;
}

export function setBannerDismissed(type: 'apk' | 'pwa'): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`banner_dismissed_${type}`, Date.now().toString());
}
