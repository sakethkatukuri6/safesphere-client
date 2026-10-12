import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, LayoutChangeEvent, PanResponder, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { Text } from './Text';
import { space, radius, touch } from '../theme/tokens';

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  disabled?: boolean;
  label?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step = 1,
  unit = '',
  onValueChange,
  onSlidingComplete,
  disabled = false,
  label,
}) => {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const lastHapticValue = useRef(value);

  const calculateValueFromPosition = useCallback(
    (x: number) => {
      if (trackWidth <= 0) return value;
      const clampedX = Math.max(0, Math.min(x, trackWidth));
      const percentage = clampedX / trackWidth;
      const rawValue = min + percentage * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(steppedValue, max));
    },
    [trackWidth, min, max, step, value]
  );

  const triggerHapticIfChanged = useCallback((newVal: number) => {
    if (newVal !== lastHapticValue.current) {
      lastHapticValue.current = newVal;
      Haptics.selectionAsync().catch(() => {});
    }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt) => {
        const newVal = calculateValueFromPosition(evt.nativeEvent.locationX);
        triggerHapticIfChanged(newVal);
        onValueChange(newVal);
      },
      onPanResponderMove: (evt) => {
        const newVal = calculateValueFromPosition(evt.nativeEvent.locationX);
        triggerHapticIfChanged(newVal);
        onValueChange(newVal);
      },
      onPanResponderRelease: (evt) => {
        const newVal = calculateValueFromPosition(evt.nativeEvent.locationX);
        triggerHapticIfChanged(newVal);
        onValueChange(newVal);
        onSlidingComplete?.(newVal);
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const percentage = Math.max(0, Math.min(1, (value - min) / (max - min)));

  return (
    <View style={styles.container}>
      {(label || unit) && (
        <View style={styles.labelRow}>
          {label ? (
            <Text variant="label" style={{ color: colors.textMuted }}>
              {label}
            </Text>
          ) : null}
          <Text variant="small" style={{ color: colors.accent, fontWeight: '600' }}>
            {value}
            {unit}
          </Text>
        </View>
      )}

      <View
        style={[styles.touchArea, { opacity: disabled ? 0.4 : 1 }]}
        onLayout={onLayout}
        {...panResponder.panHandlers}
      >
        {/* Track background */}
        <View style={[styles.trackBackground, { backgroundColor: colors.border }]} />

        {/* Track filled accent */}
        <View
          style={[
            styles.trackFilled,
            {
              backgroundColor: colors.accent,
              width: `${percentage * 100}%`,
            },
          ]}
        />

        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              borderColor: colors.bg,
              backgroundColor: colors.accent,
              left: Math.max(0, percentage * (trackWidth || 0) - 12),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: space[2],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[2],
  },
  touchArea: {
    height: touch.min,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBackground: {
    height: 6,
    borderRadius: 3,
    width: '100%',
  },
  trackFilled: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: radius.circle,
    borderWidth: 2,
    top: (touch.min - 24) / 2,
  },
});
