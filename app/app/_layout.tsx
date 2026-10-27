import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import colors from '../theme/colors';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'IBMPlexSans-Regular': IBMPlexSans_400Regular,
    'IBMPlexSans-Medium': IBMPlexSans_500Medium,
    'IBMPlexSans-SemiBold': IBMPlexSans_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="hold-confirm" options={{ headerShown: false }} />
        <Stack.Screen name="active-emergency" options={{ headerShown: false }} />
        <Stack.Screen name="alert-sent" options={{ headerShown: false }} />
        <Stack.Screen name="live-status" options={{ headerShown: false }} />
        <Stack.Screen name="silent-help" options={{ headerShown: false }} />
        <Stack.Screen name="survival" options={{ headerShown: false }} />
        <Stack.Screen name="offline-map" options={{ headerShown: false }} />
        <Stack.Screen name="incident-details" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
