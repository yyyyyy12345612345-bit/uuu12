import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'quran1mu.vercel.app',
  appName: 'القرآن الكريم',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_notification",
      iconColor: "#c5a059",
      sound: "adhan.mp3"
    },
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      backgroundColor: "#050505",
      showSpinner: false,
      androidScaleType: "CENTER_CROP"
    }
  }
};

export default config;
