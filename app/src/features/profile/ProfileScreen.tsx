// CONTRACT-GAP: G10 - Profile editing is local-only; CitizenAppContract.md defines victim_* fields inside SosTriggerEvent but has no user registration/profile endpoint.
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { useTheme, ThemeMode } from '../../theme/ThemeContext';
import { Text } from '../../components/Text';
import { Card } from '../../components/Card';
import { StatePill } from '../../components/StatePill';
import { ChipGroup } from '../../components/ChipGroup';
import { UserProfile, profileService } from '../../services/profileService';
import { BatterySettingsScreen } from './BatterySettingsScreen';
import { space, radius, touch } from '../../theme/tokens';
import {
  ChevronRight,
  Battery,
  Shield,
  MapPin,
  Activity,
  Bell,
  Camera,
  Moon,
  Info,
} from 'lucide-react-native';

export const ProfileScreen: React.FC = () => {
  const { colors, themeMode, setThemeMode } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showBatterySettings, setShowBatterySettings] = useState(false);

  useEffect(() => {
    profileService.getUserProfile().then(setProfile);
  }, []);

  if (showBatterySettings) {
    return <BatterySettingsScreen onBack={() => setShowBatterySettings(false)} />;
  }

  const handleOpenSettings = () => {
    Linking.openSettings().catch(() => {});
  };

  const appearanceOptions: { label: string; value: ThemeMode }[] = [
    { label: 'System', value: 'System' },
    { label: 'Light', value: 'Light' },
    { label: 'Dark', value: 'Dark' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.header}>
          <Text variant="title">Profile & Settings</Text>
          <Text variant="caption" style={{ marginTop: space[1] }}>
            Emergency identity, device permissions, and system themes.
          </Text>
        </View>

        {/* Personal Details Card */}
        <View style={styles.sectionHeader}>
          <Text variant="overline" style={{ color: colors.textMuted }}>
            CITIZEN IDENTITY
          </Text>
        </View>
        <Card style={styles.card}>
          <View style={styles.detailRow}>
            <Text variant="label" style={{ color: colors.textMuted }}>
              Full name
            </Text>
            <Text variant="label" style={{ fontWeight: '600' }}>
              {profile?.victim_name || 'Loading...'}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
          <View style={styles.detailRow}>
            <Text variant="label" style={{ color: colors.textMuted }}>
              Age
            </Text>
            <Text variant="label" style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>
              {profile?.victim_age || '—'}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
          <View style={styles.detailRow}>
            <Text variant="label" style={{ color: colors.textMuted }}>
              Gender
            </Text>
            <Text variant="label" style={{ fontWeight: '600' }}>
              {profile?.victim_gender || '—'}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
          <View style={styles.profileNote}>
            <Info size={14} color={colors.textMuted} strokeWidth={1.75} />
            <Text
              variant="caption"
              style={{ color: colors.textMuted, marginLeft: space[2], flex: 1 }}
            >
              Populates victim demographic fields on dispatch. Local only (CONTRACT-GAP G10).
            </Text>
          </View>
        </Card>

        {/* Battery Settings Row */}
        <View style={styles.sectionHeader}>
          <Text variant="overline" style={{ color: colors.textMuted }}>
            POWER ENGINE
          </Text>
        </View>
        <Pressable
          onPress={() => setShowBatterySettings(true)}
          accessibilityRole="button"
          accessibilityLabel="Open battery settings"
        >
          <Card style={styles.actionCard}>
            <View style={styles.actionRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}>
                <Battery size={20} color={colors.accent} strokeWidth={1.75} />
              </View>
              <View style={styles.actionInfo}>
                <Text variant="label" style={{ fontWeight: '600' }}>
                  Battery & Survival thresholds
                </Text>
                <Text variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
                  Adjust Low and Critical preservation tiers and GPS intervals.
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textMuted} strokeWidth={1.75} />
            </View>
          </Card>
        </Pressable>

        {/* Appearance Section */}
        <View style={styles.sectionHeader}>
          <Text variant="overline" style={{ color: colors.textMuted }}>
            APPEARANCE
          </Text>
        </View>
        <Card style={styles.card}>
          <View style={{ marginBottom: space[3] }}>
            <Text variant="label" style={{ fontWeight: '500' }}>
              Interface Theme
            </Text>
            <Text variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
              High-contrast Nightwatch palette with OLED pitch black support.
            </Text>
          </View>
          <ChipGroup<ThemeMode>
            options={appearanceOptions}
            selectedValue={themeMode}
            onSelect={(val) => setThemeMode(val)}
          />
        </Card>

        {/* Permissions Section */}
        <View style={styles.sectionHeader}>
          <Text variant="overline" style={{ color: colors.textMuted }}>
            SYSTEM PERMISSIONS
          </Text>
        </View>
        <Card style={styles.card}>
          {/* Location */}
          <Pressable onPress={handleOpenSettings} style={styles.permRow}>
            <View style={styles.permInfo}>
              <MapPin size={18} color={colors.textMuted} strokeWidth={1.75} />
              <View style={{ marginLeft: space[3] }}>
                <Text variant="label">Foreground & background location</Text>
                <Text variant="caption" style={{ color: colors.textMuted }}>
                  Essential for SOS coordinate routing
                </Text>
              </View>
            </View>
            <StatePill label="Granted" isGranted={true} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          {/* Motion / Sensors */}
          <Pressable onPress={handleOpenSettings} style={styles.permRow}>
            <View style={styles.permInfo}>
              <Activity size={18} color={colors.textMuted} strokeWidth={1.75} />
              <View style={{ marginLeft: space[3] }}>
                <Text variant="label">Motion & telemetry sensors</Text>
                <Text variant="caption" style={{ color: colors.textMuted }}>
                  Accelerometer & gyroscope for fall detection
                </Text>
              </View>
            </View>
            <StatePill label="Granted" isGranted={true} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          {/* Battery Optimization */}
          <Pressable onPress={handleOpenSettings} style={styles.permRow}>
            <View style={styles.permInfo}>
              <Shield size={18} color={colors.textMuted} strokeWidth={1.75} />
              <View style={{ marginLeft: space[3] }}>
                <Text variant="label">Battery optimization</Text>
                <Text variant="caption" style={{ color: colors.textMuted }}>
                  Disabled to allow background survival beacons
                </Text>
              </View>
            </View>
            <StatePill label="Granted" isGranted={true} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          {/* Notifications */}
          <Pressable onPress={handleOpenSettings} style={styles.permRow}>
            <View style={styles.permInfo}>
              <Bell size={18} color={colors.textMuted} strokeWidth={1.75} />
              <View style={{ marginLeft: space[3] }}>
                <Text variant="label">Push notifications</Text>
                <Text variant="caption" style={{ color: colors.textMuted }}>
                  High-priority responder alerts and wake-up
                </Text>
              </View>
            </View>
            <StatePill label="Granted" isGranted={true} />
          </Pressable>

          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          {/* Camera / Mic */}
          <Pressable onPress={handleOpenSettings} style={styles.permRow}>
            <View style={styles.permInfo}>
              <Camera size={18} color={colors.textMuted} strokeWidth={1.75} />
              <View style={{ marginLeft: space[3] }}>
                <Text variant="label">Camera & microphone</Text>
                <Text variant="caption" style={{ color: colors.textMuted }}>
                  Encrypted evidence capsule capture
                </Text>
              </View>
            </View>
            <StatePill label="Granted" isGranted={true} />
          </Pressable>
        </Card>
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
  header: {
    marginBottom: space[4],
  },
  sectionHeader: {
    marginBottom: space[2],
    marginTop: space[3],
  },
  card: {
    padding: space[4],
    marginBottom: space[3],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space[2],
  },
  divider: {
    height: 1,
  },
  profileNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: space[3],
  },
  actionCard: {
    padding: space[4],
    marginBottom: space[3],
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.circle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space[3],
  },
  actionInfo: {
    flex: 1,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[3],
    minHeight: 52,
  },
  permInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: space[2],
  },
});
