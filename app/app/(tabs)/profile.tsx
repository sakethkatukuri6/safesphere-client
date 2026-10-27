import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Settings,
  User,
  Shield,
  Bell,
  Lock,
  Battery,
  Moon,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  KeyRound,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '../../theme/colors';
import { usePinStore } from '../../store/pinStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { cancelPin, duressPin, setCancelPin, setDuressPin } = usePinStore();

  const [pinSettingsVisible, setPinSettingsVisible] = useState(false);
  const [tempCancelPin, setTempCancelPin] = useState(cancelPin);
  const [tempDuressPin, setTempDuressPin] = useState(duressPin);

  const handleOpenPinSettings = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    setTempCancelPin(cancelPin);
    setTempDuressPin(duressPin);
    setPinSettingsVisible(true);
  };

  const handleSavePins = () => {
    if (tempCancelPin.length !== 4 || tempDuressPin.length !== 4) {
      Alert.alert('Invalid PIN', 'Both PINs must be exactly 4 digits.');
      return;
    }
    if (tempCancelPin === tempDuressPin) {
      Alert.alert(
        'PIN Conflict',
        'Cancel PIN and Duress PIN cannot be identical for safety reasons.'
      );
      return;
    }

    setCancelPin(tempCancelPin);
    setDuressPin(tempDuressPin);
    setPinSettingsVisible(false);
    Alert.alert('Settings Saved', 'Your emergency PINs have been securely updated.');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out of SafeSphere?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch (_e) {}
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: 'personal',
      title: 'Personal Information',
      icon: <User size={20} color={colors.textSecondary} />,
      onPress: () => Alert.alert('Personal Info', 'Citizen Profile: Saketh / User Name'),
    },
    {
      id: 'safety',
      title: 'Safety Preferences (PIN System)',
      icon: <Shield size={20} color={colors.blue} />,
      onPress: handleOpenPinSettings,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell size={20} color={colors.textSecondary} />,
      onPress: () => Alert.alert('Notifications', 'Push alerts & SMS alerts are Active'),
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      icon: <Lock size={20} color={colors.textSecondary} />,
      onPress: () => Alert.alert('Privacy', 'AES-256-GCM encryption active for all capsules'),
    },
    {
      id: 'survival',
      title: 'Survival Mode Settings',
      icon: <Battery size={20} color={colors.green} />,
      onPress: () => router.push('/survival'),
    },
    {
      id: 'appearance',
      title: 'App Appearance',
      value: 'Dark',
      icon: <Moon size={20} color={colors.textSecondary} />,
      onPress: () => {},
    },
    {
      id: 'language',
      title: 'Language',
      value: 'English',
      icon: <Globe size={20} color={colors.textSecondary} />,
      onPress: () => {},
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: <HelpCircle size={20} color={colors.textSecondary} />,
      onPress: () => Alert.alert('Support', '24/7 Helpline: 112 / SafeSphere Dispatch'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Settings size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.profileCard}
          onPress={() => {}}
        >
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160',
            }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>User Name</Text>
            <Text style={styles.userEmail}>name@example.com</Text>
          </View>
          <ChevronRight size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Menu Items List */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => {
            const isLast = index === menuItems.length - 1;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={item.onPress}
                style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]}
              >
                <View style={styles.menuLeft}>
                  <View style={styles.menuIconWrapper}>{item.icon}</View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>

                <View style={styles.menuRight}>
                  {item.value && (
                    <Text style={styles.menuValue}>{item.value}</Text>
                  )}
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <LogOut size={18} color={colors.redText} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PIN Configuration Modal */}
      <Modal
        visible={pinSettingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPinSettingsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <KeyRound size={22} color={colors.blue} style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>PIN System Setup</Text>
            </View>

            <Text style={styles.modalDescription}>
              Configure your false-alarm Cancel PIN and silent Duress PIN.
            </Text>

            {/* Cancel PIN Config */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cancel PIN (Disarms Alarm)</Text>
              <TextInput
                value={tempCancelPin}
                onChangeText={setTempCancelPin}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                placeholder="1234"
                placeholderTextColor={colors.textMuted}
                style={styles.pinInput}
              />
              <Text style={styles.inputHint}>
                Entered when an SOS trigger is accidental.
              </Text>
            </View>

            {/* Duress PIN Config */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duress PIN (Silent Alarm)</Text>
              <TextInput
                value={tempDuressPin}
                onChangeText={setTempDuressPin}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                placeholder="9999"
                placeholderTextColor={colors.textMuted}
                style={styles.pinInput}
              />
              <Text style={styles.inputHint}>
                Looks like cancellation to bystanders, but secretly flags you are under duress.
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setPinSettingsVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSavePins} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save PINs</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    borderWidth: 2,
    borderColor: colors.green,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  menuContainer: {
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconWrapper: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    color: colors.textSecondary,
    fontSize: 13,
    marginRight: 6,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderColor: colors.redCardBorder,
    borderWidth: 1,
    borderRadius: 14,
    height: 50,
  },
  logoutText: {
    color: colors.redText,
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: colors.backgroundModal,
    borderRadius: 22,
    padding: 22,
    borderColor: colors.border,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  modalDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 18,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  pinInput: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    borderColor: colors.border,
    borderWidth: 1,
  },
  inputHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: colors.blue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
