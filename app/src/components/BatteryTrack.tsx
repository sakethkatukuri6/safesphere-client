import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { motion } from '../theme/tokens';
import { useReduceMotion } from '../hooks/useReduceMotion';

export interface BatteryTrackProps {
  batteryLevel: number;
  lowLevel?: number;
  criticalLevel?: number;
  style?: StyleProp<ViewStyle>;
}

export const BatteryTrack: React.FC<BatteryTrackProps> = ({
  batteryLevel,
  lowLevel = 50,
  criticalLevel = 15,
  style,
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const clamped = Math.min(100, Math.max(0, batteryLevel));
  const fillWidth = useSharedValue(clamped);

  useEffect(() => {
    if (reduceMotion) {
      fillWidth.value = clamped;
    } else {
      fillWidth.value = withTiming(clamped, {
        duration: motion.entrance, // 350ms
        easing: Easing.bezier(0.2, 0, 0, 1),
      });
    }
  }, [clamped, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${fillWidth.value}%`,
    };
  });

  const getFillColor = (): string => {
    if (clamped <= criticalLevel) return colors.danger;
    if (clamped <= lowLevel) return colors.warning;
    return colors.accent;
  };

  return (
    <View style={[styles.track, { backgroundColor: colors.border }, style]}>
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: getFillColor() },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
});
