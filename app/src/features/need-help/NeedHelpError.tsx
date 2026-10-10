import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { colors, spacing, borders } from '../../theme/tokens';
import { Text, SurvivalCard } from '../../components';
import { copy } from '../../copy';
import { useNeedHelpStore } from '../../store/needHelpStore';

export const NeedHelpError: React.FC = () => {
  const errorMessage = useNeedHelpStore((state) => state.errorMessage);
  const networkQuality = useNeedHelpStore((state) => state.networkQuality);

  const isOffline = networkQuality === 'OFFLINE' || errorMessage?.toLowerCase().includes('offline');

  return (
    <View style={styles.container}>
      {/* Spacer above error stack */}
      <View style={styles.spacer} />

      {/* Centered error stack: 56px circle with 1.5px warning border + AlertTriangle icon */}
      <View style={styles.errorStack}>
        <View style={styles.iconCircle}>
          <AlertTriangle size={28} color={colors.warning} strokeWidth={1.75} />
        </View>

        {/* Title style (22/600) */}
        <Text variant="title" color="text" style={styles.title}>
          {isOffline ? copy.needHelp.offlineTitle : copy.needHelp.errorTitle}
        </Text>

        {/* Body style (15/400) plain error copy, no retry control */}
        <Text
          variant="body"
          color="textMuted"
          numberOfLines={3}
          style={styles.bodyDescription}
        >
          {isOffline
            ? copy.needHelp.offlineBody
            : errorMessage || 'Transmission could not be completed.'}
        </Text>
      </View>

      {/* Spacer between error stack and SurvivalCard */}
      <View style={styles.spacer} />

      {/* SurvivalCard pinned to bottom */}
      <SurvivalCard style={styles.survivalCard} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
  },
  spacer: {
    flex: 1,
  },
  errorStack: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: borders.sosRing, // 1.5
    borderColor: colors.warning,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing[16],
    textAlign: 'center',
  },
  bodyDescription: {
    marginTop: spacing[12],
    textAlign: 'center',
    paddingHorizontal: spacing[16],
  },
  survivalCard: {
    marginTop: spacing[16],
    marginBottom: spacing[8],
  },
});
