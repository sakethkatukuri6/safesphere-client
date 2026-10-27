import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, User, AlertTriangle, VolumeX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import colors from '../theme/colors';
import { CountdownRing } from '../components/CountdownRing';
import { PrimaryButton } from '../components/PrimaryButton';
import { useEmergencyStore } from '../store/emergencyStore';

export default function HoldToConfirmScreen() {
  const router = useRouter();
  const { triggerEmergency } = useEmergencyStore();

  const [isHolding, setIsHolding] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(3);
  const [progress, setProgress] = useState(0);

  const holdStartRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastSecondRef = useRef<number>(3);

  const handlePressIn = () => {
    setIsHolding(true);
    holdStartRef.current = Date.now();
    lastSecondRef.current = 3;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_e) {}

    const updateTick = () => {
      const elapsed = Date.now() - holdStartRef.current;
      const totalDuration = 3000;
      const currentProgress = Math.min(1, elapsed / totalDuration);
      const remaining = Math.max(1, Math.ceil((totalDuration - elapsed) / 1000));

      setProgress(currentProgress);
      setSecondsRemaining(remaining);

      if (remaining !== lastSecondRef.current) {
        lastSecondRef.current = remaining;
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (_e) {}
      }

      if (elapsed >= totalDuration) {
        // Complete 3-second hold!
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_e) {}
        setIsHolding(false);
        triggerEmergency('MANUAL_SOS').then(() => {
          router.replace('/active-emergency');
        });
      } else {
        animationFrameRef.current = requestAnimationFrame(updateTick);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateTick);
  };

  const handlePressOut = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (isHolding) {
      setIsHolding(false);
      setProgress(0);
      setSecondsRemaining(3);
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_e) {}
    }
  };

  const handleCantSpeak = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (_e) {}
    await triggerEmergency('MANUAL_SOS');
    router.replace('/active-emergency');
  };

  const handleCancel = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_e) {}
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.iconButton}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <User size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.warningIconWrapper}>
            <AlertTriangle size={28} color={colors.red} />
          </View>
          <Text style={styles.title}>Trigger Emergency</Text>
          <Text style={styles.subtitle}>Release to cancel</Text>
        </View>

        {/* Hold Area with Countdown Ring */}
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.ringWrapper}
        >
          <CountdownRing
            progress={progress}
            secondsRemaining={secondsRemaining}
            size={230}
            strokeWidth={12}
          />
        </Pressable>

        {/* Silent Emergency Card */}
        <View style={styles.silentCard}>
          <View style={styles.silentHeader}>
            <VolumeX size={18} color={colors.redText} style={{ marginRight: 6 }} />
            <Text style={styles.silentTitle}>Silent Emergency?</Text>
          </View>
          <Text style={styles.silentSubtitle}>
            Send alert without audible notification
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCantSpeak}
            style={styles.cantSpeakButton}
          >
            <Text style={styles.cantSpeakText}>I CAN'T SPEAK</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        <View style={styles.bottomSection}>
          <PrimaryButton
            title="Cancel"
            variant="outline"
            onPress={handleCancel}
          />
        </View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginTop: 8,
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
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  silentCard: {
    backgroundColor: colors.backgroundCard,
    borderColor: colors.redCardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  silentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  silentTitle: {
    color: colors.redText,
    fontSize: 15,
    fontWeight: '700',
  },
  silentSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 14,
    textAlign: 'center',
  },
  cantSpeakButton: {
    backgroundColor: colors.red,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  cantSpeakText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomSection: {
    marginTop: 8,
  },
});
