import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { spacing, layout, motion } from '../theme/tokens';
import { useReduceMotion } from '../hooks/useReduceMotion';

export interface ScreenProps {
  children: React.ReactNode;
  isPitchBlack?: boolean;
  style?: StyleProp<ViewStyle>;
  disablePadding?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  isPitchBlack: propIsPitchBlack,
  style,
  disablePadding = false,
}) => {
  const { colors, isDark, isPitchBlack: contextIsPitchBlack } = useTheme();
  const isPitchBlack = propIsPitchBlack ?? contextIsPitchBlack;
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  // Screen entrance transition: 250ms fade + 12px upward translate
  const entranceOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const entranceTranslateY = useSharedValue(reduceMotion ? 0 : 12);

  // 400ms fade for pitch black transition
  const pitchBlackProgress = useSharedValue(isPitchBlack ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      entranceOpacity.value = 1;
      entranceTranslateY.value = 0;
    } else {
      entranceOpacity.value = withTiming(1, {
        duration: motion.standard,
        easing: Easing.bezier(0.2, 0, 0, 1),
      });
      entranceTranslateY.value = withTiming(0, {
        duration: motion.standard,
        easing: Easing.bezier(0.2, 0, 0, 1),
      });
    }
  }, [reduceMotion]);

  useEffect(() => {
    pitchBlackProgress.value = withTiming(isPitchBlack ? 1 : 0, {
      duration: motion.pitchBlack,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isPitchBlack]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      pitchBlackProgress.value,
      [0, 1],
      [colors.bg, colors.pitchBlack]
    );

    return {
      backgroundColor,
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: entranceOpacity.value,
      transform: [{ translateY: entranceTranslateY.value }],
    };
  });

  const dynamicPadding = {
    paddingTop: insets.top + 12,
    paddingBottom: Math.max(insets.bottom, 16) + 8,
    paddingHorizontal: disablePadding ? 0 : spacing.screenHorizontal,
  };

  return (
    <Animated.View style={[styles.outerContainer, animatedContainerStyle]}>
      {/* Status bar: light content on dark and Pitch Black, dark content on light */}
      <StatusBar style={isDark || isPitchBlack ? 'light' : 'dark'} />
      <View style={[styles.centerConstraint, dynamicPadding, style]}>
        <Animated.View style={[styles.content, animatedContentStyle]}>
          {children}
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  centerConstraint: {
    flex: 1,
    width: '100%',
    maxWidth: layout.maxWidth,
    alignSelf: 'center',
  },
  content: {
    flex: 1,
  },
});
