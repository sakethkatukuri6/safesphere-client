import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { Text } from './Text';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { copy } from '../copy';

export interface CountdownRingProps {
  durationSeconds?: number;
  remainingSeconds: number;
  size?: number;
  strokeWidth?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CountdownRing: React.FC<CountdownRingProps> = ({
  durationSeconds = 10,
  remainingSeconds,
  size = 236,
  strokeWidth = 6,
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const progress = useSharedValue(0);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    const elapsed = durationSeconds - remainingSeconds;
    const targetProgress = Math.min(Math.max(elapsed / durationSeconds, 0), 1);
    progress.value = withTiming(targetProgress, {
      duration: 1000,
      easing: Easing.linear,
    });

    // Final second: ring pulses scale 1 to 1.03 and back in 500ms (no new color)
    if (remainingSeconds === 1 && !reduceMotion) {
      ringScale.value = withSequence(
        withTiming(1.03, { duration: 250, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 250, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, [remainingSeconds, durationSeconds, reduceMotion]);

  const animatedProps = useAnimatedProps(() => {
    'worklet';
    return {
      strokeDashoffset: circumference * (1 - progress.value),
    };
  });

  const animatedScaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: ringScale.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size },
        animatedScaleStyle,
      ]}
      accessible={true}
      accessibilityRole="timer"
      accessibilityLabel={`Sending emergency signal in ${remainingSeconds} seconds`}
      accessibilityLiveRegion="assertive"
    >
      <Svg width={size} height={size}>
        {/* Background track: stroke 6, color.border */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc: stroke 6, color.danger, round linecap, sweeps clockwise over 10s */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.danger}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      <View style={styles.numberContainer}>
        <Text variant="display" color="text">
          {Math.max(0, remainingSeconds)}
        </Text>
        <Text variant="caption" color="textMuted">
          {copy.needHelp.confirmingSeconds}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  numberContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
