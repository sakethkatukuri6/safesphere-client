// CONTRACT-GAP: G8 - The contract's SosTriggerEvent has no recipients field. State which entities the citizen intends to notify is stored locally and used for post-trigger dispatch if/when the backend adds recipient routing.
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { space, radius, touch } from '../../theme/tokens';
import { Text, SosButton, SurvivalCard, Chip } from '../../components';
import { copy } from '../../copy';
import { useNeedHelpStore } from '../../store/needHelpStore';
import { useSurvivalStore } from '../../store/survivalStore';
import { sensorService } from '../../services/sensorService';
import { loadContacts } from '../../services/contactsService';
import {
  notifyChipsService,
  NotifyChipsState,
} from '../../services/notifyChipsService';

export interface NeedHelpIdleProps {
  onNavigateToCircle?: () => void;
}

export const NeedHelpIdle: React.FC<NeedHelpIdleProps> = ({ onNavigateToCircle }) => {
  const startManualSos = useNeedHelpStore((state) => state.startManualSos);
  const triggerImmediateSos = useNeedHelpStore((state) => state.triggerImmediateSos);
  const initializeSurvivalEngine = useSurvivalStore((state) => state.initializeSurvivalEngine);

  const [chipsState, setChipsState] = useState<NotifyChipsState>({
    emergencyContacts: true,
    volunteers: true,
    emergency112: true,
  });

  useEffect(() => {
    // Initialize Survival Engine M3
    initializeSurvivalEngine();

    // Load persisted chips state
    notifyChipsService.getNotifyChips().then(setChipsState);

    // Start hardware sensor listeners for CRASH_DETECTED
    sensorService.startListening((trigger) => {
      triggerImmediateSos(trigger);
    });

    return () => {
      sensorService.stopListening();
    };
  }, [initializeSurvivalEngine, triggerImmediateSos]);

  const handleToggleEmergencyContacts = async () => {
    const contacts = await loadContacts();
    if (contacts.length === 0) {
      Alert.alert(
        'No emergency contacts',
        'Add at least one contact in Circle to enable notifications for loved ones.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Circle',
            onPress: () => {
              onNavigateToCircle?.();
            },
          },
        ]
      );
      return;
    }

    const updated = {
      ...chipsState,
      emergencyContacts: !chipsState.emergencyContacts,
    };
    setChipsState(updated);
    notifyChipsService.saveNotifyChips(updated);
  };

  const handleToggleVolunteers = () => {
    const updated = {
      ...chipsState,
      volunteers: !chipsState.volunteers,
    };
    setChipsState(updated);
    notifyChipsService.saveNotifyChips(updated);
  };

  const handleToggle112 = () => {
    const updated = {
      ...chipsState,
      emergency112: !chipsState.emergency112,
    };
    setChipsState(updated);
    notifyChipsService.saveNotifyChips(updated);
  };

  return (
    <View style={styles.container}>
      {/* Body copy: centered, textMuted */}
      <Text
        variant="body"
        color="textMuted"
        numberOfLines={3}
        style={styles.bodyCopy}
      >
        {copy.needHelp.idleBody}
      </Text>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* SosButton: centered breathing circle */}
      <View style={styles.sosContainer}>
        <SosButton onPress={startManualSos} />
      </View>

      {/* Notify Chips Row: Emergency contacts | Volunteers | 112 */}
      <View style={styles.chipsRow}>
        <Chip
          label="Emergency contacts"
          selected={chipsState.emergencyContacts}
          onPress={handleToggleEmergencyContacts}
          style={styles.chip}
        />
        <Chip
          label="Volunteers"
          selected={chipsState.volunteers}
          onPress={handleToggleVolunteers}
          style={styles.chip}
        />
        <Chip
          label="112"
          selected={chipsState.emergency112}
          onPress={handleToggle112}
          style={styles.chip}
        />
      </View>

      {/* Spacer */}
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
  bodyCopy: {
    marginTop: space[6],
    textAlign: 'center',
    paddingHorizontal: space[4],
  },
  spacer: {
    flex: 1,
  },
  sosContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space[2],
    marginTop: space[4],
    paddingHorizontal: space[2],
  },
  chip: {
    flexGrow: 0,
  },
  survivalCard: {
    marginTop: space[3],
    marginBottom: space[2],
  },
});
