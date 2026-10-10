import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { spacing, motion, borders } from '../theme/tokens';
import { VolunteerIncidentView } from '../services/contract.types';
import { Card } from './Card';
import { Text } from './Text';
import { Button } from './Button';
import { StatePill } from './StatePill';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { copy } from '../copy';

export interface IncidentCardProps {
  incident: VolunteerIncidentView;
  onAccept: (capsuleId: string) => Promise<void>;
  onDecline: (capsuleId: string) => Promise<void>;
  onMarkArrived: (capsuleId: string) => Promise<void>;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onAccept,
  onDecline,
  onMarkArrived,
}) => {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const relativeTime = useRelativeTime(incident.location.updated_at);

  // Card entrance animation: 350ms fade + 12px upward translate
  const cardOpacity = useSharedValue(reduceMotion ? 1 : 0);
  const cardTranslateY = useSharedValue(reduceMotion ? 0 : 12);

  // Button swap crossfade: 250ms
  const actionOpacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      cardOpacity.value = 1;
      cardTranslateY.value = 0;
    } else {
      cardOpacity.value = withTiming(1, {
        duration: motion.entrance,
        easing: Easing.bezier(0.2, 0, 0, 1),
      });
      cardTranslateY.value = withTiming(0, {
        duration: motion.entrance,
        easing: Easing.bezier(0.2, 0, 0, 1),
      });
    }
  }, [reduceMotion]);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ translateY: cardTranslateY.value }],
    };
  });

  const actionAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: actionOpacity.value,
    };
  });

  const handleAcceptPress = async () => {
    try {
      setIsSubmitting(true);
      if (!reduceMotion) {
        actionOpacity.value = withTiming(0, { duration: motion.standard / 2 }, () => {
          actionOpacity.value = withTiming(1, { duration: motion.standard / 2 });
        });
      }
      await onAccept(incident.capsule_id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclinePress = async () => {
    try {
      setIsSubmitting(true);
      if (reduceMotion) {
        await onDecline(incident.capsule_id);
      } else {
        // Decline: the card fades out over 250ms and the screen returns to H1
        cardOpacity.value = withTiming(0, { duration: motion.standard }, async () => {
          await onDecline(incident.capsule_id);
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArrivedPress = async () => {
    try {
      setIsSubmitting(true);
      if (!reduceMotion) {
        actionOpacity.value = withTiming(0, { duration: motion.standard / 2 }, () => {
          setHasArrived(true);
          actionOpacity.value = withTiming(1, { duration: motion.standard / 2 });
        });
      } else {
        setHasArrived(true);
      }
      await onMarkArrived(incident.capsule_id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAssigned = incident.fsm_state === 'VOLUNTEER_ASSIGNED';

  return (
    <Animated.View style={[styles.wrapper, cardAnimatedStyle]}>
      <Card
        accessible={true}
        accessibilityLabel={`Emergency incident for ${incident.victim_name}, status ${incident.fsm_state}`}
        style={styles.card}
      >
        {/* Row 1: StatePill (left) + capsule_id overline (right, tabular) */}
        <View style={styles.topRow}>
          <StatePill state={incident.fsm_state} />
          <Text variant="overline" style={styles.capsuleId}>
            {incident.capsule_id}
          </Text>
        </View>

        {/* Row 2 (margin-top 12): victim_name in title style (22/600) */}
        <Text variant="title" style={styles.victimName}>
          {incident.victim_name}
        </Text>

        {/* Row 3 (margin-top 4): victim_age and victim_gender in body style, textMuted */}
        <Text variant="body" color="textMuted" style={styles.victimDemographics}>
          {incident.victim_age} y/o - {incident.victim_gender}
        </Text>

        {/* Divider (margin-vertical 12, 1px borderSubtle) */}
        <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

        {/* Row 4: overline "LOCATION", margin-top 4: coordinates in small style (tabular) + relative update time in caption */}
        <View style={styles.locationSection}>
          <Text variant="overline" style={styles.locationOverline}>
            {copy.helpNearby.locationOverline}
          </Text>
          <Text variant="small" style={styles.coordinates}>
            {incident.location.latitude.toFixed(4)}, {incident.location.longitude.toFixed(4)}
          </Text>
          <Text variant="caption" color="textMuted" style={styles.relativeTime}>
            {relativeTime}
          </Text>
        </View>

        {/* Row 5: Action buttons (margin-top 16) */}
        <Animated.View style={[styles.actionsContainer, actionAnimatedStyle]}>
          {hasArrived ? (
            <Button
              title={copy.helpNearby.arrivalLogged}
              variant="outline"
              disabled={true}
              accessibilityLabel={copy.helpNearby.arrivalLogged}
              onPress={() => {}}
              style={[
                styles.arrivedButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              height={48}
            />
          ) : !isAssigned ? (
            <View style={styles.twoButtonsRow}>
              <Button
                title={copy.helpNearby.actionAccept}
                variant="accent"
                disabled={isSubmitting}
                accessibilityLabel="Accept emergency dispatch request"
                onPress={handleAcceptPress}
                style={styles.acceptButton}
                textStyle={styles.actionButtonText}
                height={48}
              />
              <Button
                title={copy.helpNearby.actionDecline}
                variant="outline"
                disabled={isSubmitting}
                accessibilityLabel="Decline responding to this incident"
                onPress={handleDeclinePress}
                style={[
                  styles.declineButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                textStyle={[styles.declineButtonText, { color: colors.textMuted }]}
                height={48}
              />
            </View>
          ) : (
            <Button
              title={copy.helpNearby.actionMarkArrived}
              variant="accent"
              disabled={isSubmitting}
              accessibilityLabel="Mark arrived at incident scene"
              onPress={handleArrivedPress}
              style={styles.fullButton}
              textStyle={styles.actionButtonText}
              height={48}
            />
          )}
        </Animated.View>
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing[16],
    width: '100%',
  },
  card: {
    padding: spacing[16],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capsuleId: {
    fontVariant: ['tabular-nums'],
  },
  victimName: {
    marginTop: spacing[12],
  },
  victimDemographics: {
    marginTop: spacing[4],
  },
  divider: {
    height: borders.thin,
    marginVertical: spacing[12],
  },
  locationSection: {},
  locationOverline: {
    marginBottom: 4,
  },
  coordinates: {
    marginBottom: 4,
  },
  relativeTime: {
    marginTop: 2,
  },
  actionsContainer: {
    marginTop: spacing[16],
  },
  twoButtonsRow: {
    flexDirection: 'row',
    gap: spacing[12],
  },
  acceptButton: {
    flex: 1,
    height: 48,
  },
  declineButton: {
    width: 88,
    height: 48,
    borderWidth: borders.thin,
  },
  fullButton: {
    width: '100%',
    height: 48,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  arrivedButton: {
    width: '100%',
    height: 48,
    borderWidth: borders.thin,
  },
});
