import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Linking,
  Pressable,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Constants from 'expo-constants';
import { useTheme } from '../../theme/ThemeContext';
import { darkColors, space, radius, touch } from '../../theme/tokens';
import { MapPin } from '../../components/MapPin';
import { Text } from '../../components/Text';
import { ExternalLink, Navigation } from 'lucide-react-native';

export interface HelpNearbyMapProps {
  latitude: number;
  longitude: number;
  victimName: string;
}

export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

// Nightwatch custom map styling derived strictly from tokens:
const NIGHTWATCH_DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: darkColors.bg }] },
  { elementType: 'labels.text.fill', stylers: [{ color: darkColors.textMuted }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: darkColors.bg }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: darkColors.text }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: darkColors.textMuted }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: darkColors.surface }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: darkColors.borderSubtle }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: darkColors.surface }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: darkColors.pitchBlack }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: darkColors.textMuted }] },
];

export const HelpNearbyMap: React.FC<HelpNearbyMapProps> = ({
  latitude,
  longitude,
  victimName,
}) => {
  const { colors, isDark } = useTheme();
  const [mapError, setMapError] = useState(false);

  // Check if Google Maps API key is configured
  const apiKey =
    Constants.expoConfig?.extra?.googleMapsApiKey ||
    process.env.GOOGLE_MAPS_API_KEY ||
    '';

  const hasApiKey = Boolean(apiKey && apiKey.trim().length > 0);

  const handleOpenSystemMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });

    Linking.openURL(url!).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      ).catch(() => {});
    });
  };

  // Safe fallback card if on web, no API key, or map fails to mount (C8)
  if (Platform.OS === 'web' || !hasApiKey || mapError) {
    return (
      <View
        style={[
          styles.fallbackCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.fallbackHeader}>
          <MapPin variant="dot" />
          <View style={styles.coordsWrapper}>
            <Text
              variant="label"
              style={[
                styles.coordsText,
                { color: colors.text, fontVariant: ['tabular-nums'] },
              ]}
            >
              {formatCoordinates(latitude, longitude)}
            </Text>
            <Text variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
              Coordinates verified by dispatch orchestrator
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleOpenSystemMaps}
          style={[
            styles.openMapsButton,
            {
              borderColor: colors.accent,
              backgroundColor: 'transparent',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open in system maps"
        >
          <Navigation
            size={18}
            color={colors.accent}
            strokeWidth={1.75}
            style={{ marginRight: space[2] }}
          />
          <Text
            variant="body"
            style={{ color: colors.accent, fontWeight: '500' }}
          >
            Open in system maps
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.mapContainer, { borderColor: colors.border }]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        customMapStyle={isDark ? NIGHTWATCH_DARK_MAP_STYLE : undefined}
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={victimName}
        >
          <MapPin variant="dot" />
        </Marker>
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: 240,
    width: '100%',
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: space[4],
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fallbackCard: {
    width: '100%',
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space[4],
    marginTop: space[4],
  },
  fallbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space[4],
  },
  coordsWrapper: {
    marginLeft: space[3],
    flex: 1,
  },
  coordsText: {
    fontSize: 15,
    fontWeight: '500',
  },
  openMapsButton: {
    height: 56,
    borderRadius: radius.control,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
