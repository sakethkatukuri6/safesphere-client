import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, borders, radii } from '../../theme/tokens';
import { Text, Button, CountdownRing, Card } from '../../components';
import { copy } from '../../copy';
import { useNeedHelpStore } from '../../store/needHelpStore';

export const NeedHelpConfirming: React.FC = () => {
  const countdownSeconds = useNeedHelpStore((state) => state.countdownSeconds);
  const tickCountdown = useNeedHelpStore((state) => state.tickCountdown);
  const triggerImmediateSos = useNeedHelpStore((state) => state.triggerImmediateSos);
  const cannotSpeak = useNeedHelpStore((state) => state.cannotSpeak);
  const threatNearby = useNeedHelpStore((state) => state.threatNearby);
  const setCannotSpeak = useNeedHelpStore((state) => state.setCannotSpeak);
  const setThreatNearby = useNeedHelpStore((state) => state.setThreatNearby);

  // Optional selection state: null until user taps Yes or No
  const [cannotSpeakSelection, setCannotSpeakSelection] = useState<boolean | null>(
    cannotSpeak ? true : null
  );
  const [threatNearbySelection, setThreatNearbySelection] = useState<boolean | null>(
    threatNearby ? true : null
  );

  // Silent 10-second countdown timer. No siren sound.
  useEffect(() => {
    const timer = setInterval(() => {
      tickCountdown();
    }, 1000);

    return () => clearInterval(timer);
  }, [tickCountdown]);

  const handleSelectCannotSpeak = (val: boolean) => {
    setCannotSpeakSelection(val);
    setCannotSpeak(val);
  };

  const handleSelectThreatNearby = (val: boolean) => {
    setThreatNearbySelection(val);
    setThreatNearby(val);
  };

  return (
    <View style={styles.container}>
      {/* Spacer above ring */}
      <View style={styles.spacer} />

      {/* 236 x 236 Countdown Ring centered in the space where SOS button was */}
      <View style={styles.ringContainer}>
        <CountdownRing
          durationSeconds={10}
          remainingSeconds={countdownSeconds}
          size={236}
          strokeWidth={6}
        />
      </View>

      {/* Spacer between ring and questionnaire */}
      <View style={styles.spacer} />

      {/* QuestionnaireCard: surface, 1px border, 16 radius, padding 16 */}
      <Card
        accessible={true}
        accessibilityRole="summary"
        accessibilityLabel="Silent check-in questionnaire"
        style={styles.questionnaireCard}
      >
        <Text variant="overline" style={styles.cardOverline}>
          {copy.needHelp.silentCheckInOverline}
        </Text>

        {/* Question 1: I cannot speak right now */}
        <View style={styles.questionRow}>
          <Text variant="caption" color="text" style={styles.questionText}>
            {copy.needHelp.questionCannotSpeak}
          </Text>
          <View style={styles.choicesRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="No to cannot speak"
              accessibilityState={{ selected: cannotSpeakSelection === false }}
              onPress={() => handleSelectCannotSpeak(false)}
              style={[
                styles.choiceButton,
                cannotSpeakSelection === false && styles.choiceButtonSelected,
              ]}
            >
              <Text
                variant="label"
                color={cannotSpeakSelection === false ? 'accent' : 'textMuted'}
              >
                {copy.needHelp.choiceNo}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Yes to cannot speak"
              accessibilityState={{ selected: cannotSpeakSelection === true }}
              onPress={() => handleSelectCannotSpeak(true)}
              style={[
                styles.choiceButton,
                cannotSpeakSelection === true && styles.choiceButtonSelected,
              ]}
            >
              <Text
                variant="label"
                color={cannotSpeakSelection === true ? 'accent' : 'textMuted'}
              >
                {copy.needHelp.choiceYes}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Question 2: There is a threat near me */}
        <View style={[styles.questionRow, styles.questionRowLast]}>
          <Text variant="caption" color="text" style={styles.questionText}>
            {copy.needHelp.questionThreatNearby}
          </Text>
          <View style={styles.choicesRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="No to threat nearby"
              accessibilityState={{ selected: threatNearbySelection === false }}
              onPress={() => handleSelectThreatNearby(false)}
              style={[
                styles.choiceButton,
                threatNearbySelection === false && styles.choiceButtonSelected,
              ]}
            >
              <Text
                variant="label"
                color={threatNearbySelection === false ? 'accent' : 'textMuted'}
              >
                {copy.needHelp.choiceNo}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Yes to threat nearby"
              accessibilityState={{ selected: threatNearbySelection === true }}
              onPress={() => handleSelectThreatNearby(true)}
              style={[
                styles.choiceButton,
                threatNearbySelection === true && styles.choiceButtonSelected,
              ]}
            >
              <Text
                variant="label"
                color={threatNearbySelection === true ? 'accent' : 'textMuted'}
              >
                {copy.needHelp.choiceYes}
              </Text>
            </Pressable>
          </View>
        </View>
      </Card>

      {/* Primary action button pinned at bottom: 56px, color.danger fill, color.onAccent text */}
      <View style={styles.actionContainer}>
        <Button
          title={copy.needHelp.immediateAction}
          variant="danger"
          accessibilityLabel="I need help now. Dispatch emergency alert immediately"
          onPress={() => triggerImmediateSos('MANUAL_SOS')}
          height={56}
          style={styles.immediateButton}
        />
      </View>
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
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionnaireCard: {
    padding: spacing[16],
    marginBottom: spacing[16],
  },
  cardOverline: {
    marginBottom: spacing[12],
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[12],
  },
  questionRowLast: {
    marginBottom: 0,
  },
  questionText: {
    flex: 1,
    paddingRight: spacing[12],
  },
  choicesRow: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  choiceButton: {
    width: 64,
    height: 44,
    borderRadius: radii.control,
    borderWidth: borders.thin,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceButtonSelected: {
    borderColor: colors.accent,
  },
  actionContainer: {
    marginBottom: spacing[8],
  },
  immediateButton: {
    width: '100%',
  },
});
