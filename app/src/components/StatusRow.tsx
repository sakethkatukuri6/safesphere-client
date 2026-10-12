import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { borders, ColorToken } from '../theme/tokens';
import { Text } from './Text';

export interface StatusRowProps {
  label: string;
  value: string;
  valueColor?: ColorToken;
  hasBorderBottom?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const StatusRow: React.FC<StatusRowProps> = ({
  label,
  value,
  valueColor = 'text',
  hasBorderBottom = false,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      accessible={true}
      accessibilityLabel={`${label}: ${value}`}
      style={[
        styles.row,
        hasBorderBottom && {
          borderBottomWidth: borders.thin,
          borderBottomColor: colors.borderSubtle,
        },
        style,
      ]}
    >
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <Text variant="small" color={valueColor}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    height: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
