import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { touchTargets, motion, spacing, borders } from '../theme/tokens';
import { Text } from './Text';
import { useReduceMotion } from '../hooks/useReduceMotion';

export type AppMode = 'Need Help' | 'Help Nearby';

export interface SegmentedToggleProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  disabled?: boolean;
}

const MODES: AppMode[] = ['Need Help', 'Help Nearby'];

export const SegmentedToggle: React.FC<SegmentedToggleProps> = ({
  currentMode,
  onSelectMode,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const [containerWidth, setContainerWidth] = React.useState(0);
  const activeIndex = Math.max(0, MODES.indexOf(currentMode));

  const segmentWidth = containerWidth > 0 ? containerWidth / MODES.length : 0;
  const indicatorTranslateX = useSharedValue(0);

  useEffect(() => {
    if (segmentWidth > 0) {
      const targetX = activeIndex * segmentWidth;
      if (reduceMotion) {
        indicatorTranslateX.value = targetX;
      } else {
        indicatorTranslateX.value = withTiming(targetX, {
          duration: motion.standard, // 250ms
          easing: Easing.bezier(0.2, 0, 0, 1),
        });
      }
    }
  }, [activeIndex, segmentWidth, reduceMotion]);

  const onLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
      indicatorTranslateX.value = activeIndex * (width / MODES.length);
    }
  };

  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: segmentWidth,
      transform: [{ translateX: indicatorTranslateX.value }],
    };
  });

  return (
    <View
      style={[
        styles.container,
        { borderBottomColor: colors.borderSubtle },
        disabled && styles.disabledContainer,
      ]}
      onLayout={onLayout}
      accessibilityRole="tablist"
    >
      <View style={styles.segmentsRow}>
        {MODES.map((mode, index) => {
          const isActive = index === activeIndex;
          return (
            <Pressable
              key={mode}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive, disabled }}
              accessibilityLabel={`${mode} mode tab`}
              disabled={disabled}
              onPress={() => onSelectMode(mode)}
              style={styles.tab}
            >
              <Text
                variant="label"
                color={isActive ? 'text' : 'textMuted'}
                style={[
                  styles.tabText,
                  isActive && styles.activeTabText,
                ]}
              >
                {mode}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 250ms Animated sliding underline indicator on bottom line */}
      {segmentWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: colors.accent },
            indicatorAnimatedStyle,
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 44,
    marginTop: spacing[16],
    borderBottomWidth: borders.thin,
  },
  disabledContainer: {
    opacity: 0.4,
  },
  segmentsRow: {
    flexDirection: 'row',
    height: 44,
  },
  tab: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
  },
});
