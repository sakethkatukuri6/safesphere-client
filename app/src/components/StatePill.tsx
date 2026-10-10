import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radii, borders } from '../theme/tokens';
import { Text } from './Text';
import { FsmState } from '../services/contract.types';

export interface StatePillProps {
  state?: FsmState;
  label?: string;
  isGranted?: boolean;
}

export const StatePill: React.FC<StatePillProps> = ({
  state,
  label,
  isGranted,
}) => {
  const { colors } = useTheme();

  // If label is passed (e.g. for permissions in ProfileScreen: "Granted" or "Not granted")
  if (label) {
    const granted = isGranted !== false && label.toLowerCase().includes('grant');
    const borderColor = granted ? colors.accent : colors.danger;
    const colorToken = granted ? 'accent' : 'danger';

    return (
      <View
        style={[styles.pill, { borderColor }]}
        accessible={true}
        accessibilityRole="text"
        accessibilityLabel={`Status: ${label}`}
      >
        <Text variant="caption" color={colorToken} style={styles.text}>
          {label}
        </Text>
      </View>
    );
  }

  // FsmState pill for incidents
  const currentState = state || 'REPORTED';
  const isEmergency = currentState === 'EMERGENCY';
  const colorToken = isEmergency ? 'danger' : 'accent';
  const borderColor = isEmergency ? colors.danger : colors.accent;

  return (
    <View
      style={[styles.pill, { borderColor }]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Incident state: ${currentState}`}
    >
      <Text
        variant="caption"
        color={colorToken}
        style={styles.text}
      >
        {currentState}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: radii.chip, // 12
    borderWidth: borders.thin, // 1px
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
  },
});
