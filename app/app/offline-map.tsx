import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck, ChevronRight, Navigation, MapPin } from 'lucide-react-native';
import colors from '../theme/colors';
import { PrimaryButton } from '../components/PrimaryButton';

export default function OfflineMapScreen() {
  const router = useRouter();

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
          <Text style={styles.headerTitle}>Offline Map</Text>
          <Text style={styles.headerSubtitle}>
            Limited detail • Saves battery
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Full-Screen Minimal Vector Map */}
      <View style={styles.mapArea}>
        {/* Minimal dark roads */}
        <View style={[styles.road, { top: '25%', left: 0, right: 0 }]} />
        <View style={[styles.road, { top: '50%', left: 0, right: 0 }]} />
        <View style={[styles.road, { top: '75%', left: 0, right: 0 }]} />
        <View style={[styles.roadV, { left: '30%', top: 0, bottom: 0 }]} />
        <View style={[styles.roadV, { left: '60%', top: 0, bottom: 0 }]} />

        {/* Minimal Cyan Polyline Route */}
        <View style={styles.routeLeg1} />
        <View style={styles.routeLeg2} />
        <View style={styles.routeLeg3} />

        {/* Current Location Point */}
        <View style={styles.userPoint}>
          <View style={styles.pulseRing} />
          <View style={styles.coreDot} />
        </View>

        {/* Safe Point / Shelter Pin */}
        <View style={styles.safePoint}>
          <View style={styles.safePin}>
            <MapPin size={14} color="#FFF" />
          </View>
        </View>
      </View>

      {/* Floating Bottom Card */}
      <View style={styles.floatingContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.safeStatusCard}
          onPress={() => {}}
        >
          <View style={styles.statusLeft}>
            <View style={styles.statusIconCircle}>
              <ShieldCheck size={18} color={colors.green} />
            </View>
            <View>
              <Text style={styles.statusTitle}>You are safe</Text>
              <Text style={styles.statusSubtitle}>
                Your location is saved offline
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Open Emergency Contacts Button */}
        <PrimaryButton
          title="Open Emergency Contacts"
          variant="primary"
          onPress={() => router.push('/(tabs)/circle')}
          style={styles.openContactsButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderBottomColor: '#1A1A1A',
    borderBottomWidth: 1,
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
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  road: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#1E232A',
  },
  roadV: {
    position: 'absolute',
    width: 1,
    backgroundColor: '#1E232A',
  },
  routeLeg1: {
    position: 'absolute',
    bottom: '45%',
    left: '30%',
    width: 80,
    height: 4,
    backgroundColor: colors.cyan,
    transform: [{ rotate: '-35deg' }],
  },
  routeLeg2: {
    position: 'absolute',
    top: '38%',
    left: '46%',
    width: 70,
    height: 4,
    backgroundColor: colors.cyan,
    transform: [{ rotate: '40deg' }],
  },
  routeLeg3: {
    position: 'absolute',
    top: '30%',
    right: '25%',
    width: 60,
    height: 4,
    backgroundColor: colors.cyan,
    transform: [{ rotate: '-15deg' }],
  },
  userPoint: {
    position: 'absolute',
    bottom: '38%',
    left: '26%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    position: 'absolute',
  },
  coreDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.cyan,
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  safePoint: {
    position: 'absolute',
    top: '25%',
    right: '20%',
  },
  safePin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    gap: 12,
  },
  safeStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0D131A',
    borderColor: '#1E2A38',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.greenDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  statusSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  openContactsButton: {
    backgroundColor: colors.blue,
  },
});
