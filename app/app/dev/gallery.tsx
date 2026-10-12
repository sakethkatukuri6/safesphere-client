import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { space, radius } from '../../src/theme/tokens';
import { useTheme, ThemeMode } from '../../src/theme/ThemeContext';
import {
  Screen,
  Text,
  Button,
  BatteryTrack,
  StatePill,
  MapPin,
  StatusRow,
  Card,
  SurvivalCard,
  SosButton,
  CountdownRing,
  IncidentCard,
  Slider,
  Chip,
  ChipGroup,
  BottomSheet,
} from '../../src/components';
import { NeedHelpIdle } from '../../src/features/need-help/NeedHelpIdle';
import { NeedHelpConfirming } from '../../src/features/need-help/NeedHelpConfirming';
import { NeedHelpSent } from '../../src/features/need-help/NeedHelpSent';
import { NeedHelpError } from '../../src/features/need-help/NeedHelpError';
import { PitchBlackView } from '../../src/features/survival/PitchBlackView';
import { HelpNearbyHeader } from '../../src/features/help-nearby/HelpNearbyHeader';
import { HelpNearbyEmpty } from '../../src/features/help-nearby/HelpNearbyEmpty';
import { HelpNearbyMap } from '../../src/features/help-nearby/HelpNearbyMap';
import { CircleScreen } from '../../src/features/circle/CircleScreen';
import { EvidenceScreen } from '../../src/features/evidence/EvidenceScreen';
import { ProfileScreen } from '../../src/features/profile/ProfileScreen';
import { BatterySettingsScreen } from '../../src/features/profile/BatterySettingsScreen';
import { useSurvivalStore } from '../../src/store/survivalStore';
import { useNeedHelpStore } from '../../src/store/needHelpStore';
import { useHelpNearbyStore } from '../../src/store/helpNearbyStore';
import { VolunteerIncidentView } from '../../src/services/contract.types';

type GallerySection =
  | 'OVERVIEW'
  | 'CIRCLE'
  | 'EVIDENCE'
  | 'PROFILE'
  | 'BATTERY_SETTINGS'
  | 'N1_IDLE'
  | 'N2_CONFIRMING'
  | 'N3_SENT'
  | 'N3_ERROR'
  | 'N4_PITCH_BLACK'
  | 'H1_WAITING'
  | 'H2_INCIDENT'
  | 'COMPONENTS';

const MOCK_INCIDENTS: Record<string, VolunteerIncidentView> = {
  emergency: {
    capsule_id: 'CAP-9912',
    fsm_state: 'EMERGENCY',
    victim_name: 'Sarah Connor',
    victim_age: 29,
    victim_gender: 'Female',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      updated_at: new Date(Date.now() - 15000).toISOString(),
    },
  },
  assigned: {
    capsule_id: 'CAP-9912',
    fsm_state: 'VOLUNTEER_ASSIGNED',
    victim_name: 'Sarah Connor',
    victim_age: 29,
    victim_gender: 'Female',
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
      updated_at: new Date(Date.now() - 45000).toISOString(),
    },
  },
};

