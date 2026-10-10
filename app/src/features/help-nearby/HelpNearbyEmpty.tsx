import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Radio } from 'lucide-react-native';
import { space } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from '../../components';
import { copy } from '../../copy';

export const HelpNearbyEmpty: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel="No active emergency incidents"
    >
      {/* 48px Radio tower icon in color.textMuted */}
      <Radio size={48} color={colors.textMuted} strokeWidth={1.75} />

      {/* Title style */}
      <Text variant="title" color="text" style={styles.title}>
        {copy.helpNearby.emptyTitle}
      </Text>

      {/* Body style, textMuted, max width 260, centered */}
      <Text variant="body" color="textMuted" style={styles.body}>
        {copy.helpNearby.emptyBody}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space[8],
  },
  title: {
    marginTop: space[4],
    textAlign: 'center',
  },
  body: {
    marginTop: space[2],
    maxWidth: 260,
    textAlign: 'center',
  },
});
