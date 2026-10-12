import React from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { Text } from './Text';
import { radius, touch, space } from '../theme/tokens';

export interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected,
  onPress,
  disabled = false,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const handlePress = () => {
    if (disabled) return;
    Haptics.selectionAsync().catch(() => {});
    onPress();
  };

  // Subtle filled background when selected
  // Accent with low opacity (12% in dark, 10% in light)
  const selectedBg = isDark ? 'rgba(76, 194, 181, 0.12)' : 'rgba(23, 107, 98, 0.10)';
  const unselectedBg = colors.surface;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? selectedBg : unselectedBg,
          borderColor: selected ? colors.accent : colors.border,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Text
        variant="small"
        style={{
          color: selected ? colors.accent : colors.textMuted,
          fontWeight: selected ? '600' : '500',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    minHeight: touch.min,
    minWidth: touch.min,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderRadius: radius.control,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
