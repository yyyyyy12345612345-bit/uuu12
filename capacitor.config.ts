import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yaqeen.app',
  appName: 'يقين | Yaqeen',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    Geolocation: {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
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
    },
    GoogleSignIn: {
      clientId: "194649785258-818jpl0c7it5dsmn7a7mufu8jc1i1uud.apps.googleusercontent.com",
      serverClientId: "194649785258-818jpl0c7it5dsmn7a7mufu8jc1i1uud.apps.googleusercontent.com",
    }
  }
};

export default config;
