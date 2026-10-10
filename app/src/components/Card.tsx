import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, AccessibilityRole } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radii, spacing, borders } from '../theme/tokens';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  accessible = true,
  accessibilityLabel,
  accessibilityRole,
}) => {
  const { colors } = useTheme();

  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: borders.thin,
    padding: spacing[16],
  },
});
