import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../theme/tokens';
import { Card, Text, Button } from '../../components';
import { useSurvivalStore } from '../../store/survivalStore';
import { useNeedHelpStore } from '../../store/needHelpStore';

export const SurvivalDemoControls: React.FC = () => {
  // Excluded completely from release builds
  if (!__DEV__) {
    return null;
  }

  const simulateBatteryLevel = useSurvivalStore((state) => state.simulateBatteryLevel);
  const simulatedBatteryLevel = useSurvivalStore((state) => state.simulatedBatteryLevel);
  const triggerImmediateSos = useNeedHelpStore((state) => state.triggerImmediateSos);

  return (
    <Card
      accessible={true}
      accessibilityLabel="Debug controls for demo rehearsal"
      style={styles.card}
    >
      <Text variant="label" color="warning" style={styles.title}>
        Debug Demo Controls (Dev Only)
      </Text>

      {/* Sensor Simulation Buttons */}
      <View style={styles.buttonRow}>
        <Button
          title="Simulate crash"
          variant="danger"
          accessibilityLabel="Simulate crash detected trigger. Bypasses confirmation window."
          onPress={() => triggerImmediateSos('CRASH_DETECTED')}
          style={styles.halfButton}
        />
        <Button
          title="Route deviation"
          variant="secondary"
          accessibilityLabel="Simulate route deviation trigger"
          onPress={() => triggerImmediateSos('ROUTE_DEVIATION')}
          style={styles.halfButton}
        />
      </View>

      {/* Battery Simulation Presets (SafeSphere.md section 16) */}
      <Text variant="caption" color="textMuted" style={styles.sectionLabel}>
        Simulate battery tier ({simulatedBatteryLevel !== null ? `${simulatedBatteryLevel}% active` : 'Real OS'}):
      </Text>

      <View style={styles.batteryRow}>
        <Button
          title="85%"
          variant="secondary"
          accessibilityLabel="Simulate 85% battery level"
          onPress={() => simulateBatteryLevel(85)}
          style={styles.smallButton}
        />
        <Button
          title="35%"
          variant="secondary"
          accessibilityLabel="Simulate 35% battery level"
          onPress={() => simulateBatteryLevel(35)}
          style={styles.smallButton}
        />
        <Button
          title="10%"
          variant="secondary"
          accessibilityLabel="Simulate 10% battery level. Triggers pitch black mode."
          onPress={() => simulateBatteryLevel(10)}
          style={styles.smallButton}
        />
        <Button
          title="Reset"
          variant="ghost"
          accessibilityLabel="Reset to real OS battery level"
          onPress={() => simulateBatteryLevel(null)}
          style={styles.smallButton}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing[16],
    marginBottom: spacing[8],
  },
  title: {
    marginBottom: spacing[8],
  },
  sectionLabel: {
    marginTop: spacing[12],
    marginBottom: spacing[8],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  halfButton: {
    flex: 1,
  },
  batteryRow: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  smallButton: {
    flex: 1,
    paddingHorizontal: spacing[8],
  },
});
