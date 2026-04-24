import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'quran1mu.vercel.app', // تم التعديل ليطابق ملف google-services.json
  appName: 'القرآن الكريم',
  webDir: 'out',
  server: {
    url: "https://quran-henna-one.vercel.app",
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_notification",
      iconColor: "#c5a059",
      sound: "adhan.mp3"
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#050505",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#c5a059"
    }
  }
};

export default config;
