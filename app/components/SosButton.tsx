import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import colors from '../theme/colors';

export interface SosButtonProps {
  onTrigger: () => void;
  onHoldStart?: () => void;
  onHoldCancel?: () => void;
  onPressDirect?: () => void;
  holdDurationMs?: number;
  size?: number;
  style?: ViewStyle;
}

export const SosButton: React.FC<SosButtonProps> = ({
  onTrigger,
  onHoldStart,
  onHoldCancel,
  onPressDirect,
  holdDurationMs = 3000,
  size = 180,
  style,
}) => {
  const [isPressing, setIsPressing] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hapticIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Breathing pulse animation when idle
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      pulse.stop();
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
    };
  }, []);

  const handlePressIn = () => {
    setIsPressing(true);
    if (onHoldStart) onHoldStart();

    // Initial haptic
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_e) {}

    // Button scale down on press
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
    }).start();

    // Regular haptic ticks every 600ms while holding
    hapticIntervalRef.current = setInterval(() => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_e) {}
    }, 600);

    // Trigger after holdDurationMs
    holdTimerRef.current = setTimeout(() => {
      if (hapticIntervalRef.current) clearInterval(hapticIntervalRef.current);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (_e) {}
      setIsPressing(false);
      onTrigger();
    }, holdDurationMs);
  };

  const handlePressOut = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }

    if (isPressing) {
      setIsPressing(false);
      if (onHoldCancel) onHoldCancel();
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (_e) {}
    }

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={[styles.wrapper, style]}>
      {/* Outer Breathing Halo */}
      <Animated.View
        style={[
          styles.outerHalo,
          {
            width: size + 60,
            height: size + 60,
            borderRadius: (size + 60) / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Second Glow Layer */}
      <View
        style={[
          styles.middleHalo,
          {
            width: size + 24,
            height: size + 24,
            borderRadius: (size + 24) / 2,
            backgroundColor: isPressing ? colors.redGlow : colors.redGlowSubtle,
          },
        ]}
      />

      {/* Main Touch Area */}
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPressDirect}
          style={[
            styles.circleButton,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
        >
          <View style={styles.content}>
            <Text style={styles.holdText}>HOLD</Text>
            <Text style={styles.sosText}>SOS</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  outerHalo: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
  },
  middleHalo: {
    position: 'absolute',
    borderColor: colors.redGlow,
    borderWidth: 2,
  },
  circleButton: {
    backgroundColor: colors.red,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 2,
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default SosButton;