export default function DesignGalleryScreen() {
  const router = useRouter();
  const { colors, themeMode, setThemeMode } = useTheme();
  const [section, setSection] = useState<GallerySection>('OVERVIEW');

  // Stores
  const batteryLevel = useSurvivalStore((state) => state.batteryLevel);
  const simulateBatteryLevel = useSurvivalStore((state) => state.simulateBatteryLevel);
  const setErrorMessage = useNeedHelpStore((state) => state.setErrorMessage);
  const connectionState = useHelpNearbyStore((state) => state.connectionState);
  const setConnectionState = useHelpNearbyStore((state) => state.setConnectionState);

  // Gallery state demos
  const [sliderVal1, setSliderVal1] = useState(65);
  const [sliderVal2, setSliderVal2] = useState(20);
  const [demoSheetVisible, setDemoSheetVisible] = useState(false);

  const SECTIONS: { id: GallerySection; label: string }[] = [
    { id: 'OVERVIEW', label: 'Controls' },
    { id: 'CIRCLE', label: 'Circle' },
    { id: 'EVIDENCE', label: 'Evidence' },
    { id: 'PROFILE', label: 'Profile' },
    { id: 'BATTERY_SETTINGS', label: 'Battery' },
    { id: 'N1_IDLE', label: 'N1 Idle' },
    { id: 'N2_CONFIRMING', label: 'N2 10s' },
    { id: 'N3_SENT', label: 'N3 Sent' },
    { id: 'N3_ERROR', label: 'N3 Err' },
    { id: 'N4_PITCH_BLACK', label: 'N4 Black' },
    { id: 'H1_WAITING', label: 'H1 Wait' },
    { id: 'H2_INCIDENT', label: 'H2 Inc' },
    { id: 'COMPONENTS', label: 'Tokens' },
  ];

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: 'System', value: 'System' },
    { label: 'Light', value: 'Light' },
    { label: 'Dark', value: 'Dark' },
  ];

  return (
    <Screen isPitchBlack={section === 'N4_PITCH_BLACK'}>
      {/* Gallery Top Navigation Bar */}
      <View style={styles.topNav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to main app"
          onPress={() => router.back()}
          style={[styles.backButton, { borderColor: colors.border }]}
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={1.75} />
        </Pressable>
        <Text variant="wordmark" color="accent" style={styles.galleryTitle}>
          NIGHTWATCH GALLERY
        </Text>
      </View>

      {/* Theme Switcher Chips in top bar */}
      <View style={styles.themeSwitchRow}>
        <Text variant="caption" style={{ color: colors.textMuted, marginRight: space[2] }}>
          Theme:
        </Text>
        <ChipGroup<ThemeMode>
          options={themeOptions}
          selectedValue={themeMode}
          onSelect={(mode) => setThemeMode(mode)}
        />
      </View>

      {/* Section Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
        style={styles.tabsContainer}
      >
        {SECTIONS.map((tab) => {
          const isActive = section === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              onPress={() => setSection(tab.id)}
              style={[
                styles.tabChip,
                {
                  borderColor: isActive ? colors.accent : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Text
                variant="small"
                color={isActive ? 'accent' : 'textMuted'}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Content Rendering based on selected section */}
      <View style={styles.contentArea}>
        {section === 'OVERVIEW' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Battery Level Simulation */}
            <Card style={styles.controlCard}>
              <Text variant="label" style={styles.cardHeader}>
                Simulate Battery Level
              </Text>
              <Text variant="caption" color="textMuted" style={styles.cardDesc}>
                Current battery: {batteryLevel}%
              </Text>
              <View style={styles.buttonRow}>
                <Button
                  title="85% (Optimal)"
                  variant={batteryLevel > 50 ? 'accent' : 'outline'}
                  accessibilityLabel="Set battery to 85 percent"
                  onPress={() => simulateBatteryLevel(85)}
                  style={styles.smallButton}
                  height={44}
                />
                <Button
                  title="45% (Low)"
                  variant={batteryLevel <= 50 && batteryLevel > 15 ? 'accent' : 'outline'}
                  accessibilityLabel="Set battery to 45 percent"
                  onPress={() => simulateBatteryLevel(45)}
                  style={styles.smallButton}
                  height={44}
                />
                <Button
                  title="10% (Critical)"
                  variant={batteryLevel <= 15 ? 'danger' : 'outline'}
                  accessibilityLabel="Set battery to 10 percent critical"
                  onPress={() => simulateBatteryLevel(10)}
                  style={styles.smallButton}
                  height={44}
                />
              </View>
            </Card>

            {/* WebSocket Connection Simulation */}
            <Card style={styles.controlCard}>
              <Text variant="label" style={styles.cardHeader}>
                Simulate Dispatch Connection
              </Text>
              <Text variant="caption" color="textMuted" style={styles.cardDesc}>
                Current status: {connectionState}
              </Text>
              <View style={styles.buttonRow}>
                <Button
                  title="Connected"
                  variant={connectionState === 'Connected' ? 'accent' : 'outline'}
                  accessibilityLabel="Set connected"
                  onPress={() => setConnectionState('Connected')}
                  style={styles.smallButton}
                  height={44}
                />
                <Button
                  title="Reconnecting"
                  variant={connectionState === 'Reconnecting' ? 'accent' : 'outline'}
                  accessibilityLabel="Set reconnecting"
                  onPress={() => setConnectionState('Reconnecting')}
                  style={styles.smallButton}
                  height={44}
                />
                <Button
                  title="Connecting"
                  variant={connectionState === 'Connecting' ? 'accent' : 'outline'}
                  accessibilityLabel="Set connecting"
                  onPress={() => setConnectionState('Connecting')}
                  style={styles.smallButton}
                  height={44}
                />
              </View>
            </Card>

            {/* Error Message Simulation */}
            <Card style={styles.controlCard}>
              <Text variant="label" style={styles.cardHeader}>
                Simulate SOS Error State
              </Text>
              <View style={styles.buttonRow}>
                <Button
                  title="Set Offline"
                  variant="outline"
                  accessibilityLabel="Set offline state"
                  onPress={() => setErrorMessage('Device is offline')}
                  style={styles.smallButton}
                  height={44}
                />
                <Button
                  title="Set HTTP 500"
                  variant="outline"
                  accessibilityLabel="Set server error"
                  onPress={() => setErrorMessage('HTTP 500: Server unavailable')}
                  style={styles.smallButton}
                  height={44}
                />
              </View>
            </Card>
          </ScrollView>
        )}

        {section === 'CIRCLE' && <CircleScreen />}

        {section === 'EVIDENCE' && <EvidenceScreen />}

        {section === 'PROFILE' && <ProfileScreen />}

        {section === 'BATTERY_SETTINGS' && (
          <BatterySettingsScreen onBack={() => setSection('PROFILE')} />
        )}

        {section === 'N1_IDLE' && <NeedHelpIdle onNavigateToCircle={() => setSection('CIRCLE')} />}

        {section === 'N2_CONFIRMING' && <NeedHelpConfirming />}

        {section === 'N3_SENT' && <NeedHelpSent />}

        {section === 'N3_ERROR' && <NeedHelpError />}

        {section === 'N4_PITCH_BLACK' && <PitchBlackView />}

        {section === 'H1_WAITING' && (
          <View style={styles.fullScreenPreview}>
            <HelpNearbyHeader connectionState={connectionState} />
            <View style={styles.emptyCenter}>
              <HelpNearbyEmpty />
            </View>
          </View>
        )}

        {section === 'H2_INCIDENT' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <HelpNearbyHeader connectionState="Connected" />
            <HelpNearbyMap
              latitude={MOCK_INCIDENTS.emergency.location.latitude}
              longitude={MOCK_INCIDENTS.emergency.location.longitude}
              victimName={MOCK_INCIDENTS.emergency.victim_name}
            />
            <IncidentCard
              incident={MOCK_INCIDENTS.emergency}
              onAccept={async () => {}}
              onDecline={async () => {}}
              onMarkArrived={async () => {}}
            />
          </ScrollView>
        )}

        {section === 'COMPONENTS' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* BatteryTrack Preview */}
            <Card style={styles.previewCard}>
              <Text variant="overline">BATTERY TRACK TIERS</Text>
              <Text variant="caption" color="textMuted" style={styles.componentLabel}>
                85% (Accent)
              </Text>
              <BatteryTrack batteryLevel={85} />
              <Text variant="caption" color="textMuted" style={styles.componentLabel}>
                45% (Warning)
              </Text>
              <BatteryTrack batteryLevel={45} />
              <Text variant="caption" color="textMuted" style={styles.componentLabel}>
                12% (Danger)
              </Text>
              <BatteryTrack batteryLevel={12} />
            </Card>

            {/* Sliders Preview */}
            <Card style={styles.previewCard}>
              <Text variant="overline">SLIDERS & STEPPING</Text>
              <Slider
                label="Low battery (65%)"
                value={sliderVal1}
                min={30}
                max={80}
                unit="%"
                onValueChange={setSliderVal1}
              />
              <Slider
                label="Critical battery (20%)"
                value={sliderVal2}
                min={5}
                max={25}
                unit="%"
                onValueChange={setSliderVal2}
              />
            </Card>

            {/* Bottom Sheet Trigger */}
            <Card style={styles.previewCard}>
              <Text variant="overline">BOTTOM SHEET</Text>
              <Button
                title="Open demo sheet"
                variant="outline"
                accessibilityLabel="Open demo sheet"
                onPress={() => setDemoSheetVisible(true)}
              />
            </Card>

            {/* StatePill Preview */}
            <Card style={styles.previewCard}>
              <Text variant="overline">STATE PILLS</Text>
              <View style={styles.pillsRow}>
                <StatePill state="EMERGENCY" />
                <StatePill state="VOLUNTEER_ASSIGNED" />
                <StatePill label="Granted" isGranted={true} />
              </View>
            </Card>

            {/* MapPin Preview */}
            <Card style={styles.previewCard}>
              <Text variant="overline">MAP PIN (14PX DANGER DOT WITH 2PX BG RING)</Text>
              <View style={styles.pinRow}>
                <MapPin variant="dot" />
              </View>
            </Card>

            {/* Button Variants Preview */}
            <Card style={styles.previewCard}>
              <Text variant="overline">BUTTON VARIANTS</Text>
              <View style={styles.buttonsStack}>
                <Button
                  title="Accent Button (56px)"
                  variant="accent"
                  accessibilityLabel="Accent button demo"
                  onPress={() => {}}
                  height={56}
                />
                <Button
                  title="Danger Button (56px)"
                  variant="danger"
                  accessibilityLabel="Danger button demo"
                  onPress={() => {}}
                  height={56}
                />
                <Button
                  title="Outline Button (48px)"
                  variant="outline"
                  accessibilityLabel="Outline button demo"
                  onPress={() => {}}
                  height={48}
                />
              </View>
            </Card>
          </ScrollView>
        )}
      </View>

      {/* Demo Bottom Sheet */}
      <BottomSheet
        visible={demoSheetVisible}
        onClose={() => setDemoSheetVisible(false)}
        title="Demo bottom sheet"
      >
        <View style={{ paddingBottom: space[4] }}>
          <Text variant="body" style={{ color: colors.textMuted, marginBottom: space[3] }}>
            This is a 350ms spring slide-up sheet with a pitch black backdrop at 0.6 opacity.
          </Text>
          <Button
            title="Done"
            variant="primary"
            accessibilityLabel="Done"
            onPress={() => setDemoSheetVisible(false)}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topNav: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    marginBottom: space[2],
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryTitle: {
    flex: 1,
  },
  themeSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space[2],
  },
  tabsContainer: {
    maxHeight: 44,
    marginBottom: space[3],
  },
  tabsScroll: {
    gap: space[2],
    paddingVertical: 2,
  },
  tabChip: {
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.chip,
    borderWidth: 1,
  },
  contentArea: {
    flex: 1,
    width: '100%',
  },
  controlCard: {
    padding: space[4],
    marginBottom: space[3],
  },
  cardHeader: {
    marginBottom: 4,
  },
  cardDesc: {
    marginBottom: space[3],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: space[2],
  },
  smallButton: {
    flex: 1,
  },
  previewCard: {
    padding: space[4],
    marginBottom: space[3],
    gap: space[2],
  },
  componentLabel: {
    marginTop: space[1],
  },
  pillsRow: {
    flexDirection: 'row',
    gap: space[3],
    marginTop: space[2],
  },
  pinRow: {
    alignItems: 'flex-start',
    marginTop: space[2],
  },
  buttonsStack: {
    gap: space[2],
    marginTop: space[2],
  },
  fullScreenPreview: {
    flex: 1,
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
