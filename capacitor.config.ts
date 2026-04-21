import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'quran1mu.vercel.app', // تم التعديل ليطابق ملف google-services.json
  appName: 'Quran App',
  webDir: 'out',
  server: {
    url: 'https://quran-main-seven.vercel.app',
    cleartext: true
  },
  plugins: {
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
