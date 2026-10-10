import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { spacing, borders, radii } from '../theme/tokens';
import { Card } from './Card';
import { Text } from './Text';
import { BatteryTrack } from './BatteryTrack';
import { useSurvivalStore } from '../store/survivalStore';
import { useNeedHelpStore } from '../store/needHelpStore';

export interface SurvivalCardProps {
  style?: StyleProp<ViewStyle>;
}

export const SurvivalCard: React.FC<SurvivalCardProps> = ({ style }) => {
  const { colors } = useTheme();
  const batteryLevel = useSurvivalStore((state) => state.batteryLevel);
  const lowLevel = useSurvivalStore((state) => state.batterySettings?.lowBatteryLevel ?? 50);
  const criticalLevel = useSurvivalStore((state) => state.batterySettings?.criticalBatteryLevel ?? 15);
  const screenState = useNeedHelpStore((state) => state.screenState);

  const isActive = screenState !== 'IDLE';

  return (
    <Card
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`Survival Mode. Status: ${isActive ? 'Active' : 'Standby'}. Battery ${batteryLevel} percent.`}
      style={[styles.card, style]}
    >
      {/* Top Header: Title "Survival Mode" (14/500) left; state right (14, accent): "Standby" / "Active" */}
      <View style={styles.headerRow}>
        <Text variant="label" color="text">
          Survival Mode
        </Text>
        <Text variant="label" color="accent">
          {isActive ? 'Active' : 'Standby'}
        </Text>
      </View>

      {/* Margin-top 12: 6px battery track with custom user thresholds */}
      <View style={styles.trackContainer}>
        <BatteryTrack
          batteryLevel={batteryLevel}
          lowLevel={lowLevel}
          criticalLevel={criticalLevel}
        />
      </View>

      {/* Caption (12, textMuted, margin-top 10) */}
      <Text variant="caption" color="textMuted" style={styles.caption}>
        Activates automatically when battery runs low during an alert.
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing[16],
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackContainer: {
    marginTop: spacing[12],
  },
  caption: {
    marginTop: 10,
    lineHeight: 16,
  },
});
