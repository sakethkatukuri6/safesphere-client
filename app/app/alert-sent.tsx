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
  User,
  CheckCircle,
  Copy,
  PhoneCall,
  Users,
  Compass,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '../theme/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import { useEmergencyStore } from '../store/emergencyStore';

export default function AlertSentScreen() {
  const router = useRouter();
  const { incidentId } = useEmergencyStore();
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={styles.iconButton}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <User size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon & Title */}
        <View style={styles.heroSection}>
          <View style={styles.checkGlow}>
            <CheckCircle size={56} color={colors.green} />
          </View>
          <Text style={styles.title}>Alert Sent Successfully</Text>
          <Text style={styles.subtitle}>Help is on the way</Text>
        </View>

        {/* Incident ID Card */}
        <View style={styles.incidentIdCard}>
          <View>
            <Text style={styles.incidentLabel}>Incident ID</Text>
            <Text style={styles.incidentCode}>{incidentId}</Text>
          </View>
          <TouchableOpacity
            onPress={handleCopyId}
            style={styles.copyButton}
            activeOpacity={0.7}
          >
            {copied ? (
              <Check size={18} color={colors.green} />
            ) : (
              <Copy size={18} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Shared With Section */}
        <View style={styles.sharedSection}>
          <Text style={styles.sectionTitle}>Shared with</Text>

          {/* Row 1: 112 Emergency Services */}
          <View style={styles.sharedRow}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.redDark }]}>
              <PhoneCall size={18} color={colors.red} />
            </View>
            <View style={styles.sharedInfo}>
              <Text style={styles.sharedName}>112 Emergency Services</Text>
              <Text style={styles.sharedDetail}>National Dispatch</Text>
            </View>
            <View style={styles.notifiedBadge}>
              <Text style={styles.notifiedText}>Notified</Text>
            </View>
          </View>

          {/* Row 2: 3 Trusted Contacts */}
          <View style={styles.sharedRow}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.blueDark }]}>
              <Users size={18} color={colors.blue} />
            </View>
            <View style={styles.sharedInfo}>
              <Text style={styles.sharedName}>3 Trusted Contacts</Text>
              <Text style={styles.sharedDetail}>Mom, Dad, Best Friend</Text>
            </View>
            <View style={styles.notifiedBadge}>
              <Text style={styles.notifiedText}>Notified</Text>
            </View>
          </View>

          {/* Row 3: Nearby Volunteers */}
          <View style={styles.sharedRow}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.greenDark }]}>
              <Compass size={18} color={colors.green} />
            </View>
            <View style={styles.sharedInfo}>
              <Text style={styles.sharedName}>Nearby Volunteers</Text>
              <Text style={styles.sharedDetail}>5 within 2 km</Text>
            </View>
            <View style={styles.searchingBadge}>
              <Text style={styles.searchingText}>Searching</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <PrimaryButton
            title="View Live Status"
            variant="primary"
            onPress={() => router.push('/live-status')}
            style={styles.liveStatusButton}
          />

          <PrimaryButton
            title="Add Information"
            variant="secondary"
            onPress={() => router.push('/silent-help')}
            style={styles.addInfoButton}
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
  heroSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  checkGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.greenDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  incidentIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  incidentLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  incidentCode: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharedSection: {
    marginVertical: 12,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  sharedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sharedInfo: {
    flex: 1,
  },
  sharedName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  sharedDetail: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  notifiedBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  notifiedText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '600',
  },
  searchingBadge: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  searchingText: {
    color: colors.blueLight,
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    marginTop: 20,
    gap: 12,
  },
  liveStatusButton: {
    backgroundColor: colors.blue,
  },
  addInfoButton: {
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
  },
});
