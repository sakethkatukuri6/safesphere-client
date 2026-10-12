import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { motion } from '../theme/tokens';
import { MapPin as LucidePin } from 'lucide-react-native';
import { useReduceMotion } from '../hooks/useReduceMotion';

export interface MapPinProps {
  size?: number;
  variant?: 'dot' | 'icon';
}

export const MapPin: React.FC<MapPinProps> = ({
  size = 14,
  variant = 'dot',
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      scale.value = 1;
    } else {
      scale.value = withTiming(1, {
        duration: motion.standard, // 250ms
        easing: Easing.bezier(0.2, 0, 0, 1),
      });
    }
  }, [reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  if (variant === 'icon') {
    return (
      <Animated.View style={[styles.container, animatedStyle]}>
        <LucidePin
          size={size || 24}
          color={colors.danger}
          strokeWidth={1.75}
        />
      </Animated.View>
    );
  }

  // 14px danger circle with a 2px color.bg ring
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View
        style={[
          styles.outerRing,
          {
            backgroundColor: colors.bg,
            borderColor: colors.bg,
          },
        ]}
      >
        <View style={[styles.dangerDot, { backgroundColor: colors.danger }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  dangerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
});
