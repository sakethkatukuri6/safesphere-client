import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Map, Power } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import colors from '../theme/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import { useBatteryStore } from '../store/batteryStore';

export default function SurvivalModeScreen() {
  const router = useRouter();
  const {
    batteryLevel,
    isSurvivalMode,
    setSurvivalMode,
    adaptivePowerMode,
    setAdaptivePowerMode,
    lowDataTelemetry,
    setLowDataTelemetry,
    offlineContinuity,
    setOfflineContinuity,
  } = useBatteryStore();

  const handleExitSurvival = () => {
    setSurvivalMode(false);
    router.replace('/(tabs)');
  };

  const displayLevel = Math.min(100, Math.max(1, batteryLevel <= 15 ? batteryLevel : 8));
  const size = 160;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - displayLevel / 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Survival Mode</Text>
          <Text style={styles.headerSubtitle}>
            Minimal mode for longer safety
          </Text>
        </View>
        <Switch
          value={isSurvivalMode}
          onValueChange={setSurvivalMode}
          trackColor={{ false: colors.border, true: colors.greenDark }}
          thumbColor={isSurvivalMode ? colors.green : colors.textMuted}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Battery Circle & Runtime Stats */}
        <View style={styles.batterySection}>
          <View style={[styles.gaugeContainer, { width: size, height: size }]}>
            <Svg width={size} height={size}>
              {/* Background circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.border}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Red battery arc */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.red}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>

            <View style={styles.gaugeInner}>
              <Text style={styles.batteryPercentText}>{displayLevel}%</Text>
              <Text style={styles.batterySublabel}>Battery</Text>
              <Text style={styles.batterySublabel}>Remaining</Text>
            </View>
          </View>

          {/* Right stat: Estimated runtime */}
          <View style={styles.runtimeCard}>
            <Text style={styles.runtimeHighlight}>-1h 20m</Text>
            <Text style={styles.runtimeLabel}>Estimated</Text>
            <Text style={styles.runtimeLabel}>runtime</Text>
          </View>
        </View>

        {/* Setting Toggles List */}
        <View style={styles.toggleList}>
          {/* 1. Adaptive Power Mode */}
          <View style={styles.toggleItem}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>Adaptive Power Mode</Text>
              <Text style={styles.toggleSubtitle}>
                Limit sensor & network usage
              </Text>
            </View>
            <Switch
              value={adaptivePowerMode}
              onValueChange={setAdaptivePowerMode}
              trackColor={{ false: colors.border, true: colors.greenDark }}
              thumbColor={adaptivePowerMode ? colors.green : colors.textMuted}
            />
          </View>

          {/* 2. Low Data Telemetry */}
          <View style={styles.toggleItem}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>Low Data Telemetry</Text>
              <Text style={styles.toggleSubtitle}>
                Send only critical data
              </Text>
            </View>
            <Switch
              value={lowDataTelemetry}
              onValueChange={setLowDataTelemetry}
              trackColor={{ false: colors.border, true: colors.greenDark }}
              thumbColor={lowDataTelemetry ? colors.green : colors.textMuted}
            />
          </View>

          {/* 3. Offline Continuity */}
          <View style={styles.toggleItem}>
            <View style={styles.toggleTextContainer}>
              <Text style={styles.toggleTitle}>Offline Continuity</Text>
              <Text style={styles.toggleSubtitle}>
                Store & sync when online
              </Text>
            </View>
            <Switch
              value={offlineContinuity}
              onValueChange={setOfflineContinuity}
              trackColor={{ false: colors.border, true: colors.greenDark }}
              thumbColor={offlineContinuity ? colors.green : colors.textMuted}
            />
          </View>
        </View>

        {/* Shortcut to Offline Map */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.push('/offline-map')}
          style={styles.offlineMapShortcut}
        >
          <View style={styles.shortcutLeft}>
            <View style={styles.shortcutIconCircle}>
              <Map size={18} color={colors.cyan} />
            </View>
            <View>
              <Text style={styles.shortcutTitle}>View Offline Map</Text>
              <Text style={styles.shortcutSubtitle}>
                Vector map cached for zero data usage
              </Text>
            </View>
          </View>
          <ChevronLeft
            size={20}
            color={colors.textSecondary}
            style={{ transform: [{ rotate: '180deg' }] }}
          />
        </TouchableOpacity>

        {/* Exit Survival Mode Button */}
        <View style={styles.bottomSection}>
          <PrimaryButton
            title="Exit Survival Mode"
            variant="danger"
            onPress={handleExitSurvival}
            icon={<Power size={18} color="#FFF" />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.survivalBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  batterySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  gaugeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gaugeInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  batteryPercentText: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '800',
  },
  batterySublabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  runtimeCard: {
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  runtimeHighlight: {
    color: colors.redText,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  runtimeLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  toggleList: {
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  offlineMapShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginVertical: 10,
  },
  shortcutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shortcutTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  shortcutSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  bottomSection: {
    marginTop: 20,
    marginBottom: 10,
  },
});
