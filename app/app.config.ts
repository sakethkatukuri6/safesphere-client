import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

  return {
    ...config,
    name: 'SafeSphere',
    slug: 'safesphere-citizen',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'safesphere',
    userInterfaceStyle: 'automatic',
    ios: {
      ...config.ios,
      bundleIdentifier: 'org.safesphere.citizen',
      config: {
        googleMapsApiKey,
      },
    },
    android: {
      ...config.android,
      package: 'org.safesphere.citizen',
      config: {
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#0D1316',
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      ],
      'expo-secure-store',
      'expo-font',
      [
        'react-native-maps',
        {
          apiKey: googleMapsApiKey,
        },
      ],
    ],
    extra: {
      googleMapsApiKey,
    },
  };
};
