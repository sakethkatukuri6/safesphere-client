import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/tokens';
import { Text, SosButton, StatusRow } from '../../components';
import { copy } from '../../copy';
import { useNeedHelpStore } from '../../store/needHelpStore';
import { useSurvivalStore } from '../../store/survivalStore';

export const PitchBlackView: React.FC = () => {
  const startManualSos = useNeedHelpStore((state) => state.startManualSos);
  const batteryLevel = useSurvivalStore((state) => state.batteryLevel);
  const gpsIntervalSeconds = useSurvivalStore((state) => state.gpsIntervalSeconds);

  return (
    <View style={styles.container}>
      {/* Top spacer */}
      <View style={styles.spacer} />

      {/* Centered: SosButton without the breathing ring (button only, 172px, danger fill, 34px "SOS") */}
      <View style={styles.sosContainer}>
        <SosButton showBreathingRing={false} onPress={startManualSos} />
      </View>

      {/* Below button: battery readout: "12%" in display style, caption "battery" below */}
      <View style={styles.batteryContainer}>
        <Text variant="display" color="text" style={styles.batteryText}>
          {batteryLevel}%
        </Text>
        <Text variant="caption" color="textMuted" style={styles.batteryCaption}>
          {copy.survival.batteryCaption}
        </Text>
      </View>

      {/* Middle spacer */}
      <View style={styles.spacer} />

      {/* Below battery: 3 plain StatusRows (no card, no border, no background) */}
      <View style={styles.rowsContainer}>
        <StatusRow
          label={copy.survival.rowGpsInterval}
          value={`${gpsIntervalSeconds} s`}
          hasBorderBottom={false}
        />
        <StatusRow
          label={copy.survival.rowEvidenceCapture}
          value="Telemetry only"
          hasBorderBottom={false}
        />
        <StatusRow
          label={copy.survival.rowSensors}
          value={copy.survival.sensorsValue}
          hasBorderBottom={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.pitchBlack,
    justifyContent: 'space-between',
    paddingVertical: spacing[16],
  },
  spacer: {
    flex: 1,
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  batteryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[24],
  },
  batteryText: {
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  batteryCaption: {
    marginTop: spacing[4],
    textAlign: 'center',
  },
  rowsContainer: {
    width: '100%',
    paddingHorizontal: spacing[8],
    marginBottom: spacing[8],
  },
});
