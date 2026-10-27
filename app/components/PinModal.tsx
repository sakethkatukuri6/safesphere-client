import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Delete, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '../theme/colors';
import { useEmergencyStore } from '../store/emergencyStore';
import { usePinStore } from '../store/pinStore';

export interface PinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (isDuress: boolean) => void;
  initialMode?: 'cancel' | 'responder';
}

export const PinModal: React.FC<PinModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialMode = 'cancel',
}) => {
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'cancel' | 'responder'>(initialMode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { cancelWithPin, resolveWithOtp } = useEmergencyStore();
  const { cancelPin, duressPin, responderOtp } = usePinStore();

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 4) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMessage(null);

    if (newPin.length === 4) {
      validatePin(newPin);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_e) {}
      setPin(pin.slice(0, -1));
      setErrorMessage(null);
    }
  };

  const validatePin = async (inputPin: string) => {
    if (mode === 'cancel') {
      const result = await cancelWithPin(inputPin, cancelPin, duressPin);
      if (result.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_e) {}
        setSuccessMessage(
          result.isDuress
            ? 'Alert Cancelled' // Deceptive message for user safety
            : 'False Alarm Disarmed'
        );
        setTimeout(() => {
          setPin('');
          setSuccessMessage(null);
          onSuccess(result.isDuress);
          onClose();
        }, 1200);
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (_e) {}
        setErrorMessage('Incorrect PIN. Try again.');
        setTimeout(() => setPin(''), 600);
      }
    } else {
      const result = await resolveWithOtp(inputPin, responderOtp);
      if (result.success) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_e) {}
        setSuccessMessage('Incident Resolved by Responder');
        setTimeout(() => {
          setPin('');
          setSuccessMessage(null);
          onSuccess(false);
          onClose();
        }, 1200);
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (_e) {}
        setErrorMessage('Invalid Responder OTP. Try again.');
        setTimeout(() => setPin(''), 600);
      }
    }
  };

  const handleReset = () => {
    setPin('');
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleReset}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Header Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tab, mode === 'cancel' && styles.activeTab]}
              onPress={() => {
                setMode('cancel');
                setPin('');
                setErrorMessage(null);
              }}
            >
              <ShieldAlert
                size={16}
                color={mode === 'cancel' ? colors.redText : colors.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabText,
                  mode === 'cancel' && { color: colors.redText },
                ]}
              >
                Cancel PIN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, mode === 'responder' && styles.activeTab]}
              onPress={() => {
                setMode('responder');
                setPin('');
                setErrorMessage(null);
              }}
            >
              <KeyRound
                size={16}
                color={mode === 'responder' ? colors.blue : colors.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabText,
                  mode === 'responder' && { color: colors.blue },
                ]}
              >
                Responder OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Title & Instructions */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === 'cancel' ? 'Enter 4-Digit PIN' : 'Responder One-Time PIN'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'cancel'
                ? 'Enter your cancel PIN to stop false alarm, or duress PIN under coercion.'
                : 'Authorized responders enter OTP (8924) to resolve incident on scene.'}
            </Text>
          </View>

          {/* PIN Dots Display */}
          <View style={styles.dotsContainer}>
            {[0, 1, 2, 3].map((index) => {
              const filled = pin.length > index;
              return (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    filled && styles.dotFilled,
                    errorMessage ? styles.dotError : null,
                  ]}
                />
              );
            })}
          </View>

          {/* Feedback message */}
          {errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}
          {successMessage && (
            <View style={styles.successRow}>
              <CheckCircle2 size={16} color={colors.green} style={{ marginRight: 6 }} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Keypad */}
          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['cancel', '0', 'backspace'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((item) => {
                  if (item === 'cancel') {
                    return (
                      <TouchableOpacity
                        key={item}
                        onPress={handleReset}
                        style={styles.actionKey}
                      >
                        <Text style={styles.cancelKeyText}>Close</Text>
                      </TouchableOpacity>
                    );
                  }
                  if (item === 'backspace') {
                    return (
                      <TouchableOpacity
                        key={item}
                        onPress={handleDelete}
                        style={styles.actionKey}
                      >
                        <Delete size={24} color={colors.textSecondary} />
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => handleDigitPress(item)}
                      style={styles.numberKey}
                    >
                      <Text style={styles.numberKeyText}>{item}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Quick Help Tip */}
          <Text style={styles.hint}>
            Default: Cancel PIN: 1234 • Duress PIN: 9999 • Responder OTP: 8924
          </Text>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 12, 0.92)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.backgroundModal,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderColor: colors.border,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    alignItems: 'center',
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    width: '100%',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.backgroundCard,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.borderHighlight,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  dotError: {
    borderColor: colors.red,
    backgroundColor: colors.red,
  },
  errorText: {
    color: colors.redText,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  successText: {
    color: colors.green,
    fontSize: 14,
    fontWeight: '600',
  },
  keypad: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  numberKey: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.backgroundCard,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberKeyText: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '600',
  },
  actionKey: {
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelKeyText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});

export default PinModal;
