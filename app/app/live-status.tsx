import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Info,
  MapPin,
  PhoneCall,
  Users,
  Compass,
  Camera,
  Navigation,
} from 'lucide-react-native';
import colors from '../theme/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import { PinModal } from '../components/PinModal';
import { useEmergencyStore } from '../store/emergencyStore';

export default function LiveStatusScreen() {
  const router = useRouter();
  const { incidentId, resetEmergency } = useEmergencyStore();
  const [pinModalVisible, setPinModalVisible] = useState(false);

  const handlePinSuccess = (_isDuress: boolean) => {
    resetEmergency();
    router.replace('/(tabs)');
  };

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
        <Text style={styles.headerTitle}>Live Incident Status</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Info size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card 1: Location Shared */}
        <View style={styles.statusCard}>
          <View style={[styles.iconCircle, { backgroundColor: colors.greenDark }]}>
            <MapPin size={20} color={colors.green} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Your location is being shared</Text>
            <Text style={styles.cardSubtitle}>Real-time telemetry streaming</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {/* Status Card 2: 112 Responders */}
        <View style={styles.statusCard}>
          <View style={[styles.iconCircle, { backgroundColor: colors.redDark }]}>
            <PhoneCall size={20} color={colors.red} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>112 responders notified</Text>
            <Text style={[styles.cardSubtitle, { color: colors.warning }]}>
              ETA 8–12 min
            </Text>
          </View>
        </View>

        {/* Status Card 3: 3 Trusted Contacts */}
        <View style={styles.statusCard}>
          <View style={[styles.iconCircle, { backgroundColor: colors.blueDark }]}>
            <Users size={20} color={colors.blue} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>3 trusted contacts notified</Text>
            <Text style={styles.cardSubtitle}>SMS & push alerts delivered</Text>
          </View>
        </View>

        {/* Status Card 4: Nearby Volunteers */}
        <View style={styles.statusCard}>
          <View style={[styles.iconCircle, { backgroundColor: colors.greenDark }]}>
            <Compass size={20} color={colors.green} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Nearby volunteers alerted</Text>
            <Text style={styles.cardSubtitle}>5 nearby volunteers</Text>
          </View>
        </View>

        {/* Status Card 5: Evidence Capture */}
        <View style={styles.statusCard}>
          <View style={[styles.iconCircle, { backgroundColor: colors.surfaceSubtle }]}>
            <Camera size={20} color={colors.cyan} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Evidence capture active</Text>
            <Text style={styles.cardSubtitle}>Images, audio, sensors</Text>
          </View>
        </View>

        {/* Live Mini Map */}
        <View style={styles.mapContainer}>
          <View style={styles.mapBackground}>
            {/* Roads */}
            <View style={[styles.mapRoad, { top: 40, left: 0, right: 0 }]} />
            <View style={[styles.mapRoad, { top: 90, left: 0, right: 0 }]} />
            <View style={[styles.mapRoadVertical, { left: 60, top: 0, bottom: 0 }]} />
            <View style={[styles.mapRoadVertical, { right: 80, top: 0, bottom: 0 }]} />

            {/* Victim Location Dot with Pulse */}
            <View style={styles.victimMarker}>
              <View style={styles.victimPulse} />
              <View style={styles.victimDot} />
            </View>

            {/* Responder Pin */}
            <View style={styles.responderPin1}>
              <Navigation size={12} color="#FFF" />
            </View>

            {/* Volunteer Pin */}
            <View style={styles.responderPin2}>
              <Compass size={12} color="#FFF" />
            </View>
          </View>
        </View>

        {/* Cancel Button */}
        <View style={styles.cancelSection}>
          <PrimaryButton
            title="CANCEL EMERGENCY"
            variant="dangerOutline"
            onPress={() => setPinModalVisible(true)}
            textStyle={{ fontWeight: '800', letterSpacing: 0.5 }}
          />
        </View>
      </ScrollView>

      {/* PIN System Modal */}
      <PinModal
        visible={pinModalVisible}
        onClose={() => setPinModalVisible(false)}
        onSuccess={handlePinSuccess}
        initialMode="cancel"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
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
    paddingBottom: 28,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greenDark,
    borderColor: colors.greenCardBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
    marginRight: 5,
  },
  liveText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '700',
  },
  mapContainer: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    borderColor: colors.border,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 16,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#0D141C',
    position: 'relative',
  },
  mapRoad: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#1B2633',
  },
  mapRoadVertical: {
    position: 'absolute',
    width: 1,
    backgroundColor: '#1B2633',
  },
  victimMarker: {
    position: 'absolute',
    top: 80,
    left: '46%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  victimPulse: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.blueGlow,
    position: 'absolute',
  },
  victimDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  responderPin1: {
    position: 'absolute',
    top: 35,
    right: 70,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.red,
    justifyContent: 'center',
    alignItems: 'center',
  },
  responderPin2: {
    position: 'absolute',
    bottom: 35,
    left: 50,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelSection: {
    marginTop: 8,
  },
});
