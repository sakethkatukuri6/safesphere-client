import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme/tokens';
import { Text } from './Text';
import { copy } from '../copy';

export interface AppHeaderProps {
  hasLocationPermission: boolean;
  onRequestLocationPermission?: () => void;
  isPitchBlack?: boolean;
  onPressWordmark?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  hasLocationPermission,
  onRequestLocationPermission,
  isPitchBlack = false,
  onPressWordmark,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      {/* Wordmark SAFESPHERE */}
      <Pressable
        onPress={onPressWordmark}
        disabled={!onPressWordmark}
        hitSlop={8}
      >
        <Text
          variant="wordmark"
          color={isPitchBlack ? 'textMuted' : 'text'}
          accessibilityRole="header"
        >
          {copy.shell.wordmark}
        </Text>
      </Pressable>

      {/* Location Status: 7px dot + 14/500 label */}
      {!isPitchBlack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            hasLocationPermission
              ? copy.shell.locationLive
              : `${copy.shell.locationOff}. Tap to grant location permission`
          }
          onPress={onRequestLocationPermission}
          style={styles.locationContainer}
          hitSlop={8}
        >
          <View
            style={[
              styles.locationDot,
              {
                backgroundColor: hasLocationPermission
                  ? colors.accent
                  : colors.textMuted,
              },
            ]}
          />
          <Text
            variant="label"
            color={hasLocationPermission ? 'accent' : 'textMuted'}
          >
            {hasLocationPermission
              ? copy.shell.locationLive
              : copy.shell.locationOff}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  locationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
});
