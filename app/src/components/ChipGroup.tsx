import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Chip } from './Chip';
import { space } from '../theme/tokens';

export interface ChipOption<T> {
  label: string;
  value: T;
}

export interface ChipGroupProps<T> {
  options: ChipOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ChipGroup<T>({
  options,
  selectedValue,
  onSelect,
  disabled = false,
  style,
}: ChipGroupProps<T>) {
  return (
    <View style={[styles.container, style]}>
      {options.map((opt) => (
        <Chip
          key={String(opt.value)}
          label={opt.label}
          selected={opt.value === selectedValue}
          onPress={() => onSelect(opt.value)}
          disabled={disabled}
          style={styles.chip}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[2],
  },
  chip: {
    flexGrow: 1,
  },
});
