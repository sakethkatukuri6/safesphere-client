import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { borders, motion } from '../theme/tokens';
import { Text } from './Text';
import { useReduceMotion } from '../hooks/useReduceMotion';

export interface SosButtonProps {
  onPress: () => void;
  disabled?: boolean;
  showBreathingRing?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SosButton: React.FC<SosButtonProps> = ({
  onPress,
  disabled = false,
  showBreathingRing = true,
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();

  // Press feedback: scale down to 0.96 in 100ms
  const buttonScale = useSharedValue(1);

  // Breathing outline ring: scale 1 to 1.08, opacity 0.35 to 0.9, 3.2s loop
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.35);

  useEffect(() => {
    if (reduceMotion || !showBreathingRing) {
      ringScale.value = 1;
      ringOpacity.value = 0.6;
      return;
    }

    // 3.2s total loop duration = 1.6s expand + 1.6s contract
    const halfPeriod = motion.breatheLoop / 2;

    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.08, {
          duration: halfPeriod,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1.0, {
          duration: halfPeriod,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );

    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, {
          duration: halfPeriod,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.35, {
          duration: halfPeriod,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(ringScale);
      cancelAnimation(ringOpacity);
    };
  }, [reduceMotion, showBreathingRing]);

  const handlePressIn = () => {
    if (disabled) return;
    if (!reduceMotion) {
      buttonScale.value = withTiming(0.96, { duration: motion.pressFeedback });
    }
  };

  const handlePressOut = () => {
    if (disabled) return;
    if (!reduceMotion) {
      buttonScale.value = withTiming(1, { duration: motion.pressFeedback });
    }
  };

  const ringAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: ringScale.value }],
      opacity: ringOpacity.value,
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* 236px Breathing Outline Ring */}
      {showBreathingRing && (
        <Animated.View
          style={[
            styles.outerRing,
            { borderColor: colors.danger },
            ringAnimatedStyle,
          ]}
        />
      )}

      {/* 172px Danger Circle Button */}
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel="Emergency SOS button. Tap to start distress alert"
        accessibilityHint="Initiates emergency confirmation countdown"
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.innerCircle,
          { backgroundColor: colors.danger },
          buttonAnimatedStyle,
        ]}
      >
        <Text variant="sos" color="sosLabel">
          SOS
        </Text>
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 236,
    height: 236,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 236,
    height: 236,
    borderRadius: 118,
    borderWidth: borders.sosRing,
  },
  innerCircle: {
    width: 172,
    height: 172,
    borderRadius: 86,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
