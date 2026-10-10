import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, spacing, borders } from '../../theme/tokens';
import { Text, SurvivalCard } from '../../components';
import { copy } from '../../copy';
import { useNeedHelpStore } from '../../store/needHelpStore';

export const NeedHelpSent: React.FC = () => {
  const capsuleId = useNeedHelpStore((state) => state.capsuleId);

  return (
    <View style={styles.container}>
      {/* Spacer above confirmation stack */}
      <View style={styles.spacer} />

      {/* Centered confirmation stack */}
      <View style={styles.confirmationStack}>
        {/* 56px circle, 1.5px color.accent border, transparent fill, 28px Check icon */}
        <View style={styles.iconCircle}>
          <Check size={28} color={colors.accent} strokeWidth={1.75} />
        </View>

        {/* Margin-top 16: "Alert sent" (title style, color.text) */}
        <Text variant="title" color="text" style={styles.title}>
          {copy.needHelp.sentTitle}
        </Text>

        {/* Margin-top 8: overline "REFERENCE" */}
        <Text variant="overline" color="textMuted" style={styles.overline}>
          {copy.needHelp.referenceOverline}
        </Text>

        {/* Margin-top 4: capsule_id rendered in label style, tabular numerals, text color */}
        <Text variant="label" color="text" style={styles.capsuleId}>
          {capsuleId || 'CAP-8921'}
        </Text>

        {/* Margin-top 16: body style, textMuted, max 2 lines */}
        <Text
          variant="body"
          color="textMuted"
          numberOfLines={2}
          style={styles.bodyDescription}
        >
          {copy.needHelp.sentBody}
        </Text>
      </View>

      {/* Spacer between confirmation stack and SurvivalCard */}
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
  confirmationStack: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: borders.sosRing, // 1.5
    borderColor: colors.accent,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: spacing[16],
    textAlign: 'center',
  },
  overline: {
    marginTop: spacing[8],
    textAlign: 'center',
  },
  capsuleId: {
    marginTop: spacing[4],
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  bodyDescription: {
    marginTop: spacing[16],
    textAlign: 'center',
    paddingHorizontal: spacing[16],
  },
  survivalCard: {
    marginTop: spacing[16],
    marginBottom: spacing[8],
  },
});
