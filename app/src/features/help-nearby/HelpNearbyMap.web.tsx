import React from 'react';
import { View, StyleSheet, Linking, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { space, radius } from '../../theme/tokens';
import { MapPin } from '../../components/MapPin';
import { Text } from '../../components/Text';
import { Navigation } from 'lucide-react-native';
import { formatCoordinates } from './HelpNearbyMap';

export interface HelpNearbyMapProps {
  latitude: number;
  longitude: number;
  victimName: string;
}

export const HelpNearbyMap: React.FC<HelpNearbyMapProps> = ({
  latitude,
  longitude,
  victimName,
}) => {
  const { colors } = useTheme();

  const handleOpenSystemMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {});
  };

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
};

const styles = StyleSheet.create({
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
