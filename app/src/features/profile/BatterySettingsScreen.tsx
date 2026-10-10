// INTENTIONAL DEVIATION: SafeSphere.md section 9 hardcodes 50% and 15% thresholds.
// C5 introduces user-configurable sliders and intervals with strict safety guard rails.
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../../components/Text';
import { Card } from '../../components/Card';
import { Slider } from '../../components/Slider';
import { ChipGroup } from '../../components/ChipGroup';
import { Button } from '../../components/Button';
import { useSurvivalStore } from '../../store/survivalStore';
import {
  BatterySettings,
  DEFAULT_BATTERY_SETTINGS,
  LowGpsIntervalOption,
  CriticalGpsIntervalOption,
  CriticalEvidenceOption,
} from '../../services/batterySettingsService';
import { space, radius } from '../../theme/tokens';
import { ArrowLeft, AlertCircle, RotateCcw } from 'lucide-react-native';

export interface BatterySettingsScreenProps {
  onBack: () => void;
}

export const BatterySettingsScreen: React.FC<BatterySettingsScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const batterySettings = useSurvivalStore((state) => state.batterySettings);
  const updateBatterySettings = useSurvivalStore((state) => state.updateBatterySettings);
  const resetBatterySettingsToDefault = useSurvivalStore(
    (state) => state.resetBatterySettingsToDefault
  );

  const [settings, setSettings] = useState<BatterySettings>(batterySettings);
  const [clampedNote, setClampedNote] = useState<string | null>(null);

  useEffect(() => {
    setSettings(batterySettings);
  }, [batterySettings]);

  // Handle Low Slider Change (range 30 to 80, step 1)
  const handleLowChange = (newLow: number) => {
    let nextCritical = settings.criticalBatteryLevel;
    let note: string | null = null;

    if (nextCritical >= newLow - 10) {
      nextCritical = Math.max(5, newLow - 10);
      note = `Critical threshold clamped to ${nextCritical}% (minimum 10% below Low).`;
    }

    setClampedNote(note);
    const updated: BatterySettings = {
      ...settings,
      lowBatteryLevel: newLow,
      criticalBatteryLevel: nextCritical,
    };
    setSettings(updated);
    updateBatterySettings(updated);
  };

  // Handle Critical Slider Change (range 5 to 25, step 1)
  const handleCriticalChange = (newCritical: number) => {
    let clampedCritical = newCritical;
    let note: string | null = null;

    if (newCritical >= settings.lowBatteryLevel - 10) {
      clampedCritical = Math.max(5, settings.lowBatteryLevel - 10);
      note = `Critical threshold clamped to ${clampedCritical}% (must stay 10% below Low).`;
    }

    setClampedNote(note);
    const updated: BatterySettings = {
      ...settings,
      criticalBatteryLevel: clampedCritical,
    };
    setSettings(updated);
    updateBatterySettings(updated);
  };

  const handleLowGpsChange = (val: LowGpsIntervalOption) => {
    const updated = { ...settings, gpsIntervalLow: val };
    setSettings(updated);
    updateBatterySettings(updated);
  };

  const handleCritGpsChange = (val: CriticalGpsIntervalOption) => {
    const updated = { ...settings, gpsIntervalCritical: val };
    setSettings(updated);
    updateBatterySettings(updated);
  };

  const handleEvidenceChange = (val: CriticalEvidenceOption) => {
    const updated = { ...settings, evidenceCritical: val };
    setSettings(updated);
    updateBatterySettings(updated);
  };

  const handlePitchBlackToggle = (val: boolean) => {
    const updated = { ...settings, pitchBlackAtCritical: val };
    setSettings(updated);
    updateBatterySettings(updated);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset battery settings?',
      'All thresholds and intervals will revert to SafeSphere standard defaults (Low: 50%, Critical: 15%).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setClampedNote(null);
            await resetBatterySettingsToDefault();
            setSettings(DEFAULT_BATTERY_SETTINGS);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to Profile"
          >
            <ArrowLeft size={20} color={colors.text} strokeWidth={1.75} />
          </Pressable>
          <Text variant="title" style={{ flex: 1, marginLeft: space[2] }}>
            Battery settings
          </Text>
        </View>

        <Text variant="caption" style={[styles.subtitle, { color: colors.textMuted }]}>
          Configure dynamic Survival Mode power preservation thresholds. Guard rails prevent unsafe configurations.
        </Text>

        {/* Clamped Helper Note */}
        {clampedNote ? (
          <View
            style={[
              styles.helperBanner,
              { backgroundColor: colors.surface, borderColor: colors.warning },
            ]}
          >
            <AlertCircle size={16} color={colors.warning} strokeWidth={1.75} />
            <Text
              variant="caption"
              style={{ color: colors.warning, marginLeft: space[2], flex: 1 }}
            >
              {clampedNote}
            </Text>
          </View>
        ) : null}

        {/* Low Battery Threshold Slider */}
        <Card style={styles.sectionCard}>
          <Text variant="label" style={{ fontWeight: '600' }}>
            Low battery threshold
          </Text>
          <Text variant="caption" style={{ color: colors.textMuted, marginTop: 2, marginBottom: space[2] }}>
            Enters Low tier (conserves sensors, throttles GPS polling).
          </Text>
          <Slider
            value={settings.lowBatteryLevel}
            min={30}
            max={80}
            step={1}
            unit="%"
            onValueChange={handleLowChange}
          />
        </Card>

        {/* Critical Battery Threshold Slider */}
        <Card style={styles.sectionCard}>
          <Text variant="label" style={{ fontWeight: '600' }}>
            Critical battery threshold
          </Text>
          <Text variant="caption" style={{ color: colors.textMuted, marginTop: 2, marginBottom: space[2] }}>
            Enters Critical tier (Pitch Black UI, essential heartbeat only).
          </Text>
          <Slider
            value={settings.criticalBatteryLevel}
            min={5}
            max={25}
            step={1}
            unit="%"
            onValueChange={handleCriticalChange}
          />
        </Card>

        {/* Low Tier GPS Interval Chips */}
        <Card style={styles.sectionCard}>
          <Text variant="label" style={{ fontWeight: '600' }}>
            Low tier GPS interval
          </Text>
          <Text variant="caption" style={{ color: colors.textMuted, marginTop: 2, marginBottom: space[3] }}>
            Location transmission interval during Low battery tier.
          </Text>
          <ChipGroup<LowGpsIntervalOption>
            options={[
              { label: '30s', value: 30 },
              { label: '60s', value: 60 },
              { label: '120s', value: 120 },
            ]}
            selectedValue={settings.gpsIntervalLow}
            onSelect={handleLowGpsChange}
          />
        </Card>

        {/* Critical Tier GPS Interval Chips */}
        <Card style={styles.sectionCard}>
          <Text variant="label" style={{ fontWeight: '600' }}>
            Critical tier GPS interval
          </Text>
          <Text variant="caption" style={{ color: colors.textMuted, marginTop: 2, marginBottom: space[3] }}>
            Location transmission interval during Critical battery tier.
          </Text>
          <ChipGroup<CriticalGpsIntervalOption>
            options={[
              { label: '120s', value: 120 },
              { label: '300s', value: 300 },
              { label: '600s', value: 600 },
            ]}
            selectedValue={settings.gpsIntervalCritical}
            onSelect={handleCritGpsChange}
          />
        </Card>

        {/* Evidence Capture during Critical tier */}
        <Card style={styles.sectionCard}>
          <Text variant="label" style={{ fontWeight: '600' }}>
            Evidence capture during Critical tier
          </Text>
          <Text variant="caption" style={{ color: colors.textMuted, marginTop: 2, marginBottom: space[3] }}>
            Hardware recording restrictions to preserve final milliwatts.
          </Text>
          <ChipGroup<CriticalEvidenceOption>
            options={[
              { label: 'None', value: 'None' },
              { label: 'Audio only', value: 'Audio only' },
            ]}
            selectedValue={settings.evidenceCritical}
            onSelect={handleEvidenceChange}
          />
        </Card>

        {/* Pitch Black Switch */}
        <Card style={styles.sectionCard}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, paddingRight: space[3] }}>
              <Text variant="label" style={{ fontWeight: '600' }}>
                Pitch Black in Critical tier
              </Text>
              <Text variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
                Turns all surfaces pitch black for pure OLED pixel shutoff.
              </Text>
            </View>
            <Switch
              value={settings.pitchBlackAtCritical}
              onValueChange={handlePitchBlackToggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={settings.pitchBlackAtCritical ? colors.bg : colors.textMuted}
            />
          </View>
        </Card>

        {/* Reset to defaults */}
        <View style={styles.resetContainer}>
          <Button
            variant="outline"
            size="large"
            onPress={handleReset}
            style={styles.resetButton}
          >
            <RotateCcw size={16} color={colors.text} strokeWidth={1.75} style={{ marginRight: space[2] }} />
            Reset to defaults
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: space[4],
    paddingBottom: space[8],
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space[2],
  },
  backButton: {
    padding: space[2],
    marginLeft: -space[2],
  },
  subtitle: {
    marginBottom: space[4],
    lineHeight: 18,
  },
  helperBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.control,
    padding: space[3],
    marginBottom: space[4],
  },
  sectionCard: {
    marginBottom: space[4],
    padding: space[4],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resetContainer: {
    marginTop: space[2],
    marginBottom: space[4],
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
