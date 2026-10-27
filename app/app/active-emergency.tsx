import React, { useState, useEffect } from 'react';
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
  User,
  AlertTriangle,
  Radio,
  ArrowRight,
} from 'lucide-react-native';
import colors from '../theme/colors';
import { AudioWaveform } from '../components/AudioWaveform';
import { PrimaryButton } from '../components/PrimaryButton';
import { PinModal } from '../components/PinModal';
import { useEmergencyStore } from '../store/emergencyStore';

export default function ActiveEmergencyScreen() {
  const router = useRouter();
  const { timeline, resetEmergency } = useEmergencyStore();
  const [pinModalVisible, setPinModalVisible] = useState(false);

  // Auto transition to Alert Sent after 5 seconds if not cancelled
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/alert-sent');
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  const handlePinSuccess = (isDuress: boolean) => {
    // If duress was triggered, isDuress is true
    resetEmergency();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={styles.iconButton}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/alert-sent')}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Details</Text>
          <ArrowRight size={14} color={colors.blue} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.warningIconWrapper}>
            <AlertTriangle size={32} color={colors.red} />
          </View>
          <Text style={styles.title}>Emergency Activated</Text>
          <Text style={styles.subtitle}>
            Alert sent to 112 & trusted contacts
          </Text>
        </View>

        {/* Live Tracking Box */}
        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
            <View style={styles.trackingIconWrapper}>
              <Radio size={16} color={colors.green} />
            </View>
            <View style={styles.trackingHeaderText}>
              <Text style={styles.trackingTitle}>Live Tracking</Text>
              <Text style={styles.trackingSubtitle}>
                Sharing location, audio & sensors
              </Text>
            </View>
          </View>

          {/* Cyan Audio Waveform */}
          <AudioWaveform initialSeconds={24} isLive={true} />
        </View>

        {/* Timestamped Timeline */}
        <View style={styles.timelineCard}>
          {timeline.map((event, index) => {
            const isLast = index === timeline.length - 1;
            return (
              <View key={event.id} style={styles.timelineRow}>
                {/* Time */}
                <Text style={styles.timelineTime}>{event.time}</Text>

                {/* Dot & Line */}
                <View style={styles.nodeColumn}>
                  <View style={styles.redDot} />
                  {!isLast && <View style={styles.verticalLine} />}
                </View>

                {/* Event Title */}
                <Text style={styles.timelineEventTitle}>{event.title}</Text>
              </View>
            );
          })}
        </View>

        {/* Cancel Emergency Button */}
        <View style={styles.bottomSection}>
          <PrimaryButton
            title="CANCEL EMERGENCY"
            variant="dangerOutline"
            onPress={() => setPinModalVisible(true)}
            style={styles.cancelButton}
            textStyle={{ fontWeight: '800', letterSpacing: 0.5 }}
          />
        </View>
      </ScrollView>

      {/* PIN Verification Modal */}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  skipText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  warningIconWrapper: {
    marginBottom: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  trackingCard: {
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackingIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.greenDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  trackingHeaderText: {
    flex: 1,
  },
  trackingTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  trackingSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  timelineCard: {
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
    minHeight: 38,
  },
  timelineTime: {
    color: colors.textSecondary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    width: 65,
    marginRight: 12,
    paddingTop: 1,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 16,
    marginRight: 12,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.red,
    marginTop: 4,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.redDark,
    marginVertical: 2,
  },
  timelineEventTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    paddingTop: 1,
  },
  bottomSection: {
    marginTop: 20,
  },
  cancelButton: {
    borderColor: colors.red,
  },
});
