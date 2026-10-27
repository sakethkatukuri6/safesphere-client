import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft,
  Share2,
  MapPin,
  Navigation,
  Lock,
  CheckCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '../theme/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import { sendVolunteerResponse } from '../lib/api';

export default function IncidentDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const code = (params.code as string) || '#SS-23814';

  const [hasAccepted, setHasAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleHelpPress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_e) {}

    setLoading(true);
    const nextAction = hasAccepted ? 'ARRIVED' : 'ACCEPT';
    await sendVolunteerResponse({
      capsule_id: code.replace('#', ''),
      volunteer_id: 'VOL-142',
      action: nextAction,
      timestamp: new Date().toISOString(),
    });

    setLoading(false);
    if (!hasAccepted) {
      setHasAccepted(true);
      Alert.alert(
        'Assignment Confirmed',
        'You are assigned to assist this citizen. Proceed to location safely.'
      );
    } else {
      Alert.alert('Status Logged', 'Marked as Arrived on scene.');
    }
  };

  const handleNavigate = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    Alert.alert('Navigation', 'Opening turn-by-turn navigation to citizen location...');
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
        <TouchableOpacity style={styles.iconButton}>
          <Share2 size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Mini Map */}
        <View style={styles.mapContainer}>
          <View style={styles.mapBackground}>
            <View style={[styles.road, { top: 35, left: 0, right: 0 }]} />
            <View style={[styles.road, { top: 80, left: 0, right: 0 }]} />
            <View style={[styles.roadV, { left: '40%', top: 0, bottom: 0 }]} />
            <View style={[styles.roadV, { right: '35%', top: 0, bottom: 0 }]} />

            {/* Victim Pin */}
            <View style={styles.victimPin}>
              <MapPin size={18} color="#FFF" />
            </View>
          </View>
        </View>

        {/* Main Incident Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <View style={styles.titleCol}>
              <View style={styles.iconTitleRow}>
                <View style={styles.redIconCircle}>
                  <MapPin size={18} color={colors.red} />
                </View>
                <Text style={styles.incidentTitle}>Incident {code}</Text>
              </View>
              <Text style={styles.distanceSubtitle}>0.7 km away • 4 min</Text>
            </View>

            <View style={styles.safeBadge}>
              <Text style={styles.safeBadgeText}>Safe to approach?</Text>
            </View>
          </View>

          {/* Key Value Table */}
          <View style={styles.infoTable}>
            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Type</Text>
              <Text style={styles.rowValue}>Assistance Needed</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Description</Text>
              <Text style={styles.rowValue}>User in distress (limited info)</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.rowLabel}>Reported</Text>
              <Text style={styles.rowValue}>2 min ago</Text>
            </View>

            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.rowLabel}>Requesting</Text>
              <Text style={styles.rowValue}>Nearby Volunteers</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <PrimaryButton
            title={hasAccepted ? 'Mark Arrived' : "I'm Nearby - Help"}
            variant="primary"
            loading={loading}
            onPress={handleHelpPress}
            icon={hasAccepted ? <CheckCircle size={18} color="#FFF" /> : undefined}
          />

          <PrimaryButton
            title="Navigate"
            variant="outline"
            onPress={handleNavigate}
            icon={<Navigation size={18} color={colors.textPrimary} />}
          />
        </View>

        {/* Privacy Note */}
        <View style={styles.privacyNote}>
          <Lock size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={styles.privacyText}>
            You'll see only limited information to protect privacy.
          </Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  mapContainer: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    borderColor: colors.border,
    borderWidth: 1,
    marginBottom: 16,
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#0E151E',
    position: 'relative',
  },
  road: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#1E2A3A',
  },
  roadV: {
    position: 'absolute',
    width: 1,
    backgroundColor: '#1E2A3A',
  },
  victimPin: {
    position: 'absolute',
    top: 50,
    left: '48%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderWidth: 2,
  },
  detailsCard: {
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleCol: {
    flex: 1,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  redIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.redDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  incidentTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  distanceSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginLeft: 36,
  },
  safeBadge: {
    backgroundColor: colors.greenDark,
    borderColor: colors.greenCardBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  safeBadgeText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '700',
  },
  infoTable: {
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  rowValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  privacyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
