import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, ChevronRight, Sparkles, Navigation } from 'lucide-react-native';
import colors from '../../theme/colors';
import { AppHeader } from '../../components/AppHeader';
import { SosButton } from '../../components/SosButton';
import { StatusRow } from '../../components/StatusRow';
import { useEmergencyStore } from '../../store/emergencyStore';
import { useBatteryStore } from '../../store/batteryStore';

export default function HomeScreen() {
  const router = useRouter();
  const { triggerEmergency } = useEmergencyStore();
  const { batteryLevel, isSurvivalMode, initBattery } = useBatteryStore();

  useEffect(() => {
    initBattery();
  }, []);

  const handleSosTrigger = async () => {
    await triggerEmergency('MANUAL_SOS');
    router.push('/active-emergency');
  };

  const handleSosPressDirect = () => {
    router.push('/hold-confirm');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        onPressNotifications={() => {}}
        onPressProfile={() => router.push('/profile')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Journey Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.journeyCard}
          onPress={() => {}}
        >
          <View style={styles.journeyLeft}>
            <View style={styles.journeyBadge}>
              <ShieldCheck size={14} color={colors.green} style={{ marginRight: 4 }} />
              <Text style={styles.journeyBadgeText}>Safe Journey</Text>
            </View>
            <Text style={styles.journeyRoute}>College to Home</Text>
            <Text style={styles.journeyMeta}>34 min (12.4 km)</Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Map Preview Area */}
        <View style={styles.mapContainer}>
          {/* Simulated Dark Map Canvas */}
          <View style={styles.mapBackground}>
            {/* Grid Road Lines */}
            <View style={[styles.roadLine, { top: 30, left: 0, right: 0 }]} />
            <View style={[styles.roadLine, { top: 80, left: 0, right: 0 }]} />
            <View style={[styles.roadLine, { top: 130, left: 0, right: 0 }]} />
            <View style={[styles.roadLineVertical, { left: 40, top: 0, bottom: 0 }]} />
            <View style={[styles.roadLineVertical, { left: 110, top: 0, bottom: 0 }]} />
            <View style={[styles.roadLineVertical, { right: 50, top: 0, bottom: 0 }]} />

            {/* Blue Route Polyline */}
            <View style={styles.routePolyline1} />
            <View style={styles.routePolyline2} />
            <View style={styles.routePolyline3} />

            {/* Current Location Pin with Pulse */}
            <View style={styles.currentLocationWrapper}>
              <View style={styles.locationPulse} />
              <View style={styles.locationDot} />
            </View>

            {/* Destination Pin */}
            <View style={styles.destinationPinWrapper}>
              <View style={styles.destinationPin}>
                <Navigation size={12} color="#FFF" />
              </View>
            </View>
          </View>
        </View>

        {/* Central SOS Trigger Button */}
        <View style={styles.sosSection}>
          <SosButton
            onTrigger={handleSosTrigger}
            onPressDirect={handleSosPressDirect}
            holdDurationMs={3000}
            size={170}
          />
        </View>

        {/* AI Monitoring Banner */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.aiBanner}
          onPress={() => {}}
        >
          <View style={styles.aiLeft}>
            <View style={styles.aiIconWrapper}>
              <Sparkles size={16} color={colors.green} />
            </View>
            <Text style={styles.aiText}>AI monitoring active</Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Bottom Status Row */}
        <View style={styles.statusSection}>
          <StatusRow
            batteryPct={batteryLevel}
            networkStatus="Strong"
            checkInTime="2:50 PM"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  journeyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  journeyLeft: {
    flex: 1,
  },
  journeyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  journeyBadgeText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
  },
  journeyRoute: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  journeyMeta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  mapContainer: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderColor: colors.border,
    borderWidth: 1,
    position: 'relative',
    marginBottom: 8,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#0D141C',
    position: 'relative',
  },
  roadLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#17222F',
  },
  roadLineVertical: {
    position: 'absolute',
    width: 1,
    backgroundColor: '#17222F',
  },
  routePolyline1: {
    position: 'absolute',
    top: 50,
    left: 80,
    width: 60,
    height: 3,
    backgroundColor: colors.blueRoute,
    transform: [{ rotate: '45deg' }],
  },
  routePolyline2: {
    position: 'absolute',
    top: 90,
    left: 120,
    width: 80,
    height: 3,
    backgroundColor: colors.blueRoute,
    transform: [{ rotate: '-20deg' }],
  },
  routePolyline3: {
    position: 'absolute',
    top: 70,
    left: 190,
    width: 70,
    height: 3,
    backgroundColor: colors.blueRoute,
    transform: [{ rotate: '30deg' }],
  },
  currentLocationWrapper: {
    position: 'absolute',
    top: 40,
    left: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationPulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.blueGlow,
    position: 'absolute',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  destinationPinWrapper: {
    position: 'absolute',
    top: 90,
    right: 55,
  },
  destinationPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sosSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  aiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.greenDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  aiText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  statusSection: {
    marginTop: 2,
  },
});
