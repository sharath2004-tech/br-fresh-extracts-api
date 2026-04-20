import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brfreshextracts.app',
  appName: 'BR Fresh Extracts',
  webDir: 'dist',
  server: {
    // Remove this block after testing — only used for live-reload during development
    // url: 'http://192.168.1.X:5173',
    // cleartext: true,
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['phone'],
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#f5f0e8',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#f5f0e8',
    },
  },
};

export default config;
